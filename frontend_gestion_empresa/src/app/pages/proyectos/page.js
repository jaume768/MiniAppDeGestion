"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { proyectosAPI, clientesAPI } from '../../services/api';
import styles from './proyectos.module.css';
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

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    cliente: '',
    fecha_inicio: '',
    fecha_fin: '',
    presupuesto: '',
    estado: 'Planificación'
  });

  // Cargar proyectos y clientes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [proyectosData, clientesData] = await Promise.all([
          proyectosAPI.getAll(),
          clientesAPI.getAll()
        ]);
        
        setProyectos(proyectosData);
        setClientes(clientesData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intenta de nuevo más tarde.");
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

  // Crear nuevo proyecto
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newProyecto = await proyectosAPI.create(formData);
      setProyectos([...proyectos, newProyecto]);
      setFormData({
        nombre: '',
        cliente: '',
        fecha_inicio: '',
        fecha_fin: '',
        presupuesto: '',
        estado: 'Planificación'
      });
      setShowForm(false);
      alert('Proyecto creado correctamente');
    } catch (err) {
      console.error("Error al crear proyecto:", err);
      setError("Error al crear el proyecto. Por favor, intenta de nuevo.");
    }
  };

  // Eliminar proyecto
  const eliminarProyecto = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    
    try {
      await proyectosAPI.delete(id);
      setProyectos(proyectos.filter(proyecto => proyecto.id !== id));
      alert('Proyecto eliminado correctamente');
    } catch (err) {
      console.error("Error al eliminar el proyecto:", err);
      setError("Error al eliminar el proyecto. Es posible que tenga datos relacionados.");
    }
  };

  // Función para mostrar un color según el estado del proyecto
  const getStatusClass = (estado) => {
    switch (estado) {
      case 'Planificación':
        return 'bg-info';
      case 'En progreso':
        return 'bg-primary';
      case 'Completado':
        return 'bg-success';
      case 'Pausado':
        return 'bg-warning';
      case 'Cancelado':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Gestión de Proyectos</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <>
              <IconTimes /> Cancelar
            </>
          ) : (
            <>
              <IconPlus /> Nuevo Proyecto
            </>
          )}
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {showForm && (
        <div className="card form-container mb-4">
          <h3 className="card-header">Crear Nuevo Proyecto</h3>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-group mb-3">
              <label className="form-label">Nombre del proyecto:</label>
              <input 
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
            
            <div className="form-group mb-3">
              <label className="form-label">Cliente:</label>
              <select 
                name="cliente"
                value={formData.cliente}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Fecha de inicio:</label>
                <input 
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Fecha de fin estimada:</label>
                <input 
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Presupuesto (€):</label>
                <input 
                  type="number"
                  name="presupuesto"
                  value={formData.presupuesto}
                  onChange={handleInputChange}
                  className="form-control"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Estado:</label>
                <select 
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="Planificación">Planificación</option>
                  <option value="En progreso">En progreso</option>
                  <option value="Completado">Completado</option>
                  <option value="Pausado">Pausado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            
            <div className="form-actions d-flex gap-2 mt-4">
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Crear Proyecto
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
          { name: 'Nombre', key: 'nombre' },
          { name: 'Cliente', key: 'cliente', render: (proyecto) => proyecto.cliente_nombre || `Cliente ID: ${proyecto.cliente}` },
          { name: 'Inicio', key: 'fecha_inicio', render: (proyecto) => proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toLocaleDateString() : '-' },
          { name: 'Fin Estimado', key: 'fecha_fin', render: (proyecto) => proyecto.fecha_fin ? new Date(proyecto.fecha_fin).toLocaleDateString() : '-' },
          { name: 'Estado', key: 'estado', render: (proyecto) => (
            <span className={`badge ${getStatusClass(proyecto.estado)}`}>
              {proyecto.estado}
            </span>
          )},
        ]}
        data={proyectos}
        onRowClick={(proyecto) => window.location.href = `/pages/proyectos/${proyecto.id}`}
        actionButtons={(proyecto) => (
          <>
            <Link 
              href={`/pages/proyectos/${proyecto.id}`}
              className="btn btn-sm btn-outline-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <IconEye />
            </Link>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                eliminarProyecto(proyecto.id);
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
