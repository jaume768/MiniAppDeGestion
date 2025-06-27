from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Factura, Ticket, Albaran
from inventory.models import MovimientoStock


@receiver(post_save, sender=Factura)
@receiver(post_save, sender=Ticket) 
@receiver(post_save, sender=Albaran)
def descontar_stock_en_venta(sender, instance, created, **kwargs):
    """Descontar stock automáticamente cuando se crea un documento de venta"""
    print(f" SIGNAL ejecutado - Sender: {sender.__name__}, Created: {created}, ID: {instance.id}")
    
    if not created or not instance.serie:
        print(f"No se descuenta - Created: {created}, Serie: {instance.serie}")
        return
        
    almacen = instance.serie.almacen
    print(f"Almacén: {almacen.nombre}")
    
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
            print(f"INFO: Factura {instance.numero} proviene de conversión - No se descuenta stock")
    
    if not debe_descontar_stock:
        print(f"No debe descontar stock")
        return
        
    # Descontar stock de cada item
    items = list(instance.get_items())
    print(f"Items encontrados: {len(items)}")
    
    for item in items:
        print(f"  - Item: {item.articulo.nombre} x{item.cantidad}")
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
            print(f"Stock descontado: {item.articulo.nombre} (-{item.cantidad})")
        else:
            # Opcional: Registrar warning o error por stock insuficiente
            print(f"ADVERTENCIA: Stock insuficiente para {item.articulo.nombre} en {almacen.nombre}")
            # Aún así descontamos lo que tenemos disponible
            stock_record.stock_actual = max(0, stock_record.stock_actual - item.cantidad)
            stock_record.save()
