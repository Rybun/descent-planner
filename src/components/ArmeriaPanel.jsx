import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { HEROES, HEROES_BY_ID } from '../gamedata/heroes';
import { WEAPONS_BY_ID } from '../gamedata/weapons';
import { WEAPON_PARTS, WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { DESCRIPTIONS } from '../gamedata/descriptions';
import { WEAPON_ABILITY_DESCS } from '../gamedata/weaponAbilityDescs';
import { ASSEMBLY_DISPLAY_H } from '../gamedata/weaponAssembly';
import WeaponAssemblyView from './WeaponAssemblyView';
import { DAMAGE_TYPE_BY_ID } from '../gamedata/damageTypes';
import { PART_ABILITY_KEY, WEAPON_ABILITIES, ABILITY_CHANCE } from '../gamedata/weaponAbilities';
import Tooltip from './Tooltip';
import './ArmeriaPanel.css';

const UPGRADE_ICON = '/assets/icons/Icon_Upgrade.png';

function cleanName(name) {
  return (name || '').replace(/\s*\+?\s*✦.*$/, '').trim();
}

// Nombre de una parte de arma con el icono de mejora si es la versión "+"
// (mismo patrón que CraftPanel/ShopPanel/ItemTooltip en el resto de la app).
function renderPartName(part, lang) {
  if (!part) return '—';
  const name = cleanName(getName(part, lang));
  if (!part.id?.endsWith('_UPGRADED')) return name;
  return (
    <>
      <span>{name}</span>
      <img src={UPGRADE_ICON} alt="+" style={{ width: '1em', height: '1em', verticalAlign: 'middle', marginLeft: '3px' }}
        onError={e => e.target.style.display = 'none'} />
    </>
  );
}

// Armas rúnicas: piezas de slot A únicas, usables por cualquier héroe (no
// asociadas a ningún WEAPON_* concreto). Cada una es una "familia" fija de
// A+B+C sin mezcla posible entre familias (ver comentario en extract.py,
// SPECIAL_WEAPON_PARTS): agrupamos aquí por nombre para poder recorrerlas.
const RUNIC_FAMILIES = (() => {
  const byName = {};
  for (const p of WEAPON_PARTS) {
    if (p.weaponType !== 'RUNE' || p.slot !== 'A' || p.id.endsWith('_UPGRADED')) continue;
    const name = p.id.replace(/^WEAPON_PART_A_/, '');
    byName[name] = {
      name,
      level:      p.level,
      baseId:     p.id,
      upgradedId: `${p.id}_UPGRADED`,
      bId:        `WEAPON_PART_B_${name}`,
      cId:        `WEAPON_PART_C_${name}`,
    };
  }
  return Object.values(byName).sort((a, b) => a.level - b.level);
})();

function familyNameOfPartAId(partAId) {
  return (partAId || '').replace(/^WEAPON_PART_A_/, '').replace(/_UPGRADED$/, '');
}

export default function ArmeriaPanel() {
  const t    = useT();
  const lang = useLang();

  const gameState   = useStore(s => s.gameState);
  const saveMeta    = useStore(s => s.saveMeta);
  const equipPartA          = useStore(s => s.equipPartA);
  const equipPartB          = useStore(s => s.equipPartB);
  const equipPartC          = useStore(s => s.equipPartC);
  const setHeroRunicSlot    = useStore(s => s.setHeroRunicSlot);
  const selectedHeroId      = useStore(s => s.selectedArmeriaHeroId);
  const setSelectedHeroId   = useStore(s => s.setSelectedArmeriaHeroId);

  const partASelections = gameState?.partASelections || {};
  const partBSelections = gameState?.partBSelections || {};
  const partCSelections = gameState?.partCSelections || {};
  const heroRunicSlot   = gameState?.heroRunicSlot || {};
  const isAct2 = (saveMeta?.act ?? 0) >= 1;

  if (!gameState) return null;

  const heroesFromSave = {};
  for (const h of (gameState.heroes || [])) {
    heroesFromSave[h.heroId] = h;
  }

  // Id sintético de arma para el hueco `slot` de un héroe cuando muestra una
  // rúnica — reutiliza tal cual el mecanismo de partASelections/equipPartA
  // que ya existe para elegir entre piezas A normales.
  function runicSlotId(heroId, slot) {
    return `RUNIC_${heroId}_${slot}`;
  }

  // Familias rúnicas que el grupo posee (base o mejorada) en el inventario.
  const ownedRunicFamilies = RUNIC_FAMILIES.filter(f =>
    (gameState.itemInventory || []).some(i => i.id === f.baseId || i.id === f.upgradedId)
  );

  // Familia actualmente elegida por un héroe en su hueco rúnico (si tiene
  // uno activo), derivada de la misma selección de pieza A de siempre.
  function currentRunicFamily(heroId) {
    const slot = heroRunicSlot[heroId];
    if (slot === undefined) return null;
    const sid = runicSlotId(heroId, slot);
    const defaultFamily = ownedRunicFamilies[0];
    const aId = partASelections[sid]
      ?? (defaultFamily ? (
        (gameState.itemInventory || []).some(i => i.id === defaultFamily.upgradedId)
          ? defaultFamily.upgradedId : defaultFamily.baseId
      ) : null);
    return aId ? familyNameOfPartAId(aId) : null;
  }

  // Familias ya en uso por OTROS héroes (exclusividad: solo un personaje
  // puede llevar una rúnica concreta a la vez).
  function familiesTakenByOthers(heroId) {
    const taken = new Set();
    for (const hid of Object.keys(heroRunicSlot)) {
      if (hid === heroId) continue;
      const fam = currentRunicFamily(hid);
      if (fam) taken.add(fam);
    }
    return taken;
  }

  const selectedHero  = HEROES_BY_ID[selectedHeroId];
  const heroSaveData  = heroesFromSave[selectedHeroId];

  // Nombre del héroe localizado
  const heroName = (() => {
    const tKey = t(`hero.${selectedHeroId}`);
    return tKey.startsWith('hero.') ? (selectedHero?.name || selectedHeroId) : tKey;
  })();

  // Inventario de piezas A/B/C por tipo de arma
  const inventoryBySlotType = { A: {}, B: {}, C: {} };
  for (const item of (gameState.itemInventory || [])) {
    const part = WEAPON_PARTS_BY_ID[item.id];
    if (!part || !['A', 'B', 'C'].includes(part.slot)) continue;
    const bucket = inventoryBySlotType[part.slot];
    if (!bucket[part.weaponType]) bucket[part.weaponType] = [];
    if (!bucket[part.weaponType].find(p => p.id === part.id)) {
      bucket[part.weaponType].push(part);
    }
  }

  function getWeaponConfig(weaponSaveData) {
    if (!weaponSaveData) return null;
    const weapon        = WEAPONS_BY_ID[weaponSaveData.id];
    const equippedPartA = WEAPON_PARTS_BY_ID[weaponSaveData.partA];
    const equippedPartB = WEAPON_PARTS_BY_ID[weaponSaveData.partB];
    const equippedPartC = WEAPON_PARTS_BY_ID[weaponSaveData.partC];

    const weaponType = equippedPartA?.weaponType
      || equippedPartB?.weaponType
      || weapon?.weaponType
      || '';

    const ownedAs = (inventoryBySlotType.A[weaponType] || []).sort((a, b) => a.level - b.level);
    const allPartAOptions = [...ownedAs];
    if (equippedPartA && !allPartAOptions.find(p => p.id === equippedPartA.id)) {
      allPartAOptions.unshift(equippedPartA);
    }
    const selectedPartAId = partASelections[weaponSaveData.id] ?? weaponSaveData.partA;
    const selectedPartA   = WEAPON_PARTS_BY_ID[selectedPartAId] || equippedPartA;
    let selectedAIdx = allPartAOptions.findIndex(p => p?.id === selectedPartAId);
    if (selectedAIdx < 0) selectedAIdx = 0;

    const ownedBs = (inventoryBySlotType.B[weaponType] || []).sort((a, b) => a.level - b.level);
    const allPartBOptions = [...ownedBs];
    if (equippedPartB && !allPartBOptions.find(p => p.id === equippedPartB.id)) {
      allPartBOptions.unshift(equippedPartB);
    }
    const selectedPartBId = partBSelections[weaponSaveData.id] ?? weaponSaveData.partB;
    const selectedPartB   = WEAPON_PARTS_BY_ID[selectedPartBId] || equippedPartB;
    let selectedBIdx = allPartBOptions.findIndex(p => p?.id === selectedPartBId);
    if (selectedBIdx < 0) selectedBIdx = 0;

    const ownedCs = (inventoryBySlotType.C[weaponType] || []).sort((a, b) => a.level - b.level);
    const allPartCOptions = [...ownedCs];
    if (equippedPartC && !allPartCOptions.find(p => p.id === equippedPartC.id)) {
      allPartCOptions.unshift(equippedPartC);
    }
    const selectedPartCId = partCSelections[weaponSaveData.id] ?? weaponSaveData.partC;
    const selectedPartC   = WEAPON_PARTS_BY_ID[selectedPartCId] || equippedPartC;
    let selectedCIdx = allPartCOptions.findIndex(p => p?.id === selectedPartCId);
    if (selectedCIdx < 0) selectedCIdx = 0;

    return {
      weapon, weaponType,
      allPartAOptions, selectedPartA, selectedAIdx,
      allPartBOptions, selectedPartB, selectedBIdx,
      allPartCOptions, selectedPartC, selectedCIdx,
    };
  }

  function handlePartANav(weaponSaveId, direction, config) {
    const total = config.allPartAOptions.length;
    if (total <= 1) return;
    const newIdx = ((config.selectedAIdx + direction) + total) % total;
    equipPartA(weaponSaveId, config.allPartAOptions[newIdx].id);
  }

  function handlePartBNav(weaponSaveId, direction, config) {
    const total = config.allPartBOptions.length;
    if (total <= 1) return;
    const newIdx = ((config.selectedBIdx + direction) + total) % total;
    equipPartB(weaponSaveId, config.allPartBOptions[newIdx].id);
  }

  function handlePartCNav(weaponSaveId, direction, config) {
    const total = config.allPartCOptions.length;
    if (total <= 1) return;
    const newIdx = ((config.selectedCIdx + direction) + total) % total;
    equipPartC(weaponSaveId, config.allPartCOptions[newIdx].id);
  }

  function getDesc(id) {
    if (!id) return '';
    const base = id.replace(/_UPGRADED$/, '').replace(/_PLUS$/, '');
    return DESCRIPTIONS[base] || DESCRIPTIONS[id] || '';
  }

  // Nombres de slots B/C por tipo de arma (traducciones)
  function getSlotLabels(weaponType) {
    const B = t(`slot.${weaponType}.B`);
    const C = t(`slot.${weaponType}.C`);
    return {
      B: B.startsWith('slot.') ? 'Slot B' : B,
      C: C.startsWith('slot.') ? 'Slot C' : C,
    };
  }

  return (
    <div className="armeria-panel">
      {/* Sidebar de héroes */}
      <aside className="hero-sidebar">
        {HEROES.map(hero => {
          const portraitSrc = isAct2 ? (hero.imageAct2 || hero.image) : hero.image;
          const hName = (() => {
            const tk = t(`hero.${hero.id}`);
            return tk.startsWith('hero.') ? hero.name : tk;
          })();
          return (
            <button
              key={hero.id}
              className={`hero-portrait-btn ${hero.id === selectedHeroId ? 'active' : ''}`}
              onClick={() => setSelectedHeroId(hero.id)}
              title={hName}
            >
              <img
                src={portraitSrc}
                alt={hName}
                className="hero-portrait-img"
                onError={e => e.target.style.display = 'none'}
              />
            </button>
          );
        })}
        <div className="hero-sidebar-spacer" />
      </aside>

      {/* Área principal */}
      <main className="armeria-main">
        {selectedHero && (
          <div className="armeria-hero-name">{heroName}</div>
        )}

        {heroSaveData?.equippedWeapons?.length > 0 ? (
          <div className="weapon-cards-row">
            {heroSaveData.equippedWeapons.map((weaponData, slotIndex) => {
              const isRunicSlot = heroRunicSlot[selectedHeroId] === slotIndex;

              // Familias disponibles para ALTERNAR a rúnica en este hueco:
              // las que el grupo posee, menos las que ya lleva otro héroe y
              // menos la que ya está en el OTRO hueco de este mismo héroe.
              const takenElsewhere = familiesTakenByOthers(selectedHeroId);
              const otherSlotFamily = heroRunicSlot[selectedHeroId] !== undefined && heroRunicSlot[selectedHeroId] !== slotIndex
                ? currentRunicFamily(selectedHeroId) : null;
              const selectableFamilies = ownedRunicFamilies.filter(f =>
                !takenElsewhere.has(f.name) && f.name !== otherSlotFamily
              );
              const canToggleRunic = isRunicSlot || selectableFamilies.length > 0;

              let effectiveWeaponData = weaponData;
              let activeFamily = null;
              if (isRunicSlot) {
                const sid = runicSlotId(selectedHeroId, slotIndex);
                const fallbackFamily = selectableFamilies[0] || ownedRunicFamilies.find(f => f.name === currentRunicFamily(selectedHeroId));
                const defaultAId = fallbackFamily
                  ? ((gameState.itemInventory || []).some(i => i.id === fallbackFamily.upgradedId) ? fallbackFamily.upgradedId : fallbackFamily.baseId)
                  : null;
                const effectiveAId = partASelections[sid] ?? defaultAId;
                activeFamily = familyNameOfPartAId(effectiveAId);
                const fam = RUNIC_FAMILIES.find(f => f.name === activeFamily);
                if (fam && effectiveAId) {
                  effectiveWeaponData = { id: sid, partA: effectiveAId, partB: fam.bId, partC: fam.cId };
                }
              }

              const config = getWeaponConfig(effectiveWeaponData);
              if (!config) return (
                <div key={weaponData.id} className="weapon-card weapon-card-unknown">
                  <span className="weapon-unknown-id">{weaponData.id}</span>
                </div>
              );

              const {
                weapon, weaponType,
                allPartAOptions, selectedPartA, selectedAIdx,
                allPartBOptions, selectedPartB, selectedBIdx,
                allPartCOptions, selectedPartC, selectedCIdx,
              } = config;

              const slotLabels = getSlotLabels(weaponType);
              const isEquipped = !isRunicSlot && selectedPartA?.id === weaponData.partA;

              const weaponName = isRunicSlot
                ? renderPartName(selectedPartA, lang)
                : (weapon ? getName(weapon, lang) : weaponData.id);

              function toggleRunic() {
                if (isRunicSlot) {
                  setHeroRunicSlot(selectedHeroId, null);
                } else if (selectableFamilies.length > 0) {
                  setHeroRunicSlot(selectedHeroId, slotIndex);
                }
              }

              return (
                <div key={weaponData.id} className="weapon-card">

                  <div className="weapon-card-title">
                    {ownedRunicFamilies.length > 0 && (
                      <button
                        className={`weapon-runic-toggle-btn ${isRunicSlot ? 'active' : ''}`}
                        onClick={toggleRunic}
                        disabled={!canToggleRunic}
                        title={isRunicSlot ? t('armeria.runicRevert') : t('armeria.runicSwap')}
                      >◄</button>
                    )}
                    <span className="weapon-card-title-text">{weaponName}</span>
                    {ownedRunicFamilies.length > 0 && (
                      <button
                        className={`weapon-runic-toggle-btn ${isRunicSlot ? 'active' : ''}`}
                        onClick={toggleRunic}
                        disabled={!canToggleRunic}
                        title={isRunicSlot ? t('armeria.runicRevert') : t('armeria.runicSwap')}
                      >►</button>
                    )}
                  </div>
                  {isRunicSlot && (
                    <div className="weapon-runic-badge">{t('armeria.runicBadge')}</div>
                  )}

                  <div className="weapon-card-image-area">
                    <WeaponAssemblyView
                      weaponType={weaponType}
                      partA={selectedPartA}
                      partB={selectedPartB}
                      partC={selectedPartC}
                    />

                    {/* Stats overlay en la parte inferior */}
                    {selectedPartA && selectedPartA.damage > 0 && (
                      <DamageStats part={selectedPartA} lang={lang} />
                    )}

                    <div className="weapon-img-badges">
                      {selectedPartA?.isPromo === 1 && (
                        <span className="badge-promo">✦ Promo</span>
                      )}
                      {isEquipped && (
                        <span className="badge-equipped">{t('armeria.equipped')}</span>
                      )}
                    </div>
                  </div>

                  {/* Selector pieza A */}
                  <div className="part-a-selector">
                    <button
                      className="part-nav-btn"
                      onClick={() => handlePartANav(weaponData.id, -1, config)}
                      disabled={allPartAOptions.length <= 1}
                      title={t('armeria.prev')}
                    >◄</button>
                    <Tooltip text={getDesc(selectedPartA?.id)}>
                      <span className="part-a-name">
                        {renderPartName(selectedPartA, lang)}
                      </span>
                    </Tooltip>
                    <button
                      className="part-nav-btn"
                      onClick={() => handlePartANav(weaponData.id, 1, config)}
                      disabled={allPartAOptions.length <= 1}
                      title={t('armeria.next')}
                    >►</button>
                  </div>

                  {allPartAOptions.length > 1 && (
                    <div className="part-a-counter">
                      {selectedAIdx + 1} / {allPartAOptions.length}
                    </div>
                  )}

                  <WeaponAbilities
                    weaponType={weaponType}
                    level={selectedPartA?.level}
                    isUpgraded={selectedPartA?.id?.endsWith('_UPGRADED') ?? false}
                    lang={lang}
                  />

                  {/* Slot B */}
                  <SlotRow
                    label={slotLabels.B}
                    options={allPartBOptions}
                    selectedPart={selectedPartB}
                    selectedIdx={selectedBIdx}
                    equippedId={weaponData.partB}
                    onNav={(dir) => handlePartBNav(weaponData.id, dir, config)}
                    getDesc={getDesc}
                    noUpgradeLabel={t('armeria.noUpgrade')}
                    prevLabel={t('armeria.prev')}
                    nextLabel={t('armeria.next')}
                    lang={lang}
                  />

                  {/* Slot C */}
                  <SlotRow
                    label={slotLabels.C}
                    options={allPartCOptions}
                    selectedPart={selectedPartC}
                    selectedIdx={selectedCIdx}
                    equippedId={weaponData.partC}
                    onNav={(dir) => handlePartCNav(weaponData.id, dir, config)}
                    getDesc={getDesc}
                    noUpgradeLabel={t('armeria.noUpgrade')}
                    prevLabel={t('armeria.prev')}
                    nextLabel={t('armeria.next')}
                    lang={lang}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('armeria.noWeaponData')}</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Parser de rich text del juego → React nodes ─────────────────────────────

// Términos con icono inline (iconos extraídos del atlas SDF del juego)
const TERM_ICONS = {
  TERM_HEALTH_DIAL: '/assets/icons/Icon_Health.png',   // U+F5D0
  TERM_DAMAGE:      '/assets/icons/Icon_Damage.png',   // U+F5E5
  TERM_ACTIONS:     '/assets/icons/Icon_Action.png',   // U+F5E4
  TERM_FATIGUE:     '/assets/icons/Icon_Fatigue.png',  // U+F5E3
  TERM_SUCCESS:     '/assets/icons/Icon_Success.png',  // U+F5E8
  TERM_ADVANTAGE:   '/assets/icons/Icon_Advantage.png',// U+F5DE
  TERM_SURGE:       '/assets/icons/Icon_Surge.png',    // U+F5E1
  TERM_UPGRADE:     '/assets/icons/Icon_Upgrade.png',  // U+F5E2
};

function parseGameText(text) {
  if (!text) return [];
  const pattern = /<style=[^>]+><link=([^>]+)>(.*?)<\/link><\/style>|<[^>]+>/g;
  const parts = [];
  let last = 0, match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push({ t: 'text', s: text.slice(last, match.index) });
    if (match[1]) {
      // es un término con link
      parts.push({ t: 'term', key: match[1], content: match[2] });
    }
    // si no tiene match[1] es una etiqueta suelta (ej. <style=...>) → ignorar
    last = pattern.lastIndex;
  }
  if (last < text.length) parts.push({ t: 'text', s: text.slice(last) });
  return parts;
}

function AbilityDesc({ partId, lang }) {
  const baseId      = partId?.replace(/_UPGRADED$/, '');
  const isUpgraded  = baseId !== partId;
  const abilityKey  = PART_ABILITY_KEY[baseId] || PART_ABILITY_KEY[partId];
  const isNoAbility = !abilityKey;

  // Para la pieza mejorada, la habilidad nombrada tiene su propio texto y
  // probabilidad bajo la clave `${abilityKey}+` (ver weaponAbilityDescs.js).
  // Antes esto siempre se quedaba con el texto BASE aunque se mostrara la
  // pieza "+", porque WEAPON_ABILITIES no tenía variantes con sufijo.
  const upgradedKey = isUpgraded ? `${abilityKey}+` : null;
  const descEntry = isNoAbility
    ? null
    : (upgradedKey && WEAPON_ABILITY_DESCS[upgradedKey]) || WEAPON_ABILITY_DESCS[abilityKey];

  const rawText = isNoAbility
    ? (WEAPON_ABILITIES['UI_NO_ABILITY']?.[lang] || WEAPON_ABILITIES['UI_NO_ABILITY']?.es || '')
    : (descEntry?.[lang] || descEntry?.es || '');

  if (!rawText) return null;

  const nodes = parseGameText(rawText);
  const chanceKey = (upgradedKey && ABILITY_CHANCE[upgradedKey] != null) ? upgradedKey : abilityKey;
  const chance = abilityKey ? (ABILITY_CHANCE[chanceKey] ?? null) : null;

  return (
    <div className="ability-desc-wrapper">
      {chance !== null && chance > 0 && (
        <span className="ability-chance-badge">{chance}%</span>
      )}
      <p className={`ability-desc ${isNoAbility ? 'ability-desc--empty' : ''}`}>
        {nodes.map((node, i) => {
          if (node.t === 'text') return <span key={i}>{node.s}</span>;
          const iconSrc = TERM_ICONS[node.key];
          if (iconSrc) return (
            <img key={i} src={iconSrc} alt={node.key}
              className="ability-term-icon"
              onError={e => e.target.style.display = 'none'} />
          );
          if (node.content && !/^[\ue000-\uf8ff\s]+$/.test(node.content))
            return <em key={i} className="ability-term">{node.content}</em>;
          return null;
        })}
      </p>
    </div>
  );
}

// ─── Habilidades intrínsecas del arma (WEAPON_ABILITY_{TYPE}_{1|2|3}) ────────

function WeaponAbilities({ weaponType, level, isUpgraded, lang }) {
  if (!weaponType || !level) return null;

  const base  = `WEAPON_ABILITY_${weaponType}_${level}`;
  const key   = isUpgraded && WEAPON_ABILITY_DESCS[`${base}_UPGRADED`] ? `${base}_UPGRADED` : base;
  const entry = WEAPON_ABILITY_DESCS[key];
  if (!entry) return null;
  const raw  = entry[lang] || entry.es || '';
  if (!raw) return null;
  const text = raw.replace(/^"|"$/g, '').trim();
  if (!text) return null;

  return (
    <div className="weapon-abilities-section">
      <p className="weapon-ability-row">
        {parseGameText(text).map((node, i) => {
          if (node.t === 'text') return <span key={i}>{node.s}</span>;
          const iconSrc = TERM_ICONS[node.key];
          if (iconSrc) return (
            <img key={i} src={iconSrc} alt={node.key}
              className="ability-term-icon"
              onError={e => e.target.style.display = 'none'} />
          );
          if (node.content && node.content.trim())
            return <em key={i} className="ability-term">{node.content}</em>;
          return null;
        })}
      </p>
    </div>
  );
}

// ─── Fila de slot B o C con navegación ────────────────────────────────────────

function SlotRow({ label, options, selectedPart, selectedIdx, onNav, getDesc, noUpgradeLabel, prevLabel, nextLabel, lang }) {
  const hasNav    = options.length > 1;
  const noUpgrade = selectedPart?.level === 0;

  return (
    <div className="slot-row">
      <div className="slot-row-header">
        <span className="slot-label-name">{label}</span>
        <span className="slot-counter">
          {hasNav ? `${selectedIdx + 1}/${options.length}` : ''}
        </span>
      </div>

      {/* Siempre se muestra la fila con flechas; deshabilitadas si no hay opciones */}
      <div className="slot-nav-row">
        <button
          className="part-nav-btn slot-nav-btn"
          onClick={() => onNav(-1)}
          disabled={!hasNav}
          title={prevLabel}
        >◄</button>
        <Tooltip text={getDesc(selectedPart?.id)}>
          <span className="slot-part-name">
            {renderPartName(selectedPart, lang)}
          </span>
        </Tooltip>
        <button
          className="part-nav-btn slot-nav-btn"
          onClick={() => onNav(1)}
          disabled={!hasNav}
          title={nextLabel}
        >►</button>
      </div>

      {/* Descripción de la ability */}
      {selectedPart && (
        <AbilityDesc partId={selectedPart.id} lang={lang} />
      )}
    </div>
  );
}

// ─── Badge con esquinas fijas (24×25 px, nunca escalan) ──────────────────────

const CORNERS = [
  { cls: 'sc-tl', src: '/assets/icons/label_corner_tl.png' },
  { cls: 'sc-tr', src: '/assets/icons/label_corner_tr.png' },
  { cls: 'sc-bl', src: '/assets/icons/label_corner_bl.png' },
  { cls: 'sc-br', src: '/assets/icons/label_corner_br.png' },
];

const EDGES = [
  { cls: 'se-t', src: '/assets/icons/label_edge_t.png' },
  { cls: 'se-b', src: '/assets/icons/label_edge_b.png' },
  { cls: 'se-l', src: '/assets/icons/label_edge_l.png' },
  { cls: 'se-r', src: '/assets/icons/label_edge_r.png' },
];

function StatBadge({ children, className = '' }) {
  return (
    <div className={`stat-badge ${className}`}>
      {CORNERS.map(c => (
        <img key={c.cls} className={`sc ${c.cls}`} src={c.src}
          alt="" aria-hidden="true" onError={e => e.target.style.display = 'none'} />
      ))}
      {EDGES.map(e => (
        <div key={e.cls} className={`se ${e.cls}`}
          style={{ backgroundImage: `url(${e.src})`, backgroundSize: '100% 100%' }} />
      ))}
      <div className="sbc">{children}</div>
    </div>
  );
}

// ─── Overlay de stats en la imagen del arma ──────────────────────────────────

function DamageStats({ part, lang }) {
  const dmg    = part.damage || 0;
  const traits = part.traits || [];
  const weapon = WEAPONS_BY_ID[part.weaponId];
  const range  = weapon?.range ?? 0;

  return (
    <div className="weapon-stats-overlay">

      {/* Esquina inferior izquierda: tipos de daño */}
      <div className="weapon-stats-left">
        {traits.map(traitId => {
          const dt = DAMAGE_TYPE_BY_ID[traitId];
          if (!dt) return null;
          const label = (dt.names?.[lang] || dt.names?.en || '').toUpperCase();
          return (
            <StatBadge key={traitId} className="stat-badge-type">
              <img
                src={dt.icon}
                className="stat-badge-icon"
                alt={label}
                onError={e => e.target.style.display = 'none'}
              />
              <span className="stat-badge-text">{label}</span>
            </StatBadge>
          );
        })}
      </div>

      {/* Esquina inferior derecha: rango (si existe) y daño siempre último */}
      <div className="weapon-stats-right">

        {/* Rango: 2 = "GRAN ALCANCE" texto; ≥3 = número + icono */}
        {range === 2 && (
          <StatBadge className="stat-badge-type">
            <span className="stat-badge-text">{'GRAN\nALCANCE'}</span>
          </StatBadge>
        )}
        {range >= 3 && (
          <StatBadge className="stat-badge-inline">
            <span className="stat-badge-num">{range}</span>
            <img
              src="/assets/icons/weapon_range.png"
              className="stat-badge-icon"
              alt="range"
              onError={e => e.target.style.display = 'none'}
            />
          </StatBadge>
        )}

        {/* Daño: siempre la última etiqueta */}
        <StatBadge className="stat-badge-inline">
          <span className="stat-badge-num">{dmg}</span>
          <img
            src="/assets/icons/dmg_value.png"
            className="stat-badge-icon"
            alt="damage"
            onError={e => e.target.style.display = 'none'}
          />
        </StatBadge>

      </div>
    </div>
  );
}

