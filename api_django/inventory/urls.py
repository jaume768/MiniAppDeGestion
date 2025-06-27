from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AlmacenViewSet, ArticuloStockViewSet, MovimientoStockViewSet,
    TransferenciaStockViewSet
)

router = DefaultRouter()
router.register(r'almacenes', AlmacenViewSet, basename='almacen')
router.register(r'stock', ArticuloStockViewSet, basename='articulo-stock')
router.register(r'movimientos', MovimientoStockViewSet, basename='movimiento-stock')
router.register(r'transferencias', TransferenciaStockViewSet, basename='transferencia-stock')

urlpatterns = [
    path('', include(router.urls)),
]
