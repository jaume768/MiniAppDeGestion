from django.shortcuts import render
from rest_framework import viewsets
from .models import Proyecto
from .serializers import ProyectoSerializer


# Create your views here.

class ProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de proyectos"""
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer
