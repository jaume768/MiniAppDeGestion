from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Departamento, Empleado
from .serializers import DepartamentoSerializer, EmpleadoSerializer


# Create your views here.

class DepartamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de departamentos"""
    queryset = Departamento.objects.all()  # Para el router
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Departamento.objects.all()


class EmpleadoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de empleados"""
    queryset = Empleado.objects.all()  # Para el router
    serializer_class = EmpleadoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Empleado.objects.all()
