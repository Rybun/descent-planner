// Armas del juego Descent: Legends of the Dark
// Cada héroe tiene 2 armas, cada arma tiene 3 slots de mejora (A, B, C)

export const WEAPONS = [
  {
    id: 'WEAPON_SWORD',
    name: 'Espada',
    nameEn: 'Sword',
    heroId: 'HERO_BRYNN',
    weaponType: 'SWORD',
    image: null,
  },
  {
    id: 'WEAPON_WAR_HAMMER',
    name: 'Martillo de guerra',
    nameEn: 'War Hammer',
    heroId: 'HERO_BRYNN',
    weaponType: 'WARHAMMER',
    image: null,
  },
  {
    id: 'WEAPON_STAFF',
    name: 'Báculo',
    nameEn: 'Staff',
    heroId: 'HERO_SYRUS',
    weaponType: 'STAFF',
    image: null,
  },
  {
    id: 'WEAPON_WAND_OF_WINDS',
    name: 'Varita de los vientos',
    nameEn: 'Wand of Winds',
    heroId: 'HERO_SYRUS',
    weaponType: 'WAND',
    image: null,
  },
  {
    id: 'WEAPON_DUAL_BLADES',
    name: 'Hojas gemelas',
    nameEn: 'Dual Blades',
    heroId: 'HERO_GALADEN',
    weaponType: 'DUAL_BLADES',
    image: null,
  },
  {
    id: 'WEAPON_BOW',
    name: 'Arco',
    nameEn: 'Bow',
    heroId: 'HERO_GALADEN',
    weaponType: 'BOW',
    image: null,
  },
  {
    id: 'WEAPON_WARBELL',
    name: 'Campana de guerra',
    nameEn: 'War Bell',
    heroId: 'HERO_VAERIX',
    weaponType: 'WARBELL',
    image: null,
  },
  {
    id: 'WEAPON_SPEAR',
    name: 'Lanza',
    nameEn: 'Spear',
    heroId: 'HERO_VAERIX',
    weaponType: 'SPEAR',
    image: null,
  },
  {
    id: 'WEAPON_HAMMER',
    name: 'Martillo',
    nameEn: 'Hammer',
    heroId: 'HERO_KEHLI',
    weaponType: 'HAMMER',
    image: null,
  },
  {
    id: 'WEAPON_CROSSBOW',
    name: 'Ballesta',
    nameEn: 'Crossbow',
    heroId: 'HERO_KEHLI',
    weaponType: 'CROSSBOW',
    image: null,
  },
  {
    id: 'WEAPON_KUKRI',
    name: 'Kukri',
    nameEn: 'Kukri',
    heroId: 'HERO_CHANCE',
    weaponType: 'KNIVES',
    image: null,
  },
  {
    id: 'WEAPON_THROWING_KNIVES',
    name: 'Cuchillos arrojadizos',
    nameEn: 'Throwing Knives',
    heroId: 'HERO_CHANCE',
    weaponType: 'KNIVES',
    image: null,
  },
];

export const WEAPONS_BY_ID = Object.fromEntries(WEAPONS.map(w => [w.id, w]));

// Tipos de partes de arma y su slot correspondiente
// WEAPON_PART_A = cabeza/hoja (slot A)
// WEAPON_PART_B = empuñadura/mango (slot B)
// WEAPON_PART_C = accesorio/punta (slot C)
export const PART_SLOTS = {
  A: 'Hoja / Cabeza',
  B: 'Empuñadura / Mango',
  C: 'Accesorio / Punta',
};
