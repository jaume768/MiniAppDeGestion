"use client";

import { useState } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';

export default function ModelosPage() {
  const [modelos] = useState([
    { id: 1, nombre: 'iPhone 15', marca: 'Apple', categoria: 'Smartphones', año: 2023 },
    { id: 2, nombre: 'Galaxy S23', marca: 'Samsung', categoria: 'Smartphones', año: 2023 },
    { id: 3, nombre: 'Pavilion 15', marca: 'HP', categoria: 'Portátiles', año: 2022 },
    { id: 4, nombre: 'ThinkPad X1', marca: 'Lenovo', categoria: 'Portátiles', año: 2023 }
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Modelos</h1>
        <Link href="/pages/articulos" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      <div className={styles.actionBar}>
        <Link href="/pages/articulos/modelos/nuevo" className={styles.button}>
          Nuevo Modelo
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Categoría</th>
              <th>Año</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {modelos.map((modelo) => (
              <tr key={modelo.id}>
                <td>{modelo.id}</td>
                <td>{modelo.nombre}</td>
                <td>{modelo.marca}</td>
                <td>{modelo.categoria}</td>
                <td>{modelo.año}</td>
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
