from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Proyecto
from .serializers import ProyectoSerializer


# Create your views here.

class ProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de proyectos"""
    queryset = Proyecto.objects.all()  # Para el router
    serializer_class = ProyectoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset filtrado por tenant"""
        return Proyecto.objects.all()
