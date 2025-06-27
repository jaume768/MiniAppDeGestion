from rest_framework import serializers
from core.serializers import BaseDocumentSerializer, BaseItemSerializer
from .models import (
    Presupuesto, PresupuestoItem,
    Pedido, PedidoItem, 
    Albaran, AlbaranItem,
    Ticket, TicketItem,
    Factura
)
from inventory.models import MovimientoStock, ArticuloStock

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
        fields = ['id', 'numero', 'cliente', 'serie', 'serie_nombre', 'almacen_nombre', 'fecha', 'observaciones', 'subtotal', 'iva', 'total', 'items']
    
    def get_item_model(self):
        return PresupuestoItem
    
    def get_document_field_name(self):
        return 'presupuesto'


class PedidoSerializer(BaseDocumentSerializer):
    items = PedidoItemSerializer(source='pedidoitem_set', many=True, read_only=True)
    
    class Meta:
        model = Pedido
        fields = ['id', 'numero', 'cliente', 'serie', 'serie_nombre', 'almacen_nombre', 'fecha', 'observaciones', 'subtotal', 'iva', 'total', 'entregado', 'items']
    
    def get_item_model(self):
        return PedidoItem
    
    def get_document_field_name(self):
        return 'pedido'


class AlbaranSerializer(BaseDocumentSerializer):
    items = AlbaranItemSerializer(many=True, required=False)
    
    class Meta:
        model = Albaran
        fields = ['id', 'numero', 'cliente', 'serie', 'serie_nombre', 'almacen_nombre', 'fecha', 'observaciones', 'subtotal', 'iva', 'total', 'items']
    
    def create(self, validated_data):
        """Crear albarán con sus items"""
        items_data = validated_data.pop('items', [])
        albaran = Albaran.objects.create(**validated_data)
        
        # Crear items
        for item_data in items_data:
            AlbaranItem.objects.create(albaran=albaran, **item_data)
        
        # Calcular totales
        albaran.calculate_totals()
        
        # DESCONTAR STOCK MANUALMENTE después de crear los items
        if albaran.serie and albaran.serie.almacen:
            almacen = albaran.serie.almacen
            for item in albaran.albaranitem_set.all():
                # Obtener stock actual antes del movimiento
                try:
                    stock_record = ArticuloStock.objects.get(
                        empresa=albaran.empresa,
                        articulo=item.articulo,
                        almacen=almacen
                    )
                    stock_anterior = stock_record.stock_actual
                    stock_posterior = max(0, stock_anterior - item.cantidad)
                    
                    # Crear movimiento de stock (salida)
                    MovimientoStock.objects.create(
                        empresa=albaran.empresa,
                        articulo=item.articulo,
                        almacen=almacen,
                        tipo='salida',
                        motivo='venta',
                        cantidad=-item.cantidad,  # Negativo para salidas
                        stock_anterior=stock_anterior,
                        stock_posterior=stock_posterior,
                        precio_unitario=item.precio_unitario,
                        observaciones=f"Venta automática - Albarán {albaran.numero}",
                        documento_origen=albaran
                    )
                    
                    # Actualizar stock del artículo en el almacén
                    stock_record.stock_actual = stock_posterior
                    stock_record.save()
                    
                except ArticuloStock.DoesNotExist:
                    # Crear registro de stock con valor 0
                    ArticuloStock.objects.create(
                        empresa=albaran.empresa,
                        articulo=item.articulo,
                        almacen=almacen,
                        stock_actual=0,
                        stock_minimo=0
                    )
        
        return albaran
    
    def to_representation(self, instance):
        """Mostrar los items correctamente al leer"""
        data = super().to_representation(instance)
        data['items'] = AlbaranItemSerializer(instance.albaranitem_set.all(), many=True).data
        return data
    
    def get_item_model(self):
        return AlbaranItem
    
    def get_document_field_name(self):
        return 'albaran'


class TicketSerializer(BaseDocumentSerializer):
    items = TicketItemSerializer(many=True, required=False)
    
    class Meta:
        model = Ticket
        fields = ['id', 'numero', 'cliente', 'serie', 'serie_nombre', 'almacen_nombre', 'fecha', 'observaciones', 'subtotal', 'iva', 'total', 'items']
    
    def create(self, validated_data):
        """Crear ticket con sus items"""
        items_data = validated_data.pop('items', [])
        ticket = Ticket.objects.create(**validated_data)
        
        # Crear items
        for item_data in items_data:
            TicketItem.objects.create(ticket=ticket, **item_data)
        
        # Calcular totales
        ticket.calculate_totals()
        
        # DESCONTAR STOCK MANUALMENTE después de crear los items
        if ticket.serie and ticket.serie.almacen:
            almacen = ticket.serie.almacen
            for item in ticket.ticketitem_set.all():
                # Obtener stock actual antes del movimiento
                try:
                    stock_record = ArticuloStock.objects.get(
                        empresa=ticket.empresa,
                        articulo=item.articulo,
                        almacen=almacen
                    )
                    stock_anterior = stock_record.stock_actual
                    stock_posterior = max(0, stock_anterior - item.cantidad)
                    
                    # Crear movimiento de stock (salida)
                    MovimientoStock.objects.create(
                        empresa=ticket.empresa,
                        articulo=item.articulo,
                        almacen=almacen,
                        tipo='salida',
                        motivo='venta',
                        cantidad=-item.cantidad,  # Negativo para salidas
                        stock_anterior=stock_anterior,
                        stock_posterior=stock_posterior,
                        precio_unitario=item.precio_unitario,
                        observaciones=f"Venta automática - Ticket {ticket.numero}",
                        documento_origen=ticket
                    )
                    
                    # Actualizar stock del artículo en el almacén
                    stock_record.stock_actual = stock_posterior
                    stock_record.save()
                    
                except ArticuloStock.DoesNotExist:
                    # Crear registro de stock con valor 0
                    ArticuloStock.objects.create(
                        empresa=ticket.empresa,
                        articulo=item.articulo,
                        almacen=almacen,
                        stock_actual=0,
                        stock_minimo=0
                    )
        
        return ticket
    
    def to_representation(self, instance):
        """Mostrar los items correctamente al leer"""
        data = super().to_representation(instance)
        data['items'] = TicketItemSerializer(instance.ticketitem_set.all(), many=True).data
        return data
    
    def get_item_model(self):
        return TicketItem
    
    def get_document_field_name(self):
        return 'ticket'


class FacturaSerializer(BaseDocumentSerializer):
    """Serializer para Factura"""
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    pedido_numero = serializers.CharField(source='pedido.numero', read_only=True)
    
    class Meta:
        model = Factura
        fields = [
            'id', 'numero', 'cliente', 'cliente_nombre', 'serie', 'serie_nombre', 'almacen_nombre',
            'pedido', 'pedido_numero', 'documento_origen', 'fecha', 'observaciones', 'subtotal', 'iva', 'total',
            'created_at', 'updated_at'
        ]
