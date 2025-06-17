"use client";

import { useState, useEffect } from 'react';
import { empleadosAPI, departamentosAPI } from '../../services/api';
import styles from '../clientes/Tablas.module.css';

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

export default function FormularioEmpleado({ empleado = null, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    cargo: '',
    departamento: '',
    fecha_contratacion: '',
    direccion: '',
    dni: '',
    notas: ''
  });
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [error, setError] = useState(null);

  // Cargar departamentos
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const data = await departamentosAPI.getAll();
        setDepartamentos(data);
        setLoadingDepts(false);
      } catch (err) {
        console.error("Error al cargar departamentos:", err);
        setLoadingDepts(false);
      }
    };
    
    fetchDepartamentos();
  }, []);

  // Si es modo edición, cargar datos del empleado
  useEffect(() => {
    if (empleado) {
      setFormData({
        nombre: empleado.nombre || '',
        email: empleado.email || '',
        telefono: empleado.telefono || '',
        cargo: empleado.cargo || '',
        departamento: empleado.departamento || '',
        fecha_contratacion: empleado.fecha_contratacion || '',
        direccion: empleado.direccion || '',
        dni: empleado.dni || '',
        notas: empleado.notas || ''
      });
    }
  }, [empleado]);

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
      if (empleado) {
        // Modo edición
        result = await empleadosAPI.update(empleado.id, formData);
      } else {
        // Modo creación
        result = await empleadosAPI.create(formData);
      }
      
      setLoading(false);
      onSuccess(result);
    } catch (err) {
      console.error("Error al guardar empleado:", err);
      setError("Ha ocurrido un error al guardar los datos. Por favor, intenta de nuevo.");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className={styles.formContainer}>
      <h2>{empleado ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
      
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
        
        <div className={styles.formRow}>
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
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="cargo">Cargo</label>
            <input
              type="text"
              id="cargo"
              name="cargo"
              value={formData.cargo}
              onChange={handleInputChange}
              className={styles.formControl}
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="departamento">Departamento</label>
            <select
              id="departamento"
              name="departamento"
              value={formData.departamento}
              onChange={handleInputChange}
              className={styles.formControl}
              disabled={loading || loadingDepts}
            >
              <option value="">Seleccionar departamento</option>
              {departamentos.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="fecha_contratacion">Fecha de contratación</label>
            <input
              type="date"
              id="fecha_contratacion"
              name="fecha_contratacion"
              value={formatDate(formData.fecha_contratacion)}
              onChange={handleInputChange}
              className={styles.formControl}
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="dni">DNI/NIE</label>
            <input
              type="text"
              id="dni"
              name="dni"
              value={formData.dni}
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
            <IconSave /> {loading ? 'Guardando...' : 'Guardar Empleado'}
          </button>
        </div>
      </form>
    </div>
  );
}
