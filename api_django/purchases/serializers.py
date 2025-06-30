from rest_framework import serializers
from decimal import Decimal
from .models import (
    PedidoCompra, PedidoCompraItem, AlbaranCompra, AlbaranCompraItem,
    FacturaCompra, FacturaCompraItem, CuentaPorPagar
)
from core.serializers import ProveedorSerializer
from products.serializers import ArticuloSerializer
from inventory.serializers import AlmacenSerializer


# Serializers base para compras
class BasePurchaseDocumentSerializer(serializers.ModelSerializer):
    """Serializer base para documentos de compra"""
    proveedor_display = serializers.CharField(source='proveedor.nombre', read_only=True)
    total_display = serializers.SerializerMethodField()
    
    class Meta:
        fields = [
            'id', 'numero', 'proveedor', 'proveedor_display', 'fecha', 
            'observaciones', 'subtotal', 'iva', 'total', 'total_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['subtotal', 'iva', 'total', 'created_at', 'updated_at']
    
    def get_total_display(self, obj):
        return f"{obj.total:.2f} €"


class BasePurchaseItemSerializer(serializers.ModelSerializer):
    """Serializer base para items de compras"""
    articulo_display = serializers.CharField(source='articulo.nombre', read_only=True)
    subtotal_display = serializers.SerializerMethodField()
    total_display = serializers.SerializerMethodField()
    
    class Meta:
        fields = [
            'id', 'articulo', 'articulo_display', 'cantidad', 'precio_unitario',
            'descuento_porcentaje', 'iva_porcentaje', 'subtotal_display', 'total_display'
        ]
        read_only_fields = ['subtotal_display', 'total_display']
    
    def get_subtotal_display(self, obj):
        return f"{obj.subtotal:.2f} €"
    
    def get_total_display(self, obj):
        return f"{obj.total:.2f} €"


# Serializers para Pedidos de Compra
class PedidoCompraItemSerializer(BasePurchaseItemSerializer):
    """Serializer para items de pedido de compra"""
    cantidad_pendiente_display = serializers.SerializerMethodField()
    esta_completo = serializers.BooleanField(read_only=True)
    
    class Meta(BasePurchaseItemSerializer.Meta):
        model = PedidoCompraItem
        fields = BasePurchaseItemSerializer.Meta.fields + [
            'pedido', 'cantidad_recibida', 'cantidad_pendiente_display', 
            'esta_completo', 'observaciones'
        ]
        read_only_fields = BasePurchaseItemSerializer.Meta.read_only_fields + [
            'cantidad_recibida', 'cantidad_pendiente_display', 'esta_completo'
        ]
    
    def get_cantidad_pendiente_display(self, obj):
        return f"{obj.cantidad_pendiente} unidades"


class PedidoCompraSerializer(BasePurchaseDocumentSerializer):
    """Serializer para pedidos de compra"""
    items = PedidoCompraItemSerializer(source='pedidocompraitem_set', many=True, read_only=True)
    almacen_display = serializers.CharField(source='almacen_destino.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    puede_cancelar = serializers.BooleanField(read_only=True)
    puede_confirmar = serializers.BooleanField(read_only=True)
    
    class Meta(BasePurchaseDocumentSerializer.Meta):
        model = PedidoCompra
        fields = BasePurchaseDocumentSerializer.Meta.fields + [
            'estado', 'estado_display', 'fecha_esperada', 'almacen_destino', 
            'almacen_display', 'condiciones_pago', 'referencia_proveedor',
            'puede_cancelar', 'puede_confirmar', 'items'
        ]
        read_only_fields = BasePurchaseDocumentSerializer.Meta.read_only_fields + [
            'estado_display', 'puede_cancelar', 'puede_confirmar'
        ]


class PedidoCompraCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear pedidos de compra con items"""
    items = PedidoCompraItemSerializer(many=True)
    
    class Meta:
        model = PedidoCompra
        fields = [
            'proveedor', 'fecha', 'fecha_esperada', 'almacen_destino',
            'condiciones_pago', 'referencia_proveedor', 'observaciones', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Generar número de pedido
        empresa = self.context['request'].user.empresa
        ultimo_numero = PedidoCompra.objects.filter(empresa=empresa).count() + 1
        numero = f"PC{ultimo_numero:06d}"
        
        pedido = PedidoCompra.objects.create(
            empresa=empresa,
            numero=numero,
            **validated_data
        )
        
        # Crear items
        for item_data in items_data:
            PedidoCompraItem.objects.create(
                empresa=empresa,
                pedido=pedido,
                **item_data
            )
        
        # Calcular totales
        pedido.calculate_totals()
        
        return pedido


# Serializers para Albaranes de Compra
class AlbaranCompraItemSerializer(BasePurchaseItemSerializer):
    """Serializer para items de albarán de compra"""
    pedido_item_display = serializers.CharField(source='pedido_item.articulo.nombre', read_only=True)
    cantidad_pendiente_display = serializers.SerializerMethodField()
    esta_completo = serializers.BooleanField(read_only=True)
    
    class Meta(BasePurchaseItemSerializer.Meta):
        model = AlbaranCompraItem
        fields = BasePurchaseItemSerializer.Meta.fields + [
            'albaran', 'pedido_item', 'pedido_item_display', 'cantidad_recibida',
            'cantidad_pendiente_display', 'esta_completo', 'lote', 
            'fecha_caducidad', 'observaciones'
        ]
        read_only_fields = BasePurchaseItemSerializer.Meta.read_only_fields + [
            'pedido_item_display', 'cantidad_pendiente_display', 'esta_completo'
        ]
    
    def get_cantidad_pendiente_display(self, obj):
        return f"{obj.cantidad_pendiente} unidades"


class AlbaranCompraSerializer(BasePurchaseDocumentSerializer):
    """Serializer para albaranes de compra"""
    items = AlbaranCompraItemSerializer(source='albarancompraitem_set', many=True, read_only=True)
    pedido_display = serializers.CharField(source='pedido_compra.numero', read_only=True)
    almacen_display = serializers.CharField(source='almacen.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    recibido_por_display = serializers.CharField(source='recibido_por.get_full_name', read_only=True)
    puede_recibir = serializers.BooleanField(read_only=True)
    
    class Meta(BasePurchaseDocumentSerializer.Meta):
        model = AlbaranCompra
        fields = BasePurchaseDocumentSerializer.Meta.fields + [
            'pedido_compra', 'pedido_display', 'estado', 'estado_display',
            'fecha_recepcion', 'almacen', 'almacen_display', 'recibido_por',
            'recibido_por_display', 'numero_albaran_proveedor', 
            'puede_recibir', 'items'
        ]
        read_only_fields = BasePurchaseDocumentSerializer.Meta.read_only_fields + [
            'pedido_display', 'estado_display', 'almacen_display',
            'recibido_por_display', 'puede_recibir'
        ]


# Serializers para Facturas de Compra
class FacturaCompraItemSerializer(BasePurchaseItemSerializer):
    """Serializer para items de factura de compra"""
    pedido_item_display = serializers.CharField(source='pedido_item.articulo.nombre', read_only=True)
    albaran_item_display = serializers.CharField(source='albaran_item.articulo.nombre', read_only=True)
    
    class Meta(BasePurchaseItemSerializer.Meta):
        model = FacturaCompraItem
        fields = BasePurchaseItemSerializer.Meta.fields + [
            'factura', 'pedido_item', 'pedido_item_display', 
            'albaran_item', 'albaran_item_display'
        ]
        read_only_fields = BasePurchaseItemSerializer.Meta.read_only_fields + [
            'pedido_item_display', 'albaran_item_display'
        ]


class FacturaCompraSerializer(BasePurchaseDocumentSerializer):
    """Serializer para facturas de compra"""
    items = FacturaCompraItemSerializer(source='facturacompraitem_set', many=True, read_only=True)
    pedido_display = serializers.CharField(source='pedido_compra.numero', read_only=True)
    albaran_display = serializers.CharField(source='albaran_compra.numero', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    puede_pagar = serializers.BooleanField(read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    dias_vencimiento = serializers.SerializerMethodField()
    
    class Meta(BasePurchaseDocumentSerializer.Meta):
        model = FacturaCompra
        fields = BasePurchaseDocumentSerializer.Meta.fields + [
            'numero_factura_proveedor', 'pedido_compra', 'pedido_display',
            'albaran_compra', 'albaran_display', 'estado', 'estado_display',
            'fecha_vencimiento', 'fecha_pago', 'metodo_pago', 'puede_pagar',
            'esta_vencida', 'dias_vencimiento', 'items'
        ]
        read_only_fields = BasePurchaseDocumentSerializer.Meta.read_only_fields + [
            'pedido_display', 'albaran_display', 'estado_display', 
            'puede_pagar', 'esta_vencida', 'dias_vencimiento'
        ]
    
    def get_dias_vencimiento(self, obj):
        """Días hasta vencimiento (negativo si ya venció)"""
        from django.utils import timezone
        delta = obj.fecha_vencimiento - timezone.now().date()
        return delta.days


# Serializers para Cuentas por Pagar
class CuentaPorPagarSerializer(serializers.ModelSerializer):
    """Serializer para cuentas por pagar"""
    proveedor_display = serializers.CharField(source='proveedor.nombre', read_only=True)
    factura_display = serializers.CharField(source='factura_compra.numero', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    monto_original_display = serializers.SerializerMethodField()
    monto_pagado_display = serializers.SerializerMethodField()
    monto_pendiente_display = serializers.SerializerMethodField()
    dias_vencimiento = serializers.SerializerMethodField()
    
    class Meta:
        model = CuentaPorPagar
        fields = [
            'id', 'proveedor', 'proveedor_display', 'factura_compra', 'factura_display',
            'monto_original', 'monto_original_display', 'monto_pagado', 'monto_pagado_display',
            'monto_pendiente', 'monto_pendiente_display', 'fecha_vencimiento', 
            'estado', 'estado_display', 'dias_vencimiento', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'proveedor_display', 'factura_display', 'estado_display',
            'monto_original_display', 'monto_pagado_display', 'monto_pendiente_display',
            'dias_vencimiento', 'created_at', 'updated_at'
        ]
    
    def get_monto_original_display(self, obj):
        return f"{obj.monto_original:.2f} €"
    
    def get_monto_pagado_display(self, obj):
        return f"{obj.monto_pagado:.2f} €"
    
    def get_monto_pendiente_display(self, obj):
        return f"{obj.monto_pendiente:.2f} €"
    
    def get_dias_vencimiento(self, obj):
        """Días hasta vencimiento (negativo si ya venció)"""
        from django.utils import timezone
        delta = obj.fecha_vencimiento - timezone.now().date()
        return delta.days


# Serializers para acciones específicas
class CreateAlbaranSerializer(serializers.Serializer):
    """Serializer para crear albarán desde pedido"""
    items = serializers.ListField(child=serializers.DictField())
    
    def validate_items(self, value):
        for item in value:
            if 'pedido_item_id' not in item:
                raise serializers.ValidationError("pedido_item_id es requerido")
            if 'cantidad_a_recibir' not in item:
                raise serializers.ValidationError("cantidad_a_recibir es requerido")
            if item['cantidad_a_recibir'] <= 0:
                raise serializers.ValidationError("cantidad_a_recibir debe ser mayor a 0")
        return value


class ReceiveMerchandiseSerializer(serializers.Serializer):
    """Serializer para confirmar recepción de mercancía"""
    items = serializers.ListField(child=serializers.DictField())
    
    def validate_items(self, value):
        for item in value:
            if 'item_id' not in item:
                raise serializers.ValidationError("item_id es requerido")
            if 'cantidad_recibida' not in item:
                raise serializers.ValidationError("cantidad_recibida es requerido")
            if item['cantidad_recibida'] <= 0:
                raise serializers.ValidationError("cantidad_recibida debe ser mayor a 0")
        return value


class CreateFacturaSerializer(serializers.Serializer):
    """Serializer para crear factura desde albarán"""
    numero_factura_proveedor = serializers.CharField(max_length=50)
    fecha_vencimiento = serializers.DateField()
    metodo_pago = serializers.CharField(max_length=50, required=False)
    observaciones = serializers.CharField(required=False)


# Serializers para reportes
class PurchaseSummarySerializer(serializers.Serializer):
    """Serializer para resumen de compras"""
    fecha_desde = serializers.DateField(required=False)
    fecha_hasta = serializers.DateField(required=False)


class SupplierPerformanceSerializer(serializers.Serializer):
    """Serializer para análisis de proveedores"""
    proveedor_id = serializers.IntegerField(required=False)
