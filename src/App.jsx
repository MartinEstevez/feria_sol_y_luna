import { useState } from 'react';
import UploadForm from './components/UploadForm';
import SearchView from './components/SearchView';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' o 'upload'

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Feria Sol y Luna</h1>
        <nav className="tab-menu">
          <button 
            className={activeTab === 'upload' ? 'active' : ''} 
            onClick={() => setActiveTab('upload')}
          >
            ➕ REGISTRO
          </button>
          <button 
            className={activeTab === 'search' ? 'active' : ''} 
            onClick={() => setActiveTab('search')}
          >
            🔍 BÚSQUEDA
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === 'upload' ? <UploadForm /> : <SearchView />}
      </main>
    </div>
  );
}

export default App;