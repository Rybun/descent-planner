// Héroes del juego Descent: Legends of the Dark
// Datos extraídos de los assets del juego

export const HEROES = [
  {
    id: 'HERO_BRYNN',
    name: 'Brynn',
    archetype: 'Guerrera',
    description: 'Valiente guerrera dotada de una fuerza excepcional. Sus armas son la Espada y el Martillo de guerra.',
    image: '/assets/heroes/brynn_crop.png',
    weapons: ['WEAPON_SWORD', 'WEAPON_WAR_HAMMER'],
    armorTypes: ['heavy'],
  },
  {
    id: 'HERO_SYRUS',
    name: 'Syrus',
    archetype: 'Mago',
    description: 'Prodigio arcano que domina las artes mágicas. Sus armas son el Báculo y la Varita de los vientos.',
    image: '/assets/heroes/syrus_crop.png',
    weapons: ['WEAPON_STAFF', 'WEAPON_WAND_OF_WINDS'],
    armorTypes: ['light'],
  },
  {
    id: 'HERO_GALADEN',
    name: 'Galaden',
    archetype: 'Explorador',
    description: 'Ágil explorador experto en combate a distancia. Sus armas son las Hojas gemelas y el Arco.',
    image: '/assets/heroes/galaden_crop.png',
    weapons: ['WEAPON_DUAL_BLADES', 'WEAPON_BOW'],
    armorTypes: ['light', 'medium'],
  },
  {
    id: 'HERO_VAERIX',
    name: 'Vaerix',
    archetype: 'Dracónido exiliado',
    description: 'Exiliado dracónido con poderes sagrados. Sus armas son la Campana de guerra y la Lanza.',
    image: '/assets/heroes/vaerix_crop.png',
    weapons: ['WEAPON_WARBELL', 'WEAPON_SPEAR'],
    armorTypes: ['medium', 'heavy'],
  },
  {
    id: 'HERO_KEHLI',
    name: 'Kehli',
    archetype: 'Artesana',
    description: 'Ingeniosa artesana especialista en armas de fuego. Sus armas son el Martillo y la Ballesta.',
    image: '/assets/heroes/kehli_crop.png',
    weapons: ['WEAPON_HAMMER', 'WEAPON_CROSSBOW'],
    armorTypes: ['medium'],
  },
  {
    id: 'HERO_CHANCE',
    name: 'Venturoso',
    nameEn: 'Chance',
    archetype: 'Pícaro',
    description: 'Misterioso pícaro con habilidades únicas. Sus armas son el Kukri y los Cuchillos arrojadizos.',
    image: '/assets/heroes/chance_crop.png',
    weapons: ['WEAPON_KUKRI', 'WEAPON_THROWING_KNIVES'],
    armorTypes: ['light'],
  },
];

export const HEROES_BY_ID = Object.fromEntries(HEROES.map(h => [h.id, h]));
