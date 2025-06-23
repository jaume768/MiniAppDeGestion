"use client";

import { useState, useEffect } from 'react';
import { categoriasAPI } from '../../services/api';
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

export default function TablaCategorias({ onNuevoClick, onEditClick }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const data = await categoriasAPI.getAll();
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await categoriasAPI.delete(id);
        setCategorias(categorias.filter(categoria => categoria.id !== id));
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        alert('Error al eliminar la categoría');
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando categorías...</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2>Lista de Categorías</h2>
        <button className={styles.actionButton} onClick={onNuevoClick}>
          Nueva Categoría
        </button>
      </div>

      {categorias.length === 0 ? (
        <div className={styles.emptyMessage}>
          No hay categorías registradas
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td>{categoria.nombre}</td>
                  <td>{categoria.descripcion || '-'}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.actionIcon}
                        onClick={() => onEditClick(categoria)}
                        title="Editar"
                      >
                        <IconEdit />
                      </button>
                      <button
                        className={styles.actionIcon}
                        onClick={() => handleDelete(categoria.id)}
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
