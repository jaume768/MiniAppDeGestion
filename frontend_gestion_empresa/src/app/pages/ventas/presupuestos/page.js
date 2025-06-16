"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { presupuestosAPI, clientesAPI, pedidosAPI, facturasAPI, articulosAPI } from '../../../services/api';
import styles from '../ventas.module.css';
import TableComponent from '../../../components/TableComponent';

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

export default function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  
  // Estado para el formulario principal
  const [formData, setFormData] = useState({
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
  });
  
  // Estado para los items que se están añadiendo
  const [itemsForm, setItemsForm] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    articulo: '',
    cantidad: 1,
    precio_unitario: 0
  });

  // Cargar presupuestos, clientes y artículos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [presupuestosData, clientesData, articulosData] = await Promise.all([
          presupuestosAPI.getAll(),
          clientesAPI.getAll(),
          articulosAPI.getAll()
        ]);
        
        // Ordenar por fecha (más reciente primero)
        const ordenarPorFecha = (a, b) => new Date(b.fecha) - new Date(a.fecha);
        setPresupuestos([...presupuestosData].sort(ordenarPorFecha));
        setClientes(clientesData);
        setArticulos(articulosData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Manejar cambios en el formulario principal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Manejar cambios en el formulario de item
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    // Si es un artículo, establecer el precio por defecto
    if (name === 'articulo' && value !== '') {
      const articuloSeleccionado = articulos.find(a => a.id === parseInt(value));
      if (articuloSeleccionado) {
        setCurrentItem({
          ...currentItem,
          articulo: value,
          precio_unitario: articuloSeleccionado.precio
        });
        return;
      }
    }
    
    setCurrentItem({
      ...currentItem,
      [name]: value
    });
  };
  
  // Agregar un nuevo item a la lista
  const agregarItem = () => {
    if (!currentItem.articulo || !currentItem.cantidad || currentItem.cantidad < 1) {
      alert('Por favor, seleccione un artículo y especifique una cantidad válida.');
      return;
    }
    
    // Buscar el artículo seleccionado para mostrar el nombre
    const articuloObj = articulos.find(a => a.id === parseInt(currentItem.articulo));
    
    // Calcular el subtotal del item
    const subtotal = parseFloat(currentItem.precio_unitario) * parseInt(currentItem.cantidad);
    
    // Añadir a la lista de items con info adicional
    const nuevoItem = {
      ...currentItem,
      subtotal,
      articulo_nombre: articuloObj ? articuloObj.nombre : 'Artículo desconocido'
    };
    
    setItemsForm([...itemsForm, nuevoItem]);
    
    // Limpiar el formulario de item pero manteniendo el último precio
    setCurrentItem({
      articulo: '',
      cantidad: 1,
      precio_unitario: 0
    });
  };
  
  // Remover un item de la lista
  const removerItem = (index) => {
    const nuevosItems = [...itemsForm];
    nuevosItems.splice(index, 1);
    setItemsForm(nuevosItems);
  };
  
  // Calcular el total de la orden/presupuesto
  const calcularTotal = () => {
    return itemsForm.reduce((total, item) => {
      return total + (parseFloat(item.precio_unitario) * parseInt(item.cantidad));
    }, 0).toFixed(2);
  };

  // Crear nuevo presupuesto
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validar que haya al menos un item
      if (itemsForm.length === 0) {
        alert('Debe agregar al menos un artículo.');
        return;
      }
      
      // Validar que haya un cliente seleccionado
      if (!formData.cliente) {
        alert('Debe seleccionar un cliente.');
        return;
      }
      
      // Preparar datos para enviar al servidor
      const datosPresupuesto = {
        cliente: formData.cliente,
        fecha: formData.fecha,
        observaciones: formData.observaciones,
        items: itemsForm.map(item => ({
          articulo: parseInt(item.articulo),
          cantidad: parseInt(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario)
        }))
      };
      
      const nuevoPresupuesto = await presupuestosAPI.create(datosPresupuesto);
      setPresupuestos([nuevoPresupuesto, ...presupuestos]);
      
      // Limpiar formulario
      setFormData({
        cliente: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      });
      setItemsForm([]);
      setCurrentItem({
        articulo: '',
        cantidad: 1,
        precio_unitario: 0
      });
      
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
              <label htmlFor="cliente">Cliente</label>
              <select
                id="cliente"
                name="cliente"
                value={formData.cliente}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="fecha">Fecha</label>
              <input 
                type="date" 
                id="fecha" 
                name="fecha" 
                value={formData.fecha} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            
            <div className={styles.itemsSection}>
              <h4>Artículos</h4>
              
              {/* Formulario para añadir un nuevo artículo */}
              <div className={styles.newItemForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="articulo">Artículo</label>
                    <select
                      id="articulo"
                      name="articulo"
                      value={currentItem.articulo}
                      onChange={handleItemChange}
                    >
                      <option value="">Seleccionar artículo</option>
                      {articulos.map(articulo => (
                        <option key={articulo.id} value={articulo.id}>
                          {articulo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="cantidad">Cantidad</label>
                    <input
                      type="number"
                      id="cantidad"
                      name="cantidad"
                      value={currentItem.cantidad}
                      onChange={handleItemChange}
                      min="1"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="precio_unitario">Precio unitario</label>
                    <input
                      type="number"
                      id="precio_unitario"
                      name="precio_unitario"
                      value={currentItem.precio_unitario}
                      onChange={handleItemChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <button type="button" className={styles.btnSecondary} onClick={agregarItem}>
                  Añadir artículo
                </button>
              </div>
              
              {/* Tabla de artículos añadidos */}
              {itemsForm.length > 0 && (
                <div className={styles.itemsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Artículo</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsForm.map((item, index) => (
                        <tr key={index}>
                          <td>{item.articulo_nombre}</td>
                          <td>{item.cantidad}</td>
                          <td>{parseFloat(item.precio_unitario).toFixed(2)} €</td>
                          <td>{item.subtotal.toFixed(2)} €</td>
                          <td>
                            <button 
                              type="button" 
                              className={styles.btnDelete}
                              onClick={() => removerItem(index)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3"><strong>TOTAL</strong></td>
                        <td colSpan="2"><strong>{calcularTotal()} €</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="observaciones">Observaciones</label>
              <textarea 
                id="observaciones" 
                name="observaciones" 
                value={formData.observaciones} 
                onChange={handleInputChange} 
                rows="3" 
              />
            </div>
            
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>
                Crear Presupuesto
              </button>
              <button 
                type="button" 
                className={styles.btnSecondary} 
                onClick={() => {
                  setShowForm(false);
                  setItemsForm([]);
                  setCurrentItem({ articulo: '', cantidad: 1, precio_unitario: 0 });
                }}
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
