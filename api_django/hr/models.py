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
    """Modelo de Empleado"""
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=200, blank=True, null=True)
    email = models.EmailField(unique=False, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True, blank=True)
    puesto = models.CharField(max_length=100, blank=True, null=True)
    salario = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    fecha_contratacion = models.DateField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['apellidos', 'nombre']
        unique_together = ['empresa', 'email']  # Email único por empresa

    def __str__(self):
        return f"{self.nombre} {self.apellidos}"
