from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Empresa


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'cif', 'plan', 'max_usuarios', 'activa', 'fecha_registro')
    list_filter = ('plan', 'activa', 'fecha_registro')
    search_fields = ('nombre', 'cif', 'email')
    readonly_fields = ('fecha_registro', 'created_at', 'updated_at')
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'cif', 'direccion', 'telefono', 'email', 'web')
        }),
        ('Plan y Configuración', {
            'fields': ('plan', 'max_usuarios', 'activa', 'fecha_vencimiento')
        }),
        ('Fechas', {
            'fields': ('fecha_registro', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ('nombre',)
    list_per_page = 25


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'empresa', 'role', 'is_active', 'ultimo_acceso')
    list_filter = ('role', 'is_active', 'is_staff', 'empresa')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)
    list_per_page = 25
    
    # Agregar campos personalizados al formulario de usuario
    fieldsets = UserAdmin.fieldsets + (
        ('Información Empresarial', {
            'fields': ('empresa', 'role', 'telefono', 'cargo', 'avatar'),
        }),
        ('Fechas Personalizadas', {
            'fields': ('ultimo_acceso', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Campos de solo lectura
    readonly_fields = UserAdmin.readonly_fields + ('created_at', 'updated_at')
    
    # Campos para agregar usuario
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Empresarial', {
            'fields': ('empresa', 'role', 'telefono', 'cargo'),
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Si el usuario es superadmin, puede ver todos los usuarios
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin':
            return qs
        # Si es admin de empresa, solo ve usuarios de su empresa
        elif hasattr(request.user, 'empresa') and request.user.empresa:
            return qs.filter(empresa=request.user.empresa)
        # En caso contrario, no ve ningún usuario
        return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Filtrar empresas disponibles según permisos del usuario
        if db_field.name == "empresa":
            if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'superadmin'):
                if hasattr(request.user, 'empresa') and request.user.empresa:
                    kwargs["queryset"] = Empresa.objects.filter(id=request.user.empresa.id)
                else:
                    kwargs["queryset"] = Empresa.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


# Personalizar el título del admin
admin.site.site_header = "MiniGestion - Administración Multi-Tenant"
admin.site.site_title = "MiniGestion Admin"
admin.site.index_title = "Panel de Administración"
