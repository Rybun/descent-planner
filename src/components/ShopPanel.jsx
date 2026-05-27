import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { MATERIALS, MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import { RECIPES_BY_ID } from '../gamedata/recipes';
import { DESCRIPTIONS } from '../gamedata/descriptions';
import Tooltip from './Tooltip';
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

  const [shopView, setShopView] = useState('comprar');
  const [customQty, setCustomQty] = useState({});

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

  function getCustomQty(key, def = 1) {
    return customQty[key] ?? def;
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

  function getDesc(id) {
    const base = id?.replace(/_UPGRADED$/, '').replace(/_PLUS$/, '');
    return DESCRIPTIONS[base] || DESCRIPTIONS[id] || '';
  }

  const shopMaterials  = (gameState.shopData || []).filter(s =>
    s.id.startsWith('MAT_') && MATERIALS_BY_ID[s.id]
  );
  const shopRecipes    = (gameState.shopRecipeIds || []);
  const shopEquipment  = (gameState.availableItemIds || []);

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

    return (
      <>
        {hasRecipes && (
          <section className="shop-section">
            <h2 className="shop-section-title">{t('shop.sectionRecipes')}</h2>
            <div className="shop-items-grid">
              {shopRecipes.map(recipeId => {
                const recipe = RECIPES_BY_ID[recipeId];
                const buyPrice = recipe?.goldCost ?? null;
                const baseId = recipeId.replace('RECIPE_', '')
                  .replace(/_UPGRADED$/, '').replace(/_PLUS$/, '');
                const itemData = getItemData(baseId);
                const itemName = itemData ? getName(itemData, lang) : baseId;
                return (
                  <div key={recipeId} className="shop-item-tile">
                    <div className="shop-item-img-area">
                      {itemData?.image
                        ? <img src={itemData.image} alt={itemName}
                            className="shop-item-img"
                            onError={e => e.target.style.display = 'none'} />
                        : <div className="shop-item-no-img">📜</div>
                      }
                      <div className="shop-item-badge recipe-badge">+</div>
                    </div>
                    <div className="shop-item-name">
                      {itemName ? `${itemName} +` : baseId}
                    </div>
                    <div className={`shop-item-price ${!canAfford(buyPrice) ? 'cant-afford' : ''}`}>
                      <span className="coin-icon">🪙</span>
                      <span>{formatPrice(buyPrice)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {hasEquipment && (
          <section className="shop-section">
            <h2 className="shop-section-title">{t('shop.sectionObjects')}</h2>
            <div className="shop-items-grid">
              {shopEquipment.map(itemId => {
                const data = getItemData(itemId);
                const buyPrice = getItemBuyPrice(itemId);
                const itemName = data ? getName(data, lang) : itemId;
                return (
                  <div key={itemId} className="shop-item-tile">
                    <div className="shop-item-img-area">
                      {data?.image
                        ? <Tooltip text={getDesc(itemId)}>
                            <img src={data.image} alt={itemName}
                              className="shop-item-img"
                              onError={e => e.target.style.display = 'none'} />
                          </Tooltip>
                        : <div className="shop-item-no-img">🛡</div>
                      }
                    </div>
                    <div className="shop-item-name">{itemName}</div>
                    <div className="shop-item-sublabel">{getItemLabel(itemId, data)}</div>
                    <div className={`shop-item-price ${!canAfford(buyPrice) ? 'cant-afford' : ''}`}>
                      <span className="coin-icon">🪙</span>
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
                const buyPrice = getMaterialBuyPrice(shopItem.id);
                const cqKey    = `mat_${shopItem.id}`;
                const cq       = getCustomQty(cqKey);
                const playerQty = gameState.craftingMaterials[shopItem.id] || 0;
                const matName = getName(mat, lang);

                return (
                  <div key={shopItem.id} className="shop-mat-tile">
                    <div className="shop-mat-img-area">
                      <Tooltip text={DESCRIPTIONS[shopItem.id] || matName}>
                        <img src={mat.image} alt={matName}
                          className="shop-mat-img"
                          onError={e => e.target.style.display = 'none'} />
                      </Tooltip>
                      <div className="shop-mat-qty-badge">{shopItem.qty}</div>
                    </div>
                    <div className="shop-mat-name">{matName}</div>
                    <div className="shop-mat-player-qty">{t('shop.iHave')} {playerQty}</div>
                    <div className={`shop-mat-price ${!canAfford(buyPrice) ? 'cant-afford' : ''}`}>
                      <span className="coin-icon">🪙</span>
                      <span>{formatPrice(buyPrice)}</span>
                    </div>
                    {buyPrice !== null && (
                      <div className="shop-mat-actions">
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => buyMaterial(shopItem.id, 1)}
                          disabled={!canAfford(buyPrice, 1)}
                        >+1</button>
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => buyMaterial(shopItem.id, 5)}
                          disabled={!canAfford(buyPrice, 5)}
                        >+5</button>
                        <input
                          type="number" min="1" max="99"
                          value={cq}
                          onChange={e => setCustomQty(p => ({ ...p, [cqKey]: Number(e.target.value) }))}
                          className="qty-input"
                        />
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => buyMaterial(shopItem.id, cq)}
                          disabled={!canAfford(buyPrice, cq)}
                        >×{cq}</button>
                      </div>
                    )}
                  </div>
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
    const sellableItems = Object.keys(inventoryGroups).filter(itemId => {
      const price = getItemSellPrice(itemId);
      return price !== null && price !== undefined;
    });
    const hasItems     = sellableItems.length > 0;
    const hasMaterials = playerMats.length > 0;

    if (!hasItems && !hasMaterials) {
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
                  <div key={mat.id} className="shop-mat-tile">
                    <div className="shop-mat-img-area">
                      <Tooltip text={DESCRIPTIONS[mat.id] || matName}>
                        <img src={mat.image} alt={matName}
                          className="shop-mat-img"
                          onError={e => e.target.style.display = 'none'} />
                      </Tooltip>
                      <div className="shop-mat-qty-badge">{playerQty}</div>
                    </div>
                    <div className="shop-mat-name">{matName}</div>
                    {canSell ? (
                      <>
                        <div className="shop-mat-price sell-price">
                          <span className="coin-icon">🪙</span>
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
                );
              })}
            </div>
          </section>
        )}

        {hasItems && (
          <section className="shop-section">
            <h2 className="shop-section-title">{t('shop.sectionObjects')}</h2>
            <div className="sell-items-list">
              {Object.entries(inventoryGroups)
                .filter(([itemId]) => {
                  const price = getItemSellPrice(itemId);
                  return price !== null && price !== undefined;
                })
                .map(([itemId, qty]) => {
                  const data      = getItemData(itemId);
                  const sellPrice = getItemSellPrice(itemId);
                  const itemName  = data ? getName(data, lang) : itemId;
                  return (
                    <div key={itemId} className="sell-item-row">
                      <div className="sell-item-left">
                        {data?.image && (
                          <Tooltip text={getDesc(itemId)}>
                            <img src={data.image} alt={itemName}
                              className="sell-item-img"
                              onError={e => e.target.style.display = 'none'} />
                          </Tooltip>
                        )}
                        <div className="sell-item-info">
                          <span className="sell-item-name">{itemName}</span>
                          <span className="sell-item-label">{getItemLabel(itemId, data)}</span>
                          {qty > 1 && <span className="sell-item-qty">×{qty}</span>}
                        </div>
                      </div>
                      <div className="sell-item-right">
                        <span className="shop-mat-price sell-price">
                          <span className="coin-icon">🪙</span>
                          <span>{formatPrice(sellPrice)}</span>
                        </span>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => sellItem(itemId, 1)}
                        >{t('shop.sellOne')}</button>
                        {qty > 1 && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => sellItem(itemId, qty)}
                          >{t('shop.sellAll', { qty })}</button>
                        )}
                      </div>
                    </div>
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
