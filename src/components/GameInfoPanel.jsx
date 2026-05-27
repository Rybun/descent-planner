import { useStore } from '../store';
import './GameInfoPanel.css';

const DIFFICULTY_LABELS = {
  0: 'Fácil',
  1: 'Estándar',
  2: 'Difícil',
  3: 'Pesadilla',
};

const GAME_PHASE_LABELS = {
  0: 'Inicio',
  1: 'En ciudad',
  2: 'En misión',
  3: 'Entre actos',
};

const LOCATION_LABELS = {
  LOCATION_TOWN_01: 'Ciudad de Frostgate',
  LOCATION_TOWN_02: 'Ciudad (Acto 2)',
};

function formatPlayTime(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatQuestKey(key) {
  if (!key) return null;
  // "Q1_OBJECTIVE_8" → "Acto 1 · Objetivo 8"
  const m = key.match(/^Q(\d+)_OBJECTIVE_(\d+)$/);
  if (m) return `Acto ${m[1]} · Objetivo ${m[2]}`;
  return key;
}

function formatLocation(loc) {
  if (!loc) return null;
  return LOCATION_LABELS[loc] || loc.replace('LOCATION_', '').replace(/_/g, ' ');
}

export default function GameInfoPanel() {
  const saveMeta = useStore(s => s.saveMeta);
  const gameState = useStore(s => s.gameState);

  if (!saveMeta || !gameState) return null;

  const playTime = formatPlayTime(saveMeta.totalPlayTimeSeconds);
  const difficulty = DIFFICULTY_LABELS[saveMeta.gameDifficulty] ?? `Nivel ${saveMeta.gameDifficulty}`;
  const phase = GAME_PHASE_LABELS[saveMeta.currentGamePhase] ?? '—';
  const objective = formatQuestKey(saveMeta.currentObjectiveKey);
  const location = formatLocation(saveMeta.lastKnownLocation);

  const completedCount = saveMeta.completedDestinations?.length ?? 0;
  const activeCount = saveMeta.activeDestinations?.length ?? 0;

  return (
    <div className="gameinfo-panel">

      {/* ── Bloque principal ── */}
      <div className="gi-cards-row">

        {/* Partida */}
        <div className="gi-card">
          <div className="gi-card-title">⚔️ Partida</div>
          <div className="gi-rows">
            <div className="gi-row">
              <span className="gi-label">Grupo</span>
              <span className="gi-value">{saveMeta.partyName || '—'}</span>
            </div>
            <div className="gi-row">
              <span className="gi-label">Acto</span>
              <span className="gi-value gi-highlight">Acto {(saveMeta.act ?? 0) + 1}</span>
            </div>
            <div className="gi-row">
              <span className="gi-label">Dificultad</span>
              <span className={`gi-value gi-difficulty gi-diff-${saveMeta.gameDifficulty}`}>
                {difficulty}
              </span>
            </div>
            <div className="gi-row">
              <span className="gi-label">Fase</span>
              <span className="gi-value">{phase}</span>
            </div>
          </div>
        </div>

        {/* Progreso */}
        <div className="gi-card">
          <div className="gi-card-title">🗺️ Progreso</div>
          <div className="gi-rows">
            {objective && (
              <div className="gi-row">
                <span className="gi-label">Objetivo</span>
                <span className="gi-value gi-highlight">{objective}</span>
              </div>
            )}
            {location && (
              <div className="gi-row">
                <span className="gi-label">Ubicación</span>
                <span className="gi-value">{location}</span>
              </div>
            )}
            <div className="gi-row">
              <span className="gi-label">Destinos completados</span>
              <span className="gi-value">{completedCount}</span>
            </div>
            {activeCount > 0 && (
              <div className="gi-row">
                <span className="gi-label">Destinos activos</span>
                <span className="gi-value">{activeCount}</span>
              </div>
            )}
            <div className="gi-row">
              <span className="gi-label">Ronda actual</span>
              <span className="gi-value">{saveMeta.roundNumber ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Recursos */}
        <div className="gi-card">
          <div className="gi-card-title">💰 Recursos</div>
          <div className="gi-rows">
            <div className="gi-row">
              <span className="gi-label">Oro</span>
              <span className="gi-value gi-gold">🪙 {gameState.gold}</span>
            </div>
            <div className="gi-row">
              <span className="gi-label">XP del grupo</span>
              <span className="gi-value">{gameState.partyXP ?? 0}</span>
            </div>
            <div className="gi-row">
              <span className="gi-label">Tiempo jugado</span>
              <span className="gi-value gi-highlight">⏱ {playTime}</span>
            </div>
            {saveMeta.timestamp && (
              <div className="gi-row">
                <span className="gi-label">Último guardado</span>
                <span className="gi-value gi-small">{formatTimestamp(saveMeta.timestamp)}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Héroes ── */}
      <div className="gi-heroes-section">
        <div className="gi-section-title">🧙 Estado de los héroes</div>
        <div className="gi-heroes-grid">
          {(gameState.heroes || []).map(hero => (
            <HeroStatusCard key={hero.heroId} hero={hero} />
          ))}
        </div>
      </div>

    </div>
  );
}

function HeroStatusCard({ hero }) {
  const HEROES_BY_ID = useStore.getState ? null : null; // avoid re-import
  // Import inline
  const heroData = getHeroData(hero.heroId);

  return (
    <div className="gi-hero-card">
      {heroData?.image && (
        <img src={heroData.image} alt={heroData.name} className="gi-hero-portrait"
          onError={e => e.target.style.display = 'none'} />
      )}
      <div className="gi-hero-info">
        <div className="gi-hero-name">{heroData?.name || hero.heroId}</div>
        <div className="gi-hero-stats">
          <span className={`gi-health-badge gi-health-${hero.healthState}`}>
            {healthLabel(hero.healthState)}
          </span>
          {hero.virtueOne > 0 && <span className="gi-virtue">Virt.1: {hero.virtueOne}</span>}
          {hero.virtueTwo > 0 && <span className="gi-virtue">Virt.2: {hero.virtueTwo}</span>}
        </div>
      </div>
    </div>
  );
}

// Lazy import helpers (avoid circular deps)
let _heroesById = null;
function getHeroData(id) {
  if (!_heroesById) {
    try {
      // Dynamic import not possible in sync fn — use a simple inline map
      _heroesById = {
        HERO_BRYNN:   { name: 'Brynn',    image: '/assets/heroes/brynn_act1.png'   },
        HERO_SYRUS:   { name: 'Syrus',    image: '/assets/heroes/syrus_act1.png'   },
        HERO_GALADEN: { name: 'Galaden',  image: '/assets/heroes/galaden_act1.png' },
        HERO_VAERIX:  { name: 'Vaerix',   image: '/assets/heroes/vaerix_act1.png'  },
        HERO_KEHLI:   { name: 'Kehli',    image: '/assets/heroes/kehli_act1.png'   },
        HERO_CHANCE:  { name: 'Venturoso',image: '/assets/heroes/chance_act1.png'  },
      };
    } catch { _heroesById = {}; }
  }
  return _heroesById[id] || null;
}

function healthLabel(state) {
  switch(state) {
    case 0: return '❤️ Sano';
    case 1: return '🟡 Herido';
    case 2: return '💀 K.O.';
    default: return `Estado ${state}`;
  }
}

function formatTimestamp(ticks) {
  if (!ticks) return '—';
  // .NET ticks: 100-nanosecond intervals since 1/1/0001
  // Convert to JS Date: subtract ticks from 1/1/0001 to Unix epoch (1/1/1970)
  // Difference: 621355968000000000 ticks
  try {
    const EPOCH_OFFSET = 621355968000000000n;
    const ms = Number((BigInt(ticks) - EPOCH_OFFSET) / 10000n);
    return new Date(ms).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}
