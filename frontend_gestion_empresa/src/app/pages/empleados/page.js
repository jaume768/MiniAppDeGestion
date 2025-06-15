"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { empleadosAPI } from '../../services/api';
import styles from './empleados.module.css';
import TableComponent from '../../components/TableComponent';
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
    apellidos: '',
    email: '',
    telefono: '',
    puesto: '',
    departamento: '',
    fecha_contratacion: '',
    salario: ''
  });

  // Cargar empleados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const empleadosData = await empleadosAPI.getAll();
        setEmpleados(empleadosData);
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
        apellidos: '',
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

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Gestión de Empleados</h1>
        <button 
          className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <>
              <IconTimes size={18} /> Cancelar
            </>
          ) : (
            <>
              <IconPlus size={18} /> Nuevo Empleado
            </>
          )}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      {showForm && (
        <div className="card mb-4">
          <h3 className="card-title mb-3">Añadir Nuevo Empleado</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre:</label>
                <input 
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre del empleado"
                />
              </div>
              
              <div className="form-group">
                <label>Apellidos:</label>
                <input 
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  required
                  placeholder="Apellidos del empleado"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Email:</label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="correo@ejemplo.com"
                />
              </div>
              
              <div className="form-group">
                <label>Teléfono:</label>
                <input 
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="+34 666 555 444"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Puesto:</label>
                <input 
                  type="text"
                  name="puesto"
                  value={formData.puesto}
                  onChange={handleInputChange}
                  required
                  placeholder="Puesto de trabajo"
                />
              </div>
              
              <div className="form-group">
                <label>Departamento:</label>
                <input 
                  type="text"
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  required
                  placeholder="Departamento"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Fecha de contratación:</label>
                <input 
                  type="date"
                  name="fecha_contratacion"
                  value={formData.fecha_contratacion}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Salario anual (€):</label>
                <input 
                  type="number"
                  name="salario"
                  value={formData.salario}
                  onChange={handleInputChange}
                  step="100"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Crear Empleado
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      
      <TableComponent
        isLoading={loading}
        headers={[
          { name: 'ID', key: 'id' },
          { name: 'Nombre', key: 'nombre_completo', render: (empleado) => `${empleado.nombre} ${empleado.apellidos}` },
          { name: 'Email', key: 'email', render: (empleado) => empleado.email || '-' },
          { name: 'Puesto', key: 'puesto', render: (empleado) => empleado.puesto || '-' },
          { name: 'Departamento', key: 'departamento', render: (empleado) => empleado.departamento || '-' },
        ]}
        data={empleados}
        onRowClick={(empleado) => window.location.href = `/pages/empleados/${empleado.id}`}
        actionButtons={(empleado) => (
          <>
            <Link 
              href={`/pages/empleados/${empleado.id}`}
              className="btn btn-sm btn-outline-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <IconEye />
            </Link>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                eliminarEmpleado(empleado.id);
              }}
            >
              <IconTrash />
            </button>
          </>
        )}
      />
    </div>
  );
}
