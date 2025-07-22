import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { usePermissions } from '../hooks/usePermissions';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const {
    getAccessibleModulesByCategory,
    getPermissionBadges,
    getUserRole,
    getUserCargo,
    isAdmin,
    isSuperAdmin
  } = usePermissions();

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

  // Obtener módulos accesibles por categoría
  const operationalModules = getAccessibleModulesByCategory('operational');
  const administrativeModules = getAccessibleModulesByCategory('administrative');
  const permissionBadges = getPermissionBadges();
  
  // Componente para renderizar una tarjeta de módulo
  const ModuleCard = ({ module }) => (
    <Link href={module.path} key={module.key}>
      <div className={`${styles.moduleCard} ${styles[module.key] || ''}`}>
        <div className={styles.moduleIcon}>{module.icon}</div>
        <div className={styles.moduleContent}>
          <h3 className={styles.moduleTitle}>{module.name}</h3>
          <p className={styles.moduleDescription}>{module.description}</p>
          {module.submodules && (
            <div className={styles.submodules}>
              <small>Incluye: {module.submodules.slice(0, 3).join(', ')}
                {module.submodules.length > 3 && ` (+${module.submodules.length - 3} más)`}
              </small>
            </div>
          )}
        </div>
        <div className={styles.moduleArrow}>→</div>
      </div>
    </Link>
  );
  
  // Componente para mostrar badges de permisos
  const PermissionBadges = () => (
    <div className={styles.permissionBadges}>
      {permissionBadges.map((badge, index) => (
        <span key={index} className={`${styles.badge} ${styles[badge.name.toLowerCase().replace(' ', '')]}}`}>
          {badge.name}
        </span>
      ))}
    </div>
  );

  // Función para obtener el label del rol en español
  const getRoleLabel = (role) => {
    const roleLabels = {
      'superadmin': 'Super Administrador',
      'admin': 'Administrador',
      'manager': 'Gerente',
      'employee': 'Empleado',
      'readonly': 'Solo Lectura'
    };
    return roleLabels[role] || role;
  };

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
              <div className={styles.welcomeHeader}>
                <div className={styles.welcomeText}>
                  <h2 className={styles.welcomeTitle}>
                    ¡Hola, {userData?.first_name}! 👋
                  </h2>
                  <p className={styles.welcomeSubtitle}>
                    Empresa: <strong>{userData?.empresa_nombre}</strong>
                  </p>
                  <p className={styles.welcomeRole}>
                    {userData?.cargo && (
                      <span className={styles.cargoChip}>{userData.cargo}</span>
                    )}
                    <span className={styles.roleChip}>
                      {getRoleLabel(userData?.role)}
                    </span>
                  </p>
                </div>
                <div className={styles.userAvatar}>
                  <div className={styles.avatarCircle}>
                    {userData?.first_name?.charAt(0)}{userData?.last_name?.charAt(0)}
                  </div>
                </div>
              </div>
              
              {/* Permission Badges */}
              {permissionBadges.length > 0 && (
                <div className={styles.permissionsSection}>
                  <h4 className={styles.permissionsTitle}>Tus permisos activos:</h4>
                  <PermissionBadges />
                </div>
              )}
            </section>

            {/* Operational Modules */}
            {operationalModules.length > 0 && (
              <section className={styles.modulesSection}>
                <h3 className={styles.sectionTitle}>📊 Módulos Operacionales</h3>
                <div className={styles.modulesGrid}>
                  {operationalModules.map(module => (
                    <ModuleCard key={module.key} module={module} />
                  ))}
                </div>
              </section>
            )}

            {/* Administrative Modules */}
            {administrativeModules.length > 0 && (
              <section className={styles.modulesSection}>
                <h3 className={styles.sectionTitle}>⚙️ Administración</h3>
                <div className={styles.modulesGrid}>
                  {administrativeModules.map(module => (
                    <ModuleCard key={module.key} module={module} />
                  ))}
                </div>
              </section>
            )}

            {/* No modules message */}
            {operationalModules.length === 0 && administrativeModules.length === 0 && (
              <section className={styles.noModulesSection}>
                <div className={styles.noModulesCard}>
                  <div className={styles.noModulesIcon}>🔒</div>
                  <h3 className={styles.noModulesTitle}>Sin acceso a módulos</h3>
                  <p className={styles.noModulesText}>
                    Tu rol actual no tiene acceso a ningún módulo del sistema.
                    Contacta con tu administrador para obtener más permisos.
                  </p>
                </div>
              </section>
            )}

            {/* User Info Section */}
            <section className={styles.userInfoSection}>
              <h3 className={styles.sectionTitle}>📋 Información de tu cuenta</h3>
              <div className={styles.userInfoCard}>
                <div className={styles.userInfoGrid}>
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>Usuario:</label>
                    <span className={styles.infoValue}>{userData?.username}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>Email:</label>
                    <span className={styles.infoValue}>{userData?.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>Rol:</label>
                    <span className={`${styles.infoValue} ${styles.roleBadge}`}>
                      {getRoleLabel(userData?.role)}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>Empresa:</label>
                    <span className={styles.infoValue}>{userData?.empresa_nombre}</span>
                  </div>
                  {userData?.telefono && (
                    <div className={styles.infoItem}>
                      <label className={styles.infoLabel}>Teléfono:</label>
                      <span className={styles.infoValue}>{userData.telefono}</span>
                    </div>
                  )}
                  {userData?.cargo && (
                    <div className={styles.infoItem}>
                      <label className={styles.infoLabel}>Cargo:</label>
                      <span className={styles.infoValue}>{userData.cargo}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
