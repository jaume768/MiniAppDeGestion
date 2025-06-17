"use client";

import { useState } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';

export default function SeriesFacturacionPage() {
  const [series] = useState([
    { id: 1, codigo: 'A', descripcion: 'Serie A - Facturas nacionales', contador: 124 },
    { id: 2, codigo: 'B', descripcion: 'Serie B - Facturas internacionales', contador: 47 },
    { id: 3, codigo: 'R', descripcion: 'Serie R - Facturas rectificativas', contador: 8 },
    { id: 4, codigo: 'P', descripcion: 'Serie P - Facturas proforma', contador: 56 }
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Series de Facturación</h1>
        <Link href="/pages/finanzas" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      <div className={styles.actionBar}>
        <Link href="/pages/finanzas/series_facturacion/nueva" className={styles.button}>
          Nueva Serie
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Descripción</th>
              <th>Contador</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {series.map((serie) => (
              <tr key={serie.id}>
                <td>{serie.id}</td>
                <td>{serie.codigo}</td>
                <td>{serie.descripcion}</td>
                <td>{serie.contador}</td>
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
