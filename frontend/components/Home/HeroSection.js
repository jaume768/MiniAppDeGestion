import Link from 'next/link'
import styles from '../../styles/Home.module.css'

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Gestiona tu empresa{' '}
              <span className={styles.gradient}>sin límites</span>
            </h1>
            
            <p className={styles.heroDescription}>
              Sistema de gestión empresarial completo y moderno. Facturación, inventario, 
              ventas, compras, recursos humanos y proyectos, todo en una sola plataforma 
              segura y escalable.
            </p>

            <div className={styles.heroActions}>
              <Link href="/demo" className="btn btn-primary btn-lg">
                Prueba Gratuita 30 días
              </Link>
              <Link href="#features" className="btn btn-outline btn-lg">
                Ver Características
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>500+</span>
                <span className={styles.statLabel}>Empresas activas</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>99.9%</span>
                <span className={styles.statLabel}>Uptime</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>24/7</span>
                <span className={styles.statLabel}>Soporte</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
