from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import login
from django.utils import timezone
from .models import Empresa, CustomUser
from .serializers import (
    EmpresaSerializer, CustomUserSerializer, UserRegistrationSerializer,
    LoginSerializer, ChangePasswordSerializer, EmpresaRegistrationSerializer
)
from .permissions import IsSuperAdmin, IsEmpresaAdmin, IsOwnerOrEmpresaAdmin


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para obtener tokens JWT"""
    serializer_class = LoginSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Actualizar último acceso
        user.ultimo_acceso = timezone.now()
        user.save(update_fields=['ultimo_acceso'])
        
        # Generar tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Agregar claims personalizados
        if user.empresa:
            access['empresa_id'] = user.empresa.id
            access['empresa_nombre'] = user.empresa.nombre
        access['role'] = user.role
        access['permissions'] = user.get_permissions()
        
        return Response({
            'access': str(access),
            'refresh': str(refresh),
            'user': CustomUserSerializer(user).data
        })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """Vista para registro de nuevos usuarios por parte de administradores"""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Se requiere autenticación'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Solo admins de empresa y superadmins pueden crear usuarios
    if not (request.user.is_empresa_admin or request.user.is_superadmin):
        return Response(
            {'error': 'No tienes permisos para crear usuarios'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Si es admin de empresa, asignar automáticamente su empresa
    if request.user.is_empresa_admin:
        request.data['empresa'] = request.user.empresa.id
    
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            CustomUserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def register_empresa_view(request):
    """Vista para registro de nuevas empresas (solo superadmins)"""
    serializer = EmpresaRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        empresa = serializer.save()
        return Response(
            EmpresaSerializer(empresa).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """Vista para obtener el perfil del usuario actual"""
    serializer = CustomUserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile_view(request):
    """Vista para actualizar el perfil del usuario actual"""
    serializer = CustomUserSerializer(
        request.user,
        data=request.data,
        partial=request.method == 'PATCH'
    )
    if serializer.is_valid():
        # Usuarios normales no pueden cambiar su rol o empresa
        if not request.user.is_superadmin:
            serializer.validated_data.pop('role', None)
            serializer.validated_data.pop('empresa', None)
            serializer.validated_data.pop('can_manage_users', None)
            serializer.validated_data.pop('can_manage_settings', None)
        
        user = serializer.save()
        return Response(CustomUserSerializer(user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """Vista para cambiar contraseña"""
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Contraseña cambiada exitosamente'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmpresaListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear empresas"""
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [IsSuperAdmin]


class EmpresaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar empresa específica"""
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [IsSuperAdmin]


class UserListView(generics.ListAPIView):
    """Vista para listar usuarios"""
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superadmin:
            # Superadmins pueden ver todos los usuarios
            return CustomUser.objects.all()
        elif user.is_empresa_admin:
            # Admins de empresa solo ven usuarios de su empresa
            return CustomUser.objects.filter(empresa=user.empresa)
        else:
            # Usuarios normales solo se ven a sí mismos
            return CustomUser.objects.filter(id=user.id)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar usuario específico"""
    serializer_class = CustomUserSerializer
    permission_classes = [IsOwnerOrEmpresaAdmin]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superadmin:
            return CustomUser.objects.all()
        elif user.is_empresa_admin:
            return CustomUser.objects.filter(empresa=user.empresa)
        else:
            return CustomUser.objects.filter(id=user.id)
    
    def update(self, request, *args, **kwargs):
        """Override para prevenir que usuarios cambien datos críticos"""
        instance = self.get_object()
        
        # Solo superadmins pueden cambiar empresa y ciertos roles
        if not request.user.is_superadmin:
            request.data.pop('empresa', None)
            request.data.pop('role', None) if instance.role in ['admin', 'superadmin'] else None
            request.data.pop('can_manage_users', None)
            request.data.pop('can_manage_settings', None)
        
        return super().update(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def empresa_stats_view(request):
    """Vista para obtener estadísticas de la empresa actual"""
    if request.user.is_superadmin:
        return Response({'error': 'Los superadmins no tienen empresa asignada'})
    
    if not request.user.empresa:
        return Response({'error': 'Usuario sin empresa asignada'})
    
    empresa = request.user.empresa
    
    stats = {
        'empresa': EmpresaSerializer(empresa).data,
        'usuarios_activos': empresa.usuarios.filter(is_active=True).count(),
        'usuarios_totales': empresa.usuarios.count(),
        'usuarios_disponibles': empresa.max_usuarios - empresa.get_usuarios_count(),
        'plan': empresa.plan,
        'fecha_vencimiento': empresa.fecha_vencimiento,
    }
    
    return Response(stats)
