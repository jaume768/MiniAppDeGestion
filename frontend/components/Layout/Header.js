import { useState } from 'react'
import Link from 'next/link'
import styles from '../../styles/Home.module.css'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className={styles.header}>
      <div className="container">
        <nav className={styles.nav}>
          {/* Logo */}
          <div className={styles.logo}>
            <Link href="/">
              MiniGestión
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <ul className={styles.navLinks}>
            <li>
              <Link href="#features" className={styles.navLink}>
                Características
              </Link>
            </li>
            <li>
              <Link href="#pricing" className={styles.navLink}>
                Precios
              </Link>
            </li>
            <li>
              <Link href="#about" className={styles.navLink}>
                Acerca de
              </Link>
            </li>
            <li>
              <Link href="#contact" className={styles.navLink}>
                Contacto
              </Link>
            </li>
          </ul>

          {/* CTA Buttons */}
          <div className={styles.navActions}>
            <Link href="/login" className="btn btn-outline btn-sm">
              Iniciar Sesión
            </Link>
            <Link href="/demo" className="btn btn-primary btn-sm">
              Demo Gratuita
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={styles.mobileMenuButton}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M3 12h18m-9-9v18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  )
}
