import { useStore } from '../store';
import { useLang, getName } from '../i18n';
import { MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import './InventoryPanel.css';

function MatRow({ id, qty, lang }) {
  const mat = MATERIALS_BY_ID[id];
  return (
    <div className="inv-row">
      {mat?.image && (
        <img src={mat.image} className="inv-row-img" alt="" onError={e => e.target.style.display='none'} />
      )}
      <span className="inv-row-name">{mat ? getName(mat, lang) : id}</span>
      <span className="inv-row-qty">×{qty}</span>
    </div>
  );
}

function ItemRow({ id, qty, lang }) {
  const part = WEAPON_PARTS_BY_ID[id];
  const item = part || ALL_ITEMS_BY_ID[id];
  return (
    <div className="inv-row">
      {item?.image && (
        <img src={item.image} className="inv-row-img" alt="" onError={e => e.target.style.display='none'} />
      )}
      <span className="inv-row-name">{item ? getName(item, lang) : id}</span>
      {qty > 1 && <span className="inv-row-qty">×{qty}</span>}
    </div>
  );
}

export default function InventoryPanel() {
  const lang      = useLang();
  const gameState = useStore(s => s.gameState);

  if (!gameState) return null;

  // Materiales
  const mats = Object.entries(gameState.craftingMaterials || {})
    .filter(([, qty]) => qty > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  // Ítems (contar por id)
  const itemCounts = {};
  for (const entry of (gameState.itemInventory || [])) {
    itemCounts[entry.id] = (itemCounts[entry.id] || 0) + 1;
  }
  const items = Object.entries(itemCounts).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="inventory-panel">
      {/* Materiales */}
      <section className="inv-section">
        <h2 className="inv-section-title">
          <img src="/assets/icons/Icon_Materials.png" className="inv-section-icon" alt="" onError={e => e.target.style.display='none'} />
          Materiales
        </h2>
        {mats.length === 0 ? (
          <p className="inv-empty">Sin materiales</p>
        ) : (
          <div className="inv-list">
            {mats.map(([id, qty]) => <MatRow key={id} id={id} qty={qty} lang={lang} />)}
          </div>
        )}
      </section>

      {/* Ítems */}
      <section className="inv-section">
        <h2 className="inv-section-title">
          <img src="/assets/icons/Icon_Armor.png" className="inv-section-icon" alt="" onError={e => e.target.style.display='none'} />
          Ítems
        </h2>
        {items.length === 0 ? (
          <p className="inv-empty">Sin ítems</p>
        ) : (
          <div className="inv-list">
            {items.map(([id, qty]) => <ItemRow key={id} id={id} qty={qty} lang={lang} />)}
          </div>
        )}
      </section>
    </div>
  );
}
