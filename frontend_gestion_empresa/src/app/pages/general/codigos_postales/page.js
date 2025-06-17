"use client";

import { useState } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';

export default function CodigosPostalesPage() {
  const [codigosPostales] = useState([
    { id: 1, codigo: '28001', poblacion: 'Madrid', provincia: 'Madrid' },
    { id: 2, codigo: '08001', poblacion: 'Barcelona', provincia: 'Barcelona' },
    { id: 3, codigo: '46001', poblacion: 'Valencia', provincia: 'Valencia' },
    { id: 4, codigo: '41001', poblacion: 'Sevilla', provincia: 'Sevilla' }
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Códigos Postales</h1>
        <Link href="/pages/general" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      <div className={styles.actionBar}>
        <Link href="/pages/general/codigos_postales/nuevo" className={styles.button}>
          Nuevo Código Postal
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Población</th>
              <th>Provincia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {codigosPostales.map((cp) => (
              <tr key={cp.id}>
                <td>{cp.id}</td>
                <td>{cp.codigo}</td>
                <td>{cp.poblacion}</td>
                <td>{cp.provincia}</td>
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
