"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pedidosAPI, clientesAPI, articulosAPI, facturasAPI } from '../../../services/api';
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

const IconTimes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [clientes, setClientes] = useState([]);
  
  // Estado para el formulario principal
  const [formData, setFormData] = useState({
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
    entregado: false
  });
  
  // Estado para los items que se están añadiendo
  const [itemsForm, setItemsForm] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    articulo: '',
    cantidad: 1,
    precio_unitario: 0
  });
  
  const [articulos, setArticulos] = useState([]);

  // Cargar pedidos y clientes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pedidosData, clientesData, articulosData] = await Promise.all([
          pedidosAPI.getAll(),
          clientesAPI.getAll(),
          articulosAPI.getAll()
        ]);
        
        // Ordenar por fecha (más reciente primero)
        const ordenarPorFecha = (a, b) => new Date(b.fecha) - new Date(a.fecha);
        setPedidos([...pedidosData].sort(ordenarPorFecha));
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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
  
  // Calcular el total de la orden/pedido
  const calcularTotal = () => {
    return itemsForm.reduce((total, item) => {
      return total + (parseFloat(item.precio_unitario) * parseInt(item.cantidad));
    }, 0).toFixed(2);
  };

  // Crear nuevo pedido
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
      const datosPedido = {
        cliente: formData.cliente,
        fecha: formData.fecha,
        observaciones: formData.observaciones,
        entregado: formData.entregado,
        items: itemsForm.map(item => ({
          articulo: parseInt(item.articulo),
          cantidad: parseInt(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario)
        }))
      };
      
      const nuevoPedido = await pedidosAPI.create(datosPedido);
      setPedidos([nuevoPedido, ...pedidos]);
      
      // Limpiar formulario
      setFormData({
        cliente: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
        entregado: false
      });
      setItemsForm([]);
      setCurrentItem({
        articulo: '',
        cantidad: 1,
        precio_unitario: 0
      });
      
      setShowForm(false);
      alert('Pedido creado correctamente');
    } catch (err) {
      console.error("Error al crear pedido:", err);
      setError("Error al crear el pedido. Por favor, intenta de nuevo.");
    }
  };

  // Marcar pedido como entregado
  const marcarEntregado = async (id) => {
    try {
      await pedidosAPI.marcarEntregado(id);
      setPedidos(pedidos.map(pedido => 
        pedido.id === id ? {...pedido, entregado: true} : pedido
      ));
      alert('Pedido marcado como entregado');
    } catch (err) {
      console.error("Error al actualizar el pedido:", err);
      setError("Error al marcar el pedido como entregado.");
    }
  };

  // Eliminar pedido
  const eliminarPedido = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido?')) return;
    
    try {
      await pedidosAPI.delete(id);
      setPedidos(pedidos.filter(pedido => pedido.id !== id));
      alert('Pedido eliminado correctamente');
    } catch (err) {
      console.error("Error al eliminar el pedido:", err);
      setError("Error al eliminar el pedido.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">Gestión de Pedidos</h2>
        <button
          className={`btn ${showForm ? 'btn-outline-secondary' : 'btn-primary'}`}
          onClick={() => setShowForm(prev => !prev)}
        >
          {showForm ? <><IconTimes className="me-1"/>Cancelar</> : <><IconPlus className="me-1"/>Nuevo Pedido</>}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title h5 mb-0">Crear Nuevo Pedido</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="cliente" className="form-label">Cliente</label>
                <select
                  id="cliente"
                  name="cliente"
                  className="form-select"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="fecha" className="form-label">Fecha</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  className="form-control"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.itemsSection}>
                <h4>Artículos</h4>
                <div className={styles.newItemForm + " row g-2 align-items-end"}>
                  <div className="col-auto">
                    <label htmlFor="articulo" className="form-label">Artículo</label>
                    <select
                      id="articulo"
                      name="articulo"
                      className="form-select"
                      value={currentItem.articulo}
                      onChange={handleItemChange}
                    >
                      <option value="">Seleccionar artículo</option>
                      {articulos.map(a => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-auto">
                    <label htmlFor="cantidad" className="form-label">Cantidad</label>
                    <input
                      type="number"
                      id="cantidad"
                      name="cantidad"
                      className="form-control"
                      value={currentItem.cantidad}
                      onChange={handleItemChange}
                      min="1"
                    />
                  </div>
                  <div className="col-auto">
                    <label htmlFor="precio_unitario" className="form-label">Precio unitario</label>
                    <input
                      type="number"
                      id="precio_unitario"
                      name="precio_unitario"
                      className="form-control"
                      value={currentItem.precio_unitario}
                      onChange={handleItemChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-auto">
                    <button type="button" className="btn btn-secondary" onClick={agregarItem}>
                      <IconPlus /> Añadir
                    </button>
                  </div>
                </div>

                {itemsForm.length > 0 && (
                  <table className="table mt-3">
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
                      {itemsForm.map((item, i) => (
                        <tr key={i}>
                          <td>{item.articulo_nombre}</td>
                          <td>{item.cantidad}</td>
                          <td>{parseFloat(item.precio_unitario).toFixed(2)} €</td>
                          <td>{parseFloat(item.subtotal).toFixed(2)} €</td>
                          <td>
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => removerItem(i)}>
                              <IconTrash />
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
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="observaciones" className="form-label">Observaciones</label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  className="form-control"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  id="entregado"
                  name="entregado"
                  className="form-check-input"
                  checked={formData.entregado}
                  onChange={handleInputChange}
                />
                <label htmlFor="entregado" className="form-check-label">
                  Pedido entregado
                </label>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  <IconCheckCircle /> Crear Pedido
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setItemsForm([]);
                    setCurrentItem({ articulo: '', cantidad: 1, precio_unitario: 0 });
                  }}
                >
                  <IconTimes /> Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TableComponent
        isLoading={loading}
        headers={[
          { name: 'ID', key: 'id' },
          { name: 'Cliente', key: 'cliente_nombre', render: p => p.cliente_nombre || `Cliente ID: ${p.cliente}` },
          { name: 'Fecha', key: 'fecha', render: p => new Date(p.fecha).toLocaleDateString() },
          { name: 'Total', key: 'total', render: p => `${p.total}€` },
          {
            name: 'Estado',
            key: 'estado',
            render: p => (
              <span className={`badge ${p.entregado ? 'bg-success' : 'bg-warning'}`}>
                {p.entregado ? 'Entregado' : 'Pendiente'}
              </span>
            )
          }
        ]}
        data={pedidos}
        onRowClick={p => window.location.href = `/pages/ventas/pedidos/${p.id}`}
        actionButtons={p => (
          <div className="d-flex gap-1">
            <Link
              href={`/pages/ventas/pedidos/${p.id}`}
              className="btn btn-sm btn-outline-primary"
              onClick={e => e.stopPropagation()}
              aria-label="Ver detalles"
            >
              <IconEye />
            </Link>
            {!p.entregado && (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={e => { e.stopPropagation(); marcarEntregado(p.id); }}
                aria-label="Marcar como entregado"
              >
                <IconCheckCircle />
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={e => { e.stopPropagation(); eliminarPedido(p.id); }}
              aria-label="Eliminar pedido"
            >
              <IconTrash />
            </button>
          </div>
        )}
      />
    </div>
  );
}
