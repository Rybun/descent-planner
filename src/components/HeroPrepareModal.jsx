import { useState, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { getName } from '../i18n';
import { WEAPONS_BY_ID } from '../gamedata/weapons';
import { WEAPON_PARTS, WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ARMORS_BY_ID, TRINKETS_BY_ID, CONSUMABLES_BY_ID } from '../gamedata/items';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import SkillTooltip from './SkillTooltip';
import WeaponPartTooltip, { getPartDescNodes, LONG_RANGE_LABELS } from './WeaponPartTooltip';
import WeaponAssemblyView from './WeaponAssemblyView';
import { DAMAGE_TYPE_BY_ID } from '../gamedata/damageTypes';
import './HeroPrepareModal.css';

// Mismos ajustes de rotación/recorte que InventoryPanel.jsx para que un
// arma se vea igual en Aprestar que en el Inventario a esta miniatura.
const OPTION_TILE_ROTATION = { SWORD: -45, SPEAR: -45, WARBELL: -45, STAFF: -45, BOW: 80 };
const OPTION_PART_OVERRIDES = {
  BOW: { c: { left: 180.6, top: 60.5, w: 58, h: 369, z: 3, rot: -95 } },
};

function cleanPartName(name) {
  return (name || '').replace(/\s*\+?\s*✦.*$/, '').trim();
}

// El slot A no tiene clave i18n "slot.<tipo>.A" (nunca hizo falta en el
// resto de la app — WeaponPartTooltip/RecipeTooltip usan esta etiqueta fija
// en su lugar): es la propia arma base, no un accesorio.
const SLOT_A_LABELS = { es: 'Arma', en: 'Weapon', fr: 'Arme', it: 'Arma', pt: 'Arma' };

// Menú a pantalla completa donde el grupo anota qué se lleva un héroe a la
// siguiente partida: armas (propias o rúnicas), habilidades ya
// desbloqueadas, armadura, accesorio y consumibles. No es un mecanismo del
// juego (el save no separa "poseído" de "llevado a la mazmorra") — es una
// nota de planificación de la app, pensada para el mismo hueco que ocupaba
// la lista de habilidades desbloqueadas en la pestaña Partida.
//
// Reglas impuestas (a petición del usuario, calcadas de cómo funciona el
// propio juego):
//  - Máximo 3 consumibles.
//  - Equipar una habilidad o un arma rúnica cuesta XP (1 XP fijo por arma
//    rúnica, el coste propio de cada habilidad) — la suma no puede superar
//    la XP del grupo (saveMeta.partyXP), el mismo presupuesto para las dos
//    cosas.
//  - Es obligatorio llevar exactamente 2 armas (las 2 propias del héroe, o
//    sustituyendo alguna por un arma rúnica que el grupo posea).
//
// Las opciones de armadura/accesorio/consumibles/armas rúnicas solo salen
// del inventario ACTUAL del grupo (gameState.itemInventory) — nunca de
// todos los objetos del juego — para no sugerir que el grupo tiene algo que
// no posee.

const REQUIRED_WEAPON_COUNT = 2;
const MAX_CONSUMABLES = 3;

// Armas rúnicas: piezas de slot A únicas, usables por cualquier héroe (no
// asociadas a ningún WEAPON_* concreto) — mismo criterio que ArmeriaPanel.jsx
// para agruparlas por familia. Aquí solo hace falta la pieza base y la
// mejorada de cada familia, para poder ofrecer la que el grupo tenga.
const RUNIC_FAMILIES = (() => {
  const byName = {};
  for (const p of WEAPON_PARTS) {
    if (p.weaponType !== 'RUNE' || p.slot !== 'A') continue;
    const isUpgraded = p.id.endsWith('_UPGRADED');
    const name = p.id.replace(/^WEAPON_PART_A_/, '').replace(/_UPGRADED$/, '');
    (byName[name] ??= {})[isUpgraded ? 'upgraded' : 'base'] = p;
  }
  return Object.values(byName);
})();

function itemCounts(itemInventory) {
  const counts = {};
  for (const entry of (itemInventory || [])) {
    counts[entry.id] = (counts[entry.id] || 0) + 1;
  }
  return counts;
}

function toggleInSet(set, id) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}

function Section({ title, extra, children }) {
  return (
    <section className="hpm-section">
      <h3 className="hpm-section-title">
        {title}
        {extra && <span className="hpm-section-extra">{extra}</span>}
      </h3>
      <div className="hpm-section-body">{children}</div>
    </section>
  );
}

function OptionRow({ selected, onClick, image, assembly, name, sub, disabled }) {
  return (
    <button
      type="button"
      className={`hpm-option ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <span className="hpm-option-check">{selected ? '✓' : ''}</span>
      {assembly && (
        <span className="hpm-option-assembly">
          <WeaponAssemblyView
            weaponType={assembly.weaponType}
            partA={assembly.partA}
            partB={assembly.partB}
            partC={assembly.partC}
            displayH={36}
            rotation={OPTION_TILE_ROTATION[assembly.weaponType] || 0}
            partOverrides={OPTION_PART_OVERRIDES[assembly.weaponType] || {}}
          />
        </span>
      )}
      {!assembly && image && (
        <img src={image} alt="" className="hpm-option-img"
          onError={e => e.target.style.display = 'none'} />
      )}
      <span className="hpm-option-text">
        <span className="hpm-option-name">{name}</span>
        {sub && <span className="hpm-option-sub">{sub}</span>}
      </span>
    </button>
  );
}

// Efecto/daño/tipo de daño/alcance de una pieza, siempre visible debajo de
// su selector ◄ nombre ► en el editor de piezas — mismo dato que el
// tooltip (getPartDescNodes de WeaponPartTooltip.jsx), pero en línea, para
// no depender de pasar el ratón por encima.
function PartInlineDetails({ part, weapon, lang }) {
  if (!part) return null;
  const descs = getPartDescNodes(part.id, lang);
  const hasStats = part.slot === 'A' && (part.damage > 0 || (part.traits?.length > 0));
  const rangeUnknown = 'range' in part && part.range == null;
  const range = 'range' in part ? part.range : (weapon?.range ?? 0);
  if (!hasStats && !descs.activationNodes && !descs.passiveNodes) return null;

  return (
    <div className="hpm-part-inline-details">
      {hasStats && (
        <span className="wpt-stats">
          {part.traits?.map(traitId => {
            const dt = DAMAGE_TYPE_BY_ID[traitId];
            return dt ? (
              <span key={traitId} className="wpt-chip">
                <img src={dt.icon} alt="" className="wpt-chip-icon" onError={e => e.target.style.display = 'none'} />
                <span>{dt.names[lang] || dt.names.en}</span>
              </span>
            ) : null;
          })}
          {part.damage > 0 && (
            <span className="wpt-chip">
              <img src="/assets/icons/Icon_Damage.png" alt="" className="wpt-chip-icon" onError={e => e.target.style.display = 'none'} />
              <span>{part.damage}</span>
            </span>
          )}
          {rangeUnknown && (
            <span className="wpt-chip">
              <img src="/assets/icons/weapon_range.png" alt="" className="wpt-chip-icon" onError={e => e.target.style.display = 'none'} />
              <span>?</span>
            </span>
          )}
          {range > 0 && (
            <span className="wpt-chip">
              {range === 2 ? (
                <span>{LONG_RANGE_LABELS[lang] || 'Gran alcance'}</span>
              ) : (
                <>
                  <img src="/assets/icons/weapon_range.png" alt="" className="wpt-chip-icon" onError={e => e.target.style.display = 'none'} />
                  <span>{range}</span>
                </>
              )}
            </span>
          )}
        </span>
      )}
      {descs.activationNodes && <p className="hpm-part-inline-effect">{descs.activationNodes}</p>}
      {descs.passiveNodes && (
        <p className={`hpm-part-inline-effect${descs.isAccessory ? '' : ' hpm-part-inline-effect--passive'}`}>
          {descs.isAccessory && descs.chance != null && <span className="rtt-chance-chip">{descs.chance}%</span>}
          {descs.passiveNodes}
        </p>
      )}
    </div>
  );
}

export default function HeroPrepareModal({
  heroId, heroDef, displayName, unlockedSkills, itemInventory, partyXP,
  initialLoadout, lang, t, onSave, onClose,
}) {
  useBodyScrollLock(true);

  const gameState  = useStore(s => s.gameState);
  const equipPartA = useStore(s => s.equipPartA);
  const equipPartB = useStore(s => s.equipPartB);
  const equipPartC = useStore(s => s.equipPartC);

  const [weaponIds, setWeaponIds] = useState(
    () => new Set(initialLoadout?.weaponIds ?? heroDef?.weapons ?? [])
  );
  const [skillIds, setSkillIds] = useState(() => new Set(initialLoadout?.skillIds ?? []));
  const [armorId, setArmorId] = useState(initialLoadout?.armorId ?? null);
  const [trinketId, setTrinketId] = useState(initialLoadout?.trinketId ?? null);
  const [consumableIds, setConsumableIds] = useState(
    () => new Set(initialLoadout?.consumableIds ?? [])
  );
  // Id del arma propia cuyo editor de piezas está desplegado (null = ninguno);
  // solo tiene sentido para armas propias (A/B/C independientes) — las
  // rúnicas son una pieza única sin piezas alternativas que elegir.
  const [expandedWeaponId, setExpandedWeaponId] = useState(null);

  const counts = itemCounts(itemInventory);

  // Arma rúnica poseída de cada familia: se prefiere la mejorada si el
  // grupo tiene las dos versiones.
  const runicWeaponOptions = RUNIC_FAMILIES
    .map(fam => (counts[fam.upgraded?.id] > 0 ? fam.upgraded : (counts[fam.base?.id] > 0 ? fam.base : null)))
    .filter(Boolean);

  // Pieza EFECTIVA de un slot (A/B/C) de un arma propia del héroe: la
  // selección pendiente (gameState.partXSelections, igual que Armería) si
  // existe, si no la que trae el arma equipada en el save, si no la pieza
  // base (nivel 0) de ese tipo — mismo criterio que ArmeriaPanel.jsx.
  function getEffectivePartId(weaponId, slot) {
    const selKey = slot === 'A' ? 'partASelections' : slot === 'B' ? 'partBSelections' : 'partCSelections';
    const selMap = gameState?.[selKey] || {};
    if (selMap[weaponId]) return selMap[weaponId];
    const hero = gameState?.heroes?.find(h => h.heroId === heroId);
    const equipped = hero?.equippedWeapons?.find(w => w.id === weaponId);
    const field = slot === 'A' ? 'partA' : slot === 'B' ? 'partB' : 'partC';
    if (equipped?.[field]) return equipped[field];
    const weaponType = WEAPONS_BY_ID[weaponId]?.weaponType;
    return `WEAPON_PART_${slot}_${weaponType}_0`;
  }

  // Cada arma propia del héroe cuesta 0 XP; cada arma rúnica cuesta 1 XP
  // (el propio juego lo llama "Cuesta 1 XP para equipar"). Las armas
  // propias no tienen icono propio en los assets del juego (ver
  // CLAUDE.md) — se muestra el arma ENSAMBLADA con sus piezas A/B/C
  // EQUIPADAS, igual que en Armería/Inventario, en vez de un icono suelto.
  const weaponOptions = [
    ...(heroDef?.weapons ?? []).map(wid => ({
      id: wid, xpCost: 0, isRunic: false,
      assembly: {
        weaponType: WEAPONS_BY_ID[wid]?.weaponType,
        partA: WEAPON_PARTS_BY_ID[getEffectivePartId(wid, 'A')],
        partB: WEAPON_PARTS_BY_ID[getEffectivePartId(wid, 'B')],
        partC: WEAPON_PARTS_BY_ID[getEffectivePartId(wid, 'C')],
      },
      name: getName(WEAPONS_BY_ID[wid], lang),
    })),
    ...runicWeaponOptions.map(p => ({ id: p.id, xpCost: 1, image: p.image, isRunic: true, name: cleanPartName(getName(p, lang)) })),
  ];

  // Piezas disponibles para ese slot: solo las que el grupo posee (mismo
  // criterio que Armería — no se ofrece nada que no se tenga), más la que
  // esté equipada ahora mismo aunque no se posea (para que nunca desaparezca
  // del ciclo), ordenadas por nivel.
  function getSlotOptions(weaponId, slot) {
    const weaponType = WEAPONS_BY_ID[weaponId]?.weaponType;
    const currentId = getEffectivePartId(weaponId, slot);
    const owned = WEAPON_PARTS.filter(p => p.slot === slot && p.weaponType === weaponType && counts[p.id] > 0);
    const options = owned.some(p => p.id === currentId)
      ? owned
      : [WEAPON_PARTS_BY_ID[currentId], ...owned].filter(Boolean);
    return options.slice().sort((a, b) => a.level - b.level);
  }

  function navigatePart(weaponId, slot, dir) {
    const options = getSlotOptions(weaponId, slot);
    if (options.length <= 1) return;
    const currentId = getEffectivePartId(weaponId, slot);
    const idx = options.findIndex(p => p.id === currentId);
    const newId = options[(Math.max(idx, 0) + dir + options.length) % options.length]?.id;
    if (!newId) return;
    if (slot === 'A') equipPartA(weaponId, newId);
    else if (slot === 'B') equipPartB(weaponId, newId);
    else equipPartC(weaponId, newId);
  }

  const armorOptions = Object.values(ARMORS_BY_ID).filter(
    a => heroDef?.armorTypes?.includes(a.armorType) && counts[a.id] > 0
  );
  const trinketOptions = Object.values(TRINKETS_BY_ID).filter(
    it => counts[it.id] > 0 && (!it.limitedHeroIds?.length || it.limitedHeroIds.includes(heroId))
  );
  const consumableOptions = Object.values(CONSUMABLES_BY_ID).filter(
    it => counts[it.id] > 0 && (!it.limitedHeroIds?.length || it.limitedHeroIds.includes(heroId))
  );

  const skillById = Object.fromEntries(unlockedSkills.map(s => [s.id, s]));
  const weaponById = Object.fromEntries(weaponOptions.map(w => [w.id, w]));

  const spentXP = [...skillIds].reduce((sum, id) => sum + (skillById[id]?.xpCost || 0), 0)
    + [...weaponIds].reduce((sum, id) => sum + (weaponById[id]?.xpCost || 0), 0);
  const availableXP = partyXP ?? 0;
  const xpOverBudget = spentXP > availableXP;

  const weaponCountValid = weaponIds.size === REQUIRED_WEAPON_COUNT;
  const canSave = weaponCountValid && !xpOverBudget;

  function toggleConsumable(id) {
    setConsumableIds(s => {
      if (s.has(id)) return toggleInSet(s, id);
      if (s.size >= MAX_CONSUMABLES) return s; // límite alcanzado, no hace nada
      return toggleInSet(s, id);
    });
  }

  function handleSave() {
    if (!canSave) return;
    onSave({
      weaponIds: [...weaponIds],
      skillIds: [...skillIds],
      armorId,
      trinketId,
      consumableIds: [...consumableIds],
    });
  }

  return createPortal(
    <div className="hpm-overlay">
      <div className="hpm-screen">
        <header className="hpm-header">
          <span className="hpm-header-title">{t('prepare.title', { hero: displayName })}</span>
          <button type="button" className="hpm-close-btn" onClick={onClose} aria-label={t('prepare.cancel')}>✕</button>
        </header>

        <div className="hpm-body">
          <Section
            title={t('prepare.weapons')}
            extra={
              <span className={weaponCountValid ? 'hpm-count-ok' : 'hpm-count-bad'}>
                {weaponIds.size}/{REQUIRED_WEAPON_COUNT}
              </span>
            }
          >
            <div className="hpm-options-grid">
              {weaponOptions.map(w => {
                // Para armas propias, el tooltip muestra la pieza A
                // EFECTIVA (equipada o seleccionada), que lleva el daño/
                // tipo de daño/alcance/efecto reales — igual que en
                // Armería. Las rúnicas ya son ellas mismas esa pieza y no
                // tienen piezas B/C aparte que mostrar.
                const tooltipPartId = w.isRunic ? w.id : getEffectivePartId(w.id, 'A');
                const otherPartIds = w.isRunic
                  ? []
                  : [getEffectivePartId(w.id, 'B'), getEffectivePartId(w.id, 'C')];
                return (
                  <div className="hpm-weapon-row" key={w.id}>
                    <WeaponPartTooltip partId={tooltipPartId} otherPartIds={otherPartIds}>
                      <OptionRow
                        selected={weaponIds.has(w.id)}
                        onClick={() => setWeaponIds(s => toggleInSet(s, w.id))}
                        image={w.image}
                        assembly={w.assembly}
                        name={w.name}
                        sub={w.xpCost > 0 ? `${w.xpCost} XP` : null}
                      />
                    </WeaponPartTooltip>
                    {!w.isRunic && (
                      <button
                        type="button"
                        className="hpm-edit-parts-btn"
                        title={t('prepare.editParts', { weapon: w.name })}
                        onClick={() => setExpandedWeaponId(id => id === w.id ? null : w.id)}
                      >
                        •••
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {!weaponCountValid && (
              <p className="hpm-warning">{t('prepare.weaponsRequired')}</p>
            )}
            {expandedWeaponId && (() => {
              const editingWeapon = weaponOptions.find(w => w.id === expandedWeaponId);
              if (!editingWeapon) return null;
              const weaponType = WEAPONS_BY_ID[expandedWeaponId]?.weaponType;
              return (
                <div className="hpm-part-editor">
                  <div className="hpm-part-editor-title">
                    {t('prepare.editParts', { weapon: editingWeapon.name })}
                  </div>
                  {['A', 'B', 'C'].map(slot => {
                    const options = getSlotOptions(expandedWeaponId, slot);
                    const currentId = getEffectivePartId(expandedWeaponId, slot);
                    const part = WEAPON_PARTS_BY_ID[currentId];
                    const idx = options.findIndex(p => p.id === currentId);
                    return (
                      <Fragment key={slot}>
                        <div className="hpm-part-slot-row">
                          <span className="hpm-part-slot-label">
                            {slot === 'A' ? (SLOT_A_LABELS[lang] || 'Arma') : t(`slot.${weaponType}.${slot}`)}
                          </span>
                          <button
                            type="button"
                            className="hpm-part-nav-btn"
                            disabled={options.length <= 1}
                            onClick={() => navigatePart(expandedWeaponId, slot, -1)}
                          >◄</button>
                          <WeaponPartTooltip partId={currentId}>
                            <span className="hpm-part-slot-name">
                              {part ? cleanPartName(getName(part, lang)) : '—'}
                            </span>
                          </WeaponPartTooltip>
                          <button
                            type="button"
                            className="hpm-part-nav-btn"
                            disabled={options.length <= 1}
                            onClick={() => navigatePart(expandedWeaponId, slot, 1)}
                          >►</button>
                          <span className="hpm-part-slot-counter">
                            {options.length > 0 ? `${Math.max(idx, 0) + 1}/${options.length}` : '—'}
                          </span>
                        </div>
                        <PartInlineDetails part={part} weapon={WEAPONS_BY_ID[expandedWeaponId]} lang={lang} />
                      </Fragment>
                    );
                  })}
                </div>
              );
            })()}
          </Section>

          <Section
            title={t('prepare.skills')}
            extra={
              <span className={xpOverBudget ? 'hpm-count-bad' : 'hpm-count-ok'}>
                {spentXP}/{availableXP} XP
              </span>
            }
          >
            {unlockedSkills.length === 0 ? (
              <p className="hpm-empty">{t('gameinfo.noSkills')}</p>
            ) : (
              <div className="hpm-options-grid">
                {unlockedSkills.map(skill => {
                  const name = skill.names?.[lang] || skill.names?.es || skill.id;
                  return (
                    <SkillTooltip key={skill.id} skill={skill} lang={lang}>
                      <OptionRow
                        selected={skillIds.has(skill.id)}
                        onClick={() => setSkillIds(s => toggleInSet(s, skill.id))}
                        name={name}
                        sub={`${skill.xpCost} XP`}
                      />
                    </SkillTooltip>
                  );
                })}
              </div>
            )}
            {xpOverBudget && (
              <p className="hpm-warning">{t('prepare.xpOverBudget')}</p>
            )}
          </Section>

          <Section title={t('prepare.armor')}>
            {armorOptions.length === 0 ? (
              <p className="hpm-empty">{t('prepare.noneInInventory')}</p>
            ) : (
              <div className="hpm-options-grid">
                <OptionRow
                  selected={armorId === null}
                  onClick={() => setArmorId(null)}
                  name={t('prepare.none')}
                />
                {armorOptions.map(a => (
                  <OptionRow
                    key={a.id}
                    selected={armorId === a.id}
                    onClick={() => setArmorId(a.id)}
                    image={a.image}
                    name={getName(a, lang)}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title={t('prepare.trinket')}>
            {trinketOptions.length === 0 ? (
              <p className="hpm-empty">{t('prepare.noneInInventory')}</p>
            ) : (
              <div className="hpm-options-grid">
                <OptionRow
                  selected={trinketId === null}
                  onClick={() => setTrinketId(null)}
                  name={t('prepare.none')}
                />
                {trinketOptions.map(it => (
                  <OptionRow
                    key={it.id}
                    selected={trinketId === it.id}
                    onClick={() => setTrinketId(it.id)}
                    image={it.image}
                    name={getName(it, lang)}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section
            title={t('prepare.consumables')}
            extra={
              <span className={consumableIds.size >= MAX_CONSUMABLES ? 'hpm-count-bad' : 'hpm-count-ok'}>
                {consumableIds.size}/{MAX_CONSUMABLES}
              </span>
            }
          >
            {consumableOptions.length === 0 ? (
              <p className="hpm-empty">{t('prepare.noneInInventory')}</p>
            ) : (
              <div className="hpm-options-grid">
                {consumableOptions.map(it => {
                  const selected = consumableIds.has(it.id);
                  const atCap = !selected && consumableIds.size >= MAX_CONSUMABLES;
                  return (
                    <OptionRow
                      key={it.id}
                      selected={selected}
                      disabled={atCap}
                      onClick={() => toggleConsumable(it.id)}
                      image={it.image}
                      name={getName(it, lang)}
                      sub={counts[it.id] > 1 ? `×${counts[it.id]}` : null}
                    />
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        <footer className="hpm-footer">
          {!canSave && <span className="hpm-footer-warning">{t('prepare.cannotSave')}</span>}
          <button type="button" className="btn btn-sm" onClick={onClose}>
            {t('prepare.cancel')}
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={handleSave} disabled={!canSave}>
            {t('prepare.save')}
          </button>
        </footer>
      </div>
    </div>
  , document.body);
}
