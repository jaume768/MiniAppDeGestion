/**
 * Hook para gestión de permisos del usuario
 * Extrae y verifica permisos desde los datos del usuario en localStorage
 */
import { useMemo } from 'react';
import { getAccessibleModules, getModulesByCategory, canAccessModule } from '../config/modules';

export const usePermissions = () => {
  const userData = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem('userData');
    if (!stored) return null;
    
    try {
      const parsed = JSON.parse(stored);
      // console.log('userData from localStorage:', parsed); // Debug
      return parsed;
    } catch (error) {
      console.error('Error parsing userData:', error);
      return null;
    }
  }, []);

  const user = userData?.user;
  const permissions = user?.permissions || {};
  const accessibleModules = user?.accessible_modules || permissions?.accessible_modules || [];
  const canAccessModule = (moduleName) => {
    if (!accessibleModules) return false;
    
    // SuperAdmin tiene acceso a todo
    if (accessibleModules.includes('all')) return true;
    
    // Verificar si el módulo está en la lista
    return accessibleModules.includes(moduleName);
  };

  // Verificar permiso específico
  const hasPermission = (permission) => {
    // Los administradores tienen todos los permisos
    if (user?.role === 'admin') {
      return true;
    }
    
    // Para otros usuarios, verificar permisos específicos
    return permissions[permission] === true;
  };

  // Obtener módulos accesibles por categoría
  const getAccessibleModulesByCategoryFunc = (category = null) => {
    return getModulesByCategory(accessibleModules, category);
  };

  // Helpers adicionales para compatibilidad
  const getRole = () => user?.role;
  const getCargo = () => user?.cargo;
  
  // Obtener badges de permisos para mostrar en el dashboard
  const getPermissionBadges = () => {
    if (!permissions) return [];
    
    const badges = [];
    const permissionLabels = {
      can_create_data: 'Crear',
      can_edit_data: 'Editar',
      can_delete_data: 'Eliminar',
      can_manage_users: 'Gestionar Usuarios',
      can_view_reports: 'Ver Reportes',
      can_manage_settings: 'Configuración'
    };
    
    Object.entries(permissions).forEach(([key, value]) => {
      if (value && permissionLabels[key]) {
        badges.push({
          key,
          label: permissionLabels[key],
          active: true
        });
      }
    });
    
    return badges;
  };

  return {
    user,
    permissions,
    accessibleModules,
    canAccessModule,
    hasPermission,
    getAccessibleModulesByCategory: getAccessibleModulesByCategoryFunc,
    getPermissionBadges,
    getRole,
    getCargo,
    
    // Información del usuario
    isAuthenticated: !!user,
    role: user?.role,
    cargo: user?.cargo,
    userName: user?.first_name && user?.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user?.username,
    
    // Aliases para compatibilidad
    userRole: user?.role,
    userCargo: user?.cargo,
    
    // Helpers adicionales
    isSuperAdmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isEmployee: user?.role === 'employee',
    isReadonly: user?.role === 'readonly'
  };
};
