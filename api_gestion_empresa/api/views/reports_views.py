"""
Vistas para generación de reportes y estadísticas del sistema.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, ExpressionWrapper, DurationField, F
from django.utils import timezone
from datetime import date
from ..models import (
    Empleado, Proyecto, Cliente, Factura, Albaran, Ticket
)


class ReportesView(APIView):
    """Vista para generar diferentes tipos de reportes."""
    
    def get(self, request, format=None, **kwargs):
        """
        Dispatcher principal para diferentes tipos de reportes.
        Determina qué reporte mostrar basándose en la URL.
        """
        path = request.path
        
        # Reportes de proyectos por estado
        if 'proyectos' in path:
            return self.get_proyectos_por_estado()
        
        # Reportes de ventas por año
        elif 'ventas' in path:
            year = kwargs.get('year', timezone.now().year)
            return self.get_ventas_por_mes(year)
        
        # Reporte general predeterminado
        else:
            return self.get_resumen_general()
    
    def get_resumen_general(self):
        """Reporte general con datos resumidos de toda la aplicación."""
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
        
        # 4. Clientes recientes
        clientes_recientes = Cliente.objects.all().order_by('-id')[:5].values(
            'id', 'nombre', 'email'
        )
        
        # 5. Últimos proyectos
        ultimos_proyectos = Proyecto.objects.all().order_by('-fecha_inicio')[:5].values(
            'id', 'nombre', 'estado', 'fecha_inicio', 'fecha_fin'
        )
        
        # 6. Facturas recientes
        facturas_recientes = Factura.objects.all().order_by('-fecha')[:5].values(
            'id', 'pedido__cliente__nombre', 'total', 'fecha'
        )
        
        # 7. Albaranes recientes
        albaranes_recientes = Albaran.objects.all().order_by('-fecha')[:5].values(
            'id', 'cliente__nombre', 'total', 'fecha'
        )
        
        # 8. Tickets recientes
        tickets_recientes = Ticket.objects.all().order_by('-fecha')[:5].values(
            'id', 'cliente__nombre', 'total', 'fecha'
        )

        return Response({
            'nomina_departamentos': nomina,
            'proyectos_por_estado': proyectos_estado,
            'empleados_por_antiguedad': empleados_antiguedad,
            'clientes_recientes': clientes_recientes,
            'ultimos_proyectos': ultimos_proyectos,
            'facturas_recientes': facturas_recientes,
            'albaranes_recientes': albaranes_recientes,
            'tickets_recientes': tickets_recientes
        })
    
    def get_proyectos_por_estado(self):
        """Obtener proyectos agrupados por estado."""
        # Estados posibles de proyectos
        estados = ['pendiente', 'en_progreso', 'completado', 'cancelado']
        resultado = {}
        
        # Obtener proyectos por cada estado
        for estado in estados:
            proyectos = Proyecto.objects.filter(estado=estado).values(
                'id', 'nombre', 'descripcion', 'fecha_inicio', 'fecha_fin'
            )
            resultado[estado] = list(proyectos)
        
        # Añadir resumen de contadores
        contadores = Proyecto.objects.values('estado').annotate(total=Count('id'))
        resumen = {item['estado']: item['total'] for item in contadores}
        resultado['resumen'] = resumen
        
        return Response(resultado)
    
    def get_ventas_por_mes(self, year=None):
        """Obtener ventas agrupadas por mes para un año específico."""
        if not year:
            year = timezone.now().year
        else:
            try:
                year = int(year)
            except (ValueError, TypeError):
                year = timezone.now().year
        
        # Ventas mensuales basadas en facturas
        meses = range(1, 13)
        ventas_por_mes = []
        
        for mes in meses:
            # Suma de facturación por mes
            ventas = Factura.objects.filter(
                fecha__year=year,
                fecha__month=mes
            ).aggregate(total=Sum('total'))
            
            ventas_por_mes.append({
                'mes': mes,
                'total': ventas['total'] or 0
            })
        
        return Response({
            'year': year,
            'ventas_por_mes': ventas_por_mes
        })
    
    def get_clientes_top(self):
        """Obtener listado de clientes con mayor facturación."""
        clientes = Cliente.objects.annotate(
            total_facturas=Count('factura'),
            total_facturacion=Sum('factura__total')
        ).order_by('-total_facturacion')[:10].values(
            'id', 'nombre', 'total_facturas', 'total_facturacion'
        )
        
        return Response(list(clientes))
    
    def get_productividad_empleados(self):
        """Obtener datos de productividad de empleados."""
        empleados = Empleado.objects.annotate(
            total_proyectos=Count('proyectos')
        ).values('id', 'nombre', 'departamento__nombre', 'total_proyectos')
        
        return Response(list(empleados))
