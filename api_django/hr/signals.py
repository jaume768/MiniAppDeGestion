from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import CustomUser
from .models import Empleado


@receiver(post_save, sender=CustomUser)
def create_employee_profile(sender, instance, created, **kwargs):
    """
    Signal para crear automáticamente un perfil de empleado
    cuando se crea un CustomUser con role='employee'
    """
    if created and instance.role == 'employee' and instance.empresa:
        # Solo crear empleado si no existe ya uno
        if not hasattr(instance, 'perfil_empleado'):
            # Establecer el contexto del tenant para TenantModelMixin
            from tenants.middleware import set_current_tenant
            set_current_tenant(instance.empresa)
            
            try:
                empleado = Empleado(
                    usuario=instance,
                    puesto=instance.cargo or '',  # Usar cargo del usuario como puesto inicial
                    activo=instance.is_active
                )
                # Asignar empresa manualmente (TenantModelMixin lo necesita)
                empleado.empresa = instance.empresa
                empleado.save()
                print(f"✓ Empleado creado automáticamente: {instance.get_full_name()}")
            except Exception as e:
                # Log del error pero no fallar la creación del usuario
                print(f"⚠️  No se pudo crear empleado para {instance.username}: {e}")


@receiver(post_save, sender=CustomUser)
def save_employee_profile(sender, instance, **kwargs):
    """
    Signal para mantener sincronizado el estado activo del empleado
    con el estado is_active del usuario
    """
    if instance.role == 'employee' and hasattr(instance, 'perfil_empleado'):
        try:
            empleado = instance.perfil_empleado
            if empleado.activo != instance.is_active:
                # Establecer contexto del tenant si es necesario
                if instance.empresa:
                    from tenants.middleware import set_current_tenant
                    set_current_tenant(instance.empresa)
                
                empleado.activo = instance.is_active
                empleado.save()
        except Exception as e:
            print(f"⚠️  No se pudo sincronizar empleado para {instance.username}: {e}")
