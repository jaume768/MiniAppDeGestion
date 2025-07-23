from django.db import models
from tenants.models import TenantModelMixin

# Create your models here.

class Departamento(TenantModelMixin, models.Model):
    """Modelo de Departamento"""
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        unique_together = ['empresa', 'nombre']  # Nombre único por empresa

    def __str__(self):
        return self.nombre


class Empleado(TenantModelMixin, models.Model):
    """Modelo de Empleado - Perfil HR para usuarios con role='employee'"""
    
    # Relación con usuario del sistema (nullable temporalmente para migración)
    usuario = models.OneToOneField(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='perfil_empleado',
        verbose_name="Usuario",
        help_text="Usuario del sistema asociado a este empleado",
        null=True,  # Temporal para migración
        blank=True  # Temporal para migración
    )
    
    # Campos específicos de HR (no duplicados)
    departamento = models.ForeignKey(
        Departamento, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Departamento"
    )
    puesto = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Puesto de trabajo",
        help_text="Cargo específico del empleado (puede diferir del campo 'cargo' del usuario)"
    )
    salario = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        blank=True, 
        null=True,
        verbose_name="Salario mensual"
    )
    fecha_contratacion = models.DateField(
        blank=True, 
        null=True,
        verbose_name="Fecha de contratación"
    )
    
    # Campos específicos de HR
    numero_empleado = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name="Número de empleado"
    )
    activo = models.BooleanField(
        default=True,
        verbose_name="Empleado activo"
    )
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['usuario__last_name', 'usuario__first_name']
        verbose_name = "Empleado"
        verbose_name_plural = "Empleados"

    def __str__(self):
        return f"{self.usuario.get_full_name()} ({self.puesto or 'Sin puesto'})"
    
    # Properties para acceder fácilmente a datos del usuario
    @property
    def nombre(self):
        """Alias para compatibilidad hacia atrás"""
        return self.usuario.first_name
    
    @property
    def apellidos(self):
        """Alias para compatibilidad hacia atrás"""
        return self.usuario.last_name
    
    @property
    def email(self):
        """Alias para compatibilidad hacia atrás"""
        return self.usuario.email
    
    @property
    def telefono(self):
        """Alias para compatibilidad hacia atrás"""
        return self.usuario.telefono
    
    @property
    def nombre_completo(self):
        """Nombre completo del empleado"""
        return self.usuario.get_full_name()
