"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientesAPI, pedidosAPI, facturasAPI, presupuestosAPI } from '../../../services/api';
import TableComponent from '../../../components/TableComponent';

// SVG Icons
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const IconSave = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const IconTimes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function ClienteDetalle({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [cliente, setCliente] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  
  // Estado para el formulario de edición
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    cif: '',
    notas: ''
  });

  // Cargar datos del cliente y sus relaciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar cliente
        const clienteData = await clientesAPI.getById(id);
        setCliente(clienteData);
        
        // Inicializar formData con los datos del cliente
        setFormData({
          nombre: clienteData.nombre || '',
          email: clienteData.email || '',
          telefono: clienteData.telefono || '',
          direccion: clienteData.direccion || '',
          cif: clienteData.cif || '',
          notas: clienteData.notas || ''
        });
        
        // Intentar cargar las relaciones del cliente (pedidos, facturas, presupuestos)
        try {
          const pedidosData = await pedidosAPI.getByCliente(id);
          setPedidos(pedidosData);
        } catch (err) {
          console.warn("No se pudieron cargar los pedidos del cliente:", err);
          setPedidos([]);
        }
        
        try {
          const facturasData = await facturasAPI.getByCliente(id);
          setFacturas(facturasData);
        } catch (err) {
          console.warn("No se pudieron cargar las facturas del cliente:", err);
          setFacturas([]);
        }
        
        try {
          const presupuestosData = await presupuestosAPI.getByCliente(id);
          setPresupuestos(presupuestosData);
        } catch (err) {
          console.warn("No se pudieron cargar los presupuestos del cliente:", err);
          setPresupuestos([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos del cliente:", err);
        setError("Error al cargar los datos del cliente. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Actualizar cliente
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const updatedCliente = await clientesAPI.update(id, formData);
      setCliente(updatedCliente);
      setEditing(false);
      alert('Cliente actualizado correctamente');
    } catch (err) {
      console.error("Error al actualizar cliente:", err);
      setError("Error al actualizar el cliente. Por favor, intenta de nuevo.");
    }
  };

  // Eliminar cliente
  const eliminarCliente = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) return;
    
    try {
      await clientesAPI.delete(id);
      alert('Cliente eliminado correctamente');
      router.push('/pages/clientes');
    } catch (err) {
      console.error("Error al eliminar el cliente:", err);
      setError("Error al eliminar el cliente. Es posible que tenga pedidos o facturas asociadas.");
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center my-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Cargando información del cliente...</span>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="alert alert-danger my-4" role="alert">
      {error}
    </div>
  );
  
  if (!cliente) return (
    <div className="alert alert-warning my-4" role="alert">
      No se encontró el cliente solicitado.
    </div>
  );

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div>
          <Link href="/pages/clientes" className="btn btn-link text-decoration-none ps-0">
            <IconChevronLeft className="me-1" /> Volver a clientes
          </Link>
          <h2 className="mt-2">{cliente.nombre}</h2>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          {!editing ? (
            <button 
              className="btn btn-primary d-flex align-items-center"
              onClick={() => setEditing(true)}
            >
              <IconEdit className="me-1" /> Editar Cliente
            </button>
          ) : (
            <button 
              className="btn btn-outline-secondary d-flex align-items-center"
              onClick={() => setEditing(false)}
            >
              <IconTimes className="me-1" /> Cancelar Edición
            </button>
          )}
          <button 
            className="btn btn-outline-danger d-flex align-items-center"
            onClick={eliminarCliente}
          >
            <IconTrash className="me-1" /> Eliminar Cliente
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
        {editing ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Nombre/Razón Social:</label>
              <input 
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6 mb-3 mb-md-0">
                <label className="form-label">Email:</label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Teléfono:</label>
                <input 
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Dirección:</label>
              <input 
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">CIF/NIF:</label>
              <input 
                type="text"
                name="cif"
                value={formData.cif}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            
            <div className="mb-4">
              <label className="form-label">Notas:</label>
              <textarea 
                name="notas"
                value={formData.notas}
                onChange={handleInputChange}
                className="form-control"
                rows="3"
              ></textarea>
            </div>
            
            <div className="d-flex gap-2">
              <button 
                type="submit" 
                className="btn btn-primary d-flex align-items-center"
              >
                <IconSave className="me-1" /> Guardar Cambios
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary d-flex align-items-center"
                onClick={() => setEditing(false)}
              >
                <IconTimes className="me-1" /> Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="row g-3">
            <div className="col-12">
              <h6 className="text-muted mb-1">Nombre</h6>
              <p className="fs-5">{cliente.nombre}</p>
            </div>
            
            <div className="col-md-6">
              <h6 className="text-muted mb-1">Email</h6>
              <p>{cliente.email || '-'}</p>
            </div>
            
            <div className="col-md-6">
              <h6 className="text-muted mb-1">Teléfono</h6>
              <p>{cliente.telefono || '-'}</p>
            </div>
            
            <div className="col-md-6">
              <h6 className="text-muted mb-1">Dirección</h6>
              <p>{cliente.direccion || '-'}</p>
            </div>
            
            <div className="col-md-6">
              <h6 className="text-muted mb-1">CIF/NIF</h6>
              <p>{cliente.cif || '-'}</p>
            </div>
            
            {cliente.notas && (
              <div className="col-12">
                <h6 className="text-muted mb-1">Notas</h6>
                <p>{cliente.notas}</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Historial de pedidos */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center bg-white">
          <h5 className="mb-0">Pedidos</h5>
          <Link 
            href={`/pages/ventas/pedidos?cliente=${id}`}
            className="btn btn-primary btn-sm d-flex align-items-center"
          >
            <IconPlus className="me-1" /> Nuevo Pedido
          </Link>
        </div>
        <div className="card-body p-0">
          {pedidos.length > 0 ? (
            <TableComponent
              headers={[
                { name: 'ID', key: 'id' },
                { name: 'Fecha', key: 'fecha', render: (pedido) => new Date(pedido.fecha).toLocaleDateString() },
                { name: 'Total', key: 'total', render: (pedido) => `${pedido.total}€` },
                { name: 'Estado', key: 'estado', render: (pedido) => (
                  <span className={`badge ${pedido.entregado ? 'bg-success' : 'bg-warning'}`}>
                    {pedido.entregado ? 'Entregado' : 'Pendiente'}
                  </span>
                )},
              ]}
              data={pedidos}
              onRowClick={(pedido) => window.location.href = `/pages/ventas/pedidos/${pedido.id}`}
              actionButtons={(pedido) => (
                <Link 
                  href={`/pages/ventas/pedidos/${pedido.id}`}
                  className="btn btn-sm btn-icon btn-outline-primary"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Ver detalles"
                >
                  <IconEye />
                </Link>
              )}
            />
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-0">Este cliente no tiene pedidos</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Historial de facturas */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center bg-white">
          <h5 className="mb-0">Facturas</h5>
          <Link 
            href={`/pages/ventas/facturas?cliente=${id}`}
            className="btn btn-primary btn-sm d-flex align-items-center"
          >
            <IconPlus className="me-1" /> Nueva Factura
          </Link>
        </div>
        <div className="card-body p-0">
          {facturas.length > 0 ? (
            <TableComponent
              headers={[
                { name: 'ID', key: 'id' },
                { name: 'Fecha', key: 'fecha', render: (factura) => new Date(factura.fecha).toLocaleDateString() },
                { name: 'Total', key: 'total', render: (factura) => `${factura.total}€` },
                { name: 'Estado', key: 'estado', render: (factura) => (
                  <span className={`badge ${factura.pagada ? 'bg-success' : 'bg-warning'}`}>
                    {factura.pagada ? 'Pagada' : 'Pendiente'}
                  </span>
                )},
              ]}
              data={facturas}
              onRowClick={(factura) => window.location.href = `/pages/ventas/facturas/${factura.id}`}
              actionButtons={(factura) => (
                <Link 
                  href={`/pages/ventas/facturas/${factura.id}`}
                  className="btn btn-sm btn-icon btn-outline-primary"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Ver detalles"
                >
                  <IconEye />
                </Link>
              )}
            />
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-0">Este cliente no tiene facturas</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Historial de presupuestos */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center bg-white">
          <h5 className="mb-0">Presupuestos</h5>
          <Link 
            href={`/pages/ventas/presupuestos?cliente=${id}`}
            className="btn btn-primary btn-sm d-flex align-items-center"
          >
            <IconPlus className="me-1" /> Nuevo Presupuesto
          </Link>
        </div>
        <div className="card-body p-0">
          {presupuestos.length > 0 ? (
            <TableComponent
              headers={[
                { name: 'ID', key: 'id' },
                { name: 'Fecha', key: 'fecha', render: (presupuesto) => new Date(presupuesto.fecha).toLocaleDateString() },
                { name: 'Total', key: 'total', render: (presupuesto) => `${presupuesto.total}€` },
                { name: 'Estado', key: 'estado', render: (presupuesto) => {
                  let badgeClass = 'bg-secondary';
                  let status = 'Pendiente';
                  
                  if (presupuesto.aceptado) {
                    badgeClass = 'bg-success';
                    status = 'Aceptado';
                  } else if (presupuesto.rechazado) {
                    badgeClass = 'bg-danger';
                    status = 'Rechazado';
                  } else {
                    badgeClass = 'bg-warning';
                  }
                  
                  return <span className={`badge ${badgeClass}`}>{status}</span>;
                }},
              ]}
              data={presupuestos}
              onRowClick={(presupuesto) => window.location.href = `/pages/ventas/presupuestos/${presupuesto.id}`}
              actionButtons={(presupuesto) => (
                <Link 
                  href={`/pages/ventas/presupuestos/${presupuesto.id}`}
                  className="btn btn-sm btn-icon btn-outline-primary"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Ver detalles"
                >
                  <IconEye />
                </Link>
              )}
            />
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-0">Este cliente no tiene presupuestos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
