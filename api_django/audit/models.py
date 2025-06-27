from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from tenants.models import TenantModelMixin
import json

User = get_user_model()

class AuditLog(TenantModelMixin, models.Model):
    """
    Modelo principal de auditoría para trazabilidad completa
    Registra TODOS los cambios críticos en el sistema
    """
    
    ACTION_CHOICES = [
        ('CREATE', 'Crear'),
        ('UPDATE', 'Actualizar'), 
        ('DELETE', 'Eliminar'),
        ('LOGIN', 'Iniciar Sesión'),
        ('LOGOUT', 'Cerrar Sesión'),
        ('PERMISSION_DENIED', 'Acceso Denegado'),
        ('BUSINESS_ACTION', 'Acción de Negocio'),
    ]
    
    LEVEL_CHOICES = [
        ('LOW', 'Bajo'),
        ('MEDIUM', 'Medio'),
        ('HIGH', 'Alto'),
        ('CRITICAL', 'Crítico'),
    ]
    
    # Identificación del evento
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, db_index=True)
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='MEDIUM', db_index=True)
    
    # Usuario y sesión
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_key = models.CharField(max_length=40, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    
    # Objeto afectado (Generic Foreign Key)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Detalles del cambio
    table_name = models.CharField(max_length=100, db_index=True)
    record_id = models.PositiveIntegerField(null=True, blank=True)
    
    # Datos del cambio (JSON)
    old_values = models.JSONField(null=True, blank=True, help_text="Valores anteriores")
    new_values = models.JSONField(null=True, blank=True, help_text="Valores nuevos") 
    changes = models.JSONField(null=True, blank=True, help_text="Solo campos modificados")
    
    # Contexto adicional
    description = models.TextField(help_text="Descripción del evento")
    module = models.CharField(max_length=50, db_index=True, help_text="Módulo/App donde ocurrió")
    business_context = models.JSONField(null=True, blank=True, help_text="Contexto de negocio")
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['empresa', 'timestamp']),
            models.Index(fields=['empresa', 'user', 'timestamp']),
            models.Index(fields=['empresa', 'table_name', 'timestamp']),
            models.Index(fields=['empresa', 'action', 'level']),
        ]
        verbose_name = "Log de Auditoría"
        verbose_name_plural = "Logs de Auditoría"
    
    def __str__(self):
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M')} - {self.get_action_display()} - {self.description[:50]}"


class SecurityLog(TenantModelMixin, models.Model):
    """
    Logs específicos de seguridad
    """
    
    EVENT_CHOICES = [
        ('LOGIN_SUCCESS', 'Login Exitoso'),
        ('LOGIN_FAILED', 'Login Fallido'),
        ('LOGOUT', 'Logout'),
        ('PASSWORD_CHANGE', 'Cambio Contraseña'),
        ('PERMISSION_DENIED', 'Permiso Denegado'),
        ('SUSPICIOUS_ACTIVITY', 'Actividad Sospechosa'),
        ('RATE_LIMIT_EXCEEDED', 'Límite de Requests Excedido'),
        ('TOKEN_REFRESH', 'Renovación Token'),
        ('TOKEN_INVALID', 'Token Inválido'),
    ]
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    event = models.CharField(max_length=30, choices=EVENT_CHOICES, db_index=True)
    
    # Usuario (puede ser None si login fallido)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    username_attempted = models.CharField(max_length=150, blank=True, null=True)
    
    # Información de red
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    referrer = models.URLField(blank=True, null=True)
    
    # Detalles del evento
    details = models.JSONField(null=True, blank=True)
    success = models.BooleanField(default=True)
    risk_level = models.CharField(max_length=10, choices=[
        ('LOW', 'Bajo'),
        ('MEDIUM', 'Medio'), 
        ('HIGH', 'Alto'),
        ('CRITICAL', 'Crítico')
    ], default='LOW')
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['empresa', 'timestamp']),
            models.Index(fields=['empresa', 'event', 'success']),
            models.Index(fields=['ip_address', 'timestamp']),
        ]
        verbose_name = "Log de Seguridad"
        verbose_name_plural = "Logs de Seguridad"


class PerformanceLog(TenantModelMixin, models.Model):
    """
    Logs de rendimiento para optimización
    """
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Request info
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=500)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Performance metrics
    response_time = models.FloatField(help_text="Tiempo en segundos")
    db_queries_count = models.PositiveIntegerField(default=0)
    db_time = models.FloatField(default=0.0, help_text="Tiempo DB en segundos")
    memory_usage = models.FloatField(null=True, blank=True, help_text="MB")
    
    # Clasificación
    is_slow = models.BooleanField(default=False)
    status_code = models.PositiveIntegerField()
    
    # Contexto
    extra_data = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['empresa', 'timestamp']),
            models.Index(fields=['empresa', 'is_slow']),
            models.Index(fields=['path', 'timestamp']),
        ]
        verbose_name = "Log de Performance"
        verbose_name_plural = "Logs de Performance"


class BusinessEventLog(TenantModelMixin, models.Model):
    """
    Eventos específicos de negocio
    """
    
    EVENT_CHOICES = [
        ('SALE_CREATED', 'Venta Creada'),
        ('INVOICE_GENERATED', 'Factura Generada'),
        ('STOCK_UPDATED', 'Stock Actualizado'),
        ('STOCK_LOW', 'Stock Bajo'),
        ('PAYMENT_RECEIVED', 'Pago Recibido'),
        ('DOCUMENT_CONVERTED', 'Documento Convertido'),
        ('BACKUP_CREATED', 'Backup Creado'),
        ('REPORT_GENERATED', 'Reporte Generado'),
    ]
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    event = models.CharField(max_length=30, choices=EVENT_CHOICES, db_index=True)
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Datos del evento
    description = models.TextField()
    data = models.JSONField(help_text="Datos específicos del evento")
    
    # Métricas
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    quantity = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['empresa', 'timestamp']),
            models.Index(fields=['empresa', 'event']),
        ]
        verbose_name = "Log de Evento de Negocio"
        verbose_name_plural = "Logs de Eventos de Negocio"
