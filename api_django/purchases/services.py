from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import (
    PedidoCompra, PedidoCompraItem, AlbaranCompra, AlbaranCompraItem,
    FacturaCompra, FacturaCompraItem, CuentaPorPagar
)
from inventory.models import MovimientoStock, ArticuloStock
from audit.services import AuditService


class PurchaseWorkflowService:
    """Servicio para gestión del flujo de trabajo de compras"""
    
    @staticmethod
    @transaction.atomic
    def create_albaran_from_pedido(pedido, items_data, user=None):
        """
        Crea un albarán de compra desde un pedido
        
        Args:
            pedido: PedidoCompra instance
            items_data: Lista de dict con {pedido_item_id, cantidad_a_recibir}
            user: Usuario que realiza la acción
        """
        if pedido.estado not in ['confirmado', 'recibido_parcial']:
            raise ValueError("El pedido debe estar confirmado para crear albarán")
        
        # Generar número de albarán (simplificado)
        ultimo_numero = AlbaranCompra.objects.filter(
            empresa=pedido.empresa
        ).count() + 1
        numero = f"ALB{ultimo_numero:06d}"
        
        # Crear albarán
        albaran = AlbaranCompra.objects.create(
            empresa=pedido.empresa,
            numero=numero,
            pedido_compra=pedido,
            proveedor=pedido.proveedor,
            fecha=timezone.now().date(),
            almacen=pedido.almacen_destino,
            recibido_por=user
        )
        
        # Crear items del albarán
        for item_data in items_data:
            pedido_item = PedidoCompraItem.objects.get(
                id=item_data['pedido_item_id'],
                pedido=pedido
            )
            cantidad_a_recibir = item_data['cantidad_a_recibir']
            
            if cantidad_a_recibir > pedido_item.cantidad_pendiente:
                raise ValueError(f"No se puede recibir más cantidad de la pendiente para {pedido_item.articulo}")
            
            AlbaranCompraItem.objects.create(
                empresa=pedido.empresa,
                albaran=albaran,
                pedido_item=pedido_item,
                articulo=pedido_item.articulo,
                cantidad=cantidad_a_recibir,
                cantidad_recibida=0,  # Se actualizará al confirmar recepción
                precio_unitario=pedido_item.precio_unitario,
                descuento_porcentaje=pedido_item.descuento_porcentaje,
                iva_porcentaje=pedido_item.iva_porcentaje,
                lote=item_data.get('lote'),
                fecha_caducidad=item_data.get('fecha_caducidad'),
                observaciones=item_data.get('observaciones')
            )
        
        # Calcular totales
        albaran.calculate_totals()
        
        # Auditoría
        AuditService.log_business_event(
            event='PURCHASE_ALBARAN_CREATED',
            description=f'Creado albarán {numero} desde pedido {pedido.numero}',
            user=user,
            data={
                'albaran_id': albaran.id,
                'pedido_id': pedido.id,
                'proveedor': pedido.proveedor.nombre,
                'total': float(albaran.total)
            }
        )
        
        return albaran
    
    @staticmethod
    @transaction.atomic
    def receive_merchandise(albaran, items_received, user=None):
        """
        Confirma la recepción de mercancía y actualiza el stock
        
        Args:
            albaran: AlbaranCompra instance
            items_received: Lista de dict con {item_id, cantidad_recibida}
            user: Usuario que confirma la recepción
        """
        if not albaran.puede_recibir():
            raise ValueError("El albarán no puede recibir mercancía en su estado actual")
        
        for item_data in items_received:
            albaran_item = AlbaranCompraItem.objects.get(
                id=item_data['item_id'],
                albaran=albaran
            )
            cantidad_recibida = item_data['cantidad_recibida']
            
            if cantidad_recibida > albaran_item.cantidad_pendiente:
                raise ValueError(f"No se puede recibir más cantidad de la solicitada para {albaran_item.articulo}")
            
            # Actualizar cantidad recibida en el item del albarán
            albaran_item.cantidad_recibida += cantidad_recibida
            albaran_item.save()
            
            # Actualizar cantidad recibida en el item del pedido original
            if albaran_item.pedido_item:
                albaran_item.pedido_item.cantidad_recibida += cantidad_recibida
                albaran_item.pedido_item.save()
            
            # Crear movimiento de stock (entrada)
            PurchaseStockService.create_stock_movement(
                articulo=albaran_item.articulo,
                almacen=albaran.almacen,
                cantidad=cantidad_recibida,
                precio_unitario=albaran_item.precio_unitario,
                documento_origen=albaran,
                user=user
            )
        
        # Actualizar estado del albarán
        albaran.actualizar_estado()
        albaran.fecha_recepcion = timezone.now()
        albaran.save()
        
        # Actualizar estado del pedido
        PurchaseWorkflowService._update_pedido_estado(albaran.pedido_compra)
        
        # Auditoría
        AuditService.log_business_event(
            event='PURCHASE_MERCHANDISE_RECEIVED',
            description=f'Recibida mercancía del albarán {albaran.numero}',
            user=user,
            data={
                'albaran_id': albaran.id,
                'pedido_id': albaran.pedido_compra.id,
                'items_count': len(items_received),
                'total_value': float(albaran.total)
            }
        )
        
        return albaran
    
    @staticmethod
    @transaction.atomic
    def create_factura_from_albaran(albaran, numero_factura_proveedor, fecha_vencimiento, user=None):
        """
        Crea una factura de compra desde un albarán
        """
        if albaran.estado != 'recibido_total':
            raise ValueError("El albarán debe estar completamente recibido para facturar")
        
        # Generar número de factura
        ultimo_numero = FacturaCompra.objects.filter(
            empresa=albaran.empresa
        ).count() + 1
        numero = f"FC{ultimo_numero:06d}"
        
        # Crear factura
        factura = FacturaCompra.objects.create(
            empresa=albaran.empresa,
            numero=numero,
            numero_factura_proveedor=numero_factura_proveedor,
            proveedor=albaran.proveedor,
            pedido_compra=albaran.pedido_compra,
            albaran_compra=albaran,
            fecha=timezone.now().date(),
            fecha_vencimiento=fecha_vencimiento,
            subtotal=albaran.subtotal,
            iva=albaran.iva,
            total=albaran.total
        )
        
        # Crear items de factura basados en los items del albarán
        for albaran_item in albaran.get_items():
            FacturaCompraItem.objects.create(
                empresa=albaran.empresa,
                factura=factura,
                pedido_item=albaran_item.pedido_item,
                albaran_item=albaran_item,
                articulo=albaran_item.articulo,
                cantidad=albaran_item.cantidad_recibida,
                precio_unitario=albaran_item.precio_unitario,
                descuento_porcentaje=albaran_item.descuento_porcentaje,
                iva_porcentaje=albaran_item.iva_porcentaje
            )
        
        # Crear cuenta por pagar
        CuentaPorPagar.objects.create(
            empresa=albaran.empresa,
            proveedor=albaran.proveedor,
            factura_compra=factura,
            monto_original=factura.total,
            monto_pendiente=factura.total,
            fecha_vencimiento=fecha_vencimiento
        )
        
        # Actualizar estado del pedido
        PurchaseWorkflowService._update_pedido_estado(albaran.pedido_compra)
        
        # Auditoría
        AuditService.log_business_event(
            event='PURCHASE_INVOICE_CREATED',
            description=f'Creada factura {numero} desde albarán {albaran.numero}',
            user=user,
            data={
                'factura_id': factura.id,
                'albaran_id': albaran.id,
                'pedido_id': albaran.pedido_compra.id,
                'total': float(factura.total),
                'fecha_vencimiento': fecha_vencimiento.isoformat()
            }
        )
        
        return factura
    
    @staticmethod
    def _update_pedido_estado(pedido):
        """Actualiza el estado del pedido basado en las recepciones y facturación"""
        items = pedido.get_items()
        
        # Verificar si hay items completamente recibidos
        items_completos = sum(1 for item in items if item.esta_completo)
        total_items = items.count()
        
        # Verificar si hay facturas
        tiene_facturas = pedido.facturas.exists()
        
        if items_completos == 0:
            if pedido.estado not in ['borrador', 'enviado', 'confirmado']:
                pedido.estado = 'confirmado'
        elif items_completos == total_items:
            if tiene_facturas:
                pedido.estado = 'facturado'
            else:
                pedido.estado = 'recibido_total'
        else:
            pedido.estado = 'recibido_parcial'
        
        pedido.save(update_fields=['estado'])


class PurchaseStockService:
    """Servicio para gestión de stock en compras"""
    
    @staticmethod
    @transaction.atomic
    def create_stock_movement(articulo, almacen, cantidad, precio_unitario, documento_origen, user=None):
        """
        Crea un movimiento de stock de entrada por compra
        """
        # Obtener o crear el registro de stock del artículo en el almacén
        article_stock, created = ArticuloStock.objects.get_or_create(
            empresa=almacen.empresa,
            articulo=articulo,
            almacen=almacen,
            defaults={
                'stock_actual': 0,
                'stock_minimo': 0,
                'stock_maximo': 0,
                'precio_promedio': precio_unitario
            }
        )
        
        # Calcular nuevo stock y precio promedio
        stock_anterior = article_stock.stock_actual
        stock_posterior = stock_anterior + cantidad
        
        # Actualizar precio promedio ponderado
        if stock_anterior > 0:
            valor_actual = stock_anterior * article_stock.precio_promedio
            valor_nuevo = cantidad * precio_unitario
            nuevo_precio_promedio = (valor_actual + valor_nuevo) / stock_posterior
        else:
            nuevo_precio_promedio = precio_unitario
        
        # Actualizar stock
        article_stock.stock_actual = stock_posterior
        article_stock.precio_promedio = nuevo_precio_promedio
        article_stock.save()
        
        # Crear movimiento de stock
        movimiento = MovimientoStock.objects.create(
            empresa=almacen.empresa,
            articulo=articulo,
            almacen=almacen,
            tipo='entrada',
            motivo='compra',
            cantidad=cantidad,
            stock_anterior=stock_anterior,
            stock_posterior=stock_posterior,
            precio_unitario=precio_unitario,
            documento_origen=documento_origen,
            usuario=user,
            observaciones=f'Entrada por compra - {documento_origen}'
        )
        
        # Auditoría
        AuditService.log_business_event(
            event='STOCK_MOVEMENT_PURCHASE',
            description=f'Entrada de stock por compra: {articulo.nombre}',
            user=user,
            data={
                'articulo_id': articulo.id,
                'almacen_id': almacen.id,
                'cantidad': cantidad,
                'stock_anterior': stock_anterior,
                'stock_posterior': stock_posterior,
                'precio_unitario': float(precio_unitario),
                'documento_tipo': documento_origen.__class__.__name__,
                'documento_id': documento_origen.id
            },
            quantity=cantidad,
            amount=float(precio_unitario * cantidad)
        )
        
        return movimiento


class PurchaseReportService:
    """Servicio para reportes y analytics de compras"""
    
    @staticmethod
    def get_purchase_summary(empresa, fecha_desde=None, fecha_hasta=None):
        """Obtiene resumen de compras por período"""
        pedidos_qs = PedidoCompra.objects.filter(empresa=empresa)
        facturas_qs = FacturaCompra.objects.filter(empresa=empresa)
        
        if fecha_desde:
            pedidos_qs = pedidos_qs.filter(fecha__gte=fecha_desde)
            facturas_qs = facturas_qs.filter(fecha__gte=fecha_desde)
        
        if fecha_hasta:
            pedidos_qs = pedidos_qs.filter(fecha__lte=fecha_hasta)
            facturas_qs = facturas_qs.filter(fecha__lte=fecha_hasta)
        
        return {
            'pedidos': {
                'total': pedidos_qs.count(),
                'por_estado': dict(pedidos_qs.values_list('estado').annotate(count=models.Count('id'))),
                'monto_total': pedidos_qs.aggregate(total=models.Sum('total'))['total'] or 0
            },
            'facturas': {
                'total': facturas_qs.count(),
                'por_estado': dict(facturas_qs.values_list('estado').annotate(count=models.Count('id'))),
                'monto_total': facturas_qs.aggregate(total=models.Sum('total'))['total'] or 0
            }
        }
    
    @staticmethod
    def get_supplier_performance(empresa, proveedor_id=None):
        """Análisis de rendimiento de proveedores"""
        from django.db import models
        
        qs = PedidoCompra.objects.filter(empresa=empresa)
        if proveedor_id:
            qs = qs.filter(proveedor_id=proveedor_id)
        
        return qs.values('proveedor__nombre').annotate(
            pedidos_total=models.Count('id'),
            monto_total=models.Sum('total'),
            tiempo_promedio_entrega=models.Avg(
                models.Case(
                    models.When(
                        estado__in=['recibido_total', 'facturado'],
                        then=models.F('updated_at') - models.F('fecha')
                    ),
                    default=None,
                    output_field=models.DurationField()
                )
            )
        ).order_by('-monto_total')
