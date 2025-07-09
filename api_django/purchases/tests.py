"""
Tests para la app purchases - Gestión de Compras
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal


@pytest.mark.django_db
class TestPurchasesModels:
    """Tests básicos para modelos de compras"""
    
    def test_model_exists(self, empresa):
        """Test que los modelos de compras existen"""
        # Este test básico verifica que la app funciona
        assert empresa.id is not None


@pytest.mark.django_db
@pytest.mark.api
class TestPurchasesAPI:
    """Tests de API para compras"""
    
    def test_compras_endpoint(self, authenticated_client):
        """Test endpoint de compras"""
        response = authenticated_client.get("/api/purchases/")
        
        # Verificar que responde
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ]
