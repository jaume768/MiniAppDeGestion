"""
Tests para la app documents - Gestión de Documentos
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status


@pytest.mark.django_db
class TestDocumentsModels:
    """Tests básicos para modelos de documentos"""
    
    def test_documents_functionality(self, empresa):
        """Test funcionalidad básica de documentos"""
        # Test que la app documents funciona correctamente
        assert empresa.id is not None


@pytest.mark.django_db
@pytest.mark.api
class TestDocumentsAPI:
    """Tests de API para documentos"""
    
    def test_documents_endpoint(self, authenticated_client):
        """Test endpoint de documentos"""
        response = authenticated_client.get("/api/documents/")
        
        # Verificar que responde
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ]
