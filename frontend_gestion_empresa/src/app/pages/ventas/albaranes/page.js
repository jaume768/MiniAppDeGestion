"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { albaranesAPI, clientesAPI, articulosAPI } from '../../../services/api';
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

export default function AlbaranesPage() {
  const [albaranes, setAlbaranes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [itemsForm, setItemsForm] = useState([]);
  const [currentItem, setCurrentItem] = useState({ articulo: '', cantidad: 1, precio_unitario: 0 });
  const [formData, setFormData] = useState({ cliente: '', fecha: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [albData, clientesData, articulosData] = await Promise.all([
          albaranesAPI.getAll(),
          clientesAPI.getAll(),
          articulosAPI.getAll()
        ]);
        // ordenar más recientes
        albData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setAlbaranes(albData);
        setClientes(clientesData);
        setArticulos(articulosData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    if (name === 'articulo') {
      const sel = articulos.find(a => a.id === parseInt(value));
      if (sel) {
        setCurrentItem({ ...currentItem, articulo: value, precio_unitario: sel.precio });
        return;
      }
    }
    setCurrentItem({ ...currentItem, [name]: value });
  };

  const agregarItem = () => {
    if (!currentItem.articulo || currentItem.cantidad < 1) return alert('Seleccione artículo y cantidad.');
    const artObj = articulos.find(a => a.id === parseInt(currentItem.articulo));
    const subtotal = parseFloat(currentItem.precio_unitario) * parseInt(currentItem.cantidad);
    const nuevo = { ...currentItem, subtotal, articulo_nombre: artObj ? artObj.nombre : 'Desconocido' };
    setItemsForm([...itemsForm, nuevo]);
    setCurrentItem({ articulo: '', cantidad: 1, precio_unitario: 0 });
  };

  const removerItem = (i) => {
    setItemsForm(itemsForm.filter((_, idx) => idx !== i));
  };

  const calcularTotal = () => {
    return itemsForm.reduce((sum, it) => sum + it.subtotal, 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente) return alert('Seleccione un cliente.');
    if (itemsForm.length === 0) return alert('Agregue al menos un artículo.');
    try {
      const payload = {
        cliente: parseInt(formData.cliente),
        fecha: formData.fecha,
        items: itemsForm.map(it => ({ articulo: parseInt(it.articulo), cantidad: parseInt(it.cantidad), precio_unitario: parseFloat(it.precio_unitario) }))
      };
      const nuevo = await albaranesAPI.create(payload);
      setAlbaranes([nuevo, ...albaranes]);
      setShowForm(false);
      setFormData({ cliente: '', fecha: new Date().toISOString().split('T')[0] });
      setItemsForm([]);
      alert('Albarán creado correctamente');
    } catch (err) {
      console.error('Error al crear albarán:', err);
      setError('Error al crear el albarán.');
    }
  };

  const eliminarAlbaran = async (id) => {
    if (!confirm('¿Eliminar este albarán?')) return;
    try {
      await albaranesAPI.delete(id);
      setAlbaranes(albaranes.filter(a => a.id !== id));
      alert('Albarán eliminado');
    } catch (err) {
      console.error('Error al eliminar:', err);
      setError('Error al eliminar el albarán.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">Gestión de Albaranes</h2>
        <button className={`btn ${showForm ? 'btn-outline-secondary' : 'btn-primary'}`} onClick={() => setShowForm(prev => !prev)}>
          {showForm ? <><IconTimes className="me-1" />Cancelar</> : <><IconPlus className="me-1" />Nuevo Albarán</>}
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header"><h5>Crear Albarán</h5></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Cliente</label>
                <select name="cliente" className="form-select" value={formData.cliente} onChange={handleInputChange} required>
                  <option value="">Seleccione cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Fecha</label>
                <input type="date" name="fecha" className="form-control" value={formData.fecha} onChange={handleInputChange} required />
              </div>
              <div className={styles.itemsSection}>
                <h6>Artículos</h6>
                <div className="row g-2 align-items-end mb-3">
                  <div className="col-auto">
                    <select name="articulo" className="form-select" value={currentItem.articulo} onChange={handleItemChange}>
                      <option value="">Artículo</option>
                      {articulos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </div>
                  <div className="col-auto">
                    <input type="number" name="cantidad" className="form-control" value={currentItem.cantidad} onChange={handleItemChange} min="1" placeholder="Cant." />
                  </div>
                  <div className="col-auto">
                    <input type="number" name="precio_unitario" className="form-control" value={currentItem.precio_unitario} onChange={handleItemChange} min="0" step="0.01" placeholder="Precio" />
                  </div>
                  <div className="col-auto">
                    <button type="button" className="btn btn-secondary" onClick={agregarItem}><IconPlus /></button>
                  </div>
                </div>
                {itemsForm.length > 0 && (
                  <table className="table mb-3">
                    <thead><tr><th>Artículo</th><th>Cant.</th><th>Precio</th><th>Subtotal</th><th /></tr></thead>
                    <tbody>
                      {itemsForm.map((it,i) => <tr key={i}><td>{it.articulo_nombre}</td><td>{it.cantidad}</td><td>{it.precio_unitario}€</td><td>{it.subtotal.toFixed(2)}€</td><td><button type="button" className="btn btn-sm btn-danger" onClick={() => removerItem(i)}><IconTrash /></button></td></tr>)}
                    </tbody>
                    <tfoot><tr><td colSpan="3" className="text-end">Total:</td><td>{calcularTotal()}€</td></tr></tfoot>
                  </table>
                )}
              </div>
              <button type="submit" className="btn btn-primary"><IconPlus className="me-1" />Crear</button>
              <button type="button" className="btn btn-outline-secondary ms-2" onClick={() => setShowForm(false)}><IconTimes />Cancelar</button>
            </form>
          </div>
        </div>
      )}
      <TableComponent
        isLoading={loading}
        headers={[
          { name: 'ID', key: 'id' },
          { name: 'Cliente', key: 'cliente_nombre', render: a => a.cliente_nombre || `Cliente ID: ${a.cliente}` },
          { name: 'Fecha', key: 'fecha', render: a => new Date(a.fecha).toLocaleDateString() },
          { name: 'Total', key: 'total', render: a => `${a.total}€` }
        ]}
        data={albaranes}
        onRowClick={a => window.location.href = `/pages/ventas/albaranes/${a.id}`}
        actionButtons={a => (
          <div className="d-flex gap-1">
            <Link href={`/pages/ventas/albaranes/${a.id}`} className="btn btn-sm btn-outline-primary" onClick={e => e.stopPropagation()}><IconEye /></Link>
            <button className="btn btn-sm btn-outline-danger" onClick={e => { e.stopPropagation(); eliminarAlbaran(a.id); }}><IconTrash /></button>
          </div>
        )}
      />
    </div>
  );
}
