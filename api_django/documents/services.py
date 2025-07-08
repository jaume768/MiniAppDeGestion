import io
import logging
from django.core.files.base import ContentFile
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.db import transaction

from .models import DocumentoPDF
from .utils import send_document_pdf_email, send_document_link_email
from core.pdf_utils import PDFDocumentGenerator

logger = logging.getLogger(__name__)


class DocumentPDFService:
    """Servicio para gestionar PDFs de documentos"""
    
    @staticmethod
    def generar_y_guardar_pdf(documento, usuario=None):
        """
        Genera PDF y lo guarda en S3 si no existe o ha cambiado
        
        Args:
            documento: Instancia del documento (Factura, Presupuesto, etc.)
            usuario: Usuario que solicita la generación (opcional)
            
        Returns:
            DocumentoPDF: Instancia del PDF generado o existente
        """
        # Calcular hash del documento actual
        hash_documento = DocumentoPDF.calcular_hash_documento(documento)
        content_type = ContentType.objects.get_for_model(documento)
        
        # Verificar si ya existe un PDF con este hash
        try:
            pdf_existente = DocumentoPDF.objects.get(
                empresa=documento.empresa,
                content_type=content_type,
                object_id=documento.id,
                hash_documento=hash_documento
            )
            logger.info(f"PDF existente encontrado para {documento}: {pdf_existente.nombre_archivo}")
            return pdf_existente
            
        except DocumentoPDF.DoesNotExist:
            # No existe, generar nuevo PDF
            logger.info(f"Generando nuevo PDF para {documento}")
            
            with transaction.atomic():
                # Generar PDF usando la clase existente
                pdf_generator = PDFDocumentGenerator(documento)
                pdf_buffer = io.BytesIO()
                pdf_generator.build_pdf(pdf_buffer)
                pdf_content = pdf_buffer.getvalue()
                pdf_buffer.close()
                
                # Crear nombre de archivo
                tipo_doc = content_type.model
                if hasattr(documento, 'numero'):
                    nombre_archivo = f"{tipo_doc}_{documento.numero}_{documento.fecha.strftime('%Y%m%d')}.pdf"
                else:
                    nombre_archivo = f"{tipo_doc}_{documento.id}_{timezone.now().strftime('%Y%m%d')}.pdf"
                
                # Determinar versión (incrementar si existe PDF anterior para este documento)
                version = 1
                pdf_anterior = DocumentoPDF.objects.filter(
                    empresa=documento.empresa,
                    content_type=content_type,
                    object_id=documento.id
                ).order_by('-version').first()
                
                if pdf_anterior:
                    version = pdf_anterior.version + 1
                
                # Crear registro de PDF
                documento_pdf = DocumentoPDF(
                    empresa=documento.empresa,
                    content_type=content_type,
                    object_id=documento.id,
                    documento_origen=documento,
                    hash_documento=hash_documento,
                    version=version,
                    nombre_archivo=nombre_archivo,
                    tamaño_archivo=len(pdf_content)
                )
                
                # Guardar archivo PDF
                documento_pdf.archivo_pdf.save(
                    nombre_archivo,
                    ContentFile(pdf_content),
                    save=False
                )
                
                # Guardar registro
                documento_pdf.save()
                
                logger.info(f"PDF generado exitosamente: {documento_pdf.nombre_archivo}")
                return documento_pdf
    
    @staticmethod
    def enviar_por_email(documento_pdf, email_destinatario, asunto=None, mensaje=None, solo_enlace=False):
        """
        Envía PDF por email
        
        Args:
            documento_pdf: Instancia de DocumentoPDF
            email_destinatario: Email del destinatario
            asunto: Asunto personalizado (opcional)
            mensaje: Mensaje personalizado (opcional)
            solo_enlace: Si True, envía solo enlace de descarga; si False, adjunta PDF
            
        Returns:
            bool: True si se envió exitosamente
        """
        try:
            if solo_enlace:
                # Generar URL de descarga (esto se implementará en los ViewSets)
                download_url = f"/api/documents/pdfs/{documento_pdf.id}/download/"
                success = send_document_link_email(
                    documento_pdf=documento_pdf,
                    email_destinatario=email_destinatario,
                    download_url=download_url,
                    asunto=asunto,
                    mensaje_personalizado=mensaje
                )
            else:
                # Enviar con PDF adjunto
                success = send_document_pdf_email(
                    documento_pdf=documento_pdf,
                    email_destinatario=email_destinatario,
                    asunto=asunto,
                    mensaje_personalizado=mensaje
                )
            
            if success:
                # Marcar como enviado
                documento_pdf.marcar_como_enviado(email_destinatario)
                logger.info(f"Email enviado exitosamente a {email_destinatario}: {documento_pdf.nombre_archivo}")
                return True
            else:
                raise Exception("Error en el envío del email")
            
        except Exception as e:
            logger.error(f"Error enviando email: {str(e)}")
            raise e
    
    @staticmethod
    def obtener_pdf_documento(documento):
        """
        Obtiene el PDF más reciente de un documento
        
        Args:
            documento: Instancia del documento
            
        Returns:
            DocumentoPDF or None: PDF más reciente o None si no existe
        """
        content_type = ContentType.objects.get_for_model(documento)
        
        return DocumentoPDF.objects.filter(
            empresa=documento.empresa,
            content_type=content_type,
            object_id=documento.id
        ).order_by('-version').first()
    
    @staticmethod
    def eliminar_pdfs_obsoletos(documento, mantener_ultimos=3):
        """
        Elimina PDFs obsoletos de un documento, manteniendo solo los más recientes
        
        Args:
            documento: Instancia del documento
            mantener_ultimos: Número de PDFs a mantener (default: 3)
        """
        content_type = ContentType.objects.get_for_model(documento)
        
        pdfs_antiguos = DocumentoPDF.objects.filter(
            empresa=documento.empresa,
            content_type=content_type,
            object_id=documento.id
        ).order_by('-version')[mantener_ultimos:]
        
        for pdf in pdfs_antiguos:
            # Eliminar archivo físico
            if pdf.archivo_pdf:
                pdf.archivo_pdf.delete(save=False)
            # Eliminar registro
            pdf.delete()
            
        logger.info(f"Eliminados {len(pdfs_antiguos)} PDFs obsoletos de {documento}")


class EmailTemplateService:
    """Servicio para gestionar plantillas de email"""
    
    @staticmethod
    def generar_asunto_por_defecto(documento):
        """Genera asunto por defecto para un documento"""
        tipo_doc = documento._meta.model_name.title()
        if hasattr(documento, 'numero'):
            return f"{tipo_doc} {documento.numero} - {documento.empresa.nombre}"
        return f"{tipo_doc} #{documento.id} - {documento.empresa.nombre}"
    
    @staticmethod
    def generar_mensaje_por_defecto(documento):
        """Genera mensaje por defecto para un documento"""
        return f"""
        Estimado/a cliente,
        
        Adjunto encontrará el documento solicitado.
        
        Si tiene alguna consulta, no dude en contactarnos.
        
        Saludos cordiales,
        {documento.empresa.nombre}
        """
