from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import Empresa, CustomUser, UserInvitation


class EmpresaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Empresa"""
    
    usuarios_count = serializers.ReadOnlyField(source='get_usuarios_count')
    can_add_user = serializers.ReadOnlyField()
    
    class Meta:
        model = Empresa
        fields = [
            'id', 'nombre', 'cif', 'direccion', 'telefono', 'email', 'web',
            'plan', 'max_usuarios', 'activa', 'fecha_registro', 'fecha_vencimiento',
            'usuarios_count', 'can_add_user', 'created_at', 'updated_at'
        ]
        read_only_fields = ['fecha_registro', 'created_at', 'updated_at']
    
    def validate_cif(self, value):
        """Validar que el CIF sea único"""
        if self.instance and self.instance.cif == value:
            return value
        if Empresa.objects.filter(cif=value).exists():
            raise serializers.ValidationError("Ya existe una empresa con este CIF.")
        return value


class CustomUserSerializer(serializers.ModelSerializer):
    """Serializer para el modelo CustomUser"""
    
    empresa_nombre = serializers.ReadOnlyField(source='empresa.nombre')
    full_name = serializers.ReadOnlyField(source='get_full_name')
    permissions = serializers.ReadOnlyField(source='get_permissions')
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'empresa', 'empresa_nombre', 'role', 'telefono', 'cargo', 'avatar',
            'can_manage_users', 'can_view_reports', 'can_manage_settings',
            'is_active', 'ultimo_acceso', 'permissions',
            'date_joined', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'date_joined', 'created_at', 'updated_at', 'ultimo_acceso',
            'permissions', 'full_name', 'empresa_nombre'
        ]
    
    def validate_username(self, value):
        """Validar que el username sea único"""
        if self.instance and self.instance.username == value:
            return value
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este nombre de usuario.")
        return value
    
    def validate_email(self, value):
        """Validar que el email sea único globalmente"""
        if self.instance and self.instance.email == value:
            return value
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email.")
        return value


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de nuevos usuarios"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    empresa_nombre = serializers.ReadOnlyField(source='empresa.nombre')
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'first_name', 'last_name', 'password', 'password_confirm',
            'empresa', 'empresa_nombre', 'role', 'telefono', 'cargo'
        ]
    
    def validate(self, attrs):
        """Validaciones personalizadas"""
        # Verificar que las contraseñas coincidan
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden.")
        
        # Verificar que la empresa pueda agregar más usuarios
        empresa = attrs.get('empresa')
        if empresa and not empresa.can_add_user():
            raise serializers.ValidationError(
                f"La empresa {empresa.nombre} ha alcanzado su límite de {empresa.max_usuarios} usuarios."
            )
        
        return attrs
    
    def create(self, validated_data):
        """Crear usuario con contraseña encriptada"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = CustomUser.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer para login de usuarios"""
    
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Autenticar usuario"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            
            if not user:
                raise serializers.ValidationError("Credenciales incorrectas.")
            
            if not user.is_active:
                raise serializers.ValidationError("Cuenta desactivada.")
            
            # Verificar que la empresa esté activa (excepto para superadmins)
            if user.empresa and not user.empresa.activa:
                raise serializers.ValidationError("La empresa está desactivada.")
            
            attrs['user'] = user
            return attrs
        
        raise serializers.ValidationError("Se requieren username y password.")


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        """Verificar que la contraseña actual sea correcta"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta.")
        return value
    
    def validate(self, attrs):
        """Verificar que las nuevas contraseñas coincidan"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Las nuevas contraseñas no coinciden.")
        return attrs
    
    def save(self):
        """Cambiar la contraseña del usuario"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class EmpresaRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de nuevas empresas (solo superadmins)"""
    
    admin_username = serializers.CharField(write_only=True)
    admin_email = serializers.EmailField(write_only=True)
    admin_password = serializers.CharField(write_only=True, validators=[validate_password])
    admin_first_name = serializers.CharField(write_only=True)
    admin_last_name = serializers.CharField(write_only=True)
    
    class Meta:
        model = Empresa
        fields = [
            'nombre', 'cif', 'direccion', 'telefono', 'email', 'web', 'plan', 'max_usuarios',
            'admin_username', 'admin_email', 'admin_password', 'admin_first_name', 'admin_last_name'
        ]
    
    def validate_admin_username(self, value):
        """Validar que el username del admin sea único"""
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este nombre de usuario.")
        return value
    
    def validate_admin_email(self, value):
        """Validar que el email del admin sea único"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email.")
        return value
    
    def create(self, validated_data):
        """Crear empresa y su usuario administrador"""
        # Extraer datos del admin
        admin_data = {
            'username': validated_data.pop('admin_username'),
            'email': validated_data.pop('admin_email'),
            'first_name': validated_data.pop('admin_first_name'),
            'last_name': validated_data.pop('admin_last_name'),
        }
        admin_password = validated_data.pop('admin_password')
        
        # Crear empresa
        empresa = Empresa.objects.create(**validated_data)
        
        # Crear usuario administrador
        admin_user = CustomUser.objects.create_user(
            password=admin_password,
            empresa=empresa,
            role='admin',
            **admin_data
        )
        
        return empresa


class UserInvitationSerializer(serializers.ModelSerializer):
    """Serializer para el modelo UserInvitation"""
    
    empresa_nombre = serializers.ReadOnlyField(source='empresa.nombre')
    invited_by_name = serializers.ReadOnlyField(source='invited_by.get_full_name')
    is_expired = serializers.ReadOnlyField()
    can_be_accepted = serializers.ReadOnlyField()
    
    class Meta:
        model = UserInvitation
        fields = [
            'id', 'email', 'role', 'first_name', 'last_name', 'cargo', 'telefono',
            'can_manage_users', 'can_view_reports', 'can_manage_settings',
            'message', 'status', 'created_at', 'expires_at', 'accepted_at',
            'empresa', 'empresa_nombre', 'invited_by', 'invited_by_name',
            'is_expired', 'can_be_accepted'
        ]
        read_only_fields = [
            'token', 'status', 'created_at', 'expires_at', 'accepted_at',
            'empresa_nombre', 'invited_by_name', 'is_expired', 'can_be_accepted'
        ]
    
    def validate_email(self, value):
        """Validar que no exista un usuario con este email en la empresa"""
        empresa = self.context.get('empresa')
        if empresa and CustomUser.objects.filter(email=value, empresa=empresa).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email en la empresa.")
        return value


class InviteUserSerializer(serializers.ModelSerializer):
    """Serializer para crear invitaciones de usuarios"""
    
    class Meta:
        model = UserInvitation
        fields = [
            'email', 'role', 'first_name', 'last_name', 'cargo', 'telefono',
            'can_manage_users', 'can_view_reports', 'can_manage_settings',
            'message'
        ]
    
    def validate_email(self, value):
        """Validar email y verificar que no exista invitación pendiente"""
        empresa = self.context['request'].user.empresa
        
        # Verificar que no exista usuario con este email
        if CustomUser.objects.filter(email=value, empresa=empresa).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email en la empresa.")
        
        # Verificar que no exista invitación pendiente
        if UserInvitation.objects.filter(
            email=value, 
            empresa=empresa, 
            status='pending'
        ).exists():
            raise serializers.ValidationError("Ya existe una invitación pendiente para este email.")
        
        return value
    
    def validate_role(self, value):
        """Validar que el rol sea válido según el usuario que invita"""
        user = self.context['request'].user
        
        # Superadmins pueden asignar cualquier rol excepto superadmin
        if user.is_superadmin and value == 'superadmin':
            raise serializers.ValidationError("No se puede invitar a usuarios como superadmin.")
        
        # Admins de empresa no pueden asignar roles de admin o superiores
        elif user.is_empresa_admin and value in ['admin', 'superadmin']:
            raise serializers.ValidationError("No tienes permisos para asignar este rol.")
        
        # Usuarios normales no pueden invitar
        elif not (user.is_superadmin or user.is_empresa_admin):
            raise serializers.ValidationError("No tienes permisos para invitar usuarios.")
        
        return value
    
    def create(self, validated_data):
        """Crear invitación y enviar email"""
        user = self.context['request'].user
        
        # Asignar empresa y usuario que invita
        validated_data['empresa'] = user.empresa
        validated_data['invited_by'] = user
        
        invitation = super().create(validated_data)
        
        # Enviar email de invitación
        from .utils import send_invitation_email
        send_invitation_email(invitation)
        
        return invitation


class AcceptInvitationSerializer(serializers.Serializer):
    """Serializer para aceptar invitaciones"""
    
    token = serializers.CharField(max_length=100)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    def validate_token(self, value):
        """Validar que el token sea válido"""
        try:
            invitation = UserInvitation.objects.get(token=value)
            if not invitation.can_be_accepted():
                if invitation.is_expired():
                    raise serializers.ValidationError("La invitación ha expirado.")
                else:
                    raise serializers.ValidationError("La invitación ya no está disponible.")
            self.invitation = invitation
            return value
        except UserInvitation.DoesNotExist:
            raise serializers.ValidationError("Token de invitación inválido.")
    
    def validate_username(self, value):
        """Validar que el username sea único"""
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este nombre de usuario.")
        return value
    
    def validate(self, attrs):
        """Validar que las contraseñas coincidan"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden.")
        return attrs
    
    def save(self):
        """Crear usuario y marcar invitación como aceptada"""
        invitation = self.invitation
        
        # Crear usuario
        user = CustomUser.objects.create_user(
            username=self.validated_data['username'],
            email=invitation.email,
            password=self.validated_data['password'],
            first_name=invitation.first_name,
            last_name=invitation.last_name,
            empresa=invitation.empresa,
            role=invitation.role,
            telefono=invitation.telefono,
            cargo=invitation.cargo,
            can_manage_users=invitation.can_manage_users,
            can_view_reports=invitation.can_view_reports,
            can_manage_settings=invitation.can_manage_settings,
        )
        
        # Marcar invitación como aceptada
        invitation.accept(user)
        
        return user


class PublicEmpresaRegistrationSerializer(serializers.Serializer):
    """Serializer para registro público de empresas con admin"""
    
    # Datos de la empresa
    empresa_nombre = serializers.CharField(max_length=200)
    empresa_cif = serializers.CharField(max_length=20)
    empresa_direccion = serializers.CharField(max_length=200, required=False, allow_blank=True)
    empresa_telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    empresa_email = serializers.EmailField(required=False, allow_blank=True)
    empresa_web = serializers.URLField(required=False, allow_blank=True)
    
    # Datos del administrador
    admin_username = serializers.CharField(max_length=150)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(write_only=True, validators=[validate_password])
    admin_password_confirm = serializers.CharField(write_only=True)
    admin_first_name = serializers.CharField(max_length=150)
    admin_last_name = serializers.CharField(max_length=150)
    admin_telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    admin_cargo = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Términos y condiciones
    accept_terms = serializers.BooleanField()
    
    def validate_empresa_cif(self, value):
        """Validar que el CIF de la empresa sea único"""
        if Empresa.objects.filter(cif=value).exists():
            raise serializers.ValidationError("Ya existe una empresa registrada con este CIF.")
        return value
    
    def validate_admin_username(self, value):
        """Validar que el username del admin sea único"""
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este nombre de usuario.")
        return value
    
    def validate_admin_email(self, value):
        """Validar que el email del admin sea único"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email.")
        return value
    
    def validate_accept_terms(self, value):
        """Validar que se hayan aceptado los términos"""
        if not value:
            raise serializers.ValidationError("Debe aceptar los términos y condiciones.")
        return value
    
    def validate(self, attrs):
        """Validar que las contraseñas del admin coincidan"""
        if attrs['admin_password'] != attrs['admin_password_confirm']:
            raise serializers.ValidationError("Las contraseñas del administrador no coinciden.")
        return attrs
    
    def create(self, validated_data):
        """Crear empresa y usuario administrador"""
        from django.db import transaction
        
        with transaction.atomic():
            # Crear empresa
            empresa = Empresa.objects.create(
                nombre=validated_data['empresa_nombre'],
                cif=validated_data['empresa_cif'],
                direccion=validated_data.get('empresa_direccion', ''),
                telefono=validated_data.get('empresa_telefono', ''),
                email=validated_data.get('empresa_email', ''),
                web=validated_data.get('empresa_web', ''),
                plan='basic',  # Plan básico por defecto
                activa=True
            )
            
            # Crear usuario administrador
            admin = CustomUser.objects.create_user(
                username=validated_data['admin_username'],
                email=validated_data['admin_email'],
                password=validated_data['admin_password'],
                first_name=validated_data['admin_first_name'],
                last_name=validated_data['admin_last_name'],
                telefono=validated_data.get('admin_telefono', ''),
                cargo=validated_data.get('admin_cargo', ''),
                empresa=empresa,
                role='admin',
                can_manage_users=True,
                can_manage_settings=True,
                is_active=True
            )
            
            return {
                'empresa': empresa,
                'admin': admin
            }
