from django.db import models
from decimal import Decimal
from tenants.models import TenantModelMixin


class Cliente(TenantModelMixin, models.Model):
    """Modelo Cliente - común a varias apps"""
    # Datos básicos
    nombre = models.CharField(max_length=200, verbose_name="Nombre")
    nombre_comercial = models.CharField(max_length=200, verbose_name="Nombre comercial", blank=True, null=True)
    es_empresa = models.BooleanField(default=True, verbose_name="Es empresa")
    
    # Contacto
    email = models.EmailField(verbose_name="Email", blank=True, null=True)
    telefono = models.CharField(max_length=20, verbose_name="Teléfono", blank=True, null=True)
    movil = models.CharField(max_length=20, verbose_name="Móvil", blank=True, null=True)
    website = models.URLField(verbose_name="Website", blank=True, null=True)
    
    # Dirección
    direccion = models.CharField(max_length=300, verbose_name="Dirección", blank=True, null=True)
    poblacion = models.CharField(max_length=100, verbose_name="Población", blank=True, null=True)
    codigo_postal = models.CharField(max_length=10, verbose_name="Código postal", blank=True, null=True)
    provincia = models.CharField(max_length=100, verbose_name="Provincia", blank=True, null=True)
    pais = models.CharField(max_length=100, verbose_name="País", default="España")
    
    # Datos fiscales
    cif = models.CharField(max_length=20, verbose_name="CIF/NIF", blank=True, null=True)
    identificacion_vat = models.CharField(max_length=20, verbose_name="Identificación VAT", blank=True, null=True)
    
    # Metadatos
    tags = models.CharField(max_length=500, verbose_name="Tags", blank=True, null=True, help_text="Separar por comas")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        unique_together = ['empresa', 'email']
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

    def __str__(self):
        return self.nombre


class Proveedor(TenantModelMixin, models.Model):
    """Modelo para proveedores de la empresa"""
    # Datos básicos
    nombre = models.CharField(max_length=200, verbose_name="Nombre")
    nombre_comercial = models.CharField(max_length=200, verbose_name="Nombre comercial", blank=True, null=True)
    es_empresa = models.BooleanField(default=True, verbose_name="Es empresa")
    
    # Contacto
    email = models.EmailField(verbose_name="Email", blank=True, null=True)
    telefono = models.CharField(max_length=20, verbose_name="Teléfono", blank=True, null=True)
    movil = models.CharField(max_length=20, verbose_name="Móvil", blank=True, null=True)
    website = models.URLField(verbose_name="Website", blank=True, null=True)
    
    # Dirección
    direccion = models.CharField(max_length=300, verbose_name="Dirección", blank=True, null=True)
    poblacion = models.CharField(max_length=100, verbose_name="Población", blank=True, null=True)
    codigo_postal = models.CharField(max_length=10, verbose_name="Código postal", blank=True, null=True)
    provincia = models.CharField(max_length=100, verbose_name="Provincia", blank=True, null=True)
    pais = models.CharField(max_length=100, verbose_name="País", default="España")
    
    # Datos fiscales
    cif_nif = models.CharField(max_length=20, verbose_name="CIF/NIF", blank=True, null=True)
    identificacion_vat = models.CharField(max_length=20, verbose_name="Identificación VAT", blank=True, null=True)
    
    # Metadatos
    tags = models.CharField(max_length=500, verbose_name="Tags", blank=True, null=True, help_text="Separar por comas")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['email', 'empresa'],
                condition=models.Q(email__isnull=False) & ~models.Q(email=''),
                name='unique_proveedor_email_empresa'
            )
        ]

    def __str__(self):
        return self.nombre


class AbstractBaseDocument(TenantModelMixin, models.Model):
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
