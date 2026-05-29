/**
 * Posiciones de ensamblaje de piezas de arma extraídas del prefab Display_* del juego.
 *
 * Sistema de coordenadas original Unity UI:
 *   - Canvas: 420×512 px
 *   - Origen en el centro del canvas
 *   - Y hacia arriba (Unity) → convertido a Y hacia abajo (CSS)
 *
 * Fórmula de conversión: css_left = 210 + ap_x − w/2,  css_top = 256 − ap_y − h/2
 *
 * Campos por slot:
 *   left, top  — posición CSS absoluta dentro del canvas 420×512
 *   w, h       — tamaño del canvas de la pieza (toda la imagen, con transparencias)
 *   z          — orden de renderizado (1=fondo, 2=medio, 3=frente)
 *
 * rotation — rotación del canvas completo en grados CSS (sentido horario, Warhammer ~13°)
 */
export const WEAPON_ASSEMBLY = {
  BOW: {
    rotation: 0,
    a: { left:  86.5, top:  16.0, w: 164, h: 480, z: 2 },
    b: { left: 212.3, top:  26.5, w:  19, h: 459, z: 1 },
    c: { left: 263.6, top:  71.5, w:  58, h: 369, z: 3 },
  },
  CROSSBOW: {
    rotation: 0,
    a: { left:  19.7, top: 143.7, w: 354, h: 291, z: 3 },
    b: { left:  30.9, top: 127.0, w: 372, h: 262, z: 2 },
    c: { left:  90.4, top:  92.2, w: 188, h: 104, z: 1 },
  },
  DUAL_BLADES: {
    rotation: 0,
    a: { left:  92.0, top:  10.3, w: 277, h: 378, z: 2 },
    b: { left: 216.3, top: 186.4, w: 200, h: 237, z: 1 },
    c: { left:   8.7, top: 263.1, w: 306, h: 234, z: 3 },
  },
  GAUNTLET: {
    rotation: 0,
    a: { left: 207.8, top: 236.2, w: 206, h: 221, z: 2 },
    b: { left: 168.3, top: 215.8, w: 211, h: 221, z: 1 },
    c: { left:   4.5, top:  22.4, w: 285, h: 288, z: 3 },
  },
  HAMMER: {
    rotation: 0,
    a: { left: 105.5, top:  42.2, w: 312, h: 247, z: 1 },
    b: { left: 113.5, top: 178.0, w: 152, h: 167, z: 2 },
    c: { left:   6.5, top: 306.9, w: 165, h: 150, z: 3 },
  },
  KNIVES: {
    rotation: 0,
    a: { left:  80.7, top: 209.6, w: 248, h: 248, z: 3 },
    b: { left: 128.4, top: 188.4, w: 208, h: 210, z: 2 },
    c: { left:  37.2, top:  66.0, w: 409, h: 368, z: 1 },
  },
  SPEAR: {
    rotation: 0,
    // Cabeza frente (z3) para que se distinga del mango; mango al fondo (z1)
    a: { left: 138.8, top:  -10.0, w: 142, h: 167, z: 3 }, // cabeza: frente
    b: { left: 187.0, top:  115.3, w:  46, h: 377, z: 1 }, // mango: fondo
    c: { left: 155.5, top:  450.0, w: 106, h: 101, z: 2 }, // cola: medio
  },
  STAFF: {
    rotation: 0,
    // Posiciones originales (las imágenes del juego están diseñadas para esta disposición)
    a: { left: 149.0, top:   0.0, w: 122, h: 512, z: 1 }, // cuerpo: fondo
    // maskSlot:'a' → la infusión se recorta con el alpha del png del cuerpo
    c: { left: 149.0, top:   0.0, w: 122, h: 512, z: 2, maskSlot: 'a' }, // infusión: medio
    b: { left: 177.4, top: 153.8, w:  91, h: 248, z: 3 }, // envoltura: frente
  },
  SWORD: {
    rotation: 0,
    a: { left:  97.6, top:   4.1, w: 184, h: 337, z: 1 },
    b: { left: 125.9, top: 275.8, w: 186, h:  98, z: 3 },
    c: { left: 194.1, top: 330.6, w:  49, h: 173, z: 2 },
  },
  WAND: {
    rotation: 0,
    a: { left:  49.4, top:  27.8, w: 372, h: 360, z: 1 },
    b: { left:  38.1, top: 252.3, w: 132, h: 151, z: 2 },
    c: { left:  -2.7, top: 338.0, w: 132, h: 151, z: 3 },
  },
  WARBELL: {
    rotation: 0,
    a: { left: 115.1, top: 341.1, w: 190, h: 168, z: 3 },
    b: { left: 153.6, top:   1.9, w: 108, h: 213, z: 1 },
    c: { left: 179.9, top: 202.1, w:  61, h: 187, z: 2 },
  },
  WARHAMMER: {
    // Unity: cada pieza tiene su propia rotación −13.043° individualmente (no el contenedor).
    // Se aplica rot por imagen para respetar el origen de rotación de cada pieza.
    rotation: 0,
    a: { left: 196.9, top:  27.3, w: 184, h: 155, z: 2, rot: 13.04 }, // cabeza (Image_Middle)
    b: { left: 101.7, top:  97.5, w: 160, h: 364, z: 3, rot: 13.04 }, // mango (Image_Top, frente)
    c: { left:  40.5, top: 415.5, w:  61, h:  83, z: 1, rot: 13.04 }, // puño (Image_Bottom, fondo)
  },
};

/** Tamaño virtual del canvas de ensamblaje (píxeles Unity) */
export const ASSEMBLY_CANVAS = { w: 420, h: 512 };

/** Altura de visualización en la UI (px) → ajusta el scale */
export const ASSEMBLY_DISPLAY_H = 340;

/** Scale para renderizar el canvas de 512px en 340px */
export const ASSEMBLY_SCALE = ASSEMBLY_DISPLAY_H / ASSEMBLY_CANVAS.h; // ≈ 0.664

/** Ancho resultante en px */
export const ASSEMBLY_DISPLAY_W = Math.round(ASSEMBLY_CANVAS.w * ASSEMBLY_SCALE); // 279
