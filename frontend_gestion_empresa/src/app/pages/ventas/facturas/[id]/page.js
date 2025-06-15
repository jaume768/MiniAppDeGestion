"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { facturasAPI } from '../../../../services/api';
import styles from '../../ventas.module.css';

export default function FacturaDetalle({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [factura, setFactura] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cargar detalles de la factura
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar factura y sus items
        const facturaData = await facturasAPI.getById(id);
        const itemsData = await facturasAPI.getItems(id);
        
        setFactura(facturaData);
        setItems(itemsData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Marcar factura como pagada
  const marcarPagada = async () => {
    try {
      await facturasAPI.update(id, { pagada: true });
      setFactura({...factura, pagada: true});
      alert('Factura marcada como pagada');
    } catch (err) {
      console.error("Error al marcar factura como pagada:", err);
      setError("Error al marcar la factura como pagada.");
    }
  };

  // Eliminar factura
  const eliminarFactura = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;
    
    try {
      await facturasAPI.delete(id);
      alert('Factura eliminada correctamente');
      router.push('/pages/ventas/facturas');
    } catch (err) {
      console.error("Error al eliminar la factura:", err);
      setError("Error al eliminar la factura.");
    }
  };

  // Imprimir factura
  const imprimirFactura = () => {
    window.print();
  };

  if (loading) return <p>Cargando detalles de la factura...</p>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (!factura) return <p>No se encontró la factura solicitada.</p>;

  return (
    <div>
      <div className={styles.detailHeader}>
        <Link href="/pages/ventas/facturas" className={styles.backLink}>
          &larr; Volver a facturas
        </Link>
        <h2>Factura #{id}</h2>
        <div className={styles.detailActions}>
          <button 
            className={`${styles.actionButton} ${styles.secondaryButton}`}
            onClick={imprimirFactura}
          >
            Imprimir
          </button>
          {!factura.pagada && (
            <button 
              className={`${styles.actionButton} ${styles.primaryButton}`}
              onClick={marcarPagada}
            >
              Marcar como pagada
            </button>
          )}
          <button 
            className={`${styles.actionButton} ${styles.dangerButton}`}
            onClick={eliminarFactura}
          >
            Eliminar factura
          </button>
        </div>
      </div>

      <div className={`${styles.detailCard} ${styles.printableContent}`}>
        <div className={styles.detailSection}>
          <div className={styles.invoiceHeader}>
            <div className={styles.companyInfo}>
              <h3>Mi Empresa S.L.</h3>
              <p>C/ Principal 123</p>
              <p>Madrid, España</p>
              <p>CIF: B12345678</p>
            </div>
            <div className={styles.invoiceInfo}>
              <h3>Factura</h3>
              <p><strong>Nº:</strong> {id}</p>
              <p><strong>Fecha:</strong> {new Date(factura.fecha).toLocaleDateString()}</p>
              <p><strong>Estado:</strong> 
                <span className={`${styles.statusBadge} ${factura.pagada ? styles.statusCompleted : styles.statusPending}`}>
                  {factura.pagada ? 'Pagada' : 'Pendiente de pago'}
                </span>
              </p>
              {factura.pedido && (
                <p><strong>Pedido:</strong> #{factura.pedido}</p>
              )}
            </div>
          </div>
          
          <div className={styles.clientInfo}>
            <h3>Cliente</h3>
            <p>{factura.cliente_nombre || `Cliente ID: ${factura.cliente}`}</p>
            {factura.cliente_direccion && <p>{factura.cliente_direccion}</p>}
            {factura.cliente_cif && <p>CIF/NIF: {factura.cliente_cif}</p>}
          </div>
        </div>

        <div className={styles.detailSection}>
          <h3>Artículos</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Precio Unitario</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map(item => (
                  <tr key={item.id}>
                    <td>{item.articulo_nombre || `Artículo ID: ${item.articulo}`}</td>
                    <td>{item.precio_unitario}€</td>
                    <td>{item.cantidad}</td>
                    <td>{(item.cantidad * item.precio_unitario)}€</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className={styles.noRecords}>
                    Esta factura no tiene artículos detallados
                  </td>
                </tr>
              )}
              <tr className={styles.subtotalRow}>
                <td colSpan="3" className={styles.totalLabel}>Subtotal:</td>
                <td className={styles.totalValue}>{factura.total}€</td>
              </tr>
              <tr className={styles.taxRow}>
                <td colSpan="3" className={styles.totalLabel}>IVA (21%):</td>
                <td className={styles.totalValue}>{(factura.total * 0.21)}€</td>
              </tr>
              <tr className={styles.totalRow}>
                <td colSpan="3" className={styles.totalLabel}>Total:</td>
                <td className={styles.totalValue}>{(factura.total * 1.21)}€</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className={styles.detailSection}>
          <div className={styles.termsAndConditions}>
            <h3>Términos y condiciones</h3>
            <p>Pago a 30 días desde la emisión de la factura mediante transferencia bancaria.</p>
            <p>Cuenta bancaria: ES12 3456 7890 1234 5678 9012</p>
          </div>
        </div>
        
        <div className={styles.thankYouSection}>
          <p>¡Gracias por confiar en nosotros!</p>
        </div>
      </div>
    </div>
  );
}
