"use client";

import { useState, useEffect } from 'react';
import { pedidosAPI, clientesAPI, facturasAPI } from '@/app/services/api';
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

export default function TablaPedidos({ onNuevoClick, onEditClick }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true);
      try {
        const data = await pedidosAPI.getAll();
        
        // Obtener nombres de clientes para los pedidos
        const clientesData = await clientesAPI.getAll();
        const clientesMap = {};
        clientesData.forEach(cliente => {
          clientesMap[cliente.id] = cliente.nombre;
        });
        
        // Añadir nombres de clientes a los pedidos
        const pedidosConClientes = data.map(pedido => ({
          ...pedido,
          cliente_nombre: clientesMap[pedido.cliente] || 'Cliente desconocido',
          fecha_formateada: new Date(pedido.fecha).toLocaleDateString()
        }));
        
        setPedidos(pedidosConClientes);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar los pedidos:', err);
        setError('Error al cargar los pedidos');
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  const handleVerDetalle = (id) => {
    router.push(`/pages/ventas/pedidos/${id}`);
  };

  const handleMarcarEntregado = async (pedidoId) => {
    if (confirm('¿Está seguro de marcar este pedido como entregado?')) {
      try {
        await pedidosAPI.marcarEntregado(pedidoId);
        alert('Pedido marcado como entregado correctamente');
        
        // Recargar los pedidos y procesar datos de cliente y fechas
        try {
          const data = await pedidosAPI.getAll();
          
          // Obtener nombres de clientes para los pedidos
          const clientesData = await clientesAPI.getAll();
          const clientesMap = {};
          clientesData.forEach(cliente => {
            clientesMap[cliente.id] = cliente.nombre;
          });
          
          // Añadir nombres de clientes a los pedidos y formatear fechas
          const pedidosConClientes = data.map(pedido => ({
            ...pedido,
            cliente_nombre: clientesMap[pedido.cliente] || 'Cliente desconocido',
            fecha_formateada: new Date(pedido.fecha).toLocaleDateString()
          }));
          
          setPedidos(pedidosConClientes);
        } catch (err) {
          console.error('Error al recargar los pedidos:', err);
        }
      } catch (error) {
        console.error('Error al marcar pedido como entregado:', error);
        alert('Error al marcar pedido como entregado');
      }
    }
  };

  const handleConvertirAFactura = async (pedidoId) => {
    if (confirm('¿Está seguro de convertir este pedido en factura?')) {
      try {
        await facturasAPI.crearDesdePedido(pedidoId);
        alert('Pedido convertido a factura correctamente');
        
        // Recargar los pedidos y procesar datos de cliente y fechas
        try {
          const data = await pedidosAPI.getAll();
          
          // Obtener nombres de clientes para los pedidos
          const clientesData = await clientesAPI.getAll();
          const clientesMap = {};
          clientesData.forEach(cliente => {
            clientesMap[cliente.id] = cliente.nombre;
          });
          
          // Añadir nombres de clientes a los pedidos y formatear fechas
          const pedidosConClientes = data.map(pedido => ({
            ...pedido,
            cliente_nombre: clientesMap[pedido.cliente] || 'Cliente desconocido',
            fecha_formateada: new Date(pedido.fecha).toLocaleDateString()
          }));
          
          setPedidos(pedidosConClientes);
        } catch (err) {
          console.error('Error al recargar los pedidos:', err);
        }
      } catch (error) {
        console.error('Error al convertir pedido a factura:', error);
        alert('Error al convertir pedido a factura');
      }
    }
  };

  const handleGenerarPDF = async (id) => {
    try {
      // Esta función se implementará cuando esté lista la API para generar PDFs
      alert('Función de generar PDF en desarrollo');
      // Ejemplo de cómo sería: await pedidosAPI.generarPDF(id);
    } catch (error) {
      console.error('Error al generar PDF del pedido:', error);
      alert('Error al generar PDF');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este pedido?')) {
      try {
        await pedidosAPI.delete(id);
        setPedidos(pedidos.filter(pedido => pedido.id !== id));
        alert('Pedido eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar pedido:', error);
        alert('Error al eliminar pedido');
      }
    }
  };

  if (loading) return <div className={styles.loading}>Cargando pedidos...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2>Pedidos</h2>
        <button onClick={onNuevoClick} className={styles.actionButton}>Nuevo Pedido</button>
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
          {pedidos.length === 0 ? (
            <tr>
              <td colSpan="6" className={styles.emptyMessage}>No hay pedidos disponibles</td>
            </tr>
          ) : (
            pedidos.map(pedido => (
              <tr key={pedido.id} className={pedido.is_facturado ? styles.facturadoRow : ''}>
                <td>{pedido.id}</td>
                <td>{pedido.cliente_nombre}</td>
                <td>{pedido.fecha_formateada}</td>
                <td>{pedido.total ? `${pedido.total} €` : '0.00 €'}</td>
                <td>
                  {pedido.estado}
                  {pedido.is_facturado && (
                    <span className={styles.facturadoTag}>Facturado</span>
                  )}
                </td>
                <td className={styles.actions}>
                  {/* Botón Editar - Oculto si ya está facturado */}
                  {!pedido.is_facturado && (
                    <button 
                      onClick={() => onEditClick(pedido)}
                      className={styles.actionIcon}
                    >
                      <IconEdit /> Editar
                    </button>
                  )}
                  
                  {/* Botón Entregar - Visible siempre, pero disabled si está entregado */}
                  <button 
                    onClick={() => handleMarcarEntregado(pedido.id)}
                    className={styles.actionIcon}
                    disabled={pedido.estado === 'Entregado' || pedido.is_facturado}
                  >
                    <IconEye /> Entregar
                  </button>
                  
                  {/* Botón A Factura - Oculto si ya está facturado */}
                  {!pedido.is_facturado && (
                    <button 
                      onClick={() => handleConvertirAFactura(pedido.id)}
                      className={styles.actionIcon}
                    >
                      <IconConvert /> A Factura
                    </button>
                  )}
                  
                  {/* Botón PDF - Siempre visible */}
                  <button 
                    onClick={() => handleGenerarPDF(pedido.id)}
                    className={styles.actionIcon}
                  >
                    <IconPdf /> PDF
                  </button>
                  
                  {/* Botón Eliminar - Oculto si ya está facturado */}
                  {!pedido.is_facturado && (
                    <button 
                      onClick={() => handleDelete(pedido.id)}
                      className={styles.actionIcon}
                    >
                      <IconTrash /> Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
