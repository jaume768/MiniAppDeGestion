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
};

// Proyectos
export const proyectosAPI = {
  getAll: () => fetchAPI('/proyectos/'),
  getById: (id) => fetchAPI(`/proyectos/${id}/`),
  create: (data) => fetchAPI('/proyectos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/proyectos/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/proyectos/${id}/`, { method: 'DELETE' }),
};

// Reportes
export const reportesAPI = {
  getSummary: () => fetchAPI('/reportes/'),
};

export default {
  clientes: clientesAPI,
  empleados: empleadosAPI,
  proyectos: proyectosAPI,
  reportes: reportesAPI,
};
