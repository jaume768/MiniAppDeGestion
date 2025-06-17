"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from '../section.module.css';

export default function GeneralPage() {
  const [activeTab, setActiveTab] = useState('clientes');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>General</h1>
      </div>

      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'clientes' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('clientes')}
          >
            Clientes
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'empleados' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('empleados')}
          >
            Empleados
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'proveedores' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('proveedores')}
          >
            Proveedores
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'codigos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('codigos')}
          >
            Códigos Postales
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'clientes' && (
            <div className={styles.tabPanel}>
              <div className={styles.actionButtons}>
                <Link href="/pages/general/clientes" className={styles.button}>
                  Ver Clientes
                </Link>
                <Link href="/pages/general/clientes/nuevo" className={styles.button}>
                  Nuevo Cliente
                </Link>
              </div>
              <p>Administra tus clientes y su información de contacto.</p>
            </div>
          )}

          {activeTab === 'empleados' && (
            <div className={styles.tabPanel}>
              <div className={styles.actionButtons}>
                <Link href="/pages/general/empleados" className={styles.button}>
                  Ver Empleados
                </Link>
                <Link href="/pages/general/empleados/nuevo" className={styles.button}>
                  Nuevo Empleado
                </Link>
              </div>
              <p>Gestiona la información de empleados y departamentos.</p>
            </div>
          )}

          {activeTab === 'proveedores' && (
            <div className={styles.tabPanel}>
              <div className={styles.actionButtons}>
                <Link href="/pages/general/proveedores" className={styles.button}>
                  Ver Proveedores
                </Link>
                <Link href="/pages/general/proveedores/nuevo" className={styles.button}>
                  Nuevo Proveedor
                </Link>
              </div>
              <p>Administra tus proveedores y sus datos de contacto.</p>
            </div>
          )}

          {activeTab === 'codigos' && (
            <div className={styles.tabPanel}>
              <div className={styles.actionButtons}>
                <Link href="/pages/general/codigos_postales" className={styles.button}>
                  Ver Códigos Postales
                </Link>
                <Link href="/pages/general/codigos_postales/nuevo" className={styles.button}>
                  Nuevo Código Postal
                </Link>
              </div>
              <p>Gestiona los códigos postales y áreas geográficas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
