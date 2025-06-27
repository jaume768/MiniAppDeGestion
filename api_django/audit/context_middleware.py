from django.utils.deprecation import MiddlewareMixin
from .signals import set_current_request, set_current_user

class AuditContextMiddleware(MiddlewareMixin):
    """
    Middleware para establecer el contexto actual en thread-local
    para que los signals puedan acceder al request y usuario
    """
    
    def process_request(self, request):
        # Establecer request en thread local
        set_current_request(request)
        
        # Establecer usuario si está autenticado
        if hasattr(request, 'user') and request.user.is_authenticated:
            set_current_user(request.user)
        else:
            set_current_user(None)
        
        return None
    
    def process_response(self, request, response):
        # Limpiar thread local al final del request
        set_current_request(None)
        set_current_user(None)
        return response
    
    def process_exception(self, request, exception):
        # Limpiar thread local en caso de excepción
        set_current_request(None)
        set_current_user(None)
        return None
