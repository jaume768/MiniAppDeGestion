/**
 * Tabla de datos genérica y reutilizable
 * Incluye búsqueda, ordenamiento, paginación y acciones CRUD
 */
import { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import ConfirmDialog from './ConfirmDialog';
import PermissionWrapper from '../PermissionWrapper';

const DataTable = ({
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
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filtrar datos
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return searchFields.some(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Ordenar datos
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a);
    const bValue = sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b);
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDelete = async () => {
    if (!itemToDelete || !onDelete) return;
    
    try {
      setDeleteLoading(true);
      await onDelete(itemToDelete.id);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error al eliminar:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4" />
      : <ChevronDownIcon className="w-4 h-4" />;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
              <span className="font-medium">
                {Math.min(startIndex + pageSize, sortedData.length)}
              </span>{' '}
              de <span className="font-medium">{sortedData.length}</span> resultados
            </p>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            {/* Números de página */}
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (page === currentPage || Math.abs(page - currentPage) <= 1) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              return null;
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            {showSearch && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
            
            <PermissionWrapper permission="can_create_data">
              {canAdd && onAdd && (
                <button
                  type="button"
                  onClick={onAdd}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Agregar
                </button>
              )}
            </PermissionWrapper>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSpinner size="lg" text="Cargando datos..." />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.title}</span>
                        {column.sortable && renderSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                  {showActions && (
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  )}
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.render 
                          ? column.render(item[column.key], item)
                          : item[column.key]
                        }
                      </td>
                    ))}
                    
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2 justify-end">
                          {canView && onView && (
                            <button
                              onClick={() => onView(item)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                          )}
                          
                          <PermissionWrapper permission="can_edit_data">
                            {canEdit && onEdit && (
                              <button
                                onClick={() => onEdit(item)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Editar"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                            )}
                          </PermissionWrapper>
                          
                          <PermissionWrapper permission="can_delete_data">
                            {canDelete && onDelete && (
                              <button
                                onClick={() => setItemToDelete(item)}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            )}
                          </PermissionWrapper>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {renderPagination()}
          </>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default DataTable;
