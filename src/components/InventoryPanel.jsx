import { useStore } from '../store';
import { useLang, getName } from '../i18n';
import { MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import { DESCRIPTIONS } from '../gamedata/descriptions';
import { parseGameText, TERM_ICONS } from '../gamedata/gameText';
import Tooltip from './Tooltip';
import WeaponPartTooltip from './WeaponPartTooltip';
import './InventoryPanel.css';

const UPGRADE_ICON = '/assets/icons/Icon_Upgrade.png';

function renderItemName(id, name) {
  if (!id?.endsWith('_PLUS')) return name || id || '';
  return (
    <>
      {name}
      <img src={UPGRADE_ICON} alt="+"
        style={{ width: '1em', height: '1em', verticalAlign: 'middle', marginLeft: '3px', display: 'inline' }}
        onError={e => e.target.style.display = 'none'} />
    </>
  );
}

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

function renderAbilityNodes(raw) {
  if (!raw) return null;
  const clean = raw.replace(/^"+|"+$/g, '').trim();
  if (!clean) return null;
  return parseGameText(clean).map((node, i) => {
    if (node.t === 'text') return <span key={i}>{node.s}</span>;
    const iconSrc = TERM_ICONS[node.key];
    if (iconSrc) return (
      <img key={i} src={iconSrc} alt={node.key}
        style={{ width: '1em', height: '1em', verticalAlign: 'middle', display: 'inline' }}
        onError={e => e.target.style.display = 'none'} />
    );
    if (node.content && !/^[-\s]+$/.test(node.content))
      return <em key={i} style={{ fontStyle: 'normal', color: 'var(--color-gold-light)' }}>{node.content}</em>;
    return null;
  });
}

function getItemTooltipContent(id, item, lang) {
  if (!item) return null;

  // Trinkets / consumables — ability description
  const rawAbility = item.abilityDescs?.[lang] || item.abilityDescs?.es || item.abilityDescs?.en || '';
  if (rawAbility) {
    const nodes = renderAbilityNodes(rawAbility);
    const name  = getName(item, lang);
    return (
      <div className="inv-tooltip-rich">
        <div className="inv-tooltip-rich-name">{renderItemName(id, name)}</div>
        <div className="inv-tooltip-rich-desc">{nodes}</div>
      </div>
    );
  }

  // Armors — "Carta de Armadura—Pesada" + nombre
  if (item.type === 'armor') {
    const baseId  = id.replace(/_PLUS$/, '');
    const rawDesc = DESCRIPTIONS[baseId] || DESCRIPTIONS[id] || '';
    const header  = rawDesc.replace(/^"+|"+$/g, '').replace(/<[^>]+>/g, '').replace(/\.$/, '').trim();
    const name    = getName(item, lang);
    return (
      <div className="inv-tooltip-rich">
        <div className="inv-tooltip-rich-name">{header || 'Armadura'}</div>
        <div className="inv-tooltip-rich-desc">{renderItemName(id, name)}</div>
      </div>
    );
  }

  return null;
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

  const item    = part || ALL_ITEMS_BY_ID[id];
  const name    = item ? getName(item, lang) : id;
  const imgEl   = item?.image
    ? <img src={item.image} className="inv-tile-img" alt="" onError={e => e.target.style.display = 'none'} />
    : <div className="inv-tile-no-img">?</div>;

  const tooltipContent = !part ? getItemTooltipContent(id, item, lang) : null;

  const tile = (
    <div className="inv-item-tile">
      <div className="inv-tile-img-area">
        {imgEl}
        {qty > 1 && <span className="inv-tile-qty">{qty}</span>}
      </div>
      <div className="inv-tile-name">{renderItemName(id, name)}</div>
    </div>
  );

  if (part) return <WeaponPartTooltip partId={id}>{tile}</WeaponPartTooltip>;

  if (tooltipContent && typeof tooltipContent === 'string') {
    return <Tooltip text={tooltipContent}>{tile}</Tooltip>;
  }
  if (tooltipContent) {
    return <Tooltip content={tooltipContent}>{tile}</Tooltip>;
  }
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
