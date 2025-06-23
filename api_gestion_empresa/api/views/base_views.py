"""
ViewSets básicos para entidades simples con operaciones CRUD estándar.
"""
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from ..models import (
    Categoria, Marca, Articulo, Cliente, Departamento, Empleado, Proyecto
)
from ..serializers import (
    CategoriaSerializer, MarcaSerializer, ArticuloSerializer, ClienteSerializer,
    DepartamentoSerializer, EmpleadoSerializer, ProyectoSerializer
)


class CategoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de categorías."""
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre']
    ordering = ['nombre']


class MarcaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de marcas."""
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nombre', 'descripcion', 'pais_origen']
    ordering_fields = ['nombre', 'pais_origen']
    ordering = ['nombre']


class ArticuloViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de artículos."""
    queryset = Articulo.objects.select_related('categoria', 'marca').all()
    serializer_class = ArticuloSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categoria', 'marca', 'iva']
    search_fields = ['nombre', 'descripcion', 'modelo', 'marca__nombre', 'categoria__nombre']
    ordering_fields = ['nombre', 'precio', 'stock', 'marca__nombre', 'modelo']
    ordering = ['marca__nombre', 'modelo', 'nombre']


class ClienteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de clientes."""
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nombre', 'apellido', 'email', 'telefono']
    ordering_fields = ['nombre', 'apellido', 'email']
    ordering = ['nombre']


class DepartamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de departamentos."""
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre']
    ordering = ['nombre']


class EmpleadoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de empleados."""
    queryset = Empleado.objects.select_related('departamento').all()
    serializer_class = EmpleadoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['departamento']
    search_fields = ['nombre', 'apellido', 'email', 'telefono', 'departamento__nombre']
    ordering_fields = ['nombre', 'apellido', 'email', 'departamento__nombre']
    ordering = ['departamento__nombre', 'nombre']


class ProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de proyectos."""
    queryset = Proyecto.objects.select_related('empleado').all()
    serializer_class = ProyectoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empleado']
    search_fields = ['nombre', 'descripcion', 'empleado__nombre', 'empleado__apellido']
    ordering_fields = ['nombre', 'empleado__nombre', 'empleado__apellido']
    ordering = ['empleado__nombre', 'nombre']
