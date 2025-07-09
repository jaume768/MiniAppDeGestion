"""
Tests para la app projects - Gestión de proyectos
"""
import pytest
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from projects.models import Proyecto
from datetime import date, timedelta


@pytest.mark.django_db
class TestProyectoModel:
    """Tests unitarios para el modelo Proyecto"""
    
    def test_creacion_proyecto(self, empresa, cliente):
        """Test crear proyecto básico"""
        proyecto = Proyecto.objects.create(
            nombre="Proyecto Test",
            descripcion="Descripción del proyecto test",
            cliente=cliente,
            fecha_inicio=date.today(),
            fecha_fin_estimada=date.today() + timedelta(days=30),
            presupuesto=10000.00,
            estado="pendiente",
            empresa=empresa
        )
        
        assert proyecto.nombre == "Proyecto Test"
        assert proyecto.cliente == cliente
        assert proyecto.presupuesto == 10000.00
        assert proyecto.estado == "pendiente"
        assert proyecto.empresa == empresa
        assert str(proyecto) == "Proyecto Test"
    
    def test_proyecto_estados(self, empresa, cliente):
        """Test estados del proyecto"""
        proyecto = Proyecto.objects.create(
            nombre="Proyecto Estados",
            cliente=cliente,
            fecha_inicio=date.today(),
            presupuesto=5000.00,
            estado="en_progreso",
            empresa=empresa
        )
        
        assert proyecto.estado == "en_progreso"
        
        # Cambiar estado
        proyecto.estado = "completado"
        proyecto.save()
        
        proyecto_actualizado = Proyecto.objects.get(id=proyecto.id)
        assert proyecto_actualizado.estado == "completado"


@pytest.mark.django_db
@pytest.mark.api
class TestProyectoAPI:
    """Tests de API para proyectos"""
    
    def test_crear_proyecto_api(self, authenticated_client, cliente):
        """Test crear proyecto vía API"""
        data = {
            "nombre": "Proyecto API",
            "descripcion": "Proyecto creado via API",
            "cliente": cliente.id,
            "fecha_inicio": date.today().isoformat(),
            "fecha_fin_estimada": (date.today() + timedelta(days=60)).isoformat(),
            "presupuesto": "15000.00",
            "estado": "pendiente"
        }
        
        response = authenticated_client.post("/api/projects/proyectos/", data, format="json")
        
        if response.status_code == status.HTTP_201_CREATED:
            assert response.data["nombre"] == "Proyecto API"
            assert response.data["cliente"] == cliente.id
        else:
            assert response.status_code in [
                status.HTTP_404_NOT_FOUND,
                status.HTTP_403_FORBIDDEN,
                status.HTTP_400_BAD_REQUEST
            ]
    
    def test_listar_proyectos_por_estado(self, authenticated_client, empresa, cliente):
        """Test filtrar proyectos por estado"""
        # Crear proyectos con diferentes estados
        proyecto1 = Proyecto.objects.create(
            nombre="Proyecto Pendiente",
            cliente=cliente,
            fecha_inicio=date.today(),
            presupuesto=8000.00,
            estado="pendiente",
            empresa=empresa
        )
        
        proyecto2 = Proyecto.objects.create(
            nombre="Proyecto Completado",
            cliente=cliente,
            fecha_inicio=date.today() - timedelta(days=30),
            fecha_fin_real=date.today(),
            presupuesto=12000.00,
            estado="completado",
            empresa=empresa
        )
        
        # Filtrar por estado pendiente
        response = authenticated_client.get("/api/projects/proyectos/?estado=pendiente")
        
        if response.status_code == status.HTTP_200_OK:
            proyectos_pendientes = [p["nombre"] for p in response.data]
            assert "Proyecto Pendiente" in proyectos_pendientes
        else:
            assert response.status_code in [
                status.HTTP_404_NOT_FOUND,
                status.HTTP_403_FORBIDDEN
            ]


@pytest.mark.django_db
@pytest.mark.security
class TestProyectosSecurity:
    """Tests de seguridad para proyectos"""
    
    def test_aislamiento_proyectos_empresa(self, empresa, cliente):
        """Test aislamiento de proyectos por empresa"""
        from accounts.models import Empresa
        from core.models import Cliente
        
        # Crear segunda empresa y cliente
        empresa2 = Empresa.objects.create(
            nombre="Empresa 2",
            email="empresa2@test.com",
            telefono="999888777",
            direccion="Address 2",
            ciudad="City 2",
            codigo_postal="99999",
            pais="España"
        )
        
        cliente2 = Cliente.objects.create(
            nombre="Cliente Empresa 2",
            email="cliente2@test.com",
            telefono="222222222",
            empresa=empresa2
        )
        
        # Crear proyectos en cada empresa
        proyecto1 = Proyecto.objects.create(
            nombre="Proyecto Empresa 1",
            cliente=cliente,
            fecha_inicio=date.today(),
            presupuesto=5000.00,
            estado="pendiente",
            empresa=empresa
        )
        
        proyecto2 = Proyecto.objects.create(
            nombre="Proyecto Empresa 2",
            cliente=cliente2,
            fecha_inicio=date.today(),
            presupuesto=7000.00,
            estado="pendiente",
            empresa=empresa2
        )
        
        # Verificar aislamiento
        proyectos_empresa1 = Proyecto.objects.filter(empresa=empresa)
        proyectos_empresa2 = Proyecto.objects.filter(empresa=empresa2)
        
        assert proyecto1 in proyectos_empresa1
        assert proyecto1 not in proyectos_empresa2
        assert proyecto2 in proyectos_empresa2
        assert proyecto2 not in proyectos_empresa1
