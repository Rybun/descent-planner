import { useState, useRef } from 'react';
import './Tooltip.css';

function renderText(raw) {
  const clean = String(raw).replace(/^"+|"+$/g, '').trim();
  const parts = clean.split(/(<i>.*?<\/i>)/g);
  return parts.map((part, i) => {
    const m = part.match(/^<i>(.*?)<\/i>$/s);
    return m ? <em key={i}>{m[1]}</em> : part;
  });
}

/**
 * Tooltip que aparece al hacer hover sobre los children.
 * Props:
 *   text       – texto del tooltip (si null/vacío no muestra nada)
 *   position   – 'top' | 'bottom' | 'right' (default 'top')
 */
export default function Tooltip({ children, text, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const wrapRef = useRef(null);
  const tipRef = useRef(null);

  if (!text) return <>{children}</>;

  function handleMouseEnter(e) {
    setVisible(true);
    updatePosition(e);
  }

  function handleMouseMove(e) {
    updatePosition(e);
  }

  function updatePosition(e) {
    setCoords({ x: e.clientX, y: e.clientY });
  }

  function handleMouseLeave() {
    setVisible(false);
  }

  return (
    <span
      ref={wrapRef}
      className="tooltip-wrap"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <span
          ref={tipRef}
          className="tooltip-bubble"
          style={{
            left: coords.x + 12,
            top: coords.y - 8,
          }}
        >
          {renderText(text)}
        </span>
      )}
    </span>
  );
}
