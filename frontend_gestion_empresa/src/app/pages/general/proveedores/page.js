"use client";

import { useState } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';

export default function ProveedoresPage() {
  const [proveedores] = useState([
    { id: 1, nombre: 'Proveedor A', telefono: '123456789', email: 'proveedora@example.com', ciudad: 'Madrid' },
    { id: 2, nombre: 'Proveedor B', telefono: '987654321', email: 'proveedorb@example.com', ciudad: 'Barcelona' },
    { id: 3, nombre: 'Proveedor C', telefono: '555666777', email: 'proveedorc@example.com', ciudad: 'Valencia' }
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Proveedores</h1>
        <Link href="/pages/general" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      <div className={styles.actionBar}>
        <Link href="/pages/general/proveedores/nuevo" className={styles.button}>
          Nuevo Proveedor
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Ciudad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((proveedor) => (
              <tr key={proveedor.id}>
                <td>{proveedor.id}</td>
                <td>{proveedor.nombre}</td>
                <td>{proveedor.telefono}</td>
                <td>{proveedor.email}</td>
                <td>{proveedor.ciudad}</td>
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
