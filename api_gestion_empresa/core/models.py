from django.db import models
from decimal import Decimal


class Cliente(models.Model):
    """Modelo Cliente - común a varias apps"""
    nombre = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    cif = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_cliente'  # Mantener tabla original para migración
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class AbstractBaseDocument(models.Model):
    """Modelo base abstracto para documentos (Presupuesto, Pedido, etc.)"""
    cliente = models.ForeignKey('core.Cliente', on_delete=models.CASCADE)
    fecha = models.DateField()
    observaciones = models.TextField(blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    iva = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        ordering = ['-fecha', '-id']
    
    def calculate_totals(self):
        """Calcula totales basándose en los items relacionados"""
        items = self.get_items()
        self.subtotal = sum(item.subtotal for item in items)
        self.iva = sum(item.iva_amount for item in items) 
        self.total = self.subtotal + self.iva
        self.save(update_fields=['subtotal', 'iva', 'total'])
    
    def get_items(self):
        """Método que debe ser sobrescrito por las clases hijas"""
        raise NotImplementedError("Las subclases deben implementar get_items()")


class AbstractBaseItem(models.Model):
    """Modelo base abstracto para items de documentos"""
    articulo = models.ForeignKey('products.Articulo', on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    iva_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('21.00'))
    
    class Meta:
        abstract = True
    
    @property
    def subtotal(self):
        """Calcula el subtotal (sin IVA)"""
        return self.cantidad * self.precio_unitario
    
    @property
    def iva_amount(self):
        """Calcula el importe del IVA"""
        return self.subtotal * (self.iva_porcentaje / 100)
    
    @property
    def total(self):
        """Calcula el total (con IVA)"""
        return self.subtotal + self.iva_amount
    
    def __str__(self):
        return f"{self.articulo.nombre} x {self.cantidad}"
