import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import { WEAPONS_BY_ID } from '../gamedata/weapons';
import { HEROES_BY_ID } from '../gamedata/heroes';
import './ActionLog.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function matName(id, lang) {
  const m = MATERIALS_BY_ID[id];
  return m ? getName(m, lang) : id;
}

function itemName(id, lang) {
  const p = WEAPON_PARTS_BY_ID[id];
  if (p) return getName(p, lang);
  const i = ALL_ITEMS_BY_ID[id];
  if (i) return getName(i, lang);
  return id;
}

function partName(partId, lang) {
  if (!partId) return '—';
  return itemName(partId, lang);
}

// Etiqueta del slot A según idioma
const SLOT_A_LABELS = { es: 'Equipar', en: 'Equip', fr: 'Équiper', it: 'Equipaggia', pt: 'Equipar' };

// Agrupa los cambios de armería por héroe → arma, con nombres en el idioma activo
function groupArmoriaByHero(armoriaChanges, lang, t) {
  const byHero = {};
  for (const { weaponSaveId, slots } of armoriaChanges) {
    const weapon   = WEAPONS_BY_ID[weaponSaveId];
    const heroId   = weapon?.heroId || 'UNKNOWN';
    // Nombre del héroe localizado mediante i18n
    const rawHeroKey = t(`hero.${heroId}`);
    const heroName = rawHeroKey.startsWith('hero.') ? (HEROES_BY_ID[heroId]?.name || heroId) : rawHeroKey;
    // Nombre del arma localizado (format name/nameEn)
    const wepName  = weapon ? getName(weapon, lang) : weaponSaveId;
    const wType    = weapon?.weaponType || '';

    if (!byHero[heroId]) byHero[heroId] = { heroName, weapons: [] };
    byHero[heroId].weapons.push({ wepName, wType, slots });
  }
  return Object.values(byHero);
}

// ── Cálculo de cambios netos ──────────────────────────────────────────────────

function effectiveArmoriaSels(state) {
  const a = {}, b = {}, c = {};
  for (const hero of (state.heroes || [])) {
    for (const w of (hero.equippedWeapons || [])) {
      a[w.id] = (state.partASelections || {})[w.id] ?? w.partA ?? null;
      b[w.id] = (state.partBSelections || {})[w.id] ?? w.partB ?? null;
      c[w.id] = (state.partCSelections || {})[w.id] ?? w.partC ?? null;
    }
  }
  return { a, b, c };
}

function computeNetChanges(originalState, gameState, actionHistory) {
  if (!originalState || !gameState) return null;

  // ── Tienda: materiales ─────────────────────────────────────────────────────
  const matChanges = [];
  const allMatIds = new Set([
    ...Object.keys(originalState.craftingMaterials || {}),
    ...Object.keys(gameState.craftingMaterials || {}),
  ]);
  for (const id of allMatIds) {
    const orig = originalState.craftingMaterials[id] || 0;
    const curr = gameState.craftingMaterials[id] || 0;
    if (curr !== orig) matChanges.push({ id, delta: curr - orig });
  }

  // ── Tienda: ítems (armaduras, consumibles, amuletos) ───────────────────────
  const countItems = (inv) => {
    const c = {};
    for (const e of (inv || [])) c[e.id] = (c[e.id] || 0) + 1;
    return c;
  };
  const origItems = countItems(originalState.itemInventory);
  const currItems = countItems(gameState.itemInventory);
  const allItemIds = new Set([...Object.keys(origItems), ...Object.keys(currItems)]);
  const itemChanges = [];
  for (const id of allItemIds) {
    const delta = (currItems[id] || 0) - (origItems[id] || 0);
    if (delta !== 0) itemChanges.push({ id, delta });
  }

  // ── Sala de creación: recetas crafteadas ───────────────────────────────────
  const origCrafted = new Set((originalState.discoveredRecipes || []).filter(r => r.crafted).map(r => r.id));
  const currCrafted = new Set((gameState.discoveredRecipes || []).filter(r => r.crafted).map(r => r.id));
  const newlyCrafted = [...currCrafted].filter(id => !origCrafted.has(id));
  const unCrafted    = [...origCrafted].filter(id => !currCrafted.has(id));

  // ── Armería: cambios de piezas (con fallback al valor del save) ───────────
  const os = effectiveArmoriaSels(originalState);
  const cs = effectiveArmoriaSels(gameState);
  const allWeaponIds = new Set([...Object.keys(os.a), ...Object.keys(cs.a)]);
  const armoriaChanges = [];

  for (const wid of allWeaponIds) {
    const slots = [
      os.a[wid] !== cs.a[wid] ? { slot: 'A', from: os.a[wid], to: cs.a[wid] } : null,
      os.b[wid] !== cs.b[wid] ? { slot: 'B', from: os.b[wid], to: cs.b[wid] } : null,
      os.c[wid] !== cs.c[wid] ? { slot: 'C', from: os.c[wid], to: cs.c[wid] } : null,
    ].filter(Boolean);
    if (slots.length) armoriaChanges.push({ weaponSaveId: wid, slots });
  }

  const hasShop     = matChanges.length > 0 || itemChanges.length > 0;
  const hasCraft    = newlyCrafted.length > 0 || unCrafted.length > 0;
  const hasArmoria  = armoriaChanges.length > 0;

  return { matChanges, itemChanges, newlyCrafted, unCrafted, armoriaChanges, hasShop, hasCraft, hasArmoria };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ActionLog() {
  const t = useT();
  const lang = useLang();

  const actionHistory  = useStore(s => s.actionHistory);
  const originalState  = useStore(s => s.originalState);
  const gameState      = useStore(s => s.gameState);
  const undoAction     = useStore(s => s.undoAction);
  const resetToSave    = useStore(s => s.resetToSave);
  const exportLog      = useStore(s => s.exportLog);

  if (!originalState) return null;

  const goldDiff = (gameState?.gold ?? 0) - originalState.gold;
  const net      = computeNetChanges(originalState, gameState, actionHistory);
  const hasAny   = net && (net.hasShop || net.hasCraft || net.hasArmoria);

  function handleExport() {
    const text = exportLog();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `descent_sesion_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    if (actionHistory.length === 0) return;
    if (window.confirm(t('log.resetConfirm'))) resetToSave();
  }

  return (
    <div className="action-log">
      {/* Resumen de oro */}
      <div className="log-summary">
        <div className="summary-row">
          <span className="summary-label">{t('log.initialGold')}</span>
          <span className="summary-value">{originalState.gold}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">{t('log.currentGold')}</span>
          <span className="summary-value">{gameState?.gold ?? 0}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">{t('log.diff')}</span>
          <span className={`summary-value ${goldDiff > 0 ? 'positive' : goldDiff < 0 ? 'negative' : ''}`}>
            {goldDiff > 0 ? '+' : ''}{goldDiff}
          </span>
        </div>
      </div>

      {/* Controles */}
      <div className="log-controls">
        <button className="btn btn-sm" onClick={undoAction} disabled={actionHistory.length === 0}>
          {t('log.undoLast')}
        </button>
        <button className="btn btn-sm btn-danger" onClick={handleReset} disabled={actionHistory.length === 0}>
          {t('log.resetAll')}
        </button>
        <button className="btn btn-sm btn-primary" onClick={handleExport} disabled={actionHistory.length === 0}>
          {t('log.export')}
        </button>
      </div>

      {/* Cambios netos agrupados */}
      {!hasAny ? (
        <div className="log-empty">
          <p>{t('log.noActions')}</p>
          <p>{t('log.noActionsHint')}</p>
        </div>
      ) : (
        <div className="log-sections">

          {/* ── TIENDA ── */}
          {net.hasShop && (
            <div className="log-section">
              <div className="log-section-header">
                <img src="/assets/icons/tab_tienda.png" className="log-section-icon" alt="" onError={e => e.target.style.display='none'} />
                <span>{t('tab.tienda')}</span>
              </div>
              {net.matChanges.map(({ id, delta }) => (
                <div key={id} className="log-net-row">
                  <span className={`log-delta ${delta > 0 ? 'pos' : 'neg'}`}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                  <span className="log-net-name">{matName(id, lang)}</span>
                </div>
              ))}
              {net.itemChanges.map(({ id, delta }) => (
                <div key={id} className="log-net-row">
                  <span className={`log-delta ${delta > 0 ? 'pos' : 'neg'}`}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                  <span className="log-net-name">{itemName(id, lang)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── SALA DE CREACIÓN ── */}
          {net.hasCraft && (
            <div className="log-section">
              <div className="log-section-header">
                <img src="/assets/icons/tab_creacion.png" className="log-section-icon" alt="" onError={e => e.target.style.display='none'} />
                <span>{t('tab.crafteo')}</span>
              </div>
              {net.newlyCrafted.map(id => (
                <div key={id} className="log-net-row">
                  <span className="log-delta pos">+</span>
                  <span className="log-net-name">{itemName(id, lang)}</span>
                </div>
              ))}
              {net.unCrafted.map(id => (
                <div key={id} className="log-net-row">
                  <span className="log-delta neg">−</span>
                  <span className="log-net-name">{itemName(id, lang)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── ARMERÍA ── */}
          {net.hasArmoria && (
            <div className="log-section">
              <div className="log-section-header">
                <img src="/assets/icons/tab_armeria.png" className="log-section-icon" alt="" onError={e => e.target.style.display='none'} />
                <span>{t('tab.armeria')}</span>
              </div>
              {groupArmoriaByHero(net.armoriaChanges, lang, t).map(({ heroName, weapons }) => (
                <div key={heroName} className="log-armoria-hero">
                  <span className="log-armoria-heroname">{heroName}</span>
                  {weapons.map(({ wepName, wType, slots }, wi) => (
                    <div key={wi} className="log-armoria-weapon">
                      <span className="log-armoria-wepname">{wepName}</span>
                      {slots.map(({ slot, to }) => {
                        const label = slot === 'A'
                          ? (SLOT_A_LABELS[lang] || 'Equipar')
                          : t(`slot.${wType}.${slot}`);
                        return (
                          <div key={slot} className="log-net-row log-net-row--sub">
                            <span className="log-slot-label">{label}:</span>
                            <span className="log-net-name">{partName(to, lang)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
