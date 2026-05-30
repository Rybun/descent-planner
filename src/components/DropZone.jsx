import { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import { useT, SUPPORTED_LANGS } from '../i18n';
import { HEROES } from '../gamedata/heroes';
import './DropZone.css';

const HERO_DURATION = 2800;
const FADE_DELAY    = 600;

export default function DropZone({ onAboutClick }) {
  const t         = useT();
  const loadSave  = useStore(s => s.loadSave);
  const saveError = useStore(s => s.saveError);
  const lang      = useStore(s => s.lang);
  const setLang   = useStore(s => s.setLang);
  const [dragging, setDragging] = useState(false);

  const [heroIdx,  setHeroIdx]  = useState(0);
  const [heroActs, setHeroActs] = useState(() => HEROES.map(() => false));

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setHeroActs(prev => {
        const next = [...prev];
        next[heroIdx] = !next[heroIdx];
        return next;
      });
    }, FADE_DELAY);

    const nextTimer = setTimeout(() => {
      setHeroIdx(prev => (prev + 1) % HEROES.length);
    }, HERO_DURATION);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(nextTimer);
    };
  }, [heroIdx]);

  const inputRef = useRef();

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => loadSave(e.target.result);
    reader.readAsText(file, 'utf-8');
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function onDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  function onInputChange(e) {
    handleFile(e.target.files[0]);
  }

  const activeHero = HEROES[heroIdx];

  return (
    <div className="dropzone-page">

      {/* Selector de idioma (esquina superior derecha) */}
      <div className="dz-lang-selector">
        {SUPPORTED_LANGS.map(l => (
          <button
            key={l.code}
            className={`lang-btn ${lang === l.code ? 'active' : ''}`}
            onClick={() => setLang(l.code)}
            aria-label={l.label}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Galería de héroes con animación */}
      <div className="dropzone-heroes">
        {HEROES.map((hero, i) => {
          const isActive  = i === heroIdx;
          const onAct2    = heroActs[i];
          const localName = t(`hero.${hero.id}`) || hero.name;
          return (
            <div
              key={hero.id}
              className={`dz-hero-portrait ${isActive ? 'dz-hero-active' : ''}`}
              title={localName}
            >
              <img
                src={hero.image}
                alt={localName}
                className="dz-hero-img dz-act1"
                style={{ opacity: onAct2 ? 0 : 1 }}
                onError={e => e.target.style.display = 'none'}
              />
              <img
                src={hero.imageAct2}
                alt={`${localName} ${t('dropzone.act2')}`}
                className="dz-hero-img dz-act2"
                style={{ opacity: onAct2 ? 1 : 0 }}
                onError={e => e.target.style.display = 'none'}
              />
            </div>
          );
        })}
      </div>

      <div className="dropzone-hero-name">
        {activeHero ? (t(`hero.${activeHero.id}`) || activeHero.name) : ''}
      </div>

      <h1 className="dropzone-title">{t('dropzone.title')}</h1>
      <p className="dropzone-subtitle">
        {t('dropzone.subtitle').split('Legends of the Dark').map((part, i, arr) =>
          i < arr.length - 1
            ? [part, <em key={i}>Legends of the Dark</em>]
            : part
        )}
      </p>

      <div
        className={`drop-area ${dragging ? 'drag-over' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <div className="drop-icon">📂</div>
        <p className="drop-label">{t('dropzone.dragLabel')} <code>.sav</code></p>
        <p className="drop-hint">{t('dropzone.clickHint')}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".sav,.json"
          onChange={onInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {saveError && (
        <div className="error-banner">
          <strong>{t('dropzone.errorPrefix')}</strong> {saveError}
        </div>
      )}

      <div className="dropzone-help">
        <h3>{t('dropzone.helpTitle')}</h3>
        <p>{t('dropzone.helpSteam')}</p>
        <p>{t('dropzone.helpPath').split('Legends of the Dark_Data').map((part, i, arr) =>
          i < arr.length - 1
            ? [part, <code key={i}>Legends of the Dark_Data</code>]
            : part
        )}</p>
      </div>

      <div className="dz-license">
        <p className="dz-license-fan">{t('about.fanProject')}</p>
        <p className="dz-license-disclaimer">{t('about.disclaimerText')}</p>
        <div className="dz-license-footer">
          <span>{t('about.licenseTitle')}: MIT</span>
          <span className="dz-license-sep">·</span>
          <a
            href="https://github.com/Rybun/descent-planner"
            target="_blank"
            rel="noopener noreferrer"
            className="dz-github-link"
            aria-label="GitHub"
          >
            <svg className="dz-github-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .319.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
