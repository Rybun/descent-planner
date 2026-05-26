// Recetas de crafteo de Descent: Legends of the Dark
// Datos extraídos directamente de los assets del juego (MonoBehaviour con Ingredients)
// Las recetas crean la versión mejorada (+) de los ítems
// goldCost: coste en oro para craftear (150 para casi todas las recetas)

// ============================================================
// RECETAS DE PARTES DE ARMA (crean versión mejorada UPGRADED)
// ============================================================
export const WEAPON_PART_RECIPES = [
  // === BOW ===
  { id: 'RECIPE_WEAPON_PART_A_BOW_1_UPGRADED', itemId: 'WEAPON_PART_A_BOW_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_HERBS': 10, 'MAT_MORTOS': 2, 'MAT_ANEMOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_BOW_2_UPGRADED', itemId: 'WEAPON_PART_A_BOW_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_HERBS': 10, 'MAT_CURIOS': 3, 'MAT_TOXOS': 2, 'MAT_ANEMOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_BOW_3_UPGRADED', itemId: 'WEAPON_PART_A_BOW_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 10, 'MAT_HERBS': 5, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_B_BOW_1', itemId: 'WEAPON_PART_B_BOW_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_CLOTH': 10, 'MAT_UMBROS': 2, 'MAT_FORTUNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_BOW_2', itemId: 'WEAPON_PART_B_BOW_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_LEATHER': 15, 'MAT_FORTUNOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_B_BOW_3', itemId: 'WEAPON_PART_B_BOW_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_CLOTH': 12, 'MAT_MORTOS': 1, 'MAT_UMBROS': 1, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_BOW_1', itemId: 'WEAPON_PART_C_BOW_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_MINERALS': 5, 'MAT_MORTOS': 2, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_BOW_2', itemId: 'WEAPON_PART_C_BOW_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_HERBS': 10, 'MAT_TOXOS': 1, 'MAT_AQUOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_BOW_3', itemId: 'WEAPON_PART_C_BOW_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 7, 'MAT_CURIOS': 3, 'MAT_UMBROS': 2, 'MAT_LUMOS': 1 } },
  // === CROSSBOW ===
  { id: 'RECIPE_WEAPON_PART_A_CROSSBOW_1_UPGRADED', itemId: 'WEAPON_PART_A_CROSSBOW_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 4, 'MAT_LEATHER': 5, 'MAT_FORTUNOS': 2, 'MAT_ANEMOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_CROSSBOW_2_UPGRADED', itemId: 'WEAPON_PART_A_CROSSBOW_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_CLOTH': 5, 'MAT_LEATHER': 10, 'MAT_ANEMOS': 1, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_CROSSBOW_3_UPGRADED', itemId: 'WEAPON_PART_A_CROSSBOW_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_HERBS': 8, 'MAT_CURIOS': 3, 'MAT_FORTUNOS': 1, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_B_CROSSBOW_1', itemId: 'WEAPON_PART_B_CROSSBOW_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_LEATHER': 5, 'MAT_VIGOS': 2, 'MAT_TERROS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_CROSSBOW_2', itemId: 'WEAPON_PART_B_CROSSBOW_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 4, 'MAT_LEATHER': 6, 'MAT_HERBS': 5, 'MAT_ANEMOS': 1, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_CROSSBOW_3', itemId: 'WEAPON_PART_B_CROSSBOW_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 2, 'MAT_HERBS': 3, 'MAT_UMBROS': 2, 'MAT_LUMOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_CROSSBOW_1', itemId: 'WEAPON_PART_C_CROSSBOW_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 2, 'MAT_CURIOS': 3, 'MAT_TOXOS': 4 } },
  { id: 'RECIPE_WEAPON_PART_C_CROSSBOW_2', itemId: 'WEAPON_PART_C_CROSSBOW_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 2, 'MAT_CURIOS': 3, 'MAT_IGNOS': 4 } },
  { id: 'RECIPE_WEAPON_PART_C_CROSSBOW_3', itemId: 'WEAPON_PART_C_CROSSBOW_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 2, 'MAT_CURIOS': 3, 'MAT_ANEMOS': 4 } },
  // === DUAL_BLADES ===
  { id: 'RECIPE_WEAPON_PART_A_DUAL_BLADES_1_UPGRADED', itemId: 'WEAPON_PART_A_DUAL_BLADES_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 7, 'MAT_LUMOS': 2, 'MAT_FORTUNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_DUAL_BLADES_2_UPGRADED', itemId: 'WEAPON_PART_A_DUAL_BLADES_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 7, 'MAT_BONE': 7, 'MAT_ANEMOS': 1, 'MAT_AQUOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_A_DUAL_BLADES_3_UPGRADED', itemId: 'WEAPON_PART_A_DUAL_BLADES_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 12, 'MAT_CURIOS': 5, 'MAT_MORTOS': 1, 'MAT_UMBROS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_DUAL_BLADES_1', itemId: 'WEAPON_PART_B_DUAL_BLADES_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_MINERALS': 10, 'MAT_LUMOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_B_DUAL_BLADES_2', itemId: 'WEAPON_PART_B_DUAL_BLADES_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_TOXOS': 2, 'MAT_AQUOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_B_DUAL_BLADES_3', itemId: 'WEAPON_PART_B_DUAL_BLADES_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 5, 'MAT_CURIOS': 10, 'MAT_UMBROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_DUAL_BLADES_1', itemId: 'WEAPON_PART_C_DUAL_BLADES_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 5, 'MAT_MINERALS': 4, 'MAT_MORTOS': 1, 'MAT_AQUOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_DUAL_BLADES_2', itemId: 'WEAPON_PART_C_DUAL_BLADES_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 3, 'MAT_HERBS': 3, 'MAT_CURIOS': 2, 'MAT_MORTOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_C_DUAL_BLADES_3', itemId: 'WEAPON_PART_C_DUAL_BLADES_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 3, 'MAT_CLOTH': 3, 'MAT_LUMOS': 3 } },
  // === GAUNTLET ===
  { id: 'RECIPE_WEAPON_PART_A_GAUNTLET_1_UPGRADED', itemId: 'WEAPON_PART_A_GAUNTLET_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 7, 'MAT_MINERALS': 7, 'MAT_UMBROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_A_GAUNTLET_2_UPGRADED', itemId: 'WEAPON_PART_A_GAUNTLET_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_LEATHER': 10, 'MAT_AQUOS': 1, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_GAUNTLET_3_UPGRADED', itemId: 'WEAPON_PART_A_GAUNTLET_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_LEATHER': 10, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_B_GAUNTLET_1', itemId: 'WEAPON_PART_B_GAUNTLET_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_CLOTH': 8, 'MAT_UMBROS': 3 } },
  { id: 'RECIPE_WEAPON_PART_B_GAUNTLET_2', itemId: 'WEAPON_PART_B_GAUNTLET_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 3, 'MAT_CLOTH': 6, 'MAT_TOXOS': 2, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_GAUNTLET_3', itemId: 'WEAPON_PART_B_GAUNTLET_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 6, 'MAT_MINERALS': 5, 'MAT_VIGOS': 2, 'MAT_TOXOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_GAUNTLET_1', itemId: 'WEAPON_PART_C_GAUNTLET_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_CLOTH': 5, 'MAT_LEATHER': 5, 'MAT_CURIOS': 5, 'MAT_UMBROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_GAUNTLET_2', itemId: 'WEAPON_PART_C_GAUNTLET_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 10, 'MAT_CLOTH': 4, 'MAT_LUMOS': 1, 'MAT_TERROS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_GAUNTLET_3', itemId: 'WEAPON_PART_C_GAUNTLET_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 1, 'MAT_LEATHER': 6, 'MAT_MORTOS': 1, 'MAT_TOXOS': 2 } },
  // === HAMMER ===
  { id: 'RECIPE_WEAPON_PART_A_HAMMER_1_UPGRADED', itemId: 'WEAPON_PART_A_HAMMER_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_MINERALS': 10, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_A_HAMMER_2_UPGRADED', itemId: 'WEAPON_PART_A_HAMMER_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 8, 'MAT_MINERALS': 8, 'MAT_AQUOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_A_HAMMER_3_UPGRADED', itemId: 'WEAPON_PART_A_HAMMER_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 10, 'MAT_CURIOS': 5, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_B_HAMMER_1', itemId: 'WEAPON_PART_B_HAMMER_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 4, 'MAT_MINERALS': 5, 'MAT_VIGOS': 2, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_HAMMER_2', itemId: 'WEAPON_PART_B_HAMMER_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 6, 'MAT_LEATHER': 3, 'MAT_FORTUNOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_B_HAMMER_3', itemId: 'WEAPON_PART_B_HAMMER_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 10, 'MAT_CURIOS': 15 } },
  { id: 'RECIPE_WEAPON_PART_C_HAMMER_1', itemId: 'WEAPON_PART_C_HAMMER_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_LEATHER': 9, 'MAT_VIGOS': 2, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_HAMMER_2', itemId: 'WEAPON_PART_C_HAMMER_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 4, 'MAT_LEATHER': 4, 'MAT_LUMOS': 2, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_HAMMER_3', itemId: 'WEAPON_PART_C_HAMMER_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 3, 'MAT_LEATHER': 2, 'MAT_MORTOS': 3, 'MAT_IGNOS': 1 } },
  // === ICE_STORM ===
  { id: 'RECIPE_WEAPON_PART_A_ICE_STORM_UPGRADED', itemId: 'WEAPON_PART_A_ICE_STORM_UPGRADED', goldCost: 150, ingredients: { 'MAT_UMBROS': 1, 'MAT_ANEMOS': 2, 'MAT_AQUOS': 2 } },
  // === KNIVES ===
  { id: 'RECIPE_WEAPON_PART_A_KNIVES_1_UPGRADED', itemId: 'WEAPON_PART_A_KNIVES_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 4, 'MAT_HERBS': 3, 'MAT_MORTOS': 1, 'MAT_TOXOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_A_KNIVES_2_UPGRADED', itemId: 'WEAPON_PART_A_KNIVES_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 7, 'MAT_MINERALS': 3, 'MAT_TOXOS': 2, 'MAT_ANEMOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_KNIVES_3_UPGRADED', itemId: 'WEAPON_PART_A_KNIVES_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_MINERALS': 5, 'MAT_ANEMOS': 2, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_KNIVES_1', itemId: 'WEAPON_PART_B_KNIVES_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 2, 'MAT_LEATHER': 10, 'MAT_ANEMOS': 2, 'MAT_TERROS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_KNIVES_2', itemId: 'WEAPON_PART_B_KNIVES_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_LEATHER': 10, 'MAT_TERROS': 1, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_KNIVES_3', itemId: 'WEAPON_PART_B_KNIVES_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 3, 'MAT_CLOTH': 8, 'MAT_LUMOS': 1, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_KNIVES_1', itemId: 'WEAPON_PART_C_KNIVES_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 5, 'MAT_CLOTH': 10, 'MAT_UMBROS': 1, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_KNIVES_2', itemId: 'WEAPON_PART_C_KNIVES_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 2, 'MAT_LEATHER': 5, 'MAT_TOXOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_C_KNIVES_3', itemId: 'WEAPON_PART_C_KNIVES_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_CLOTH': 5, 'MAT_CURIOS': 4, 'MAT_FORTUNOS': 3 } },
  // === LIGHTNING_STRIKE ===
  { id: 'RECIPE_WEAPON_PART_A_LIGHTNING_STRIKE_UPGRADED', itemId: 'WEAPON_PART_A_LIGHTNING_STRIKE_UPGRADED', goldCost: 150, ingredients: { 'MAT_LUMOS': 1, 'MAT_ANEMOS': 2, 'MAT_IGNOS': 2 } },
  // === RUNE_OF_BLADES ===
  { id: 'RECIPE_WEAPON_PART_A_RUNE_OF_BLADES_UPGRADED', itemId: 'WEAPON_PART_A_RUNE_OF_BLADES_UPGRADED', goldCost: 150, ingredients: { 'MAT_MORTOS': 2, 'MAT_TERROS': 3 } },
  // === SPEAR ===
  { id: 'RECIPE_WEAPON_PART_A_SPEAR_1_UPGRADED', itemId: 'WEAPON_PART_A_SPEAR_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 8, 'MAT_UMBROS': 1, 'MAT_LUMOS': 1, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_SPEAR_2_UPGRADED', itemId: 'WEAPON_PART_A_SPEAR_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_BONE': 10, 'MAT_UMBROS': 1, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_SPEAR_3_UPGRADED', itemId: 'WEAPON_PART_A_SPEAR_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_MINERALS': 10, 'MAT_CURIOS': 5, 'MAT_LUMOS': 1, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_SPEAR_1', itemId: 'WEAPON_PART_B_SPEAR_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_CLOTH': 5, 'MAT_AQUOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_B_SPEAR_2', itemId: 'WEAPON_PART_B_SPEAR_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 5, 'MAT_CURIOS': 10, 'MAT_VIGOS': 1, 'MAT_TOXOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_SPEAR_3', itemId: 'WEAPON_PART_B_SPEAR_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 2, 'MAT_LEATHER': 8, 'MAT_VIGOS': 1, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_SPEAR_1', itemId: 'WEAPON_PART_C_SPEAR_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 3, 'MAT_MINERALS': 12, 'MAT_LUMOS': 1, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_SPEAR_2', itemId: 'WEAPON_PART_C_SPEAR_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 2, 'MAT_BONE': 5, 'MAT_UMBROS': 3 } },
  { id: 'RECIPE_WEAPON_PART_C_SPEAR_3', itemId: 'WEAPON_PART_C_SPEAR_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 3, 'MAT_BONE': 5, 'MAT_UMBROS': 1, 'MAT_TOXOS': 2 } },
  // === STAFF ===
  { id: 'RECIPE_WEAPON_PART_A_STAFF_1_UPGRADED', itemId: 'WEAPON_PART_A_STAFF_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_HERBS': 5, 'MAT_VIGOS': 1, 'MAT_AQUOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_A_STAFF_3_UPGRADED', itemId: 'WEAPON_PART_A_STAFF_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_HERBS': 8, 'MAT_VIGOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_B_STAFF_2', itemId: 'WEAPON_PART_B_STAFF_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_CLOTH': 5, 'MAT_CURIOS': 3, 'MAT_TOXOS': 2, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_STAFF_1', itemId: 'WEAPON_PART_C_STAFF_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_MINERALS': 4, 'MAT_FORTUNOS': 4 } },
  { id: 'RECIPE_WEAPON_PART_C_STAFF_2', itemId: 'WEAPON_PART_C_STAFF_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_MINERALS': 10, 'MAT_AQUOS': 2, 'MAT_IGNOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_STAFF_3', itemId: 'WEAPON_PART_C_STAFF_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_CURIOS': 5, 'MAT_VIGOS': 2, 'MAT_MORTOS': 2 } },
  // === SWORD ===
  { id: 'RECIPE_WEAPON_PART_A_SWORD_1_UPGRADED', itemId: 'WEAPON_PART_A_SWORD_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 8, 'MAT_LUMOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_A_SWORD_2_UPGRADED', itemId: 'WEAPON_PART_A_SWORD_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_CURIOS': 7, 'MAT_ANEMOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_A_SWORD_3_UPGRADED', itemId: 'WEAPON_PART_A_SWORD_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_MINERALS': 11, 'MAT_TERROS': 3 } },
  { id: 'RECIPE_WEAPON_PART_B_SWORD_1', itemId: 'WEAPON_PART_B_SWORD_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_LEATHER': 5, 'MAT_MINERALS': 5, 'MAT_ANEMOS': 1, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_SWORD_2', itemId: 'WEAPON_PART_B_SWORD_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_CURIOS': 10, 'MAT_ANEMOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_B_SWORD_3', itemId: 'WEAPON_PART_B_SWORD_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_BONE': 10, 'MAT_ANEMOS': 1, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_SWORD_1', itemId: 'WEAPON_PART_C_SWORD_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_LEATHER': 5, 'MAT_LUMOS': 2, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_SWORD_2', itemId: 'WEAPON_PART_C_SWORD_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 4, 'MAT_MINERALS': 5, 'MAT_VIGOS': 2, 'MAT_LUMOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_SWORD_3', itemId: 'WEAPON_PART_C_SWORD_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 3, 'MAT_CURIOS': 5, 'MAT_VIGOS': 3 } },
  // === WAND ===
  { id: 'RECIPE_WEAPON_PART_A_WAND_1_UPGRADED', itemId: 'WEAPON_PART_A_WAND_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 4, 'MAT_CLOTH': 2, 'MAT_ANEMOS': 4 } },
  { id: 'RECIPE_WEAPON_PART_A_WAND_2_UPGRADED', itemId: 'WEAPON_PART_A_WAND_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_MINERALS': 3, 'MAT_HERBS': 5, 'MAT_TERROS': 4 } },
  { id: 'RECIPE_WEAPON_PART_A_WAND_3_UPGRADED', itemId: 'WEAPON_PART_A_WAND_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_MINERALS': 5, 'MAT_CURIOS': 1, 'MAT_IGNOS': 4 } },
  { id: 'RECIPE_WEAPON_PART_B_WAND_1', itemId: 'WEAPON_PART_B_WAND_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_CLOTH': 8, 'MAT_LUMOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_B_WAND_2', itemId: 'WEAPON_PART_B_WAND_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_HERBS': 12, 'MAT_TOXOS': 1, 'MAT_AQUOS': 1, 'MAT_TERROS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_WAND_3', itemId: 'WEAPON_PART_B_WAND_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_CLOTH': 10, 'MAT_CURIOS': 5, 'MAT_VIGOS': 1, 'MAT_ANEMOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_WAND_1', itemId: 'WEAPON_PART_C_WAND_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_CURIOS': 5, 'MAT_FORTUNOS': 3, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_WAND_2', itemId: 'WEAPON_PART_C_WAND_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 1, 'MAT_MORTOS': 2, 'MAT_TOXOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_WAND_3', itemId: 'WEAPON_PART_C_WAND_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_CURIOS': 5, 'MAT_MORTOS': 2, 'MAT_LUMOS': 2 } },
  // === WARBELL ===
  { id: 'RECIPE_WEAPON_PART_A_WARBELL_1_UPGRADED', itemId: 'WEAPON_PART_A_WARBELL_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_CURIOS': 5, 'MAT_UMBROS': 2, 'MAT_ANEMOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_WARBELL_2_UPGRADED', itemId: 'WEAPON_PART_A_WARBELL_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_MINERALS': 5, 'MAT_VIGOS': 1, 'MAT_ANEMOS': 1, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_A_WARBELL_3_UPGRADED', itemId: 'WEAPON_PART_A_WARBELL_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_CURIOS': 5, 'MAT_VIGOS': 2, 'MAT_ANEMOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_WARBELL_1', itemId: 'WEAPON_PART_B_WARBELL_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 10, 'MAT_CLOTH': 5, 'MAT_TOXOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_B_WARBELL_2', itemId: 'WEAPON_PART_B_WARBELL_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_CLOTH': 4, 'MAT_CURIOS': 7, 'MAT_FORTUNOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_B_WARBELL_3', itemId: 'WEAPON_PART_B_WARBELL_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 3, 'MAT_BONE': 5, 'MAT_LEATHER': 10, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_WARBELL_1', itemId: 'WEAPON_PART_C_WARBELL_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_MINERALS': 5, 'MAT_UMBROS': 2, 'MAT_TERROS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_WARBELL_2', itemId: 'WEAPON_PART_C_WARBELL_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 4, 'MAT_CURIOS': 5, 'MAT_FORTUNOS': 1, 'MAT_AQUOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_WARBELL_3', itemId: 'WEAPON_PART_C_WARBELL_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_MINERALS': 5, 'MAT_TOXOS': 2, 'MAT_ANEMOS': 1 } },
  // === WARHAMMER ===
  { id: 'RECIPE_WEAPON_PART_A_WARHAMMER_1_UPGRADED', itemId: 'WEAPON_PART_A_WARHAMMER_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_MINERALS': 10, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_WEAPON_PART_A_WARHAMMER_2_UPGRADED', itemId: 'WEAPON_PART_A_WARHAMMER_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 10, 'MAT_BONE': 5, 'MAT_IGNOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_A_WARHAMMER_3_UPGRADED', itemId: 'WEAPON_PART_A_WARHAMMER_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_CURIOS': 5, 'MAT_LUMOS': 3 } },
  { id: 'RECIPE_WEAPON_PART_B_WARHAMMER_1', itemId: 'WEAPON_PART_B_WARHAMMER_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_LEATHER': 10, 'MAT_LUMOS': 1, 'MAT_TERROS': 1 } },
  { id: 'RECIPE_WEAPON_PART_B_WARHAMMER_2', itemId: 'WEAPON_PART_B_WARHAMMER_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 15, 'MAT_CURIOS': 2, 'MAT_MORTOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_B_WARHAMMER_3', itemId: 'WEAPON_PART_B_WARHAMMER_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 3, 'MAT_LEATHER': 5, 'MAT_CURIOS': 10, 'MAT_IGNOS': 2 } },
  { id: 'RECIPE_WEAPON_PART_C_WARHAMMER_1', itemId: 'WEAPON_PART_C_WARHAMMER_1_UPGRADED', goldCost: 150, ingredients: { 'MAT_METAL': 6, 'MAT_LEATHER': 5, 'MAT_MORTOS': 2, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_WARHAMMER_2', itemId: 'WEAPON_PART_C_WARHAMMER_2_UPGRADED', goldCost: 150, ingredients: { 'MAT_BONE': 10, 'MAT_MORTOS': 2, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_WEAPON_PART_C_WARHAMMER_3', itemId: 'WEAPON_PART_C_WARHAMMER_3_UPGRADED', goldCost: 150, ingredients: { 'MAT_MINERALS': 5, 'MAT_CURIOS': 10, 'MAT_MORTOS': 1, 'MAT_TERROS': 1 } },
];

// ============================================================
// RECETAS DE CONSUMIBLES (crean versión PLUS)
// ============================================================
export const CONSUMABLE_RECIPES = [
  { id: 'RECIPE_CSM_ANTIDOTE_POTION', itemId: 'CSM_ANTIDOTE_POTION_PLUS', goldCost: 150, ingredients: { 'MAT_HERBS': 15, 'MAT_VIGOS': 1, 'MAT_TOXOS': 1 } },
  { id: 'RECIPE_CSM_CRIMSON_POTION', itemId: 'CSM_CRIMSON_POTION_PLUS', goldCost: 150, ingredients: { 'MAT_MINERALS': 5, 'MAT_HERBS': 10, 'MAT_MORTOS': 1, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_CSM_FIRE_GRENADE', itemId: 'CSM_FIRE_GRENADE_PLUS', goldCost: 150, ingredients: { 'MAT_MINERALS': 10, 'MAT_IGNOS': 3 } },
  { id: 'RECIPE_CSM_FOCUS_POTION', itemId: 'CSM_FOCUS_POTION_PLUS', goldCost: 150, ingredients: { 'MAT_HERBS': 8, 'MAT_CURIOS': 6, 'MAT_LUMOS': 2 } },
  { id: 'RECIPE_CSM_GUARDIAN_POTION', itemId: 'CSM_GUARDIAN_POTION_PLUS', goldCost: 150, ingredients: { 'MAT_METAL': 2, 'MAT_LEATHER': 2, 'MAT_HERBS': 10, 'MAT_VIGOS': 1, 'MAT_LUMOS': 1 } },
  { id: 'RECIPE_CSM_MAGE_DUST', itemId: 'CSM_MAGE_DUST_PLUS', goldCost: 150, ingredients: { 'MAT_MINERALS': 8, 'MAT_CURIOS': 8, 'MAT_UMBROS': 1, 'MAT_LUMOS': 1 } },
  { id: 'RECIPE_CSM_MIASMA_GRENADE', itemId: 'CSM_MIASMA_GRENADE_PLUS', goldCost: 150, ingredients: { 'MAT_MINERALS': 8, 'MAT_HERBS': 6, 'MAT_TOXOS': 2 } },
  { id: 'RECIPE_CSM_RABBITFOOT_POTION', itemId: 'CSM_RABBITFOOT_POTION_PLUS', goldCost: 150, ingredients: { 'MAT_HERBS': 12, 'MAT_CURIOS': 4, 'MAT_FORTUNOS': 1, 'MAT_ANEMOS': 1 } },
  { id: 'RECIPE_CSM_ROGUE_SWEAT', itemId: 'CSM_ROGUE_SWEAT_PLUS', goldCost: 150, ingredients: { 'MAT_HERBS': 10, 'MAT_CURIOS': 5, 'MAT_FORTUNOS': 1, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_CSM_SMOKE_BOMB', itemId: 'CSM_SMOKE_BOMB_PLUS', goldCost: 150, ingredients: { 'MAT_METAL': 1, 'MAT_MINERALS': 3, 'MAT_HERBS': 10, 'MAT_UMBROS': 1, 'MAT_ANEMOS': 1 } },
  { id: 'RECIPE_CSM_VIGOR_POTION', itemId: 'CSM_VIGOR_POTION_PLUS', goldCost: 150, ingredients: { 'MAT_MINERALS': 4, 'MAT_HERBS': 10, 'MAT_CURIOS': 2, 'MAT_VIGOS': 2 } },
  { id: 'RECIPE_CSM_WARRIOR_BREATH', itemId: 'CSM_WARRIOR_BREATH_PLUS', goldCost: 150, ingredients: { 'MAT_HERBS': 10, 'MAT_CURIOS': 6, 'MAT_ANEMOS': 1, 'MAT_TERROS': 1 } },
];

// ============================================================
// RECETAS DE ARMADURAS (crean versión PLUS)
// ============================================================
export const ARMOR_RECIPES = [
  { id: 'RECIPE_ARMOR_1', itemId: 'ARMOR_1_PLUS', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_LEATHER': 3, 'MAT_UMBROS': 2, 'MAT_FORTUNOS': 1 } },
  { id: 'RECIPE_ARMOR_10', itemId: 'ARMOR_10_PLUS', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_CLOTH': 4, 'MAT_VIGOS': 1, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_ARMOR_11', itemId: 'ARMOR_11_PLUS', goldCost: 150, ingredients: { 'MAT_BONE': 5, 'MAT_CLOTH': 5, 'MAT_LEATHER': 5, 'MAT_VIGOS': 2 } },
  { id: 'RECIPE_ARMOR_12', itemId: 'ARMOR_12_PLUS', goldCost: 150, ingredients: { 'MAT_CLOTH': 8, 'MAT_CURIOS': 5, 'MAT_FORTUNOS': 2 } },
  { id: 'RECIPE_ARMOR_13', itemId: 'ARMOR_13_PLUS', goldCost: 150, ingredients: { 'MAT_BONE': 5, 'MAT_CLOTH': 12, 'MAT_MORTOS': 2 } },
  { id: 'RECIPE_ARMOR_14', itemId: 'ARMOR_14_PLUS', goldCost: 150, ingredients: { 'MAT_CLOTH': 3, 'MAT_MINERALS': 7, 'MAT_FORTUNOS': 3 } },
  { id: 'RECIPE_ARMOR_15', itemId: 'ARMOR_15_PLUS', goldCost: 150, ingredients: { 'MAT_CLOTH': 6, 'MAT_HERBS': 6, 'MAT_UMBROS': 2, 'MAT_TERROS': 1 } },
  { id: 'RECIPE_ARMOR_16', itemId: 'ARMOR_16_PLUS', goldCost: 150, ingredients: { 'MAT_CLOTH': 12, 'MAT_LUMOS': 1, 'MAT_ANEMOS': 1, 'MAT_IGNOS': 1 } },
  { id: 'RECIPE_ARMOR_17', itemId: 'ARMOR_17_PLUS', goldCost: 150, ingredients: { 'MAT_CLOTH': 5, 'MAT_MINERALS': 5, 'MAT_TOXOS': 1, 'MAT_AQUOS': 2 } },
  { id: 'RECIPE_ARMOR_18', itemId: 'ARMOR_18_PLUS', goldCost: 150, ingredients: { 'MAT_CLOTH': 12, 'MAT_MINERALS': 7, 'MAT_MORTOS': 1, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_ARMOR_2', itemId: 'ARMOR_2_PLUS', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_CURIOS': 5, 'MAT_VIGOS': 2, 'MAT_MORTOS': 1 } },
  { id: 'RECIPE_ARMOR_3', itemId: 'ARMOR_3_PLUS', goldCost: 150, ingredients: { 'MAT_METAL': 3, 'MAT_LEATHER': 3, 'MAT_MINERALS': 3, 'MAT_LUMOS': 1, 'MAT_ANEMOS': 2 } },
  { id: 'RECIPE_ARMOR_4', itemId: 'ARMOR_4_PLUS', goldCost: 150, ingredients: { 'MAT_METAL': 2, 'MAT_BONE': 5, 'MAT_VIGOS': 2, 'MAT_MORTOS': 1 } },
  { id: 'RECIPE_ARMOR_5', itemId: 'ARMOR_5_PLUS', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_CLOTH': 3, 'MAT_MINERALS': 7, 'MAT_VIGOS': 1, 'MAT_LUMOS': 1 } },
  { id: 'RECIPE_ARMOR_6', itemId: 'ARMOR_6_PLUS', goldCost: 150, ingredients: { 'MAT_CLOTH': 3, 'MAT_LEATHER': 8, 'MAT_ANEMOS': 1, 'MAT_AQUOS': 1, 'MAT_TERROS': 1 } },
  { id: 'RECIPE_ARMOR_7', itemId: 'ARMOR_7_PLUS', goldCost: 150, ingredients: { 'MAT_METAL': 5, 'MAT_LEATHER': 4, 'MAT_FORTUNOS': 1, 'MAT_ANEMOS': 1, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_ARMOR_8', itemId: 'ARMOR_8_PLUS', goldCost: 150, ingredients: { 'MAT_BONE': 4, 'MAT_LEATHER': 5, 'MAT_MORTOS': 2, 'MAT_UMBROS': 1 } },
  { id: 'RECIPE_ARMOR_9', itemId: 'ARMOR_9_PLUS', goldCost: 150, ingredients: { 'MAT_BONE': 5, 'MAT_LEATHER': 4, 'MAT_TOXOS': 1, 'MAT_IGNOS': 2 } },
];

// ============================================================
// RECETAS DE AMULETOS (crean versión PLUS)
// ============================================================
export const TRINKET_RECIPES = [
  { id: 'RECIPE_TRINKET10_ID', itemId: 'TRINKET10_ID_PLUS', goldCost: 150, ingredients: { 'MAT_BONE': 13, 'MAT_VIGOS': 1, 'MAT_UMBROS': 1 } },
  { id: 'RECIPE_TRINKET11_ID', itemId: 'TRINKET11_ID_PLUS', goldCost: 150, ingredients: { 'MAT_ANEMOS': 2, 'MAT_AQUOS': 2, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_TRINKET12_ID', itemId: 'TRINKET12_ID_PLUS', goldCost: 150, ingredients: { 'MAT_MORTOS': 2, 'MAT_FORTUNOS': 1, 'MAT_IGNOS': 2 } },
  { id: 'RECIPE_TRINKET1_ID', itemId: 'TRINKET1_ID_PLUS', goldCost: 150, ingredients: { 'MAT_BONE': 5, 'MAT_LEATHER': 3, 'MAT_MINERALS': 2, 'MAT_TOXOS': 3 } },
  { id: 'RECIPE_TRINKET2_ID', itemId: 'TRINKET2_ID_PLUS', goldCost: 150, ingredients: { 'MAT_LEATHER': 4, 'MAT_HERBS': 15, 'MAT_VIGOS': 1, 'MAT_TERROS': 1 } },
  { id: 'RECIPE_TRINKET3_ID', itemId: 'TRINKET3_ID_PLUS', goldCost: 150, ingredients: { 'MAT_METAL': 1, 'MAT_BONE': 7, 'MAT_MORTOS': 1, 'MAT_FORTUNOS': 2 } },
  { id: 'RECIPE_TRINKET4_ID', itemId: 'TRINKET4_ID_PLUS', goldCost: 150, ingredients: { 'MAT_BONE': 8, 'MAT_LEATHER': 5, 'MAT_LUMOS': 2, 'MAT_ANEMOS': 1 } },
  { id: 'RECIPE_TRINKET5_ID', itemId: 'TRINKET5_ID_PLUS', goldCost: 150, ingredients: { 'MAT_VIGOS': 2, 'MAT_UMBROS': 1, 'MAT_TERROS': 2 } },
  { id: 'RECIPE_TRINKET6_ID', itemId: 'TRINKET6_ID_PLUS', goldCost: 150, ingredients: { 'MAT_HERBS': 4, 'MAT_FORTUNOS': 4 } },
  { id: 'RECIPE_TRINKET7_ID', itemId: 'TRINKET7_ID_PLUS', goldCost: 150, ingredients: { 'MAT_LUMOS': 1, 'MAT_FORTUNOS': 3, 'MAT_AQUOS': 1 } },
  { id: 'RECIPE_TRINKET8_ID', itemId: 'TRINKET8_ID_PLUS', goldCost: 150, ingredients: { 'MAT_CLOTH': 3, 'MAT_LEATHER': 5, 'MAT_MINERALS': 1, 'MAT_UMBROS': 3 } },
  { id: 'RECIPE_TRINKET9_ID', itemId: 'TRINKET9_ID_PLUS', goldCost: 150, ingredients: { 'MAT_MINERALS': 12, 'MAT_UMBROS': 1, 'MAT_ANEMOS': 1, 'MAT_IGNOS': 1 } },
];

export const ALL_RECIPES = [
  ...WEAPON_PART_RECIPES,
  ...CONSUMABLE_RECIPES,
  ...ARMOR_RECIPES,
  ...TRINKET_RECIPES,
];

export const RECIPES_BY_ID = Object.fromEntries(ALL_RECIPES.map(r => [r.id, r]));
