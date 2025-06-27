from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models import (
    Almacen, ArticuloStock, MovimientoStock, 
    TransferenciaStock, TransferenciaStockItem
)
from products.models import Articulo
from accounts.models import CustomUser


class AlmacenSerializer(serializers.ModelSerializer):
    """Serializer para Almacenes"""
    
    total_articulos = serializers.SerializerMethodField()
    valor_total = serializers.SerializerMethodField()
    
    class Meta:
        model = Almacen
        fields = [
            'id', 'nombre', 'codigo', 'descripcion', 'direccion', 
            'poblacion', 'codigo_postal', 'provincia', 'activo', 
            'es_principal', 'responsable', 'telefono', 'email',
            'total_articulos', 'valor_total', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'total_articulos', 'valor_total']
    
    def get_total_articulos(self, obj):
        """Obtiene el total de artículos diferentes en el almacén"""
        return obj.get_total_articulos()
    
    def get_valor_total(self, obj):
        """Calcula el valor total del stock en el almacén"""
        return float(obj.get_valor_total())
    
    def validate_codigo(self, value):
        """Valida que el código sea único por empresa"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and hasattr(request.user, 'empresa'):
            empresa = request.user.empresa
            queryset = Almacen.objects.filter(empresa=empresa, codigo=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError("Ya existe un almacén con este código.")
        return value


class ArticuloStockSerializer(serializers.ModelSerializer):
    """Serializer para Stock de Artículos"""
    
    articulo_nombre = serializers.CharField(source='articulo.nombre', read_only=True)
    articulo_codigo = serializers.CharField(source='articulo.codigo', read_only=True)
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)
    almacen_codigo = serializers.CharField(source='almacen.codigo', read_only=True)
    stock_disponible = serializers.ReadOnlyField()
    necesita_reposicion = serializers.ReadOnlyField()
    valor_stock = serializers.ReadOnlyField()
    ubicacion_completa = serializers.CharField(read_only=True)
    
    class Meta:
        model = ArticuloStock
        fields = [
            'id', 'articulo', 'articulo_nombre', 'articulo_codigo',
            'almacen', 'almacen_nombre', 'almacen_codigo',
            'stock_actual', 'stock_minimo', 'stock_maximo', 'stock_reservado',
            'stock_disponible', 'necesita_reposicion', 'valor_stock',
            'pasillo', 'estanteria', 'nivel', 'ubicacion_completa',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'stock_disponible', 
            'necesita_reposicion', 'valor_stock', 'ubicacion_completa'
        ]
    
    def validate(self, data):
        """Validaciones del stock"""
        # Validar que el stock reservado no sea mayor al actual
        stock_actual = data.get('stock_actual', 0)
        stock_reservado = data.get('stock_reservado', 0)
        
        if stock_reservado > stock_actual:
            raise serializers.ValidationError(
                "El stock reservado no puede ser mayor al stock actual."
            )
        
        # Validar que stock mínimo sea menor o igual al máximo
        stock_minimo = data.get('stock_minimo', 0)
        stock_maximo = data.get('stock_maximo', 0)
        
        if stock_maximo > 0 and stock_minimo > stock_maximo:
            raise serializers.ValidationError(
                "El stock mínimo no puede ser mayor al stock máximo."
            )
        
        return data


class MovimientoStockSerializer(serializers.ModelSerializer):
    """Serializer para Movimientos de Stock"""
    
    articulo_nombre = serializers.CharField(source='articulo.nombre', read_only=True)
    articulo_codigo = serializers.CharField(source='articulo.codigo', read_only=True)
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)
    almacen_codigo = serializers.CharField(source='almacen.codigo', read_only=True)
    almacen_destino_nombre = serializers.CharField(source='almacen_destino.nombre', read_only=True)
    almacen_destino_codigo = serializers.CharField(source='almacen_destino.codigo', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    motivo_display = serializers.CharField(source='get_motivo_display', read_only=True)
    valor_movimiento = serializers.ReadOnlyField()
    
    class Meta:
        model = MovimientoStock
        fields = [
            'id', 'articulo', 'articulo_nombre', 'articulo_codigo',
            'almacen', 'almacen_nombre', 'almacen_codigo',
            'almacen_destino', 'almacen_destino_nombre', 'almacen_destino_codigo',
            'tipo', 'tipo_display', 'motivo', 'motivo_display',
            'cantidad', 'stock_anterior', 'stock_posterior',
            'observaciones', 'precio_unitario', 'valor_movimiento',
            'usuario', 'usuario_nombre', 'fecha', 'created_at'
        ]
        read_only_fields = [
            'fecha', 'created_at', 'valor_movimiento', 'usuario',
            'stock_anterior', 'stock_posterior'
        ]


class MovimientoStockCreateSerializer(serializers.Serializer):
    """Serializer para crear movimientos de stock"""
    
    articulo = serializers.PrimaryKeyRelatedField(queryset=Articulo.objects.all())
    almacen = serializers.PrimaryKeyRelatedField(queryset=Almacen.objects.all())
    tipo = serializers.ChoiceField(choices=MovimientoStock.TIPO_MOVIMIENTO_CHOICES)
    motivo = serializers.ChoiceField(choices=MovimientoStock.MOTIVO_CHOICES)
    cantidad = serializers.IntegerField()
    observaciones = serializers.CharField(required=False, allow_blank=True)
    precio_unitario = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    almacen_destino = serializers.PrimaryKeyRelatedField(
        queryset=Almacen.objects.all(), required=False, allow_null=True
    )
    
    def validate(self, data):
        """Validaciones del movimiento"""
        cantidad = data.get('cantidad')
        tipo = data.get('tipo')
        articulo = data.get('articulo')
        almacen = data.get('almacen')
        almacen_destino = data.get('almacen_destino')
        
        # Validar cantidad
        if cantidad == 0:
            raise serializers.ValidationError("La cantidad no puede ser cero.")
        
        # Para salidas, validar que hay stock suficiente
        if tipo in ['salida', 'transferencia_salida', 'ajuste_negativo']:
            if cantidad > 0:
                cantidad = -cantidad  # Convertir a negativo
            
            try:
                stock_actual = ArticuloStock.objects.get(
                    articulo=articulo, almacen=almacen
                ).stock_actual
            except ArticuloStock.DoesNotExist:
                stock_actual = 0
            
            if abs(cantidad) > stock_actual:
                raise serializers.ValidationError(
                    f"Stock insuficiente. Stock actual: {stock_actual}"
                )
        
        # Para transferencias, validar almacén destino
        if tipo in ['transferencia_salida', 'transferencia_entrada']:
            if not almacen_destino:
                raise serializers.ValidationError(
                    "Las transferencias requieren especificar almacén destino."
                )
            if almacen == almacen_destino:
                raise serializers.ValidationError(
                    "El almacén origen y destino no pueden ser el mismo."
                )
        
        data['cantidad'] = cantidad
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Crear movimiento de stock y actualizar stock"""
        articulo = validated_data['articulo']
        almacen = validated_data['almacen']
        cantidad = validated_data['cantidad']
        request = self.context.get('request')
        
        # Obtener o crear registro de stock
        stock, created = ArticuloStock.objects.get_or_create(
            articulo=articulo,
            almacen=almacen,
            defaults={'stock_actual': 0}
        )
        
        # Calcular nuevo stock
        stock_anterior = stock.stock_actual
        stock_posterior = max(0, stock_anterior + cantidad)
        
        # Crear movimiento
        movimiento = MovimientoStock.objects.create(
            articulo=articulo,
            almacen=almacen,
            tipo=validated_data['tipo'],
            motivo=validated_data['motivo'],
            cantidad=cantidad,
            stock_anterior=stock_anterior,
            stock_posterior=stock_posterior,
            observaciones=validated_data.get('observaciones', ''),
            precio_unitario=validated_data.get('precio_unitario'),
            almacen_destino=validated_data.get('almacen_destino'),
            usuario=request.user if request else None
        )
        
        # Actualizar stock
        stock.stock_actual = stock_posterior
        stock.save()
        
        # Si es transferencia, crear movimiento de entrada en destino
        if validated_data['tipo'] == 'transferencia_salida' and validated_data.get('almacen_destino'):
            almacen_destino = validated_data['almacen_destino']
            
            # Obtener o crear stock en destino
            stock_destino, created = ArticuloStock.objects.get_or_create(
                articulo=articulo,
                almacen=almacen_destino,
                defaults={'stock_actual': 0}
            )
            
            stock_anterior_destino = stock_destino.stock_actual
            stock_posterior_destino = stock_anterior_destino + abs(cantidad)
            
            # Crear movimiento de entrada
            MovimientoStock.objects.create(
                articulo=articulo,
                almacen=almacen_destino,
                tipo='transferencia_entrada',
                motivo='transferencia',
                cantidad=abs(cantidad),
                stock_anterior=stock_anterior_destino,
                stock_posterior=stock_posterior_destino,
                observaciones=f"Transferencia desde {almacen.codigo}",
                precio_unitario=validated_data.get('precio_unitario'),
                almacen_destino=almacen,  # Almacén origen en el movimiento de entrada
                usuario=request.user if request else None
            )
            
            # Actualizar stock destino
            stock_destino.stock_actual = stock_posterior_destino
            stock_destino.save()
        
        return movimiento


class TransferenciaStockItemSerializer(serializers.ModelSerializer):
    """Serializer para Items de Transferencia"""
    
    articulo_nombre = serializers.CharField(source='articulo.nombre', read_only=True)
    articulo_codigo = serializers.CharField(source='articulo.codigo', read_only=True)
    cantidad_pendiente = serializers.ReadOnlyField()
    esta_completo = serializers.ReadOnlyField()
    
    class Meta:
        model = TransferenciaStockItem
        fields = [
            'id', 'articulo', 'articulo_nombre', 'articulo_codigo',
            'cantidad_solicitada', 'cantidad_enviada', 'cantidad_recibida',
            'cantidad_pendiente', 'esta_completo', 'observaciones',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'cantidad_pendiente', 'esta_completo']


class TransferenciaStockSerializer(serializers.ModelSerializer):
    """Serializer para Transferencias de Stock"""
    
    almacen_origen_nombre = serializers.CharField(source='almacen_origen.nombre', read_only=True)
    almacen_origen_codigo = serializers.CharField(source='almacen_origen.codigo', read_only=True)
    almacen_destino_nombre = serializers.CharField(source='almacen_destino.nombre', read_only=True)
    almacen_destino_codigo = serializers.CharField(source='almacen_destino.codigo', read_only=True)
    solicitado_por_nombre = serializers.CharField(source='solicitado_por.get_full_name', read_only=True)
    enviado_por_nombre = serializers.CharField(source='enviado_por.get_full_name', read_only=True)
    recibido_por_nombre = serializers.CharField(source='recibido_por.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    items = TransferenciaStockItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = TransferenciaStock
        fields = [
            'id', 'numero', 'almacen_origen', 'almacen_origen_nombre', 'almacen_origen_codigo',
            'almacen_destino', 'almacen_destino_nombre', 'almacen_destino_codigo',
            'estado', 'estado_display', 'motivo', 'observaciones',
            'fecha_solicitud', 'fecha_envio', 'fecha_recepcion',
            'solicitado_por', 'solicitado_por_nombre',
            'enviado_por', 'enviado_por_nombre',
            'recibido_por', 'recibido_por_nombre',
            'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'numero', 'fecha_solicitud', 'fecha_envio', 'fecha_recepcion',
            'solicitado_por', 'enviado_por', 'recibido_por',
            'created_at', 'updated_at'
        ]
    
    def validate(self, data):
        """Validaciones de la transferencia"""
        almacen_origen = data.get('almacen_origen')
        almacen_destino = data.get('almacen_destino')
        
        if almacen_origen and almacen_destino:
            if almacen_origen == almacen_destino:
                raise serializers.ValidationError(
                    "El almacén origen y destino no pueden ser el mismo."
                )
        
        return data


class StockResumenSerializer(serializers.Serializer):
    """Serializer para resumen de stock"""
    
    articulo_id = serializers.IntegerField()
    articulo_nombre = serializers.CharField()
    articulo_codigo = serializers.CharField()
    stock_total = serializers.IntegerField()
    stock_reservado_total = serializers.IntegerField()
    stock_disponible_total = serializers.IntegerField()
    valor_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    almacenes = serializers.ListField(child=serializers.DictField())


class AlertaStockSerializer(serializers.Serializer):
    """Serializer para alertas de stock bajo"""
    
    articulo_id = serializers.IntegerField()
    articulo_nombre = serializers.CharField()
    articulo_codigo = serializers.CharField()
    almacen_id = serializers.IntegerField()
    almacen_nombre = serializers.CharField()
    almacen_codigo = serializers.CharField()
    stock_actual = serializers.IntegerField()
    stock_minimo = serializers.IntegerField()
    diferencia = serializers.IntegerField()
    urgencia = serializers.CharField()  # 'critica', 'alta', 'media'


class AjusteStockSerializer(serializers.Serializer):
    """Serializer para ajustes masivos de stock"""
    
    ajustes = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )
    motivo = serializers.CharField(max_length=200)
    observaciones = serializers.CharField(required=False, allow_blank=True)
    
    def validate_ajustes(self, value):
        """Valida el formato de los ajustes"""
        for ajuste in value:
            required_fields = ['articulo_id', 'almacen_id', 'stock_nuevo']
            for field in required_fields:
                if field not in ajuste:
                    raise serializers.ValidationError(
                        f"Campo requerido '{field}' faltante en ajuste."
                    )
            
            # Validar que stock_nuevo sea positivo
            if ajuste['stock_nuevo'] < 0:
                raise serializers.ValidationError(
                    "El stock nuevo no puede ser negativo."
                )
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """Procesar ajustes masivos de stock"""
        ajustes = validated_data['ajustes']
        motivo = validated_data['motivo']
        observaciones = validated_data.get('observaciones', '')
        request = self.context.get('request')
        
        movimientos_creados = []
        
        for ajuste in ajustes:
            articulo_id = ajuste['articulo_id']
            almacen_id = ajuste['almacen_id']
            stock_nuevo = ajuste['stock_nuevo']
            
            try:
                articulo = Articulo.objects.get(id=articulo_id)
                almacen = Almacen.objects.get(id=almacen_id)
            except (Articulo.DoesNotExist, Almacen.DoesNotExist):
                continue
            
            # Obtener o crear stock
            stock, created = ArticuloStock.objects.get_or_create(
                articulo=articulo,
                almacen=almacen,
                defaults={'stock_actual': 0}
            )
            
            stock_anterior = stock.stock_actual
            diferencia = stock_nuevo - stock_anterior
            
            if diferencia != 0:
                # Determinar tipo de movimiento
                if diferencia > 0:
                    tipo = 'ajuste_positivo'
                else:
                    tipo = 'ajuste_negativo'
                
                # Crear movimiento
                movimiento = MovimientoStock.objects.create(
                    articulo=articulo,
                    almacen=almacen,
                    tipo=tipo,
                    motivo='ajuste_inventario',
                    cantidad=diferencia,
                    stock_anterior=stock_anterior,
                    stock_posterior=stock_nuevo,
                    observaciones=f"{motivo}. {observaciones}".strip(),
                    usuario=request.user if request else None
                )
                
                # Actualizar stock
                stock.stock_actual = stock_nuevo
                stock.save()
                
                movimientos_creados.append(movimiento)
        
        return {
            'movimientos_creados': len(movimientos_creados),
            'ajustes_procesados': len(ajustes)
        }
