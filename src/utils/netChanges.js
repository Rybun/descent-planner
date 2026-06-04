// Calcula los cambios netos entre el estado original y el actual.
// Usado tanto en ActionLog como en el badge del tab Historial.

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

export function computeNetChanges(originalState, gameState, actionHistory) {
  if (!originalState || !gameState) return null;

  // ── Tienda ────────────────────────────────────────────────────────────────
  const matDelta  = {};
  const itemDelta = {};
  for (const action of (actionHistory || [])) {
    const { type, data } = action;
    if (type === 'BUY_MATERIAL')  matDelta[data.materialId]  = (matDelta[data.materialId]  || 0) + data.qty;
    else if (type === 'SELL_MATERIAL') matDelta[data.materialId] = (matDelta[data.materialId] || 0) - data.qty;
    else if (type === 'BUY_ITEM')  itemDelta[data.itemId]  = (itemDelta[data.itemId]  || 0) + data.qty;
    else if (type === 'SELL_ITEM') itemDelta[data.itemId]  = (itemDelta[data.itemId]  || 0) - data.qty;
  }
  const matChanges  = Object.entries(matDelta).filter(([, d]) => d !== 0).map(([id, delta]) => ({ id, delta }));
  const itemChanges = Object.entries(itemDelta).filter(([, d]) => d !== 0).map(([id, delta]) => ({ id, delta }));

  // ── Crafteo ───────────────────────────────────────────────────────────────
  const origCrafted  = new Set((originalState.discoveredRecipes || []).filter(r => r.crafted).map(r => r.id));
  const currCrafted  = new Set((gameState.discoveredRecipes    || []).filter(r => r.crafted).map(r => r.id));
  const newlyCrafted = [...currCrafted].filter(id => !origCrafted.has(id));
  const unCrafted    = [...origCrafted].filter(id => !currCrafted.has(id));

  // ── Armería ───────────────────────────────────────────────────────────────
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

  const hasShop    = matChanges.length > 0 || itemChanges.length > 0;
  const hasCraft   = newlyCrafted.length > 0 || unCrafted.length > 0;
  const hasArmoria = armoriaChanges.length > 0;

  return { matChanges, itemChanges, newlyCrafted, unCrafted, armoriaChanges, hasShop, hasCraft, hasArmoria };
}

// Devuelve el número de cambios netos visibles (lo que muestra el log).
export function countNetChanges(originalState, gameState, actionHistory) {
  const net = computeNetChanges(originalState, gameState, actionHistory);
  if (!net) return 0;
  const armoriaSlots = net.armoriaChanges.reduce((sum, w) => sum + w.slots.length, 0);
  return net.matChanges.length + net.itemChanges.length
       + net.newlyCrafted.length + net.unCrafted.length
       + armoriaSlots;
}
