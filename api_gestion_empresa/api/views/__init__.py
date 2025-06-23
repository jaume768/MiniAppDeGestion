"""
Importaciones centralizadas para mantener compatibilidad con urls.py
"""

# Importar desde los módulos modularizados
from .base_views import (
    CategoriaViewSet,
    MarcaViewSet,
    ArticuloViewSet,
    ClienteViewSet,
    DepartamentoViewSet,
    EmpleadoViewSet,
    ProyectoViewSet
)
from .sales_views import (
    PresupuestoViewSet,
    PedidoViewSet,
    AlbaranViewSet,
    TicketViewSet
)
from .invoice_views import FacturaViewSet
from .reports_views import ReportesView

# Exportaciones para mantener compatibilidad
__all__ = [
    'CategoriaViewSet', 'MarcaViewSet', 'ArticuloViewSet', 'ClienteViewSet',
    'PresupuestoViewSet', 'PedidoViewSet', 'FacturaViewSet',
    'DepartamentoViewSet', 'EmpleadoViewSet', 'ProyectoViewSet',
    'AlbaranViewSet', 'TicketViewSet', 'ReportesView'
]
