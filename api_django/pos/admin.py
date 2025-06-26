from django.contrib import admin
from .models import CajaSession, MovimientoCaja, CuadreCaja


@admin.register(CajaSession)
class CajaSessionAdmin(admin.ModelAdmin):
    list_display = [
        'nombre', 'usuario', 'estado', 'fecha_apertura', 
        'fecha_cierre', 'saldo_inicial', 'saldo_final'
    ]
    list_filter = ['estado', 'fecha_apertura', 'usuario']
    search_fields = ['nombre', 'usuario__username', 'usuario__first_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'usuario', 'estado')
        }),
        ('Fechas', {
            'fields': ('fecha_apertura', 'fecha_cierre')
        }),
        ('Saldos', {
            'fields': ('saldo_inicial', 'saldo_final')
        }),
        ('Notas', {
            'fields': ('notas_apertura', 'notas_cierre')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(MovimientoCaja)
class MovimientoCajaAdmin(admin.ModelAdmin):
    list_display = [
        'caja_session', 'tipo', 'importe', 'metodo_pago', 
        'ticket', 'created_at'
    ]
    list_filter = ['tipo', 'metodo_pago', 'created_at', 'caja_session']
    search_fields = [
        'concepto', 'referencia', 'ticket__numero',
        'caja_session__nombre'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('caja_session', 'tipo', 'ticket')
        }),
        ('Importe', {
            'fields': ('importe', 'metodo_pago', 'importe_efectivo', 'importe_tarjeta')
        }),
        ('Detalles', {
            'fields': ('concepto', 'referencia')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(CuadreCaja)
class CuadreCajaAdmin(admin.ModelAdmin):
    list_display = [
        'caja_session', 'efectivo_contado', 'efectivo_esperado',
        'diferencia', 'total_ventas', 'created_at'
    ]
    list_filter = ['created_at', 'caja_session__usuario']
    search_fields = ['caja_session__nombre', 'observaciones']
    readonly_fields = [
        'efectivo_esperado', 'diferencia', 'total_ventas_efectivo',
        'total_ventas_tarjeta', 'total_ventas', 'created_at'
    ]
    
    fieldsets = (
        ('Sesión', {
            'fields': ('caja_session',)
        }),
        ('Efectivo', {
            'fields': ('efectivo_contado', 'efectivo_esperado', 'diferencia')
        }),
        ('Resumen Ventas', {
            'fields': ('total_ventas_efectivo', 'total_ventas_tarjeta', 'total_ventas'),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Metadatos', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )
