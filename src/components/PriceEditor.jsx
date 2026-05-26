import { useState } from 'react';
import { useStore } from '../store';
import { MATERIALS, MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS, WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID, CONSUMABLES, ARMORS, TRINKETS } from '../gamedata/items';
import './PriceEditor.css';

const SECTIONS = [
  { id: 'materials', label: '🪨 Materiales' },
  { id: 'weapon_parts', label: '⚔️ Partes de Arma' },
  { id: 'consumables', label: '🧪 Consumibles' },
  { id: 'armors', label: '🛡️ Armaduras' },
  { id: 'trinkets', label: '💍 Amuletos' },
];

export default function PriceEditor() {
  const customPrices = useStore(s => s.customPrices);
  const setCustomPrice = useStore(s => s.setCustomPrice);

  const [section, setSection] = useState('materials');
  const [search, setSearch] = useState('');
  const [editValues, setEditValues] = useState({});

  function getItems() {
    switch (section) {
      case 'materials': return MATERIALS;
      case 'weapon_parts': return WEAPON_PARTS;
      case 'consumables': return CONSUMABLES;
      case 'armors': return ARMORS;
      case 'trinkets': return TRINKETS;
      default: return [];
    }
  }

  const allItems = getItems();
  const filtered = search.trim()
    ? allItems.filter(i =>
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.id?.toLowerCase().includes(search.toLowerCase())
      )
    : allItems;

  function getPrice(itemId, type) {
    const key = `${itemId}_${type}`;
    if (editValues[key] !== undefined) return editValues[key];
    if (customPrices[key] !== undefined) return customPrices[key];

    const item = MATERIALS_BY_ID[itemId] ||
                 WEAPON_PARTS_BY_ID[itemId] ||
                 ALL_ITEMS_BY_ID[itemId];
    return item?.[`${type}Price`] ?? '';
  }

  function handleChange(itemId, type, value) {
    const key = `${itemId}_${type}`;
    setEditValues(prev => ({ ...prev, [key]: value }));
  }

  function handleBlur(itemId, type) {
    const key = `${itemId}_${type}`;
    const rawVal = editValues[key];
    if (rawVal === undefined) return;

    const parsed = rawVal === '' ? null : Number(rawVal);
    if (rawVal !== '' && isNaN(parsed)) {
      // Revertir a valor guardado
      setEditValues(prev => { const n = { ...prev }; delete n[key]; return n; });
      return;
    }

    setCustomPrice(itemId, type, parsed);
    setEditValues(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  function handleReset(itemId, type) {
    const key = `${itemId}_${type}`;
    setEditValues(prev => { const n = { ...prev }; delete n[key]; return n; });
    setCustomPrice(itemId, type, undefined);
  }

  const hasCustomPrice = (itemId) => {
    return customPrices[`${itemId}_buy`] !== undefined ||
           customPrices[`${itemId}_sell`] !== undefined;
  };

  function resetAllPrices() {
    if (!window.confirm('¿Borrar todos los precios personalizados?')) return;
    localStorage.removeItem('descent_prices');
    window.location.reload();
  }

  const customCount = Object.keys(customPrices).length;

  return (
    <div className="price-editor">
      {/* Cabecera */}
      <div className="pe-header">
        <div className="pe-info">
          <span>Los precios se guardan automáticamente en tu navegador.</span>
          {customCount > 0 && (
            <span className="pe-custom-count">{customCount} precio{customCount !== 1 ? 's' : ''} personalizados</span>
          )}
        </div>
        {customCount > 0 && (
          <button className="btn btn-sm btn-danger" onClick={resetAllPrices}>
            🗑 Borrar todos
          </button>
        )}
      </div>

      {/* Secciones */}
      <div className="pe-tabs">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`tab-btn ${section === s.id ? 'active' : ''}`}
            onClick={() => { setSection(s.id); setSearch(''); }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <input
        type="text"
        className="pe-search"
        placeholder="Buscar por nombre o ID..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Tabla de precios */}
      <div className="pe-table-wrap">
        <table className="pe-table">
          <thead>
            <tr>
              <th className="col-name">Nombre</th>
              <th className="col-price">Compra 🪙</th>
              <th className="col-price">Venta 🪙</th>
              <th className="col-reset"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="pe-empty">Sin resultados</td>
              </tr>
            ) : (
              filtered.map(item => {
                const custom = hasCustomPrice(item.id);
                return (
                  <tr key={item.id} className={custom ? 'row-custom' : ''}>
                    <td className="col-name">
                      <div className="pe-item-name">{item.name || item.id}</div>
                      {item.level !== undefined && (
                        <div className="pe-item-tag">
                          Slot {item.slot} · Nv.{item.level} · {item.weaponType}
                        </div>
                      )}
                    </td>
                    <td className="col-price">
                      <input
                        type="number"
                        min="0"
                        className="pe-price-input"
                        value={getPrice(item.id, 'buy')}
                        onChange={e => handleChange(item.id, 'buy', e.target.value)}
                        onBlur={() => handleBlur(item.id, 'buy')}
                        placeholder="?"
                      />
                    </td>
                    <td className="col-price">
                      <input
                        type="number"
                        min="0"
                        className="pe-price-input"
                        value={getPrice(item.id, 'sell')}
                        onChange={e => handleChange(item.id, 'sell', e.target.value)}
                        onBlur={() => handleBlur(item.id, 'sell')}
                        placeholder="?"
                      />
                    </td>
                    <td className="col-reset">
                      {custom && (
                        <button
                          className="btn btn-xs pe-reset-btn"
                          onClick={() => { handleReset(item.id, 'buy'); handleReset(item.id, 'sell'); }}
                          title="Restaurar precios por defecto"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
