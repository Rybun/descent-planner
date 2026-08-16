// Utilidades para parsear texto enriquecido del juego (habilidades, descripciones)

export const TERM_ICONS = {
  TERM_HEALTH_DIAL: '/assets/icons/Icon_Health.png',
  TERM_DAMAGE:      '/assets/icons/Icon_Damage.png',
  TERM_ACTIONS:     '/assets/icons/Icon_Action.png',
  TERM_FATIGUE:     '/assets/icons/Icon_Fatigue.png',
  TERM_SUCCESS:     '/assets/icons/Icon_Success.png',
  TERM_ADVANTAGE:   '/assets/icons/Icon_Advantage.png',
  TERM_SURGE:       '/assets/icons/Icon_Surge.png',
  TERM_UPGRADE:     '/assets/icons/Icon_Upgrade.png',
};

// Cada PNG de icono tiene su propio margen transparente interno (distinto
// por icono), así que un simple width/height:1em + vertical-align:middle no
// alinea el dibujo real con el texto de alrededor — cada uno queda a una
// altura distinta. Estos valores (altura de caja + vertical-align, en em)
// están calculados para que el borde SUPERIOR del dibujo (sin el margen
// transparente) coincida con el borde superior del dígito "0", y el borde
// INFERIOR con el borde inferior de ese mismo "0" — así todo queda alineado
// en la línea de texto sea cual sea el icono. Salen de dos medidas reales:
// el hueco vacío de cada PNG (extract del bounding box de píxeles no
// transparentes) y la caja de tinta real del glifo "0" en la fuente de la
// app (canvas.measureText().actualBoundingBox*), no a ojo.
const TERM_ICON_ALIGN = {
  TERM_HEALTH_DIAL: { height: 0.8522, valign: -0.0622 },
  TERM_DAMAGE:      { height: 0.8829, valign: -0.0777 },
  TERM_ACTIONS:     { height: 0.8522, valign: -0.0622 },
  TERM_FATIGUE:     { height: 0.8522, valign: -0.0622 },
  TERM_SUCCESS:     { height: 0.9074, valign: -0.0865 },
  TERM_ADVANTAGE:   { height: 0.8522, valign: -0.0622 },
  TERM_SURGE:       { height: 0.8522, valign: -0.0622 },
  TERM_UPGRADE:     { height: 0.9608, valign: -0.1132 },
};

// El rayo lleva además un realce a propósito (más grande y un poco más
// abajo que el resto) porque es el símbolo con el que se activan
// habilidades ("1[rayo]:") y conviene que destaque en el texto.
const SURGE_BOOST_SCALE = 1.1;
const SURGE_BOOST_DROP  = 0.05;

export function termIconStyle(key) {
  const a = TERM_ICON_ALIGN[key];
  if (!a) return { width: '1em', height: '1em', verticalAlign: 'middle', display: 'inline' };
  const isSurge = key === 'TERM_SURGE';
  const height = isSurge ? a.height * SURGE_BOOST_SCALE : a.height;
  const valign = isSurge ? a.valign - SURGE_BOOST_DROP : a.valign;
  return {
    width: `${height}em`,
    height: `${height}em`,
    verticalAlign: `${valign}em`,
    display: 'inline',
  };
}

export function parseGameText(text) {
  if (!text) return [];
  const pattern = /<style=[^>]+><link=([^>]+)>(.*?)<\/link><\/style>|<[^>]+>/g;
  const parts = [];
  let last = 0, match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push({ t: 'text', s: text.slice(last, match.index) });
    if (match[1]) parts.push({ t: 'term', key: match[1], content: match[2] });
    last = pattern.lastIndex;
  }
  if (last < text.length) parts.push({ t: 'text', s: text.slice(last) });
  return parts;
}
