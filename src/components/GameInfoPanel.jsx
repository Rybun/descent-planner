import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { useT, useLang, getName } from '../i18n';
import { QUESTS, SIDE_QUESTS } from '../gamedata/quests';
import { SKILLS, SKILLS_BY_ID } from '../gamedata/skills';
import { HERO_VIRTUES_BY_ID } from '../gamedata/virtues';
import { HEROES_BY_ID } from '../gamedata/heroes';
import { WEAPONS_BY_ID } from '../gamedata/weapons';
import { WEAPON_PARTS_BY_ID } from '../gamedata/weaponParts';
import { ARMORS_BY_ID, TRINKETS_BY_ID, CONSUMABLES_BY_ID } from '../gamedata/items';
import { useTooltipPosition } from '../hooks/useTooltipPosition';
import { useIsMobile } from '../hooks/useIsMobile';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import HeroPrepareModal from './HeroPrepareModal';
import HeroCardModal from './HeroCardModal';
import SkillTooltip from './SkillTooltip';
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

// Un arma "aprestada" puede ser una de las 2 propias del héroe (WEAPONS_BY_ID)
// o un arma rúnica (pieza de slot A compartida, vive en WEAPON_PARTS_BY_ID) —
// se resuelve contra las dos fuentes para poder mostrar/comparar cualquiera.
function isRunicWeaponId(id) {
  return WEAPON_PARTS_BY_ID[id]?.weaponType === 'RUNE';
}
function resolveWeaponName(id, lang) {
  const w = WEAPONS_BY_ID[id] || WEAPON_PARTS_BY_ID[id];
  if (!w) return id;
  return getName(w, lang).replace(/\s*\+?\s*✦.*$/, '');
}

// Varios héroes no pueden llevar a la vez el mismo accesorio o la misma
// arma rúnica (solo hay un ejemplar en el inventario del grupo) — se marca
// como conflicto a TODOS los héroes implicados, no solo al segundo. Devuelve
// {[heroId]: { trinketConflict: bool, weaponConflicts: Set }} para poder
// resaltar exactamente qué objeto es el que choca, no solo que hay lío.
function computeConflicts(heroLoadouts) {
  const ownersByItem = {};
  for (const [heroId, loadout] of Object.entries(heroLoadouts || {})) {
    if (loadout.trinketId) {
      (ownersByItem[`trinket:${loadout.trinketId}`] ??= []).push(heroId);
    }
    for (const wid of (loadout.weaponIds || [])) {
      if (isRunicWeaponId(wid)) (ownersByItem[`weapon:${wid}`] ??= []).push(heroId);
    }
  }
  const result = {};
  for (const [key, owners] of Object.entries(ownersByItem)) {
    if (owners.length < 2) continue;
    const [kind, itemId] = key.split(':');
    for (const heroId of owners) {
      const entry = (result[heroId] ??= { trinketConflict: false, weaponConflicts: new Set() });
      if (kind === 'trinket') entry.trinketConflict = true;
      else entry.weaponConflicts.add(itemId);
    }
  }
  return result;
}

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
  const heroLoadouts  = useStore(s => s.heroLoadouts);
  const setHeroLoadout = useStore(s => s.setHeroLoadout);
  const [showLocked, setShowLocked] = useState(false);
  const [revealRemaining, setRevealRemaining] = useState(false);
  // Atajo (móvil y escritorio) — botón grande "Aprestar" arriba de la
  // pestaña Partida, que primero abre un selector de héroe (con su
  // descripción/facultades) y luego el mismo HeroPrepareModal que abre cada
  // tarjeta de héroe — evita tener que bajar hasta "Estado de los héroes"
  // para encontrar el botón de un héroe concreto.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedHeroId, setPickedHeroId] = useState(null);
  // Héroe elegido en el selector cuya ficha completa (retrato + datos de
  // HERO_CARDS) se enseña antes de entrar en Aprestar — Cancelar vuelve al
  // selector, Aceptar continúa a HeroPrepareModal.
  const [pickerDetailHeroId, setPickerDetailHeroId] = useState(null);

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

  const conflicts = computeConflicts(heroLoadouts);

  const availableHeroes = (gameState.heroes || []).filter(hero => !unavailableHeroIds.has(hero.heroId));

  const pickedHeroDef = pickedHeroId ? HEROES_BY_ID[pickedHeroId] : null;
  const pickedHeroNameKey = pickedHeroId ? t(`hero.${pickedHeroId}`) : '';
  const pickedDisplayName = pickedHeroId
    ? (pickedHeroNameKey.startsWith('hero.') ? (getHeroData(pickedHeroId)?.name || pickedHeroId) : pickedHeroNameKey)
    : '';
  const pickedHeroSkills = pickedHeroId
    ? (SKILLS_BY_HERO[pickedHeroId] || []).filter(s => unlockedSkillIdSet.has(s.id))
    : [];
  const pickedLoadout = pickedHeroId ? (heroLoadouts?.[pickedHeroId] || null) : null;

  return (
    <div className="gameinfo-panel">

      <button
        type="button"
        className="gi-prepare-shortcut-btn"
        onClick={() => setPickerOpen(true)}
      >
        {t('prepare.prepareBtn')}
      </button>

      {pickerOpen && (
        <HeroPickerModal
          heroes={availableHeroes}
          heroLoadouts={heroLoadouts}
          saveMeta={saveMeta}
          lang={lang}
          t={t}
          onPick={heroId => { setPickerDetailHeroId(heroId); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {pickerDetailHeroId && (
        <HeroCardModal
          heroId={pickerDetailHeroId}
          saveMeta={saveMeta}
          lang={lang}
          t={t}
          onClose={() => { setPickerDetailHeroId(null); setPickerOpen(true); }}
          onAccept={() => { setPickedHeroId(pickerDetailHeroId); setPickerDetailHeroId(null); }}
        />
      )}

      {pickedHeroId && (
        <HeroPrepareModal
          heroId={pickedHeroId}
          heroDef={pickedHeroDef}
          displayName={pickedDisplayName}
          unlockedSkills={pickedHeroSkills}
          itemInventory={gameState.itemInventory}
          partyXP={totalPartyXP}
          initialLoadout={pickedLoadout}
          heroLoadouts={heroLoadouts}
          lang={lang}
          t={t}
          onClose={() => setPickedHeroId(null)}
          onSave={next => {
            setHeroLoadout(pickedHeroId, next);
            setPickedHeroId(null);
          }}
        />
      )}

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
              <span className="gi-value gi-gold">
                <img src="/assets/icons/currency.png" className="gi-gold-icon" alt=""
                  onError={e => e.target.style.display = 'none'} />
                {gameState.gold}
              </span>
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
          {availableHeroes.map(hero => (
            <HeroStatusCard
              key={hero.heroId}
              hero={hero}
              t={t} lang={lang}
              saveMeta={saveMeta}
              unlockedSkillIdSet={unlockedSkillIdSet}
              loadout={heroLoadouts?.[hero.heroId] || null}
              heroLoadouts={heroLoadouts}
              itemInventory={gameState.itemInventory}
              partyXP={totalPartyXP}
              conflict={conflicts[hero.heroId] || null}
              onSaveLoadout={loadout => setHeroLoadout(hero.heroId, loadout)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}

function SkillPill({ skill, lang }) {
  const name = skill.names?.[lang] || skill.names?.es || skill.id;
  // Cada carta de habilidad tiene 2 caras usables ("Nombre A / Nombre B");
  // una encima de otra en vez de en una sola línea para que no se corten
  // con "...".
  const [nameA, nameB] = name.split(' / ');

  return (
    <SkillTooltip skill={skill} lang={lang}>
      <div className="gi-hero-skill-pill">
        <span className="gi-hero-skill-names">
          <span className="gi-hero-skill-name">{nameA}</span>
          {nameB && <span className="gi-hero-skill-name">{nameB}</span>}
        </span>
        <span className="gi-hero-skill-cost">{skill.xpCost} XP</span>
      </div>
    </SkillTooltip>
  );
}

// Resumen de lo que el grupo decidió llevar a la partida (ver
// HeroPrepareModal) — sustituye a la lista de habilidades desbloqueadas
// mientras esa vista esté activa.
function LoadoutSummary({ loadout, heroId, lang, t, partyXP, conflictedTrinketId, conflictedWeaponIds }) {
  const weaponIds = loadout.weaponIds || [];
  const skills  = (loadout.skillIds || []).map(id => SKILLS_BY_ID[id]).filter(Boolean);
  const armor   = loadout.armorId ? ARMORS_BY_ID[loadout.armorId] : null;
  const trinket = loadout.trinketId ? TRINKETS_BY_ID[loadout.trinketId] : null;
  const consumables = (loadout.consumableIds || []).map(id => CONSUMABLES_BY_ID[id]).filter(Boolean);

  // Misma XP que exige HeroPrepareModal para poder equipar: coste de cada
  // habilidad + 1 XP fijo por cada arma rúnica llevada.
  const spentXP = skills.reduce((sum, s) => sum + (s.xpCost || 0), 0)
    + weaponIds.filter(isRunicWeaponId).length;

  return (
    <div className="gi-loadout">
      <div className="gi-loadout-row">
        <span className="gi-loadout-label">{t('prepare.weapons')}</span>
        <span className="gi-loadout-value">
          {weaponIds.length > 0 ? weaponIds.map(id => (
            <span key={id} className={conflictedWeaponIds?.has(id) ? 'gi-loadout-conflict' : ''}>
              {resolveWeaponName(id, lang)}
            </span>
          )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' · ', el], []) : t('prepare.none')}
        </span>
      </div>
      <div className="gi-loadout-row">
        <span className="gi-loadout-label">{t('prepare.armor')}</span>
        <span className="gi-loadout-value">{armor ? getName(armor, lang) : t('prepare.none')}</span>
      </div>
      <div className="gi-loadout-row">
        <span className="gi-loadout-label">{t('prepare.trinket')}</span>
        <span className={`gi-loadout-value ${conflictedTrinketId ? 'gi-loadout-conflict' : ''}`}>
          {trinket ? getName(trinket, lang) : t('prepare.none')}
        </span>
      </div>
      <div className="gi-loadout-row">
        <span className="gi-loadout-label">{t('prepare.consumables')}</span>
        <span className="gi-loadout-value">
          {consumables.length > 0 ? consumables.map(c => getName(c, lang)).join(' · ') : t('prepare.none')}
        </span>
      </div>
      <div className="gi-hero-skills-label gi-loadout-skills-label">
        {t('prepare.skills')}
        <span className="gi-loadout-xp"> · {spentXP}/{partyXP || 0} XP</span>
      </div>
      {skills.length === 0 ? (
        <div className="gi-hero-skills-empty">{t('prepare.none')}</div>
      ) : (
        <div className="gi-hero-skills-list">
          {skills.map(skill => <SkillPill key={skill.id} skill={skill} lang={lang} />)}
        </div>
      )}
    </div>
  );
}

// Selector de héroe a pantalla completa (atajo móvil): mismo héroe/retrato
// por acto que usa Armería (HEROES_BY_ID + imageAct2/image), más su
// descripción y facultades (HERO_VIRTUES_BY_ID + valor real del save), para
// poder decidir a quién aprestar sin tener que reconocerlo solo por nombre.
function HeroPickerModal({ heroes, heroLoadouts, saveMeta, lang, t, onPick, onClose }) {
  useBodyScrollLock(true);
  const isAct2 = (saveMeta?.act ?? 0) >= 1;

  return createPortal(
    <div className="hpm-overlay gi-hero-picker-overlay">
      <div className="hpm-screen">
        <header className="hpm-header">
          <span className="hpm-header-title">{t('prepare.pickHeroTitle')}</span>
          <button type="button" className="hpm-close-btn" onClick={onClose} aria-label={t('prepare.cancel')}>✕</button>
        </header>

        <div className="hpm-body">
          <div className="gi-hero-picker-list">
            {heroes.map(hero => {
              const heroDef = HEROES_BY_ID[hero.heroId];
              const heroNameKey = t(`hero.${hero.heroId}`);
              const displayName = heroNameKey.startsWith('hero.') ? (heroDef?.name || hero.heroId) : heroNameKey;
              const portraitSrc = isAct2 ? (heroDef?.imageAct2 || heroDef?.image) : heroDef?.image;
              const virtues = HERO_VIRTUES_BY_ID[hero.heroId];
              const virtueOneName = virtues?.virtueOne?.[lang] || virtues?.virtueOne?.es;
              const virtueTwoName = virtues?.virtueTwo?.[lang] || virtues?.virtueTwo?.es;
              const isPrepared = !!heroLoadouts?.[hero.heroId];
              return (
                <button
                  type="button"
                  key={hero.heroId}
                  className="gi-hero-picker-row"
                  onClick={() => onPick(hero.heroId)}
                >
                  {portraitSrc && (
                    <img src={portraitSrc} alt={displayName} className="gi-hero-picker-portrait"
                      onError={e => e.target.style.display = 'none'} />
                  )}
                  <div className="gi-hero-picker-info">
                    <div className="gi-hero-picker-name-row">
                      <div className="gi-hero-picker-name">{displayName}</div>
                      {isPrepared && (
                        <span className="gi-prepared-badge gi-hero-picker-prepared-badge">
                          {t('prepare.preparedLabel')}
                        </span>
                      )}
                    </div>
                    {heroDef?.archetype && (
                      <div className="gi-hero-picker-archetype">{heroDef.archetype}</div>
                    )}
                    {heroDef?.description && (
                      <p className="gi-hero-picker-desc">{heroDef.description}</p>
                    )}
                    {(virtueOneName || virtueTwoName) && (
                      <div className="gi-hero-picker-virtues">
                        {virtueOneName && <span className="gi-virtue">{virtueOneName} {hero.virtueOne ?? 0}</span>}
                        {virtueTwoName && <span className="gi-virtue">{virtueTwoName} {hero.virtueTwo ?? 0}</span>}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  , document.body);
}

function HeroStatusCard({ hero, t, lang, saveMeta, unlockedSkillIdSet, loadout, heroLoadouts, itemInventory, partyXP, conflict, onSaveLoadout }) {
  const heroData = getHeroData(hero.heroId);
  const heroDef  = HEROES_BY_ID[hero.heroId];
  const [modalOpen, setModalOpen] = useState(false);
  // Ficha completa del héroe (retrato + datos de HERO_CARDS) — se abre al
  // tocar la cabecera (retrato/nombre) de la tarjeta.
  const [showCard, setShowCard] = useState(false);
  // null = sin preferencia manual todavía → se decide según haya o no
  // aprestado (en cuanto se apresta por primera vez, salta automáticamente
  // a esa vista). Un toggle manual fija la preferencia el resto de la sesión.
  const [manualView, setManualView] = useState(null);
  const viewMode = manualView ?? (loadout ? 'loadout' : 'skills');

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
      <button type="button" className="gi-hero-card-top" onClick={() => setShowCard(true)}>
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
      </button>

      {showCard && (
        <HeroCardModal
          heroId={hero.heroId}
          saveMeta={saveMeta}
          lang={lang}
          t={t}
          onClose={() => setShowCard(false)}
        />
      )}

      <div className="gi-prepare-actions">
        {loadout ? (
          <>
            <span className={`gi-prepared-badge ${conflict ? 'gi-prepared-badge-conflict' : ''}`}>
              {conflict ? t('prepare.conflictLabel') : t('prepare.preparedLabel')}
            </span>
            <button
              type="button"
              className="gi-prepare-link-btn"
              onClick={() => setManualView(viewMode === 'loadout' ? 'skills' : 'loadout')}
            >
              {viewMode === 'loadout' ? t('prepare.viewSkills') : t('prepare.viewPrepared')}
            </button>
            <button type="button" className="gi-prepare-link-btn" onClick={() => setModalOpen(true)}>
              {t('prepare.reprepare')}
            </button>
          </>
        ) : (
          <button type="button" className="gi-prepare-btn" onClick={() => setModalOpen(true)}>
            {t('prepare.prepareBtn')}
          </button>
        )}
      </div>

      {viewMode === 'loadout' && loadout ? (
        <LoadoutSummary
          loadout={loadout} heroId={hero.heroId} lang={lang} t={t} partyXP={partyXP}
          conflictedTrinketId={conflict?.trinketConflict}
          conflictedWeaponIds={conflict?.weaponConflicts}
        />
      ) : (
        <div className="gi-hero-skills">
          <div className="gi-hero-skills-label">{t('gameinfo.skillsLabel')}</div>
          {unlockedSkills.length === 0 ? (
            <div className="gi-hero-skills-empty">{t('gameinfo.noSkills')}</div>
          ) : (
            <div className="gi-hero-skills-list">
              {unlockedSkills.map(skill => <SkillPill key={skill.id} skill={skill} lang={lang} />)}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <HeroPrepareModal
          heroId={hero.heroId}
          heroDef={heroDef}
          displayName={displayName}
          unlockedSkills={unlockedSkills}
          itemInventory={itemInventory}
          partyXP={partyXP}
          initialLoadout={loadout}
          heroLoadouts={heroLoadouts}
          lang={lang}
          t={t}
          onClose={() => setModalOpen(false)}
          onSave={next => {
            onSaveLoadout(next);
            setManualView('loadout');
            setModalOpen(false);
          }}
        />
      )}
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
