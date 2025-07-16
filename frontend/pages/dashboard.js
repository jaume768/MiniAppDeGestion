import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const accessToken = localStorage.getItem('access_token');
    const userDataStr = localStorage.getItem('user_data');

    if (!accessToken || !userDataStr) {
      // No hay sesión activa, redirigir al login
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userDataStr);
      setUserData(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
      return;
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    // Limpiar datos de sesión
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    // Redirigir al login
    router.push('/login');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - MiniGestión</title>
        <meta name="description" content="Panel de control de MiniGestión" />
      </Head>

      <div className={styles.dashboard}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <h1>MiniGestión</h1>
            </div>
            <div className={styles.userMenu}>
              <span className={styles.userName}>
                {userData?.first_name} {userData?.last_name}
              </span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.main}>
          <div className={styles.container}>
            {/* Welcome Section */}
            <section className={styles.welcomeSection}>
              <h2 className={styles.welcomeTitle}>
                ¡Bienvenido, {userData?.first_name}!
              </h2>
              <p className={styles.welcomeText}>
                Tu empresa <strong>{userData?.empresa_nombre}</strong> está lista para gestionar.
              </p>
            </section>

            {/* Stats Cards */}
            <section className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statContent}>
                  <h3>Panel de Control</h3>
                  <p>Visualiza métricas y estadísticas</p>
                  <span className={styles.comingSoon}>Próximamente</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statContent}>
                  <h3>Facturación</h3>
                  <p>Gestiona facturas y pagos</p>
                  <span className={styles.comingSoon}>Próximamente</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>📦</div>
                <div className={styles.statContent}>
                  <h3>Inventario</h3>
                  <p>Control de productos y stock</p>
                  <span className={styles.comingSoon}>Próximamente</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>👥</div>
                <div className={styles.statContent}>
                  <h3>Recursos Humanos</h3>
                  <p>Gestión de empleados</p>
                  <span className={styles.comingSoon}>Próximamente</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🛒</div>
                <div className={styles.statContent}>
                  <h3>Ventas</h3>
                  <p>Gestión de ventas y clientes</p>
                  <span className={styles.comingSoon}>Próximamente</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>📋</div>
                <div className={styles.statContent}>
                  <h3>Proyectos</h3>
                  <p>Gestión de proyectos y tareas</p>
                  <span className={styles.comingSoon}>Próximamente</span>
                </div>
              </div>
            </section>

            {/* User Info Section */}
            <section className={styles.userInfoSection}>
              <h3>Información de tu cuenta</h3>
              <div className={styles.userInfoGrid}>
                <div className={styles.infoItem}>
                  <label>Usuario:</label>
                  <span>{userData?.username}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Email:</label>
                  <span>{userData?.email}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Rol:</label>
                  <span className={styles.roleBadge}>
                    {userData?.role === 'admin' ? 'Administrador' : userData?.role}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>Empresa:</label>
                  <span>{userData?.empresa_nombre}</span>
                </div>
                {userData?.telefono && (
                  <div className={styles.infoItem}>
                    <label>Teléfono:</label>
                    <span>{userData.telefono}</span>
                  </div>
                )}
                {userData?.cargo && (
                  <div className={styles.infoItem}>
                    <label>Cargo:</label>
                    <span>{userData.cargo}</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
