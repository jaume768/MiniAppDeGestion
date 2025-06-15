"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { facturasAPI, clientesAPI, pedidosAPI } from '../../../services/api';
import styles from '../ventas.module.css';

export default function FacturasPage() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    cliente: '',
    pedido: '',
    total: 0,
    pagada: false
  });

  // Cargar facturas, clientes y pedidos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [facturasData, clientesData, pedidosData] = await Promise.all([
          facturasAPI.getAll(),
          clientesAPI.getAll(),
          pedidosAPI.getAll()
        ]);
        
        setFacturas(facturasData);
        setClientes(clientesData);
        setPedidos(pedidosData.filter(pedido => pedido.entregado));
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
    const { name, value, type, checked } = e.target;
    
    if (name === 'pedido' && value) {
      const selectedPedido = pedidos.find(p => p.id === parseInt(value));
      if (selectedPedido) {
        setFormData({
          ...formData,
          pedido: value,
          cliente: selectedPedido.cliente.toString(),
          total: selectedPedido.total
        });
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Crear nueva factura
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newFactura = await facturasAPI.create(formData);
      setFacturas([...facturas, newFactura]);
      setFormData({ cliente: '', pedido: '', total: 0, pagada: false });
      setShowForm(false);
      alert('Factura creada correctamente');
    } catch (err) {
      console.error("Error al crear factura:", err);
      setError("Error al crear la factura. Por favor, intenta de nuevo.");
    }
  };

  // Marcar factura como pagada
  const marcarPagada = async (id) => {
    try {
      // Asumimos que existe un endpoint para marcar como pagada
      const facturaActualizada = await facturasAPI.update(id, { pagada: true });
      setFacturas(facturas.map(factura => 
        factura.id === id ? {...factura, pagada: true} : factura
      ));
      alert('Factura marcada como pagada');
    } catch (err) {
      console.error("Error al actualizar la factura:", err);
      setError("Error al marcar la factura como pagada.");
    }
  };

  // Eliminar factura
  const eliminarFactura = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;
    
    try {
      await facturasAPI.delete(id);
      setFacturas(facturas.filter(factura => factura.id !== id));
      alert('Factura eliminada correctamente');
    } catch (err) {
      console.error("Error al eliminar la factura:", err);
      setError("Error al eliminar la factura.");
    }
  };

  return (
    <div>
      <div className={styles.ventasHeader}>
        <h2>Facturas</h2>
        <button 
          className={`${styles.actionButton} ${styles.primaryButton}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Nueva Factura'}
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {showForm && (
        <div className={styles.formContainer}>
          <h3>Crear Nueva Factura</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Pedido relacionado (opcional):</label>
              <select 
                name="pedido"
                value={formData.pedido}
                onChange={handleInputChange}
                className={styles.formInput}
              >
                <option value="">Ninguno (crear factura directa)</option>
                {pedidos.map(pedido => (
                  <option key={pedido.id} value={pedido.id}>
                    Pedido #{pedido.id} - {pedido.cliente_nombre || `Cliente ID: ${pedido.cliente}`} ({pedido.total}€)
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cliente:</label>
              <select 
                name="cliente"
                value={formData.cliente}
                onChange={handleInputChange}
                className={styles.formInput}
                required
                disabled={formData.pedido !== ''}
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
              <label className={styles.formLabel}>Total:</label>
              <input 
                type="number"
                name="total"
                value={formData.total}
                onChange={handleInputChange}
                className={styles.formInput}
                step="0.01"
                min="0"
                required
                disabled={formData.pedido !== ''}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input 
                  type="checkbox"
                  name="pagada"
                  checked={formData.pagada}
                  onChange={handleInputChange}
                /> Pagada
              </label>
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={`${styles.actionButton} ${styles.primaryButton}`}
              >
                Crear Factura
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
        <p>Cargando facturas...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.length > 0 ? (
              facturas.map(factura => (
                <tr key={factura.id}>
                  <td>{factura.id}</td>
                  <td>{factura.cliente_nombre || `Cliente ID: ${factura.cliente}`}</td>
                  <td>{new Date(factura.fecha).toLocaleDateString()}</td>
                  <td>{factura.total}€</td>
                  <td>
                    <span className={`${styles.statusBadge} ${factura.pagada ? styles.statusCompleted : styles.statusPending}`}>
                      {factura.pagada ? 'Pagada' : 'Pendiente de pago'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link 
                        href={`/pages/ventas/facturas/${factura.id}`}
                        className={`${styles.actionButton} ${styles.secondaryButton}`}
                      >
                        Ver
                      </Link>
                      {!factura.pagada && (
                        <button
                          className={`${styles.actionButton} ${styles.primaryButton}`}
                          onClick={() => marcarPagada(factura.id)}
                        >
                          Marcar Pagada
                        </button>
                      )}
                      <button
                        className={`${styles.actionButton} ${styles.dangerButton}`}
                        onClick={() => eliminarFactura(factura.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles.noRecords}>
                  No hay facturas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
