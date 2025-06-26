from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_invitation_email(invitation):
    """Enviar email de invitación a un usuario"""
    try:
        # URL de aceptación de invitación
        invitation_url = f"{settings.FRONTEND_URL}/invitation/accept/{invitation.token}"
        
        # Mensaje en texto plano
        message = f"""
¡Hola{f' {invitation.first_name}' if invitation.first_name else ''}!

{invitation.invited_by.get_full_name() if invitation.invited_by else 'Un administrador'} te ha invitado a unirte a {invitation.empresa.nombre} en MiniGestión.

Detalles de la invitación:
• Empresa: {invitation.empresa.nombre}
• Rol asignado: {invitation.get_role_display()}
{f'• Cargo: {invitation.cargo}' if invitation.cargo else ''}
• Invitado por: {invitation.invited_by.get_full_name() if invitation.invited_by else 'N/A'}

{f'Mensaje: {invitation.message}' if invitation.message else ''}

Para aceptar la invitación, haz clic en el siguiente enlace:
{invitation_url}

⚠️ IMPORTANTE: Esta invitación expira el {invitation.expires_at.strftime('%d/%m/%Y a las %H:%M')}.

Si no puedes hacer clic en el enlace, cópialo y pégalo en tu navegador.

---
MiniGestión - Sistema de Gestión Empresarial
Este email fue enviado a {invitation.email}
        """.strip()
        
        # Asunto del email
        subject = f"Invitación para unirse a {invitation.empresa.nombre} - MiniGestión"
        
        # Enviar email
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            fail_silently=False,
        )
        
        logger.info(f"Email de invitación enviado a {invitation.email} para empresa {invitation.empresa.nombre}")
        return True
        
    except Exception as e:
        logger.error(f"Error enviando email de invitación a {invitation.email}: {str(e)}")
        return False


def send_welcome_email(user, empresa):
    """Enviar email de bienvenida a un nuevo usuario (opcional)"""
    try:
        message = f"""
¡Bienvenido a {empresa.nombre}!

Hola {user.get_full_name()},

Tu cuenta ha sido creada exitosamente en MiniGestión.

Puedes acceder al sistema en: {settings.FRONTEND_URL}/login

---
MiniGestión - Sistema de Gestión Empresarial
        """.strip()
        
        subject = f"¡Bienvenido a {empresa.nombre} - MiniGestión!"
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        logger.info(f"Email de bienvenida enviado a {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Error enviando email de bienvenida a {user.email}: {str(e)}")
        return False


def send_empresa_created_notification(empresa, admin):
    """Enviar notificación de empresa creada (opcional - el frontend puede manejar esto)"""
    try:
        message = f"""
¡Empresa creada exitosamente!

Hola {admin.get_full_name()},

Tu empresa "{empresa.nombre}" ha sido registrada exitosamente en MiniGestión.

Información de tu empresa:
• Nombre: {empresa.nombre}
• CIF: {empresa.cif}
• Plan: {empresa.get_plan_display()}

Ya puedes comenzar a usar MiniGestión: {settings.FRONTEND_URL}/login

---
MiniGestión - Sistema de Gestión Empresarial
        """.strip()
        
        subject = f"¡Empresa {empresa.nombre} creada exitosamente - MiniGestión!"
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin.email],
            fail_silently=False,
        )
        
        logger.info(f"Email de confirmación de empresa enviado a {admin.email}")
        return True
        
    except Exception as e:
        logger.error(f"Error enviando email de confirmación de empresa a {admin.email}: {str(e)}")
        return False


def cleanup_expired_invitations():
    """Limpiar invitaciones expiradas (para ejecutar periódicamente)"""
    from django.utils import timezone
    from .models import UserInvitation
    
    try:
        expired_invitations = UserInvitation.objects.filter(
            status='pending',
            expires_at__lt=timezone.now()
        )
        
        count = expired_invitations.count()
        expired_invitations.update(status='expired')
        
        logger.info(f"Se marcaron {count} invitaciones como expiradas")
        return count
        
    except Exception as e:
        logger.error(f"Error limpiando invitaciones expiradas: {str(e)}")
        return 0
