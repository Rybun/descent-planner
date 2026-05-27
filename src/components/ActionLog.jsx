import { useStore } from '../store';
import { useT } from '../i18n';
import './ActionLog.css';

function formatTime(iso, dateLocale) {
  try {
    return new Date(iso).toLocaleTimeString(dateLocale, {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return iso;
  }
}

const ACTION_ICONS = {
  BUY_ITEM:      '🛒',
  SELL_ITEM:     '💰',
  BUY_MATERIAL:  '🪨',
  SELL_MATERIAL: '💸',
  CRAFT_ITEM:    '🔨',
};

export default function ActionLog() {
  const t = useT();

  const actionHistory = useStore(s => s.actionHistory);
  const originalState = useStore(s => s.originalState);
  const gameState     = useStore(s => s.gameState);
  const undoAction    = useStore(s => s.undoAction);
  const undoUntil     = useStore(s => s.undoUntil);
  const resetToSave   = useStore(s => s.resetToSave);
  const exportLog     = useStore(s => s.exportLog);

  if (!originalState) return null;

  const dateLocale = t('locale.date');
  const goldDiff   = (gameState?.gold ?? 0) - originalState.gold;

  function handleExport() {
    const text = exportLog();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `descent_sesion_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    if (actionHistory.length === 0) return;
    if (window.confirm(t('log.resetConfirm'))) {
      resetToSave();
    }
  }

  return (
    <div className="action-log">
      {/* Resumen de cambios */}
      <div className="log-summary">
        <div className="summary-row">
          <span className="summary-label">{t('log.initialGold')}</span>
          <span className="summary-value">{originalState.gold} 🪙</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">{t('log.currentGold')}</span>
          <span className="summary-value">{gameState?.gold ?? 0} 🪙</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">{t('log.diff')}</span>
          <span className={`summary-value ${goldDiff > 0 ? 'positive' : goldDiff < 0 ? 'negative' : ''}`}>
            {goldDiff > 0 ? '+' : ''}{goldDiff} 🪙
          </span>
        </div>
        <div className="summary-row">
          <span className="summary-label">{t('log.actions')}</span>
          <span className="summary-value">{actionHistory.length}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="log-controls">
        <button
          className="btn btn-sm"
          onClick={undoAction}
          disabled={actionHistory.length === 0}
          title={t('log.undoLastTitle')}
        >
          {t('log.undoLast')}
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={handleReset}
          disabled={actionHistory.length === 0}
          title={t('log.resetTitle')}
        >
          {t('log.resetAll')}
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={handleExport}
          disabled={actionHistory.length === 0}
          title={t('log.exportTitle')}
        >
          {t('log.export')}
        </button>
      </div>

      {/* Lista de acciones */}
      {actionHistory.length === 0 ? (
        <div className="log-empty">
          <p>{t('log.noActions')}</p>
          <p>{t('log.noActionsHint')}</p>
        </div>
      ) : (
        <div className="log-list">
          {[...actionHistory].reverse().map((action, idx) => {
            const isLast = idx === 0;
            return (
              <div key={action.id} className={`log-entry ${isLast ? 'log-entry-latest' : ''}`}>
                <div className="log-entry-left">
                  <span className="log-icon">{ACTION_ICONS[action.type] || '•'}</span>
                  <div className="log-entry-info">
                    <span className="log-desc">{action.description}</span>
                    <span className="log-time">{formatTime(action.timestamp, dateLocale)}</span>
                  </div>
                </div>
                <button
                  className="btn btn-xs log-undo-btn"
                  onClick={() => undoUntil(action.id)}
                  title={t('log.undoHereTitle')}
                >
                  {t('log.undoHere')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
