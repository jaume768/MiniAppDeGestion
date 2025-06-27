import logging
import time
import json
from datetime import datetime, date
from decimal import Decimal
from typing import Dict, Any, Optional
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone
from .models import AuditLog, SecurityLog, PerformanceLog, BusinessEventLog

User = get_user_model()
logger = logging.getLogger(__name__)

class DateTimeEncoder(json.JSONEncoder):
    """
    Encoder personalizado para serializar datetime, date y Decimal objects
    """
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, date):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

def safe_json_serialize(obj):
    """
    Serializa un objeto a JSON de forma segura
    """
    try:
        return json.dumps(obj, cls=DateTimeEncoder, ensure_ascii=False)
    except (TypeError, ValueError) as e:
        # Si no se puede serializar, convertir a string
        logger.warning(f"No se pudo serializar objeto a JSON: {e}")
        return str(obj)

class AuditService:
    """
    Servicio centralizado para manejo de auditoría
    """
    
    @staticmethod
    def _serialize_values(values):
        """
        Convierte valores que no son JSON-serializables a formatos serializables
        """
        if not values:
            return {}
        
        def convert_value(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, date):
                return obj.isoformat()
            elif isinstance(obj, Decimal):
                return float(obj)
            elif isinstance(obj, dict):
                return {k: convert_value(v) for k, v in obj.items()}
            elif isinstance(obj, (list, tuple)):
                return [convert_value(item) for item in obj]
            else:
                return obj
        
        return convert_value(values)
    
    @staticmethod
    def log_model_change(instance, action: str, user=None, request=None, 
                        old_values=None, level='MEDIUM', description=None):
        """
        Registra cambios en modelos automáticamente
        """
        try:
            # Obtener empresa del objeto
            empresa = getattr(instance, 'empresa', None)
            if not empresa and user:
                empresa = getattr(user, 'empresa', None)
            
            # Obtener valores actuales
            current_values = {}
            if hasattr(instance, '__dict__'):
                for field in instance._meta.fields:
                    if not field.is_relation:
                        current_values[field.name] = getattr(instance, field.name, None)
            
            # Calcular cambios
            changes = {}
            if old_values and action == 'UPDATE':
                for key, new_val in current_values.items():
                    old_val = old_values.get(key)
                    if old_val != new_val:
                        changes[key] = {'old': old_val, 'new': new_val}
            
            # Obtener info del request
            ip_address = None
            user_agent = None
            if request:
                ip_address = AuditService._get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            AuditLog.objects.create(
                empresa=empresa,
                action=action,
                level=level,
                user=user,
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.pk,
                table_name=instance._meta.db_table,
                record_id=instance.pk,
                old_values=AuditService._serialize_values(old_values) if old_values else {},
                new_values=AuditService._serialize_values(current_values),
                changes=AuditService._serialize_values(changes),
                description=description or f"{action} {instance._meta.verbose_name}",
                module=instance._meta.app_label,
                ip_address=ip_address,
                user_agent=user_agent,
                session_key=getattr(request, 'session', {}).get('session_key') if request else None
            )
            
        except Exception as e:
            logger.error(f"Error logging audit: {e}")
    
    @staticmethod
    def log_security_event(event: str, user=None, request=None, success=True, 
                          details=None, risk_level='LOW', username_attempted=None):
        """
        Registra eventos de seguridad
        """
        try:
            empresa = getattr(user, 'empresa', None) if user else None
            ip_address = AuditService._get_client_ip(request) if request else None
            user_agent = request.META.get('HTTP_USER_AGENT', '') if request else None
            referrer = request.META.get('HTTP_REFERER') if request else None
            
            SecurityLog.objects.create(
                empresa=empresa,
                event=event,
                user=user,
                username_attempted=username_attempted,
                ip_address=ip_address,
                user_agent=user_agent,
                referrer=referrer,
                details=AuditService._serialize_values(details) if details else {},
                success=success,
                risk_level=risk_level
            )
            
        except Exception as e:
            logger.error(f"Error logging security event: {e}")
    
    @staticmethod
    def log_performance(request, response_time: float, db_queries: int = 0, 
                       db_time: float = 0.0, memory_usage: float = None):
        """
        Registra métricas de rendimiento
        """
        try:
            user = getattr(request, 'user', None) if hasattr(request, 'user') else None
            empresa = getattr(user, 'empresa', None) if user and user.is_authenticated else None
            
            # Determinar si es lento (>2s)
            is_slow = response_time > 2.0
            
            PerformanceLog.objects.create(
                empresa=empresa,
                method=request.method,
                path=request.path,
                user=user if user and user.is_authenticated else None,
                response_time=response_time,
                db_queries_count=db_queries,
                db_time=db_time,
                memory_usage=memory_usage,
                is_slow=is_slow,
                status_code=getattr(request, '_cached_response_status', 200),
                extra_data=AuditService._serialize_values({
                    'query_string': request.META.get('QUERY_STRING', ''),
                    'content_length': request.META.get('CONTENT_LENGTH', 0)
                })
            )
            
        except Exception as e:
            logger.error(f"Error logging performance: {e}")
    
    @staticmethod
    def log_business_event(event: str, description: str, user=None, 
                          data=None, amount=None, quantity=None):
        """
        Registra eventos de negocio importantes
        """
        try:
            empresa = getattr(user, 'empresa', None) if user else None
            
            BusinessEventLog.objects.create(
                empresa=empresa,
                event=event,
                user=user,
                description=description,
                data=AuditService._serialize_values(data) if data else {},
                amount=amount,
                quantity=quantity
            )
            
        except Exception as e:
            logger.error(f"Error logging business event: {e}")
    
    @staticmethod
    def _get_client_ip(request):
        """
        Obtiene la IP real del cliente
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class PerformanceMonitor:
    """
    Context manager para monitoreo de performance
    """
    
    def __init__(self, request=None, description="Unknown"):
        self.request = request
        self.description = description
        self.start_time = None
        self.start_queries = None
    
    def __enter__(self):
        self.start_time = time.time()
        # Podríamos agregar conteo de queries aquí
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        end_time = time.time()
        response_time = end_time - self.start_time
        
        if self.request:
            AuditService.log_performance(
                request=self.request,
                response_time=response_time,
                db_queries=0,  # TODO: implementar conteo real
                db_time=0.0
            )


# Decorador para auditoría automática
def audit_action(action: str, level: str = 'MEDIUM', description: str = None):
    """
    Decorador para auditar acciones específicas
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Buscar request y user en argumentos
            request = None
            user = None
            
            for arg in args:
                if hasattr(arg, 'META') and hasattr(arg, 'method'):
                    request = arg
                    user = getattr(request, 'user', None)
                    break
            
            try:
                result = func(*args, **kwargs)
                
                # Log exitoso
                AuditService.log_business_event(
                    event='BUSINESS_ACTION',
                    description=description or f"Ejecutado: {func.__name__}",
                    user=user,
                    data=AuditService._serialize_values({
                        'function': func.__name__,
                        'action': action,
                        'success': True
                    })
                )
                
                return result
                
            except Exception as e:
                # Log error
                AuditService.log_business_event(
                    event='BUSINESS_ACTION',
                    description=f"Error en {func.__name__}: {str(e)}",
                    user=user,
                    data=AuditService._serialize_values({
                        'function': func.__name__,
                        'action': action,
                        'success': False,
                        'error': str(e)
                    })
                )
                raise
        
        return wrapper
    return decorator
