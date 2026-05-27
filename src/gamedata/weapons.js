// Armas del juego Descent: Legends of the Dark
// Cada héroe tiene 2 armas, cada arma tiene 3 slots de mejora (A, B, C)

// attackType: 'MELEE' | 'RANGED' | 'MAGIC'
export const WEAPONS = [
  {
    id: 'WEAPON_SWORD',
    name: 'Espada',
    nameEn: 'Sword',
    heroId: 'HERO_BRYNN',
    weaponType: 'SWORD',
    attackType: 'MELEE',
    image: null,
  },
  {
    id: 'WEAPON_WAR_HAMMER',
    name: 'Martillo de guerra',
    nameEn: 'War Hammer',
    heroId: 'HERO_BRYNN',
    weaponType: 'WARHAMMER',
    attackType: 'MELEE',
    image: null,
  },
  {
    id: 'WEAPON_STAFF',
    name: 'Báculo',
    nameEn: 'Staff',
    heroId: 'HERO_SYRUS',
    weaponType: 'STAFF',
    attackType: 'MAGIC',
    image: null,
  },
  {
    id: 'WEAPON_WAND_OF_WINDS',
    name: 'Varita de los vientos',
    nameEn: 'Wand of Winds',
    heroId: 'HERO_SYRUS',
    weaponType: 'WAND',
    attackType: 'MAGIC',
    image: null,
  },
  {
    id: 'WEAPON_DUAL_BLADES',
    name: 'Hojas gemelas',
    nameEn: 'Dual Blades',
    heroId: 'HERO_GALADEN',
    weaponType: 'DUAL_BLADES',
    attackType: 'MELEE',
    image: null,
  },
  {
    id: 'WEAPON_BOW',
    name: 'Arco',
    nameEn: 'Bow',
    heroId: 'HERO_GALADEN',
    weaponType: 'BOW',
    attackType: 'RANGED',
    image: null,
  },
  {
    id: 'WEAPON_WARBELL',
    name: 'Campana de guerra',
    nameEn: 'War Bell',
    heroId: 'HERO_VAERIX',
    weaponType: 'WARBELL',
    attackType: 'MAGIC',
    image: null,
  },
  {
    id: 'WEAPON_SPEAR',
    name: 'Lanza',
    nameEn: 'Spear',
    heroId: 'HERO_VAERIX',
    weaponType: 'SPEAR',
    attackType: 'MELEE',
    image: null,
  },
  {
    id: 'WEAPON_HAMMER',
    name: 'Martillo',
    nameEn: 'Hammer',
    heroId: 'HERO_KEHLI',
    weaponType: 'HAMMER',
    attackType: 'MELEE',
    image: null,
  },
  {
    id: 'WEAPON_CROSSBOW',
    name: 'Ballesta',
    nameEn: 'Crossbow',
    heroId: 'HERO_KEHLI',
    weaponType: 'CROSSBOW',
    attackType: 'RANGED',
    image: null,
  },
  {
    id: 'WEAPON_KUKRI',
    name: 'Kukri',
    nameEn: 'Kukri',
    heroId: 'HERO_CHANCE',
    weaponType: 'KNIVES',
    attackType: 'MELEE',
    image: null,
  },
  {
    id: 'WEAPON_THROWING_KNIVES',
    name: 'Cuchillos arrojadizos',
    nameEn: 'Throwing Knives',
    heroId: 'HERO_CHANCE',
    weaponType: 'KNIVES',
    attackType: 'RANGED',
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
