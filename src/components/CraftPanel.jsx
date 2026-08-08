import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { CONSUMABLES_BY_ID, ALL_ITEMS_BY_ID } from '../gamedata/items';
import { RECIPES_BY_ID } from '../gamedata/recipes';
import { MATERIALS, MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPONS } from '../gamedata/weapons';
import WeaponPartTooltip from './WeaponPartTooltip';
import ItemTooltip from './ItemTooltip';
import MaterialTooltip from './MaterialTooltip';
import './CraftPanel.css';

const UPGRADE_ICON = '/assets/icons/Icon_Upgrade.png';

// Mapa rápido: weaponType → primer arma con ese tipo (para el nombre)
const WEAPON_BY_TYPE = WEAPONS.reduce((acc, w) => {
  if (!acc[w.weaponType]) acc[w.weaponType] = w;
  return acc;
}, {});

function getWeaponTypeName(weaponType, lang) {
  const w = WEAPON_BY_TYPE[weaponType];
  if (!w) return weaponType;
  return lang === 'en' ? (w.nameEn || w.name) : w.name;
}

// Limpia el sufijo " + ✦" o " ✦" que algunos nombres llevan del juego
function cleanName(name) {
  return (name || '').replace(/\s*\+?\s*✦.*$/, '').trim();
}

// Cualquier receta cuyo ID termina en _UPGRADED o _PLUS es una mejora —
// requiere el objeto base en inventario. Esto incluye mejoras de armas (RUNE / _UPGRADED).
// Las recetas normales de partes de arma (RECIPE_WEAPON_PART_B_SWORD_1) NO terminan en _UPGRADED.
const isItemUpgrade = id =>
  id.endsWith('_UPGRADED') || id.endsWith('_PLUS');

// IDs de categorías — las etiquetas se traducen en el componente
const CATEGORY_DEFS = [
  { id: 'consumibles', tKey: 'craft.cat.consumibles', icon: '🧪', filter: id => id.startsWith('RECIPE_CSM_')         && !isItemUpgrade(id) },
  { id: 'armadura',    tKey: 'craft.cat.armadura',    icon: '🛡',  filter: id => id.startsWith('RECIPE_ARMOR_')       && !isItemUpgrade(id) },
  { id: 'accesorios',  tKey: 'craft.cat.accesorios',  icon: '💍',  filter: id => id.startsWith('RECIPE_TRINKET')      && !isItemUpgrade(id) },
  { id: 'partes',      tKey: 'craft.cat.partes',      icon: '⚔️', filter: id => id.startsWith('RECIPE_WEAPON_PART_') && !isItemUpgrade(id) },
  { id: 'mejoras',     tKey: 'craft.cat.mejoras',     icon: '✨', filter: id => isItemUpgrade(id) },
];

export default function CraftPanel() {
  const t    = useT();
  const lang = useLang();

  const gameState  = useStore(s => s.gameState);
  const craftItem  = useStore(s => s.craftItem);
  const [selectedCategory, setSelectedCategory] = useState('partes');
  const [showCrafted, setShowCrafted] = useState(false);

  if (!gameState) return null;

  const CATEGORIES = CATEGORY_DEFS.map(c => ({ ...c, label: t(c.tKey) }));

  const discoveredRecipeMap = Object.fromEntries(
    (gameState.discoveredRecipes || []).map(r => [r.id, r])
  );
  const allDiscoveredIds = Object.keys(discoveredRecipeMap);

  function hasBaseItem(recipe, recipeId) {
    if (!isItemUpgrade(recipeId)) return true;
    const baseId = (recipe.itemId || '').replace(/_PLUS$/, '').replace(/_UPGRADED$/, '');
    return (gameState.itemInventory || []).some(i => i.id === baseId);
  }

  function canCraft(recipe, recipeId) {
    if (!recipe?.ingredients) return null;
    for (const [matId, qty] of Object.entries(recipe.ingredients)) {
      if ((gameState.craftingMaterials[matId] || 0) < qty) return false;
    }
    if (!hasBaseItem(recipe, recipeId)) return false;
    return true;
  }

  function getMissingIngredients(recipe, recipeId) {
    if (!recipe?.ingredients) return [];
    const missing = Object.entries(recipe.ingredients)
      .filter(([matId, qty]) => (gameState.craftingMaterials[matId] || 0) < qty)
      .map(([matId, qty]) => ({
        matId,
        need: qty,
        have: gameState.craftingMaterials[matId] || 0,
      }));
    if (isItemUpgrade(recipeId) && !hasBaseItem(recipe, recipeId)) {
      const baseId = (recipe.itemId || '').replace(/_PLUS$/, '').replace(/_UPGRADED$/, '');
      missing.push({ matId: baseId, need: 1, have: 0, isBaseItem: true });
    }
    return missing;
  }

  function getItemForRecipe(recipeId) {
    const recipe = RECIPES_BY_ID[recipeId];
    const itemId = recipe?.itemId || recipeId.replace(/^RECIPE_/, '');
    const baseId = itemId.replace(/_UPGRADED$/, '').replace(/_PLUS$/, '');
    return (
      // Para partes de arma: preferir la versión base (misma imagen, sin ✦)
      WEAPON_PARTS_BY_ID[baseId] ||
      WEAPON_PARTS_BY_ID[itemId] ||
      CONSUMABLES_BY_ID[itemId] ||
      CONSUMABLES_BY_ID[baseId] ||
      ALL_ITEMS_BY_ID[itemId] ||
      ALL_ITEMS_BY_ID[baseId] ||
      null
    );
  }

  function isAlreadyCrafted(recipeId) {
    return discoveredRecipeMap[recipeId]?.crafted === true;
  }

  // Mismo ID que se le pasa al tooltip (WeaponPartTooltip/ItemTooltip) para
  // esta receta — se calcula aquí también para poder saber, ANTES de pintar
  // la tarjeta, si lo que produce está puesto ahora mismo en algún héroe.
  function getTooltipId(recipeId, item) {
    const recipe = RECIPES_BY_ID[recipeId];
    const recipeItemId = recipe?.itemId || recipeId.replace(/^RECIPE_/, '');
    const isWeaponPart = item && 'slot' in item;
    const isUpgrade = isItemUpgrade(recipeId);
    return isWeaponPart
      ? recipeItemId
      : (isUpgrade ? recipeItemId : recipeItemId.replace(/_UPGRADED$/, '').replace(/_PLUS$/, ''));
  }

  // Una pieza/amuleto ya equipado debe verse siempre en la lista, esté o no
  // marcada como crafteada — si no, con el filtro por defecto (oculta lo ya
  // crafteado) casi nunca se llega a ver el badge "Ya equipado", porque lo
  // que llevas puesto casi siempre ya está marcado como crafteado.
  function isRecipeItemEquipped(recipeId) {
    const item = getItemForRecipe(recipeId);
    if (!item) return false;
    const tooltipId = getTooltipId(recipeId, item);
    if ('slot' in item) {
      const slotKey = { A: 'partA', B: 'partB', C: 'partC' }[item.slot];
      const selKey  = { A: 'partASelections', B: 'partBSelections', C: 'partCSelections' }[item.slot];
      if (!slotKey) return false;
      const selections = gameState[selKey] || {};
      return (gameState.heroes || []).some(hero =>
        (hero.equippedWeapons || []).some(w => (selections[w.id] ?? w[slotKey] ?? null) === tooltipId)
      );
    }
    if (item.type === 'trinket') {
      return (gameState.heroes || []).some(h => h.equippedTrinketId === tooltipId);
    }
    return false;
  }

  const activeCat   = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];
  const filteredIds = allDiscoveredIds
    .filter(id => activeCat.filter(id))
    .filter(id => showCrafted || !isAlreadyCrafted(id) || isRecipeItemEquipped(id))
    .sort((a, b) => {
      const ac = isAlreadyCrafted(a) ? 1 : 0;
      const bc = isAlreadyCrafted(b) ? 1 : 0;
      if (ac !== bc) return ac - bc;
      return a.localeCompare(b);
    });

  const categoryCounts = Object.fromEntries(
    CATEGORIES.map(cat => [
      cat.id,
      allDiscoveredIds.filter(id => cat.filter(id) && !isAlreadyCrafted(id)).length,
    ])
  );

  const totalMats = MATERIALS.filter(m => (gameState.craftingMaterials[m.id] || 0) > 0);

  return (
    <div className="craft-panel-v2">
      {/* Barra de materiales */}
      <section className="craft-mats-bar">
        <h2 className="craft-mats-title">
          <img src="/assets/icons/Icon_Materials.png" className="inv-section-icon" alt="" onError={e => e.target.style.display = 'none'} />
          {t('craft.materialsLabel')}
        </h2>
        <div className="craft-mats-row">
          {totalMats.length === 0
            ? <span className="craft-mats-empty">{t('craft.noMaterials')}</span>
            : totalMats.map(mat => (
              <MaterialTooltip key={mat.id} mat={mat} lang={lang}>
                <span className="mat-chip">
                  <img src={mat.image} alt="" className="mat-chip-img"
                    onError={e => e.target.style.display = 'none'} />
                  <span className="mat-chip-qty">×{gameState.craftingMaterials[mat.id]}</span>
                </span>
              </MaterialTooltip>
            ))
          }
        </div>
      </section>

      <div className="craft-body">
        {/* Sidebar de categorías */}
        <aside className="craft-cat-sidebar">
          {CATEGORIES.map(cat => {
            const pending = categoryCounts[cat.id];
            return (
              <button
                key={cat.id}
                className={`craft-cat-btn ${cat.id === selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                title={cat.label}
              >
                <span className="craft-cat-icon">{cat.icon}</span>
                <span className="craft-cat-label">{cat.label}</span>
                {pending > 0 && (
                  <span className="craft-cat-badge">{pending}</span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Contenido principal */}
        <div className="craft-main">
          <div className="craft-main-header">
            <h2 className="craft-main-title">{activeCat.icon} {activeCat.label}</h2>
            <label className="craft-show-crafted">
              <input
                type="checkbox"
                checked={showCrafted}
                onChange={e => setShowCrafted(e.target.checked)}
              />
              <span>{t('craft.showCrafted')}</span>
            </label>
          </div>

          {filteredIds.length === 0 ? (
            <div className="empty-state">
              {allDiscoveredIds.filter(id => activeCat.filter(id)).length === 0
                ? <p>{t('craft.noRecipesDisc')}</p>
                : <p>{t('craft.allCrafted')}</p>
              }
            </div>
          ) : (
            <div className="craft-recipes-grid">
              {filteredIds.map(recipeId => {
                // Buscar receta: primero exact match, luego sin sufijo (_UPGRADED/_PLUS).
                // Para weapon parts _UPGRADED: el exact match existe en recipes.js (WEAPON_PART_UPGRADE_RECIPES).
                // Para armor/trinket _UPGRADED del save: el save usa _UPGRADED pero nuestros datos tienen sin sufijo.
                const recipeBase = RECIPES_BY_ID[recipeId]
                  || RECIPES_BY_ID[recipeId.replace(/_UPGRADED$/, '').replace(/_PLUS$/, '')];
                const recipe         = recipeBase;
                const item           = getItemForRecipe(recipeId);
                const crafted        = isAlreadyCrafted(recipeId);
                const canCraftNow    = recipe ? canCraft(recipe, recipeId) : null;
                const missing        = recipe ? getMissingIngredients(recipe, recipeId) : [];
                const hasIngredients = recipe?.ingredients != null;
                const recipeItemId   = recipe?.itemId || recipeId.replace(/^RECIPE_/, '');
                const isUpgrade      = isItemUpgrade(recipeId);
                const isWeaponPart   = 'slot' in (item || {});
                // Partes de arma: tooltip usa _UPGRADED (descripción real del objeto crafteado)
                // Mejoras: tooltip usa recipeItemId (_UPGRADED/_PLUS)
                // Otros (armadura, accesorio, consumible): tooltip usa versión base
                const tooltipId = isWeaponPart
                  ? recipeItemId
                  : (isUpgrade ? recipeItemId : recipeItemId.replace(/_UPGRADED$/, '').replace(/_PLUS$/, ''));
                const itemName       = item ? cleanName(getName(item, lang)) : null;

                // Nombre con icono de mejora para cualquier mejora (_PLUS o _UPGRADED)
                const displayName = isUpgrade
                  ? <><span>{itemName}</span><img src={UPGRADE_ICON} alt="+" style={{ width:'1em', height:'1em', verticalAlign:'middle', marginLeft:'3px' }} onError={e => e.target.style.display='none'} /></>
                  : itemName;

                // Imagen con tooltip rico
                const imgAreaContent = (
                  <>
                    {item?.image
                      ? <img src={item.image} alt={itemName || ''} className="craft-recipe-img" onError={e => e.target.style.display='none'} />
                      : <div className="craft-recipe-no-img">{activeCat.icon}</div>
                    }
                    {isUpgrade && (
                      <div className="craft-upgrade-badge recipe-badge">
                        <img src="/assets/icons/recipe_badge.png" alt="✦" className="recipe-badge-img"
                          onError={e => e.target.style.display = 'none'} />
                      </div>
                    )}
                    {crafted && <div className="craft-done-badge">✓</div>}
                  </>
                );

                const imgArea = (
                  <div className="craft-recipe-img-area">
                    {item
                      ? (isWeaponPart
                        ? <WeaponPartTooltip partId={tooltipId} showUpgradeIcon={isUpgrade}>{imgAreaContent}</WeaponPartTooltip>
                        : <ItemTooltip id={tooltipId} item={item} lang={lang}>{imgAreaContent}</ItemTooltip>)
                      : imgAreaContent
                    }
                  </div>
                );

                return (
                  <div
                    key={recipeId}
                    className={`craft-recipe-card ${crafted ? 'crafted' : ''} ${canCraftNow === false && !crafted ? 'cant-craft' : ''} ${canCraftNow === true && !crafted ? 'can-craft' : ''}`}
                  >
                    {imgArea}

                    {/* Info */}
                    <div className="craft-recipe-info">
                      <div className="craft-recipe-name">
                        {displayName || recipeId}
                      </div>
                      {isWeaponPart && (
                        <div className="craft-recipe-tag">
                          {getWeaponTypeName(item.weaponType, lang)}
                        </div>
                      )}
                    </div>

                    {/* Ingredientes */}
                    {hasIngredients && recipe?.ingredients ? (
                      <div className="craft-ingredients">
                        {/* Ítem base requerido para mejoras (_PLUS/_UPGRADED en recipeId) */}
                        {isUpgrade && recipe?.itemId && (() => {
                          const baseId      = recipe.itemId.replace(/_PLUS$/, '').replace(/_UPGRADED$/, '');
                          const baseItem    = ALL_ITEMS_BY_ID[baseId] || WEAPON_PARTS_BY_ID[baseId];
                          const isWPart     = !!WEAPON_PARTS_BY_ID[baseId];
                          const hasBase     = (gameState.itemInventory || []).some(i => i.id === baseId);
                          const badge = (
                            <span className={`craft-ing-badge craft-ing-badge--item ${hasBase ? 'ok' : 'missing'}`}>
                              {baseItem?.image && (
                                <img src={baseItem.image} alt=""
                                  className="craft-ing-icon"
                                  onError={e => e.target.style.display = 'none'} />
                              )}
                              <span className="craft-ing-qty">{hasBase ? 1 : 0}/1</span>
                            </span>
                          );
                          return isWPart
                            ? <WeaponPartTooltip key={baseId} partId={baseId}>{badge}</WeaponPartTooltip>
                            : <ItemTooltip key={baseId} id={baseId} item={baseItem} lang={lang}>{badge}</ItemTooltip>;
                        })()}
                        {Object.entries(recipe.ingredients).map(([matId, qty]) => {
                          const have = gameState.craftingMaterials[matId] || 0;
                          const ok   = have >= qty;
                          const mat  = MATERIALS_BY_ID[matId];
                          return (
                            <MaterialTooltip key={matId} mat={mat} lang={lang}>
                              <span className={`craft-ing-badge ${ok ? 'ok' : 'missing'}`}>
                                {mat?.image && (
                                  <img src={mat.image} alt=""
                                    className="craft-ing-icon"
                                    onError={e => e.target.style.display = 'none'} />
                                )}
                                <span className="craft-ing-qty">{have}/{qty}</span>
                              </span>
                            </MaterialTooltip>
                          );
                        })}
                      </div>
                    ) : (
                      !crafted && (
                        <div className="craft-ing-unknown">
                          {t('craft.unknownIngredients')}
                        </div>
                      )
                    )}

                    {/* Acción */}
                    {!crafted && (
                      <button
                        className={`btn btn-sm ${canCraftNow ? 'btn-primary' : ''} craft-action-btn`}
                        disabled={canCraftNow === false}
                        onClick={() => craftItem(recipeId)}
                        title={
                          canCraftNow === false
                            ? `${t('craft.missingPrefix')} ${missing.map(m => {
                                if (m.isBaseItem) {
                                  const baseItem = ALL_ITEMS_BY_ID[m.matId];
                                  return baseItem ? getName(baseItem, lang) : m.matId;
                                }
                                return `${getName(MATERIALS_BY_ID[m.matId], lang) || m.matId} (${m.have}/${m.need})`;
                              }).join(', ')}`
                            : t('craft.btn.ready')
                        }
                      >
                        {canCraftNow === null
                          ? t('craft.btn.unknown')
                          : canCraftNow
                            ? t('craft.btn.ready')
                            : t('craft.btn.missing')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
