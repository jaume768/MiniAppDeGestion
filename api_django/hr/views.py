from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import HasEmpresaPermission
from .models import Departamento, Empleado
from .serializers import DepartamentoSerializer, EmpleadoSerializer


# Create your views here.

class DepartamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de departamentos"""
    queryset = Departamento.objects.all()  # Para el router
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        # El tenant filtering se hace automáticamente en el modelo
        return Departamento.objects.all()


class EmpleadoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de empleados"""
    queryset = Empleado.objects.all()  # Para el router
    serializer_class = EmpleadoSerializer
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant y departamento si se especifica"""
        queryset = Empleado.objects.all()
        
        # Filtrar por departamento si se especifica en query params
        departamento_id = self.request.query_params.get('departamento', None)
        if departamento_id is not None:
            queryset = queryset.filter(departamento_id=departamento_id)
            
        return queryset
