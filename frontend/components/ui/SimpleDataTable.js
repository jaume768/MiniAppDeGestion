/**
 * Tabla de datos simple con CSS Modules - SIN TAILWIND
 */
import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ConfirmDialog from './ConfirmDialog';
import PermissionWrapper from '../PermissionWrapper';
import styles from './SimpleDataTable.module.css';

const SimpleDataTable = ({
  data = [],
  columns = [],
  loading = false,
  searchPlaceholder = "Buscar...",
  
  // Configuración de acciones
  onAdd,
  onEdit,
  onDelete,
  onView,
  
  // Configuración de permisos
  canAdd = true,
  canEdit = true,
  canDelete = true,
  canView = true,
  
  // Configuración de tabla
  searchFields = [],
  pageSize = 10,
  showSearch = true,
  showActions = true,
  emptyMessage = "No se encontraron datos",
  
  // Props adicionales
  title,
  subtitle,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filtrar datos por búsqueda
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    
    const searchableFields = searchFields.length > 0 ? searchFields : columns.map(col => col.key);
    
    return searchableFields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Ordenar datos
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedData.length);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Manejadores
  const handleSort = (columnKey) => {
    setSortConfig(prevConfig => ({
      key: columnKey,
      direction: prevConfig.key === columnKey && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDeleteConfirm = (item) => {
    setDeleteConfirm(item);
  };

  const handleDeleteExecute = async () => {
    if (deleteConfirm && onDelete) {
      await onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  // Función para renderizar valor de celda
  const renderCellValue = (item, column) => {
    if (column.render) {
      return column.render(item);
    }
    
    let value = item[column.key];
    
    // Manejar valores nulos/undefined
    if (value === null || value === undefined) {
      return '-';
    }
    
    // Manejar objetos (CRÍTICO: evitar renderizar objetos directamente)
    if (typeof value === 'object' && value !== null) {
      // Si el objeto tiene una propiedad 'nombre', mostrarla
      if (value.nombre) {
        return String(value.nombre);
      }
      // Si tiene 'name', mostrarla
      if (value.name) {
        return String(value.name);
      }
      // Si tiene 'titulo', mostrarla
      if (value.titulo) {
        return String(value.titulo);
      }
      // Para arrays, mostrar la cantidad de elementos
      if (Array.isArray(value)) {
        return `${value.length} elemento(s)`;
      }
      // Para otros objetos, intentar JSON.stringify o mostrar tipo
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[Objeto complejo]';
      }
    }
    
    // Formatear fechas
    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    
    // Formatear números
    if (column.type === 'number' && typeof value === 'number') {
      return value.toLocaleString();
    }
    
    // Formatear moneda
    if (column.type === 'currency' && typeof value === 'number') {
      return `€${value.toFixed(2)}`;
    }
    
    // Formatear booleans
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    // Para valores primitivos, convertir a string de forma segura
    return String(value);
  };

  // Generar páginas para paginación
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        
        <div className={styles.actions}>
          {showSearch && (
            <div className={styles.searchContainer}>
              <div className={styles.searchIcon}>🔍</div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          )}
          
          {canAdd && onAdd && (
            <PermissionWrapper permission="write">
              <button
                onClick={onAdd}
                className={styles.addButton}
              >
                <span className={styles.addIcon}>+</span>
                Nuevo
              </button>
            </PermissionWrapper>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {sortedData.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>{emptyMessage}</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`${styles.tableHeader} ${
                          column.sortable !== false ? styles.sortable : ''
                        }`}
                        onClick={() => column.sortable !== false && handleSort(column.key)}
                      >
                        <div className={styles.headerContent}>
                          <span>{column.label}</span>
                          {column.sortable !== false && sortConfig.key === column.key && (
                            <span className={styles.sortIcon}>
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    {showActions && (canEdit || canDelete || canView) && (
                      <th className={styles.tableHeader}>
                        <span className={styles.visuallyHidden}>Acciones</span>
                      </th>
                    )}
                  </tr>
                </thead>
                
                <tbody className={styles.tableBody}>
                  {paginatedData.map((item) => (
                    <tr key={item.id} className={styles.tableRow}>
                      {columns.map((column) => (
                        <td key={column.key} className={styles.tableCell}>
                          {renderCellValue(item, column)}
                        </td>
                      ))}
                      
                      {showActions && (canEdit || canDelete || canView) && (
                        <td className={styles.actionsCell}>
                          <div className={styles.actionButtons}>
                            {canView && onView && (
                              <button
                                onClick={() => onView(item)}
                                className={`${styles.actionButton} ${styles.viewButton}`}
                                title="Ver"
                              >
                                👁
                              </button>
                            )}
                            
                            {canEdit && onEdit && (
                              <PermissionWrapper permission="write">
                                <button
                                  onClick={() => onEdit(item)}
                                  className={`${styles.actionButton} ${styles.editButton}`}
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                              </PermissionWrapper>
                            )}
                            
                            {canDelete && onDelete && (
                              <PermissionWrapper permission="write">
                                <button
                                  onClick={() => handleDeleteConfirm(item)}
                                  className={`${styles.actionButton} ${styles.deleteButton}`}
                                  title="Eliminar"
                                >
                                  🗑️
                                </button>
                              </PermissionWrapper>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  <p className={styles.paginationText}>
                    Mostrando <span className={styles.bold}>{startIndex + 1}</span> a{' '}
                    <span className={styles.bold}>{endIndex}</span> de{' '}
                    <span className={styles.bold}>{sortedData.length}</span> resultados
                  </p>
                </div>
                
                <div className={styles.paginationControls}>
                  {/* Botón anterior */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                  >
                    ‹ Anterior
                  </button>
                  
                  {/* Números de página */}
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`${styles.paginationButton} ${
                        currentPage === page ? styles.active : ''
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  {/* Botón siguiente */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={styles.paginationButton}
                  >
                    Siguiente ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Eliminar elemento"
          message="¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer."
          onConfirm={handleDeleteExecute}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default SimpleDataTable;
