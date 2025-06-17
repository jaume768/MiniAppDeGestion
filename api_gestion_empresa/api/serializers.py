from rest_framework import serializers
from .models import (
    Categoria, Articulo, Cliente,
    Presupuesto, PresupuestoItem,
    Pedido, PedidoItem, Factura,
    Departamento, Empleado, Proyecto,
    Albaran, AlbaranItem, Ticket, TicketItem
)

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ArticuloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Articulo
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class PresupuestoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PresupuestoItem
        fields = ['id','articulo','cantidad','precio_unitario']

class PresupuestoSerializer(serializers.ModelSerializer):
    items = PresupuestoItemSerializer(many=True)
    class Meta:
        model = Presupuesto
        fields = ['id','cliente','fecha','total','items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        presupuesto = Presupuesto.objects.create(**validated_data)
        total = 0
        for item in items_data:
            PresupuestoItem.objects.create(presupuesto=presupuesto, **item)
            total += item['precio_unitario'] * item['cantidad']
        presupuesto.total = total
        presupuesto.save()
        return presupuesto

class PedidoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoItem
        fields = ['id','articulo','cantidad','precio_unitario']

class PedidoSerializer(serializers.ModelSerializer):
    items = PedidoItemSerializer(many=True)
    class Meta:
        model = Pedido
        fields = ['id','cliente','fecha','total','items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        pedido = Pedido.objects.create(**validated_data)
        total = 0
        for item in items_data:
            PedidoItem.objects.create(pedido=pedido, **item)
            total += item['precio_unitario'] * item['cantidad']
        pedido.total = total
        pedido.save()
        return pedido

class FacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Factura
        fields = '__all__'

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
        fields = ['id', 'articulo', 'cantidad', 'precio_unitario']

class AlbaranSerializer(serializers.ModelSerializer):
    items = AlbaranItemSerializer(many=True)
    class Meta:
        model = Albaran
        fields = ['id', 'cliente', 'fecha', 'total', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        albaran = Albaran.objects.create(**validated_data)
        total = 0
        for item in items_data:
            AlbaranItem.objects.create(albaran=albaran, **item)
            total += item['precio_unitario'] * item['cantidad']
        albaran.total = total
        albaran.save()
        return albaran

class TicketItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketItem
        fields = ['id', 'articulo', 'cantidad', 'precio_unitario']

class TicketSerializer(serializers.ModelSerializer):
    items = TicketItemSerializer(many=True)
    class Meta:
        model = Ticket
        fields = ['id', 'cliente', 'fecha', 'total', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        ticket = Ticket.objects.create(**validated_data)
        total = 0
        for item in items_data:
            TicketItem.objects.create(ticket=ticket, **item)
            total += item['precio_unitario'] * item['cantidad']
        ticket.total = total
        ticket.save()
        return ticket