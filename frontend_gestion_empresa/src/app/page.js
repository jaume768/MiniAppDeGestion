"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { clientesAPI, empleadosAPI, proyectosAPI, pedidosAPI, presupuestosAPI, facturasAPI, reportesAPI } from "./services/api";
// SVG Icons
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconBriefcase = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconFileInvoice = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const IconFileContract = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconReceipt = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const IconCalendarAlt = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconChartLine = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="24" width="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

export default function Home() {
  const [stats, setStats] = useState({
    clientes: 0,
    empleados: 0,
    proyectos: 0,
    pedidos: 0,
    presupuestos: 0,
    facturas: 0
  });
  
  const [actividadReciente, setActividadReciente] = useState([]);
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [proyectosPorEstado, setProyectosPorEstado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Función para cargar datos reales de la API
    const fetchData = async () => {
      try {
        // Cargar datos en paralelo
        const [clientes, empleados, proyectos, pedidos, presupuestos, facturas, estadisticas, proyectosPorEstadoData] = await Promise.allSettled([
          clientesAPI.getAll(),
          empleadosAPI.getAll(),
          proyectosAPI.getAll(),
          pedidosAPI.getAll(),
          presupuestosAPI.getAll(),
          facturasAPI.getAll(),
          reportesAPI.getSummary(),
          reportesAPI.getProyectosPorEstado()
        ]);
        
        // Actualizar estadísticas
        setStats({
          clientes: clientes.status === 'fulfilled' ? clientes.value.length : 0,
          empleados: empleados.status === 'fulfilled' ? empleados.value.length : 0,
          proyectos: proyectos.status === 'fulfilled' ? proyectos.value.length : 0,
          pedidos: pedidos.status === 'fulfilled' ? pedidos.value.length : 0,
          presupuestos: presupuestos.status === 'fulfilled' ? presupuestos.value.length : 0,
          facturas: facturas.status === 'fulfilled' ? facturas.value.length : 0
        });

        // Actualizar proyectos por estado
        if (proyectosPorEstadoData.status === 'fulfilled') {
          setProyectosPorEstado(proyectosPorEstadoData.value || []);
        }
        
        // Intentar obtener datos de ventas mensuales
        try {
          const ventasData = await reportesAPI.getVentasPorMes(new Date().getFullYear());
          setVentasMensuales(ventasData);
        } catch (error) {
          console.log("No se pudieron cargar las ventas mensuales", error);
          // Usar datos placeholder si no se pueden cargar los datos reales
          setVentasMensuales([]);
        }
        
        // Crear array de actividad reciente
        const actividad = [];
        
        if (clientes.status === 'fulfilled' && clientes.value.length > 0) {
          const cliente = clientes.value[clientes.value.length - 1];
          actividad.push({
            id: `cliente-${cliente.id}`,
            tipo: 'cliente',
            icono: '👥',
            titulo: 'Cliente registrado',
            meta: `${cliente.nombre} - Reciente`,
            url: `/pages/general/clientes/${cliente.id}`
          });
        }
        
        if (pedidos.status === 'fulfilled' && pedidos.value.length > 0) {
          const pedido = pedidos.value[pedidos.value.length - 1];
          actividad.push({
            id: `pedido-${pedido.id}`,
            tipo: 'pedido',
            icono: '📋',
            titulo: 'Pedido creado',
            meta: `Pedido #${pedido.id} - Reciente`,
            url: `/pages/ventas/pedidos/${pedido.id}`
          });
        }
        
        if (proyectos.status === 'fulfilled' && proyectos.value.length > 0) {
          const proyecto = proyectos.value[proyectos.value.length - 1];
          actividad.push({
            id: `proyecto-${proyecto.id}`,
            tipo: 'proyecto',
            icono: '🔨',
            titulo: 'Proyecto iniciado',
            meta: `${proyecto.nombre} - Reciente`,
            url: `/pages/proyectos/${proyecto.id}`
          });
        }

        if (facturas.status === 'fulfilled' && facturas.value.length > 0) {
          const factura = facturas.value[facturas.value.length - 1];
          actividad.push({
            id: `factura-${factura.id}`,
            tipo: 'factura',
            icono: '💰',
            titulo: 'Factura emitida',
            meta: `Factura #${factura.id} - Reciente`,
            url: `/pages/ventas/facturas/${factura.id}`
          });
        }
        
        setActividadReciente(actividad);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <section className="mt-4 mb-4">
        <div className={styles.welcomeBanner}>
          <h1 className={styles.welcomeTitle}>Bienvenido al Panel de Gestión</h1>
          <p className={styles.welcomeSubtitle}>Controla y optimiza tu empresa con datos en tiempo real</p>
        </div>
      </section>
      
      {error && <div className="card mb-3" style={{backgroundColor: 'var(--danger)', color: 'white', padding: 'var(--spacing-md)'}}>{error}</div>}
      
      {/* Dashboard de estadísticas */}
      <section className="mb-4">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Panel de Control</h2>
          <div className={styles.sectionLine}></div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando datos del dashboard...</p>
          </div>
        ) : (
          <div className={styles.statsGrid}>
            
            <Link href="/pages/general" className={`${styles.statCard} ${styles.clientesCard}`}>
              <div className={styles.statIconWrapper}>
                <span className={styles.statIcon}>
                  <IconUsers />
                </span>
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statNumber}>{stats.clientes}</p>
                <p className={styles.statLabel}>Clientes</p>
              </div>
            </Link>
            
            <Link href="/pages/general" className={`${styles.statCard} ${styles.empleadosCard}`}>
              <div className={styles.statIconWrapper}>
                <span className={styles.statIcon}>
                  <IconUser />
                </span>
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statNumber}>{stats.empleados}</p>
                <p className={styles.statLabel}>Empleados</p>
              </div>
            </Link>
            
            <Link href="/pages/ventas/pedidos" className={`${styles.statCard} ${styles.pedidosCard}`}>
              <div className={styles.statIconWrapper}>
                <span className={styles.statIcon}>
                  <IconFileInvoice />
                </span>
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statNumber}>{stats.pedidos}</p>
                <p className={styles.statLabel}>Pedidos</p>
              </div>
            </Link>
            
            <Link href="/pages/ventas/presupuestos" className={`${styles.statCard} ${styles.presupuestosCard}`}>
              <div className={styles.statIconWrapper}>
                <span className={styles.statIcon}>
                  <IconFileContract />
                </span>
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statNumber}>{stats.presupuestos}</p>
                <p className={styles.statLabel}>Presupuestos</p>
              </div>
            </Link>
            
            <Link href="/pages/ventas/facturas" className={`${styles.statCard} ${styles.facturasCard}`}>
              <div className={styles.statIconWrapper}>
                <span className={styles.statIcon}>
                  <IconReceipt />
                </span>
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statNumber}>{stats.facturas}</p>
                <p className={styles.statLabel}>Facturas</p>
              </div>
            </Link>
          </div>
        )}
      </section>
      
      {/* Distribución en 2 columnas para actividad reciente y proyectos */}
      <div className={styles.dashboardColumns}>
        {/* Actividad Reciente */}
        <section className={`${styles.recentActivity} card`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Actividad Reciente</h2>
            <div className={styles.sectionLine}></div>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Cargando actividad...</p>
            </div>
          ) : actividadReciente.length > 0 ? (
            <div className={styles.activityList}>
              {actividadReciente.map(item => (
                <Link href={item.url || '#'} key={item.id} className={styles.activityItem}>
                  <div className={styles.activityIconWrapper}>
                    <span className={styles.activityIcon}>{item.icono}</span>
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityTitle}>{item.titulo}</p>
                    <p className={styles.activityMeta}>{item.meta}</p>
                  </div>
                </Link>
              ))}
              <div className={styles.activityFooter}>
                <Link href="/actividad" className={styles.viewAllLink}>Ver toda la actividad →</Link>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={styles.emptyStateIcon}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No hay actividad reciente</p>
            </div>
          )}
        </section>
        
        {/* Resumen de Proyectos */}
        <section className={`${styles.projectSummary} card`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Resumen de Proyectos</h2>
            <div className={styles.sectionLine}></div>
          </div>
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Cargando proyectos...</p>
            </div>
          ) : proyectosPorEstado.length > 0 ? (
            <div className={styles.projectStatusGrid}>
              {proyectosPorEstado.map((item, index) => (
                <div key={index} className={`${styles.statusCard} ${styles[`status${item.estado.replace(/\s+/g, '')}`]}`}>
                  <div className={styles.statusCount}>{item.cantidad}</div>
                  <h3 className={styles.statusLabel}>{item.estado}</h3>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={styles.emptyStateIcon}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p>No hay información de proyectos disponible</p>
            </div>
          )}
        </section>
      </div>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} GestEmpresa - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
