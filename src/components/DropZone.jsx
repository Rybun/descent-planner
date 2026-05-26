import { useRef, useState } from 'react';
import { useStore } from '../store';
import './DropZone.css';

export default function DropZone() {
  const loadSave = useStore(s => s.loadSave);
  const saveError = useStore(s => s.saveError);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef();

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      loadSave(e.target.result);
    };
    reader.readAsText(file, 'utf-8');
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
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

  return (
    <div className="dropzone-page">
      <div className="dropzone-brand">
        <img src="/assets/heroes/brynn_crop.png" alt="" className="brand-hero" />
        <img src="/assets/heroes/galaden_crop.png" alt="" className="brand-hero" />
        <img src="/assets/heroes/kehli_crop.png" alt="" className="brand-hero" />
        <img src="/assets/heroes/vaerix_crop.png" alt="" className="brand-hero" />
        <img src="/assets/heroes/syrus_crop.png" alt="" className="brand-hero" />
        <img src="/assets/heroes/chance_crop.png" alt="" className="brand-hero" />
      </div>

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
