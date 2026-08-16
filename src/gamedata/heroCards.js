// Datos de las cartas de referencia FÍSICAS de cada héroe: estadísticas de
// Fuerza/Agilidad/Sabiduría/Voluntad, sobrenombre, Movimiento/Vida, dado de
// ataque/defensa (color+forma: negro=cuadrado, amarillo=rombo,
// azul=octógono — indicados directamente por el usuario, no se ve en las
// fotos con claridad de color), la habilidad de cada cara de la carta (con
// su cita en cursiva) y su fatiga máxima, y la habilidad de activación del
// rayo (idéntica en ambas caras).
//
// Nada de esto existe en los bundles del juego: heroes.js ya es un fichero
// escrito enteramente a mano (extract.py no tiene generador para él), así
// que estos datos se transcriben a mano de fotos reales de las cartas
// físicas (IMG_3298.HEIC / IMG_3299.HEIC), siguiendo el mismo criterio que
// ARMOR_CARD_STATS/SKILL_CARD_DETAILS en extract.py: nunca inventados,
// documentados como transcripción.
//
// Fuerza/Agilidad/Sabiduría/Voluntad y Movimiento/Vida son iguales en las
// dos caras de la carta (verificado en ambas fotos); solo cambian el nombre
// /coste/efecto/cita de la habilidad propia de cada cara y su fatiga máxima.
//
// Los iconos del texto usan el mismo marcado que el resto del juego
// (<style=Term><link=TERM_X></link></style>), consumido por
// parseGameText/TERM_ICONS (./gameText.js) — mismo patrón que
// SKILL_CARD_DETAILS en extract.py.

const SUC = '<style=Term><link=TERM_SUCCESS></link></style>';
const FAT = '<style=Term><link=TERM_FATIGUE></link></style>';
const ADV = '<style=Term><link=TERM_ADVANTAGE></link></style>';
const SUR = '<style=Term><link=TERM_SURGE></link></style>';
const HP  = '<style=Term><link=TERM_HEALTH_DIAL></link></style>';
const DMG = '<style=Term><link=TERM_DAMAGE></link></style>';

export const HERO_CARDS = {
  HERO_BRYNN: {
    nickname: 'La vengadora humana',
    movement: 3,
    health: 10,
    attributes: { strength: 2, agility: -1, wisdom: -1, willpower: 1 },
    attackDie: 'black',
    defenseDie: 'black',
    heroicAbility: {
      cost: { type: 'surge', amount: 1 },
      effect: `Añade 1${SUC} y un héroe adyacente puede descartar 1${FAT}.`,
      armorHint: 'Armadura pesada',
    },
    faceA: {
      name: 'Defensa firme',
      cost: { type: 'fatigue', amount: 2 },
      effect: `Durante tu defensa o la de un héroe adyacente, añade 1${SUC}.`,
      quote: 'Aunque vivamos la noche más oscura, siempre resistiremos juntos.',
      maxFatigue: 3,
    },
    faceB: {
      name: 'Aventajar',
      cost: { type: 'action', amount: 1 },
      effect: 'Desplazamiento 3. A continuación, ataca a un enemigo. Después de este ataque, dale la vuelta a esta carta.',
      quote: 'Mi camino es claro: lleva directo hacia nuestro enemigo.',
      maxFatigue: 1,
    },
  },

  HERO_SYRUS: {
    nickname: 'El prodigio humano',
    movement: 4,
    health: 7,
    attributes: { strength: -1, agility: -1, wisdom: 2, willpower: 1 },
    attackDie: 'yellow',
    defenseDie: 'yellow',
    heroicAbility: {
      cost: { type: 'surge', amount: 1 },
      effect: `Añade 1${SUC} y puedes mover 1${FAT} de 1 carta a otra.`,
      armorHint: 'Armadura ligera',
    },
    faceA: {
      name: 'Potenciar',
      cost: { type: 'fatigue', amount: 1 },
      effect: `Después de tu tirada, convierte 1${ADV} en 2${SUC}.`,
      quote: 'Mis conocimientos eran suficientes. Ahora son eternos.',
      maxFatigue: 2,
    },
    faceB: {
      name: 'Vínculo con fénix',
      type: 'Fénix',
      cost: { type: 'action', amount: 1 },
      effect: `Un enemigo al que tengas línea de visión sufre 2${DMG} por cada ${FAT} que haya sobre esta carta. A continuación, dale la vuelta a esta carta.`,
      quote: 'Todavía no hemos alcanzado todo el potencial de nuestro vínculo...',
      maxFatigue: 3,
    },
  },

  HERO_GALADEN: {
    nickname: 'El cazador elfo',
    movement: 4,
    health: 9,
    attributes: { strength: 1, agility: 1, wisdom: -1, willpower: 0 },
    attackDie: 'blue',
    defenseDie: 'black',
    heroicAbility: {
      cost: { type: 'surge', amount: 1 },
      effect: `Añade 1${SUC}. A continuación, puedes sufrir 1${FAT} para aprestar una carta.`,
      armorHint: 'Armadura mediana',
    },
    faceA: {
      name: 'Jurar venganza',
      cost: { type: 'fatigue', amount: 3 },
      effect: 'Durante tu turno, expón a un enemigo al que tengas línea de visión.',
      quote: 'Un juramento cumplido, por mi vida o por la tuya.',
      maxFatigue: 3,
    },
    faceB: {
      name: 'Paso ligero',
      cost: { type: 'fatigue', amount: 1 },
      effect: 'Durante tu turno, realiza Desplazamiento 1.',
      quote: 'Mi familia ya no está, pero conservo sus enseñanzas.',
      maxFatigue: 2,
    },
  },

  HERO_VAERIX: {
    nickname: 'El híbrido de dragón exiliado',
    movement: 3,
    health: 8,
    attributes: { strength: -1, agility: 0, wisdom: 1, willpower: 2 },
    attackDie: 'blue',
    defenseDie: 'yellow',
    heroicAbility: {
      cost: { type: 'surge', amount: 1 },
      effect: `Añade 1${SUC} y cualquier héroe puede descartar 1 estado.`,
      armorHint: 'Armadura ligera o mediana',
    },
    faceA: {
      name: 'Alivio',
      type: 'Restablecimiento',
      cost: { type: 'fatigue', amount: 2 },
      effect: `Durante tu turno, tú o un héroe adyacente os curáis 2${HP}.`,
      quote: 'Nuestra labor no ha acabado. Tú y yo debemos sobrevivir.',
      maxFatigue: 3,
    },
    faceB: {
      name: 'Superviviente',
      cost: { type: 'fatigue', amount: 2 },
      effect: `Durante tu ataque, añade 1${SUR}.`,
      quote: 'Hay un fuego en el interior que ni siquiera yo puedo extinguir.',
      maxFatigue: 3,
    },
  },

  HERO_KEHLI: {
    nickname: 'La artífice enana',
    movement: 3,
    health: 9,
    attributes: { strength: 1, agility: -1, wisdom: 1, willpower: 1 },
    attackDie: 'black',
    defenseDie: 'yellow',
    heroicAbility: {
      cost: { type: 'surge', amount: 1 },
      effect: `Añade 1${SUC}. Si estás adyacente a una ficha, cofre, estantería o caldero, en vez de eso añade 2${SUC}.`,
      armorHint: 'Armadura mediana o pesada',
    },
    faceA: {
      name: 'Trampa astuta',
      cost: { type: 'fatigue', amount: 3 },
      effect: 'Antes de la activación de un enemigo, si está a 3 o menos casillas de ti, debilítalo y ralentízalo.',
      quote: '¡Voy por delante de ti!',
      maxFatigue: 3,
    },
    faceB: {
      name: 'Adaptable',
      cost: { type: 'fatigue', amount: 3 },
      effect: 'Durante tu turno, dale la vuelta a 1 carta.',
      quote: 'Espero, voy a probar con esto...',
      maxFatigue: 3,
    },
  },

  HERO_CHANCE: {
    nickname: 'El pícaro hyrrince',
    movement: 4,
    health: 8,
    attributes: { strength: 0, agility: 2, wisdom: 0, willpower: -1 },
    attackDie: 'blue',
    defenseDie: 'blue',
    heroicAbility: {
      cost: { type: 'surge', amount: 1 },
      effect: `Añade 2${SUC}.`,
      armorHint: 'Armadura ligera o mediana',
    },
    faceA: {
      name: 'Al acecho',
      cost: null,
      effect: 'Durante tu turno, puedes realizar Desplazamiento 1. Al final de tu turno, si no hay enemigos a 3 o menos casillas de ti, dale la vuelta a esta carta.',
      quote: 'Nunca me ven venir.',
      maxFatigue: 2,
    },
    faceB: {
      name: 'Hijo de la oscuridad',
      type: 'Sombra',
      cost: null,
      effect: `Antes de tu ataque o de tu defensa, debes darle la vuelta a una carta Sombra y añadir 1${SUC}.`,
      quote: null,
      maxFatigue: 1,
    },
  },
};
