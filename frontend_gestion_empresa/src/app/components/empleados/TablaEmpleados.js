"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { empleadosAPI, departamentosAPI } from '../../services/api';
import styles from '../clientes/Tablas.module.css';

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

export default function TablaEmpleados({ onNuevoClick, onEditClick }) {
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empleadosData, departamentosData] = await Promise.all([
          empleadosAPI.getAll(),
          departamentosAPI.getAll()
        ]);
        
        // Convertir array de departamentos a un objeto para búsqueda más rápida
        const deptsMap = departamentosData.reduce((acc, dept) => {
          acc[dept.id] = dept.nombre;
          return acc;
        }, {});
        
        setEmpleados(empleadosData);
        setDepartamentos(deptsMap);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Eliminar empleado
  const eliminarEmpleado = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.')) return;
    
    try {
      await empleadosAPI.delete(id);
      setEmpleados(empleados.filter(empleado => empleado.id !== id));
      alert('Empleado eliminado correctamente');
    } catch (err) {
      console.error("Error al eliminar empleado:", err);
      setError("Error al eliminar el empleado. Por favor, intenta de nuevo.");
    }
  };

  if (loading) return <div className={styles.loading}>Cargando empleados...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2>Listado de empleados</h2>
        <button className={styles.actionButton} onClick={onNuevoClick}>
          Nuevo Empleado
        </button>
      </div>
      
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Cargo</th>
            <th>Departamento</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empleados.length === 0 ? (
            <tr>
              <td colSpan="7" className={styles.emptyMessage}>No hay empleados registrados</td>
            </tr>
          ) : (
            empleados.map(empleado => (
              <tr key={empleado.id}>
                <td>{empleado.id}</td>
                <td>{empleado.nombre}</td>
                <td>{empleado.cargo || '-'}</td>
                <td>{departamentos[empleado.departamento] || '-'}</td>
                <td>{empleado.email || '-'}</td>
                <td>{empleado.telefono || '-'}</td>
                <td className={styles.actions}>
                  <Link href={`/pages/general/empleados/${empleado.id}`} className={styles.actionIcon}>
                    <IconEye /> Ver
                  </Link>
                  <button 
                    onClick={() => onEditClick && onEditClick(empleado)}
                    className={styles.actionIcon}
                  >
                    <IconEdit /> Editar
                  </button>
                  <button
                    onClick={() => eliminarEmpleado(empleado.id)}
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
