import { useState } from 'react';
import UploadForm from './components/UploadForm';
import SearchView from './components/SearchView';
import FeriaForm from './components/FeriaForm'; // El componente nuevo
import logo from './feria-logo.png'; // Revisá que la ruta de tu logo sea correcta

function App() {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="app-container">
      <header className="app-header">
        <img src={logo} alt="Feria Sol y Luna" className="app-logo" />
        <h1 className="app-title">Feria Sol y Luna</h1>
        
        <nav className="tab-menu">
          <button 
            className={activeTab === 'upload' ? 'active' : ''} 
            onClick={() => setActiveTab('upload')}
          >
            NUEVO INGRESO
          </button>
          <button 
            className={activeTab === 'search' ? 'active' : ''} 
            onClick={() => setActiveTab('search')}
          >
            BUSCAR / EDITAR
          </button>
          <button 
            className={activeTab === 'ferias' ? 'active' : ''} 
            onClick={() => setActiveTab('ferias')}
          >
            CONFIG. FERIAS
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === 'upload' && <UploadForm />}
        {activeTab === 'search' && <SearchView />}
        {activeTab === 'ferias' && <FeriaForm />}
      </main>
    </div>
  );
}

export default App;