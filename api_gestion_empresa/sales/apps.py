from django.apps import AppConfig


class SalesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sales'
    verbose_name = 'Gestión de Ventas'
    
    def ready(self):
        # Importar señales cuando la app esté lista
        import sales.models
