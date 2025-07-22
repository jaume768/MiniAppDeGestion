/**
 * Componente para control de permisos
 * Envuelve componentes y los oculta/muestra según permisos del usuario
 */
import { usePermissions } from '../hooks/usePermissions';

const PermissionWrapper = ({ 
  children, 
  permission,
  module,
  fallback = null,
  role,
  cargo,
  hideOnNoPermission = true 
}) => {
  const { 
    hasPermission, 
    canAccessModule, 
    getRole, 
    getCargo 
  } = usePermissions();

  // Verificar permiso específico
  if (permission && !hasPermission(permission)) {
    return hideOnNoPermission ? fallback : null;
  }

  // Verificar acceso a módulo
  if (module && !canAccessModule(module)) {
    return hideOnNoPermission ? fallback : null;
  }

  // Verificar rol específico
  if (role && getRole() !== role) {
    return hideOnNoPermission ? fallback : null;
  }

  // Verificar cargo específico
  if (cargo && getCargo() !== cargo) {
    return hideOnNoPermission ? fallback : null;
  }

  return children;
};

export default PermissionWrapper;
