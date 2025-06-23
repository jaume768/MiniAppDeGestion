from rest_framework import serializers
from .models import Categoria, Marca, Articulo


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para Categoria"""
    articulos_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'articulos_count']
    
    def get_articulos_count(self, obj):
        return obj.articulo_set.count()


class MarcaSerializer(serializers.ModelSerializer):
    """Serializer para Marca"""
    articulos_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Marca
        fields = ['id', 'nombre', 'descripcion', 'pais_origen', 'articulos_count']
        
    def get_articulos_count(self, obj):
        return obj.articulo_set.count()


class ArticuloSerializer(serializers.ModelSerializer):
    """Serializer para Articulo"""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    marca_nombre = serializers.CharField(source='marca.nombre', read_only=True)
    
    class Meta:
        model = Articulo
        fields = ['id', 'nombre', 'descripcion', 'categoria', 'categoria_nombre', 
                 'marca', 'marca_nombre', 'modelo', 'precio', 'stock', 'iva']
