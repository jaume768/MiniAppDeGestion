from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, ExpressionWrapper, DurationField, F
from django.utils import timezone
from datetime import date
from .models import (
    Categoria, Articulo, Cliente,
    Presupuesto, Pedido, Factura,
    Departamento, Empleado, Proyecto
)
from .serializers import (
    CategoriaSerializer, ArticuloSerializer, ClienteSerializer,
    PresupuestoSerializer, PedidoSerializer, FacturaSerializer,
    DepartamentoSerializer, EmpleadoSerializer, ProyectoSerializer
)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ArticuloViewSet(viewsets.ModelViewSet):
    queryset = Articulo.objects.all()
    serializer_class = ArticuloSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

class PresupuestoViewSet(viewsets.ModelViewSet):
    queryset = Presupuesto.objects.all()
    serializer_class = PresupuestoSerializer

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer

class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer

class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer

class EmpleadoViewSet(viewsets.ModelViewSet):
    queryset = Empleado.objects.all()
    serializer_class = EmpleadoSerializer

class ProyectoViewSet(viewsets.ModelViewSet):
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer

class ReportesView(APIView):
    def get(self, request):
        # 1. Nómina total por departamento
        nomina = Empleado.objects.values(
            'departamento__nombre'
        ).annotate(total_salario=Sum('salario'))
        
        # 2. Proyectos por estado
        proyectos_estado = Proyecto.objects.values(
            'estado'
        ).annotate(total=Count('id'))
        
        # 3. Empleados por antigüedad
        hoy = date.today()
        empleados_antiguedad = Empleado.objects.annotate(
            antiguedad=ExpressionWrapper(
                hoy - F('fecha_contratacion'),
                output_field=DurationField()
            )
        ).values('nombre', 'antiguedad').order_by('fecha_contratacion')
        
        return Response({
            'nomina_departamentos': nomina,
            'proyectos_por_estado': proyectos_estado,
            'empleados_por_antiguedad': empleados_antiguedad
        })