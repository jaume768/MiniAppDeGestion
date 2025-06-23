"use client";

import { useState, useEffect } from 'react';
import { marcasAPI } from '../../services/api';
import styles from './Tablas.module.css';

// Iconos SVG
const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 0-2v-7"/>
    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

export default function TablaMarcas({ onNuevoClick, onEditClick }) {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarcas();
  }, []);

  const fetchMarcas = async () => {
    setLoading(true);
    try {
      const data = await marcasAPI.getAll();
      setMarcas(data);
    } catch (error) {
      console.error('Error al cargar marcas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta marca?')) {
      try {
        await marcasAPI.delete(id);
        setMarcas(marcas.filter(marca => marca.id !== id));
      } catch (error) {
        console.error('Error al eliminar marca:', error);
        alert('Error al eliminar la marca');
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando marcas...</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2>Lista de Marcas</h2>
        <button className={styles.actionButton} onClick={onNuevoClick}>
          Nueva Marca
        </button>
      </div>

      {marcas.length === 0 ? (
        <div className={styles.emptyMessage}>
          No hay marcas registradas
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>País de Origen</th>
                <th>Artículos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {marcas.map((marca) => (
                <tr key={marca.id}>
                  <td>{marca.nombre}</td>
                  <td>{marca.descripcion || '-'}</td>
                  <td>{marca.pais_origen || '-'}</td>
                  <td>{marca.articulos_count || 0}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.actionIcon}
                        onClick={() => onEditClick(marca)}
                        title="Editar"
                      >
                        <IconEdit />
                      </button>
                      <button
                        className={styles.actionIcon}
                        onClick={() => handleDelete(marca.id)}
                        title="Eliminar"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
