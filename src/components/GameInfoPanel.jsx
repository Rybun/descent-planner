import { useStore } from '../store';
import { useT } from '../i18n';
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

export default function GameInfoPanel() {
  const t        = useT();
  const saveMeta  = useStore(s => s.saveMeta);
  const gameState = useStore(s => s.gameState);

  if (!saveMeta || !gameState) return null;

  const dateLocale = t('locale.date');

  const playTime   = formatPlayTime(saveMeta.totalPlayTimeSeconds);
  const difficulty = t(`gameinfo.diff.${saveMeta.gameDifficulty}`)
    .startsWith('gameinfo.')
    ? `${t('gameinfo.diffFallback')} ${saveMeta.gameDifficulty}`
    : t(`gameinfo.diff.${saveMeta.gameDifficulty}`);

  const phase = t(`gameinfo.phase.${saveMeta.currentGamePhase}`)
    .startsWith('gameinfo.')
    ? '—'
    : t(`gameinfo.phase.${saveMeta.currentGamePhase}`);

  // Formatea "Q1_OBJECTIVE_8" → "Acto 1 · Objetivo 8" (localizado)
  const objective = (() => {
    const key = saveMeta.currentObjectiveKey;
    if (!key) return null;
    const m = key.match(/^Q(\d+)_OBJECTIVE_(\d+)$/);
    if (m) return t('gameinfo.actObj', { act: m[1], obj: m[2] });
    return key;
  })();

  const location = (() => {
    const loc = saveMeta.lastKnownLocation;
    if (!loc) return null;
    const locKey = `gameinfo.loc.${loc}`;
    const translated = t(locKey);
    if (translated === locKey) return loc.replace('LOCATION_', '').replace(/_/g, ' ');
    return translated;
  })();

  const completedCount = saveMeta.completedDestinations?.length ?? 0;
  const activeCount    = saveMeta.activeDestinations?.length ?? 0;

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
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.phase')}</span>
              <span className="gi-value">{phase}</span>
            </div>
          </div>
        </div>

        {/* Progreso */}
        <div className="gi-card">
          <div className="gi-card-title">{t('gameinfo.cardProgress')}</div>
          <div className="gi-rows">
            {objective && (
              <div className="gi-row">
                <span className="gi-label">{t('gameinfo.objective')}</span>
                <span className="gi-value gi-highlight">{objective}</span>
              </div>
            )}
            {location && (
              <div className="gi-row">
                <span className="gi-label">{t('gameinfo.location')}</span>
                <span className="gi-value">{location}</span>
              </div>
            )}
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.completedDest')}</span>
              <span className="gi-value">{completedCount}</span>
            </div>
            {activeCount > 0 && (
              <div className="gi-row">
                <span className="gi-label">{t('gameinfo.activeDest')}</span>
                <span className="gi-value">{activeCount}</span>
              </div>
            )}
            <div className="gi-row">
              <span className="gi-label">{t('gameinfo.round')}</span>
              <span className="gi-value">{saveMeta.roundNumber ?? 0}</span>
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
              <span className="gi-value">{gameState.partyXP ?? 0}</span>
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

      {/* Héroes */}
      <div className="gi-heroes-section">
        <div className="gi-section-title">{t('gameinfo.heroesTitle')}</div>
        <div className="gi-heroes-grid">
          {(gameState.heroes || []).map(hero => (
            <HeroStatusCard key={hero.heroId} hero={hero} t={t} />
          ))}
        </div>
      </div>

    </div>
  );
}

function HeroStatusCard({ hero, t }) {
  const heroData = getHeroData(hero.heroId);

  const heroName = t(`hero.${hero.heroId}`);
  const displayName = heroName.startsWith('hero.') ? (heroData?.name || hero.heroId) : heroName;

  const healthKey = `gameinfo.health.${hero.healthState}`;
  const healthStr = t(healthKey);
  const healthLabel = healthStr.startsWith('gameinfo.health.')
    ? `${t('gameinfo.healthFallback')} ${hero.healthState}`
    : healthStr;

  return (
    <div className="gi-hero-card">
      {heroData?.image && (
        <img src={heroData.image} alt={displayName} className="gi-hero-portrait"
          onError={e => e.target.style.display = 'none'} />
      )}
      <div className="gi-hero-info">
        <div className="gi-hero-name">{displayName}</div>
        <div className="gi-hero-stats">
          <span className={`gi-health-badge gi-health-${hero.healthState}`}>
            {healthLabel}
          </span>
          {hero.virtueOne > 0 && <span className="gi-virtue">{t('gameinfo.virtue1')} {hero.virtueOne}</span>}
          {hero.virtueTwo > 0 && <span className="gi-virtue">{t('gameinfo.virtue2')} {hero.virtueTwo}</span>}
        </div>
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
