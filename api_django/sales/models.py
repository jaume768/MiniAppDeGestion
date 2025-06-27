from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from core.models import AbstractBaseDocument, AbstractBaseItem


# Modelos de documentos de venta
class Presupuesto(AbstractBaseDocument):
    """Modelo de Presupuesto"""
    numero = models.CharField(max_length=20)
    serie = models.ForeignKey('core.Serie', on_delete=models.SET_NULL, null=True, blank=True, help_text="Serie asociada al documento")
    
    class Meta:
        ordering = ['-fecha', '-numero']
        unique_together = ['empresa', 'numero']  # Número único por empresa
    
    def get_items(self):
        return self.presupuestoitem_set.all()
    
    def __str__(self):
        return f"Presupuesto {self.numero} - {self.cliente.nombre}"


class PresupuestoItem(AbstractBaseItem):
    """Items de Presupuesto"""
    presupuesto = models.ForeignKey(Presupuesto, on_delete=models.CASCADE)


class Pedido(AbstractBaseDocument):
    """Modelo de Pedido"""
    numero = models.CharField(max_length=20)
    serie = models.ForeignKey('core.Serie', on_delete=models.SET_NULL, null=True, blank=True, help_text="Serie asociada al documento")
    entregado = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-fecha', '-numero']
        unique_together = ['empresa', 'numero']  # Número único por empresa
    
    def get_items(self):
        return self.pedidoitem_set.all()
    
    def __str__(self):
        return f"Pedido {self.numero} - {self.cliente.nombre}"


class PedidoItem(AbstractBaseItem):
    """Items de Pedido"""
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE)


class Albaran(AbstractBaseDocument):
    """Modelo de Albarán"""
    numero = models.CharField(max_length=20)
    serie = models.ForeignKey('core.Serie', on_delete=models.SET_NULL, null=True, blank=True, help_text="Serie asociada al documento")
    
    class Meta:
        ordering = ['-fecha', '-numero']
        unique_together = ['empresa', 'numero']  # Número único por empresa
    
    def get_items(self):
        return self.albaranitem_set.all()
    
    def __str__(self):
        return f"Albarán {self.numero} - {self.cliente.nombre}"


class AlbaranItem(AbstractBaseItem):
    """Items de Albarán"""
    albaran = models.ForeignKey(Albaran, on_delete=models.CASCADE)


class Ticket(AbstractBaseDocument):
    """Modelo de Ticket"""
    numero = models.CharField(max_length=20)
    serie = models.ForeignKey('core.Serie', on_delete=models.SET_NULL, null=True, blank=True, help_text="Serie asociada al documento")
    
    class Meta:
        ordering = ['-fecha', '-numero']
        unique_together = ['empresa', 'numero']  # Número único por empresa
    
    def get_items(self):
        return self.ticketitem_set.all()
    
    def __str__(self):
        return f"Ticket {self.numero} - {self.cliente.nombre}"


class TicketItem(AbstractBaseItem):
    """Items de Ticket"""
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)


class Factura(AbstractBaseDocument):
    """Modelo de Factura - hereda de AbstractBaseDocument"""
    numero = models.CharField(max_length=20)
    serie = models.ForeignKey('core.Serie', on_delete=models.SET_NULL, null=True, blank=True, help_text="Serie asociada al documento")
    documento_origen = models.CharField(max_length=50, blank=True, null=True, help_text="Tipo de documento del que se genera esta factura")
    pedido = models.ForeignKey(Pedido, on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas')
    
    class Meta:
        ordering = ['-fecha', '-numero']
        unique_together = ['empresa', 'numero']  # Número único por empresa
    
    def get_items(self):
        return self.facturaitem_set.all()
    
    def __str__(self):
        return f"Factura {self.numero} - {self.cliente.nombre}"


class FacturaItem(AbstractBaseItem):
    """Items de Factura"""
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE)


# Señales para recalcular totales automáticamente
@receiver([post_save, post_delete], sender=PresupuestoItem)
def update_presupuesto_totals(sender, instance, **kwargs):
    instance.presupuesto.calculate_totals()


@receiver([post_save, post_delete], sender=PedidoItem)
def update_pedido_totals(sender, instance, **kwargs):
    instance.pedido.calculate_totals()


@receiver([post_save, post_delete], sender=AlbaranItem)
def update_albaran_totals(sender, instance, **kwargs):
    instance.albaran.calculate_totals()


@receiver([post_save, post_delete], sender=TicketItem)
def update_ticket_totals(sender, instance, **kwargs):
    instance.ticket.calculate_totals()


@receiver([post_save, post_delete], sender=FacturaItem)
def update_factura_totals(sender, instance, **kwargs):
    instance.factura.calculate_totals()
