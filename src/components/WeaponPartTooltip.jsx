import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { WEAPON_PART_DESCS } from '../gamedata/weaponPartDescs';
import { WEAPONS_BY_ID } from '../gamedata/weapons';
import { HEROES_BY_ID } from '../gamedata/heroes';
import { DAMAGE_TYPE_BY_ID } from '../gamedata/damageTypes';
import { parseGameText, TERM_ICONS } from '../gamedata/gameText';
import './RecipeTooltip.css';

const SLOT_A_LABELS = { es: 'Equipar', en: 'Equip', fr: 'Équiper', it: 'Equipaggia', pt: 'Equipar' };

const HERO_SLUGS = {
  HERO_BRYNN:   'brynn',
  HERO_SYRUS:   'syrus',
  HERO_GALADEN: 'galaden',
  HERO_VAERIX:  'vaerix',
  HERO_KEHLI:   'kehli',
  HERO_CHANCE:  'chance',
};

function cleanName(name) {
  return name.replace(/\s*\+\s*✦.*$/, '').trim();
}

function renderNodes(nodes) {
  return nodes.map((node, i) => {
    if (node.t === 'text') return <span key={i}>{node.s}</span>;
    const iconSrc = TERM_ICONS[node.key];
    if (iconSrc) return (
      <img key={i} src={iconSrc} alt={node.key}
        style={{ width: '1em', height: '1em', verticalAlign: 'middle', display: 'inline' }}
        onError={e => e.target.style.display = 'none'} />
    );
    if (node.content && !/^[-\s]+$/.test(node.content))
      return <em key={i} className="rtt-term">{node.content}</em>;
    return null;
  });
}

export default function WeaponPartTooltip({ partId, children }) {
  const t    = useT();
  const lang = useLang();
  const act  = useStore(s => s.saveMeta?.act ?? 0);
  const [visible, setVisible] = useState(false);
  const [coords,  setCoords]  = useState({ x: 0, y: 0 });

  const part = WEAPON_PARTS_BY_ID[partId];
  if (!part) return <>{children}</>;

  const weapon = part.weaponId ? WEAPONS_BY_ID[part.weaponId] : null;
  const hero   = weapon?.heroId ? HEROES_BY_ID[weapon.heroId] : null;

  const partName   = cleanName(getName(part, lang));
  const weaponName = weapon ? getName(weapon, lang) : '';
  const heroKey    = t(`hero.${hero?.id}`);
  const heroName   = hero ? (heroKey.startsWith('hero.') ? (hero.name || hero.id) : heroKey) : '';

  const slotLabel = part.slot === 'A'
    ? (SLOT_A_LABELS[lang] || 'Equipar')
    : t(`slot.${part.weaponType}.${part.slot}`);

  const rawDesc  = WEAPON_PART_DESCS[partId]?.[lang] || '';
  const descText = rawDesc.replace(/^"|"$/g, '').trim();
  const descNodes = descText ? renderNodes(parseGameText(descText)) : null;

  const hasStats   = part.slot === 'A' && (part.damage > 0 || (part.traits?.length > 0));
  const heroSlug   = hero ? HERO_SLUGS[hero.id] : null;
  const actSuffix  = act >= 1 ? 'act2' : 'act1';
  const avatarSrc  = heroSlug ? `/assets/heroes/tooltip/${heroSlug}_${actSuffix}.png` : null;

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }
  const offsetX = coords.x + 16 + 280 > window.innerWidth ? coords.x - 296 : coords.x + 16;
  const offsetY = Math.min(coords.y - 8, window.innerHeight - 320);

  return (
    <span
      className="rtt-wrap"
      onMouseEnter={e => { setVisible(true); move(e); }}
      onMouseMove={move}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="rtt-bubble" style={{ left: offsetX, top: offsetY }}>

          <span className="rtt-header">
            <span className="rtt-title">
              <span className="rtt-label">{slotLabel}</span>
              {partName}
            </span>
          </span>

          {weapon && (
            <span className="rtt-subtitle">
              {weaponName}{heroName ? ` · ${heroName}` : ''}
            </span>
          )}

          {hasStats && (
            <span className="wpt-stats">
              {part.traits?.map(traitId => {
                const dt = DAMAGE_TYPE_BY_ID[traitId];
                return dt ? (
                  <span key={traitId} className="wpt-chip">
                    <img src={dt.icon} alt="" className="wpt-chip-icon"
                      onError={e => e.target.style.display = 'none'} />
                    <span>{dt.names[lang] || dt.names.en}</span>
                  </span>
                ) : null;
              })}
              {part.damage > 0 && (
                <span className="wpt-chip">
                  <img src="/assets/icons/Icon_Damage.png" alt="" className="wpt-chip-icon"
                    onError={e => e.target.style.display = 'none'} />
                  <span>{part.damage}</span>
                </span>
              )}
              {weapon?.range > 0 && (
                <span className="wpt-chip">
                  <img src="/assets/icons/weapon_range.png" alt="" className="wpt-chip-icon"
                    onError={e => e.target.style.display = 'none'} />
                  <span>{weapon.range}</span>
                </span>
              )}
            </span>
          )}

          {descNodes && (
            <span className="rtt-effect">{descNodes}</span>
          )}

          {avatarSrc && (
            <span className="rtt-hero-footer">
              <img src={avatarSrc} alt={heroName} className="rtt-hero-avatar"
                onError={e => e.target.style.display = 'none'} />
            </span>
          )}

        </span>
      )}
    </span>
  );
}
