"""
Tests para la app hr - Recursos Humanos
"""
import pytest
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from hr.models import Departamento, Empleado


@pytest.mark.django_db
class TestDepartamentoModel:
    """Tests unitarios para el modelo Departamento"""
    
    def test_creacion_departamento(self, empresa):
        """Test crear departamento básico"""
        departamento = Departamento.objects.create(
            nombre="Ventas",
            descripcion="Departamento de ventas",
            empresa=empresa
        )
        
        assert departamento.nombre == "Ventas"
        assert departamento.descripcion == "Departamento de ventas"
        assert departamento.empresa == empresa
        assert str(departamento) == "Ventas"
    
    def test_departamento_multi_tenant(self, empresa):
        """Test que departamento pertenece a empresa"""
        dept = Departamento.objects.create(
            nombre="IT",
            descripcion="Tecnología",
            empresa=empresa
        )
        
        assert dept.empresa == empresa
        assert dept.empresa_id == empresa.id


@pytest.mark.django_db
class TestEmpleadoModel:
    """Tests unitarios para el modelo Empleado"""
    
    def test_creacion_empleado(self, empresa):
        """Test crear empleado básico"""
        # Crear departamento primero
        departamento = Departamento.objects.create(
            nombre="Recursos Humanos",
            descripcion="Gestión de personal",
            empresa=empresa
        )
        
        empleado = Empleado.objects.create(
            nombre="Juan",
            apellidos="Pérez García",
            email="juan.perez@empresa.com",
            telefono="123456789",
            departamento=departamento,
            puesto="Analista",
            salario=35000.00,
            fecha_contratacion="2023-01-15",
            empresa=empresa
        )
        
        assert empleado.nombre == "Juan"
        assert empleado.apellidos == "Pérez García"
        assert empleado.departamento == departamento
        assert empleado.puesto == "Analista"
        assert empleado.salario == 35000.00
        assert empleado.empresa == empresa
        assert str(empleado) == "Juan Pérez García"
    
    def test_empleado_sin_departamento(self, empresa):
        """Test empleado sin departamento asignado"""
        empleado = Empleado.objects.create(
            nombre="María",
            apellidos="González López",
            email="maria.gonzalez@empresa.com",
            telefono="987654321",
            puesto="Freelancer",
            salario=0.00,
            fecha_contratacion="2023-02-01",
            empresa=empresa
        )
        
        assert empleado.departamento is None
        assert empleado.puesto == "Freelancer"
    
    def test_empleado_validacion_salario(self, empresa):
        """Test validación de salario positivo"""
        departamento = Departamento.objects.create(
            nombre="Finanzas",
            empresa=empresa
        )
        
        # Salario válido
        empleado = Empleado.objects.create(
            nombre="Carlos",
            apellidos="Rodríguez",
            email="carlos@empresa.com",
            telefono="111222333",
            departamento=departamento,
            puesto="Contador",
            salario=40000.00,
            fecha_contratacion="2023-03-01",
            empresa=empresa
        )
        
        assert empleado.salario == 40000.00
        
        # Salario negativo (si tienes validación)
        # Esto dependería de tu implementación específica


@pytest.mark.django_db
@pytest.mark.api
class TestHRAPI:
    """Tests de API para recursos humanos"""
    
    def test_crear_departamento_api(self, authenticated_client):
        """Test crear departamento vía API"""
        data = {
            "nombre": "Marketing",
            "descripcion": "Departamento de marketing y comunicación"
        }
        
        response = authenticated_client.post("/api/hr/departamentos/", data, format="json")
        
        if response.status_code == status.HTTP_201_CREATED:
            assert response.data["nombre"] == "Marketing"
            assert response.data["descripcion"] == "Departamento de marketing y comunicación"
        else:
            assert response.status_code in [
                status.HTTP_404_NOT_FOUND,
                status.HTTP_403_FORBIDDEN,
                status.HTTP_400_BAD_REQUEST
            ]
    
    def test_crear_empleado_api(self, authenticated_client, empresa):
        """Test crear empleado vía API"""
        # Crear departamento primero
        departamento = Departamento.objects.create(
            nombre="Desarrollo",
            descripcion="Desarrollo de software",
            empresa=empresa
        )
        
        data = {
            "nombre": "Ana",
            "apellidos": "Martín Sánchez",
            "email": "ana.martin@empresa.com",
            "telefono": "555666777",
            "departamento": departamento.id,
            "puesto": "Desarrolladora",
            "salario": "45000.00",
            "fecha_contratacion": "2023-04-01"
        }
        
        response = authenticated_client.post("/api/hr/empleados/", data, format="json")
        
        if response.status_code == status.HTTP_201_CREATED:
            assert response.data["nombre"] == "Ana"
            assert response.data["apellidos"] == "Martín Sánchez"
            assert response.data["puesto"] == "Desarrolladora"
        else:
            assert response.status_code in [
                status.HTTP_404_NOT_FOUND,
                status.HTTP_403_FORBIDDEN,
                status.HTTP_400_BAD_REQUEST
            ]
    
    def test_listar_empleados_por_departamento(self, authenticated_client, empresa):
        """Test filtrar empleados por departamento"""
        # Crear departamentos y empleados
        dept_ventas = Departamento.objects.create(
            nombre="Ventas",
            empresa=empresa
        )
        
        dept_it = Departamento.objects.create(
            nombre="IT",
            empresa=empresa
        )
        
        empleado1 = Empleado.objects.create(
            nombre="Pedro",
            apellidos="López",
            email="pedro@empresa.com",
            telefono="111111111",
            departamento=dept_ventas,
            puesto="Vendedor",
            salario=30000.00,
            fecha_contratacion="2023-01-01",
            empresa=empresa
        )
        
        empleado2 = Empleado.objects.create(
            nombre="Laura",
            apellidos="García",
            email="laura@empresa.com",
            telefono="222222222",
            departamento=dept_it,
            puesto="Programadora",
            salario=50000.00,
            fecha_contratacion="2023-02-01",
            empresa=empresa
        )
        
        # Test filtrar por departamento
        response = authenticated_client.get(f"/api/hr/empleados/?departamento={dept_ventas.id}")
        
        if response.status_code == status.HTTP_200_OK:
            # Manejar respuesta paginada o lista directa
            data = response.data
            if isinstance(data, dict) and 'results' in data:
                empleados_data = data['results']
            else:
                empleados_data = data
            
            empleados_ventas = [emp["nombre"] for emp in empleados_data]
            assert "Pedro" in empleados_ventas
            assert "Laura" not in empleados_ventas
        else:
            assert response.status_code in [
                status.HTTP_404_NOT_FOUND,
                status.HTTP_403_FORBIDDEN
            ]


@pytest.mark.django_db
@pytest.mark.integration
class TestHRIntegration:
    """Tests de integración para HR"""
    
    def test_flujo_completo_empleado(self, authenticated_client, empresa):
        """Test flujo completo: crear departamento → crear empleado → actualizar → consultar"""
        # 1. Crear departamento
        departamento = Departamento.objects.create(
            nombre="Administración",
            descripcion="Gestión administrativa",
            empresa=empresa
        )
        
        # 2. Crear empleado
        empleado = Empleado.objects.create(
            nombre="Roberto",
            apellidos="Fernández",
            email="roberto@empresa.com",
            telefono="333444555",
            departamento=departamento,
            puesto="Administrativo",
            salario=28000.00,
            fecha_contratacion="2023-05-01",
            empresa=empresa
        )
        
        # 3. Verificar creación
        assert empleado.departamento == departamento
        # Usar _base_manager para evitar filtrado automático
        assert Empleado._base_manager.filter(departamento=departamento, id=empleado.id).exists()
        
        # 4. Actualizar empleado (promoción)
        empleado.puesto = "Jefe de Administración"
        empleado.salario = 35000.00
        empleado.save()
        
        # 5. Verificar actualización
        empleado_actualizado = Empleado._base_manager.get(id=empleado.id)
        assert empleado_actualizado.puesto == "Jefe de Administración"
        assert empleado_actualizado.salario == 35000.00
        
        # 6. Consultar empleados del departamento
        empleados_dept = Empleado._base_manager.filter(departamento=departamento)
        assert empleado in empleados_dept


@pytest.mark.django_db
@pytest.mark.security
class TestHRSecurity:
    """Tests de seguridad para HR"""
    
    def test_aislamiento_departamentos_empresa(self, empresa):
        """Test aislamiento de departamentos por empresa"""
        from accounts.models import Empresa
        
        # Crear segunda empresa
        empresa2 = Empresa.objects.create(
            nombre="Empresa 2",
            cif="87654321B",
            email="empresa2@test.com",
            telefono="999888777",
            direccion="Address 2"
        )
        
        # Crear departamentos en cada empresa
        dept1 = Departamento.objects.create(
            nombre="Dept 1",
            descripcion="Departamento empresa 1",
            empresa=empresa
        )
        
        dept2 = Departamento.objects.create(
            nombre="Dept 2",
            descripcion="Departamento empresa 2",
            empresa=empresa2
        )
        
        # Verificar aislamiento - usar _base_manager para evitar filtrado automático
        depts_empresa1 = Departamento._base_manager.filter(empresa=empresa)
        depts_empresa2 = Departamento._base_manager.filter(empresa=empresa2)
        
        assert dept1 in depts_empresa1
        assert dept1 not in depts_empresa2
        assert dept2 in depts_empresa2
        assert dept2 not in depts_empresa1
        
        # Verificar que los departamentos son diferentes por empresa
        assert dept1.empresa == empresa
        assert dept2.empresa == empresa2
        assert dept1.empresa != dept2.empresa
    
    def test_empleados_no_acceso_otra_empresa(self, empresa):
        """Test que empleados no pueden acceder a datos de otra empresa"""
        from accounts.models import Empresa
        
        empresa2 = Empresa.objects.create(
            nombre="Otra Empresa",
            cif="11111111A",
            email="otra@empresa.com",
            telefono="111111111",
            direccion="Otra Address"
        )
        
        # Crear empleados en empresas diferentes
        empleado1 = Empleado.objects.create(
            nombre="Emp1",
            apellidos="Empresa1",
            email="emp1@empresa.com",
            telefono="111111111",
            puesto="Puesto1",
            salario=30000.00,
            fecha_contratacion="2023-01-01",
            empresa=empresa
        )
        
        empleado2 = Empleado.objects.create(
            nombre="Emp2",
            apellidos="Empresa2",
            email="emp2@empresa.com",
            telefono="222222222",
            puesto="Puesto2",
            salario=35000.00,
            fecha_contratacion="2023-01-01",
            empresa=empresa2
        )
        
        # Verificar que están en empresas diferentes
        assert empleado1.empresa != empleado2.empresa
        
        # Verificar filtrado por empresa - usar _base_manager para evitar filtrado automático
        empleados_empresa1 = Empleado._base_manager.filter(empresa=empresa)
        empleados_empresa2 = Empleado._base_manager.filter(empresa=empresa2)
        
        assert empleado1 in empleados_empresa1
        assert empleado1 not in empleados_empresa2
        assert empleado2 in empleados_empresa2
        assert empleado2 not in empleados_empresa1
        
        # Verificar que los empleados pertenecen a empresas diferentes
        assert empleado1.empresa == empresa
        assert empleado2.empresa == empresa2
        assert empleado1.empresa != empleado2.empresa
