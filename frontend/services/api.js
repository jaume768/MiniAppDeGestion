/**
 * Servicio centralizado para llamadas API
 * Maneja autenticación, errores y configuración base
 */
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Configuración base de Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const { access } = JSON.parse(userData);
        config.headers.Authorization = `Bearer ${access}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo de respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Token expirado - redirigir a login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
    } else if (response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción');
    } else if (response?.status >= 500) {
      toast.error('Error del servidor. Intenta nuevamente.');
    } else if (response?.data?.message) {
      toast.error(response.data.message);
    } else {
      toast.error('Ha ocurrido un error inesperado');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Clase genérica para servicios CRUD
 */
export class CRUDService {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async getAll(params = {}) {
    const response = await api.get(this.endpoint, { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`${this.endpoint}${id}/`);
    return response.data;
  }

  async create(data) {
    const response = await api.post(`${this.endpoint}`, data);
    toast.success('Creado exitosamente');
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`${this.endpoint}${id}/`, data);
    toast.success('Actualizado exitosamente');
    return response.data;
  }

  async delete(id) {
    await api.delete(`${this.endpoint}${id}/`);
    toast.success('Eliminado exitosamente');
  }

  async patch(id, data) {
    const response = await api.patch(`${this.endpoint}${id}/`, data);
    return response.data;
  }
}

// Servicios específicos para cada módulo
export const contactosService = {
  getAll: () => api.get('/contactos/'),
  getClientes: () => api.get('/clientes/'),
  getProveedores: () => api.get('/proveedores/'),
  create: (data) => api.post('/contactos/', data),
  update: (id, data) => api.put(`/contactos/${id}/`, data),
  delete: (id) => api.delete(`/contactos/${id}/`),
  patch: (id, data) => api.patch(`/contactos/${id}/`, data)
};
// Servicios usando CRUDService con URLs correctas
export const clientesService = new CRUDService('/clientes/');
export const proveedoresService = new CRUDService('/proveedores/');
export const articulosService = new CRUDService('/articulos/');
export const categoriasService = new CRUDService('/categorias/');
export const marcasService = new CRUDService('/marcas/');

// Servicios de usuarios e invitaciones
export const invitacionesService = new CRUDService('/auth/invitations/');
export const empresasService = new CRUDService('/auth/empresas/');

// Servicios específicos de usuario
export const usuariosService = {
  // CRUD básico usando el registro endpoint para creación
  async getAll() {
    // No hay endpoint directo para listar usuarios, usar invitaciones activas
    const response = await api.get('/auth/invitations/');
    return response.data;
  },
  
  async create(userData) {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },
  
  // Perfil del usuario actual
  async getProfile() {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
  
  async updateProfile(profileData) {
    const response = await api.put('/auth/profile/update/', profileData);
    return response.data;
  },
  
  async changePassword(passwordData) {
    const response = await api.post('/auth/change-password/', passwordData);
    return response.data;
  }
};

// Servicio de invitaciones con acciones específicas
export const invitacionesServiceExtended = {
  ...invitacionesService,
  
  async cancel(invitationId) {
    const response = await api.post(`/auth/invitations/${invitationId}/cancel/`);
    return response.data;
  },
  
  async resend(invitationId) {
    const response = await api.post(`/auth/invitations/${invitationId}/resend/`);
    return response.data;
  }
};

export default api;
