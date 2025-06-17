"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { clientesAPI } from '../../../../services/api';
import styles from '../clientes.module.css';

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
        <h1 className={styles.title}>Cliente: {cliente.nombre}</h1>
        <Link href="/pages/general/clientes" className={styles.backButton}>
          ← Volver a Clientes
        </Link>
      </div>

      <div className={styles.detailCard}>
        <div className={styles.detailCardHeader}>
          <h2>Información del Cliente</h2>
          <Link href={`/pages/general/clientes/${cliente.id}/editar`} className={styles.button}>
            Editar
          </Link>
        </div>

        <div className={styles.detailCardBody}>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>ID:</div>
            <div className={styles.detailValue}>{cliente.id}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Nombre:</div>
            <div className={styles.detailValue}>{cliente.nombre}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Email:</div>
            <div className={styles.detailValue}>{cliente.email || '-'}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Teléfono:</div>
            <div className={styles.detailValue}>{cliente.telefono || '-'}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>CIF/NIF:</div>
            <div className={styles.detailValue}>{cliente.cif || '-'}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Dirección:</div>
            <div className={styles.detailValue}>{cliente.direccion || '-'}</div>
          </div>
          {cliente.notas && (
            <div className={styles.notesSection}>
              <h3>Notas</h3>
              <div className={styles.notes}>{cliente.notas}</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actionSection}>
        <h2>Acciones</h2>
        <div className={styles.actionButtons}>
          <Link href={`/pages/ventas/facturas?cliente=${cliente.id}`} className={styles.actionButton}>
            Ver Facturas
          </Link>
          <Link href={`/pages/ventas/pedidos?cliente=${cliente.id}`} className={styles.actionButton}>
            Ver Pedidos
          </Link>
          <Link href={`/pages/ventas/albaranes?cliente=${cliente.id}`} className={styles.actionButton}>
            Ver Albaranes
          </Link>
        </div>
      </div>
    </div>
  );
}
