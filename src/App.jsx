import { useStore } from './store';
import DropZone from './components/DropZone';
import ShopPanel from './components/ShopPanel';
import CraftPanel from './components/CraftPanel';
import HeroPanel from './components/HeroPanel';
import ActionLog from './components/ActionLog';
import PriceEditor from './components/PriceEditor';
import './App.css';

const TABS = [
  { id: 'tienda', label: '🏪 Tienda' },
  { id: 'crafteo', label: '🔨 Crafteo' },
  { id: 'heroes', label: '⚔️ Héroes' },
  { id: 'historial', label: '📋 Historial' },
  { id: 'ajustes', label: '⚙️ Ajustes' },
];

function GoldDiff() {
  const gameState = useStore(s => s.gameState);
  const originalState = useStore(s => s.originalState);
  const actionHistory = useStore(s => s.actionHistory);
  if (!gameState || !originalState || actionHistory.length === 0) return null;
  const diff = gameState.gold - originalState.gold;
  return (
    <span className={`gold-diff-badge ${diff >= 0 ? 'pos' : 'neg'}`}>
      {diff >= 0 ? '+' : ''}{diff}
    </span>
  );
}

function App() {
  const saveLoaded = useStore(s => s.saveLoaded);
  const saveMeta = useStore(s => s.saveMeta);
  const gameState = useStore(s => s.gameState);
  const activeTab = useStore(s => s.activeTab);
  const actionHistory = useStore(s => s.actionHistory);
  const setActiveTab = useStore(s => s.setActiveTab);
  const resetToSave = useStore(s => s.resetToSave);
  const loadSave = useStore(s => s.loadSave);

  if (!saveLoaded) {
    return <DropZone />;
  }

  function handleReset() {
    if (actionHistory.length === 0) return;
    if (window.confirm('¿Resetear al estado del save original? Se perderán todos los cambios.')) {
      resetToSave();
    }
  }

  function handleLoadNew() {
    if (actionHistory.length > 0) {
      if (!window.confirm('Hay cambios sin confirmar. ¿Cargar un nuevo save de todas formas?')) return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sav,.SAV';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => loadSave(ev.target.result);
      reader.readAsText(file, 'utf-8');
    };
    input.click();
  }

  return (
    <div className="app">
      {/* ======= TOPBAR ======= */}
      <header className="app-header">
        <div className="header-left">
          <span className="app-logo">⚔️</span>
          <div className="header-meta">
            <span className="app-title">Descent</span>
            {saveMeta && (
              <span className="save-detail">
                {saveMeta.partyName || 'Grupo sin nombre'}
                {' · '}Acto {(saveMeta.act ?? 0) + 1}
                {saveMeta.gameDifficulty ? ` · ${saveMeta.gameDifficulty}` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="header-center">
          <div className="gold-display">
            <span className="gold-icon">🪙</span>
            <span className="gold-value">{gameState?.gold ?? 0}</span>
            <GoldDiff />
          </div>
        </div>

        <div className="header-right">
          {actionHistory.length > 0 && (
            <button className="btn btn-sm" onClick={handleReset} title="Volver al save original">
              🔄 Resetear
            </button>
          )}
          <button className="btn btn-sm" onClick={handleLoadNew} title="Cargar otro .SAV">
            📂 Otro save
          </button>
        </div>
      </header>

      {/* ======= TABS ======= */}
      <nav className="app-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`app-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'historial' && actionHistory.length > 0 && (
              <span className="tab-badge">{actionHistory.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* ======= CONTENIDO ======= */}
      <main className="app-main">
        <div className="tab-content">
          {activeTab === 'tienda' && <ShopPanel />}
          {activeTab === 'crafteo' && <CraftPanel />}
          {activeTab === 'heroes' && <HeroPanel />}
          {activeTab === 'historial' && <ActionLog />}
          {activeTab === 'ajustes' && <PriceEditor />}
        </div>
      </main>

      {/* ======= FOOTER ======= */}
      <footer className="app-footer">
        <span>Descent: Legends of the Dark — Planificador de Tienda</span>
        {saveMeta?.slotGUID && (
          <span className="footer-guid">
            Save: {saveMeta.slotGUID.slice(0, 8)}…
          </span>
        )}
      </footer>
    </div>
  );
}

export default App;
