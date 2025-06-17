"use client";

import { useState, useEffect } from 'react';
import { presupuestosAPI, pedidosAPI, facturasAPI, ticketsAPI } from '@/app/services/api';
import { useSearchParams } from 'next/navigation';
import TablaPresupuestos from '../../components/ventas/TablaPresupuestos';
import TablaPedidos from '../../components/ventas/TablaPedidos';
import TablaFacturas from '../../components/ventas/TablaFacturas';
import TablaTickets from '../../components/ventas/TablaTickets';
import FormularioPresupuesto from '../../components/ventas/FormularioPresupuesto';
import FormularioPedido from '../../components/ventas/FormularioPedido';
import FormularioFactura from '../../components/ventas/FormularioFactura';
import FormularioTicket from '../../components/ventas/FormularioTicket';
import styles from '../section.module.css';

export default function VentasPage() {
  const [activeTab, setActiveTab] = useState('presupuestos');
  const [showFormPresupuestos, setShowFormPresupuestos] = useState(false);
  const [showFormPedidos, setShowFormPedidos] = useState(false);
  const [showFormFacturas, setShowFormFacturas] = useState(false);
  const [showFormTickets, setShowFormTickets] = useState(false);
  const [presupuestoToEdit, setPresupuestoToEdit] = useState(null);
  const [pedidoToEdit, setPedidoToEdit] = useState(null);
  const [facturaToEdit, setFacturaToEdit] = useState(null);
  const [ticketToEdit, setTicketToEdit] = useState(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Manejar la selección de la pestaña
    const tab = searchParams.get('tab');
    if (tab === 'presupuestos' || tab === 'pedidos' || tab === 'facturas' || tab === 'tickets') {
      setActiveTab(tab);
    }

    // Manejar la edición de un documento
    const edit = searchParams.get('edit');
    if (edit) {
      const editId = parseInt(edit);
      if (!isNaN(editId)) {
        // Determinar qué tipo de documento es basado en la pestaña activa o el parámetro tab
        if (tab === 'presupuestos' || (!tab && activeTab === 'presupuestos')) {
          // Cargar presupuesto para editar
          const fetchPresupuesto = async () => {
            try {
              const data = await presupuestosAPI.getById(editId);
              setPresupuestoToEdit(data);
              setShowFormPresupuestos(true);
            } catch (error) {
              console.error('Error al cargar el presupuesto para editar:', error);
            }
          };
          fetchPresupuesto();
        } else if (tab === 'pedidos' || (!tab && activeTab === 'pedidos')) {
          // Cargar pedido para editar
          const fetchPedido = async () => {
            try {
              const data = await pedidosAPI.getById(editId);
              setPedidoToEdit(data);
              setShowFormPedidos(true);
            } catch (error) {
              console.error('Error al cargar el pedido para editar:', error);
            }
          };
          fetchPedido();
        } else if (tab === 'facturas' || (!tab && activeTab === 'facturas')) {
          // Cargar factura para editar
          const fetchFactura = async () => {
            try {
              const data = await facturasAPI.getById(editId);
              setFacturaToEdit(data);
              setShowFormFacturas(true);
            } catch (error) {
              console.error('Error al cargar la factura para editar:', error);
            }
          };
          fetchFactura();
        } else if (tab === 'tickets' || (!tab && activeTab === 'tickets')) {
          // Cargar ticket para editar
          const fetchTicket = async () => {
            try {
              const data = await ticketsAPI.getById(editId);
              setTicketToEdit(data);
              setShowFormTickets(true);
            } catch (error) {
              console.error('Error al cargar el ticket para editar:', error);
            }
          };
          fetchTicket();
        }
      }
    }
  }, [searchParams]);

  const handleNuevoPresupuesto = () => {
    setPresupuestoToEdit(null);
    setShowFormPresupuestos(true);
  };

  const handleEditPresupuesto = (presupuesto) => {
    setPresupuestoToEdit(presupuesto);
    setShowFormPresupuestos(true);
  };

  const handleNuevoPedido = () => {
    setPedidoToEdit(null);
    setShowFormPedidos(true);
  };

  const handleEditPedido = (pedido) => {
    setPedidoToEdit(pedido);
    setShowFormPedidos(true);
  };

  const handleNuevaFactura = () => {
    setFacturaToEdit(null);
    setShowFormFacturas(true);
  };

  const handleEditFactura = (factura) => {
    setFacturaToEdit(factura);
    setShowFormFacturas(true);
  };

  const handleNuevoTicket = () => {
    setTicketToEdit(null);
    setShowFormTickets(true);
  };

  const handleEditTicket = (ticket) => {
    setTicketToEdit(ticket);
    setShowFormTickets(true);
  };

  const handlePresupuestoSuccess = (presupuesto) => {
    setShowFormPresupuestos(false);
    // Podríamos recargar los datos aquí si es necesario
    alert(presupuestoToEdit ? 'Presupuesto actualizado correctamente' : 'Presupuesto creado correctamente');
  };

  const handlePedidoSuccess = (pedido) => {
    setShowFormPedidos(false);
    // Podríamos recargar los datos aquí si es necesario
    alert(pedidoToEdit ? 'Pedido actualizado correctamente' : 'Pedido creado correctamente');
  };

  const handleFacturaSuccess = (factura) => {
    setShowFormFacturas(false);
    // Podríamos recargar los datos aquí si es necesario
    alert(facturaToEdit ? 'Factura actualizada correctamente' : 'Factura creada correctamente');
  };

  const handleTicketSuccess = (ticket) => {
    setShowFormTickets(false);
    // Podríamos recargar los datos aquí si es necesario
    alert(ticketToEdit ? 'Ticket actualizado correctamente' : 'Ticket creado correctamente');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ventas</h1>
      </div>

      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'presupuestos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('presupuestos')}
          >
            Presupuestos
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'pedidos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            Pedidos
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'tickets' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            Tickets
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'facturas' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('facturas')}
          >
            Facturas
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'presupuestos' && (
            <div className={styles.tabPanel}>
              {showFormPresupuestos ? (
                <FormularioPresupuesto 
                  presupuesto={presupuestoToEdit}
                  onCancel={() => setShowFormPresupuestos(false)}
                  onSuccess={handlePresupuestoSuccess}
                />
              ) : (
                <TablaPresupuestos 
                  onNuevoClick={handleNuevoPresupuesto} 
                  onEditClick={handleEditPresupuesto} 
                />
              )}
            </div>
          )}

          {activeTab === 'pedidos' && (
            <div className={styles.tabPanel}>
              {showFormPedidos ? (
                <FormularioPedido 
                  pedido={pedidoToEdit}
                  onCancel={() => setShowFormPedidos(false)}
                  onSuccess={handlePedidoSuccess}
                />
              ) : (
                <TablaPedidos 
                  onNuevoClick={handleNuevoPedido} 
                  onEditClick={handleEditPedido} 
                />
              )}
            </div>
          )}

          {activeTab === 'facturas' && (
            <div className={styles.tabPanel}>
              {showFormFacturas ? (
                <FormularioFactura 
                  factura={facturaToEdit}
                  onCancel={() => setShowFormFacturas(false)}
                  onSuccess={handleFacturaSuccess}
                />
              ) : (
                <TablaFacturas 
                  onNuevoClick={handleNuevaFactura} 
                  onEditClick={handleEditFactura} 
                />
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className={styles.tabPanel}>
              {showFormTickets ? (
                <FormularioTicket 
                  ticket={ticketToEdit}
                  onCancel={() => setShowFormTickets(false)}
                  onSuccess={handleTicketSuccess}
                />
              ) : (
                <TablaTickets 
                  onNuevoClick={handleNuevoTicket} 
                  onEditClick={handleEditTicket} 
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
