"use client";

import { useState, useEffect } from 'react';
import { ticketsAPI, clientesAPI } from '@/app/services/api';
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

export default function TablaTickets({ onNuevoClick, onEditClick }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const data = await ticketsAPI.getAll();
        
        // Obtener nombres de clientes para los tickets
        const clientesData = await clientesAPI.getAll();
        const clientesMap = {};
        clientesData.forEach(cliente => {
          clientesMap[cliente.id] = cliente.nombre;
        });
        
        // Añadir nombres de clientes a los tickets
        const ticketsConClientes = data.map(ticket => ({
          ...ticket,
          cliente_nombre: clientesMap[ticket.cliente] || 'Cliente desconocido',
          fecha_formateada: new Date(ticket.fecha).toLocaleDateString()
        }));
        
        setTickets(ticketsConClientes);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar los tickets:', err);
        setError('Error al cargar los tickets');
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleVerDetalle = (id) => {
    router.push(`/pages/ventas/tickets/${id}`);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este ticket?')) {
      try {
        await ticketsAPI.delete(id);
        setTickets(tickets.filter(ticket => ticket.id !== id));
        alert('Ticket eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar ticket:', error);
        alert('Error al eliminar ticket');
      }
    }
  };

  const handleGenerarPDF = async (ticketId) => {
    try {
      // Esta función se implementará cuando esté lista la API para generar PDFs
      alert('Función de generar PDF en desarrollo');
      // Ejemplo de cómo sería: await ticketsAPI.generarPDF(ticketId);
    } catch (error) {
      console.error('Error al generar PDF del ticket:', error);
      alert('Error al generar PDF');
    }
  };

  if (loading) return <div className={styles.loading}>Cargando tickets...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2>Tickets</h2>
        <button onClick={onNuevoClick} className={styles.actionButton}>Nuevo Ticket</button>
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
          {tickets.length === 0 ? (
            <tr>
              <td colSpan="5" className={styles.emptyMessage}>No hay tickets disponibles</td>
            </tr>
          ) : (
            tickets.map(ticket => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>{ticket.cliente_nombre}</td>
                <td>{ticket.fecha_formateada}</td>
                <td>{ticket.total ? `${ticket.total} €` : '0.00 €'}</td>
                <td className={styles.actions}>
                  <button 
                    onClick={() => onEditClick(ticket)}
                    className={styles.actionIcon}
                  >
                    <IconEdit /> Editar
                  </button>
                  <button 
                    onClick={() => handleGenerarPDF(ticket.id)}
                    className={styles.actionIcon}
                  >
                    <IconPdf /> PDF
                  </button>
                  <button 
                    onClick={() => handleDelete(ticket.id)}
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
