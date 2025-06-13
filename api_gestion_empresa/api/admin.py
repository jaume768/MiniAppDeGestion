from django.contrib import admin
from .models import (
    Categoria, Articulo, Cliente,
    Presupuesto, PresupuestoItem,
    Pedido, PedidoItem, Factura
)

admin.site.register([
    Categoria, Articulo, Cliente,
    Presupuesto, PresupuestoItem,
    Pedido, PedidoItem, Factura
])
