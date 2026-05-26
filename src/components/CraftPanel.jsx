import { useStore } from '../store';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { CONSUMABLES_BY_ID } from '../gamedata/items';
import { ALL_RECIPES, RECIPES_BY_ID } from '../gamedata/recipes';
import { MATERIALS, MATERIALS_BY_ID } from '../gamedata/materials';
import './CraftPanel.css';

export default function CraftPanel() {
  const gameState = useStore(s => s.gameState);
  const craftItem = useStore(s => s.craftItem);

  if (!gameState) return null;

  // Recetas disponibles en la ciudad (las que el juego ofrece)
  const availableRecipeIds = gameState.availableRecipeIds || [];
  // Recetas que el grupo ya ha descubierto y puede usar
  const discoveredRecipeMap = Object.fromEntries(
    (gameState.discoveredRecipes || []).map(r => [r.id, r])
  );

  // Unir recetas disponibles y descubiertas (todas las que el grupo puede craftear)
  const craftableRecipeIds = [
    ...new Set([
      ...availableRecipeIds,
      ...Object.keys(discoveredRecipeMap),
    ])
  ];

  function canCraft(recipe) {
    if (!recipe.ingredients) return null; // desconocido
    for (const [matId, qty] of Object.entries(recipe.ingredients)) {
      const have = gameState.craftingMaterials[matId] || 0;
      if (have < qty) return false;
    }
    return true;
  }

  function getMissingIngredients(recipe) {
    if (!recipe.ingredients) return [];
    const missing = [];
    for (const [matId, qty] of Object.entries(recipe.ingredients)) {
      const have = gameState.craftingMaterials[matId] || 0;
      if (have < qty) {
        missing.push({ matId, need: qty, have });
      }
    }
    return missing;
  }

  function getItemForRecipe(recipeId) {
    const recipe = RECIPES_BY_ID[recipeId];
    if (!recipe) return null;
    const itemId = recipe.itemId;
    return WEAPON_PARTS_BY_ID[itemId] || CONSUMABLES_BY_ID[itemId] || null;
  }

  function isAlreadyCrafted(recipeId) {
    return discoveredRecipeMap[recipeId]?.crafted === true;
  }

  if (craftableRecipeIds.length === 0) {
    return (
      <div className="craft-panel">
        <div className="empty-state">
          <p>No hay recetas disponibles para craftear.</p>
          <p>Las recetas aparecen cuando se descubren durante la campaña.</p>
        </div>
      </div>
    );
  }

  // Agrupar por tipo
  const weaponRecipes = craftableRecipeIds.filter(id => id.startsWith('RECIPE_WEAPON_PART_'));
  const consumableRecipes = craftableRecipeIds.filter(id => id.startsWith('RECIPE_CSM_'));
  const otherRecipes = craftableRecipeIds.filter(id => !id.startsWith('RECIPE_WEAPON_PART_') && !id.startsWith('RECIPE_CSM_'));

  function RecipeGroup({ title, recipeIds }) {
    if (recipeIds.length === 0) return null;
    return (
      <div className="recipe-group">
        <h3 className="recipe-group-title">{title}</h3>
        <div className="recipe-list">
          {recipeIds.map(recipeId => {
            const recipe = RECIPES_BY_ID[recipeId];
            const item = getItemForRecipe(recipeId);
            const crafted = isAlreadyCrafted(recipeId);
            const canCraftNow = recipe ? canCraft(recipe) : null;
            const missing = recipe ? getMissingIngredients(recipe) : [];
            const hasIngredientData = recipe?.ingredients !== null;

            return (
              <div
                key={recipeId}
                className={`recipe-card ${crafted ? 'recipe-crafted' : ''} ${canCraftNow === false ? 'recipe-cant-craft' : ''}`}
              >
                <div className="recipe-header">
                  {item?.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="recipe-img"
                      onError={e => e.target.style.display = 'none'}
                    />
                  )}
                  <div className="recipe-info">
                    <span className="recipe-name">{item?.name || recipeId}</span>
                    {item && 'slot' in item && (
                      <span className="recipe-tag">
                        Parte {item.slot} · Nv.{item.level} · {item.weaponType}
                      </span>
                    )}
                    {crafted && <span className="crafted-badge">✓ Crafteado</span>}
                  </div>
                </div>

                {/* Ingredientes */}
                {hasIngredientData && recipe?.ingredients ? (
                  <div className="ingredients-row">
                    {Object.entries(recipe.ingredients).map(([matId, qty]) => {
                      const have = gameState.craftingMaterials[matId] || 0;
                      const ok = have >= qty;
                      const mat = MATERIALS_BY_ID[matId];
                      return (
                        <span
                          key={matId}
                          className={`ingredient-badge ${ok ? 'ok' : 'missing'}`}
                          title={`${mat?.name || matId}: ${have}/${qty}`}
                        >
                          {mat?.image && (
                            <img
                              src={mat.image}
                              alt=""
                              className="ingredient-icon"
                              onError={e => e.target.style.display = 'none'}
                            />
                          )}
                          {mat?.name || matId} {have}/{qty}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ingredients-unknown">
                    <span>⚠️ Ingredientes no disponibles en los datos del juego</span>
                    <span className="hint-text">Verifica los ingredientes en el juego físico</span>
                  </div>
                )}

                {/* Coste en oro */}
                {recipe?.goldCost !== null && recipe?.goldCost !== undefined && (
                  <div className="recipe-gold">
                    Coste: <strong>{recipe.goldCost}🪙</strong>
                  </div>
                )}

                {/* Qué falta */}
                {missing.length > 0 && (
                  <div className="missing-list">
                    <span>Faltan: </span>
                    {missing.map(m => {
                      const mat = MATERIALS_BY_ID[m.matId];
                      return (
                        <span key={m.matId} className="missing-item">
                          {mat?.name || m.matId} ({m.have}/{m.need})
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="recipe-actions">
                  <button
                    className="btn btn-primary"
                    disabled={crafted || canCraftNow === false}
                    onClick={() => craftItem(recipeId)}
                    title={crafted ? 'Ya crafteado' : canCraftNow === false ? 'Faltan materiales' : 'Craftear'}
                  >
                    {crafted ? '✓ Crafteado' : 'Craftear'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="craft-panel">
      <div className="craft-summary">
        <span>
          Materiales disponibles:{' '}
          {MATERIALS.map(m => {
            const qty = gameState.craftingMaterials[m.id] || 0;
            if (qty === 0) return null;
            return (
              <span key={m.id} className="mat-chip">
                <img
                  src={m.image}
                  alt={m.name}
                  className="mat-chip-img"
                  onError={e => e.target.style.display = 'none'}
                />
                {m.name} ×{qty}
              </span>
            );
          }).filter(Boolean)}
        </span>
      </div>

      <RecipeGroup title="⚔️ Partes de Arma" recipeIds={weaponRecipes} />
      <RecipeGroup title="🧪 Consumibles" recipeIds={consumableRecipes} />
      <RecipeGroup title="📦 Otros" recipeIds={otherRecipes} />
    </div>
  );
}
