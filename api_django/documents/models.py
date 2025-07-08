import hashlib
from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
from core.models import TenantModelMixin


class DocumentoPDF(TenantModelMixin):
    """Modelo para almacenar PDFs generados de documentos"""
    
    # Relación genérica al documento origen (Factura, Presupuesto, etc.)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text="Tipo de documento (Factura, Presupuesto, etc.)"
    )
    object_id = models.PositiveIntegerField(help_text="ID del documento")
    documento_origen = GenericForeignKey('content_type', 'object_id')
    
    # Archivo PDF
    archivo_pdf = models.FileField(
        upload_to='pdfs/%Y/%m/',
        help_text="Archivo PDF almacenado en S3"
    )
    nombre_archivo = models.CharField(
        max_length=255,
        help_text="Nombre del archivo PDF"
    )
    
    # Control de unicidad y versiones
    hash_documento = models.CharField(
        max_length=64,
        db_index=True,
        help_text="SHA256 hash del contenido del documento para evitar duplicados"
    )
    version = models.PositiveIntegerField(
        default=1,
        help_text="Versión del PDF (por si el documento cambia)"
    )
    
    # Control de envíos por email
    enviado_por_email = models.BooleanField(
        default=False,
        help_text="Indica si este PDF ha sido enviado por email"
    )
    fecha_ultimo_envio = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha del último envío por email"
    )
    email_destinatario = models.EmailField(
        blank=True,
        help_text="Último email destinatario"
    )
    contador_envios = models.PositiveIntegerField(
        default=0,
        help_text="Número de veces que se ha enviado este PDF"
    )
    
    # Metadatos del archivo
    tamaño_archivo = models.PositiveIntegerField(
        help_text="Tamaño del archivo en bytes"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "PDF de Documento"
        verbose_name_plural = "PDFs de Documentos"
        ordering = ['-created_at']
        # Unicidad: un PDF por empresa, tipo de documento, ID y hash
        unique_together = ['empresa', 'content_type', 'object_id', 'hash_documento']
        indexes = [
            models.Index(fields=['empresa', 'content_type', 'object_id']),
            models.Index(fields=['hash_documento']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"PDF {self.nombre_archivo} - {self.documento_origen}"
    
    def save(self, *args, **kwargs):
        """Override save para generar nombre de archivo automáticamente"""
        if not self.nombre_archivo and self.documento_origen:
            # Generar nombre basado en el documento
            doc = self.documento_origen
            tipo_doc = self.content_type.model
            if hasattr(doc, 'numero'):
                self.nombre_archivo = f"{tipo_doc}_{doc.numero}_{doc.fecha.strftime('%Y%m%d')}.pdf"
            else:
                self.nombre_archivo = f"{tipo_doc}_{doc.id}_{timezone.now().strftime('%Y%m%d')}.pdf"
        
        super().save(*args, **kwargs)
    
    @staticmethod
    def calcular_hash_documento(documento):
        """Calcula hash SHA256 del documento para control de unicidad"""
        # Crear string único basado en datos del documento
        data_string = f"{documento._meta.model_name}_{documento.id}"
        
        # Incluir datos relevantes que determinen si el PDF debe regenerarse
        if hasattr(documento, 'updated_at'):
            data_string += f"_{documento.updated_at.isoformat()}"
        if hasattr(documento, 'total'):
            data_string += f"_{documento.total}"
        if hasattr(documento, 'numero'):
            data_string += f"_{documento.numero}"
        
        # Incluir items del documento
        if hasattr(documento, 'get_items'):
            items_data = []
            for item in documento.get_items():
                item_data = f"{item.articulo_id}_{item.cantidad}_{item.precio}"
                if hasattr(item, 'updated_at'):
                    item_data += f"_{item.updated_at.isoformat()}"
                items_data.append(item_data)
            data_string += "_".join(sorted(items_data))
        
        return hashlib.sha256(data_string.encode()).hexdigest()
    
    def marcar_como_enviado(self, email_destinatario):
        """Marca el PDF como enviado y actualiza metadatos"""
        self.enviado_por_email = True
        self.fecha_ultimo_envio = timezone.now()
        self.email_destinatario = email_destinatario
        self.contador_envios += 1
        self.save(update_fields=[
            'enviado_por_email', 'fecha_ultimo_envio', 
            'email_destinatario', 'contador_envios'
        ])
