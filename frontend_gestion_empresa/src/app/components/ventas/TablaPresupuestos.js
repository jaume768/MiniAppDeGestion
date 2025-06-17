"use client";

import { useState, useEffect } from 'react';
import { presupuestosAPI, clientesAPI } from '@/app/services/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

const IconConvert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const IconPdf = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default function TablaPresupuestos({ onNuevoClick, onEditClick }) {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPresupuestos = async () => {
      setLoading(true);
      try {
        const data = await presupuestosAPI.getAll();
        
        // Obtener nombres de clientes para los presupuestos
        const clientesData = await clientesAPI.getAll();
        const clientesMap = {};
        clientesData.forEach(cliente => {
          clientesMap[cliente.id] = cliente.nombre;
        });
        
        // Añadir nombres de clientes a los presupuestos
        const presupuestosConClientes = data.map(presupuesto => ({
          ...presupuesto,
          cliente_nombre: clientesMap[presupuesto.cliente] || 'Cliente desconocido',
          fecha_formateada: new Date(presupuesto.fecha).toLocaleDateString()
        }));
        
        setPresupuestos(presupuestosConClientes);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar los presupuestos:', err);
        setError('Error al cargar los presupuestos');
        setLoading(false);
      }
    };

    fetchPresupuestos();
  }, []);

  const handleVerDetalle = (id) => {
    router.push(`/pages/ventas/presupuestos/${id}`);
  };

  const handleConvertirAPedido = async (presupuestoId) => {
    if (confirm('¿Está seguro de convertir este presupuesto en pedido?')) {
      try {
        await presupuestosAPI.convertirAPedido(presupuestoId);
        alert('Presupuesto convertido a pedido correctamente');
        // Recargar los presupuestos
        const data = await presupuestosAPI.getAll();
        setPresupuestos(data);
      } catch (error) {
        console.error('Error al convertir presupuesto a pedido:', error);
        alert('Error al convertir presupuesto a pedido');
      }
    }
  };

  const handleGenerarPDF = async (presupuestoId) => {
    try {
      const response = await presupuestosAPI.generarPDF(presupuestoId);
      // Abrir el PDF en una nueva ventana
      window.open(URL.createObjectURL(response), '_blank');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar PDF');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este presupuesto?')) {
      try {
        await presupuestosAPI.delete(id);
        setPresupuestos(presupuestos.filter(presupuesto => presupuesto.id !== id));
        alert('Presupuesto eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar presupuesto:', error);
        alert('Error al eliminar presupuesto');
      }
    }
  };

  if (loading) return <div className={styles.loading}>Cargando presupuestos...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2>Presupuestos</h2>
        <button onClick={onNuevoClick} className={styles.actionButton}>Nuevo Presupuesto</button>
      </div>
      
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {presupuestos.length === 0 ? (
            <tr>
              <td colSpan="5" className={styles.emptyMessage}>No hay presupuestos disponibles</td>
            </tr>
          ) : (
            presupuestos.map(presupuesto => (
              <tr key={presupuesto.id}>
                <td>{presupuesto.id}</td>
                <td>{presupuesto.cliente_nombre}</td>
                <td>{presupuesto.fecha_formateada}</td>
                <td>{presupuesto.total ? `${presupuesto.total} €` : '0.00 €'}</td>
                <td className={styles.actions}>
                  <button 
                    onClick={() => onEditClick(presupuesto)}
                    className={styles.actionIcon}
                  >
                    <IconEdit /> Editar
                  </button>
                  <button 
                    onClick={() => handleConvertirAPedido(presupuesto.id)}
                    className={styles.actionIcon}
                  >
                    <IconConvert /> A Pedido
                  </button>
                  <button 
                    onClick={() => handleGenerarPDF(presupuesto.id)}
                    className={styles.actionIcon}
                  >
                    <IconPdf /> PDF
                  </button>
                  <button 
                    onClick={() => handleDelete(presupuesto.id)}
                    className={styles.actionIcon}
                  >
                    <IconTrash /> Eliminar
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
