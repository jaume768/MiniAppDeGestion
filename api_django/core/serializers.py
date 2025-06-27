from rest_framework import serializers
from .models import Cliente, Proveedor, Serie


class BaseDocumentSerializer(serializers.ModelSerializer):
    """Serializer base para documentos comerciales"""
    items = serializers.SerializerMethodField()
    serie_nombre = serializers.CharField(source='serie.nombre', read_only=True)
    almacen_nombre = serializers.CharField(source='serie.almacen.nombre', read_only=True)
    
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


class ProveedorSerializer(serializers.ModelSerializer):
    """Serializer para Proveedor"""
    class Meta:
        model = Proveedor
        fields = '__all__'


class SerieSerializer(serializers.ModelSerializer):
    """Serializer para Serie"""
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)
    almacen_codigo = serializers.CharField(source='almacen.codigo', read_only=True)
    
    class Meta:
        model = Serie
        fields = [
            'id', 'nombre', 'descripcion', 'almacen', 
            'almacen_nombre', 'almacen_codigo', 'activa',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_almacen(self, value):
        """Validar que el almacén pertenece a la empresa del usuario"""
        request = self.context.get('request')
        if request and hasattr(request.user, 'empresa'):
            if value.empresa != request.user.empresa:
                raise serializers.ValidationError("Almacén no válido para esta empresa")
        return value


class ContactoSerializer(serializers.Serializer):
    """Serializer para vista combinada de contactos (clientes y proveedores)"""
    id = serializers.IntegerField()
    
    # Datos básicos
    nombre = serializers.CharField()
    nombre_comercial = serializers.CharField(allow_null=True)
    es_empresa = serializers.BooleanField()
    
    # Contacto
    email = serializers.EmailField(allow_null=True)
    telefono = serializers.CharField(allow_null=True)
    movil = serializers.CharField(allow_null=True)
    website = serializers.URLField(allow_null=True)
    
    # Dirección
    direccion = serializers.CharField(allow_null=True)
    poblacion = serializers.CharField(allow_null=True)
    codigo_postal = serializers.CharField(allow_null=True)
    provincia = serializers.CharField(allow_null=True)
    pais = serializers.CharField(allow_null=True)
    
    # Datos fiscales
    cif_nif = serializers.CharField(allow_null=True)
    identificacion_vat = serializers.CharField(allow_null=True)
    
    # Metadatos
    tags = serializers.CharField(allow_null=True)
    activo = serializers.BooleanField()
    tipo = serializers.CharField()  # 'cliente' o 'proveedor'
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
