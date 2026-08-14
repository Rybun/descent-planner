import { useState } from 'react';
import { createPortal } from 'react-dom';
import { getName } from '../i18n';
import { DESCRIPTIONS } from '../gamedata/descriptions';
import { parseGameText, TERM_ICONS } from '../gamedata/gameText';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTooltipPosition } from '../hooks/useTooltipPosition';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const MATERIAL_LABEL = {
  es: 'Material', en: 'Material', fr: 'Matériau', it: 'Materiale', pt: 'Material',
};

function renderDescNodes(raw) {
  if (!raw) return null;
  const clean = raw.replace(/^"+|"+$/g, '').trim();
  if (!clean) return null;
  return parseGameText(clean).map((node, i) => {
    if (node.t === 'text') return <span key={i}>{node.s}</span>;
    const iconSrc = TERM_ICONS[node.key];
    if (iconSrc) return (
      <img key={i} src={iconSrc} alt={node.key}
        style={{ width: '1em', height: '1em', verticalAlign: 'middle', display: 'inline' }}
        onError={e => e.target.style.display = 'none'} />
    );
    if (node.content && !/^[-\s]+$/.test(node.content))
      return <em key={i} style={{ fontStyle: 'normal', color: 'var(--color-gold-light)' }}>{node.content}</em>;
    return null;
  });
}

export default function MaterialTooltip({ mat, lang, children }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { ref: bubbleRef, style: bubbleStyle } = useTooltipPosition(coords, visible && !isMobile);
  useBodyScrollLock(modalOpen);

  if (!mat) return <>{children}</>;

  const name = getName(mat, lang);
  const label = MATERIAL_LABEL[lang] || MATERIAL_LABEL.es;
  const raw = DESCRIPTIONS[mat.id] || '';
  const descNodes = renderDescNodes(raw);

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }

  function handleClick(e) {
    if (!isMobile) return;
    if (e.target.closest('button, input, label, a, select')) return;
    setModalOpen(true);
  }

  const bubbleContent = (
    <>
      <span className="rtt-header">
        <span className="rtt-title">
          <span className="rtt-label">{label}</span>
          {name}
        </span>
      </span>

      {descNodes && (
        <span className="rtt-effect rtt-passive">{descNodes}</span>
      )}

      {mat.image && (
        <span className="rtt-hero-footer rtt-hero-footer--item">
          <img src={mat.image} alt={name} className="rtt-item-footer-img"
            onError={e => e.target.style.display = 'none'} />
        </span>
      )}
    </>
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
        <span ref={bubbleRef} className="rtt-bubble" style={bubbleStyle}>
          {bubbleContent}
        </span>
      , document.body)}
      {isMobile && modalOpen && createPortal(
        <div className="rtt-modal-overlay" onClick={e => { e.stopPropagation(); setModalOpen(false); }}>
          <div className="rtt-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="rtt-modal-handle-row"><div className="rtt-modal-handle" /></div>
            <div className="rtt-modal-close-row">
              <button className="rtt-modal-close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="rtt-modal-body">{bubbleContent}</div>
          </div>
        </div>
      , document.body)}
    </span>
  );
}
