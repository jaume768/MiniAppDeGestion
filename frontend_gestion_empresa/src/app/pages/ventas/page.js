"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pedidosAPI, presupuestosAPI, facturasAPI } from '../../services/api';
import styles from './ventas.module.css';
import TableComponent from '../../components/TableComponent';

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

const IconFileInvoice = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconFileContract = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const IconReceipt = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
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

export default function VentasPage() {
  // Estados para datos y UI
  const [activeTab, setActiveTab] = useState('presupuestos'); // presupuestos, pedidos, facturas
  const [presupuestos, setPresupuestos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Estado para el formulario de nuevo presupuesto/pedido/factura
  const [formData, setFormData] = useState({
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    items: [],
    observaciones: ''
  });

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar datos de todas las entidades de ventas
        const [presupuestosData, pedidosData, facturasData] = await Promise.all([
          presupuestosAPI.getAll(),
          pedidosAPI.getAll(),
          facturasAPI.getAll()
        ]);
        
        // Ordenar por fecha (más reciente primero)
        const ordenarPorFecha = (a, b) => new Date(b.fecha) - new Date(a.fecha);
        setPresupuestos([...presupuestosData].sort(ordenarPorFecha));
        setPedidos([...pedidosData].sort(ordenarPorFecha));
        setFacturas([...facturasData].sort(ordenarPorFecha));
        
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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Crear nuevo elemento (presupuesto/pedido/factura)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let result;
      
      switch (activeTab) {
        case 'presupuestos':
          result = await presupuestosAPI.create(formData);
          setPresupuestos([result, ...presupuestos]);
          break;
        case 'pedidos':
          result = await pedidosAPI.create(formData);
          setPedidos([result, ...pedidos]);
          break;
        case 'facturas':
          result = await facturasAPI.create(formData);
          setFacturas([result, ...facturas]);
          break;
      }
      
      setFormData({
        cliente: '',
        fecha: new Date().toISOString().split('T')[0],
        items: [],
        observaciones: ''
      });
      
      setShowForm(false);
      alert(`${activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)} creado correctamente`);
    } catch (err) {
      console.error(`Error al crear ${activeTab.slice(0, -1)}:`, err);
      setError(`Error al crear el ${activeTab.slice(0, -1)}. Por favor, intenta de nuevo.`);
    }
  };
  
  // Eliminar elemento
  const eliminarElemento = async (id) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar este ${activeTab.slice(0, -1)}? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      switch (activeTab) {
        case 'presupuestos':
          await presupuestosAPI.delete(id);
          setPresupuestos(presupuestos.filter(item => item.id !== id));
          break;
        case 'pedidos':
          await pedidosAPI.delete(id);
          setPedidos(pedidos.filter(item => item.id !== id));
          break;
        case 'facturas':
          await facturasAPI.delete(id);
          setFacturas(facturas.filter(item => item.id !== id));
          break;
      }
      
      alert(`${activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)} eliminado correctamente`);
    } catch (err) {
      console.error(`Error al eliminar ${activeTab.slice(0, -1)}:`, err);
      setError(`Error al eliminar el ${activeTab.slice(0, -1)}. Es posible que tenga dependencias.`);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Gestión de Ventas</h1>
        <button 
          className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <>
              <IconTimes /> Cancelar
            </>
          ) : (
            <>
              <IconPlus /> Nuevo {activeTab === 'presupuestos' ? 'Presupuesto' : 
                    activeTab === 'pedidos' ? 'Pedido' : 'Factura'}
            </>
          )}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* Tabs de navegación */}
      <div className="nav-tabs-container mb-4">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'presupuestos' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('presupuestos');
                setShowForm(false);
              }}
            >
              <IconFileContract className="me-2" /> 
              Presupuestos {presupuestos.length > 0 && 
                <span className="badge bg-primary">{presupuestos.length}</span>}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'pedidos' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('pedidos');
                setShowForm(false);
              }}
            >
              <IconReceipt className="me-2" /> 
              Pedidos {pedidos.length > 0 && 
                <span className="badge bg-primary">{pedidos.length}</span>}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'facturas' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('facturas');
                setShowForm(false);
              }}
            >
              <IconFileInvoice className="me-2" /> 
              Facturas {facturas.length > 0 && 
                <span className="badge bg-primary">{facturas.length}</span>}
            </button>
          </li>
        </ul>
      </div>
      
      {/* Formulario de creación */}
      {showForm && (
        <div className="card mb-4">
          <h3 className="card-title mb-3">
            {activeTab === 'presupuestos' ? 'Añadir Nuevo Presupuesto' : 
             activeTab === 'pedidos' ? 'Añadir Nuevo Pedido' : 'Añadir Nueva Factura'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Cliente:</label>
                <input 
                  type="text"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre del cliente o ID"
                />
              </div>
              
              <div className="form-group">
                <label>Fecha:</label>
                <input 
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group mb-3">
              <label>Observaciones:</label>
              <textarea 
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                placeholder="Observaciones adicionales"
                rows="3"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                {activeTab === 'presupuestos' ? 'Crear Presupuesto' : 
                 activeTab === 'pedidos' ? 'Crear Pedido' : 'Crear Factura'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando información...</p>
        </div>
      ) : (
        <>
          {/* Contenido de Presupuestos */}
          {activeTab === 'presupuestos' && (
            <TableComponent
              isLoading={loading}
              headers={[
                { name: 'ID', key: 'id' },
                { name: 'Cliente', key: 'cliente', render: (item) => item.cliente_nombre || `Cliente ID: ${item.cliente}` },
                { name: 'Fecha', key: 'fecha', render: (item) => new Date(item.fecha).toLocaleDateString() },
                { name: 'Total', key: 'total', render: (item) => `${item.total}€` },
              ]}
              data={presupuestos}
              onRowClick={(item) => window.location.href = `/pages/ventas/presupuestos/${item.id}`}
              actionButtons={(item) => (
                <>
                  <Link 
                    href={`/pages/ventas/presupuestos/${item.id}`}
                    className="btn btn-sm btn-outline-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconEye />
                  </Link>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarElemento(item.id);
                    }}
                  >
                    <IconTrash />
                  </button>
                </>
              )}
            />
          )}

          {/* Contenido de Pedidos */}
          {activeTab === 'pedidos' && (
            <TableComponent
              isLoading={loading}
              headers={[
                { name: 'ID', key: 'id' },
                { name: 'Cliente', key: 'cliente', render: (item) => item.cliente_nombre || `Cliente ID: ${item.cliente}` },
                { name: 'Fecha', key: 'fecha', render: (item) => new Date(item.fecha).toLocaleDateString() },
                { name: 'Total', key: 'total', render: (item) => `${item.total}€` },
                { name: 'Estado', key: 'entregado', render: (item) => 
                  item.entregado ? 
                  <span className="badge bg-success">Entregado</span> : 
                  <span className="badge bg-warning">Pendiente</span>
                },
              ]}
              data={pedidos}
              onRowClick={(item) => window.location.href = `/pages/ventas/pedidos/${item.id}`}
              actionButtons={(item) => (
                <>
                  <Link 
                    href={`/pages/ventas/pedidos/${item.id}`}
                    className="btn btn-sm btn-outline-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconEye />
                  </Link>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarElemento(item.id);
                    }}
                  >
                    <IconTrash />
                  </button>
                </>
              )}
            />
          )}

          {/* Contenido de Facturas */}
          {activeTab === 'facturas' && (
            <TableComponent
              isLoading={loading}
              headers={[
                { name: 'ID', key: 'id' },
                { name: 'Cliente', key: 'cliente', render: (item) => item.cliente_nombre || `Cliente ID: ${item.cliente}` },
                { name: 'Fecha', key: 'fecha', render: (item) => new Date(item.fecha).toLocaleDateString() },
                { name: 'Total', key: 'total', render: (item) => `${item.total}€` },
                { name: 'Estado', key: 'pagada', render: (item) => 
                  item.pagada ? 
                  <span className="badge bg-success">Pagada</span> : 
                  <span className="badge bg-warning">Pendiente</span>
                },
              ]}
              data={facturas}
              onRowClick={(item) => window.location.href = `/pages/ventas/facturas/${item.id}`}
              actionButtons={(item) => (
                <>
                  <Link 
                    href={`/pages/ventas/facturas/${item.id}`}
                    className="btn btn-sm btn-outline-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconEye />
                  </Link>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarElemento(item.id);
                    }}
                  >
                    <IconTrash />
                  </button>
                </>
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
