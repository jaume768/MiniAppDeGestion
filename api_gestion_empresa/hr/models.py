from django.db import models

# Create your models here.

class Departamento(models.Model):
    """Modelo de Departamento"""
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_departamento'  # Mantener tabla original
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Empleado(models.Model):
    """Modelo de Empleado"""
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True, blank=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_empleado'  # Mantener tabla original
        ordering = ['apellidos', 'nombre']

    def __str__(self):
        return f"{self.nombre} {self.apellidos}"
