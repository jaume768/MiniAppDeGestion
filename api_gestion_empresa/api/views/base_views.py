"""
ViewSets básicos para entidades simples con operaciones CRUD estándar.
"""
from rest_framework import viewsets
from ..models import (
    Categoria, Articulo, Cliente, Departamento, Empleado, Proyecto
)
from ..serializers import (
    CategoriaSerializer, ArticuloSerializer, ClienteSerializer,
    DepartamentoSerializer, EmpleadoSerializer, ProyectoSerializer
)


class CategoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de categorías."""
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ArticuloViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de artículos."""
    queryset = Articulo.objects.all()
    serializer_class = ArticuloSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de clientes."""
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


class DepartamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de departamentos."""
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer


class EmpleadoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de empleados."""
    queryset = Empleado.objects.all()
    serializer_class = EmpleadoSerializer


class ProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de proyectos."""
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer
