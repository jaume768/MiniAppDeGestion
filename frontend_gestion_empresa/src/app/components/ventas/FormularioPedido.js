"use client";

import { useState, useEffect } from 'react';
import { pedidosAPI, clientesAPI, articulosAPI } from '@/app/services/api';
import styles from './Tablas.module.css';

export default function FormularioPedido({ pedido, onCancel, onSuccess }) {
  // Comprobar si el pedido ya está facturado
  const [esFacturado, setEsFacturado] = useState(false);
  const [formData, setFormData] = useState({
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    direccion_entrega: '',
    observaciones: '',
    estado: 'Pendiente'
  });
  
  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState({ 
    articulo: '', 
    cantidad: 1, 
    precio_unitario: 0,
    iva: 0
  });
  
  const [clientes, setClientes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [articulosMap, setArticulosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar clientes y artículos
        const [clientesData, articulosData] = await Promise.all([
          clientesAPI.getAll(),
          articulosAPI.getAll()
        ]);
        
        setClientes(clientesData);
        setArticulos(articulosData);
        
        // Crear un mapa de artículos para acceso rápido
        const artMap = {};
        articulosData.forEach(art => {
          artMap[art.id] = art;
        });
        setArticulosMap(artMap);
        
        // Comprobar si el pedido está facturado
        if (pedido && pedido.is_facturado) {
          setEsFacturado(true);
        }
        
        // Si estamos editando, cargar los datos del pedido
        if (pedido) {
          const pedidoCompleto = await pedidosAPI.getById(pedido.id);
          setFormData({
            cliente: pedidoCompleto.cliente,
            fecha: new Date(pedidoCompleto.fecha).toISOString().split('T')[0],
            direccion_entrega: pedidoCompleto.direccion_entrega || '',
            observaciones: pedidoCompleto.observaciones || '',
            estado: pedidoCompleto.estado || 'Pendiente'
          });
          
          // Cargar los items del pedido
          const itemsData = await pedidosAPI.getItems(pedido.id);
          
          // Procesar los items para calcular propiedades derivadas
          const itemsConCalculos = itemsData.map(item => {
            // Obtener el nombre del artículo
            const articulo = articulosMap[item.articulo] || {};
            
            // Calcular los valores derivados
            const subtotal = item.cantidad * item.precio_unitario;
            const ivaAmount = subtotal * (item.iva / 100);
            
            return {
              ...item,
              nombre_articulo: articulo.nombre || 'Desconocido',
              subtotal: subtotal,
              ivaAmount: ivaAmount,
              total: subtotal + ivaAmount
            };
          });
          
          setItems(itemsConCalculos);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos necesarios');
        setLoading(false);
      }
    };

    fetchData();
  }, [pedido]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    let updatedItem = { ...nuevoItem, [name]: value };
    
    // Si cambia el artículo, actualizar el precio unitario y el IVA
    if (name === 'articulo' && value) {
      const articulo = articulosMap[value];
      if (articulo) {
        updatedItem.precio_unitario = articulo.precio;
        updatedItem.iva = articulo.iva;
      }
    }
    
    setNuevoItem(updatedItem);
  };

  const handleAddItem = () => {
    if (!nuevoItem.articulo) {
      alert('Debe seleccionar un artículo');
      return;
    }
    
    const articulo = articulosMap[nuevoItem.articulo];
    
    // Agregar el item a la lista
    const subtotal = nuevoItem.cantidad * nuevoItem.precio_unitario;
    const ivaAmount = subtotal * (nuevoItem.iva / 100);
    const newItem = {
      ...nuevoItem,
      nombre_articulo: articulo.nombre,
      subtotal: subtotal,
      ivaAmount: ivaAmount,
      total: subtotal + ivaAmount
    };
    
    setItems([...items, newItem]);
    
    // Resetear el formulario de nuevo item
    setNuevoItem({
      articulo: '',
      cantidad: 1,
      precio_unitario: 0,
      iva: 0
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const calcularTotales = () => {
    let subtotal = 0;
    let ivaTotal = 0;
    
    items.forEach(item => {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      const itemIva = itemSubtotal * (item.iva / 100);
      
      subtotal += itemSubtotal;
      ivaTotal += itemIva;
    });
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(ivaTotal.toFixed(2)),
      total: Number((subtotal + ivaTotal).toFixed(2))
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // No permitir guardar si el pedido está facturado
    if (esFacturado) {
      setError("No se puede modificar un pedido que ya ha sido facturado");
      return;
    }
    
    if (!formData.cliente) {
      alert('Debe seleccionar un cliente');
      return;
    }
    
    if (items.length === 0) {
      alert('Debe agregar al menos un artículo');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Preparar los items con la estructura que espera la API
      const itemsFormateados = items.map(item => ({
        articulo: item.articulo,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        iva: item.iva
      }));
      
      if (pedido) {
        // Para actualización tenemos que usar el enfoque anterior
        // porque la API no soporta actualización completa
        
        // 1. Actualizar datos principales del pedido
        const totales = calcularTotales();
        await pedidosAPI.update(pedido.id, {
          ...formData,
          subtotal: totales.subtotal,
          iva: totales.iva,
          total: totales.total
        });
        
        // 2. Eliminar items anteriores
        const itemsActuales = await pedidosAPI.getItems(pedido.id);
        for (const item of itemsActuales) {
          await pedidosAPI.removeItem(pedido.id, item.id);
        }
        
        // 3. Agregar nuevos items
        for (const item of itemsFormateados) {
          await pedidosAPI.addItem(pedido.id, item);
        }
      } else {
        // Para crear un nuevo pedido, enviar todo junto como espera la API
        // Incluimos subtotal e iva además del total para que sea aceptado por el backend
        const totales = calcularTotales();
        const nuevoPedidoData = {
          ...formData,
          subtotal: totales.subtotal,
          iva: totales.iva,
          total: totales.total,
          items: itemsFormateados
        };
        
        await pedidosAPI.create(nuevoPedidoData);
      }
      
      setSaving(false);
      onSuccess && onSuccess();
    } catch (err) {
      console.error('Error al guardar pedido:', err);
      setError('Error al guardar el pedido');
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.formContainer}>
      <h2>{pedido ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
      
      {esFacturado && (
        <div className={styles.facturadoWarning}>
          <p><strong>¡Atención!</strong> Este pedido ya ha sido facturado y no puede ser modificado.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.formGroup}>
          <label htmlFor="cliente">Cliente:</label>
          <select 
            id="cliente" 
            name="cliente" 
            value={formData.cliente} 
            onChange={handleInputChange}
            required
            disabled={esFacturado}
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="fecha">Fecha:</label>
          <input 
            type="date" 
            id="fecha" 
            name="fecha" 
            value={formData.fecha} 
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="direccion_entrega">Dirección de Entrega:</label>
          <input 
            type="text" 
            id="direccion_entrega" 
            name="direccion_entrega" 
            value={formData.direccion_entrega} 
            onChange={handleInputChange}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="estado">Estado:</label>
          <select 
            id="estado" 
            name="estado" 
            value={formData.estado} 
            onChange={handleInputChange}
            required
            disabled={esFacturado}
          >
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Enviado">Enviado</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
        
        {/* Sección de artículos */}
        <h3 className={styles.subheader}>Artículos</h3>
        
        {/* Formulario para agregar artículo */}
        <div className={styles.addItemForm}>
          <h4>Añadir Artículo</h4>
          <div className={styles.itemForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="articulo">Artículo:</label>
                <select 
                  id="articulo" 
                  name="articulo" 
                  value={nuevoItem.articulo} 
                  onChange={handleItemChange}
                  className={styles.formControl}
                  disabled={esFacturado}
                >
                  <option value="">Seleccione un artículo</option>
                  {articulos.map(articulo => (
                    <option key={articulo.id} value={articulo.id}>
                      {articulo.nombre} - {articulo.precio}€
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="cantidad">Cantidad:</label>
                <input 
                  type="number" 
                  id="cantidad" 
                  name="cantidad" 
                  value={nuevoItem.cantidad} 
                  onChange={handleItemChange}
                  min="1"
                  className={styles.formControl}
                  disabled={esFacturado}
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="precio_unitario">Precio (€):</label>
                <input 
                  type="number" 
                  id="precio_unitario" 
                  name="precio_unitario" 
                  value={nuevoItem.precio_unitario} 
                  onChange={handleItemChange}
                  min="0"
                  step="0.01"
                  className={styles.formControl}
                  disabled={esFacturado}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="iva">IVA (%):</label>
                <input 
                  type="number" 
                  id="iva" 
                  name="iva" 
                  value={nuevoItem.iva} 
                  onChange={handleItemChange}
                  min="0"
                  step="0.01"
                  className={styles.formControl}
                  disabled={esFacturado}
                />
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={handleAddItem}
              className={styles.actionButton}
              disabled={esFacturado}
            >
              Añadir Artículo
            </button>
          </div>
        </div>
        
        {/* Tabla de artículos */}
        <div className={styles.itemsTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Cantidad</th>
                <th>Precio (€)</th>
                <th>IVA (%)</th>
                <th>Subtotal (€)</th>
                <th>IVA (€)</th>
                <th>Total (€)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.nombre_articulo}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.precio_unitario}</td>
                    <td>{item.iva}</td>
                    <td>{item.subtotal.toFixed(2)}</td>
                    <td>{item.ivaAmount.toFixed(2)}</td>
                    <td>{item.total.toFixed(2)}</td>
                    <td>
                      <button 
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className={styles.actionIcon}
                        disabled={esFacturado}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className={styles.emptyMessage}>No hay artículos añadidos</td>
                </tr>
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="6" className={styles.totalLabel}>Total (Base + IVA)</td>
                  <td colSpan="2" className={styles.totalValue}>{calcularTotales().total.toFixed(2)} €</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={onCancel}
            className={`${styles.actionButton} ${styles.cancelBtn}`}
            disabled={saving}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
            Cancelar
          </button>
          <button 
            type="submit"
            className={`${styles.actionButton} ${styles.submitBtn}`}
            disabled={saving}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
            {saving ? 'Guardando...' : (pedido ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
}
