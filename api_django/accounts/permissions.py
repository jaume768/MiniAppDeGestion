from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """
    Permiso para verificar si el usuario es un superadmin
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_superadmin
        )


class IsEmpresaAdmin(permissions.BasePermission):
    """
    Permiso para verificar si el usuario es admin de una empresa
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_empresa_admin
        )


class IsOwnerOrEmpresaAdmin(permissions.BasePermission):
    """
    Permiso para verificar si el usuario es el propietario del objeto
    o es admin de la empresa
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Superadmins pueden acceder a todo
        if request.user.is_superadmin:
            return True
        
        # Si el objeto es un usuario
        if hasattr(obj, 'empresa'):
            # El usuario es propietario del objeto
            if obj == request.user:
                return True
            
            # O es admin de la misma empresa
            if (request.user.is_empresa_admin and 
                request.user.empresa == obj.empresa):
                return True
        
        return False


class HasEmpresaPermission(permissions.BasePermission):
    """
    Permiso base que verifica que el usuario tenga empresa asignada
    (excepto superadmins)
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Superadmins no necesitan empresa
        if request.user.is_superadmin:
            return True
        
        # Otros usuarios deben tener empresa asignada y activa
        return (
            request.user.empresa and
            request.user.empresa.activa
        )


class CanManageUsers(permissions.BasePermission):
    """
    Permiso para verificar si el usuario puede gestionar otros usuarios
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_superadmin or 
             (request.user.is_empresa_admin and request.user.can_manage_users))
        )


class CanViewReports(permissions.BasePermission):
    """
    Permiso para verificar si el usuario puede ver reportes
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_superadmin or 
             request.user.can_view_reports)
        )


class CanManageSettings(permissions.BasePermission):
    """
    Permiso para verificar si el usuario puede gestionar configuraciones
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_superadmin or 
             (request.user.is_empresa_admin and request.user.can_manage_settings))
        )


class IsSameEmpresa(permissions.BasePermission):
    """
    Permiso para verificar que el usuario pertenece a la misma empresa
    que el objeto que está intentando acceder
    """
    def has_object_permission(self, request, view, obj):
        # Superadmins pueden acceder a todo
        if request.user.is_superadmin:
            return True
        
        # Verificar que el usuario y el objeto pertenezcan a la misma empresa
        if hasattr(obj, 'empresa'):
            return request.user.empresa == obj.empresa
        
        return False
