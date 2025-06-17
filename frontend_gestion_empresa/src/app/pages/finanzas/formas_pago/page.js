"use client";

import { useState } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';

export default function FormasPagoPage() {
  const [formasPago] = useState([
    { id: 1, nombre: 'Efectivo', plazo: 0, descripcion: 'Pago inmediato en efectivo' },
    { id: 2, nombre: 'Tarjeta', plazo: 0, descripcion: 'Pago con tarjeta de crédito/débito' },
    { id: 3, nombre: 'Transferencia', plazo: 1, descripcion: 'Transferencia bancaria' },
    { id: 4, nombre: '30 días', plazo: 30, descripcion: 'Pago a 30 días fecha factura' }
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Formas de Pago</h1>
        <Link href="/pages/finanzas" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      <div className={styles.actionBar}>
        <Link href="/pages/finanzas/formas_pago/nueva" className={styles.button}>
          Nueva Forma de Pago
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Plazo (días)</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {formasPago.map((forma) => (
              <tr key={forma.id}>
                <td>{forma.id}</td>
                <td>{forma.nombre}</td>
                <td>{forma.plazo}</td>
                <td>{forma.descripcion}</td>
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
