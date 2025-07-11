import Link from 'next/link'
import styles from '../../styles/Home.module.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          {/* Logo y descripción */}
          <div className={styles.footerSection}>
            <h3>MiniGestión</h3>
            <p>
              Sistema de gestión empresarial moderno y escalable. 
              Gestiona tu empresa desde la nube con total seguridad.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className={styles.footerSection}>
            <h4>Producto</h4>
            <ul>
              <li><Link href="#features">Características</Link></li>
              <li><Link href="#pricing">Precios</Link></li>
              <li><Link href="/demo">Demo</Link></li>
              <li><Link href="/changelog">Novedades</Link></li>
            </ul>
          </div>

          {/* Soporte */}
          <div className={styles.footerSection}>
            <h4>Soporte</h4>
            <ul>
              <li><Link href="/help">Centro de Ayuda</Link></li>
              <li><Link href="/docs">Documentación</Link></li>
              <li><Link href="/contact">Contacto</Link></li>
              <li><Link href="/status">Estado del Sistema</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className={styles.footerSection}>
            <h4>Legal</h4>
            <ul>
              <li><Link href="/privacy">Privacidad</Link></li>
              <li><Link href="/terms">Términos</Link></li>
              <li><Link href="/cookies">Cookies</Link></li>
              <li><Link href="/gdpr">RGPD</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className={styles.footerBottom}>
          <p>&copy; {currentYear} MiniGestión. Todos los derechos reservados.</p>
          <p>Hecho con ❤️ para empresas que quieren crecer</p>
        </div>
      </div>
    </footer>
  )
}
