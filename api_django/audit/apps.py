from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit'
    verbose_name = 'Sistema de Auditoría'
    
    def ready(self):
        # Importar signals para registrarlos
        import audit.signals
