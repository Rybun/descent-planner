import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { getName } from '../i18n';
import { HEROES } from '../gamedata/heroes';
import { parseGameText, TERM_ICONS } from '../gamedata/gameText';
import { CONSUMABLE_DESCS } from '../gamedata/consumableDescs';
import { useIsMobile } from '../hooks/useIsMobile';

const UPGRADE_ICON = '/assets/icons/Icon_Upgrade.png';

const ARMOR_CARD_LABEL = {
  es: 'Carta de Armadura', en: 'Armor Card', fr: "Carte d'Armure", it: 'Carta Armatura', pt: 'Carta de Armadura',
};

const ARMOR_TYPE_LABELS = {
  light:  { es: 'Ligera',  en: 'Light',  fr: 'Légère',  it: 'Leggera', pt: 'Leve'   },
  medium: { es: 'Mediana', en: 'Medium', fr: 'Moyenne', it: 'Media',   pt: 'Média'  },
  heavy:  { es: 'Pesada',  en: 'Heavy',  fr: 'Lourde',  it: 'Pesante', pt: 'Pesada' },
};

const ITEM_TYPE_LABELS = {
  trinket:    { es: 'Accesorio',  en: 'Trinket',    fr: 'Accessoire',  it: 'Accessorio',  pt: 'Acessório'  },
  consumable: { es: 'Consumible', en: 'Consumable',  fr: 'Consommable', it: 'Consumabile', pt: 'Consumível' },
};

export function renderItemName(id, name) {
  if (!id?.endsWith('_PLUS')) return name || id || '';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      {name}
      <img src={UPGRADE_ICON} alt="+"
        style={{ width: '1em', height: '1em', flexShrink: 0 }}
        onError={e => e.target.style.display = 'none'} />
    </span>
  );
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

export default function ItemTooltip({ id, item, lang, children }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const saveMeta = useStore(s => s.saveMeta);
  const isAct2   = (saveMeta?.act ?? 0) >= 1;

  if (!item) return <>{children}</>;

  const name = getName(item, lang);

  let label = ITEM_TYPE_LABELS[item.type]?.[lang] || item.type || '';
  let armorTypeLabel = null;
  let compatibleHeroes = null;
  if (item.type === 'armor') {
    label = ARMOR_CARD_LABEL[lang] || ARMOR_CARD_LABEL.es;
    armorTypeLabel = ARMOR_TYPE_LABELS[item.armorType]?.[lang] || item.armorType || '';
    compatibleHeroes = HEROES.filter(h => h.armorTypes?.includes(item.armorType));
  }

  const isUpgraded = id?.endsWith('_PLUS');

  const consumableDesc = item.type === 'consumable'
    ? (CONSUMABLE_DESCS[id] || CONSUMABLE_DESCS[id?.replace(/_PLUS$/, '')])
    : null;
  const descs = consumableDesc || (isUpgraded ? item.abilityDescs : item.baseAbilityDescs);
  const rawAbility = descs?.[lang] || descs?.es || descs?.en || '';
  const abilityNodes = rawAbility ? renderAbilityNodes(rawAbility) : null;

  const rawBaseRetained = (isUpgraded && item.compound && !consumableDesc)
    ? (item.baseAbilityDescs?.[lang] || item.baseAbilityDescs?.es || item.baseAbilityDescs?.en || '')
    : '';
  const baseRetainedNodes = rawBaseRetained ? renderAbilityNodes(rawBaseRetained) : null;

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }
  const offsetX = coords.x + 16 + 280 > window.innerWidth ? coords.x - 296 : coords.x + 16;
  const offsetY = Math.min(coords.y - 8, window.innerHeight - 400);

  function handleClick(e) {
    if (!isMobile) return;
    if (e.target.closest('button, input, label, a, select')) return;
    setModalOpen(true);
  }

  const bubbleContent = (
    <>
      <span className="rtt-header">
        <span className="rtt-title">
          {label && <span className="rtt-label">{label}</span>}
          {renderItemName(id, name)}
          {compatibleHeroes && (
            <span className="rtt-armor-heroes">
              {armorTypeLabel}
              {compatibleHeroes.map(h => (
                <span key={h.id}>
                  <span className="rtt-armor-sep"> · </span>
                  {getName(h, lang)}
                </span>
              ))}
            </span>
          )}
        </span>
        {compatibleHeroes?.length > 0 && (
          <span className="wpt-header-right">
            {compatibleHeroes.map(h => {
              const src = isAct2 ? (h.imageAct2 || h.image) : h.image;
              return (
                <img key={h.id} src={src} alt={getName(h, lang)}
                  className="wpt-hero-avatar"
                  onError={e => e.target.style.display = 'none'} />
              );
            })}
          </span>
        )}
      </span>

      {abilityNodes && (
        <span className="rtt-effect">{abilityNodes}</span>
      )}

      {baseRetainedNodes && (
        <span className="rtt-effect">{baseRetainedNodes}</span>
      )}

      {item.image && (
        <span className="rtt-hero-footer rtt-hero-footer--item">
          <img src={item.image} alt={name} className="rtt-item-footer-img"
            onError={e => e.target.style.display = 'none'} />
        </span>
      )}
    </>
  );

  return (
    <span
      className="rtt-wrap"
      onMouseEnter={e => { if (!isMobile) { setVisible(true); move(e); } }}
      onMouseMove={e => { if (!isMobile) move(e); }}
      onMouseLeave={() => { if (!isMobile) setVisible(false); }}
      onClick={handleClick}
    >
      {children}
      {!isMobile && visible && createPortal(
        <span className="rtt-bubble" style={{ left: offsetX, top: offsetY }}>
          {bubbleContent}
        </span>
      , document.body)}
      {isMobile && modalOpen && createPortal(
        <div className="rtt-modal-overlay" onClick={e => { e.stopPropagation(); setModalOpen(false); }}>
          <div className="rtt-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="rtt-modal-handle-row"><div className="rtt-modal-handle" /></div>
            <div className="rtt-modal-close-row">
              <button className="rtt-modal-close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="rtt-modal-body">{bubbleContent}</div>
          </div>
        </div>
      , document.body)}
    </span>
  );
}
