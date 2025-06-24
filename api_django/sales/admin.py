from django.contrib import admin
from .models import (
    Presupuesto, PresupuestoItem,
    Pedido, PedidoItem,
    Albaran, AlbaranItem,
    Ticket, TicketItem,
    Factura, FacturaItem
)


class PresupuestoItemInline(admin.TabularInline):
    model = PresupuestoItem
    extra = 1
    fields = ('articulo', 'cantidad', 'precio_unitario', 'iva_porcentaje')
    readonly_fields = ('total_linea',)


@admin.register(Presupuesto)
class PresupuestoAdmin(admin.ModelAdmin):
    list_display = ('numero', 'empresa', 'cliente', 'fecha', 'subtotal', 'total', 'created_at')
    list_filter = ('empresa', 'fecha', 'created_at')
    search_fields = ('numero', 'cliente__nombre')
    readonly_fields = ('subtotal', 'iva_total', 'total', 'created_at', 'updated_at')
    inlines = [PresupuestoItemInline]
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('numero', 'cliente', 'fecha', 'observaciones')
        }),
        ('Totales', {
            'fields': ('subtotal', 'iva_total', 'total'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin':
            return qs
        elif hasattr(request.user, 'empresa') and request.user.empresa:
            return qs.filter(empresa=request.user.empresa)
        return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "cliente":
            if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin'):
                if hasattr(request.user, 'empresa') and request.user.empresa:
                    kwargs["queryset"] = db_field.related_model.objects.filter(empresa=request.user.empresa)
                else:
                    kwargs["queryset"] = db_field.related_model.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class PedidoItemInline(admin.TabularInline):
    model = PedidoItem
    extra = 1
    fields = ('articulo', 'cantidad', 'precio_unitario', 'iva_porcentaje')
    readonly_fields = ('total_linea',)


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('numero', 'empresa', 'cliente', 'fecha', 'entregado', 'subtotal', 'total', 'created_at')
    list_filter = ('empresa', 'entregado', 'fecha', 'created_at')
    search_fields = ('numero', 'cliente__nombre')
    readonly_fields = ('subtotal', 'iva_total', 'total', 'created_at', 'updated_at')
    inlines = [PedidoItemInline]
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('numero', 'cliente', 'fecha', 'entregado', 'observaciones')
        }),
        ('Totales', {
            'fields': ('subtotal', 'iva_total', 'total'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin':
            return qs
        elif hasattr(request.user, 'empresa') and request.user.empresa:
            return qs.filter(empresa=request.user.empresa)
        return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "cliente":
            if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin'):
                if hasattr(request.user, 'empresa') and request.user.empresa:
                    kwargs["queryset"] = db_field.related_model.objects.filter(empresa=request.user.empresa)
                else:
                    kwargs["queryset"] = db_field.related_model.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class FacturaItemInline(admin.TabularInline):
    model = FacturaItem
    extra = 1
    fields = ('articulo', 'cantidad', 'precio_unitario', 'iva_porcentaje')
    readonly_fields = ('total_linea',)


@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ('numero', 'empresa', 'cliente', 'fecha', 'documento_origen', 'subtotal', 'total', 'created_at')
    list_filter = ('empresa', 'documento_origen', 'fecha', 'created_at')
    search_fields = ('numero', 'cliente__nombre')
    readonly_fields = ('subtotal', 'iva_total', 'total', 'created_at', 'updated_at')
    inlines = [FacturaItemInline]
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('numero', 'cliente', 'fecha', 'documento_origen', 'pedido', 'observaciones')
        }),
        ('Totales', {
            'fields': ('subtotal', 'iva_total', 'total'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin':
            return qs
        elif hasattr(request.user, 'empresa') and request.user.empresa:
            return qs.filter(empresa=request.user.empresa)
        return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name in ["cliente", "pedido"]:
            if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin'):
                if hasattr(request.user, 'empresa') and request.user.empresa:
                    kwargs["queryset"] = db_field.related_model.objects.filter(empresa=request.user.empresa)
                else:
                    kwargs["queryset"] = db_field.related_model.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class AlbaranItemInline(admin.TabularInline):
    model = AlbaranItem
    extra = 1
    fields = ('articulo', 'cantidad', 'precio_unitario', 'iva_porcentaje')
    readonly_fields = ('total_linea',)


@admin.register(Albaran)
class AlbaranAdmin(admin.ModelAdmin):
    list_display = ('numero', 'empresa', 'cliente', 'fecha', 'subtotal', 'total', 'created_at')
    list_filter = ('empresa', 'fecha', 'created_at')
    search_fields = ('numero', 'cliente__nombre')
    readonly_fields = ('subtotal', 'iva_total', 'total', 'created_at', 'updated_at')
    inlines = [AlbaranItemInline]
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin':
            return qs
        elif hasattr(request.user, 'empresa') and request.user.empresa:
            return qs.filter(empresa=request.user.empresa)
        return qs.none()


class TicketItemInline(admin.TabularInline):
    model = TicketItem
    extra = 1
    fields = ('articulo', 'cantidad', 'precio_unitario', 'iva_porcentaje')
    readonly_fields = ('total_linea',)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('numero', 'empresa', 'cliente', 'fecha', 'subtotal', 'total', 'created_at')
    list_filter = ('empresa', 'fecha', 'created_at')
    search_fields = ('numero', 'cliente__nombre')
    readonly_fields = ('subtotal', 'iva_total', 'total', 'created_at', 'updated_at')
    inlines = [TicketItemInline]
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin':
            return qs
        elif hasattr(request.user, 'empresa') and request.user.empresa:
            return qs.filter(empresa=request.user.empresa)
        return qs.none()
