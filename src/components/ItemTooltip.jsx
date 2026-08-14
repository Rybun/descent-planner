import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { useT, getName } from '../i18n';
import { HEROES } from '../gamedata/heroes';
import { parseGameText, TERM_ICONS } from '../gamedata/gameText';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTooltipPosition } from '../hooks/useTooltipPosition';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const UPGRADE_ICON = '/assets/icons/Icon_Upgrade.png';

const ARMOR_CARD_LABEL = {
  es: 'Carta de Armadura', en: 'Armor Card', fr: "Carte d'Armure", it: 'Carta Armatura', pt: 'Carta de Armadura',
};

const ARMOR_TYPE_LABELS = {
  light:  { es: 'Ligera',  en: 'Light',  fr: 'Légère',  it: 'Leggera', pt: 'Leve'   },
  medium: { es: 'Mediana', en: 'Medium', fr: 'Moyenne', it: 'Media',   pt: 'Média'  },
  heavy:  { es: 'Pesada',  en: 'Heavy',  fr: 'Lourde',  it: 'Pesante', pt: 'Pesada' },
};

const CONSUMABLE_TYPE_LABELS = {
  common:  { es: 'Común',    en: 'Common', fr: 'Ordinaire', it: 'Comune', pt: 'Comum'    },
  limited: { es: 'Limitado', en: 'Limited', fr: 'Limitée',  it: 'Raro',   pt: 'Limitado' },
  special: { es: 'Especial', en: 'Unique', fr: 'Unique',    it: 'Unico',  pt: 'Especial' },
};

const ITEM_TYPE_LABELS = {
  trinket:    { es: 'Accesorio',  en: 'Trinket',    fr: 'Accessoire',  it: 'Accessorio',  pt: 'Acessório'  },
  consumable: { es: 'Consumible', en: 'Consumable',  fr: 'Consommable', it: 'Consumabile', pt: 'Consumível' },
};

const EXTRA_LIFE_ICON = '/assets/icons/Icon_ExtraLife.png';
const SHIELD_ICON      = '/assets/icons/Icon_Defense.png';
const SUCCESS_ICON     = '/assets/icons/Icon_Success.png';

// Vida extra (corazón rojo) / éxitos automáticos al defenderse (escudo +
// número + estrella) de una armadura — dato de la carta física, no viene en
// la descripción de habilidad. Un mismo objeto solo tiene uno de los dos.
export function ArmorStatBadge({ item, upgraded, className = '' }) {
  if (!item || item.type !== 'armor') return null;
  const extraLife = upgraded ? item.extraLifeUpgraded : item.extraLife;
  const shield    = upgraded ? item.shieldSuccessUpgraded : item.shieldSuccess;
  if (extraLife) {
    return (
      <span className={`armor-stat-badge ${className}`}>
        <img src={EXTRA_LIFE_ICON} alt="" className="armor-stat-badge-icon" onError={e => e.target.style.display = 'none'} />
        <span className="armor-stat-badge-num">{extraLife}</span>
      </span>
    );
  }
  if (shield) {
    return (
      <span className={`armor-stat-badge ${className}`}>
        <img src={SHIELD_ICON} alt="" className="armor-stat-badge-icon" onError={e => e.target.style.display = 'none'} />
        <span className="armor-stat-badge-num">{shield}</span>
        <img src={SUCCESS_ICON} alt="" className="armor-stat-badge-star" onError={e => e.target.style.display = 'none'} />
      </span>
    );
  }
  return null;
}

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
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const saveMeta  = useStore(s => s.saveMeta);
  const gameState = useStore(s => s.gameState);
  const isAct2   = (saveMeta?.act ?? 0) >= 1;
  const { ref: bubbleRef, style: bubbleStyle } = useTooltipPosition(coords, visible && !isMobile);
  useBodyScrollLock(modalOpen);

  if (!item) return <>{children}</>;

  const name = getName(item, lang);

  // Un amuleto está equipado si algún héroe lo lleva puesto ahora mismo
  // (comparando también sin el sufijo "_PLUS", igual que con las partes de
  // arma: el hueco de amuleto guarda el ID base, mejorado o no).
  const baseId = id?.replace(/_PLUS$/, '');
  const equipped = item.type === 'trinket' && (gameState?.heroes || []).some(
    h => h.equippedTrinketId === id || h.equippedTrinketId === baseId
  );

  let label = ITEM_TYPE_LABELS[item.type]?.[lang] || item.type || '';
  let subTypeLabel = null;
  let compatibleHeroes = null;
  if (item.type === 'armor') {
    label = ARMOR_CARD_LABEL[lang] || ARMOR_CARD_LABEL.es;
    subTypeLabel = ARMOR_TYPE_LABELS[item.armorType]?.[lang] || item.armorType || '';
    compatibleHeroes = HEROES.filter(h => h.armorTypes?.includes(item.armorType));
  }
  if (item.type === 'consumable') {
    subTypeLabel = CONSUMABLE_TYPE_LABELS[item.consumableType]?.[lang] || item.consumableType || '';
    if (item.limitedHeroIds?.length) {
      compatibleHeroes = HEROES.filter(h => item.limitedHeroIds.includes(h.id));
    }
  }

  const isUpgraded = id?.endsWith('_PLUS');

  const descs = isUpgraded ? item.abilityDescs : item.baseAbilityDescs;
  const rawAbility = descs?.[lang] || descs?.es || descs?.en || '';
  const abilityNodes = rawAbility ? renderAbilityNodes(rawAbility) : null;

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }

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
          {(subTypeLabel || compatibleHeroes) && (
            <span className="rtt-armor-heroes">
              {subTypeLabel}
              {compatibleHeroes?.map(h => (
                <span key={h.id}>
                  <span className="rtt-armor-sep"> · </span>
                  {getName(h, lang)}
                </span>
              ))}
            </span>
          )}
        </span>
        {(compatibleHeroes?.length > 0 || equipped) && (
          <span className="wpt-header-right">
            {equipped && <span className="rtt-equipped-badge">{t('shop.alreadyEquipped')}</span>}
            {compatibleHeroes?.map(h => {
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

      {item.image && (
        <span className="rtt-hero-footer rtt-hero-footer--item">
          <img src={item.image} alt={name} className="rtt-item-footer-img"
            onError={e => e.target.style.display = 'none'} />
          <ArmorStatBadge item={item} upgraded={isUpgraded} className="armor-stat-badge--overlay" />
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
        <span ref={bubbleRef} className="rtt-bubble" style={bubbleStyle}>
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
