"use client";

import React, { useState, useEffect } from 'react';
import { albaranesAPI, clientesAPI, articulosAPI } from '@/app/services/api';
import styles from './Tablas.module.css';

export default function FormularioAlbaran({ albaran, onCancel, onSuccess }) {
  // Comprobar si el albarán ya está facturado
  const [esFacturado, setEsFacturado] = useState(false);
  const [formData, setFormData] = useState({
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    direccion_entrega: '',
    observaciones: '',
    estado: 'Pendiente',
  });

  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState({
    articulo: '',
    cantidad: 1,
    precio_unitario: 0,
    descuento: 0,
    iva: 0,
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
          articulosAPI.getAll(),
        ]);

        setClientes(clientesData);
        setArticulos(articulosData);

        // Debug: mostrar datos de artículos
        console.log('Artículos cargados:', articulosData);

        // Crear un mapa de artículos para acceso rápido y asegurar que tengan precio
        const artMap = {};
        articulosData.forEach((art) => {
          // Verificar si tiene precio y agregarlo si no lo tiene
          if (art.precio === undefined || art.precio === null) {
            art.precio = art.precio_venta || 0;
          }
          artMap[art.id] = art;
        });
        setArticulosMap(artMap);

        // Comprobar si el albarán está facturado
        if (albaran && albaran.is_facturado) {
          setEsFacturado(true);
        }

        // Si estamos editando, cargar los datos del albarán
        if (albaran) {
          const albaranCompleto = await albaranesAPI.getById(albaran.id);
          setFormData({
            cliente: albaranCompleto.cliente,
            fecha: new Date(albaranCompleto.fecha).toISOString().split('T')[0],
            direccion_entrega: albaranCompleto.direccion_entrega || '',
            observaciones: albaranCompleto.observaciones || '',
            estado: albaranCompleto.estado || 'Pendiente',
          });

          // Cargar los items del albarán
          const itemsData = await albaranesAPI.getItems(albaran.id);

          // Procesar los items para calcular propiedades derivadas
          const itemsConCalculos = itemsData.map((item) => {
            const art = artMap[item.articulo] || {};
            
            // Asegurarse de que todos los valores son numéricos
            const cantidad = Number(item.cantidad) || 0;
            const precio_unitario = Number(item.precio_unitario) || 0;
            const descuento = Number(item.descuento) || 0;
            const iva = Number(item.iva) || 0;
            
            // Realizar cálculos con valores numéricos garantizados
            const subtotalSinDescuento = cantidad * precio_unitario;
            const descuentoAmount = subtotalSinDescuento * (descuento / 100);
            const subtotal = subtotalSinDescuento - descuentoAmount;
            const ivaAmount = subtotal * (iva / 100);

            // Guardar los valores con formato adecuado
            return {
              ...item,
              cantidad,
              precio_unitario,
              descuento,
              iva,
              nombre_articulo: art.nombre || 'Desconocido',
              subtotal: Number(subtotal.toFixed(2)),
              ivaAmount: Number(ivaAmount.toFixed(2)),
              total: Number((subtotal + ivaAmount).toFixed(2)),
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
  }, [albaran]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    // Actualizar directamente el nuevo valor
    if (name === 'articulo' && value) {
      const articulo = articulosMap[value];
      if (articulo) {
        // Similar a FormularioPedido.js - usar precio directamente
        console.log('Articulo seleccionado:', articulo);
        console.log('Precio usado:', articulo.precio);
        
        setNuevoItem({
          ...nuevoItem,
          articulo: value,
          precio_unitario: articulo.precio || 0,
          iva: articulo.iva || 0,
        });
      } else {
        setNuevoItem({
          ...nuevoItem,
          articulo: value,
        });
      }
    } else {
      let newValue = value;
      
      // Convertir a número si es un campo numérico
      if (['cantidad', 'precio_unitario', 'descuento', 'iva'].includes(name)) {
        newValue = parseFloat(value) || 0;
      }
      
      setNuevoItem({
        ...nuevoItem,
        [name]: newValue,
      });
    }
  };

  const handleAddItem = () => {
    if (!nuevoItem.articulo) {
      alert('Debe seleccionar un artículo');
      return;
    }

    const art = articulosMap[nuevoItem.articulo];
    if (!art) {
      console.error('Artículo no encontrado:', nuevoItem.articulo);
      return;
    }
    
    // Asegurarse de que todos los valores son numéricos
    const cantidad = Number(nuevoItem.cantidad) || 0;
    const precio = Number(nuevoItem.precio_unitario) || 0;
    const descuento = Number(nuevoItem.descuento) || 0;
    const iva = Number(nuevoItem.iva) || 0;
    
    // Calcular valores con seguridad numérica
    const subtotalSinDescuento = cantidad * precio;
    const subtotal = subtotalSinDescuento * (1 - descuento / 100);
    const ivaAmount = subtotal * (iva / 100);
    const total = subtotal + ivaAmount;

    const newItemObj = {
      ...nuevoItem,
      cantidad,
      precio_unitario: precio,
      descuento,
      iva,
      nombre_articulo: art.nombre,
      subtotal: Number(subtotal.toFixed(2)),
      ivaAmount: Number(ivaAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };

    setItems((prev) => [...prev, newItemObj]);
    setNuevoItem({ articulo: '', cantidad: 1, precio_unitario: 0, descuento: 0, iva: 0 });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calcularSubtotal = () => {
    return items.reduce((sum, item) => {
      // Asegurarse de que todos los valores son números válidos
      const cantidad = Number(item.cantidad) || 0;
      const precio = Number(item.precio_unitario) || 0;
      const descuento = Number(item.descuento) || 0;
      
      // Calcular subtotal con seguridad numérica
      return sum + (cantidad * precio * (1 - descuento / 100));
    }, 0);
  };

  const calcularIVA = () => {
    return items.reduce((sum, item) => {
      // Asegurarse de que todos los valores son números válidos
      const cantidad = Number(item.cantidad) || 0;
      const precio = Number(item.precio_unitario) || 0;
      const descuento = Number(item.descuento) || 0;
      const iva = Number(item.iva) || 0;
      
      // Primero calcular el subtotal de este item
      const subtotalItem = cantidad * precio * (1 - descuento / 100);
      
      // Luego calcular el IVA
      return sum + (subtotalItem * iva / 100);
    }, 0);
  };

  const calcularTotales = () => {
    const subtotal = calcularSubtotal();
    const iva = calcularIVA();
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number((subtotal + iva).toFixed(2))
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
      const itemsFormateados = items.map((item) => ({
        articulo: item.articulo,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento: item.descuento,
        iva: item.iva,
      }));

      if (albaran) {
        await albaranesAPI.update(albaran.id, {
          ...formData,
          total: calcularTotales().total,
        });
        const actuales = await albaranesAPI.getItems(albaran.id);
        await Promise.all(
          actuales.map((it) => albaranesAPI.removeItem(albaran.id, it.id))
        );
        await Promise.all(
          itemsFormateados.map((it) => albaranesAPI.addItem(albaran.id, it))
        );
      } else {
        const totales = calcularTotales();
        await albaranesAPI.create({
          ...formData,
          subtotal: totales.subtotal,
          iva: totales.iva,
          total: totales.total,
          items: itemsFormateados,
        });
      }

      setSaving(false);
      onSuccess?.();
    } catch (err) {
      console.error('Error al guardar albarán:', err);
      setError('Error al guardar el albarán');
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    // Asegurarse de que value es un número válido para evitar NaN
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(numValue);
  };

  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.formContainer}>
      <h2>{albaran ? 'Editar Albarán' : 'Nuevo Albarán'}</h2>

      {esFacturado && (
        <div className={styles.facturadoWarning}>
          <p>
            <strong>¡Atención!</strong> Este albarán ya ha sido facturado y no puede ser modificado.
          </p>
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
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
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
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="direccion_entrega">Dirección de entrega:</label>
          <input
            type="text"
            id="direccion_entrega"
            name="direccion_entrega"
            value={formData.direccion_entrega}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="estado">Estado:</label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            disabled={esFacturado}
          >
            <option value="Pendiente">Pendiente</option>
            <option value="Procesando">Procesando</option>
            <option value="Enviado">Enviado</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="observaciones">Observaciones:</label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={3}
          />
        </div>

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
                  {articulos.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.nombre} - {formatCurrency(art.precio_venta)}
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
                  min="1"
                  value={nuevoItem.cantidad}
                  onChange={handleItemChange}
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
                  step="0.01"
                  min="0"
                  value={nuevoItem.precio_unitario}
                  onChange={handleItemChange}
                  className={styles.formControl}
                  disabled={esFacturado}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="descuento">Descuento (%):</label>
                <input
                  type="number"
                  id="descuento"
                  name="descuento"
                  min="0"
                  max="100"
                  value={nuevoItem.descuento}
                  onChange={handleItemChange}
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
                  min="0"
                  step="0.01"
                  value={nuevoItem.iva}
                  onChange={handleItemChange}
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

        <div className={styles.tableWrapper}>
          {items.length > 0 ? (
            <div>
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
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.nombre_articulo}</td>
                      <td>{item.cantidad}</td>
                      <td className={styles.moneyCell}>
                        {formatCurrency(item.precio_unitario)}
                      </td>
                      <td>{item.iva}%</td>
                      <td className={styles.moneyCell}>
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className={styles.moneyCell}>
                        {formatCurrency(item.ivaAmount)}
                      </td>
                      <td className={styles.moneyCell}>
                        {formatCurrency(item.total)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.actionIcon}
                          onClick={() => handleRemoveItem(idx)}
                          disabled={esFacturado}
                          title="Eliminar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            height="16"
                            width="16"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className={styles.totalSummary}>
                <p className={styles.totalLine}>
                  <strong>Total (Base + IVA): {formatCurrency(calcularTotales().total)}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.emptyMessage}>
              No hay artículos agregados aún.
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
            Cancelar
          </button>
          <button
            type="submit"
            className={`${styles.actionButton} ${styles.submitBtn}`}
            disabled={saving}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
            </svg>
            {saving ? 'Guardando...' : albaran ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}
