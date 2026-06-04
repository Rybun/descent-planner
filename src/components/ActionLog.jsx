import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import { WEAPONS_BY_ID } from '../gamedata/weapons';
import { HEROES_BY_ID } from '../gamedata/heroes';
import { RECIPES_BY_ID } from '../gamedata/recipes';
import { computeNetChanges } from '../utils/netChanges';
import './ActionLog.css';

const UPGRADE_ICON = '/assets/icons/Icon_Upgrade.png';

// ── Helpers ──────────────────────────────────────────────────────────────────

function cleanName(name) {
  return (name || '').replace(/\s*\+?\s*✦.*$/, '').trim();
}

function matName(id, lang) {
  const m = MATERIALS_BY_ID[id];
  return m ? getName(m, lang) : id;
}

function itemName(id, lang) {
  const p = WEAPON_PARTS_BY_ID[id];
  if (p) return cleanName(getName(p, lang));
  const i = ALL_ITEMS_BY_ID[id];
  if (i) return cleanName(getName(i, lang));
  return id;
}

function partName(partId, lang) {
  if (!partId) return '—';
  return itemName(partId, lang);
}

// Resuelve un recipeId → nombre del ítem producido (limpio, sin ✦)
function recipeItemName(recipeId, lang) {
  const recipe = RECIPES_BY_ID[recipeId];
  const itemId  = recipe?.itemId || recipeId.replace(/^RECIPE_/, '');
  const baseId  = itemId.replace(/_UPGRADED$/, '').replace(/_PLUS$/, '');
  const part = WEAPON_PARTS_BY_ID[baseId] || WEAPON_PARTS_BY_ID[itemId];
  if (part) return cleanName(getName(part, lang));
  const item = ALL_ITEMS_BY_ID[itemId] || ALL_ITEMS_BY_ID[baseId];
  if (item) return cleanName(getName(item, lang));
  return baseId || recipeId;
}

function isUpgradeRecipe(recipeId) {
  return recipeId.endsWith('_UPGRADED') || recipeId.endsWith('_PLUS');
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
                  <span className="log-net-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    {recipeItemName(id, lang)}
                    {isUpgradeRecipe(id) && (
                      <img src={UPGRADE_ICON} alt="✦"
                        style={{ width: '1em', height: '1em', flexShrink: 0 }}
                        onError={e => e.target.style.display = 'none'} />
                    )}
                  </span>
                </div>
              ))}
              {net.unCrafted.map(id => (
                <div key={id} className="log-net-row">
                  <span className="log-delta neg">−</span>
                  <span className="log-net-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    {recipeItemName(id, lang)}
                    {isUpgradeRecipe(id) && (
                      <img src={UPGRADE_ICON} alt="✦"
                        style={{ width: '1em', height: '1em', flexShrink: 0 }}
                        onError={e => e.target.style.display = 'none'} />
                    )}
                  </span>
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
