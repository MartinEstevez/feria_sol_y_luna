import { useState, useEffect } from 'react';

// 👉 ¡PONÉ TU LINK DE GOOGLE ACÁ!
const GAS_URL = "https://script.google.com/macros/s/AKfycbz22ztztD5j7KDI5W21iiNxg-nYtH_NKtSnprw1PCRKOQdGKCBTa84sfq0cAJVsoIWvbg/exec";

const formatCurrency = (val) => {
  if (!val) return '';
  const num = val.toString().replace(/\D/g, ''); 
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('es-AR');
};

function SearchView() {
  const [data, setData] = useState([]);
  const [ferias, setFerias] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFeria, setFilterFeria] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterOpcion, setFilterOpcion] = useState(''); 
  const [filterGazebo, setFilterGazebo] = useState(''); 
  
  const [sortConfig, setSortConfig] = useState({ key: 'fecha_registro', direction: 'desc' });

  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchData();
    fetchFerias();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(GAS_URL);
      const result = await response.json();
      
      if (result.error) {
        showToast("Error desde Google: " + result.message, 'error');
      } else if (Array.isArray(result)) {
        setData(result);
      }
    } catch (error) {
      showToast("Error de conexión al cargar la tabla.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFerias = async () => {
    try {
      const response = await fetch(`${GAS_URL}?type=ferias`);
      const result = await response.json();
      if(Array.isArray(result)) setFerias(result);
    } catch (error) {
      console.error("Error trayendo ferias:", error);
    }
  };

  const handleRowClick = (item) => {
    setSelectedRow(item);
    setEditData({ 
      ...item, 
      pago_completo: item.pago_completo === 'Sí' || item.pago_completo === true,
      lleva_gazebo: item.lleva_gazebo === 'Sí' || !!item.medida_gazebo,
      valor_total: formatCurrency(item.valor_total),
      sena: formatCurrency(item.sena)
    });
    setIsEditing(false);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'valor_total' || name === 'sena') {
      setEditData({ ...editData, [name]: formatCurrency(value) });
    } else {
      setEditData({ ...editData, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const handleEditGazebo = (e) => {
    const isChecked = e.target.checked;
    setEditData({ ...editData, lleva_gazebo: isChecked, medida_gazebo: isChecked ? '2x2' : '' });
  };

  const saveChanges = async () => {
    setLoading(true);
    const payloadToSave = {
      ...editData,
      valor_total: Number(editData.valor_total.toString().replace(/\./g, '')),
      sena: Number(editData.sena.toString().replace(/\./g, '')),
      lleva_gazebo: editData.lleva_gazebo ? "Sí" : "No",
      action: 'update'
    };

    try {
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payloadToSave)
      });
      showToast("Datos actualizados correctamente", 'success');
      setIsEditing(false);
      fetchData(); 
    } catch (error) {
      showToast("Error al actualizar", 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    setShowDeleteModal(false);
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', row_index: selectedRow.row_index })
      });
      showToast("Registro eliminado con éxito", 'success');
      setSelectedRow(null);
      fetchData(); 
    } catch (error) {
      showToast("Error al eliminar el registro", 'error');
    } finally {
      setLoading(false);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const closePanel = () => {
    setSelectedRow(null);
    setIsEditing(false);
  };

  let processedData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    
    const matchGlobal = !q || 
      item.nombre_apellido?.toLowerCase().includes(q) || 
      item.codigo_interno?.toString().toLowerCase().includes(q) ||
      item.rubro?.toLowerCase().includes(q);
      
    const matchFeria = !filterFeria || item.feria_asignada === filterFeria;
    
    const isPagado = item.pago_completo === 'Sí' || item.pago_completo === true;
    const matchEstado = !filterEstado || 
      (filterEstado === 'PAGADO' && isPagado) || 
      (filterEstado === 'PENDIENTE' && !isPagado);

    const matchOpcion = !filterOpcion || item.opcion_elegida === filterOpcion;

    const isGazebo = item.lleva_gazebo === 'Sí' || !!item.medida_gazebo;
    const matchGazebo = !filterGazebo || 
      (filterGazebo === 'SI' && isGazebo) || 
      (filterGazebo === 'NO' && !isGazebo);

    return matchGlobal && matchFeria && matchEstado && matchOpcion && matchGazebo;
  });

  if (sortConfig.key) {
    processedData.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'fecha_registro' || sortConfig.key === 'Fecha') {
        aVal = new Date(aVal).getTime() || 0;
        bVal = new Date(bVal).getTime() || 0;
      } else if (sortConfig.key === 'valor_total' || sortConfig.key === 'sena') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortConfig.key === 'codigo_interno') {
        aVal = Number(aVal?.toString().replace(/\D/g, '')) || 0;
        bVal = Number(bVal?.toString().replace(/\D/g, '')) || 0;
      } else {
        aVal = aVal ? aVal.toString().toLowerCase() : '';
        bVal = bVal ? bVal.toString().toLowerCase() : '';
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <span style={{opacity: 0.3}}>↕</span>;
    return sortConfig.direction === 'asc' ? '🔼' : '🔽';
  };

  return (
    <>
      <div className="search-container">
        <h2>Tablero de Emprendedores</h2>
        
        <div className="filters-wrapper" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          
          <input 
            type="text" 
            className="search-input"
            style={{ flex: '2 1 200px', marginBottom: 0 }}
            placeholder="Buscar por nombre, código o rubro..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select className="search-input" style={{ flex: '1 1 150px', marginBottom: 0, cursor: 'pointer' }} value={filterFeria} onChange={(e) => setFilterFeria(e.target.value)}>
            <option value="">Todas las Ferias</option>
            {ferias.map((f, i) => {
              const stringFeria = f.fecha ? `${f.nombre_feria} (${new Date(f.fecha).toLocaleDateString('es-AR')})` : f.nombre_feria;
              return <option key={i} value={stringFeria}>{stringFeria}</option>
            })}
          </select>
          
          <select className="search-input" style={{ flex: '1 1 150px', marginBottom: 0, cursor: 'pointer' }} value={filterOpcion} onChange={(e) => setFilterOpcion(e.target.value)}>
            <option value="">Todas las Opciones</option>
            <option value="Tablón 2mts + 1 Silla">Tablón 2mts + 1 Silla</option>
            <option value="1/2 Tablón + 1 Silla">1/2 Tablón + 1 Silla</option>
            <option value="Espacio sin mesa/silla">Espacio sin mesa/silla</option>
            <option value="Espacio hasta 2 percheros">Espacio hasta 2 percheros</option>
          </select>
          
          <select className="search-input" style={{ flex: '1 1 130px', marginBottom: 0, cursor: 'pointer' }} value={filterGazebo} onChange={(e) => setFilterGazebo(e.target.value)}>
            <option value="">Gazebo: Todos</option>
            <option value="SI">Con Gazebo</option>
            <option value="NO">Sin Gazebo</option>
          </select>
          
          <select className="search-input" style={{ flex: '1 1 130px', marginBottom: 0, cursor: 'pointer' }} value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
            <option value="">Todos los Estados</option>
            <option value="PAGADO">Solo Pagados</option>
            <option value="PENDIENTE">Solo Pendientes</option>
          </select>

        </div>

        {loading && !isEditing && !selectedRow ? (
          <p className="loading-text" style={{ textAlign: 'center', color: 'var(--texto-secundario)', padding: '20px' }}>
            Cargando datos...
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('fecha_registro')} style={{cursor: 'pointer'}}>Fecha {getSortIcon('fecha_registro')}</th>
                  <th onClick={() => requestSort('feria_asignada')} style={{cursor: 'pointer'}}>Feria {getSortIcon('feria_asignada')}</th>
                  <th onClick={() => requestSort('codigo_interno')} style={{cursor: 'pointer'}}>Cód. {getSortIcon('codigo_interno')}</th>
                  <th onClick={() => requestSort('nombre_apellido')} style={{cursor: 'pointer'}}>Nombre {getSortIcon('nombre_apellido')}</th>
                  <th onClick={() => requestSort('rubro')} style={{cursor: 'pointer'}}>Rubro {getSortIcon('rubro')}</th>
                  <th onClick={() => requestSort('opcion_elegida')} style={{cursor: 'pointer'}}>Opción {getSortIcon('opcion_elegida')}</th>
                  <th onClick={() => requestSort('lleva_gazebo')} style={{cursor: 'pointer'}}>Gazebo {getSortIcon('lleva_gazebo')}</th>
                  <th onClick={() => requestSort('valor_total')} style={{cursor: 'pointer'}}>Total {getSortIcon('valor_total')}</th>
                  <th onClick={() => requestSort('sena')} style={{cursor: 'pointer'}}>Seña {getSortIcon('sena')}</th>
                  <th onClick={() => requestSort('pago_completo')} style={{cursor: 'pointer'}}>Estado {getSortIcon('pago_completo')}</th>
                  <th>Instagram</th>
                </tr>
              </thead>
              <tbody>
                {processedData.map((item, index) => (
                  <tr key={index} onClick={() => handleRowClick(item)} className={selectedRow?.row_index === item.row_index ? 'selected' : ''}>
                    <td data-label="Fecha">{formatDate(item.fecha_registro || item.Fecha)}</td>
                    {/* LA FERIA AHORA APARECE EN LILA OSCURO */}
                    <td data-label="Feria" style={{fontWeight: 'bold', color: 'var(--lila-oscuro)'}}>{item.feria_asignada || '-'}</td>
                    <td data-label="Cód.">{item.codigo_interno}</td>
                    <td data-label="Nombre" className="table-name">{item.nombre_apellido}</td>
                    <td data-label="Rubro">{item.rubro}</td>
                    <td data-label="Opción" style={{fontSize: '12px'}}>{item.opcion_elegida}</td>
                    <td data-label="Gazebo" style={{fontSize: '12px', fontWeight: 'bold'}}>
                      {item.lleva_gazebo === 'Sí' || !!item.medida_gazebo ? (item.medida_gazebo || 'Sí') : 'No'}
                    </td>
                    <td data-label="Total">${Number(item.valor_total || 0).toLocaleString('es-AR')}</td>
                    <td data-label="Seña">${Number(item.sena || 0).toLocaleString('es-AR')}</td>
                    <td data-label="Estado">
                      <span className={`badge ${item.pago_completo === 'Sí' || item.pago_completo === true ? 'badge-success' : 'badge-warning'}`}>
                        {item.pago_completo === 'Sí' || item.pago_completo === true  ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td data-label="Instagram">
                      {item.instagram ? (
                        <a href={`https://instagram.com/${item.instagram.replace('@', '').trim()}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#E1306C', textDecoration: 'none', fontWeight: 'bold' }}>
                          {item.instagram}
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {processedData.length === 0 && !loading && (
              <p style={{textAlign: 'center', padding: '20px', color: 'var(--texto-secundario)'}}>No se encontraron resultados para estos filtros.</p>
            )}
          </div>
        )}
      </div>

      {selectedRow && (
        <div className="panel-overlay" onClick={closePanel}></div>
      )}

      <div className={`details-panel ${selectedRow ? 'open' : ''}`}>
        <div className="details-panel-content">
          <h3 style={{ fontFamily: 'var(--font-title)' }}>
            {isEditing ? 'Editando Datos' : selectedRow?.nombre_apellido}
          </h3>
          {selectedRow && (
            <div className="edit-form">
              {!isEditing ? (
                <>
                  <p><strong>Feria:</strong> {selectedRow.feria_asignada || '-'}</p>
                  <p><strong>Fecha de registro:</strong> {formatDate(selectedRow.fecha_registro || selectedRow.Fecha)}</p>
                  <p>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} style={{width:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.25A2.25 2.25 0 010 18.75V6.25A2.25 2.25 0 012.25 4h19.5A2.25 2.25 0 0124 6.25v12.5a2.25 2.25 0 01-2.25 2.25h-6.75zM12 9a3.75 3.75 0 110-7.5 3.75 3.75 0 010 7.5z" /></svg>
                    <span>
                      Rubro: <strong>{selectedRow.rubro}</strong><br/>
                      Opción: <strong>{selectedRow.opcion_elegida}</strong><br/>
                      Gazebo: <strong>{selectedRow.lleva_gazebo === 'Sí' || !!selectedRow.medida_gazebo ? (selectedRow.medida_gazebo || 'Sí') : 'No'}</strong>
                    </span>
                  </p>
                  <p>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} style={{width:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.003 9.003 0 008.367-5.55M12 21a9.003 9.003 0 01-8.367-5.55M12 21V8.25M12 8.25A1.5 1.5 0 0113.5 6.75h1.5A1.5 1.5 0 0116.5 8.25v11.25M12 8.25A1.5 1.5 0 0010.5 6.75h-1.5A1.5 1.5 0 007.5 8.25v11.25m4.5 11.25H3.75A2.25 2.25 0 011.5 18v-6.75M12 21h6.75a2.25 2.25 0 002.25-2.25v-6.75M3.75 21a1.5 1.5 0 011.5-1.5h1.5A1.5 1.5 0 018.25 21" /></svg>
                    <span>Valor Total: <strong>${Number(selectedRow.valor_total || 0).toLocaleString('es-AR')}</strong> <br/> 
                    Seña: <strong>${Number(selectedRow.sena || 0).toLocaleString('es-AR')}</strong></span>
                  </p>
                  
                  <button onClick={() => setIsEditing(true)}>EDITAR DATOS</button>
                  <button onClick={() => setShowDeleteModal(true)} style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', marginTop: '10px' }}>ELIMINAR REGISTRO</button>
                  <button onClick={closePanel} style={{ background: 'transparent', border: '1px solid var(--texto-secundario)', color: 'var(--texto-secundario)', marginTop: '20px' }}>CERRAR</button>
                </>
              ) : (
                <div className="custom-form" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label>Feria Asignada:</label>
                    <select name="feria_asignada" value={editData.feria_asignada} onChange={handleEditChange}>
                      <option value="">Seleccionar Feria...</option>
                      {ferias.map((f, i) => {
                        const stringFeria = f.fecha ? `${f.nombre_feria} (${new Date(f.fecha).toLocaleDateString('es-AR')})` : f.nombre_feria;
                        return <option key={i} value={stringFeria}>{stringFeria}</option>
                      })}
                    </select>
                  </div>
                  <div className="form-group"><label>Nombre:</label><input type="text" name="nombre_apellido" value={editData.nombre_apellido} onChange={handleEditChange} /></div>
                  <div className="form-group"><label>Rubro:</label><input type="text" name="rubro" value={editData.rubro} onChange={handleEditChange} /></div>
                  
                  <div className="form-group">
                    <label>Opción Elegida:</label>
                    <select name="opcion_elegida" value={editData.opcion_elegida} onChange={handleEditChange}>
                      <option value="Tablón 2mts + 1 Silla">Tablón 2mts + 1 Silla</option>
                      <option value="1/2 Tablón + 1 Silla">1/2 Tablón + 1 Silla</option>
                      <option value="Espacio sin mesa/silla">Espacio sin mesa/silla</option>
                      <option value="Espacio hasta 2 percheros">Espacio hasta 2 percheros</option>
                    </select>
                  </div>
                  
                  <div className="form-group checkbox-group" style={{ margin: '5px 0' }}>
                    <label><input type="checkbox" checked={editData.lleva_gazebo} onChange={handleEditGazebo} />¿Lleva Gazebo?</label>
                  </div>
                  {editData.lleva_gazebo && (
                    <div className="form-group" style={{ padding: '10px', background: 'var(--bg-tiza)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'none', fontSize: '14px'}}><input type="radio" name="medida_gazebo" value="2x2" checked={editData.medida_gazebo === '2x2'} onChange={handleEditChange} style={{ width: 'auto' }} /> 2x2</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'none', fontSize: '14px'}}><input type="radio" name="medida_gazebo" value="3x3" checked={editData.medida_gazebo === '3x3'} onChange={handleEditChange} style={{ width: 'auto' }} /> 3x3</label>
                      </div>
                    </div>
                  )}

                  <div className="form-row" style={{ flexDirection: 'row' }}>
                    <div className="form-group"><label>Total ($):</label><input type="text" name="valor_total" value={editData.valor_total} onChange={handleEditChange} /></div>
                    <div className="form-group"><label>Seña ($):</label><input type="text" name="sena" value={editData.sena} onChange={handleEditChange} /></div>
                  </div>
                  
                  <div className="form-group"><label>Instagram:</label><input type="text" name="instagram" value={editData.instagram} onChange={handleEditChange} /></div>

                  <div className="form-group checkbox-group">
                     <label><input type="checkbox" name="pago_completo" checked={editData.pago_completo} onChange={handleEditChange} />Pago Completo</label>
                  </div>
                  <button onClick={saveChanges} style={{ background: 'var(--lila)', color: 'white' }}>GUARDAR CAMBIOS</button>
                  <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', color: 'var(--texto-secundario)', border: '1px solid' }}>CANCELAR</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>¿Eliminar registro?</h3>
            <p>Estás por borrar el formulario de <strong>{selectedRow.nombre_apellido}</strong>.<br/>Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>CANCELAR</button>
              <button className="btn-confirm" onClick={confirmDelete}>ELIMINAR</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </>
  );
}

export default SearchView;