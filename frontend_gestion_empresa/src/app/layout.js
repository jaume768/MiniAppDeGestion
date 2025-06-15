import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Importar el componente Header
import Header from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'GestEmpresa - Sistema de Gestión Empresarial',
  description: 'Aplicación web para la gestión integral de tu empresa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Header global para todas las páginas */}
        <Header />
        
        {/* Contenedor principal con padding y máximo ancho */}
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
