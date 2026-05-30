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
