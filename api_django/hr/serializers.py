from rest_framework import serializers
from .models import Departamento, Empleado


class DepartamentoSerializer(serializers.ModelSerializer):
    """Serializer para Departamento"""
    empleados_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Departamento
        fields = ['id', 'nombre', 'descripcion', 'empleados_count']
    
    def get_empleados_count(self, obj):
        return obj.empleado_set.count()


class EmpleadoSerializer(serializers.ModelSerializer):
    """Serializer para Empleado"""
    # Campos relacionados del usuario (read-only para mostrar)
    nombre = serializers.CharField(source='usuario.first_name', read_only=True)
    apellidos = serializers.CharField(source='usuario.last_name', read_only=True)
    email = serializers.CharField(source='usuario.email', read_only=True)
    telefono = serializers.CharField(source='usuario.telefono', read_only=True)
    username = serializers.CharField(source='usuario.username', read_only=True)
    
    # Campo relacionado del departamento
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    
    # Campos para crear/editar datos del usuario (write-only)
    usuario_data = serializers.DictField(write_only=True, required=False)
    
    class Meta:
        model = Empleado
        fields = [
            'id', 'usuario', 'nombre', 'apellidos', 'email', 'telefono', 'username',
            'departamento', 'departamento_nombre', 'puesto', 'salario', 
            'fecha_contratacion', 'numero_empleado', 'activo',
            'usuario_data', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        """Crear empleado junto con usuario si es necesario"""
        from accounts.models import CustomUser
        
        usuario_data = validated_data.pop('usuario_data', None)
        usuario = validated_data.get('usuario')
        
        # Si no se proporciona usuario pero sí usuario_data, crear usuario
        if not usuario and usuario_data:
            usuario_data['role'] = 'employee'  # Forzar role employee
            usuario_data['empresa'] = self.context['request'].user.empresa
            usuario = CustomUser.objects.create_user(**usuario_data)
            validated_data['usuario'] = usuario
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Actualizar empleado y opcionalmente datos del usuario"""
        usuario_data = validated_data.pop('usuario_data', None)
        
        # Actualizar datos del usuario si se proporcionan
        if usuario_data and instance.usuario:
            usuario = instance.usuario
            for attr, value in usuario_data.items():
                if hasattr(usuario, attr):
                    setattr(usuario, attr, value)
            usuario.save()
        
        return super().update(instance, validated_data)
