import django_filters
from django.db.models import Q
from django.utils import timezone
from .models import PedidoCompra, AlbaranCompra, FacturaCompra, CuentaPorPagar


class PedidoCompraFilter(django_filters.FilterSet):
    """Filtros para pedidos de compra"""
    
    # Filtros por fecha
    fecha_desde = django_filters.DateFilter(field_name='fecha', lookup_expr='gte')
    fecha_hasta = django_filters.DateFilter(field_name='fecha', lookup_expr='lte')
    fecha_esperada_desde = django_filters.DateFilter(field_name='fecha_esperada', lookup_expr='gte')
    fecha_esperada_hasta = django_filters.DateFilter(field_name='fecha_esperada', lookup_expr='lte')
    
    # Filtros por estado
    estado = django_filters.MultipleChoiceFilter(
        choices=PedidoCompra.ESTADO_CHOICES,
        field_name='estado'
    )
    
    # Filtros por proveedor
    proveedor = django_filters.NumberFilter(field_name='proveedor__id')
    proveedor_nombre = django_filters.CharFilter(
        field_name='proveedor__nombre',
        lookup_expr='icontains'
    )
    
    # Filtros por almacén
    almacen = django_filters.NumberFilter(field_name='almacen_destino__id')
    
    # Filtros por números
    numero = django_filters.CharFilter(field_name='numero', lookup_expr='icontains')
    referencia_proveedor = django_filters.CharFilter(
        field_name='referencia_proveedor',
        lookup_expr='icontains'
    )
    
    # Filtros por montos
    total_min = django_filters.NumberFilter(field_name='total', lookup_expr='gte')
    total_max = django_filters.NumberFilter(field_name='total', lookup_expr='lte')
    
    # Filtros especiales
    vencidos = django_filters.BooleanFilter(method='filter_vencidos')
    pendientes_recepcion = django_filters.BooleanFilter(method='filter_pendientes_recepcion')
    
    class Meta:
        model = PedidoCompra
        fields = [
            'estado', 'proveedor', 'almacen_destino', 'numero',
            'fecha', 'fecha_esperada', 'total'
        ]
    
    def filter_vencidos(self, queryset, name, value):
        """Filtrar pedidos vencidos"""
        if value:
            return queryset.filter(
                fecha_esperada__lt=timezone.now().date(),
                estado__in=['confirmado', 'recibido_parcial']
            )
        return queryset
    
    def filter_pendientes_recepcion(self, queryset, name, value):
        """Filtrar pedidos pendientes de recepción"""
        if value:
            return queryset.filter(
                estado__in=['confirmado', 'recibido_parcial']
            )
        return queryset


class AlbaranCompraFilter(django_filters.FilterSet):
    """Filtros para albaranes de compra"""
    
    # Filtros por fecha
    fecha_desde = django_filters.DateFilter(field_name='fecha', lookup_expr='gte')
    fecha_hasta = django_filters.DateFilter(field_name='fecha', lookup_expr='lte')
    fecha_recepcion_desde = django_filters.DateFilter(field_name='fecha_recepcion', lookup_expr='gte')
    fecha_recepcion_hasta = django_filters.DateFilter(field_name='fecha_recepcion', lookup_expr='lte')
    
    # Filtros por estado
    estado = django_filters.MultipleChoiceFilter(
        choices=AlbaranCompra.ESTADO_CHOICES,
        field_name='estado'
    )
    
    # Filtros por proveedor
    proveedor = django_filters.NumberFilter(field_name='proveedor__id')
    proveedor_nombre = django_filters.CharFilter(
        field_name='proveedor__nombre',
        lookup_expr='icontains'
    )
    
    # Filtros por pedido
    pedido = django_filters.NumberFilter(field_name='pedido_compra__id')
    pedido_numero = django_filters.CharFilter(
        field_name='pedido_compra__numero',
        lookup_expr='icontains'
    )
    
    # Filtros por almacén
    almacen = django_filters.NumberFilter(field_name='almacen__id')
    
    # Filtros por números
    numero = django_filters.CharFilter(field_name='numero', lookup_expr='icontains')
    numero_albaran_proveedor = django_filters.CharFilter(
        field_name='numero_albaran_proveedor',
        lookup_expr='icontains'
    )
    
    # Filtros por usuario
    recibido_por = django_filters.NumberFilter(field_name='recibido_por__id')
    
    # Filtros especiales
    pendientes_recepcion = django_filters.BooleanFilter(method='filter_pendientes_recepcion')
    recibidos_hoy = django_filters.BooleanFilter(method='filter_recibidos_hoy')
    
    class Meta:
        model = AlbaranCompra
        fields = [
            'estado', 'proveedor', 'pedido_compra', 'almacen',
            'numero', 'fecha', 'fecha_recepcion'
        ]
    
    def filter_pendientes_recepcion(self, queryset, name, value):
        """Filtrar albaranes pendientes de recepción"""
        if value:
            return queryset.filter(estado='pendiente')
        return queryset
    
    def filter_recibidos_hoy(self, queryset, name, value):
        """Filtrar albaranes recibidos hoy"""
        if value:
            return queryset.filter(
                fecha_recepcion=timezone.now().date()
            )
        return queryset


class FacturaCompraFilter(django_filters.FilterSet):
    """Filtros para facturas de compra"""
    
    # Filtros por fecha
    fecha_desde = django_filters.DateFilter(field_name='fecha', lookup_expr='gte')
    fecha_hasta = django_filters.DateFilter(field_name='fecha', lookup_expr='lte')
    fecha_vencimiento_desde = django_filters.DateFilter(field_name='fecha_vencimiento', lookup_expr='gte')
    fecha_vencimiento_hasta = django_filters.DateFilter(field_name='fecha_vencimiento', lookup_expr='lte')
    fecha_pago_desde = django_filters.DateFilter(field_name='fecha_pago', lookup_expr='gte')
    fecha_pago_hasta = django_filters.DateFilter(field_name='fecha_pago', lookup_expr='lte')
    
    # Filtros por estado
    estado = django_filters.MultipleChoiceFilter(
        choices=FacturaCompra.ESTADO_CHOICES,
        field_name='estado'
    )
    
    # Filtros por proveedor
    proveedor = django_filters.NumberFilter(field_name='proveedor__id')
    proveedor_nombre = django_filters.CharFilter(
        field_name='proveedor__nombre',
        lookup_expr='icontains'
    )
    
    # Filtros por pedido y albarán
    pedido = django_filters.NumberFilter(field_name='pedido_compra__id')
    albaran = django_filters.NumberFilter(field_name='albaran_compra__id')
    
    # Filtros por números
    numero = django_filters.CharFilter(field_name='numero', lookup_expr='icontains')
    numero_factura_proveedor = django_filters.CharFilter(
        field_name='numero_factura_proveedor',
        lookup_expr='icontains'
    )
    
    # Filtros por montos
    total_min = django_filters.NumberFilter(field_name='total', lookup_expr='gte')
    total_max = django_filters.NumberFilter(field_name='total', lookup_expr='lte')
    
    # Filtros por método de pago
    metodo_pago = django_filters.CharFilter(field_name='metodo_pago', lookup_expr='icontains')
    
    # Filtros especiales
    vencidas = django_filters.BooleanFilter(method='filter_vencidas')
    por_vencer = django_filters.BooleanFilter(method='filter_por_vencer')
    pendientes = django_filters.BooleanFilter(method='filter_pendientes')
    pagadas_hoy = django_filters.BooleanFilter(method='filter_pagadas_hoy')
    
    class Meta:
        model = FacturaCompra
        fields = [
            'estado', 'proveedor', 'pedido_compra', 'albaran_compra',
            'numero', 'fecha', 'fecha_vencimiento', 'fecha_pago',
            'total', 'metodo_pago'
        ]
    
    def filter_vencidas(self, queryset, name, value):
        """Filtrar facturas vencidas"""
        if value:
            return queryset.filter(
                fecha_vencimiento__lt=timezone.now().date(),
                estado='pendiente'
            )
        return queryset
    
    def filter_por_vencer(self, queryset, name, value):
        """Filtrar facturas por vencer (próximos 30 días)"""
        if value:
            fecha_limite = timezone.now().date() + timezone.timedelta(days=30)
            return queryset.filter(
                fecha_vencimiento__range=[timezone.now().date(), fecha_limite],
                estado='pendiente'
            )
        return queryset
    
    def filter_pendientes(self, queryset, name, value):
        """Filtrar facturas pendientes de pago"""
        if value:
            return queryset.filter(estado='pendiente')
        return queryset
    
    def filter_pagadas_hoy(self, queryset, name, value):
        """Filtrar facturas pagadas hoy"""
        if value:
            return queryset.filter(
                fecha_pago=timezone.now().date(),
                estado='pagada'
            )
        return queryset


class CuentaPorPagarFilter(django_filters.FilterSet):
    """Filtros para cuentas por pagar"""
    
    # Filtros por fecha
    fecha_vencimiento_desde = django_filters.DateFilter(field_name='fecha_vencimiento', lookup_expr='gte')
    fecha_vencimiento_hasta = django_filters.DateFilter(field_name='fecha_vencimiento', lookup_expr='lte')
    
    # Filtros por estado
    estado = django_filters.MultipleChoiceFilter(
        choices=CuentaPorPagar.ESTADO_CHOICES,
        field_name='estado'
    )
    
    # Filtros por proveedor
    proveedor = django_filters.NumberFilter(field_name='proveedor__id')
    proveedor_nombre = django_filters.CharFilter(
        field_name='proveedor__nombre',
        lookup_expr='icontains'
    )
    
    # Filtros por factura
    factura = django_filters.NumberFilter(field_name='factura_compra__id')
    factura_numero = django_filters.CharFilter(
        field_name='factura_compra__numero',
        lookup_expr='icontains'
    )
    
    # Filtros por montos
    monto_original_min = django_filters.NumberFilter(field_name='monto_original', lookup_expr='gte')
    monto_original_max = django_filters.NumberFilter(field_name='monto_original', lookup_expr='lte')
    monto_pendiente_min = django_filters.NumberFilter(field_name='monto_pendiente', lookup_expr='gte')
    monto_pendiente_max = django_filters.NumberFilter(field_name='monto_pendiente', lookup_expr='lte')
    
    # Filtros especiales
    vencidas = django_filters.BooleanFilter(method='filter_vencidas')
    por_vencer = django_filters.BooleanFilter(method='filter_por_vencer')
    pendientes = django_filters.BooleanFilter(method='filter_pendientes')
    con_saldo = django_filters.BooleanFilter(method='filter_con_saldo')
    
    class Meta:
        model = CuentaPorPagar
        fields = [
            'estado', 'proveedor', 'factura_compra', 'fecha_vencimiento',
            'monto_original', 'monto_pendiente'
        ]
    
    def filter_vencidas(self, queryset, name, value):
        """Filtrar cuentas vencidas"""
        if value:
            return queryset.filter(
                fecha_vencimiento__lt=timezone.now().date(),
                estado='pendiente'
            )
        return queryset
    
    def filter_por_vencer(self, queryset, name, value):
        """Filtrar cuentas por vencer (próximos 30 días)"""
        if value:
            fecha_limite = timezone.now().date() + timezone.timedelta(days=30)
            return queryset.filter(
                fecha_vencimiento__range=[timezone.now().date(), fecha_limite],
                estado='pendiente'
            )
        return queryset
    
    def filter_pendientes(self, queryset, name, value):
        """Filtrar cuentas pendientes de pago"""
        if value:
            return queryset.filter(estado='pendiente')
        return queryset
    
    def filter_con_saldo(self, queryset, name, value):
        """Filtrar cuentas con saldo pendiente"""
        if value:
            return queryset.filter(monto_pendiente__gt=0)
        return queryset
