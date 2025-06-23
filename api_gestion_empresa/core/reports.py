from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from sales.models import Presupuesto, Pedido, Albaran, Ticket, Factura
from products.models import Articulo


class ReportsViewSet(viewsets.ViewSet):
    """ViewSet especializado para reportes y estadísticas"""
    
    @action(detail=False, methods=['get'])
    def ventas_resumen(self, request):
        """Resumen de ventas por tipo de documento"""
        # Obtener parámetros de fecha
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        # Filtros de fecha opcionales
        filters = {}
        if fecha_inicio:
            filters['fecha__gte'] = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        if fecha_fin:
            filters['fecha__lte'] = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        
        # Estadísticas por tipo de documento
        presupuestos_stats = Presupuesto.objects.filter(**filters).aggregate(
            count=Count('id'),
            total=Sum('total') or 0
        )
        
        pedidos_stats = Pedido.objects.filter(**filters).aggregate(
            count=Count('id'),
            total=Sum('total') or 0
        )
        
        albaranes_stats = Albaran.objects.filter(**filters).aggregate(
            count=Count('id'),
            total=Sum('total') or 0
        )
        
        tickets_stats = Ticket.objects.filter(**filters).aggregate(
            count=Count('id'),
            total=Sum('total') or 0
        )
        
        facturas_stats = Factura.objects.filter(**filters).aggregate(
            count=Count('id'),
            total=Sum('total') or 0
        )
        
        return Response({
            'periodo': {
                'fecha_inicio': fecha_inicio,
                'fecha_fin': fecha_fin
            },
            'resumen': {
                'presupuestos': presupuestos_stats,
                'pedidos': pedidos_stats,
                'albaranes': albaranes_stats,
                'tickets': tickets_stats,
                'facturas': facturas_stats
            }
        })
    
    @action(detail=False, methods=['get'])
    def productos_mas_vendidos(self, request):
        """Top de productos más vendidos"""
        from django.db.models import F
        from sales.models import PedidoItem, TicketItem, AlbaranItem
        
        # Parámetros
        limit = int(request.query_params.get('limit', 10))
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        # Filtros de fecha para documentos padre
        fecha_filters = {}
        if fecha_inicio:
            fecha_filters['fecha__gte'] = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        if fecha_fin:
            fecha_filters['fecha__lte'] = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        
        # Unir datos de todos los tipos de documentos
        items_data = []
        
        # Items de pedidos
        pedido_filters = {'pedido__' + k: v for k, v in fecha_filters.items()}
        pedido_items = PedidoItem.objects.filter(**pedido_filters).values(
            'articulo__id', 'articulo__nombre'
        ).annotate(
            total_cantidad=Sum('cantidad'),
            total_importe=Sum(F('cantidad') * F('precio_unitario'))
        )
        
        # Items de tickets
        ticket_filters = {'ticket__' + k: v for k, v in fecha_filters.items()}
        ticket_items = TicketItem.objects.filter(**ticket_filters).values(
            'articulo__id', 'articulo__nombre'
        ).annotate(
            total_cantidad=Sum('cantidad'),
            total_importe=Sum(F('cantidad') * F('precio_unitario'))
        )
        
        # Items de albaranes
        albaran_filters = {'albaran__' + k: v for k, v in fecha_filters.items()}
        albaran_items = AlbaranItem.objects.filter(**albaran_filters).values(
            'articulo__id', 'articulo__nombre'
        ).annotate(
            total_cantidad=Sum('cantidad'),
            total_importe=Sum(F('cantidad') * F('precio_unitario'))
        )
        
        # Combinar y agrupar por artículo
        productos_dict = {}
        for items_queryset in [pedido_items, ticket_items, albaran_items]:
            for item in items_queryset:
                articulo_id = item['articulo__id']
                if articulo_id not in productos_dict:
                    productos_dict[articulo_id] = {
                        'articulo_id': articulo_id,
                        'articulo_nombre': item['articulo__nombre'],
                        'total_cantidad': 0,
                        'total_importe': 0
                    }
                productos_dict[articulo_id]['total_cantidad'] += item['total_cantidad'] or 0
                productos_dict[articulo_id]['total_importe'] += float(item['total_importe'] or 0)
        
        # Ordenar por cantidad y limitar
        productos_top = sorted(
            productos_dict.values(),
            key=lambda x: x['total_cantidad'],
            reverse=True
        )[:limit]
        
        return Response({
            'periodo': {
                'fecha_inicio': fecha_inicio,
                'fecha_fin': fecha_fin
            },
            'productos_mas_vendidos': productos_top
        })
    
    @action(detail=False, methods=['get'])
    def stock_bajo(self, request):
        """Productos con stock bajo"""
        limite_stock = int(request.query_params.get('limite', 10))
        
        productos_stock_bajo = Articulo.objects.filter(
            stock__lte=limite_stock
        ).order_by('stock').values(
            'id', 'nombre', 'stock', 'categoria__nombre', 'marca__nombre'
        )
        
        return Response({
            'limite_stock': limite_stock,
            'productos_stock_bajo': list(productos_stock_bajo)
        })
    
    @action(detail=False, methods=['get'])
    def facturacion_mensual(self, request):
        """Facturación mensual del último año"""
        from django.db.models.functions import TruncMonth
        
        # Último año
        fecha_limite = timezone.now().date() - timedelta(days=365)
        
        facturacion_mensual = Factura.objects.filter(
            fecha__gte=fecha_limite
        ).annotate(
            mes=TruncMonth('fecha')
        ).values('mes').annotate(
            total_facturas=Count('id'),
            total_importe=Sum('total')
        ).order_by('mes')
        
        return Response({
            'periodo': f'Últimos 12 meses desde {fecha_limite}',
            'facturacion_mensual': list(facturacion_mensual)
        })
