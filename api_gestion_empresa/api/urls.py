from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaViewSet, ArticuloViewSet, ClienteViewSet,
    PresupuestoViewSet, PedidoViewSet, FacturaViewSet
)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'articulos', ArticuloViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'presupuestos', PresupuestoViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'facturas', FacturaViewSet)

urlpatterns = router.urls
