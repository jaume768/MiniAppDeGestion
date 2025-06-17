"use client";

import { useState } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';

export default function BancosPage() {
  const [bancos] = useState([
    { id: 1, nombre: 'Banco Santander', codigo: 'BSCHESMMXXX', bic: 'BSCHESMM', swift: 'BSCHESMMXXX' },
    { id: 2, nombre: 'BBVA', codigo: 'BBVAESMMXXX', bic: 'BBVAESMM', swift: 'BBVAESMMXXX' },
    { id: 3, nombre: 'CaixaBank', codigo: 'CAIXESBBXXX', bic: 'CAIXESBB', swift: 'CAIXESBBXXX' },
    { id: 4, nombre: 'Sabadell', codigo: 'BSABESBBXXX', bic: 'BSABESBB', swift: 'BSABESBBXXX' }
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bancos</h1>
        <Link href="/pages/finanzas" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      <div className={styles.actionBar}>
        <Link href="/pages/finanzas/bancos/nuevo" className={styles.button}>
          Nuevo Banco
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Código</th>
              <th>BIC</th>
              <th>SWIFT</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bancos.map((banco) => (
              <tr key={banco.id}>
                <td>{banco.id}</td>
                <td>{banco.nombre}</td>
                <td>{banco.codigo}</td>
                <td>{banco.bic}</td>
                <td>{banco.swift}</td>
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
