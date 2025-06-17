"use client";

import { useState, useEffect } from 'react';
import { albaranesAPI, clientesAPI } from '@/app/services/api';
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

const IconConvert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

export default function TablaAlbaranes({ onNuevoClick, onEditClick }) {
  const [albaranes, setAlbaranes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAlbaranes = async () => {
      setLoading(true);
      try {
        const data = await albaranesAPI.getAll();
        
        // Obtener nombres de clientes para los albaranes
        const clientesData = await clientesAPI.getAll();
        const clientesMap = {};
        clientesData.forEach(cliente => {
          clientesMap[cliente.id] = cliente.nombre;
        });
        
        // Añadir nombres de clientes a los albaranes
        const albaranesConClientes = data.map(albaran => ({
          ...albaran,
          cliente_nombre: clientesMap[albaran.cliente] || 'Cliente desconocido',
          fecha_formateada: new Date(albaran.fecha).toLocaleDateString()
        }));
        
        setAlbaranes(albaranesConClientes);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar los albaranes:', err);
        setError('Error al cargar los albaranes');
        setLoading(false);
      }
    };

    fetchAlbaranes();
  }, []);

  const handleVerDetalle = (id) => {
    router.push(`/pages/ventas/albaranes/${id}`);
  };

  const handleConvertirAFactura = async (albaranId) => {
    let facturasAPIModule;
    if (!window.facturasAPI) {
      // Si facturasAPI no está disponible en el componente, importar de api.js
      facturasAPIModule = await import('@/app/services/api');
    }
    
    if (confirm('¿Está seguro de convertir este albarán en factura?')) {
      try {
        const apiToUse = window.facturasAPI || facturasAPIModule?.facturasAPI;
        await apiToUse.crearDesdeAlbaran(albaranId);
        alert('Albarán convertido a factura correctamente');
        // No es necesario recargar los albaranes ya que siguen existiendo
      } catch (error) {
        console.error('Error al convertir albarán a factura:', error);
        alert('Error al convertir albarán a factura');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este albarán?')) {
      try {
        await albaranesAPI.delete(id);
        setAlbaranes(albaranes.filter(albaran => albaran.id !== id));
      } catch (error) {
        console.error('Error al eliminar albarán:', error);
        alert('No se pudo eliminar el albarán');
      }
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  if (loading) return <div className={styles.loading}>Cargando albaranes...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2>Albaranes</h2>
        <button onClick={onNuevoClick} className={styles.actionButton}>Nuevo Albarán</button>
      </div>
      
      {albaranes.length > 0 ? (
        <div>
          <table className={styles.table}>
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th className={styles.actionColumn}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {albaranes.map(albaran => (
              <tr key={albaran.id}>
                <td>{albaran.id}</td>
                <td>{albaran.cliente_nombre}</td>
                <td>{albaran.fecha_formateada}</td>
                <td className={styles.moneyCell}>{formatCurrency(albaran.total)}</td>
                <td className={styles.actions}>
                  <button 
                    className={styles.actionIcon} 
                    onClick={() => handleVerDetalle(albaran.id)} 
                    title="Ver detalle"
                  >
                    <IconEye /> Ver
                  </button>
                  <button 
                    className={styles.actionIcon} 
                    onClick={() => onEditClick(albaran)} 
                    title="Editar"
                  >
                    <IconEdit /> Editar
                  </button>
                  <button 
                    className={styles.actionIcon} 
                    onClick={() => handleConvertirAFactura(albaran.id)} 
                    title="Convertir a factura"
                  >
                    <IconConvert /> A factura
                  </button>
                  <button 
                    className={styles.actionIcon} 
                    onClick={() => handleDelete(albaran.id)}
                    title="Eliminar"
                  >
                    <IconTrash /> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : (
        <div className={styles.emptyMessage}>
          No hay albaranes registrados. 
          <button className={styles.linkButton} onClick={onNuevoClick}>
            Crear albarán
          </button>
        </div>
      )}
    </div>
  );
}
