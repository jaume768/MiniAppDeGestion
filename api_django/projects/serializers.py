from rest_framework import serializers
from .models import Proyecto


class ProyectoSerializer(serializers.ModelSerializer):
    """Serializer para Proyecto"""
    empleados_nombres = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Proyecto
        fields = ['id', 'nombre', 'descripcion', 'estado', 'estado_display', 
                 'fecha_inicio', 'fecha_fin', 'empleados', 'empleados_nombres']
    
    def get_empleados_nombres(self, obj):
        return [empleado.nombre for empleado in obj.empleados.all()]
