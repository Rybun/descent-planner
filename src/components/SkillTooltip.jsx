import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../i18n';
import { parseGameText, TERM_ICONS } from '../gamedata/gameText';
import { useTooltipPosition } from '../hooks/useTooltipPosition';
import { useIsMobile } from '../hooks/useIsMobile';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import './GameInfoPanel.css';
import './RecipeTooltip.css';

// Efecto de una cara de habilidad (ver SKILL_CARD_DETAILS en extract.py) —
// mismo render de iconos que el resto de texto de partidas del juego.
function renderSkillEffect(raw) {
  if (!raw) return null;
  return parseGameText(raw).map((node, i) => {
    if (node.t === 'text') return <span key={i}>{node.s}</span>;
    const iconSrc = TERM_ICONS[node.key];
    if (iconSrc) return (
      <img key={i} src={iconSrc} alt={node.key}
        style={{ width: '1em', height: '1em', verticalAlign: 'middle', display: 'inline' }}
        onError={e => e.target.style.display = 'none'} />
    );
    return null;
  });
}

// Cada cara tiene su PROPIA fatiga máxima — en casi todos los casos distinta
// entre las dos caras de una misma carta — así que la píldora va junto al
// título de CADA cara, no una sola vez para toda la habilidad.
function SkillFaceDetail({ name, face }) {
  if (!face) return null;
  return (
    <div className="gi-skill-tooltip-face">
      <div className="gi-skill-tooltip-face-header">
        <span className="gi-skill-tooltip-face-name">{name}</span>
        <span className="gi-skill-fatigue-pill">
          {face.maxFatigue}
          <img src="/assets/icons/Icon_Fatigue.png" alt="" className="gi-skill-fatigue-pill-icon"
            onError={e => e.target.style.display = 'none'} />
        </span>
      </div>
      {face.tags?.length > 0 && (
        <div className="gi-skill-tooltip-tags">{face.tags.join(' • ')}</div>
      )}
      <div className="gi-skill-tooltip-effect">{renderSkillEffect(face.effect)}</div>
    </div>
  );
}

// Tooltip de habilidad — en escritorio, burbuja flotante que sigue al
// ratón; en móvil, hoja modal inferior (mismo patrón que QuestTooltip en
// GameInfoPanel.jsx e ItemTooltip/RecipeTooltip/MaterialTooltip/
// WeaponPartTooltip). Sin cardDetails (habilidades 8-11, no fotografiadas)
// no envuelve nada.
export default function SkillTooltip({ skill, lang, children }) {
  const t = useT();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const { ref: bubbleRef, style: bubbleStyle } = useTooltipPosition(coords, visible && !isMobile);
  useBodyScrollLock(modalOpen);

  const details = skill?.cardDetails;
  if (!details) return children;

  const [nameA, nameB] = (skill.names?.[lang] || skill.names?.es || skill.id).split(' / ');

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }

  function handleClick() {
    if (!isMobile) return;
    setModalOpen(true);
  }

  const content = (
    <div className="gi-skill-tooltip">
      <SkillFaceDetail name={nameA} face={details.faceA} />
      {nameB && <div className="gi-skill-tooltip-divider" />}
      <SkillFaceDetail name={nameB} face={details.faceB} />
      <div className="gi-skill-tooltip-xp">{t('gameinfo.xpCost')}: {skill.xpCost} XP</div>
    </div>
  );

  return (
    <span
      className="gi-quest-tooltip-wrap"
      onMouseEnter={e => { if (!isMobile) { setVisible(true); move(e); } }}
      onMouseMove={e => { if (!isMobile) move(e); }}
      onMouseLeave={() => { if (!isMobile) setVisible(false); }}
      onClick={handleClick}
    >
      {children}
      {!isMobile && visible && createPortal(
        <span ref={bubbleRef} className="rtt-bubble gi-skill-tooltip-bubble" style={bubbleStyle}>
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
