/**
 * Hook genérico para gestión de modales
 */
import { useState, useEffect } from 'react';

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null);
  const [mode, setMode] = useState('create'); // 'create' | 'edit' | 'view'

  const openModal = (modalData = null, modalMode = 'create') => {
    setData(modalData);
    setMode(modalMode);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setData(null);
    setMode('create');
  };

  const openCreate = () => openModal(null, 'create');
  const openEdit = (item) => openModal(item, 'edit');
  const openView = (item) => openModal(item, 'view');

  return {
    isOpen,
    data,
    mode,
    openModal,
    closeModal,
    openCreate,
    openEdit,
    openView,
    isCreateMode: mode === 'create',
    isEditMode: mode === 'edit',
    isViewMode: mode === 'view'
  };
};
