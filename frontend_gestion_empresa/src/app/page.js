"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const [stats, setStats] = useState({
    clientes: 0,
    empleados: 0,
    proyectos: 0,
    pedidos: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // En un entorno real, aquí haríamos fetch a la API
    // Por ahora simularemos datos
    const fetchData = () => {
      setTimeout(() => {
        setStats({
          clientes: 3,
          empleados: 8,
          proyectos: 2,
          pedidos: 1
        });
        setLoading(false);
      }, 800);
    };

    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <h1 className={styles.title}>GestEmpresa</h1>
          <p className={styles.subtitle}>Sistema de Gestión Empresarial</p>
        </div>
        <nav className={styles.nav}>
          <Link href="/clientes" className={styles.navLink}>Clientes</Link>
          <Link href="/empleados" className={styles.navLink}>Empleados</Link>
          <Link href="/proyectos" className={styles.navLink}>Proyectos</Link>
          <Link href="/ventas" className={styles.navLink}>Ventas</Link>
          <Link href="/reportes" className={styles.navLink}>Reportes</Link>
        </nav>
      </header>
      
      <main className={styles.main}>
        <section className={styles.welcome}>
          <h2>Bienvenido al panel de administración</h2>
          <p>Gestiona tu empresa de manera eficiente con nuestra plataforma integral</p>
        </section>
        
        <section className={styles.dashboardCards}>
          <div className={styles.card}>
            <h3>Clientes</h3>
            {loading ? (
              <div className={styles.loadingIndicator}>Cargando...</div>
            ) : (
              <div className={styles.statNumber}>{stats.clientes}</div>
            )}
            <Link href="/clientes" className={styles.cardLink}>Ver todos →</Link>
          </div>
          
          <div className={styles.card}>
            <h3>Empleados</h3>
            {loading ? (
              <div className={styles.loadingIndicator}>Cargando...</div>
            ) : (
              <div className={styles.statNumber}>{stats.empleados}</div>
            )}
            <Link href="/empleados" className={styles.cardLink}>Ver todos →</Link>
          </div>
          
          <div className={styles.card}>
            <h3>Proyectos</h3>
            {loading ? (
              <div className={styles.loadingIndicator}>Cargando...</div>
            ) : (
              <div className={styles.statNumber}>{stats.proyectos}</div>
            )}
            <Link href="/proyectos" className={styles.cardLink}>Ver todos →</Link>
          </div>
          
          <div className={styles.card}>
            <h3>Pedidos</h3>
            {loading ? (
              <div className={styles.loadingIndicator}>Cargando...</div>
            ) : (
              <div className={styles.statNumber}>{stats.pedidos}</div>
            )}
            <Link href="/pedidos" className={styles.cardLink}>Ver todos →</Link>
          </div>
        </section>
        
        <section className={styles.latestActivity}>
          <h2>Actividad reciente</h2>
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📂</div>
              <div className={styles.activityContent}>
                <p className={styles.activityTitle}>Nuevo cliente registrado</p>
                <p className={styles.activityMeta}>Acme S.A. - Hace 2 días</p>
              </div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📋</div>
              <div className={styles.activityContent}>
                <p className={styles.activityTitle}>Nuevo pedido creado</p>
                <p className={styles.activityMeta}>Pedido #1 - Hace 1 día</p>
              </div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>👥</div>
              <div className={styles.activityContent}>
                <p className={styles.activityTitle}>Nuevo proyecto iniciado</p>
                <p className={styles.activityMeta}>Implementación ERP - Hoy</p>
              </div>
            </div>
          </div>
          <Link href="/actividad" className={styles.viewAllLink}>Ver toda la actividad →</Link>
        </section>
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} GestEmpresa - Sistema de Gestión Empresarial</p>
      </footer>
    </div>
  );
}
