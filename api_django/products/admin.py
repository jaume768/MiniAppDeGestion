from django.contrib import admin
from .models import Categoria, Marca, Articulo


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'empresa', 'descripcion', 'created_at')
    list_filter = ('empresa', 'created_at')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('created_at', 'updated_at')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin':
            return qs
        elif hasattr(request.user, 'empresa') and request.user.empresa:
            return qs.filter(empresa=request.user.empresa)
        return qs.none()


@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'empresa', 'pais_origen', 'created_at')
    list_filter = ('empresa', 'pais_origen', 'created_at')
    search_fields = ('nombre', 'pais_origen')
    readonly_fields = ('created_at', 'updated_at')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin':
            return qs
        elif hasattr(request.user, 'empresa') and request.user.empresa:
            return qs.filter(empresa=request.user.empresa)
        return qs.none()


@admin.register(Articulo)
class ArticuloAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'empresa', 'categoria', 'marca', 'precio', 'stock', 'activo')
    list_filter = ('empresa', 'categoria', 'marca', 'activo', 'created_at')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'categoria', 'marca')
        }),
        ('Precios y Stock', {
            'fields': ('precio', 'stock', 'iva')
        }),
        ('Características', {
            'fields': ('modelo', 'activo'),
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
        if db_field.name in ["categoria", "marca"]:
            if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin'):
                if hasattr(request.user, 'empresa') and request.user.empresa:
                    kwargs["queryset"] = db_field.related_model.objects.filter(empresa=request.user.empresa)
                else:
                    kwargs["queryset"] = db_field.related_model.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
