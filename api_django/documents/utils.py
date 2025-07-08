import logging
from django.core.mail import EmailMessage
from django.conf import settings

logger = logging.getLogger(__name__)


def send_document_pdf_email(documento_pdf, email_destinatario, asunto=None, mensaje_personalizado=None):
    """
    Enviar PDF de documento por email
    
    Args:
        documento_pdf: Instancia de DocumentoPDF
        email_destinatario: Email del destinatario
        asunto: Asunto personalizado (opcional)
        mensaje_personalizado: Mensaje personalizado (opcional)
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        doc = documento_pdf.documento_origen
        tipo_doc = documento_pdf.content_type.model.title()
        
        # Generar asunto si no se proporciona
        if not asunto:
            if hasattr(doc, 'numero'):
                asunto = f"{tipo_doc} {doc.numero} - {doc.empresa.nombre}"
            else:
                asunto = f"{tipo_doc} #{doc.id} - {doc.empresa.nombre}"
        
        # Generar mensaje base
        if hasattr(doc, 'numero'):
            documento_info = f"{tipo_doc} {doc.numero}"
        else:
            documento_info = f"{tipo_doc} #{doc.id}"
            
        mensaje_base = f"""
Estimado/a cliente,

Adjunto encontrará el documento: {documento_info}

Información del documento:
• Fecha: {doc.fecha.strftime('%d/%m/%Y')}
• Total: {doc.total}€
        """
        
        # Agregar información específica según el tipo de documento
        if hasattr(doc, 'cliente') and doc.cliente:
            mensaje_base += f"• Cliente: {doc.cliente.nombre}\n"
        
        # Agregar mensaje personalizado si existe
        if mensaje_personalizado:
            mensaje_base += f"\n{mensaje_personalizado}\n"
        
        mensaje_base += f"""
Si tiene alguna consulta, no dude en contactarnos.

Saludos cordiales,
{doc.empresa.nombre}
{doc.empresa.telefono if doc.empresa.telefono else ''}
{doc.empresa.email if doc.empresa.email else ''}

---
Documento generado automáticamente por MiniGestión
        """.strip()
        
        # Crear email con adjunto
        email = EmailMessage(
            subject=asunto,
            body=mensaje_base,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_destinatario]
        )
        
        # Adjuntar PDF si existe
        if documento_pdf.archivo_pdf:
            try:
                # Intentar adjuntar desde la URL/path del archivo
                email.attach_file(documento_pdf.archivo_pdf.path)
            except (FileNotFoundError, AttributeError):
                # Si no se puede acceder al archivo, intentar desde storage
                try:
                    email.attach(
                        documento_pdf.nombre_archivo,
                        documento_pdf.archivo_pdf.read(),
                        'application/pdf'
                    )
                except Exception as attach_error:
                    logger.error(f"Error adjuntando PDF: {str(attach_error)}")
                    raise Exception(f"No se pudo adjuntar el PDF: {str(attach_error)}")
        
        # Enviar email
        email.send()
        
        logger.info(f"Email con PDF enviado exitosamente a {email_destinatario}: {documento_pdf.nombre_archivo}")
        return True
        
    except Exception as e:
        logger.error(f"Error enviando email con PDF a {email_destinatario}: {str(e)}")
        return False


def send_document_link_email(documento_pdf, email_destinatario, download_url, asunto=None, mensaje_personalizado=None):
    """
    Enviar enlace de descarga de PDF por email (sin adjunto)
    
    Args:
        documento_pdf: Instancia de DocumentoPDF
        email_destinatario: Email del destinatario
        download_url: URL de descarga del PDF
        asunto: Asunto personalizado (opcional)
        mensaje_personalizado: Mensaje personalizado (opcional)
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        doc = documento_pdf.documento_origen
        tipo_doc = documento_pdf.content_type.model.title()
        
        # Generar asunto si no se proporciona
        if not asunto:
            if hasattr(doc, 'numero'):
                asunto = f"Enlace de descarga - {tipo_doc} {doc.numero} - {doc.empresa.nombre}"
            else:
                asunto = f"Enlace de descarga - {tipo_doc} #{doc.id} - {doc.empresa.nombre}"
        
        # Generar mensaje
        if hasattr(doc, 'numero'):
            documento_info = f"{tipo_doc} {doc.numero}"
        else:
            documento_info = f"{tipo_doc} #{doc.id}"
            
        mensaje = f"""
Estimado/a cliente,

Puede descargar el documento: {documento_info}

Información del documento:
• Fecha: {doc.fecha.strftime('%d/%m/%Y')}
• Total: {doc.total}€
        """
        
        # Agregar información específica según el tipo de documento
        if hasattr(doc, 'cliente') and doc.cliente:
            mensaje += f"• Cliente: {doc.cliente.nombre}\n"
        
        # Agregar enlace de descarga
        mensaje += f"\n🔗 Enlace de descarga: {download_url}\n"
        
        # Agregar mensaje personalizado si existe
        if mensaje_personalizado:
            mensaje += f"\n{mensaje_personalizado}\n"
        
        mensaje += f"""
Este enlace estará disponible por tiempo limitado.

Si tiene alguna consulta, no dude en contactarnos.

Saludos cordiales,
{doc.empresa.nombre}
{doc.empresa.telefono if doc.empresa.telefono else ''}
{doc.empresa.email if doc.empresa.email else ''}

---
Documento generado automáticamente por MiniGestión
        """.strip()
        
        from django.core.mail import send_mail
        
        send_mail(
            subject=asunto,
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email_destinatario],
            fail_silently=False,
        )
        
        logger.info(f"Email con enlace enviado exitosamente a {email_destinatario}")
        return True
        
    except Exception as e:
        logger.error(f"Error enviando email con enlace a {email_destinatario}: {str(e)}")
        return False
