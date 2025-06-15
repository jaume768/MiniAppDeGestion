from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    CategoriaViewSet, ArticuloViewSet, ClienteViewSet,
    PresupuestoViewSet, PedidoViewSet, FacturaViewSet,
    DepartamentoViewSet, EmpleadoViewSet, ProyectoViewSet,
    ReportesView
)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'articulos', ArticuloViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'presupuestos', PresupuestoViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'facturas', FacturaViewSet)
router.register(r'departamentos', DepartamentoViewSet)
router.register(r'empleados', EmpleadoViewSet)
router.register(r'proyectos', ProyectoViewSet)

# Combina las rutas del router con la ruta adicional para ReportesView
urlpatterns = [
    path('', include(router.urls)),
    path('reportes/', ReportesView.as_view(), name='reportes'),
]
