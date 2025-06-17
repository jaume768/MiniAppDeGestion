"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { clientesAPI } from '../../services/api';
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

export default function TablaClientes({ onNuevoClick, onEditClick }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar clientes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const clientesData = await clientesAPI.getAll();
        setClientes(clientesData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar clientes:", err);
        setError("Error al cargar los clientes. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Eliminar cliente
  const eliminarCliente = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) return;
    
    try {
      await clientesAPI.delete(id);
      setClientes(clientes.filter(cliente => cliente.id !== id));
      alert('Cliente eliminado correctamente');
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      setError("Error al eliminar el cliente. Por favor, intenta de nuevo.");
    }
  };

  if (loading) return <div className={styles.loading}>Cargando clientes...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2>Listado de clientes</h2>
        <button className={styles.actionButton} onClick={onNuevoClick}>
          Nuevo Cliente
        </button>
      </div>
      
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>CIF/NIF</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.length === 0 ? (
            <tr>
              <td colSpan="6" className={styles.emptyMessage}>No hay clientes registrados</td>
            </tr>
          ) : (
            clientes.map(cliente => (
              <tr key={cliente.id}>
                <td>{cliente.id}</td>
                <td>{cliente.nombre}</td>
                <td>{cliente.email || '-'}</td>
                <td>{cliente.telefono || '-'}</td>
                <td>{cliente.cif || '-'}</td>
                <td className={styles.actions}>
                  <Link href={`/pages/general/clientes/${cliente.id}`} className={styles.actionIcon}>
                    <IconEye /> Ver
                  </Link>
                  <button 
                    onClick={() => onEditClick && onEditClick(cliente)}
                    className={styles.actionIcon}
                  >
                    <IconEdit /> Editar
                  </button>
                  <button
                    onClick={() => eliminarCliente(cliente.id)}
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
