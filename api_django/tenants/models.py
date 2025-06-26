from django.db import models
from django.db.models import QuerySet
from .middleware import get_current_empresa_id, is_superadmin
from .drf_middleware import get_current_empresa_id_drf, is_superadmin_drf


class TenantQuerySet(QuerySet):
    """QuerySet personalizado que filtra automáticamente por empresa"""
    
    def filter_by_tenant(self):
        """Filtra por la empresa actual del contexto"""
        if is_superadmin() or is_superadmin_drf():
            # Los superadmins pueden ver todo
            return self
            
        empresa_id = get_current_empresa_id() or get_current_empresa_id_drf()
        if empresa_id:
            return self.filter(empresa_id=empresa_id)
        return self.none()  # Sin empresa, no mostrar nada


class TenantManager(models.Manager):
    """Manager personalizado para modelos con soporte multi-tenant"""
    
    def get_queryset(self):
        """Retorna QuerySet filtrado por tenant automáticamente"""
        return TenantQuerySet(self.model, using=self._db).filter_by_tenant()
    
    def all_tenants(self):
        """Retorna todos los objetos sin filtrar (solo para superadmins)"""
        if is_superadmin() or is_superadmin_drf():
            return TenantQuerySet(self.model, using=self._db)
        return self.get_queryset()


class TenantModelMixin(models.Model):
    """
    Mixin para modelos que pertenecen a una empresa específica.
    Automáticamente agrega el campo empresa y el manager personalizado.
    """
    
    empresa = models.ForeignKey(
        'accounts.Empresa',
        on_delete=models.CASCADE,
        verbose_name="Empresa",
        help_text="Empresa a la que pertenece este registro"
    )
    
    # Manager personalizado
    objects = TenantManager()
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['empresa']),  # Índice para mejorar performance
        ]
    
    def save(self, *args, **kwargs):
        """Override save para asignar automáticamente la empresa actual"""
        if not self.empresa_id and (not is_superadmin() and not is_superadmin_drf()):
            empresa_id = get_current_empresa_id() or get_current_empresa_id_drf()
            if empresa_id:
                self.empresa_id = empresa_id
            else:
                raise ValueError(
                    "No se puede guardar el objeto sin una empresa asignada. "
                    "Asegúrese de que el usuario esté autenticado y tenga una empresa."
                )
        super().save(*args, **kwargs)


class GlobalModelMixin(models.Model):
    """
    Mixin para modelos que no están restringidos por empresa.
    Útil para modelos de configuración global o catálogos compartidos.
    """
    
    class Meta:
        abstract = True
    
    # Usar el manager estándar
    objects = models.Manager()
