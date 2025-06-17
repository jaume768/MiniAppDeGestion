"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { empleadosAPI, departamentosAPI } from '../../../services/api';
import styles from './empleados.module.css';

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

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    puesto: '',
    departamento: '',
    fecha_contratacion: '',
    salario: ''
  });

  // Cargar empleados y departamentos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar empleados y departamentos en paralelo
        const [empleadosData, departamentosData] = await Promise.all([
          empleadosAPI.getAll(),
          departamentosAPI.getAll()
        ]);
        
        // Crear un mapa de departamentos para fácil búsqueda
        const deptMap = {};
        departamentosData.forEach(dept => {
          deptMap[dept.id] = dept.nombre;
        });
        
        // Añadir el nombre del departamento a cada empleado
        const empleadosConDepartamento = empleadosData.map(empleado => ({
          ...empleado,
          departamento_nombre: deptMap[empleado.departamento] || 'Sin departamento'
        }));
        
        setEmpleados(empleadosConDepartamento);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar empleados:", err);
        setError("Error al cargar los empleados. Por favor, intenta de nuevo más tarde.");
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

  // Crear nuevo empleado
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newEmpleado = await empleadosAPI.create(formData);
      setEmpleados([...empleados, newEmpleado]);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        puesto: '',
        departamento: '',
        fecha_contratacion: '',
        salario: ''
      });
      setShowForm(false);
      alert('Empleado creado correctamente');
    } catch (err) {
      console.error("Error al crear empleado:", err);
      setError("Error al crear el empleado. Por favor, intenta de nuevo.");
    }
  };

  // Eliminar empleado
  const eliminarEmpleado = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.')) return;
    
    try {
      await empleadosAPI.delete(id);
      setEmpleados(empleados.filter(empleado => empleado.id !== id));
      alert('Empleado eliminado correctamente');
    } catch (err) {
      console.error("Error al eliminar el empleado:", err);
      setError("Error al eliminar el empleado. Es posible que esté asignado a proyectos.");
    }
  };

  if (loading) return <div className={styles.loading}>Cargando empleados...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Empleados</h1>
        <Link href="/pages/general" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      <div className={styles.actionBar}>
        <button 
          className={styles.button} 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <><IconTimes /> Cancelar</> : <><IconPlus /> Nuevo Empleado</>}
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
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
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
                <label htmlFor="puesto">Puesto *</label>
                <input
                  type="text"
                  id="puesto"
                  name="puesto"
                  value={formData.puesto}
                  onChange={handleInputChange}
                  required
                  className={styles.formControl}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="departamento">Departamento *</label>
                <input
                  type="text"
                  id="departamento"
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  required
                  className={styles.formControl}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="fecha_contratacion">Fecha de contratación</label>
                <input
                  type="date"
                  id="fecha_contratacion"
                  name="fecha_contratacion"
                  value={formData.fecha_contratacion}
                  onChange={handleInputChange}
                  className={styles.formControl}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="salario">Salario anual (€)</label>
              <input
                type="number"
                id="salario"
                name="salario"
                value={formData.salario}
                onChange={handleInputChange}
                step="100"
                min="0"
                className={styles.formControl}
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
              <th>Puesto</th>
              <th>Departamento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((empleado) => (
              <tr key={empleado.id}>
                <td>{empleado.id}</td>
                <td>{empleado.nombre}</td>
                <td>{empleado.email || '-'}</td>
                <td>{empleado.puesto || '-'}</td>
                <td>{empleado.departamento_nombre || '-'}</td>
                <td className={styles.actions}>
                  <Link href={`/pages/general/empleados/${empleado.id}`}>
                    <button className={styles.actionButton}><IconEye /></button>
                  </Link>
                  <button
                    className={styles.actionButton}
                    onClick={() => eliminarEmpleado(empleado.id)}
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
