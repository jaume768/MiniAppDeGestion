from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CajaSessionViewSet, 
    MovimientoCajaViewSet, 
    CuadreCajaViewSet,
    EstadisticasPOSViewSet
)

router = DefaultRouter()
router.register(r'sesiones', CajaSessionViewSet, basename='cajasession')
router.register(r'movimientos', MovimientoCajaViewSet, basename='movimientocaja')
router.register(r'cuadres', CuadreCajaViewSet, basename='cuadrecaja')
router.register(r'estadisticas', EstadisticasPOSViewSet, basename='estadisticaspos')

urlpatterns = [
    path('', include(router.urls)),
]
