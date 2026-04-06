import { useState, useEffect } from 'react';

const GAS_URL = "ACA_IRA_TU_URL_DE_APPS_SCRIPT";

function SearchView() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulación de datos hasta que conectemos Google Sheets
      const mockData = [
        { codigo_interno: 'EMP-001', nombre_apellido: 'Johanna', rubro: 'Ropa Infantil', opcion_elegida: 'Espacio sin mesa/silla', valor_total: 25000, sena: 0, pago_completo: 'Sí', instagram: '@johanna.prendas' },
        { codigo_interno: 'EMP-002', nombre_apellido: 'Pedro Gómez', rubro: 'Artesanías', opcion_elegida: 'Tablón 2mts + 1 Silla', valor_total: 18000, sena: 9000, pago_completo: 'No', instagram: '@pedro.art' }
      ];
      setData(mockData);

      /* Lógica real para cuando tengas la URL:
      const response = await fetch(GAS_URL);
      const result = await response.json();
      setData(result);
      */
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de filtrado en tiempo real
  const filteredData = data.filter(item => 
    item.codigo_interno?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.nombre_apellido?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.rubro?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="search-container">
      <h2>Listado de Emprendedores</h2>
      
      <input 
        type="text" 
        className="search-input"
        placeholder="🔍 Ingrese código, nombre o rubro..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cód.</th>
                <th>Nombre</th>
                <th>Rubro</th>
                <th>Total</th>
                <th>Pago Completo</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr 
                  key={index} 
                  onClick={() => setSelectedRow(item)}
                  className={selectedRow?.codigo_interno === item.codigo_interno ? 'selected' : ''}
                >
                  <td>{item.codigo_interno}</td>
                  <td>{item.nombre_apellido}</td>
                  <td>{item.rubro}</td>
                  <td>${item.valor_total}</td>
                  <td>
                    <span className={`badge ${item.pago_completo === 'Sí' ? 'badge-success' : 'badge-warning'}`}>
                      {item.pago_completo === 'Sí' ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Panel de Detalles */}
      {selectedRow && (
        <div className="details-panel">
          <h3>Detalles de {selectedRow.nombre_apellido}</h3>
          <p><strong>Rubro:</strong> {selectedRow.rubro}</p>
          <p><strong>Opción:</strong> {selectedRow.opcion_elegida} {selectedRow.medida_gazebo ? `(${selectedRow.medida_gazebo})` : ''}</p>
          <p><strong>Valor Total:</strong> ${selectedRow.valor_total} | <strong>Seña:</strong> ${selectedRow.sena}</p>
          <p><strong>Instagram:</strong> {selectedRow.instagram}</p>
          <button onClick={() => setSelectedRow(null)}>Cerrar detalles</button>
        </div>
      )}
    </div>
  );
}

export default SearchView;