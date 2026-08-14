import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { useT, useLang } from '../i18n';
import { QUESTS, SIDE_QUESTS } from '../gamedata/quests';
import { SKILLS } from '../gamedata/skills';
import { HERO_VIRTUES_BY_ID } from '../gamedata/virtues';
import { useTooltipPosition } from '../hooks/useTooltipPosition';
import { useIsMobile } from '../hooks/useIsMobile';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import './RecipeTooltip.css';
import './GameInfoPanel.css';

function formatPlayTime(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// DateCompleted en CampaignLogEntries no es un tick .NET como Timestamp,
// sino una fecha corta en formato estadounidense "MM/DD/YYYY" (comprobado
// directamente en el .sav) — se reformatea al locale del usuario.
function formatCompletedDate(dateStr, dateLocale) {
  if (!dateStr) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr);
  if (!m) return dateStr;
  const [, mm, dd, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return d.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTimestamp(ticks, dateLocale) {
  if (!ticks) return '—';
  try {
    const EPOCH_OFFSET = 621355968000000000n;
    const ms = Number((BigInt(ticks) - EPOCH_OFFSET) / 10000n);
    return new Date(ms).toLocaleString(dateLocale, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

// Habilidades agrupadas por héroe, en orden (calculado una vez, es estático)
const SKILLS_BY_HERO = SKILLS.reduce((acc, s) => {
  (acc[s.heroId] ??= []).push(s);
  return acc;
}, {});

// Misiones del Acto 1 en orden estricto de la 1ª a la última
const ORDERED_QUESTS = [...QUESTS].sort((a, b) => a.order - b.order);
const ORDERED_SIDE_QUESTS = [...SIDE_QUESTS].sort((a, b) => a.order - b.order);

// Tooltip de la descripción de la misión — en escritorio, burbuja flotante
// que sigue al ratón (portal + medición real, igual que el resto de
// tooltips de la app); en móvil, la misma hoja modal inferior que usan
// ItemTooltip/RecipeTooltip/MaterialTooltip/WeaponPartTooltip (antes este
// tooltip solo reaccionaba a hover, que no existe en pantallas táctiles).
// En misiones completadas añade, separado de la descripción, la fecha y el
// resumen del desenlace. Sin descripción ni resumen no envuelve nada, para
// no montar listeners de más.
function QuestTooltip({ name, description, summary, details, date, dateLabel, children }) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const { ref: bubbleRef, style: bubbleStyle } = useTooltipPosition(coords, visible && !isMobile);
  useBodyScrollLock(modalOpen);
  if (!description && !summary) return children;

  function move(e) { setCoords({ x: e.clientX, y: e.clientY }); }

  function handleClick() {
    if (!isMobile) return;
    setModalOpen(true);
  }

  const content = (
    <>
      {name && <span className="gi-quest-tooltip-name">{name}</span>}
      {description && <span className="gi-quest-tooltip-desc">{description}</span>}
      {summary && (
        <>
          <span className="gi-quest-tooltip-divider" />
          {date && <span className="gi-quest-tooltip-date">{dateLabel}: {date}</span>}
          <span className="gi-quest-tooltip-summary">{summary}</span>
          {details?.length > 0 && (
            <ul className="gi-quest-tooltip-details">
              {details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </>
      )}
    </>
  );

  return (
    <span
      className="gi-quest-tooltip-wrap"
      onMouseEnter={e => { if (!isMobile) { setVisible(true); move(e); } }}
      onMouseMove={e => { if (!isMobile) move(e); }}
      onMouseLeave={() => { if (!isMobile) setVisible(false); }}
      onClick={handleClick}
    >
      {children}
      {!isMobile && visible && createPortal(
        <span ref={bubbleRef} className="rtt-bubble gi-quest-tooltip-bubble" style={bubbleStyle}>
          {content}
        </span>
      , document.body)}
      {isMobile && modalOpen && createPortal(
        <div className="rtt-modal-overlay" onClick={e => { e.stopPropagation(); setModalOpen(false); }}>
          <div className="rtt-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="rtt-modal-handle-row"><div className="rtt-modal-handle" /></div>
            <div className="rtt-modal-close-row">
              <button className="rtt-modal-close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="rtt-modal-body">{content}</div>
          </div>
        </div>
      , document.body)}
    </span>
  );
}

// Fila de una misión, compartida entre la lista de historia y la de
// opcionales — completada/disponible se muestran igual, bloqueada (ni una
// cosa ni otra = spoiler) se oculta salvo que showLocked esté activo.
function QuestList({ quests, completedIds, availableIds, completedDates, showLocked, t, lang, dateLocale }) {
  return (
    <div className="gi-quests-list">
      {quests.map(quest => {
        const done      = completedIds.has(quest.id);
        const available = availableIds.has(quest.id);
        const locked    = !done && !available;
        if (locked && !showLocked) return null;
        const name = quest.names?.[lang] || quest.names?.es || quest.id;
        const description = quest.descriptions?.[lang] || quest.descriptions?.es || '';
        // El resumen (desenlace de la misión) solo tiene sentido si ya se
        // completó — es el mismo texto que muestra el propio juego en su
        // registro de campaña. El save no guarda qué rama/desenlace concreto
        // se dio, así que siempre es la variante de éxito estándar (_WON).
        const summary = done ? (quest.summaries?.[lang] || quest.summaries?.es || '') : '';
        // Datos extra que el propio juego muestra como viñetas bajo el
        // resumen (hechos ya ciertos antes del desenlace, independientes de
        // qué rama se tomara) — vacío en las misiones donde el juego solo
        // ofrece ramas alternativas (ver comentario en extract.py).
        const details = done
          ? (quest.details || []).map(d => d[lang] || d.es || '').filter(Boolean)
          : [];
        const rawDate = done ? completedDates?.[quest.id] : null;
        const completedDate = rawDate ? formatCompletedDate(rawDate, dateLocale) : null;
        // El héroe requerido es su historia personal — no se muestra en las
        // bloqueadas reveladas para no adelantar de quién trata (mismo
        // criterio de spoiler que oculta la fila entera por defecto).
        const requiredHeroId = !locked ? quest.requiredHeroId : null;
        const requiredHeroName = requiredHeroId
          ? (() => { const k = t(`hero.${requiredHeroId}`); return k.startsWith('hero.') ? null : k; })()
          : null;
        const requiredHeroImage = requiredHeroName ? getHeroData(requiredHeroId)?.image : null;
        return (
          <QuestTooltip
            key={quest.id}
            name={name}
            description={description}
            summary={summary}
            details={details}
            date={completedDate}
            dateLabel={t('gameinfo.completedOn')}
          >
            <div
              className={`gi-quest-row ${done ? 'gi-quest-done' : ''} ${locked ? 'gi-quest-locked' : ''}`}
            >
              <span className="gi-quest-num">{quest.order}.</span>
              <span className="gi-quest-check">{done ? '✓' : '○'}</span>
              <span className="gi-quest-name">{name}</span>
              {locked && <span className="gi-quest-spoiler-tag">{t('gameinfo.spoilerTag')}</span>}
              {requiredHeroName && (
                <span className="gi-quest-hero-tag">
                  {requiredHeroName}
                  {requiredHeroImage && (
                    <img src={requiredHeroImage} alt="" className="gi-quest-hero-avatar"
                      onError={e => e.target.style.display = 'none'} />
                  )}
                </span>
              )}
            </div>
          </QuestTooltip>
        );
      })}
    </div>
  );
}

export default function GameInfoPanel() {
  const t        = useT();
  const lang     = useLang();
  const saveMeta  = useStore(s => s.saveMeta);
  const gameState = useStore(s => s.gameState);
  const [showLocked, setShowLocked] = useState(false);
  const [revealRemaining, setRevealRemaining] = useState(false);

  if (!saveMeta || !gameState) return null;

  const dateLocale = t('locale.date');

  const playTime   = formatPlayTime(saveMeta.totalPlayTimeSeconds);
  const difficulty = t(`gameinfo.diff.${saveMeta.gameDifficulty}`)
    .startsWith('gameinfo.')
    ? `${t('gameinfo.diffFallback')} ${saveMeta.gameDifficulty}`
    : t(`gameinfo.diff.${saveMeta.gameDifficulty}`);

  // XP de grupo: NO es una moneda que se gasta y se pierde (confirmado en el
  // propio glosario del juego, TERM_EXPERIENCE_DESC_7: "La XP nunca se
  // pierde ni se gasta de forma permanente"; y DESC_1: "los héroes no
  // comparten la XP, pero todos la obtienen al mismo ritmo" — por eso el
  // save guarda un único valor PartyXP válido para todos). Desbloquear una
  // habilidad (UnlockedSkills) no resta de este valor: solo añade esa carta
  // a las que se pueden EQUIPAR, dentro del límite que marca la XP. Así que
  // el valor correcto a mostrar es el PartyXP del save tal cual, sin sumar
  // nada — un intento anterior de "reconstruir un total" sumándole el coste
  // de las habilidades desbloqueadas era incorrecto.
  const unlockedSkillIdList = saveMeta.unlockedSkills || [];
  const totalPartyXP = saveMeta.partyXP || 0;

  const completedQuestIds = new Set(saveMeta.completedStoryQuestIds || []);
  // Misiones que el grupo ya puede emprender pero no ha terminado. El resto
  // (ni completada ni disponible) es spoiler de la historia — se oculta por
  // defecto en la lista de misiones (ver showLocked).
  const availableQuestIds = new Set(saveMeta.activeStoryQuestIds || []);
  // Mismo criterio (solo misiones de historia) para que este resumen
  // coincida exactamente con lo que se cuenta en la lista de abajo —
  // "Destinos completados" del save incluye también misiones secundarias,
  // que no aparecen en esta lista, y antes eso hacía parecer un número
  // inconsistente.
  const completedCount = completedQuestIds.size;
  const completedSideQuestIds = new Set(saveMeta.completedSideQuestIds || []);
  const availableSideQuestIds = new Set(saveMeta.activeSideQuestIds || []);
  // "Restantes" es un total (14 y 2 misiones del Acto 1 respectivamente)
  // menos las completadas — a diferencia de "completadas" sí adelanta
  // cuántas quedan por descubrir, así que se trata como spoiler y se oculta
  // tras un clic bajo el propio riesgo del usuario.
  const remainingCount     = ORDERED_QUESTS.length - completedCount;
  const remainingSideCount = ORDERED_SIDE_QUESTS.length - completedSideQuestIds.size;
  const unlockedSkillIdSet = new Set(unlockedSkillIdList);
  // Héroes ausentes de esta partida (muertos/retirados de la historia): no
  // tiene sentido mostrar su ficha aunque sigan en AllPlayers.
  const unavailableHeroIds = new Set(saveMeta.unavailableHeroes || []);

  // Un enlace compartido creado antes de que existieran estos campos guarda
  // una foto fija de saveMeta SIN ellos (el servidor no guarda el .sav
  // original para poder recalcularlos después) — así que salen a 0/vacío
  // aunque la partida real sí tenga XP, misiones y habilidades. Lo
  // detectamos para avisar en vez de aparentar silenciosamente que no hay
  // datos.
  const isLegacyShareData = saveMeta.unlockedSkills === undefined;

  return (
    <div className="gameinfo-panel">

      {/* Bloque principal */}
      <div className="gi-cards-row">

        {/* Partida */}
        <div className="gi-card">
          <div className="gi-card-title">{t('gameinfo.cardGame')}</div>
          <div className="gi-rows">
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.group')}</span>
              <span className="gi-value">{saveMeta.partyName || '—'}</span>
            </div>
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.act')}</span>
              <span className="gi-value gi-highlight">{t('gameinfo.act')} {(saveMeta.act ?? 0) + 1}</span>
            </div>
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.difficulty')}</span>
              <span className={`gi-value gi-difficulty gi-diff-${saveMeta.gameDifficulty}`}>
                {difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Progreso */}
        <div className="gi-card">
          <div className="gi-card-title">{t('gameinfo.cardProgress')}</div>
          <div className="gi-rows">
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.completedDest')}</span>
              <span className="gi-value">{completedCount}</span>
            </div>
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.completedSideDest')}</span>
              <span className="gi-value">{completedSideQuestIds.size}</span>
            </div>
            <div className="gi-row">
              <span className="gi-label">
                {t('gameinfo.remainingDest')}
                <span className="gi-inline-spoiler-tag">{t('gameinfo.spoilerTag')}</span>
              </span>
              {revealRemaining ? (
                <span className="gi-value">{remainingCount}</span>
              ) : (
                <button type="button" className="gi-reveal-btn" onClick={() => setRevealRemaining(true)}>
                  {t('gameinfo.clickToReveal')}
                </button>
              )}
            </div>
            <div className="gi-row">
              <span className="gi-label">
                {t('gameinfo.remainingSideDest')}
                <span className="gi-inline-spoiler-tag">{t('gameinfo.spoilerTag')}</span>
              </span>
              {revealRemaining ? (
                <span className="gi-value">{remainingSideCount}</span>
              ) : (
                <button type="button" className="gi-reveal-btn" onClick={() => setRevealRemaining(true)}>
                  {t('gameinfo.clickToReveal')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recursos */}
        <div className="gi-card">
          <div className="gi-card-title">{t('gameinfo.cardResources')}</div>
          <div className="gi-rows">
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.gold')}</span>
              <span className="gi-value gi-gold">🪙 {gameState.gold}</span>
            </div>
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.partyXP')}</span>
              <span className="gi-value">{isLegacyShareData ? '—' : totalPartyXP}</span>
            </div>
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.playTime')}</span>
              <span className="gi-value gi-highlight">⏱ {playTime}</span>
            </div>
            {saveMeta.timestamp && (
              <div className="gi-row">
                <span className="gi-label">{t('gameinfo.lastSaved')}</span>
                <span className="gi-value gi-small">{formatTimestamp(saveMeta.timestamp, dateLocale)}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {isLegacyShareData && (
        <div className="gi-legacy-notice">{t('gameinfo.legacyShareNotice')}</div>
      )}

      {/* Misiones del Acto 1 */}
      <div className="gi-quests-section">
        <div className="gi-quests-header">
          <div className="gi-section-title">{t('gameinfo.questsTitle')}</div>
          <button type="button" className="gi-quests-toggle" onClick={() => setShowLocked(v => !v)}>
            {showLocked ? t('gameinfo.hideLockedQuests') : t('gameinfo.showLockedQuests')}
          </button>
        </div>
        <QuestList
          quests={ORDERED_QUESTS}
          completedIds={completedQuestIds}
          availableIds={availableQuestIds}
          completedDates={saveMeta.completedStoryQuestDates}
          showLocked={showLocked}
          t={t} lang={lang} dateLocale={dateLocale}
        />
      </div>

      {/* Misiones opcionales del Acto 1 */}
      {ORDERED_SIDE_QUESTS.length > 0 && (
        <div className="gi-quests-section">
          <div className="gi-section-title">{t('gameinfo.sideQuestsTitle')}</div>
          <QuestList
            quests={ORDERED_SIDE_QUESTS}
            completedIds={completedSideQuestIds}
            availableIds={availableSideQuestIds}
            completedDates={saveMeta.completedSideQuestDates}
            showLocked={showLocked}
            t={t} lang={lang} dateLocale={dateLocale}
          />
        </div>
      )}

      {/* Héroes */}
      <div className="gi-heroes-section">
        <div className="gi-section-title">{t('gameinfo.heroesTitle')}</div>
        <div className="gi-heroes-grid">
          {(gameState.heroes || [])
            .filter(hero => !unavailableHeroIds.has(hero.heroId))
            .map(hero => (
            <HeroStatusCard key={hero.heroId} hero={hero} t={t} lang={lang} unlockedSkillIdSet={unlockedSkillIdSet} />
          ))}
        </div>
      </div>

    </div>
  );
}

function HeroStatusCard({ hero, t, lang, unlockedSkillIdSet }) {
  const heroData = getHeroData(hero.heroId);

  const heroName = t(`hero.${hero.heroId}`);
  const displayName = heroName.startsWith('hero.') ? (heroData?.name || hero.heroId) : heroName;

  const healthKey = `gameinfo.health.${hero.healthState}`;
  const healthStr = t(healthKey);
  const healthLabel = healthStr.startsWith('gameinfo.health.')
    ? `${t('gameinfo.healthFallback')} ${hero.healthState}`
    : healthStr;

  const virtues = HERO_VIRTUES_BY_ID[hero.heroId];
  const virtueOneName = virtues?.virtueOne?.[lang] || virtues?.virtueOne?.es;
  const virtueTwoName = virtues?.virtueTwo?.[lang] || virtues?.virtueTwo?.es;

  const heroSkills = SKILLS_BY_HERO[hero.heroId] || [];
  const unlockedSkills = heroSkills.filter(s => unlockedSkillIdSet.has(s.id));

  return (
    <div className="gi-hero-card">
      <div className="gi-hero-card-top">
        {heroData?.image && (
          <img src={heroData.image} alt={displayName} className="gi-hero-portrait"
            onError={e => e.target.style.display = 'none'} />
        )}
        <div className="gi-hero-info">
          <div className="gi-hero-name">{displayName}</div>
          <div className="gi-hero-stats">
            {hero.healthState !== 0 && (
              <span className={`gi-health-badge gi-health-${hero.healthState}`}>
                {healthLabel}
              </span>
            )}
            {virtueOneName && (
              <span className="gi-virtue">{virtueOneName} {hero.virtueOne ?? 0}</span>
            )}
            {virtueTwoName && (
              <span className="gi-virtue">{virtueTwoName} {hero.virtueTwo ?? 0}</span>
            )}
          </div>
        </div>
      </div>
      <div className="gi-hero-skills">
        <div className="gi-hero-skills-label">{t('gameinfo.skillsLabel')}</div>
        {unlockedSkills.length === 0 ? (
          <div className="gi-hero-skills-empty">{t('gameinfo.noSkills')}</div>
        ) : (
          <div className="gi-hero-skills-list">
            {unlockedSkills.map(skill => {
              const name = skill.names?.[lang] || skill.names?.es || skill.id;
              // Cada carta de habilidad tiene 2 caras usables ("Nombre A /
              // Nombre B"); una encima de otra en vez de en una sola línea
              // para que no se corten con "...".
              const [nameA, nameB] = name.split(' / ');
              return (
                <div key={skill.id} className="gi-hero-skill-pill">
                  <span className="gi-hero-skill-names">
                    <span className="gi-hero-skill-name">{nameA}</span>
                    {nameB && <span className="gi-hero-skill-name">{nameB}</span>}
                  </span>
                  <span className="gi-hero-skill-cost">{skill.xpCost} XP</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Mapa de imágenes de héroes (sincrónico, sin importación dinámica)
let _heroesById = null;
function getHeroData(id) {
  if (!_heroesById) {
    _heroesById = {
      HERO_BRYNN:   { name: 'Brynn',   image: '/assets/heroes/brynn_act1.png'   },
      HERO_SYRUS:   { name: 'Syrus',   image: '/assets/heroes/syrus_act1.png'   },
      HERO_GALADEN: { name: 'Galaden', image: '/assets/heroes/galaden_act1.png' },
      HERO_VAERIX:  { name: 'Vaerix',  image: '/assets/heroes/vaerix_act1.png'  },
      HERO_KEHLI:   { name: 'Kehli',   image: '/assets/heroes/kehli_act1.png'   },
      HERO_CHANCE:  { name: 'Chance',  image: '/assets/heroes/chance_act1.png'  },
    };
  }
  return _heroesById[id] || null;
}
