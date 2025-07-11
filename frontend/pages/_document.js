import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* Meta tags adicionales */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="description" content="Sistema de gestión empresarial multi-tenant completo con facturación, inventario, ventas y más." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="MiniGestión - Sistema de Gestión Empresarial" />
        <meta property="og:description" content="Gestiona tu empresa de forma integral con nuestro SaaS multi-tenant" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="MiniGestión - Sistema de Gestión Empresarial" />
        <meta property="twitter:description" content="Gestiona tu empresa de forma integral con nuestro SaaS multi-tenant" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
