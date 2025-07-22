/**
 * Página de gestión de Contactos (Clientes y Proveedores)
 * Incluye CRUD completo con control de permisos
 */
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useModal } from '../hooks/useModal';
import { clientesService, proveedoresService } from '../services/api';
import SimpleDataTable from '../components/ui/SimpleDataTable';
import SimpleModal from '../components/ui/SimpleModal';
import PermissionWrapper from '../components/PermissionWrapper';
import { Toaster } from 'react-hot-toast';
import styles from '../styles/Contactos.module.css';

const ContactosPage = () => {
  const [activeTab, setActiveTab] = useState('clientes');
  
  // APIs para clientes y proveedores
  const clientesApi = useApi(clientesService, true);
  const proveedoresApi = useApi(proveedoresService, true);
  
  // Modales
  const clienteModal = useModal();
  const proveedorModal = useModal();

  // Configuración de campos para CLIENTES
  const clienteFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre del cliente'
    },
    {
      name: 'nombre_comercial',
      label: 'Nombre Comercial',
      type: 'text',
      placeholder: 'Nombre comercial (opcional)'
    },
    {
      name: 'es_empresa',
      label: 'Es Empresa',
      type: 'checkbox',
      defaultValue: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'email@ejemplo.com'
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'tel',
      placeholder: '123 456 789'
    },
    {
      name: 'movil',
      label: 'Móvil',
      type: 'tel',
      placeholder: '123 456 789'
    },
    {
      name: 'website',
      label: 'Website',
      type: 'url',
      placeholder: 'https://ejemplo.com'
    },
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'textarea',
      rows: 2,
      placeholder: 'Dirección completa'
    },
    {
      name: 'poblacion',
      label: 'Población',
      type: 'text',
      placeholder: 'Ciudad/Población'
    },
    {
      name: 'codigo_postal',
      label: 'Código Postal',
      type: 'text',
      placeholder: '28001'
    },
    {
      name: 'provincia',
      label: 'Provincia',
      type: 'text',
      placeholder: 'Provincia'
    },
    {
      name: 'pais',
      label: 'País',
      type: 'text',
      defaultValue: 'España'
    },
    {
      name: 'cif',
      label: 'CIF/NIF',
      type: 'text',
      placeholder: 'CIF o NIF del cliente'
    },
    {
      name: 'identificacion_vat',
      label: 'Identificación VAT',
      type: 'text',
      placeholder: 'Número VAT (opcional)'
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'text',
      placeholder: 'Separar por comas'
    },
    {
      name: 'activo',
      label: 'Activo',
      type: 'checkbox',
      defaultValue: true
    }
  ];

  // Configuración de campos para PROVEEDORES (nota: usa cif_nif en lugar de cif)
  const proveedorFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre del proveedor'
    },
    {
      name: 'nombre_comercial',
      label: 'Nombre Comercial',
      type: 'text',
      placeholder: 'Nombre comercial (opcional)'
    },
    {
      name: 'es_empresa',
      label: 'Es Empresa',
      type: 'checkbox',
      defaultValue: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'email@ejemplo.com'
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'tel',
      placeholder: '123 456 789'
    },
    {
      name: 'movil',
      label: 'Móvil',
      type: 'tel',
      placeholder: '123 456 789'
    },
    {
      name: 'website',
      label: 'Website',
      type: 'url',
      placeholder: 'https://ejemplo.com'
    },
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'textarea',
      rows: 2,
      placeholder: 'Dirección completa'
    },
    {
      name: 'poblacion',
      label: 'Población',
      type: 'text',
      placeholder: 'Ciudad/Población'
    },
    {
      name: 'codigo_postal',
      label: 'Código Postal',
      type: 'text',
      placeholder: '28001'
    },
    {
      name: 'provincia',
      label: 'Provincia',
      type: 'text',
      placeholder: 'Provincia'
    },
    {
      name: 'pais',
      label: 'País',
      type: 'text',
      defaultValue: 'España'
    },
    {
      name: 'cif_nif',
      label: 'CIF/NIF',
      type: 'text',
      placeholder: 'CIF o NIF del proveedor'
    },
    {
      name: 'identificacion_vat',
      label: 'Identificación VAT',
      type: 'text',
      placeholder: 'Número VAT (opcional)'
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'text',
      placeholder: 'Separar por comas'
    },
    {
      name: 'activo',
      label: 'Activo',
      type: 'checkbox',
      defaultValue: true
    }
  ];

  // Configuración de columnas para CLIENTES
  const clienteColumns = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'poblacion', label: 'Ciudad', sortable: true },
    { 
      key: 'activo', 
      label: 'Estado',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  // Configuración de columnas para PROVEEDORES
  const proveedorColumns = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'poblacion', label: 'Ciudad', sortable: true },
    { 
      key: 'activo', 
      label: 'Estado',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const currentApi = activeTab === 'clientes' ? clientesApi : proveedoresApi;
  const currentModal = activeTab === 'clientes' ? clienteModal : proveedorModal;
  const currentFields = activeTab === 'clientes' ? clienteFields : proveedorFields;
  const currentColumns = activeTab === 'clientes' ? clienteColumns : proveedorColumns;

  return (
    <div className={styles.contactosContainer}>
      <Toaster position="top-right" />
      
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            Gestión de Contactos
          </h1>
          <p className={styles.pageDescription}>
            Administra clientes y proveedores de tu empresa
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabNavigation}>
          <button
            onClick={() => setActiveTab('clientes')}
            className={`${styles.tabButton} ${activeTab === 'clientes' ? styles.active : ''}`}
          >
            Clientes ({clientesApi.data?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('proveedores')}
            className={`${styles.tabButton} ${activeTab === 'proveedores' ? styles.active : ''}`}
          >
            Proveedores ({proveedoresApi.data?.length || 0})
          </button>
        </div>

        {/* Contenido principal */}
        <div className={styles.contentContainer}>
          {/* Barra de herramientas */}
          <div className={styles.toolbar}>

            <PermissionWrapper requiredPermission="can_create_data">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  currentModal.openCreate();
                }}
                className={styles.addButton}
              >
                ✨ Nuevo {activeTab === 'clientes' ? 'Cliente' : 'Proveedor'}
              </button>
            </PermissionWrapper>
          </div>

          {/* Data Table */}
          <div className={styles.dataTable}>
            <SimpleDataTable
              data={currentApi.data || []}
              columns={currentColumns}
              loading={currentApi.loading}
              onEdit={(item) => currentModal.openEdit(item)}
              onView={(item) => currentModal.openView(item)}
              onDelete={(item) => currentApi.remove(item.id)}
              canEdit={true}
              canView={true}
              canDelete={true}
              searchPlaceholder={`Buscar ${activeTab}...`}
            />
          </div>
        </div>
        
        {/* Modal Form */}
        <SimpleModal
          isOpen={currentModal.isOpen}
          mode={currentModal.mode}
          title={{
            create: `Nuevo ${activeTab === 'clientes' ? 'Cliente' : 'Proveedor'}`,
            edit: `Editar ${activeTab === 'clientes' ? 'Cliente' : 'Proveedor'}`,
            view: `Ver ${activeTab === 'clientes' ? 'Cliente' : 'Proveedor'}`
          }}
          fields={currentFields}
          data={currentModal.data}
          onClose={currentModal.closeModal}
          onSubmit={async (data) => {
            if (currentModal.mode === 'create') {
              await currentApi.create(data);
            } else {
              await currentApi.update(currentModal.data.id, data);
            }
            currentModal.closeModal();
          }}
          loading={currentApi.loading}
        />
      </div>
    </div>
  );
};

export default ContactosPage;
