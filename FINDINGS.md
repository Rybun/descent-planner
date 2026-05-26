# FINDINGS: Descent: Legends of the Dark — Asset Exploration

## Estructura del directorio del juego

```
/home/imartinez/descent_web_store/
├── Legends of the Dark/         # Directorio principal del juego (Steam)
│   ├── LoTD_Data/
│   │   ├── StreamingAssets/     # Bundles de Unity para datos en tiempo de ejecución
│   │   └── ...
├── valkyrie-3.26-major/         # Proyecto Valkyrie (sistema de campaña / extensión)
│   └── ...
└── descent-planner/             # Este proyecto
```

## Save Files (.SAV)

- **Formato:** JSON plano UTF-8 (NO comprimido, NO binario)
- **Tamaño:** 300-420 KB aproximadamente
- **Ubicación Steam típica (Linux):**
  `~/.steam/steam/userdata/<USER_ID>/2073030/remote/`
- **Clave de identificación:** campo `SlotGUID` en el raíz del JSON
- **Clave de estado:** `GameSceneData.GameState`

### Campos relevantes extraídos del save:
| Campo JSON | Descripción |
|---|---|
| `SlotGUID` | Identificador único del slot de guardado |
| `GameSceneData.GameState.Gold` | Oro del grupo |
| `GameSceneData.GameState.CraftingMaterials` | Array de `{Id, Amount}` |
| `GameSceneData.GameState.ItemInventory` | Array de `{Id, SoldOut}` |
| `GameSceneData.GameState.ShopData` | Array de `{Id, SoldOut, IsSold}` |
| `GameSceneData.GameState.AvailableRecipeIds` | Array de string IDs de recetas |
| `GameSceneData.GameState.DiscoveredRecipes` | Array de `{Id, Crafted}` |
| `GameSceneData.GameState.Heroes` | Array de héroe con armas equipadas |
| `GameSceneData.GameState.ActiveAct` | Acto actual (0-indexed) |
| `GameSceneData.GameState.RoundNumber` | Número de ronda |
| `GameSceneData.GameState.GameDifficulty` | Dificultad del juego |

### Heroes en el save:
Cada héroe contiene `EquippedWeapons`, un array de armas con slots `PartA`, `PartB`, `PartC`.

---

## Unity AssetBundles

Todos los datos del juego están en bundles binarios con cabecera `UnityFS`.

### Localización (CSV embebido en binario):
- **Bundle:** `810ec36...` (el más grande, ~30MB) — contiene localización principal
- **Formato dentro del bundle:** `KEY,Text,,Value` separado por comas
- **Encoding:** UTF-8 (importante: no Latin-1)

### Bundles por categoría encontrados:
| Bundle hash | Contenido principal |
|---|---|
| `810ec36...` | Localización ES, nombres de ítems, partes de arma, consumibles |
| `07371d...` y otros | Materiales de crafteo |

### Datos NO encontrados en assets:
- **Precios de compra/venta**: No están en ningún bundle accesible. Se infieren del juego físico.
- **Ingredientes de recetas**: No extractables directamente. El mapeo receta→ingredientes no está en los bundles.
- **Costes de oro de recetas**: Igual, no extractable.
- **Armas del mapa**: Las armas del juego (WEAPON_SWORD, etc.) no tienen imágenes asociadas en los bundles extraíbles.

---

## Assets Extraídos

### Héroes (`/public/assets/heroes/`)
- 6 héroes: brynn, syrus, galaden, vaerix, kehli, chance
- Cada uno: `[name].png`, `[name]_crop.png`, `[name]_color.png`, `[name]_diffusemap.png`
- Las versiones `_crop.png` son las recomendadas para UI (recortadas para mostrar cara)

### Materiales de crafteo (`/public/assets/materials/`)
- 17 materiales con imágenes
- Nombres: anemos, aquos, bone, crystal, darkwood, earth, ember, feather, fiber, fungus, hide, iron, leather, poison, silk, stone, water

### Partes de arma (`/public/assets/weapon_parts/`)
- 426 imágenes
- Formato de nombre de archivo: `[type] [slot][level] - [variant].png`
  - Ejemplo: `bow a1 - bloodwood.png` → `WEAPON_PART_A_BOW_1`
  - Tipos: bow, crossbow, dual blades, hammer, knives, spear, staff, warhammer, wand, warbell
  - Slots: a (hoja), b (empuñadura), c (accesorio)
  - Niveles: 0-5

### Armaduras (`/public/assets/armor/`)
- 88 imágenes, nombres como `armor_1.png` a `armor_27.png` y variantes

### Consumibles (`/public/assets/consumables/`)
- Imágenes de los 24 tipos de consumibles

### Amuletos (`/public/assets/trinkets/`)
- Imágenes de los 20 tipos de amuletos

---

## IDs y Convenciones de Naming

### Materiales:
`MAT_TERROS`, `MAT_AQUOS`, `MAT_IGNIS`, `MAT_ANEMOS`, `MAT_VITAE`, `MAT_DARK`, `MAT_BONE`, `MAT_CRYSTAL`, `MAT_DARKWOOD`, `MAT_EMBER`, `MAT_FEATHER`, `MAT_FIBER`, `MAT_FUNGUS`, `MAT_HIDE`, `MAT_IRON`, `MAT_LEATHER`, `MAT_POISON`, `MAT_SILK`

### Partes de arma:
`WEAPON_PART_[A|B|C]_[TIPO]_[NIVEL]`
- Tipos: BOW, CROSSBOW, DUAL_BLADES, HAMMER, KNIVES, SPEAR, STAFF, WAND, WARHAMMER, WARBELL

### Recetas:
`RECIPE_WEAPON_PART_[A|B|C]_[TIPO]_[NIVEL]`
`RECIPE_CSM_[NOMBRE]`

### Consumibles:
`CSM_[NOMBRE]` — 24 tipos

### Armaduras:
`ARMOR_[1-27]` — 27 tipos

### Amuletos:
Varios prefijos: `TRINKET1_ID`, `TRINKET2_ID`, etc.

---

## Problemas Encontrados

1. **Encoding**: Los strings en los bundles originales parecían Latin-1 pero son UTF-8. Usar `data.decode('utf-8', errors='replace')`.

2. **UnityPy API**: La API de `env.objects` no da directamente el nombre del asset. Usar `env.container.items()` en su lugar para obtener `(asset_path, obj)`.

3. **Localization key format**: Las claves de recetas (`RECIPE_*`) no existen en la localización. Los nombres de recetas se deducen del ítem destino.

4. **AvailableItemIds**: Este campo del save es un array de strings simples, no un array de objetos.

5. **Precios**: Ningún precio está disponible en los assets. Son datos del juego físico que el usuario debe introducir manualmente.
