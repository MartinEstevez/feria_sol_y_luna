import { useState, useEffect } from 'react';

// URL DEFINITIVA
const GAS_URL = "https://script.google.com/macros/s/AKfycbxBgYBdMd4uIU5ee0TbNZWH0Pd8cdSrZS07x_xNu21EI8D8CS67KEV-GlZSyLsxSeaHSQ/exec"; 

const formatCurrency = (val) => {
  if (!val) return '';
  const num = val.toString().replace(/\D/g, ''); 
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
};

function UploadForm() {
  const [formData, setFormData] = useState({
    codigo_interno: '', 
    feria_asignada: '', // NUEVO CAMPO
    nombre_apellido: '', 
    rubro: '', 
    opcion_elegida: '',
    lleva_gazebo: false, 
    medida_gazebo: '',
    valor_total: '', 
    sena: '', 
    pago_completo: false, 
    instagram: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [pastVendors, setPastVendors] = useState([]);
  const [ferias, setFerias] = useState([]); // ESTADO PARA LAS FERIAS
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000); 
  };

  useEffect(() => {
    // 1. Traer historial de emprendedores
    fetch(GAS_URL)
      .then(res => res.json())
      .then(data => {
        const uniqueVendors = Array.from(new Map(data.map(item => [item.codigo_interno, item])).values());
        setPastVendors(uniqueVendors);
      })
      .catch(err => console.error("Error trayendo historial:", err));

    // 2. Traer las ferias configuradas
    fetch(`${GAS_URL}?type=ferias`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setFerias(data);
      })
      .catch(err => console.error("Error trayendo ferias:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'valor_total' || name === 'sena') {
      setFormData({ ...formData, [name]: formatCurrency(value) });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const handleGazeboChange = (e) => {
    const isChecked = e.target.checked;
    setFormData({ ...formData, lleva_gazebo: isChecked, medida_gazebo: isChecked ? '2x2' : '' });
  };

  const handleSelectVendor = (vendor) => {
    setFormData({
      ...formData,
      codigo_interno: vendor.codigo_interno ? vendor.codigo_interno.toString().replace(/'/g, '').trim() : '', 
      nombre_apellido: vendor.nombre_apellido || '',
      rubro: vendor.rubro || '',
      opcion_elegida: vendor.opcion_elegida || '',
      lleva_gazebo: !!vendor.medida_gazebo,
      medida_gazebo: vendor.medida_gazebo || '',
      instagram: vendor.instagram || '',
      valor_total: '',
      sena: '',
      pago_completo: false
    });
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const filteredVendors = pastVendors.filter(v => {
    const searchLower = searchTerm.toLowerCase();
    const matchName = v.nombre_apellido?.toLowerCase().includes(searchLower);
    const matchCode = v.codigo_interno?.toString().toLowerCase().includes(searchLower);
    const parsedSearch = parseInt(searchTerm, 10);
    const parsedCode = parseInt(v.codigo_interno, 10);
    const matchLooseCode = !isNaN(parsedSearch) && parsedSearch === parsedCode;
    return matchName || matchCode || matchLooseCode;
  });

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      if (showSuggestions && filteredVendors.length > 0) {
        handleSelectVendor(filteredVendors[0]); 
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payloadToSave = {
      ...formData,
      codigo_interno: formData.codigo_interno ? formData.codigo_interno.toString().replace(/'/g, '').trim() : '',
      valor_total: Number(formData.valor_total.toString().replace(/\./g, '')),
      sena: Number(formData.sena.toString().replace(/\./g, ''))
    };

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payloadToSave)
      });
      
      const result = await response.json();
      
      if(result.status === "success") {
        showToast(`¡Registro exitoso!\nCódigo: ${result.codigo}`, 'success');
        setFormData({
          codigo_interno: '', 
          feria_asignada: formData.feria_asignada, // Mantenemos la feria seleccionada para hacer más rápida la carga
          nombre_apellido: '', rubro: '', opcion_elegida: '',
          lleva_gazebo: false, medida_gazebo: '', valor_total: '', sena: '',
          pago_completo: false, instagram: ''
        });
        setSearchTerm(''); 
      } else {
        showToast("Hubo un error al guardar.", 'error');
      }
    } catch (error) {
      showToast("Error de conexión.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="form-container">
        <h2>Registrar Nuevo Emprendedor</h2>

        {/* --- SELECTOR DE FERIAS --- */}
        <div className="form-group" style={{ marginBottom: '25px', padding: '15px', background: 'var(--arena)', borderRadius: '10px', border: '1px solid var(--terracota)' }}>
          <label style={{ color: 'var(--texto-principal)', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>
            📍 ¿PARA QUÉ FERIA ES ESTE INGRESO?
          </label>
          <select 
            name="feria_asignada" 
            value={formData.feria_asignada} 
            onChange={handleChange} 
            required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}
          >
            <option value="">-- Seleccionar Feria --</option>
            {ferias.map((f, i) => (
              <option key={i} value={f.nombre_feria}>
                {f.nombre_feria} {f.fecha ? `(${new Date(f.fecha).toLocaleDateString('es-AR')})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* --- AUTOCOMPLETADO --- */}
        <div className="autocomplete-wrapper">
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--terracota)', marginBottom: '8px', textTransform: 'uppercase' }}>
            ⚡ Autocompletar (Participante Frecuente)
          </label>
          <input 
            type="text" 
            className="search-input" 
            style={{ marginBottom: '0' }}
            placeholder="Escribí nombre o código y presioná ENTER..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(e.target.value.length > 0); 
            }}
            onKeyDown={handleSearchKeyDown} 
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
          />
          {showSuggestions && filteredVendors.length > 0 && (
            <div className="autocomplete-dropdown">
              {filteredVendors.map((vendor, idx) => (
                <div key={idx} className="autocomplete-item" onClick={() => handleSelectVendor(vendor)}>
                  <strong>{vendor.nombre_apellido}</strong>
                  <span style={{ color: 'var(--texto-secundario)' }}>Cód: {vendor.codigo_interno} | Rubro: {vendor.rubro}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="custom-form">
          {formData.codigo_interno && (
            <div style={{ background: 'var(--bg-tiza)', padding: '12px', borderRadius: '8px', border: '1px solid var(--terracota)', color: 'var(--terracota)', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center', fontSize: '14px' }}>
              REUTILIZANDO CÓDIGO: {formData.codigo_interno}
            </div>
          )}

          <div className="form-group"><label>Nombre y Apellido:</label><input type="text" name="nombre_apellido" value={formData.nombre_apellido} onChange={handleChange} required /></div>
          <div className="form-group"><label>Rubro:</label><input type="text" name="rubro" value={formData.rubro} onChange={handleChange} required /></div>

          <div className="form-group">
            <label>Opción Elegida:</label>
            <select name="opcion_elegida" value={formData.opcion_elegida} onChange={handleChange} required>
              <option value="">Seleccionar...</option>
              <option value="Tablón 2mts + 1 Silla">Tablón 2mts + 1 Silla</option>
              <option value="1/2 Tablón + 1 Silla">1/2 Tablón + 1 Silla</option>
              <option value="Espacio sin mesa/silla">Espacio sin mesa/silla</option>
              <option value="Espacio hasta 2 percheros">Espacio hasta 2 percheros</option>
            </select>
          </div>

          <div className="form-group checkbox-group" style={{ margin: '10px 0' }}>
            <label><input type="checkbox" checked={formData.lleva_gazebo} onChange={handleGazeboChange} />¿Lleva Gazebo?</label>
          </div>

          {formData.lleva_gazebo && (
            <div className="form-group slide-in" style={{ padding: '15px', background: 'var(--bg-tiza)', borderRadius: '8px', border: '1px solid var(--arena)' }}>
              <label>Medida del Gazebo:</label>
              <div className="radio-group" style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'none', fontSize: '15px', color: 'var(--texto-principal)' }}><input type="radio" name="medida_gazebo" value="2x2" checked={formData.medida_gazebo === '2x2'} onChange={handleChange} style={{ width: 'auto' }} /> 2x2</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'none', fontSize: '15px', color: 'var(--texto-principal)' }}><input type="radio" name="medida_gazebo" value="3x3" checked={formData.medida_gazebo === '3x3'} onChange={handleChange} style={{ width: 'auto' }} /> 3x3</label>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group"><label>Valor Total ($):</label><input type="text" name="valor_total" value={formData.valor_total} onChange={handleChange} placeholder="0.000" /></div>
            <div className="form-group"><label>Seña ($):</label><input type="text" name="sena" value={formData.sena} onChange={handleChange} placeholder="0.000" /></div>
          </div>

          <div className="form-group checkbox-group">
            <label><input type="checkbox" name="pago_completo" checked={formData.pago_completo} onChange={handleChange} />Pago Completo</label>
          </div>

          <div className="form-group"><label>Instagram:</label><input type="text" name="instagram" placeholder="@usuario" value={formData.instagram} onChange={handleChange} /></div>

          <button type="submit" disabled={loading} className="submit-btn">{loading ? 'Guardando...' : 'REGISTRAR EMPRENDEDOR'}</button>
        </form>
      </div>

      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'success' ? (
            <svg width="24" height="24" fill="none" stroke="var(--salvia)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="var(--terracota)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          )}
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </>
  );
}

export default UploadForm;