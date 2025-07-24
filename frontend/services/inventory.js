import { useState, useEffect } from 'react';
import { api } from './api';

// ===== HOOKS PARA ALMACENES =====

export const useAlmacenes = () => {
  const [almacenes, setAlmacenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlmacenes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/almacenes/');
      setAlmacenes(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching almacenes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlmacenes();
  }, []);

  const createAlmacen = async (almacenData) => {
    try {
      const response = await api.post('/inventory/almacenes/', almacenData);
      await fetchAlmacenes(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error creating almacen:', err);
      throw err;
    }
  };

  const updateAlmacen = async (id, almacenData) => {
    try {
      const response = await api.put(`/inventory/almacenes/${id}/`, almacenData);
      await fetchAlmacenes(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error updating almacen:', err);
      throw err;
    }
  };

  const deleteAlmacen = async (id) => {
    try {
      await api.delete(`/inventory/almacenes/${id}/`);
      await fetchAlmacenes(); // Recargar lista
    } catch (err) {
      console.error('Error deleting almacen:', err);
      throw err;
    }
  };

  return {
    almacenes,
    loading,
    error,
    createAlmacen,
    updateAlmacen,
    deleteAlmacen,
    refresh: fetchAlmacenes
  };
};

// ===== HOOKS PARA STOCK =====

export const useStock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStock = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/stock/');
      setStock(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const createStock = async (stockData) => {
    try {
      const response = await api.post('/inventory/stock/', stockData);
      await fetchStock(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error creating stock:', err);
      throw err;
    }
  };

  const updateStock = async (id, stockData) => {
    try {
      const response = await api.put(`/inventory/stock/${id}/`, stockData);
      await fetchStock(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error updating stock:', err);
      throw err;
    }
  };

  const deleteStock = async (id) => {
    try {
      await api.delete(`/inventory/stock/${id}/`);
      await fetchStock(); // Recargar lista
    } catch (err) {
      console.error('Error deleting stock:', err);
      throw err;
    }
  };

  // Resumen de stock
  const fetchStockResumen = async () => {
    try {
      const response = await api.get('/inventory/stock/resumen/');
      return response.data;
    } catch (err) {
      console.error('Error fetching stock resumen:', err);
      throw err;
    }
  };

  // Alertas de stock bajo
  const fetchStockAlertas = async () => {
    try {
      const response = await api.get('/inventory/stock/alertas/');
      return response.data;
    } catch (err) {
      console.error('Error fetching stock alertas:', err);
      throw err;
    }
  };

  return {
    stock,
    loading,
    error,
    createStock,
    updateStock,
    deleteStock,
    fetchStockResumen,
    fetchStockAlertas,
    refresh: fetchStock
  };
};

// ===== HOOKS PARA MOVIMIENTOS =====

export const useMovimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/movimientos/');
      setMovimientos(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching movimientos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const createMovimiento = async (movimientoData) => {
    try {
      const response = await api.post('/inventory/movimientos/crear_movimiento/', movimientoData);
      await fetchMovimientos(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error creating movimiento:', err);
      throw err;
    }
  };

  const updateMovimiento = async (id, movimientoData) => {
    try {
      const response = await api.put(`/inventory/movimientos/${id}/`, movimientoData);
      await fetchMovimientos(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error updating movimiento:', err);
      throw err;
    }
  };

  const deleteMovimiento = async (id) => {
    try {
      await api.delete(`/inventory/movimientos/${id}/`);
      await fetchMovimientos(); // Recargar lista
    } catch (err) {
      console.error('Error deleting movimiento:', err);
      throw err;
    }
  };

  // Estadísticas de movimientos
  const fetchMovimientosEstadisticas = async () => {
    try {
      const response = await api.get('/inventory/movimientos/estadisticas/');
      return response.data;
    } catch (err) {
      console.error('Error fetching movimientos estadisticas:', err);
      throw err;
    }
  };

  return {
    movimientos,
    loading,
    error,
    createMovimiento,
    updateMovimiento,
    deleteMovimiento,
    fetchMovimientosEstadisticas,
    refresh: fetchMovimientos
  };
};

// ===== HOOKS PARA TRANSFERENCIAS =====

export const useTransferencias = () => {
  const [transferencias, setTransferencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransferencias = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/transferencias/');
      setTransferencias(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching transferencias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransferencias();
  }, []);

  const createTransferencia = async (transferenciaData) => {
    try {
      const response = await api.post('/inventory/transferencias/', transferenciaData);
      await fetchTransferencias(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error creating transferencia:', err);
      throw err;
    }
  };

  const updateTransferencia = async (id, transferenciaData) => {
    try {
      const response = await api.put(`/inventory/transferencias/${id}/`, transferenciaData);
      await fetchTransferencias(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error updating transferencia:', err);
      throw err;
    }
  };

  const deleteTransferencia = async (id) => {
    try {
      await api.delete(`/inventory/transferencias/${id}/`);
      await fetchTransferencias(); // Recargar lista
    } catch (err) {
      console.error('Error deleting transferencia:', err);
      throw err;
    }
  };

  // Acciones específicas de transferencias
  const agregarItem = async (transferenciaId, itemData) => {
    try {
      const response = await api.post(`/inventory/transferencias/${transferenciaId}/agregar_item/`, itemData);
      await fetchTransferencias(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error agregando item a transferencia:', err);
      throw err;
    }
  };

  const enviarTransferencia = async (transferenciaId) => {
    try {
      const response = await api.post(`/inventory/transferencias/${transferenciaId}/enviar/`);
      await fetchTransferencias(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error enviando transferencia:', err);
      throw err;
    }
  };

  const recibirTransferencia = async (transferenciaId, itemsRecibidos = null) => {
    try {
      const data = itemsRecibidos ? { items_recibidos: itemsRecibidos } : {};
      const response = await api.post(`/inventory/transferencias/${transferenciaId}/recibir/`, data);
      await fetchTransferencias(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error recibiendo transferencia:', err);
      throw err;
    }
  };

  const cancelarTransferencia = async (transferenciaId) => {
    try {
      const response = await api.post(`/inventory/transferencias/${transferenciaId}/cancelar/`);
      await fetchTransferencias(); // Recargar lista
      return response.data;
    } catch (err) {
      console.error('Error cancelando transferencia:', err);
      throw err;
    }
  };

  return {
    transferencias,
    loading,
    error,
    createTransferencia,
    updateTransferencia,
    deleteTransferencia,
    agregarItem,
    enviarTransferencia,
    recibirTransferencia,
    cancelarTransferencia,
    refresh: fetchTransferencias
  };
};

// ===== UTILIDADES =====

// Obtener listado de artículos (desde products)
export const useArticulos = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticulos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/products/articulos/');
      setArticulos(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching articulos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticulos();
  }, []);

  return {
    articulos,
    loading,
    error,
    refresh: fetchArticulos
  };
};

// ===== FUNCIONES AUXILIARES =====

// Formatear tipo de movimiento para mostrar
export const formatTipoMovimiento = (tipo) => {
  const tipos = {
    'entrada': { text: 'Entrada', color: 'green' },
    'salida': { text: 'Salida', color: 'red' },
    'ajuste_positivo': { text: 'Ajuste +', color: 'blue' },
    'ajuste_negativo': { text: 'Ajuste -', color: 'orange' },
    'transferencia_entrada': { text: 'Transfer. IN', color: 'purple' },
    'transferencia_salida': { text: 'Transfer. OUT', color: 'gray' },
    'devolucion': { text: 'Devolución', color: 'blue' },
    'correccion': { text: 'Corrección', color: 'orange' }
  };
  
  return tipos[tipo] || { text: tipo, color: 'gray' };
};

// Formatear estado de transferencia
export const formatEstadoTransferencia = (estado) => {
  const estados = {
    'pendiente': { text: 'Pendiente', color: 'warning' },
    'en_transito': { text: 'En Tránsito', color: 'primary' },
    'completada': { text: 'Completada', color: 'success' },
    'cancelada': { text: 'Cancelada', color: 'danger' }
  };
  
  return estados[estado] || { text: estado, color: 'warning' };
};

// Determinar color del badge de stock
export const getStockBadgeColor = (stockActual, stockMinimo = 10) => {
  if (stockActual <= 0) return 'stockBajo';
  if (stockActual <= stockMinimo) return 'stockBajo';
  if (stockActual > stockMinimo * 3) return 'stockAlto';
  return 'stockNormal';
};

// Formatear cantidad con signo
export const formatCantidad = (cantidad, tipo) => {
  const num = Number(cantidad);
  if (tipo && (tipo.includes('entrada') || tipo === 'ajuste_positivo' || tipo === 'devolucion')) {
    return `+${Math.abs(num)}`;
  }
  if (tipo && (tipo.includes('salida') || tipo === 'ajuste_negativo')) {
    return `-${Math.abs(num)}`;
  }
  return num.toString();
};

// Validaciones de formulario
export const validateAlmacenForm = (data) => {
  const errors = {};
  
  if (!data.nombre?.trim()) {
    errors.nombre = 'El nombre es requerido';
  }
  
  if (!data.tipo) {
    errors.tipo = 'El tipo es requerido';
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateStockForm = (data) => {
  const errors = {};
  
  if (!data.articulo) {
    errors.articulo = 'El artículo es requerido';
  }
  
  if (!data.almacen) {
    errors.almacen = 'El almacén es requerido';
  }
  
  if (data.stock_actual === undefined || data.stock_actual === null || data.stock_actual < 0) {
    errors.stock_actual = 'El stock actual debe ser mayor o igual a 0';
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateMovimientoForm = (data) => {
  const errors = {};
  
  if (!data.articulo) {
    errors.articulo = 'El artículo es requerido';
  }
  
  if (!data.almacen) {
    errors.almacen = 'El almacén es requerido';
  }
  
  if (!data.tipo) {
    errors.tipo = 'El tipo de movimiento es requerido';
  }
  
  if (!data.cantidad || data.cantidad <= 0) {
    errors.cantidad = 'La cantidad debe ser mayor a 0';
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateTransferenciaForm = (data) => {
  const errors = {};
  
  if (!data.numero?.trim()) {
    errors.numero = 'El número es requerido';
  }
  
  if (!data.almacen_origen) {
    errors.almacen_origen = 'El almacén origen es requerido';
  }
  
  if (!data.almacen_destino) {
    errors.almacen_destino = 'El almacén destino es requerido';
  }
  
  if (data.almacen_origen === data.almacen_destino) {
    errors.almacen_destino = 'El almacén destino debe ser diferente al origen';
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};
