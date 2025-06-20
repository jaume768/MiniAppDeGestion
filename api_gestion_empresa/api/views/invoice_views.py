"""
ViewSet para gestión de facturas con generación de PDFs y creación desde otros documentos.
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import Factura, Pedido, PedidoItem, Presupuesto, Albaran, Ticket
from ..serializers import FacturaSerializer
from .utils import PDFGenerator


class FacturaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de facturas."""
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pdf_generator = PDFGenerator()
    
    @action(detail=True, methods=['get'], url_path='generar-pdf')
    def generar_pdf(self, request, pk=None):
        """Generar un PDF para la factura."""
        try:
            factura = self.get_object()
            return self.pdf_generator.generar_factura_pdf(factura)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=False, methods=['post'])
    def crear_desde_pedido(self, request):
        """Crear una factura a partir de un pedido existente."""
        pedido_id = request.data.get('pedido_id')
        
        if not pedido_id:
            return Response({'error': 'El ID del pedido es requerido'}, status=400)
            
        try:
            pedido = Pedido.objects.get(id=pedido_id)
            
            # Crear la factura a partir del pedido
            factura = Factura.objects.create(
                pedido=pedido,
                total=pedido.total
            )
            
            serializer = self.get_serializer(factura)
            return Response(serializer.data, status=201)
            
        except Pedido.DoesNotExist:
            return Response({'error': 'El pedido no existe'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
    
    @action(detail=False, methods=['post'])
    def crear_desde_presupuesto(self, request):
        """Crear una factura a partir de un presupuesto existente."""
        presupuesto_id = request.data.get('presupuesto_id')
        
        if not presupuesto_id:
            return Response({'error': 'El ID del presupuesto es requerido'}, status=400)
            
        try:
            presupuesto = Presupuesto.objects.get(id=presupuesto_id)
            
            # Primero, creamos un pedido a partir del presupuesto
            pedido = Pedido.objects.create(
                cliente=presupuesto.cliente,
                total=presupuesto.total
            )
            
            # Copiamos los items del presupuesto al pedido
            for item in presupuesto.items.all():
                PedidoItem.objects.create(
                    pedido=pedido,
                    articulo=item.articulo,
                    cantidad=item.cantidad,
                    precio_unitario=item.precio_unitario
                )
            
            # Creamos la factura a partir del pedido
            factura = Factura.objects.create(
                pedido=pedido,
                total=pedido.total
            )
            
            serializer = self.get_serializer(factura)
            return Response(serializer.data, status=201)
            
        except Presupuesto.DoesNotExist:
            return Response({'error': 'El presupuesto no existe'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['post'])
    def crear_desde_albaran(self, request):
        """Crear una factura a partir de un albaran existente."""
        albaran_id = request.data.get('albaran_id')
        if not albaran_id:
            return Response({'error': 'El ID del albaran es requerido'}, status=400)
        try:
            albaran = Albaran.objects.get(id=albaran_id)
            factura = Factura.objects.create(
                albaran=albaran,
                total=albaran.total
            )
            serializer = self.get_serializer(factura)
            return Response(serializer.data, status=201)
        except Albaran.DoesNotExist:
            return Response({'error': 'El albaran no existe'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['post'])
    def crear_desde_ticket(self, request):
        """Crear una factura a partir de un ticket existente."""
        ticket_id = request.data.get('ticket_id')
        if not ticket_id:
            return Response({'error': 'El ID del ticket es requerido'}, status=400)
        try:
            ticket = Ticket.objects.get(id=ticket_id)
            factura = Factura.objects.create(
                ticket=ticket,
                total=ticket.total
            )
            serializer = self.get_serializer(factura)
            return Response(serializer.data, status=201)
        except Ticket.DoesNotExist:
            return Response({'error': 'El ticket no existe'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
