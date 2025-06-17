"use client";

import { useState, useEffect } from 'react';
import { albaranesAPI, clientesAPI, articulosAPI } from '@/app/services/api';
import styles from './Tablas.module.css';

export default function FormularioAlbaran({ albaran, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
  });
  
  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState({ 
    articulo: '', 
    cantidad: 1, 
    precio_unitario: 0,
    descuento: 0 
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
        
        // Si estamos editando, cargar los datos del albarán
        if (albaran) {
          setFormData({
            cliente: albaran.cliente,
            fecha: albaran.fecha,
            observaciones: albaran.observaciones || '',
          });
          
          // Cargar los items del albarán
          const itemsData = await albaranesAPI.getItems(albaran.id);
          
          // Enriquecer los items con la información de artículos
          const itemsEnriquecidos = itemsData.map(item => ({
            ...item,
            nombre_articulo: artMap[item.articulo]?.nombre || 'Artículo no disponible',
            subtotal: (item.cantidad * item.precio_unitario) * (1 - (item.descuento / 100))
          }));
          
          setItems(itemsEnriquecidos);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos necesarios');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [albaran]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    // Convertir a número los campos numéricos
    if (['cantidad', 'precio_unitario', 'descuento'].includes(name)) {
      newValue = parseFloat(value) || 0;
    }
    
    // Si cambia el artículo, actualizar el precio con el del artículo
    if (name === 'articulo' && articulosMap[value]) {
      setNuevoItem({
        ...nuevoItem,
        articulo: value,
        precio_unitario: articulosMap[value].precio_venta
      });
    } else {
      setNuevoItem({
        ...nuevoItem,
        [name]: newValue
      });
    }
  };

  const handleAddItem = () => {
    if (!nuevoItem.articulo) {
      alert('Debe seleccionar un artículo');
      return;
    }
    
    const articulo = articulosMap[nuevoItem.articulo];
    
    // Agregar el item a la lista
    const newItem = {
      ...nuevoItem,
      nombre_articulo: articulo.nombre,
      subtotal: (nuevoItem.cantidad * nuevoItem.precio_unitario) * (1 - (nuevoItem.descuento / 100))
    };
    
    setItems([...items, newItem]);
    
    // Resetear el formulario de nuevo item
    setNuevoItem({
      articulo: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const calcularTotal = () => {
    return items.reduce((total, item) => {
      return total + ((item.cantidad * item.precio_unitario) * (1 - (item.descuento / 100)));
    }, 0);
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
        precio_unitario: item.precio_unitario,
        descuento: item.descuento || 0
      }));
      
      if (albaran) {
        // Para actualización tenemos que usar el enfoque anterior
        // porque la API no soporta actualización completa
        
        // 1. Actualizar datos principales del albarán
        await albaranesAPI.update(albaran.id, {
          ...formData,
          total: calcularTotal()
        });
        
        // 2. Eliminar items anteriores
        const itemsActuales = await albaranesAPI.getItems(albaran.id);
        for (const item of itemsActuales) {
          await albaranesAPI.removeItem(albaran.id, item.id);
        }
        
        // 3. Agregar nuevos items
        for (const item of itemsFormateados) {
          await albaranesAPI.addItem(albaran.id, item);
        }
      } else {
        // Para crear un nuevo albarán, enviar todo junto como espera la API
        // Esto reduce el número de llamadas a la API y soluciona el error 400
        const nuevoAlbaranData = {
          ...formData,
          total: calcularTotal(),
          items: itemsFormateados
        };
        
        await albaranesAPI.create(nuevoAlbaranData);
      }
      
      setSaving(false);
      onSuccess && onSuccess();
    } catch (err) {
      console.error('Error al guardar albarán:', err);
      setError('Error al guardar el albarán');
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando...</div>;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className={styles.formContainer}>
      <h2>{albaran ? 'Editar Albarán' : 'Nuevo Albarán'}</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="cliente">Cliente</label>
            <select 
              id="cliente" 
              name="cliente" 
              value={formData.cliente} 
              onChange={handleChange}
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
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="observaciones">Observaciones</label>
          <textarea 
            id="observaciones" 
            name="observaciones" 
            value={formData.observaciones} 
            onChange={handleChange}
            rows="3"
          />
        </div>
        
        <h3>Artículos</h3>
        
        {/* Formulario para añadir artículos */}
        <div className={styles.itemForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="articulo">Artículo</label>
              <select 
                id="articulo" 
                name="articulo" 
                value={nuevoItem.articulo} 
                onChange={handleItemChange}
              >
                <option value="">Seleccionar artículo</option>
                {articulos.map(articulo => (
                  <option key={articulo.id} value={articulo.id}>
                    {articulo.nombre} - {formatCurrency(articulo.precio_venta)}
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
                min="1" 
                value={nuevoItem.cantidad} 
                onChange={handleItemChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="precio_unitario">Precio unitario</label>
              <input 
                type="number" 
                id="precio_unitario" 
                name="precio_unitario" 
                step="0.01" 
                min="0" 
                value={nuevoItem.precio_unitario} 
                onChange={handleItemChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="descuento">Descuento (%)</label>
              <input 
                type="number" 
                id="descuento" 
                name="descuento" 
                min="0" 
                max="100" 
                value={nuevoItem.descuento} 
                onChange={handleItemChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>&nbsp;</label>
              <button 
                type="button" 
                className={styles.actionButton}
                onClick={handleAddItem}
              >
                Añadir artículo
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabla de artículos añadidos */}
        <div className={styles.tableWrapper}>
          {items.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Descuento</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.nombre_articulo}</td>
                    <td>{item.cantidad}</td>
                    <td className={styles.moneyCell}>{formatCurrency(item.precio_unitario)}</td>
                    <td>{item.descuento}%</td>
                    <td className={styles.moneyCell}>{formatCurrency(item.subtotal)}</td>
                    <td>
                      <button 
                        type="button" 
                        className={styles.actionIcon}
                        onClick={() => handleRemoveItem(index)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className={styles.tableTotal}>Total:</td>
                  <td className={styles.moneyCell}><strong>{formatCurrency(calcularTotal())}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className={styles.emptyMessage}>
              No hay artículos añadidos al albarán
            </div>
          )}
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            className={`${styles.actionButton} ${styles.cancelBtn}`}
            onClick={onCancel}
            disabled={saving}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
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
            {saving ? 'Guardando...' : (albaran ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
}
