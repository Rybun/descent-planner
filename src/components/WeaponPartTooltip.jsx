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
import { useIsMobile } from '../hooks/useIsMobile';
import { useTooltipPosition } from '../hooks/useTooltipPosition';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import WeaponAssemblyView from './WeaponAssemblyView';
import './RecipeTooltip.css';

const ASSEMBLY_ROTATION  = { SWORD: -45, SPEAR: -45, WARBELL: -45, STAFF: -45, BOW: 80 };
const ASSEMBLY_OVERRIDES = {
  BOW: { c: { left: 180.6, top: 60.5, w: 58, h: 369, z: 3, rot: -95 } },
};

const SLOT_A_LABELS  = { es: 'Arma', en: 'Weapon', fr: 'Arme', it: 'Arma', pt: 'Arma' };
const UPGRADE_ICON   = '/assets/icons/Icon_Upgrade.png';

const HERO_SLUGS = {
  HERO_BRYNN:   'brynn',
  HERO_SYRUS:   'syrus',
  HERO_GALADEN: 'galaden',
  HERO_VAERIX:  'vaerix',
  HERO_KEHLI:   'kehli',
  HERO_CHANCE:  'chance',
};

export const LONG_RANGE_LABELS = { es: 'Gran alcance', en: 'Long range', fr: 'Longue portée', it: 'Lunga gittata', pt: 'Longo alcance' };

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

// Otra pieza (de nivel > 0, es decir no la de partida) ya ocupa ese mismo
// hueco en un arma del mismo tipo — igual que el aviso "Ya equipado en este
// hueco" de RecipeTooltip.jsx (tienda), portado aquí porque la Sala de
// creación usa este mismo componente para las partes de arma.
function getConflictingPart(itemId, gameState) {
  if (!gameState || !itemId) return null;
  const part = WEAPON_PARTS_BY_ID[itemId];
  if (!part) return null;
  const slotKey = { A: 'partA', B: 'partB', C: 'partC' }[part.slot];
  const selKey  = { A: 'partASelections', B: 'partBSelections', C: 'partCSelections' }[part.slot];
  if (!slotKey) return null;
  const selections = gameState[selKey] || {};
  for (const hero of (gameState.heroes || [])) {
    for (const w of (hero.equippedWeapons || [])) {
      const defaultPartA = WEAPON_PARTS_BY_ID[w.partA];
      if (defaultPartA?.weaponType !== part.weaponType) continue;
      const effective = selections[w.id] ?? w[slotKey] ?? null;
      if (!effective || effective === itemId) continue;
      const conflictPart = WEAPON_PARTS_BY_ID[effective];
      if (conflictPart?.level > 0) return effective;
    }
  }
  return null;
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

// Activación + pasiva de una pieza cualquiera (se usa tanto para la pieza
// mostrada como para la pieza en conflicto, que puede ser otra distinta).
// Exportada para que otros sitios (p.ej. el editor de piezas de Aprestar)
// puedan mostrar el mismo texto de efecto en línea, sin tooltip.
export function getPartDescNodes(pid, lang) {
  if (!pid) return { activationNodes: null, passiveNodes: null, chance: null, isAccessory: false };
  const p = WEAPON_PARTS_BY_ID[pid];
  if (!p) return { activationNodes: null, passiveNodes: null, chance: null, isAccessory: false };

  const isAcc = p.slot === 'B' || p.slot === 'C';
  const baseId = pid.replace(/_UPGRADED$/, '');
  const rawActivation = isAcc ? '' : (WEAPON_PART_DESCS[pid]?.[lang] || WEAPON_PART_DESCS[baseId]?.[lang] || '');
  const activationText = rawActivation.replace(/^"+|"+$/g, '').trim();
  const activationNodes = activationText ? renderNodes(parseGameText(activationText)) : null;

  const passiveText = getPassiveDesc(pid, lang);
  const passiveNodes = passiveText ? renderNodes(parseGameText(passiveText)) : null;

  const abilityKey = PART_ABILITY_KEY[baseId] || PART_ABILITY_KEY[pid];
  const isUpg = baseId !== pid;
  const chanceKey = (isUpg && ABILITY_CHANCE[`${abilityKey}+`] != null) ? `${abilityKey}+` : abilityKey;
  const chance = chanceKey != null ? ABILITY_CHANCE[chanceKey] : null;

  return { activationNodes, passiveNodes, chance, isAccessory: isAcc };
}

// otherPartIds: ids de las OTRAS piezas del arma (normalmente B y C) cuyo
// efecto también se quiere ver en este mismo tooltip — p.ej. al pasar el
// ratón por el arma completa en Aprestar, no solo por la pieza A.
export default function WeaponPartTooltip({ partId, showUpgradeIcon = true, hideAbility = false, otherPartIds = [], children }) {
  const t        = useT();
  const lang     = useLang();
  const gameState = useStore(s => s.gameState);
  const act       = useStore(s => s.saveMeta?.act ?? 0);
  const isMobile  = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [coords,  setCoords]  = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const { ref: bubbleRef, style: bubbleStyle } = useTooltipPosition(coords, visible && !isMobile);
  useBodyScrollLock(modalOpen);

  const part = WEAPON_PARTS_BY_ID[partId];
  if (!part) return <>{children}</>;

  const weapon = part.weaponId ? WEAPONS_BY_ID[part.weaponId] : null;
  const hero   = weapon?.heroId ? HEROES_BY_ID[weapon.heroId] : null;

  // Piezas especiales sin arma asociada (armas rúnicas) llevan su propio
  // "range" en weaponParts.js — ver comentario igual en ArmeriaPanel.jsx.
  const rangeUnknown = 'range' in part && part.range == null;
  const range = 'range' in part ? part.range : (weapon?.range ?? 0);

  const heroSlug  = hero ? HERO_SLUGS[hero.id] : null;
  const actSuffix = act >= 1 ? 'act2' : 'act1';
  const avatarSrc = heroSlug ? `/assets/heroes/tooltip/${heroSlug}_${actSuffix}.png` : null;

  const rawPartName = getName(part, lang);
  const partName    = rawPartName.replace(/\s*\+?\s*✦.*$/, '').trim();
  const weaponName = weapon ? getName(weapon, lang) : '';
  const heroKey    = t(`hero.${hero?.id}`);
  const heroName   = hero ? (heroKey.startsWith('hero.') ? (hero.name || hero.id) : heroKey) : '';

  const slotLabel = part.slot === 'A'
    ? (SLOT_A_LABELS[lang] || 'Arma')
    : t(`slot.${part.weaponType}.${part.slot}`);

  const equipped = isPartEquipped(partId, gameState);
  // Si esta pieza concreta ya está puesta no tiene sentido avisar de
  // conflicto (es la misma); si no, comprobar si otra distinta ocupa el hueco.
  const conflictId    = equipped ? null : getConflictingPart(partId, gameState);
  const conflictPart  = conflictId ? WEAPON_PARTS_BY_ID[conflictId] : null;
  const conflictName  = conflictPart ? cleanName(getName(conflictPart, lang)) : '';
  const conflictDescs = conflictId ? getPartDescNodes(conflictId, lang) : null;

  const hasStats = part.slot === 'A' && (part.damage > 0 || (part.traits?.length > 0));

  const isAccessory = part.slot === 'B' || part.slot === 'C';

  const { activationNodes, passiveNodes, chance } = getPartDescNodes(partId, lang);

  const otherPartsInfo = otherPartIds
    .filter(id => id && id !== partId)
    .map(id => {
      const p = WEAPON_PARTS_BY_ID[id];
      if (!p) return null;
      const descs = getPartDescNodes(id, lang);
      if (!descs.activationNodes && !descs.passiveNodes) return null;
      return {
        id,
        slotLabel: p.slot === 'A' ? (SLOT_A_LABELS[lang] || 'Arma') : t(`slot.${p.weaponType}.${p.slot}`),
        name: cleanName(getName(p, lang)),
        descs,
      };
    })
    .filter(Boolean);

  function defaultPart(slot) {
    return WEAPON_PARTS_BY_ID[`WEAPON_PART_${slot}_${part.weaponType}_0`] ?? null;
  }
  const assemblyA   = part.slot === 'A' ? part : defaultPart('A');
  const assemblyB   = part.slot === 'B' ? part : defaultPart('B');
  const assemblyC   = part.slot === 'C' ? part : defaultPart('C');
  const asmRotation = ASSEMBLY_ROTATION[part.weaponType] || 0;
  const asmOverrides = ASSEMBLY_OVERRIDES[part.weaponType] || {};

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }

  function handleClick(e) {
    if (!isMobile) return;
    if (e.target.closest('button, input, label, a, select')) return;
    setModalOpen(true);
  }

  const bubbleContent = (
    <>
      <span className="rtt-header">
        <span className="rtt-title">
          <span className="rtt-label">{slotLabel}</span>
          {showUpgradeIcon && partId?.endsWith('_UPGRADED')
            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>{partName}<img src={UPGRADE_ICON} alt="✦" style={{ width: '1em', height: '1em', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} /></span>
            : partName}
        </span>
        <span className="wpt-header-right">
          {equipped && <span className="rtt-equipped-badge">{t('shop.alreadyEquipped')}</span>}
          {conflictId && <span className="rtt-conflict-badge">!</span>}
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
          {rangeUnknown && (
            <span className="wpt-chip">
              <img src="/assets/icons/weapon_range.png" alt="" className="wpt-chip-icon"
                onError={e => e.target.style.display = 'none'} />
              <span>?</span>
            </span>
          )}
          {range > 0 && (
            <span className="wpt-chip">
              {range === 2 ? (
                <span>{LONG_RANGE_LABELS[lang] || 'Gran alcance'}</span>
              ) : (
                <>
                  <img src="/assets/icons/weapon_range.png" alt="" className="wpt-chip-icon"
                    onError={e => e.target.style.display = 'none'} />
                  <span>{range}</span>
                </>
              )}
            </span>
          )}
        </span>
      )}

      {!hideAbility && activationNodes && (
        <span className="rtt-effect">
          {activationNodes}
        </span>
      )}

      {!hideAbility && passiveNodes && (
        <span className={`rtt-effect${isAccessory ? '' : ' rtt-passive'}`}>
          {isAccessory && chance != null && <span className="rtt-chance-chip">{chance}%</span>}
          {passiveNodes}
        </span>
      )}

      {!hideAbility && conflictId && (
        <span className="rtt-conflict">
          <span className="rtt-conflict-label">{t('shop.slotConflict')}</span>
          <span className="rtt-conflict-name">{conflictName}</span>
          {conflictDescs.activationNodes && (
            <span className="rtt-effect">{conflictDescs.activationNodes}</span>
          )}
          {conflictDescs.passiveNodes && (
            <span className={`rtt-effect${conflictDescs.isAccessory ? '' : ' rtt-passive'}`}>
              {conflictDescs.isAccessory && conflictDescs.chance != null && (
                <span className="rtt-chance-chip">{conflictDescs.chance}%</span>
              )}
              {conflictDescs.passiveNodes}
            </span>
          )}
        </span>
      )}

      {!hideAbility && otherPartsInfo.map(info => (
        <span className="wpt-other-part" key={info.id}>
          <span className="wpt-other-part-header">
            <span className="rtt-label">{info.slotLabel}</span> {info.name}
          </span>
          {info.descs.activationNodes && (
            <span className="rtt-effect">{info.descs.activationNodes}</span>
          )}
          {info.descs.passiveNodes && (
            <span className={`rtt-effect${info.descs.isAccessory ? '' : ' rtt-passive'}`}>
              {info.descs.isAccessory && info.descs.chance != null && (
                <span className="rtt-chance-chip">{info.descs.chance}%</span>
              )}
              {info.descs.passiveNodes}
            </span>
          )}
        </span>
      ))}

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

      {avatarSrc && (
        <span className="rtt-hero-footer">
          <img src={avatarSrc} alt={heroName} className="rtt-hero-avatar"
            onError={e => e.target.style.display = 'none'} />
        </span>
      )}
    </>
  );

  return (
    <span
      className="rtt-wrap"
      onMouseEnter={e => { if (!isMobile) { setVisible(true); move(e); } }}
      onMouseMove={e => { if (!isMobile) move(e); }}
      onMouseLeave={() => { if (!isMobile) setVisible(false); }}
      onClick={handleClick}
    >
      {children}
      {!isMobile && visible && createPortal(
        <span ref={bubbleRef} className="rtt-bubble" style={bubbleStyle}>
          {bubbleContent}
        </span>
      , document.body)}
      {isMobile && modalOpen && createPortal(
        <div className="rtt-modal-overlay" onClick={e => { e.stopPropagation(); setModalOpen(false); }}>
          <div className="rtt-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="rtt-modal-handle-row"><div className="rtt-modal-handle" /></div>
            <div className="rtt-modal-close-row">
              <button className="rtt-modal-close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="rtt-modal-body">{bubbleContent}</div>
          </div>
        </div>
      , document.body)}
    </span>
  );
}
