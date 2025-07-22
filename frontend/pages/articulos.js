/**
 * Página de gestión de Artículos (Categorías, Marcas y Productos)
 * Incluye CRUD completo con control de permisos
 */
import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useModal } from '../hooks/useModal';
import { categoriasService, marcasService, articulosService } from '../services/api';
import SimpleDataTable from '../components/ui/SimpleDataTable';
import SimpleModal from '../components/ui/SimpleModal';
import PermissionWrapper from '../components/PermissionWrapper';
import { Toaster } from 'react-hot-toast';
import styles from '../styles/Articulos.module.css';

const ArticulosPage = () => {
  const [activeTab, setActiveTab] = useState('articulos');
  
  // APIs
  const articulosApi = useApi(articulosService, true);
  const categoriasApi = useApi(categoriasService, true);
  const marcasApi = useApi(marcasService, true);
  
  // Modales
  const articuloModal = useModal();
  const categoriaModal = useModal();
  const marcaModal = useModal();

  // Opciones para selects (categorías y marcas activas)
  const categoriaOptions = (categoriasApi.data || [])
    .filter(c => c.activa !== false)
    .map(c => ({ value: c.id, label: c.nombre }));
    
  const marcaOptions = (marcasApi.data || [])
    .filter(m => m.activa !== false)
    .map(m => ({ value: m.id, label: m.nombre }));

  // Configuración de campos para ARTÍCULOS
  const articuloFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre del artículo'
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      rows: 3,
      placeholder: 'Descripción detallada del artículo'
    },
    {
      name: 'categoria',
      label: 'Categoría',
      type: 'select',
      options: categoriaOptions,
      placeholder: 'Selecciona una categoría'
    },
    {
      name: 'marca',
      label: 'Marca',
      type: 'select',
      options: marcaOptions,
      placeholder: 'Selecciona una marca'
    },
    {
      name: 'modelo',
      label: 'Modelo',
      type: 'text',
      placeholder: 'Modelo del artículo'
    },
    {
      name: 'precio',
      label: 'Precio (€)',
      type: 'number',
      required: true,
      step: '0.01',
      min: '0',
      placeholder: '0.00'
    },
    {
      name: 'stock',
      label: 'Stock',
      type: 'number',
      min: '0',
      defaultValue: 0,
      placeholder: '0'
    },
    {
      name: 'iva',
      label: 'IVA (%)',
      type: 'number',
      step: '0.01',
      min: '0',
      max: '100',
      defaultValue: 21.00,
      placeholder: '21.00'
    },
    {
      name: 'activo',
      label: 'Activo',
      type: 'checkbox',
      defaultValue: true
    }
  ];

  // Configuración de campos para CATEGORÍAS
  const categoriaFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre de la categoría'
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      rows: 3,
      placeholder: 'Descripción de la categoría'
    },
    {
      name: 'activa',
      label: 'Activa',
      type: 'checkbox',
      defaultValue: true
    }
  ];

  // Configuración de campos para MARCAS
  const marcaFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre de la marca'
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      rows: 2,
      placeholder: 'Descripción de la marca'
    },
    {
      name: 'pais_origen',
      label: 'País de Origen',
      type: 'text',
      placeholder: 'País de origen de la marca'
    },
    {
      name: 'activa',
      label: 'Activa',
      type: 'checkbox',
      defaultValue: true
    }
  ];

  // Configuración de columnas para ARTÍCULOS
  const articuloColumns = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'categoria_nombre', label: 'Categoría', sortable: true },
    { key: 'marca_nombre', label: 'Marca', sortable: true },
    { 
      key: 'precio', 
      label: 'Precio',
      render: (item) => `${parseFloat(item.precio).toFixed(2)}€`
    },
    { key: 'stock', label: 'Stock', sortable: true },
    { 
      key: 'activo', 
      label: 'Estado',
      render: (item) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: '9999px',
          fontSize: '12px',
          backgroundColor: item.activo ? '#dcfce7' : '#fee2e2',
          color: item.activo ? '#166534' : '#dc2626'
        }}>
          {item.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  // Configuración de columnas para CATEGORÍAS
  const categoriaColumns = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'descripcion', label: 'Descripción' },
    { 
      key: 'articulos_count', 
      label: 'Artículos',
      render: (item) => (
        <span style={{
          padding: '4px 8px',
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          borderRadius: '9999px',
          fontSize: '12px'
        }}>
          {item.articulos_count} artículos
        </span>
      )
    },
    { 
      key: 'activa', 
      label: 'Estado',
      render: (item) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: '9999px',
          fontSize: '12px',
          backgroundColor: item.activa ? '#dcfce7' : '#fee2e2',
          color: item.activa ? '#166534' : '#dc2626'
        }}>
          {item.activa ? 'Activa' : 'Inactiva'}
        </span>
      )
    }
  ];

  // Configuración de columnas para MARCAS
  const marcaColumns = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'pais_origen', label: 'País', sortable: true },
    { 
      key: 'articulos_count', 
      label: 'Artículos',
      render: (item) => (
        <span style={{
          padding: '4px 8px',
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          borderRadius: '9999px',
          fontSize: '12px'
        }}>
          {item.articulos_count} artículos
        </span>
      )
    },
    { 
      key: 'activa', 
      label: 'Estado',
      render: (item) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: '9999px',
          fontSize: '12px',
          backgroundColor: item.activa ? '#dcfce7' : '#fee2e2',
          color: item.activa ? '#166534' : '#dc2626'
        }}>
          {item.activa ? 'Activa' : 'Inactiva'}
        </span>
      )
    }
  ];

  // Configuraciones dinámicas por tab
  const getTabConfig = () => {
    switch (activeTab) {
      case 'articulos':
        return {
          api: articulosApi,
          modal: articuloModal,
          fields: articuloFields,
          columns: articuloColumns,
          title: 'Artículos',
          singular: 'Artículo'
        };
      case 'categorias':
        return {
          api: categoriasApi,
          modal: categoriaModal,
          fields: categoriaFields,
          columns: categoriaColumns,
          title: 'Categorías',
          singular: 'Categoría'
        };
      case 'marcas':
        return {
          api: marcasApi,
          modal: marcaModal,
          fields: marcaFields,
          columns: marcaColumns,
          title: 'Marcas',
          singular: 'Marca'
        };
      default:
        return null;
    }
  };

  const config = getTabConfig();

  return (
    <div className={styles.articulosContainer}>
      <Toaster position="top-right" />
      
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            Gestión de Artículos
          </h1>
          <p className={styles.pageDescription}>
            Administra categorías, marcas y artículos de tu empresa
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabNavigation}>
          <button
            onClick={() => setActiveTab('articulos')}
            className={`${styles.tabButton} ${activeTab === 'articulos' ? styles.active : ''}`}
          >
            📦 Artículos ({articulosApi.data?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('categorias')}
            className={`${styles.tabButton} ${activeTab === 'categorias' ? styles.active : ''}`}
          >
            🏷️ Categorías ({categoriasApi.data?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('marcas')}
            className={`${styles.tabButton} ${activeTab === 'marcas' ? styles.active : ''}`}
          >
            🏢 Marcas ({marcasApi.data?.length || 0})
          </button>
        </div>

        {/* Contenido principal */}
        <div className={styles.contentContainer}>
          {/* Barra de herramientas */}
          <div className={styles.toolbar}>

            <PermissionWrapper requiredPermission="can_create_data">
              <button
                onClick={() => config?.modal.openCreate()}
                className={styles.addButton}
              >
                ✨ Nuevo {config?.singular}
              </button>
            </PermissionWrapper>
          </div>

          {/* Data Table */}
          <div className={styles.dataTable}>
            <SimpleDataTable
              data={config?.api.data || []}
              columns={config?.columns || []}
              loading={config?.api.loading}
              onEdit={(item) => config?.modal.openEdit(item)}
              onView={(item) => config?.modal.openView(item)}
              onDelete={(item) => config?.api.remove(item.id)}
              canEdit={true}
              canView={true}
              canDelete={true}
              searchPlaceholder={`Buscar ${config?.title.toLowerCase()}...`}
            />
          </div>
        </div>

        {/* Modal Form */}
        <SimpleModal
          isOpen={config?.modal.isOpen}
          mode={config?.modal.mode}
          title={{
            create: `Nuevo ${config?.singular}`,
            edit: `Editar ${config?.singular}`,
            view: `Ver ${config?.singular}`
          }}
          fields={config?.fields || []}
          data={config?.modal.data}
          onClose={config?.modal.closeModal}
          onSubmit={async (data) => {
            if (config?.modal.mode === 'create') {
              await config.api.create(data);
            } else {
              await config.api.update(config.modal.data.id, data);
            }
            config.modal.closeModal();
          }}
          loading={config?.api.loading}
        />
      </div>
    </div>
  );
};

export default ArticulosPage;
