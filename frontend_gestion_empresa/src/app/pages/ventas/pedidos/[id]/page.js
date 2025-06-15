"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pedidosAPI, articulosAPI } from '../../../../services/api';

// SVG Icons
const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

export default function PedidoDetalle({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [pedido, setPedido] = useState(null);
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

  // Cargar detalles del pedido
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar pedido, sus items, y lista de artículos
        const pedidoData = await pedidosAPI.getById(id);
        const itemsData = await pedidosAPI.getItems(id);
        const articulosData = await articulosAPI.getAll();
        
        setPedido(pedidoData);
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

  // Añadir item al pedido
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    try {
      const newItem = await pedidosAPI.addItem(id, formItem);
      
      // Actualizar lista de items y total del pedido
      setItems([...items, newItem]);
      
      // Recalcular el total del pedido
      const nuevoTotal = items.reduce((total, item) => {
        return total + (item.cantidad * item.precio_unitario);
      }, 0) + (formItem.cantidad * formItem.precio_unitario);
      
      // Actualizar el pedido con el nuevo total
      const pedidoActualizado = await pedidosAPI.update(id, { total: nuevoTotal });
      setPedido(pedidoActualizado);
      
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
      setError("Error al añadir el artículo al pedido.");
    }
  };

  // Marcar pedido como entregado
  const marcarEntregado = async () => {
    try {
      await pedidosAPI.marcarEntregado(id);
      setPedido({...pedido, entregado: true});
      alert('Pedido marcado como entregado');
    } catch (err) {
      console.error("Error al marcar pedido como entregado:", err);
      setError("Error al marcar el pedido como entregado.");
    }
  };

  // Eliminar pedido
  const eliminarPedido = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido?')) return;
    
    try {
      await pedidosAPI.delete(id);
      alert('Pedido eliminado correctamente');
      router.push('/pages/ventas/pedidos');
    } catch (err) {
      console.error("Error al eliminar el pedido:", err);
      setError("Error al eliminar el pedido.");
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center my-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Cargando detalles del pedido...</span>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="alert alert-danger my-4" role="alert">
      {error}
    </div>
  );
  
  if (!pedido) return (
    <div className="alert alert-warning my-4" role="alert">
      No se encontró el pedido solicitado.
    </div>
  );

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div>
          <Link href="/pages/ventas/pedidos" className="btn btn-link text-decoration-none ps-0">
            <IconChevronLeft className="me-1" /> Volver a pedidos
          </Link>
          <h2 className="mt-2">Pedido #{id}</h2>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          {!pedido.entregado && (
            <button 
              className="btn btn-success d-flex align-items-center"
              onClick={marcarEntregado}
            >
              <IconCheckCircle className="me-1" /> Marcar como entregado
            </button>
          )}
          <button 
            className="btn btn-outline-danger d-flex align-items-center"
            onClick={eliminarPedido}
          >
            <IconTrash className="me-1" /> Eliminar pedido
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Información del pedido</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <h6 className="text-muted mb-1">Cliente</h6>
              <p className="fs-5">{pedido.cliente_nombre || `Cliente ID: ${pedido.cliente}`}</p>
            </div>
            <div className="col-md-6">
              <h6 className="text-muted mb-1">Fecha</h6>
              <p>{new Date(pedido.fecha).toLocaleDateString()}</p>
            </div>
            <div className="col-md-6">
              <h6 className="text-muted mb-1">Total</h6>
              <p className="fs-5 fw-bold">{pedido.total}€</p>
            </div>
            <div className="col-md-6">
              <h6 className="text-muted mb-1">Estado</h6>
              <span className={`badge ${pedido.entregado ? 'bg-success' : 'bg-warning'} fs-6`}>
                {pedido.entregado ? 'Entregado' : 'Pendiente de entrega'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center bg-white">
          <h5 className="mb-0">Artículos</h5>
          {!pedido.entregado && (
            <button 
              className={`btn ${showFormItem ? 'btn-outline-secondary' : 'btn-primary'} btn-sm d-flex align-items-center`}
              onClick={() => setShowFormItem(!showFormItem)}
            >
              {showFormItem ? (
                <><IconTimes className="me-1" /> Cancelar</>
              ) : (
                <><IconPlus className="me-1" /> Añadir artículo</>
              )}
            </button>
          )}
        </div>
        <div className="card-body">
          {showFormItem && !pedido.entregado && (
            <div className="mb-4">
              <h6 className="mb-3">Añadir Artículo</h6>
              <form onSubmit={handleAddItem}>
                <div className="mb-3">
                  <label className="form-label">Artículo:</label>
                  <select 
                    name="articulo"
                    value={formItem.articulo}
                    onChange={handleItemInputChange}
                    className="form-select"
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
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Cantidad:</label>
                    <input 
                      type="number"
                      name="cantidad"
                      value={formItem.cantidad}
                      onChange={handleItemInputChange}
                      className="form-control"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Precio unitario (€):</label>
                    <input 
                      type="number"
                      name="precio_unitario"
                      value={formItem.precio_unitario}
                      onChange={handleItemInputChange}
                      className="form-control"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <IconPlus className="me-1" /> Añadir
                  </button>
                  <button 
                    type="button"
                    className="btn btn-outline-secondary d-flex align-items-center"
                    onClick={() => setShowFormItem(false)}
                  >
                    <IconTimes className="me-1" /> Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {items.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th>Precio Unitario</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>{item.articulo_nombre || `Artículo ID: ${item.articulo}`}</td>
                      <td>{item.precio_unitario}€</td>
                      <td>{item.cantidad}</td>
                      <td>{(item.cantidad * item.precio_unitario).toFixed(2)}€</td>
                    </tr>
                  ))}
                  <tr className="table-active fw-bold">
                    <td colSpan="3" className="text-end">Total:</td>
                    <td>{pedido.total}€</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">
              Este pedido no tiene artículos aún.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
