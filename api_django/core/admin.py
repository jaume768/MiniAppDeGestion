from django.contrib import admin
from .models import Cliente

# Register your models here.

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'empresa', 'email', 'telefono', 'activo', 'created_at')
    list_filter = ('empresa', 'activo', 'created_at')
    search_fields = ('nombre', 'email', 'telefono', 'cif_nif')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Información Principal', {
            'fields': ('nombre', 'email', 'telefono', 'cif_nif')
        }),
        ('Dirección', {
            'fields': ('direccion',)
        }),
        ('Estado', {
            'fields': ('activo',)
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
