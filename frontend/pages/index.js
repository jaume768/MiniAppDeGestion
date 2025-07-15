import Head from 'next/head'
import Header from '../components/Layout/Header'
import Footer from '../components/Layout/Footer'
import HeroSection from '../components/Home/HeroSection'
import FeaturesSection from '../components/Home/FeaturesSection'
import PricingSection from '../components/Home/PricingSection'
import AboutSection from '../components/Home/AboutSection'

export default function Home() {
  return (
    <>
      <Head>
        <title>MiniGestión - Sistema de Gestión Empresarial SaaS</title>
        <meta 
          name="description" 
          content="Sistema de gestión empresarial multi-tenant completo. Facturación, inventario, ventas, compras, TPV, recursos humanos y proyectos. Prueba gratuita 30 días."
        />
        <meta name="keywords" content="gestión empresarial, ERP, SaaS, facturación, inventario, TPV, multi-tenant" />
        
        {/* Open Graph */}
        <meta property="og:title" content="MiniGestión - Sistema de Gestión Empresarial SaaS" />
        <meta property="og:description" content="Gestiona tu empresa de forma integral con nuestro SaaS multi-tenant. Facturación, inventario, ventas y más." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://minigestion.com" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MiniGestión - Sistema de Gestión Empresarial SaaS" />
        <meta name="twitter:description" content="Gestiona tu empresa de forma integral con nuestro SaaS multi-tenant" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "MiniGestión",
              "description": "Sistema de gestión empresarial multi-tenant completo",
              "url": "https://minigestion.com",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "29",
                "priceCurrency": "EUR",
                "priceValidUntil": "2024-12-31"
              },
              "featureList": [
                "Facturación completa",
                "Gestión de inventario",
                "Terminal de ventas (TPV)",
                "Recursos humanos",
                "Multi-empresa",
                "API REST"
              ]
            })
          }}
        />
      </Head>

      <div className="app">
        <Header />
        
        <main>
          <HeroSection />
          <FeaturesSection />
          <PricingSection />
          <AboutSection />
        </main>
        
        <Footer />
      </div>
    </>
  )
}
