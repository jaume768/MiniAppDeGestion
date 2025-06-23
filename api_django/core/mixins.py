from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action


class ReadOnlyIfInvoicedMixin:
    """
    Mixin que previene edición/eliminación de documentos ya facturados
    """
    
    def update(self, request, *args, **kwargs):
        """Previene actualización si el documento está facturado"""
        instance = self.get_object()
        if hasattr(instance, 'is_facturado') and instance.is_facturado:
            return Response(
                {'error': f'No se puede modificar {self.get_serializer().Meta.model.__name__} ya facturado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Previene actualización parcial si el documento está facturado"""
        instance = self.get_object()
        if hasattr(instance, 'is_facturado') and instance.is_facturado:
            return Response(
                {'error': f'No se puede modificar {self.get_serializer().Meta.model.__name__} ya facturado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Previene eliminación si el documento está facturado"""
        instance = self.get_object()
        if hasattr(instance, 'is_facturado') and instance.is_facturado:
            return Response(
                {'error': f'No se puede eliminar {self.get_serializer().Meta.model.__name__} ya facturado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class DocumentConversionMixin:
    """
    Mixin para conversión de documentos a facturas
    """
    
    @action(detail=True, methods=['post'])
    def convertir_a_factura(self, request, pk=None):
        """Convierte el documento a factura"""
        from sales.models import Factura
        
        documento = self.get_object()
        
        # Verificar si ya está facturado
        if hasattr(documento, 'is_facturado') and documento.is_facturado:
            return Response(
                {'error': f'{documento.__class__.__name__} ya está facturado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear factura
        documento_field = documento.__class__.__name__.lower()
        factura_data = {
            documento_field: documento,
            'subtotal': documento.subtotal,
            'iva': documento.iva,
            'total': documento.total
        }
        
        factura = Factura.objects.create(**factura_data)
        
        return Response({
            'message': f'{documento.__class__.__name__} convertido a factura exitosamente',
            'factura_id': factura.id
        }, status=status.HTTP_201_CREATED)
