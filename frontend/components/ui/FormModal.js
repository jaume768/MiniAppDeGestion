/**
 * Modal de formulario genérico y reutilizable
 * Maneja creación y edición de entidades
 */
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  mode = 'create', // 'create' | 'edit' | 'view'
  data = null,
  fields = [],
  loading = false,
  className = "",
  size = 'md' // 'sm' | 'md' | 'lg' | 'xl'
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  // Inicializar formulario cuando cambia la data
  useEffect(() => {
    if (data && mode === 'edit') {
      setFormData({ ...data });
    } else {
      // Inicializar con valores por defecto
      const initialData = {};
      fields.forEach(field => {
        initialData[field.name] = field.defaultValue || '';
      });
      setFormData(initialData);
    }
    setErrors({});
  }, [data, mode, fields, isOpen]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo si existe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} es obligatorio`;
      }
      
      // Validaciones personalizadas
      if (field.validate && formData[field.name]) {
        const error = field.validate(formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error en formulario:', error);
    }
  };

  const renderField = (field) => {
    const {
      name,
      type = 'text',
      label,
      placeholder,
      required,
      options = [],
      disabled = false,
      rows = 3
    } = field;

    const isDisabled = disabled || (mode === 'view') || loading;
    const value = formData[name] || '';
    const error = errors[name];

    const baseInputClasses = `
      mt-1 block w-full rounded-md border-gray-300 shadow-sm 
      focus:border-blue-500 focus:ring-blue-500 sm:text-sm
      ${error ? 'border-red-300 ring-red-500 focus:border-red-500 focus:ring-red-500' : ''}
      ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    `;

    switch (type) {
      case 'select':
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(name, e.target.value)}
              className={baseInputClasses}
              disabled={isDisabled}
            >
              <option value="">Seleccionar...</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              rows={rows}
              value={value}
              onChange={(e) => handleInputChange(name, e.target.value)}
              placeholder={placeholder}
              className={baseInputClasses}
              disabled={isDisabled}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={name} className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleInputChange(name, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              disabled={isDisabled}
            />
            <label className="ml-2 block text-sm text-gray-900">
              {label}
              {required && <span className="text-red-500">*</span>}
            </label>
          </div>
        );

      default:
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => handleInputChange(name, e.target.value)}
              placeholder={placeholder}
              className={baseInputClasses}
              disabled={isDisabled}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );
    }
  };

  // Validar que onClose sea una función
  const handleClose = typeof onClose === 'function' ? onClose : () => {};
  
  // Obtener el título correcto según el modo
  const getTitle = () => {
    if (typeof title === 'string') {
      return title;
    }
    if (typeof title === 'object' && title !== null) {
      return title[mode] || title.create || 'Formulario';
    }
    return 'Formulario';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all ${className}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {getTitle()}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                  {loading ? (
                    <div className="py-8">
                      <LoadingSpinner size="lg" text="Procesando..." />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {fields.map(renderField)}
                    </div>
                  )}

                  {/* Actions */}
                  {mode !== 'view' && !loading && (
                    <div className="mt-8 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        {mode === 'create' ? 'Crear' : 'Actualizar'}
                      </button>
                    </div>
                  )}

                  {mode === 'view' && (
                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cerrar
                      </button>
                    </div>
                  )}
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default FormModal;
