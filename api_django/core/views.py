from django.shortcuts import render
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from itertools import chain
from operator import attrgetter
from .models import Cliente, Proveedor, Serie
from .serializers import ClienteSerializer, ProveedorSerializer, SerieSerializer, ContactoSerializer


# Create your views here.

class ContactoPagination(PageNumberPagination):
    """Paginación personalizada para contactos"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ClienteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de clientes"""
    queryset = Cliente.objects.all()  # Para el router
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'es_empresa']
    search_fields = ['nombre', 'nombre_comercial', 'email', 'telefono', 'movil', 'cif', 'poblacion', 'tags']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Cliente.objects.all()


class ProveedorViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de proveedores"""
    queryset = Proveedor.objects.all()  # Para el router
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'es_empresa']
    search_fields = ['nombre', 'nombre_comercial', 'email', 'telefono', 'movil', 'cif_nif', 'poblacion', 'tags']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Proveedor.objects.all()


class SerieViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de series"""
    queryset = Serie.objects.all()  # Para el router
    serializer_class = SerieSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activa', 'almacen']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return self.queryset.filter(empresa=self.request.user.empresa)


class ContactosViewSet(viewsets.ViewSet):
    """ViewSet para vista combinada de contactos (clientes y proveedores)"""
    pagination_class = ContactoPagination
    
    def list(self, request):
        """Lista todos los contactos (clientes y proveedores) ordenados alfabéticamente"""
        # Obtener parámetros de filtrado
        search = request.query_params.get('search', '')
        activo = request.query_params.get('activo', '')
        
        # Obtener clientes
        clientes_qs = Cliente.objects.all()
        if search:
            clientes_qs = clientes_qs.filter(
                Q(nombre__icontains=search) |
                Q(email__icontains=search) |
                Q(telefono__icontains=search) |
                Q(movil__icontains=search) |
                Q(cif__icontains=search) |
                Q(poblacion__icontains=search) |
                Q(tags__icontains=search)
            )
        if activo:
            clientes_qs = clientes_qs.filter(activo=activo.lower() == 'true')
        
        # Obtener proveedores
        proveedores_qs = Proveedor.objects.all()
        if search:
            proveedores_qs = proveedores_qs.filter(
                Q(nombre__icontains=search) |
                Q(email__icontains=search) |
                Q(telefono__icontains=search) |
                Q(movil__icontains=search) |
                Q(cif_nif__icontains=search) |
                Q(poblacion__icontains=search) |
                Q(tags__icontains=search)
            )
        if activo:
            proveedores_qs = proveedores_qs.filter(activo=activo.lower() == 'true')
        
        # Combinar y agregar tipo
        contactos_list = []
        
        for cliente in clientes_qs:
            contactos_list.append({
                'id': cliente.id,
                'nombre': cliente.nombre,
                'nombre_comercial': cliente.nombre_comercial,
                'es_empresa': cliente.es_empresa,
                'email': cliente.email,
                'telefono': cliente.telefono,
                'movil': cliente.movil,
                'website': cliente.website,
                'direccion': cliente.direccion,
                'poblacion': cliente.poblacion,
                'codigo_postal': cliente.codigo_postal,
                'provincia': cliente.provincia,
                'pais': cliente.pais,
                'cif_nif': cliente.cif,
                'identificacion_vat': cliente.identificacion_vat,
                'tags': cliente.tags,
                'activo': cliente.activo,
                'tipo': 'cliente',
                'created_at': cliente.created_at,
                'updated_at': cliente.updated_at,
            })
        
        for proveedor in proveedores_qs:
            contactos_list.append({
                'id': proveedor.id,
                'nombre': proveedor.nombre,
                'nombre_comercial': proveedor.nombre_comercial,
                'es_empresa': proveedor.es_empresa,
                'email': proveedor.email,
                'telefono': proveedor.telefono,
                'movil': proveedor.movil,
                'website': proveedor.website,
                'direccion': proveedor.direccion,
                'poblacion': proveedor.poblacion,
                'codigo_postal': proveedor.codigo_postal,
                'provincia': proveedor.provincia,
                'pais': proveedor.pais,
                'cif_nif': proveedor.cif_nif,
                'identificacion_vat': proveedor.identificacion_vat,
                'tags': proveedor.tags,
                'activo': proveedor.activo,
                'tipo': 'proveedor',
                'created_at': proveedor.created_at,
                'updated_at': proveedor.updated_at,
            })
        
        # Ordenar alfabéticamente por nombre
        contactos_list = sorted(contactos_list, key=lambda x: x['nombre'].lower())
        
        # Aplicar paginación manual
        paginator = ContactoPagination()
        paginated_contactos = paginator.paginate_queryset(contactos_list, request)
        
        serializer = ContactoSerializer(paginated_contactos, many=True)
        return paginator.get_paginated_response(serializer.data)
