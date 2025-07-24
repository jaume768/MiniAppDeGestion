import { useState, useEffect } from 'react';
import Head from 'next/head';
import { empleadosService, departamentosService } from '../services/api';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { useModal } from '../hooks/useModal';
import SimpleDataTable from '../components/ui/SimpleDataTable';
import SimpleModal from '../components/ui/SimpleModal';
import PermissionWrapper from '../components/PermissionWrapper';
import styles from '../styles/Empleados.module.css';

export default function RRHHPage() {
  const { hasPermission } = usePermissions();
  // Estado para controlar si el componente está montado (evita errores de hidratación)
  const [isMounted, setIsMounted] = useState(false);
  
  // Modal para empleados
  const modal = useModal();
  
  // APIs para empleados y departamentos
  const empleadosApi = useApi(empleadosService, true);
  const departamentosApi = useApi(departamentosService, true);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Efecto para marcar el componente como montado
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Los datos se cargan automáticamente con autoLoad=true en useApi
  // useEffect(() => {
  //   empleadosApi.loadData();
  //   departamentosApi.loadData();
  // }, []);

  // Configuración de campos para el formulario de empleados
  const empleadoFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre del empleado'
    },
    {
      name: 'apellidos',
      label: 'Apellidos',
      type: 'text',
      required: true,
      placeholder: 'Apellidos del empleado'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'email@ejemplo.com'
    },
    {
      name: 'username',
      label: 'Usuario',
      type: 'text',
      required: true,
      placeholder: 'nombre.usuario'
    },
    {
      name: 'puesto',
      label: 'Puesto',
      type: 'text',
      placeholder: 'Cargo o puesto de trabajo'
    },
    {
      name: 'departamento',
      label: 'Departamento',
      type: 'select',
      options: departamentosApi.data?.map(dept => ({
        value: dept.id,
        label: dept.nombre
      })) || []
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'tel',
      placeholder: '123 456 789'
    },
    {
      name: 'activo',
      label: 'Activo',
      type: 'checkbox',
      defaultValue: true
    }
  ];

  // Filtrar empleados por búsqueda
  const filteredEmpleados = empleadosApi.data?.filter(empleado =>
    empleado.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.departamento_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Paginación
  const totalPages = Math.ceil(filteredEmpleados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmpleados = filteredEmpleados.slice(startIndex, startIndex + itemsPerPage);

  // Configuración de columnas para la tabla
  const columns = [
    {
      key: 'nombre',
      header: 'Nombre Completo',
      render: (empleado) => (
        <div>
          <div className="font-medium">{empleado.nombre} {empleado.apellidos}</div>
          <div className="text-sm text-gray-500">{empleado.email}</div>
        </div>
      )
    },
    {
      key: 'username',
      header: 'Usuario',
      render: (empleado) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {empleado.username}
        </span>
      )
    },
    {
      key: 'puesto',
      header: 'Puesto',
      render: (empleado) => empleado.puesto || 'Sin asignar'
    },
    {
      key: 'departamento_nombre',
      header: 'Departamento',
      render: (empleado) => empleado.departamento_nombre ? (
        <span className={styles.departamentoBadge}>
          🏢 {empleado.departamento_nombre}
        </span>
      ) : (
        <span className="text-gray-400">Sin asignar</span>
      )
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (empleado) => empleado.telefono || 'No disponible'
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (empleado) => empleado.activo ? (
        <span className={styles.estadoActivo}>
          ✅ Activo
        </span>
      ) : (
        <span className={styles.estadoInactivo}>
          ❌ Inactivo
        </span>
      )
    }
  ];

  // Manejadores de eventos
  const handleView = (empleado) => {
    modal.openView(empleado);
  };

  const handleEdit = (empleado) => {
    modal.openEdit(empleado);
  };

  const handleDelete = async (empleado) => {
    if (window.confirm(`¿Está seguro de que desea eliminar al empleado ${empleado.nombre} ${empleado.apellidos}?`)) {
      try {
        await empleadosService.delete(empleado.id);
        empleadosApi.loadData();
      } catch (error) {
        console.error('Error al eliminar empleado:', error);
        alert('Error al eliminar el empleado');
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (modal.mode === 'create') {
        await empleadosService.create(formData);
      } else if (modal.mode === 'edit') {
        await empleadosService.update(modal.data.id, formData);
      }
      modal.closeModal();
      empleadosApi.loadData();
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      throw error;
    }
  };

  // Permisos
  const canCreate = hasPermission('can_create_data');
  const canEdit = hasPermission('can_edit_data');
  const canView = hasPermission('can_view_data');
  const canDelete = hasPermission('can_delete_data');

  if (empleadosApi.loading) {
    return (
      <div className={styles.empleadosContainer}>
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <div style={{ marginLeft: '1rem' }}>Cargando empleados...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Recursos Humanos - MiniGestión</title>
        <meta name="description" content="Gestión de empleados y recursos humanos" />
      </Head>
        <div className={styles.empleadosContainer}>
          <div className={styles.pageContainer}>
            {/* Header de la página */}
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>👔 Recursos Humanos</h1>
              <p className={styles.pageSubtitle}>
                Gestión integral de empleados, departamentos y estructura organizacional
              </p>
              <div className={styles.pageStats}>
                <div className={styles.statItem}>
                  <span>👥</span>
                  <span>{empleadosApi.data?.length || 0} empleados</span>
                </div>
                <div className={styles.statItem}>
                  <span>✅</span>
                  <span>{empleadosApi.data?.filter(e => e.activo).length || 0} activos</span>
                </div>
                <div className={styles.statItem}>
                  <span>🏢</span>
                  <span>{departamentosApi.data?.length || 0} departamentos</span>
                </div>
              </div>
            </div>

            {/* Panel de controles */}
            <div className={styles.controlsPanel}>
              <div className={styles.controlsRow}>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Buscar empleados por nombre, email, puesto o departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                
                {isMounted && (
                  <PermissionWrapper permission="can_create_data">
                    <button
                      onClick={modal.openCreate}
                      className={styles.btnPrimary}
                    >
                      <span>➕</span>
                      <span>Nuevo Empleado</span>
                    </button>
                  </PermissionWrapper>
                )}
              </div>
            </div>

            {/* Tabla de empleados */}
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2 className={styles.tableTitle}>
                  Lista de Empleados ({filteredEmpleados.length})
                </h2>
              </div>
              
              <div className={styles.tableContent}>
                {filteredEmpleados.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>👔</div>
                    <h3 className={styles.emptyStateTitle}>
                      {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                    </h3>
                    <p className={styles.emptyStateText}>
                      {searchTerm 
                        ? 'Intenta con otros términos de búsqueda'
                        : 'Comienza agregando tu primer empleado'
                      }
                    </p>
                    {!searchTerm && isMounted && (
                      <PermissionWrapper permission="can_create_data">
                        <button
                          onClick={modal.openCreate}
                          className={styles.btnPrimary}
                        >
                          <span>➕</span>
                          <span>Agregar Empleado</span>
                        </button>
                      </PermissionWrapper>
                    )}
                  </div>
                ) : (
                  <>
                    <SimpleDataTable
                      data={paginatedEmpleados}
                      columns={columns}
                      actions={{
                        canView: canView,
                        canEdit: canEdit,
                        canDelete: canDelete,
                        onView: handleView,
                        onEdit: handleEdit,
                        onDelete: handleDelete
                      }}
                    />
                    
                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className={styles.paginationContainer}>
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={styles.paginationButton}
                        >
                          ← Anterior
                        </button>
                        
                        <span className={styles.paginationInfo}>
                          Página {currentPage} de {totalPages} 
                          ({filteredEmpleados.length} empleados)
                        </span>
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={styles.paginationButton}
                        >
                          Siguiente →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal para crear/editar/ver empleados */}
        <SimpleModal
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          title={
            modal.mode === 'create' 
              ? 'Nuevo Empleado'
              : modal.mode === 'edit' 
                ? 'Editar Empleado' 
                : 'Ver Empleado'
          }
          mode={modal.mode}
          data={modal.data}
          fields={empleadoFields}
          onSubmit={handleSubmit}
        />
    </>
  );
}
