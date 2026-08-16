import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../i18n';
import { termIconStyle } from '../gamedata/gameText';
import { DIE_FACES, DIE_BEST_ROLL } from '../gamedata/dice';
import { useTooltipPosition } from '../hooks/useTooltipPosition';
import { useIsMobile } from '../hooks/useIsMobile';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import './DieTooltip.css';

const SUCCESS_ICON   = '/assets/icons/Icon_Success.png';
const ADVANTAGE_ICON = '/assets/icons/Icon_Advantage.png';
const SURGE_ICON      = '/assets/icons/Icon_Surge.png';

function repeatIcon(count, src, type, key) {
  return Array.from({ length: count || 0 }, (_, i) => ({ key: `${key}${i}`, src, type }));
}

// Posición (left%, top%) de cada símbolo dentro de la cara, a mano según
// cuántos símbolos hay y de qué dado — para que ninguno se salga de la
// forma dibujada (el rombo/octógono tienen menos área útil que un
// cuadrado) y para replicar cómo se agrupan los pips en un dado real:
//  - 1 símbolo: centrado.
//  - 2 símbolos en negro (cuadrado): abajo-izquierda y arriba-derecha.
//  - 2 símbolos en amarillo/azul: uno arriba y otro abajo.
//  - 3 símbolos (cualquier dado): 1 arriba, 2 abajo.
//  - 4 símbolos: 2 arriba, 2 abajo.
// El amarillo ya estaba bien tal cual; negro y azul llevan más margen
// vertical entre la fila de arriba y la de abajo.
function facePositions(die, count) {
  if (count <= 1) return [[50, 50]];
  if (count === 2) {
    if (die === 'black') return [[27, 66], [73, 34]];
    if (die === 'blue') return [[50, 30], [50, 70]];
    return [[50, 30], [50, 64]]; // yellow
  }
  if (count === 3) {
    if (die === 'yellow') return [[50, 28], [34, 58], [66, 58]];
    if (die === 'black') return [[50, 26], [29, 70], [71, 70]];
    return [[50, 26], [32, 70], [68, 70]]; // blue
  }
  if (die === 'yellow') return [[32, 26], [68, 26], [32, 62], [68, 62]];
  if (die === 'black') return [[27, 26], [73, 26], [27, 74], [73, 74]];
  return [[30, 26], [70, 26], [30, 74], [70, 74]]; // blue, 4+
}

// Un símbolo repetido por cada éxito/ventaja/rayo (3 éxitos = 3 estrellas,
// no "3★"), colocado en la posición fija que le toca según cuántos
// símbolos tenga esta cara (ver facePositions) — no en flujo/wrap, para
// que nunca se salgan del hueco útil de la forma del dado.
function FaceChip({ face, die }) {
  const icons = [
    ...repeatIcon(face.success, SUCCESS_ICON, 'success', 's'),
    ...repeatIcon(face.advantage, ADVANTAGE_ICON, 'advantage', 'a'),
    ...repeatIcon(face.surge, SURGE_ICON, 'surge', 'u'),
  ];
  const positions = facePositions(die, icons.length);
  return (
    <span className={`dt-face dt-face-${die}`}>
      {icons.length > 0 ? icons.map((icon, i) => (
        <img
          key={icon.key}
          src={icon.src}
          alt=""
          className={`dt-icon dt-icon-${icon.type}`}
          style={{ left: `${positions[i][0]}%`, top: `${positions[i][1]}%` }}
          onError={e => e.target.style.display = 'none'}
        />
      )) : <span className="dt-symbol-blank" style={{ left: '50%', top: '50%' }}>—</span>}
    </span>
  );
}

// Iconos pequeños en línea (no absolutos) para mostrar de qué se compone
// la mejor tirada, junto a su probabilidad.
function MiniIcons({ combo }) {
  const icons = [
    ...repeatIcon(combo.success, SUCCESS_ICON, 'success', 's'),
    ...repeatIcon(combo.advantage, ADVANTAGE_ICON, 'advantage', 'a'),
    ...repeatIcon(combo.surge, SURGE_ICON, 'surge', 'u'),
  ];
  return (
    <span className="dt-mini-icons">
      {icons.map(icon => (
        <img key={icon.key} src={icon.src} alt="" className={`dt-mini-icon dt-mini-icon-${icon.type}`}
          onError={e => e.target.style.display = 'none'} />
      ))}
    </span>
  );
}

// Una cara "cuenta" para una combinación si coincide EXACTAMENTE en
// éxito/ventaja/rayo (ni de más ni de menos).
function matchesExactly(face, combo) {
  return (face.success || 0) === (combo.success || 0)
    && (face.advantage || 0) === (combo.advantage || 0)
    && (face.surge || 0) === (combo.surge || 0);
}

function odds(count, total) {
  return `${count}/${total} (${Math.round((count / total) * 100)}%)`;
}

// Nº de columnas para que todas las filas de caras queden con el mismo
// número de elementos (nunca una fila suelta más corta que las demás) —
// negro=6→3+3, amarillo=8→4+4, azul=12→4+4+4. Fallback genérico: mayor
// divisor de count que quepa cómodo en la burbuja (máx. 5 por fila).
function faceGridColumns(count) {
  if (count === 6) return 3;
  if (count === 8) return 4;
  if (count === 12) return 4;
  for (let c = Math.min(5, count); c >= 1; c--) {
    if (count % c === 0) return c;
  }
  return count;
}

// Tooltip con las caras de un dado de héroe (negro d6, amarillo d8, azul
// d12 — ver DIE_FACES en gamedata/dice.js), más la probabilidad de sacar
// un rayo y de sacar la mejor tirada posible (ver DIE_BEST_ROLL, indicada
// a mano por el usuario). `note` es un texto opcional (p.ej. "Las pruebas
// se realizan con 2 dados negros" para el tooltip del dado negro sobre el
// cuadro de atributos).
export default function DieTooltip({ die, title, note, children }) {
  const t = useT();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const { ref: bubbleRef, style: bubbleStyle } = useTooltipPosition(coords, visible && !isMobile);
  useBodyScrollLock(modalOpen);

  const faces = DIE_FACES[die];
  if (!faces) return children;

  const bestRoll = DIE_BEST_ROLL[die];
  const surgeCount = faces.filter(f => (f.surge || 0) > 0).length;
  const bestCount = bestRoll ? faces.filter(f => matchesExactly(f, bestRoll)).length : 0;

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }

  function handleClick(e) {
    if (!isMobile) return;
    if (e.target.closest('button, input, label, a, select')) return;
    setModalOpen(true);
  }

  const content = (
    <div className="dt-content">
      {title && (
        <div className="dt-title">
          <span className={`dt-swatch dt-swatch-${die}`} />
          {title}
        </div>
      )}
      {note && <div className="dt-note">{note}</div>}
      <div className="dt-faces-grid" style={{ gridTemplateColumns: `repeat(${faceGridColumns(faces.length)}, 40px)` }}>
        {faces.map((face, i) => <FaceChip key={i} face={face} die={die} />)}
      </div>
      <div className="dt-odds">
        <div className="dt-odds-row">
          <span className="dt-odds-label">
            {t('die.surgeOdds')}
            <img src={SURGE_ICON} alt="TERM_SURGE"
              style={termIconStyle('TERM_SURGE')}
              onError={e => e.target.style.display = 'none'} />
          </span>
          <span className="dt-odds-value">{odds(surgeCount, faces.length)}</span>
        </div>
        {bestRoll && (
          <div className="dt-odds-row">
            <span className="dt-odds-label">
              {t('die.bestOdds')}
              <MiniIcons combo={bestRoll} />
            </span>
            <span className="dt-odds-value">{odds(bestCount, faces.length)}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <span
      className="rtt-wrap"
      onMouseEnter={e => { if (!isMobile) { setVisible(true); move(e); } }}
      onMouseMove={e => { if (!isMobile) move(e); }}
      onMouseLeave={() => { if (!isMobile) setVisible(false); }}
      onClick={handleClick}
    >
      {children}
      {!isMobile && visible && createPortal(
        <span ref={bubbleRef} className="rtt-bubble dt-bubble" style={bubbleStyle}>
          {content}
        </span>
      , document.body)}
      {isMobile && modalOpen && createPortal(
        <div className="rtt-modal-overlay" onClick={e => { e.stopPropagation(); setModalOpen(false); }}>
          <div className="rtt-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="rtt-modal-handle-row"><div className="rtt-modal-handle" /></div>
            <div className="rtt-modal-close-row">
              <button className="rtt-modal-close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="rtt-modal-body">{content}</div>
          </div>
        </div>
      , document.body)}
    </span>
  );
}
