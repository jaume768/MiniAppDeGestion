/**
 * Hook genérico para operaciones CRUD con APIs
 */
import { useState, useEffect, useCallback } from 'react';

export const useApi = (service, autoLoad = true) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos iniciales
  const loadData = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await service.getAll(params);
      
      // Manejar paginación si existe
      if (result.results) {
        setData(result.results);
        return result; // Retornar todo el objeto con count, next, previous
      } else {
        setData(result);
        return result;
      }
    } catch (err) {
      setError(err.message || 'Error al cargar datos');
      setData([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Crear nuevo elemento
  const create = useCallback(async (newData) => {
    try {
      setLoading(true);
      const created = await service.create(newData);
      setData(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err.message || 'Error al crear');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Actualizar elemento
  const update = useCallback(async (id, updatedData) => {
    try {
      setLoading(true);
      const updated = await service.update(id, updatedData);
      setData(prev => prev.map(item => item.id === id ? updated : item));
      return updated;
    } catch (err) {
      setError(err.message || 'Error al actualizar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Eliminar elemento
  const remove = useCallback(async (id) => {
    try {
      setLoading(true);
      await service.delete(id);
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err.message || 'Error al eliminar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Obtener un elemento por ID
  const getById = useCallback(async (id) => {
    try {
      setLoading(true);
      return await service.getById(id);
    } catch (err) {
      setError(err.message || 'Error al obtener elemento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Auto-cargar datos al montar el componente
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [loadData, autoLoad]);

  return {
    data,
    loading,
    error,
    loadData,
    create,
    update,
    remove,
    getById,
    setData // Para actualizaciones manuales si es necesario
  };
};
