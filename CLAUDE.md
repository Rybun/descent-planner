# CLAUDE.md — Descent: Planificador de Tienda

## Descripción del Proyecto

App web estática para planificar compras, ventas y crafteo entre sesiones de **Descent: Legends of the Dark** (Fantasy Flight Games, 2021).

- Carga un fichero `.SAV` del juego (JSON UTF-8) y muestra el estado de la tienda
- Permite simular transacciones sin modificar el save real
- Historial de acciones con undo completo
- Precios editables guardados en localStorage

## Repositorios

- **Frontend (este repo)**: [Rybun/descent-planner](https://github.com/Rybun/descent-planner)
- **Share API**: [Rybun/descent-planner-share-api](https://github.com/Rybun/descent-planner-share-api)

## Stack

- **Vite** + **React** (JS, sin TypeScript)
- **Zustand** para estado global
- Sin librerías de UI — CSS puro con custom properties
- **Backend**: `descent-share-api` (Node/Express) para compartir saves — stack Dockge separado en `pi5:/opt/stacks/descent-share/`

## Estructura de archivos

```
descent-planner/
├── .env                         # Variables de entorno Vite (ver sección Variables de Entorno)
├── index.html
├── src/
│   ├── main.jsx                 # Punto de entrada React
│   ├── App.jsx                  # Layout: header, tabs, footer, share/feed modals
│   ├── App.css                  # Estilos del layout principal
│   ├── index.css                # Design tokens (CSS custom properties), reset, botones globales
│   ├── store.js                 # Estado global Zustand + historial de acciones
│   ├── parser/
│   │   └── savParser.js         # Parseo de ficheros .SAV
│   ├── hooks/
│   │   ├── useIsMobile.js       # Detección de móvil reactiva (matchMedia)
│   │   └── useShare.js          # Hook para crear/cargar shares, feed comunitario
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
│       ├── PriceEditor.jsx/css  # Editar precios (persiste en localStorage)
│       ├── ShareModal.jsx/css   # Modal para compartir save y gestionar checkpoints
│       └── FeedModal.jsx/css    # Feed comunitario de partidas compartidas
└── public/
    └── assets/
        ├── heroes/
        ├── materials/
        ├── weapon_parts/
        ├── armor/
        ├── consumables/
        └── trinkets/
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

## Variables de Entorno (`.env`)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_SHARE_API_URL` | `""` (vacío) | Base URL de la API de shares. Vacío = mismo origen (proxeado por nginx a `descent-share:3015`). |
| `VITE_SHARE_LINK_BASE` | `""` (vacío) | Base de los enlaces que se muestran al usuario. Vacío = `window.location.origin`. Cuando `d.rybun.rocks` esté en NPM, poner `https://d.rybun.rocks`. |

## Sistema de Shares (partidas compartidas)

### Arquitectura

```
descent.rybun.rocks          pi5 (lb_network)
┌─────────────────┐          ┌──────────────────────────────────────┐
│  nginx          │          │  descent-share (Node/Express :3015)  │
│  /api/share ────┼──────────┼─► POST   /api/share        crear     │
│  /api/feed  ────┼──────────┼─► POST   /api/share/:id   checkpoint │
│  /*         ────┼──►SPA    │  GET    /api/share/:id    metadata   │
└─────────────────┘          │  GET    /api/share/:id/:n snapshot   │
                             │  GET    /api/feed          feed       │
                             │  GET    /:id          redirect→app   │
                             │  GET    /:id/:n       redirect→app   │
                             └──────────────────────────────────────┘
```

- El frontend llama a `/api/share` y `/api/feed` con rutas relativas (mismo origen).
- nginx (`/home/rybun/docker/config/descent-planner/nginx.conf`) proxea esas rutas al contenedor `descent-share`.
- Los enlaces generados usan `VITE_SHARE_LINK_BASE` (o `window.location.origin`): `https://descent.rybun.rocks/AbCd1234`.
- La SPA detecta paths `/{8chars}` y `/{8chars}/{n}` al cargar y resuelve el share.
- `d.rybun.rocks` (cuando esté en NPM) redirigirá a `descent.rybun.rocks/{id}`.

### Almacenamiento de datos en el servidor

```
/home/rybun/docker/data/descent-share/
└── {id}/                        # carpeta por cada share (ID de 8 chars: A-Z a-z 0-9 _)
    ├── meta.json                # metadatos públicos del share
    └── {n}.json                 # snapshot n (0, 1, 2, ...)
```

**`meta.json`** contiene:
```json
{
  "id": "AbCd1234",
  "created_at": "2026-06-02T10:00:00.000Z",
  "label": "Sesión 5",
  "write_token_hash": "sha256(write_token)",   ← no se expone en la API pública
  "snapshot_count": 2,
  "snapshots": [
    { "n": 0, "label": null, "created_at": "..." },
    { "n": 1, "label": "Tras comprar espada", "created_at": "..." }
  ],
  "heroes": ["HERO_BRYNN", "HERO_SYRUS"],
  "act": 0,
  "partyName": "Los Valientes",
  "actionCount": 7
}
```

**`{n}.json`** contiene el snapshot completo:
```json
{
  "save": { ...gameState },
  "saveMeta": { "partyName": "...", "act": 0, ... },
  "actionHistory": [ ...acciones realizadas... ]
}
```

### Autenticación de escritura

Al crear un share, el servidor devuelve un `write_token` (UUID). El frontend lo guarda en `localStorage` bajo la clave `descent_shares`:
```json
{ "{slotGUID}": { "id": "AbCd1234", "write_token": "uuid", "snapshot_count": 1, ... } }
```
Para añadir checkpoints se envía el token en el header `X-Write-Token`. El servidor almacena solo el hash SHA-256 del token.

### Stack del backend (Dockge)

- **Ruta en servidor**: `/opt/stacks/descent-share/`
- **Puerto interno**: `127.0.0.1:3015` (solo accesible desde lb_network y localhost del servidor)
- **Datos**: `${DATA_DIR}/descent-share` = `/home/rybun/docker/data/descent-share/`
- **Variable de entorno clave**: `MAIN_APP_URL=https://descent.rybun.rocks`

Para redesplegar el backend tras cambios en `index.js`:
```bash
scp descent-share-api/src/index.js pi5:/opt/stacks/descent-share/src/index.js
ssh pi5 "cd /opt/stacks/descent-share && sudo docker compose up -d --build"
```

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
