import { useState } from 'react';
import { createPortal } from 'react-dom';
import { getName } from '../i18n';
import { DESCRIPTIONS } from '../gamedata/descriptions';
import { parseGameText, TERM_ICONS } from '../gamedata/gameText';

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

  if (!mat) return <>{children}</>;

  const name = getName(mat, lang);
  const label = MATERIAL_LABEL[lang] || MATERIAL_LABEL.es;
  const raw = DESCRIPTIONS[mat.id] || '';
  const descNodes = renderDescNodes(raw);

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }
  const offsetX = coords.x + 16 + 280 > window.innerWidth ? coords.x - 296 : coords.x + 16;
  const offsetY = Math.min(coords.y - 8, window.innerHeight - 400);

  return (
    <span
      className="rtt-wrap"
      onMouseEnter={e => { setVisible(true); move(e); }}
      onMouseMove={move}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && createPortal(
        <span className="rtt-bubble" style={{ left: offsetX, top: offsetY }}>

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

        </span>
      , document.body)}
    </span>
  );
}
