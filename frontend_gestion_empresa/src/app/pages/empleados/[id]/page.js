"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { empleadosAPI, departamentosAPI } from '../../../services/api';
import styles from '../empleados.module.css';
import Navigation from '../../../components/Navigation';

export default function EmpleadoDetalle({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  
  // Estado para el formulario de edición
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    puesto: '',
    departamento: '',
    fecha_contratacion: '',
    salario: ''
  });

  // Cargar datos del empleado
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar empleado y departamentos en paralelo
        const [empleadoData, departamentosData] = await Promise.all([
          empleadosAPI.getById(id),
          departamentosAPI.getAll()
        ]);
        
        // Crear un mapa de departamentos para fácil búsqueda
        const deptMap = {};
        departamentosData.forEach(dept => {
          deptMap[dept.id] = dept.nombre;
        });
        
        // Añadir el nombre del departamento al empleado
        const empleadoConDepartamento = {
          ...empleadoData,
          departamento_nombre: deptMap[empleadoData.departamento] || 'Sin departamento'
        };
        
        setEmpleado(empleadoConDepartamento);
        
        // Inicializar formData con los datos del empleado
        setFormData({
          nombre: empleadoData.nombre || '',
          email: empleadoData.email || '',
          telefono: empleadoData.telefono || '',
          puesto: empleadoData.puesto || '',
          departamento: empleadoData.departamento || '',
          fecha_contratacion: empleadoData.fecha_contratacion || '',
          salario: empleadoData.salario || ''
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos del empleado:", err);
        setError("Error al cargar los datos del empleado. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Actualizar empleado
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const updatedEmpleado = await empleadosAPI.update(id, formData);
      setEmpleado(updatedEmpleado);
      setEditing(false);
      alert('Empleado actualizado correctamente');
    } catch (err) {
      console.error("Error al actualizar empleado:", err);
      setError("Error al actualizar el empleado. Por favor, intenta de nuevo.");
    }
  };

  // Eliminar empleado
  const eliminarEmpleado = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.')) return;
    
    try {
      await empleadosAPI.delete(id);
      alert('Empleado eliminado correctamente');
      router.push('/pages/empleados');
    } catch (err) {
      console.error("Error al eliminar el empleado:", err);
      setError("Error al eliminar el empleado. Es posible que esté asignado a proyectos.");
    }
  };

  if (loading) return (
    <div>
      <p>Cargando información del empleado...</p>
    </div>
  );
  
  if (error) return (
    <div>
      <div className={styles.errorMessage}>{error}</div>
    </div>
  );
  
  if (!empleado) return (
    <div>
      <p>No se encontró el empleado solicitado.</p>
    </div>
  );

  return (
    <div>
      <div className={styles.detailHeader}>
        <Link href="/pages/empleados" className={styles.backLink}>
          &larr; Volver a empleados
        </Link>
        <h2>{`${empleado.nombre}`}</h2>
        <div className={styles.detailActions}>
          {!editing ? (
            <button 
              className={`${styles.actionButton} ${styles.primaryButton}`}
              onClick={() => setEditing(true)}
            >
              Editar Empleado
            </button>
          ) : (
            <button 
              className={`${styles.actionButton} ${styles.secondaryButton}`}
              onClick={() => setEditing(false)}
            >
              Cancelar Edición
            </button>
          )}
          <button 
            className={`${styles.actionButton} ${styles.dangerButton}`}
            onClick={eliminarEmpleado}
          >
            Eliminar Empleado
          </button>
        </div>
      </div>

      <div className={styles.detailCard}>
        {editing ? (
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre:</label>
                <input 
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  required
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email:</label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Teléfono:</label>
                <input 
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Puesto:</label>
                <input 
                  type="text"
                  name="puesto"
                  value={formData.puesto}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Departamento:</label>
                <input 
                  type="text"
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  required
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha de contratación:</label>
                <input 
                  type="date"
                  name="fecha_contratacion"
                  value={formData.fecha_contratacion}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Salario anual (€):</label>
                <input 
                  type="number"
                  name="salario"
                  value={formData.salario}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  step="100"
                  min="0"
                />
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={`${styles.actionButton} ${styles.primaryButton}`}
              >
                Guardar Cambios
              </button>
              <button 
                type="button" 
                className={`${styles.actionButton} ${styles.secondaryButton}`}
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.employeeInfo}>
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Nombre:</span>
              <span className={styles.infoValue}>{empleado.nombre}</span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Email:</span>
              <span className={styles.infoValue}>{empleado.email || '-'}</span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Teléfono:</span>
              <span className={styles.infoValue}>{empleado.telefono || '-'}</span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Puesto:</span>
              <span className={styles.infoValue}>{empleado.puesto || '-'}</span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Departamento:</span>
              <span className={styles.infoValue}>{empleado.departamento_nombre || '-'}</span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Fecha de contratación:</span>
              <span className={styles.infoValue}>
                {empleado.fecha_contratacion ? new Date(empleado.fecha_contratacion).toLocaleDateString() : '-'}
              </span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Salario anual:</span>
              <span className={styles.infoValue}>
                {empleado.salario ? `${parseFloat(empleado.salario).toLocaleString()} €` : '-'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.detailSection}>
        <h3>Proyectos asignados</h3>
        <p>Esta sección mostrará los proyectos en los que participa el empleado cuando se implemente la gestión de proyectos.</p>
      </div>
    </div>
  );
}
