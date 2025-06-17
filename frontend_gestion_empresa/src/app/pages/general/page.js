"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TablaClientes from '../../components/clientes/TablaClientes';
import TablaEmpleados from '../../components/empleados/TablaEmpleados';
import FormularioCliente from '../../components/clientes/FormularioCliente';
import FormularioEmpleado from '../../components/empleados/FormularioEmpleado';
import styles from '../section.module.css';

export default function GeneralPage() {
  const [activeTab, setActiveTab] = useState('clientes');
  const [showFormClientes, setShowFormClientes] = useState(false);
  const [showFormEmpleados, setShowFormEmpleados] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState(null);
  const [empleadoToEdit, setEmpleadoToEdit] = useState(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Manejar la selección de la pestaña
    const tab = searchParams.get('tab');
    if (tab === 'clientes' || tab === 'empleados' || tab === 'proveedores' || tab === 'codigos') {
      setActiveTab(tab);
    }

    // Manejar la edición de un cliente o empleado
    const edit = searchParams.get('edit');
    if (edit) {
      const editId = parseInt(edit);
      if (!isNaN(editId)) {
        // Determinar si es un cliente o un empleado basado en la pestaña activa o el parámetro tab
        if (tab === 'clientes' || (!tab && activeTab === 'clientes')) {
          // Cargar cliente para editar
          const fetchCliente = async () => {
            try {
              const data = await clientesAPI.getById(editId);
              setClienteToEdit(data);
              setShowFormClientes(true);
            } catch (error) {
              console.error('Error al cargar el cliente para editar:', error);
            }
          };
          fetchCliente();
        } else if (tab === 'empleados' || (!tab && activeTab === 'empleados')) {
          // Cargar empleado para editar
          const fetchEmpleado = async () => {
            try {
              const data = await empleadosAPI.getById(editId);
              setEmpleadoToEdit(data);
              setShowFormEmpleados(true);
            } catch (error) {
              console.error('Error al cargar el empleado para editar:', error);
            }
          };
          fetchEmpleado();
        }
      }
    }
  }, [searchParams]);

  const handleNuevoCliente = () => {
    setClienteToEdit(null);
    setShowFormClientes(true);
  };

  const handleEditCliente = (cliente) => {
    setClienteToEdit(cliente);
    setShowFormClientes(true);
  };

  const handleNuevoEmpleado = () => {
    setEmpleadoToEdit(null);
    setShowFormEmpleados(true);
  };

  const handleEditEmpleado = (empleado) => {
    setEmpleadoToEdit(empleado);
    setShowFormEmpleados(true);
  };

  const handleClienteSuccess = (cliente) => {
    setShowFormClientes(false);
    // Podríamos recargar los datos aquí si es necesario
    alert(clienteToEdit ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
  };

  const handleEmpleadoSuccess = (empleado) => {
    setShowFormEmpleados(false);
    // Podríamos recargar los datos aquí si es necesario
    alert(empleadoToEdit ? 'Empleado actualizado correctamente' : 'Empleado creado correctamente');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>General</h1>
      </div>

      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'clientes' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('clientes')}
          >
            Clientes
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'empleados' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('empleados')}
          >
            Empleados
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'proveedores' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('proveedores')}
          >
            Proveedores
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'codigos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('codigos')}
          >
            Códigos Postales
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'clientes' && (
            <div className={styles.tabPanel}>
              {showFormClientes ? (
                <FormularioCliente 
                  cliente={clienteToEdit}
                  onCancel={() => setShowFormClientes(false)}
                  onSuccess={handleClienteSuccess}
                />
              ) : (
                <TablaClientes 
                  onNuevoClick={handleNuevoCliente} 
                  onEditClick={handleEditCliente} 
                />
              )}
            </div>
          )}

          {activeTab === 'empleados' && (
            <div className={styles.tabPanel}>
              {showFormEmpleados ? (
                <FormularioEmpleado 
                  empleado={empleadoToEdit}
                  onCancel={() => setShowFormEmpleados(false)}
                  onSuccess={handleEmpleadoSuccess}
                />
              ) : (
                <TablaEmpleados 
                  onNuevoClick={handleNuevoEmpleado} 
                  onEditClick={handleEditEmpleado} 
                />
              )}
            </div>
          )}

          {activeTab === 'proveedores' && (
            <div className={styles.tabPanel}>
              <div className={styles.comingSoon}>
                <h3>Módulo de Proveedores</h3>
                <p>Esta funcionalidad estará disponible próximamente.</p>
              </div>
            </div>
          )}

          {activeTab === 'codigos' && (
            <div className={styles.tabPanel}>
              <div className={styles.comingSoon}>
                <h3>Códigos Postales</h3>
                <p>Esta funcionalidad estará disponible próximamente.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
