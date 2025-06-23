"use client";

import { useState, useEffect } from 'react';
import { marcasAPI } from '../../services/api';
import styles from './Tablas.module.css';

const IconTimes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconSave = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

export default function FormularioMarca({ marca, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    pais_origen: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (marca) {
      setFormData({
        nombre: marca.nombre || '',
        descripcion: marca.descripcion || '',
        pais_origen: marca.pais_origen || ''
      });
    }
  }, [marca]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (marca) {
        result = await marcasAPI.update(marca.id, formData);
      } else {
        result = await marcasAPI.create(formData);
      }
      onSuccess(result);
    } catch (error) {
      console.error('Error al guardar marca:', error);
      setError('Error al guardar la marca');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>{marca ? 'Editar Marca' : 'Nueva Marca'}</h2>
        <button 
          type="button" 
          onClick={onCancel}
          className={styles.cancelButton}
        >
          <IconTimes />
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="nombre">Nombre *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className={styles.formControl}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pais_origen">País de Origen</label>
            <input
              type="text"
              id="pais_origen"
              name="pais_origen"
              value={formData.pais_origen}
              onChange={handleChange}
              className={styles.formControl}
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            className={styles.formControl}
            disabled={loading}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.buttonSecondary}
            disabled={loading}
          >
            <IconTimes /> Cancelar
          </button>
          <button
            type="submit"
            className={styles.actionButton}
            disabled={loading}
          >
            <IconSave /> {loading ? 'Guardando...' : (marca ? 'Actualizar Marca' : 'Crear Marca')}
          </button>
        </div>
      </form>
    </div>
  );
}
