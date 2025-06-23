from rest_framework import serializers
from .models import Departamento, Empleado


class DepartamentoSerializer(serializers.ModelSerializer):
    """Serializer para Departamento"""
    empleados_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Departamento
        fields = ['id', 'nombre', 'descripcion', 'empleados_count']
    
    def get_empleados_count(self, obj):
        return obj.empleados.count()


class EmpleadoSerializer(serializers.ModelSerializer):
    """Serializer para Empleado"""
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    
    class Meta:
        model = Empleado
        fields = ['id', 'nombre', 'puesto', 'departamento', 'departamento_nombre', 
                 'salario', 'fecha_contratacion']
