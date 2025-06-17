"use client";

import { useState, useEffect } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';
import { articulosAPI } from '../../../services/api';

export default function ArticulosListPage() {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticulos = async () => {
      try {
        const data = await articulosAPI.getAll();
        setArticulos(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar artículos: ' + err.message);
        setLoading(false);
      }
    };

    fetchArticulos();
  }, []);

  if (loading) return <div className={styles.loading}>Cargando artículos...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Artículos</h1>
        <Link href="/pages/articulos" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      <div className={styles.actionBar}>
        <Link href="/pages/articulos/articulos/nuevo" className={styles.button}>
          Nuevo Artículo
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((articulo) => (
              <tr key={articulo.id}>
                <td>{articulo.id}</td>
                <td>{articulo.nombre}</td>
                <td>{articulo.descripcion}</td>
                <td>{parseFloat(articulo.precio).toFixed(2)} €</td>
                <td>{articulo.stock}</td>
                <td>{articulo.categoria?.nombre || 'Sin categoría'}</td>
                <td className={styles.actions}>
                  <button className={styles.actionButton}>Ver</button>
                  <button className={styles.actionButton}>Editar</button>
                  <button className={styles.actionButton}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
