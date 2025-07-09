"""
Configuración global para tests con pytest-django
"""
import os
import django
from django.conf import settings

# Configurar Django antes de cualquier importación
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_empresa.settings_test')
django.setup()

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from accounts.models import Empresa
from core.models import Cliente
from products.models import Articulo, Categoria, Marca
from inventory.models import Almacen

User = get_user_model()


@pytest.fixture
def empresa():
    """Fixture para crear una empresa de test"""
    empresa = Empresa.objects.create(
        nombre="Empresa Test",
        cif="12345678T",
        email="test@empresa.com",
        telefono="123456789",
        direccion="Calle Test 123",
        plan="basic"
    )
    return empresa


@pytest.fixture
def usuario(empresa):
    """Fixture para crear un usuario de test"""
    user = User.objects.create_user(
        username="testuser",
        email="test@user.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
        empresa=empresa,
        role="admin",
        can_manage_users=True,
        can_manage_settings=True
    )
    return user


@pytest.fixture
def cliente(empresa):
    """Fixture para crear un cliente de test"""
    cliente = Cliente.objects.create(
        nombre="Cliente Test",
        email="cliente@test.com",
        telefono="987654321",
        direccion="Calle Cliente 456",
        empresa=empresa
    )
    return cliente


@pytest.fixture
def categoria(empresa):
    """Fixture para crear una categoría de test"""
    categoria = Categoria.objects.create(
        nombre="Categoría Test",
        descripcion="Descripción de categoría test",
        empresa=empresa
    )
    return categoria


@pytest.fixture
def marca(empresa):
    """Fixture para crear una marca de test"""
    marca = Marca.objects.create(
        nombre="Marca Test",
        descripcion="Descripción de marca test",
        empresa=empresa
    )
    return marca


@pytest.fixture
def articulo(empresa, categoria, marca):
    """Fixture para crear un artículo de test"""
    articulo = Articulo.objects.create(
        codigo="TEST001",
        nombre="Artículo Test",
        descripcion="Descripción del artículo test",
        precio_compra=10.00,
        precio_venta=15.00,
        iva=21,
        categoria=categoria,
        marca=marca,
        empresa=empresa
    )
    return articulo


@pytest.fixture
def almacen(empresa):
    """Fixture para crear un almacén de test"""
    almacen = Almacen.objects.create(
        nombre="Almacén Test",
        descripcion="Almacén principal de test",
        direccion="Calle Almacén 789",
        empresa=empresa
    )
    return almacen


@pytest.fixture
def api_client():
    """Fixture para cliente API sin autenticar"""
    return APIClient()


@pytest.fixture
def authenticated_client(usuario):
    """Fixture para cliente API autenticado con JWT"""
    client = APIClient()
    refresh = RefreshToken.for_user(usuario)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """
    Fixture que se ejecuta automáticamente para permitir acceso a DB en todos los tests
    """
    pass
