import { useState } from 'react'
import Link from 'next/link'
import styles from '../../styles/Home.module.css'

export default function PricingSection() {
  const [billing, setBilling] = useState('monthly')

  const plans = [
    {
      name: "Starter",
      monthlyPrice: 29,
      annualPrice: Math.round(29 * 12 * 0.8),
      description: "Perfecto para pequeñas empresas",
      features: [
        "Hasta 3 usuarios",
        "Facturación básica",
        "Gestión de inventario",
        "Soporte por email",
        "5 GB de almacenamiento",
        "API REST básica"
      ],
      buttonText: "Empezar Gratis",
      buttonLink: "/demo?plan=starter",
      popular: false
    },
    {
      name: "Professional",
      monthlyPrice: 59,
      annualPrice: Math.round(59 * 12 * 0.8),
      description: "Para empresas en crecimiento",
      features: [
        "Hasta 10 usuarios",
        "Facturación avanzada + TPV",
        "Multi-almacén",
        "Reportes avanzados",
        "Soporte prioritario",
        "50 GB de almacenamiento",
        "API REST completa",
        "Integraciones",
        "Backup automático"
      ],
      buttonText: "Probar 30 días",
      buttonLink: "/demo?plan=professional",
      popular: true
    },
    {
      name: "Enterprise",
      monthlyPrice: 129,
      annualPrice: Math.round(129 * 12 * 0.8),
      description: "Para grandes empresas",
      features: [
        "Usuarios ilimitados",
        "Todas las funcionalidades",
        "Multi-empresa",
        "Personalización avanzada",
        "Soporte 24/7",
        "Almacenamiento ilimitado",
        "SLA 99.9%",
        "Implementación dedicada",
        "Formación incluida",
        "Integraciones custom"
      ],
      buttonText: "Contactar Ventas",
      buttonLink: "/contact?plan=enterprise",
      popular: false
    }
  ]

  return (
    <section id="pricing" className={styles.pricing}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2>Planes que se adaptan a tu empresa</h2>
          <p>
            Desde startups hasta grandes corporaciones. Escalamos contigo 
            sin comprometer la funcionalidad ni la seguridad.
          </p>
          
          {/* Selector de facturación */}
          <div className={styles.billingToggle}>
            <button 
              className={`${styles.billingOption} ${billing === 'monthly' ? styles.active : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Mensual
            </button>
            <button 
              className={`${styles.billingOption} ${billing === 'annual' ? styles.active : ''}`}
              onClick={() => setBilling('annual')}
            >
              Anual
              <span className={styles.discount}>(-20%)</span>
            </button>
          </div>
        </div>

        <div className={styles.pricingGrid}>
          {plans.map((plan, i) => {
            return (
              <div
                key={i}
                className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}
              >
                {plan.popular && <div className={styles.popularBadge}>Más Popular</div>}

                <div className={styles.planHeader}>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                  <div className={styles.price}>
                    <span className={styles.currency}>€</span>
                    <span className={styles.amount}>
                      {billing === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                    </span>
                    <span className={styles.period}>
                      {billing === 'monthly' ? '/mes' : '/mes'}
                    </span>
                    {billing === 'annual' && (
                      <div className={styles.annualPrice}>
                        €{plan.annualPrice} facturado anualmente
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <ul className={styles.features}>
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path 
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.cardFooter}>
                  <Link 
                    href={plan.buttonLink}
                    className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} btn-lg w-full`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.pricingFooter}>
          <div className={styles.pricingFooterContent}>
            <div className={styles.pricingFeatures}>
              <div className={styles.pricingFeature}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span>30 días de prueba gratuita</span>
              </div>
              <div className={styles.pricingFeature}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Sin permanencia</span>
              </div>
              <div className={styles.pricingFeature}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Migración incluida</span>
              </div>
              <div className={styles.pricingFeature}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Seguridad bancaria</span>
              </div>
            </div>

            <div className={styles.pricingCTA}>
              <h3>¿Necesitas más información?</h3>
              <p>
                Nuestro equipo está aquí para ayudarte a elegir el plan perfecto 
                para tu empresa. Contacta con nosotros sin compromiso.
              </p>
              <Link href="/contact" className="btn btn-outline">
                Hablar con un Experto
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
