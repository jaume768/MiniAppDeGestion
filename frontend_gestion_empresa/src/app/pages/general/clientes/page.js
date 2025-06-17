"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { clientesAPI } from '../../../services/api';
import styles from './clientes.module.css';

// SVG Icons
const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const IconTimes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    cif: '',
    notas: ''
  });

  // Cargar clientes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const clientesData = await clientesAPI.getAll();
        setClientes(clientesData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar clientes:", err);
        setError("Error al cargar los clientes. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Crear nuevo cliente
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newCliente = await clientesAPI.create(formData);
      setClientes([...clientes, newCliente]);
      setFormData({ nombre: '', email: '', telefono: '', direccion: '', cif: '', notas: '' });
      setShowForm(false);
      alert('Cliente creado correctamente');
    } catch (err) {
      console.error("Error al crear cliente:", err);
      setError("Error al crear el cliente. Por favor, intenta de nuevo.");
    }
  };

  // Eliminar cliente
  const eliminarCliente = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) return;
    
    try {
      await clientesAPI.delete(id);
      setClientes(clientes.filter(cliente => cliente.id !== id));
      alert('Cliente eliminado correctamente');
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      setError("Error al eliminar el cliente. Por favor, intenta de nuevo.");
    }
  };

  if (loading) return <div className={styles.loading}>Cargando clientes...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
        <Link href="/pages/general" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      <div className={styles.actionBar}>
        <button 
          className={styles.button} 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <><IconTimes /> Cancelar</> : <><IconPlus /> Nuevo Cliente</>}
        </button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
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
              />
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>Guardar</button>
              <button type="button" className={styles.cancelButton} onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>CIF/NIF</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.id}</td>
                <td>{cliente.nombre}</td>
                <td>{cliente.email || '-'}</td>
                <td>{cliente.telefono || '-'}</td>
                <td>{cliente.cif || '-'}</td>
                <td className={styles.actions}>
                  <Link href={`/pages/general/clientes/${cliente.id}`}>
                    <button className={styles.actionButton}><IconEye /></button>
                  </Link>
                  <button
                    className={styles.actionButton}
                    onClick={() => eliminarCliente(cliente.id)}
                  >
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
