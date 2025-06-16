"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { clientesAPI } from '../../services/api';
import styles from './clientes.module.css';
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
      console.error("Error al eliminar el cliente:", err);
      setError("Error al eliminar el cliente. Es posible que tenga pedidos o facturas asociadas.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Gestión de Clientes</h2>
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
              <IconPlus /> Nuevo Cliente
            </>
          )}
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {showForm && (
        <div className="card form-container mb-4">
          <h3 className="card-header">Crear Nuevo Cliente</h3>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-group mb-3">
              <label className="form-label">Nombre/Razón Social:</label>
              <input 
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Email:</label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Teléfono:</label>
                <input 
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group mb-3">
              <label className="form-label">Dirección:</label>
              <input 
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group mb-3">
              <label className="form-label">CIF/NIF:</label>
              <input 
                type="text"
                name="cif"
                value={formData.cif}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Crear Cliente
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
          { name: 'Email', key: 'email', render: (cliente) => cliente.email || '-' },
          { name: 'Teléfono', key: 'telefono', render: (cliente) => cliente.telefono || '-' },
          { name: 'CIF/NIF', key: 'cif', render: (cliente) => cliente.cif || '-' },
        ]}
        data={clientes}
        onRowClick={(cliente) => window.location.href = `/pages/clientes/${cliente.id}`}
        actionButtons={(cliente) => (
          <>
            <Link 
              href={`/pages/clientes/${cliente.id}`}
              className="btn btn-sm btn-outline-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <IconEye />
            </Link>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                eliminarCliente(cliente.id);
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
