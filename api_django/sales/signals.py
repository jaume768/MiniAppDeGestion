from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Factura, Ticket, Albaran
from inventory.models import MovimientoStock


@receiver(post_save, sender=Factura)
@receiver(post_save, sender=Ticket) 
@receiver(post_save, sender=Albaran)
def descontar_stock_en_venta(sender, instance, created, **kwargs):
    """Descontar stock automáticamente cuando se crea un documento de venta"""
    
    if not created or not instance.serie:
        return
        
    almacen = instance.serie.almacen
    
    # Estrategia: Solo descontar stock en documentos "finales" que realmente representan una salida física
    # - Albarán: SÍ (es una salida física real)
    # - Ticket: SÍ (es una venta directa)
    # - Factura: SOLO si no proviene de otro documento (es decir, factura directa)
    
    debe_descontar_stock = True
    
    if sender == Factura:
        # Si la factura tiene referencia a otro documento, NO descontar stock
        # porque ya se descontó en el documento original (Albarán, Ticket, etc.)
        if (hasattr(instance, 'pedido') and instance.pedido) or \
           (hasattr(instance, 'documento_origen') and instance.documento_origen):
            debe_descontar_stock = False
    
    if not debe_descontar_stock:
        return
        
    # Descontar stock de cada item
    items = list(instance.get_items())
    
    for item in items:
        # Crear movimiento de stock (salida)
        MovimientoStock.objects.create(
            empresa=instance.empresa,
            articulo=item.articulo,
            almacen=almacen,
            tipo='salida',
            cantidad=item.cantidad,
            motivo='venta',
            usuario=getattr(instance, 'usuario', None),
            documento_referencia=f"{sender._meta.model_name.title()} #{instance.numero}",
            observaciones=f"Venta automática - {sender._meta.model_name} {instance.numero}"
        )
        
        # Actualizar stock del artículo en el almacén
        from inventory.models import ArticuloStock
        stock_record, created_stock = ArticuloStock.objects.get_or_create(
            empresa=instance.empresa,
            articulo=item.articulo,
            almacen=almacen,
            defaults={'stock_actual': 0}
        )
        
        # Descontar stock (verificar que no quede negativo)
        if stock_record.stock_actual >= item.cantidad:
            stock_record.stock_actual -= item.cantidad
            stock_record.save()
        else:
            # Opcional: Registrar warning o error por stock insuficiente
            # Aún así descontamos lo que tenemos disponible
            stock_record.stock_actual = max(0, stock_record.stock_actual - item.cantidad)
            stock_record.save()
