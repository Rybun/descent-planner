# CLAUDE.md — Descent: Planificador de Tienda

## Descripción del Proyecto

App web estática para planificar compras, ventas y crafteo entre sesiones de **Descent: Legends of the Dark** (Fantasy Flight Games, 2021).

- Carga un fichero `.SAV` del juego (JSON UTF-8) y muestra el estado de la tienda
- Permite simular transacciones sin modificar el save real
- Historial de acciones con undo completo
- Precios editables guardados en localStorage

## Stack

- **Vite** + **React** (JS, sin TypeScript)
- **Zustand** para estado global
- Sin librerías de UI — CSS puro con custom properties
- Sin backend — totalmente estático

## Estructura de archivos

```
descent-planner/
├── index.html                   # Título: "Descent: Planificador de Tienda"
├── src/
│   ├── main.jsx                 # Punto de entrada React
│   ├── App.jsx                  # Layout: header, tabs, footer
│   ├── App.css                  # Estilos del layout principal
│   ├── index.css                # Design tokens (CSS custom properties), reset, botones globales
│   ├── store.js                 # Estado global Zustand + historial de acciones
│   ├── parser/
│   │   └── savParser.js         # Parseo de ficheros .SAV
│   ├── gamedata/
│   │   ├── materials.js         # 17 materiales de crafteo
│   │   ├── heroes.js            # 6 héroes con armas
│   │   ├── weapons.js           # 12 armas (2 por héroe)
│   │   ├── weaponParts.js       # 216 partes de arma
│   │   ├── items.js             # Armaduras, amuletos, consumibles
│   │   └── recipes.js           # 120+ recetas
│   └── components/
│       ├── DropZone.jsx/css     # Pantalla de carga de save
│       ├── ShopPanel.jsx/css    # Materiales + Tienda + Inventario
│       ├── CraftPanel.jsx/css   # Recetas disponibles + crafteo
│       ├── HeroPanel.jsx/css    # Estado de los 6 héroes
│       ├── ActionLog.jsx/css    # Historial + undo + exportar
│       └── PriceEditor.jsx/css  # Editar precios (persiste en localStorage)
└── public/
    └── assets/
        ├── heroes/              # Imágenes de héroes (brynn_crop.png, etc.)
        ├── materials/           # Imágenes de materiales
        ├── weapon_parts/        # 426 imágenes de partes
        ├── armor/               # Imágenes de armaduras
        ├── consumables/         # Imágenes de consumibles
        └── trinkets/            # Imágenes de amuletos
```

## Convenciones

### IDs de Juego
- Materiales: `MAT_TERROS`, `MAT_AQUOS`, ... (prefijo `MAT_`)
- Partes de arma: `WEAPON_PART_[A|B|C]_[TIPO]_[NIVEL]`
- Recetas: `RECIPE_WEAPON_PART_[A|B|C]_[TIPO]_[NIVEL]` y `RECIPE_CSM_[NOMBRE]`
- Héroes: `HERO_BRYNN`, `HERO_SYRUS`, `HERO_GALADEN`, `HERO_VAERIX`, `HERO_KEHLI`, `HERO_CHANCE`

### Estado Global (Zustand)
El store mantiene:
- `gameState` — estado mutable de la sesión actual
- `originalState` — snapshot del save cargado (para reset)
- `actionHistory` — array de acciones para undo
- `customPrices` — precios editados (también en localStorage bajo `descent_prices`)

Las acciones son puras: `applyAction(gs, action) → newGs` sin mutación.

### Precios
Todos los precios (`buyPrice`, `sellPrice`) son `null` por defecto en los datos del juego, ya que no están en los assets. El usuario los introduce en el panel **⚙️ Ajustes → Editor de Precios**. Se guardan en `localStorage` bajo la clave `descent_prices` como JSON `{"MAT_TERROS_buy": 5, ...}`.

### Imágenes faltantes
Todos los `<img>` tienen `onError={e => e.target.style.display = 'none'}` para manejar assets no encontrados sin errores visuales.

## CSS Custom Properties

Definidas en `src/index.css`:

| Variable | Uso |
|---|---|
| `--color-bg` | Fondo más oscuro |
| `--color-bg-main` | Fondo principal del layout |
| `--color-surface` | Cards, panels |
| `--color-surface-raised` | Elementos elevados dentro de cards |
| `--color-border` / `--color-border-hover` | Bordes |
| `--color-text` / `--color-text-muted` / `--color-text-disabled` | Texto |
| `--color-gold` / `--color-gold-light` / `--color-gold-rgb` | Acento principal |
| `--color-success` / `--color-success-rgb` | Estados OK/disponible |
| `--color-danger` / `--color-danger-light` / `--color-danger-rgb` | Errores/faltante |
| `--spacing-xs/sm/md/lg/xl/2xl` | Sistema de espaciado |
| `--radius-sm/md/lg` | Radios de borde |

## Datos del Juego — Limitaciones Conocidas

1. **Precios**: No extractables de los assets. Los jugadores deben introducirlos manualmente.
2. **Ingredientes de recetas**: No extractables. `ingredients: null` y `goldCost: null` en `recipes.js`.
3. **Imágenes de armas base**: Las armas (Espada, Arco, etc.) no tienen imágenes separadas en los bundles.
4. **Armas equipadas en el save**: Los heroes tienen `EquippedWeapons` con `PartA`/`PartB`/`PartC`, pero la correspondencia entre `weaponType` del save y el ID de arma del gamedata se infiere por tipo.

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

> ⚠️ En este sistema, Node.js requiere NVM. Usar:
> ```bash
> export NVM_DIR="$HOME/.var/app/com.visualstudio.code/config/nvm"
> source "$NVM_DIR/nvm.sh"
> ```
