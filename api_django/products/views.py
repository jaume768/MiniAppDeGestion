from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Categoria, Marca, Articulo
from .serializers import CategoriaSerializer, MarcaSerializer, ArticuloSerializer


# Create your views here.

class CategoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de categorías"""
    queryset = Categoria.objects.all()  # Para el router
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Categoria.objects.all()


class MarcaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de marcas"""
    queryset = Marca.objects.all()  # Para el router
    serializer_class = MarcaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Marca.objects.all()


class ArticuloViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de artículos"""
    queryset = Articulo.objects.all()  # Para el router
    serializer_class = ArticuloSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Articulo.objects.all()
