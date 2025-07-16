import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import styles from '../styles/Auth.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Datos de la empresa
    empresa_nombre: '',
    empresa_cif: '',
    empresa_direccion: '',
    empresa_telefono: '',
    empresa_email: '',
    empresa_web: '',
    
    // Datos del administrador
    admin_username: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirm: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_telefono: '',
    admin_cargo: '',
    
    // Términos y condiciones
    accept_terms: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones básicas
    if (formData.admin_password !== formData.admin_password_confirm) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (!formData.accept_terms) {
      setError('Debe aceptar los términos y condiciones');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/public/register-empresa/`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 201) {
        // Guardar tokens y datos del usuario en localStorage
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        localStorage.setItem('user_data', JSON.stringify(response.data.admin));
        localStorage.setItem('empresa_data', JSON.stringify(response.data.empresa));

        // Redirigir al dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error en registro:', err);
      
      if (err.response?.data) {
        // Formatear errores de la API
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const errorMessages = Object.values(errors).flat();
          setError(errorMessages.join('. '));
        } else {
          setError(errors.error || 'Error al registrar la empresa');
        }
      } else {
        setError('Error de conexión. Verifique que la API esté funcionando.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Registro de Empresa - MiniGestión</title>
        <meta name="description" content="Registra tu empresa en MiniGestión" />
      </Head>

      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>Registro de Empresa</h1>
            <p className={styles.authSubtitle}>
              Crea tu cuenta empresarial en MiniGestión
            </p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.authForm}>
            {/* Datos de la Empresa */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Datos de la Empresa</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="empresa_nombre"
                  value={formData.empresa_nombre}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  placeholder="Ej: Mi Empresa S.L."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  CIF/NIF *
                </label>
                <input
                  type="text"
                  name="empresa_cif"
                  value={formData.empresa_cif}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  placeholder="Ej: 12345678A"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Dirección
                </label>
                <input
                  type="text"
                  name="empresa_direccion"
                  value={formData.empresa_direccion}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Calle, número, ciudad"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="empresa_telefono"
                    value={formData.empresa_telefono}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="600123456"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="empresa_email"
                    value={formData.empresa_email}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="contacto@empresa.com"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Página Web
                </label>
                <input
                  type="url"
                  name="empresa_web"
                  value={formData.empresa_web}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="https://miempresa.com"
                />
              </div>
            </div>

            {/* Datos del Administrador */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Datos del Administrador</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="admin_first_name"
                    value={formData.admin_first_name}
                    onChange={handleChange}
                    className={styles.input}
                    required
                    placeholder="Juan"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    name="admin_last_name"
                    value={formData.admin_last_name}
                    onChange={handleChange}
                    className={styles.input}
                    required
                    placeholder="Pérez García"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  name="admin_username"
                  value={formData.admin_username}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  placeholder="admin_miempresa"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Email *
                </label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  placeholder="admin@empresa.com"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="admin_password"
                    value={formData.admin_password}
                    onChange={handleChange}
                    className={styles.input}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    name="admin_password_confirm"
                    value={formData.admin_password_confirm}
                    onChange={handleChange}
                    className={styles.input}
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="admin_telefono"
                    value={formData.admin_telefono}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="600654321"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Cargo
                  </label>
                  <input
                    type="text"
                    name="admin_cargo"
                    value={formData.admin_cargo}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Director General"
                  />
                </div>
              </div>
            </div>

            {/* Términos y Condiciones */}
            <div className={styles.formSection}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="accept_terms"
                  name="accept_terms"
                  checked={formData.accept_terms}
                  onChange={handleChange}
                  className={styles.checkbox}
                  required
                />
                <label htmlFor="accept_terms" className={styles.checkboxLabel}>
                  Acepto los <a href="/terms" className={styles.link}>términos y condiciones</a> y la <a href="/privacy" className={styles.link}>política de privacidad</a>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Registrando...' : 'Registrar Empresa'}
            </button>
          </form>

          <div className={styles.authFooter}>
            <p>
              ¿Ya tienes una cuenta?{' '}
              <a href="/login" className={styles.link}>
                Iniciar Sesión
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
