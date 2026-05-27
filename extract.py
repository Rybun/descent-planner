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
    Formato: KEY,Text,,Valor\n
    Devuelve dict {key: value}.
    """
    with open(bundle_path, "rb") as f:
        raw = f.read()

    loc = {}
    # Patrón: cualquier cosa hasta ',Text,,' y luego el valor hasta '\n'
    # Usamos regex sobre los bytes decodificados con errors='replace'
    text = raw.decode("utf-8", errors="replace")
    for m in re.finditer(r'^([A-Z0-9_]+),Text,,([^\n\r]*)', text, re.MULTILINE):
        key = m.group(1)
        val = m.group(2).strip()
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
      items   – dict {base_item_id: {...}}  para ítems base
      recipes – dict {base_item_id: {...}}  para recetas (IsUpgrade=1)
    """
    items   = {}
    recipes = {}

    # Mapa path_id → MAT_ID para resolver ingredientes de recetas
    mat_map = {}

    # Primera pasada: recopilar materiales (KeyName = MAT_*)
    for obj in env.objects:
        if obj.type.name != "MonoBehaviour":
            continue
        try:
            d = obj.read()
            key = getattr(d, "KeyName", None)
            if key and str(key).startswith("MAT_") and not str(key).endswith("_DESC"):
                mat_map[obj.path_id] = str(key)
        except Exception:
            pass

    # Segunda pasada: recopilar ítems y recetas
    for obj in env.objects:
        if obj.type.name != "MonoBehaviour":
            continue
        try:
            d = obj.read()
            bid = getattr(d, "BaseItemId", None)
            if not bid:
                continue
            bid = str(bid)

            is_upgrade  = int(getattr(d, "IsUpgrade", 0))
            key_name    = str(getattr(d, "KeyName", "") or "")
            key_desc    = str(getattr(d, "KeyDescription", "") or "")
            tex_path    = str(getattr(d, "TextureAssetPath", "") or "")
            value       = int(getattr(d, "Value", 0) or 0)
            crafted_id  = str(getattr(d, "CraftedItemId", "") or "")

            # Resolver ingredientes si es receta
            ingredients = {}
            if is_upgrade:
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

            entry = {
                "baseItemId":  bid,
                "craftedId":   crafted_id,
                "keyName":     key_name,
                "keyDesc":     key_desc,
                "texPath":     tex_path,
                "value":       value,
                "isUpgrade":   is_upgrade,
                "ingredients": ingredients,
            }

            if is_upgrade:
                recipes[bid] = entry
            else:
                items[bid] = entry

        except Exception:
            pass

    print(f"  ✓ {len(items)} ítems base, {len(recipes)} recetas encontradas")
    return items, recipes, mat_map

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

def generate_weapon_parts_js(items, recipes, loc_es, loc_en, planner_dir):
    """Genera src/gamedata/weaponParts.js"""
    parts = {}  # id → part dict

    # Recopilar todos los tipos de arma y slots de las recetas.
    # En Unity, algunas armas almacenan el BaseItemId de la receta con sufijo _UPGRADED
    # (p.ej. "WEAPON_PART_A_BOW_1_UPGRADED") y otras sin él ("WEAPON_PART_A_CROSSBOW_1").
    # Normalizamos siempre quitando el sufijo para obtener el tipo de arma correcto.
    weapon_types = set()
    for bid, rec in recipes.items():
        normalized = re.sub(r"_UPGRADED$", "", bid)
        info = parse_weapon_part_id(normalized)
        if info:
            weapon_types.add((info["wtype"], info["slot"]))

    # Crear ítem nivel 0 (base sin imagen) para cada tipo×slot
    for wtype, slot in sorted(weapon_types):
        pid = f"WEAPON_PART_{slot}_{wtype}_0"
        if pid not in parts:
            parts[pid] = {
                "id":         pid,
                "slot":       slot,
                "weaponType": wtype,
                "level":      0,
                "name":       loc_es.get(pid, f"{wtype.replace('_',' ').title()} {slot}0"),
                "nameEn":     loc_en.get(pid, ""),
                "weaponId":   WEAPON_TYPE_TO_ID.get(wtype, f"WEAPON_{wtype}"),
                "image":      None,
                "buyPrice":   None,
                "sellPrice":  None,
            }

    # Crear ítems de nivel 1-5 a partir de las recetas.
    # Normalizamos el bid quitando el sufijo _UPGRADED para obtener siempre el pid base.
    for bid, rec in sorted(recipes.items()):
        # Normalizar: si bid termina en _UPGRADED, el pid base es sin el sufijo
        normalized = re.sub(r"_UPGRADED$", "", bid)
        info = parse_weapon_part_id(normalized)
        if not info or info["upgraded"]:
            continue  # no es una parte de arma válida

        pid   = normalized          # ID de la parte base (sin _UPGRADED)
        wtype = info["wtype"]
        slot  = info["slot"]
        level = info["level"]

        # Nombre: usar KeyName de la receta, que apunta al nombre del ítem base
        name_key   = rec["keyName"].replace("_UPGRADED", "") if rec["keyName"] else pid
        desc_key   = rec["keyDesc"].replace("_UPGRADED_DESC","_DESC") if rec["keyDesc"] else ""

        # Imagen: buscar imagen a partir del ID (weapon_type, slot, level) en el filesystem.
        # Usamos el disco en lugar de texPath porque la receta apunta a la textura del ítem
        # craftado (con '+') y puede estar en orden diferente al del item base.
        image = _find_weapon_part_image(wtype, slot.lower(), level, planner_dir)

        # Precio de venta: Value es precio de compra de receta (150 gold craft cost)
        # El ítem en sí tiene Value del juego — usar del ítem base si existe
        sell_price = None
        buy_price  = None

        parts[pid] = {
            "id":         pid,
            "slot":       slot,
            "weaponType": wtype,
            "level":      level,
            "name":       loc_es.get(name_key, loc_es.get(pid, pid)),
            "nameEn":     loc_en.get(name_key, loc_en.get(pid, "")),
            "weaponId":   WEAPON_TYPE_TO_ID.get(wtype, f"WEAPON_{wtype}"),
            "image":      image,
            "buyPrice":   buy_price,
            "sellPrice":  sell_price,
        }

        # También crear la versión UPGRADED
        uid = f"{pid}_UPGRADED"
        crafted_id = rec.get("craftedId", uid)
        parts[uid] = {
            "id":         uid,
            "slot":       slot,
            "weaponType": wtype,
            "level":      level,
            "name":       loc_es.get(rec["keyName"], loc_es.get(pid, pid)) + " ✦" if rec["keyName"] else parts[pid]["name"] + " ✦",
            "nameEn":     loc_en.get(rec["keyName"], loc_en.get(pid, "")) + " ✦" if rec["keyName"] else parts[pid]["nameEn"] + " ✦",
            "weaponId":   WEAPON_TYPE_TO_ID.get(wtype, f"WEAPON_{wtype}"),
            "image":      image,  # misma imagen que la base
            "buyPrice":   None,
            "sellPrice":  None,
        }

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
# Generación de materials.js
# ──────────────────────────────────────────────────────────────────────────────

def generate_materials_js(env, loc_es, loc_en, planner_dir):
    """Genera src/gamedata/materials.js"""
    mats = {}

    for container_path, obj in env.container.items():
        if not (container_path.startswith("assets/d3/crafting materials/") and
                container_path.endswith(".asset") and
                obj.type.name == "MonoBehaviour"):
            continue
        try:
            d = obj.read()
            key = str(getattr(d, "KeyName", "") or "")
            tex = str(getattr(d, "TextureAssetPath", "") or "")
            if not key or not key.startswith("MAT_"):
                continue

            mat_name = os.path.basename(tex).lower()
            image    = f"/assets/materials/{mat_name}" if mat_name else None

            mats[key] = {
                "id":        key,
                "name":      loc_es.get(key, key),
                "nameEn":    loc_en.get(key, ""),
                "image":     image,
                "sellPrice": None,
                "buyPrice":  None,
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

def generate_items_js(env, loc_es, loc_en, planner_dir):
    """Genera src/gamedata/items.js"""
    armors      = {}
    consumables = {}
    trinkets    = {}

    ITEM_CATEGORIES = [
        ("assets/d3/armor/",       armors,      "armor"),
        ("assets/d3/consumables/", consumables, "consumables"),
        ("assets/d3/trinkets/",    trinkets,    "trinkets"),
    ]

    for container_path, obj in env.container.items():
        if not (container_path.endswith(".asset") and obj.type.name == "MonoBehaviour"):
            continue

        for prefix, target_dict, folder in ITEM_CATEGORIES:
            if not container_path.startswith(prefix):
                continue
            try:
                d = obj.read()
                bid = str(getattr(d, "BaseItemId", "") or "")
                key = str(getattr(d, "KeyName", "") or "")
                tex = str(getattr(d, "TextureAssetPath", "") or "")
                val = int(getattr(d, "Value", 0) or 0)

                if not bid:
                    continue

                name_key   = key if key else bid
                image_name = os.path.basename(tex).lower() if tex else None
                image      = f"/assets/{folder}/{image_name}" if image_name else None

                buy_price  = val if val > 0 else None
                sell_price = (val // 2) if val > 0 else None

                target_dict[bid] = {
                    "id":        bid,
                    "name":      loc_es.get(name_key, loc_es.get(bid, bid)),
                    "nameEn":    loc_en.get(name_key, loc_en.get(bid, "")),
                    "image":     image,
                    "buyPrice":  buy_price,
                    "sellPrice": sell_price,
                }
            except Exception:
                pass
            break

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


def generate_recipes_js(recipes, planner_dir):
    """
    Genera src/gamedata/recipes.js.

    Estrategia:
    - Recetas de partes de arma: extraídas de Unity (normaliza bids _UPGRADED).
    - Recetas de consumibles, armaduras y amuletos: intentadas desde Unity; si los
      ingredientes no se resuelven (problema de PPtrs cross-bundle), se preserva el
      contenido del recipes.js existente como fallback.
    """
    weapon_recipes  = []
    csm_recipes     = []
    armor_recipes   = []
    trinket_recipes = []

    for bid, rec in sorted(recipes.items()):
        # Normalizar bid: quitar _UPGRADED para el routing
        normalized = re.sub(r"_UPGRADED$", "", bid)

        # ── Partes de arma ──────────────────────────────────────────────────────
        info = parse_weapon_part_id(normalized)
        if info and not info["upgraded"] and rec["ingredients"]:
            # ID de la receta: usar el bid original tal cual viene de Unity
            recipe_id = f"RECIPE_{bid}" if not bid.startswith("RECIPE_") else bid
            # itemId: lo que produce la receta (siempre la versión _UPGRADED)
            item_id = rec["craftedId"] or f"{normalized}_UPGRADED"
            weapon_recipes.append({
                "id":          recipe_id,
                "itemId":      item_id,
                "goldCost":    rec["value"] if rec["value"] > 0 else 150,
                "ingredients": rec["ingredients"],
            })
            continue

        if not rec["ingredients"]:
            continue  # Sin ingredientes resueltos → no podemos generar esta receta

        entry = {
            "id":          f"RECIPE_{bid}" if not bid.startswith("RECIPE_") else bid,
            "itemId":      rec["craftedId"] or f"{bid}_UPGRADED",
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

def generate_descriptions_js(loc_es, planner_dir):
    """Genera src/gamedata/descriptions.js con todas las descripciones en ES."""
    # Filtrar sólo claves de descripción (_DESC suffix)
    descs = {}
    for key, val in loc_es.items():
        if key.endswith("_DESC") and val:
            # Quitar el sufijo _DESC para que coincida con el ID del ítem
            item_key = key[:-5]
            descs[item_key] = val

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
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Extractor de recursos — Descent: Legends of the Dark")
    parser.add_argument("--game-path",  help="Ruta a la instalación del juego")
    parser.add_argument("--lang",       default="es", choices=["es", "en", "fr", "it", "pt"], help="Idioma de localización (defecto: es)")
    parser.add_argument("--no-images",  action="store_true", help="No extraer imágenes (sólo regenerar JS)")
    parser.add_argument("--overwrite",  action="store_true", help="Sobreescribir imágenes existentes")
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
    print(f"  Idioma:   {args.lang}")
    print(f"{'='*60}\n")

    # ── 1. Localización ──────────────────────────────────────────────────────
    print("[1/5] Cargando localización...")

    loc_bundle_es = find_localization_bundle(bundle_dir, "es")
    loc_bundle_en = find_localization_bundle(bundle_dir, "en")

    if not loc_bundle_es and not loc_bundle_en:
        print("  ✗ No se encontró bundle de localización")
        sys.exit(1)

    loc_bundle = loc_bundle_es or loc_bundle_en
    loc_primary = parse_localization(loc_bundle)

    if args.lang == "en" and loc_bundle_en:
        loc_primary = parse_localization(loc_bundle_en)
        loc_en_data = loc_primary
    else:
        loc_en_data = parse_localization(loc_bundle_en) if loc_bundle_en else {}

    loc_es_data = loc_primary if args.lang == "es" else (parse_localization(loc_bundle_es) if loc_bundle_es else {})

    print(f"  ✓ ES: {len(loc_es_data)} entradas | EN: {len(loc_en_data)} entradas")

    # ── 2. Cargar bundles ────────────────────────────────────────────────────
    print("\n[2/5] Cargando bundles de Unity...")
    env = load_env(bundle_dir)

    # ── 3. Escanear ítems ────────────────────────────────────────────────────
    print("\n[3/5] Escaneando datos de ítems...")
    items, recipes, _mat_map = scan_items(env)

    # ── 4. Extraer imágenes ──────────────────────────────────────────────────
    if not args.no_images:
        print("\n[4/5] Extrayendo imágenes...")
        extract_images(env, planner_dir, overwrite=args.overwrite)
    else:
        print("\n[4/5] Extracción de imágenes omitida (--no-images)")

    # ── 5. Generar JS ────────────────────────────────────────────────────────
    print("\n[5/5] Generando archivos JS...")
    generate_weapon_parts_js(items, recipes, loc_es_data, loc_en_data, planner_dir)
    generate_materials_js(env, loc_es_data, loc_en_data, planner_dir)
    generate_items_js(env, loc_es_data, loc_en_data, planner_dir)
    generate_recipes_js(recipes, planner_dir)
    generate_descriptions_js(loc_es_data, planner_dir)

    print(f"\n{'='*60}")
    print("  ¡Extracción completada!")
    print("  Ahora ejecuta:  npm run dev")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
