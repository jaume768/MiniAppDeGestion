from django.contrib import admin
from django.utils.html import format_html
from .models import (
    PedidoCompra, PedidoCompraItem, AlbaranCompra, AlbaranCompraItem,
    FacturaCompra, FacturaCompraItem, CuentaPorPagar
)


class PedidoCompraItemInline(admin.TabularInline):
    model = PedidoCompraItem
    extra = 0
    fields = ['articulo', 'cantidad', 'precio_unitario', 'descuento_porcentaje', 'iva_porcentaje']
    readonly_fields = ['cantidad_recibida']


@admin.register(PedidoCompra)
class PedidoCompraAdmin(admin.ModelAdmin):
    list_display = [
        'numero', 'proveedor', 'fecha', 'fecha_esperada', 'estado',
        'total_display', 'created_at'
    ]
    list_filter = ['estado', 'fecha', 'proveedor', 'almacen_destino']
    search_fields = ['numero', 'proveedor__nombre', 'referencia_proveedor']
    readonly_fields = ['numero', 'subtotal', 'iva', 'total', 'created_at', 'updated_at']
    inlines = [PedidoCompraItemInline]
    date_hierarchy = 'fecha'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('numero', 'proveedor', 'fecha', 'fecha_esperada', 'estado')
        }),
        ('Destino y Condiciones', {
            'fields': ('almacen_destino', 'condiciones_pago', 'referencia_proveedor')
        }),
        ('Totales', {
            'fields': ('subtotal', 'iva', 'total'),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def total_display(self, obj):
        return format_html('<strong>{:.2f} €</strong>', obj.total)
    total_display.short_description = 'Total'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('proveedor', 'almacen_destino')


class AlbaranCompraItemInline(admin.TabularInline):
    model = AlbaranCompraItem
    extra = 0
    fields = ['articulo', 'cantidad', 'cantidad_recibida', 'precio_unitario', 'lote', 'fecha_caducidad']
    readonly_fields = ['pedido_item']


@admin.register(AlbaranCompra)
class AlbaranCompraAdmin(admin.ModelAdmin):
    list_display = [
        'numero', 'proveedor', 'pedido_display', 'fecha', 'estado',
        'total_display', 'recibido_por'
    ]
    list_filter = ['estado', 'fecha', 'proveedor', 'almacen']
    search_fields = ['numero', 'proveedor__nombre', 'numero_albaran_proveedor']
    readonly_fields = [
        'numero', 'pedido_compra', 'subtotal', 'iva', 'total',
        'fecha_recepcion', 'created_at', 'updated_at'
    ]
    inlines = [AlbaranCompraItemInline]
    date_hierarchy = 'fecha'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('numero', 'pedido_compra', 'proveedor', 'fecha', 'estado')
        }),
        ('Recepción', {
            'fields': ('almacen', 'recibido_por', 'fecha_recepcion', 'numero_albaran_proveedor')
        }),
        ('Totales', {
            'fields': ('subtotal', 'iva', 'total'),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def pedido_display(self, obj):
        if obj.pedido_compra:
            return obj.pedido_compra.numero
        return '-'
    pedido_display.short_description = 'Pedido'
    
    def total_display(self, obj):
        return format_html('<strong>{:.2f} €</strong>', obj.total)
    total_display.short_description = 'Total'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'proveedor', 'pedido_compra', 'almacen', 'recibido_por'
        )


class FacturaCompraItemInline(admin.TabularInline):
    model = FacturaCompraItem
    extra = 0
    fields = ['articulo', 'cantidad', 'precio_unitario', 'descuento_porcentaje', 'iva_porcentaje']
    readonly_fields = ['pedido_item', 'albaran_item']


@admin.register(FacturaCompra)
class FacturaCompraAdmin(admin.ModelAdmin):
    list_display = [
        'numero', 'numero_factura_proveedor', 'proveedor', 'fecha',
        'fecha_vencimiento', 'estado', 'total_display'
    ]
    list_filter = ['estado', 'fecha', 'fecha_vencimiento', 'proveedor', 'metodo_pago']
    search_fields = ['numero', 'numero_factura_proveedor', 'proveedor__nombre']
    readonly_fields = [
        'numero', 'pedido_compra', 'albaran_compra', 'subtotal', 'iva', 'total',
        'created_at', 'updated_at'
    ]
    inlines = [FacturaCompraItemInline]
    date_hierarchy = 'fecha'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('numero', 'numero_factura_proveedor', 'proveedor', 'fecha', 'estado')
        }),
        ('Documentos Origen', {
            'fields': ('pedido_compra', 'albaran_compra')
        }),
        ('Vencimiento y Pago', {
            'fields': ('fecha_vencimiento', 'fecha_pago', 'metodo_pago')
        }),
        ('Totales', {
            'fields': ('subtotal', 'iva', 'total'),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def total_display(self, obj):
        color = 'red' if obj.esta_vencida else 'green' if obj.estado == 'pagada' else 'orange'
        return format_html(
            '<strong style="color: {};">{:.2f} €</strong>',
            color, obj.total
        )
    total_display.short_description = 'Total'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'proveedor', 'pedido_compra', 'albaran_compra'
        )


@admin.register(CuentaPorPagar)
class CuentaPorPagarAdmin(admin.ModelAdmin):
    list_display = [
        'proveedor', 'factura_display', 'monto_original_display',
        'monto_pendiente_display', 'fecha_vencimiento', 'estado_display'
    ]
    list_filter = ['estado', 'fecha_vencimiento', 'proveedor']
    search_fields = ['proveedor__nombre', 'factura_compra__numero']
    readonly_fields = ['factura_compra', 'monto_original', 'created_at', 'updated_at']
    date_hierarchy = 'fecha_vencimiento'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('proveedor', 'factura_compra', 'fecha_vencimiento', 'estado')
        }),
        ('Montos', {
            'fields': ('monto_original', 'monto_pagado', 'monto_pendiente')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def factura_display(self, obj):
        return obj.factura_compra.numero if obj.factura_compra else '-'
    factura_display.short_description = 'Factura'
    
    def monto_original_display(self, obj):
        return format_html('<strong>{:.2f} €</strong>', obj.monto_original)
    monto_original_display.short_description = 'Monto Original'
    
    def monto_pendiente_display(self, obj):
        color = 'red' if obj.monto_pendiente > 0 else 'green'
        return format_html(
            '<strong style="color: {};">{:.2f} €</strong>',
            color, obj.monto_pendiente
        )
    monto_pendiente_display.short_description = 'Pendiente'
    
    def estado_display(self, obj):
        colors = {
            'pendiente': 'orange',
            'pagada': 'green',
            'parcial': 'blue',
            'vencida': 'red'
        }
        color = colors.get(obj.estado, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_estado_display()
        )
    estado_display.short_description = 'Estado'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('proveedor', 'factura_compra')
