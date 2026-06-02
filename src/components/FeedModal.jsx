import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useT, useLang, getName } from '../i18n';
import { HEROES_BY_ID } from '../gamedata/heroes';
import { useShare } from '../hooks/useShare';
import './FeedModal.css';

function HeroAvatars({ heroIds, isAct2 }) {
  if (!heroIds?.length) return null;
  return (
    <div className="feed-heroes">
      {heroIds.map(id => {
        const hero = HEROES_BY_ID[id];
        if (!hero) return null;
        const src = isAct2 ? (hero.imageAct2 || hero.image) : hero.image;
        return (
          <img
            key={id}
            src={src}
            alt={hero.name || id}
            className="feed-hero-avatar"
            onError={e => e.target.style.display = 'none'}
          />
        );
      })}
    </div>
  );
}

function FeedEntry({ entry, lang, onLoad, loading }) {
  const t = useT();
  const isAct2 = (entry.act ?? 0) >= 1;
  const date = new Date(entry.created_at).toLocaleDateString(t('locale.date'), {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="feed-entry">
      <div className="feed-entry-left">
        <HeroAvatars heroIds={entry.heroes} isAct2={isAct2} />
      </div>
      <div className="feed-entry-info">
        <div className="feed-entry-name">
          {entry.partyName || entry.label || t('app.noParty')}
        </div>
        <div className="feed-entry-meta">
          <span className="feed-entry-act">
            {t('app.act')} {(entry.act ?? 0) + 1}
          </span>
          {entry.actionCount > 0 && (
            <span className="feed-entry-actions">
              {entry.actionCount} {t('feed.actions')}
            </span>
          )}
          {entry.snapshot_count > 1 && (
            <span className="feed-entry-snaps">
              {entry.snapshot_count} {t('feed.snaps')}
            </span>
          )}
          <span className="feed-entry-date">{date}</span>
        </div>
      </div>
      <button
        className="btn btn-sm feed-load-btn"
        onClick={() => onLoad(entry)}
        disabled={loading}
      >
        {t('feed.load')}
      </button>
    </div>
  );
}

export default function FeedModal({ onClose, onLoadShare }) {
  const t    = useT();
  const lang = useLang();
  const { getFeed, getSnapshot, getMeta } = useShare();

  const [entries,  setEntries]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error,    setError]    = useState(null);

  const LIMIT = 20;

  useEffect(() => {
    loadFeed(0);
  }, []);

  async function loadFeed(offset) {
    setFetching(true);
    setError(null);
    try {
      const data = await getFeed(LIMIT, offset);
      if (!data) throw new Error('No response');
      setEntries(data.entries);
      setTotal(data.total);
      setPage(Math.floor(offset / LIMIT));
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }

  async function handleLoad(entry) {
    setLoading(true);
    setError(null);
    try {
      const snap = await getSnapshot(entry.id, 0);
      if (!snap) throw new Error('Could not load snapshot');
      const meta = await getMeta(entry.id);
      onLoadShare({ snap, meta, id: entry.id });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return createPortal(
    <div className="feed-overlay" onClick={onClose}>
      <div className="feed-modal" onClick={e => e.stopPropagation()}>

        <div className="feed-header">
          <span className="feed-title">{t('feed.title')}</span>
          <button className="feed-close" onClick={onClose}>✕</button>
        </div>

        <div className="feed-body">
          {fetching && (
            <div className="feed-loading">{t('feed.loading')}</div>
          )}

          {!fetching && entries.length === 0 && (
            <div className="feed-empty">{t('feed.empty')}</div>
          )}

          {!fetching && entries.map(entry => (
            <FeedEntry
              key={entry.id}
              entry={entry}
              lang={lang}
              onLoad={handleLoad}
              loading={loading}
            />
          ))}

          {error && <div className="feed-error">{error}</div>}

          {totalPages > 1 && (
            <div className="feed-pagination">
              <button
                className="btn btn-sm"
                onClick={() => loadFeed((page - 1) * LIMIT)}
                disabled={page === 0 || fetching}
              >←</button>
              <span className="feed-page-info">{page + 1} / {totalPages}</span>
              <button
                className="btn btn-sm"
                onClick={() => loadFeed((page + 1) * LIMIT)}
                disabled={page >= totalPages - 1 || fetching}
              >→</button>
            </div>
          )}
        </div>
      </div>
    </div>
  , document.body);
}
