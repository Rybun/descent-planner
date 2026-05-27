#!/usr/bin/env python3
"""
Migra los archivos gamedata JS de formato name/nameEn a names: {es, en, fr, it, pt}.
Solo necesita ejecutarse una vez sobre los archivos actuales.
"""
import re, os, json

GAMEDATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "gamedata")
FILES_TO_MIGRATE = ["materials.js", "weaponParts.js", "items.js"]

# Captura: "name": "...", (newline+indent) "nameEn": "..."
# Maneja caracteres escapados dentro de strings JSON
STR_VAL = r'"((?:[^"\\]|\\.)*)"'
PATTERN = re.compile(
    rf'"name":\s*{STR_VAL},\s*\n(\s*)"nameEn":\s*{STR_VAL}',
    re.MULTILINE
)


def replacer(m):
    name_es = m.group(1)
    name_en = m.group(3)
    # Build the names object on a single line (json.dumps output is compact here)
    names = {"es": name_es, "en": name_en, "fr": "", "it": "", "pt": ""}
    return f'"names": {json.dumps(names, ensure_ascii=False)}'


def migrate_file(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()

    count = len(PATTERN.findall(content))
    if count == 0:
        # Check if already migrated
        if '"names"' in content:
            print(f"  ✓ {os.path.basename(path)} ya migrado")
        else:
            print(f"  ✗ {os.path.basename(path)} — sin coincidencias, revisar manualmente")
        return

    new_content = PATTERN.sub(replacer, content)

    # Backup
    bak_path = path + ".bak"
    with open(bak_path, "w", encoding="utf-8") as f:
        f.write(content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"  ✓ {os.path.basename(path)} — {count} ítems migrados (backup en .bak)")


def add_type_field_to_items(path):
    """
    items.js tiene tres secciones (ARMORS, CONSUMABLES, TRINKETS) sin campo 'type'.
    Lo añade para que ShopPanel pueda identificar cada categoría.
    """
    with open(path, encoding="utf-8") as f:
        content = f.read()

    if '"type":' in content:
        print(f"  ✓ items.js — campo type ya existe")
        return

    # Añadir "type": "armor" a cada entrada de ARMORS
    # El JSON generado por json.dumps tiene "id": "ARMOR_..." como primer campo
    # Estrategia: después de "id": "ARMOR_...", añadir el tipo

    def add_type(match):
        bid = match.group(1)
        if bid.startswith("ARMOR_"):
            t = "armor"
        elif bid.startswith("CSM_"):
            t = "consumable"
        elif bid.startswith("TRINKET"):
            t = "trinket"
        else:
            return match.group(0)  # sin cambio
        # Insertar antes del cierre del primer campo
        return f'"id": "{bid}",\n    "type": "{t}"'

    new_content = re.sub(r'"id":\s*"([^"]+)"', add_type, content)

    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  ✓ items.js — campo type añadido")
    else:
        print(f"  ✗ items.js — no se pudo añadir type")


print("Migración gamedata: name/nameEn → names")
print("="*50)

for fname in FILES_TO_MIGRATE:
    fpath = os.path.join(GAMEDATA_DIR, fname)
    if os.path.exists(fpath):
        migrate_file(fpath)
    else:
        print(f"  ✗ No encontrado: {fname}")

# Añadir campo type a items.js
items_path = os.path.join(GAMEDATA_DIR, "items.js")
if os.path.exists(items_path):
    add_type_field_to_items(items_path)

print("\n¡Migración completada!")
print("Archivos .bak creados como respaldo.")
