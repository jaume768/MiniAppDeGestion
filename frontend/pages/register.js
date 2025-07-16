import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import styles from '../styles/Auth.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Register() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep1 = () => {
    const errors = {};
    if (!formData.empresa_nombre.trim()) {
      errors.empresa_nombre = 'El nombre de la empresa es requerido';
    }
    if (!formData.empresa_cif.trim()) {
      errors.empresa_cif = 'El CIF de la empresa es requerido';
    }
    return errors;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.admin_username.trim()) {
      errors.admin_username = 'El nombre de usuario es requerido';
    }
    if (!formData.admin_email.trim()) {
      errors.admin_email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.admin_email)) {
      errors.admin_email = 'El email no es válido';
    }
    if (!formData.admin_first_name.trim()) {
      errors.admin_first_name = 'El nombre es requerido';
    }
    if (!formData.admin_last_name.trim()) {
      errors.admin_last_name = 'Los apellidos son requeridos';
    }
    if (!formData.admin_password.trim()) {
      errors.admin_password = 'La contraseña es requerida';
    } else if (formData.admin_password.length < 8) {
      errors.admin_password = 'La contraseña debe tener al menos 8 caracteres';
    }
    if (formData.admin_password !== formData.admin_password_confirm) {
      errors.admin_password_confirm = 'Las contraseñas no coinciden';
    }
    if (!formData.accept_terms) {
      errors.accept_terms = 'Debes aceptar los términos y condiciones';
    }
    return errors;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const errors = validateStep1();
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }
    setFieldErrors({});
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar paso 2 antes de enviar
    const errors = validateStep2();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true);
    setError('');
    setFieldErrors({});

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

  const renderStep1 = () => (
    <div className={styles.stepContent}>
      <h3 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', color: 'var(--color-gray-800)' }}>
        Datos de tu Empresa
      </h3>
      
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
          placeholder="Ej: Mi Empresa S.L."
          required
        />
        {fieldErrors.empresa_nombre && (
          <div className={styles.errorAlert}>{fieldErrors.empresa_nombre}</div>
        )}
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
          placeholder="Ej: B12345678"
          required
        />
        {fieldErrors.empresa_cif && (
          <div className={styles.errorAlert}>{fieldErrors.empresa_cif}</div>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          Email de la Empresa
        </label>
        <input
          type="email"
          name="empresa_email"
          value={formData.empresa_email}
          onChange={handleChange}
          className={styles.input}
          placeholder="contacto@miempresa.com"
        />
      </div>

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
          placeholder="+34 123 456 789"
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
          placeholder="Calle Principal, 123, Ciudad"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          Sitio Web
        </label>
        <input
          type="url"
          name="empresa_web"
          value={formData.empresa_web}
          onChange={handleChange}
          className={styles.input}
          placeholder="https://www.miempresa.com"
        />
      </div>

      <div className={styles.stepButtons}>
        <button
          type="button"
          onClick={nextStep}
          className={styles.submitButton}
        >
          Siguiente: Datos del Administrador →
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.stepContent}>
      <h3 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', color: 'var(--color-gray-800)' }}>
        Datos del Administrador
      </h3>
      
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
          placeholder="Tu nombre"
          required
        />
        {fieldErrors.admin_first_name && (
          <div className={styles.errorAlert}>{fieldErrors.admin_first_name}</div>
        )}
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
          placeholder="Tus apellidos"
          required
        />
        {fieldErrors.admin_last_name && (
          <div className={styles.errorAlert}>{fieldErrors.admin_last_name}</div>
        )}
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
          placeholder="usuario"
          required
        />
        {fieldErrors.admin_username && (
          <div className={styles.errorAlert}>{fieldErrors.admin_username}</div>
        )}
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
          placeholder="tu@email.com"
          required
        />
        {fieldErrors.admin_email && (
          <div className={styles.errorAlert}>{fieldErrors.admin_email}</div>
        )}
      </div>

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
          placeholder="Mínimo 8 caracteres"
          required
        />
        {fieldErrors.admin_password && (
          <div className={styles.errorAlert}>{fieldErrors.admin_password}</div>
        )}
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
          placeholder="Repite la contraseña"
          required
        />
        {fieldErrors.admin_password_confirm && (
          <div className={styles.errorAlert}>{fieldErrors.admin_password_confirm}</div>
        )}
      </div>

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
          placeholder="+34 123 456 789"
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
          placeholder="Director, Gerente, etc."
        />
      </div>

      <div className={styles.formGroup}>
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
            Acepto los términos y condiciones y la política de privacidad
          </label>
        </div>
        {fieldErrors.accept_terms && (
          <div className={styles.errorAlert}>{fieldErrors.accept_terms}</div>
        )}
      </div>

      <div className={styles.stepButtons}>
        <button
          type="button"
          onClick={prevStep}
          className={styles.secondaryButton}
        >
          ← Atrás
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Creando cuenta...' : 'Crear Cuenta ✓'}
        </button>
      </div>
    </div>
  );

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

          {/* Indicador de pasos */}
          <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''}`}>
              1
            </div>
            <div className={`${styles.stepConnector} ${currentStep > 1 ? styles.completed : ''}`}></div>
            <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''}`}>
              2
            </div>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.authForm}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
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
