from datetime import date, timedelta
from decimal import Decimal
from django.db import models
from django.db.models import Sum, Count, Avg, Max, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import CajaSession, MovimientoCaja, CuadreCaja
from .serializers import (
    CajaSessionSerializer, CajaSessionCreateSerializer,
    MovimientoCajaSerializer, MovimientoCajaCreateSerializer,
    CuadreCajaSerializer, ResumenCajaSerializer,
    CerrarCajaSerializer, EstadisticasCajaSerializer
)
from accounts.permissions import HasEmpresaPermission, IsOwnerOrEmpresaAdmin


class CajaSessionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de sesiones de caja"""
    
    queryset = CajaSession.objects.all()  # Para el router
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    serializer_class = CajaSessionSerializer
    filterset_fields = ['estado', 'usuario']
    search_fields = ['nombre', 'notas_apertura', 'notas_cierre']
    ordering_fields = ['fecha_apertura', 'fecha_cierre']
    ordering = ['-fecha_apertura']
    
    def get_queryset(self):
        return CajaSession.objects.select_related('usuario').prefetch_related('movimientos')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CajaSessionCreateSerializer
        elif self.action == 'cerrar_caja':
            return CerrarCajaSerializer
        return CajaSessionSerializer
    
    def create(self, request, *args, **kwargs):
        """Crear sesión con respuesta usando el serializer completo"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        # Devolver la respuesta con el serializer completo
        response_serializer = CajaSessionSerializer(instance)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def activa(self, request):
        """Obtiene la sesión de caja activa del usuario actual"""
        try:
            sesion_activa = self.get_queryset().get(
                usuario=request.user,
                estado='abierta'
            )
            serializer = self.get_serializer(sesion_activa)
            return Response(serializer.data)
        except CajaSession.DoesNotExist:
            return Response(
                {'detail': 'No hay sesión de caja activa'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def cerrar_caja(self, request, pk=None):
        """Cierra una sesión de caja"""
        caja_session = self.get_object()
        
        # Verificar que la caja esté abierta
        if caja_session.estado != 'abierta':
            return Response(
                {'detail': 'La caja ya está cerrada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que el usuario sea el propietario o tenga permisos
        if caja_session.usuario != request.user and not request.user.is_admin:
            return Response(
                {'detail': 'No tiene permisos para cerrar esta caja'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CerrarCajaSerializer(data=request.data)
        if serializer.is_valid():
            saldo_final = serializer.validated_data['saldo_final']
            notas_cierre = serializer.validated_data.get('notas_cierre', '')
            crear_cuadre = serializer.validated_data.get('crear_cuadre', True)
            
            # Cerrar la caja
            caja_session.cerrar_caja(saldo_final, notas_cierre)
            
            # Crear cuadre automático si se solicita
            if crear_cuadre:
                efectivo_esperado = caja_session.calcular_efectivo_esperado()
                cuadre = CuadreCaja.objects.create(
                    caja_session=caja_session,
                    efectivo_contado=saldo_final,
                    efectivo_esperado=efectivo_esperado
                )
                
                # Incluir datos del cuadre en la respuesta
                cuadre_serializer = CuadreCajaSerializer(cuadre)
                response_data = {
                    'sesion': CajaSessionSerializer(caja_session).data,
                    'cuadre': cuadre_serializer.data
                }
            else:
                response_data = {
                    'sesion': CajaSessionSerializer(caja_session).data
                }
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def resumen(self, request, pk=None):
        """Obtiene resumen completo de una sesión de caja"""
        caja_session = self.get_object()
        
        # Movimientos recientes (últimos 10)
        movimientos_recientes = caja_session.movimientos.all()[:10]
        
        # Estadísticas de la sesión
        movimientos_venta = caja_session.movimientos.filter(tipo='venta')
        
        total_ventas = movimientos_venta.aggregate(
            total=Sum('importe')
        )['total'] or Decimal('0')
        
        total_efectivo = movimientos_venta.filter(
            Q(metodo_pago='efectivo') | Q(metodo_pago='mixto')
        ).aggregate(
            efectivo=Sum(
                models.Case(
                    models.When(metodo_pago='efectivo', then='importe'),
                    models.When(metodo_pago='mixto', then='importe_efectivo'),
                    default=0
                )
            )
        )['efectivo'] or Decimal('0')
        
        total_tarjeta = total_ventas - total_efectivo
        
        numero_transacciones = movimientos_venta.count()
        venta_promedio = total_ventas / numero_transacciones if numero_transacciones > 0 else Decimal('0')
        ticket_mas_alto = movimientos_venta.aggregate(max=Max('importe'))['max'] or Decimal('0')
        
        data = {
            'sesion_activa': caja_session,
            'movimientos_recientes': movimientos_recientes,
            'total_ventas_dia': total_ventas,
            'total_efectivo_dia': total_efectivo,
            'total_tarjeta_dia': total_tarjeta,
            'efectivo_en_caja': caja_session.calcular_efectivo_esperado(),
            'numero_transacciones': numero_transacciones,
            'venta_promedio': venta_promedio,
            'ticket_mas_alto': ticket_mas_alto
        }
        
        serializer = ResumenCajaSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def abrir_nueva(self, request):
        """Abre una nueva sesión de caja verificando que no haya otra activa"""
        # Verificar que no haya sesión activa
        sesion_existente = self.get_queryset().filter(
            usuario=request.user,
            estado='abierta'
        ).first()
        
        if sesion_existente:
            return Response(
                {
                    'detail': 'Ya tiene una sesión de caja activa',
                    'sesion_activa': CajaSessionSerializer(sesion_existente).data
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear nueva sesión
        serializer = CajaSessionCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            nueva_sesion = serializer.save()
            return Response(
                CajaSessionSerializer(nueva_sesion).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MovimientoCajaViewSet(viewsets.ModelViewSet):
    """ViewSet para movimientos de caja"""
    
    queryset = MovimientoCaja.objects.all()  # Para el router
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    serializer_class = MovimientoCajaSerializer
    filterset_fields = ['caja_session', 'tipo', 'metodo_pago']
    search_fields = ['descripcion', 'ticket__numero']
    ordering_fields = ['created_at', 'importe']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return MovimientoCaja.objects.select_related('caja_session', 'ticket')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MovimientoCajaCreateSerializer
        return MovimientoCajaSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por sesión de caja si se especifica
        caja_session_id = self.request.query_params.get('caja_session')
        if caja_session_id:
            queryset = queryset.filter(caja_session_id=caja_session_id)
        
        # Filtrar por tipo de movimiento
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        # Filtrar por método de pago
        metodo_pago = self.request.query_params.get('metodo_pago')
        if metodo_pago:
            queryset = queryset.filter(metodo_pago=metodo_pago)
        
        # Filtrar por fecha
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        
        if fecha_desde:
            queryset = queryset.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(created_at__date__lte=fecha_hasta)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def resumen_dia(self, request):
        """Obtiene resumen de movimientos del día actual"""
        hoy = timezone.now().date()
        
        movimientos_hoy = self.get_queryset().filter(
            created_at__date=hoy
        )
        
        # Totales por tipo
        resumen_tipos = movimientos_hoy.values('tipo').annotate(
            total=Sum('importe'),
            cantidad=Count('id')
        )
        
        # Totales por método de pago
        resumen_pagos = movimientos_hoy.filter(
            tipo='venta'
        ).values('metodo_pago').annotate(
            total=Sum('importe'),
            cantidad=Count('id')
        )
        
        return Response({
            'fecha': hoy,
            'resumen_por_tipo': resumen_tipos,
            'resumen_por_metodo_pago': resumen_pagos,
            'total_movimientos': movimientos_hoy.count()
        })


class CuadreCajaViewSet(viewsets.ModelViewSet):
    """ViewSet para cuadres de caja"""
    
    queryset = CuadreCaja.objects.all()  # Para el router
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    serializer_class = CuadreCajaSerializer
    filterset_fields = ['caja_session', 'created_at']
    search_fields = ['caja_session__nombre', 'caja_session__notas_apertura']
    ordering_fields = ['created_at', 'diferencia']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return CuadreCaja.objects.select_related('caja_session__usuario')
    
    @action(detail=False, methods=['get'])
    def historial(self, request):
        """Obtiene historial de cuadres con estadísticas"""
        # Parámetros de filtrado
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        
        queryset = self.get_queryset()
        
        if fecha_desde:
            queryset = queryset.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(created_at__date__lte=fecha_hasta)
        
        # Estadísticas del período
        stats = queryset.aggregate(
            total_cuadres=Count('id'),
            diferencia_promedio=Avg('diferencia'),
            diferencia_maxima=Max('diferencia'),
            total_ventas_periodo=Sum('total_ventas')
        )
        
        # Cuadres con diferencias significativas (>5€)
        cuadres_con_diferencias = queryset.filter(
            diferencia__gt=5
        ).count()
        
        # Cuadres perfectos (diferencia <= 0.01€)
        cuadres_perfectos = queryset.filter(
            diferencia__lte=0.01,
            diferencia__gte=-0.01
        ).count()
        
        serializer = self.get_serializer(queryset.order_by('-created_at'), many=True)
        
        return Response({
            'cuadres': serializer.data,
            'estadisticas': {
                **stats,
                'cuadres_con_diferencias': cuadres_con_diferencias,
                'cuadres_perfectos': cuadres_perfectos,
                'porcentaje_perfectos': (
                    (cuadres_perfectos / stats['total_cuadres'] * 100) 
                    if stats['total_cuadres'] > 0 else 0
                )
            }
        })


class EstadisticasPOSViewSet(viewsets.ViewSet):
    """ViewSet para estadísticas y reportes del TPV"""
    
    queryset = []  # Para el router
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard principal con estadísticas del TPV"""
        hoy = timezone.now().date()
        hace_7_dias = hoy - timedelta(days=7)
        hace_30_dias = hoy - timedelta(days=30)
        
        # Sesiones de caja
        sesiones_hoy = CajaSession.objects.filter(
            fecha_apertura__date=hoy
        )
        sesiones_activas = sesiones_hoy.filter(estado='abierta')
        
        # Movimientos y ventas
        movimientos_hoy = MovimientoCaja.objects.filter(
            created_at__date=hoy,
            tipo='venta'
        )
        
        movimientos_7d = MovimientoCaja.objects.filter(
            created_at__date__gte=hace_7_dias,
            tipo='venta'
        )
        
        movimientos_30d = MovimientoCaja.objects.filter(
            created_at__date__gte=hace_30_dias,
            tipo='venta'
        )
        
        # Estadísticas del día
        ventas_hoy = movimientos_hoy.aggregate(
            total=Sum('importe'),
            cantidad=Count('id'),
            promedio=Avg('importe')
        )
        
        # Comparativa 7 días
        ventas_7d = movimientos_7d.aggregate(
            total=Sum('importe'),
            cantidad=Count('id')
        )
        
        # Comparativa 30 días
        ventas_30d = movimientos_30d.aggregate(
            total=Sum('importe'),
            cantidad=Count('id')
        )
        
        # Métodos de pago hoy
        metodos_pago_hoy = movimientos_hoy.values('metodo_pago').annotate(
            total=Sum('importe'),
            cantidad=Count('id')
        )
        
        # Top usuarios por ventas (últimos 7 días)
        top_usuarios = movimientos_7d.values(
            'caja_session__usuario__username',
            'caja_session__usuario__first_name',
            'caja_session__usuario__last_name'
        ).annotate(
            total_ventas=Sum('importe'),
            num_transacciones=Count('id')
        ).order_by('-total_ventas')[:5]
        
        return Response({
            'fecha': hoy,
            'sesiones_activas': sesiones_activas.count(),
            'total_sesiones_hoy': sesiones_hoy.count(),
            'ventas': {
                'hoy': ventas_hoy,
                'ultimos_7_dias': ventas_7d,
                'ultimos_30_dias': ventas_30d
            },
            'metodos_pago_hoy': metodos_pago_hoy,
            'top_usuarios_7d': top_usuarios
        })
    
    @action(detail=False, methods=['post'])
    def reporte_periodo(self, request):
        """Genera reporte detallado por período"""
        serializer = EstadisticasCajaSerializer(data=request.data)
        
        if serializer.is_valid():
            fecha_inicio = serializer.validated_data['fecha_inicio']
            fecha_fin = serializer.validated_data['fecha_fin']
            
            # Sesiones del período
            sesiones = CajaSession.objects.filter(
                fecha_apertura__date__gte=fecha_inicio,
                fecha_apertura__date__lte=fecha_fin
            )
            
            # Movimientos del período
            movimientos = MovimientoCaja.objects.filter(
                created_at__date__gte=fecha_inicio,
                created_at__date__lte=fecha_fin,
                tipo='venta'
            )
            
            # Cálculos principales
            total_sesiones = sesiones.count()
            total_ventas = movimientos.aggregate(Sum('importe'))['importe__sum'] or Decimal('0')
            
            # Efectivo vs Tarjeta
            efectivo = movimientos.filter(
                Q(metodo_pago='efectivo') | Q(metodo_pago='mixto')
            ).aggregate(
                total=Sum(
                    models.Case(
                        models.When(metodo_pago='efectivo', then='importe'),
                        models.When(metodo_pago='mixto', then='importe_efectivo'),
                        default=0
                    )
                )
            )['total'] or Decimal('0')
            
            tarjeta = total_ventas - efectivo
            
            # Promedios
            promedio_ventas_sesion = total_ventas / total_sesiones if total_sesiones > 0 else Decimal('0')
            promedio_ticket = movimientos.aggregate(Avg('importe'))['importe__avg'] or Decimal('0')
            
            # Usuarios más activos
            usuarios_activos = movimientos.values(
                'caja_session__usuario__username'
            ).annotate(
                total_ventas=Sum('importe'),
                num_transacciones=Count('id')
            ).order_by('-total_ventas')[:10]
            
            # Distribución por método de pago
            distribucion_pagos = movimientos.values('metodo_pago').annotate(
                total=Sum('importe'),
                cantidad=Count('id'),
                porcentaje=Sum('importe') * 100 / total_ventas if total_ventas > 0 else 0
            )
            
            response_data = {
                'fecha_inicio': fecha_inicio,
                'fecha_fin': fecha_fin,
                'total_sesiones': total_sesiones,
                'total_ventas': total_ventas,
                'total_efectivo': efectivo,
                'total_tarjeta': tarjeta,
                'promedio_ventas_sesion': promedio_ventas_sesion,
                'promedio_ticket': promedio_ticket,
                'usuarios_mas_activos': usuarios_activos,
                'distribucion_pagos': distribucion_pagos
            }
            
            return Response(response_data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
