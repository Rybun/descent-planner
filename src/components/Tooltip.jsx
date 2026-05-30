import { useState, useRef } from 'react';
import './Tooltip.css';

function renderText(raw) {
  const clean = String(raw).replace(/^"+|"+$/g, '').trim();
  const parts = clean.split(/(<b>.*?<\/b>|<i>.*?<\/i>)/gs);
  return parts.map((part, i) => {
    const bold   = part.match(/^<b>(.*?)<\/b>$/s);
    if (bold)   return <strong key={i}>{bold[1]}</strong>;
    const italic = part.match(/^<i>(.*?)<\/i>$/s);
    if (italic) return <em key={i}>{italic[1]}</em>;
    return part || null;
  });
}

export default function Tooltip({ children, text, content, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const wrapRef = useRef(null);

  if (!text && !content) return <>{children}</>;

  function updatePosition(e) { setCoords({ x: e.clientX, y: e.clientY }); }

  return (
    <span
      ref={wrapRef}
      className="tooltip-wrap"
      onMouseEnter={e => { setVisible(true); updatePosition(e); }}
      onMouseMove={updatePosition}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className="tooltip-bubble"
          style={{ left: coords.x + 12, top: coords.y - 8 }}
        >
          {content ?? renderText(text)}
        </span>
      )}
    </span>
  );
}
