from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartamentoViewSet, EmpleadoViewSet

router = DefaultRouter()
router.register(r'departamentos', DepartamentoViewSet)
router.register(r'empleados', EmpleadoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
