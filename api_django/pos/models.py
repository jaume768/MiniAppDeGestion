from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from tenants.models import TenantModelMixin


class CajaSession(TenantModelMixin):
    """Sesión de caja para TPV - controla apertura y cierre de caja"""
    
    ESTADO_CHOICES = [
        ('abierta', 'Abierta'),
        ('cerrada', 'Cerrada'),
        ('suspendida', 'Suspendida'),
    ]
    
    usuario = models.ForeignKey(
        'accounts.CustomUser', 
        on_delete=models.CASCADE,
        verbose_name="Usuario responsable"
    )
    nombre = models.CharField(
        max_length=100, 
        verbose_name="Nombre de la caja",
        help_text="Ej: Caja Principal, Caja 1, etc."
    )
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_CHOICES, 
        default='abierta',
        verbose_name="Estado"
    )
    
    # Fechas y horarios
    fecha_apertura = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de apertura"
    )
    fecha_cierre = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name="Fecha de cierre"
    )
    
    # Saldos
    saldo_inicial = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Saldo inicial",
        help_text="Dinero en efectivo al abrir la caja"
    )
    saldo_final = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Saldo final"
    )
    
    # Notas
    notas_apertura = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Notas de apertura"
    )
    notas_cierre = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Notas de cierre"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_apertura']
        verbose_name = "Sesión de Caja"
        verbose_name_plural = "Sesiones de Caja"

    def __str__(self):
        return f"{self.nombre} - {self.fecha_apertura.strftime('%d/%m/%Y %H:%M')}"
    
    @property
    def es_activa(self):
        """Verifica si la sesión está actualmente abierta"""
        return self.estado == 'abierta'
    
    def cerrar_caja(self, saldo_final, notas_cierre=None):
        """Cierra la sesión de caja"""
        self.estado = 'cerrada'
        self.fecha_cierre = timezone.now()
        self.saldo_final = saldo_final
        if notas_cierre:
            self.notas_cierre = notas_cierre
        self.save()
    
    def calcular_ventas_total(self):
        """Calcula el total de ventas de la sesión"""
        return self.movimientos.filter(
            tipo='venta'
        ).aggregate(total=models.Sum('importe'))['total'] or Decimal(0)
    
    def calcular_efectivo_esperado(self):
        """Calcula el efectivo que debería haber en caja"""
        ventas_efectivo = self.movimientos.filter(
            tipo='venta',
            metodo_pago='efectivo'
        ).aggregate(total=models.Sum('importe'))['total'] or Decimal(0)
        
        devoluciones_efectivo = self.movimientos.filter(
            tipo='devolucion',
            metodo_pago='efectivo'
        ).aggregate(total=models.Sum('importe'))['total'] or Decimal(0)
        
        return self.saldo_inicial + ventas_efectivo - devoluciones_efectivo


class MovimientoCaja(TenantModelMixin):
    """Movimientos de dinero en la caja (ventas, devoluciones, etc.)"""
    
    TIPO_CHOICES = [
        ('venta', 'Venta'),
        ('devolucion', 'Devolución'),
        ('entrada', 'Entrada de dinero'),
        ('salida', 'Salida de dinero'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('tarjeta', 'Tarjeta'),
        ('transferencia', 'Transferencia'),
        ('mixto', 'Pago mixto'),
    ]
    
    caja_session = models.ForeignKey(
        CajaSession,
        on_delete=models.CASCADE,
        related_name='movimientos',
        verbose_name="Sesión de caja"
    )
    
    tipo = models.CharField(
        max_length=20, 
        choices=TIPO_CHOICES,
        verbose_name="Tipo de movimiento"
    )
    
    # Relación con ticket (opcional)
    ticket = models.ForeignKey(
        'sales.Ticket',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Ticket asociado"
    )
    
    # Datos del movimiento
    importe = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name="Importe"
    )
    metodo_pago = models.CharField(
        max_length=20, 
        choices=METODO_PAGO_CHOICES,
        verbose_name="Método de pago"
    )
    
    # Para pagos mixtos
    importe_efectivo = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Importe en efectivo"
    )
    importe_tarjeta = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Importe con tarjeta"
    )
    
    # Información adicional
    concepto = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Concepto",
        help_text="Descripción del movimiento"
    )
    referencia = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Referencia",
        help_text="Número de autorización, referencia bancaria, etc."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Movimiento de Caja"
        verbose_name_plural = "Movimientos de Caja"

    def __str__(self):
        return f"{self.get_tipo_display()} - €{self.importe} ({self.created_at.strftime('%d/%m/%Y %H:%M')})"
    
    def clean(self):
        """Validaciones del modelo"""
        from django.core.exceptions import ValidationError
        
        # Si es pago mixto, debe tener ambos importes
        if self.metodo_pago == 'mixto':
            if not self.importe_efectivo or not self.importe_tarjeta:
                raise ValidationError(
                    "Para pagos mixtos debe especificar importe en efectivo y tarjeta"
                )
            if (self.importe_efectivo + self.importe_tarjeta) != self.importe:
                raise ValidationError(
                    "La suma de efectivo y tarjeta debe igual al importe total"
                )


class CuadreCaja(TenantModelMixin):
    """Registro de cuadre de caja para control de diferencias"""
    
    caja_session = models.OneToOneField(
        CajaSession,
        on_delete=models.CASCADE,
        related_name='cuadre',
        verbose_name="Sesión de caja"
    )
    
    # Conteo físico
    efectivo_contado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Efectivo contado físicamente"
    )
    
    # Cálculos automáticos
    efectivo_esperado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Efectivo esperado según sistema"
    )
    
    diferencia = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Diferencia (contado - esperado)"
    )
    
    # Resumen de ventas
    total_ventas_efectivo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal(0),
        verbose_name="Total ventas en efectivo"
    )
    total_ventas_tarjeta = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal(0),
        verbose_name="Total ventas con tarjeta"
    )
    total_ventas = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal(0),
        verbose_name="Total ventas del día"
    )
    
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name="Observaciones"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Cuadre de Caja"
        verbose_name_plural = "Cuadres de Caja"

    def __str__(self):
        return f"Cuadre {self.caja_session.nombre} - {self.created_at.strftime('%d/%m/%Y')}"
    
    def save(self, *args, **kwargs):
        """
        Al guardar, calcula la diferencia y los totales automáticamente
        """
        # Calcular efectivo esperado si no está establecido
        if self.efectivo_esperado is None:
            self.efectivo_esperado = self.caja_session.calcular_efectivo_esperado()
            
        # Calcular diferencia
        efectivo_contado = self.efectivo_contado or Decimal(0)
        efectivo_esperado = self.efectivo_esperado or Decimal(0)
        self.diferencia = efectivo_contado - efectivo_esperado
        
        # Calcular totales de ventas
        movimientos = self.caja_session.movimientos.filter(tipo='venta')
        
        self.total_ventas_efectivo = movimientos.filter(
            models.Q(metodo_pago='efectivo') | 
            models.Q(metodo_pago='mixto')
        ).aggregate(
            efectivo=models.Sum(
                models.Case(
                    models.When(metodo_pago='efectivo', then='importe'),
                    models.When(metodo_pago='mixto', then='importe_efectivo'),
                    default=Decimal('0'),
                    output_field=models.DecimalField()
                )
            )
        )['efectivo'] or Decimal(0)
        
        self.total_ventas_tarjeta = movimientos.filter(
            models.Q(metodo_pago='tarjeta') | 
            models.Q(metodo_pago='mixto') |
            models.Q(metodo_pago='transferencia')
        ).aggregate(
            tarjeta=models.Sum(
                models.Case(
                    models.When(metodo_pago='tarjeta', then='importe'),
                    models.When(metodo_pago='transferencia', then='importe'),
                    models.When(metodo_pago='mixto', then='importe_tarjeta'),
                    default=Decimal('0'),
                    output_field=models.DecimalField()
                )
            )
        )['tarjeta'] or Decimal(0)
        
        self.total_ventas = self.total_ventas_efectivo + self.total_ventas_tarjeta
        super().save(*args, **kwargs)
