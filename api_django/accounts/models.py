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
            base_permissions = {key: True for key in base_permissions.keys()}
        
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
        
        # Agregar módulos accesibles según cargo
        base_permissions['accessible_modules'] = self.get_accessible_modules()
        
        return base_permissions
    
    def get_accessible_modules(self):
        """Retorna los módulos accesibles según rol y cargo del usuario"""
        # Módulos base por rol
        if self.is_superadmin:
            return ['all']  # Acceso completo a todos los módulos
        
        elif self.is_empresa_admin:
            return [
                'dashboard', 'ventas', 'compras', 'inventario', 'articulos',
                'contactos', 'rrhh', 'proyectos', 'tpv', 'reportes',
                'usuarios', 'configuracion'
            ]
        
        elif self.is_manager:
            return [
                'dashboard', 'ventas', 'compras', 'inventario', 'articulos',
                'contactos', 'rrhh', 'proyectos', 'tpv', 'reportes'
            ]
        
        elif self.role == 'employee':
            # Módulos específicos según cargo para empleados
            cargo_modules = {
                'Vendedora': [
                    'dashboard', 'ventas', 'contactos', 'articulos', 
                    'inventario', 'tpv', 'reportes'
                ],
                'Encargado de Almacén': [
                    'dashboard', 'inventario', 'articulos', 'compras', 
                    'contactos', 'ventas'
                ],
                'Contable': [
                    'dashboard', 'reportes', 'ventas', 'compras', 'contactos'
                ],
                'Cajero': [
                    'dashboard', 'tpv', 'ventas', 'contactos'
                ],
                'Administrativo': [
                    'dashboard', 'contactos', 'articulos', 'reportes'
                ],
                'Técnico': [
                    'dashboard', 'proyectos', 'inventario', 'articulos'
                ],
                'Comercial': [
                    'dashboard', 'ventas', 'contactos', 'articulos', 'reportes'
                ],
                'Recepcionista': [
                    'dashboard', 'contactos'
                ]
            }
            
            return cargo_modules.get(self.cargo, ['dashboard'])
        
        elif self.role == 'readonly':
            return ['dashboard'] if self.can_view_reports else []
        
        return ['dashboard']  # Módulo mínimo por defecto

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


class UserInvitation(models.Model):
    """Modelo para invitaciones de usuarios por email"""
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('accepted', 'Aceptada'),
        ('expired', 'Expirada'),
        ('cancelled', 'Cancelada'),
    ]
    
    empresa = models.ForeignKey(
        Empresa, 
        on_delete=models.CASCADE,
        related_name='invitaciones',
        verbose_name="Empresa"
    )
    
    email = models.EmailField(verbose_name="Email del invitado")
    
    role = models.CharField(
        max_length=20, 
        choices=CustomUser.ROLE_CHOICES,
        default='employee',
        verbose_name="Rol asignado"
    )
    
    token = models.CharField(
        max_length=100, 
        unique=True,
        verbose_name="Token de invitación"
    )
    
    invited_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='invitaciones_enviadas',
        verbose_name="Invitado por"
    )
    
    # Datos adicionales del invitado
    first_name = models.CharField(max_length=150, blank=True, verbose_name="Nombre")
    last_name = models.CharField(max_length=150, blank=True, verbose_name="Apellidos")
    cargo = models.CharField(max_length=100, blank=True, verbose_name="Cargo")
    telefono = models.CharField(max_length=20, blank=True, verbose_name="Teléfono")
    
    # Permisos específicos
    can_manage_users = models.BooleanField(default=False, verbose_name="Puede gestionar usuarios")
    can_view_reports = models.BooleanField(default=True, verbose_name="Puede ver reportes")
    can_manage_settings = models.BooleanField(default=False, verbose_name="Puede gestionar configuración")
    
    # Estado y fechas
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Estado"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    expires_at = models.DateTimeField(verbose_name="Fecha de expiración")
    accepted_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de aceptación")
    
    # Mensaje personalizado (opcional)
    message = models.TextField(
        blank=True, 
        max_length=500,
        verbose_name="Mensaje personalizado"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Invitación de Usuario'
        verbose_name_plural = 'Invitaciones de Usuarios'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['expires_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['email', 'empresa', 'status'],
                condition=models.Q(status='pending'),
                name='unique_pending_invitation_per_email_empresa'
            )
        ]
    
    def __str__(self):
        return f"Invitación para {self.email} a {self.empresa.nombre}"
    
    def is_expired(self):
        """Verifica si la invitación ha expirado"""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def can_be_accepted(self):
        """Verifica si la invitación puede ser aceptada"""
        return self.status == 'pending' and not self.is_expired()
    
    def mark_as_expired(self):
        """Marca la invitación como expirada"""
        self.status = 'expired'
        self.save(update_fields=['status'])
    
    def accept(self, user):
        """Marca la invitación como aceptada"""
        from django.utils import timezone
        self.status = 'accepted'
        self.accepted_at = timezone.now()
        self.save(update_fields=['status', 'accepted_at'])
        
        # Cancelar otras invitaciones pendientes para el mismo email en la misma empresa
        UserInvitation.objects.filter(
            email=self.email,
            empresa=self.empresa,
            status='pending'
        ).exclude(id=self.id).update(status='cancelled')
    
    def cancel(self):
        """Cancela la invitación"""
        self.status = 'cancelled'
        self.save(update_fields=['status'])
    
    def generate_token(self):
        """Genera un token único para la invitación"""
        import secrets
        import string
        
        # Generar token de 32 caracteres
        alphabet = string.ascii_letters + string.digits
        token = ''.join(secrets.choice(alphabet) for _ in range(32))
        
        # Verificar que sea único
        while UserInvitation.objects.filter(token=token).exists():
            token = ''.join(secrets.choice(alphabet) for _ in range(32))
        
        return token
    
    def save(self, *args, **kwargs):
        # Generar token si no existe
        if not self.token:
            self.token = self.generate_token()
        
        # Establecer fecha de expiración si no existe
        if not self.expires_at:
            from django.utils import timezone
            from django.conf import settings
            days = getattr(settings, 'INVITATION_EXPIRY_DAYS', 7)
            self.expires_at = timezone.now() + timezone.timedelta(days=days)
        
        super().save(*args, **kwargs)
