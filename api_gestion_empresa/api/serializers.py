from rest_framework import serializers
from .models import (
    Categoria, Marca, Articulo, Cliente,
    Presupuesto, PresupuestoItem,
    Pedido, PedidoItem, Factura,
    Departamento, Empleado, Proyecto,
    Albaran, AlbaranItem, Ticket, TicketItem
)

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class MarcaSerializer(serializers.ModelSerializer):
    articulos_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Marca
        fields = ['id', 'nombre', 'descripcion', 'pais_origen', 'articulos_count']
        
    def get_articulos_count(self, obj):
        return obj.articulos.count()

class ArticuloSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    marca_nombre = serializers.CharField(source='marca.nombre', read_only=True)
    
    class Meta:
        model = Articulo
        fields = ['id', 'nombre', 'descripcion', 'categoria', 'categoria_nombre', 
                 'marca', 'marca_nombre', 'modelo', 'precio', 'stock', 'iva']

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class PresupuestoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PresupuestoItem
        fields = ['id','articulo','cantidad','precio_unitario','iva']

class PresupuestoSerializer(serializers.ModelSerializer):
    items = PresupuestoItemSerializer(many=True)
    is_facturado = serializers.ReadOnlyField()
    
    class Meta:
        model = Presupuesto
        fields = ['id','cliente','fecha','subtotal','iva','total','items','is_facturado']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        presupuesto = Presupuesto.objects.create(**validated_data)
        subtotal = 0
        iva_total = 0
        for item in items_data:
            PresupuestoItem.objects.create(presupuesto=presupuesto, **item)
            subtotal_item = item['precio_unitario'] * item['cantidad']
            subtotal += subtotal_item
            iva_total += subtotal_item * (item['iva'] / 100)
        presupuesto.subtotal = subtotal
        presupuesto.iva = iva_total
        presupuesto.total = subtotal + iva_total
        presupuesto.save()
        return presupuesto

class PedidoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoItem
        fields = ['id','articulo','cantidad','precio_unitario','iva']

class PedidoSerializer(serializers.ModelSerializer):
    items = PedidoItemSerializer(many=True)
    is_facturado = serializers.ReadOnlyField()
    
    class Meta:
        model = Pedido
        fields = ['id','cliente','fecha','subtotal','iva','total','entregado','items','is_facturado']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        pedido = Pedido.objects.create(**validated_data)
        subtotal = 0
        iva_total = 0
        for item in items_data:
            PedidoItem.objects.create(pedido=pedido, **item)
            subtotal_item = item['precio_unitario'] * item['cantidad']
            subtotal += subtotal_item
            iva_total += subtotal_item * (item['iva'] / 100)
        pedido.subtotal = subtotal
        pedido.iva = iva_total
        pedido.total = subtotal + iva_total
        pedido.save()
        return pedido

class FacturaSerializer(serializers.ModelSerializer):
    # Añadir campos adicionales para cliente
    cliente = serializers.SerializerMethodField()
    cliente_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Factura
        fields = '__all__'
    
    def get_cliente(self, obj):
        """Devuelve el ID del cliente del documento origen"""
        if obj.pedido:
            return obj.pedido.cliente.id
        elif obj.albaran:
            return obj.albaran.cliente.id
        elif obj.ticket:
            return obj.ticket.cliente.id
        return None
    
    def get_cliente_nombre(self, obj):
        """Devuelve el nombre del cliente del documento origen"""
        if obj.pedido:
            return obj.pedido.cliente.nombre
        elif obj.albaran:
            return obj.albaran.cliente.nombre
        elif obj.ticket:
            return obj.ticket.cliente.nombre
        return None

class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = '__all__'

class EmpleadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleado
        fields = '__all__'

class ProyectoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proyecto
        fields = '__all__'

class AlbaranItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlbaranItem
        fields = ['id', 'articulo', 'cantidad', 'precio_unitario', 'iva']

class AlbaranSerializer(serializers.ModelSerializer):
    items = AlbaranItemSerializer(many=True)
    is_facturado = serializers.ReadOnlyField()
    
    class Meta:
        model = Albaran
        fields = ['id','cliente','fecha','subtotal','iva','total','items','is_facturado']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        albaran = Albaran.objects.create(**validated_data)
        subtotal = 0
        iva_total = 0
        for item in items_data:
            AlbaranItem.objects.create(albaran=albaran, **item)
            subtotal_item = item['precio_unitario'] * item['cantidad']
            subtotal += subtotal_item
            iva_total += subtotal_item * (item['iva'] / 100)
        albaran.subtotal = subtotal
        albaran.iva = iva_total
        albaran.total = subtotal + iva_total
        albaran.save()
        return albaran

class TicketItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketItem
        fields = ['id', 'articulo', 'cantidad', 'precio_unitario', 'iva']

class TicketSerializer(serializers.ModelSerializer):
    items = TicketItemSerializer(many=True)
    is_facturado = serializers.ReadOnlyField()
    
    class Meta:
        model = Ticket
        fields = ['id','cliente','fecha','subtotal','iva','total','items','is_facturado']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        ticket = Ticket.objects.create(**validated_data)
        subtotal = 0
        iva_total = 0
        for item in items_data:
            TicketItem.objects.create(ticket=ticket, **item)
            subtotal_item = item['precio_unitario'] * item['cantidad']
            subtotal += subtotal_item
            iva_total += subtotal_item * (item['iva'] / 100)
        ticket.subtotal = subtotal
        ticket.iva = iva_total
        ticket.total = subtotal + iva_total
        ticket.save()
        return ticket