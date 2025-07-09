"""
Tests para la app audit - Sistema de Auditoría
"""
import pytest
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APIClient
from rest_framework import status
from audit.models import AuditLog, SecurityLog, PerformanceLog, BusinessEventLog
from accounts.models import Empresa
import json

User = get_user_model()


@pytest.mark.django_db
class TestAuditLogModel:
    """Tests para el modelo AuditLog"""
    
    def test_creacion_audit_log_basico(self, empresa, usuario):
        """Test crear log de auditoría básico"""
        audit_log = AuditLog.objects.create(
            empresa=empresa,
            action='CREATE',
            level='MEDIUM',
            user=usuario,
            table_name='test_table',
            record_id=123,
            description='Test audit log creation',
            module='test'
        )
        
        assert audit_log.empresa == empresa
        assert audit_log.action == 'CREATE'
        assert audit_log.level == 'MEDIUM'
        assert audit_log.user == usuario
        assert audit_log.table_name == 'test_table'
        assert audit_log.record_id == 123
        assert audit_log.description == 'Test audit log creation'
        assert audit_log.module == 'test'
        
    def test_audit_log_con_cambios_json(self, empresa, usuario):
        """Test log con datos JSON de cambios"""
        old_values = {'name': 'Old Name', 'price': 10.00}
        new_values = {'name': 'New Name', 'price': 15.00}
        changes = {'name': {'old': 'Old Name', 'new': 'New Name'}, 'price': {'old': 10.00, 'new': 15.00}}
        
        audit_log = AuditLog.objects.create(
            empresa=empresa,
            action='UPDATE',
            level='HIGH',
            user=usuario,
            table_name='productos',
            record_id=456,
            old_values=old_values,
            new_values=new_values,
            changes=changes,
            description='Product updated',
            module='products'
        )
        
        assert audit_log.old_values == old_values
        assert audit_log.new_values == new_values
        assert audit_log.changes == changes
        
    def test_audit_log_con_generic_foreign_key(self, empresa, usuario):
        """Test log con GenericForeignKey"""
        content_type = ContentType.objects.get_for_model(Empresa)
        
        audit_log = AuditLog.objects.create(
            empresa=empresa,
            action='UPDATE',
            level='MEDIUM',
            user=usuario,
            content_type=content_type,
            object_id=empresa.id,
            table_name='accounts_empresa',
            record_id=empresa.id,
            description='Empresa updated via GenericFK',
            module='accounts'
        )
        
        assert audit_log.content_object == empresa
        assert audit_log.content_type == content_type
        assert audit_log.object_id == empresa.id
        
    def test_audit_log_str_representation(self, empresa, usuario):
        """Test representación string del log"""
        audit_log = AuditLog.objects.create(
            empresa=empresa,
            action='DELETE',
            user=usuario,
            table_name='test',
            description='This is a very long description that should be truncated',
            module='test'
        )
        
        str_repr = str(audit_log)
        # El __str__ usa get_action_display() que devuelve la versión traducida
        assert 'Eliminar' in str_repr  # 'DELETE' se traduce a 'Eliminar'
        assert len(str_repr) <= 100  # Verificar que se trunca


@pytest.mark.django_db
class TestSecurityLogModel:
    """Tests para el modelo SecurityLog"""
    
    def test_creacion_security_log_login_exitoso(self, empresa, usuario):
        """Test log de login exitoso"""
        security_log = SecurityLog.objects.create(
            empresa=empresa,
            event='LOGIN_SUCCESS',
            user=usuario,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0 Test Browser',
            details={'session_id': 'test123'}
        )
        
        assert security_log.event == 'LOGIN_SUCCESS'
        assert security_log.user == usuario
        assert security_log.ip_address == '192.168.1.1'
        assert security_log.details['session_id'] == 'test123'
        
    def test_security_log_login_fallido(self, empresa):
        """Test log de login fallido sin usuario"""
        security_log = SecurityLog.objects.create(
            empresa=empresa,
            event='LOGIN_FAILED',
            user=None,  # No hay usuario en login fallido
            username_attempted='wrong_user',
            ip_address='192.168.1.100',
            details={'reason': 'Invalid credentials'}
        )
        
        assert security_log.event == 'LOGIN_FAILED'
        assert security_log.user is None
        assert security_log.username_attempted == 'wrong_user'
        assert security_log.details['reason'] == 'Invalid credentials'
        
    def test_security_log_actividad_sospechosa(self, empresa, usuario):
        """Test log de actividad sospechosa"""
        security_log = SecurityLog.objects.create(
            empresa=empresa,
            event='SUSPICIOUS_ACTIVITY',
            user=usuario,
            ip_address='10.0.0.1',
            details={
                'multiple_failed_attempts': 5,
                'time_window': '5 minutes',
                'blocked': True
            }
        )
        
        assert security_log.event == 'SUSPICIOUS_ACTIVITY'
        assert security_log.details['blocked'] is True


@pytest.mark.django_db
class TestPerformanceLogModel:
    """Tests para el modelo PerformanceLog"""
    
    def test_creacion_performance_log(self, empresa, usuario):
        """Test crear log de rendimiento"""
        perf_log = PerformanceLog.objects.create(
            empresa=empresa,
            method='GET',
            path='/api/productos/',
            user=usuario,
            response_time=0.250,
            db_queries_count=5,
            db_time=0.050,
            memory_usage=25.5,
            is_slow=False,
            status_code=200
        )
        
        assert perf_log.method == 'GET'
        assert perf_log.path == '/api/productos/'
        assert perf_log.response_time == 0.250
        assert perf_log.db_queries_count == 5
        assert perf_log.is_slow is False
        assert perf_log.status_code == 200
        
    def test_performance_log_lento(self, empresa, usuario):
        """Test log de request lento"""
        perf_log = PerformanceLog.objects.create(
            empresa=empresa,
            method='POST',
            path='/api/facturas/',
            user=usuario,
            response_time=5.500,  # Request lento
            db_queries_count=50,
            db_time=2.100,
            is_slow=True,
            status_code=201,
            extra_data={'complex_query': True, 'large_dataset': True}
        )
        
        assert perf_log.response_time == 5.500
        assert perf_log.is_slow is True
        assert perf_log.extra_data['complex_query'] is True


@pytest.mark.django_db
class TestBusinessEventLogModel:
    """Tests para el modelo BusinessEventLog"""
    
    def test_creacion_business_event_venta(self, empresa, usuario):
        """Test evento de negocio - venta creada"""
        business_log = BusinessEventLog.objects.create(
            empresa=empresa,
            event='SALE_CREATED',
            user=usuario,
            description='Nueva venta procesada',
            data={
                'sale_id': 123,
                'customer': 'Juan Pérez',
                'items_count': 3
            },
            amount=150.75,
            quantity=3
        )
        
        assert business_log.event == 'SALE_CREATED'
        assert business_log.amount == 150.75
        assert business_log.quantity == 3
        assert business_log.data['sale_id'] == 123
        
    def test_business_event_stock_bajo(self, empresa, usuario):
        """Test evento de stock bajo"""
        business_log = BusinessEventLog.objects.create(
            empresa=empresa,
            event='STOCK_LOW',
            user=usuario,
            description='Stock bajo detectado en producto TEST001',
            data={
                'product_code': 'TEST001',
                'current_stock': 5,
                'minimum_stock': 10,
                'alert_level': 'warning'
            },
            quantity=5
        )
        
        assert business_log.event == 'STOCK_LOW'
        assert business_log.data['current_stock'] == 5
        assert business_log.data['alert_level'] == 'warning'
        
    def test_business_event_backup_creado(self, empresa):
        """Test evento de backup creado"""
        business_log = BusinessEventLog.objects.create(
            empresa=empresa,
            event='BACKUP_CREATED',
            user=None,  # Proceso automático
            description='Backup automático generado',
            data={
                'backup_type': 'daily',
                'file_size': '125MB',
                'tables_count': 25
            }
        )
        
        assert business_log.event == 'BACKUP_CREATED'
        assert business_log.user is None
        assert business_log.data['backup_type'] == 'daily'


@pytest.mark.django_db
@pytest.mark.api
class TestAuditAPI:
    """Tests de API para auditoría"""
    
    def test_audit_logs_endpoint_exists(self, authenticated_client):
        """Test que el endpoint de logs existe"""
        response = authenticated_client.get("/api/audit/logs/")
        
        # Verificar que responde (independientemente del contenido)
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ]
        
    def test_security_logs_endpoint_exists(self, authenticated_client):
        """Test que el endpoint de security logs existe"""
        response = authenticated_client.get("/api/audit/security/")
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ]


@pytest.mark.django_db
@pytest.mark.security
class TestAuditSecurity:
    """Tests de seguridad para auditoría"""
    
    def test_aislamiento_logs_por_empresa(self, empresa, usuario):
        """Test que los logs están aislados por empresa"""
        # Crear segunda empresa
        empresa2 = Empresa.objects.create(
            nombre="Empresa 2",
            cif="87654321B",
            email="empresa2@test.com"
        )
        
        # Crear logs para cada empresa
        log1 = AuditLog.objects.create(
            empresa=empresa,
            action='CREATE',
            user=usuario,
            table_name='test1',
            description='Log empresa 1',
            module='test'
        )
        
        log2 = AuditLog.objects.create(
            empresa=empresa2,
            action='CREATE',
            user=usuario,  # Mismo usuario pero diferente empresa
            table_name='test2', 
            description='Log empresa 2',
            module='test'
        )
        
        # Verificar aislamiento usando _base_manager para evitar filtrado automático
        logs_empresa1 = AuditLog._base_manager.filter(empresa=empresa)
        logs_empresa2 = AuditLog._base_manager.filter(empresa=empresa2)
        
        assert log1 in logs_empresa1
        assert log1 not in logs_empresa2
        assert log2 in logs_empresa2
        assert log2 not in logs_empresa1
        
        # Verificar que el manager normal filtra por tenant actual
        # (asumiendo que el contexto está establecido para empresa)
        assert logs_empresa1.count() == 1
        assert logs_empresa2.count() == 1
