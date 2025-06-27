from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuditLogViewSet, SecurityLogViewSet, 
    PerformanceLogViewSet, BusinessEventLogViewSet
)

router = DefaultRouter()
router.register(r'audit', AuditLogViewSet, basename='audit')
router.register(r'security', SecurityLogViewSet, basename='security')
router.register(r'performance', PerformanceLogViewSet, basename='performance')
router.register(r'business', BusinessEventLogViewSet, basename='business')

urlpatterns = [
    path('', include(router.urls)),
]
