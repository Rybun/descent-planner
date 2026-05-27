import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { MATERIALS, MATERIALS_BY_ID } from '../gamedata/materials';
import { WEAPON_PARTS, WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID, CONSUMABLES, ARMORS, TRINKETS } from '../gamedata/items';
import './PriceEditor.css';

const SECTION_KEYS = ['materials', 'weapon_parts', 'consumables', 'armors', 'trinkets'];

export default function PriceEditor() {
  const t    = useT();
  const lang = useLang();

  const customPrices   = useStore(s => s.customPrices);
  const setCustomPrice = useStore(s => s.setCustomPrice);

  const SECTIONS = SECTION_KEYS.map(id => ({ id, label: t(`pe.sec.${id}`) }));

  const [section,     setSection]     = useState('materials');
  const [search,      setSearch]      = useState('');
  const [editValues,  setEditValues]  = useState({});

  function getItems() {
    switch (section) {
      case 'materials':    return MATERIALS;
      case 'weapon_parts': return WEAPON_PARTS;
      case 'consumables':  return CONSUMABLES;
      case 'armors':       return ARMORS;
      case 'trinkets':     return TRINKETS;
      default:             return [];
    }
  }

  const allItems = getItems();
  const searchLow = search.trim().toLowerCase();
  const filtered = searchLow
    ? allItems.filter(i => {
        const n = getName(i, lang).toLowerCase();
        return n.includes(searchLow) || i.id?.toLowerCase().includes(searchLow);
      })
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
    const key    = `${itemId}_${type}`;
    const rawVal = editValues[key];
    if (rawVal === undefined) return;

    const parsed = rawVal === '' ? null : Number(rawVal);
    if (rawVal !== '' && isNaN(parsed)) {
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

  const hasCustomPrice = (itemId) =>
    customPrices[`${itemId}_buy`] !== undefined ||
    customPrices[`${itemId}_sell`] !== undefined;

  function resetAllPrices() {
    if (!window.confirm(t('pe.deleteConfirm'))) return;
    localStorage.removeItem('descent_prices');
    window.location.reload();
  }

  const customCount = Object.keys(customPrices).length;
  const customLabel = t('pe.customCount', {
    n: customCount,
    s: customCount !== 1 ? 's' : '',
  });

  return (
    <div className="price-editor">
      {/* Cabecera */}
      <div className="pe-header">
        <div className="pe-info">
          <span>{t('pe.autoSave')}</span>
          {customCount > 0 && (
            <span className="pe-custom-count">{customLabel}</span>
          )}
        </div>
        {customCount > 0 && (
          <button className="btn btn-sm btn-danger" onClick={resetAllPrices}>
            {t('pe.deleteAll')}
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
        placeholder={t('pe.search')}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Tabla de precios */}
      <div className="pe-table-wrap">
        <table className="pe-table">
          <thead>
            <tr>
              <th className="col-name">{t('pe.colName')}</th>
              <th className="col-price">{t('pe.colBuy')}</th>
              <th className="col-price">{t('pe.colSell')}</th>
              <th className="col-reset"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="pe-empty">{t('pe.empty')}</td>
              </tr>
            ) : (
              filtered.map(item => {
                const custom    = hasCustomPrice(item.id);
                const itemName  = getName(item, lang);
                return (
                  <tr key={item.id} className={custom ? 'row-custom' : ''}>
                    <td className="col-name">
                      <div className="pe-item-name">{itemName || item.id}</div>
                      {item.level !== undefined && (
                        <div className="pe-item-tag">
                          {t('pe.slotInfo', { slot: item.slot, level: item.level, type: item.weaponType })}
                        </div>
                      )}
                    </td>
                    <td className="col-price">
                      <input
                        type="number" min="0"
                        className="pe-price-input"
                        value={getPrice(item.id, 'buy')}
                        onChange={e => handleChange(item.id, 'buy', e.target.value)}
                        onBlur={() => handleBlur(item.id, 'buy')}
                        placeholder="?"
                      />
                    </td>
                    <td className="col-price">
                      <input
                        type="number" min="0"
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
                          title={t('pe.resetTitle')}
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
