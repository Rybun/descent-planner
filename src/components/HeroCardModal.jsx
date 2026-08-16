import { createPortal } from 'react-dom';
import { HEROES_BY_ID } from '../gamedata/heroes';
import { HERO_CARDS } from '../gamedata/heroCards';
import { parseGameText, TERM_ICONS, termIconStyle } from '../gamedata/gameText';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import DieTooltip from './DieTooltip';
import './HeroCardModal.css';

const FATIGUE_ICON = '/assets/icons/Icon_Fatigue.png';
const ACTION_ICON  = '/assets/icons/Icon_Action.png';
const SURGE_ICON   = '/assets/icons/Icon_Surge.png';
const HEALTH_ICON   = '/assets/icons/Icon_Health.png';
const MOVEMENT_ICON = '/assets/icons/Icon_Movement.png';
const STAR_ICON    = '/assets/icons/Icon_Success.png';
const COMBAT_ICON  = '/assets/icons/Icon_Action_Combat_Card.png';
const DEFENSE_ICON = '/assets/icons/Icon_Defense.png';

const COST_ICON_BY_TYPE = { fatigue: FATIGUE_ICON, action: ACTION_ICON, surge: SURGE_ICON };
// Mismo TERM_* que usa parseGameText/TERM_ICONS para cada término — así el
// icono de coste (el "1[icono]:" delante del efecto) se alinea con
// termIconStyle exactamente igual que ese símbolo cuando aparece en medio
// del texto.
const COST_ALT_BY_TYPE = { fatigue: 'TERM_FATIGUE', action: 'TERM_ACTIONS', surge: 'TERM_SURGE' };

// Color+forma del dado de ataque/defensa de cada héroe (indicados a mano
// por el usuario, no legibles con fiabilidad en la foto): negro=cuadrado,
// amarillo=rombo, azul=octógono — ver hcm-die en HeroCardModal.css.
function DieBadge({ die }) {
  if (!die) return null;
  return <span className={`hcm-die hcm-die-${die}`} />;
}

// "1[icono]: " delante del efecto — el rayo se activa al sacar ese símbolo
// en la tirada del dado de héroe, igual que el resto de costes (fatiga,
// acción) delante de un efecto.
function CostPrefix({ cost }) {
  if (!cost) return null;
  const alt = COST_ALT_BY_TYPE[cost.type] || '';
  return (
    <span className="hcm-cost-prefix">
      {cost.amount}
      <img src={COST_ICON_BY_TYPE[cost.type]} alt={alt}
        style={termIconStyle(alt)}
        onError={e => e.target.style.display = 'none'} />:
    </span>
  );
}

// Mismo render de iconos que el resto de texto de partidas del juego
// (parseGameText/TERM_ICONS) — el texto de HERO_CARDS usa el mismo marcado
// <style=Term><link=TERM_X></link></style> que las habilidades del juego.
function renderCardText(raw) {
  if (!raw) return null;
  return parseGameText(raw).map((node, i) => {
    if (node.t === 'text') return <span key={i}>{node.s}</span>;
    const iconSrc = TERM_ICONS[node.key];
    if (iconSrc) return (
      <img key={i} src={iconSrc} alt={node.key}
        style={termIconStyle(node.key)}
        onError={e => e.target.style.display = 'none'} />
    );
    return null;
  });
}

function formatSigned(n) {
  return n > 0 ? `+${n}` : String(n);
}

function AttrRow({ label, value }) {
  return (
    <div className="hcm-attr-row">
      <span className="hcm-attr-label">{label}</span>
      <span className={`hcm-attr-value ${value > 0 ? 'hcm-attr-pos' : value < 0 ? 'hcm-attr-neg' : ''}`}>
        {formatSigned(value)}
      </span>
      <img src={STAR_ICON} alt="" className="hcm-attr-star" onError={e => e.target.style.display = 'none'} />
    </div>
  );
}

function CardFace({ face }) {
  if (!face) return null;
  return (
    <div className="hcm-face">
      <div className="hcm-face-header">
        <span className="hcm-face-name">{face.name}</span>
        <span className="hcm-fatigue-pill">
          {face.maxFatigue}
          <img src={FATIGUE_ICON} alt="" className="hcm-fatigue-pill-icon" onError={e => e.target.style.display = 'none'} />
        </span>
      </div>
      {face.type && <div className="hcm-face-type">{face.type}</div>}
      <div className="hcm-face-effect">
        <CostPrefix cost={face.cost} />
        {' '}{renderCardText(face.effect)}
      </div>
      {face.quote && <div className="hcm-face-quote">&ldquo;{face.quote}&rdquo;</div>}
    </div>
  );
}

// Ficha completa del héroe (retrato, sobrenombre, Movimiento/Vida,
// Fuerza/Agilidad/Sabiduría/Voluntad, habilidad del rayo, y las dos caras
// con su fatiga máxima y cita) — mismos datos que HERO_CARDS
// (src/gamedata/heroCards.js, transcritos de las cartas físicas).
//
// Con onAccept: modal de confirmación del selector de héroe (Cancelar
// vuelve al selector, Aceptar continúa a Aprestar). Sin onAccept: solo
// consulta (un botón para cerrar) — usado desde la cabecera de Aprestar y
// desde la tarjeta de héroe de la pestaña Partida.
export default function HeroCardModal({ heroId, saveMeta, lang, t, onClose, onAccept }) {
  useBodyScrollLock(true);

  const heroDef = HEROES_BY_ID[heroId];
  const card = HERO_CARDS[heroId];
  if (!card) return null;

  const isAct2 = (saveMeta?.act ?? 0) >= 1;
  const portraitSrc = isAct2 ? (heroDef?.imageAct2 || heroDef?.image) : heroDef?.image;
  const heroNameKey = t(`hero.${heroId}`);
  const displayName = heroNameKey.startsWith('hero.') ? (heroDef?.name || heroId) : heroNameKey;

  return createPortal(
    <div className="hpm-overlay hcm-overlay">
      <div className="hpm-screen">
        <header className="hpm-header">
          <span className="hpm-header-title">{displayName}</span>
          <button type="button" className="hpm-close-btn" onClick={onClose} aria-label={t('prepare.cancel')}>✕</button>
        </header>

        <div className="hpm-body">
          <div className="hcm-content">
            {portraitSrc && (
              <img src={portraitSrc} alt={displayName} className="hcm-portrait"
                onError={e => e.target.style.display = 'none'} />
            )}
            {card.nickname && <div className="hcm-nickname">{card.nickname}</div>}

            <div className="hcm-topstats">
              <span className="hcm-pill">
                <img src={MOVEMENT_ICON} alt={t('hero.movement')} className="hcm-inline-icon" onError={e => e.target.style.display = 'none'} />
                {card.movement}
              </span>
              <span className="hcm-pill">
                <img src={HEALTH_ICON} alt="" className="hcm-inline-icon" onError={e => e.target.style.display = 'none'} />
                {card.health}
              </span>
              <DieTooltip die={card.attackDie} title={t(`die.${card.attackDie}`)}>
                <span className="hcm-pill">
                  <img src={COMBAT_ICON} alt="" className="hcm-inline-icon" onError={e => e.target.style.display = 'none'} />
                  <DieBadge die={card.attackDie} />
                </span>
              </DieTooltip>
              <DieTooltip die={card.defenseDie} title={t(`die.${card.defenseDie}`)}>
                <span className="hcm-pill">
                  <img src={DEFENSE_ICON} alt="" className="hcm-inline-icon" onError={e => e.target.style.display = 'none'} />
                  <DieBadge die={card.defenseDie} />
                </span>
              </DieTooltip>
            </div>

            <DieTooltip die="black" title={t('die.black')} note={t('die.testNote')}>
              <div className="hcm-attrs">
                <AttrRow label={t('hero.strength')} value={card.attributes.strength} />
                <AttrRow label={t('hero.agility')} value={card.attributes.agility} />
                <AttrRow label={t('hero.wisdom')} value={card.attributes.wisdom} />
                <AttrRow label={t('hero.willpower')} value={card.attributes.willpower} />
              </div>
            </DieTooltip>

            <div className="hcm-heroic">
              <div className="hcm-heroic-effect">
                <CostPrefix cost={card.heroicAbility.cost} />
                {' '}{renderCardText(card.heroicAbility.effect)}
              </div>
            </div>

            <CardFace face={card.faceA} />
            <CardFace face={card.faceB} />

            {card.heroicAbility.armorHint && (
              <div className="hcm-armor-hint">{card.heroicAbility.armorHint}</div>
            )}
          </div>
        </div>

        <footer className="hpm-footer">
          {onAccept ? (
            <>
              <button type="button" className="btn btn-sm" onClick={onClose}>{t('prepare.cancel')}</button>
              <button type="button" className="btn btn-sm btn-primary" onClick={onAccept}>{t('prepare.accept')}</button>
            </>
          ) : (
            <button type="button" className="btn btn-sm" onClick={onClose}>{t('prepare.cancel')}</button>
          )}
        </footer>
      </div>
    </div>
  , document.body);
}
