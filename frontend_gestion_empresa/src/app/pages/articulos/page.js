"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from '../section.module.css';

export default function ArticulosPage() {
  const [activeTab, setActiveTab] = useState('articulos');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Artículos</h1>
      </div>

      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'marcas' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('marcas')}
          >
            Marcas
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'modelos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('modelos')}
          >
            Modelos
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'articulos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('articulos')}
          >
            Artículos
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'marcas' && (
            <div className={styles.tabPanel}>
              <div className={styles.actionButtons}>
                <Link href="/pages/articulos/marcas" className={styles.button}>
                  Ver Marcas
                </Link>
                <Link href="/pages/articulos/marcas/nueva" className={styles.button}>
                  Nueva Marca
                </Link>
              </div>
              <p>Administra las marcas de productos disponibles en el catálogo.</p>
            </div>
          )}

          {activeTab === 'modelos' && (
            <div className={styles.tabPanel}>
              <div className={styles.actionButtons}>
                <Link href="/pages/articulos/modelos" className={styles.button}>
                  Ver Modelos
                </Link>
                <Link href="/pages/articulos/modelos/nuevo" className={styles.button}>
                  Nuevo Modelo
                </Link>
              </div>
              <p>Gestiona los diferentes modelos de productos por marca.</p>
            </div>
          )}

          {activeTab === 'articulos' && (
            <div className={styles.tabPanel}>
              <div className={styles.actionButtons}>
                <Link href="/pages/articulos/articulos" className={styles.button}>
                  Ver Artículos
                </Link>
                <Link href="/pages/articulos/articulos/nuevo" className={styles.button}>
                  Nuevo Artículo
                </Link>
              </div>
              <p>Administra tu catálogo completo de artículos y productos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
