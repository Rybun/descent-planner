# Descent: Planificador de Tienda

App web estática para planificar compras, ventas y crafteo entre sesiones de **Descent: Legends of the Dark** (Fantasy Flight Games, 2021).

Carga un fichero `.SAV` del juego, muestra el estado de tu grupo y te permite simular transacciones sin modificar el save real.

---

## Características

- **🗺️ Partida** — Misión activa, dificultad, tiempo jugado y estado del grupo.
- **⚔️ Armería** — Piezas de arma equipadas de cada héroe; vista de ensamblaje con las tres piezas superpuestas (A + B + C) con sus posiciones exactas extraídas del engine.
- **🏪 Tienda** — Compra y venta de materiales, partes de arma, armaduras, amuletos y consumibles. Diferencia de oro respecto al save original visible en todo momento.
- **🔨 Sala de creación** — Recetas disponibles con ingredientes y coste en oro. Permite registrar crafteos para llevar el inventario actualizado.
- **📋 Historial** — Registro completo de acciones con undo ilimitado. Exportable a texto.
- **⚙️ Editor de precios** — Los precios del juego no están en los assets; se introducen manualmente y se persisten en `localStorage`.

---

## Stack

| | |
|---|---|
| Framework | React 19 + Vite 8 |
| Estado | Zustand 5 |
| Estilos | CSS puro (custom properties), sin librerías UI |
| Build | Totalmente estático, sin backend |

---

## Estructura del proyecto

```
descent-planner/
├── index.html
├── extract.py                   # Extractor de assets del juego (ver más abajo)
├── src/
│   ├── main.jsx
│   ├── App.jsx                  # Layout: header, tabs, footer
│   ├── store.js                 # Estado global Zustand + historial de acciones
│   ├── parser/
│   │   └── savParser.js         # Parser de ficheros .SAV
│   ├── gamedata/
│   │   ├── materials.js         # 17 materiales
│   │   ├── heroes.js            # 6 héroes
│   │   ├── weapons.js           # 12 armas base
│   │   ├── weaponParts.js       # 396 partes de arma (12 tipos × 3 slots × 11 niveles)
│   │   ├── weaponAssembly.js    # Posiciones de ensamblaje por tipo de arma
│   │   ├── items.js             # 71 items (armaduras, amuletos, consumibles)
│   │   ├── recipes.js           # 150 recetas (108 weapon parts + 42 otros)
│   │   └── descriptions.js      # Descripciones de items
│   └── components/
│       ├── DropZone.jsx/css     # Pantalla de carga de save
│       ├── GameInfoPanel.jsx/css# Pestaña Partida
│       ├── ArmeriaPanel.jsx/css # Pestaña Armería
│       ├── ShopPanel.jsx/css    # Pestaña Tienda
│       ├── CraftPanel.jsx/css   # Pestaña Sala de creación
│       ├── ActionLog.jsx/css    # Pestaña Historial
│       ├── PriceEditor.jsx/css  # Editor de precios
│       └── Tooltip.jsx/css      # Tooltip genérico
└── public/
    └── assets/
        ├── heroes/              # 43 imágenes de héroes
        ├── materials/           # 17 imágenes de materiales
        ├── weapon_parts/        # 426 imágenes de partes de arma
        ├── armor/               # Imágenes de armaduras
        ├── consumables/         # Imágenes de consumibles
        ├── trinkets/            # Imágenes de amuletos
        ├── weapons/             # Imágenes de armas base
        └── icons/               # Iconos UI
```

---

## Comandos

> **Requisito:** Node.js vía NVM.
> ```bash
> export NVM_DIR="$HOME/.var/app/com.visualstudio.code/config/nvm"
> source "$NVM_DIR/nvm.sh"
> ```

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo con HMR
npm run dev

# Build de producción (salida en dist/)
npm run build

# Preview del build de producción
npm run preview

# Linting
npm run lint
```

---

## Extractor de assets (`extract.py`)

Genera los archivos `src/gamedata/*.js` y las imágenes en `public/assets/` a partir de los AssetBundles del juego (Unity).

```bash
# Requisitos Python
pip install UnityPy Pillow

# Uso básico (detecta la instalación del juego automáticamente)
python extract.py

# Ruta personalizada al juego
python extract.py --game-path "/ruta/al/juego"

# Solo regenerar JS, sin reextraer imágenes
python extract.py --no-images

# Localización inglesa (por defecto: español)
python extract.py --lang en
```

### Datos generados

| Archivo | Contenido |
|---|---|
| `weaponParts.js` | 396 partes (12 tipos × 3 slots × niveles 0–5 + UPGRADED) |
| `recipes.js` | 150 recetas: 108 weapon parts + 18 armaduras + 12 trinkets + 12 consumibles |
| `items.js` | 71 items con imagen y descripción |
| `materials.js` | 17 materiales |

### Limitaciones conocidas

- **Precios** — No están en los assets del juego. El usuario los introduce en el Editor de precios.
- **Ingredientes de recetas de armadura/amuleto/consumible** — Los PPtrs no se resuelven cross-bundle; el extractor usa como fallback el archivo JS existente para preservar estos datos.
- **Niveles 4–5 de algunos tipos de arma** — Disponibles solo para los tipos cuyo `BaseItemId` en Unity no incluye el sufijo `_UPGRADED` (CROSSBOW, DUAL_BLADES, HAMMER, STAFF, SWORD, WARHAMMER).

---

## IDs de juego

| Tipo | Formato | Ejemplo |
|---|---|---|
| Material | `MAT_<NOMBRE>` | `MAT_TERROS` |
| Parte de arma | `WEAPON_PART_<SLOT>_<TIPO>_<NIVEL>` | `WEAPON_PART_A_BOW_1` |
| Receta de parte | `RECIPE_WEAPON_PART_<SLOT>_<TIPO>_<NIVEL>` | `RECIPE_WEAPON_PART_A_BOW_1` |
| Héroe | `HERO_<NOMBRE>` | `HERO_BRYNN` |

---

## Estado global (Zustand)

| Campo | Descripción |
|---|---|
| `gameState` | Estado mutable de la sesión actual |
| `originalState` | Snapshot del save cargado (para reset) |
| `actionHistory` | Array de acciones para undo |
| `customPrices` | Precios editados (también en `localStorage` bajo `descent_prices`) |
| `activeTab` | Pestaña activa |

Las acciones son puras: `applyAction(gs, action) → newGs` sin mutación directa.

---

## Imágenes faltantes

Todos los `<img>` tienen `onError={e => e.target.style.display = 'none'}` para ocultar imágenes no encontradas sin errores visuales.
