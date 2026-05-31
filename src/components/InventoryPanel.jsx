import { useStore } from '../store';
import { useLang, getName } from '../i18n';
import { MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import { DESCRIPTIONS } from '../gamedata/descriptions';
import Tooltip from './Tooltip';
import WeaponPartTooltip from './WeaponPartTooltip';
import ItemTooltip from './ItemTooltip';
import './RecipeTooltip.css';
import './InventoryPanel.css';

const UPGRADE_ICON = '/assets/icons/Icon_Upgrade.png';
const COMPONENT_LABELS = { es: 'Componente', en: 'Component', fr: 'Composant', it: 'Componente', pt: 'Componente' };

function renderSimpleText(raw) {
  if (!raw) return null;
  const clean = raw.replace(/^"+|"+$/g, '').trim();
  const parts = clean.split(/(<i>.*?<\/i>)/gs);
  return parts.map((part, i) => {
    const m = part.match(/^<i>(.*?)<\/i>$/s);
    return m ? <em key={i}>{m[1]}</em> : (part || null);
  });
}

function MatChip({ id, qty, lang }) {
  const mat     = MATERIALS_BY_ID[id];
  const name    = mat ? getName(mat, lang) : id;
  const rawDesc = DESCRIPTIONS[id] || '';

  const tooltipContent = (
    <div className="inv-tooltip-rich">
      <div className="inv-tooltip-rich-name">{COMPONENT_LABELS[lang] || 'Componente'}</div>
      <div className="inv-tooltip-rich-desc">
        <div style={{ fontWeight: 600, marginBottom: rawDesc ? '4px' : 0 }}>{name}</div>
        {rawDesc && <div style={{ color: 'var(--color-text-muted)' }}>{renderSimpleText(rawDesc)}</div>}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <span className="mat-chip">
        {mat?.image && (
          <img src={mat.image} className="mat-chip-img" alt="" onError={e => e.target.style.display = 'none'} />
        )}
        <span className="mat-chip-name">{name}</span>
        <span className="mat-chip-qty">×{qty}</span>
      </span>
    </Tooltip>
  );
}

function ItemTile({ id, qty, lang }) {
  const part = WEAPON_PARTS_BY_ID[id];
  if (part?.level === 0) return null;

  const item = part || ALL_ITEMS_BY_ID[id];
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
  const lang      = useLang();
  const gameState = useStore(s => s.gameState);

  if (!gameState) return null;

  const mats = Object.entries(gameState.craftingMaterials || {})
    .filter(([, qty]) => qty > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  const itemCounts = {};
  for (const entry of (gameState.itemInventory || [])) {
    itemCounts[entry.id] = (itemCounts[entry.id] || 0) + 1;
  }
  const items = Object.entries(itemCounts)
    .filter(([id]) => {
      const part = WEAPON_PARTS_BY_ID[id];
      return !part || part.level > 0;
    })
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="inventory-panel">
      <section className="inv-section">
        <h2 className="inv-section-title">
          <img src="/assets/icons/Icon_Materials.png" className="inv-section-icon" alt="" onError={e => e.target.style.display = 'none'} />
          Materiales
        </h2>
        {mats.length === 0 ? (
          <p className="inv-empty">Sin materiales</p>
        ) : (
          <div className="inv-mats-chips">
            {mats.map(([id, qty]) => <MatChip key={id} id={id} qty={qty} lang={lang} />)}
          </div>
        )}
      </section>

      <section className="inv-section">
        <h2 className="inv-section-title">
          <img src="/assets/icons/Icon_Armor.png" className="inv-section-icon" alt="" onError={e => e.target.style.display = 'none'} />
          Ítems
        </h2>
        {items.length === 0 ? (
          <p className="inv-empty">Sin ítems</p>
        ) : (
          <div className="inv-items-grid">
            {items.map(([id, qty]) => <ItemTile key={id} id={id} qty={qty} lang={lang} />)}
          </div>
        )}
      </section>
    </div>
  );
}
