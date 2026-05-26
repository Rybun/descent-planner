import { useState } from 'react';
import { useStore } from '../store';
import { MATERIALS, MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import './ShopPanel.css';

export default function ShopPanel() {
  const gameState = useStore(s => s.gameState);
  const customPrices = useStore(s => s.customPrices);
  const buyMaterial = useStore(s => s.buyMaterial);
  const sellMaterial = useStore(s => s.sellMaterial);
  const buyItem = useStore(s => s.buyItem);
  const sellItem = useStore(s => s.sellItem);

  const [shopTab, setShopTab] = useState('materiales');
  const [customQty, setCustomQty] = useState({});

  if (!gameState) return null;

  function getPrice(itemId, type) {
    const key = `${itemId}_${type}`;
    if (customPrices[key] !== undefined) return customPrices[key];
    const item = WEAPON_PARTS_BY_ID[itemId] || ALL_ITEMS_BY_ID[itemId];
    return item?.[`${type}Price`] ?? null;
  }

  function getMaterialPrice(matId, type) {
    const key = `${matId}_${type}`;
    if (customPrices[key] !== undefined) return customPrices[key];
    return MATERIALS_BY_ID[matId]?.[`${type}Price`] ?? null;
  }

  function formatPrice(price) {
    if (price === null || price === undefined) return '?';
    return `${price}🪙`;
  }

  function canAfford(price, qty = 1) {
    if (price === null) return true; // precio desconocido, permitir
    return gameState.gold >= price * qty;
  }

  function getCustomQty(key, def = 1) {
    return customQty[key] || def;
  }

  // Inventario agrupado
  const inventoryGroups = {};
  for (const item of gameState.itemInventory) {
    if (!inventoryGroups[item.id]) inventoryGroups[item.id] = 0;
    inventoryGroups[item.id]++;
  }

  // Ítems disponibles en tienda (que podemos comprar)
  const shopAvailableItems = gameState.availableItemIds;

  return (
    <div className="shop-panel">
      {/* Tabs de la tienda */}
      <div className="shop-tabs">
        <button
          className={`tab-btn ${shopTab === 'materiales' ? 'active' : ''}`}
          onClick={() => setShopTab('materiales')}
        >
          Materiales
        </button>
        <button
          className={`tab-btn ${shopTab === 'tienda' ? 'active' : ''}`}
          onClick={() => setShopTab('tienda')}
        >
          Tienda
        </button>
        <button
          className={`tab-btn ${shopTab === 'inventario' ? 'active' : ''}`}
          onClick={() => setShopTab('inventario')}
        >
          Inventario ({gameState.itemInventory.length})
        </button>
      </div>

      {/* Materiales */}
      {shopTab === 'materiales' && (
        <div className="materials-grid">
          {MATERIALS.map(mat => {
            const qty = gameState.craftingMaterials[mat.id] || 0;
            const buyPrice = getMaterialPrice(mat.id, 'buy');
            const sellPrice = getMaterialPrice(mat.id, 'sell');
            const customQtyKey = `mat_${mat.id}`;
            const cq = getCustomQty(customQtyKey);

            return (
              <div key={mat.id} className="material-card">
                <div className="material-header">
                  <img
                    src={mat.image}
                    alt={mat.name}
                    className="material-img"
                    onError={e => e.target.style.display = 'none'}
                  />
                  <div className="material-info">
                    <span className="material-name">{mat.name}</span>
                    <span className="material-qty">×{qty}</span>
                  </div>
                </div>

                <div className="price-row">
                  <span className="price-label">Compra:</span>
                  <span className={`price-value ${!canAfford(buyPrice) ? 'price-cant-afford' : ''}`}>
                    {formatPrice(buyPrice)}
                  </span>
                  <span className="price-label">Venta:</span>
                  <span className="price-value">{formatPrice(sellPrice)}</span>
                </div>

                <div className="action-row">
                  <div className="qty-input-group">
                    <button
                      className="btn btn-sm"
                      onClick={() => buyMaterial(mat.id, 1)}
                      disabled={!canAfford(buyPrice, 1)}
                      title="Comprar ×1"
                    >
                      +1
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => buyMaterial(mat.id, 5)}
                      disabled={!canAfford(buyPrice, 5)}
                      title="Comprar ×5"
                    >
                      +5
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={cq}
                      onChange={e => setCustomQty(prev => ({ ...prev, [customQtyKey]: Number(e.target.value) }))}
                      className="qty-input"
                    />
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => buyMaterial(mat.id, cq)}
                      disabled={!canAfford(buyPrice, cq)}
                    >
                      Comprar
                    </button>
                  </div>
                </div>

                {qty > 0 && (
                  <div className="sell-row">
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => sellMaterial(mat.id, 1)}
                      disabled={qty < 1}
                    >
                      Vender ×1
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => sellMaterial(mat.id, qty)}
                      disabled={qty < 1}
                    >
                      Vender todo ({qty})
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tienda — ítems disponibles */}
      {shopTab === 'tienda' && (
        <div className="shop-items">
          {shopAvailableItems.length === 0 ? (
            <div className="empty-state">
              <p>No hay ítems disponibles en la tienda en este momento.</p>
              <p>Los ítems de tienda se muestran según el estado del save cargado.</p>
            </div>
          ) : (
            <div className="items-list">
              {shopAvailableItems.map(itemId => {
                const part = WEAPON_PARTS_BY_ID[itemId];
                const item = ALL_ITEMS_BY_ID[itemId];
                const data = part || item;
                const buyPrice = getPrice(itemId, 'buy');
                const sellPrice = getPrice(itemId, 'sell');

                return (
                  <div key={itemId} className="shop-item-card">
                    <div className="item-header">
                      {data?.image && (
                        <img
                          src={data.image}
                          alt={data.name}
                          className="item-img-sm"
                          onError={e => e.target.style.display = 'none'}
                        />
                      )}
                      <div className="item-info">
                        <span className="item-name">{data?.name || itemId}</span>
                        {part && (
                          <span className="item-tag">
                            Parte {part.slot} · Nv.{part.level}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="item-actions">
                      <span className={`price-value ${!canAfford(buyPrice) ? 'price-cant-afford' : ''}`}>
                        {formatPrice(buyPrice)}
                      </span>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => buyItem(itemId)}
                        disabled={!canAfford(buyPrice)}
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inventario — vender */}
      {shopTab === 'inventario' && (
        <div className="inventory-section">
          {Object.keys(inventoryGroups).length === 0 ? (
            <div className="empty-state">No hay ítems en el inventario.</div>
          ) : (
            <div className="items-list">
              {Object.entries(inventoryGroups).map(([itemId, qty]) => {
                const part = WEAPON_PARTS_BY_ID[itemId];
                const item = ALL_ITEMS_BY_ID[itemId];
                const data = part || item;
                const sellPrice = getPrice(itemId, 'sell');

                return (
                  <div key={itemId} className="shop-item-card">
                    <div className="item-header">
                      {data?.image && (
                        <img
                          src={data.image}
                          alt={data?.name || itemId}
                          className="item-img-sm"
                          onError={e => e.target.style.display = 'none'}
                        />
                      )}
                      <div className="item-info">
                        <span className="item-name">{data?.name || itemId}</span>
                        {part && (
                          <span className="item-tag">
                            Parte {part.slot} · Nv.{part.level}
                          </span>
                        )}
                        {qty > 1 && <span className="item-qty-badge">×{qty}</span>}
                      </div>
                    </div>
                    <div className="item-actions">
                      <span className="price-value sell">{formatPrice(sellPrice)}</span>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => sellItem(itemId, 1)}
                      >
                        Vender ×1
                      </button>
                      {qty > 1 && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => sellItem(itemId, qty)}
                        >
                          Todo ({qty})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
