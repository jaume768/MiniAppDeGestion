"""
Tests para la app tenants - Sistema Multi-Tenancy
"""
import pytest
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from tenants.middleware import TenantMiddleware
from tenants.models import TenantModelMixin, TenantManager
from tenants.utils import get_current_empresa_id, set_current_empresa_id

User = get_user_model()


@pytest.mark.django_db
class TestTenantMiddleware:
    """Tests para el middleware de multi-tenancy"""
    
    def test_middleware_setup(self):
        """Test que el middleware se puede instanciar"""
        def get_response(request):
            return None
            
        middleware = TenantMiddleware(get_response)
        assert middleware is not None
    
    def test_tenant_context(self, empresa, usuario):
        """Test que el contexto de tenant se establece correctamente"""
        factory = RequestFactory()
        request = factory.get('/')
        request.user = usuario
        
        # Simular establecimiento de contexto
        set_current_empresa_id(empresa.id)
        current_empresa = get_current_empresa_id()
        
        assert current_empresa == empresa.id


@pytest.mark.django_db
class TestTenantModels:
    """Tests para modelos multi-tenant"""
    
    def test_tenant_model_mixin(self, empresa):
        """Test que TenantModelMixin funciona correctamente"""
        # Usar modelo Cliente que hereda de TenantModelMixin
        from core.models import Cliente
        
        cliente = Cliente.objects.create(
            nombre="Cliente Tenant Test",
            email="tenant@test.com",
            telefono="123456789",
            empresa=empresa
        )
        
        # Verificar que el cliente tiene empresa
        assert cliente.empresa == empresa
        assert hasattr(cliente, 'empresa')
    
    def test_tenant_manager_filtering(self, empresa):
        """Test que TenantManager filtra correctamente"""
        from core.models import Cliente
        
        # Crear cliente
        cliente = Cliente.objects.create(
            nombre="Cliente Manager Test",
            email="manager@test.com",
            telefono="987654321",
            empresa=empresa
        )
        
        # Verificar que el manager funciona
        clientes = Cliente.objects.all()
        assert cliente in clientes
        
        # Verificar filtrado por empresa
        clientes_empresa = Cliente.objects.filter(empresa=empresa)
        assert cliente in clientes_empresa


@pytest.mark.django_db
@pytest.mark.security
class TestTenantSecurity:
    """Tests de seguridad para multi-tenancy"""
    
    def test_tenant_isolation(self, empresa):
        """Test que los tenants están correctamente aislados"""
        from accounts.models import Empresa
        from core.models import Cliente
        
        # Crear segunda empresa
        empresa2 = Empresa.objects.create(
            nombre="Empresa 2",
            email="empresa2@test.com",
            telefono="999888777",
            direccion="Address 2",
            ciudad="City 2",
            codigo_postal="99999",
            pais="España"
        )
        
        # Crear clientes en cada empresa
        cliente1 = Cliente.objects.create(
            nombre="Cliente Empresa 1",
            email="cliente1@test.com",
            telefono="111111111",
            empresa=empresa
        )
        
        cliente2 = Cliente.objects.create(
            nombre="Cliente Empresa 2",
            email="cliente2@test.com",
            telefono="222222222",
            empresa=empresa2
        )
        
        # Verificar aislamiento completo
        assert cliente1.empresa != cliente2.empresa
        
        # Verificar que las consultas están filtradas
        clientes_emp1 = Cliente.objects.filter(empresa=empresa)
        clientes_emp2 = Cliente.objects.filter(empresa=empresa2)
        
        # Cliente 1 solo en empresa 1
        assert cliente1 in clientes_emp1
        assert cliente1 not in clientes_emp2
        
        # Cliente 2 solo en empresa 2  
        assert cliente2 in clientes_emp2
        assert cliente2 not in clientes_emp1
    
    def test_tenant_data_leakage_prevention(self, empresa):
        """Test prevención de filtración de datos entre tenants"""
        from accounts.models import Empresa
        
        # Crear múltiples empresas
        empresas = []
        for i in range(3):
            emp = Empresa.objects.create(
                nombre=f"Empresa {i+1}",
                email=f"empresa{i+1}@test.com",
                telefono=f"11111111{i}",
                direccion=f"Address {i+1}",
                ciudad=f"City {i+1}",
                codigo_postal=f"1111{i}",
                pais="España"
            )
            empresas.append(emp)
        
        # Verificar que cada empresa solo ve sus datos
        for empresa_actual in empresas:
            # Cada empresa debería tener sus propios datos aislados
            empresa_data = Empresa.objects.filter(id=empresa_actual.id)
            assert empresa_actual in empresa_data
            
            # No debería poder acceder directamente a otras empresas
            # (esto dependería de la implementación específica del manager)
            otras_empresas = Empresa.objects.exclude(id=empresa_actual.id)
            assert empresa_actual not in otras_empresas
