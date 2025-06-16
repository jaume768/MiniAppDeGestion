"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './ventas.module.css';

export default function VentasLayout({ children }) {
  const pathname = usePathname();

  const isActive = (path) => pathname.includes(path);

  return (
    <div className={styles.ventasContainer}>
      <div className={styles.ventasHeader}>
        <h1>Gestión de Ventas</h1>
        <div className={styles.ventasTabs}>
          <Link 
            href="/pages/ventas/presupuestos" 
            className={`${styles.tabLink} ${isActive('presupuestos') ? styles.activeTab : ''}`}
          >
            Presupuestos
          </Link>
          <Link 
            href="/pages/ventas/pedidos" 
            className={`${styles.tabLink} ${isActive('pedidos') ? styles.activeTab : ''}`}
          >
            Pedidos
          </Link>
          <Link 
            href="/pages/ventas/facturas" 
            className={`${styles.tabLink} ${isActive('facturas') ? styles.activeTab : ''}`}
          >
            Facturas
          </Link>
          <Link 
            href="/pages/ventas/albaranes" 
            className={`${styles.tabLink} ${isActive('albaranes') ? styles.activeTab : ''}`}
          >
            Albaranes
          </Link>
          <Link 
            href="/pages/ventas/tickets" 
            className={`${styles.tabLink} ${isActive('tickets') ? styles.activeTab : ''}`}
          >
            Tickets
          </Link>
        </div>
      </div>
      
      <div className={styles.ventasContent}>
        {children}
      </div>
    </div>
  );
}
