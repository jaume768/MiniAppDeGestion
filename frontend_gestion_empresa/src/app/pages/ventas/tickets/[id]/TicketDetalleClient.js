"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ticketsAPI, articulosAPI } from '../../../../services/api';

// SVG Icons
const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
  </svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
  </svg>
);
const IconTimes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="18" width="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
  </svg>
);

export default function TicketDetalleClient({ id }) {
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [items, setItems] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormItem, setShowFormItem] = useState(false);
  const [formItem, setFormItem] = useState({ articulo: '', cantidad: 1, precio_unitario: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tkData, itemsData, articulosData] = await Promise.all([
          ticketsAPI.getById(id),
          ticketsAPI.getItems(id),
          articulosAPI.getAll(),
        ]);
        setTicket(tkData);
        setItems(itemsData);
        setArticulos(articulosData);
      } catch (err) {
        console.error(err);
        setError('Error al cargar el ticket.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    if (name === 'articulo') {
      const sel = articulos.find(a => a.id === parseInt(value));
      if (sel) {
        setFormItem({ articulo: value, cantidad: 1, precio_unitario: sel.precio });
        return;
      }
    }
    setFormItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const newItem = await ticketsAPI.addItem(id, formItem);
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      const total = updatedItems.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);
      await ticketsAPI.update(id, { total });
      setTicket(prev => ({ ...prev, total }));
      setShowFormItem(false);
    } catch (err) {
      console.error(err);
      setError('Error al añadir artículo.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!confirm('Eliminar este artículo?')) return;
    try {
      await ticketsAPI.removeItem(id, itemId);
      const updated = items.filter(it => it.id !== itemId);
      setItems(updated);
      const total = updated.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);
      await ticketsAPI.update(id, { total });
      setTicket(prev => ({ ...prev, total }));
    } catch (err) {
      console.error(err);
      setError('Error al eliminar artículo.');
    }
  };

  const handleDeleteTicket = async () => {
    if (!confirm('Eliminar ticket?')) return;
    try {
      await ticketsAPI.delete(id);
      router.push('/pages/ventas/tickets');
    } catch (err) {
      console.error(err);
      setError('Error al eliminar ticket.');
    }
  };

  if (loading) return <div className="spinner-border m-4" role="status"><span className="visually-hidden">Cargando...</span></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;
  if (!ticket) return <div className="alert alert-warning m-4">Ticket no encontrado.</div>;

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link href="/pages/ventas/tickets" className="btn btn-link ps-0"><IconChevronLeft /> Volver</Link>
          <h2 className="mt-2">Ticket #{id}</h2>
        </div>
        <button className="btn btn-outline-danger" onClick={handleDeleteTicket}><IconTrash /> Eliminar</button>
      </div>

      <div className="card mb-4">
        <div className="card-body row">
          <div className="col-md-4"><strong>Cliente:</strong> {ticket.cliente_nombre}</div>
          <div className="col-md-4"><strong>Fecha:</strong> {new Date(ticket.fecha).toLocaleDateString()}</div>
          <div className="col-md-4"><strong>Total:</strong> {ticket.total}€</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Artículos</h5>
          <button className={`btn ${showFormItem ? 'btn-outline-secondary' : 'btn-primary'} btn-sm`} onClick={() => setShowFormItem(prev => !prev)}>
            {showFormItem ? <IconTimes /> : <IconPlus />}
          </button>
        </div>
        <div className="card-body">
          {showFormItem && (
            <form onSubmit={handleAddItem} className="row g-2 mb-3">
              <div className="col-auto">
                <select name="articulo" className="form-select" value={formItem.articulo} onChange={handleItemChange} required>
                  <option value="">Artículo</option>
                  {articulos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div className="col-auto">
                <input type="number" name="cantidad" className="form-control" value={formItem.cantidad} onChange={handleItemChange} min="1" required />
              </div>
              <div className="col-auto">
                <input type="number" name="precio_unitario" className="form-control" value={formItem.precio_unitario} onChange={handleItemChange} min="0" step="0.01" placeholder="Precio" />
              </div>
              <div className="col-auto">
                <button type="submit" className="btn btn-secondary"><IconPlus /></button>
              </div>
            </form>
          )}

          {items.length === 0 ? (
            <div className="alert alert-secondary">No hay artículos en este ticket.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const subtotal = item.cantidad * item.precio_unitario;
                  return (
                    <tr key={item.id}>
                      <td>{item.articulo_nombre}</td>
                      <td>{item.cantidad}</td>
                      <td>{item.precio_unitario}€</td>
                      <td>{subtotal.toFixed(2)}€</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                  <td><strong>{ticket.total}€</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
