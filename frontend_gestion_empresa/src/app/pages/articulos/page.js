"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { articulosAPI, marcasAPI, categoriasAPI } from '../../services/api';
import TablaArticulos from '../../components/articulos/TablaArticulos';
import TablaMarcas from '../../components/articulos/TablaMarcas';
import TablaCategorias from '../../components/articulos/TablaCategorias';
import FormularioArticulo from '../../components/articulos/FormularioArticulo';
import FormularioMarca from '../../components/articulos/FormularioMarca';
import FormularioCategoria from '../../components/articulos/FormularioCategoria';
import styles from '../../components/clientes/Tablas.module.css';

export default function ArticulosPage() {
  const [activeTab, setActiveTab] = useState('articulos');
  const [showFormArticulos, setShowFormArticulos] = useState(false);
  const [showFormMarcas, setShowFormMarcas] = useState(false);
  const [showFormCategorias, setShowFormCategorias] = useState(false);
  const [articuloToEdit, setArticuloToEdit] = useState(null);
  const [marcaToEdit, setMarcaToEdit] = useState(null);
  const [categoriaToEdit, setCategoriaToEdit] = useState(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Manejar la selección de la pestaña
    const tab = searchParams.get('tab');
    if (tab === 'articulos' || tab === 'marcas' || tab === 'categorias') {
      setActiveTab(tab);
    }

    // Manejar la edición basada en parámetros URL
    const edit = searchParams.get('edit');
    const editId = searchParams.get('id');
    if (edit && editId) {
      if (edit === 'articulo') {
        loadEditData('articulo', editId);
        setActiveTab('articulos');
        setShowFormArticulos(true);
      } else if (edit === 'marca') {
        loadEditData('marca', editId);
        setActiveTab('marcas');
        setShowFormMarcas(true);
      } else if (edit === 'categoria') {
        loadEditData('categoria', editId);
        setActiveTab('categorias');
        setShowFormCategorias(true);
      }
    }
  }, [searchParams, activeTab]);

  const loadEditData = async (type, id) => {
    try {
      let data;
      if (type === 'articulo') {
        data = await articulosAPI.getById(id);
        setArticuloToEdit(data);
      } else if (type === 'marca') {
        data = await marcasAPI.getById(id);
        setMarcaToEdit(data);
      } else if (type === 'categoria') {
        data = await categoriasAPI.getById(id);
        setCategoriaToEdit(data);
      }
    } catch (error) {
      console.error('Error loading edit data:', error);
    }
  };

  const handleCancelArticulo = () => {
    setShowFormArticulos(false);
    setArticuloToEdit(null);
  };

  const handleCancelMarca = () => {
    setShowFormMarcas(false);
    setMarcaToEdit(null);
  };

  const handleCancelCategoria = () => {
    setShowFormCategorias(false);
    setCategoriaToEdit(null);
  };

  const handleFormSuccess = (data) => {
    if (activeTab === 'articulos') {
      setShowFormArticulos(false);
      setArticuloToEdit(null);
    } else if (activeTab === 'marcas') {
      setShowFormMarcas(false);
      setMarcaToEdit(null);
    } else if (activeTab === 'categorias') {
      setShowFormCategorias(false);
      setCategoriaToEdit(null);
    }
    
    // Actualizar la URL para quitar parámetros de edición
    const url = new URL(window.location);
    url.searchParams.delete('edit');
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url);
    
    // Mostrar mensaje de éxito
    alert(data ? 'Datos actualizados correctamente' : 'Datos creados correctamente');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Artículos</h1>
      </div>

      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'articulos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('articulos')}
          >
            Artículos
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'marcas' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('marcas')}
          >
            Marcas
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'categorias' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('categorias')}
          >
            Categorías
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'articulos' && (
            <div className={styles.tabPanel}>
              {showFormArticulos ? (
                <FormularioArticulo
                  articulo={articuloToEdit}
                  onCancel={handleCancelArticulo}
                  onSuccess={handleFormSuccess}
                />
              ) : (
                <>
                  <div className={styles.tableHeader}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setShowFormArticulos(true)}
                    >
                      Nuevo Artículo
                    </button>
                  </div>
                  <TablaArticulos onEdit={(id) => {
                    window.location.href = `?tab=articulos&edit=articulo&id=${id}`;
                  }} />
                </>
              )}
            </div>
          )}

          {activeTab === 'marcas' && (
            <div className={styles.tabPanel}>
              {showFormMarcas ? (
                <FormularioMarca
                  marca={marcaToEdit}
                  onCancel={handleCancelMarca}
                  onSuccess={handleFormSuccess}
                />
              ) : (
                <>
                  <div className={styles.tableHeader}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setShowFormMarcas(true)}
                    >
                      Nueva Marca
                    </button>
                  </div>
                  <TablaMarcas onEdit={(id) => {
                    window.location.href = `?tab=marcas&edit=marca&id=${id}`;
                  }} />
                </>
              )}
            </div>
          )}

          {activeTab === 'categorias' && (
            <div className={styles.tabPanel}>
              {showFormCategorias ? (
                <FormularioCategoria
                  categoria={categoriaToEdit}
                  onCancel={handleCancelCategoria}
                  onSuccess={handleFormSuccess}
                />
              ) : (
                <>
                  <div className={styles.tableHeader}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setShowFormCategorias(true)}
                    >
                      Nueva Categoría
                    </button>
                  </div>
                  <TablaCategorias onEdit={(id) => {
                    window.location.href = `?tab=categorias&edit=categoria&id=${id}`;
                  }} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
