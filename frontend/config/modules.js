/**
 * Configuración de módulos del sistema
 * Esta configuración define todos los módulos disponibles con sus metadatos
 */

export const MODULES = {
  // Módulos Operacionales
  ventas: {
    name: 'Ventas',
    description: 'Gestión de ventas y documentos',
    icon: '💰',
    color: 'bg-green-500',
    path: '/ventas',
    category: 'operational',
    submodules: ['presupuestos', 'pedidos', 'albaranes', 'facturas', 'tickets']
  },
  compras: {
    name: 'Compras',
    description: 'Gestión de compras y proveedores',
    icon: '🛒',
    color: 'bg-purple-500',
    path: '/compras',
    category: 'operational'
  },
  inventario: {
    name: 'Inventario',
    description: 'Gestión integral de stock, almacenes y movimientos',
    icon: '📦',
    color: 'bg-green-600',
    path: '/inventario',
    category: 'operational',
    submodules: ['almacenes', 'stock', 'movimientos', 'transferencias']
  },
  articulos: {
    name: 'Artículos',
    description: 'Catálogo de productos y servicios',
    icon: '📋',
    color: 'bg-indigo-500',
    path: '/articulos',
    category: 'operational'
  },
  contactos: {
    name: 'Contactos',
    description: 'Clientes, proveedores y contactos',
    icon: '👥',
    color: 'bg-pink-500',
    path: '/contactos',
    category: 'operational'
  },
  rrhh: {
    name: 'Recursos Humanos',
    description: 'Gestión de empleados y nóminas',
    icon: '👔',
    color: 'bg-teal-500',
    path: '/rrhh',
    category: 'operational'
  },
  proyectos: {
    name: 'Proyectos',
    description: 'Gestión de proyectos y tareas',
    icon: '📁',
    color: 'bg-cyan-500',
    path: '/proyectos',
    category: 'operational'
  },
  tpv: {
    name: 'TPV',
    description: 'Terminal punto de venta',
    icon: '💳',
    color: 'bg-red-500',
    path: '/tpv',
    category: 'operational'
  },
  reportes: {
    name: 'Reportes',
    description: 'Informes y estadísticas',
    icon: '📈',
    color: 'bg-yellow-500',
    path: '/reportes',
    category: 'operational'
  },

  // Módulos Administrativos
  usuarios: {
    name: 'Usuarios',
    description: 'Gestión de usuarios del sistema',
    icon: '👤',
    color: 'bg-gray-600',
    path: '/usuarios',
    category: 'administrative',
    adminOnly: true
  },
  configuracion: {
    name: 'Configuración',
    description: 'Configuración del sistema',
    icon: '⚙️',
    color: 'bg-slate-600',
    path: '/configuracion',
    category: 'administrative',
    adminOnly: true
  }
};

/**
 * Obtiene los módulos accesibles para el usuario
 * @param {Array} accessibleModules - Lista de módulos accesibles desde el JWT
 * @returns {Array} Array de módulos con sus datos
 */
export function getAccessibleModules(accessibleModules = []) {
  if (!Array.isArray(accessibleModules)) {
    return [];
  }

  // Si tiene acceso a 'all', retornar todos los módulos
  if (accessibleModules.includes('all')) {
    return Object.entries(MODULES).map(([key, module]) => ({
      key,
      ...module
    }));
  }

  // Filtrar módulos según los accesibles
  return Object.entries(MODULES)
    .filter(([key]) => accessibleModules.includes(key))
    .map(([key, module]) => ({
      key,
      ...module
    }));
}

/**
 * Obtiene módulos por categoría
 * @param {Array} accessibleModules - Lista de módulos accesibles
 * @param {string} category - Categoría a filtrar ('operational' | 'administrative')
 * @returns {Array} Array de módulos filtrados por categoría
 */
export function getModulesByCategory(accessibleModules = [], category = 'operational') {
  const modules = getAccessibleModules(accessibleModules);
  return modules.filter(module => module.category === category);
}

/**
 * Verifica si un usuario puede acceder a un módulo específico
 * @param {Array} accessibleModules - Lista de módulos accesibles desde el JWT
 * @param {string} moduleKey - Clave del módulo a verificar
 * @returns {boolean} True si puede acceder
 */
export function canAccessModule(accessibleModules = [], moduleKey) {
  if (!Array.isArray(accessibleModules)) {
    return false;
  }

  return accessibleModules.includes('all') || accessibleModules.includes(moduleKey);
}
