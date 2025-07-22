/**
 * Página de gestión de Usuarios, Invitaciones y Empresas
 * Control completo de acceso basado en roles
 */
import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useModal } from '../hooks/useModal';
import { usePermissions } from '../hooks/usePermissions';
import { 
  usuariosService, 
  invitacionesServiceExtended, 
  empresasService 
} from '../services/api';
import DataTable from '../components/ui/DataTable';
import FormModal from '../components/ui/FormModal';
import PermissionWrapper from '../components/PermissionWrapper';
import { Toaster, toast } from 'react-hot-toast';
import styles from '../styles/Usuarios.module.css';

const UsuariosPage = () => {
  const [activeTab, setActiveTab] = useState('invitaciones');
  const { user, role, hasPermission } = usePermissions();
  
  // APIs
  const invitacionesApi = useApi(invitacionesServiceExtended, true);
  const empresasApi = useApi(empresasService, role === 'superadmin'); // Solo cargar si es superadmin
  
  // Modales
  const usuarioModal = useModal();
  const invitacionModal = useModal();
  const empresaModal = useModal();
  const perfilModal = useModal();

  // Verificar permisos de acceso
  const canManageUsers = hasPermission('can_manage_users');
  const canManageSettings = hasPermission('can_manage_settings');
  const isSuperAdmin = role === 'superadmin';

  // Si no tiene permisos, mostrar mensaje
  if (!canManageUsers && !isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Acceso Denegado
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>No tienes permisos para gestionar usuarios.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Configuración de campos para INVITACIONES
  const invitacionFields = [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'usuario@empresa.com'
    },
    {
      name: 'first_name',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre del usuario'
    },
    {
      name: 'last_name',
      label: 'Apellidos',
      type: 'text',
      required: true,
      placeholder: 'Apellidos del usuario'
    },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      options: [
        { value: 'admin', label: 'Administrador' },
        { value: 'manager', label: 'Gerente' },
        { value: 'employee', label: 'Empleado' },
        { value: 'readonly', label: 'Solo Lectura' }
      ]
    },
    {
      name: 'cargo',
      label: 'Cargo',
      type: 'text',
      placeholder: 'Cargo o posición en la empresa'
    }
  ];

  // Configuración de campos para EMPRESAS (Solo SuperAdmin)
  const empresaFields = [
    {
      name: 'nombre',
      label: 'Nombre de la Empresa',
      type: 'text',
      required: true,
      placeholder: 'Mi Empresa SL'
    },
    {
      name: 'cif',
      label: 'CIF/NIF',
      type: 'text',
      required: true,
      placeholder: 'B12345678'
    },
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'textarea',
      required: true,
      rows: 3,
      placeholder: 'Dirección completa'
    },
    {
      name: 'email',
      label: 'Email de Contacto',
      type: 'email',
      required: true,
      placeholder: 'contacto@empresa.com'
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'tel',
      placeholder: '+34 123 456 789'
    },
    {
      name: 'web',
      label: 'Sitio Web',
      type: 'url',
      placeholder: 'https://www.empresa.com'
    },
    {
      name: 'plan',
      label: 'Plan',
      type: 'select',
      required: true,
      defaultValue: 'basic',
      options: [
        { value: 'basic', label: 'Básico' },
        { value: 'premium', label: 'Premium' },
        { value: 'enterprise', label: 'Enterprise' }
      ]
    },
    {
      name: 'max_usuarios',
      label: 'Máximo de Usuarios',
      type: 'number',
      min: '1',
      max: '1000',
      defaultValue: 10,
      placeholder: '10'
    },
    {
      name: 'activa',
      label: 'Empresa Activa',
      type: 'checkbox',
      defaultValue: true
    }
  ];

  // Configuración de columnas para INVITACIONES
  const invitacionColumns = [
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'full_name', 
      label: 'Nombre Completo',
      render: (value, item) => `${item.first_name} ${item.last_name}`
    },
    { 
      key: 'role', 
      label: 'Rol',
      render: (value) => {
        const roleLabels = {
          admin: 'Administrador',
          manager: 'Gerente',
          employee: 'Empleado',
          readonly: 'Solo Lectura'
        };
        return roleLabels[value] || value;
      }
    },
    { 
      key: 'status', 
      label: 'Estado',
      render: (value) => {
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800',
          accepted: 'bg-green-100 text-green-800',
          expired: 'bg-red-100 text-red-800',
          cancelled: 'bg-gray-100 text-gray-800'
        };
        const statusLabels = {
          pending: 'Pendiente',
          accepted: 'Aceptada',
          expired: 'Expirada',
          cancelled: 'Cancelada'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[value]}`}>
            {statusLabels[value] || value}
          </span>
        );
      }
    },
    { 
      key: 'created_at', 
      label: 'Fecha Invitación',
      render: (value) => new Date(value).toLocaleDateString('es-ES')
    }
  ];

  // Configuración de columnas para EMPRESAS
  const empresaColumns = [
    { key: 'nombre', label: 'Empresa', sortable: true },
    { key: 'cif', label: 'CIF', sortable: true },
    { key: 'email', label: 'Email' },
    { 
      key: 'plan', 
      label: 'Plan',
      render: (value) => {
        const planColors = {
          basic: 'bg-blue-100 text-blue-800',
          premium: 'bg-purple-100 text-purple-800',
          enterprise: 'bg-orange-100 text-orange-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${planColors[value]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    { 
      key: 'usuarios_count', 
      label: 'Usuarios',
      render: (value, item) => `${value}/${item.max_usuarios}`
    },
    { 
      key: 'activa', 
      label: 'Estado',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activa' : 'Inactiva'}
        </span>
      )
    }
  ];

  // Acciones adicionales para invitaciones
  const handleCancelInvitation = async (invitation) => {
    if (invitation.status !== 'pending') {
      toast.error('Solo se pueden cancelar invitaciones pendientes');
      return;
    }
    
    try {
      await invitacionesServiceExtended.cancel(invitation.id);
      toast.success('Invitación cancelada exitosamente');
      invitacionesApi.refetch();
    } catch (error) {
      toast.error('Error al cancelar la invitación');
    }
  };

  const handleResendInvitation = async (invitation) => {
    if (invitation.status !== 'pending') {
      toast.error('Solo se pueden reenviar invitaciones pendientes');
      return;
    }
    
    try {
      await invitacionesServiceExtended.resend(invitation.id);
      toast.success('Invitación reenviada exitosamente');
    } catch (error) {
      toast.error('Error al reenviar la invitación');
    }
  };

  // Configuraciones dinámicas por tab
  const getTabConfig = () => {
    switch (activeTab) {
      case 'invitaciones':
        return {
          api: invitacionesApi,
          modal: invitacionModal,
          fields: invitacionFields,
          columns: invitacionColumns,
          title: 'Invitaciones',
          singular: 'Invitación',
          actions: [
            {
              label: 'Cancelar',
              onClick: handleCancelInvitation,
              className: 'text-red-600 hover:text-red-800',
              show: (item) => item.status === 'pending'
            },
            {
              label: 'Reenviar',
              onClick: handleResendInvitation,
              className: 'text-blue-600 hover:text-blue-800',
              show: (item) => item.status === 'pending'
            }
          ]
        };
      case 'empresas':
        return {
          api: empresasApi,
          modal: empresaModal,
          fields: empresaFields,
          columns: empresaColumns,
          title: 'Empresas',
          singular: 'Empresa'
        };
      default:
        return null;
    }
  };

  const config = getTabConfig();

  return (
    <div className={styles.usuariosContainer}>
      <Toaster position="top-right" />
      
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            Gestión de Usuarios
          </h1>
          <p className={styles.pageDescription}>
            Administra usuarios, invitaciones y empresas del sistema
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabNavigation}>
          <button
            onClick={() => setActiveTab('invitaciones')}
            className={`${styles.tabButton} ${activeTab === 'invitaciones' ? styles.active : ''}`}
          >
            📧 Invitaciones ({invitacionesApi.data?.length || 0})
          </button>
          
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('empresas')}
              className={`${styles.tabButton} ${activeTab === 'empresas' ? styles.active : ''}`}
            >
              🏢 Empresas ({empresasApi.data?.length || 0})
            </button>
          )}
          
          <button
            onClick={() => perfilModal.openEdit(user)}
            className={styles.tabButton}
          >
            👤 Mi Perfil
          </button>
        </div>

        {/* Contenido principal */}
        <div className={styles.contentContainer}>
          {/* Barra de herramientas */}
          {config && (
            <div className={styles.toolbar}>
              <div className={styles.searchContainer}>
                <input 
                  type="text" 
                  placeholder={`Buscar ${config.title.toLowerCase()}...`}
                  className={styles.searchInput}
                />
              </div>
              <PermissionWrapper requiredPermission="can_manage_users">
                <button
                  onClick={() => config.modal.openCreate()}
                  className={styles.addButton}
                >
                  ✨ {activeTab === 'invitaciones' ? 'Invitar Usuario' : `Nueva ${config.singular}`}
                </button>
              </PermissionWrapper>
            </div>
          )}

          {/* Data Table */}
          {config && (
            <div className={styles.dataTable}>
              <DataTable
                data={config.api.data || []}
                columns={config.columns}
                loading={config.api.loading}
                onEdit={(item) => config.modal.openEdit(item)}
                onView={(item) => config.modal.openView(item)}
                onDelete={(item) => config.api.remove(item.id)}
                canEdit="can_manage_users"
                canDelete="can_manage_users"
                searchPlaceholder={`Buscar ${config.title.toLowerCase()}...`}
                customActions={config.actions}
              />
            </div>
          )}
        </div>
        
        {/* Modal Form para Invitaciones/Empresas */}
        {config && (
        <FormModal
          isOpen={config.modal.isOpen}
          mode={config.modal.mode}
          title={{
            create: activeTab === 'invitaciones' ? 'Invitar Usuario' : `Nueva ${config.singular}`,
            edit: `Editar ${config.singular}`,
            view: `Ver ${config.singular}`
          }}
          fields={config.fields}
          data={config.modal.data}
          onClose={config.modal.closeModal}
          onSubmit={async (data) => {
            if (config.modal.mode === 'create') {
              await config.api.create(data);
            } else {
              await config.api.update(config.modal.data.id, data);
            }
            config.modal.closeModal();
          }}
          loading={config.api.loading}
        />
      )}

      {/* Modal de Perfil */}
      <FormModal
        isOpen={perfilModal.isOpen}
        mode={perfilModal.mode}
        title="Mi Perfil"
        fields={[
          {
            name: 'first_name',
            label: 'Nombre',
            type: 'text',
            required: true
          },
          {
            name: 'last_name',
            label: 'Apellidos',
            type: 'text',
            required: true
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true
          },
          {
            name: 'telefono',
            label: 'Teléfono',
            type: 'tel'
          },
          {
            name: 'cargo',
            label: 'Cargo',
            type: 'text'
          }
        ]}
        data={perfilModal.data}
        onClose={perfilModal.closeModal}
        onSubmit={async (data) => {
          try {
            await usuariosService.updateProfile(data);
            toast.success('Perfil actualizado exitosamente');
            perfilModal.closeModal();
          } catch (error) {
            toast.error('Error al actualizar el perfil');
          }
        }}
        loading={false}
        />
      </div>
    </div>
  );
};

export default UsuariosPage;
