// Caras de los 3 dados de héroe (negro d6, amarillo d8, azul d12) —
// indicadas a mano por el usuario, no vienen en los bundles del juego
// (son componentes físicos). success = éxito (estrella), advantage =
// ventaja (cruz), surge = rayo/incremento (relámpago) — mismos iconos que
// TERM_SUCCESS/TERM_ADVANTAGE/TERM_SURGE en gameText.js.
export const DIE_FACES = {
  black: [
    { success: 3 },
    { success: 3 },
    { success: 2, advantage: 2 },
    { success: 2 },
    { success: 2 },
    { success: 1, surge: 1 },
  ],
  yellow: [
    { success: 2, advantage: 1 },
    { success: 2 },
    { success: 2 },
    { success: 1, advantage: 1, surge: 1 },
    { success: 1, advantage: 2 },
    { success: 1, surge: 1 },
    { success: 1, surge: 1 },
    { advantage: 2 },
  ],
  blue: [
    { success: 2 },
    { success: 1, advantage: 1 },
    { success: 1, advantage: 1 },
    { success: 1, advantage: 1 },
    { success: 1, surge: 1 },
    { success: 1, surge: 1 },
    { success: 1, surge: 1 },
    { advantage: 1, surge: 1 },
    { surge: 1 },
    { surge: 1 },
    { surge: 1 },
    { surge: 1 },
  ],
};

// La mejor tirada posible de cada dado (indicada a mano por el usuario) —
// se compara por coincidencia EXACTA de éxito/ventaja/rayo contra
// DIE_FACES para contar cuántas caras la cumplen (ver DieTooltip.jsx).
export const DIE_BEST_ROLL = {
  black: { success: 3 },
  yellow: { success: 1, advantage: 1, surge: 1 },
  blue: { success: 1, surge: 1 },
};
