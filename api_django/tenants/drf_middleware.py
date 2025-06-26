"""
Middleware específico para Django REST Framework y autenticación JWT.
Maneja correctamente el contexto de tenant para operaciones API.
"""

from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.request import Request
import threading


class DRFTenantMiddleware(MiddlewareMixin):
    """
    Middleware específico para DRF que maneja el contexto de tenant
    después de la autenticación JWT.
    """
    
    def process_request(self, request):
        """
        Establece el contexto del tenant para requests DRF
        después de la autenticación JWT
        """
        # Inicializar valores por defecto
        request.tenant = None
        request.empresa_id = None
        
        # Solo procesar requests API
        if not request.path.startswith('/api/'):
            return None
            
        # Almacenar request en thread local
        threading.current_thread().request = request
        
        # Intentar autenticar con JWT si no hay usuario autenticado
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            jwt_auth = JWTAuthentication()
            try:
                # Convertir HttpRequest a DRF Request si es necesario
                if not isinstance(request, Request):
                    drf_request = Request(request)
                    user_auth_tuple = jwt_auth.authenticate(drf_request)
                else:
                    user_auth_tuple = jwt_auth.authenticate(request)
                
                if user_auth_tuple:
                    request.user, request.auth = user_auth_tuple
            except Exception:
                # Si falla la autenticación JWT, continuar sin autenticación
                pass
        
        # Establecer contexto de tenant si el usuario está autenticado
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Los superadmins no tienen empresa asignada
            if hasattr(request.user, 'role') and request.user.role == 'superadmin':
                request.tenant = None
                request.empresa_id = None
            elif hasattr(request.user, 'empresa') and request.user.empresa:
                request.tenant = request.user.empresa
                request.empresa_id = request.user.empresa.id
                
                # Actualizar último acceso
                try:
                    request.user.ultimo_acceso = timezone.now()
                    request.user.save(update_fields=['ultimo_acceso'])
                except Exception:
                    # Ignorar errores de guardado para evitar problemas en operaciones concurrentes
                    pass
        
        return None
    
    def process_response(self, request, response):
        """Limpiar el contexto del tenant después de la respuesta"""
        # Limpiar thread local
        if hasattr(threading.current_thread(), 'request'):
            delattr(threading.current_thread(), 'request')
            
        # Limpiar atributos del request
        if hasattr(request, 'tenant'):
            delattr(request, 'tenant')
        if hasattr(request, 'empresa_id'):
            delattr(request, 'empresa_id')
        
        return response


def get_current_request_drf():
    """
    Utility function para obtener el request actual en contexto DRF
    """
    return getattr(threading.current_thread(), 'request', None)


def get_current_empresa_id_drf():
    """
    Utility function para obtener el ID de la empresa actual en contexto DRF
    """
    request = get_current_request_drf()
    if request and hasattr(request, 'empresa_id'):
        return request.empresa_id
    return None


def get_current_user_drf():
    """
    Utility function para obtener el usuario actual en contexto DRF
    """
    request = get_current_request_drf()
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        return request.user
    return None


def is_superadmin_drf():
    """
    Utility function para verificar si el usuario actual es superadmin en contexto DRF
    """
    user = get_current_user_drf()
    if user:
        return getattr(user, 'role', None) == 'superadmin'
    return False
