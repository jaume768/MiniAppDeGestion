from django.utils.deprecation import MiddlewareMixin
from django.db import connection
from django.utils import timezone


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware para gestionar el contexto de la empresa (tenant) actual.
    Automáticamente filtra todas las consultas por la empresa del usuario autenticado.
    """
    
    def process_request(self, request):
        """Establece el contexto del tenant basándose en el usuario autenticado"""
        # Inicializar tenant como None
        request.tenant = None
        request.empresa_id = None
        
        # Si el usuario está autenticado y tiene empresa
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Los superadmins no tienen empresa asignada (pueden ver todo)
            if request.user.role == 'superadmin':
                request.tenant = None
                request.empresa_id = None
            elif hasattr(request.user, 'empresa') and request.user.empresa:
                request.tenant = request.user.empresa
                request.empresa_id = request.user.empresa.id
                
                # Actualizar último acceso
                request.user.ultimo_acceso = timezone.now()
                request.user.save(update_fields=['ultimo_acceso'])
        
        return None
    
    def process_response(self, request, response):
        """Limpiar el contexto del tenant después de la respuesta"""
        if hasattr(request, 'tenant'):
            delattr(request, 'tenant')
        if hasattr(request, 'empresa_id'):
            delattr(request, 'empresa_id')
        
        return response


class TenantQuerySetMixin:
    """
    Mixin para QuerySets que automáticamente filtra por empresa.
    Debe ser usado en los managers de los modelos que tienen campo empresa.
    """
    
    def get_queryset(self):
        # Obtener el request actual desde el contexto local de thread
        request = getattr(self._get_request(), 'request', None)
        queryset = super().get_queryset()
        
        if request and hasattr(request, 'empresa_id') and request.empresa_id:
            # Filtrar por empresa solo si no es superadmin
            queryset = queryset.filter(empresa_id=request.empresa_id)
        
        return queryset
    
    def _get_request(self):
        """Obtiene el request actual desde el contexto local de thread"""
        # Esto requiere un middleware adicional para almacenar el request
        # Por ahora retornamos un objeto dummy
        import threading
        local = getattr(threading.current_thread(), 'request', None)
        return local


class ThreadLocalMiddleware(MiddlewareMixin):
    """
    Middleware para almacenar el request en el contexto local del thread.
    Esto permite acceder al request desde cualquier parte del código.
    """
    
    def process_request(self, request):
        import threading
        threading.current_thread().request = request
        return None
    
    def process_response(self, request, response):
        import threading
        if hasattr(threading.current_thread(), 'request'):
            delattr(threading.current_thread(), 'request')
        return response


def get_current_request():
    """Utility function para obtener el request actual"""
    import threading
    return getattr(threading.current_thread(), 'request', None)


def get_current_empresa():
    """Utility function para obtener la empresa actual"""
    request = get_current_request()
    if request and hasattr(request, 'tenant'):
        return request.tenant
    return None


def get_current_empresa_id():
    """Utility function para obtener el ID de la empresa actual"""
    request = get_current_request()
    if request and hasattr(request, 'empresa_id'):
        return request.empresa_id
    return None


def is_superadmin():
    """Utility function para verificar si el usuario actual es superadmin"""
    request = get_current_request()
    if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
        return False
    
    return getattr(request.user, 'role', None) == 'superadmin'


def set_current_tenant(empresa):
    """
    Establece manualmente el tenant actual para operaciones que requieren contexto específico.
    Usado principalmente en scripts de inicialización.
    """
    request = get_current_request()
    if request:
        request.tenant = empresa
        request.empresa_id = empresa.id if empresa else None
