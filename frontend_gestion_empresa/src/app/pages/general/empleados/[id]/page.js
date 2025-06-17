"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { empleadosAPI, departamentosAPI } from '../../../../services/api';
import styles from '../empleados.module.css';

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
        <h1 className={styles.title}>Empleado: {empleado.nombre}</h1>
        <Link href="/pages/general/empleados" className={styles.backButton}>
          ← Volver a Empleados
        </Link>
      </div>

      <div className={styles.detailCard}>
        <div className={styles.detailCardHeader}>
          <h2>Información del Empleado</h2>
          <Link href={`/pages/general/empleados/${empleado.id}/editar`} className={styles.button}>
            Editar
          </Link>
        </div>

        <div className={styles.detailCardBody}>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>ID:</div>
            <div className={styles.detailValue}>{empleado.id}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Nombre:</div>
            <div className={styles.detailValue}>{empleado.nombre}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Email:</div>
            <div className={styles.detailValue}>{empleado.email || '-'}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Teléfono:</div>
            <div className={styles.detailValue}>{empleado.telefono || '-'}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Puesto:</div>
            <div className={styles.detailValue}>{empleado.puesto || '-'}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Departamento:</div>
            <div className={styles.detailValue}>
              {departamento ? departamento.nombre : (empleado.departamento || '-')}
            </div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Fecha de contratación:</div>
            <div className={styles.detailValue}>{formatDate(empleado.fecha_contratacion)}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Salario anual:</div>
            <div className={styles.detailValue}>{formatSalario(empleado.salario)}</div>
          </div>
        </div>
      </div>

      <div className={styles.actionSection}>
        <h2>Acciones</h2>
        <div className={styles.actionButtons}>
          <Link href={`/pages/proyectos?empleado=${empleado.id}`} className={styles.actionButton}>
            Ver Proyectos Asignados
          </Link>
        </div>
      </div>
    </div>
  );
}
