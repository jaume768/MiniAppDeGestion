"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pedidosAPI, presupuestosAPI, facturasAPI, albaranesAPI, ticketsAPI, clientesAPI, articulosAPI } from '../../services/api';
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
  const [activeTab, setActiveTab] = useState('presupuestos');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [presupuestos, setPresupuestos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [albaranes, setAlbaranes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [presData, pedData, facData, albData, tikData] = await Promise.all([
          presupuestosAPI.getAll(),
          pedidosAPI.getAll(),
          facturasAPI.getAll(),
          albaranesAPI.getAll(),
          ticketsAPI.getAll(),
        ]);
        setPresupuestos(presData);
        setPedidos(pedData);
        setFacturas(facData);
        setAlbaranes(albData);
        setTickets(tikData);
      } catch (err) {
        console.error(err);
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


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
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'albaranes' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('albaranes');
                setShowForm(false);
              }}
            >
              <IconFileContract className="me-2" /> 
              Albaranes {albaranes.length > 0 && 
                <span className="badge bg-primary">{albaranes.length}</span>}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('tickets');
                setShowForm(false);
              }}
            >
              <IconReceipt className="me-2" /> 
              Tickets {tickets.length > 0 && 
                <span className="badge bg-primary">{tickets.length}</span>}
            </button>
          </li>
        </ul>
      </div>
      {/* Contenido de pestañas */}
      <div className="tab-content">
        {activeTab === 'presupuestos' && (
          <TableComponent
            headers={[
              { name: 'ID', key: 'id' },
              { name: 'Cliente', key: 'cliente_nombre' },
              { name: 'Fecha', key: 'fecha' },
              { name: 'Total', key: 'total' }
            ]}
            data={presupuestos}
            isLoading={loading}
          />
        )}
        {activeTab === 'pedidos' && (
          <TableComponent
            headers={[
              { name: 'ID', key: 'id' },
              { name: 'Cliente', key: 'cliente_nombre' },
              { name: 'Fecha', key: 'fecha' },
              { name: 'Total', key: 'total' }
            ]}
            data={pedidos}
            isLoading={loading}
          />
        )}
        {activeTab === 'facturas' && (
          <TableComponent
            headers={[
              { name: 'ID', key: 'id' },
              { name: 'Cliente', key: 'cliente_nombre' },
              { name: 'Fecha', key: 'fecha' },
              { name: 'Total', key: 'total' }
            ]}
            data={facturas}
            isLoading={loading}
          />
        )}
        {activeTab === 'albaranes' && (
          <TableComponent
            headers={[
              { name: 'ID', key: 'id' },
              { name: 'Cliente', key: 'cliente_nombre' },
              { name: 'Fecha', key: 'fecha' },
              { name: 'Total', key: 'total' }
            ]}
            data={albaranes}
            isLoading={loading}
          />
        )}
        {activeTab === 'tickets' && (
          <TableComponent
            headers={[
              { name: 'ID', key: 'id' },
              { name: 'Cliente', key: 'cliente_nombre' },
              { name: 'Fecha', key: 'fecha' },
              { name: 'Total', key: 'total' }
            ]}
            data={tickets}
            isLoading={loading}
          />
        )}
      </div>
    </div>  
  );
}
