"use client";

import { useState } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';

export default function MarcasPage() {
  const [marcas] = useState([
    { id: 1, nombre: 'Apple', pais: 'Estados Unidos', website: 'apple.com' },
    { id: 2, nombre: 'Samsung', pais: 'Corea del Sur', website: 'samsung.com' },
    { id: 3, nombre: 'HP', pais: 'Estados Unidos', website: 'hp.com' },
    { id: 4, nombre: 'Lenovo', pais: 'China', website: 'lenovo.com' }
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Marcas</h1>
        <Link href="/pages/articulos" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      <div className={styles.actionBar}>
        <Link href="/pages/articulos/marcas/nueva" className={styles.button}>
          Nueva Marca
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>País</th>
              <th>Website</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {marcas.map((marca) => (
              <tr key={marca.id}>
                <td>{marca.id}</td>
                <td>{marca.nombre}</td>
                <td>{marca.pais}</td>
                <td>{marca.website}</td>
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
