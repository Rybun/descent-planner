import { useEffect } from 'react';

// Contador a nivel de módulo (no de instancia) porque puede haber varios
// tooltips montados en la página simultáneamente — solo se restaura el
// overflow original cuando el ÚLTIMO modal activo se cierra, no cuando
// cualquiera de ellos lo hace.
let lockCount = 0;
let previousOverflow = '';

// Bloquea el scroll de la página mientras la hoja modal de un tooltip móvil
// está abierta — sin esto, arrastrar dentro del modal (que cubre toda la
// pantalla pero no es el único elemento con contenido) también desplazaba
// la página de fondo.
export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    lockCount++;
    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [active]);
}
