"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { albaranesAPI, articulosAPI } from '../../../../services/api';

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

export default function AlbaranDetalleClient({ id }) {
  const router = useRouter();
  const [albaran, setAlbaran] = useState(null);
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
        const [albData, itemsData, articulosData] = await Promise.all([
          albaranesAPI.getById(id),
          albaranesAPI.getItems(id),
          articulosAPI.getAll(),
        ]);
        setAlbaran(albData);
        setItems(itemsData);
        setArticulos(articulosData);
      } catch (err) {
        console.error(err);
        setError('Error al cargar el albarán.');
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
      const newItem = await albaranesAPI.addItem(id, formItem);
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      const total = updatedItems.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);
      await albaranesAPI.update(id, { total });
      setAlbaran(prev => ({ ...prev, total }));
      setShowFormItem(false);
    } catch (err) {
      console.error(err);
      setError('Error al añadir artículo.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!confirm('Eliminar este artículo?')) return;
    try {
      await albaranesAPI.removeItem(id, itemId);
      const updated = items.filter(it => it.id !== itemId);
      setItems(updated);
      const total = updated.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);
      await albaranesAPI.update(id, { total });
      setAlbaran(prev => ({ ...prev, total }));
    } catch (err) {
      console.error(err);
      setError('Error al eliminar artículo.');
    }
  };

  const handleDeleteAlbaran = async () => {
    if (!confirm('Eliminar albarán?')) return;
    try {
      await albaranesAPI.delete(id);
      router.push('/pages/ventas/albaranes');
    } catch (err) {
      console.error(err);
      setError('Error al eliminar albarán.');
    }
  };

  if (loading) return <div className="spinner-border m-4" role="status"><span className="visually-hidden">Cargando...</span></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;
  if (!albaran) return <div className="alert alert-warning m-4">Albarán no encontrado.</div>;

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link href="/pages/ventas/albaranes" className="btn btn-link ps-0"><IconChevronLeft /> Volver</Link>
          <h2 className="mt-2">Albarán #{id}</h2>
        </div>
        <button className="btn btn-outline-danger" onClick={handleDeleteAlbaran}><IconTrash /> Eliminar</button>
      </div>

      <div className="card mb-4">
        <div className="card-body row">
          <div className="col-md-4"><strong>Cliente:</strong> {albaran.cliente_nombre}</div>
          <div className="col-md-4"><strong>Fecha:</strong> {new Date(albaran.fecha).toLocaleDateString()}</div>
          <div className="col-md-4"><strong>Total:</strong> {albaran.total}€</div>
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
                <input type="number" name="precio_unitario" className="form-control" value={formItem.precio_unitario} onChange={handleItemChange} step="0.01" min="0" required />
              </div>
              <div className="col-auto">
                <button type="submit" className="btn btn-primary btn-sm"><IconPlus /></button>
              </div>
            </form>
          )}

          {items.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead><tr><th>Artículo</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th /></tr></thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id}>
                      <td>{it.articulo_nombre}</td>
                      <td>{it.cantidad}</td>
                      <td>{it.precio_unitario}€</td>
                      <td>{(it.cantidad * it.precio_unitario).toFixed(2)}€</td>
                      <td><button className="btn btn-sm btn-danger" onClick={() => handleRemoveItem(it.id)}><IconTrash /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="alert alert-info">No hay artículos.</div>}
        </div>
      </div>
    </div>
  );
}
