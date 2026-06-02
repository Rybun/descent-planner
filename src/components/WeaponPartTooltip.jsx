import { useState } from 'react';
import { createPortal } from 'react-dom';
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
import WeaponAssemblyView from './WeaponAssemblyView';
import './RecipeTooltip.css';

const ASSEMBLY_ROTATION  = { SWORD: -45, SPEAR: -45, WARBELL: -45, STAFF: -45, BOW: 80 };
const ASSEMBLY_OVERRIDES = {
  BOW: { c: { left: 180.6, top: 60.5, w: 58, h: 369, z: 3, rot: -95 } },
};

const SLOT_A_LABELS  = { es: 'Arma', en: 'Weapon', fr: 'Arme', it: 'Arma', pt: 'Arma' };
const UPGRADE_ICON   = '/assets/icons/Icon_Upgrade.png';

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

function cleanName(name) {
  return name.replace(/\s*\+?\s*✦.*$/, '').trim();
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
  const isUpgraded = baseId !== partId;
  const abilityKey = PART_ABILITY_KEY[baseId] || PART_ABILITY_KEY[partId];
  if (!abilityKey) return null;
  const upgKeyPlus = isUpgraded ? `${abilityKey}+` : null;
  const upgKeyUnderscored = isUpgraded ? `${abilityKey}_UPGRADED` : null;
  const raw = (upgKeyPlus && WEAPON_ABILITY_DESCS[upgKeyPlus]?.[lang])
    || (upgKeyUnderscored && WEAPON_ABILITY_DESCS[upgKeyUnderscored]?.[lang])
    || WEAPON_ABILITY_DESCS[abilityKey]?.[lang]
    || WEAPON_ABILITY_DESCS[abilityKey]?.en
    || '';
  const clean = raw.replace(/^"+|"+$/g, '').trim();
  return clean || null;
}

export default function WeaponPartTooltip({ partId, showUpgradeIcon = true, children }) {
  const t        = useT();
  const lang     = useLang();
  const gameState = useStore(s => s.gameState);
  const saveMeta  = useStore(s => s.saveMeta);
  const isAct2    = (saveMeta?.act ?? 0) >= 1;
  const [visible, setVisible] = useState(false);
  const [coords,  setCoords]  = useState({ x: 0, y: 0 });

  const part = WEAPON_PARTS_BY_ID[partId];
  if (!part) return <>{children}</>;

  const weapon = part.weaponId ? WEAPONS_BY_ID[part.weaponId] : null;
  const hero   = weapon?.heroId ? HEROES_BY_ID[weapon.heroId] : null;

  const rawPartName = getName(part, lang);
  const partName    = rawPartName.replace(/\s*\+?\s*✦.*$/, '').trim();
  const weaponName = weapon ? getName(weapon, lang) : '';
  const heroKey    = t(`hero.${hero?.id}`);
  const heroName   = hero ? (heroKey.startsWith('hero.') ? (hero.name || hero.id) : heroKey) : '';

  const slotLabel = part.slot === 'A'
    ? (SLOT_A_LABELS[lang] || 'Arma')
    : t(`slot.${part.weaponType}.${part.slot}`);

  const equipped = isPartEquipped(partId, gameState);

  const hasStats = part.slot === 'A' && (part.damage > 0 || (part.traits?.length > 0));

  const isAccessory = part.slot === 'B' || part.slot === 'C';

  const basePartId2 = partId?.replace(/_UPGRADED$/, '');
  const rawActivation = isAccessory ? '' : (
    WEAPON_PART_DESCS[partId]?.[lang] ||
    WEAPON_PART_DESCS[basePartId2]?.[lang] ||
    ''
  );
  const activationText = rawActivation.replace(/^"+|"+$/g, '').trim();
  const activationNodes = activationText ? renderNodes(parseGameText(activationText)) : null;

  // Unique passive ability — for accessories this IS the main effect, show in gold
  const passiveText  = getPassiveDesc(partId, lang);
  const passiveNodes = passiveText ? renderNodes(parseGameText(passiveText)) : null;

  const basePartId  = partId?.replace(/_UPGRADED$/, '');
  const abilityKey  = PART_ABILITY_KEY[basePartId] || PART_ABILITY_KEY[partId];
  const isUpgPart   = basePartId !== partId;
  const chanceKey   = (isUpgPart && ABILITY_CHANCE[`${abilityKey}+`] != null)
    ? `${abilityKey}+` : abilityKey;
  const chance      = chanceKey != null ? ABILITY_CHANCE[chanceKey] : null;

  // Ensamblaje para el footer
  function defaultPart(slot) {
    return WEAPON_PARTS_BY_ID[`WEAPON_PART_${slot}_${part.weaponType}_0`] ?? null;
  }
  const assemblyA   = part.slot === 'A' ? part : defaultPart('A');
  const assemblyB   = part.slot === 'B' ? part : defaultPart('B');
  const assemblyC   = part.slot === 'C' ? part : defaultPart('C');
  const asmRotation = ASSEMBLY_ROTATION[part.weaponType] || 0;
  const asmOverrides = ASSEMBLY_OVERRIDES[part.weaponType] || {};

  // Avatar del héroe
  const heroAvatar = hero ? (isAct2 ? (hero.imageAct2 || hero.image) : hero.image) : null;

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
      {visible && createPortal(
        <span className="rtt-bubble" style={{ left: offsetX, top: offsetY }}>

          <span className="rtt-header">
            <span className="rtt-title">
              <span className="rtt-label">{slotLabel}</span>
              {showUpgradeIcon && partId?.endsWith('_UPGRADED')
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>{partName}<img src={UPGRADE_ICON} alt="✦" style={{ width: '1em', height: '1em', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} /></span>
                : partName}
            </span>
            <span className="wpt-header-right">
              {equipped && <span className="rtt-equipped-badge">{t('shop.alreadyEquipped')}</span>}
              {heroAvatar && (
                <img src={heroAvatar} alt={heroName} className="wpt-hero-avatar"
                  onError={e => e.target.style.display = 'none'} />
              )}
            </span>
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

          {/* Footer: ensamblaje para slot A, imagen propia para accesorios B/C */}
          {part.slot === 'A' ? (
            <span className="rtt-hero-footer wpt-assembly-footer">
              <WeaponAssemblyView
                weaponType={part.weaponType}
                partA={assemblyA} partB={assemblyB} partC={assemblyC}
                displayH={160}
                rotation={asmRotation}
                partOverrides={asmOverrides}
              />
            </span>
          ) : part.image && (
            <span className="rtt-hero-footer rtt-hero-footer--item">
              <img src={part.image} alt={partName} className="rtt-item-footer-img"
                onError={e => e.target.style.display = 'none'} />
            </span>
          )}

        </span>
      , document.body)}
    </span>
  );
}
