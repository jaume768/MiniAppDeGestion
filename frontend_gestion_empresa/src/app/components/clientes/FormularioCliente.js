"use client";

import { useState, useEffect } from 'react';
import { clientesAPI } from '../../services/api';
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

export default function FormularioCliente({ cliente = null, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    cif: '',
    notas: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si es modo edición, cargar datos del cliente
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        cif: cliente.cif || '',
        notas: cliente.notas || ''
      });
    }
  }, [cliente]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let result;
      if (cliente) {
        // Modo edición
        result = await clientesAPI.update(cliente.id, formData);
      } else {
        // Modo creación
        result = await clientesAPI.create(formData);
      }
      
      setLoading(false);
      onSuccess(result);
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      setError("Ha ocurrido un error al guardar los datos. Por favor, intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nombre">Nombre *</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            required
            className={styles.formControl}
            disabled={loading}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={styles.formControl}
            disabled={loading}
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              className={styles.formControl}
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cif">CIF/NIF</label>
            <input
              type="text"
              id="cif"
              name="cif"
              value={formData.cif}
              onChange={handleInputChange}
              className={styles.formControl}
              disabled={loading}
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="direccion">Dirección</label>
          <input
            type="text"
            id="direccion"
            name="direccion"
            value={formData.direccion}
            onChange={handleInputChange}
            className={styles.formControl}
            disabled={loading}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="notas">Notas</label>
          <textarea
            id="notas"
            name="notas"
            value={formData.notas}
            onChange={handleInputChange}
            className={styles.formControl}
            rows="3"
            disabled={loading}
          />
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.buttonSecondary}
            onClick={onCancel}
            disabled={loading}
          >
            <IconTimes /> Cancelar
          </button>
          <button 
            type="submit" 
            className={styles.actionButton}
            disabled={loading}
          >
            <IconSave /> {loading ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
