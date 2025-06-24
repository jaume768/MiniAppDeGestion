from django.db import models
from tenants.models import TenantModelMixin

# Create your models here.

class Categoria(TenantModelMixin, models.Model):
    """Modelo de Categoría de productos"""
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        unique_together = ['empresa', 'nombre']  # Nombre único por empresa

    def __str__(self):
        return self.nombre


class Marca(TenantModelMixin, models.Model):
    """Modelo de Marca de productos"""
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    pais_origen = models.CharField(max_length=100, blank=True, null=True)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        unique_together = ['empresa', 'nombre']  # Nombre único por empresa

    def __str__(self):
        return self.nombre


class Articulo(TenantModelMixin, models.Model):
    """Modelo de Artículo/Producto"""
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    marca = models.ForeignKey(Marca, on_delete=models.SET_NULL, null=True, blank=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    iva = models.DecimalField(max_digits=5, decimal_places=2, default=21.00)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        unique_together = ['empresa', 'nombre']  # Nombre único por empresa

    def __str__(self):
        return self.nombre
