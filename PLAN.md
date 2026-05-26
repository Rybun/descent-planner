# PLAN.md — Implementación del Planificador de Tienda

## Fases Completadas

### Fase 1: Exploración ✅
- Exploradas las carpetas de assets del juego
- Identificados ficheros de localización dentro de bundles Unity
- Extraídas imágenes con UnityPy
- Documentado en FINDINGS.md

### Fase 2: Datos del Juego ✅
- `src/gamedata/materials.js` — 17 materiales
- `src/gamedata/heroes.js` — 6 héroes
- `src/gamedata/weapons.js` — 12 armas
- `src/gamedata/weaponParts.js` — 216 partes de arma
- `src/gamedata/items.js` — 27 armaduras + 20 amuletos + 24 consumibles
- `src/gamedata/recipes.js` — 120 recetas de partes + 16 CSM

### Fase 3: Assets Públicos ✅
- `/public/assets/heroes/` — imágenes de héroes
- `/public/assets/materials/` — imágenes de materiales
- `/public/assets/weapon_parts/` — 426 imágenes
- `/public/assets/armor/` — armaduras
- `/public/assets/consumables/` — consumibles
- `/public/assets/trinkets/` — amuletos

### Fase 4: Parser del Save ✅
- `src/parser/savParser.js` — parsea JSON del save
- Extrae: gold, materials, inventory, shop, recipes, heroes

### Fase 5: Vite + React ✅
- Proyecto inicializado con Vite + React
- Zustand instalado
- `src/store.js` con historial de acciones puro

### Fase 6: Componentes ✅
- `DropZone.jsx` — carga drag & drop
- `ShopPanel.jsx` — materiales + tienda + inventario
- `CraftPanel.jsx` — recetas disponibles
- `HeroPanel.jsx` — estado de héroes
- `ActionLog.jsx` — historial + undo + export
- `PriceEditor.jsx` — editar precios

### Fase 7: App Principal ✅
- `App.jsx` — layout con header, tabs, footer
- `App.css` — estilos del layout
- `src/index.css` — design tokens, reset global, botones

---

## Mejoras Pendientes (Futuras Sesiones)

### Precios del Juego
- Los precios de todos los ítems y materiales son `null`. El jugador debe introducirlos manualmente en Ajustes.
- Alternativa: crear un JSON comunitario con precios conocidos.

### Ingredientes de Recetas
- Las recetas tienen `ingredients: null`. Los jugadores pueden anotar los ingredientes desde el juego físico.
- Sería útil añadir un campo de edición de ingredientes en el CraftPanel.

### Mejoras de HeroPanel
- Cuando el save incluya `EquippedWeapons` con IDs completos de partes, el HeroPanel mostrará la parte equipada correctamente. Si el save solo incluye el tipo de arma sin ID de parte específico, el slot aparecerá vacío.

### Exportar a CSV
- Opción de exportar el plan de compra/venta como CSV para llevarlo al juego físico.

### Soporte Multiidioma
- Actualmente solo ES. Podría añadirse EN con una variable de idioma.

### Tests
- No hay tests automatizados. Podría añadirse Vitest para el parser.
