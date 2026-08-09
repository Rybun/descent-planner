import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import WeaponPartTooltip from './WeaponPartTooltip';
import ItemTooltip from './ItemTooltip';
import MaterialTooltip from './MaterialTooltip';
import WeaponAssemblyView from './WeaponAssemblyView';
import './RecipeTooltip.css';
import './InventoryPanel.css';

const UPGRADE_ICON = '/assets/icons/Icon_Upgrade.png';

const WEAPON_TYPE_ORDER = [
  'SWORD', 'WARHAMMER', 'STAFF', 'WAND', 'DUAL_BLADES',
  'BOW', 'WARBELL', 'SPEAR', 'HAMMER', 'CROSSBOW', 'KNIVES', 'GAUNTLET',
];

const WEAPON_TYPE_NAMES = {
  BOW:         { es: 'Arco',               en: 'Bow',            fr: 'Arc',               it: 'Arco',          pt: 'Arco'             },
  CROSSBOW:    { es: 'Ballesta',           en: 'Crossbow',       fr: 'Arbalète',          it: 'Balestra',      pt: 'Besta'            },
  DUAL_BLADES: { es: 'Hojas gemelas',      en: 'Dual Blades',    fr: 'Lames jumelles',    it: 'Lame gemelle',  pt: 'Lâminas duplas'   },
  GAUNTLET:    { es: 'Manopla',            en: 'Gauntlet',       fr: 'Gantelet',          it: 'Guantone',      pt: 'Manopla'          },
  HAMMER:      { es: 'Martillo',           en: 'Hammer',         fr: 'Marteau',           it: 'Martello',      pt: 'Martelo'          },
  KNIVES:      { es: 'Cuchillos',          en: 'Knives',         fr: 'Couteaux',          it: 'Coltelli',      pt: 'Facas'            },
  SPEAR:       { es: 'Lanza',              en: 'Spear',          fr: 'Lance',             it: 'Lancia',        pt: 'Lança'            },
  STAFF:       { es: 'Báculo',             en: 'Staff',          fr: 'Bâton',             it: 'Bastone',       pt: 'Cajado'           },
  SWORD:       { es: 'Espada',             en: 'Sword',          fr: 'Épée',              it: 'Spada',         pt: 'Espada'           },
  WAND:        { es: 'Varita',             en: 'Wand',           fr: 'Baguette',          it: 'Bacchetta',     pt: 'Varinha'          },
  WARBELL:     { es: 'Campana de guerra',  en: 'War Bell',       fr: 'Cloche de guerre',  it: 'Campana',       pt: 'Sino de guerra'   },
  WARHAMMER:   { es: 'Martillo de guerra', en: 'War Hammer',     fr: 'Marteau de guerre', it: 'Maglio',        pt: 'Martelo de guerra'},
};

const ARMOR_TYPE_LABELS = {
  heavy:  { es: 'Pesadas',  en: 'Heavy',  fr: 'Lourdes',  it: 'Pesanti', pt: 'Pesadas' },
  medium: { es: 'Medias',   en: 'Medium', fr: 'Moyennes', it: 'Medie',   pt: 'Médias'  },
  light:  { es: 'Ligeras',  en: 'Light',  fr: 'Légères',  it: 'Leggere', pt: 'Leves'   },
};

const SECTION = {
  mats:        { es: 'Materiales',     en: 'Materials',       fr: 'Matériaux',      it: 'Materiali',    pt: 'Materiais'      },
  armors:      { es: 'Armaduras',      en: 'Armor',           fr: 'Armures',        it: 'Armature',     pt: 'Armaduras'      },
  trinkets:    { es: 'Accesorios',     en: 'Trinkets',        fr: 'Accessoires',    it: 'Accessori',    pt: 'Acessórios'     },
  weapons:     { es: 'Armas y partes', en: 'Weapons & Parts', fr: 'Armes & Pièces', it: 'Armi e Parti', pt: 'Armas e Peças'  },
  consumables: { es: 'Consumibles',    en: 'Consumables',     fr: 'Consommables',   it: 'Consumabili',  pt: 'Consumíveis'    },
};

const L = (obj, lang) => obj?.[lang] || obj?.en || obj?.es || '';

function MatChip({ id, qty, lang }) {
  const mat  = MATERIALS_BY_ID[id];
  const name = mat ? getName(mat, lang) : id;
  return (
    <MaterialTooltip mat={mat} lang={lang}>
      <span className="mat-chip">
        {mat?.image && (
          <img src={mat.image} className="mat-chip-img" alt="" onError={e => e.target.style.display = 'none'} />
        )}
        <span className="mat-chip-name">{name}</span>
        <span className="mat-chip-qty">×{qty}</span>
      </span>
    </MaterialTooltip>
  );
}

const TILE_ROTATION  = { SWORD: -45, SPEAR: -45, WARBELL: -45, STAFF: -45, BOW: 80 };
const PART_OVERRIDES = {
  BOW: { c: { left: 180.6, top: 60.5, w: 58, h: 369, z: 3, rot: -95 } },
};

function WeaponSlotATile({ id, qty, lang }) {
  const part = WEAPON_PARTS_BY_ID[id];
  if (!part || part.level === 0) return null;

  function defaultSlotPart(slot) {
    return WEAPON_PARTS_BY_ID[`WEAPON_PART_${slot}_${part.weaponType}_0`] ?? null;
  }

  const rotation      = TILE_ROTATION[part.weaponType] || 0;
  const partOverrides = PART_OVERRIDES[part.weaponType] || {};

  const name = getName(part, lang);
  const tile = (
    <div className="inv-item-tile">
      <div className="inv-tile-img-area" style={{ overflow: 'hidden' }}>
        <WeaponAssemblyView
          weaponType={part.weaponType}
          partA={part}
          partB={defaultSlotPart('B')}
          partC={defaultSlotPart('C')}
          displayH={56}
          rotation={rotation}
          partOverrides={partOverrides}
        />
        {qty > 1 && <span className="inv-tile-qty">{qty}</span>}
      </div>
      <div className="inv-tile-name">
        <span className="inv-tile-name-text">{name}</span>
        {id?.endsWith('_PLUS') && (
          <img src={UPGRADE_ICON} alt="+" className="inv-tile-upgrade-icon"
            onError={e => e.target.style.display = 'none'} />
        )}
      </div>
    </div>
  );
  return <WeaponPartTooltip partId={id}>{tile}</WeaponPartTooltip>;
}

function ItemTile({ id, qty, lang }) {
  const part = WEAPON_PARTS_BY_ID[id];
  if (part?.level === 0) return null;

  // Armaduras/amuletos/consumibles mejorados usan sufijo "_PLUS" pero no
  // tienen una entrada propia en ALL_ITEMS_BY_ID (a diferencia de las partes
  // de arma, que sí la tienen con "_UPGRADED"): hay que caer a la base.
  const item = part || ALL_ITEMS_BY_ID[id] || ALL_ITEMS_BY_ID[id?.replace(/_PLUS$/, '')];
  const name = item ? getName(item, lang) : id;
  const imgEl = item?.image
    ? <img src={item.image} className="inv-tile-img" alt="" onError={e => e.target.style.display = 'none'} />
    : <div className="inv-tile-no-img">?</div>;

  const tile = (
    <div className="inv-item-tile">
      <div className="inv-tile-img-area">
        {imgEl}
        {qty > 1 && <span className="inv-tile-qty">{qty}</span>}
      </div>
      <div className="inv-tile-name">
        <span className="inv-tile-name-text">{name}</span>
        {id?.endsWith('_PLUS') && (
          <img src={UPGRADE_ICON} alt="+" className="inv-tile-upgrade-icon"
            onError={e => e.target.style.display = 'none'} />
        )}
      </div>
    </div>
  );

  if (part) return <WeaponPartTooltip partId={id}>{tile}</WeaponPartTooltip>;
  if (item) return <ItemTooltip id={id} item={item} lang={lang}>{tile}</ItemTooltip>;
  return tile;
}

export default function InventoryPanel() {
  const t         = useT();
  const lang      = useLang();
  const gameState = useStore(s => s.gameState);

  if (!gameState) return null;

  // ── Materiales ──
  const mats = Object.entries(gameState.craftingMaterials || {})
    .filter(([, qty]) => qty > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  // ── Categorizar ítems del inventario ──
  const armorsByType    = { heavy: [], medium: [], light: [] };
  const trinkets        = [];
  const consumables     = [];
  const weaponPartsByType = {}; // { SWORD: { A: [], B: [], C: [] }, ... }

  const itemCounts = {};
  for (const entry of (gameState.itemInventory || [])) {
    itemCounts[entry.id] = (itemCounts[entry.id] || 0) + 1;
  }

  for (const [id, qty] of Object.entries(itemCounts).sort(([a], [b]) => a.localeCompare(b))) {
    const part = WEAPON_PARTS_BY_ID[id];
    if (part) {
      if (part.level === 0) continue;
      const wt = part.weaponType;
      if (!weaponPartsByType[wt]) weaponPartsByType[wt] = { A: [], B: [], C: [] };
      weaponPartsByType[wt][part.slot]?.push({ id, qty });
      continue;
    }
    // Igual que en ItemTile: la versión "_PLUS" no tiene entrada propia.
    const item = ALL_ITEMS_BY_ID[id] || ALL_ITEMS_BY_ID[id.replace(/_PLUS$/, '')];
    if (!item) continue;
    if (item.type === 'armor') {
      (armorsByType[item.armorType] ?? armorsByType.heavy).push({ id, qty });
    } else if (item.type === 'trinket') {
      trinkets.push({ id, qty });
    } else if (item.type === 'consumable') {
      consumables.push({ id, qty });
    }
  }

  const hasArmors  = Object.values(armorsByType).some(a => a.length > 0);
  const hasWeapons = Object.keys(weaponPartsByType).length > 0;

  const orderedWeaponTypes = [
    ...WEAPON_TYPE_ORDER.filter(wt => weaponPartsByType[wt]),
    ...Object.keys(weaponPartsByType).filter(wt => !WEAPON_TYPE_ORDER.includes(wt)),
  ];

  return (
    <div className="inventory-panel">

      {/* ── Materiales ── */}
      <section className="inv-section">
        <h2 className="inv-section-title">
          <img src="/assets/icons/Icon_Materials.png" className="inv-section-icon" alt="" onError={e => e.target.style.display = 'none'} />
          {L(SECTION.mats, lang)}
        </h2>
        {mats.length === 0
          ? <p className="inv-empty">Sin materiales</p>
          : <div className="inv-mats-chips">
              {mats.map(([id, qty]) => <MatChip key={id} id={id} qty={qty} lang={lang} />)}
            </div>
        }
      </section>

      {/* ── Armaduras ── */}
      {hasArmors && (
        <section className="inv-section">
          <h2 className="inv-section-title">
            <img src="/assets/icons/Icon_Armor.png" className="inv-section-icon" alt="" onError={e => e.target.style.display = 'none'} />
            {L(SECTION.armors, lang)}
          </h2>
          <div className="inv-items-grid">
            {(['heavy', 'medium', 'light']).flatMap(type =>
              armorsByType[type].map(({ id, qty }) => (
                <ItemTile key={id} id={id} qty={qty} lang={lang} />
              ))
            )}
          </div>
        </section>
      )}

      {/* ── Accesorios ── */}
      {trinkets.length > 0 && (
        <section className="inv-section">
          <h2 className="inv-section-title">
            <img src="/assets/icons/Icon_Trinket.png" className="inv-section-icon" alt="" onError={e => e.target.style.display = 'none'} />
            {L(SECTION.trinkets, lang)}
          </h2>
          <div className="inv-items-grid">
            {trinkets.map(({ id, qty }) => (
              <ItemTile key={id} id={id} qty={qty} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* ── Armas y partes ── */}
      {hasWeapons && (
        <section className="inv-section">
          <h2 className="inv-section-title">
            <img src="/assets/icons/tab_armeria.png" className="inv-section-icon" alt="" onError={e => e.target.style.display = 'none'} />
            {L(SECTION.weapons, lang)}
          </h2>
          <div className="inv-items-grid">
            {orderedWeaponTypes.flatMap(wt =>
              ['A', 'B', 'C'].flatMap(slot =>
                (weaponPartsByType[wt][slot] || []).map(({ id, qty }) =>
                  slot === 'A'
                    ? <WeaponSlotATile key={id} id={id} qty={qty} lang={lang} />
                    : <ItemTile key={id} id={id} qty={qty} lang={lang} />
                )
              )
            )}
          </div>
        </section>
      )}

      {/* ── Consumibles ── */}
      {consumables.length > 0 && (
        <section className="inv-section">
          <h2 className="inv-section-title">
            <img src="/assets/icons/Icon_Consumable.png" className="inv-section-icon" alt="" onError={e => e.target.style.display = 'none'} />
            {L(SECTION.consumables, lang)}
          </h2>
          <div className="inv-items-grid">
            {consumables.map(({ id, qty }) => (
              <ItemTile key={id} id={id} qty={qty} lang={lang} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
