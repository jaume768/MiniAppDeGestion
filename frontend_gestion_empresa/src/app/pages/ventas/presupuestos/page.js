"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { presupuestosAPI, clientesAPI, pedidosAPI, facturasAPI } from '../../../services/api';
import styles from '../ventas.module.css';

export default function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [clientes, setClientes] = useState([]);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    cliente: '',
    total: 0
  });

  // Cargar presupuestos y clientes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [presupuestosData, clientesData] = await Promise.all([
          presupuestosAPI.getAll(),
          clientesAPI.getAll()
        ]);
        
        setPresupuestos(presupuestosData);
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

  // Crear nuevo presupuesto
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newPresupuesto = await presupuestosAPI.create(formData);
      setPresupuestos([...presupuestos, newPresupuesto]);
      setFormData({ cliente: '', total: 0 });
      setShowForm(false);
      alert('Presupuesto creado correctamente');
    } catch (err) {
      console.error("Error al crear presupuesto:", err);
      setError("Error al crear el presupuesto. Por favor, intenta de nuevo.");
    }
  };

  // Convertir presupuesto a pedido
  const convertirAPedido = async (id) => {
    if (!confirm('¿Estás seguro de que deseas convertir este presupuesto en un pedido?')) return;
    
    try {
      const presupuesto = presupuestos.find(p => p.id === id);
      const pedidoData = {
        cliente: presupuesto.cliente,
        total: presupuesto.total
      };
      
      const nuevoPedido = await pedidosAPI.create(pedidoData);
      alert(`Pedido #${nuevoPedido.id} creado correctamente desde el presupuesto #${id}`);
    } catch (err) {
      console.error("Error al convertir presupuesto a pedido:", err);
      setError("Error al crear el pedido desde el presupuesto.");
    }
  };

  // Convertir presupuesto a factura
  const convertirAFactura = async (id) => {
    if (!confirm('¿Estás seguro de que deseas convertir este presupuesto en una factura?')) return;
    
    try {
      await facturasAPI.crearDesdePresupuesto(id);
      alert(`Factura creada correctamente desde el presupuesto #${id}`);
    } catch (err) {
      console.error("Error al convertir presupuesto a factura:", err);
      setError("Error al crear la factura desde el presupuesto.");
    }
  };

  // Eliminar presupuesto
  const eliminarPresupuesto = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este presupuesto?')) return;
    
    try {
      await presupuestosAPI.delete(id);
      setPresupuestos(presupuestos.filter(presupuesto => presupuesto.id !== id));
      alert('Presupuesto eliminado correctamente');
    } catch (err) {
      console.error("Error al eliminar el presupuesto:", err);
      setError("Error al eliminar el presupuesto.");
    }
  };

  return (
    <div>
      <div className={styles.ventasHeader}>
        <h2>Presupuestos</h2>
        <button 
          className={`${styles.actionButton} ${styles.primaryButton}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Nuevo Presupuesto'}
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {showForm && (
        <div className={styles.formContainer}>
          <h3>Crear Nuevo Presupuesto</h3>
          <form onSubmit={handleSubmit}>
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
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Total inicial:</label>
              <input 
                type="number"
                name="total"
                value={formData.total}
                onChange={handleInputChange}
                className={styles.formInput}
                step="0.01"
                min="0"
                required
              />
              <small>Podrás añadir artículos después de crear el presupuesto</small>
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={`${styles.actionButton} ${styles.primaryButton}`}
              >
                Crear Presupuesto
              </button>
              <button 
                type="button" 
                className={`${styles.actionButton} ${styles.secondaryButton}`}
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <p>Cargando presupuestos...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {presupuestos.length > 0 ? (
              presupuestos.map(presupuesto => (
                <tr key={presupuesto.id}>
                  <td>{presupuesto.id}</td>
                  <td>{presupuesto.cliente_nombre || `Cliente ID: ${presupuesto.cliente}`}</td>
                  <td>{new Date(presupuesto.fecha).toLocaleDateString()}</td>
                  <td>{presupuesto.total}€</td>
                  <td>
                    <div className={styles.actions}>
                      <Link 
                        href={`/pages/ventas/presupuestos/${presupuesto.id}`}
                        className={`${styles.actionButton} ${styles.secondaryButton}`}
                      >
                        Ver
                      </Link>
                      <button
                        className={`${styles.actionButton} ${styles.primaryButton}`}
                        onClick={() => convertirAPedido(presupuesto.id)}
                      >
                        Crear Pedido
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.primaryButton}`}
                        onClick={() => convertirAFactura(presupuesto.id)}
                      >
                        Crear Factura
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.dangerButton}`}
                        onClick={() => eliminarPresupuesto(presupuesto.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className={styles.noRecords}>
                  No hay presupuestos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
