"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

// SVG Icons
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="1em" width="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-14 0l7 7 7-7" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="1em" width="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="1em" width="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconFolder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="1em" width="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
  </svg>
);

const IconCart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="1em" width="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const IconBars = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="1em" width="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="1em" width="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Logo y nombre de la app */}
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <span className={styles.logoText}>GE</span>
            </div>
            <span className={styles.appName}>Gestión Empresarial</span>
          </Link>
        </div>
        
        {/* Botón menú móvil */}
        <button 
          className={styles.mobileMenuButton} 
          onClick={toggleMobileMenu}
          aria-label="Menú"
        >
          {mobileMenuOpen ? <IconClose /> : <IconBars />}
        </button>
        
        {/* Navegación principal */}
        <nav className={`${styles.mainNav} ${mobileMenuOpen ? styles.mobileNavActive : ''}`}>
          <ul className={styles.navList}>
            <li>
              <Link 
                href="/" 
                className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <IconHome className={styles.navIcon} />
                <span>Inicio</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/pages/clientes" 
                className={`${styles.navLink} ${isActive('/pages/clientes') ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <IconUser className={styles.navIcon} />
                <span>Clientes</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/pages/empleados" 
                className={`${styles.navLink} ${isActive('/pages/empleados') ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <IconUsers className={styles.navIcon} />
                <span>Empleados</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/pages/proyectos" 
                className={`${styles.navLink} ${isActive('/pages/proyectos') ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <IconFolder className={styles.navIcon} />
                <span>Proyectos</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/pages/ventas" 
                className={`${styles.navLink} ${isActive('/pages/ventas') ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <IconCart className={styles.navIcon} />
                <span>Ventas</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
