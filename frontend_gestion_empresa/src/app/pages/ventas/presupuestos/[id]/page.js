"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { presupuestosAPI, articulosAPI, pedidosAPI, facturasAPI } from '../../../../services/api';
import styles from '../../ventas.module.css';

export default function PresupuestoDetalle({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [presupuesto, setPresupuesto] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormItem, setShowFormItem] = useState(false);
  const [articulos, setArticulos] = useState([]);
  
  // Estado para el formulario de añadir item
  const [formItem, setFormItem] = useState({
    articulo: '',
    cantidad: 1,
    precio_unitario: 0
  });

  // Cargar detalles del presupuesto
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar presupuesto, sus items, y lista de artículos
        const presupuestoData = await presupuestosAPI.getById(id);
        const itemsData = await presupuestosAPI.getItems(id);
        const articulosData = await articulosAPI.getAll();
        
        setPresupuesto(presupuestoData);
        setItems(itemsData);
        setArticulos(articulosData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Manejar cambios en el formulario de añadir item
  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si se selecciona un artículo, establecer su precio como precio unitario
    if (name === 'articulo' && value) {
      const selectedArticulo = articulos.find(a => a.id === parseInt(value));
      if (selectedArticulo) {
        setFormItem({
          ...formItem,
          articulo: value,
          precio_unitario: selectedArticulo.precio
        });
        return;
      }
    }
    
    setFormItem({
      ...formItem,
      [name]: value
    });
  };

  // Añadir item al presupuesto
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    try {
      const newItem = await presupuestosAPI.addItem(id, formItem);
      
      // Actualizar lista de items y total del presupuesto
      setItems([...items, newItem]);
      
      // Recalcular el total del presupuesto
      const nuevoTotal = items.reduce((total, item) => {
        return total + (item.cantidad * item.precio_unitario);
      }, 0) + (formItem.cantidad * formItem.precio_unitario);
      
      // Actualizar el presupuesto con el nuevo total
      const presupuestoActualizado = await presupuestosAPI.update(id, { total: nuevoTotal });
      setPresupuesto(presupuestoActualizado);
      
      // Resetear formulario
      setFormItem({
        articulo: '',
        cantidad: 1,
        precio_unitario: 0
      });
      setShowFormItem(false);
      
      alert('Artículo añadido correctamente');
    } catch (err) {
      console.error("Error al añadir artículo:", err);
      setError("Error al añadir el artículo al presupuesto.");
    }
  };

  // Convertir presupuesto a pedido
  const convertirAPedido = async () => {
    if (!confirm('¿Estás seguro de que deseas convertir este presupuesto en un pedido?')) return;
    
    try {
      const pedidoData = {
        cliente: presupuesto.cliente,
        total: presupuesto.total
      };
      
      const nuevoPedido = await pedidosAPI.create(pedidoData);
      
      // Copiar los items del presupuesto al pedido
      for (const item of items) {
        await pedidosAPI.addItem(nuevoPedido.id, {
          articulo: item.articulo,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario
        });
      }
      
      alert(`Pedido #${nuevoPedido.id} creado correctamente desde el presupuesto #${id}`);
      router.push(`/pages/ventas/pedidos/${nuevoPedido.id}`);
    } catch (err) {
      console.error("Error al convertir presupuesto a pedido:", err);
      setError("Error al crear el pedido desde el presupuesto.");
    }
  };

  // Convertir presupuesto a factura
  const convertirAFactura = async () => {
    if (!confirm('¿Estás seguro de que deseas convertir este presupuesto en una factura?')) return;
    
    try {
      const respuesta = await facturasAPI.crearDesdePresupuesto(id);
      alert(`Factura #${respuesta.id} creada correctamente desde el presupuesto #${id}`);
      router.push(`/pages/ventas/facturas/${respuesta.id}`);
    } catch (err) {
      console.error("Error al convertir presupuesto a factura:", err);
      setError("Error al crear la factura desde el presupuesto.");
    }
  };

  // Eliminar presupuesto
  const eliminarPresupuesto = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este presupuesto?')) return;
    
    try {
      await presupuestosAPI.delete(id);
      alert('Presupuesto eliminado correctamente');
      router.push('/pages/ventas/presupuestos');
    } catch (err) {
      console.error("Error al eliminar el presupuesto:", err);
      setError("Error al eliminar el presupuesto.");
    }
  };

  if (loading) return <p>Cargando detalles del presupuesto...</p>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (!presupuesto) return <p>No se encontró el presupuesto solicitado.</p>;

  return (
    <div>
      <div className={styles.detailHeader}>
        <Link href="/pages/ventas/presupuestos" className={styles.backLink}>
          &larr; Volver a presupuestos
        </Link>
        <h2>Presupuesto #{id}</h2>
        <div className={styles.detailActions}>
          <button 
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={convertirAPedido}
          >
            Crear Pedido
          </button>
          <button 
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={convertirAFactura}
          >
            Crear Factura
          </button>
          <button 
            className={`${styles.actionButton} ${styles.dangerButton}`}
            onClick={eliminarPresupuesto}
          >
            Eliminar presupuesto
          </button>
        </div>
      </div>

      <div className={styles.detailCard}>
        <div className={styles.detailSection}>
          <h3>Información del presupuesto</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Cliente:</span>
              <span className={styles.detailValue}>
                {presupuesto.cliente_nombre || `Cliente ID: ${presupuesto.cliente}`}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Fecha:</span>
              <span className={styles.detailValue}>
                {new Date(presupuesto.fecha).toLocaleDateString()}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Total:</span>
              <span className={styles.detailValue}>
                {presupuesto.total}€
              </span>
            </div>
          </div>
        </div>

        <div className={styles.detailSection}>
          <div className={styles.sectionHeader}>
            <h3>Artículos</h3>
            <button 
              className={`${styles.actionButton} ${styles.primaryButton}`}
              onClick={() => setShowFormItem(!showFormItem)}
            >
              {showFormItem ? 'Cancelar' : 'Añadir artículo'}
            </button>
          </div>
          
          {showFormItem && (
            <div className={styles.formContainer}>
              <h4>Añadir Artículo</h4>
              <form onSubmit={handleAddItem}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Artículo:</label>
                  <select 
                    name="articulo"
                    value={formItem.articulo}
                    onChange={handleItemInputChange}
                    className={styles.formInput}
                    required
                  >
                    <option value="">Selecciona un artículo</option>
                    {articulos.map(articulo => (
                      <option key={articulo.id} value={articulo.id}>
                        {articulo.nombre} - {articulo.precio}€
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cantidad:</label>
                  <input 
                    type="number"
                    name="cantidad"
                    value={formItem.cantidad}
                    onChange={handleItemInputChange}
                    className={styles.formInput}
                    min="1"
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Precio unitario (€):</label>
                  <input 
                    type="number"
                    name="precio_unitario"
                    value={formItem.precio_unitario}
                    onChange={handleItemInputChange}
                    className={styles.formInput}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className={`${styles.actionButton} ${styles.primaryButton}`}
                  >
                    Añadir
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                    onClick={() => setShowFormItem(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Precio Unitario</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map(item => (
                  <tr key={item.id}>
                    <td>{item.articulo_nombre || `Artículo ID: ${item.articulo}`}</td>
                    <td>{item.precio_unitario}€</td>
                    <td>{item.cantidad}</td>
                    <td>{(item.cantidad * item.precio_unitario)}€</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className={styles.noRecords}>
                    Este presupuesto no tiene artículos
                  </td>
                </tr>
              )}
              <tr className={styles.totalRow}>
                <td colSpan="3" className={styles.totalLabel}>Total:</td>
                <td className={styles.totalValue}>{presupuesto.total}€</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
