"use client";

import { useState, useEffect } from 'react';
import { articulosAPI } from '../../services/api';
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

export default function TablaArticulos({ onNuevoClick, onEditClick }) {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticulos();
  }, []);

  const fetchArticulos = async () => {
    setLoading(true);
    try {
      const data = await articulosAPI.getAll();
      setArticulos(data);
    } catch (error) {
      console.error('Error al cargar artículos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
      try {
        await articulosAPI.delete(id);
        setArticulos(articulos.filter(articulo => articulo.id !== id));
      } catch (error) {
        console.error('Error al eliminar artículo:', error);
        alert('Error al eliminar el artículo');
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando artículos...</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2>Lista de Artículos</h2>
        <button className={styles.actionButton} onClick={onNuevoClick}>
          Nuevo Artículo
        </button>
      </div>

      {articulos.length === 0 ? (
        <div className={styles.emptyMessage}>
          No hay artículos registrados
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {articulos.map((articulo) => (
                <tr key={articulo.id}>
                  <td>{articulo.codigo}</td>
                  <td>{articulo.nombre}</td>
                  <td>{articulo.categoria_nombre || '-'}</td>
                  <td>{articulo.marca_nombre || '-'}</td>
                  <td>{articulo.modelo || '-'}</td>
                  <td>{articulo.precio ? `${parseFloat(articulo.precio).toFixed(2)} €` : '-'}</td>
                  <td>{articulo.stock || 0}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.actionIcon}
                        onClick={() => onEditClick(articulo)}
                        title="Editar"
                      >
                        <IconEdit />
                      </button>
                      <button
                        className={styles.actionIcon}
                        onClick={() => handleDelete(articulo.id)}
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
