import { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import { HEROES } from '../gamedata/heroes';
import './DropZone.css';

const HERO_DURATION = 2800;  // ms que cada héroe está destacado
const FADE_DELAY    = 600;   // ms antes de hacer el cambio de acto

export default function DropZone() {
  const loadSave = useStore(s => s.loadSave);
  const saveError = useStore(s => s.saveError);
  const [dragging, setDragging] = useState(false);

  // heroIdx: héroe actualmente destacado
  const [heroIdx, setHeroIdx] = useState(0);
  // heroActs: qué acto muestra cada héroe en este momento (false=Act1, true=Act2)
  const [heroActs, setHeroActs] = useState(() => HEROES.map(() => false));

  useEffect(() => {
    // Tras FADE_DELAY, el héroe activo cambia de acto y se queda así
    const fadeTimer = setTimeout(() => {
      setHeroActs(prev => {
        const next = [...prev];
        next[heroIdx] = !next[heroIdx];
        return next;
      });
    }, FADE_DELAY);

    // Tras HERO_DURATION, pasamos al siguiente héroe
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

      {/* ── Galería de héroes con animación ── */}
      <div className="dropzone-heroes">
        {HEROES.map((hero, i) => {
          const isActive = i === heroIdx;
          const onAct2 = heroActs[i];
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
                alt={`${hero.name} Acto 2`}
                className="dz-hero-img dz-act2"
                style={{ opacity: onAct2 ? 1 : 0 }}
                onError={e => e.target.style.display = 'none'}
              />
            </div>
          );
        })}
      </div>

      <div className="dropzone-hero-name">{activeHero?.name}</div>

      <h1 className="dropzone-title">Descent: Planificador de Tienda</h1>
      <p className="dropzone-subtitle">
        Planifica compras, ventas y crafteo entre sesiones de <em>Legends of the Dark</em>
      </p>

      <div
        className={`drop-area ${dragging ? 'drag-over' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <div className="drop-icon">📂</div>
        <p className="drop-label">Arrastra tu fichero <code>.sav</code> aquí</p>
        <p className="drop-hint">o haz clic para seleccionarlo</p>
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
          <strong>Error al cargar:</strong> {saveError}
        </div>
      )}

      <div className="dropzone-help">
        <h3>¿Dónde está el fichero .sav?</h3>
        <p>Steam → Biblioteca → Descent → Gestionar → Ver archivos locales</p>
        <p>Ruta típica: <code>Legends of the Dark_Data/SavedGames/[slot]/[fecha].sav</code></p>
      </div>
    </div>
  );
}
