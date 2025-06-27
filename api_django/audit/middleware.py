import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.db import connection
from .services import AuditService

logger = logging.getLogger(__name__)

class AuditMiddleware(MiddlewareMixin):
    """
    Middleware para capturar automáticamente eventos de auditoría
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        # Marcar inicio de request
        request._audit_start_time = time.time()
        request._audit_start_queries = len(connection.queries)
        return None
    
    def process_response(self, request, response):
        # Calcular métricas
        end_time = time.time()
        start_time = getattr(request, '_audit_start_time', end_time)
        response_time = end_time - start_time
        
        # Contar queries
        start_queries = getattr(request, '_audit_start_queries', 0)
        db_queries = len(connection.queries) - start_queries
        
        # Calcular tiempo de DB
        db_time = sum(float(query['time']) for query in connection.queries[start_queries:])
        
        # Log solo si es lento o hay muchas queries
        if response_time > 1.0 or db_queries > 10:
            AuditService.log_performance(
                request=request,
                response_time=response_time,
                db_queries=db_queries,
                db_time=db_time
            )
        
        return response
    
    def process_exception(self, request, exception):
        # Log errores
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            AuditService.log_business_event(
                event='BUSINESS_ACTION',
                description=f"Error en {request.path}: {str(exception)}",
                user=user,
                data={
                    'method': request.method,
                    'path': request.path,
                    'error': str(exception),
                    'error_type': type(exception).__name__
                }
            )
        
        return None


class SecurityMiddleware(MiddlewareMixin):
    """
    Middleware para eventos de seguridad
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        # Detectar actividad sospechosa
        ip = self._get_client_ip(request)
        
        # Guardar IP para tracking
        request._audit_ip = ip
        
        return None
    
    def process_response(self, request, response):
        # Log accesos denegados
        if response.status_code == 403:
            user = getattr(request, 'user', None)
            AuditService.log_security_event(
                event='PERMISSION_DENIED',
                user=user if user and user.is_authenticated else None,
                request=request,
                success=False,
                details={
                    'path': request.path,
                    'method': request.method
                },
                risk_level='MEDIUM'
            )
        
        # Log errores de autenticación
        elif response.status_code == 401:
            AuditService.log_security_event(
                event='TOKEN_INVALID',
                request=request,
                success=False,
                details={
                    'path': request.path,
                    'method': request.method
                },
                risk_level='HIGH'
            )
        
        return response
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
