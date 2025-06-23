from rest_framework import serializers
from .models import Cliente


class BaseDocumentSerializer(serializers.ModelSerializer):
    """Serializer base para documentos comerciales"""
    items = serializers.SerializerMethodField()
    
    def get_items(self, obj):
        """Devuelve los items del documento usando el serializer específico"""
        # Esta función debe ser sobrescrita en las clases hijas
        return []
    
    def create(self, validated_data):
        """Crea un documento con sus items"""
        items_data = validated_data.pop('items', [])
        documento = super().create(validated_data)
        
        # Crear items
        item_model = self.get_item_model()
        for item_data in items_data:
            item_data[self.get_document_field_name()] = documento
            item_model.objects.create(**item_data)
        
        # Calcular totales
        documento.calculate_totals()
        return documento
    
    def update(self, instance, validated_data):
        """Actualiza un documento y sus items"""
        items_data = validated_data.pop('items', None)
        instance = super().update(instance, validated_data)
        
        if items_data is not None:
            # Eliminar items existentes
            instance.get_items().delete()
            
            # Crear nuevos items
            item_model = self.get_item_model()
            for item_data in items_data:
                item_data[self.get_document_field_name()] = instance
                item_model.objects.create(**item_data)
            
            # Recalcular totales
            instance.calculate_totals()
        
        return instance
    
    def get_item_model(self):
        """Devuelve el modelo de item asociado - debe ser sobrescrito"""
        raise NotImplementedError("Subclasses must implement get_item_model()")
    
    def get_document_field_name(self):
        """Devuelve el nombre del campo del documento en el item - debe ser sobrescrito"""
        raise NotImplementedError("Subclasses must implement get_document_field_name()")


class BaseItemSerializer(serializers.ModelSerializer):
    """Serializer base para items de documentos"""
    subtotal = serializers.ReadOnlyField()
    iva_amount = serializers.ReadOnlyField()
    total = serializers.ReadOnlyField()
    
    class Meta:
        fields = ['id', 'articulo', 'cantidad', 'precio_unitario', 'iva_porcentaje', 'subtotal', 'iva_amount', 'total']


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para Cliente"""
    class Meta:
        model = Cliente
        fields = '__all__'
