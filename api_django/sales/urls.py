from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PresupuestoViewSet, PedidoViewSet, AlbaranViewSet, 
    TicketViewSet, FacturaViewSet
)

router = DefaultRouter()
router.register(r'presupuestos', PresupuestoViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'albaranes', AlbaranViewSet)
router.register(r'tickets', TicketViewSet)
router.register(r'facturas', FacturaViewSet)

urlpatterns = [
    path('api/sales/', include(router.urls)),
]
