/**
 * Servicio para comunicarse con la API del backend
 */

// URL base de la API, tomada de las variables de entorno o valor por defecto
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Realiza peticiones a la API con la configuración adecuada
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Configuración por defecto
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Combinar opciones por defecto con las proporcionadas
  const fetchOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    // Manejar códigos de error HTTP
    if (!response.ok) {
      throw new Error(`Error API: ${response.status} ${response.statusText}`);
    }
    
    // Parsear respuesta JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al realizar petición a la API:', error);
    throw error;
  }
}

/**
 * Funciones específicas para cada entidad
 */

// Clientes
export const clientesAPI = {
  getAll: () => fetchAPI('/clientes/'),
  getById: (id) => fetchAPI(`/clientes/${id}/`),
  create: (data) => fetchAPI('/clientes/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/clientes/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/clientes/${id}/`, { method: 'DELETE' }),
};

// Empleados
export const empleadosAPI = {
  getAll: () => fetchAPI('/empleados/'),
  getById: (id) => fetchAPI(`/empleados/${id}/`),
  create: (data) => fetchAPI('/empleados/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/empleados/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/empleados/${id}/`, { method: 'DELETE' }),
  getProyectos: (id) => fetchAPI(`/empleados/${id}/proyectos/`),
  getPorDepartamento: (departamento) => fetchAPI(`/empleados/por-departamento/${departamento}/`),
};

// Proyectos
export const proyectosAPI = {
  getAll: () => fetchAPI('/proyectos/'),
  getById: (id) => fetchAPI(`/proyectos/${id}/`),
  create: (data) => fetchAPI('/proyectos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/proyectos/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/proyectos/${id}/`, { method: 'DELETE' }),
  getEmpleadosAsignados: (id) => fetchAPI(`/proyectos/${id}/empleados/`),
  asignarEmpleado: (proyectoId, empleadoId) => fetchAPI(`/proyectos/${proyectoId}/empleados/`, {
    method: 'POST',
    body: JSON.stringify({ empleado_id: empleadoId })
  }),
  desasignarEmpleado: (proyectoId, empleadoId) => fetchAPI(`/proyectos/${proyectoId}/empleados/${empleadoId}/`, {
    method: 'DELETE'
  }),
  getProgresoProyecto: (id) => fetchAPI(`/proyectos/${id}/progreso/`),
};

// Categorías
export const categoriasAPI = {
  getAll: () => fetchAPI('/categorias/'),
  getById: (id) => fetchAPI(`/categorias/${id}/`),
  create: (data) => fetchAPI('/categorias/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/categorias/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/categorias/${id}/`, { method: 'DELETE' }),
};

// Artículos
export const articulosAPI = {
  getAll: () => fetchAPI('/articulos/'),
  getById: (id) => fetchAPI(`/articulos/${id}/`),
  create: (data) => fetchAPI('/articulos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/articulos/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/articulos/${id}/`, { method: 'DELETE' }),
};

// Presupuestos
export const presupuestosAPI = {
  getAll: () => fetchAPI('/presupuestos/'),
  getById: (id) => fetchAPI(`/presupuestos/${id}/`),
  create: (data) => fetchAPI('/presupuestos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/presupuestos/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/presupuestos/${id}/`, { method: 'DELETE' }),
  getItems: (id) => fetchAPI(`/presupuestos/${id}/items/`),
  addItem: (id, data) => fetchAPI(`/presupuestos/${id}/items/`, { method: 'POST', body: JSON.stringify(data) }),
  removeItem: (presupuestoId, itemId) => fetchAPI(`/presupuestos/${presupuestoId}/items/${itemId}/`, { method: 'DELETE' }),
  convertirAPedido: (presupuestoId) => fetchAPI('/pedidos/crear-desde-presupuesto/', {
    method: 'POST',
    body: JSON.stringify({ presupuesto_id: presupuestoId })
  }),
  getPresupuestosPorCliente: (clienteId) => fetchAPI(`/presupuestos/por-cliente/${clienteId}/`),
  generarPDF: (id) => fetchAPI(`/presupuestos/${id}/generar-pdf/`, { method: 'GET', responseType: 'blob' }),
};

// Pedidos
export const pedidosAPI = {
  getAll: () => fetchAPI('/pedidos/'),
  getById: (id) => fetchAPI(`/pedidos/${id}/`),
  create: (data) => fetchAPI('/pedidos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/pedidos/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/pedidos/${id}/`, { method: 'DELETE' }),
  getItems: (id) => fetchAPI(`/pedidos/${id}/items/`),
  addItem: (id, data) => fetchAPI(`/pedidos/${id}/items/`, { method: 'POST', body: JSON.stringify(data) }),
  marcarEntregado: (id) => fetchAPI(`/pedidos/${id}/entregar/`, { method: 'POST' }),
};

// Facturas
export const facturasAPI = {
  getAll: () => fetchAPI('/facturas/'),
  getById: (id) => fetchAPI(`/facturas/${id}/`),
  create: (data) => fetchAPI('/facturas/', { method: 'POST', body: JSON.stringify(data) }),
  crearDesdePresupuesto: (presupuestoId) => fetchAPI('/facturas/crear-desde-presupuesto/', { 
    method: 'POST', 
    body: JSON.stringify({ presupuesto_id: presupuestoId }) 
  }),
  crearDesdePedido: (pedidoId) => fetchAPI('/facturas/crear-desde-pedido/', { 
    method: 'POST', 
    body: JSON.stringify({ pedido_id: pedidoId }) 
  }),
  update: (id, data) => fetchAPI(`/facturas/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/facturas/${id}/`, { method: 'DELETE' }),
  getItems: (id) => fetchAPI(`/facturas/${id}/items/`),
  marcarPagada: (id) => fetchAPI(`/facturas/${id}/pagar/`, { method: 'POST' }),
  getFacturasPorCliente: (clienteId) => fetchAPI(`/facturas/por-cliente/${clienteId}/`),
  generarPDF: (id) => fetchAPI(`/facturas/${id}/generar-pdf/`, { method: 'GET', responseType: 'blob' }),
};

// Reportes
export const reportesAPI = {
  getSummary: () => fetchAPI('/reportes/'),
  getNominasPorDepartamento: () => fetchAPI('/reportes/nominas/'),
  getProyectosPorEstado: () => fetchAPI('/reportes/proyectos/'),
  getVentasPorMes: (year) => fetchAPI(`/reportes/ventas/${year || ''}`),
  getClientesTop: () => fetchAPI('/reportes/clientes-top/'),
  getFacturacionPorCliente: () => fetchAPI('/reportes/facturacion-por-cliente/'),
  getProductividadEmpleados: () => fetchAPI('/reportes/productividad-empleados/'),
};

export default {
  clientes: clientesAPI,
  empleados: empleadosAPI,
  proyectos: proyectosAPI,
  reportes: reportesAPI,
  categorias: categoriasAPI,
  articulos: articulosAPI,
  presupuestos: presupuestosAPI,
  pedidos: pedidosAPI,
  facturas: facturasAPI,
};
