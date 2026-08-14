// Parser de ficheros .SAV del juego Descent: Legends of the Dark
// El fichero .SAV es un JSON plano (no comprimido)

/**
 * Parsea el contenido JSON de un fichero .SAV
 * @param {string} jsonContent - Contenido del fichero .SAV
 * @returns {Object} Estado normalizado de la partida
 * @throws {Error} Si el formato es inválido
 */
export function parseSave(jsonContent) {
  let raw;

  try {
    raw = JSON.parse(jsonContent);
  } catch (e) {
    throw new Error(`El fichero no es un JSON válido: ${e.message}`);
  }

  // Validaciones básicas
  if (!raw.SlotGUID) {
    throw new Error('El fichero no parece ser un save de Descent: falta SlotGUID');
  }

  if (!raw.GameSceneData?.GameState) {
    throw new Error('El fichero no tiene datos de estado de partida (GameSceneData.GameState)');
  }

  const gs = raw.GameSceneData.GameState;

  // Extraer materiales de crafteo
  const craftingMaterials = {};
  for (const mat of (gs.CraftingMaterials || [])) {
    if (mat.Id && mat.Qty !== undefined) {
      craftingMaterials[mat.Id] = mat.Qty;
    }
  }

  // Extraer inventario de ítems
  const itemInventory = [];
  for (const item of (gs.ItemInventory || [])) {
    if (item.Id) {
      itemInventory.push({
        id: item.Id,
        soldOut: item.SoldOut || false,
      });
    }
  }

  // Extraer datos de la tienda
  // El save puede usar distintos esquemas de campo según versión/plataforma:
  //   PC:     { id, qty }  (minúsculas)
  //   Móvil:  { ItemId, Quantity }
  //   Antiguo:{ Id, Qty }
  const shopData = [];
  for (const shop of (gs.ShopData || [])) {
    const itemId = shop.id || shop.Id || shop.ItemId;
    if (itemId) {
      shopData.push({
        id: itemId,
        qty: shop.qty ?? shop.Qty ?? shop.Quantity ?? 1,
        soldOut: shop.soldOut || shop.SoldOut || false,
      });
    }
  }

  // Extraer recetas descubiertas
  const discoveredRecipes = [];
  for (const recipe of (gs.DiscoveredRecipes || [])) {
    if (recipe.Id) {
      discoveredRecipes.push({
        id: recipe.Id,
        crafted: recipe.Crafted || false,
      });
    }
  }

  // Extraer recetas disponibles en la ciudad (para craftear)
  const availableRecipeIds = gs.AvailableRecipeIds || [];

  // Extraer ítems disponibles en la tienda
  const availableItemIds = gs.AvailableItemIds || [];

  // Recetas actualmente a la venta en ShopData (subconjunto con stock ahora)
  const shopRecipeIds = shopData
    .filter(s => s.id.startsWith('RECIPE_'))
    .map(s => s.id);

  // Misiones completadas/disponibles, de historia (STORY_QUEST_N) y
  // opcionales (SIDE_QUEST_N). El registro de campaña guarda una entrada por
  // cada hito conseguido (misión, evento narrativo, evento de ciudad...) —
  // no hace falta filtrar por EntryType, basta con quedarse con los ids que
  // empiezan por el prefijo buscado. El EntryId a veces lleva un sufijo de
  // variante (p.ej. "STORY_QUEST_4_S") que no existe como tal en quests.js —
  // solo importa el número, así que se normaliza. Las disponibles-pero-no-
  // completadas son las que el grupo ya puede emprender; el resto (ni
  // completada ni disponible) es spoiler de la campaña y la UI debe
  // ocultarlas por defecto. Se contemplan ambos esquemas de campo (PC
  // "EntryId" / variante en minúsculas) por si acaso, igual que con ShopData
  // más abajo.
  function extractQuestIds(prefix) {
    const completed = [];
    const completedDates = {};
    for (const entry of (gs.CampaignLogEntries || gs.campaignLogEntries || [])) {
      const entryId = entry.EntryId ?? entry.entryId ?? '';
      const m = new RegExp(`^${prefix}_(\\d+)`).exec(entryId);
      if (m) {
        const id = `${prefix}_${m[1]}`;
        completed.push(id);
        const date = entry.DateCompleted ?? entry.dateCompleted;
        if (date) completedDates[id] = date;
      }
    }
    const active = [];
    for (const destId of (gs.ActiveDestinationIds || gs.activeDestinationIds || [])) {
      const m = new RegExp(`^${prefix}_(\\d+)`).exec(destId || '');
      if (m) active.push(`${prefix}_${m[1]}`);
    }
    return { completed, active, completedDates };
  }

  const storyQuestIds = extractQuestIds('STORY_QUEST');
  const sideQuestIds  = extractQuestIds('SIDE_QUEST');
  const completedStoryQuestIds = storyQuestIds.completed;
  const activeStoryQuestIds    = storyQuestIds.active;
  const completedSideQuestIds  = sideQuestIds.completed;
  const activeSideQuestIds     = sideQuestIds.active;
  const completedStoryQuestDates = storyQuestIds.completedDates;
  const completedSideQuestDates  = sideQuestIds.completedDates;

  // Habilidades de héroe desbloqueadas (compradas con XP de grupo)
  const unlockedSkills = gs.UnlockedSkills || gs.unlockedSkills || [];

  // Extraer datos de héroes
  const heroes = [];
  for (const player of (gs.AllPlayers || [])) {
    if (!player.HeroId) continue;

    const equippedWeapons = [];
    for (const weapon of (player.EquippedWeapons || [])) {
      equippedWeapons.push({
        id: weapon.Id,
        partA: weapon.PartAId || null,
        partB: weapon.PartBId || null,
        partC: weapon.PartCId || null,
      });
    }

    heroes.push({
      heroId: player.HeroId,
      index: player.Index ?? 0,
      equippedWeaponIndex: player.EquippedWeaponIndex ?? 0,
      equippedTrinketId: player.EquippedTrinketId || null,
      healthState: player.HealthState ?? 0,
      equippedWeapons,
      virtueOne: player.VirtueOneValue ?? 0,
      virtueTwo: player.VirtueTwoValue ?? 0,
    });
  }

  return {
    // Metadatos
    slotGUID: raw.SlotGUID,
    version: raw.Version,
    timestamp: raw.Timestamp,
    partyName: raw.PartyName || gs.PartyName || 'Grupo',
    act: raw.Act ?? 0,
    roundNumber: raw.RoundNumber ?? 0,
    questId: gs.QuestId,
    gameDifficulty: gs.GameDifficulty,
    currentGamePhase: gs.CurrentGamePhase,
    currentObjectiveKey: gs.CurrentObjectiveData?.Key || gs.CurrentObjective || null,
    lastKnownLocation: raw.StorySlot?.LastKnownLocation || null,
    totalPlayTimeSeconds: raw.StorySlot?.TotalSlotTime ?? null,
    completedDestinations: gs.CompletedDestinationIds || [],
    activeDestinations: gs.ActiveDestinationIds || [],
    completedStoryQuestIds,
    activeStoryQuestIds,
    completedSideQuestIds,
    activeSideQuestIds,
    completedStoryQuestDates,
    completedSideQuestDates,

    // Recursos
    gold: gs.Gold || 0,
    // XP de grupo. Según el propio glosario del juego (TERM_EXPERIENCE_DESC)
    // la XP nunca se pierde ni se gasta de forma permanente — todos los
    // héroes la ganan al mismo ritmo. Se muestra tal cual, sin restar el
    // coste de las habilidades ya desbloqueadas.
    partyXP: gs.PartyXP || 0,
    unlockedSkills,

    // Inventario y materiales
    craftingMaterials,
    itemInventory,

    // Tienda
    shopData,
    availableItemIds,
    availableRecipeIds,
    shopRecipeIds,

    // Recetas
    discoveredRecipes,

    // Héroes
    heroes,

    // Héroes no disponibles (muertos/ausentes)
    unavailableHeroes: gs.UnavailableHeroes || [],

    // Armas compartidas
    sharedWeaponIds: gs.SharedWeaponIds || [],
  };
}

/**
 * Valida que un estado parseado tiene los campos mínimos necesarios
 */
export function validateSaveState(state) {
  const errors = [];

  if (typeof state.gold !== 'number') errors.push('Oro inválido');
  if (!Array.isArray(state.heroes)) errors.push('Lista de héroes inválida');
  if (!state.partyName) errors.push('Nombre del grupo no encontrado');

  return errors;
}
