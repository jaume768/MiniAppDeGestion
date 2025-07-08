from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import DocumentoPDF


class DocumentoPDFSerializer(serializers.ModelSerializer):
    """Serializer para DocumentoPDF"""
    
    documento_tipo = serializers.CharField(source='content_type.model', read_only=True)
    documento_nombre = serializers.SerializerMethodField()
    url_descarga = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentoPDF
        fields = [
            'id', 'documento_tipo', 'documento_nombre', 'object_id',
            'nombre_archivo', 'url_descarga', 'version',
            'enviado_por_email', 'fecha_ultimo_envio', 'email_destinatario',
            'contador_envios', 'tamaño_archivo', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'documento_tipo', 'documento_nombre', 'url_descarga',
            'version', 'tamaño_archivo', 'created_at', 'updated_at'
        ]
    
    def get_documento_nombre(self, obj):
        """Obtiene el nombre/número del documento origen"""
        if obj.documento_origen:
            if hasattr(obj.documento_origen, 'numero'):
                return f"{obj.content_type.model.title()} {obj.documento_origen.numero}"
            return f"{obj.content_type.model.title()} #{obj.documento_origen.id}"
        return "Documento no encontrado"
    
    def get_url_descarga(self, obj):
        """Obtiene la URL de descarga del PDF"""
        if obj.archivo_pdf:
            return obj.archivo_pdf.url
        return None


class EnviarEmailSerializer(serializers.Serializer):
    """Serializer para enviar PDF por email"""
    
    email_destinatario = serializers.EmailField(
        help_text="Email del destinatario"
    )
    asunto = serializers.CharField(
        max_length=200,
        required=False,
        help_text="Asunto del email (opcional, se generará automáticamente)"
    )
    mensaje = serializers.CharField(
        required=False,
        help_text="Mensaje personalizado (opcional)"
    )
    incluir_enlace_descarga = serializers.BooleanField(
        default=True,
        help_text="Incluir enlace de descarga en el email"
    )
    
    def validate_email_destinatario(self, value):
        """Validar formato del email"""
        if not value:
            raise serializers.ValidationError("El email del destinatario es requerido")
        return value
