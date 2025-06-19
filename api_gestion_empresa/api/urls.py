from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    CategoriaViewSet, ArticuloViewSet, ClienteViewSet,
    PresupuestoViewSet, PedidoViewSet, FacturaViewSet,
    DepartamentoViewSet, EmpleadoViewSet, ProyectoViewSet,
    AlbaranViewSet, TicketViewSet,
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
router.register(r'albaranes', AlbaranViewSet)
router.register(r'tickets', TicketViewSet)

# Combina las rutas del router con las rutas adicionales para ReportesView
urlpatterns = [
    path('', include(router.urls)),
    # Rutas para reportes
    path('reportes/', ReportesView.as_view(), name='reportes'),
    path('reportes/proyectos/', ReportesView.as_view(), name='reportes_proyectos'),
    path('reportes/ventas/<str:year>/', ReportesView.as_view(), name='reportes_ventas'),
    path('reportes/ventas/', ReportesView.as_view(), name='reportes_ventas_actual'),
    path('reportes/nominas/', ReportesView.as_view(), name='reportes_nominas'),
    path('reportes/clientes-top/', ReportesView.as_view(), name='reportes_clientes_top'),
    path('reportes/facturacion-por-cliente/', ReportesView.as_view(), name='reportes_facturacion_cliente'),
    path('reportes/productividad-empleados/', ReportesView.as_view(), name='reportes_productividad'),
    
    # Rutas específicas para empleados
    path('empleados/<int:empleado_id>/proyectos/', ReportesView.as_view(), name='empleado_proyectos'),
    path('empleados/por-departamento/<int:departamento_id>/', ReportesView.as_view(), name='empleados_por_departamento'),
    
    # Otras rutas específicas
    path('presupuestos/<int:presupuesto_id>/items/', PresupuestoViewSet.as_view({'get': 'get_items'}), name='presupuesto_items'),
    path('pedidos/crear-desde-presupuesto/', PedidoViewSet.as_view({'post': 'crear_desde_presupuesto'}), name='pedido_desde_presupuesto'),
    path('facturas/crear-desde-presupuesto/', FacturaViewSet.as_view({'post': 'crear_desde_presupuesto'}), name='factura_desde_presupuesto'),
    path('facturas/crear-desde-pedido/', FacturaViewSet.as_view({'post': 'crear_desde_pedido'}), name='factura_desde_pedido'),
    path('facturas/crear-desde-albaran/', FacturaViewSet.as_view({'post': 'crear_desde_albaran'}), name='factura_desde_albaran'),
    path('presupuestos/<int:presupuesto_id>/generar-pdf/', PresupuestoViewSet.as_view({'get': 'generar_pdf'}), name='generar_pdf_presupuesto'),
    path('facturas/<int:factura_id>/generar-pdf/', FacturaViewSet.as_view({'get': 'generar_pdf'}), name='generar_pdf_factura'),
]
