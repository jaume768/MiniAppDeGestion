from rest_framework import serializers
from .models import CajaSession, MovimientoCaja, CuadreCaja
from accounts.serializers import CustomUserSerializer
from sales.serializers import TicketSerializer


class CajaSessionSerializer(serializers.ModelSerializer):
    """Serializer para sesiones de caja"""
    
    usuario_detail = CustomUserSerializer(source='usuario', read_only=True)
    es_activa = serializers.ReadOnlyField()
    ventas_total = serializers.SerializerMethodField()
    efectivo_esperado = serializers.SerializerMethodField()
    
    class Meta:
        model = CajaSession
        fields = [
            'id', 'usuario', 'usuario_detail', 'nombre', 'estado',
            'fecha_apertura', 'fecha_cierre', 'saldo_inicial', 'saldo_final',
            'notas_apertura', 'notas_cierre', 'es_activa', 'ventas_total',
            'efectivo_esperado', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'fecha_apertura']
    
    def get_ventas_total(self, obj):
        """Obtiene el total de ventas de la sesión"""
        return obj.calcular_ventas_total()
    
    def get_efectivo_esperado(self, obj):
        """Obtiene el efectivo esperado en caja"""
        return obj.calcular_efectivo_esperado()


class CajaSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer específico para crear sesiones de caja"""
    
    class Meta:
        model = CajaSession
        fields = [
            'nombre', 'saldo_inicial', 'notas_apertura'
        ]
    
    def create(self, validated_data):
        # El usuario se asigna automáticamente desde el request
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class MovimientoCajaSerializer(serializers.ModelSerializer):
    """Serializer para movimientos de caja"""
    
    ticket_detail = TicketSerializer(source='ticket', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    
    class Meta:
        model = MovimientoCaja
        fields = [
            'id', 'caja_session', 'tipo', 'tipo_display', 'ticket', 'ticket_detail',
            'importe', 'metodo_pago', 'metodo_pago_display', 'importe_efectivo',
            'importe_tarjeta', 'concepto', 'referencia', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Verificar que la caja esté abierta
        if 'caja_session' in data:
            if not data['caja_session'].es_activa:
                raise serializers.ValidationError(
                    "No se pueden registrar movimientos en una caja cerrada"
                )
        
        # Validar pagos mixtos
        if data.get('metodo_pago') == 'mixto':
            if not data.get('importe_efectivo') or not data.get('importe_tarjeta'):
                raise serializers.ValidationError(
                    "Para pagos mixtos debe especificar importe en efectivo y tarjeta"
                )
            
            total_parcial = data['importe_efectivo'] + data['importe_tarjeta']
            if abs(total_parcial - data['importe']) > 0.01:  # Tolerancia por decimales
                raise serializers.ValidationError(
                    "La suma de efectivo y tarjeta debe igual al importe total"
                )
        
        return data


class MovimientoCajaCreateSerializer(serializers.ModelSerializer):
    """Serializer específico para crear movimientos sin ticket"""
    
    class Meta:
        model = MovimientoCaja
        fields = [
            'caja_session', 'tipo', 'importe', 'metodo_pago',
            'importe_efectivo', 'importe_tarjeta', 'concepto', 'referencia'
        ]
    
    def validate(self, data):
        """Validaciones para movimientos manuales"""
        # Solo permitir ciertos tipos de movimientos manuales
        tipos_permitidos = ['entrada', 'salida']
        if data.get('tipo') not in tipos_permitidos:
            raise serializers.ValidationError(
                f"Solo se permiten movimientos de tipo: {', '.join(tipos_permitidos)}"
            )
        
        return super().validate(data)


class CuadreCajaSerializer(serializers.ModelSerializer):
    """Serializer para cuadres de caja"""
    
    caja_session_detail = CajaSessionSerializer(source='caja_session', read_only=True)
    diferencia_absoluta = serializers.SerializerMethodField()
    estado_cuadre = serializers.SerializerMethodField()
    
    class Meta:
        model = CuadreCaja
        fields = [
            'id', 'caja_session', 'caja_session_detail', 'efectivo_contado',
            'efectivo_esperado', 'diferencia', 'diferencia_absoluta',
            'total_ventas_efectivo', 'total_ventas_tarjeta', 'total_ventas',
            'estado_cuadre', 'observaciones', 'created_at'
        ]
        read_only_fields = [
            'efectivo_esperado', 'diferencia', 'total_ventas_efectivo',
            'total_ventas_tarjeta', 'total_ventas', 'created_at'
        ]
    
    def get_diferencia_absoluta(self, obj):
        """Diferencia en valor absoluto"""
        return abs(obj.diferencia)
    
    def get_estado_cuadre(self, obj):
        """Estado del cuadre basado en la diferencia"""
        if abs(obj.diferencia) <= 0.01:  # Tolerancia de 1 céntimo
            return 'correcto'
        elif abs(obj.diferencia) <= 5.00:  # Diferencia menor a 5€
            return 'advertencia'
        else:
            return 'error'
    
    def create(self, validated_data):
        """Crear cuadre calculando automáticamente los valores"""
        caja_session = validated_data['caja_session']
        
        # Calcular efectivo esperado
        validated_data['efectivo_esperado'] = caja_session.calcular_efectivo_esperado()
        
        return super().create(validated_data)


class ResumenCajaSerializer(serializers.Serializer):
    """Serializer para resumen de caja en tiempo real"""
    
    sesion_activa = CajaSessionSerializer(read_only=True)
    movimientos_recientes = MovimientoCajaSerializer(many=True, read_only=True)
    
    # Totales del día
    total_ventas_dia = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_efectivo_dia = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_tarjeta_dia = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    # Estado actual
    efectivo_en_caja = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    numero_transacciones = serializers.IntegerField(read_only=True)
    
    # Estadísticas
    venta_promedio = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    ticket_mas_alto = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)


class CerrarCajaSerializer(serializers.Serializer):
    """Serializer para cerrar caja"""
    
    saldo_final = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2,
        min_value=0,
        help_text="Efectivo contado físicamente en caja"
    )
    notas_cierre = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Observaciones sobre el cierre de caja"
    )
    crear_cuadre = serializers.BooleanField(
        default=True,
        help_text="Crear automáticamente el registro de cuadre"
    )


class EstadisticasCajaSerializer(serializers.Serializer):
    """Serializer para estadísticas de caja por período"""
    
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
    
    # Totales por período
    total_sesiones = serializers.IntegerField(read_only=True)
    total_ventas = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_efectivo = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_tarjeta = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    # Promedios
    promedio_ventas_sesion = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    promedio_ticket = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    # Top usuarios
    usuarios_mas_activos = serializers.JSONField(read_only=True)
    
    # Análisis por método de pago
    distribucion_pagos = serializers.JSONField(read_only=True)
