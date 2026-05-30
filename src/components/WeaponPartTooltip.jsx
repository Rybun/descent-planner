import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { WEAPON_PART_DESCS } from '../gamedata/weaponPartDescs';
import { PART_ABILITY_KEY, ABILITY_CHANCE } from '../gamedata/weaponAbilities';
import { WEAPON_ABILITY_DESCS } from '../gamedata/weaponAbilityDescs';
import { WEAPONS_BY_ID } from '../gamedata/weapons';
import { HEROES_BY_ID } from '../gamedata/heroes';
import { DAMAGE_TYPE_BY_ID } from '../gamedata/damageTypes';
import { parseGameText, TERM_ICONS } from '../gamedata/gameText';
import './RecipeTooltip.css';

const SLOT_A_LABELS = { es: 'Arma', en: 'Weapon', fr: 'Arme', it: 'Arma', pt: 'Arma' };

const LONG_RANGE_LABELS = { es: 'Gran alcance', en: 'Long range', fr: 'Longue portée', it: 'Lunga gittata', pt: 'Longo alcance' };

function isPartEquipped(itemId, gameState) {
  if (!gameState || !itemId) return false;
  const part = WEAPON_PARTS_BY_ID[itemId];
  if (!part) return false;
  const slotKey = { A: 'partA', B: 'partB', C: 'partC' }[part.slot];
  if (!slotKey) return false;
  const selKey = { A: 'partASelections', B: 'partBSelections', C: 'partCSelections' }[part.slot];
  const selections = gameState[selKey] || {};
  for (const hero of (gameState.heroes || [])) {
    for (const w of (hero.equippedWeapons || [])) {
      const effective = selections[w.id] ?? w[slotKey] ?? null;
      if (effective === itemId) return true;
    }
  }
  return false;
}

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


function getPassiveDesc(partId, lang) {
  const baseId = partId?.replace(/_UPGRADED$/, '');
  const abilityKey = PART_ABILITY_KEY[baseId] || PART_ABILITY_KEY[partId];
  if (!abilityKey) return null;
  const raw = WEAPON_ABILITY_DESCS[abilityKey]?.[lang] || WEAPON_ABILITY_DESCS[abilityKey]?.en || '';
  const clean = raw.replace(/^"+|"+$/g, '').trim();
  return clean || null;
}

export default function WeaponPartTooltip({ partId, children }) {
  const t    = useT();
  const lang = useLang();
  const act       = useStore(s => s.saveMeta?.act ?? 0);
  const gameState = useStore(s => s.gameState);
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
    ? (SLOT_A_LABELS[lang] || 'Arma')
    : t(`slot.${part.weaponType}.${part.slot}`);

  const equipped = isPartEquipped(partId, gameState);

  const hasStats = part.slot === 'A' && (part.damage > 0 || (part.traits?.length > 0));

  const heroSlug  = hero ? HERO_SLUGS[hero.id] : null;
  const actSuffix = act >= 1 ? 'act2' : 'act1';
  const avatarSrc = heroSlug ? `/assets/heroes/tooltip/${heroSlug}_${actSuffix}.png` : null;

  const isAccessory = part.slot === 'B' || part.slot === 'C';

  const rawActivation = isAccessory ? '' : (WEAPON_PART_DESCS[partId]?.[lang] || '');
  const activationText = rawActivation.replace(/^"+|"+$/g, '').trim();
  const activationNodes = activationText ? renderNodes(parseGameText(activationText)) : null;

  // Unique passive ability — for accessories this IS the main effect, show in gold
  const passiveText  = getPassiveDesc(partId, lang);
  const passiveNodes = passiveText ? renderNodes(parseGameText(passiveText)) : null;

  const basePartId = partId?.replace(/_UPGRADED$/, '');
  const abilityKey = PART_ABILITY_KEY[basePartId] || PART_ABILITY_KEY[partId];
  const chance     = abilityKey != null ? ABILITY_CHANCE[abilityKey] : null;

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }
  const offsetX = coords.x + 16 + 280 > window.innerWidth ? coords.x - 296 : coords.x + 16;
  const offsetY = Math.min(coords.y - 8, window.innerHeight - 360);

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
            {equipped && <span className="rtt-equipped-badge">{t('shop.alreadyEquipped')}</span>}
          </span>

          {weapon && (
            <span className="rtt-subtitle">
              {weaponName}{heroName ? ` · ${heroName}` : ''}
            </span>
          )}

          {/* Stats slot A */}
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
                  {weapon.range === 2 ? (
                    <span>{LONG_RANGE_LABELS[lang] || 'Gran alcance'}</span>
                  ) : (
                    <>
                      <img src="/assets/icons/weapon_range.png" alt="" className="wpt-chip-icon"
                        onError={e => e.target.style.display = 'none'} />
                      <span>{weapon.range}</span>
                    </>
                  )}
                </span>
              )}
            </span>
          )}

          {/* Activation ability — cost and effect inline */}
          {activationNodes && (
            <span className="rtt-effect">
              {activationNodes}
            </span>
          )}

          {/* Passive ability — gold for accessories (main effect), grey for weapon (secondary) */}
          {passiveNodes && (
            <span className={`rtt-effect${isAccessory ? '' : ' rtt-passive'}`}>
              {isAccessory && chance != null && <span className="rtt-chance-chip">{chance}%</span>}
              {passiveNodes}
            </span>
          )}

          {/* Hero footer */}
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
