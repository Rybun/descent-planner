// Estado global de la aplicación con historial para undo
// Gestión simple de estado sin librerías externas

import { create } from 'zustand';
import { parseSave } from './parser/savParser';
import { MATERIALS_BY_ID } from './gamedata/materials';
import { WEAPON_PARTS_BY_ID } from './gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from './gamedata/items';

const MAX_HISTORY = 100;

// Crea una copia profunda del estado de la partida (sin historial)
function cloneGameState(gs) {
  return {
    gold: gs.gold,
    craftingMaterials: { ...gs.craftingMaterials },
    itemInventory: gs.itemInventory.map(i => ({ ...i })),
    shopData: gs.shopData.map(s => ({ ...s })),
    availableItemIds: [...gs.availableItemIds],
    availableRecipeIds: [...gs.availableRecipeIds],
    discoveredRecipes: gs.discoveredRecipes.map(r => ({ ...r })),
    heroes: gs.heroes.map(h => ({
      ...h,
      equippedWeapons: h.equippedWeapons.map(w => ({ ...w })),
    })),
  };
}

function createAction(type, description, data) {
  return {
    id: Date.now() + Math.random(),
    type,
    description,
    timestamp: new Date().toISOString(),
    data,
    reversible: true,
  };
}

export const useStore = create((set, get) => ({
  // === ESTADO DE CARGA ===
  saveLoaded: false,
  saveError: null,
  saveMeta: null, // { partyName, act, version, timestamp }

  // === ESTADO DEL JUEGO (mutable durante la sesión) ===
  gameState: null,

  // === ESTADO ORIGINAL (para reset) ===
  originalState: null,

  // === HISTORIAL ===
  actionHistory: [],

  // === UI ===
  activeTab: 'tienda',
  showSettings: false,
  priceEditorOpen: false,

  // === PRECIOS EDITADOS (localStorage) ===
  customPrices: JSON.parse(localStorage.getItem('descent_prices') || '{}'),

  // ===================== ACCIONES =====================

  // Cargar fichero .SAV
  loadSave: (content) => {
    try {
      const parsed = parseSave(content);
      const gs = cloneGameState(parsed);
      set({
        saveLoaded: true,
        saveError: null,
        saveMeta: {
          partyName: parsed.partyName,
          act: parsed.act,
          version: parsed.version,
          timestamp: parsed.timestamp,
          questId: parsed.questId,
          gameDifficulty: parsed.gameDifficulty,
          slotGUID: parsed.slotGUID,
          roundNumber: parsed.roundNumber,
        },
        gameState: gs,
        originalState: cloneGameState(parsed),
        actionHistory: [],
      });
    } catch (e) {
      set({ saveError: e.message, saveLoaded: false });
    }
  },

  // Resetear al estado original del save
  resetToSave: () => {
    const { originalState } = get();
    if (!originalState) return;
    set({
      gameState: cloneGameState(originalState),
      actionHistory: [],
    });
  },

  // Deshacer última acción
  undoAction: () => {
    const { actionHistory, originalState } = get();
    if (actionHistory.length === 0) return;

    const newHistory = actionHistory.slice(0, -1);

    // Reconstruir el estado aplicando todas las acciones anteriores desde el original
    let gs = cloneGameState(originalState);
    for (const action of newHistory) {
      gs = applyAction(gs, action);
    }

    set({ gameState: gs, actionHistory: newHistory });
  },

  // Deshacer hasta una acción específica (exclusive)
  undoUntil: (actionId) => {
    const { actionHistory, originalState } = get();
    const idx = actionHistory.findIndex(a => a.id === actionId);
    if (idx === -1) return;

    const newHistory = actionHistory.slice(0, idx);
    let gs = cloneGameState(originalState);
    for (const action of newHistory) {
      gs = applyAction(gs, action);
    }

    set({ gameState: gs, actionHistory: newHistory });
  },

  // === TIENDA: COMPRAR ÍTEM ===
  buyItem: (itemId, qty = 1) => {
    const { gameState, actionHistory, customPrices } = get();
    if (!gameState) return false;

    const price = getItemBuyPrice(itemId, customPrices);
    if (price === null || price === undefined) {
      // Precio desconocido, permitir igual
    }

    const totalCost = (price || 0) * qty;
    if (gameState.gold < totalCost) return false;

    const action = createAction('BUY_ITEM', `Comprar ×${qty} ${getItemName(itemId)}`, {
      itemId, qty, cost: totalCost
    });

    const newGs = applyAction(cloneGameState(gameState), action);
    const newHistory = [...actionHistory, action].slice(-MAX_HISTORY);
    set({ gameState: newGs, actionHistory: newHistory });
    return true;
  },

  // === TIENDA: VENDER ÍTEM ===
  sellItem: (itemId, qty = 1) => {
    const { gameState, actionHistory, customPrices } = get();
    if (!gameState) return false;

    const price = getItemSellPrice(itemId, customPrices);
    const totalGain = (price || 0) * qty;

    const action = createAction('SELL_ITEM', `Vender ×${qty} ${getItemName(itemId)}`, {
      itemId, qty, gain: totalGain
    });

    const newGs = applyAction(cloneGameState(gameState), action);
    const newHistory = [...actionHistory, action].slice(-MAX_HISTORY);
    set({ gameState: newGs, actionHistory: newHistory });
    return true;
  },

  // === TIENDA: COMPRAR MATERIAL ===
  buyMaterial: (materialId, qty = 1) => {
    const { gameState, actionHistory, customPrices } = get();
    if (!gameState) return false;

    const mat = MATERIALS_BY_ID[materialId];
    const buyPrice = customPrices[`${materialId}_buy`] ?? mat?.buyPrice ?? 0;
    const totalCost = buyPrice * qty;

    if (buyPrice > 0 && gameState.gold < totalCost) return false;

    const action = createAction('BUY_MATERIAL', `Comprar ×${qty} ${mat?.name || materialId}`, {
      materialId, qty, cost: totalCost
    });

    const newGs = applyAction(cloneGameState(gameState), action);
    const newHistory = [...actionHistory, action].slice(-MAX_HISTORY);
    set({ gameState: newGs, actionHistory: newHistory });
    return true;
  },

  // === TIENDA: VENDER MATERIAL ===
  sellMaterial: (materialId, qty = 1) => {
    const { gameState, actionHistory, customPrices } = get();
    if (!gameState) return false;

    const mat = MATERIALS_BY_ID[materialId];
    const sellPrice = customPrices[`${materialId}_sell`] ?? mat?.sellPrice ?? 0;
    const totalGain = sellPrice * qty;

    // Verificar que tenemos stock suficiente
    const currentQty = gameState.craftingMaterials[materialId] || 0;
    if (currentQty < qty) return false;

    const action = createAction('SELL_MATERIAL', `Vender ×${qty} ${mat?.name || materialId}`, {
      materialId, qty, gain: totalGain
    });

    const newGs = applyAction(cloneGameState(gameState), action);
    const newHistory = [...actionHistory, action].slice(-MAX_HISTORY);
    set({ gameState: newGs, actionHistory: newHistory });
    return true;
  },

  // === CRAFTEO: CRAFTEAR PARTE ===
  craftItem: (recipeId) => {
    const { gameState, actionHistory } = get();
    if (!gameState) return false;

    const action = createAction('CRAFT_ITEM', `Craftear ${recipeId}`, { recipeId });
    const newGs = applyAction(cloneGameState(gameState), action);
    const newHistory = [...actionHistory, action].slice(-MAX_HISTORY);
    set({ gameState: newGs, actionHistory: newHistory });
    return true;
  },

  // === PRECIOS ===
  setCustomPrice: (itemId, type, price) => {
    const { customPrices } = get();
    const key = `${itemId}_${type}`;
    const newPrices = { ...customPrices, [key]: price };
    localStorage.setItem('descent_prices', JSON.stringify(newPrices));
    set({ customPrices: newPrices });
  },

  // === UI ===
  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowSettings: (v) => set({ showSettings: v }),

  // === EXPORTAR LOG ===
  exportLog: () => {
    const { actionHistory, saveMeta, originalState, gameState } = get();
    if (!originalState || !gameState) return '';

    const goldDiff = gameState.gold - originalState.gold;
    const lines = [
      `=== DESCENT: LEGENDS OF THE DARK - Resumen de Sesión ===`,
      `Grupo: ${saveMeta?.partyName || '?'}`,
      `Acto: ${(saveMeta?.act ?? 0) + 1}`,
      `Fecha: ${new Date().toLocaleString('es-ES')}`,
      ``,
      `Oro inicial: ${originalState.gold}`,
      `Oro final:   ${gameState.gold}`,
      `Diferencia:  ${goldDiff >= 0 ? '+' : ''}${goldDiff}`,
      ``,
      `=== ACCIONES REALIZADAS (${actionHistory.length}) ===`,
      ...actionHistory.map((a, i) => `${i + 1}. [${a.timestamp.slice(11, 19)}] ${a.description}`),
    ];

    return lines.join('\n');
  },
}));

// ===================== HELPERS =====================

function getItemName(itemId) {
  const part = WEAPON_PARTS_BY_ID[itemId];
  if (part) return part.name;
  const item = ALL_ITEMS_BY_ID[itemId];
  if (item) return item.name;
  return itemId;
}

function getItemBuyPrice(itemId, customPrices) {
  const key = `${itemId}_buy`;
  if (customPrices[key] !== undefined) return customPrices[key];
  const part = WEAPON_PARTS_BY_ID[itemId];
  if (part) return part.buyPrice;
  const item = ALL_ITEMS_BY_ID[itemId];
  if (item) return item.buyPrice;
  return null;
}

function getItemSellPrice(itemId, customPrices) {
  const key = `${itemId}_sell`;
  if (customPrices[key] !== undefined) return customPrices[key];
  const part = WEAPON_PARTS_BY_ID[itemId];
  if (part) return part.sellPrice;
  const item = ALL_ITEMS_BY_ID[itemId];
  if (item) return item.sellPrice;
  return null;
}

// Aplica una acción al estado del juego (puro, sin mutación)
function applyAction(gs, action) {
  const { type, data } = action;

  switch (type) {
    case 'BUY_ITEM': {
      const { itemId, qty, cost } = data;
      const newInventory = [...gs.itemInventory];
      // Buscar si ya existe en inventario
      const existingIdx = newInventory.findIndex(i => i.id === itemId);
      if (existingIdx >= 0) {
        // El inventario de Descent no tiene cantidad, pero lo manejamos igual
      } else {
        for (let i = 0; i < qty; i++) {
          newInventory.push({ id: itemId, soldOut: false });
        }
      }
      return {
        ...gs,
        gold: gs.gold - cost,
        itemInventory: newInventory,
      };
    }

    case 'SELL_ITEM': {
      const { itemId, qty, gain } = data;
      let remaining = qty;
      const newInventory = gs.itemInventory.filter(i => {
        if (i.id === itemId && remaining > 0) {
          remaining--;
          return false;
        }
        return true;
      });
      return {
        ...gs,
        gold: gs.gold + gain,
        itemInventory: newInventory,
      };
    }

    case 'BUY_MATERIAL': {
      const { materialId, qty, cost } = data;
      return {
        ...gs,
        gold: gs.gold - cost,
        craftingMaterials: {
          ...gs.craftingMaterials,
          [materialId]: (gs.craftingMaterials[materialId] || 0) + qty,
        },
      };
    }

    case 'SELL_MATERIAL': {
      const { materialId, qty, gain } = data;
      const currentQty = gs.craftingMaterials[materialId] || 0;
      return {
        ...gs,
        gold: gs.gold + gain,
        craftingMaterials: {
          ...gs.craftingMaterials,
          [materialId]: Math.max(0, currentQty - qty),
        },
      };
    }

    case 'CRAFT_ITEM': {
      const { recipeId } = data;
      // Marcar receta como crafteada
      const newRecipes = gs.discoveredRecipes.map(r =>
        r.id === recipeId ? { ...r, crafted: true } : r
      );
      return { ...gs, discoveredRecipes: newRecipes };
    }

    default:
      return gs;
  }
}
