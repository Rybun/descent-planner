import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { MATERIALS, MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import { RECIPES_BY_ID } from '../gamedata/recipes';
import RecipeTooltip from './RecipeTooltip';
import ItemTooltip from './ItemTooltip';
import WeaponPartTooltip from './WeaponPartTooltip';
import MaterialTooltip from './MaterialTooltip';
import './ShopPanel.css';

export default function ShopPanel() {
  const t    = useT();
  const lang = useLang();

  const gameState    = useStore(s => s.gameState);
  const customPrices = useStore(s => s.customPrices);
  const buyMaterial  = useStore(s => s.buyMaterial);
  const sellMaterial = useStore(s => s.sellMaterial);
  const buyItem      = useStore(s => s.buyItem);
  const sellItem     = useStore(s => s.sellItem);
  const buyRecipe    = useStore(s => s.buyRecipe);
  const actionHistory = useStore(s => s.actionHistory);
  const removeActions = useStore(s => s.removeActions);
  const recoverOneUnit = useStore(s => s.recoverOneUnit);

  const [shopView, setShopView] = useState('comprar');

  if (!gameState) return null;

  // ─── Helpers de precio ───────────────────────────────
  function getItemBuyPrice(itemId) {
    const key = `${itemId}_buy`;
    if (customPrices[key] !== undefined) return customPrices[key];
    const part = WEAPON_PARTS_BY_ID[itemId];
    if (part) return part.buyPrice;
    const item = ALL_ITEMS_BY_ID[itemId];
    if (item) return item.buyPrice;
    return null;
  }

  function getItemSellPrice(itemId) {
    const key = `${itemId}_sell`;
    if (customPrices[key] !== undefined) return customPrices[key];
    const part = WEAPON_PARTS_BY_ID[itemId];
    if (part) return part.sellPrice;
    const item = ALL_ITEMS_BY_ID[itemId];
    if (item) return item.sellPrice;
    return null;
  }

  function getMaterialBuyPrice(matId) {
    const key = `${matId}_buy`;
    if (customPrices[key] !== undefined) return customPrices[key];
    return MATERIALS_BY_ID[matId]?.buyPrice ?? null;
  }

  function getMaterialSellPrice(matId) {
    const key = `${matId}_sell`;
    if (customPrices[key] !== undefined) return customPrices[key];
    return MATERIALS_BY_ID[matId]?.sellPrice ?? null;
  }

  function formatPrice(price) {
    if (price === null || price === undefined) return '?';
    return `${price}`;
  }

  function canAfford(price, qty = 1) {
    if (price === null || price === undefined) return true;
    return gameState.gold >= price * qty;
  }

  function getItemData(itemId) {
    return WEAPON_PARTS_BY_ID[itemId] || ALL_ITEMS_BY_ID[itemId] || null;
  }

  function getItemLabel(itemId, data) {
    if (!data) return itemId;
    if ('slot' in data) {
      return t('shop.label.slot', { slot: data.slot, level: data.level, type: data.weaponType });
    }
    if (data.type === 'armor')     return t('shop.label.armor');
    if (data.type === 'trinket')   return t('shop.label.trinket');
    if (data.type === 'consumable') return t('shop.label.consumable');
    return '';
  }

  const shopMaterials  = (gameState.shopData || []).filter(s =>
    s.id.startsWith('MAT_') && MATERIALS_BY_ID[s.id]
  );
  const shopRecipes    = (gameState.shopRecipeIds || []);
  const shopEquipment  = (gameState.shopData || [])
    .filter(s => !s.id.startsWith('MAT_') && !s.id.startsWith('RECIPE_'))
    .map(s => s.id);

  const inventoryGroups = {};
  for (const item of (gameState.itemInventory || [])) {
    inventoryGroups[item.id] = (inventoryGroups[item.id] || 0) + 1;
  }

  // ─── Vista COMPRAR ────────────────────────────────────
  function renderComprar() {
    const hasRecipes   = shopRecipes.length > 0;
    const hasEquipment = shopEquipment.length > 0;
    const hasMaterials = shopMaterials.length > 0;

    if (!hasRecipes && !hasEquipment && !hasMaterials) {
      return (
        <div className="empty-state">
          <p>{t('shop.emptyStore')}</p>
          <p>{t('shop.emptyHint')}</p>
        </div>
      );
    }

    const sellActions = actionHistory.filter(a =>
      a.type === 'SELL_MATERIAL' || a.type === 'SELL_ITEM'
    );

    // Varias ventas del mismo material/ítem (p.ej. vender de uno en uno hasta
    // 100) se agrupan en una sola fila con la cantidad y la ganancia
    // sumadas, en vez de una fila por cada venta. Al reinsertar la clave que
    // ya existía, el Map la mueve al final -> el grupo sube al principio de
    // la lista (más reciente primero) en cuanto se vende algo más de él.
    const sellGroups = new Map();
    for (const action of sellActions) {
      const isMat = action.type === 'SELL_MATERIAL';
      const id    = isMat ? action.data.materialId : action.data.itemId;
      const key   = `${action.type}:${id}`;
      const prev  = sellGroups.get(key);
      sellGroups.delete(key);
      sellGroups.set(key, {
        type: action.type,
        id,
        qty: (prev?.qty || 0) + action.data.qty,
        gain: (prev?.gain || 0) + action.data.gain,
        actionIds: [...(prev?.actionIds || []), action.id],
      });
    }
    const sellRows = [...sellGroups.values()].reverse();

    return (
      <>
        {sellRows.length > 0 && (
          <section className="shop-section shop-section--recover">
            <h2 className="shop-section-title shop-section-title--recover">
              {t('shop.sectionRecover')}
            </h2>
            <div className="recover-list">
              {sellRows.map(group => {
                const isMat = group.type === 'SELL_MATERIAL';
                const id    = group.id;
                const qty   = group.qty;
                const gain  = group.gain;
                // "Recuperar ×1" deshace solo la venta más reciente del grupo;
                // su coste en oro es el de esa acción concreta, no la media.
                const lastActionId = group.actionIds[group.actionIds.length - 1];
                const lastAction   = actionHistory.find(a => a.id === lastActionId);
                const unitGain     = lastAction ? lastAction.data.gain / lastAction.data.qty : gain / qty;

                let img = null, name = id;
                if (isMat) {
                  const mat = MATERIALS_BY_ID[id];
                  img  = mat?.image;
                  name = mat ? getName(mat, lang) : id;
                } else {
                  const data = getItemData(id);
                  img  = data?.image;
                  name = data ? getName(data, lang) : id;
                }

                return (
                  <div key={`${group.type}:${id}`} className="recover-row">
                    <div className="sell-item-left">
                      {img && (
                        <img src={img} alt={name} className="sell-item-img"
                          onError={e => e.target.style.display = 'none'} />
                      )}
                      <div className="sell-item-info">
                        <span className="sell-item-name">
                          <span className="sell-item-name-text">{name}</span>
                          {id?.endsWith('_PLUS') && (
                            <img src="/assets/icons/Icon_Upgrade.png" alt="+" className="shop-item-upgrade-icon"
                              onError={e => e.target.style.display = 'none'} />
                          )}
                        </span>
                        {qty > 1 && <span className="sell-item-qty">×{qty}</span>}
                      </div>
                    </div>
                    <div className="sell-item-right">
                      <span className="shop-mat-price sell-price">
                        <img src="/assets/icons/currency.png" className="coin-icon" alt="" onError={e => e.target.style.display='none'} />
                        <span>{gain}</span>
                      </span>
                      <div className="recover-actions">
                        <button
                          className="btn btn-xs btn-primary"
                          disabled={gameState.gold - unitGain < 0}
                          onClick={() => recoverOneUnit(group.actionIds)}
                        >{t('shop.recoverOne')}</button>
                        <button
                          className="btn btn-xs btn-primary"
                          disabled={gameState.gold - gain < 0}
                          onClick={() => removeActions(group.actionIds)}
                        >{t('shop.recoverAll', { qty })}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {(hasRecipes || hasEquipment) && (
          <section className="shop-section">
            <h2 className="shop-section-title">
              <img src="/assets/icons/recipe_badge.png" alt="" className="section-recipe-icon" onError={e => e.target.style.display='none'} />
              {t('shop.sectionRecipes')}
            </h2>
            <div className="shop-items-grid">
              {shopRecipes.map(recipeId => {
                const recipe = RECIPES_BY_ID[recipeId];
                const buyPrice = recipe?.goldCost ?? null;
                const recipeItemId = recipe?.itemId || recipeId.replace(/^RECIPE_/, '');
                const baseId = recipeItemId.replace(/_UPGRADED$/, '').replace(/_PLUS$/, '');
                const itemData = getItemData(baseId);
                const itemName = itemData ? getName(itemData, lang) : baseId;
                return (
                  <RecipeTooltip key={recipeId} recipeId={recipeId}>
                    <div className="shop-item-tile">
                      <div className="shop-item-img-area">
                        {itemData?.image
                          ? <img src={itemData.image} alt={itemName}
                              className="shop-item-img"
                              onError={e => e.target.style.display = 'none'} />
                          : <div className="shop-item-no-img">📜</div>
                        }
                        <div className="shop-item-badge recipe-badge">
                          <img src="/assets/icons/recipe_badge.png" alt="recipe" className="recipe-badge-img" onError={e => e.target.style.display='none'} />
                        </div>
                      </div>
                      <div className="shop-item-name">
                        <span className="shop-item-name-text">{itemName || baseId}</span>
                        {recipeItemId?.endsWith('_PLUS') && (
                          <img src="/assets/icons/Icon_Upgrade.png" alt="+" className="shop-item-upgrade-icon"
                            onError={e => e.target.style.display = 'none'} />
                        )}
                      </div>
                      <div className={`shop-item-price ${!canAfford(buyPrice) ? 'cant-afford' : ''}`}>
                        <img src="/assets/icons/currency.png" className="coin-icon" alt="" onError={e => e.target.style.display='none'} />
                        <span>{formatPrice(buyPrice)}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-primary shop-buy-btn"
                        onClick={() => buyRecipe(recipeId)}
                        disabled={buyPrice === null || !canAfford(buyPrice)}
                      >
                        {t('shop.buy')}
                      </button>
                    </div>
                  </RecipeTooltip>
                );
              })}

              {shopEquipment.map(itemId => {
                const data = getItemData(itemId);
                const buyPrice = getItemBuyPrice(itemId);
                const itemName = data ? getName(data, lang) : itemId;
                // Las partes de arma (slot A/B/C) llevan su propio tooltip
                // con daño, tipo de ataque, alcance, héroe y descripción —
                // ItemTooltip solo sabe de armadura/amuleto/consumible y no
                // muestra nada de eso para una parte de arma.
                const isWeaponPart = data && 'slot' in data;
                const Tooltip = isWeaponPart ? WeaponPartTooltip : ItemTooltip;
                const tooltipProps = isWeaponPart
                  ? { partId: itemId }
                  : { id: itemId, item: data, lang };
                return (
                  <Tooltip key={itemId} {...tooltipProps}>
                    <div className="shop-item-tile">
                      <div className="shop-item-img-area">
                        {data?.image
                          ? <img src={data.image} alt={itemName}
                              className="shop-item-img"
                              onError={e => e.target.style.display = 'none'} />
                          : <div className="shop-item-no-img">🛡</div>
                        }
                      </div>
                      <div className="shop-item-name">
                        <span className="shop-item-name-text">{itemName}</span>
                        {itemId?.endsWith('_PLUS') && (
                          <img src="/assets/icons/Icon_Upgrade.png" alt="+" className="shop-item-upgrade-icon"
                            onError={e => e.target.style.display = 'none'} />
                        )}
                      </div>
                      <div className={`shop-item-price ${!canAfford(buyPrice) ? 'cant-afford' : ''}`}>
                        <img src="/assets/icons/currency.png" className="coin-icon" alt="" onError={e => e.target.style.display='none'} />
                        <span>{formatPrice(buyPrice)}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-primary shop-buy-btn"
                        onClick={() => buyItem(itemId)}
                        disabled={!canAfford(buyPrice)}
                      >
                        {t('shop.buy')}
                      </button>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </section>
        )}

        {hasMaterials && (
          <section className="shop-section">
            <h2 className="shop-section-title">{t('shop.sectionMaterials')}</h2>
            <div className="shop-mat-grid">
              {shopMaterials.map(shopItem => {
                const mat = MATERIALS_BY_ID[shopItem.id];
                if (!mat) return null;
                const buyPrice   = getMaterialBuyPrice(shopItem.id);
                const playerQty  = gameState.craftingMaterials[shopItem.id] || 0;
                const matName = getName(mat, lang);

                return (
                  <MaterialTooltip key={shopItem.id} mat={mat} lang={lang}>
                  <div className="shop-mat-tile">
                    <div className="shop-mat-img-area">
                      <img src={mat.image} alt={matName}
                        className="shop-mat-img"
                        onError={e => e.target.style.display = 'none'} />
                      <div className="shop-mat-qty-badge">{shopItem.qty}</div>
                    </div>
                    <div className="shop-mat-name">{matName}</div>
                    <div className="shop-mat-player-qty">{t('shop.iHave')} {playerQty}</div>
                    <div className={`shop-mat-price ${!canAfford(buyPrice) ? 'cant-afford' : ''}`}>
                      <img src="/assets/icons/currency.png" className="coin-icon" alt="" onError={e => e.target.style.display='none'} />
                      <span>{formatPrice(buyPrice)}</span>
                    </div>
                    {buyPrice !== null && (
                      <div className="shop-mat-actions">
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => buyMaterial(shopItem.id, 1)}
                          disabled={!canAfford(buyPrice, 1)}
                        >{t('shop.buy')}</button>
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => buyMaterial(shopItem.id, 5)}
                          disabled={!canAfford(buyPrice, 5)}
                        >{t('shop.buy5')}</button>
                      </div>
                    )}
                  </div>
                  </MaterialTooltip>
                );
              })}
            </div>
          </section>
        )}
      </>
    );
  }

  // ─── Vista VENDER ─────────────────────────────────────
  function renderVender() {
    const playerMats = MATERIALS.filter(m => {
      const qty   = gameState.craftingMaterials[m.id] || 0;
      const price = getMaterialSellPrice(m.id);
      return qty > 0 && price !== null && price !== undefined;
    });
    const hasMaterials = playerMats.length > 0;

    if (!hasMaterials) {
      return (
        <div className="empty-state">
          <p>{t('shop.emptySell')}</p>
        </div>
      );
    }

    return (
      <>
        {hasMaterials && (
          <section className="shop-section">
            <h2 className="shop-section-title">{t('shop.sectionMaterials')}</h2>
            <div className="shop-mat-grid">
              {playerMats.map(mat => {
                const playerQty  = gameState.craftingMaterials[mat.id] || 0;
                const sellPrice  = getMaterialSellPrice(mat.id);
                const canSell    = sellPrice !== null && sellPrice !== undefined;
                const matName    = getName(mat, lang);

                return (
                  <MaterialTooltip key={mat.id} mat={mat} lang={lang}>
                  <div className="shop-mat-tile">
                    <div className="shop-mat-img-area">
                      <img src={mat.image} alt={matName}
                        className="shop-mat-img"
                        onError={e => e.target.style.display = 'none'} />
                      <div className="shop-mat-qty-badge">{playerQty}</div>
                    </div>
                    <div className="shop-mat-name">{matName}</div>
                    {canSell ? (
                      <>
                        <div className="shop-mat-price sell-price">
                          <img src="/assets/icons/currency.png" className="coin-icon" alt="" onError={e => e.target.style.display='none'} />
                          <span>{formatPrice(sellPrice)}</span>
                        </div>
                        <div className="shop-mat-actions">
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => sellMaterial(mat.id, 1)}
                          >{t('shop.sellOne')}</button>
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => sellMaterial(mat.id, playerQty)}
                          >{t('shop.sellAll', { qty: playerQty })}</button>
                        </div>
                      </>
                    ) : (
                      <div className="shop-mat-no-sell">{t('shop.notSellable')}</div>
                    )}
                  </div>
                  </MaterialTooltip>
                );
              })}
            </div>
          </section>
        )}

      </>
    );
  }

  return (
    <div className="shop-panel-v2">
      <div className="shop-toggle-row">
        <button
          className={`shop-toggle-btn ${shopView === 'comprar' ? 'active' : ''}`}
          onClick={() => setShopView('comprar')}
        >
          {t('shop.buyTab')}
        </button>
        <button
          className={`shop-toggle-btn ${shopView === 'vender' ? 'active' : ''}`}
          onClick={() => setShopView('vender')}
        >
          {t('shop.sellTab')}
        </button>
      </div>

      <div className="shop-content">
        {shopView === 'comprar' ? renderComprar() : renderVender()}
      </div>
    </div>
  );
}
