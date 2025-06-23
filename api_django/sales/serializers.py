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
    items = PresupuestoItemSerializer(source='presupuestoitem_set', many=True, read_only=True)
    
    class Meta:
        model = Presupuesto
        fields = ['id', 'numero', 'cliente', 'fecha', 'observaciones', 'subtotal', 'iva', 'total', 'items']
    
    def get_item_model(self):
        return PresupuestoItem
    
    def get_document_field_name(self):
        return 'presupuesto'


class PedidoSerializer(BaseDocumentSerializer):
    items = PedidoItemSerializer(source='pedidoitem_set', many=True, read_only=True)
    
    class Meta:
        model = Pedido
        fields = ['id', 'numero', 'cliente', 'fecha', 'observaciones', 'subtotal', 'iva', 'total', 'entregado', 'items']
    
    def get_item_model(self):
        return PedidoItem
    
    def get_document_field_name(self):
        return 'pedido'


class AlbaranSerializer(BaseDocumentSerializer):
    items = AlbaranItemSerializer(source='albaranitem_set', many=True, read_only=True)
    
    class Meta:
        model = Albaran
        fields = ['id', 'numero', 'cliente', 'fecha', 'observaciones', 'subtotal', 'iva', 'total', 'items']
    
    def get_item_model(self):
        return AlbaranItem
    
    def get_document_field_name(self):
        return 'albaran'


class TicketSerializer(BaseDocumentSerializer):
    items = TicketItemSerializer(source='ticketitem_set', many=True, read_only=True)
    
    class Meta:
        model = Ticket
        fields = ['id', 'numero', 'cliente', 'fecha', 'observaciones', 'subtotal', 'iva', 'total', 'items']
    
    def get_item_model(self):
        return TicketItem
    
    def get_document_field_name(self):
        return 'ticket'


class FacturaSerializer(serializers.ModelSerializer):
    """Serializer para Factura"""
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    pedido_numero = serializers.CharField(source='pedido.numero', read_only=True)
    
    class Meta:
        model = Factura
        fields = ['id', 'numero', 'cliente', 'cliente_nombre', 'pedido', 'pedido_numero', 
                 'documento_origen', 'fecha', 'observaciones', 'subtotal', 'iva', 'total',
                 'created_at', 'updated_at']
