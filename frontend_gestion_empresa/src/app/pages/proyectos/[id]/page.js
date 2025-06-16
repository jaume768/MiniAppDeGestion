"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { proyectosAPI, clientesAPI, empleadosAPI } from '../../../services/api';
import styles from '../proyectos.module.css';
import Navigation from '../../../components/Navigation';

export default function ProyectoDetalle({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [proyecto, setProyecto] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]); 
  const [asignados, setAsignados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  
  // Estado para el formulario de edición
  const [formData, setFormData] = useState({
    nombre: '',
    cliente: '',
    fecha_inicio: '',
    fecha_fin: '',
    presupuesto: '',
    estado: '',
    descripcion: ''
  });

  // Estado para añadir empleados
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');

  // Cargar datos del proyecto
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar proyecto, clientes y empleados
        const [proyectoData, clientesData, empleadosData] = await Promise.all([
          proyectosAPI.getById(id),
          clientesAPI.getAll(),
          empleadosAPI.getAll()
        ]);
        
        setProyecto(proyectoData);
        setClientes(clientesData);
        setEmpleados(empleadosData);
        
        // Inicializar formData con los datos del proyecto
        setFormData({
          nombre: proyectoData.nombre || '',
          cliente: proyectoData.cliente || '',
          fecha_inicio: proyectoData.fecha_inicio || '',
          fecha_fin: proyectoData.fecha_fin || '',
          presupuesto: proyectoData.presupuesto || '',
          estado: proyectoData.estado || 'Planificación',
          descripcion: proyectoData.descripcion || ''
        });
        
        // Si hay endpoints para cargar empleados asignados, aquí los cargaríamos
        // Por ahora, simulamos con un array vacío
        // En un caso real: const asignadosData = await proyectosAPI.getEmpleadosAsignados(id);
        setAsignados(proyectoData.empleados_asignados || []);
        
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos del proyecto:", err);
        setError("Error al cargar los datos del proyecto. Por favor, intenta de nuevo más tarde.");
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

  // Actualizar proyecto
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const updatedProyecto = await proyectosAPI.update(id, formData);
      setProyecto(updatedProyecto);
      setEditing(false);
      alert('Proyecto actualizado correctamente');
    } catch (err) {
      console.error("Error al actualizar proyecto:", err);
      setError("Error al actualizar el proyecto. Por favor, intenta de nuevo.");
    }
  };

  // Eliminar proyecto
  const eliminarProyecto = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    
    try {
      await proyectosAPI.delete(id);
      alert('Proyecto eliminado correctamente');
      router.push('/pages/proyectos');
    } catch (err) {
      console.error("Error al eliminar el proyecto:", err);
      setError("Error al eliminar el proyecto. Es posible que tenga datos relacionados.");
    }
  };

  // Asignar empleado al proyecto
  const asignarEmpleado = async () => {
    if (!empleadoSeleccionado) return;
    
    try {
      // En un caso real, llamaríamos a la API para asignar el empleado
      // Ejemplo: await proyectosAPI.asignarEmpleado(id, empleadoSeleccionado);
      
      // Por ahora, simulamos añadirlo al array local
      const empleadoAAsignar = empleados.find(e => e.id.toString() === empleadoSeleccionado);
      if (empleadoAAsignar && !asignados.some(a => a.id === empleadoAAsignar.id)) {
        setAsignados([...asignados, empleadoAAsignar]);
        setEmpleadoSeleccionado('');
      }
    } catch (err) {
      console.error("Error al asignar empleado:", err);
      setError("Error al asignar el empleado al proyecto.");
    }
  };

  // Desasignar empleado del proyecto
  const desasignarEmpleado = async (empleadoId) => {
    if (!confirm('¿Estás seguro de que deseas desasignar este empleado del proyecto?')) return;
    
    try {
      // En un caso real, llamaríamos a la API para desasignar el empleado
      // Ejemplo: await proyectosAPI.desasignarEmpleado(id, empleadoId);
      
      // Por ahora, simulamos eliminarlo del array local
      setAsignados(asignados.filter(e => e.id !== empleadoId));
    } catch (err) {
      console.error("Error al desasignar empleado:", err);
      setError("Error al desasignar el empleado del proyecto.");
    }
  };

  // Obtener color según estado del proyecto
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Planificación':
        return styles.statusPlanning;
      case 'En progreso':
        return styles.statusInProgress;
      case 'Completado':
        return styles.statusCompleted;
      case 'Pausado':
        return styles.statusPaused;
      case 'Cancelado':
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  if (loading) return (
    <div>
      <p>Cargando información del proyecto...</p>
    </div>
  );
  
  if (error) return (
    <div>
        <div className={styles.errorMessage}>{error}</div>
    </div>
  );
  
  if (!proyecto) return (
    <div>
      <p>No se encontró el proyecto solicitado.</p>
    </div>
  );

  // Obtener el nombre del cliente
  const clienteNombre = clientes.find(c => c.id == proyecto.cliente)?.nombre || `Cliente ID: ${proyecto.cliente}`;

  return (
    <div>
      <div className={styles.detailHeader}>
        <Link href="/pages/proyectos" className={styles.backLink}>
          &larr; Volver a proyectos
        </Link>
        <h2>{proyecto.nombre}</h2>
        <div className={styles.detailActions}>
          {!editing ? (
            <button 
              className={`${styles.actionButton} ${styles.primaryButton}`}
              onClick={() => setEditing(true)}
            >
              Editar Proyecto
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
            onClick={eliminarProyecto}
          >
            Eliminar Proyecto
          </button>
        </div>
      </div>

      <div className={styles.detailCard}>
        {editing ? (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombre del proyecto:</label>
              <input 
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cliente:</label>
              <select 
                name="cliente"
                value={formData.cliente}
                onChange={handleInputChange}
                className={styles.formInput}
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
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha de inicio:</label>
                <input 
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha de fin estimada:</label>
                <input 
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Presupuesto (€):</label>
                <input 
                  type="number"
                  name="presupuesto"
                  value={formData.presupuesto}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado:</label>
                <select 
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className={styles.formInput}
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
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Descripción:</label>
              <textarea 
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                className={`${styles.formInput} ${styles.formTextarea}`}
                rows="4"
              ></textarea>
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
          <div className={styles.projectInfo}>
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Nombre del proyecto:</span>
              <span className={styles.infoValue}>{proyecto.nombre}</span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Cliente:</span>
              <span className={styles.infoValue}>
                <Link href={`/pages/clientes/${proyecto.cliente}`}>{clienteNombre}</Link>
              </span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Fecha de inicio:</span>
              <span className={styles.infoValue}>
                {proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toLocaleDateString() : '-'}
              </span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Fecha de fin estimada:</span>
              <span className={styles.infoValue}>
                {proyecto.fecha_fin ? new Date(proyecto.fecha_fin).toLocaleDateString() : '-'}
              </span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Presupuesto:</span>
              <span className={styles.infoValue}>
                {proyecto.presupuesto ? `${parseFloat(proyecto.presupuesto).toLocaleString()} €` : '-'}
              </span>
            </div>
            
            <div className={styles.infoGroup}>
              <span className={styles.infoLabel}>Estado:</span>
              <span className={`${styles.statusBadge} ${getStatusColor(proyecto.estado)}`}>
                {proyecto.estado}
              </span>
            </div>
            
            {proyecto.descripcion && (
              <div className={styles.infoGroup} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.infoLabel}>Descripción:</span>
                <p className={styles.infoValue}>{proyecto.descripcion}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className={styles.detailSection}>
        <div className={styles.sectionHeader}>
          <h3>Equipo de proyecto</h3>
        </div>
        
        <div className={styles.formRow} style={{ marginBottom: '1rem' }}>
          <div className={styles.formGroup} style={{ flex: '2' }}>
            <select 
              value={empleadoSeleccionado}
              onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
              className={styles.formInput}
            >
              <option value="">Selecciona un empleado</option>
              {empleados.map(empleado => (
                <option key={empleado.id} value={empleado.id}>
                  {`${empleado.nombre} - ${empleado.puesto || 'Sin puesto'}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button 
              className={`${styles.actionButton} ${styles.primaryButton}`}
              onClick={asignarEmpleado}
              disabled={!empleadoSeleccionado}
            >
              Asignar al proyecto
            </button>
          </div>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {asignados.length > 0 ? (
                asignados.map(empleado => (
                  <tr key={empleado.id}>
                    <td>{empleado.id}</td>
                    <td>
                      <Link href={`/pages/empleados/${empleado.id}`}>
                        {`${empleado.nombre}`}
                      </Link>
                    </td>
                    <td>{empleado.puesto || '-'}</td>
                    <td>
                      <button
                        className={`${styles.actionButton} ${styles.dangerButton}`}
                        onClick={() => desasignarEmpleado(empleado.id)}
                      >
                        Desasignar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className={styles.noRecords}>
                    No hay empleados asignados a este proyecto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className={styles.detailSection}>
        <div className={styles.sectionHeader}>
          <h3>Documentos y archivos</h3>
        </div>
        <p>Funcionalidad para gestionar documentos del proyecto a implementar en una futura versión.</p>
      </div>
      
      <div className={styles.detailSection}>
        <div className={styles.sectionHeader}>
          <h3>Tareas y actividades</h3>
        </div>
        <p>Funcionalidad para gestionar tareas del proyecto a implementar en una futura versión.</p>
      </div>
    </div>
  );
}
