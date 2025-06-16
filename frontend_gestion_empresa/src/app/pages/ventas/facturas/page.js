"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { facturasAPI, clientesAPI, pedidosAPI, presupuestosAPI } from '../../../services/api';
import styles from '../ventas.module.css';
import TableComponent from '../../../components/TableComponent';

// SVG Icons
const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function FacturasPage() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    cliente: '',
    pedido: '',
    presupuesto: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
    total: 0,
    pagada: false
  });
  
  // Estado para la opción de crear factura
  const [creationSource, setCreationSource] = useState('direct'); // 'direct', 'pedido' o 'presupuesto'

  // Cargar facturas, clientes, pedidos y presupuestos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [facturasData, clientesData, pedidosData, presupuestosData] = await Promise.all([
          facturasAPI.getAll(),
          clientesAPI.getAll(),
          pedidosAPI.getAll(),
          presupuestosAPI.getAll()
        ]);
        
        // Ordenar por fecha (más reciente primero)
        const ordenarPorFecha = (a, b) => new Date(b.fecha) - new Date(a.fecha);
        
        setFacturas([...facturasData].sort(ordenarPorFecha));
        setClientes(clientesData);
        setPedidos(pedidosData);
        setPresupuestos(presupuestosData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Manejar cambios en el origen de creación de la factura
  const handleSourceChange = (source) => {
    setCreationSource(source);
    
    // Restablecer el formulario
    setFormData({
      cliente: '',
      pedido: '',
      presupuesto: '',
      fecha: new Date().toISOString().split('T')[0],
      observaciones: '',
      total: 0,
      pagada: false
    });
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'pedido' && value) {
      const selectedPedido = pedidos.find(p => p.id === parseInt(value));
      if (selectedPedido) {
        setFormData({
          ...formData,
          pedido: value,
          cliente: selectedPedido.cliente.toString(),
          total: selectedPedido.total,
          observaciones: selectedPedido.observaciones || ''
        });
        return;
      }
    } else if (name === 'presupuesto' && value) {
      const selectedPresupuesto = presupuestos.find(p => p.id === parseInt(value));
      if (selectedPresupuesto) {
        setFormData({
          ...formData,
          presupuesto: value,
          cliente: selectedPresupuesto.cliente.toString(),
          total: selectedPresupuesto.total,
          observaciones: selectedPresupuesto.observaciones || ''
        });
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Crear nueva factura
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let newFactura;
      
      // Validaciones básicas
      if (creationSource === 'direct' && !formData.cliente) {
        alert('Debe seleccionar un cliente.');
        return;
      }
      
      // Crear factura según el origen seleccionado
      switch (creationSource) {
        case 'pedido':
          if (!formData.pedido) {
            alert('Debe seleccionar un pedido.');
            return;
          }
          // Crear factura desde pedido
          newFactura = await facturasAPI.crearDesdePedido({ pedido_id: formData.pedido, pagada: formData.pagada });
          break;
          
        case 'presupuesto':
          if (!formData.presupuesto) {
            alert('Debe seleccionar un presupuesto.');
            return;
          }
          // Crear factura desde presupuesto
          newFactura = await facturasAPI.crearDesdePresupuesto({ presupuesto_id: formData.presupuesto, pagada: formData.pagada });
          break;
          
        default: // 'direct'
          // Crear factura directamente
          const datosFactura = {
            cliente: formData.cliente,
            fecha: formData.fecha,
            observaciones: formData.observaciones,
            total: parseFloat(formData.total),
            pagada: formData.pagada
          };
          
          newFactura = await facturasAPI.create(datosFactura);
      }
      
      // Actualizar estado y limpiar formulario
      setFacturas([newFactura, ...facturas]);
      setFormData({
        cliente: '',
        pedido: '',
        presupuesto: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
        total: 0,
        pagada: false
      });
      setShowForm(false);
      alert('Factura creada correctamente');
    } catch (err) {
      console.error("Error al crear factura:", err);
      setError("Error al crear la factura. Por favor, intenta de nuevo.");
    }
  };

  // Marcar factura como pagada
  const marcarPagada = async (id) => {
    try {
      // Asumimos que existe un endpoint para marcar como pagada
      const facturaActualizada = await facturasAPI.update(id, { pagada: true });
      setFacturas(facturas.map(factura => 
        factura.id === id ? {...factura, pagada: true} : factura
      ));
      alert('Factura marcada como pagada');
    } catch (err) {
      console.error("Error al actualizar la factura:", err);
      setError("Error al marcar la factura como pagada.");
    }
  };

  // Eliminar factura
  const eliminarFactura = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;
    
    try {
      await facturasAPI.delete(id);
      setFacturas(facturas.filter(factura => factura.id !== id));
      alert('Factura eliminada correctamente');
    } catch (err) {
      console.error("Error al eliminar la factura:", err);
      setError("Error al eliminar la factura.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">Gestión de Facturas</h2>
        <button
          className={`btn ${showForm ? 'btn-outline-secondary' : 'btn-primary'}`}
          onClick={() => setShowForm(prev => !prev)}
        >
          {showForm ? <><IconTimes className="me-1"/>Cancelar</> : <><IconPlus className="me-1"/>Nueva Factura</>}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Crear Nueva Factura</h5>
          </div>
          <div className="card-body">
            {/* Selector de origen */}
            <div className="mb-4">
              <div className="btn-group w-100" role="group" aria-label="Origen de factura">
                <button 
                  type="button" 
                  className={`btn ${creationSource === 'direct' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleSourceChange('direct')}
                >
                  Factura Directa
                </button>
                <button 
                  type="button" 
                  className={`btn ${creationSource === 'pedido' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleSourceChange('pedido')}
                >
                  Desde Pedido
                </button>
                <button 
                  type="button" 
                  className={`btn ${creationSource === 'presupuesto' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleSourceChange('presupuesto')}
                >
                  Desde Presupuesto
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              {creationSource === 'pedido' && (
                <div className="mb-3">
                  <label htmlFor="pedido" className="form-label">Seleccionar Pedido</label>
                  <select
                    id="pedido"
                    name="pedido"
                    className="form-select"
                    value={formData.pedido}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar un pedido</option>
                    {pedidos.map(pedido => (
                      <option key={pedido.id} value={pedido.id}>
                        Pedido #{pedido.id} - {pedido.cliente_nombre || `Cliente ID: ${pedido.cliente}`} - {pedido.total}€
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {creationSource === 'presupuesto' && (
                <div className="mb-3">
                  <label htmlFor="presupuesto" className="form-label">Seleccionar Presupuesto</label>
                  <select
                    id="presupuesto"
                    name="presupuesto"
                    className="form-select"
                    value={formData.presupuesto}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar un presupuesto</option>
                    {presupuestos.map(presupuesto => (
                      <option key={presupuesto.id} value={presupuesto.id}>
                        Presupuesto #{presupuesto.id} - {presupuesto.cliente_nombre || `Cliente ID: ${presupuesto.cliente}`} - {presupuesto.total}€
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {creationSource === 'direct' && (
                <>
                  <div className="mb-3">
                    <label htmlFor="cliente" className="form-label">Cliente</label>
                    <select
                      id="cliente"
                      name="cliente"
                      className="form-select"
                      value={formData.cliente}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar cliente</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="fecha" className="form-label">Fecha</label>
                    <input
                      type="date"
                      id="fecha"
                      name="fecha"
                      className="form-control"
                      value={formData.fecha}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="total" className="form-label">Total</label>
                    <input
                      type="number"
                      id="total"
                      name="total"
                      className="form-control"
                      value={formData.total}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="observaciones" className="form-label">Observaciones</label>
                    <textarea
                      id="observaciones"
                      name="observaciones"
                      className="form-control"
                      value={formData.observaciones}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>
                </>
              )}
              
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  id="pagada"
                  name="pagada"
                  className="form-check-input"
                  checked={formData.pagada}
                  onChange={handleInputChange}
                />
                <label htmlFor="pagada" className="form-check-label">
                  Factura pagada
                </label>
              </div>
              
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  <IconCheckCircle /> Crear Factura
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowForm(false);
                  }}
                >
                  <IconTimes /> Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <TableComponent
        isLoading={loading}
        headers={[
          { name: 'ID', key: 'id' },
          { name: 'Cliente', key: 'cliente_nombre', render: f => f.cliente_nombre || `Cliente ID: ${f.cliente}` },
          { name: 'Fecha', key: 'fecha', render: f => new Date(f.fecha).toLocaleDateString() },
          { name: 'Total', key: 'total', render: f => `${parseFloat(f.total).toFixed(2)}€` },
          {
            name: 'Estado',
            key: 'estado',
            render: f => (
              <span className={`badge ${f.pagada ? 'bg-success' : 'bg-warning'}`}>
                {f.pagada ? 'Pagada' : 'Pendiente de pago'}
              </span>
            )
          }
        ]}
        data={facturas}
        onRowClick={f => window.location.href = `/pages/ventas/facturas/${f.id}`}
        actionButtons={f => (
          <div className="d-flex gap-1">
            <Link
              href={`/pages/ventas/facturas/${f.id}`}
              className="btn btn-sm btn-outline-primary"
              onClick={e => e.stopPropagation()}
              aria-label="Ver detalles"
            >
              <IconEye />
            </Link>
            {!f.pagada && (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={e => { e.stopPropagation(); marcarPagada(f.id); }}
                aria-label="Marcar como pagada"
              >
                <IconCheckCircle />
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={e => { e.stopPropagation(); eliminarFactura(f.id); }}
              aria-label="Eliminar factura"
            >
              <IconTrash />
            </button>
          </div>
        )}
      />
    </div>
  );
}
