from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, ProveedorViewSet, SerieViewSet, ContactosViewSet

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'series', SerieViewSet)
router.register(r'contactos', ContactosViewSet, basename='contactos')

urlpatterns = [
    path('', include(router.urls)),
]
