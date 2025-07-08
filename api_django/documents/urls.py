from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentoPDFViewSet

router = DefaultRouter()
router.register(r'pdfs', DocumentoPDFViewSet, basename='documentopdf')

urlpatterns = [
    path('', include(router.urls)),
]
