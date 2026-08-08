#!/usr/bin/env python3
"""
Descent: Legends of the Dark — Extractor de recursos
Extrae imágenes del juego y genera los archivos de datos JS para descent-planner.

Uso:
    python extract.py
    python extract.py --game-path "/ruta/al/juego"
    python extract.py --lang en          # localización inglesa (por defecto: es)
    python extract.py --no-images        # sólo regenerar JS, sin reextraer imágenes

Requisitos:
    pip install UnityPy Pillow
"""

import os, sys, re, json, argparse, shutil
from pathlib import Path
from collections import defaultdict

# ──────────────────────────────────────────────────────────────────────────────
# Instalación automática de dependencias
# ──────────────────────────────────────────────────────────────────────────────

def ensure_deps():
    missing = []
    try:
        import UnityPy  # noqa
    except ImportError:
        missing.append("UnityPy")
    try:
        from PIL import Image  # noqa
    except ImportError:
        missing.append("Pillow")
    if missing:
        print(f"Instalando dependencias: {', '.join(missing)}")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing)

ensure_deps()
import UnityPy

# ──────────────────────────────────────────────────────────────────────────────
# Constantes
# ──────────────────────────────────────────────────────────────────────────────

BUNDLE_SUBPATH = os.path.join("Legends of the Dark_Data", "StreamingAssets", "bundles")

# Rutas Steam por defecto por plataforma
DEFAULT_STEAM_PATHS = {
    "linux":   [
        os.path.expanduser("~/.steam/steam/steamapps/common/Descent Legends of the Dark"),
        os.path.expanduser("~/.local/share/Steam/steamapps/common/Descent Legends of the Dark"),
    ],
    "darwin":  [
        os.path.expanduser("~/Library/Application Support/Steam/steamapps/common/Descent Legends of the Dark"),
    ],
    "win32":   [
        r"C:\Program Files (x86)\Steam\steamapps\common\Descent Legends of the Dark",
        r"C:\Program Files\Steam\steamapps\common\Descent Legends of the Dark",
    ],
}

# Tipos de arma → ID de arma en el juego
WEAPON_TYPE_TO_ID = {
    "BOW":         "WEAPON_BOW",
    "CROSSBOW":    "WEAPON_CROSSBOW",
    "DUAL_BLADES": "WEAPON_DUAL_BLADES",
    "GAUNTLET":    "WEAPON_GAUNTLET",
    "HAMMER":      "WEAPON_HAMMER",
    "KNIVES":      "WEAPON_THROWING_KNIVES",
    "SPEAR":       "WEAPON_SPEAR",
    "STAFF":       "WEAPON_STAFF",
    "SWORD":       "WEAPON_SWORD",
    "WAND":        "WEAPON_WAND_OF_WINDS",
    "WARBELL":     "WEAPON_WARBELL",
    "WARHAMMER":   "WEAPON_WAR_HAMMER",
}

# Clave que identifica el bundle de localización ES vs EN
LANG_MARKERS = {
    "es": b"Arco de madera sangrienta",
    "pt": b"Arco de Madeira Sangu",
    "en": b"Bloodwood Bow",
    "fr": b"Arc en bois sanglant",
    "it": b"Arco di Legnosangue",
}

# Idiomas soportados (en el mismo orden que el selector del planner)
LANGS = ["es", "en", "fr", "it", "pt"]

# ──────────────────────────────────────────────────────────────────────────────
# Detección de ruta del juego
# ──────────────────────────────────────────────────────────────────────────────

def find_game_path():
    platform = sys.platform
    candidates = DEFAULT_STEAM_PATHS.get(platform, [])
    # También buscar en el directorio padre del script
    script_dir = Path(__file__).parent.parent
    candidates.insert(0, str(script_dir / "Legends of the Dark"))

    for c in candidates:
        if os.path.isdir(os.path.join(c, "Legends of the Dark_Data")):
            return c

    print("\nNo se encontró el juego automáticamente.")
    print("Introduce la ruta de instalación de Descent: Legends of the Dark:")
    print("  (la carpeta que contiene 'Legends of the Dark_Data')")
    path = input("  Ruta: ").strip().strip('"')
    if not os.path.isdir(os.path.join(path, "Legends of the Dark_Data")):
        print(f"ERROR: No se encontró 'Legends of the Dark_Data' en: {path}")
        sys.exit(1)
    return path

# ──────────────────────────────────────────────────────────────────────────────
# Localización (CSV embebido en binario dentro del bundle)
# ──────────────────────────────────────────────────────────────────────────────

def find_localization_bundle(bundle_dir, lang="es"):
    """Encuentra el bundle de localización para el idioma indicado."""
    marker = LANG_MARKERS.get(lang, LANG_MARKERS["es"])
    pattern = b"WEAPON_PART_A_BOW_1,Text,,"

    for fname in sorted(os.listdir(bundle_dir)):
        fpath = os.path.join(bundle_dir, fname)
        if fname == "manifest.dat":
            continue
        try:
            with open(fpath, "rb") as f:
                data = f.read(3_000_000)  # primeros 3MB son suficientes
            if pattern in data and marker in data:
                return fpath
        except Exception:
            pass
    return None


def parse_localization(bundle_path):
    """
    Extrae pares KEY→valor del CSV embebido en el bundle.
    Formato: KEY,Text,,Valor\n  o  KEY,Text,,"Valor multi\nlínea"
    Devuelve dict {key: value} con las comillas CSV externas ya eliminadas.
    """
    with open(bundle_path, "rb") as f:
        raw = f.read()

    loc = {}
    text = raw.decode("utf-8", errors="replace")
    # Captura valores quoted multi-línea ("…") y unquoted single-line
    # NOTA: la clase de caracteres de la clave incluye "+" porque las claves de
    # habilidades nombradas mejoradas usan el sufijo literal "+" (p.ej.
    # WEAPON_ABILITY_FROM_THE_DARKNESS+_DESC); sin él, esas filas del CSV se
    # descartaban en silencio y el texto mejorado nunca se resolvía.
    pattern = r'^([A-Z0-9_+]+),Text,,("(?:[^"]|\n)*?"|[^\n\r]*)'
    for m in re.finditer(pattern, text, re.MULTILINE):
        key = m.group(1)
        val = m.group(2).strip()
        # Eliminar comillas CSV externas si las hay
        if val.startswith('"') and val.endswith('"') and len(val) >= 2:
            val = val[1:-1].strip()
        # Eliminar carácter de "+" especial () que indica versión mejorada
        val = val.replace('', '+').replace('', '').strip()
        if key:
            loc[key] = val
    return loc

# ──────────────────────────────────────────────────────────────────────────────
# Carga de bundles con UnityPy
# ──────────────────────────────────────────────────────────────────────────────

def load_env(bundle_dir):
    """Carga todos los bundles juntos para resolver PPtrs cross-bundle."""
    print(f"Cargando bundles desde: {bundle_dir}")
    print("  (esto puede tardar 1-2 minutos la primera vez)")
    env = UnityPy.load(bundle_dir)
    print(f"  ✓ {len(list(env.objects))} objetos cargados")
    return env

# ──────────────────────────────────────────────────────────────────────────────
# Escaneo de MonoBehaviours → datos de ítems
# ──────────────────────────────────────────────────────────────────────────────

def scan_items(env):
    """
    Escanea todos los MonoBehaviours y devuelve:
      item_defs      – dict {base_item_id: {...}}  definición del ítem "+"/mejorado
                       (stats reales: Damage, Traits, Ability) — IsUpgrade=1
      recipes        – dict {base_item_id: {...}}  receta que crea la versión "+"
                       (Ingredients) — IsUpgrade=1
      base_recipes   – dict {base_item_id: {...}}  receta que crea el ítem BASE
                       desde cero (solo existe para consumibles) — IsUpgrade=0
      base_item_defs – dict {base_item_id: {...}}  definición del ítem BASE
                       (stats reales de la pieza sin mejorar: Damage, Traits)
                       — IsUpgrade=0, BaseItemId vacío (identidad en KeyName)
      mat_map        – dict {path_id: MAT_ID}
      ability_by_key – dict {KeyName: {...}} de TODOS los objetos "Ability" del
                       juego (activaciones e instrínsecas), para resolver la
                       versión base a partir de la mejorada.

    IMPORTANTE — colisiones que había en la versión anterior, todas del mismo
    tipo: dos objetos Unity distintos comparten la misma identidad final
    (BaseItemId, o KeyName cuando BaseItemId viene vacío) y antes se guardaban
    los dos bajo la misma clave de diccionario, así que el que se leyera
    último (orden no determinista de env.objects) pisaba al otro:
    1) Partes de arma: la RECETA (Ingredients+Value, IsUpgrade=1) y la
       DEFINICIÓN del ítem "+" (Ability/Damage/Traits, IsUpgrade=1) — antes
       compartían `recipes[bid]`, perdiendo ingredientes o daño real.
    2) Consumibles: además de la receta "+", existe una receta que crea el
       ítem BASE desde cero (IsUpgrade=0, BaseItemId vacío) — se separa en
       `base_recipes`.
    3) Partes de arma (de nuevo): además de la definición "+", casi todas
       tienen una definición BASE real (IsUpgrade=0, BaseItemId vacío, con su
       propio Damage/Traits, no simplemente "daño de la mejora menos 1") — se
       separa en `base_item_defs`.
    """
    item_defs      = {}
    recipes        = {}
    base_recipes   = {}
    base_item_defs = {}
    ability_by_key = {}

    # Mapa path_id → MAT_ID para resolver ingredientes de recetas
    mat_map = {}
    # Mapa path_id → info de Ability, para resolver los PPtr `Ability`
    ability_by_pid = {}

    # Primera pasada: materiales (KeyName = MAT_*) y objetos Ability
    # (identificados por su forma: Chance + KeyDesc + isPartA, únicos de esta clase)
    for obj in env.objects:
        if obj.type.name != "MonoBehaviour":
            continue
        try:
            d = obj.read()
        except Exception:
            continue
        try:
            key = getattr(d, "KeyName", None)
            if key and str(key).startswith("MAT_") and not str(key).endswith("_DESC"):
                mat_map[obj.path_id] = str(key)
        except Exception:
            pass
        try:
            if hasattr(d, "Chance") and hasattr(d, "KeyDesc") and hasattr(d, "isPartA"):
                info = {
                    "keyName": str(getattr(d, "KeyName", "") or ""),
                    "keyDesc": str(getattr(d, "KeyDesc", "") or ""),
                    "chance":  float(getattr(d, "Chance", 0) or 0),
                    "isPartA": int(getattr(d, "isPartA", 0) or 0),
                    "isUpgrade": int(getattr(d, "IsUpgrade", 0) or 0),
                }
                ability_by_pid[obj.path_id] = info
                if info["keyName"]:
                    ability_by_key[info["keyName"]] = info
        except Exception:
            pass

    # Segunda pasada: recopilar ítems y recetas
    for obj in env.objects:
        if obj.type.name != "MonoBehaviour":
            continue
        try:
            d = obj.read()
            raw_bid     = getattr(d, "BaseItemId", None)
            is_upgrade  = int(getattr(d, "IsUpgrade", 0))
            key_name    = str(getattr(d, "KeyName", "") or "")
            # Los objetos "base" de consumibles (p.ej. la receta que crea
            # CSM_ANTIDOTE_POTION desde cero, con Ingredients reales e
            # IsUpgrade=0) llevan BaseItemId vacío en estos assets — su
            # identidad real está en KeyName. Sin este fallback, esas recetas
            # base se perdían por completo (nunca entraban en `recipes`).
            if raw_bid:
                bid = str(raw_bid)
            elif is_upgrade == 0 and key_name:
                bid = key_name
            else:
                continue
            key_desc    = str(getattr(d, "KeyDescription", "") or "")
            tex_path    = str(getattr(d, "TextureAssetPath", "") or "")
            value       = int(getattr(d, "Value", 0) or 0)
            crafted_id  = str(getattr(d, "CraftedItemId", "") or "")
            has_ing     = hasattr(d, "Ingredients")
            has_ability = hasattr(d, "Ability")

            if has_ing:
                # ── Objeto RECETA: ingredientes + coste ─────────────────────
                ingredients = {}
                for ing in (getattr(d, "Ingredients", None) or []):
                    try:
                        mat = ing.Material.read()
                        mat_key = str(getattr(mat, "KeyName", "") or "")
                        qty = int(getattr(ing, "Qty", 0) or 0)
                        if mat_key and qty:
                            ingredients[mat_key] = ingredients.get(mat_key, 0) + qty
                    except Exception:
                        mat_pid = getattr(getattr(ing, "Material", None), "path_id", None)
                        if mat_pid and mat_pid in mat_map:
                            qty = int(getattr(ing, "Qty", 0) or 0)
                            ingredients[mat_map[mat_pid]] = qty

                target = recipes if is_upgrade else base_recipes
                target[bid] = {
                    "baseItemId":  bid,
                    "craftedId":   crafted_id,
                    "keyName":     key_name,
                    "keyDesc":     key_desc,
                    "texPath":     tex_path,
                    "value":       value,
                    "isUpgrade":   is_upgrade,
                    "ingredients": ingredients,
                }

            elif has_ability:
                # ── Objeto DEFINICIÓN: stats reales del ítem ────────────────
                # Igual que con las recetas: hay un objeto IsUpgrade=1 (stats
                # de la versión "+", BaseItemId relleno) y, para casi todas
                # las partes de arma, TAMBIÉN un objeto IsUpgrade=0 con las
                # stats reales de la versión BASE (BaseItemId vacío, cae en
                # el fallback de KeyName más arriba). Antes se guardaban
                # ambos bajo `item_defs[bid]` y el último en leerse pisaba al
                # otro — a veces el daño base sustituía al daño "+" o
                # viceversa. Se separan en dos diccionarios distintos.
                ability_info = None
                try:
                    ability_pptr = d.Ability
                    ability_info = ability_by_pid.get(ability_pptr.path_id)
                except Exception:
                    pass

                target = item_defs if is_upgrade else base_item_defs
                target[bid] = {
                    "baseItemId": bid,
                    "keyName":    key_name,
                    "texPath":    tex_path,
                    "value":      value,
                    "isUpgrade":  is_upgrade,
                    "damage":     int(getattr(d, "Damage", 0) or 0),
                    "traits":     [int(t) for t in (getattr(d, "Traits", None) or [])],
                    "isPromo":    int(getattr(d, "IsPromo", 0) or 0),
                    "ability":    ability_info,
                }

        except Exception:
            pass

    print(f"  ✓ {len(item_defs)} definiciones '+', {len(base_item_defs)} definiciones base, "
          f"{len(recipes)} recetas '+', {len(base_recipes)} recetas base")
    return item_defs, recipes, base_recipes, base_item_defs, mat_map, ability_by_key

# ──────────────────────────────────────────────────────────────────────────────
# Extracción de imágenes
# ──────────────────────────────────────────────────────────────────────────────

ASSET_RULES = [
    # (patrón en container path, carpeta destino, filtro extra)
    ("assets/d3/weapon parts/", "weapon_parts", lambda p: not p.endswith(" icon.png")),
    ("assets/d3/crafting materials/", "materials",    lambda p: True),
    ("assets/d3/armor/",        "armor",        lambda p: True),
    ("assets/d3/consumables/",  "consumables",  lambda p: True),
    ("assets/d3/trinkets/",     "trinkets",     lambda p: True),
    ("assets/d3/heroes/",       "heroes",       lambda p: True),
]

# ── Mapa de iconos de tipo de daño (glossaryterms → icons/) ──────────────────
# Ruta en bundles: assets/d3/glossaryterms/damage/mainterms/damage types/icons_*.png
DMG_ICON_MAP = {
    "icons_anemos.png":   "dmg_anemos.png",
    "icons_aquos.png":    "dmg_aquos.png",
    "icons_crush.png":    "dmg_crush.png",
    "icons_fortunos.png": "dmg_fortunos.png",
    "icons_ignos.png":    "dmg_ignos.png",
    "icons_lumos.png":    "dmg_lumos.png",
    "icons_mortos.png":   "dmg_mortos.png",
    "icons_pierce.png":   "dmg_pierce.png",
    "icons_slash.png":    "dmg_slash.png",
    "icons_terros.png":   "dmg_terros.png",
    "icons_toxos.png":    "dmg_toxos.png",
    "icons_umbros.png":   "dmg_umbros.png",
    "icons_vigos.png":    "dmg_vigos.png",
}

# ── Mapa de sprites UI (nombre_sprite → nombre_archivo_destino) ───────────────
# Sprites extraídos de Atlas_UI y GlossaryAtlas por nombre (m_Name).
# Confirmados por hash match con las imágenes en public/assets/icons/.
UI_SPRITE_MAP = {
    # Tabs del planner → sprites City / Glossary del juego
    "CityIcon_Shop":         "tab_tienda.png",
    "CityIcon_Armory":       "tab_armeria.png",
    "CityIcon_Crafting":     "tab_creacion.png",
    "CityIcon_Person":       "tab_inventario.png",
    "Cloth":                 "tab_historial.png",     # material Tela = tab historial
    "p29_CampaignQuest_Icon":"tab_partida_act1.png",
    "p29_SideQuest_Icon":    "tab_partida_act2.png",
    # Iconos de UI general
    "Icon_Coin":             "currency.png",
    "Icon_Coin":             "Icon_Coin.png",          # mismo sprite, dos destinos
    "Leather":               "recipe_badge.png",       # material Cuero = badge receta
    "Icon_0000_Range":       "weapon_range.png",
    "Icon_Damage":           "dmg_value.png",
    "Icon_Consumables":      "Icon_Consumable.png",    # nota: el sprite tiene 's'
    "Icon_Trinket":          "Icon_Trinket.png",
    # Iconos no-SDF ya confirmados por hash
    "Icon_Armor":            "Icon_Armor.png",
    "Icon_Materials":        "Icon_Materials.png",
    "Icon_Defense":          "Icon_Defense.png",
    "Icon_Range":            "Icon_Range.png",
    "Icon_Action_Combat":    "Icon_Action_Combat.png",
    "Icon_Action_Generic":   "Icon_Action_Generic.png",
    "Icon_Action_Interact":  "Icon_Action.png",
    "Icon_Resistance":       "Icon_Resistance.png",
    "Icon_Weakness":         "Icon_Weakness.png",
    "Icon_Coins":            "Icon_Coins.png",
}

# ── Definición de los 9 pieces del label frame (desde 9Slice_2) ───────────────
# 9Slice_2 es el sprite (48×50, blanco+alpha) del Atlas_UI que contiene el frame
# de las tarjetas de piezas de arma. Se divide en 9 pieces:
#   - label_bg: el sprite completo tal cual (blanco, misma forma)
#   - label_corner_*: crops en los cuadrantes de 24×25, convertidos a negro
#   - label_edge_*: crops de 1px en el borde, convertidos a negro
# Todos verificados por hash exacto con las imágenes del proyecto.
LABEL_9SLICE_CX = 24   # x split point
LABEL_9SLICE_CY = 25   # y split point

LABEL_PIECES = {
    # (crop_box, make_black)
    "label_bg.png":         ((0,  0,  48, 50), False),   # blanco, tal cual
    "label_corner_tl.png":  ((0,  0,  24, 25), True),
    "label_corner_tr.png":  ((24, 0,  48, 25), True),
    "label_corner_bl.png":  ((0,  25, 24, 50), True),
    "label_corner_br.png":  ((24, 25, 48, 50), True),
    "label_edge_t.png":     ((24, 0,  25, 25), True),   # 1px ancho
    "label_edge_b.png":     ((24, 25, 25, 50), True),
    "label_edge_l.png":     ((0,  25, 24, 26), True),   # 1px alto
    "label_edge_r.png":     ((24, 25, 48, 26), True),
}


def extract_images(env, planner_dir, overwrite=False):
    """Extrae imágenes Texture2D del env y las guarda en public/assets/."""
    assets_dir = os.path.join(planner_dir, "public", "assets")
    counters = defaultdict(int)
    skipped  = 0

    for container_path, obj in env.container.items():
        if obj.type.name != "Texture2D":
            continue
        if not container_path.endswith(".png"):
            continue

        for prefix, folder, extra_filter in ASSET_RULES:
            if container_path.startswith(prefix) and extra_filter(container_path):
                filename = os.path.basename(container_path)
                out_dir  = os.path.join(assets_dir, folder)
                out_path = os.path.join(out_dir, filename)

                if not overwrite and os.path.exists(out_path):
                    skipped += 1
                    break

                os.makedirs(out_dir, exist_ok=True)
                try:
                    tex = obj.read()
                    img = tex.image
                    img.save(out_path)
                    counters[folder] += 1
                except Exception as e:
                    print(f"    ✗ Error en {container_path}: {e}")
                break

    total = sum(counters.values())
    print(f"  ✓ {total} imágenes extraídas ({skipped} ya existían)")
    for folder, n in sorted(counters.items()):
        if n:
            print(f"      {folder}: {n}")


def extract_ui_icons(env, planner_dir, overwrite=False):
    """Extrae TODOS los iconos UI del planner desde los bundles del juego.

    Cubre tres grupos:
    1. Iconos de tipo de daño desde GlossaryTerms (dmg_*.png)
    2. Sprites de Atlas_UI y otros atlases (tabs, currency, Icon_*, etc.)
    3. Label frame pieces generadas desde el sprite 9Slice_2
    """
    from PIL import Image as _Image
    icons_dir = os.path.join(planner_dir, "public", "assets", "icons")
    os.makedirs(icons_dir, exist_ok=True)
    extracted = skipped = 0

    # ── Grupo 1: iconos de daño (container path matching) ────────────────────
    # Estos son objetos Sprite en el GlossaryAtlas, no Texture2D
    for container_path, obj in env.container.items():
        if obj.type.name not in ("Texture2D", "Sprite"):
            continue
        if "glossaryterms" not in container_path:
            continue
        basename = os.path.basename(container_path).lower()
        dest_name = DMG_ICON_MAP.get(basename)
        if not dest_name:
            continue
        out_path = os.path.join(icons_dir, dest_name)
        if not overwrite and os.path.exists(out_path):
            skipped += 1
            continue
        try:
            obj.read().image.save(out_path)
            extracted += 1
        except Exception as e:
            print(f"    ✗ dmg icon {basename}: {e}")

    # ── Grupo 2: sprites UI por nombre (m_Name) ───────────────────────────────
    # UI_SPRITE_MAP puede tener claves duplicadas si el mismo sprite va a dos archivos;
    # lo resolvemos como lista de (sprite_name, dest_filename)
    sprite_targets = list(UI_SPRITE_MAP.items())
    # También: Icon_Coin → currency.png e Icon_Coin.png (la clave se sobreescribe
    # en el dict, así que añadimos la segunda entrada explícita aquí)
    sprite_targets.append(("Icon_Coin", "currency.png"))

    # Construir un set de nombres buscados para filtrar rápido
    wanted_sprites = {name for name, _ in sprite_targets}
    found_sprites = {}  # sprite_name → PIL.Image

    seen_pids = set()
    for obj in env.objects:
        if obj.path_id in seen_pids:
            continue
        seen_pids.add(obj.path_id)
        try:
            if obj.type.name != "Sprite":
                continue
            d = obj.read()
            name = getattr(d, 'm_Name', None) or ''
            if name not in wanted_sprites or name in found_sprites:
                continue
            found_sprites[name] = d.image
        except Exception:
            pass

    for sprite_name, dest_name in sprite_targets:
        out_path = os.path.join(icons_dir, dest_name)
        if not overwrite and os.path.exists(out_path):
            skipped += 1
            continue
        img = found_sprites.get(sprite_name)
        if img is None:
            print(f"    ⚠ Sprite no encontrado: '{sprite_name}' → {dest_name}")
            continue
        try:
            img.save(out_path)
            extracted += 1
        except Exception as e:
            print(f"    ✗ {sprite_name} → {dest_name}: {e}")

    # ── Grupo 3: label frame pieces desde 9Slice_2 ───────────────────────────
    slice2_img = found_sprites.get('9Slice_2')
    if slice2_img is None:
        # Buscar 9Slice_2 explícitamente si no fue capturado antes
        for obj in env.objects:
            try:
                if obj.type.name != "Sprite":
                    continue
                d = obj.read()
                if getattr(d, 'm_Name', None) == '9Slice_2':
                    slice2_img = d.image
                    break
            except Exception:
                pass

    if slice2_img:
        for dest_name, (box, make_black) in LABEL_PIECES.items():
            out_path = os.path.join(icons_dir, dest_name)
            if not overwrite and os.path.exists(out_path):
                skipped += 1
                continue
            try:
                piece = slice2_img.crop(box)
                if make_black:
                    r, g, b, a = piece.split()
                    black = _Image.new("L", piece.size, 0)
                    piece = _Image.merge("RGBA", (black, black, black, a))
                piece.save(out_path)
                extracted += 1
            except Exception as e:
                print(f"    ✗ label piece {dest_name}: {e}")
    else:
        print("    ⚠ Sprite 9Slice_2 no encontrado — label_*.png no generados")

    # También necesitamos 9Slice_2 en el grupo 2 (para label_bg.png vía LABEL_PIECES)
    # Si label_bg no se generó, intentar guardar 9Slice_2 directamente:
    label_bg_path = os.path.join(icons_dir, "label_bg.png")
    if not os.path.exists(label_bg_path) and slice2_img:
        try:
            slice2_img.save(label_bg_path)
            extracted += 1
        except Exception:
            pass

    print(f"  ✓ Iconos UI: {extracted} extraídos, {skipped} ya existían")


# ──────────────────────────────────────────────────────────────────────────────
# Helpers de naming
# ──────────────────────────────────────────────────────────────────────────────

def weapon_part_image_path(tex_path):
    """Convierte TextureAssetPath del juego en ruta web /assets/weapon_parts/..."""
    if not tex_path:
        return None
    # Ej: "D3/Weapon Parts/Bow/A - Bloodwood/Bow A1 - Bloodwood Icon.png"
    # → "bow a1 - bloodwood icon.png" → eliminar " icon" si lo hay (usamos imagen base)
    basename = os.path.basename(tex_path).lower()
    basename = basename.replace(" icon.png", ".png")
    return f"/assets/weapon_parts/{basename}"


def item_image_path(tex_path, folder):
    if not tex_path:
        return None
    basename = os.path.basename(tex_path).lower()
    return f"/assets/{folder}/{basename}"


def parse_weapon_part_id(bid):
    """
    WEAPON_PART_A_BOW_1 → (slot='A', wtype='BOW', level=1)
    WEAPON_PART_A_BOW_1_UPGRADED → (slot='A', wtype='BOW', level=1, upgraded=True)
    """
    m = re.match(r"WEAPON_PART_([ABC])_(.+?)_(\d+)(_UPGRADED)?$", bid)
    if not m:
        return None
    return {
        "slot":     m.group(1),
        "wtype":    m.group(2),
        "level":    int(m.group(3)),
        "upgraded": bool(m.group(4)),
    }

WEAPON_TYPE_TO_PREFIX = {
    "BOW":         "bow",
    "CROSSBOW":    "crossbow",
    "DUAL_BLADES": "dual blades",
    "GAUNTLET":    "gauntlet",
    "HAMMER":      "hammer",
    "KNIVES":      "knives",
    "SPEAR":       "spear",
    "STAFF":       "staff",
    "SWORD":       "sword",
    "WAND":        "wand",
    "WARBELL":     "warbell",
    "WARHAMMER":   "warhammer",
    "RUNE":        "rune",
    "POLEAXE":     "poleaxe",
}

# ── Partes de arma "especiales" ──────────────────────────────────────────────
# No siguen el patrón WEAPON_PART_<SLOT>_<TIPO>_<NIVEL>: son piezas únicas de
# slot A, sin B/C, sin arma/héroe asociado (no aparecen en WEAPONS). Se listan
# explícitamente porque son solo 7 y su BaseItemId no tiene sufijo numérico
# (el regex estándar de parse_weapon_part_id no las reconoce).
# "level" se asigna según el orden a1..a5 real de los ficheros de imagen del
# grupo RUNE (ver public/assets/weapon_parts/rune a*.png).
SPECIAL_WEAPON_PARTS = {
    "WEAPON_PART_A_LIGHTNING_STRIKE": {"weaponType": "RUNE",    "level": 1},
    "WEAPON_PART_A_ICE_STORM":        {"weaponType": "RUNE",    "level": 2},
    "WEAPON_PART_A_RUNE_OF_BLADES":   {"weaponType": "RUNE",    "level": 3},
    "WEAPON_PART_A_SUNBURST":         {"weaponType": "RUNE",    "level": 4},
    "WEAPON_PART_A_FEAR":             {"weaponType": "RUNE",    "level": 5},
    "WEAPON_PART_A_DRAGONSBANE":      {"weaponType": "POLEAXE", "level": 1},
    # Sword Ancestral: su fichero en disco no lleva número de nivel
    # ("sword a - ancestral blade.png"), así que necesita ruta de imagen fija.
    "WEAPON_PART_A_SWORD_ANCESTRAL":  {
        "weaponType": "SWORD_ANCESTRAL", "level": 1,
        "image": "/assets/weapon_parts/sword a - ancestral blade.png",
    },
}

# Cache built once per run
_WEAPON_PART_DISK_MAP = None

def _build_weapon_disk_map(planner_dir):
    """Builds {(prefix, slot, level): filename} from public/assets/weapon_parts/."""
    global _WEAPON_PART_DISK_MAP
    if _WEAPON_PART_DISK_MAP is not None:
        return _WEAPON_PART_DISK_MAP
    assets = os.path.join(planner_dir, "public", "assets", "weapon_parts")
    disk = {}
    if os.path.isdir(assets):
        for f in sorted(os.listdir(assets)):
            if not f.endswith(".png"):
                continue
            if " icon" in f or " promo" in f or "+" in f:
                continue
            m = re.match(r'^(.+?) ([a-c])(\d+) - .+\.png$', f)
            if m:
                key = (m.group(1), m.group(2), int(m.group(3)))
                disk.setdefault(key, f)  # first match wins (sorted, so canonical)
    _WEAPON_PART_DISK_MAP = disk
    return disk

def _find_weapon_part_image(wtype, slot, level, planner_dir):
    """Return web-path for a weapon part image, looked up from disk by wtype/slot/level.
    Level 0 (starter) images exist for slots B and C of most weapons."""
    prefix = WEAPON_TYPE_TO_PREFIX.get(wtype)
    if not prefix:
        return None
    disk = _build_weapon_disk_map(planner_dir)
    filename = disk.get((prefix, slot, level))
    if filename:
        return f"/assets/weapon_parts/{filename}"
    return None


# ──────────────────────────────────────────────────────────────────────────────
# Generación de weaponParts.js
# ──────────────────────────────────────────────────────────────────────────────

def _make_names(locs, *keys, es_fallback=""):
    """Construye el dict names para todos los idiomas probando las claves en orden."""
    result = {}
    for lang in LANGS:
        loc = locs.get(lang, {})
        val = ""
        for key in keys:
            if key:
                v = loc.get(key, "")
                if v:
                    val = v
                    break
        if not val and lang == "es" and es_fallback:
            val = es_fallback
        result[lang] = val
    return result


def generate_weapon_parts_js(item_defs, base_item_defs, recipes, locs, planner_dir):
    """Genera src/gamedata/weaponParts.js

    damage/traits de la versión "+" se leen de `item_defs` y NO de `recipes`
    (que sólo tiene ingredientes y coste) — antes ambos se conflaban en un
    único diccionario y, según el orden de lectura de Unity, unas veces se
    perdían los ingredientes y otras el daño/traits real.

    damage/traits de la versión BASE se leen de `base_item_defs` cuando
    existe (casi siempre) — comprobado contra los assets: la mejora de una
    pieza SIEMPRE añade exactamente 1 de daño (100% de los casos), pero los
    traits (tipos de daño) no siempre son los mismos entre base y "+", así
    que no basta con "daño de la mejora menos 1" reutilizando los traits de
    la mejora; hay que leer el daño/traits base real cuando esté disponible.
    """
    parts = {}  # id → part dict

    # Recopilar todos los tipos de arma y slots de las recetas "normales"
    # (con nivel numérico). En Unity, algunas armas almacenan el BaseItemId
    # de la receta con sufijo _UPGRADED y otras sin él; normalizamos siempre
    # quitando el sufijo para obtener el tipo de arma correcto.
    weapon_types = set()
    for bid, rec in recipes.items():
        normalized = re.sub(r"_UPGRADED$", "", bid)
        info = parse_weapon_part_id(normalized)
        if info:
            weapon_types.add((info["wtype"], info["slot"]))

    # Crear ítem nivel 0 (pieza "starter") para cada tipo×slot.
    # Slot A nivel 0 no tiene arte propio (la hoja/cabeza inicial no se
    # dibuja aparte), pero los accesorios B/C nivel 0 SÍ tienen imagen real
    # en disco ("<tipo> b0 - starter....png" / "...c0 - starter....png") — se
    # buscan igual que cualquier otro nivel, no se fuerza a None.
    for wtype, slot in sorted(weapon_types):
        pid = f"WEAPON_PART_{slot}_{wtype}_0"
        if pid not in parts:
            parts[pid] = {
                "id":         pid,
                "slot":       slot,
                "weaponType": wtype,
                "level":      0,
                "names":      _make_names(locs, pid, es_fallback=f"{wtype.replace('_',' ').title()} {slot}0"),
                "weaponId":   WEAPON_TYPE_TO_ID.get(wtype, f"WEAPON_{wtype}"),
                "image":      _find_weapon_part_image(wtype, slot.lower(), 0, planner_dir),
                "buyPrice":   None,
                "sellPrice":  None,
                "damage":     0,
                "traits":     [],
            }

    # Crear ítems de nivel 1-5 a partir de las recetas.
    # Normalizamos el bid quitando el sufijo _UPGRADED para obtener siempre el pid base.
    for bid, rec in sorted(recipes.items()):
        # Normalizar: si bid termina en _UPGRADED, el pid base es sin el sufijo
        normalized = re.sub(r"_UPGRADED$", "", bid)
        info = parse_weapon_part_id(normalized)
        is_special = normalized in SPECIAL_WEAPON_PARTS
        if not info and not is_special:
            continue  # no es una parte de arma válida
        if info and info["upgraded"]:
            continue

        pid = normalized  # ID de la parte base (sin _UPGRADED)
        if is_special:
            wtype = SPECIAL_WEAPON_PARTS[pid]["weaponType"]
            slot  = "A"
            level = SPECIAL_WEAPON_PARTS[pid]["level"]
        else:
            wtype = info["wtype"]
            slot  = info["slot"]
            level = info["level"]

        # Nombre: la clave de localización del nombre de una parte de arma es
        # SIEMPRE el propio BaseItemId (pid / pid+"_UPGRADED"); NO se usa
        # rec["keyName"] aquí a propósito. Comprobado contra los assets: en 7
        # piezas (p.ej. WEAPON_PART_A_ICE_STORM ↔ WEAPON_PART_A_RUNE_OF_BLADES,
        # WEAPON_PART_A_CROSSBOW_1 ↔ _CROSSBOW_2, los 3 niveles de STAFF slot A)
        # el campo KeyName de la receta apunta al KeyName de OTRA pieza — un
        # error de los propios datos del juego que hacía salir nombres
        # cruzados. Usar el pid directamente evita heredar ese cruce.
        name_key = pid

        # Imagen: buscar imagen a partir del ID (weapon_type, slot, level) en el filesystem.
        # Usamos el disco en lugar de texPath porque la receta apunta a la textura del ítem
        # craftado (con '+') y puede estar en orden diferente al del item base.
        fixed_image = SPECIAL_WEAPON_PARTS.get(pid, {}).get("image")
        image = fixed_image or _find_weapon_part_image(wtype, slot.lower(), level, planner_dir)

        # Daño/traits reales: del objeto "definición" del ítem "+", no de la receta.
        item_def        = item_defs.get(pid) or {}
        upgraded_damage = item_def.get("damage", 0)
        upgraded_traits = item_def.get("traits", [])
        is_promo        = item_def.get("isPromo", 0)

        # Daño/traits/precio BASE: del objeto "definición" base real cuando
        # existe (todas las partes de arma menos 3 casos de ranura C); si no
        # existe, se recurre al heurístico verificado (mejora = +1 de daño
        # exacto, mismos traits) como red de seguridad.
        #
        # Precio: el Value de ese mismo objeto base es el precio real de
        # venta en la Tienda cuando el juego pone esa parte concreta a la
        # venta como ítem suelto (comprobado: WEAPON_PART_A_STAFF_2 → 200 oro,
        # coincide con una partida real). Solo algunos niveles se venden así
        # (0 = no disponible en tienda, nunca solo craft/loot); los B/C
        # siempre están a 0 porque no se venden sueltos, solo se craftean.
        base_def    = base_item_defs.get(pid)
        if base_def:
            base_damage = base_def.get("damage", 0)
            traits      = base_def.get("traits", [])
            buy_price   = base_def.get("value") or None
        else:
            base_damage = max(0, upgraded_damage - 1) if upgraded_damage > 0 else 0
            traits      = upgraded_traits
            buy_price   = None
        sell_price = None

        parts[pid] = {
            "id":         pid,
            "slot":       slot,
            "weaponType": wtype,
            "level":      level,
            "names":      _make_names(locs, name_key, pid, es_fallback=pid),
            "weaponId":   None if is_special else WEAPON_TYPE_TO_ID.get(wtype, f"WEAPON_{wtype}"),
            "image":      image,
            "buyPrice":   buy_price,
            "sellPrice":  sell_price,
            "damage":     base_damage,
            "traits":     traits,
        }

        # También crear la versión UPGRADED (con el daño completo de los assets)
        uid = f"{pid}_UPGRADED"
        base_names = parts[pid]["names"]
        # Igual que con el nombre base: se usa el pid (uid), no rec["keyName"].
        upg_names = _make_names(locs, uid, pid, es_fallback=pid)
        upg_entry = {
            "id":         uid,
            "slot":       slot,
            "weaponType": wtype,
            "level":      level,
            "names":      {lang: (upg_names[lang] or base_names[lang]) + " ✦" for lang in LANGS},
            "weaponId":   None if is_special else WEAPON_TYPE_TO_ID.get(wtype, f"WEAPON_{wtype}"),
            "image":      image,  # misma imagen que la base
            "buyPrice":   None,
            "sellPrice":  None,
            "damage":     upgraded_damage,
            "traits":     upgraded_traits,
        }
        if is_promo:
            upg_entry["isPromo"] = 1
        parts[uid] = upg_entry

    # Ordenar: por weaponType, slot, level
    sort_key = lambda p: (p["weaponType"], p["slot"], p["level"], p["id"].endswith("_UPGRADED"))
    sorted_parts = sorted(parts.values(), key=sort_key)

    lines = [
        "// Partes de armas de Descent: Legends of the Dark",
        "// Generado automáticamente por extract.py — no editar manualmente",
        "// buyPrice / sellPrice: null = precio no disponible en assets del juego",
        "",
        "export const WEAPON_PARTS = " + json.dumps(sorted_parts, ensure_ascii=False, indent=2) + ";",
        "",
        "export const WEAPON_PARTS_BY_ID = Object.fromEntries(WEAPON_PARTS.map(p => [p.id, p]));",
    ]

    out_path = os.path.join(planner_dir, "src", "gamedata", "weaponParts.js")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"  ✓ weaponParts.js → {len(sorted_parts)} partes")

# ──────────────────────────────────────────────────────────────────────────────
# Generación de weaponPartDescs.js / weaponAbilities.js / weaponAbilityDescs.js
# ──────────────────────────────────────────────────────────────────────────────

def _base_ability_key(full_key):
    """
    Deriva la clave de habilidad BASE a partir de la clave de la versión "+".
    Convención observada en los propios assets del juego (100% de los casos
    comprobados, dos familias distintas):
      - Activaciones genéricas (isPartA=1):  '..._UPGRADED' → sin sufijo
      - Habilidades nombradas   (isPartA=0):  '...+'        → sin sufijo
    """
    if full_key.endswith("_UPGRADED"):
        return full_key[: -len("_UPGRADED")]
    if full_key.endswith("+"):
        return full_key[:-1]
    return full_key


def generate_weapon_ability_files(item_defs, ability_by_key, locs, planner_dir):
    """
    Genera weaponPartDescs.js, weaponAbilities.js y weaponAbilityDescs.js a
    partir del PPtr `Ability` real de cada parte de arma (resuelto en
    scan_items). Cada parte de arma apunta a un único objeto Ability real del
    juego, con un flag `isPartA`:
      - isPartA=1 → activación genérica por tipo de arma + nivel (se imprime
        en la carta de Arma; comparte texto entre A/B/C del mismo nivel).
        → va a weaponPartDescs.js, indexado por ID de la parte.
      - isPartA=0 → habilidad nombrada única de esa pieza concreta (accesorios
        B/C y las 7 piezas especiales de ranura A).
        → va a weaponAbilities.js (PART_ABILITY_KEY/ABILITY_CHANCE) +
          weaponAbilityDescs.js.

    Antes estos tres ficheros se habían escrito a mano en sesiones anteriores
    (nunca los generaba extract.py), con mapeos incompletos: a esta función
    sustituye por completo ese contenido, derivado 100% de datos reales.
    """
    weapon_part_descs = {}   # part_id[_UPGRADED] → {lang: text}
    part_ability_key  = {}   # part_id (base)      → ability_key (base)
    ability_chance    = {}   # ability_key[+]      → % entero
    ability_descs     = {}   # ability_key[+]      → {lang: text}

    for pid, item_def in sorted(item_defs.items()):
        ability = item_def.get("ability")
        if not ability or not ability.get("keyName"):
            continue

        full_key    = ability["keyName"]
        full_desc   = ability["keyDesc"]
        base_key    = _base_ability_key(full_key)
        base_ability = ability_by_key.get(base_key)

        if ability["isPartA"]:
            base_texts = _make_names(locs, base_ability["keyDesc"]) if (base_ability and base_ability.get("keyDesc")) else None
            upg_texts  = _make_names(locs, full_desc) if full_desc else None
            if base_texts and any(base_texts.values()):
                weapon_part_descs[pid] = base_texts
                # ArmeriaPanel.jsx (componente WeaponAbilities) busca la misma
                # activación por WEAPON_ABILITY_<TIPO>_<NIVEL>, no por ID de parte.
                ability_descs[base_key] = base_texts
            if upg_texts and any(upg_texts.values()):
                weapon_part_descs[f"{pid}_UPGRADED"] = upg_texts
                ability_descs[f"{base_key}_UPGRADED"] = upg_texts
        else:
            part_ability_key[pid] = base_key
            if base_ability:
                pct = round(base_ability["chance"] * 100)
                if base_ability["chance"] > 0:
                    ability_chance[base_key] = pct
                if base_ability.get("keyDesc"):
                    texts = _make_names(locs, base_ability["keyDesc"])
                    if any(texts.values()):
                        ability_descs[base_key] = texts
            if ability["chance"] > 0:
                ability_chance[f"{base_key}+"] = round(ability["chance"] * 100)
            if full_desc:
                texts_up = _make_names(locs, full_desc)
                if any(texts_up.values()):
                    ability_descs[f"{base_key}+"] = texts_up

    # weaponPartDescs.js ---------------------------------------------------
    lines = [
        "// Descripciones de activación de partes de arma (slot A, isPartA=1 en Unity)",
        "// Generado automáticamente por extract.py — no editar manualmente",
        "",
        "export const WEAPON_PART_DESCS = " + json.dumps(weapon_part_descs, ensure_ascii=False, indent=2) + ";",
    ]
    with open(os.path.join(planner_dir, "src", "gamedata", "weaponPartDescs.js"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"  ✓ weaponPartDescs.js → {len(weapon_part_descs)} activaciones")

    # weaponAbilities.js -----------------------------------------------------
    # UI_NO_ABILITY: texto fijo del juego para piezas sin habilidad nombrada.
    no_ability_texts = _make_names(locs, "UI_NO_ABILITY")
    weapon_abilities_compat = {k: v for k, v in ability_descs.items() if not k.endswith("+")}
    if any(no_ability_texts.values()):
        weapon_abilities_compat["UI_NO_ABILITY"] = no_ability_texts

    lines2 = [
        "// Mapa parte de arma → habilidad nombrada (isPartA=0 en Unity: accesorios B/C y piezas especiales)",
        "// Generado automáticamente por extract.py — no editar manualmente",
        "",
        "export const PART_ABILITY_KEY = " + json.dumps(part_ability_key, ensure_ascii=False, indent=2) + ";",
        "",
        "// Compatibilidad: texto base de cada habilidad nombrada + UI_NO_ABILITY (ver weaponAbilityDescs.js para bases+mejoras)",
        "export const WEAPON_ABILITIES = " + json.dumps(weapon_abilities_compat, ensure_ascii=False, indent=2) + ";",
        "",
        "export const ABILITY_CHANCE = " + json.dumps(dict(sorted(ability_chance.items())), ensure_ascii=False, indent=2) + ";",
    ]
    with open(os.path.join(planner_dir, "src", "gamedata", "weaponAbilities.js"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines2) + "\n")
    print(f"  ✓ weaponAbilities.js → {len(part_ability_key)} mapeos, {len(ability_chance)} probabilidades")

    # weaponAbilityDescs.js ---------------------------------------------------
    lines3 = [
        "// Habilidades nombradas de partes de arma (base y +) — todos los idiomas",
        "// Generado automáticamente por extract.py — no editar manualmente",
        "",
        "export const WEAPON_ABILITY_DESCS = " + json.dumps(ability_descs, ensure_ascii=False, indent=2) + ";",
    ]
    with open(os.path.join(planner_dir, "src", "gamedata", "weaponAbilityDescs.js"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines3) + "\n")
    print(f"  ✓ weaponAbilityDescs.js → {len(ability_descs)} habilidades")

# ──────────────────────────────────────────────────────────────────────────────
# Generación de materials.js
# ──────────────────────────────────────────────────────────────────────────────

def generate_materials_js(env, locs, planner_dir):
    """Genera src/gamedata/materials.js

    buyPrice viene directamente del campo `Value` real del material en Unity
    (confirmado: coincide con el precio de compra ya usado en la tienda).
    sellPrice NO tiene ninguna fuente en los assets (no existe un segundo
    campo de "precio de venta" en el objeto del material) — se conserva el
    valor ya existente en el fichero actual si lo había, en vez de perderlo.
    """
    mats = {}

    existing = {m["id"]: m for m in _read_existing_js_array(
        os.path.join(planner_dir, "src", "gamedata", "materials.js"), "MATERIALS")}

    for container_path, obj in env.container.items():
        if not (container_path.startswith("assets/d3/crafting materials/") and
                container_path.endswith(".asset") and
                obj.type.name == "MonoBehaviour"):
            continue
        try:
            d = obj.read()
            key = str(getattr(d, "KeyName", "") or "")
            tex = str(getattr(d, "TextureAssetPath", "") or "")
            value = int(getattr(d, "Value", 0) or 0)
            if not key or not key.startswith("MAT_"):
                continue

            mat_name = os.path.basename(tex).lower()
            image    = f"/assets/materials/{mat_name}" if mat_name else None

            prev = existing.get(key) or {}
            mats[key] = {
                "id":        key,
                "names":     _make_names(locs, key, es_fallback=key),
                "image":     image,
                "sellPrice": prev.get("sellPrice"),
                "buyPrice":  value if value > 0 else None,
            }
        except Exception:
            pass

    sorted_mats = sorted(mats.values(), key=lambda m: m["id"])

    lines = [
        "// Materiales de crafteo de Descent: Legends of the Dark",
        "// Generado automáticamente por extract.py — no editar manualmente",
        "",
        "export const MATERIALS = " + json.dumps(sorted_mats, ensure_ascii=False, indent=2) + ";",
        "",
        "export const MATERIALS_BY_ID = Object.fromEntries(MATERIALS.map(m => [m.id, m]));",
    ]

    out_path = os.path.join(planner_dir, "src", "gamedata", "materials.js")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"  ✓ materials.js → {len(sorted_mats)} materiales")

# ──────────────────────────────────────────────────────────────────────────────
# Generación de items.js (armaduras, consumibles, amuletos)
# ──────────────────────────────────────────────────────────────────────────────

def _strip_armor_header(raw):
    """Elimina la línea de cabecera <b>Carta de Armadura—...</b> del desc de armadura."""
    if not raw:
        return ''
    lines = raw.split('\n')
    result = []
    header_done = False
    for line in lines:
        s = line.strip()
        if not header_done and re.search(r'<b>', s):
            header_done = True
            continue
        if s:
            result.append(s)
    return ' '.join(result).strip()

def generate_items_js(env, locs, planner_dir):
    """Genera src/gamedata/items.js"""
    armors      = {}
    consumables = {}
    trinkets    = {}

    ITEM_CATEGORIES = [
        ("assets/d3/armor/",       armors,      "armor",      "armor"),
        ("assets/d3/consumables/", consumables, "consumables","consumable"),
        ("assets/d3/trinkets/",    trinkets,    "trinkets",   "trinket"),
    ]

    for container_path, obj in env.container.items():
        if not (container_path.endswith(".asset") and obj.type.name == "MonoBehaviour"):
            continue

        for prefix, target_dict, folder, item_type in ITEM_CATEGORIES:
            if not container_path.startswith(prefix):
                continue
            try:
                d = obj.read()
                raw_bid  = str(getattr(d, "BaseItemId", "") or "")
                key      = str(getattr(d, "KeyName", "") or "")
                is_upg   = int(getattr(d, "IsUpgrade", 0) or 0)
                tex      = str(getattr(d, "TextureAssetPath", "") or "")
                val      = int(getattr(d, "Value", 0) or 0)

                # El objeto BASE real (el que representa el ítem tal y como
                # aparece en catálogo/inventario) tiene IsUpgrade=0 y, en estos
                # assets, el campo BaseItemId vacío — su identidad real está en
                # KeyName (p.ej. KeyName="ARMOR_1", BaseItemId=""). Los objetos
                # con IsUpgrade=1 (la receta "_PLUS" y la definición "_UPGRADED")
                # SÍ llevan BaseItemId relleno, pero no son el ítem base: si no
                # se descartan aquí, pisan al ítem base con su propio Value
                # (p.ej. 1200 de la definición "+") sin que ese Value sea un
                # precio de tienda real.
                if is_upg:
                    continue
                bid = raw_bid or key
                if not bid:
                    continue

                name_key   = key if key else bid
                image_name = os.path.basename(tex).lower() if tex else None
                image      = f"/assets/{folder}/{image_name}" if image_name else None

                # buyPrice = Value real del objeto base (varía: 200 en la
                # mayoría de armaduras, 600 en las pesadas; 200 en amuletos;
                # 0→sin precio en consumibles). No hay ningún campo de
                # "precio de venta" independiente en estos assets.
                buy_price  = val if val > 0 else None
                sell_price = None

                target_dict[bid] = {
                    "id":        bid,
                    "type":      item_type,
                    "names":     _make_names(locs, name_key, bid, es_fallback=bid),
                    "image":     image,
                    "buyPrice":  buy_price,
                    "sellPrice": sell_price,
                }
            except Exception:
                pass
            break

    # ── Post-proceso: añadir campos adicionales desde localización ─────────────
    loc_es = locs.get("es", {})
    armor_type_map = {"Pesada": "heavy", "Mediana": "medium", "Ligera": "light"}
    csm_type_map   = {"Común": "common", "Limitado": "limited", "Especial": "special"}

    for armor in armors.values():
        aid = armor["id"]
        base_key = f"{aid}_DESC"
        up_key   = f"{aid}_UPGRADED_DESC"
        # Tipo de armadura (pesada/mediana/ligera) desde la cabecera ES
        desc_es = loc_es.get(up_key, "") or loc_es.get(base_key, "")
        m = re.search(r'Armadura—(\w+)', desc_es)
        armor["armorType"] = armor_type_map.get(m.group(1) if m else "", None)
        # Descripciones de habilidad para todos los idiomas
        base_descs = {}
        up_descs   = {}
        for lang in LANGS:
            loc = locs.get(lang, {})
            b = _strip_armor_header(loc.get(base_key, ""))
            u = _strip_armor_header(loc.get(up_key, ""))
            if b: base_descs[lang] = b
            if u: up_descs[lang]   = u
        if base_descs:
            armor["baseAbilityDescs"] = base_descs
        if up_descs:
            armor["abilityDescs"] = up_descs

    for csm in consumables.values():
        desc = loc_es.get(f"{csm['id']}_UPGRADED_DESC", "") or loc_es.get(f"{csm['id']}_DESC", "")
        m = re.search(r'Consumible—(\w+)', desc)
        csm["consumableType"] = csm_type_map.get(m.group(1) if m else "", None)

    for trinket in trinkets.values():
        base = trinket["id"].replace("_ID", "")  # TRINKET1_ID → TRINKET1
        base_descs = {}
        up_descs   = {}
        for lang in LANGS:
            loc = locs.get(lang, {})
            b = loc.get(f"{base}_ABILITY", "").strip()
            u = loc.get(f"{base}_ABILITY_UPGRADED", "").strip()
            if b: base_descs[lang] = b
            if u: up_descs[lang]   = u
        if base_descs:
            trinket["baseAbilityDescs"] = base_descs
        if up_descs:
            trinket["abilityDescs"] = up_descs

    def sort_id(d):
        # Ordenar numéricamente si el ID acaba en número (ej: ARMOR_1 < ARMOR_2)
        m = re.match(r"^(.+?)_(\d+)$", d["id"])
        return (m.group(1), int(m.group(2))) if m else (d["id"], 0)

    s_armors      = sorted(armors.values(),      key=sort_id)
    s_consumables = sorted(consumables.values(), key=lambda d: d["id"])
    s_trinkets    = sorted(trinkets.values(),    key=sort_id)

    # Construir items.js con las tres secciones
    sections = []
    sections.append("// === ARMADURAS ===")
    sections.append("export const ARMORS = " + json.dumps(s_armors, ensure_ascii=False, indent=2) + ";")
    sections.append("")
    sections.append("export const ARMORS_BY_ID = Object.fromEntries(ARMORS.map(a => [a.id, a]));")
    sections.append("")
    sections.append("// === CONSUMIBLES ===")
    sections.append("export const CONSUMABLES = " + json.dumps(s_consumables, ensure_ascii=False, indent=2) + ";")
    sections.append("")
    sections.append("export const CONSUMABLES_BY_ID = Object.fromEntries(CONSUMABLES.map(c => [c.id, c]));")
    sections.append("")
    sections.append("// === AMULETOS ===")
    sections.append("export const TRINKETS = " + json.dumps(s_trinkets, ensure_ascii=False, indent=2) + ";")
    sections.append("")
    sections.append("export const TRINKETS_BY_ID = Object.fromEntries(TRINKETS.map(t => [t.id, t]));")
    sections.append("")
    sections.append("// Índice global de todos los ítems")
    sections.append("export const ALL_ITEMS = [...ARMORS, ...CONSUMABLES, ...TRINKETS];")
    sections.append("export const ALL_ITEMS_BY_ID = Object.fromEntries(ALL_ITEMS.map(i => [i.id, i]));")

    header = [
        "// Ítems de Descent: Legends of the Dark (armaduras, consumibles, amuletos)",
        "// Generado automáticamente por extract.py — no editar manualmente",
        "",
    ]

    out_path = os.path.join(planner_dir, "src", "gamedata", "items.js")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(header + sections) + "\n")
    print(f"  ✓ items.js → {len(s_armors)} armaduras, {len(s_consumables)} consumibles, {len(s_trinkets)} amuletos")

# ──────────────────────────────────────────────────────────────────────────────
# Generación de recipes.js
# ──────────────────────────────────────────────────────────────────────────────

def _js_to_json(text):
    """
    Convierte un fragmento de array JS a JSON válido:
      - Elimina comentarios //
      - Comillas simples → dobles
      - Claves sin comillas → con comillas  (id: → "id":)
      - Trailing commas eliminadas (incluyendo la final antes del ] añadido externamente)
    """
    # 1. Eliminar comentarios de línea
    text = re.sub(r'//[^\n]*', '', text)
    # 2. Comillas simples → dobles (respeta el contenido)
    text = re.sub(r"'([^'\\]*(?:\\.[^'\\]*)*)'", r'"\1"', text)
    # 3. Añadir comillas a claves JS sin comillas: { key: → { "key":
    text = re.sub(r'(?<=[{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'"\1":', text)
    # 4. Trailing commas dentro de objetos/arrays
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    # 5. Trailing comma al final del texto (antes del ] que añade el llamador)
    text = re.sub(r',\s*$', '', text.strip())
    return text


def _read_existing_js_array(js_path, varname):
    """
    Lee un array JS del tipo `export const VARNAME = [ {...}, ... ];`
    y lo devuelve como lista de dicts. Devuelve [] si no existe o hay error.
    Soporta claves sin comillas y comillas simples (formato JS del backup).
    """
    if not os.path.exists(js_path):
        return []
    try:
        with open(js_path, encoding="utf-8") as f:
            content = f.read()
        m = re.search(rf'export\s+const\s+{re.escape(varname)}\s*=\s*\[(.+?)\];',
                      content, re.DOTALL)
        if not m:
            return []
        text = _js_to_json(m.group(1).strip())
        return json.loads(f"[{text}]")
    except Exception as e:
        print(f"    ⚠ No se pudo leer {varname} de {js_path}: {e}")
        return []


def generate_recipes_js(recipes, base_recipes, planner_dir):
    """
    Genera src/gamedata/recipes.js.

    Estrategia:
    - Recetas de partes de arma: extraídas de Unity (normaliza bids _UPGRADED).
    - Recetas de consumibles, armaduras y amuletos: intentadas desde Unity; si los
      ingredientes no se resuelven (problema de PPtrs cross-bundle), se preserva el
      contenido del recipes.js existente como fallback.
    - Recetas BASE de consumibles (`base_recipes`, IsUpgrade=0): crean el
      consumible desde cero, con su propio coste/ingredientes — no existen
      para armadura ni amuletos, sólo para consumibles.
    """
    weapon_recipes  = []
    csm_recipes     = []
    armor_recipes   = []
    trinket_recipes = []

    for bid, rec in sorted(base_recipes.items()):
        if not rec["ingredients"]:
            continue
        base_entry = {
            "id":          f"RECIPE_{bid}",
            "itemId":      rec["craftedId"] or bid,
            "goldCost":    rec["value"],
            "ingredients": rec["ingredients"],
        }
        if bid.startswith("CSM_"):
            csm_recipes.append(base_entry)
        elif bid.startswith("WEAPON_PART_"):
            # Receta BASE de un accesorio (ranura B/C): crea la pieza desde
            # cero con materiales; la reforja a "+" es la receta de más abajo
            # (IsUpgrade=1). Confirmado en una partida real: ambas conviven
            # como IDs de receta independientes (p.ej. RECIPE_WEAPON_PART_B_
            # BOW_1 y RECIPE_WEAPON_PART_B_BOW_1_UPGRADED). No existe para
            # ranura A (esas piezas sólo se encuentran, nunca se craftean
            # desde cero).
            weapon_recipes.append(base_entry)

    for bid, rec in sorted(recipes.items()):
        # Normalizar bid: quitar _UPGRADED para el routing
        normalized = re.sub(r"_UPGRADED$", "", bid)

        # ── Partes de arma ──────────────────────────────────────────────────────
        info = parse_weapon_part_id(normalized)
        is_special = normalized in SPECIAL_WEAPON_PARTS
        if ((info and not info["upgraded"]) or is_special) and rec["ingredients"]:
            # ID de la receta: comprobado contra una partida real
            # (AvailableRecipeIds/DiscoveredRecipes) — el juego identifica
            # esta receta como RECIPE_<pieza>_UPGRADED, con el sufijo, no como
            # RECIPE_<pieza> a secas (ese id sin sufijo es el de la receta que
            # crea la pieza base desde cero, cuando existe — ver base_recipes
            # más arriba). BaseRecipeId en el propio objeto Unity apunta a la
            # receta requisito (la base), no a esta receta, así que no sirve
            # para nombrarla.
            recipe_id = f"RECIPE_{normalized}_UPGRADED"
            # itemId: lo que produce la receta (siempre la versión _UPGRADED)
            item_id = rec["craftedId"] or f"{normalized}_UPGRADED"
            # goldCost: coste real (Value) de la receta. Antes se forzaba a 150
            # si Value<=0, pero Value SIEMPRE está informado en las recetas de
            # partes de arma (150, 250 o 300 según la pieza) — ya no hace falta
            # (y no debía) aplicar ningún valor por defecto aquí.
            weapon_recipes.append({
                "id":          recipe_id,
                "itemId":      item_id,
                "goldCost":    rec["value"],
                "ingredients": rec["ingredients"],
            })
            continue

        if not rec["ingredients"]:
            continue  # Sin ingredientes resueltos → no podemos generar esta receta

        # ID de receta: para consumibles/armadura/amuletos el KeyName del
        # objeto-receta lleva el sufijo "_PLUS" (p.ej. "ARMOR_1_PLUS") y ASÍ
        # es como el save real identifica esta receta en AvailableRecipeIds/
        # DiscoveredRecipes (comprobado contra una partida real: 'RECIPE_
        # ARMOR_1_PLUS', no 'RECIPE_ARMOR_1'). Antes se usaba `bid` a secas
        # (sin "_PLUS"), lo que generaba un ID de receta que no correspondía
        # exactamente con el que usa el juego.
        recipe_key = rec["keyName"] or bid
        entry = {
            "id":          f"RECIPE_{recipe_key}",
            "itemId":      rec["craftedId"] or f"{recipe_key}",
            "goldCost":    rec["value"] if rec["value"] > 0 else 150,
            "ingredients": rec["ingredients"],
        }

        # ── Consumibles ─────────────────────────────────────────────────────────
        if bid.startswith("CSM_"):
            csm_recipes.append(entry)
        # ── Armaduras ───────────────────────────────────────────────────────────
        elif re.match(r"ARMOR_\d+", bid):
            armor_recipes.append(entry)
        # ── Amuletos ────────────────────────────────────────────────────────────
        elif bid.startswith("TRINKET"):
            trinket_recipes.append(entry)

    # ── Fallback: preservar recetas no-arma del archivo actual ──────────────────
    out_path = os.path.join(planner_dir, "src", "gamedata", "recipes.js")

    if not csm_recipes:
        fallback = _read_existing_js_array(out_path, "CONSUMABLE_RECIPES")
        if not fallback:
            fallback = _read_existing_js_array(out_path, "CSM_RECIPES")
        if fallback:
            csm_recipes = fallback
            print(f"    ↺ Usando CONSUMABLE_RECIPES del archivo existente ({len(csm_recipes)} recetas)")

    if not armor_recipes:
        fallback = _read_existing_js_array(out_path, "ARMOR_RECIPES")
        if fallback:
            armor_recipes = fallback
            print(f"    ↺ Usando ARMOR_RECIPES del archivo existente ({len(armor_recipes)} recetas)")

    if not trinket_recipes:
        fallback = _read_existing_js_array(out_path, "TRINKET_RECIPES")
        if fallback:
            trinket_recipes = fallback
            print(f"    ↺ Usando TRINKET_RECIPES del archivo existente ({len(trinket_recipes)} recetas)")

    # ── Agrupar recetas de armas por tipo ───────────────────────────────────────
    weapon_by_type = defaultdict(list)
    for r in weapon_recipes:
        m = re.match(r"RECIPE_WEAPON_PART_[ABC]_([A-Z_]+)_\d+", r["id"])
        weapon_by_type[m.group(1) if m else "OTHER"].append(r)

    # ── Construir el archivo ────────────────────────────────────────────────────
    def recipe_lines(rlist):
        return ["  " + json.dumps(r, ensure_ascii=False) + "," for r in rlist]

    lines = [
        "// Recetas de crafteo de Descent: Legends of the Dark",
        "// Generado automáticamente por extract.py — no editar manualmente",
        "",
        "// ============================================================",
        "// RECETAS DE PARTES DE ARMA",
        "// ============================================================",
        "export const WEAPON_PART_RECIPES = [",
    ]
    for wtype in sorted(weapon_by_type.keys()):
        lines.append(f"  // === {wtype} ===")
        lines.extend(recipe_lines(weapon_by_type[wtype]))
    lines += ["];", ""]

    if csm_recipes:
        lines += [
            "// ============================================================",
            "// RECETAS DE CONSUMIBLES",
            "// ============================================================",
            "export const CONSUMABLE_RECIPES = [",
            *recipe_lines(csm_recipes),
            "];", "",
        ]

    if armor_recipes:
        lines += [
            "// ============================================================",
            "// RECETAS DE ARMADURAS",
            "// ============================================================",
            "export const ARMOR_RECIPES = [",
            *recipe_lines(armor_recipes),
            "];", "",
        ]

    if trinket_recipes:
        lines += [
            "// ============================================================",
            "// RECETAS DE AMULETOS",
            "// ============================================================",
            "export const TRINKET_RECIPES = [",
            *recipe_lines(trinket_recipes),
            "];", "",
        ]

    lines += ["export const ALL_RECIPES = [", "  ...WEAPON_PART_RECIPES,"]
    if csm_recipes:
        lines.append("  ...CONSUMABLE_RECIPES,")
    if armor_recipes:
        lines.append("  ...ARMOR_RECIPES,")
    if trinket_recipes:
        lines.append("  ...TRINKET_RECIPES,")
    lines += [
        "];",
        "export const ALL_RECIPES_BY_ID = Object.fromEntries(ALL_RECIPES.map(r => [r.id, r]));",
        "export const RECIPES_BY_ID = ALL_RECIPES_BY_ID;",
    ]

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    total_non_weapon = len(csm_recipes) + len(armor_recipes) + len(trinket_recipes)
    print(f"  ✓ recipes.js → {len(weapon_recipes)} partes de arma, "
          f"{len(csm_recipes)} consumibles, {len(armor_recipes)} armaduras, "
          f"{len(trinket_recipes)} amuletos")
    print(f"  ✓ recipes.js → {len(weapon_recipes)} recetas de armas, {len(csm_recipes)} consumibles")

# ──────────────────────────────────────────────────────────────────────────────
# Generación de descriptions.js
# ──────────────────────────────────────────────────────────────────────────────

def generate_descriptions_js(locs, planner_dir):
    """Genera descriptions.js (ES, glosario de términos del juego).

    Nota: weaponAbilityDescs.js (y weaponPartDescs.js / weaponAbilities.js)
    ya NO se generan aquí por escaneo bruto de claves de localización — eso
    mezclaba en un único diccionario plano tanto activaciones genéricas
    (isPartA=1) como habilidades nombradas (isPartA=0), sin ninguna forma de
    saber a qué parte de arma concreta pertenecía cada una. Ahora se generan
    en generate_weapon_ability_files(), a partir del PPtr `Ability` real de
    cada parte (ver scan_items).
    """
    loc_es = locs.get("es", {})

    # ── descriptions.js (solo ES, todas las claves _DESC) ─────────────────────
    descs = {}
    for key, val in loc_es.items():
        if key.endswith("_DESC") and val:
            descs[key[:-5]] = val

    lines = [
        "// Descripciones en español de los ítems del juego",
        "// Generado automáticamente por extract.py — no editar manualmente",
        "",
        "export const DESCRIPTIONS = " + json.dumps(descs, ensure_ascii=False, indent=2) + ";",
    ]
    out_path = os.path.join(planner_dir, "src", "gamedata", "descriptions.js")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"  ✓ descriptions.js → {len(descs)} descripciones")

# ──────────────────────────────────────────────────────────────────────────────
# Extracción de iconos desde atlas SDF de TextMeshPro
# ──────────────────────────────────────────────────────────────────────────────

# Coordenadas (left, top, right, bottom) de cada glifo en el atlas SDF de 1024×1024.
# El atlas es: game-resources/raw/textures/misc/tex_-1595345317157056104.png
# Para actualizar una caja: python extract.py --dump-atlas  → abre el atlas con las cajas dibujadas
# Usa Pillow/ImageDraw para inspeccionar: imagen.show()
SDF_ICON_BOXES = {
    # Nombre fichero (sin .png) : (left, top, right, bottom) en el atlas 1024×1024
    # Coordenadas extraídas del D3 Calibri SDF font asset (UnityPy m_GlyphTable)
    # Todos los glifos son caracteres PUA del juego (U+F5D0..U+F5E8)
    "Icon_Health":    (978, 627, 1011, 660),   # U+F5D0 — Vida
    "Icon_Advantage": (750, 830,  785, 865),   # U+F5DE — Ventaja
    "Icon_Surge":     (340, 675,  372, 712),   # U+F5E1 — Incremento
    "Icon_Upgrade":   (905, 937,  942, 970),   # U+F5E2 — Mejora (objeto mejorado)
    "Icon_Fatigue":   (823,  94,  846, 130),   # U+F5E3 — Fatiga
    "Icon_Action":    (428, 590,  460, 625),   # U+F5E4 — Acción especial
    "Icon_Damage":    (935, 878,  971, 913),   # U+F5E5 — Daño
    "Icon_Success":   (567, 935,  604, 970),   # U+F5E8 — Éxito
}

# Color dorado en RGB — debe coincidir con --color-gold del CSS
SDF_ICON_COLOR   = (200, 154, 60)
# Umbral SDF: valor normalizado [0-1] por encima del cual el píxel está "dentro" del glifo
SDF_THRESHOLD    = 0.55
# Suavidad del borde (en unidades [0-1])
SDF_SOFTNESS     = 0.12
# Tamaño de salida en píxeles
SDF_OUTPUT_SIZE  = 128

# Ruta relativa al atlas SDF desde el directorio descent-planner/
SDF_ATLAS_RELPATH = os.path.join(
    "..", "game-resources", "raw", "textures", "misc",
    "tex_-1595345317157056104.png"
)


def _sdf_to_icon(atlas_img, bbox, size=SDF_OUTPUT_SIZE,
                 color=SDF_ICON_COLOR, threshold=SDF_THRESHOLD, softness=SDF_SOFTNESS):
    """Extrae y renderiza un icono desde un atlas SDF de TextMeshPro.

    Preserva el aspect ratio del glifo original (sin deformar) y lo centra
    en un canvas cuadrado transparente de 'size' píxeles.
    """
    from PIL import Image

    bw = bbox[2] - bbox[0]
    bh = bbox[3] - bbox[1]

    # Escalar manteniendo aspect ratio con margen del 5%
    scale = min(size / bw, size / bh) * 0.90
    new_w = max(1, int(bw * scale))
    new_h = max(1, int(bh * scale))

    crop = atlas_img.crop(bbox).resize((new_w, new_h), Image.LANCZOS)

    _, _, _, a_ch = crop.split()
    sdf_vals = list(a_ch.getdata())

    lo   = threshold - softness
    hi   = threshold + softness
    span = hi - lo if hi > lo else 1e-6

    out_alpha = []
    for raw in sdf_vals:
        v = raw / 255.0
        t = max(0.0, min(1.0, (v - lo) / span))
        out_alpha.append(int(t * t * (3.0 - 2.0 * t) * 255))

    rendered = Image.new("RGBA", (new_w, new_h), (color[0], color[1], color[2], 0))
    rendered.putalpha(Image.frombytes("L", (new_w, new_h), bytes(out_alpha)))

    # Centrar en canvas cuadrado transparente
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox = (size - new_w) // 2
    oy = (size - new_h) // 2
    canvas.paste(rendered, (ox, oy))
    return canvas


def extract_sdf_icons(planner_dir, overwrite=False):
    """Extrae los iconos de términos del juego del atlas SDF y los guarda en public/assets/icons/."""
    try:
        from PIL import Image
    except ImportError:
        print("  ✗ Pillow no disponible — saltando extracción de iconos SDF")
        return

    atlas_path = os.path.join(planner_dir, SDF_ATLAS_RELPATH)
    if not os.path.isfile(atlas_path):
        print(f"  ✗ Atlas SDF no encontrado: {atlas_path}")
        print("     Ejecuta primero: python game-resources/extract_all.py")
        return

    icons_dir = os.path.join(planner_dir, "public", "assets", "icons")
    os.makedirs(icons_dir, exist_ok=True)

    atlas = Image.open(atlas_path).convert("RGBA")
    extracted = 0
    skipped   = 0

    for name, bbox in SDF_ICON_BOXES.items():
        out_path = os.path.join(icons_dir, f"{name}.png")
        if not overwrite and os.path.isfile(out_path):
            skipped += 1
            continue
        try:
            icon = _sdf_to_icon(atlas, bbox)
            icon.save(out_path)
            extracted += 1
        except Exception as e:
            print(f"    ✗ Error extrayendo {name}: {e}")

    print(f"  ✓ Iconos SDF: {extracted} extraídos, {skipped} ya existían")
    # También copiar a game-resources/raw/icons/ para revisión
    review_dir = os.path.join(planner_dir, "..", "game-resources", "raw", "icons")
    if os.path.isdir(review_dir):
        for name in SDF_ICON_BOXES:
            src = os.path.join(icons_dir, f"{name}.png")
            if os.path.isfile(src):
                import shutil as _shutil
                _shutil.copy2(src, os.path.join(review_dir, f"{name}.png"))


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Extractor de recursos — Descent: Legends of the Dark")
    parser.add_argument("--game-path",   help="Ruta a la instalación del juego")
    parser.add_argument("--no-images",   action="store_true", help="No extraer imágenes (sólo regenerar JS)")
    parser.add_argument("--overwrite",   action="store_true", help="Sobreescribir imágenes existentes")
    parser.add_argument("--no-sdf-icons",action="store_true", help="No regenerar iconos SDF del atlas de fuentes")
    args = parser.parse_args()

    # Ruta del juego
    game_path = args.game_path or find_game_path()
    bundle_dir = os.path.join(game_path, BUNDLE_SUBPATH)

    if not os.path.isdir(bundle_dir):
        print(f"ERROR: No se encontró la carpeta de bundles en:\n  {bundle_dir}")
        sys.exit(1)

    # Ruta de descent-planner (directorio del script)
    planner_dir = os.path.dirname(os.path.abspath(__file__))

    print(f"\n{'='*60}")
    print(f"  Descent: Legends of the Dark — Extractor de recursos")
    print(f"{'='*60}")
    print(f"  Juego:    {game_path}")
    print(f"  Planner:  {planner_dir}")
    print(f"  Idiomas:  {', '.join(LANGS)}")
    print(f"{'='*60}\n")

    # ── 1. Localización (todos los idiomas) ──────────────────────────────────
    print("[1/5] Cargando localización...")

    locs = {}
    for lang in LANGS:
        bundle = find_localization_bundle(bundle_dir, lang)
        if bundle:
            locs[lang] = parse_localization(bundle)
            print(f"  ✓ {lang.upper()}: {len(locs[lang])} entradas")
        else:
            locs[lang] = {}
            print(f"  ✗ {lang.upper()}: bundle no encontrado")

    if not any(locs.values()):
        print("  ✗ No se encontró ningún bundle de localización")
        sys.exit(1)

    # ── 2. Cargar bundles ────────────────────────────────────────────────────
    print("\n[2/5] Cargando bundles de Unity...")
    env = load_env(bundle_dir)

    # ── 3. Escanear ítems ────────────────────────────────────────────────────
    print("\n[3/5] Escaneando datos de ítems...")
    item_defs, recipes, base_recipes, base_item_defs, _mat_map, ability_by_key = scan_items(env)

    # ── 4. Extraer imágenes ──────────────────────────────────────────────────
    if not args.no_images:
        print("\n[4/7] Extrayendo imágenes...")
        extract_images(env, planner_dir, overwrite=args.overwrite)
    else:
        print("\n[4/7] Extracción de imágenes omitida (--no-images)")

    # ── 5. Generar JS ────────────────────────────────────────────────────────
    print("\n[5/7] Generando archivos JS...")
    generate_weapon_parts_js(item_defs, base_item_defs, recipes, locs, planner_dir)
    generate_weapon_ability_files(item_defs, ability_by_key, locs, planner_dir)
    generate_materials_js(env, locs, planner_dir)
    generate_items_js(env, locs, planner_dir)
    generate_recipes_js(recipes, base_recipes, planner_dir)
    generate_descriptions_js(locs, planner_dir)

    # ── 6. Iconos SDF ────────────────────────────────────────────────────────
    if not args.no_sdf_icons:
        print("\n[6/7] Extrayendo iconos SDF del atlas de fuentes...")
        extract_sdf_icons(planner_dir, overwrite=args.overwrite)
    else:
        print("\n[6/7] Extracción de iconos SDF omitida (--no-sdf-icons)")

    # ── 7. Iconos adicionales (UI + daño + label frame) ─────────────────────
    print("\n[7/7] Extrayendo iconos adicionales...")
    extract_ui_icons(env, planner_dir, overwrite=args.overwrite)

    print(f"\n{'='*60}")
    print("  ¡Extracción completada!")
    print("  Ahora ejecuta:  npm run dev")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
