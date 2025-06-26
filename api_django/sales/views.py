from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from core.mixins import ReadOnlyIfInvoicedMixin, DocumentConversionMixin
from core.pdf_utils import generate_document_pdf
from .models import (
    Presupuesto, Pedido, Albaran, Ticket, Factura
)
from .serializers import (
    PresupuestoSerializer, PedidoSerializer, AlbaranSerializer, 
    TicketSerializer, FacturaSerializer
)


class PresupuestoViewSet(ReadOnlyIfInvoicedMixin, DocumentConversionMixin, viewsets.ModelViewSet):
    """ViewSet para gestión de presupuestos"""
    queryset = Presupuesto.objects.all()  # Para el router
    serializer_class = PresupuestoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Presupuesto.objects.all()
    
    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        """Genera y descarga PDF del presupuesto"""
        presupuesto = self.get_object()
        return generate_document_pdf(presupuesto, download=True)
    
    @action(detail=True, methods=['get'])
    def ver_pdf(self, request, pk=None):
        """Visualiza PDF del presupuesto en el navegador"""
        presupuesto = self.get_object()
        return generate_document_pdf(presupuesto, download=False)


class PedidoViewSet(ReadOnlyIfInvoicedMixin, DocumentConversionMixin, viewsets.ModelViewSet):
    """ViewSet para gestión de pedidos"""
    queryset = Pedido.objects.all()  # Para el router
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Pedido.objects.all()
    
    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        """Genera y descarga PDF del pedido"""
        pedido = self.get_object()
        return generate_document_pdf(pedido, download=True)
    
    @action(detail=True, methods=['get'])
    def ver_pdf(self, request, pk=None):
        """Visualiza PDF del pedido en el navegador"""
        pedido = self.get_object()
        return generate_document_pdf(pedido, download=False)


class AlbaranViewSet(ReadOnlyIfInvoicedMixin, DocumentConversionMixin, viewsets.ModelViewSet):
    """ViewSet para gestión de albaranes"""
    queryset = Albaran.objects.all()  # Para el router
    serializer_class = AlbaranSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Albaran.objects.all()
    
    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        """Genera y descarga PDF del albarán"""
        albaran = self.get_object()
        return generate_document_pdf(albaran, download=True)
    
    @action(detail=True, methods=['get'])
    def ver_pdf(self, request, pk=None):
        """Visualiza PDF del albarán en el navegador"""
        albaran = self.get_object()
        return generate_document_pdf(albaran, download=False)


class TicketViewSet(ReadOnlyIfInvoicedMixin, DocumentConversionMixin, viewsets.ModelViewSet):
    """ViewSet para gestión de tickets"""
    queryset = Ticket.objects.all()  # Para el router
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Ticket.objects.all()
    
    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        """Genera y descarga PDF del ticket"""
        ticket = self.get_object()
        return generate_document_pdf(ticket, download=True)
    
    @action(detail=True, methods=['get'])
    def ver_pdf(self, request, pk=None):
        """Visualiza PDF del ticket en el navegador"""
        ticket = self.get_object()
        return generate_document_pdf(ticket, download=False)


class FacturaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de facturas"""
    queryset = Factura.objects.all()  # Para el router
    serializer_class = FacturaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Factura.objects.all()
    
    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        """Genera y descarga PDF de la factura"""
        factura = self.get_object()
        return generate_document_pdf(factura, download=True)
    
    @action(detail=True, methods=['get'])
    def ver_pdf(self, request, pk=None):
        """Visualiza PDF de la factura en el navegador"""
        factura = self.get_object()
        return generate_document_pdf(factura, download=False)
    
    @action(detail=False, methods=['post'])
    def crear_desde_documento(self, request):
        """Crea factura desde presupuesto, pedido, albarán o ticket"""
        documento_tipo = request.data.get('documento_tipo')  # 'presupuesto', 'pedido', 'albaran', 'ticket'
        documento_id = request.data.get('documento_id')
        
        if not documento_tipo or not documento_id:
            return Response(
                {'error': 'documento_tipo y documento_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mapear tipos de documento a modelos
        documento_models = {
            'presupuesto': Presupuesto,
            'pedido': Pedido,
            'albaran': Albaran,
            'ticket': Ticket
        }
        
        if documento_tipo not in documento_models:
            return Response(
                {'error': 'tipo de documento no válido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            documento = documento_models[documento_tipo].objects.get(id=documento_id)
        except documento_models[documento_tipo].DoesNotExist:
            return Response(
                {'error': f'{documento_tipo} no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar si ya está facturado
        if documento.is_facturado:
            return Response(
                {'error': f'{documento_tipo} ya está facturado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear factura
        factura_data = {
            documento_tipo: documento,
            'subtotal': documento.subtotal,
            'iva': documento.iva,
            'total': documento.total
        }
        
        factura = Factura.objects.create(**factura_data)
        serializer = self.get_serializer(factura)
        
        return Response({
            'message': f'Factura creada desde {documento_tipo} exitosamente',
            'factura': serializer.data
        }, status=status.HTTP_201_CREATED)
