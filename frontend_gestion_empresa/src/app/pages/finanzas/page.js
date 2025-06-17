"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from '../section.module.css';

export default function FinanzasPage() {
  const [activeTab, setActiveTab] = useState('formas_pago');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Finanzas</h1>
      </div>

      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'formas_pago' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('formas_pago')}
          >
            Formas de Pago
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'series' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('series')}
          >
            Series de Facturación
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'bancos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('bancos')}
          >
            Bancos
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'formas_pago' && (
            <div className={styles.tabPanel}>
              <div className={styles.actionButtons}>
                <Link href="/pages/finanzas/formas_pago" className={styles.button}>
                  Ver Formas de Pago
                </Link>
                <Link href="/pages/finanzas/formas_pago/nueva" className={styles.button}>
                  Nueva Forma de Pago
                </Link>
              </div>
              <p>Gestiona las diferentes formas de pago disponibles para clientes.</p>
            </div>
          )}

          {activeTab === 'series' && (
            <div className={styles.tabPanel}>
              <div className={styles.actionButtons}>
                <Link href="/pages/finanzas/series_facturacion" className={styles.button}>
                  Ver Series
                </Link>
                <Link href="/pages/finanzas/series_facturacion/nueva" className={styles.button}>
                  Nueva Serie
                </Link>
              </div>
              <p>Administra las series de facturación para diferentes tipos de documentos.</p>
            </div>
          )}

          {activeTab === 'bancos' && (
            <div className={styles.tabPanel}>
              <div className={styles.actionButtons}>
                <Link href="/pages/finanzas/bancos" className={styles.button}>
                  Ver Bancos
                </Link>
                <Link href="/pages/finanzas/bancos/nuevo" className={styles.button}>
                  Nuevo Banco
                </Link>
              </div>
              <p>Gestiona los bancos y entidades financieras con las que trabajas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
