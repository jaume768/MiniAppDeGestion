from rest_framework import serializers
from core.serializers import BaseDocumentSerializer, BaseItemSerializer
from .models import (
    Presupuesto, PresupuestoItem,
    Pedido, PedidoItem, 
    Albaran, AlbaranItem,
    Ticket, TicketItem,
    Factura
)


# Serializers para Items
class PresupuestoItemSerializer(BaseItemSerializer):
    class Meta(BaseItemSerializer.Meta):
        model = PresupuestoItem


class PedidoItemSerializer(BaseItemSerializer):
    class Meta(BaseItemSerializer.Meta):
        model = PedidoItem


class AlbaranItemSerializer(BaseItemSerializer):
    class Meta(BaseItemSerializer.Meta):
        model = AlbaranItem


class TicketItemSerializer(BaseItemSerializer):
    class Meta(BaseItemSerializer.Meta):
        model = TicketItem


# Serializers para Documentos
class PresupuestoSerializer(BaseDocumentSerializer):
    items = PresupuestoItemSerializer(many=True)
    
    class Meta:
        model = Presupuesto
        fields = ['id', 'cliente', 'fecha', 'subtotal', 'iva', 'total', 'items', 'is_facturado']
    
    def get_item_model(self):
        return PresupuestoItem
    
    def get_document_field_name(self):
        return 'presupuesto'


class PedidoSerializer(BaseDocumentSerializer):
    items = PedidoItemSerializer(many=True)
    
    class Meta:
        model = Pedido
        fields = ['id', 'cliente', 'fecha', 'subtotal', 'iva', 'total', 'entregado', 'items', 'is_facturado']
    
    def get_item_model(self):
        return PedidoItem
    
    def get_document_field_name(self):
        return 'pedido'


class AlbaranSerializer(BaseDocumentSerializer):
    items = AlbaranItemSerializer(many=True)
    
    class Meta:
        model = Albaran
        fields = ['id', 'cliente', 'fecha', 'subtotal', 'iva', 'total', 'items', 'is_facturado']
    
    def get_item_model(self):
        return AlbaranItem
    
    def get_document_field_name(self):
        return 'albaran'


class TicketSerializer(BaseDocumentSerializer):
    items = TicketItemSerializer(many=True)
    
    class Meta:
        model = Ticket
        fields = ['id', 'cliente', 'fecha', 'subtotal', 'iva', 'total', 'items', 'is_facturado']
    
    def get_item_model(self):
        return TicketItem
    
    def get_document_field_name(self):
        return 'ticket'


class FacturaSerializer(serializers.ModelSerializer):
    """Serializer para Factura"""
    cliente = serializers.SerializerMethodField()
    cliente_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Factura
        fields = ['id', 'pedido', 'albaran', 'ticket', 'presupuesto', 'fecha', 'subtotal', 'iva', 'total', 'cliente', 'cliente_nombre']
    
    def get_cliente(self, obj):
        """Devuelve el ID del cliente del documento origen"""
        cliente = obj.cliente
        return cliente.id if cliente else None
    
    def get_cliente_nombre(self, obj):
        """Devuelve el nombre del cliente del documento origen"""
        cliente = obj.cliente
        return cliente.nombre if cliente else None
