from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'accounts'

urlpatterns = [
    # Autenticación JWT
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
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
    
    # Estadísticas de empresa
    path('empresa/stats/', views.empresa_stats_view, name='empresa_stats'),
]
