/**
 * Página de gestión de Inventario
 * Incluye gestión de almacenes, stock, movimientos y transferencias
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useApi } from '../hooks/useApi';
import { useModal } from '../hooks/useModal';
import { usePermissions } from '../hooks/usePermissions';
import { 
  almacenesService,
  stockService,
  stockServiceExtended,
  movimientosService,
  transferenciasService,
  transferenciasServiceExtended,
  articulosService
} from '../services/api';
import SimpleDataTable from '../components/ui/SimpleDataTable';
import SimpleModal from '../components/ui/SimpleModal';
import PermissionWrapper from '../components/PermissionWrapper';
import { Toaster } from 'react-hot-toast';
import styles from '../styles/Inventario.module.css';

const InventarioPage = () => {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState('almacenes');
  const [isMounted, setIsMounted] = useState(false);

  // APIs para cada módulo de inventario
  const almacenesApi = useApi(almacenesService, true);
  const stockApi = useApi(stockService, true);
  const movimientosApi = useApi(movimientosService, true);
  const transferenciasApi = useApi(transferenciasService, true);
  const articulosApi = useApi(articulosService, true);

  // Modales para cada sección
  const almacenModal = useModal();
  const stockModal = useModal();
  const movimientoModal = useModal();
  const transferenciaModal = useModal();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ===== CONFIGURACIÓN DE CAMPOS =====

  // Campos para Almacenes
  const almacenFields = [
    {
      name: 'codigo',
      label: 'Código',
      type: 'text',
      required: true,
      placeholder: 'ALM001'
    },
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Almacén Principal'
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      rows: 3,
      placeholder: 'Descripción del almacén'
    },
    {
      name: 'ubicacion',
      label: 'Ubicación',
      type: 'text',
      placeholder: 'Dirección física'
    },
    {
      name: 'es_principal',
      label: 'Almacén Principal',
      type: 'checkbox',
      defaultValue: false
    },
    {
      name: 'activo',
      label: 'Activo',
      type: 'checkbox',
      defaultValue: true
    }
  ];

  // Campos para Stock de Artículos
  const stockFields = [
    {
      name: 'articulo',
      label: 'Artículo',
      type: 'select',
      required: true,
      options: articulosApi.data?.map(articulo => ({
        value: articulo.id,
        label: `${articulo.nombre} (${articulo.precio}€)`
      })) || []
    },
    {
      name: 'almacen',
      label: 'Almacén',
      type: 'select',
      required: true,
      options: almacenesApi.data?.map(almacen => ({
        value: almacen.id,
        label: `${almacen.codigo} - ${almacen.nombre}`
      })) || []
    },
    {
      name: 'stock_actual',
      label: 'Stock Actual',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0
    },
    {
      name: 'stock_minimo',
      label: 'Stock Mínimo',
      type: 'number',
      min: 0,
      defaultValue: 0
    },
    {
      name: 'stock_maximo',
      label: 'Stock Máximo',
      type: 'number',
      min: 0,
      placeholder: 'Opcional'
    },
    {
      name: 'stock_reservado',
      label: 'Stock Reservado',
      type: 'number',
      min: 0,
      defaultValue: 0
    },
    {
      name: 'ubicacion_fisica',
      label: 'Ubicación Física',
      type: 'text',
      placeholder: 'Pasillo-Estantería-Nivel (ej: A1-E3-N2)'
    }
  ];

  // Campos para Movimientos de Stock
  const movimientoFields = [
    {
      name: 'articulo',
      label: 'Artículo',
      type: 'select',
      required: true,
      options: articulosApi.data?.map(articulo => ({
        value: articulo.id,
        label: `${articulo.nombre}`
      })) || []
    },
    {
      name: 'almacen',
      label: 'Almacén',
      type: 'select',
      required: true,
      options: almacenesApi.data?.map(almacen => ({
        value: almacen.id,
        label: `${almacen.codigo} - ${almacen.nombre}`
      })) || []
    },
    {
      name: 'tipo',
      label: 'Tipo de Movimiento',
      type: 'select',
      required: true,
      options: [
        { value: 'entrada', label: 'Entrada' },
        { value: 'salida', label: 'Salida' },
        { value: 'ajuste', label: 'Ajuste' },
        { value: 'transferencia_salida', label: 'Transferencia (Salida)' },
        { value: 'transferencia_entrada', label: 'Transferencia (Entrada)' }
      ]
    },
    {
      name: 'cantidad',
      label: 'Cantidad',
      type: 'number',
      required: true,
      step: 'any'
    },
    {
      name: 'motivo',
      label: 'Motivo',
      type: 'select',
      required: true,
      options: [
        { value: 'compra', label: 'Compra' },
        { value: 'venta', label: 'Venta' },
        { value: 'ajuste_inventario', label: 'Ajuste de Inventario' },
        { value: 'devolucion_cliente', label: 'Devolución Cliente' },
        { value: 'devolucion_proveedor', label: 'Devolución Proveedor' },
        { value: 'transferencia', label: 'Transferencia' },
        { value: 'perdida', label: 'Pérdida/Merma' },
        { value: 'otros', label: 'Otros' }
      ]
    },
    {
      name: 'observaciones',
      label: 'Observaciones',
      type: 'textarea',
      rows: 3,
      placeholder: 'Detalles adicionales del movimiento'
    }
  ];

  // Campos para Transferencias de Stock
  const transferenciaFields = [
    {
      name: 'almacen_origen',
      label: 'Almacén Origen',
      type: 'select',
      required: true,
      options: almacenesApi.data?.map(almacen => ({
        value: almacen.id,
        label: `${almacen.codigo} - ${almacen.nombre}`
      })) || []
    },
    {
      name: 'almacen_destino',
      label: 'Almacén Destino',
      type: 'select',
      required: true,
      options: almacenesApi.data?.map(almacen => ({
        value: almacen.id,
        label: `${almacen.codigo} - ${almacen.nombre}`
      })) || []
    },
    {
      name: 'motivo',
      label: 'Motivo de Transferencia',
      type: 'text',
      required: true,
      placeholder: 'Reubicación, reorganización, etc.'
    },
    {
      name: 'observaciones',
      label: 'Observaciones',
      type: 'textarea',
      rows: 3,
      placeholder: 'Notas adicionales sobre la transferencia'
    }
  ];

  // ===== CONFIGURACIÓN DE COLUMNAS =====

  // Columnas para Almacenes
  const almacenColumns = [
    {
      key: 'codigo',
      label: 'Código',
      render: (item) => (
        <span className={styles.codigoBadge}>
          📦 {item.codigo}
        </span>
      )
    },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'ubicacion', label: 'Ubicación' },
    {
      key: 'es_principal',
      label: 'Principal',
      render: (item) => item.es_principal ? (
        <span className={styles.estadoPrincipal}>⭐ Principal</span>
      ) : (
        <span className={styles.estadoSecundario}>📦 Secundario</span>
      )
    },
    {
      key: 'total_articulos',
      label: 'Artículos',
      render: (item) => (
        <span className={styles.contadorBadge}>
          {item.total_articulos || 0}
        </span>
      )
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (item) => (
        <span className={`${styles.estadoBadge} ${
          item.activo ? styles.activo : styles.inactivo
        }`}>
          {item.activo ? '✅ Activo' : '❌ Inactivo'}
        </span>
      )
    }
  ];

  // Columnas para Stock
  const stockColumns = [
    {
      key: 'articulo_nombre',
      label: 'Artículo',
      render: (item) => (
        <div>
          <div className="font-medium">{item.articulo_nombre}</div>
          <div className="text-sm text-gray-500">{item.almacen_nombre}</div>
        </div>
      )
    },
    {
      key: 'stock_actual',
      label: 'Stock Actual',
      render: (item) => (
        <span className={`${styles.stockBadge} ${
          item.stock_actual <= item.stock_minimo ? styles.stockBajo :
          item.stock_actual >= item.stock_maximo ? styles.stockAlto :
          styles.stockNormal
        }`}>
          {item.stock_actual}
        </span>
      )
    },
    {
      key: 'stock_disponible',
      label: 'Disponible',
      render: (item) => (
        <span className={styles.stockDisponible}>
          {item.stock_disponible}
        </span>
      )
    },
    {
      key: 'stock_reservado',
      label: 'Reservado',
      render: (item) => item.stock_reservado > 0 ? (
        <span className={styles.stockReservado}>
          🔒 {item.stock_reservado}
        </span>
      ) : (
        <span className="text-gray-400">0</span>
      )
    },
    {
      key: 'ubicacion_fisica',
      label: 'Ubicación',
      render: (item) => item.ubicacion_fisica || (
        <span className="text-gray-400">Sin asignar</span>
      )
    }
  ];

  // Columnas para Movimientos
  const movimientoColumns = [
    {
      key: 'fecha',
      label: 'Fecha',
      render: (item) => new Date(item.fecha).toLocaleDateString('es-ES')
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (item) => {
        const tipoConfig = {
          'entrada': { icon: '⬆️', color: 'green' },
          'salida': { icon: '⬇️', color: 'red' },
          'ajuste': { icon: '⚖️', color: 'blue' },
          'transferencia_salida': { icon: '📤', color: 'orange' },
          'transferencia_entrada': { icon: '📥', color: 'purple' }
        };
        const config = tipoConfig[item.tipo] || { icon: '❓', color: 'gray' };
        return (
          <span className={`${styles.tipoBadge} ${styles[config.color]}`}>
            {config.icon} {item.tipo.replace('_', ' ').toUpperCase()}
          </span>
        );
      }
    },
    {
      key: 'articulo_nombre',
      label: 'Artículo',
      render: (item) => (
        <div>
          <div className="font-medium">{item.articulo_nombre}</div>
          <div className="text-sm text-gray-500">{item.almacen_nombre}</div>
        </div>
      )
    },
    {
      key: 'cantidad',
      label: 'Cantidad',
      render: (item) => (
        <span className={`${styles.cantidadBadge} ${
          item.cantidad > 0 ? styles.positiva : styles.negativa
        }`}>
          {item.cantidad > 0 ? '+' : ''}{item.cantidad}
        </span>
      )
    },
    { key: 'motivo', label: 'Motivo' },
    { key: 'usuario_nombre', label: 'Usuario' }
  ];

  // Columnas para Transferencias
  const transferenciaColumns = [
    {
      key: 'numero',
      label: 'Número',
      render: (item) => (
        <span className={styles.numeroBadge}>
          🔄 {item.numero}
        </span>
      )
    },
    {
      key: 'fecha_solicitud',
      label: 'Fecha Solicitud',
      render: (item) => new Date(item.fecha_solicitud).toLocaleDateString('es-ES')
    },
    {
      key: 'almacenes',
      label: 'Origen → Destino',
      render: (item) => (
        <div className={styles.transferenciaPaths}>
          <span className={styles.almacenOrigen}>{item.almacen_origen_nombre}</span>
          <span className={styles.arrow}>→</span>
          <span className={styles.almacenDestino}>{item.almacen_destino_nombre}</span>
        </div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (item) => {
        const estadoConfig = {
          'pendiente': { icon: '⏳', color: 'warning' },
          'en_transito': { icon: '🚚', color: 'primary' },
          'completada': { icon: '✅', color: 'success' },
          'cancelada': { icon: '❌', color: 'danger' }
        };
        const config = estadoConfig[item.estado] || { icon: '❓', color: 'gray' };
        return (
          <span className={`${styles.estadoBadge} ${styles[config.color]}`}>
            {config.icon} {item.estado.toUpperCase()}
          </span>
        );
      }
    },
    {
      key: 'items_count',
      label: 'Items',
      render: (item) => (
        <span className={styles.contadorBadge}>
          {item.items_count || 0}
        </span>
      )
    },
    { key: 'solicitado_por_nombre', label: 'Solicitado por' }
  ];

  // ===== CONFIGURACIÓN DINÁMICA =====

  const tabConfig = {
    almacenes: {
      api: almacenesApi,
      modal: almacenModal,
      fields: almacenFields,
      columns: almacenColumns,
      title: 'Almacenes',
      icon: '📦',
      description: 'Gestión de ubicaciones de almacenamiento'
    },
    stock: {
      api: stockApi,
      modal: stockModal,
      fields: stockFields,
      columns: stockColumns,
      title: 'Stock',
      icon: '📊',
      description: 'Control de existencias por almacén'
    },
    movimientos: {
      api: movimientosApi,
      modal: movimientoModal,
      fields: movimientoFields,
      columns: movimientoColumns,
      title: 'Movimientos',
      icon: '📈',
      description: 'Histórico de movimientos de stock'
    },
    transferencias: {
      api: transferenciasApi,
      modal: transferenciaModal,
      fields: transferenciaFields,
      columns: transferenciaColumns,
      title: 'Transferencias',
      icon: '🔄',
      description: 'Transferencias entre almacenes'
    }
  };

  const currentConfig = tabConfig[activeTab];

  // ===== PERMISOS =====
  const canCreate = hasPermission('can_create_data');
  const canEdit = hasPermission('can_edit_data');
  const canView = hasPermission('can_view_data');
  const canDelete = hasPermission('can_delete_data');

  if (Object.values(tabConfig).some(config => config.api.loading)) {
    return (
      <div className={styles.inventarioContainer}>
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <div style={{ marginLeft: '1rem' }}>Cargando inventario...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Inventario - MiniGestión</title>
        <meta name="description" content="Gestión integral de inventario, almacenes y stock" />
      </Head>
      
      <div className={styles.inventarioContainer}>
        <Toaster position="top-right" />
        
        <div className={styles.pageContainer}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>
              📦 Gestión de Inventario
            </h1>
            <p className={styles.pageDescription}>
              Control integral de almacenes, stock, movimientos y transferencias
            </p>
            <div className={styles.pageStats}>
              <div className={styles.statItem}>
                <span>🏪</span>
                <span>{almacenesApi.data?.length || 0} almacenes</span>
              </div>
              <div className={styles.statItem}>
                <span>📦</span>
                <span>{stockApi.data?.length || 0} artículos en stock</span>
              </div>
              <div className={styles.statItem}>
                <span>📈</span>
                <span>{movimientosApi.data?.length || 0} movimientos</span>
              </div>
              <div className={styles.statItem}>
                <span>🔄</span>
                <span>{transferenciasApi.data?.length || 0} transferencias</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabNavigation}>
            {Object.entries(tabConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`${styles.tabButton} ${activeTab === key ? styles.active : ''}`}
              >
                <span className={styles.tabIcon}>{config.icon}</span>
                <span>{config.title}</span>
                <span className={styles.tabCount}>
                  ({config.api.data?.length || 0})
                </span>
              </button>
            ))}
          </div>

          {/* Contenido principal */}
          <div className={styles.contentContainer}>
            {/* Sub-header de la pestaña activa */}
            <div className={styles.tabHeader}>
              <div className={styles.tabInfo}>
                <h2 className={styles.tabTitle}>
                  {currentConfig.icon} {currentConfig.title}
                </h2>
                <p className={styles.tabDescription}>
                  {currentConfig.description}
                </p>
              </div>

              {/* Barra de herramientas */}
              <div className={styles.toolbar}>
                {isMounted && (
                  <PermissionWrapper requiredPermission="can_create_data">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        currentConfig.modal.openCreate();
                      }}
                      className={styles.addButton}
                    >
                      <span>➕</span>
                      <span>Nuevo {currentConfig.title.slice(0, -1)}</span>
                    </button>
                  </PermissionWrapper>
                )}
              </div>
            </div>

            {/* Data Table */}
            <div className={styles.dataTable}>
              <SimpleDataTable
                data={currentConfig.api.data || []}
                columns={currentConfig.columns}
                loading={currentConfig.api.loading}
                onEdit={(item) => currentConfig.modal.openEdit(item)}
                onView={(item) => currentConfig.modal.openView(item)}
                onDelete={(item) => currentConfig.api.remove(item.id)}
                canEdit={canEdit}
                canView={canView}
                canDelete={canDelete}
                searchPlaceholder={`Buscar en ${currentConfig.title.toLowerCase()}...`}
                emptyMessage={`No hay ${currentConfig.title.toLowerCase()} registrados`}
                emptyDescription={`Comienza agregando tu primer ${currentConfig.title.slice(0, -1).toLowerCase()}`}
              />
            </div>
          </div>
          
          {/* Modal Form */}
          <SimpleModal
            isOpen={currentConfig.modal.isOpen}
            mode={currentConfig.modal.mode}
            title={{
              create: `Nuevo ${currentConfig.title.slice(0, -1)}`,
              edit: `Editar ${currentConfig.title.slice(0, -1)}`,
              view: `Ver ${currentConfig.title.slice(0, -1)}`
            }}
            fields={currentConfig.fields}
            data={currentConfig.modal.data}
            onClose={currentConfig.modal.closeModal}
            onSubmit={async (data) => {
              if (currentConfig.modal.mode === 'create') {
                await currentConfig.api.create(data);
              } else {
                await currentConfig.api.update(currentConfig.modal.data.id, data);
              }
              currentConfig.modal.closeModal();
            }}
            loading={currentConfig.api.loading}
          />
        </div>
      </div>
    </>
  );
};

export default InventarioPage;
