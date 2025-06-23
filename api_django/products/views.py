from django.shortcuts import render
from rest_framework import viewsets
from .models import Categoria, Marca, Articulo
from .serializers import CategoriaSerializer, MarcaSerializer, ArticuloSerializer


# Create your views here.

class CategoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de categorías"""
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class MarcaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de marcas"""
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer


class ArticuloViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de artículos"""
    queryset = Articulo.objects.all()
    serializer_class = ArticuloSerializer
