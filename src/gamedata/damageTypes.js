// Tipos de daño de Descent: Legends of the Dark
// Índices 0-11 corresponden al campo `traits` en weaponParts.js
//
// Mapping verificado mediante correlación de armas conocidas del juego:
//   0 = Aplastante  ← martillos/macros (Traits=[0])
//   1 = Cortante    ← espadas/cuchillos (Traits=[1])
//   2 = Perforante  ← arcos/ballestas (Traits=[2])
//   3 = Ignos       ← Relámpago (Runa A1) usa [2,3]
//   4 = Anemos      ← Hoja alada (Espada A2) usa [1,4]; Tormenta de hielo usa [5,4]
//   5 = Aquos       ← Tormenta de hielo usa [5,4]
//   6 = Terros      ← bastones de tierra (Staff [0,6])
//   7 = Lumos       ← Descarga solar usa [7,3]; bastones de luz (Staff [0,7])
//   8 = Umbros      ← dagas sombrías (DualBlades [1,8])
//   9 = Mortos      ← Garra del miedo [8,9]; Matadragones [1,9]
//  10 = Fortunos    ← guanteletes especiales [1,10]
//  11 = Toxos       ← varitas venenosas [1,11]
//
// Iconos: texturas originales del juego (assets/icons/dmg_*.png)
// Nombres: claves de localización oficiales del juego (5 idiomas)

export const DAMAGE_TYPES = [
  {
    id: 0,
    icon: '/assets/icons/dmg_crush.png',
    physical: true,
    names: { es: 'Aplastante', en: 'Crush', fr: 'Contondant', it: 'Impatto', pt: 'Esmagamento' },
  },
  {
    id: 1,
    icon: '/assets/icons/dmg_slash.png',
    physical: true,
    names: { es: 'Cortante', en: 'Slash', fr: 'Tranchant', it: 'Taglio', pt: 'Corte' },
  },
  {
    id: 2,
    icon: '/assets/icons/dmg_pierce.png',
    physical: true,
    names: { es: 'Perforante', en: 'Pierce', fr: 'Perforant', it: 'Punta', pt: 'Perfuração' },
  },
  {
    id: 3,
    icon: '/assets/icons/dmg_ignos.png',
    physical: false,
    names: { es: 'Ignos', en: 'Ignos', fr: 'Ignos', it: 'Ignos', pt: 'Ignos' },
  },
  {
    id: 4,
    icon: '/assets/icons/dmg_anemos.png',
    physical: false,
    names: { es: 'Anemos', en: 'Anemos', fr: 'Anemos', it: 'Anemos', pt: 'Anemos' },
  },
  {
    id: 5,
    icon: '/assets/icons/dmg_aquos.png',
    physical: false,
    names: { es: 'Aquos', en: 'Aquos', fr: 'Aquos', it: 'Aquos', pt: 'Aquos' },
  },
  {
    id: 6,
    icon: '/assets/icons/dmg_terros.png',
    physical: false,
    names: { es: 'Terros', en: 'Terros', fr: 'Terros', it: 'Terros', pt: 'Terros' },
  },
  {
    id: 7,
    icon: '/assets/icons/dmg_lumos.png',
    physical: false,
    names: { es: 'Lumos', en: 'Lumos', fr: 'Lumos', it: 'Lumos', pt: 'Lumos' },
  },
  {
    id: 8,
    icon: '/assets/icons/dmg_umbros.png',
    physical: false,
    names: { es: 'Umbros', en: 'Umbros', fr: 'Umbros', it: 'Umbros', pt: 'Umbros' },
  },
  {
    id: 9,
    icon: '/assets/icons/dmg_mortos.png',
    physical: false,
    names: { es: 'Mortos', en: 'Mortos', fr: 'Mortos', it: 'Mortos', pt: 'Mortos' },
  },
  {
    id: 10,
    icon: '/assets/icons/dmg_fortunos.png',
    physical: false,
    names: { es: 'Fortunos', en: 'Fortunos', fr: 'Fortunos', it: 'Fortunos', pt: 'Fortunos' },
  },
  {
    id: 11,
    icon: '/assets/icons/dmg_toxos.png',
    physical: false,
    names: { es: 'Toxos', en: 'Toxos', fr: 'Toxos', it: 'Toxos', pt: 'Toxos' },
  },
];

/** Lookup por índice */
export const DAMAGE_TYPE_BY_ID = Object.fromEntries(DAMAGE_TYPES.map(dt => [dt.id, dt]));

/**
 * Devuelve el nombre de un tipo de daño en el idioma solicitado.
 * @param {number} traitId
 * @param {string} lang  — 'es' | 'en' | 'fr' | 'it' | 'pt'
 */
export function getTraitName(traitId, lang = 'es') {
  const dt = DAMAGE_TYPE_BY_ID[traitId];
  if (!dt) return `?${traitId}`;
  return dt.names[lang] || dt.names.en;
}
