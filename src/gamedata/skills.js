// Habilidades de héroe desbloqueables con XP de grupo
// Generado automáticamente por extract.py — no editar manualmente

export const SKILLS = [
  {
    "id": "SKILL_BRYNN_1",
    "heroId": "HERO_BRYNN",
    "order": 1,
    "xpCost": 1,
    "names": {
      "es": "Grito de apoyo / Grito de combate",
      "en": "Rallying Cry / Battle Cry",
      "fr": "Cri de ralliement / Cri de bataille",
      "it": "Grido di Riscossa / Grido di Battaglia",
      "pt": "Grito de Guerra / Grito de Batalha"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Liderazgo"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Dos héroes que estén a 3 o menos casillas de ti pueden aprestar 1 carta cada uno.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Liderazgo"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Dos héroes que estén a 3 o menos casillas de ti pueden concentrar 2 cartas cada uno.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_BRYNN_2",
    "heroId": "HERO_BRYNN",
    "order": 2,
    "xpCost": 1,
    "names": {
      "es": "Provocación / Medicina de campaña",
      "en": "Taunt / Field Medicine",
      "fr": "Bravade / Médecine militaire",
      "it": "Provocazione / Medicina da Campo",
      "pt": "Provocação / Medicina no Campo de Batalha"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Compañerismo",
          "Guardián"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante la activación de un enemigo, si está adyacente a ti, te conviertes en el objetivo. Durante tu defensa, añade 1<style=Term><link=TERM_SUCCESS></link></style>.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Mariscal"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Después de que derrotes a un enemigo, tú o un héroe adyacente podéis curaros 2<style=Term><link=TERM_HEALTH_DIAL></link></style>.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_BRYNN_3",
    "heroId": "HERO_BRYNN",
    "order": 3,
    "xpCost": 1,
    "names": {
      "es": "Presencia fortalecedora / Venganza justa",
      "en": "Bracing Presence / Righteous Vengeance",
      "fr": "Présence revigorante / Vengeance légitime",
      "it": "Presenza Rinvigorente / Vendetta dei Giusti",
      "pt": "Presença Encorajadora / Vingança Justa"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Compañerismo",
          "Liderazgo"
        ],
        "effect": "Durante el ataque o la defensa de otro héroe, si el enemigo está adyacente a ti, ese héroe puede convertir 1<style=Term><link=TERM_ADVANTAGE></link></style> en 1<style=Term><link=TERM_SUCCESS></link></style>.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Desafiante",
          "Mariscal",
          "Venganza"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Después de que otro héroe quede herido, puedes darle la vuelta a tu carta de Ataque. A continuación, puedes mover hasta 3 casillas y atacar.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_BRYNN_4",
    "heroId": "HERO_BRYNN",
    "order": 4,
    "xpCost": 1,
    "names": {
      "es": "Alivio / Corazón tenaz",
      "en": "Reprieve / Stout-Hearted",
      "fr": "Repos / Hardiesse",
      "it": "Sollievo / Cuore Saldo",
      "pt": "Perdão / Coração Robusto"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Mariscal"
        ],
        "effect": "Después de que derrotes a un enemigo, tú o un héroe adyacente podéis descartar 2<style=Term><link=TERM_FATIGUE></link></style>.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Agresión",
          "Desafiante",
          "Mariscal"
        ],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Durante tu ataque, si tu vida es 5 o menos, añade 1<style=Term><link=TERM_SUCCESS></link></style>. 1<style=Term><link=TERM_FATIGUE></link></style>: Durante tu ataque, si tienes una dolencia, añade 1<style=Term><link=TERM_SUCCESS></link></style>.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_BRYNN_5",
    "heroId": "HERO_BRYNN",
    "order": 5,
    "xpCost": 2,
    "names": {
      "es": "Remolino / Tácticas adaptables",
      "en": "Whirlwind / Adaptive Tactics",
      "fr": "Tourbillon / Tactiques d’adaptation",
      "it": "Turbine / Tattiche Versatili",
      "pt": "Redemoinho / Táticas Adaptativas"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Prisa"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Ataca a un enemigo. Ataca a otro enemigo. A continuación, dale la vuelta a esta carta.",
        "maxFatigue": 1
      },
      "faceB": {
        "tags": [
          "Táctico"
        ],
        "effect": "3<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, dale la vuelta a otra carta.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_BRYNN_6",
    "heroId": "HERO_BRYNN",
    "order": 6,
    "xpCost": 2,
    "names": {
      "es": "Combatiente motivador / Guardia vigilante",
      "en": "Inspiring Fighter / Vigilant Watch",
      "fr": "Combattant inspirant / Garde vigilante",
      "it": "Guerriero Ispiratore / Vigilanza Attenta",
      "pt": "Combatente Inspiradora / Guarda Vigilante"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Compañerismo",
          "Liderazgo",
          "Táctico"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Antes de tu ataque, otro héroe que esté a 3 o menos casillas de ti puede darle la vuelta a 1 carta.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Mariscal",
          "Venganza"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Antes de la activación de un enemigo, atácalo.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_BRYNN_7",
    "heroId": "HERO_BRYNN",
    "order": 7,
    "xpCost": 2,
    "names": {
      "es": "Coordinación / En la refriega",
      "en": "Coordination / Into the Fray",
      "fr": "Coordination / Dans la mêlée",
      "it": "Coordinamento / Nella Mischia",
      "pt": "Coordenação / Briga Adentro"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Compañerismo",
          "Liderazgo",
          "Movilidad"
        ],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Antes de que realices una maniobra, otro héroe puede realizar Desplazamiento 2.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Agresión"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, realiza Desplazamiento 1 hacia un enemigo que no esté adyacente a ti. A continuación, atácalo.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_BRYNN_8",
    "heroId": "HERO_BRYNN",
    "order": 8,
    "xpCost": 1,
    "names": {
      "es": "Resistencia firme / Interponerse",
      "en": "Stand Fast / Interpose",
      "fr": "Indélogeable / Barrage",
      "it": "Reazione Fulminea / Anticipazione",
      "pt": "Oposição Firme / Interposição"
    }
  },
  {
    "id": "SKILL_BRYNN_9",
    "heroId": "HERO_BRYNN",
    "order": 9,
    "xpCost": 2,
    "names": {
      "es": "Contramandoble / Desafío",
      "en": "Counterswing / Challenge",
      "fr": "Revers / Défi",
      "it": "Controfendente / Sfida",
      "pt": "Contragolpe / Desafio"
    }
  },
  {
    "id": "SKILL_BRYNN_10",
    "heroId": "HERO_BRYNN",
    "order": 10,
    "xpCost": 2,
    "names": {
      "es": "Oleada de colisión / Talla orgullosa",
      "en": "Crashing Wave / Proud Stature",
      "fr": "Déferlante / Tête haute",
      "it": "Spazzata Soverchiante / Portamento Fiero",
      "pt": "Onda Avassaladora / Estatura Soberba"
    }
  },
  {
    "id": "SKILL_BRYNN_11",
    "heroId": "HERO_BRYNN",
    "order": 11,
    "xpCost": 3,
    "names": {
      "es": "Recobrar el aliento / Dura de pelar",
      "en": "Second Wind / Diehard",
      "fr": "Second souffle / Dure à cuire",
      "it": "Nuova Energia / Duro a Morire",
      "pt": "Retomar o Fôlego / Dura na Queda"
    }
  },
  {
    "id": "SKILL_CHANCE_1",
    "heroId": "HERO_CHANCE",
    "order": 1,
    "xpCost": 1,
    "names": {
      "es": "Disfraz / Cuidadoso",
      "en": "Disguise / Careful",
      "fr": "Déguisement / Prudence",
      "it": "Travestimento / Prudenza",
      "pt": "Disfarce / Cuidado"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Sombra"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Intercambia casillas con otro héroe que esté a 5 o menos casillas de ti. A continuación, dale la vuelta a esta carta.",
        "maxFatigue": 1
      },
      "faceB": {
        "tags": [],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante tu defensa, añade 1<style=Term><link=TERM_SUCCESS></link></style>. Después de esta defensa, realiza Desplazamiento 1.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_CHANCE_2",
    "heroId": "HERO_CHANCE",
    "order": 2,
    "xpCost": 1,
    "names": {
      "es": "Furia / Golpe afortunado",
      "en": "Fury / Lucky Strike",
      "fr": "Fureur / Coup de bol",
      "it": "Furia / Colpo Fortunato",
      "pt": "Fúria / Golpe de Sorte"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión",
          "Sombra"
        ],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Durante tu ataque, si el enemigo es el único enemigo a 3 o menos casillas, añade 1<style=Term><link=TERM_SUCCESS></link></style>.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Agresión"
        ],
        "effect": "Durante tu ataque, puedes convertir 1<style=Term><link=TERM_ADVANTAGE></link></style> en 1<style=Term><link=TERM_SUCCESS></link></style>.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_CHANCE_3",
    "heroId": "HERO_CHANCE",
    "order": 3,
    "xpCost": 1,
    "names": {
      "es": "Prestidigitación / Furtivo",
      "en": "Sleight of Hand / Shifty",
      "fr": "Tour de passe-passe / Dérobade",
      "it": "Rapidità di Mano / Elusività",
      "pt": "Passe de Mágica / Ardil"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Sombra"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Después de tu tirada, repite la tirada de 1 dado.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Movilidad"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, realiza Desplazamiento 1. 2<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, realiza Desplazamiento 1.",
        "maxFatigue": 4
      }
    }
  },
  {
    "id": "SKILL_CHANCE_4",
    "heroId": "HERO_CHANCE",
    "order": 4,
    "xpCost": 1,
    "names": {
      "es": "Distracción / Planes ocultos",
      "en": "Distraction / Hidden Plans",
      "fr": "Distraction / Plan secret",
      "it": "Distrazione / Piani Nascosti",
      "pt": "Distração / Planos Secretos"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Compañerismo",
          "Movilidad"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno o el de otro héroe, si estás adyacente a un enemigo, otro héroe puede realizar Desplazamiento 2 hacia ese enemigo.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Sombra",
          "Táctico"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Al final de tu turno, si no hay enemigos a 3 o menos casillas de ti, dale la vuelta a 1 carta.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_CHANCE_5",
    "heroId": "HERO_CHANCE",
    "order": 5,
    "xpCost": 2,
    "names": {
      "es": "Solapado / Mano de la fortuna",
      "en": "Underhanded / Hand of Fortune",
      "fr": "Sournoiserie / Aubaine inespérée",
      "it": "Sporco Trucco / Mano del Fato",
      "pt": "Dissimulação / Toque de Sorte"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión",
          "Sombra"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Antes de tu ataque, añade 1 dado naranja. Después de este ataque, si tienes 2 o más cartas Sombra, descarta 1<style=Term><link=TERM_FATIGUE></link></style>.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Movilidad"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Desplazamiento 2. Si tienes una carta Sombra, Desplazamiento 4 en su lugar. A continuación, interactúa.",
        "maxFatigue": 1
      }
    }
  },
  {
    "id": "SKILL_CHANCE_6",
    "heroId": "HERO_CHANCE",
    "order": 6,
    "xpCost": 2,
    "names": {
      "es": "Desde las sombras / Colarse",
      "en": "Out of the Shadows / Slip Through",
      "fr": "Jaillissement / Faux-fuyant",
      "it": "Fuori dalle Ombre / Inafferrabilità",
      "pt": "Surgir das Sombras / Escapulida"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión",
          "Venganza"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Después de la activación de un enemigo, atácalo. Si tienes una carta Sombra, reduce el coste de esta capacidad en 1<style=Term><link=TERM_FATIGUE></link></style>.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Movilidad",
          "Sombra"
        ],
        "effect": "Cuando obtengas puntos de movimiento, ignora la obstaculización. 1<style=Term><link=TERM_FATIGUE></link></style>: Antes de que quedes obstaculizado, no quedas obstaculizado.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_CHANCE_7",
    "heroId": "HERO_CHANCE",
    "order": 7,
    "xpCost": 2,
    "names": {
      "es": "Hoja oculta / Planes de contingencia",
      "en": "Hidden Blade / Contingency Plans",
      "fr": "Lame secrète / Plan B",
      "it": "Lama Nascosta / Piani di Emergenza",
      "pt": "Arma Escondida / Plano de Contingência"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Sombra",
          "Táctico"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, dale la vuelta a tu carta de Ataque. A continuación, concéntrala.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, si no tienes cartas Sombra, apresta 1 carta.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_CHANCE_8",
    "heroId": "HERO_CHANCE",
    "order": 8,
    "xpCost": 1,
    "names": {
      "es": "Sombras titilantes / Gelidez agotadora",
      "en": "Flickering Shadows / Draining Chill",
      "fr": "Ombres vacillantes / Frisson drainant",
      "it": "Ombre Mutevoli / Gelo Risucchiante",
      "pt": "Sombras Tremulantes / Calafrio Enlanguescedor"
    }
  },
  {
    "id": "SKILL_CHANCE_9",
    "heroId": "HERO_CHANCE",
    "order": 9,
    "xpCost": 2,
    "names": {
      "es": "Desplazamiento oscuro / Descarga de umbra",
      "en": "Dark Shift / Umbral Burst",
      "fr": "Glissement ténébreux / Éruption d'Umbros",
      "it": "Scatto Oscuro / Esplosione Ombratile",
      "pt": "Deslocamento no Escuro / Erupção Umbrática"
    }
  },
  {
    "id": "SKILL_CHANCE_10",
    "heroId": "HERO_CHANCE",
    "order": 10,
    "xpCost": 2,
    "names": {
      "es": "Manos de noche / Hojas de noche",
      "en": "Hands of Night / Blades of Night",
      "fr": "Mains de nuit / Lames de nuit",
      "it": "Mani della Notte / Lame della Notte",
      "pt": "Mãos da Noite / Lâminas da Noite"
    }
  },
  {
    "id": "SKILL_CHANCE_11",
    "heroId": "HERO_CHANCE",
    "order": 11,
    "xpCost": 3,
    "names": {
      "es": "Vacío infinito / Al acecho",
      "en": "Endless Void / Lie in Wait",
      "fr": "Vide insondable / Calme plat",
      "it": "Vuoto Infinito / In Agguato",
      "pt": "Vazio Infinito / À Espera"
    }
  },
  {
    "id": "SKILL_GALADEN_1",
    "heroId": "HERO_GALADEN",
    "order": 1,
    "xpCost": 1,
    "names": {
      "es": "Savia de madera sangrienta / Cazador avezado",
      "en": "Bloodwood Sap / Seasoned Hunter",
      "fr": "Sève de bois sanglant / Chasseur émérite",
      "it": "Linfa di Legnosangue / Cacciatore Veterano",
      "pt": "Seiva de Madeira Sanguínea / Experiente na Caça"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante tu ataque, aflige o conmociona al enemigo. Si has sacado un<style=Term><link=TERM_SURGE></link></style>, aplica ambos estados.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Agresión"
        ],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Durante tu ataque, ignora la capacidad del enemigo si es posible.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_GALADEN_2",
    "heroId": "HERO_GALADEN",
    "order": 2,
    "xpCost": 1,
    "names": {
      "es": "Pericia / Fluidez",
      "en": "Prowess / Flow",
      "fr": "Prouesse / Fluidité",
      "it": "Prodezza / Fluidità",
      "pt": "Proeza / Fluxo"
    },
    "cardDetails": {
      "faceA": {
        "tags": [],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Después de tu tirada, si has sacado un<style=Term><link=TERM_SURGE></link></style>, añade 1<style=Term><link=TERM_SUCCESS></link></style>.",
        "maxFatigue": 1
      },
      "faceB": {
        "tags": [],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Después de que le des la vuelta a una carta, concéntrala.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_GALADEN_3",
    "heroId": "HERO_GALADEN",
    "order": 3,
    "xpCost": 1,
    "names": {
      "es": "Toxina de raíz negra / Voltereta hacia atrás",
      "en": "Blackroot Toxin / Backflip",
      "fr": "Toxine de cytise / Salto arrière",
      "it": "Tossina di Neradice / Salto all'Indietro",
      "pt": "Toxina de Raiz Negra / Salto Mortal"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión",
          "Veneno"
        ],
        "effect": "3<style=Term><link=TERM_FATIGUE></link></style>: Durante tu ataque, debilita o ralentiza al enemigo. Si has sacado un<style=Term><link=TERM_SURGE></link></style>, aplica ambos estados.",
        "maxFatigue": 4
      },
      "faceB": {
        "tags": [
          "Guardián",
          "Táctico"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante tu defensa, añade 1<style=Term><link=TERM_SUCCESS></link></style> e ignora la capacidad del enemigo si es posible. Después de esta defensa, muévete 1 casilla alejándote del enemigo y dale la vuelta a 1 carta.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_GALADEN_4",
    "heroId": "HERO_GALADEN",
    "order": 4,
    "xpCost": 1,
    "names": {
      "es": "Deliberar / Precisión",
      "en": "Confer / Precision",
      "fr": "Conciliabule / Précision",
      "it": "Consultazione / Precisione",
      "pt": "Conferência / Precisão"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Compañerismo"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Tú y un héroe adyacente podéis aprestar 1 carta cada uno.",
        "maxFatigue": 0
      },
      "faceB": {
        "tags": [],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Después de tu tirada, si no has sacado un<style=Term><link=TERM_SURGE></link></style>, añade 1<style=Term><link=TERM_SURGE></link></style>.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_GALADEN_5",
    "heroId": "HERO_GALADEN",
    "order": 5,
    "xpCost": 2,
    "names": {
      "es": "Reacción rápida / Flanquear",
      "en": "Quickdraw / Outflank",
      "fr": "Dégainement rapide / Débordement",
      "it": "Estrazione Rapida / Accerchiamento",
      "pt": "Reação Rápida / Ataque pela Retaguarda"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión",
          "Prisa"
        ],
        "effect": "3<style=Term><link=TERM_FATIGUE></link></style>: Después de tu ataque, dale la vuelta a tu carta de Ataque. A continuación, ataca a otro enemigo.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Compañerismo"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Antes del ataque de otro héroe, si el enemigo está al alcance de tu arma, ese héroe puede añadir 1 dado azul.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_GALADEN_6",
    "heroId": "HERO_GALADEN",
    "order": 6,
    "xpCost": 2,
    "names": {
      "es": "Floritura / Juego de pies",
      "en": "Flourish / Footwork",
      "fr": "Épanouissement / Jeu de jambes",
      "it": "Virtuosismo / Gioco di Gambe",
      "pt": "Floreio / Pés Ágeis"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión"
        ],
        "effect": "Durante tu ataque, puedes añadir 1<style=Term><link=TERM_SUCCESS></link></style> por cada una de tus cartas aprestadas. Si lo haces, después del ataque, dale la vuelta a cada una de tus cartas aprestadas.",
        "maxFatigue": 0
      },
      "faceB": {
        "tags": [],
        "effect": "Durante tu turno, puedes gastar 1 punto de movimiento para concentrar 1 carta o bien gastar 3 puntos de movimiento para aprestar 1 carta.",
        "maxFatigue": 0
      }
    }
  },
  {
    "id": "SKILL_GALADEN_7",
    "heroId": "HERO_GALADEN",
    "order": 7,
    "xpCost": 2,
    "names": {
      "es": "Última gracia / Sombra de la muerte",
      "en": "Last Mercy / Death's Shadow",
      "fr": "Ultime clémence / Ombre de la mort",
      "it": "Atto di Misericordia / Ombra della Morte",
      "pt": "Clemência Final / Sombra da Morte"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Ataca a un enemigo. Añade 1<style=Term><link=TERM_SUCCESS></link></style> por cada estado que tenga el enemigo. Después de este ataque, dale la vuelta a esta carta.",
        "maxFatigue": 1
      },
      "faceB": {
        "tags": [
          "Agresión",
          "Sombra"
        ],
        "effect": "Durante tu ataque, si el enemigo tiene un estado, añade 1<style=Term><link=TERM_SURGE></link></style>. 1<style=Term><link=TERM_SURGE></link></style>: Durante tu ataque, condena al enemigo.",
        "maxFatigue": 0
      }
    }
  },
  {
    "id": "SKILL_GALADEN_8",
    "heroId": "HERO_GALADEN",
    "order": 8,
    "xpCost": 1,
    "names": {
      "es": "Inquebrantable / Veneno de flor gemela",
      "en": "Unwavering / Twin-Bloom Venom",
      "fr": "Indéfectible / Venin de fleur géminée",
      "it": "Risoluto / Veleno del Doppio Germoglio",
      "pt": "Inabalável / Veneno de Geminiflor"
    }
  },
  {
    "id": "SKILL_GALADEN_9",
    "heroId": "HERO_GALADEN",
    "order": 9,
    "xpCost": 2,
    "names": {
      "es": "Aprovechar el momento / Instinto de cazador",
      "en": "Seize the Moment / Hunter's Instinct",
      "fr": "Attaque d'opportunité / Instinct du chasseur",
      "it": "Cogliere l'Attimo / Istinto del Cacciatore",
      "pt": "Aproveitar o Momento / Instinto de Caçador"
    }
  },
  {
    "id": "SKILL_GALADEN_10",
    "heroId": "HERO_GALADEN",
    "order": 10,
    "xpCost": 2,
    "names": {
      "es": "Respiración controlada / Ataque insistente",
      "en": "Controlled Breathing / Press the Attack",
      "fr": "Respiration contrôlée / À l'offensive",
      "it": "Respirazione Controllata / Attacco Incalzante",
      "pt": "Respiração Controlada / Acirramento do Ataque"
    }
  },
  {
    "id": "SKILL_GALADEN_11",
    "heroId": "HERO_GALADEN",
    "order": 11,
    "xpCost": 3,
    "names": {
      "es": "Viento de hojas / Precisión minuciosa",
      "en": "Wind of Blades / Pinpoint Targeting",
      "fr": "Rafale de lames / Cible verrouillée",
      "it": "Tempesta di Lame / Bersaglio Mirato",
      "pt": "Vendaval de Lâminas / Mira Precisa"
    }
  },
  {
    "id": "SKILL_KEHLI_1",
    "heroId": "HERO_KEHLI",
    "order": 1,
    "xpCost": 1,
    "names": {
      "es": "Prueba esto / Prueba eso",
      "en": "Try This / Try That",
      "fr": "Premier essai / Deuxième essai",
      "it": "Prova Questo / Prova Quello",
      "pt": "Tente Isso / Tente Aquilo"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Innovación"
        ],
        "effect": "CARGA: Apresta 2. Antes de tu prueba, debes descartar 1 ficha de Presteza de esta carta para añadir 2<style=Term><link=TERM_SUCCESS></link></style>.",
        "maxFatigue": 0
      },
      "faceB": {
        "tags": [
          "Inspiración"
        ],
        "effect": "REVELACIÓN: Dale esta carta a Kehli. 1<style=Term><link=TERM_ACTIONS></link></style>: Puedes darle esta carta a un héroe adyacente. A continuación, dale la vuelta a esta carta.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_KEHLI_2",
    "heroId": "HERO_KEHLI",
    "order": 2,
    "xpCost": 1,
    "names": {
      "es": "¡Lo he arreglado! / ¿Otra vez?",
      "en": "Fixed It! / Again?",
      "fr": "C’est réparé ! / Encore ?",
      "it": "Riparato! / Ancora?",
      "pt": "Consertei! / De Novo?"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión",
          "Innovación"
        ],
        "effect": "CARGA: Concentra 3. Antes de tu ataque, debes descartar 1 ficha de Concentración de esta carta para añadir 1<style=Term><link=TERM_SUCCESS></link></style>.",
        "maxFatigue": 0
      },
      "faceB": {
        "tags": [
          "Inspiración"
        ],
        "effect": "REVELACIÓN: Dale esta carta a Kehli. 1<style=Term><link=TERM_ACTIONS></link></style>: Puedes darle esta carta a un héroe adyacente. A continuación, dale la vuelta a esta carta.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_KEHLI_3",
    "heroId": "HERO_KEHLI",
    "order": 3,
    "xpCost": 1,
    "names": {
      "es": "Yo me encargo / Petición de cautela",
      "en": "I Got This / A Word of Caution",
      "fr": "Je m’en occupe / Un petit conseil",
      "it": "Ci Penso Io / Solo un Avvertimento",
      "pt": "Deixa Comigo / Dica Amiga"
    },
    "cardDetails": {
      "faceA": {
        "tags": [],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Durante tu prueba, añade 1<style=Term><link=TERM_SUCCESS></link></style> por cada<style=Term><link=TERM_FATIGUE></link></style> que haya sobre esta carta.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Antes de que un héroe interactúe, si está a 3 o menos casillas de ti, puede concentrar 1 carta.",
        "maxFatigue": 1
      }
    }
  },
  {
    "id": "SKILL_KEHLI_4",
    "heroId": "HERO_KEHLI",
    "order": 4,
    "xpCost": 1,
    "names": {
      "es": "Hagamos eso otra vez / No me arredro",
      "en": "Let's Do That Again / Can't Keep Me Down",
      "fr": "C’est reparti / Ne me sous-estimez pas",
      "it": "Rifacciamolo / Nessuno Mi Ferma",
      "pt": "Vamos Fazer Aquilo de Novo / Nada Me Segura"
    },
    "cardDetails": {
      "faceA": {
        "tags": [],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Después de que interactúes, descarta 2<style=Term><link=TERM_FATIGUE></link></style> de otra carta.",
        "maxFatigue": 1
      },
      "faceB": {
        "tags": [
          "Restablecimiento"
        ],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Antes de que interactúes, cúrate 1<style=Term><link=TERM_HEALTH_DIAL></link></style>.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_KEHLI_5",
    "heroId": "HERO_KEHLI",
    "order": 5,
    "xpCost": 2,
    "names": {
      "es": "Forjacertera / Saquillo de polvo estelar",
      "en": "Trueforged / Pouch of Stardust",
      "fr": "Chef d'œuvre / Bourse de poussière d’étoiles",
      "it": "Forgiatura Pura / Borsa di Polvere di Stelle",
      "pt": "Forja Artesanal / Bolsinha de Pó Estelar"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión",
          "Maestría"
        ],
        "effect": "Durante tu ataque, puedes descartar 4<style=Term><link=TERM_FATIGUE></link></style> de esta carta. Si lo haces, añade 1<style=Term><link=TERM_SUCCESS></link></style>. 1<style=Term><link=TERM_FATIGUE></link></style>: Descarta toda la<style=Term><link=TERM_FATIGUE></link></style> de tu carta de Ataque. Sufre esa cantidad de<style=Term><link=TERM_FATIGUE></link></style> sobre esta carta.",
        "maxFatigue": 4
      },
      "faceB": {
        "tags": [
          "Explosivo"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Elige 1 casilla que esté a 5 o menos casillas de ti y a la que tengas línea de visión. Conmociona, debilita, expón y ralentiza a cada enemigo que esté en esa casilla o adyacente a ella. A continuación, dale la vuelta a esta carta.",
        "maxFatigue": 1
      }
    }
  },
  {
    "id": "SKILL_KEHLI_6",
    "heroId": "HERO_KEHLI",
    "order": 6,
    "xpCost": 2,
    "names": {
      "es": "Brebaje improvisado / Aprovechar el momento",
      "en": "Improvised Concoction / While the Iron's Hot",
      "fr": "Mixture improvisée / Tant que le fer est chaud",
      "it": "Mistura Improvvisata / Finché il Ferro è Caldo",
      "pt": "Poção Improvisada / Enquanto o Ferro Está Quente"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Explosivo"
        ],
        "effect": "4<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, descarta hasta 1 de cada tipo de estado. Un enemigo que esté a 3 o menos casillas de ti sufre 6<style=Term><link=TERM_DAMAGE></link></style>. Reduce el coste de esta capacidad en 1<style=Term><link=TERM_FATIGUE></link></style> por cada estado descartado.",
        "maxFatigue": 4
      },
      "faceB": {
        "tags": [
          "Prisa"
        ],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, después de tu ataque, interactúa.",
        "maxFatigue": 1
      }
    }
  },
  {
    "id": "SKILL_KEHLI_7",
    "heroId": "HERO_KEHLI",
    "order": 7,
    "xpCost": 2,
    "names": {
      "es": "Elementos inestables / Diseño arriesgado",
      "en": "Unstable Elements / Risky Design",
      "fr": "Particules instables / Croquis hasardeux",
      "it": "Elementi Instabili / Progetto Rischioso",
      "pt": "Elementos Instáveis / Disposição Arriscada"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Explosivo",
          "Innovación"
        ],
        "effect": "CARGA: Apresta 3. Antes de tu ataque, debes descartar 1 ficha de Presteza de esta carta para añadir un dado de tu elección. Cuando gastes resultados, si ese dado no sacó ningún<style=Term><link=TERM_SURGE></link></style>, sufre 1<style=Term><link=TERM_DAMAGE></link></style> y dale la vuelta a esta carta.",
        "maxFatigue": 0
      },
      "faceB": {
        "tags": [
          "Inspiración"
        ],
        "effect": "REVELACIÓN: Dale esta carta a Kehli. 1<style=Term><link=TERM_ACTIONS></link></style>: Puedes darle esta carta a un héroe adyacente. A continuación, dale la vuelta a esta carta.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_KEHLI_8",
    "heroId": "HERO_KEHLI",
    "order": 8,
    "xpCost": 1,
    "names": {
      "es": "Momento de genialidad / Aprovecharlo para piezas",
      "en": "Stroke of Genius / Strip it for Parts",
      "fr": "Coup de génie / Pièces détachées",
      "it": "Colpo di Genio / Recupero Componenti",
      "pt": "Rasgo de Genialidade / Desmanche"
    }
  },
  {
    "id": "SKILL_KEHLI_9",
    "heroId": "HERO_KEHLI",
    "order": 9,
    "xpCost": 2,
    "names": {
      "es": "Constructo de escudo / Tuercas y tornillos",
      "en": "Shield Construct / Nuts and Bolts",
      "fr": "Bouclier de fortune / De vis et d'écrous",
      "it": "Costrutto Schermante / Dadi e Bulloni",
      "pt": "Constructo de Proteção / Porcas e Parafusos"
    }
  },
  {
    "id": "SKILL_KEHLI_10",
    "heroId": "HERO_KEHLI",
    "order": 10,
    "xpCost": 2,
    "names": {
      "es": "Centinela lanzafuego / Con cuatro cosas",
      "en": "Fire-Thrower Sentry / Spit and Baling Wire",
      "fr": "Sentinelle pyromane / De bric et de broc",
      "it": "Sentinella Sputafuoco / Assemblaggio di Fortuna",
      "pt": "Sentinela Lança-chamas / Cuspe e Arame"
    }
  },
  {
    "id": "SKILL_KEHLI_11",
    "heroId": "HERO_KEHLI",
    "order": 11,
    "xpCost": 3,
    "names": {
      "es": "Reserva temporal / Por probar...",
      "en": "Temporal Reservoir / A Hope and a Prayer",
      "fr": "Réservoir temporel / Une bonne dose d'optimisme",
      "it": "Riserva Temporale / Speranze e Preghiere",
      "pt": "Reservatório Temporal / Esperança e Reza Brava"
    }
  },
  {
    "id": "SKILL_SYRUS_1",
    "heroId": "HERO_SYRUS",
    "order": 1,
    "xpCost": 1,
    "names": {
      "es": "Dolor compartido / Energía compartida",
      "en": "Shared Pain / Shared Energy",
      "fr": "Douleur mutuelle / Énergie mutuelle",
      "it": "Dolore Condiviso / Energia Condivisa",
      "pt": "Dor Compartihada / Energia Compartihada"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Fénix",
          "Restablecimiento"
        ],
        "effect": "1<style=Term><link=TERM_SURGE></link></style>: Cúrate 1<style=Term><link=TERM_HEALTH_DIAL></link></style> por cada<style=Term><link=TERM_FATIGUE></link></style> que haya sobre esta carta. A continuación, dale la vuelta a esta carta.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Fénix"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Concentra 1 carta por cada<style=Term><link=TERM_FATIGUE></link></style> que haya sobre esta carta. A continuación, dale la vuelta a esta carta.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_SYRUS_2",
    "heroId": "HERO_SYRUS",
    "order": 2,
    "xpCost": 1,
    "names": {
      "es": "Oleada de frío / Alas de viento",
      "en": "Cold Snap / Wings of Wind",
      "fr": "Vague de froid / Ailes du vent",
      "it": "Morsa del Freddo / Ali del Vento",
      "pt": "Frente Fria / Pé de Vento"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Origen celestial"
        ],
        "effect": "3<style=Term><link=TERM_FATIGUE></link></style>: Al final de tu turno, ralentiza a un enemigo al que tengas línea de visión.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Origen celestial"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Mueve un enemigo u otro héroe alejándolo 1 casilla de ti por cada<style=Term><link=TERM_FATIGUE></link></style> que haya sobre esta carta. A continuación, descarta toda la<style=Term><link=TERM_FATIGUE></link></style> de esta carta.",
        "maxFatigue": 1
      }
    }
  },
  {
    "id": "SKILL_SYRUS_3",
    "heroId": "HERO_SYRUS",
    "order": 3,
    "xpCost": 1,
    "names": {
      "es": "Búsqueda de conocimiento / A punto de obtener un logro",
      "en": "Pursuit of Knowledge / Verge of Breakthrough",
      "fr": "Recherche de savoir / Progrès imminent",
      "it": "Ricerca della Conoscenza / Scoperta Vantaggiosa",
      "pt": "Busca pelo Conhecimento / À Beira do Colapso"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Restablecimiento"
        ],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Después de que interactúes, descarta 1<style=Term><link=TERM_FATIGUE></link></style> de otra carta.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Restablecimiento"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Después de que interactúes, cúrate 1<style=Term><link=TERM_HEALTH_DIAL></link></style> y concentra 1 carta.",
        "maxFatigue": 1
      }
    }
  },
  {
    "id": "SKILL_SYRUS_4",
    "heroId": "HERO_SYRUS",
    "order": 4,
    "xpCost": 1,
    "names": {
      "es": "Grito de fénix / Llamas y furia",
      "en": "Phoenix Cry / Flames and Fury",
      "fr": "Cri de phénix / Flammes et fureur",
      "it": "Grido della Fenice / Fiamme e Furia",
      "pt": "Canto da Fênix / Chamas e Fúria"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Origen llameante",
          "Fénix"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, un enemigo al que tengas línea de visión sufre 1<style=Term><link=TERM_DAMAGE></link></style> por cada una de tus cartas Fénix. A continuación, aflige a ese enemigo.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Origen llameante",
          "Fénix"
        ],
        "effect": "1<style=Term><link=TERM_SURGE></link></style>: Durante tu ataque o tu defensa, añade 1<style=Term><link=TERM_SUCCESS></link></style> por cada una de tus cartas Fénix. A continuación, dale la vuelta a esta carta.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_SYRUS_5",
    "heroId": "HERO_SYRUS",
    "order": 5,
    "xpCost": 2,
    "names": {
      "es": "Unidos en combate / Vínculo sincrónico",
      "en": "Bound in Battle / Synchronous Bond",
      "fr": "Lien de bataille / Lien synchrone",
      "it": "Legame in Battaglia / Legame Sincronico",
      "pt": "Conexão em Batalha / Vínculo Sincronizado"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Fénix"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Antes de tu ataque o de tu defensa, añade 1 dado naranja.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Fénix"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Antes de tu ataque o de tu defensa, añade 1 dado azul.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_SYRUS_6",
    "heroId": "HERO_SYRUS",
    "order": 6,
    "xpCost": 2,
    "names": {
      "es": "Compañero útil / Compañero comprometido",
      "en": "Helpful Companion / Sworn Companion",
      "fr": "Compagnon serviable /Compagnon loyal",
      "it": "Compagno Premuroso / Compagno Giurato",
      "pt": "Companheira Prestativa / Companheira Jurada"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Fénix"
        ],
        "effect": "3<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, interactúa.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Origen mortal",
          "Desafiante",
          "Fénix"
        ],
        "effect": "3<style=Term><link=TERM_FATIGUE></link></style>: Antes de que quedes herido, en vez de eso fija tu vida en 3.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_SYRUS_7",
    "heroId": "HERO_SYRUS",
    "order": 7,
    "xpCost": 2,
    "names": {
      "es": "Invocar el relámpago / Intercesión de la oscuridad",
      "en": "Invoke Lightning / Entreat Darkness",
      "fr": "Invocation de foudre / Conjuration des ténèbres",
      "it": "Invocazione del Fulmine / Supplica all'Oscurità",
      "pt": "Invocação do Relâmpago / Escuridão Suplicante"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Origen celestial"
        ],
        "effect": "3<style=Term><link=TERM_FATIGUE></link></style>: Elige una casilla a la que tengas línea de visión. Cada enemigo en esa casilla o adyacente a ella sufre 3<style=Term><link=TERM_DAMAGE></link></style>. Si tienes otra carta Origen celestial, conmociona a cada uno de esos enemigos.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [
          "Origen mortal",
          "Sombra"
        ],
        "effect": "3<style=Term><link=TERM_FATIGUE></link></style>: Antes de la activación de un enemigo, si está en línea de visión, reduce su velocidad, alcance y daño en 2.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_SYRUS_8",
    "heroId": "HERO_SYRUS",
    "order": 8,
    "xpCost": 1,
    "names": {
      "es": "Cobertura de nubes / Magnetismo",
      "en": "Cloud Cover / Magnetism",
      "fr": "Couverture nuageuse / Magnétisme",
      "it": "Nube di Copertura / Magnetismo",
      "pt": "Cobertura de Nuvens / Magnetismo"
    }
  },
  {
    "id": "SKILL_SYRUS_9",
    "heroId": "HERO_SYRUS",
    "order": 9,
    "xpCost": 2,
    "names": {
      "es": "Explosión vinculada / Esfuerzo conjunto",
      "en": "Bonded Blast / Concerted Effort",
      "fr": "Lien explosif / Effort conjugué",
      "it": "Scarica Vincolata / Sforzo Concertato",
      "pt": "Rajada Vinculada / Esforço Conjunto"
    }
  },
  {
    "id": "SKILL_SYRUS_10",
    "heroId": "HERO_SYRUS",
    "order": 10,
    "xpCost": 2,
    "names": {
      "es": "Alimentarse de la vida / Alimentarse del fuego",
      "en": "Feed on Life / Feed on Fire",
      "fr": "Festin de vie / Festin de feu",
      "it": "Nutrirsi della Vita / Nutrirsi del Fuoco",
      "pt": "Alimentar-se da Vida / Alimentar-se do Fogo"
    }
  },
  {
    "id": "SKILL_SYRUS_11",
    "heroId": "HERO_SYRUS",
    "order": 11,
    "xpCost": 3,
    "names": {
      "es": "Fulgor de amistad de fénix / Unidad de amistad de fénix",
      "en": "Phoenix Friendship Flare / Phoenix Friendship Unity",
      "fr": "Amitié flamboyante du phénix / Amitié unificatrice du phénix",
      "it": "Vampata della Fenice / Unità della Fenice",
      "pt": "Labaredas Benignas da Fênix / Harmonia Benigna da Fênix"
    }
  },
  {
    "id": "SKILL_VAERIX_1",
    "heroId": "HERO_VAERIX",
    "order": 1,
    "xpCost": 1,
    "names": {
      "es": "Llamada del destino / Abrazo del sino",
      "en": "Destiny's Call / Fate's Embrace",
      "fr": "Appel du destin / Étreinte du destin",
      "it": "Appello del Destino / Abbraccio del Fato",
      "pt": "Chamado do Destino / Abraço do Destino"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión",
          "Juramento",
          "Sombra"
        ],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Durante tu ataque o el de otro héroe, condena al enemigo.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Agresión",
          "Sombra"
        ],
        "effect": "1<style=Term><link=TERM_ACTIONS></link></style>: Ataca a un enemigo. Durante el ataque, añade 2<style=Term><link=TERM_SUCCESS></link></style>. Después de este ataque, dale la vuelta a esta carta.",
        "maxFatigue": 1
      }
    }
  },
  {
    "id": "SKILL_VAERIX_2",
    "heroId": "HERO_VAERIX",
    "order": 2,
    "xpCost": 1,
    "names": {
      "es": "Enfermedad pasajera / Cataplasma",
      "en": "Passing Illness / Poultice",
      "fr": "Malaise passager / Cataplasme",
      "it": "Malessere Passeggero / Cataplasma",
      "pt": "Doença Transmissível / Emplastro"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Restablecimiento"
        ],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Después de que un héroe descarte un estado, se cura 1<style=Term><link=TERM_HEALTH_DIAL></link></style>.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Compañerismo"
        ],
        "effect": "3<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, tú o un héroe adyacente descartáis todos los estados de 1 mismo tipo.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_VAERIX_3",
    "heroId": "HERO_VAERIX",
    "order": 3,
    "xpCost": 1,
    "names": {
      "es": "Propósito más elevado / Llamada a la grandeza",
      "en": "Greater Purpose / Call to Greatness",
      "fr": "Cause transcendante / Incitation à la grandeur",
      "it": "Scopo Superiore / Appello alla Grandezza",
      "pt": "Propósito Maior / Chamado à Grandeza"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Compañerismo",
          "Juramento"
        ],
        "effect": "1<style=Term><link=TERM_SURGE></link></style>: Añade 2<style=Term><link=TERM_SUCCESS></link></style>. Otro héroe puede mover 1 estado de 1 de sus cartas a otra de sus cartas.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Compañerismo"
        ],
        "effect": "1<style=Term><link=TERM_SURGE></link></style>: Añade 2<style=Term><link=TERM_SUCCESS></link></style>. Otro héroe puede descartar 1<style=Term><link=TERM_FATIGUE></link></style>.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_VAERIX_4",
    "heroId": "HERO_VAERIX",
    "order": 4,
    "xpCost": 1,
    "names": {
      "es": "Alentar / Envalentonar",
      "en": "Encourage / Embolden",
      "fr": "Encouragement / Exhortation",
      "it": "Incoraggiamento / Esaltazione",
      "pt": "Encorajamento / Incentivo"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Compañerismo"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Durante la prueba de otro héroe, si está a 3 o menos casillas de ti, puede añadir 1<style=Term><link=TERM_SUCCESS></link></style>.",
        "maxFatigue": 2
      },
      "faceB": {
        "tags": [
          "Compañerismo"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Antes del ataque de otro héroe, si está a 3 o menos casillas de ti, puede concentrar 1 carta.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_VAERIX_5",
    "heroId": "HERO_VAERIX",
    "order": 5,
    "xpCost": 2,
    "names": {
      "es": "Consuelo / Resiliencia",
      "en": "Reassurance / Resilience",
      "fr": "Réconfort / Résistance",
      "it": "Rassicurazione / Resilienza",
      "pt": "Segurança / Resiliência"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Restablecimiento"
        ],
        "effect": "Los héroes que estén a 3 o menos casillas de ti tienen: 1<style=Term><link=TERM_SURGE></link></style>: Añade 2<style=Term><link=TERM_SUCCESS></link></style> y cúrate 1<style=Term><link=TERM_HEALTH_DIAL></link></style>.",
        "maxFatigue": 1
      },
      "faceB": {
        "tags": [
          "Desafiante"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Después de que un héroe que esté a 3 o menos casillas de ti sufra<style=Term><link=TERM_DAMAGE></link></style>, puede concentrar y aprestar 1 carta. 2<style=Term><link=TERM_FATIGUE></link></style>: Antes de que un héroe que esté a 3 o menos casillas de ti quede herido, puede concentrar y aprestar 3 cartas.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_VAERIX_6",
    "heroId": "HERO_VAERIX",
    "order": 6,
    "xpCost": 2,
    "names": {
      "es": "Metodología mejorada / Palabras amables",
      "en": "Improved Methodology / Kind Words",
      "fr": "Méthodologie perfectionnée / Mots gentils",
      "it": "Metodologia Migliorata / Parole Benevole",
      "pt": "Metodologia Melhorada / Palavras Gentis"
    },
    "cardDetails": {
      "faceA": {
        "tags": [],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Después de que uses una capacidad de una carta Restablecimiento, un héroe que se haya curado<style=Term><link=TERM_HEALTH_DIAL></link></style> se cura 2<style=Term><link=TERM_HEALTH_DIAL></link></style> adicionales.",
        "maxFatigue": 3
      },
      "faceB": {
        "tags": [],
        "effect": "1<style=Term><link=TERM_FATIGUE></link></style>: Después de que uses una capacidad de una carta Restablecimiento, un héroe que se haya curado<style=Term><link=TERM_HEALTH_DIAL></link></style> descarta 2<style=Term><link=TERM_FATIGUE></link></style>.",
        "maxFatigue": 2
      }
    }
  },
  {
    "id": "SKILL_VAERIX_7",
    "heroId": "HERO_VAERIX",
    "order": 7,
    "xpCost": 2,
    "names": {
      "es": "Fuego fervoroso / Aliento de fuego",
      "en": "Zealous Fire / Fire Breath",
      "fr": "Ferveur incendiaire / Souffle incendiaire",
      "it": "Fiamma dello Zelota / Soffio di Fuoco",
      "pt": "Fogo Zeloso / Sopro de Fogo"
    },
    "cardDetails": {
      "faceA": {
        "tags": [
          "Agresión",
          "Juramento"
        ],
        "effect": "2<style=Term><link=TERM_FATIGUE></link></style>: Antes de tu ataque, añade 1 dado azul.",
        "maxFatigue": 4
      },
      "faceB": {
        "tags": [
          "Fuego"
        ],
        "effect": "3<style=Term><link=TERM_FATIGUE></link></style>: Durante tu turno, elige 4 casillas consecutivas, empezando por una casilla adyacente. Cada enemigo que esté en cualquiera de esas casillas sufre 3<style=Term><link=TERM_DAMAGE></link></style>. A continuación, aflige y conmociona a esos enemigos.",
        "maxFatigue": 3
      }
    }
  },
  {
    "id": "SKILL_VAERIX_8",
    "heroId": "HERO_VAERIX",
    "order": 8,
    "xpCost": 1,
    "names": {
      "es": "Reparar / Presencia tranquilizadora",
      "en": "Mend / Calming Presence",
      "fr": "Guéris / Présence apaisante",
      "it": "Ripristinare / Presenza Calmante",
      "pt": "Reparar / Presença Tranquilizadora"
    }
  },
  {
    "id": "SKILL_VAERIX_9",
    "heroId": "HERO_VAERIX",
    "order": 9,
    "xpCost": 2,
    "names": {
      "es": "Destrozar / Siempre adelante",
      "en": "Shatter / Ever Forward",
      "fr": "Éclate / Progression constante",
      "it": "Frantumare / Sempre Avanti",
      "pt": "Despedaçar / Sempre em Frente"
    }
  },
  {
    "id": "SKILL_VAERIX_10",
    "heroId": "HERO_VAERIX",
    "order": 10,
    "xpCost": 2,
    "names": {
      "es": "Moldear / Determinado",
      "en": "Shape / Unyielding",
      "fr": "Transforme / Inflexible",
      "it": "Plasmare / Irriducibile",
      "pt": "Moldar / Irredutível"
    }
  },
  {
    "id": "SKILL_VAERIX_11",
    "heroId": "HERO_VAERIX",
    "order": 11,
    "xpCost": 3,
    "names": {
      "es": "Orador / Soñador",
      "en": "Speaker / Dreamer",
      "fr": "Orateur / Visionnaire",
      "it": "Oratore / Sognatore",
      "pt": "Porta-voz / Sonhante"
    }
  }
];

export const SKILLS_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s]));
