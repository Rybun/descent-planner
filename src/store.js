// Estado global de la aplicación con historial para undo
// Gestión simple de estado sin librerías externas

import { create } from 'zustand';
import { parseSave } from './parser/savParser';
import { MATERIALS_BY_ID } from './gamedata/materials';
import { WEAPON_PARTS_BY_ID } from './gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from './gamedata/items';
import { RECIPES_BY_ID } from './gamedata/recipes';
import { WEAPONS_BY_ID } from './gamedata/weapons';
import { HEROES_BY_ID } from './gamedata/heroes';

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
    shopRecipeIds: [...(gs.shopRecipeIds || [])],
    discoveredRecipes: gs.discoveredRecipes.map(r => ({ ...r })),
    heroes: gs.heroes.map(h => ({
      ...h,
      equippedWeapons: h.equippedWeapons.map(w => ({ ...w })),
    })),
    // Selecciones de pieza A/B/C por arma (UI state con historial)
    partASelections: { ...(gs.partASelections || {}) },
    partBSelections: { ...(gs.partBSelections || {}) },
    partCSelections: { ...(gs.partCSelections || {}) },
    // Qué slot (0/1) de cada héroe muestra un arma rúnica en vez de su arma
    // normal. Cuál rúnica en concreto se guarda con el mismo mecanismo que
    // cualquier otra pieza A, bajo el id sintético `RUNIC_<heroId>_<slot>`.
    heroRunicSlot: { ...(gs.heroRunicSlot || {}) },
  };
}

// Reconstruye el estado aplicando una lista de acciones desde el original
function replayHistory(originalState, history) {
  let gs = cloneGameState(originalState);
  for (const action of history) {
    gs = applyAction(gs, action);
  }
  return gs;
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
  activeTab: 'armeria',
  selectedArmeriaHeroId: 'HERO_BRYNN',
  showSettings: false,
  priceEditorOpen: false,

  // === IDIOMA ===
  lang: getInitialLang(),

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
          currentGamePhase: parsed.currentGamePhase,
          currentObjectiveKey: parsed.currentObjectiveKey,
          lastKnownLocation: parsed.lastKnownLocation,
          totalPlayTimeSeconds: parsed.totalPlayTimeSeconds,
          completedDestinations: parsed.completedDestinations,
          activeDestinations: parsed.activeDestinations,
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

  // Cargar un save ya parseado (desde enlace compartido)
  // originalState: estado pre-acciones (para que undo funcione correctamente)
  loadParsedState: (gameState, saveMeta, actionHistory = [], originalState = null) => {
    const gs   = cloneGameState(gameState);
    const orig = originalState ? cloneGameState(originalState) : cloneGameState(gameState);
    set({
      saveLoaded:    true,
      saveError:     null,
      saveMeta,
      gameState:     gs,
      originalState: orig,
      actionHistory,
    });
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
    const gs = replayHistory(originalState, newHistory);
    set({ gameState: gs, actionHistory: newHistory });
  },

  // Eliminar una acción concreta del historial y reconstruir el estado
  removeAction: (actionId) => {
    const { actionHistory, originalState } = get();
    const newHistory = actionHistory.filter(a => a.id !== actionId);
    const gs = replayHistory(originalState, newHistory);
    set({ gameState: gs, actionHistory: newHistory });
  },

  // Eliminar varias acciones a la vez (p.ej. "Recuperar todos" de una fila
  // de venta agrupada) reconstruyendo el estado una única vez. Deshacer una
  // venta resta el oro que ganaste al venderla, así que si ya te lo has
  // gastado en otra cosa, se rechaza para no dejar el oro en negativo.
  removeActions: (actionIds) => {
    const { actionHistory, originalState } = get();
    const idSet = new Set(actionIds);
    const newHistory = actionHistory.filter(a => !idSet.has(a.id));
    const gs = replayHistory(originalState, newHistory);
    if (gs.gold < 0) return false;
    set({ gameState: gs, actionHistory: newHistory });
    return true;
  },

  // Recupera una única unidad de la venta más reciente de un grupo (p.ej.
  // si vendiste ×5 de un material, deja ×4 vendidas y te devuelve 1 al
  // inventario), reduciendo el oro ganado proporcionalmente. Igual que
  // removeActions, rechaza la operación si dejaría el oro en negativo.
  recoverOneUnit: (actionIds) => {
    const { actionHistory, originalState } = get();
    const lastId = actionIds[actionIds.length - 1];
    const idx = actionHistory.findIndex(a => a.id === lastId);
    if (idx === -1) return false;

    const action = actionHistory[idx];
    const { qty, gain } = action.data;
    const unitGain = gain / qty;

    let newHistory;
    if (qty <= 1) {
      newHistory = actionHistory.filter(a => a.id !== lastId);
    } else {
      newHistory = actionHistory.map(a => a.id === lastId
        ? { ...a, data: { ...a.data, qty: qty - 1, gain: gain - unitGain } }
        : a
      );
    }

    const gs = replayHistory(originalState, newHistory);
    if (gs.gold < 0) return false;
    set({ gameState: gs, actionHistory: newHistory });
    return true;
  },

  // Deshacer hasta una acción específica (exclusive)
  undoUntil: (actionId) => {
    const { actionHistory, originalState } = get();
    const idx = actionHistory.findIndex(a => a.id === actionId);
    if (idx === -1) return;

    const newHistory = actionHistory.slice(0, idx);
    const gs = replayHistory(originalState, newHistory);
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

  // === ARMERÍA: EQUIPAR PIEZA A ===
  equipPartA: (weaponSaveId, partAId) => {
    const { gameState, actionHistory } = get();
    if (!gameState) return;

    const currentPartAId = (gameState.partASelections || {})[weaponSaveId];
    if (currentPartAId === partAId) return;

    const action = createAction('EQUIP_PART_A', `Equipar pieza A: ${getItemName(partAId)}`, {
      weaponSaveId, partAId,
    });

    const newGs = applyAction(cloneGameState(gameState), action);
    const newHistory = [...actionHistory, action].slice(-MAX_HISTORY);
    set({ gameState: newGs, actionHistory: newHistory });
  },

  // === ARMERÍA: EQUIPAR PIEZA B ===
  equipPartB: (weaponSaveId, partBId) => {
    const { gameState, actionHistory } = get();
    if (!gameState) return;

    const current = (gameState.partBSelections || {})[weaponSaveId];
    if (current === partBId) return;

    const action = createAction('EQUIP_PART_B', `Equipar pieza B: ${getItemName(partBId)}`, {
      weaponSaveId, partBId,
    });

    const newGs = applyAction(cloneGameState(gameState), action);
    const newHistory = [...actionHistory, action].slice(-MAX_HISTORY);
    set({ gameState: newGs, actionHistory: newHistory });
  },

  // === ARMERÍA: EQUIPAR PIEZA C ===
  equipPartC: (weaponSaveId, partCId) => {
    const { gameState, actionHistory } = get();
    if (!gameState) return;

    const current = (gameState.partCSelections || {})[weaponSaveId];
    if (current === partCId) return;

    const action = createAction('EQUIP_PART_C', `Equipar pieza C: ${getItemName(partCId)}`, {
      weaponSaveId, partCId,
    });

    const newGs = applyAction(cloneGameState(gameState), action);
    const newHistory = [...actionHistory, action].slice(-MAX_HISTORY);
    set({ gameState: newGs, actionHistory: newHistory });
  },

  // === ARMERÍA: ALTERNAR ARMA RÚNICA EN UN SLOT ===
  // Marca (o desmarca, con slot=null) que el hueco `slot` (0/1) del héroe
  // `heroId` muestra un arma rúnica en vez de su arma normal. Solo un héroe
  // de todo el grupo puede tener una rúnica concreta a la vez — eso lo
  // gestiona la propia UI (ArmeriaPanel), que filtra qué rúnicas se ofrecen a
  // cada héroe antes de llamar aquí, así que esta acción no repite esa
  // comprobación.
  setHeroRunicSlot: (heroId, slot) => {
    const { gameState, actionHistory } = get();
    if (!gameState) return;

    const current = (gameState.heroRunicSlot || {})[heroId] ?? null;
    if (current === slot) return;

    const action = createAction('SET_HERO_RUNIC_SLOT', `Alternar arma rúnica: ${heroId}`, {
      heroId, slot,
    });

    const newGs = applyAction(cloneGameState(gameState), action);
    const newHistory = [...actionHistory, action].slice(-MAX_HISTORY);
    set({ gameState: newGs, actionHistory: newHistory });
  },

  // === TIENDA: COMPRAR RECETA ===
  buyRecipe: (recipeId) => {
    const { gameState, actionHistory } = get();
    if (!gameState) return false;

    const recipe = RECIPES_BY_ID[recipeId];
    const cost   = recipe?.goldCost ?? 0;
    if (cost > 0 && gameState.gold < cost) return false;

    const action = createAction('BUY_RECIPE', `Comprar receta: ${recipeId}`, { recipeId, cost });
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
  setSelectedArmeriaHeroId: (id) => set({ selectedArmeriaHeroId: id }),
  setShowSettings: (v) => set({ showSettings: v }),
  setLang: (lang) => {
    localStorage.setItem('descent_lang', lang);
    set({ lang });
  },

  // === EXPORTAR LOG ===
  exportLog: () => {
    const { saveMeta, originalState, gameState } = get();
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
    ];

    // ── Cambios netos de materiales ──────────────────────────────────────────
    const matChanges = [];
    const allMatIds = new Set([
      ...Object.keys(originalState.craftingMaterials || {}),
      ...Object.keys(gameState.craftingMaterials || {}),
    ]);
    for (const id of allMatIds) {
      const delta = (gameState.craftingMaterials[id] || 0) - (originalState.craftingMaterials[id] || 0);
      if (delta !== 0) matChanges.push({ id, delta });
    }

    // ── Cambios netos de ítems ───────────────────────────────────────────────
    const countItems = inv => { const c = {}; for (const e of (inv || [])) c[e.id] = (c[e.id] || 0) + 1; return c; };
    const origItems = countItems(originalState.itemInventory);
    const currItems = countItems(gameState.itemInventory);
    const itemChanges = [];
    for (const id of new Set([...Object.keys(origItems), ...Object.keys(currItems)])) {
      const delta = (currItems[id] || 0) - (origItems[id] || 0);
      if (delta !== 0) itemChanges.push({ id, delta });
    }

    // ── Recetas crafteadas ───────────────────────────────────────────────────
    const origCrafted = new Set((originalState.discoveredRecipes || []).filter(r => r.crafted).map(r => r.id));
    const currCrafted = new Set((gameState.discoveredRecipes || []).filter(r => r.crafted).map(r => r.id));
    const newlyCrafted = [...currCrafted].filter(id => !origCrafted.has(id));

    // ── Cambios de armería (con fallback al valor del save) ─────────────────
    const effSel = (state) => {
      const a = {}, b = {}, c = {};
      for (const hero of (state.heroes || []))
        for (const w of (hero.equippedWeapons || [])) {
          a[w.id] = (state.partASelections || {})[w.id] ?? w.partA ?? null;
          b[w.id] = (state.partBSelections || {})[w.id] ?? w.partB ?? null;
          c[w.id] = (state.partCSelections || {})[w.id] ?? w.partC ?? null;
        }
      return { a, b, c };
    };
    const os = effSel(originalState), cs = effSel(gameState);
    const allWeaponIds = new Set([...Object.keys(os.a), ...Object.keys(cs.a)]);
    const armoriaChanges = [];
    for (const wid of allWeaponIds) {
      const slots = [
        ['A', os.a[wid], cs.a[wid]],
        ['B', os.b[wid], cs.b[wid]],
        ['C', os.c[wid], cs.c[wid]],
      ].filter(([, from, to]) => from !== to);
      if (slots.length) armoriaChanges.push({ wid, slots });
    }

    const sign = d => (d > 0 ? '+' : '') + d;

    if (matChanges.length || itemChanges.length) {
      lines.push(``, `=== TIENDA ===`);
      for (const { id, delta } of matChanges)  lines.push(`  ${sign(delta)}  ${getItemName(id)}`);
      for (const { id, delta } of itemChanges) lines.push(`  ${sign(delta)}  ${getItemName(id)}`);
    }

    if (newlyCrafted.length) {
      lines.push(``, `=== SALA DE CREACIÓN ===`);
      for (const id of newlyCrafted) lines.push(`  +  ${getItemName(id)}`);
    }

    if (armoriaChanges.length) {
      // Slot names en español
      const SLOT_NAMES_ES = {
        BOW:        { B: 'Cuerda',          C: 'Flecha' },
        CROSSBOW:   { B: 'Culata',          C: 'Virotes' },
        DUAL_BLADES:{ B: 'Arma secundaria', C: 'Puños' },
        GAUNTLET:   { B: 'Guante',          C: 'Brazalete' },
        HAMMER:     { B: 'Mango',           C: 'Agarre' },
        KNIVES:     { B: 'Agarre',          C: 'Cinturón' },
        SPEAR:      { B: 'Mango',           C: 'Cola' },
        STAFF:      { B: 'Envoltura',       C: 'Infusión' },
        SWORD:      { B: 'Guardia',         C: 'Empuñadura' },
        WAND:       { B: 'Envoltura',       C: 'Adorno' },
        WARBELL:    { B: 'Agarre',          C: 'Mango' },
        WARHAMMER:  { B: 'Mango',           C: 'Puño' },
      };

      // Agrupar por héroe
      const byHero = {};
      for (const { wid, slots } of armoriaChanges) {
        const weapon  = WEAPONS_BY_ID[wid];
        const heroId  = weapon?.heroId || 'UNKNOWN';
        const hero    = HEROES_BY_ID[heroId];
        const heroName = hero?.name || heroId;
        const wepName  = weapon?.name || wid;
        const wType    = weapon?.weaponType || '';
        if (!byHero[heroId]) byHero[heroId] = { heroName, weapons: [] };
        byHero[heroId].weapons.push({ wepName, wType, slots });
      }

      lines.push(``, `=== ARMERÍA ===`);
      for (const { heroName, weapons } of Object.values(byHero)) {
        lines.push(`  ${heroName}`);
        for (const { wepName, wType, slots } of weapons) {
          lines.push(`    ${wepName}`);
          for (const [slot, , to] of slots) {
            const label = slot === 'A' ? 'Equipar' : (SLOT_NAMES_ES[wType]?.[slot] || `Pieza ${slot}`);
            lines.push(`      ${label}: ${getItemName(to) || '—'}`);
          }
        }
      }
    }

    return lines.join('\n');
  },
}));

// ===================== HELPERS =====================

function getInitialLang() {
  const LANGS = ['es', 'en', 'fr', 'it', 'pt'];
  const saved = localStorage.getItem('descent_lang');
  if (saved && LANGS.includes(saved)) return saved;
  const nav = (navigator.language || '').slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : 'es';
}

function getItemName(itemId) {
  const part = WEAPON_PARTS_BY_ID[itemId];
  if (part) return part.names?.es || part.names?.en || part.id || itemId;
  const item = ALL_ITEMS_BY_ID[itemId];
  if (item) return item.names?.es || item.names?.en || item.id || itemId;
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
      // Retirar el objeto de la tienda una vez comprado
      const newShopData = (gs.shopData || [])
        .map(s => (s.id === itemId ? { ...s, qty: s.qty - qty } : s))
        .filter(s => s.id !== itemId || s.qty > 0);
      return {
        ...gs,
        gold: gs.gold - cost,
        itemInventory: newInventory,
        shopData: newShopData,
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

    case 'BUY_RECIPE': {
      const { recipeId, cost } = data;
      const alreadyHas  = gs.discoveredRecipes.some(r => r.id === recipeId);
      const newRecipes  = alreadyHas
        ? gs.discoveredRecipes
        : [...gs.discoveredRecipes, { id: recipeId, crafted: false }];
      return {
        ...gs,
        gold: gs.gold - cost,
        discoveredRecipes: newRecipes,
        shopRecipeIds: (gs.shopRecipeIds || []).filter(id => id !== recipeId),
      };
    }

    case 'CRAFT_ITEM': {
      const { recipeId } = data;
      const recipe = RECIPES_BY_ID[recipeId]
        || RECIPES_BY_ID[recipeId.replace(/_UPGRADED$/, '').replace(/_PLUS$/, '')];

      // Marcar receta como crafteada
      const newRecipes = gs.discoveredRecipes.map(r =>
        r.id === recipeId ? { ...r, crafted: true } : r
      );

      // Restar materiales
      const newMats = { ...gs.craftingMaterials };
      if (recipe?.ingredients) {
        for (const [matId, qty] of Object.entries(recipe.ingredients)) {
          newMats[matId] = Math.max(0, (newMats[matId] || 0) - qty);
        }
      }

      // Actualizar inventario: para mejoras (_PLUS o _UPGRADED), eliminar ítem base y añadir nuevo
      let newInventory = [...gs.itemInventory];
      if (recipe?.itemId) {
        const isUpgrade = recipeId.endsWith('_UPGRADED') || recipeId.endsWith('_PLUS');
        if (isUpgrade) {
          const baseId = recipe.itemId.replace(/_PLUS$/, '').replace(/_UPGRADED$/, '');
          const idx = newInventory.findIndex(i => i.id === baseId);
          if (idx !== -1) newInventory.splice(idx, 1);
        }
        newInventory.push({ id: recipe.itemId });
      }

      return {
        ...gs,
        discoveredRecipes: newRecipes,
        craftingMaterials: newMats,
        itemInventory: newInventory,
      };
    }

    case 'EQUIP_PART_A': {
      const { weaponSaveId, partAId } = data;
      return {
        ...gs,
        partASelections: {
          ...(gs.partASelections || {}),
          [weaponSaveId]: partAId,
        },
      };
    }

    case 'EQUIP_PART_B': {
      const { weaponSaveId, partBId } = data;
      return {
        ...gs,
        partBSelections: {
          ...(gs.partBSelections || {}),
          [weaponSaveId]: partBId,
        },
      };
    }

    case 'EQUIP_PART_C': {
      const { weaponSaveId, partCId } = data;
      return {
        ...gs,
        partCSelections: {
          ...(gs.partCSelections || {}),
          [weaponSaveId]: partCId,
        },
      };
    }

    case 'SET_HERO_RUNIC_SLOT': {
      const { heroId, slot } = data;
      const newMap = { ...(gs.heroRunicSlot || {}) };
      if (slot === null) {
        delete newMap[heroId];
      } else {
        newMap[heroId] = slot;
      }
      return { ...gs, heroRunicSlot: newMap };
    }

    default:
      return gs;
  }
}
