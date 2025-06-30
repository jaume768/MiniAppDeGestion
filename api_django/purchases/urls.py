from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PedidoCompraViewSet, PedidoCompraItemViewSet,
    AlbaranCompraViewSet, AlbaranCompraItemViewSet,
    FacturaCompraViewSet, FacturaCompraItemViewSet,
    CuentaPorPagarViewSet
)

app_name = 'purchases'

# Router para las API REST
router = DefaultRouter()
router.register(r'pedidos', PedidoCompraViewSet, basename='pedidos')
router.register(r'pedidos-items', PedidoCompraItemViewSet, basename='pedidos-items')
router.register(r'albaranes', AlbaranCompraViewSet, basename='albaranes')
router.register(r'albaranes-items', AlbaranCompraItemViewSet, basename='albaranes-items')
router.register(r'facturas', FacturaCompraViewSet, basename='facturas')
router.register(r'facturas-items', FacturaCompraItemViewSet, basename='facturas-items')
router.register(r'cuentas-por-pagar', CuentaPorPagarViewSet, basename='cuentas-por-pagar')

urlpatterns = [
    path('', include(router.urls)),
]

# URLs adicionales para acciones específicas
# Ejemplos de endpoints generados:

# PEDIDOS DE COMPRA:
# GET/POST     /api/purchases/pedidos/
# GET/PUT/DELETE /api/purchases/pedidos/{id}/
# POST         /api/purchases/pedidos/{id}/confirmar/
# POST         /api/purchases/pedidos/{id}/cancelar/
# POST         /api/purchases/pedidos/{id}/crear_albaran/
# GET          /api/purchases/pedidos/resumen/

# ALBARANES DE COMPRA:
# GET/POST     /api/purchases/albaranes/
# GET/PUT/DELETE /api/purchases/albaranes/{id}/
# POST         /api/purchases/albaranes/{id}/recibir_mercancia/
# POST         /api/purchases/albaranes/{id}/crear_factura/

# FACTURAS DE COMPRA:
# GET/POST     /api/purchases/facturas/
# GET/PUT/DELETE /api/purchases/facturas/{id}/
# POST         /api/purchases/facturas/{id}/marcar_pagada/
# GET          /api/purchases/facturas/vencidas/
# GET          /api/purchases/facturas/por_vencer/

# CUENTAS POR PAGAR:
# GET/POST     /api/purchases/cuentas-por-pagar/
# GET/PUT/DELETE /api/purchases/cuentas-por-pagar/{id}/
# GET          /api/purchases/cuentas-por-pagar/resumen/
# GET          /api/purchases/cuentas-por-pagar/por_proveedor/

# REPORTES:
# GET          /api/purchases/reportes/resumen_compras/
# GET          /api/purchases/reportes/rendimiento_proveedores/
