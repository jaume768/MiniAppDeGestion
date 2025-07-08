from django.contrib import admin
from django.utils.html import format_html
from .models import DocumentoPDF


@admin.register(DocumentoPDF)
class DocumentoPDFAdmin(admin.ModelAdmin):
    """Administración de PDFs de documentos"""
    
    list_display = [
        'nombre_archivo',
        'documento_info',
        'empresa',
        'version',
        'enviado_por_email',
        'contador_envios',
        'tamaño_mb',
        'created_at'
    ]
    
    list_filter = [
        'content_type',
        'enviado_por_email',
        'version',
        'created_at',
        'empresa'
    ]
    
    search_fields = [
        'nombre_archivo',
        'email_destinatario',
        'empresa__nombre'
    ]
    
    readonly_fields = [
        'content_type',
        'object_id',
        'hash_documento',
        'tamaño_archivo',
        'created_at',
        'updated_at',
        'ver_pdf_link'
    ]
    
    fieldsets = (
        ('Información del Documento', {
            'fields': ('content_type', 'object_id', 'documento_origen')
        }),
        ('Archivo PDF', {
            'fields': ('archivo_pdf', 'nombre_archivo', 'tamaño_archivo', 'ver_pdf_link')
        }),
        ('Control de Versiones', {
            'fields': ('hash_documento', 'version')
        }),
        ('Envíos por Email', {
            'fields': (
                'enviado_por_email',
                'fecha_ultimo_envio',
                'email_destinatario',
                'contador_envios'
            )
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def documento_info(self, obj):
        """Información del documento origen"""
        if obj.documento_origen:
            doc = obj.documento_origen
            tipo = obj.content_type.model.title()
            if hasattr(doc, 'numero'):
                return f"{tipo} {doc.numero}"
            return f"{tipo} #{doc.id}"
        return "Sin documento"
    documento_info.short_description = "Documento"
    
    def tamaño_mb(self, obj):
        """Tamaño del archivo en MB"""
        if obj.tamaño_archivo:
            mb = obj.tamaño_archivo / (1024 * 1024)
            return f"{mb:.2f} MB"
        return "0 MB"
    tamaño_mb.short_description = "Tamaño"
    
    def ver_pdf_link(self, obj):
        """Enlace para ver el PDF"""
        if obj.archivo_pdf:
            return format_html(
                '<a href="{}" target="_blank">Ver PDF</a>',
                obj.archivo_pdf.url
            )
        return "No disponible"
    ver_pdf_link.short_description = "Enlace PDF"
    
    def get_queryset(self, request):
        """Filtrar por empresa si no es superusuario"""
        qs = super().get_queryset(request)
        
        # Si el usuario no es superadmin, filtrar por su empresa
        if not request.user.is_superuser and hasattr(request.user, 'empresa'):
            qs = qs.filter(empresa=request.user.empresa)
            
        return qs.select_related('content_type', 'empresa')
