"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pedidosAPI, presupuestosAPI, facturasAPI } from '../../services/api';
import styles from './ventas.module.css';

// SVG Icons
const IconFileInvoice = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconFileContract = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconReceipt = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
  </svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export default function VentasPage() {
  const [resumen, setResumen] = useState({
    presupuestos: { total: 0, recientes: [] },
    pedidos: { total: 0, pendientes: 0, recientes: [] },
    facturas: { total: 0, pendientesPago: 0, recientes: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar datos de todas las entidades de ventas
        const [presupuestos, pedidos, facturas] = await Promise.all([
          presupuestosAPI.getAll(),
          pedidosAPI.getAll(),
          facturasAPI.getAll()
        ]);
        
        // Calcular estadísticas
        const pedidosPendientes = pedidos.filter(p => !p.entregado);
        const facturasPendientes = facturas.filter(f => !f.pagada);
        
        // Ordenar por fecha (más reciente primero) y tomar los 3 primeros
        const ordenarPorFecha = (a, b) => new Date(b.fecha) - new Date(a.fecha);
        const presupuestosRecientes = [...presupuestos].sort(ordenarPorFecha).slice(0, 3);
        const pedidosRecientes = [...pedidos].sort(ordenarPorFecha).slice(0, 3);
        const facturasRecientes = [...facturas].sort(ordenarPorFecha).slice(0, 3);
        
        setResumen({
          presupuestos: { 
            total: presupuestos.length, 
            recientes: presupuestosRecientes 
          },
          pedidos: { 
            total: pedidos.length, 
            pendientes: pedidosPendientes.length,
            recientes: pedidosRecientes 
          },
          facturas: { 
            total: facturas.length, 
            pendientesPago: facturasPendientes.length,
            recientes: facturasRecientes 
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div>
      <div className="page-header mb-4">
        <h2>Panel de Ventas</h2>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando información...</span>
          </div>
        </div>
      ) : (
        <div>
          <div className="row g-4">
            {/* Tarjeta de Presupuestos */}
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h3 className="h5 mb-0 d-flex align-items-center">
                    <IconFileContract className="me-2" /> Presupuestos
                  </h3>
                  <Link href="/pages/ventas/presupuestos" className="btn btn-sm btn-link">
                    Ver todos
                  </Link>
                </div>
                <div className="card-body">
                  <div className="stats mb-4 p-3 bg-light rounded">
                    <div className="stat-item">
                      <span className="text-muted">Total:</span>
                      <span className="h4 ms-2">{resumen.presupuestos.total}</span>
                    </div>
                  </div>
                  
                  <h4 className="h6 mb-3">Presupuestos recientes</h4>
                  {resumen.presupuestos.recientes.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {resumen.presupuestos.recientes.map(presupuesto => (
                        <li key={presupuesto.id} className="list-group-item px-0">
                          <Link href={`/pages/ventas/presupuestos/${presupuesto.id}`} className="text-decoration-none d-flex justify-content-between align-items-center">
                            <div>
                              <span className="fw-medium d-block text-primary">
                                #{presupuesto.id} - {presupuesto.cliente_nombre || `Cliente ID: ${presupuesto.cliente}`}
                              </span>
                              <small className="text-muted">
                                {new Date(presupuesto.fecha).toLocaleDateString()}
                              </small>
                            </div>
                            <span className="badge bg-primary rounded-pill">
                              {presupuesto.total}€
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted fst-italic">No hay presupuestos recientes</p>
                  )}
                </div>
                <div className="card-footer">
                  <Link href="/pages/ventas/presupuestos" className="btn btn-primary w-100">
                    <IconPlus className="me-1" /> Nuevo Presupuesto
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Tarjeta de Pedidos */}
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h3 className="h5 mb-0 d-flex align-items-center">
                    <IconReceipt className="me-2" /> Pedidos
                  </h3>
                  <Link href="/pages/ventas/pedidos" className="btn btn-sm btn-link">
                    Ver todos
                  </Link>
                </div>
                <div className="card-body">
                  <div className="stats mb-4 p-3 bg-light rounded d-flex justify-content-around">
                    <div className="stat-item text-center">
                      <span className="text-muted d-block">Total</span>
                      <span className="h4">{resumen.pedidos.total}</span>
                    </div>
                    <div className="stat-item text-center">
                      <span className="text-muted d-block">Pendientes</span>
                      <span className={`h4 ${resumen.pedidos.pendientes > 0 ? 'text-danger' : ''}`}>
                        {resumen.pedidos.pendientes}
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="h6 mb-3">Pedidos recientes</h4>
                  {resumen.pedidos.recientes.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {resumen.pedidos.recientes.map(pedido => (
                        <li key={pedido.id} className="list-group-item px-0">
                          <Link href={`/pages/ventas/pedidos/${pedido.id}`} className="text-decoration-none d-flex justify-content-between align-items-center">
                            <div>
                              <span className="fw-medium d-block text-primary">
                                #{pedido.id} - {pedido.cliente_nombre || `Cliente ID: ${pedido.cliente}`}
                              </span>
                              <span className="badge mt-1 me-1 ${pedido.entregado ? 'bg-success' : 'bg-warning'}">
                                {pedido.entregado ? 'Entregado' : 'Pendiente'}
                              </span>
                            </div>
                            <span className="badge bg-primary rounded-pill">
                              {pedido.total}€
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted fst-italic">No hay pedidos recientes</p>
                  )}
                </div>
                <div className="card-footer">
                  <Link href="/pages/ventas/pedidos" className="btn btn-primary w-100">
                    <IconPlus className="me-1" /> Nuevo Pedido
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Tarjeta de Facturas */}
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h3 className="h5 mb-0 d-flex align-items-center">
                    <IconFileInvoice className="me-2" /> Facturas
                  </h3>
                  <Link href="/pages/ventas/facturas" className="btn btn-sm btn-link">
                    Ver todas
                  </Link>
                </div>
                <div className="card-body">
                  <div className="stats mb-4 p-3 bg-light rounded d-flex justify-content-around">
                    <div className="stat-item text-center">
                      <span className="text-muted d-block">Total</span>
                      <span className="h4">{resumen.facturas.total}</span>
                    </div>
                    <div className="stat-item text-center">
                      <span className="text-muted d-block">Pendientes</span>
                      <span className={`h4 ${resumen.facturas.pendientesPago > 0 ? 'text-danger' : ''}`}>
                        {resumen.facturas.pendientesPago}
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="h6 mb-3">Facturas recientes</h4>
                  {resumen.facturas.recientes.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {resumen.facturas.recientes.map(factura => (
                        <li key={factura.id} className="list-group-item px-0">
                          <Link href={`/pages/ventas/facturas/${factura.id}`} className="text-decoration-none d-flex justify-content-between align-items-center">
                            <div>
                              <span className="fw-medium d-block text-primary">
                                #{factura.id} - {factura.cliente_nombre || `Cliente ID: ${factura.cliente}`}
                              </span>
                              <span className="badge mt-1 me-1 ${factura.pagada ? 'bg-success' : 'bg-warning'}">
                                {factura.pagada ? 'Pagada' : 'Pendiente'}
                              </span>
                            </div>
                            <span className="badge bg-primary rounded-pill">
                              {factura.total}€
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted fst-italic">No hay facturas recientes</p>
                  )}
                </div>
                <div className="card-footer">
                  <Link href="/pages/ventas/facturas" className="btn btn-primary w-100">
                    <IconPlus className="me-1" /> Nueva Factura
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
