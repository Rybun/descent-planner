import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { HEROES, HEROES_BY_ID } from '../gamedata/heroes';
import { WEAPONS_BY_ID } from '../gamedata/weapons';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { DESCRIPTIONS } from '../gamedata/descriptions';
import { WEAPON_ASSEMBLY, ASSEMBLY_CANVAS, ASSEMBLY_SCALE, ASSEMBLY_DISPLAY_W, ASSEMBLY_DISPLAY_H } from '../gamedata/weaponAssembly';
import { DAMAGE_TYPE_BY_ID } from '../gamedata/damageTypes';
import { PART_ABILITY_KEY, WEAPON_ABILITIES } from '../gamedata/weaponAbilities';
import Tooltip from './Tooltip';
import './ArmeriaPanel.css';

export default function ArmeriaPanel() {
  const t    = useT();
  const lang = useLang();

  const gameState   = useStore(s => s.gameState);
  const saveMeta    = useStore(s => s.saveMeta);
  const equipPartA  = useStore(s => s.equipPartA);
  const equipPartB  = useStore(s => s.equipPartB);
  const equipPartC  = useStore(s => s.equipPartC);
  const [selectedHeroId, setSelectedHeroId] = useState('HERO_BRYNN');

  const partASelections = gameState?.partASelections || {};
  const partBSelections = gameState?.partBSelections || {};
  const partCSelections = gameState?.partCSelections || {};
  const isAct2 = (saveMeta?.act ?? 0) >= 1;

  if (!gameState) return null;

  const heroesFromSave = {};
  for (const h of (gameState.heroes || [])) {
    heroesFromSave[h.heroId] = h;
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
            {heroSaveData.equippedWeapons.map(weaponData => {
              const config = getWeaponConfig(weaponData);
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
              const isEquipped = selectedPartA?.id === weaponData.partA;

              const weaponName = weapon ? getName(weapon, lang) : weaponData.id;

              return (
                <div key={weaponData.id} className="weapon-card">

                  <div className="weapon-card-title">
                    {weaponName}
                  </div>

                  <div className="weapon-card-image-area">
                    <WeaponAssembly
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
                        {selectedPartA ? getName(selectedPartA, lang) : '—'}
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

// Términos con icono inline disponible
const TERM_ICONS = {
  TERM_HEALTH_DIAL: '/assets/icons/Icon_Health.png',
  TERM_DAMAGE:      '/assets/icons/Icon_Damage.png',
  TERM_ACTIONS:     '/assets/icons/Icon_Action_Combat.png',
};

// Términos que en el juego son iconos de dado — mostramos abreviatura Unicode
const TERM_SYMBOLS = {
  TERM_FATIGUE: '⚡',
  TERM_SUCCESS: '✦',
  TERM_SURGE:   '⬡',
  TERM_ADVANTAGE: '◆',
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
  const abilityKey = PART_ABILITY_KEY[partId];
  const isNoAbility = !abilityKey;

  const rawText = isNoAbility
    ? (WEAPON_ABILITIES['UI_NO_ABILITY']?.[lang] || WEAPON_ABILITIES['UI_NO_ABILITY']?.es || '')
    : (WEAPON_ABILITIES[abilityKey]?.[lang] || WEAPON_ABILITIES[abilityKey]?.es || '');

  if (!rawText) return null;

  const nodes = parseGameText(rawText);

  return (
    <p className={`ability-desc ${isNoAbility ? 'ability-desc--empty' : ''}`}>
      {nodes.map((node, i) => {
        if (node.t === 'text') return <span key={i}>{node.s}</span>;
        // término con contenido de texto → mostrar el texto resaltado
        if (node.content) return <em key={i} className="ability-term">{node.content}</em>;
        // término vacío (icono) → icono o símbolo
        const iconSrc = TERM_ICONS[node.key];
        const symbol  = TERM_SYMBOLS[node.key];
        if (iconSrc) return (
          <img key={i} src={iconSrc} alt={node.key}
            className="ability-term-icon"
            onError={e => e.target.style.display = 'none'} />
        );
        if (symbol) return <span key={i} className="ability-term-sym">{symbol}</span>;
        // fallback: nada (el texto del término ya estará en el contenido surrounding)
        return null;
      })}
    </p>
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
            {selectedPart ? getName(selectedPart, lang) : '—'}
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

// ─── Componente de ensamblaje visual ──────────────────────────────────────────

function WeaponAssembly({ weaponType, partA, partB, partC }) {
  const layout = WEAPON_ASSEMBLY[weaponType];

  if (!layout) {
    return (
      <div className="weapon-assembly weapon-assembly-fallback">
        {partA?.image
          ? <img src={partA.image} alt={partA.name}
              className="assembly-layer assembly-layer-a"
              onError={e => e.target.style.display = 'none'} />
          : <div className="weapon-no-image">⚔</div>
        }
      </div>
    );
  }

  const parts = { a: partA, b: partB, c: partC };

  return (
    <div style={{
      width: ASSEMBLY_DISPLAY_W, height: ASSEMBLY_DISPLAY_H,
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: ASSEMBLY_CANVAS.w, height: ASSEMBLY_CANVAS.h,
        transformOrigin: 'top left',
        transform: `scale(${ASSEMBLY_SCALE})`,
      }}>
        {['a', 'b', 'c'].map(slot => {
          const l    = layout[slot];
          const part = parts[slot];
          if (!l || !part?.image) return null;

          let maskStyle = {};
          if (l.maskSlot && parts[l.maskSlot]?.image) {
            const ml = layout[l.maskSlot];
            const maskUrl = `url("${parts[l.maskSlot].image}")`;
            const maskW   = ml ? `${ml.w}px`             : '100%';
            const maskH   = ml ? `${ml.h}px`             : '100%';
            const maskX   = ml ? `${ml.left - l.left}px` : '0px';
            const maskY   = ml ? `${ml.top  - l.top}px`  : '0px';
            maskStyle = {
              WebkitMaskImage: maskUrl, WebkitMaskSize: `${maskW} ${maskH}`,
              WebkitMaskPosition: `${maskX} ${maskY}`, WebkitMaskRepeat: 'no-repeat',
              maskImage: maskUrl, maskSize: `${maskW} ${maskH}`,
              maskPosition: `${maskX} ${maskY}`, maskRepeat: 'no-repeat',
            };
          }

          return (
            <img
              key={slot}
              src={part.image}
              alt={part.name || slot}
              style={{
                position: 'absolute',
                left: l.left, top: l.top, width: l.w, height: l.h,
                zIndex: l.z,
                transform: l.rot ? `rotate(${l.rot}deg)` : undefined,
                transformOrigin: 'center center',
                ...maskStyle,
              }}
              onError={e => e.target.style.display = 'none'}
            />
          );
        })}
        {!partA?.image && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '5rem', color: 'var(--color-text-disabled)', opacity: 0.4,
          }}>⚔</div>
        )}
      </div>
    </div>
  );
}
