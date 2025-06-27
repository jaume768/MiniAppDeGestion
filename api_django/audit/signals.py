from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.contrib.auth import get_user_model
from threading import local
from .services import AuditService
from .models import AuditLog
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

# Thread local storage para request context
_thread_local = local()

def set_current_request(request):
    """Establece el request actual en thread local"""
    _thread_local.request = request

def get_current_request():
    """Obtiene el request actual de thread local"""
    return getattr(_thread_local, 'request', None)

def set_current_user(user):
    """Establece el usuario actual en thread local"""
    _thread_local.user = user

def get_current_user():
    """Obtiene el usuario actual de thread local"""
    return getattr(_thread_local, 'user', None)

# Diccionario para almacenar valores anteriores
_old_values = {}

@receiver(pre_save)
def capture_old_values(sender, instance, **kwargs):
    """
    Captura valores anteriores antes de guardar
    """
    # Skip audit models to avoid recursion
    if sender in [AuditLog]:
        return
    
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            old_values = {}
            
            for field in old_instance._meta.fields:
                if not field.is_relation:
                    old_values[field.name] = getattr(old_instance, field.name, None)
            
            _old_values[f"{sender.__name__}_{instance.pk}"] = old_values
            
        except sender.DoesNotExist:
            pass

@receiver(post_save)
def audit_model_save(sender, instance, created, **kwargs):
    """
    Audita automáticamente saves en modelos críticos
    """
    # Skip audit models to avoid recursion
    if sender in [AuditLog]:
        return
    
    # Solo auditar modelos críticos
    CRITICAL_MODELS = [
        'Ticket', 'Albaran', 'Factura', 'Presupuesto', 'Pedido',
        'ArticuloStock', 'MovimientoStock', 'Cliente', 'Articulo',
        'CajaSession', 'MovimientoCaja', 'User'
    ]
    
    if sender.__name__ not in CRITICAL_MODELS:
        return
    
    try:
        action = 'CREATE' if created else 'UPDATE'
        level = 'HIGH' if sender.__name__ in ['Ticket', 'Factura', 'MovimientoStock'] else 'MEDIUM'
        
        # Obtener valores anteriores
        old_values = None
        if not created:
            key = f"{sender.__name__}_{instance.pk}"
            old_values = _old_values.pop(key, None)
        
        # Obtener contexto actual
        request = get_current_request()
        user = get_current_user()
        
        # Si no hay usuario en thread local, intentar obtenerlo del request
        if not user and request and hasattr(request, 'user'):
            user = request.user if request.user.is_authenticated else None
        
        AuditService.log_model_change(
            instance=instance,
            action=action,
            user=user,
            request=request,
            old_values=old_values,
            level=level
        )
        
    except Exception as e:
        logger.error(f"Error in audit_model_save: {e}")

@receiver(post_delete)
def audit_model_delete(sender, instance, **kwargs):
    """
    Audita eliminaciones de modelos
    """
    # Skip audit models
    if sender in [AuditLog]:
        return
    
    CRITICAL_MODELS = [
        'Ticket', 'Albaran', 'Factura', 'Presupuesto', 'Pedido',
        'ArticuloStock', 'MovimientoStock', 'Cliente', 'Articulo'
    ]
    
    if sender.__name__ not in CRITICAL_MODELS:
        return
    
    try:
        request = get_current_request()
        user = get_current_user()
        
        if not user and request and hasattr(request, 'user'):
            user = request.user if request.user.is_authenticated else None
        
        AuditService.log_model_change(
            instance=instance,
            action='DELETE',
            user=user,
            request=request,
            level='HIGH'
        )
        
    except Exception as e:
        logger.error(f"Error in audit_model_delete: {e}")

# Signals de autenticación
@receiver(user_logged_in)
def audit_user_login(sender, request, user, **kwargs):
    """
    Audita logins exitosos
    """
    AuditService.log_security_event(
        event='LOGIN_SUCCESS',
        user=user,
        request=request,
        success=True,
        details={
            'login_time': user.last_login.isoformat() if user.last_login else None
        },
        risk_level='LOW'
    )

@receiver(user_logged_out)
def audit_user_logout(sender, request, user, **kwargs):
    """
    Audita logouts
    """
    AuditService.log_security_event(
        event='LOGOUT',
        user=user,
        request=request,
        success=True,
        risk_level='LOW'
    )

@receiver(user_login_failed)
def audit_login_failed(sender, credentials, request, **kwargs):
    """
    Audita intentos fallidos de login
    """
    username = credentials.get('username', 'Unknown')
    
    AuditService.log_security_event(
        event='LOGIN_FAILED',
        request=request,
        success=False,
        username_attempted=username,
        details={
            'credentials_keys': list(credentials.keys()),
            'username_attempted': username
        },
        risk_level='MEDIUM'
    )
