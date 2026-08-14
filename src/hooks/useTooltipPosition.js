import { useLayoutEffect, useRef, useState } from 'react';

const MARGIN = 8;

// Todos los tooltips (rtt-bubble, tooltip-bubble, gi-quest-tooltip-bubble...)
// posicionaban la burbuja con un left/top calculado a partir de coordenadas
// del ratón y una ALTURA/ANCHURA SUPUESTAS (números fijos tipo "innerHeight
// - 400"), no la altura real del contenido — con texto largo (o el cursor
// cerca del borde) la burbuja se salía de la pantalla por abajo. Este hook
// mide el elemento ya renderizado (con position:fixed, así que las
// coordenadas son relativas al viewport igual que clientX/clientY) y
// recoloca antes de pintar, para que nunca se salga por ningún borde.
export function useTooltipPosition(coords, visible) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });

  useLayoutEffect(() => {
    if (!visible || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();

    let left = coords.x + 16;
    if (left + rect.width + MARGIN > window.innerWidth) {
      left = coords.x - rect.width - 16;
    }
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - rect.width - MARGIN));

    let top = coords.y - 8;
    if (top + rect.height + MARGIN > window.innerHeight) {
      top = window.innerHeight - rect.height - MARGIN;
    }
    top = Math.max(MARGIN, top);

    setPos({ left, top });
  }, [coords.x, coords.y, visible]);

  return { ref, style: { left: pos.left, top: pos.top } };
}
