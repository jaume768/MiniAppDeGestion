# Importaciones desde los módulos específicos
from .base_views import (
    CategoriaViewSet, ArticuloViewSet, ClienteViewSet,
    DepartamentoViewSet, EmpleadoViewSet, ProyectoViewSet
)
from .sales_views import (
    PresupuestoViewSet, PedidoViewSet, AlbaranViewSet, TicketViewSet
)
from .invoice_views import FacturaViewSet
from .reports_views import ReportesView

# Exportar todas las vistas para mantener la compatibilidad
__all__ = [
    'CategoriaViewSet', 'ArticuloViewSet', 'ClienteViewSet',
    'PresupuestoViewSet', 'PedidoViewSet', 'FacturaViewSet',
    'DepartamentoViewSet', 'EmpleadoViewSet', 'ProyectoViewSet',
    'AlbaranViewSet', 'TicketViewSet', 'ReportesView'
]
