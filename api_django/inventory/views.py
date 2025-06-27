from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, F, Count, Case, When, IntegerField, DecimalField
from django.db import transaction
from django.utils import timezone
from decimal import Decimal

from .models import (
    Almacen, ArticuloStock, MovimientoStock, 
    TransferenciaStock, TransferenciaStockItem
)
from .serializers import (
    AlmacenSerializer, ArticuloStockSerializer, MovimientoStockSerializer,
    MovimientoStockCreateSerializer, TransferenciaStockSerializer,
    TransferenciaStockItemSerializer, StockResumenSerializer,
    AlertaStockSerializer, AjusteStockSerializer
)
from products.models import Articulo
from accounts.permissions import HasEmpresaPermission


class AlmacenViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de almacenes"""
    
    serializer_class = AlmacenSerializer
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activo', 'es_principal']
    search_fields = ['nombre', 'codigo', 'responsable']
    ordering_fields = ['nombre', 'codigo', 'created_at']
    ordering = ['nombre']
    
    def get_queryset(self):
        return Almacen.objects.all()
    
    @action(detail=True, methods=['get'])
    def stock(self, request, pk=None):
        """Obtiene el stock de todos los artículos en el almacén"""
        almacen = self.get_object()
        stock_items = ArticuloStock.objects.filter(almacen=almacen)
        
        # Filtros opcionales
        buscar = request.query_params.get('search', '')
        if buscar:
            stock_items = stock_items.filter(
                Q(articulo__nombre__icontains=buscar) |
                Q(articulo__codigo__icontains=buscar)
            )
        
        solo_con_stock = request.query_params.get('con_stock', 'false').lower() == 'true'
        if solo_con_stock:
            stock_items = stock_items.filter(stock_actual__gt=0)
        
        solo_reposicion = request.query_params.get('reposicion', 'false').lower() == 'true'
        if solo_reposicion:
            stock_items = stock_items.filter(stock_actual__lte=F('stock_minimo'))
        
        serializer = ArticuloStockSerializer(stock_items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def movimientos(self, request, pk=None):
        """Obtiene los movimientos de stock del almacén"""
        almacen = self.get_object()
        movimientos = MovimientoStock.objects.filter(
            Q(almacen=almacen) | Q(almacen_destino=almacen)
        ).order_by('-fecha')
        
        # Filtro por fechas
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        
        if fecha_desde:
            movimientos = movimientos.filter(fecha__date__gte=fecha_desde)
        if fecha_hasta:
            movimientos = movimientos.filter(fecha__date__lte=fecha_hasta)
        
        # Filtro por tipo
        tipo = request.query_params.get('tipo')
        if tipo:
            movimientos = movimientos.filter(tipo=tipo)
        
        # Paginación
        page = self.paginate_queryset(movimientos)
        if page is not None:
            serializer = MovimientoStockSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = MovimientoStockSerializer(movimientos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def principal(self, request):
        """Obtiene el almacén principal de la empresa"""
        try:
            almacen_principal = Almacen.objects.get(es_principal=True)
            serializer = self.get_serializer(almacen_principal)
            return Response(serializer.data)
        except Almacen.DoesNotExist:
            return Response(
                {'detail': 'No hay almacén principal configurado'},
                status=status.HTTP_404_NOT_FOUND
            )


class ArticuloStockViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de stock por artículo"""
    
    serializer_class = ArticuloStockSerializer
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['almacen', 'articulo']
    search_fields = ['articulo__nombre', 'articulo__codigo', 'almacen__nombre', 'almacen__codigo']
    ordering_fields = ['stock_actual', 'stock_minimo', 'created_at']
    ordering = ['articulo__nombre']
    
    def get_queryset(self):
        return ArticuloStock.objects.select_related('articulo', 'almacen')
    
    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Obtiene resumen de stock por artículo (suma de todos los almacenes)"""
        # Obtener todos los artículos con su stock total
        articulos_stock = ArticuloStock.objects.values(
            'articulo__id', 'articulo__nombre', 'articulo__codigo'
        ).annotate(
            stock_total=Sum('stock_actual'),
            stock_reservado_total=Sum('stock_reservado'),
            stock_disponible_total=Sum(F('stock_actual') - F('stock_reservado')),
            valor_total=Sum(F('stock_actual') * F('articulo__precio_venta'))
        ).filter(stock_total__gt=0)
        
        # Agregar detalle por almacén
        resumen = []
        for item in articulos_stock:
            almacenes_detail = ArticuloStock.objects.filter(
                articulo_id=item['articulo__id'],
                stock_actual__gt=0
            ).values(
                'almacen__id', 'almacen__nombre', 'almacen__codigo',
                'stock_actual', 'stock_reservado', 'stock_minimo'
            ).annotate(
                stock_disponible=F('stock_actual') - F('stock_reservado')
            )
            
            resumen.append({
                'articulo_id': item['articulo__id'],
                'articulo_nombre': item['articulo__nombre'],
                'articulo_codigo': item['articulo__codigo'],
                'stock_total': item['stock_total'],
                'stock_reservado_total': item['stock_reservado_total'],
                'stock_disponible_total': item['stock_disponible_total'],
                'valor_total': item['valor_total'] or Decimal('0.00'),
                'almacenes': list(almacenes_detail)
            })
        
        serializer = StockResumenSerializer(resumen, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def alertas(self, request):
        """Obtiene alertas de stock bajo"""
        stock_bajo = ArticuloStock.objects.filter(
            stock_actual__lte=F('stock_minimo'),
            stock_minimo__gt=0
        ).select_related('articulo', 'almacen')
        
        alertas = []
        for stock in stock_bajo:
            diferencia = stock.stock_minimo - stock.stock_actual
            
            # Determinar urgencia
            if stock.stock_actual == 0:
                urgencia = 'critica'
            elif diferencia >= stock.stock_minimo * 0.5:
                urgencia = 'alta'
            else:
                urgencia = 'media'
            
            alertas.append({
                'articulo_id': stock.articulo.id,
                'articulo_nombre': stock.articulo.nombre,
                'articulo_codigo': stock.articulo.codigo,
                'almacen_id': stock.almacen.id,
                'almacen_nombre': stock.almacen.nombre,
                'almacen_codigo': stock.almacen.codigo,
                'stock_actual': stock.stock_actual,
                'stock_minimo': stock.stock_minimo,
                'diferencia': diferencia,
                'urgencia': urgencia
            })
        
        # Ordenar por urgencia
        orden_urgencia = {'critica': 0, 'alta': 1, 'media': 2}
        alertas.sort(key=lambda x: orden_urgencia[x['urgencia']])
        
        serializer = AlertaStockSerializer(alertas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def ajuste_masivo(self, request):
        """Realizar ajustes masivos de stock"""
        serializer = AjusteStockSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            resultado = serializer.save()
            return Response(resultado, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MovimientoStockViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para consulta de movimientos de stock"""
    
    serializer_class = MovimientoStockSerializer
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'motivo', 'almacen', 'articulo', 'usuario']
    search_fields = ['articulo__nombre', 'articulo__codigo', 'almacen__nombre', 'observaciones']
    ordering_fields = ['fecha', 'cantidad', 'stock_posterior']
    ordering = ['-fecha']
    
    def get_queryset(self):
        return MovimientoStock.objects.select_related(
            'articulo', 'almacen', 'almacen_destino', 'usuario'
        )
    
    @action(detail=False, methods=['post'])
    def crear_movimiento(self, request):
        """Crear un nuevo movimiento de stock"""
        serializer = MovimientoStockCreateSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            movimiento = serializer.save()
            response_serializer = MovimientoStockSerializer(movimiento)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtiene estadísticas de movimientos"""
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        
        movimientos = self.get_queryset()
        
        if fecha_desde:
            movimientos = movimientos.filter(fecha__date__gte=fecha_desde)
        if fecha_hasta:
            movimientos = movimientos.filter(fecha__date__lte=fecha_hasta)
        
        # Estadísticas por tipo
        por_tipo = movimientos.values('tipo').annotate(
            total=Count('id'),
            cantidad_total=Sum('cantidad')
        ).order_by('tipo')
        
        # Estadísticas por almacén
        por_almacen = movimientos.values('almacen__nombre', 'almacen__codigo').annotate(
            total=Count('id'),
            entradas=Count(Case(When(cantidad__gt=0, then=1), output_field=IntegerField())),
            salidas=Count(Case(When(cantidad__lt=0, then=1), output_field=IntegerField()))
        ).order_by('almacen__nombre')
        
        # Valor de movimientos
        valor_total = movimientos.aggregate(
            valor_entradas=Sum(
                Case(
                    When(cantidad__gt=0, then=F('cantidad') * F('precio_unitario')),
                    default=0,
                    output_field=DecimalField()
                )
            ),
            valor_salidas=Sum(
                Case(
                    When(cantidad__lt=0, then=F('cantidad') * F('precio_unitario') * -1),
                    default=0,
                    output_field=DecimalField()
                )
            )
        )
        
        return Response({
            'total_movimientos': movimientos.count(),
            'por_tipo': list(por_tipo),
            'por_almacen': list(por_almacen),
            'valor_entradas': valor_total['valor_entradas'] or Decimal('0.00'),
            'valor_salidas': valor_total['valor_salidas'] or Decimal('0.00')
        })


class TransferenciaStockViewSet(viewsets.ModelViewSet):
    """ViewSet para transferencias de stock"""
    
    serializer_class = TransferenciaStockSerializer
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'almacen_origen', 'almacen_destino']
    search_fields = ['numero', 'motivo', 'observaciones']
    ordering_fields = ['fecha_solicitud', 'fecha_envio', 'fecha_recepcion']
    ordering = ['-fecha_solicitud']
    
    def get_queryset(self):
        return TransferenciaStock.objects.select_related(
            'almacen_origen', 'almacen_destino', 
            'solicitado_por', 'enviado_por', 'recibido_por'
        ).prefetch_related('items__articulo')
    
    def perform_create(self, serializer):
        """Asignar usuario que solicita"""
        serializer.save(solicitado_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def agregar_item(self, request, pk=None):
        """Agregar item a la transferencia"""
        transferencia = self.get_object()
        
        if transferencia.estado != 'pendiente':
            return Response(
                {'detail': 'Solo se pueden agregar items a transferencias pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = request.data.copy()
        data['transferencia'] = transferencia.id
        
        serializer = TransferenciaStockItemSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        """Marcar transferencia como enviada"""
        transferencia = self.get_object()
        
        if not transferencia.puede_enviar():
            return Response(
                {'detail': 'La transferencia no puede ser enviada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Verificar stock disponible para todos los items
            for item in transferencia.items.all():
                try:
                    stock = ArticuloStock.objects.get(
                        articulo=item.articulo,
                        almacen=transferencia.almacen_origen
                    )
                    if stock.stock_disponible < item.cantidad_solicitada:
                        return Response(
                            {
                                'detail': f'Stock insuficiente para {item.articulo.nombre}. '
                                         f'Disponible: {stock.stock_disponible}, Solicitado: {item.cantidad_solicitada}'
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except ArticuloStock.DoesNotExist:
                    return Response(
                        {'detail': f'No hay stock para {item.articulo.nombre} en {transferencia.almacen_origen.nombre}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Crear movimientos de salida y reservar stock
            for item in transferencia.items.all():
                stock = ArticuloStock.objects.get(
                    articulo=item.articulo,
                    almacen=transferencia.almacen_origen
                )
                
                # Reservar stock
                stock.stock_reservado += item.cantidad_solicitada
                stock.save()
                
                # Crear movimiento de salida
                MovimientoStock.objects.create(
                    articulo=item.articulo,
                    almacen=transferencia.almacen_origen,
                    tipo='transferencia_salida',
                    motivo='transferencia',
                    cantidad=-item.cantidad_solicitada,
                    stock_anterior=stock.stock_actual,
                    stock_posterior=stock.stock_actual - item.cantidad_solicitada,
                    observaciones=f'Transferencia {transferencia.numero} hacia {transferencia.almacen_destino.nombre}',
                    almacen_destino=transferencia.almacen_destino,
                    usuario=request.user
                )
                
                # Actualizar stock actual
                stock.stock_actual -= item.cantidad_solicitada
                stock.stock_reservado -= item.cantidad_solicitada
                stock.save()
                
                # Actualizar cantidad enviada
                item.cantidad_enviada = item.cantidad_solicitada
                item.save()
            
            # Actualizar estado de transferencia
            transferencia.estado = 'en_transito'
            transferencia.fecha_envio = timezone.now()
            transferencia.enviado_por = request.user
            transferencia.save()
        
        serializer = self.get_serializer(transferencia)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def recibir(self, request, pk=None):
        """Marcar transferencia como recibida"""
        transferencia = self.get_object()
        
        if not transferencia.puede_recibir():
            return Response(
                {'detail': 'La transferencia no puede ser recibida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cantidades_recibidas = request.data.get('cantidades', {})
        
        with transaction.atomic():
            # Crear movimientos de entrada
            for item in transferencia.items.all():
                cantidad_recibida = cantidades_recibidas.get(
                    str(item.id), 
                    item.cantidad_enviada
                )
                
                if cantidad_recibida > 0:
                    # Obtener o crear stock en destino
                    stock_destino, created = ArticuloStock.objects.get_or_create(
                        articulo=item.articulo,
                        almacen=transferencia.almacen_destino,
                        defaults={'stock_actual': 0}
                    )
                    
                    # Crear movimiento de entrada
                    MovimientoStock.objects.create(
                        articulo=item.articulo,
                        almacen=transferencia.almacen_destino,
                        tipo='transferencia_entrada',
                        motivo='transferencia',
                        cantidad=cantidad_recibida,
                        stock_anterior=stock_destino.stock_actual,
                        stock_posterior=stock_destino.stock_actual + cantidad_recibida,
                        observaciones=f'Transferencia {transferencia.numero} desde {transferencia.almacen_origen.nombre}',
                        almacen_destino=transferencia.almacen_origen,
                        usuario=request.user
                    )
                    
                    # Actualizar stock
                    stock_destino.stock_actual += cantidad_recibida
                    stock_destino.save()
                
                # Actualizar cantidad recibida
                item.cantidad_recibida = cantidad_recibida
                item.save()
            
            # Actualizar estado de transferencia
            transferencia.estado = 'completada'
            transferencia.fecha_recepcion = timezone.now()
            transferencia.recibido_por = request.user
            transferencia.save()
        
        serializer = self.get_serializer(transferencia)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar transferencia"""
        transferencia = self.get_object()
        
        if not transferencia.puede_cancelar():
            return Response(
                {'detail': 'La transferencia no puede ser cancelada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Si está en tránsito, liberar stock reservado
            if transferencia.estado == 'en_transito':
                for item in transferencia.items.all():
                    if item.cantidad_enviada > item.cantidad_recibida:
                        # Devolver stock al almacén origen
                        stock_origen = ArticuloStock.objects.get(
                            articulo=item.articulo,
                            almacen=transferencia.almacen_origen
                        )
                        
                        cantidad_devolver = item.cantidad_enviada - item.cantidad_recibida
                        
                        # Crear movimiento de entrada (devolución)
                        MovimientoStock.objects.create(
                            articulo=item.articulo,
                            almacen=transferencia.almacen_origen,
                            tipo='entrada',
                            motivo='devolucion_proveedor',
                            cantidad=cantidad_devolver,
                            stock_anterior=stock_origen.stock_actual,
                            stock_posterior=stock_origen.stock_actual + cantidad_devolver,
                            observaciones=f'Cancelación de transferencia {transferencia.numero}',
                            usuario=request.user
                        )
                        
                        # Actualizar stock
                        stock_origen.stock_actual += cantidad_devolver
                        stock_origen.save()
            
            # Cambiar estado
            transferencia.estado = 'cancelada'
            transferencia.save()
        
        serializer = self.get_serializer(transferencia)
        return Response(serializer.data)
