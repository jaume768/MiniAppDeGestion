from django.db import models
from hr.models import Empleado

# Create your models here.

class Proyecto(models.Model):
    """Modelo de Proyecto"""
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(blank=True, null=True)
    presupuesto = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    estado_choices = [
        ('planificado', 'Planificado'),
        ('en_progreso', 'En Progreso'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]
    estado = models.CharField(max_length=20, choices=estado_choices, default='planificado')
    empleados = models.ManyToManyField(Empleado, blank=True, related_name='proyectos')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_inicio', 'nombre']

    def __str__(self):
        return self.nombre
