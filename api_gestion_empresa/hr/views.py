from django.shortcuts import render
from rest_framework import viewsets
from .models import Departamento, Empleado
from .serializers import DepartamentoSerializer, EmpleadoSerializer


# Create your views here.

class DepartamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de departamentos"""
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer


class EmpleadoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de empleados"""
    queryset = Empleado.objects.all()
    serializer_class = EmpleadoSerializer
