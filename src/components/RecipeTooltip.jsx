import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { RECIPES_BY_ID } from '../gamedata/recipes';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { WEAPON_PART_DESCS } from '../gamedata/weaponPartDescs';
import { PART_ABILITY_KEY, ABILITY_CHANCE } from '../gamedata/weaponAbilities';
import { WEAPON_ABILITY_DESCS } from '../gamedata/weaponAbilityDescs';
import { WEAPONS_BY_ID } from '../gamedata/weapons';
import { HEROES_BY_ID } from '../gamedata/heroes';
import { MATERIALS_BY_ID } from '../gamedata/materials';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import { parseGameText, TERM_ICONS } from '../gamedata/gameText';
import { useIsMobile } from '../hooks/useIsMobile';
import './RecipeTooltip.css';

const UPGRADE_ICON = '/assets/icons/Icon_Upgrade.png';

function renderItemName(id, name) {
  if (!id?.endsWith('_PLUS')) return name || id || '';
  return (
    <>
      {name}
      <img src={UPGRADE_ICON} alt="+" style={{ width: '1em', height: '1em', verticalAlign: 'middle', marginLeft: '3px', display: 'inline' }}
        onError={e => e.target.style.display = 'none'} />
    </>
  );
}

const SLOT_A_LABELS    = { es: 'Equipar', en: 'Equip', fr: 'Équiper', it: 'Equipaggia', pt: 'Equipar' };
const ITEM_TYPE_LABELS = {
  armor:      { es: 'Armadura', en: 'Armor', fr: 'Armure', it: 'Armatura', pt: 'Armadura' },
  trinket:    { es: 'Accesorio', en: 'Trinket', fr: 'Accessoire', it: 'Accessorio', pt: 'Acessório' },
  consumable: { es: 'Consumible', en: 'Consumable', fr: 'Consommable', it: 'Consumabile', pt: 'Consumível' },
};

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
    if (node.content && !/^[-\s-]+$/.test(node.content))
      return <em key={i} className="rtt-term">{node.content}</em>;
    return null;
  });
}

function splitActivation(rawText) {
  if (!rawText) return { costNodes: null, effectNodes: null };
  const clean = rawText.replace(/^"+|"+$/g, '').trim();
  const colonIdx = clean.indexOf(': ');
  if (colonIdx === -1) {
    return { costNodes: null, effectNodes: renderNodes(parseGameText(clean)) };
  }
  const costText   = clean.slice(0, colonIdx);
  const effectText = clean.slice(colonIdx + 2);
  return {
    costNodes:   renderNodes(parseGameText(costText)),
    effectNodes: renderNodes(parseGameText(effectText)),
  };
}

function getPassiveDesc(partId, lang) {
  const baseId = partId?.replace(/_UPGRADED$/, '');
  const abilityKey = PART_ABILITY_KEY[baseId] || PART_ABILITY_KEY[partId];
  if (!abilityKey) return null;
  const raw = WEAPON_ABILITY_DESCS[abilityKey]?.[lang] || WEAPON_ABILITY_DESCS[abilityKey]?.en || '';
  const clean = raw.replace(/^"+|"+$/g, '').trim();
  return clean || null;
}

function isPartEquipped(itemId, gameState) {
  if (!gameState || !itemId) return false;
  const part = WEAPON_PARTS_BY_ID[itemId];
  if (!part) return false;
  const slotKey = { A: 'partA', B: 'partB', C: 'partC' }[part.slot];
  if (!slotKey) return false;
  const selKey  = { A: 'partASelections', B: 'partBSelections', C: 'partCSelections' }[part.slot];
  const selections = gameState[selKey] || {};
  for (const hero of (gameState.heroes || [])) {
    for (const w of (hero.equippedWeapons || [])) {
      const effective = selections[w.id] ?? w[slotKey] ?? null;
      if (effective === itemId) return true;
    }
  }
  return false;
}

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

function PartDesc({ partId, lang }) {
  const part = WEAPON_PARTS_BY_ID[partId];
  const slot = part?.slot;
  const isAccessory = slot === 'B' || slot === 'C';

  const raw = isAccessory ? '' : (WEAPON_PART_DESCS[partId]?.[lang] || '');
  const { costNodes, effectNodes } = splitActivation(raw);

  const passiveText = getPassiveDesc(partId, lang);
  const passiveNodes = passiveText ? renderNodes(parseGameText(passiveText)) : null;

  const baseId = partId?.replace(/_UPGRADED$/, '');
  const abilityKey = PART_ABILITY_KEY[baseId] || PART_ABILITY_KEY[partId];
  const chance = abilityKey != null ? ABILITY_CHANCE[abilityKey] : null;

  return (
    <>
      {(costNodes || effectNodes) && (
        <span className="rtt-activation">
          {costNodes && <span className="rtt-cost-chip">{costNodes}</span>}
          {effectNodes && <span className="rtt-effect">{effectNodes}</span>}
        </span>
      )}
      {passiveNodes && (
        <span className={`rtt-effect${isAccessory ? '' : ' rtt-passive'}`}>
          {isAccessory && chance != null && <span className="rtt-chance-chip">{chance}%</span>}
          {passiveNodes}
        </span>
      )}
    </>
  );
}

export default function RecipeTooltip({ recipeId, children }) {
  const t    = useT();
  const lang = useLang();
  const gameState = useStore(s => s.gameState);
  const act       = useStore(s => s.saveMeta?.act ?? 0);
  const isMobile  = useIsMobile();

  const [visible, setVisible] = useState(false);
  const [coords,  setCoords]  = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);

  const recipe = RECIPES_BY_ID[recipeId];
  if (!recipe) return <>{children}</>;

  const itemId  = recipe.itemId || recipeId.replace(/^RECIPE_/, '');
  const isPlus  = itemId?.endsWith('_PLUS');
  const part    = WEAPON_PARTS_BY_ID[itemId];
  const itemObj = !part ? ALL_ITEMS_BY_ID[itemId] : null;
  const weapon  = part?.weaponId ? WEAPONS_BY_ID[part.weaponId] : null;
  const hero    = weapon?.heroId ? HEROES_BY_ID[weapon.heroId] : null;

  const rawName    = part ? getName(part, lang) : (itemObj ? getName(itemObj, lang) : itemId);
  const itemName   = part ? cleanName(rawName) : rawName;
  const weaponName = weapon ? getName(weapon, lang) : '';
  const heroKey    = t(`hero.${hero?.id}`);
  const heroName   = hero ? (heroKey.startsWith('hero.') ? (hero.name || hero.id) : heroKey) : '';

  const slotLabel = part?.slot === 'A'
    ? (SLOT_A_LABELS[lang] || 'Equipar')
    : part ? t(`slot.${part.weaponType}.${part.slot}`)
    : itemObj ? (ITEM_TYPE_LABELS[itemObj.type]?.[lang] || itemObj.type)
    : '';

  const equipped    = isPartEquipped(itemId, gameState);
  const conflictId  = equipped ? null : getConflictingPart(itemId, gameState);
  const conflictPart = conflictId ? WEAPON_PARTS_BY_ID[conflictId] : null;
  const conflictName = conflictPart ? cleanName(getName(conflictPart, lang)) : '';

  const heroSlug  = hero ? HERO_SLUGS[hero.id] : null;
  const actSuffix = act >= 1 ? 'act2' : 'act1';
  const avatarSrc = heroSlug ? `/assets/heroes/tooltip/${heroSlug}_${actSuffix}.png` : null;

  const craftingMaterials = gameState?.craftingMaterials ?? {};

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }
  const offsetX = coords.x + 16 + 280 > window.innerWidth ? coords.x - 296 : coords.x + 16;
  const offsetY = Math.min(coords.y - 8, window.innerHeight - 420);

  function handleClick(e) {
    if (!isMobile) return;
    if (e.target.closest('button, input, label, a, select')) return;
    setModalOpen(true);
  }

  const bubbleContent = (
    <>
      <span className="rtt-header">
        <span className="rtt-title">
          <span className="rtt-label">{t('shop.recipe')}</span>
          {renderItemName(itemId, itemName)}
        </span>
        {equipped && <span className="rtt-equipped-badge">{t('shop.alreadyEquipped')}</span>}
        {conflictId && <span className="rtt-conflict-badge">!</span>}
      </span>

      {part && weapon && (
        <span className="rtt-subtitle">
          {slotLabel} · {weaponName} · {heroName}
        </span>
      )}

      {part && <PartDesc partId={itemId} lang={lang} />}

      {recipe.ingredients && (
        <span className="rtt-ingredients">
          {Object.entries(recipe.ingredients).map(([matId, qty]) => {
            const mat     = MATERIALS_BY_ID[matId];
            const have    = craftingMaterials[matId] ?? 0;
            const enough  = have >= qty;
            const matName = mat ? getName(mat, lang) : matId;
            return (
              <span key={matId} className={`rtt-mat-row ${enough ? 'rtt-ok' : 'rtt-missing'}`}>
                {mat?.image && (
                  <img src={mat.image} alt={matName} className="rtt-mat-img"
                    onError={e => e.target.style.display='none'} />
                )}
                <span className="rtt-mat-name">{matName}</span>
                <span className="rtt-mat-qty">{have}/{qty}</span>
              </span>
            );
          })}
        </span>
      )}

      {conflictId && (
        <span className="rtt-conflict">
          <span className="rtt-conflict-label">{t('shop.slotConflict')}</span>
          <span className="rtt-conflict-name">{conflictName}</span>
          <PartDesc partId={conflictId} lang={lang} />
        </span>
      )}

      {avatarSrc && (
        <span className="rtt-hero-footer">
          <img src={avatarSrc} alt={heroName} className="rtt-hero-avatar"
            onError={e => e.target.style.display='none'} />
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
      {!isMobile && visible && (
        <span className="rtt-bubble" style={{ left: offsetX, top: offsetY }}>
          {bubbleContent}
        </span>
      )}
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
