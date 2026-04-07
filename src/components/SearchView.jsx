import { useState, useEffect } from 'react';

const GAS_URL = "https://script.google.com/macros/s/AKfycbxBgYBdMd4uIU5ee0TbNZWH0Pd8cdSrZS07x_xNu21EI8D8CS67KEV-GlZSyLsxSeaHSQ/exec";

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
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [toast, setToast] = useState(null);

  // NUEVO: Estado para el modal de borrado
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(GAS_URL);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (item) => {
    setSelectedRow(item);
    setEditData({ 
      ...item, 
      pago_completo: item.pago_completo === 'Sí' || item.pago_completo === true,
      lleva_gazebo: !!item.medida_gazebo,
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

  // FUNCIÓN PARA ELIMINAR REGISTRO REAL
  const confirmDelete = async () => {
    setLoading(true);
    setShowDeleteModal(false); // Cerramos el modal
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: 'delete', 
          row_index: selectedRow.row_index 
        })
      });
      showToast("Registro eliminado con éxito", 'success');
      setSelectedRow(null); // Cerramos el panel lateral
      fetchData(); // RECARGA LA TABLA AUTOMÁTICAMENTE
    } catch (error) {
      showToast("Error al eliminar el registro", 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = item.nombre_apellido?.toLowerCase().includes(searchLower);
    const codeMatch = item.codigo_interno?.toString().toLowerCase().includes(searchLower);
    return nameMatch || codeMatch;
  });

  return (
    <>
      <div className={`search-container ${selectedRow ? 'panel-open' : ''}`}>
        <h2>Listado de Emprendedores</h2>
        <input 
          type="text" 
          className="search-input"
          placeholder="🔍 Buscar por código o nombre..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {loading && !isEditing && !selectedRow ? (
          <p className="loading-text" style={{ textAlign: 'center', color: 'var(--texto-secundario)', padding: '20px' }}>
            Cargando datos...
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cód.</th>
                  <th>Nombre</th>
                  <th>Rubro</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} onClick={() => handleRowClick(item)} className={selectedRow?.row_index === item.row_index ? 'selected' : ''}>
                    <td data-label="Fecha">{formatDate(item.fecha_registro || item.Fecha)}</td>
                    <td data-label="Cód.">{item.codigo_interno}</td>
                    <td data-label="Nombre" className="table-name">{item.nombre_apellido}</td>
                    <td data-label="Rubro">{item.rubro}</td>
                    <td data-label="Total">${Number(item.valor_total || 0).toLocaleString('es-AR')}</td>
                    <td data-label="Estado">
                      <span className={`badge ${item.pago_completo === 'Sí' || item.pago_completo === true ? 'badge-success' : 'badge-warning'}`}>
                        {item.pago_completo === 'Sí' || item.pago_completo === true  ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={`details-panel ${selectedRow ? 'open' : ''}`}>
          <div className="details-panel-sticky">
            <h3 style={{ fontFamily: 'var(--font-title)' }}>
              {isEditing ? 'Editando Datos' : selectedRow?.nombre_apellido}
            </h3>
            
            {selectedRow && (
              <div className="edit-form">
                {!isEditing ? (
                  <>
                    <p><strong>Fecha:</strong> {formatDate(selectedRow.fecha_registro || selectedRow.Fecha)}</p>
                    <p>
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} style={{width:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.25A2.25 2.25 0 010 18.75V6.25A2.25 2.25 0 012.25 4h19.5A2.25 2.25 0 0124 6.25v12.5a2.25 2.25 0 01-2.25 2.25h-6.75zM12 9a3.75 3.75 0 110-7.5 3.75 3.75 0 010 7.5z" /></svg>
                      <span>Rubro: <strong>{selectedRow.rubro}</strong><br/>
                      Opción: {selectedRow.opcion_elegida} {selectedRow.medida_gazebo ? ` + Gazebo (${selectedRow.medida_gazebo})` : ''}</span>
                    </p>
                    <p>
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} style={{width:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.003 9.003 0 008.367-5.55M12 21a9.003 9.003 0 01-8.367-5.55M12 21V8.25M12 8.25A1.5 1.5 0 0113.5 6.75h1.5A1.5 1.5 0 0116.5 8.25v11.25M12 8.25A1.5 1.5 0 0010.5 6.75h-1.5A1.5 1.5 0 007.5 8.25v11.25m4.5 11.25H3.75A2.25 2.25 0 011.5 18v-6.75M12 21h6.75a2.25 2.25 0 002.25-2.25v-6.75M3.75 21a1.5 1.5 0 011.5-1.5h1.5A1.5 1.5 0 018.25 21" /></svg>
                      <span>Valor Total: <strong>${Number(selectedRow.valor_total || 0).toLocaleString('es-AR')}</strong> <br/> 
                      Seña: <strong>${Number(selectedRow.sena || 0).toLocaleString('es-AR')}</strong></span>
                    </p>
                    
                    <button onClick={() => setIsEditing(true)}>EDITAR DATOS</button>
                    
                    {/* AHORA SOLO ACTIVA EL MODAL PROPIO */}
                    <button 
                      onClick={() => setShowDeleteModal(true)} 
                      style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', marginTop: '10px' }}
                    >
                      ELIMINAR REGISTRO
                    </button>
                    
                    <button 
                      onClick={() => setSelectedRow(null)} 
                      style={{ background: 'transparent', border: '1px solid var(--texto-secundario)', color: 'var(--texto-secundario)', marginTop: '20px' }}
                    >
                      CERRAR
                    </button>
                  </>
                ) : (
                  <div className="custom-form" style={{ gap: '15px' }}>
                    <div className="form-group"><label>Nombre:</label><input type="text" name="nombre_apellido" value={editData.nombre_apellido} onChange={handleEditChange} /></div>
                    <div className="form-group"><label>Rubro:</label><input type="text" name="rubro" value={editData.rubro} onChange={handleEditChange} /></div>
                    <div className="form-row" style={{ flexDirection: 'row' }}>
                      <div className="form-group"><label>Total ($):</label><input type="text" name="valor_total" value={editData.valor_total} onChange={handleEditChange} /></div>
                      <div className="form-group"><label>Seña ($):</label><input type="text" name="sena" value={editData.sena} onChange={handleEditChange} /></div>
                    </div>
                    <div className="form-group checkbox-group">
                       <label><input type="checkbox" name="pago_completo" checked={editData.pago_completo} onChange={handleEditChange} />Pago Completo</label>
                    </div>
                    <button onClick={saveChanges} style={{ background: 'var(--terracota)', color: 'white' }}>GUARDAR CAMBIOS</button>
                    <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', color: 'var(--texto-secundario)', border: '1px solid' }}>CANCELAR</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN PROPIO */}
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