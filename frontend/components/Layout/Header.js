import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../../styles/Home.module.css'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest(`.${styles.mobileMenu}`) && !event.target.closest(`.${styles.mobileMenuButton}`)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  // Prevenir scroll cuando el menú esté abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <>
      <header className={styles.header}>
        <div className="container">
          <nav className={styles.nav}>
            {/* Logo */}
            <div className={styles.logo}>
              <Link href="/">
                <span className={styles.logoDesktop}>MiniGestión</span>
                <span className={styles.logoMobile}>Mini gestion</span>
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

            {/* CTA Buttons - Desktop */}
            <div className={styles.navActions}>
              <Link href="/login" className="btn btn-login btn-sm">
                Iniciar Sesión
              </Link>
              <Link href="/demo" className="btn btn-primary btn-sm">
                Demo Gratuita
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className={`${styles.mobileMenuButton} ${isMenuOpen ? styles.menuOpen : ''}`}
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <div className={styles.hamburger}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && <div className={styles.mobileMenuOverlay} onClick={closeMenu}></div>}

      {/* Mobile Side Menu */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <div className={styles.mobileMenuLogo}>
            Mini gestion
          </div>
          <button 
            className={styles.mobileMenuClose}
            onClick={closeMenu}
            aria-label="Cerrar menú"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M18 6L6 18M6 6l12 12" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        
        <nav className={styles.mobileMenuNav}>
          <ul className={styles.mobileMenuLinks}>
            <li>
              <Link href="#features" className={styles.mobileMenuLink} onClick={closeMenu}>
                Características
              </Link>
            </li>
            <li>
              <Link href="#pricing" className={styles.mobileMenuLink} onClick={closeMenu}>
                Precios
              </Link>
            </li>
            <li>
              <Link href="#about" className={styles.mobileMenuLink} onClick={closeMenu}>
                Acerca de
              </Link>
            </li>
            <li>
              <Link href="#contact" className={styles.mobileMenuLink} onClick={closeMenu}>
                Contacto
              </Link>
            </li>
          </ul>
          
          <div className={styles.mobileMenuActions}>
            <Link href="/login" className={`btn btn-login ${styles.mobileMenuBtn}`} onClick={closeMenu}>
              Iniciar Sesión
            </Link>
            <Link href="/demo" className={`btn btn-primary ${styles.mobileMenuBtn}`} onClick={closeMenu}>
              Demo Gratuita
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}
