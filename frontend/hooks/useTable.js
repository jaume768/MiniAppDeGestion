/**
 * Hook genérico para gestión de estado de tablas
 * Maneja paginación, filtros, ordenamiento y selección
 */
import { useState, useMemo } from 'react';

export const useTable = (initialData = [], options = {}) => {
  const {
    pageSize = 10,
    searchFields = [],
    sortable = true
  } = options;

  // Estados de la tabla
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Filtrar datos basado en búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm || searchFields.length === 0) return initialData;
    
    return initialData.filter(item => 
      searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [initialData, searchTerm, searchFields]);

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a);
      const bValue = sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b);

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Paginación
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Información de paginación
  const pagination = useMemo(() => ({
    currentPage,
    totalPages: Math.ceil(sortedData.length / pageSize),
    totalItems: sortedData.length,
    pageSize,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, sortedData.length)
  }), [currentPage, sortedData.length, pageSize]);

  // Funciones de control
  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset a la primera página
  };

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, pagination.totalPages)));
  };

  // Selección de items
  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    setSelectedItems(prev => 
      prev.size === paginatedData.length 
        ? new Set() 
        : new Set(paginatedData.map(item => item.id))
    );
  };

  const clearSelection = () => setSelectedItems(new Set());

  // Reset función
  const reset = () => {
    setCurrentPage(1);
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'asc' });
    clearSelection();
  };

  return {
    // Datos procesados
    data: paginatedData,
    filteredData,
    sortedData,
    
    // Estados
    searchTerm,
    sortConfig,
    selectedItems,
    pagination,
    
    // Funciones de control
    handleSort,
    handleSearch,
    handlePageChange,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    reset,
    
    // Utilidades
    isSelected: (id) => selectedItems.has(id),
    hasSelection: selectedItems.size > 0,
    selectedCount: selectedItems.size,
    selectedItemsArray: Array.from(selectedItems)
  };
};
