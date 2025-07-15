import Image from 'next/image'
import styles from '../../styles/Home.module.css'

export default function AboutSection() {
  return (
    <section id="about" className={styles.aboutSection}>
      <div className="container">
        <div className={styles.aboutContent}>
          {/* Texto descriptivo */}
          <div className={styles.aboutText}>
            <h2 className={styles.aboutTitle}>
              Nuestra Misión: Simplificar la Gestión Empresarial
            </h2>
            <p className={styles.aboutDescription}>
              En <strong>MiniGestión</strong>, creemos que cada empresa, sin importar su tamaño, 
              merece tener acceso a herramientas de gestión profesionales y potentes. 
              Nuestro objetivo es democratizar la tecnología empresarial.
            </p>
            
            <div className={styles.aboutFeatures}>
              <div className={styles.aboutFeature}>
                <div className={styles.featureIcon}>🏢</div>
                <div>
                  <h3>Multi-Empresa</h3>
                  <p>Gestiona múltiples empresas desde una sola plataforma con aislamiento completo de datos</p>
                </div>
              </div>
              
              <div className={styles.aboutFeature}>
                <div className={styles.featureIcon}>📊</div>
                <div>
                  <h3>Gestión Integral</h3>
                  <p>Desde ventas y compras hasta inventario y facturación, todo en un solo lugar</p>
                </div>
              </div>
              
              <div className={styles.aboutFeature}>
                <div className={styles.featureIcon}>🔒</div>
                <div>
                  <h3>Seguridad Avanzada</h3>
                  <p>Autenticación JWT, roles granulares y auditoría completa para máxima seguridad</p>
                </div>
              </div>
              
              <div className={styles.aboutFeature}>
                <div className={styles.featureIcon}>📱</div>
                <div>
                  <h3>Acceso Universal</h3>
                  <p>Diseño responsive que funciona perfectamente en cualquier dispositivo</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Imagen */}
          <div className={styles.aboutImage}>
            <Image
              src="/images/manos-empresarios.png"
              alt="Equipo de empresarios trabajando juntos"
              width={600}
              height={400}
              className={styles.aboutImg}
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
