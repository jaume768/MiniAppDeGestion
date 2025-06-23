"use client";

import { useState, useEffect } from 'react';
import { articulosAPI, categoriasAPI, marcasAPI } from '../../services/api';
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

export default function FormularioArticulo({ articulo, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: '',
    marca: '',
    modelo: '',
    iva: '21'
  });
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (articulo) {
      setFormData({
        codigo: articulo.codigo || '',
        nombre: articulo.nombre || '',
        descripcion: articulo.descripcion || '',
        precio: articulo.precio || '',
        stock: articulo.stock || '',
        categoria: articulo.categoria || '',
        marca: articulo.marca || '',
        modelo: articulo.modelo || '',
        iva: articulo.iva || '21'
      });
    }
    fetchCategorias();
    fetchMarcas();
  }, [articulo]);

  const fetchCategorias = async () => {
    try {
      const data = await categoriasAPI.getAll();
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setError('Error al cargar categorías');
    }
  };

  const fetchMarcas = async () => {
    try {
      const data = await marcasAPI.getAll();
      setMarcas(data);
    } catch (error) {
      console.error('Error al cargar marcas:', error);
      setError('Error al cargar marcas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (articulo) {
        result = await articulosAPI.update(articulo.id, formData);
      } else {
        result = await articulosAPI.create(formData);
      }
      onSuccess(result);
    } catch (error) {
      console.error('Error al guardar articulo:', error);
      setError('Error al guardar el artículo');
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
        <h2>{articulo ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
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
            <label htmlFor="codigo">Código *</label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
              className={styles.formControl}
              disabled={loading}
            />
          </div>

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
            <label htmlFor="categoria">Categoría</label>
            <select
              id="categoria"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className={styles.formControl}
              disabled={loading}
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="marca">Marca</label>
            <select
              id="marca"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              className={styles.formControl}
              disabled={loading}
            >
              <option value="">Seleccionar marca</option>
              {marcas.map(marca => (
                <option key={marca.id} value={marca.id}>
                  {marca.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="modelo">Modelo</label>
            <input
              type="text"
              id="modelo"
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              className={styles.formControl}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="precio">Precio</label>
            <input
              type="number"
              id="precio"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={styles.formControl}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="stock">Stock</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              className={styles.formControl}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="iva">IVA (%)</label>
            <select
              id="iva"
              name="iva"
              value={formData.iva}
              onChange={handleChange}
              className={styles.formControl}
              disabled={loading}
            >
              <option value="0">0%</option>
              <option value="4">4%</option>
              <option value="10">10%</option>
              <option value="21">21%</option>
            </select>
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
            <IconSave /> {loading ? 'Guardando...' : (articulo ? 'Actualizar Artículo' : 'Crear Artículo')}
          </button>
        </div>
      </form>
    </div>
  );
}
