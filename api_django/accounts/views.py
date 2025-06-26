from django.shortcuts import render
from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import login
from django.utils import timezone
from .models import Empresa, CustomUser, UserInvitation
from .serializers import (
    EmpresaSerializer, CustomUserSerializer, UserRegistrationSerializer,
    LoginSerializer, ChangePasswordSerializer, EmpresaRegistrationSerializer,
    PublicEmpresaRegistrationSerializer, InviteUserSerializer, 
    AcceptInvitationSerializer, UserInvitationSerializer
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
    queryset = Empresa.objects.all()  # Para el router
    serializer_class = EmpresaSerializer
    permission_classes = [IsSuperAdmin]
    
    def get_queryset(self):
        """Superadmins ven todas las empresas"""
        return Empresa.objects.all()


class EmpresaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar empresa específica"""
    queryset = Empresa.objects.all()  # Para el router
    serializer_class = EmpresaSerializer
    permission_classes = [IsSuperAdmin]
    
    def get_queryset(self):
        """Superadmins ven todas las empresas"""
        return Empresa.objects.all()


class UserListView(generics.ListAPIView):
    """Vista para listar usuarios"""
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = CustomUser.objects.all()  # Para el router
    
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
    queryset = CustomUser.objects.all()  # Para el router
    
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


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def public_register_empresa_view(request):
    """Vista pública para registro de empresas nuevas con su admin"""
    from django.db import transaction
    from rest_framework_simplejwt.tokens import RefreshToken
    from .utils import send_empresa_created_notification
    
    serializer = PublicEmpresaRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            with transaction.atomic():
                result = serializer.save()
                empresa = result['empresa']
                admin = result['admin']
                
                # Generar tokens para login automático
                refresh = RefreshToken.for_user(admin)
                access = refresh.access_token
                
                # Agregar claims personalizados
                access['empresa_id'] = empresa.id
                access['empresa_nombre'] = empresa.nombre
                access['role'] = admin.role
                access['permissions'] = admin.get_permissions()
                
                # Enviar email de bienvenida
                send_empresa_created_notification(empresa, admin)
                
                return Response({
                    'message': 'Empresa y administrador creados exitosamente',
                    'empresa': EmpresaSerializer(empresa).data,
                    'admin': CustomUserSerializer(admin).data,
                    'access': str(access),
                    'refresh': str(refresh),
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': f'Error creando empresa: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def invite_user_view(request):
    """Vista para invitar nuevos usuarios por email"""
    # Verificar permisos
    if not (request.user.is_superadmin or request.user.is_empresa_admin):
        return Response(
            {'error': 'No tienes permisos para invitar usuarios'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Verificar límite de usuarios para la empresa
    if request.user.empresa and not request.user.empresa.can_add_user():
        return Response(
            {'error': 'Has alcanzado el límite máximo de usuarios para tu plan'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = InviteUserSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        invitation = serializer.save()
        return Response(
            UserInvitationSerializer(invitation).data,
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_invitation_view(request, token):
    """Vista para obtener información de una invitación por token"""
    try:
        invitation = UserInvitation.objects.get(token=token)
        
        if not invitation.can_be_accepted():
            if invitation.is_expired():
                return Response(
                    {'error': 'La invitación ha expirado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'La invitación ya no está disponible'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Devolver información pública de la invitación
        data = {
            'email': invitation.email,
            'first_name': invitation.first_name,
            'last_name': invitation.last_name,
            'empresa_nombre': invitation.empresa.nombre,
            'role_display': invitation.get_role_display(),
            'invited_by': invitation.invited_by.get_full_name() if invitation.invited_by else None,
            'expires_at': invitation.expires_at,
            'message': invitation.message,
        }
        
        return Response(data)
        
    except UserInvitation.DoesNotExist:
        return Response(
            {'error': 'Token de invitación inválido'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def accept_invitation_view(request):
    """Vista para aceptar invitaciones"""
    from rest_framework_simplejwt.tokens import RefreshToken
    from .utils import send_welcome_email
    
    serializer = AcceptInvitationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            
            # Generar tokens para login automático
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token
            
            # Agregar claims personalizados
            access['empresa_id'] = user.empresa.id
            access['empresa_nombre'] = user.empresa.nombre
            access['role'] = user.role
            access['permissions'] = user.get_permissions()
            
            # Enviar email de bienvenida
            send_welcome_email(user, user.empresa)
            
            return Response({
                'message': 'Invitación aceptada exitosamente',
                'user': CustomUserSerializer(user).data,
                'access': str(access),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Error aceptando invitación: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserInvitationViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar invitaciones de usuarios"""
    serializer_class = UserInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'role']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'expires_at', 'email']
    ordering = ['-created_at']
    queryset = UserInvitation.objects.all()  # Para el router
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superadmin:
            return UserInvitation.objects.all()
        elif user.is_empresa_admin:
            return UserInvitation.objects.filter(empresa=user.empresa)
        else:
            # Usuarios normales no pueden ver invitaciones
            return UserInvitation.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Crear nueva invitación - redirigir a invite_user_view"""
        return invite_user_view(request)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar una invitación"""
        invitation = self.get_object()
        
        if invitation.status != 'pending':
            return Response(
                {'error': 'La invitación no se puede cancelar'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invitation.cancel()
        return Response({'message': 'Invitación cancelada exitosamente'})
    
    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Reenviar una invitación"""
        from .utils import send_invitation_email
        
        invitation = self.get_object()
        
        if invitation.status != 'pending':
            return Response(
                {'error': 'Solo se pueden reenviar invitaciones pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if invitation.is_expired():
            return Response(
                {'error': 'La invitación ha expirado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reenviar email
        if send_invitation_email(invitation):
            return Response({'message': 'Invitación reenviada exitosamente'})
        else:
            return Response(
                {'error': 'Error enviando la invitación'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cleanup_expired_invitations_view(request):
    """Vista para limpiar invitaciones expiradas (solo superadmins)"""
    if not request.user.is_superadmin:
        return Response(
            {'error': 'Solo superadmins pueden ejecutar esta acción'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from .utils import cleanup_expired_invitations
    count = cleanup_expired_invitations()
    
    return Response({
        'message': f'Se marcaron {count} invitaciones como expiradas'
    })
