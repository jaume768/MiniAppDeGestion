from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from django.utils import timezone

from .models import (
    PedidoCompra, PedidoCompraItem, AlbaranCompra, AlbaranCompraItem,
    FacturaCompra, FacturaCompraItem, CuentaPorPagar
)
from .serializers import (
    PedidoCompraSerializer, PedidoCompraCreateSerializer,
    PedidoCompraItemSerializer, AlbaranCompraSerializer,
    AlbaranCompraItemSerializer, FacturaCompraSerializer,
    FacturaCompraItemSerializer, CuentaPorPagarSerializer
)
from .filters import PedidoCompraFilter, AlbaranCompraFilter, FacturaCompraFilter, CuentaPorPagarFilter


class PedidoCompraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de pedidos de compra
    
    Funcionalidades:
    - CRUD completo de pedidos
    - Filtrado por proveedor, estado, fechas
    - Acciones: confirmar, cancelar, crear_albaran
    """
    queryset = PedidoCompra.objects.all()
    serializer_class = PedidoCompraSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PedidoCompraFilter
    search_fields = ['numero', 'proveedor__nombre', 'referencia_proveedor']
    ordering_fields = ['fecha', 'numero', 'total']
    ordering = ['-fecha']
    
    def get_queryset(self):
        return PedidoCompra.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PedidoCompraCreateSerializer
        return PedidoCompraSerializer
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmar un pedido de compra"""
        pedido = self.get_object()
        
        if pedido.estado != 'borrador':
            return Response(
                {'error': 'Solo se pueden confirmar pedidos en borrador'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pedido.estado = 'confirmado'
        pedido.fecha_confirmacion = timezone.now()
        pedido.save()
        
        serializer = self.get_serializer(pedido)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar un pedido de compra"""
        pedido = self.get_object()
        
        if pedido.estado in ['entregado', 'facturado']:
            return Response(
                {'error': 'No se puede cancelar un pedido entregado o facturado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pedido.estado = 'cancelado'
    @action(detail=False, methods=['get'])
    def resumen(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        resumen = {
            'total_pedidos': queryset.count(),
            'monto_total': queryset.aggregate(total=Sum('total'))['total'] or 0,
        }
        return Response(resumen)


class PedidoCompraItemViewSet(viewsets.ModelViewSet):
    """ViewSet para items de pedidos de compra"""
    serializer_class = PedidoCompraItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['pedido', 'articulo']
    
    def get_queryset(self):
        return PedidoCompraItem.objects.all()


class AlbaranCompraViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de albaranes de compra"""
    serializer_class = AlbaranCompraSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AlbaranCompraFilter
    search_fields = ['numero', 'proveedor__nombre']
    ordering_fields = ['fecha', 'numero', 'total']
    ordering = ['-fecha']
    
    def get_queryset(self):
        return AlbaranCompra.objects.all()


class AlbaranCompraItemViewSet(viewsets.ModelViewSet):
    """ViewSet para items de albaranes de compra"""
    serializer_class = AlbaranCompraItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['albaran', 'articulo']
    
    def get_queryset(self):
        return AlbaranCompraItem.objects.all()


class FacturaCompraViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de facturas de compra"""
    serializer_class = FacturaCompraSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = FacturaCompraFilter
    search_fields = ['numero', 'numero_factura_proveedor', 'proveedor__nombre']
    ordering_fields = ['fecha', 'fecha_vencimiento', 'total']
    ordering = ['-fecha']
    
    def get_queryset(self):
        return FacturaCompra.objects.all()
    
    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Lista facturas vencidas"""
        facturas_vencidas = self.get_queryset().filter(
            fecha_vencimiento__lt=timezone.now().date(),
            estado='pendiente'
        ).order_by('fecha_vencimiento')
        
        serializer = self.get_serializer(facturas_vencidas, many=True)
        return Response(serializer.data)


class FacturaCompraItemViewSet(viewsets.ModelViewSet):
    """ViewSet para items de facturas de compra"""
    serializer_class = FacturaCompraItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['factura', 'articulo']
    
    def get_queryset(self):
        return FacturaCompraItem.objects.all()


class CuentaPorPagarViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de cuentas por pagar"""
    serializer_class = CuentaPorPagarSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CuentaPorPagarFilter
    search_fields = ['proveedor__nombre']
    ordering_fields = ['fecha_vencimiento', 'monto_pendiente']
    ordering = ['fecha_vencimiento']
    
    def get_queryset(self):
        return CuentaPorPagar.objects.all()
    
    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen de cuentas por pagar"""
        queryset = self.filter_queryset(self.get_queryset())
        
        resumen = {
            'total_cuentas': queryset.count(),
            'monto_total_pendiente': queryset.aggregate(
                total=Sum('monto_pendiente')
            )['total'] or 0,
            'cuentas_vencidas': queryset.filter(
                fecha_vencimiento__lt=timezone.now().date(),
                estado='pendiente'
            ).count()
        }
        
        return Response(resumen)
