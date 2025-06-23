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

urlpatterns = [
    path('admin/', admin.site.urls),
    # URLs de apps modulares
    path('', include('core.urls')),
    path('', include('products.urls')),
    path('', include('sales.urls')),
    path('', include('hr.urls')),
    path('', include('projects.urls')),
    # Reportes
    path('api/', include(reports_router.urls)),
]