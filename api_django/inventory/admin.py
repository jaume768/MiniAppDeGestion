from django.contrib import admin
from .models import (
    Almacen, ArticuloStock, MovimientoStock, 
    TransferenciaStock, TransferenciaStockItem
)


@admin.register(Almacen)
class AlmacenAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo', 'activo', 'es_principal', 'empresa']
    list_filter = ['activo', 'es_principal', 'empresa']
    search_fields = ['nombre', 'codigo', 'responsable']
    ordering = ['empresa', 'nombre']
    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'codigo', 'activo', 'es_principal')
        }),
        ('Detalles', {
            'fields': ('direccion', 'telefono', 'responsable')
        }),
    )


@admin.register(ArticuloStock)
class ArticuloStockAdmin(admin.ModelAdmin):
    list_display = ['articulo', 'almacen', 'stock_actual', 'stock_reservado', 'stock_minimo', 'stock_maximo']
    list_filter = ['almacen', 'empresa']
    search_fields = ['articulo__nombre', 'articulo__codigo', 'almacen__nombre']
    ordering = ['empresa', 'almacen', 'articulo__nombre']
    readonly_fields = ['stock_disponible', 'valor_total']
    
    def stock_disponible(self, obj):
        return obj.stock_disponible
    stock_disponible.short_description = 'Stock Disponible'
    
    def valor_total(self, obj):
        return obj.valor_total
    valor_total.short_description = 'Valor Total'


@admin.register(MovimientoStock)
class MovimientoStockAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'articulo', 'almacen', 'tipo', 'cantidad', 'stock_posterior', 'usuario']
    list_filter = ['tipo', 'motivo', 'almacen', 'fecha', 'empresa']
    search_fields = ['articulo__nombre', 'articulo__codigo', 'observaciones']
    ordering = ['-fecha']
    readonly_fields = ['fecha', 'stock_anterior', 'stock_posterior', 'usuario']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


class TransferenciaStockItemInline(admin.TabularInline):
    model = TransferenciaStockItem
    extra = 0
    readonly_fields = ['cantidad_enviada', 'cantidad_recibida']


@admin.register(TransferenciaStock)
class TransferenciaStockAdmin(admin.ModelAdmin):
    list_display = ['numero', 'almacen_origen', 'almacen_destino', 'estado', 'fecha_solicitud', 'solicitado_por']
    list_filter = ['estado', 'almacen_origen', 'almacen_destino', 'fecha_solicitud', 'empresa']
    search_fields = ['numero', 'motivo', 'observaciones']
    ordering = ['-fecha_solicitud']
    readonly_fields = ['fecha_solicitud', 'fecha_envio', 'fecha_recepcion', 'solicitado_por', 'enviado_por', 'recibido_por']
    inlines = [TransferenciaStockItemInline]
    
    fieldsets = (
        ('Información General', {
            'fields': ('numero', 'estado', 'motivo')
        }),
        ('Almacenes', {
            'fields': ('almacen_origen', 'almacen_destino')
        }),
        ('Fechas y Usuarios', {
            'fields': ('fecha_solicitud', 'solicitado_por', 'fecha_envio', 'enviado_por', 'fecha_recepcion', 'recibido_por')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
    )
