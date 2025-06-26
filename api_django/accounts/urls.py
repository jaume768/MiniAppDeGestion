from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'accounts'

# Router para ViewSets
router = DefaultRouter()
router.register(r'invitations', views.UserInvitationViewSet, basename='invitations')

urlpatterns = [
    # Autenticación JWT
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Registro público de empresas (sin autenticación)
    path('public/register-empresa/', views.public_register_empresa_view, name='public_register_empresa'),
    
    # Registro y gestión de usuarios
    path('register/', views.register_view, name='register'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.update_profile_view, name='update_profile'),
    path('change-password/', views.change_password_view, name='change_password'),
    
    # Gestión de empresas (solo superadmins)
    path('empresas/', views.EmpresaListCreateView.as_view(), name='empresa_list'),
    path('empresas/<int:pk>/', views.EmpresaDetailView.as_view(), name='empresa_detail'),
    path('empresas/register/', views.register_empresa_view, name='register_empresa'),
    
    # Gestión de usuarios
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    
    # Sistema de invitaciones
    path('invite/', views.invite_user_view, name='invite_user'),
    path('invitation/<str:token>/', views.get_invitation_view, name='get_invitation'),
    path('invitation/accept/', views.accept_invitation_view, name='accept_invitation'),
    path('invitations/cleanup/', views.cleanup_expired_invitations_view, name='cleanup_invitations'),
    
    # Estadísticas de empresa
    path('empresa/stats/', views.empresa_stats_view, name='empresa_stats'),
    
    # Incluir rutas del router
    path('', include(router.urls)),
]
