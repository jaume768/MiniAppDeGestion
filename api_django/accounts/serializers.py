from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import Empresa, CustomUser


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
