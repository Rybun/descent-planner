import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { HEROES, HEROES_BY_ID } from '../gamedata/heroes';
import { WEAPONS_BY_ID } from '../gamedata/weapons';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { DESCRIPTIONS } from '../gamedata/descriptions';
import { WEAPON_ASSEMBLY, ASSEMBLY_CANVAS, ASSEMBLY_SCALE, ASSEMBLY_DISPLAY_W, ASSEMBLY_DISPLAY_H } from '../gamedata/weaponAssembly';
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
                    {isEquipped && (
                      <div className="weapon-img-badges">
                        <span className="badge-equipped">{t('armeria.equipped')}</span>
                      </div>
                    )}
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

// ─── Fila de slot B o C con navegación ────────────────────────────────────────

function SlotRow({ label, options, selectedPart, selectedIdx, onNav, getDesc, noUpgradeLabel, prevLabel, nextLabel, lang }) {
  const hasNav     = options.length > 1;
  const noUpgrade  = selectedPart?.level === 0;

  return (
    <div className="slot-row">
      <div className="slot-row-header">
        <span className="slot-label-name">{label}</span>
        {hasNav && (
          <span className="slot-counter">{selectedIdx + 1}/{options.length}</span>
        )}
      </div>

      {hasNav ? (
        <div className="slot-nav-row">
          <button className="part-nav-btn slot-nav-btn" onClick={() => onNav(-1)} title={prevLabel}>◄</button>
          <Tooltip text={getDesc(selectedPart?.id)}>
            <span className={`slot-part-name ${noUpgrade ? 'slot-default' : ''}`}>
              {noUpgrade ? noUpgradeLabel : (selectedPart ? getName(selectedPart, lang) : '—')}
            </span>
          </Tooltip>
          <button className="part-nav-btn slot-nav-btn" onClick={() => onNav(1)} title={nextLabel}>►</button>
        </div>
      ) : (
        noUpgrade
          ? <span className="slot-default">{noUpgradeLabel}</span>
          : <Tooltip text={getDesc(selectedPart?.id)}>
              <span className="slot-part">
                {selectedPart?.image && (
                  <img src={selectedPart.image} alt="" className="slot-part-icon"
                    onError={e => e.target.style.display = 'none'} />
                )}
                {selectedPart ? getName(selectedPart, lang) : '—'}
              </span>
            </Tooltip>
      )}
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
