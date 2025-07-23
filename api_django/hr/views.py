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
        # Optimizar consultas con select_related
        queryset = Empleado.objects.select_related(
            'usuario', 'departamento', 'usuario__empresa'
        ).all()
        
        # Filtrar por departamento si se especifica en query params
        departamento_id = self.request.query_params.get('departamento', None)
        if departamento_id is not None:
            queryset = queryset.filter(departamento_id=departamento_id)
        
        # Filtrar por usuarios activos si se especifica
        solo_activos = self.request.query_params.get('activos', None)
        if solo_activos and solo_activos.lower() == 'true':
            queryset = queryset.filter(activo=True, usuario__is_active=True)
            
        return queryset
