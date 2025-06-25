from django.shortcuts import render
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from itertools import chain
from operator import attrgetter
from .models import Cliente, Proveedor
from .serializers import ClienteSerializer, ProveedorSerializer, ContactoSerializer


# Create your views here.

class ContactoPagination(PageNumberPagination):
    """Paginación personalizada para contactos"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ClienteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de clientes"""
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'email', 'telefono', 'cif_nif']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']


class ProveedorViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de proveedores"""
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'email', 'telefono', 'cif_nif']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']


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
                Q(cif_nif__icontains=search)
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
                Q(cif_nif__icontains=search)
            )
        if activo:
            proveedores_qs = proveedores_qs.filter(activo=activo.lower() == 'true')
        
        # Combinar y agregar tipo
        contactos_list = []
        
        for cliente in clientes_qs:
            contactos_list.append({
                'id': cliente.id,
                'nombre': cliente.nombre,
                'email': cliente.email,
                'telefono': cliente.telefono,
                'direccion': cliente.direccion,
                'cif_nif': cliente.cif_nif,
                'activo': cliente.activo,
                'tipo': 'cliente',
                'created_at': cliente.created_at,
                'updated_at': cliente.updated_at,
            })
        
        for proveedor in proveedores_qs:
            contactos_list.append({
                'id': proveedor.id,
                'nombre': proveedor.nombre,
                'email': proveedor.email,
                'telefono': proveedor.telefono,
                'direccion': proveedor.direccion,
                'cif_nif': proveedor.cif_nif,
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
