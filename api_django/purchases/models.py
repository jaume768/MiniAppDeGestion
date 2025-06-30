from django.db import models
from django.core.exceptions import ValidationError
from django.db import transaction
from decimal import Decimal
from tenants.models import TenantModelMixin
from core.models import AbstractBaseDocument, AbstractBaseItem


# Modelos base abstractos para compras
class AbstractBasePurchaseDocument(TenantModelMixin, models.Model):
    """Modelo base abstracto para documentos de compra"""
    proveedor = models.ForeignKey('core.Proveedor', on_delete=models.CASCADE, verbose_name="Proveedor")
    fecha = models.DateField(verbose_name="Fecha")
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name="Subtotal")
    iva = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name="IVA")
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name="Total")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
    
    def calculate_totals(self):
        """Calcula totales basándose en los items relacionados"""
        items = self.get_items()
        self.subtotal = sum(item.subtotal for item in items)
        self.iva = sum(item.iva_amount for item in items)
        self.total = self.subtotal + self.iva
        self.save(update_fields=['subtotal', 'iva', 'total'])
    
    def get_items(self):
        """Método que debe ser sobrescrito por las clases hijas"""
        raise NotImplementedError("Las clases hijas deben implementar get_items()")


class AbstractBasePurchaseItem(TenantModelMixin, models.Model):
    """Modelo base abstracto para items de documentos de compra"""
    articulo = models.ForeignKey('products.Articulo', on_delete=models.CASCADE, verbose_name="Artículo")
    cantidad = models.PositiveIntegerField(verbose_name="Cantidad")
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio unitario")
    descuento_porcentaje = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0.00'), verbose_name="Descuento %"
    )
    iva_porcentaje = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('21.00'), verbose_name="IVA %"
    )
    
    class Meta:
        abstract = True
    
    @property
    def precio_con_descuento(self):
        """Calcula el precio unitario con descuento aplicado"""
        descuento = self.precio_unitario * (self.descuento_porcentaje / 100)
        return self.precio_unitario - descuento
    
    @property
    def subtotal(self):
        """Calcula el subtotal (sin IVA)"""
        return self.cantidad * self.precio_con_descuento
    
    @property
    def iva_amount(self):
        """Calcula el importe del IVA"""
        return self.subtotal * (self.iva_porcentaje / 100)
    
    @property
    def total(self):
        """Calcula el total (con IVA)"""
        return self.subtotal + self.iva_amount
    
    def __str__(self):
        return f"{self.articulo.nombre} - {self.cantidad} unidades"


# Modelos de documentos de compra
class PedidoCompra(AbstractBasePurchaseDocument):
    """Modelo de Pedido de Compra"""
    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('enviado', 'Enviado'),
        ('confirmado', 'Confirmado'),
        ('recibido_parcial', 'Recibido Parcial'),
        ('recibido_total', 'Recibido Total'),
        ('facturado', 'Facturado'),
        ('cancelado', 'Cancelado'),
    ]
    
    numero = models.CharField(max_length=20, verbose_name="Número")
    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES, default='borrador', verbose_name="Estado"
    )
    fecha_esperada = models.DateField(null=True, blank=True, verbose_name="Fecha esperada de entrega")
    almacen_destino = models.ForeignKey(
        'inventory.Almacen', on_delete=models.CASCADE, verbose_name="Almacén destino"
    )
    condiciones_pago = models.CharField(
        max_length=100, blank=True, null=True, verbose_name="Condiciones de pago"
    )
    referencia_proveedor = models.CharField(
        max_length=50, blank=True, null=True, verbose_name="Referencia del proveedor"
    )
    
    class Meta:
        ordering = ['-fecha', '-numero']
        unique_together = ['empresa', 'numero']
        verbose_name = "Pedido de Compra"
        verbose_name_plural = "Pedidos de Compra"
    
    def get_items(self):
        return self.pedidocompraitem_set.all()
    
    def puede_cancelar(self):
        """Verifica si el pedido puede ser cancelado"""
        return self.estado in ['borrador', 'enviado']
    
    def puede_confirmar(self):
        """Verifica si el pedido puede ser confirmado"""
        return self.estado == 'enviado'
    
    def __str__(self):
        return f"Pedido {self.numero} - {self.proveedor.nombre}"


class PedidoCompraItem(AbstractBasePurchaseItem):
    """Items de Pedido de Compra"""
    pedido = models.ForeignKey(PedidoCompra, on_delete=models.CASCADE, verbose_name="Pedido")
    cantidad_recibida = models.PositiveIntegerField(default=0, verbose_name="Cantidad recibida")
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones")
    
    class Meta:
        verbose_name = "Item de Pedido de Compra"
        verbose_name_plural = "Items de Pedido de Compra"
    
    @property
    def cantidad_pendiente(self):
        """Cantidad pendiente de recibir"""
        return self.cantidad - self.cantidad_recibida
    
    @property
    def esta_completo(self):
        """Indica si el item está completamente recibido"""
        return self.cantidad_recibida >= self.cantidad


class AlbaranCompra(AbstractBasePurchaseDocument):
    """Modelo de Albarán de Compra (Recepción de Mercancía)"""
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('recibido_parcial', 'Recibido Parcial'),
        ('recibido_total', 'Recibido Total'),
        ('cerrado', 'Cerrado'),
    ]
    
    numero = models.CharField(max_length=20, verbose_name="Número")
    pedido_compra = models.ForeignKey(
        PedidoCompra, on_delete=models.CASCADE, 
        related_name='albaranes', verbose_name="Pedido de compra"
    )
    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES, default='pendiente', verbose_name="Estado"
    )
    fecha_recepcion = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de recepción")
    almacen = models.ForeignKey(
        'inventory.Almacen', on_delete=models.CASCADE, verbose_name="Almacén"
    )
    recibido_por = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, 
        null=True, blank=True, verbose_name="Recibido por"
    )
    numero_albaran_proveedor = models.CharField(
        max_length=50, blank=True, null=True, verbose_name="Número albarán proveedor"
    )
    
    class Meta:
        ordering = ['-fecha', '-numero']
        unique_together = ['empresa', 'numero']
        verbose_name = "Albarán de Compra"
        verbose_name_plural = "Albaranes de Compra"
    
    def get_items(self):
        return self.albarancompraitem_set.all()
    
    def puede_recibir(self):
        """Verifica si el albarán puede recibir mercancía"""
        return self.estado in ['pendiente', 'recibido_parcial']
    
    def actualizar_estado(self):
        """Actualiza el estado basado en las cantidades recibidas"""
        items = self.get_items()
        if not items.exists():
            return
        
        total_items = items.count()
        items_completos = sum(1 for item in items if item.esta_completo)
        
        if items_completos == 0:
            self.estado = 'pendiente'
        elif items_completos == total_items:
            self.estado = 'recibido_total'
        else:
            self.estado = 'recibido_parcial'
        
        self.save(update_fields=['estado'])
    
    def __str__(self):
        return f"Albarán {self.numero} - {self.proveedor.nombre}"


class AlbaranCompraItem(AbstractBasePurchaseItem):
    """Items de Albarán de Compra"""
    albaran = models.ForeignKey(AlbaranCompra, on_delete=models.CASCADE, verbose_name="Albarán")
    pedido_item = models.ForeignKey(
        PedidoCompraItem, on_delete=models.CASCADE, 
        null=True, blank=True, verbose_name="Item del pedido"
    )
    cantidad_recibida = models.PositiveIntegerField(default=0, verbose_name="Cantidad recibida")
    lote = models.CharField(max_length=50, blank=True, null=True, verbose_name="Lote")
    fecha_caducidad = models.DateField(null=True, blank=True, verbose_name="Fecha de caducidad")
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones")
    
    class Meta:
        verbose_name = "Item de Albarán de Compra"
        verbose_name_plural = "Items de Albarán de Compra"
    
    @property
    def cantidad_pendiente(self):
        """Cantidad pendiente de recibir"""
        return self.cantidad - self.cantidad_recibida
    
    @property
    def esta_completo(self):
        """Indica si el item está completamente recibido"""
        return self.cantidad_recibida >= self.cantidad


class FacturaCompra(AbstractBasePurchaseDocument):
    """Modelo de Factura de Compra"""
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('validada', 'Validada'),
        ('pagada', 'Pagada'),
        ('cancelada', 'Cancelada'),
    ]
    
    numero = models.CharField(max_length=20, verbose_name="Número")
    numero_factura_proveedor = models.CharField(
        max_length=50, verbose_name="Número factura proveedor"
    )
    pedido_compra = models.ForeignKey(
        PedidoCompra, on_delete=models.CASCADE, 
        related_name='facturas', null=True, blank=True, verbose_name="Pedido de compra"
    )
    albaran_compra = models.ForeignKey(
        AlbaranCompra, on_delete=models.CASCADE,
        related_name='facturas', null=True, blank=True, verbose_name="Albarán de compra"
    )
    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES, default='pendiente', verbose_name="Estado"
    )
    fecha_vencimiento = models.DateField(verbose_name="Fecha de vencimiento")
    fecha_pago = models.DateField(null=True, blank=True, verbose_name="Fecha de pago")
    metodo_pago = models.CharField(
        max_length=50, blank=True, null=True, verbose_name="Método de pago"
    )
    
    class Meta:
        ordering = ['-fecha', '-numero']
        unique_together = ['empresa', 'numero']
        verbose_name = "Factura de Compra"
        verbose_name_plural = "Facturas de Compra"
    
    def get_items(self):
        return self.facturacompraitem_set.all()
    
    def puede_pagar(self):
        """Verifica si la factura puede ser pagada"""
        return self.estado == 'validada'
    
    def esta_vencida(self):
        """Verifica si la factura está vencida"""
        from django.utils import timezone
        return self.fecha_vencimiento < timezone.now().date() and self.estado != 'pagada'
    
    def __str__(self):
        return f"Factura {self.numero} - {self.proveedor.nombre}"


class FacturaCompraItem(AbstractBasePurchaseItem):
    """Items de Factura de Compra"""
    factura = models.ForeignKey(FacturaCompra, on_delete=models.CASCADE, verbose_name="Factura")
    pedido_item = models.ForeignKey(
        PedidoCompraItem, on_delete=models.CASCADE,
        null=True, blank=True, verbose_name="Item del pedido"
    )
    albaran_item = models.ForeignKey(
        AlbaranCompraItem, on_delete=models.CASCADE,
        null=True, blank=True, verbose_name="Item del albarán"
    )
    
    class Meta:
        verbose_name = "Item de Factura de Compra"
        verbose_name_plural = "Items de Factura de Compra"


class CuentaPorPagar(TenantModelMixin, models.Model):
    """Modelo para gestión de cuentas por pagar"""
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado_parcial', 'Pagado Parcial'),
        ('pagado_total', 'Pagado Total'),
        ('vencido', 'Vencido'),
    ]
    
    proveedor = models.ForeignKey('core.Proveedor', on_delete=models.CASCADE, verbose_name="Proveedor")
    factura_compra = models.OneToOneField(
        FacturaCompra, on_delete=models.CASCADE, 
        related_name='cuenta_por_pagar', verbose_name="Factura de compra"
    )
    monto_original = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Monto original")
    monto_pagado = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name="Monto pagado"
    )
    monto_pendiente = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Monto pendiente")
    fecha_vencimiento = models.DateField(verbose_name="Fecha de vencimiento")
    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES, default='pendiente', verbose_name="Estado"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Cuenta por Pagar"
        verbose_name_plural = "Cuentas por Pagar"
        ordering = ['fecha_vencimiento']
    
    def actualizar_estado(self):
        """Actualiza el estado basado en los pagos realizados"""
        if self.monto_pagado == 0:
            self.estado = 'pendiente'
        elif self.monto_pagado >= self.monto_original:
            self.estado = 'pagado_total'
        else:
            self.estado = 'pagado_parcial'
        
        # Verificar si está vencido
        from django.utils import timezone
        if (self.fecha_vencimiento < timezone.now().date() and 
            self.estado not in ['pagado_total']):
            self.estado = 'vencido'
        
        self.save(update_fields=['estado'])
    
    def __str__(self):
        return f"CxP {self.factura_compra.numero} - {self.proveedor.nombre}"
