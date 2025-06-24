from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class Empresa(models.Model):
    """Modelo de Empresa - Tenant principal del sistema"""
    
    PLAN_CHOICES = [
        ('basic', 'Básico'),
        ('premium', 'Premium'),
        ('enterprise', 'Enterprise'),
    ]
    
    nombre = models.CharField(max_length=200, verbose_name="Nombre de la empresa")
    cif = models.CharField(max_length=20, unique=True, verbose_name="CIF/NIF")
    direccion = models.TextField(verbose_name="Dirección")
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(verbose_name="Email de contacto")
    web = models.URLField(blank=True, null=True, verbose_name="Sitio web")
    
    # Configuración del plan
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='basic')
    max_usuarios = models.PositiveIntegerField(default=10, verbose_name="Máximo de usuarios")
    activa = models.BooleanField(default=True)
    
    # Fechas
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'

    def __str__(self):
        return self.nombre
    
    def get_usuarios_count(self):
        """Cuenta los usuarios activos de la empresa"""
        return self.usuarios.filter(is_active=True).count()
    
    def can_add_user(self):
        """Verifica si se puede agregar un usuario más"""
        return self.get_usuarios_count() < self.max_usuarios


class CustomUser(AbstractUser):
    """Usuario personalizado con soporte multi-tenant"""
    
    ROLE_CHOICES = [
        ('superadmin', 'Super Administrador'),
        ('admin', 'Administrador de Empresa'),
        ('manager', 'Gerente'),
        ('employee', 'Empleado'),
        ('readonly', 'Solo Lectura'),
    ]
    
    empresa = models.ForeignKey(
        Empresa, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='usuarios',
        verbose_name="Empresa"
    )
    
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='employee',
        verbose_name="Rol"
    )
    
    # Campos adicionales
    telefono = models.CharField(max_length=20, blank=True, null=True)
    cargo = models.CharField(max_length=100, blank=True, null=True, verbose_name="Cargo")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Permisos específicos
    can_manage_users = models.BooleanField(default=False, verbose_name="Puede gestionar usuarios")
    can_view_reports = models.BooleanField(default=True, verbose_name="Puede ver reportes")
    can_manage_settings = models.BooleanField(default=False, verbose_name="Puede gestionar configuración")
    
    # Fechas
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        full_name = self.get_full_name()
        if full_name:
            return f"{full_name} ({self.username})"
        return self.username
    
    @property
    def is_superadmin(self):
        """Verifica si es super administrador"""
        return self.role == 'superadmin'
    
    @property
    def is_empresa_admin(self):
        """Verifica si es administrador de empresa"""
        return self.role == 'admin'
    
    @property
    def is_manager(self):
        """Verifica si es gerente"""
        return self.role == 'manager'
    
    def get_permissions(self):
        """Retorna los permisos del usuario basándose en su rol"""
        base_permissions = {
            'can_view_data': True,
            'can_create_data': False,
            'can_edit_data': False,
            'can_delete_data': False,
            'can_manage_users': False,
            'can_view_reports': self.can_view_reports,
            'can_manage_settings': False,
        }
        
        if self.is_superadmin:
            return {key: True for key in base_permissions.keys()}
        
        elif self.is_empresa_admin:
            base_permissions.update({
                'can_create_data': True,
                'can_edit_data': True,
                'can_delete_data': True,
                'can_manage_users': True,
                'can_manage_settings': True,
            })
        
        elif self.is_manager:
            base_permissions.update({
                'can_create_data': True,
                'can_edit_data': True,
                'can_delete_data': False,
            })
        
        elif self.role == 'employee':
            base_permissions.update({
                'can_create_data': True,
                'can_edit_data': True,
            })
        
        # Aplicar permisos específicos
        base_permissions['can_manage_users'] = self.can_manage_users
        base_permissions['can_manage_settings'] = self.can_manage_settings
        
        return base_permissions

    def save(self, *args, **kwargs):
        # Auto-asignar permisos basándose en el rol
        if self.role == 'admin':
            self.can_manage_users = True
            self.can_manage_settings = True
        elif self.role == 'superadmin':
            self.can_manage_users = True
            self.can_manage_settings = True
            self.empresa = None  # Los superadmins no tienen empresa
        
        super().save(*args, **kwargs)
