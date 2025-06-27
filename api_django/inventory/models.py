from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.exceptions import ValidationError
from django.db import transaction
from decimal import Decimal
from tenants.models import TenantModelMixin


class Almacen(TenantModelMixin, models.Model):
    """Modelo para gestión de almacenes por empresa"""
    
    nombre = models.CharField(max_length=100, verbose_name="Nombre del almacén")
    codigo = models.CharField(max_length=20, verbose_name="Código del almacén")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    
    # Dirección del almacén
    direccion = models.CharField(max_length=300, blank=True, null=True, verbose_name="Dirección")
    poblacion = models.CharField(max_length=100, blank=True, null=True, verbose_name="Población")
    codigo_postal = models.CharField(max_length=10, blank=True, null=True, verbose_name="Código postal")
    provincia = models.CharField(max_length=100, blank=True, null=True, verbose_name="Provincia")
    
    # Configuración
    activo = models.BooleanField(default=True, verbose_name="Activo")
    es_principal = models.BooleanField(default=False, verbose_name="Es almacén principal")
    
    # Responsable
    responsable = models.CharField(max_length=200, blank=True, null=True, verbose_name="Responsable")
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name="Teléfono")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    
    # Fechas
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        unique_together = ['empresa', 'codigo']
        verbose_name = "Almacén"
        verbose_name_plural = "Almacenes"

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
    def clean(self):
        """Validaciones del modelo"""
        # Solo puede haber un almacén principal por empresa
        if self.es_principal:
            principal_exists = Almacen.objects.filter(
                empresa=self.empresa, 
                es_principal=True
            ).exclude(pk=self.pk).exists()
            
            if principal_exists:
                raise ValidationError('Ya existe un almacén principal para esta empresa')
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def get_total_articulos(self):
        """Obtiene el total de artículos diferentes en el almacén"""
        return self.articulostock_set.filter(stock_actual__gt=0).count()
    
    def get_valor_total(self):
        """Calcula el valor total del stock en el almacén"""
        total = Decimal('0.00')
        for stock in self.articulostock_set.all():
            total += stock.stock_actual * stock.articulo.precio
        return total


class ArticuloStock(TenantModelMixin, models.Model):
    """Modelo para gestión de stock por artículo y almacén"""
    
    articulo = models.ForeignKey(
        'products.Articulo', 
        on_delete=models.CASCADE,
        verbose_name="Artículo"
    )
    almacen = models.ForeignKey(
        Almacen, 
        on_delete=models.CASCADE,
        verbose_name="Almacén"
    )
    
    # Stock
    stock_actual = models.PositiveIntegerField(default=0, verbose_name="Stock actual")
    stock_minimo = models.PositiveIntegerField(default=0, verbose_name="Stock mínimo")
    stock_maximo = models.PositiveIntegerField(default=0, verbose_name="Stock máximo")
    stock_reservado = models.PositiveIntegerField(default=0, verbose_name="Stock reservado")
    
    # Ubicación dentro del almacén
    pasillo = models.CharField(max_length=10, blank=True, null=True, verbose_name="Pasillo")
    estanteria = models.CharField(max_length=10, blank=True, null=True, verbose_name="Estantería")
    nivel = models.CharField(max_length=10, blank=True, null=True, verbose_name="Nivel")
    
    # Fechas
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['almacen__nombre', 'articulo__nombre']
        unique_together = ['empresa', 'articulo', 'almacen']
        verbose_name = "Stock de artículo"
        verbose_name_plural = "Stock de artículos"

    def __str__(self):
        return f"{self.articulo.nombre} - {self.almacen.codigo} (Stock: {self.stock_actual})"
    
    @property
    def stock_disponible(self):
        """Stock disponible (actual - reservado)"""
        return max(0, self.stock_actual - self.stock_reservado)
    
    @property
    def necesita_reposicion(self):
        """Indica si el stock está por debajo del mínimo"""
        return self.stock_actual <= self.stock_minimo
    
    @property
    def valor_stock(self):
        """Valor total del stock (cantidad * precio)"""
        return self.stock_actual * self.articulo.precio_venta
    
    def ubicacion_completa(self):
        """Devuelve la ubicación completa dentro del almacén"""
        ubicacion = []
        if self.pasillo:
            ubicacion.append(f"P{self.pasillo}")
        if self.estanteria:
            ubicacion.append(f"E{self.estanteria}")
        if self.nivel:
            ubicacion.append(f"N{self.nivel}")
        return "-".join(ubicacion) if ubicacion else "Sin ubicación"


class MovimientoStock(TenantModelMixin, models.Model):
    """Modelo para trazabilidad de movimientos de stock"""
    
    TIPO_MOVIMIENTO_CHOICES = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('transferencia_salida', 'Transferencia (Salida)'),
        ('transferencia_entrada', 'Transferencia (Entrada)'),
        ('ajuste_positivo', 'Ajuste Positivo'),
        ('ajuste_negativo', 'Ajuste Negativo'),
        ('inicial', 'Stock Inicial'),
    ]
    
    MOTIVO_CHOICES = [
        ('compra', 'Compra'),
        ('venta', 'Venta'),
        ('devolucion_cliente', 'Devolución de Cliente'),
        ('devolucion_proveedor', 'Devolución a Proveedor'),
        ('transferencia', 'Transferencia entre Almacenes'),
        ('ajuste_inventario', 'Ajuste de Inventario'),
        ('rotura', 'Rotura/Pérdida'),
        ('caducidad', 'Caducidad'),
        ('inicial', 'Stock Inicial'),
        ('otros', 'Otros'),
    ]
    
    # Relaciones básicas
    articulo = models.ForeignKey(
        'products.Articulo', 
        on_delete=models.CASCADE,
        verbose_name="Artículo"
    )
    almacen = models.ForeignKey(
        Almacen, 
        on_delete=models.CASCADE,
        verbose_name="Almacén"
    )
    
    # Datos del movimiento
    tipo = models.CharField(
        max_length=25,
        choices=TIPO_MOVIMIENTO_CHOICES,
        help_text="Tipo de movimiento"
    )
    motivo = models.CharField(
        max_length=30,
        choices=MOTIVO_CHOICES,
        verbose_name="Motivo"
    )
    cantidad = models.IntegerField(verbose_name="Cantidad")  # Positivo para entradas, negativo para salidas
    stock_anterior = models.PositiveIntegerField(verbose_name="Stock anterior")
    stock_posterior = models.PositiveIntegerField(verbose_name="Stock posterior")
    
    # Información adicional
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones")
    precio_unitario = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Precio unitario"
    )
    
    # Documento origen (factura, pedido, etc.)
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    documento_origen = GenericForeignKey('content_type', 'object_id')
    
    # Transferencia (si aplica)
    almacen_destino = models.ForeignKey(
        Almacen,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='transferencias_recibidas',
        verbose_name="Almacén destino"
    )
    
    # Usuario que realizó el movimiento
    usuario = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Usuario"
    )
    
    # Fechas
    fecha = models.DateTimeField(auto_now_add=True, verbose_name="Fecha del movimiento")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = "Movimiento de stock"
        verbose_name_plural = "Movimientos de stock"

    def __str__(self):
        signo = "+" if self.cantidad > 0 else ""
        return f"{self.articulo.nombre} - {self.almacen.codigo} ({signo}{self.cantidad}) - {self.get_tipo_display()}"
    
    @property
    def valor_movimiento(self):
        """Valor del movimiento (cantidad * precio)"""
        if self.precio_unitario:
            return abs(self.cantidad) * self.precio_unitario
        return abs(self.cantidad) * self.articulo.precio_venta
    
    def clean(self):
        """Validaciones del modelo"""
        # Para transferencias debe especificarse almacén destino
        if self.tipo in ['transferencia_salida', 'transferencia_entrada']:
            if not self.almacen_destino:
                raise ValidationError('Las transferencias requieren especificar almacén destino')
            if self.almacen == self.almacen_destino:
                raise ValidationError('El almacén origen y destino no pueden ser el mismo')
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class TransferenciaStock(TenantModelMixin, models.Model):
    """Modelo para gestionar transferencias entre almacenes"""
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_transito', 'En Tránsito'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]
    
    # Datos básicos
    numero = models.CharField(max_length=20, verbose_name="Número de transferencia")
    almacen_origen = models.ForeignKey(
        Almacen,
        on_delete=models.CASCADE,
        related_name='transferencias_origen',
        verbose_name="Almacén origen"
    )
    almacen_destino = models.ForeignKey(
        Almacen,
        on_delete=models.CASCADE,
        related_name='transferencias_destino',
        verbose_name="Almacén destino"
    )
    
    # Estado y fechas
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name="Estado"
    )
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_envio = models.DateTimeField(null=True, blank=True)
    fecha_recepcion = models.DateTimeField(null=True, blank=True)
    
    # Información adicional
    motivo = models.TextField(verbose_name="Motivo de la transferencia")
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones")
    
    # Usuarios responsables
    solicitado_por = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='transferencias_solicitadas',
        verbose_name="Solicitado por"
    )
    enviado_por = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transferencias_enviadas',
        verbose_name="Enviado por"
    )
    recibido_por = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transferencias_recibidas',
        verbose_name="Recibido por"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_solicitud']
        unique_together = ['empresa', 'numero']
        verbose_name = "Transferencia de stock"
        verbose_name_plural = "Transferencias de stock"

    def __str__(self):
        return f"Transferencia {self.numero} - {self.almacen_origen.codigo} → {self.almacen_destino.codigo}"
    
    def clean(self):
        """Validaciones del modelo"""
        if self.almacen_origen == self.almacen_destino:
            raise ValidationError('El almacén origen y destino no pueden ser el mismo')
        
        if self.almacen_origen.empresa != self.almacen_destino.empresa:
            raise ValidationError('Ambos almacenes deben pertenecer a la misma empresa')
    
    def save(self, *args, **kwargs):
        # Generar número automático si no existe
        if not self.numero:
            ultimo_numero = TransferenciaStock.objects.filter(
                empresa=self.empresa
            ).aggregate(
                max_numero=models.Max('numero')
            )['max_numero']
            
            if ultimo_numero:
                try:
                    numero = int(ultimo_numero.split('-')[-1]) + 1
                except:
                    numero = 1
            else:
                numero = 1
            
            self.numero = f"TRANS-{numero:06d}"
        
        self.full_clean()
        super().save(*args, **kwargs)
    
    def puede_enviar(self):
        """Verifica si la transferencia puede ser enviada"""
        return self.estado == 'pendiente'
    
    def puede_recibir(self):
        """Verifica si la transferencia puede ser recibida"""
        return self.estado == 'en_transito'
    
    def puede_cancelar(self):
        """Verifica si la transferencia puede ser cancelada"""
        return self.estado in ['pendiente', 'en_transito']


class TransferenciaStockItem(TenantModelMixin, models.Model):
    """Items de una transferencia de stock"""
    
    transferencia = models.ForeignKey(
        TransferenciaStock,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Transferencia"
    )
    articulo = models.ForeignKey(
        'products.Articulo',
        on_delete=models.CASCADE,
        verbose_name="Artículo"
    )
    
    cantidad_solicitada = models.PositiveIntegerField(verbose_name="Cantidad solicitada")
    cantidad_enviada = models.PositiveIntegerField(default=0, verbose_name="Cantidad enviada")
    cantidad_recibida = models.PositiveIntegerField(default=0, verbose_name="Cantidad recibida")
    
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['articulo__nombre']
        unique_together = ['empresa', 'transferencia', 'articulo']
        verbose_name = "Item de transferencia"
        verbose_name_plural = "Items de transferencia"

    def __str__(self):
        return f"{self.articulo.nombre} - {self.cantidad_solicitada} unidades"
    
    @property
    def cantidad_pendiente(self):
        """Cantidad pendiente de enviar"""
        return max(0, self.cantidad_solicitada - self.cantidad_enviada)
    
    @property
    def esta_completo(self):
        """Indica si el item está completo (enviado = recibido)"""
        return self.cantidad_enviada == self.cantidad_recibida
