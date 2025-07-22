import { useCallback } from 'react';
import { getAccessibleModules, getModulesByCategory, canAccessModule } from '../config/modules';

/**
 * Hook para manejar permisos del usuario
 * Utiliza los datos del usuario almacenados en localStorage
 */
export function usePermissions() {
  // Obtener datos del usuario desde localStorage
  const getUserData = useCallback(() => {
    try {
      const userDataStr = localStorage.getItem('user_data');
      return userDataStr ? JSON.parse(userDataStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }, []);

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permission - Nombre del permiso a verificar
   * @returns {boolean} True si tiene el permiso
   */
  const hasPermission = useCallback((permission) => {
    const userData = getUserData();
    return userData?.permissions?.[permission] || false;
  }, [getUserData]);

  /**
   * Verifica si el usuario tiene alguno de los permisos especificados
   * @param {Array<string>} permissions - Array de permisos a verificar
   * @returns {boolean} True si tiene al menos uno de los permisos
   */
  const hasAnyPermission = useCallback((permissions) => {
    if (!Array.isArray(permissions)) {
      return false;
    }
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  /**
   * Verifica si el usuario puede acceder a un módulo específico
   * @param {string} moduleKey - Clave del módulo
   * @returns {boolean} True si puede acceder
   */
  const canAccessModuleByKey = useCallback((moduleKey) => {
    const userData = getUserData();
    const accessibleModules = userData?.permissions?.accessible_modules || [];
    return canAccessModule(accessibleModules, moduleKey);
  }, [getUserData]);

  /**
   * Obtiene todos los módulos accesibles para el usuario
   * @returns {Array} Array de módulos accesibles
   */
  const getAccessibleModulesForUser = useCallback(() => {
    const userData = getUserData();
    const accessibleModules = userData?.permissions?.accessible_modules || [];
    return getAccessibleModules(accessibleModules);
  }, [getUserData]);

  /**
   * Obtiene módulos accesibles por categoría
   * @param {string} category - Categoría ('operational' | 'administrative')
   * @returns {Array} Array de módulos filtrados por categoría
   */
  const getAccessibleModulesByCategory = useCallback((category) => {
    const userData = getUserData();
    const accessibleModules = userData?.permissions?.accessible_modules || [];
    return getModulesByCategory(accessibleModules, category);
  }, [getUserData]);

  /**
   * Verifica si el usuario es admin o superadmin
   * @returns {boolean} True si es admin o superadmin
   */
  const isAdmin = useCallback(() => {
    const userData = getUserData();
    return ['admin', 'superadmin'].includes(userData?.role);
  }, [getUserData]);

  /**
   * Verifica si el usuario es superadmin
   * @returns {boolean} True si es superadmin
   */
  const isSuperAdmin = useCallback(() => {
    const userData = getUserData();
    return userData?.role === 'superadmin';
  }, [getUserData]);

  /**
   * Obtiene el rol del usuario
   * @returns {string|null} Rol del usuario
   */
  const getUserRole = useCallback(() => {
    const userData = getUserData();
    return userData?.role || null;
  }, [getUserData]);

  /**
   * Obtiene el cargo del usuario
   * @returns {string|null} Cargo del usuario
   */
  const getUserCargo = useCallback(() => {
    const userData = getUserData();
    return userData?.cargo || null;
  }, [getUserData]);

  /**
   * Obtiene todos los permisos del usuario
   * @returns {Object} Objeto con todos los permisos
   */
  const getAllPermissions = useCallback(() => {
    const userData = getUserData();
    return userData?.permissions || {};
  }, [getUserData]);

  /**
   * Genera badges de permisos activos para mostrar en la UI
   * @returns {Array} Array de badges con nombre y color
   */
  const getPermissionBadges = useCallback(() => {
    const permissions = getAllPermissions();
    const badges = [];

    if (permissions.can_create_data) {
      badges.push({ name: 'Crear', color: 'bg-green-100 text-green-800' });
    }
    if (permissions.can_edit_data) {
      badges.push({ name: 'Editar', color: 'bg-blue-100 text-blue-800' });
    }
    if (permissions.can_delete_data) {
      badges.push({ name: 'Eliminar', color: 'bg-red-100 text-red-800' });
    }
    if (permissions.can_manage_users) {
      badges.push({ name: 'Gestionar Usuarios', color: 'bg-purple-100 text-purple-800' });
    }
    if (permissions.can_view_reports) {
      badges.push({ name: 'Ver Reportes', color: 'bg-yellow-100 text-yellow-800' });
    }
    if (permissions.can_manage_settings) {
      badges.push({ name: 'Configuración', color: 'bg-gray-100 text-gray-800' });
    }

    return badges;
  }, [getAllPermissions]);

  return {
    // Verificación de permisos
    hasPermission,
    hasAnyPermission,
    
    // Acceso a módulos
    canAccessModule: canAccessModuleByKey,
    getAccessibleModules: getAccessibleModulesForUser,
    getAccessibleModulesByCategory,
    
    // Información del usuario
    isAdmin,
    isSuperAdmin,
    getUserRole,
    getUserCargo,
    getAllPermissions,
    getPermissionBadges,
    
    // Utilidades
    getUserData
  };
}
