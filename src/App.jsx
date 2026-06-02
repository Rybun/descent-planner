import { useStore } from './store';
import { useState, useMemo } from 'react';
import { useT, SUPPORTED_LANGS } from './i18n';
import DropZone from './components/DropZone';
import ArmeriaPanel from './components/ArmeriaPanel';
import ShopPanel from './components/ShopPanel';
import CraftPanel from './components/CraftPanel';
import ActionLog from './components/ActionLog';
import GameInfoPanel from './components/GameInfoPanel';
import InventoryPanel from './components/InventoryPanel';
import './App.css';

const TAB_KEYS = ['partida', 'armeria', 'tienda', 'crafteo', 'inventario', 'historial'];

function getTabIcons(act) {
  return {
    partida:    act >= 1 ? '/assets/icons/tab_partida_act2.png' : '/assets/icons/tab_partida_act1.png',
    tienda:     '/assets/icons/tab_tienda.png',
    crafteo:    '/assets/icons/tab_creacion.png',
    armeria:    '/assets/icons/tab_armeria.png',
    inventario: '/assets/icons/tab_inventario.png',
    historial:  '/assets/icons/tab_historial.png',
  };
}

// Resuelve la selección efectiva de cada arma con el mismo fallback que usa ArmeriaPanel:
//   partXSelections[wid] si existe, si no el valor del save (weapon.partX)

function AboutModal({ onClose }) {
  const t = useT();
  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={e => e.stopPropagation()}>
        <div className="about-modal-header">
          <span className="about-modal-title">{t('about.title')}</span>
          <button className="about-close-btn" onClick={onClose}>{t('about.close')}</button>
        </div>
        <div className="about-modal-body">
          <p className="about-fan-project">{t('about.fanProject')}</p>
          <div className="about-section">
            <strong>{t('about.licenseTitle')}</strong>
            <p>{t('about.licenseText')}</p>
          </div>
          <div className="about-section">
            <strong>{t('about.disclaimerTitle')}</strong>
            <p>{t('about.disclaimerText')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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

function LangSelector() {
  const lang    = useStore(s => s.lang);
  const setLang = useStore(s => s.setLang);
  return (
    <div className="lang-selector">
      {SUPPORTED_LANGS.map(l => (
        <button
          key={l.code}
          className={`lang-btn ${lang === l.code ? 'active' : ''}`}
          onClick={() => setLang(l.code)}
          title={l.flag}
          aria-label={l.label}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function App() {
  const t = useT();
  const saveLoaded     = useStore(s => s.saveLoaded);
  const saveMeta       = useStore(s => s.saveMeta);
  const gameState      = useStore(s => s.gameState);
  const originalState  = useStore(s => s.originalState);
  const activeTab      = useStore(s => s.activeTab);
  const actionHistory  = useStore(s => s.actionHistory);
  const setActiveTab   = useStore(s => s.setActiveTab);
  const resetToSave    = useStore(s => s.resetToSave);
  const netCount = actionHistory.length;

  const [showAbout,    setShowAbout]    = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);

  const TAB_ICONS = getTabIcons(saveMeta?.act ?? 0);
  const TABS = TAB_KEYS.map(id => ({ id, label: t(`tab.${id}`) }));


  if (!saveLoaded) {
    return <DropZone />;
  }

  function handleReset() {
    if (actionHistory.length === 0) return;
    if (window.confirm(t('app.resetConfirm'))) {
      resetToSave();
    }
  }

  function handleLoadNew() {
    setShowDropZone(true);
  }

  return (
    <div className="app">

      {showDropZone && (
        <DropZone onClose={() => setShowDropZone(false)} />
      )}

      {/* ======= TOPBAR ======= */}
      <header className="app-header">
        <div className="header-left">
          <span className="app-logo">⚔️</span>
          <div className="header-meta">
            <span className="app-title">Descent</span>
            {saveMeta && (
              <span className="save-detail">
                {saveMeta.partyName || t('app.noParty')}
                {' · '}{t('app.act')} {(saveMeta.act ?? 0) + 1}
              </span>
            )}
          </div>
        </div>

        <div className="header-center">
          <div className="gold-display">
            <img
              src="/assets/icons/currency.png"
              className="gold-icon-img"
              alt="gold"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='inline'; }}
            />
            <span className="gold-icon gold-icon-fallback" style={{display:'none'}}>🪙</span>
            <span className="gold-value">{gameState?.gold ?? 0}</span>
            <GoldDiff />
          </div>
        </div>

        <div className="header-right">
          <LangSelector />
          {actionHistory.length > 0 && (
            <button className="btn btn-sm" onClick={handleReset} title={t('log.resetTitle')}>
              {t('app.reset')}
            </button>
          )}
          <button className="btn btn-sm" onClick={handleLoadNew}>
            {t('app.loadOther')}
          </button>
          <button
            className="about-btn"
            onClick={() => setShowAbout(true)}
            title={t('about.title')}
            aria-label={t('about.title')}
          >i</button>
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
            <span className="tab-icon-wrap">
              <img
                src={TAB_ICONS[tab.id]}
                className="tab-icon"
                alt=""
                onError={e => e.target.style.display = 'none'}
              />
              {tab.id === 'historial' && netCount > 0 && (
                <span className="tab-badge">{netCount}</span>
              )}
            </span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ======= CONTENIDO ======= */}
      <main className="app-main">
        <div className="tab-content">
          {activeTab === 'partida'    && <GameInfoPanel />}
          {activeTab === 'tienda'     && <ShopPanel />}
          {activeTab === 'crafteo'    && <CraftPanel />}
          {activeTab === 'armeria'    && <ArmeriaPanel />}
          {activeTab === 'inventario' && <InventoryPanel />}
          {activeTab === 'historial'  && <ActionLog />}
        </div>
      </main>

      {/* ======= FOOTER ======= */}
      <footer className="app-footer">
        <span>{t('app.footer')}</span>
        <span className="footer-disclaimer">{t('app.footerDisclaimer')}</span>
        <a
          href="https://github.com/Rybun/descent-planner"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-github"
          aria-label="GitHub"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .319.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </a>
        {saveMeta?.slotGUID && (
          <span className="footer-guid">
            Save: {saveMeta.slotGUID.slice(0, 8)}…
          </span>
        )}
      </footer>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default App;
