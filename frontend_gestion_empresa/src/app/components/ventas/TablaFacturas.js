"use client";

import { useState, useEffect } from 'react';
import { facturasAPI, clientesAPI } from '@/app/services/api';
import { useRouter } from 'next/navigation';
import styles from './Tablas.module.css';

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

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconPdf = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function TablaFacturas({ onNuevoClick, onEditClick }) {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFacturas = async () => {
      setLoading(true);
      try {
        const data = await facturasAPI.getAll();
        
        // Obtener nombres de clientes para las facturas
        const clientesData = await clientesAPI.getAll();
        const clientesMap = {};
        clientesData.forEach(cliente => {
          clientesMap[cliente.id] = cliente.nombre;
        });
        
        // Añadir nombres de clientes a las facturas
        const facturasConClientes = data.map(factura => ({
          ...factura,
          cliente_nombre: clientesMap[factura.cliente] || 'Cliente desconocido',
          fecha_formateada: new Date(factura.fecha).toLocaleDateString()
        }));
        
        setFacturas(facturasConClientes);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar las facturas:', err);
        setError('Error al cargar las facturas');
        setLoading(false);
      }
    };

    fetchFacturas();
  }, []);

  const handleVerDetalle = (id) => {
    router.push(`/pages/ventas/facturas/${id}`);
  };

  const handleMarcarPagada = async (facturaId) => {
    if (confirm('¿Está seguro de marcar esta factura como pagada?')) {
      try {
        await facturasAPI.marcarPagada(facturaId);
        alert('Factura marcada como pagada correctamente');
        // Recargar las facturas
        const data = await facturasAPI.getAll();
        setFacturas(data);
      } catch (error) {
        console.error('Error al marcar factura como pagada:', error);
        alert('Error al marcar factura como pagada');
      }
    }
  };

  const handleGenerarPDF = async (facturaId) => {
    try {
      const response = await facturasAPI.generarPDF(facturaId);
      // Abrir el PDF en una nueva ventana
      window.open(URL.createObjectURL(response), '_blank');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar PDF');
    }
  };

  // Las facturas no se pueden eliminar

  if (loading) return <div className={styles.loading}>Cargando facturas...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2>Facturas</h2>
        <button onClick={onNuevoClick} className={styles.actionButton}>Nueva Factura</button>
      </div>
      
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {facturas.length === 0 ? (
            <tr>
              <td colSpan="6" className={styles.emptyMessage}>No hay facturas disponibles</td>
            </tr>
          ) : (
            facturas.map(factura => (
              <tr key={factura.id}>
                <td>{factura.id}</td>
                <td>{factura.cliente_nombre}</td>
                <td>{factura.fecha_formateada}</td>
                <td>{factura.total ? `${factura.total} €` : '0.00 €'}</td>
                <td>{factura.estado}</td>
                <td className={styles.actions}>
                  <button 
                    onClick={() => handleMarcarPagada(factura.id)}
                    className={styles.actionIcon}
                    disabled={factura.estado === 'Pagada'}
                  >
                    <IconCheck /> Pagada
                  </button>
                  <button 
                    onClick={() => handleGenerarPDF(factura.id)}
                    className={styles.actionIcon}
                  >
                    <IconPdf /> PDF
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
