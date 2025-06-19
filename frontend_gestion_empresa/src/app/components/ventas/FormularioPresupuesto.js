"use client";

import { useState, useEffect } from 'react';
import { presupuestosAPI, clientesAPI, articulosAPI } from '@/app/services/api';
import styles from './Tablas.module.css';

export default function FormularioPresupuesto({ presupuesto, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
  });
  
  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState({ 
    articulo: '', 
    cantidad: 1, 
    precio: 0,
    descuento: 0,
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
        
        // Si estamos editando, cargar los datos del presupuesto
        if (presupuesto) {
          const presupuestoCompleto = await presupuestosAPI.getById(presupuesto.id);
          setFormData({
            cliente: presupuestoCompleto.cliente,
            fecha: new Date(presupuestoCompleto.fecha).toISOString().split('T')[0],
            observaciones: presupuestoCompleto.observaciones || '',
          });
          
          // Cargar los items del presupuesto
          const itemsData = await presupuestosAPI.getItems(presupuesto.id);
          
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
  }, [presupuesto]);

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
    
    // Si cambia el artículo, actualizar el precio y el IVA
    if (name === 'articulo' && value) {
      const articulo = articulosMap[value];
      if (articulo) {
        updatedItem.precio = articulo.precio;
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
    const subtotal = (nuevoItem.cantidad * nuevoItem.precio) * (1 - (nuevoItem.descuento / 100));
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
      precio: 0,
      descuento: 0,
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
      const itemSubtotal = item.cantidad * item.precio;
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
    
    if (!formData.cliente) {
      alert('Debe seleccionar un cliente');
      return;
    }
    
    if (items.length === 0) {
      alert('Debe agregar al menos un artículo');
      return;
    }
    
    setSaving(true);
    
    try {
      // Preparar los items con la estructura que espera la API
      const itemsFormateados = items.map(item => ({
        articulo: item.articulo,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        iva: item.iva
      }));
      
      if (presupuesto) {
        // Para actualización tenemos que usar el enfoque anterior
        // porque la API no soporta actualización completa
        
        // 1. Actualizar datos principales del presupuesto
        await presupuestosAPI.update(presupuesto.id, {
          ...formData,
          total: calcularTotal()
        });
        
        // 2. Eliminar items anteriores
        const itemsActuales = await presupuestosAPI.getItems(presupuesto.id);
        for (const item of itemsActuales) {
          await presupuestosAPI.removeItem(presupuesto.id, item.id);
        }
        
        // 3. Agregar nuevos items
        for (const item of itemsFormateados) {
          await presupuestosAPI.addItem(presupuesto.id, item);
        }
      } else {
        // Para crear un nuevo presupuesto, enviar todo junto como espera la API
        // Esto reduce el número de llamadas a la API y soluciona el error 400
        const nuevoPresupuestoData = {
          ...formData,
          subtotal: calcularTotales().subtotal,
          iva: calcularTotales().iva,
          total: calcularTotales().total,
          items: itemsFormateados
        };
        
        await presupuestosAPI.create(nuevoPresupuestoData);
      }
      
      setSaving(false);
      onSuccess && onSuccess();
    } catch (err) {
      console.error('Error al guardar presupuesto:', err);
      setError('Error al guardar el presupuesto');
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.formContainer}>
      <h2>{presupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="cliente">Cliente:</label>
          <select 
            id="cliente" 
            name="cliente" 
            value={formData.cliente} 
            onChange={handleInputChange}
            required
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
        
        {/* Sección de artículos */}
        <h3 className={styles.subheader}>Artículos</h3>
        
        {/* Formulario para agregar artículo - MOVIDO ARRIBA de la tabla */}
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
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="precio">Precio (€):</label>
                <input 
                  type="number" 
                  id="precio" 
                  name="precio" 
                  value={nuevoItem.precio} 
                  onChange={handleItemChange}
                  min="0"
                  step="0.01"
                  className={styles.formControl}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="descuento">Descuento (%):</label>
                <input 
                  type="number" 
                  id="descuento" 
                  name="descuento" 
                  value={nuevoItem.descuento} 
                  onChange={handleItemChange}
                  min="0"
                  max="100"
                  className={styles.formControl}
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
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
                />
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={handleAddItem}
              className={styles.actionButton}
            >
              Añadir Artículo
            </button>
          </div>
        </div>
        
        {/* Tabla de artículos - MOVIDA ABAJO de la sección de añadir */}
        <div className={styles.itemsTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Cantidad</th>
                <th>Precio (€)</th>
                <th>Descuento (%)</th>
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
                    <td>{item.precio}</td>
                    <td>{item.descuento}%</td>
                    <td>{item.iva}%</td>
                    <td>{item.subtotal.toFixed(2)}</td>
                    <td>{item.ivaAmount.toFixed(2)}</td>
                    <td>{item.total.toFixed(2)}</td>
                    <td>
                      <button 
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className={styles.actionIcon}
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
                  <td colSpan="9" className={styles.emptyMessage}>No hay artículos añadidos</td>
                </tr>
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="7" className={styles.totalLabel}>Total (Base + IVA)</td>
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
            {saving ? 'Guardando...' : (presupuesto ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
}
