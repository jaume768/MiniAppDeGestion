import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import axios from 'axios';
import styles from '../styles/Auth.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones básicas
    if (!formData.username.trim()) {
      setError('El nombre de usuario es requerido');
      setLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError('La contraseña es requerida');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login/`,
        {
          username: formData.username,
          password: formData.password
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Guardar tokens y datos del usuario
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));

      // Redirigir al dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error en login:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else if (error.response?.data?.non_field_errors) {
        setError(error.response.data.non_field_errors[0]);
      } else {
        setError('Error al iniciar sesión. Verifica tus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Iniciar Sesión - MiniGestión</title>
        <meta name="description" content="Inicia sesión en tu cuenta de MiniGestión" />
      </Head>

      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>Iniciar Sesión</h1>
            <p className={styles.authSubtitle}>
              Accede a tu cuenta de MiniGestión
            </p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Usuario o Email
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={styles.input}
                placeholder="usuario@empresa.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="••••••••"
                required
              />
            </div>

            <div className={styles.formOptions}>
              <a href="/forgot-password" className={styles.link}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>o</span>
          </div>

          <div className={styles.authFooter}>
            <p>
              ¿No tienes una cuenta?{' '}
              <a href="/register" className={styles.link}>
                Registrar Empresa
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
