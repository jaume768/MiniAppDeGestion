"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { empleadosAPI, departamentosAPI } from '../../../../services/api';
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

export default function EmpleadoDetailPage() {
  const params = useParams();
  const id = params.id;
  
  const [empleado, setEmpleado] = useState(null);
  const [departamento, setDepartamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await empleadosAPI.getById(id);
        setEmpleado(data);
        
        // Si el empleado tiene un departamento, obtener la información del departamento
        if (data.departamento) {
          try {
            const deptData = await departamentosAPI.getById(data.departamento);
            setDepartamento(deptData);
          } catch (err) {
            console.error("Error al cargar el departamento:", err);
            // No mostramos error, solo log, ya que no es crítico
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar el empleado:", err);
        setError("No se ha podido cargar los datos del empleado. Por favor, intenta de nuevo más tarde.");
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className={styles.loading}>Cargando datos del empleado...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!empleado) return <div className={styles.error}>Empleado no encontrado</div>;

  // Formatear la fecha para mostrarla
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Formatear el salario
  const formatSalario = (salario) => {
    if (!salario) return '-';
    return `${Number(salario).toLocaleString('es-ES')} €`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link href="/pages/general?tab=empleados" className={styles.backButton}>
            <IconBack /> Volver a Empleados
          </Link>
          <h1 className={styles.title}>{empleado.nombre}</h1>
        </div>
        <Link href={`/pages/general?tab=empleados&edit=${empleado.id}`} className={styles.primaryButton}>
          <IconEdit /> Editar Empleado
        </Link>
      </div>

      <div className={styles.detailCard}>
        <div className={styles.detailCardHeader}>
          <h2>Información del Empleado</h2>
        </div>

        <div className={styles.detailCardContent}>
          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Nombre</div>
              <div className={styles.detailValue}>{empleado.nombre}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>DNI/NIE</div>
              <div className={styles.detailValue}>{empleado.dni || '-'}</div>
            </div>
          </div>
            
          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Email</div>
              <div className={styles.detailValue}>{empleado.email || '-'}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Teléfono</div>
              <div className={styles.detailValue}>{empleado.telefono || '-'}</div>
            </div>
          </div>
          
          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Cargo</div>
              <div className={styles.detailValue}>{empleado.cargo || '-'}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Departamento</div>
              <div className={styles.detailValue}>
                {departamento ? departamento.nombre : (empleado.departamento || '-')}
              </div>
            </div>
          </div>
          
          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Fecha de contratación</div>
              <div className={styles.detailValue}>{formatDate(empleado.fecha_contratacion)}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Dirección</div>
              <div className={styles.detailValue}>{empleado.direccion || '-'}</div>
            </div>
          </div>
          
          {empleado.notas && (
            <div className={styles.detailItem} style={{marginTop: '1.5rem'}}>
              <div className={styles.detailLabel}>Notas</div>
              <div className={styles.detailValue} style={{whiteSpace: 'pre-wrap'}}>{empleado.notas}</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.detailCard}>
        <div className={styles.detailCardHeader}>
          <h2>Proyectos asignados</h2>
        </div>
        <div className={styles.detailCardContent}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href={`/pages/proyectos?empleado=${empleado.id}`} className={styles.secondaryButton}>
              Ver Proyectos Asignados
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
