import React from 'react';
import styles from './TableComponent.module.css';

const TableComponent = ({ headers, data, onRowClick, actionButtons, isLoading }) => {
  return (
    <div className="table-container">
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Cargando datos...</p>
        </div>
      ) : data && data.length > 0 ? (
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className={header.className || ''}>
                    {header.name}
                  </th>
                ))}
                {actionButtons && <th className={styles.actionsColumn}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? styles.clickable : ''}
                >
                  {headers.map((header, colIndex) => (
                    <td key={colIndex} className={header.className || ''}>
                      {header.render ? header.render(row) : row[header.key]}
                    </td>
                  ))}
                  {actionButtons && (
                    <td className={styles.actionsCell}>
                      {actionButtons(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={styles.emptyStateIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No hay datos disponibles</p>
        </div>
      )}
    </div>
  );
};

export default TableComponent;
