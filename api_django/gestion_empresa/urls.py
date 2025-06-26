"""
URL configuration for gestion_empresa project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.reports import ReportsViewSet

# Router para reportes centralizados
reports_router = DefaultRouter()
reports_router.register(r'reportes', ReportsViewSet, basename='reportes')

# Importar los routers de cada app
from core.urls import router as core_router
from products.urls import router as products_router
from sales.urls import router as sales_router
from hr.urls import router as hr_router
from projects.urls import router as projects_router

# Router principal
router = DefaultRouter()

# Registrar todas las rutas de los módulos
router.registry.extend(core_router.registry)
router.registry.extend(products_router.registry)
router.registry.extend(sales_router.registry)
router.registry.extend(hr_router.registry)
router.registry.extend(projects_router.registry)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API de autenticación y gestión de usuarios/empresas
    path('api/auth/', include('accounts.urls')),
    
    # APIs modulares
    path('api/', include(router.urls)),
    
    # URLs específicas de los módulos si las hay
    path('api/core/', include('core.urls')),
    path('api/products/', include('products.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/hr/', include('hr.urls')),
    path('api/projects/', include('projects.urls')),
    
    # URLs específicas de pos sin usar router
    path('api/pos/', include('pos.urls')),
    
    # Reportes
    path('api/', include(reports_router.urls)),
]