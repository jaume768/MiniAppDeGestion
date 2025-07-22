/**
 * Modal simple sin HeadlessUI - Solo React + CSS Modules
 */
import { useState, useEffect } from 'react';
import styles from './SimpleModal.module.css';

const SimpleModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  mode = 'create',
  data = null,
  fields = [],
  loading = false
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Inicializar formulario
  useEffect(() => {
    if (isOpen) {
      if (data && (mode === 'edit' || mode === 'view')) {
        setFormData({ ...data });
      } else {
        const initialData = {};
        fields.forEach(field => {
          initialData[field.name] = field.defaultValue || '';
        });
        setFormData(initialData);
      }
      setErrors({});

      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar scroll
      document.body.style.overflow = 'unset';
    }

    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, data, mode, fields]);

  // Manejar ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.keyCode === 27 && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Obtener título
  const getTitle = () => {
    if (typeof title === 'string') return title;
    if (typeof title === 'object' && title !== null) {
      return title[mode] || title.create || 'Modal';
    }
    return 'Modal';
  };

  // Renderizar campo
  const renderField = (field) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];
    const isDisabled = mode === 'view' || loading;

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className={styles.field}>
            <label className={styles.label}>{field.label}</label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={styles.select}
              disabled={isDisabled}
            >
              <option value="">Selecciona...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <span className={styles.error}>{error}</span>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className={styles.field}>
            <label className={styles.label}>{field.label}</label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={styles.textarea}
              disabled={isDisabled}
              rows={4}
            />
            {error && <span className={styles.error}>{error}</span>}
          </div>
        );

      default:
        return (
          <div key={field.name} className={styles.field}>
            <label className={styles.label}>{field.label}</label>
            <input
              type={field.type || 'text'}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={styles.input}
              disabled={isDisabled}
              placeholder={field.placeholder}
            />
            {error && <span className={styles.error}>{error}</span>}
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{getTitle()}</h2>
          <button 
            type="button" 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Procesando...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.fields}>
                {fields.map(renderField)}
              </div>

              {/* Actions */}
              {mode !== 'view' && (
                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={onClose}
                    className={styles.cancelButton}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {mode === 'create' ? 'Crear' : 'Actualizar'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleModal;
