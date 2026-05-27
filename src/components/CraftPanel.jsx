import { useState } from 'react';
import { useStore } from '../store';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { CONSUMABLES_BY_ID, ALL_ITEMS_BY_ID } from '../gamedata/items';
import { RECIPES_BY_ID } from '../gamedata/recipes';
import { MATERIALS, MATERIALS_BY_ID } from '../gamedata/materials';
import { DESCRIPTIONS } from '../gamedata/descriptions';
import Tooltip from './Tooltip';
import './CraftPanel.css';

// Categorías de la Sala de creación (mutuamente excluyentes: mejoras van aparte)
const isUpgradeRecipe = id => id.endsWith('_UPGRADED') || id.endsWith('_PLUS');

const CATEGORIES = [
  { id: 'consumibles', label: 'Consumibles',    icon: '🧪', filter: id => id.startsWith('RECIPE_CSM_')          && !isUpgradeRecipe(id) },
  { id: 'armadura',    label: 'Armadura',        icon: '🛡',  filter: id => id.startsWith('RECIPE_ARMOR_')        && !isUpgradeRecipe(id) },
  { id: 'accesorios',  label: 'Accesorios',      icon: '💍',  filter: id => id.startsWith('RECIPE_TRINKET')       && !isUpgradeRecipe(id) },
  { id: 'partes',      label: 'Partes de armas', icon: '⚔️', filter: id => id.startsWith('RECIPE_WEAPON_PART_')  && !isUpgradeRecipe(id) },
  { id: 'mejoras',     label: 'Mejoras (★)',     icon: '✨', filter: id => isUpgradeRecipe(id) },
];

export default function CraftPanel() {
  const gameState = useStore(s => s.gameState);
  const craftItem = useStore(s => s.craftItem);
  const [selectedCategory, setSelectedCategory] = useState('partes');
  const [showCrafted, setShowCrafted] = useState(false);

  if (!gameState) return null;

  // Solo recetas DESCUBIERTAS (que el jugador ha desbloqueado)
  const discoveredRecipeMap = Object.fromEntries(
    (gameState.discoveredRecipes || []).map(r => [r.id, r])
  );

  const allDiscoveredIds = Object.keys(discoveredRecipeMap);

  function canCraft(recipe) {
    if (!recipe?.ingredients) return null;
    for (const [matId, qty] of Object.entries(recipe.ingredients)) {
      if ((gameState.craftingMaterials[matId] || 0) < qty) return false;
    }
    return true;
  }

  function getMissingIngredients(recipe) {
    if (!recipe?.ingredients) return [];
    return Object.entries(recipe.ingredients)
      .filter(([matId, qty]) => (gameState.craftingMaterials[matId] || 0) < qty)
      .map(([matId, qty]) => ({
        matId,
        need: qty,
        have: gameState.craftingMaterials[matId] || 0,
      }));
  }

  function getItemForRecipe(recipeId) {
    const recipe = RECIPES_BY_ID[recipeId];
    if (!recipe) return null;
    const itemId = recipe.itemId;
    const baseId = itemId.replace(/_UPGRADED$/, '').replace(/_PLUS$/, '');
    return (
      WEAPON_PARTS_BY_ID[itemId] ||
      WEAPON_PARTS_BY_ID[baseId] ||
      CONSUMABLES_BY_ID[itemId] ||
      CONSUMABLES_BY_ID[baseId] ||
      ALL_ITEMS_BY_ID[itemId] ||
      ALL_ITEMS_BY_ID[baseId] ||
      null
    );
  }

  function getDesc(id) {
    if (!id) return '';
    const base = id.replace(/_UPGRADED$/, '').replace(/_PLUS$/, '');
    return DESCRIPTIONS[base] || DESCRIPTIONS[id] || '';
  }

  function isAlreadyCrafted(recipeId) {
    return discoveredRecipeMap[recipeId]?.crafted === true;
  }

  // Filtrar para la categoría activa
  const activeCat = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];
  const filteredIds = allDiscoveredIds
    .filter(id => activeCat.filter(id))
    .filter(id => showCrafted || !isAlreadyCrafted(id))
    .sort((a, b) => {
      // Crafteables primero, luego por nombre
      const ac = isAlreadyCrafted(a) ? 1 : 0;
      const bc = isAlreadyCrafted(b) ? 1 : 0;
      if (ac !== bc) return ac - bc;
      return a.localeCompare(b);
    });

  // Conteo por categoría (sin filtro de crafteados)
  const categoryCounts = Object.fromEntries(
    CATEGORIES.map(cat => [
      cat.id,
      allDiscoveredIds.filter(id => cat.filter(id) && !isAlreadyCrafted(id)).length,
    ])
  );

  // Resumen de materiales
  const totalMats = MATERIALS.filter(m => (gameState.craftingMaterials[m.id] || 0) > 0);

  return (
    <div className="craft-panel-v2">
      {/* Barra de materiales disponibles */}
      <div className="craft-mats-bar">
        <span className="craft-mats-label">Materiales:</span>
        <div className="craft-mats-row">
          {totalMats.length === 0
            ? <span className="craft-mats-empty">Sin materiales</span>
            : totalMats.map(mat => (
              <Tooltip key={mat.id} text={DESCRIPTIONS[mat.id] || mat.name}>
                <span className="mat-chip">
                  <img src={mat.image} alt="" className="mat-chip-img"
                    onError={e => e.target.style.display = 'none'} />
                  <span className="mat-chip-qty">×{gameState.craftingMaterials[mat.id]}</span>
                </span>
              </Tooltip>
            ))
          }
        </div>
      </div>

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
              <span>Mostrar crafteadas</span>
            </label>
          </div>

          {filteredIds.length === 0 ? (
            <div className="empty-state">
              {allDiscoveredIds.filter(id => activeCat.filter(id)).length === 0
                ? <p>No hay recetas de esta categoría descubiertas.</p>
                : <p>Todas las recetas de esta categoría ya han sido crafteadas. ✓</p>
              }
            </div>
          ) : (
            <div className="craft-recipes-grid">
              {filteredIds.map(recipeId => {
                const recipe = RECIPES_BY_ID[recipeId];
                const item = getItemForRecipe(recipeId);
                const crafted = isAlreadyCrafted(recipeId);
                const canCraftNow = recipe ? canCraft(recipe) : null;
                const missing = recipe ? getMissingIngredients(recipe) : [];
                const hasIngredients = recipe?.ingredients != null;
                const isUpgrade = isUpgradeRecipe(recipeId);

                return (
                  <div
                    key={recipeId}
                    className={`craft-recipe-card ${crafted ? 'crafted' : ''} ${canCraftNow === false && !crafted ? 'cant-craft' : ''} ${canCraftNow === true && !crafted ? 'can-craft' : ''}`}
                  >
                    {/* Imagen */}
                    <div className="craft-recipe-img-area">
                      {item?.image ? (
                        <Tooltip text={getDesc(recipe?.itemId)}>
                          <img src={item.image} alt={item.name}
                            className="craft-recipe-img"
                            onError={e => e.target.style.display = 'none'} />
                        </Tooltip>
                      ) : (
                        <div className="craft-recipe-no-img">{activeCat.icon}</div>
                      )}
                      {isUpgrade && <div className="craft-upgrade-badge">★</div>}
                      {crafted && <div className="craft-done-badge">✓</div>}
                    </div>

                    {/* Info */}
                    <div className="craft-recipe-info">
                      <div className="craft-recipe-name">
                        {item?.name
                          ? isUpgrade ? `${item.name} ★` : item.name
                          : recipeId}
                      </div>
                      {item && 'slot' in item && (
                        <div className="craft-recipe-tag">
                          Slot {item.slot} · Nv.{item.level} → {item.level + 1} · {item.weaponType}
                        </div>
                      )}
                      {recipe?.goldCost != null && (
                        <div className="craft-recipe-gold">🪙 {recipe.goldCost}</div>
                      )}
                    </div>

                    {/* Ingredientes */}
                    {hasIngredients && recipe?.ingredients ? (
                      <div className="craft-ingredients">
                        {Object.entries(recipe.ingredients).map(([matId, qty]) => {
                          const have = gameState.craftingMaterials[matId] || 0;
                          const ok = have >= qty;
                          const mat = MATERIALS_BY_ID[matId];
                          return (
                            <Tooltip key={matId} text={mat?.name || matId}>
                              <span className={`craft-ing-badge ${ok ? 'ok' : 'missing'}`}>
                                {mat?.image && (
                                  <img src={mat.image} alt=""
                                    className="craft-ing-icon"
                                    onError={e => e.target.style.display = 'none'} />
                                )}
                                <span className="craft-ing-qty">{have}/{qty}</span>
                              </span>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ) : (
                      !crafted && (
                        <div className="craft-ing-unknown">
                          ⚠️ Ingredientes desconocidos
                        </div>
                      )
                    )}

                    {/* Acción */}
                    {!crafted && (
                      <button
                        className={`btn btn-sm ${canCraftNow ? 'btn-primary' : ''} craft-action-btn`}
                        disabled={canCraftNow === false}
                        onClick={() => craftItem(recipeId)}
                        title={canCraftNow === false ? `Faltan: ${missing.map(m => `${MATERIALS_BY_ID[m.matId]?.name || m.matId} (${m.have}/${m.need})`).join(', ')}` : 'Craftear'}
                      >
                        {canCraftNow === null ? '? Craftear' : canCraftNow ? '⚒ Craftear' : '✗ Faltan materiales'}
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
