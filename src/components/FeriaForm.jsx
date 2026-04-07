import { useState } from 'react';

const GAS_URL = "https://script.google.com/macros/s/AKfycbxKdyp2Hvi49m-niRze89wiGdW8vo8dgSktrtIamECgACCO4oq2cv_wCSKwGiF0Ay9wCg/exec";

function FeriaForm() {
  const [formData, setFormData] = useState({ nombre_feria: '', ubicacion: '', fecha: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...formData, action: 'add_feria' })
      });
      alert("¡Feria creada con éxito!");
      setFormData({ nombre_feria: '', ubicacion: '', fecha: '' });
    } catch (error) {
      alert("Error al guardar la feria");
    } finally { setLoading(false); }
  };

  return (
    <div className="form-container slide-in">
      <h2>Configurar Nueva Feria</h2>
      <form onSubmit={handleSubmit} className="custom-form">
        <div className="form-group">
          <label>Nombre de la Feria:</label>
          <input type="text" placeholder="Ej: Feria de Artesanos" value={formData.nombre_feria} onChange={(e)=>setFormData({...formData, nombre_feria: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Ubicación / Plaza:</label>
          <input type="text" placeholder="Ej: Plaza San Martín" value={formData.ubicacion} onChange={(e)=>setFormData({...formData, ubicacion: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Fecha del Evento:</label>
          <input type="date" value={formData.fecha} onChange={(e)=>setFormData({...formData, fecha: e.target.value})} required />
        </div>
        <button type="submit" disabled={loading} className="submit-btn">{loading ? 'Guardando...' : 'CREAR FERIA'}</button>
      </form>
    </div>
  );
}

export default FeriaForm;