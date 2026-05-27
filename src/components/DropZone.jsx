import { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import { useT, SUPPORTED_LANGS } from '../i18n';
import { HEROES } from '../gamedata/heroes';
import './DropZone.css';

const HERO_DURATION = 2800;
const FADE_DELAY    = 600;

export default function DropZone() {
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
          const isActive = i === heroIdx;
          const onAct2   = heroActs[i];
          return (
            <div
              key={hero.id}
              className={`dz-hero-portrait ${isActive ? 'dz-hero-active' : ''}`}
              title={hero.name}
            >
              <img
                src={hero.image}
                alt={hero.name}
                className="dz-hero-img dz-act1"
                style={{ opacity: onAct2 ? 0 : 1 }}
                onError={e => e.target.style.display = 'none'}
              />
              <img
                src={hero.imageAct2}
                alt={`${hero.name} ${t('dropzone.act2')}`}
                className="dz-hero-img dz-act2"
                style={{ opacity: onAct2 ? 1 : 0 }}
                onError={e => e.target.style.display = 'none'}
              />
            </div>
          );
        })}
      </div>

      <div className="dropzone-hero-name">{activeHero?.name}</div>

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
    </div>
  );
}
