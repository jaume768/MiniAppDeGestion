"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { clientesAPI } from '../../../../services/api';
import styles from '../../../detalle.module.css';

const IconBack = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

export default function ClienteDetailPage() {
  const params = useParams();
  const id = params.id;
  
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const data = await clientesAPI.getById(id);
        setCliente(data);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar el cliente:", err);
        setError("No se ha podido cargar los datos del cliente. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };

    fetchCliente();
  }, [id]);

  if (loading) return <div className={styles.loading}>Cargando datos del cliente...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!cliente) return <div className={styles.error}>Cliente no encontrado</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link href="/pages/general?tab=clientes" className={styles.backButton}>
            <IconBack /> Volver a Clientes
          </Link>
          <h1 className={styles.title}>{cliente.nombre}</h1>
        </div>
        <Link href={`/pages/general?tab=clientes&edit=${cliente.id}`} className={styles.primaryButton}>
          <IconEdit /> Editar Cliente
        </Link>
      </div>

      <div className={styles.detailCard}>
        <div className={styles.detailCardHeader}>
          <h2>Información del Cliente</h2>
        </div>

        <div className={styles.detailCardContent}>
          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Nombre</div>
              <div className={styles.detailValue}>{cliente.nombre}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>CIF/NIF</div>
              <div className={styles.detailValue}>{cliente.cif || '-'}</div>
            </div>
          </div>
            
          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Email</div>
              <div className={styles.detailValue}>{cliente.email || '-'}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Teléfono</div>
              <div className={styles.detailValue}>{cliente.telefono || '-'}</div>
            </div>
          </div>
            
          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Dirección</div>
              <div className={styles.detailValue}>{cliente.direccion || '-'}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>ID interno</div>
              <div className={styles.detailValue}>{cliente.id}</div>
            </div>
          </div>
            
          {cliente.notas && (
            <div className={styles.detailItem} style={{marginTop: '1.5rem'}}>
              <div className={styles.detailLabel}>Notas</div>
              <div className={styles.detailValue} style={{whiteSpace: 'pre-wrap'}}>{cliente.notas}</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.detailCard}>
        <div className={styles.detailCardHeader}>
          <h2>Documentos relacionados</h2>
        </div>
        <div className={styles.detailCardContent}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href={`/pages/ventas/facturas?cliente=${cliente.id}`} className={styles.secondaryButton}>
              Ver Facturas
            </Link>
            <Link href={`/pages/ventas/pedidos?cliente=${cliente.id}`} className={styles.secondaryButton}>
              Ver Pedidos
            </Link>
            <Link href={`/pages/ventas/albaranes?cliente=${cliente.id}`} className={styles.secondaryButton}>
              Ver Albaranes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
