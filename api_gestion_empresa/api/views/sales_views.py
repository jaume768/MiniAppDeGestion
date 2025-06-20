"""
ViewSets para entidades relacionadas con ventas (presupuestos, pedidos, albaranes, tickets).
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from ..models import (
    Presupuesto, Pedido, PedidoItem, Albaran, AlbaranItem, Ticket, TicketItem
)
from ..serializers import (
    PresupuestoSerializer, PedidoSerializer, AlbaranSerializer, TicketSerializer,
    PedidoItemSerializer, AlbaranItemSerializer, TicketItemSerializer,
    PresupuestoItemSerializer
)


class PresupuestoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de presupuestos."""
    queryset = Presupuesto.objects.all()
    serializer_class = PresupuestoSerializer
    
    def update(self, request, *args, **kwargs):
        """Prevenir modificación de presupuestos facturados."""
        presupuesto = self.get_object()
        if presupuesto.is_facturado:
            raise PermissionDenied("No se puede modificar un presupuesto que ya ha sido facturado")
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Prevenir eliminación de presupuestos facturados."""
        presupuesto = self.get_object()
        if presupuesto.is_facturado:
            raise PermissionDenied("No se puede eliminar un presupuesto que ya ha sido facturado")
        return super().destroy(request, *args, **kwargs)
        
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """Obtener los items de un presupuesto."""
        presupuesto = self.get_object()
        items = presupuesto.items.all()
        serializer = PresupuestoItemSerializer(items, many=True)
        return Response(serializer.data)


class PedidoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de pedidos."""
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    
    def update(self, request, *args, **kwargs):
        """Prevenir modificación de pedidos facturados."""
        pedido = self.get_object()
        if pedido.is_facturado:
            raise PermissionDenied("No se puede modificar un pedido que ya ha sido facturado")
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Prevenir eliminación de pedidos facturados."""
        pedido = self.get_object()
        if pedido.is_facturado:
            raise PermissionDenied("No se puede eliminar un pedido que ya ha sido facturado")
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """Obtener los items de un pedido."""
        pedido = self.get_object()
        items = PedidoItem.objects.filter(pedido=pedido)
        serializer = PedidoItemSerializer(items, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['post'])
    def crear_desde_presupuesto(self, request):
        """Crear un pedido a partir de un presupuesto existente."""
        presupuesto_id = request.data.get('presupuesto_id')
        
        if not presupuesto_id:
            return Response({'error': 'El ID del presupuesto es requerido'}, status=400)
            
        try:
            presupuesto = Presupuesto.objects.get(id=presupuesto_id)
            
            # Crear el pedido
            pedido = Pedido.objects.create(
                cliente=presupuesto.cliente,
                total=presupuesto.total
            )
            
            # Copiar los items del presupuesto al pedido
            for item in presupuesto.items.all():
                PedidoItem.objects.create(
                    pedido=pedido,
                    articulo=item.articulo,
                    cantidad=item.cantidad,
                    precio_unitario=item.precio_unitario
                )
            
            serializer = self.get_serializer(pedido)
            return Response(serializer.data, status=201)
            
        except Presupuesto.DoesNotExist:
            return Response({'error': 'El presupuesto no existe'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class AlbaranViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de albaranes."""
    queryset = Albaran.objects.all()
    serializer_class = AlbaranSerializer
    
    def update(self, request, *args, **kwargs):
        """Prevenir modificación de albaranes facturados."""
        albaran = self.get_object()
        if albaran.is_facturado:
            raise PermissionDenied("No se puede modificar un albarán que ya ha sido facturado")
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Prevenir eliminación de albaranes facturados."""
        albaran = self.get_object()
        if albaran.is_facturado:
            raise PermissionDenied("No se puede eliminar un albarán que ya ha sido facturado")
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """Obtener los items de un albarán."""
        albaran = self.get_object()
        items = AlbaranItem.objects.filter(albaran=albaran)
        serializer = AlbaranItemSerializer(items, many=True)
        return Response(serializer.data)


class TicketViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de tickets."""
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    
    def update(self, request, *args, **kwargs):
        """Prevenir modificación de tickets facturados."""
        ticket = self.get_object()
        if ticket.is_facturado:
            raise PermissionDenied("No se puede modificar un ticket que ya ha sido facturado")
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Prevenir eliminación de tickets facturados."""
        ticket = self.get_object()
        if ticket.is_facturado:
            raise PermissionDenied("No se puede eliminar un ticket que ya ha sido facturado")
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """Obtener los items de un ticket."""
        ticket = self.get_object()
        items = TicketItem.objects.filter(ticket=ticket)
        serializer = TicketItemSerializer(items, many=True)
        return Response(serializer.data)
