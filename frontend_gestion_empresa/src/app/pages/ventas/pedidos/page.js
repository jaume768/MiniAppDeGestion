"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pedidosAPI, clientesAPI } from '../../../services/api';
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

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [clientes, setClientes] = useState([]);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    cliente: '',
    total: 0,
    entregado: false
  });

  // Cargar pedidos y clientes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pedidosData, clientesData] = await Promise.all([
          pedidosAPI.getAll(),
          clientesAPI.getAll()
        ]);
        
        setPedidos(pedidosData);
        setClientes(clientesData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Crear nuevo pedido
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newPedido = await pedidosAPI.create(formData);
      setPedidos([...pedidos, newPedido]);
      setFormData({ cliente: '', total: 0, entregado: false });
      setShowForm(false);
      alert('Pedido creado correctamente');
    } catch (err) {
      console.error("Error al crear pedido:", err);
      setError("Error al crear el pedido. Por favor, intenta de nuevo.");
    }
  };

  // Marcar pedido como entregado
  const marcarEntregado = async (id) => {
    try {
      await pedidosAPI.marcarEntregado(id);
      setPedidos(pedidos.map(pedido => 
        pedido.id === id ? {...pedido, entregado: true} : pedido
      ));
      alert('Pedido marcado como entregado');
    } catch (err) {
      console.error("Error al actualizar el pedido:", err);
      setError("Error al marcar el pedido como entregado.");
    }
  };

  // Eliminar pedido
  const eliminarPedido = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido?')) return;
    
    try {
      await pedidosAPI.delete(id);
      setPedidos(pedidos.filter(pedido => pedido.id !== id));
      alert('Pedido eliminado correctamente');
    } catch (err) {
      console.error("Error al eliminar el pedido:", err);
      setError("Error al eliminar el pedido.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">Gestión de Pedidos</h2>
        <button 
          className={`btn ${showForm ? 'btn-outline-secondary' : 'btn-primary'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <>
              <IconTimes className="me-1" /> Cancelar
            </>
          ) : (
            <>
              <IconPlus className="me-1" /> Nuevo Pedido
            </>
          )}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title h5 mb-0">Crear Nuevo Pedido</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6 form-group mb-3">
                  <label className="form-label">Cliente:</label>
                  <select 
                    className="form-select"
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-6 form-group mb-3">
                  <label className="form-label">Total (€):</label>
                  <input 
                    className="form-control"
                    type="number"
                    name="total"
                    value={formData.total}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="form-group mb-4">
                <div className="form-check">
                  <input 
                    className="form-check-input"
                    type="checkbox"
                    id="entregadoCheck"
                    name="entregado"
                    checked={formData.entregado}
                    onChange={handleInputChange}
                  /> 
                  <label className="form-check-label" htmlFor="entregadoCheck">
                    Marcar como entregado
                  </label>
                </div>
              </div>
              
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  <IconPlus className="me-1" /> Crear Pedido
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={() => setShowForm(false)}
                >
                  <IconTimes className="me-1" /> Cancelar
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
          { name: 'Cliente', key: 'cliente_nombre', render: (pedido) => pedido.cliente_nombre || `Cliente ID: ${pedido.cliente}` },
          { name: 'Fecha', key: 'fecha', render: (pedido) => new Date(pedido.fecha).toLocaleDateString() },
          { name: 'Total', key: 'total', render: (pedido) => `${pedido.total}€` },
          { 
            name: 'Estado', 
            key: 'estado', 
            render: (pedido) => (
              <span className={`badge ${pedido.entregado ? 'bg-success' : 'bg-warning'}`}>
                {pedido.entregado ? 'Entregado' : 'Pendiente'}
              </span>
            ) 
          },
        ]}
        data={pedidos}
        onRowClick={(pedido) => window.location.href = `/pages/ventas/pedidos/${pedido.id}`}
        actionButtons={(pedido) => (
          <div className="d-flex gap-1">
            <Link 
              href={`/pages/ventas/pedidos/${pedido.id}`}
              className="btn btn-sm btn-icon btn-outline-primary"
              onClick={(e) => e.stopPropagation()}
              aria-label="Ver detalles"
            >
              <IconEye />
            </Link>
            {!pedido.entregado && (
              <button
                className="btn btn-sm btn-icon btn-outline-success"
                onClick={(e) => {
                  e.stopPropagation();
                  marcarEntregado(pedido.id);
                }}
                aria-label="Marcar como entregado"
              >
                <IconCheckCircle />
              </button>
            )}
            <button
              className="btn btn-sm btn-icon btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                eliminarPedido(pedido.id);
              }}
              aria-label="Eliminar pedido"
            >
              <IconTrash />
            </button>
          </div>
        )}
      />
    </div>
  );
}
