import { useState } from 'react';

// IMPORTANTE: Esta es la URL que venimos usando
const GAS_URL = "https://script.google.com/macros/s/AKfycbz22ztztD5j7KDI5W21iiNxg-nYtH_NKtSnprw1PCRKOQdGKCBTa84sfq0cAJVsoIWvbg/exec";

function FeriaForm() {
  const [formData, setFormData] = useState({ nombre_feria: '', ubicacion: '', fecha: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // --- INICIO MODO DEBUG ---
    console.log("1. Intentando enviar a URL:", GAS_URL);
    console.log("2. Datos a enviar:", { ...formData, action: 'add_feria' });

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...formData, action: 'add_feria' })
      });
      
      console.log("3. Fetch completado. Estado HTTP:", response.status);

      // DEPURACIÓN: Leemos la respuesta como TEXTO CRUDO
      const rawText = await response.text();
      console.log("4. RESPUESTA CRUDA DEL SERVIDOR:", rawText);
      
      // Intentamos convertir ese texto a JSON
      try {
        const result = JSON.parse(rawText);
        if (result.status === "success") {
          showToast("¡Feria configurada con éxito!", 'success');
          setFormData({ nombre_feria: '', ubicacion: '', fecha: '' });
        } else {
          showToast("Error reportado por el servidor: " + result.message, 'error');
        }
      } catch (parseError) {
        console.error("Error al convertir a JSON. El servidor no devolvió JSON válido.", parseError);
        alert("El servidor devolvió algo inesperado. Revisá la consola (F12).");
      }
      
    } catch (error) {
      console.error("❌ ERROR DETECTADO POR EL CATCH:", error);
      alert("¡Ocurrió el error de conexión! Abrí la consola (F12) para ver los detalles.");
    } finally { 
      setLoading(false); 
    }
    // --- FIN MODO DEBUG ---
  };

  return (
    <>
      <div className="form-container slide-in">
        <h2>Configurar Nueva Feria</h2>
        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label>Nombre de la Feria:</label>
            <input 
              type="text" 
              placeholder="Ej: Feria de Artesanos" 
              value={formData.nombre_feria} 
              onChange={(e)=>setFormData({...formData, nombre_feria: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Ubicación / Plaza:</label>
            <input 
              type="text" 
              placeholder="Ej: Plaza San Martín" 
              value={formData.ubicacion} 
              onChange={(e)=>setFormData({...formData, ubicacion: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Fecha del Evento:</label>
            <input 
              type="date" 
              value={formData.fecha} 
              onChange={(e)=>setFormData({...formData, fecha: e.target.value})} 
              required 
            />
          </div>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Guardando...' : 'CREAR FERIA'}
          </button>
        </form>
      </div>

      {/* COMPONENTE TOAST (Pop-up) */}
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

export default FeriaForm;