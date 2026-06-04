import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useT, useLang, getName } from '../i18n';
import { useStore } from '../store';
import { useShare } from '../hooks/useShare';
import { HEROES_BY_ID } from '../gamedata/heroes';
import './ShareWindow.css';

// ── Panel: Compartir (+ versiones integradas) ─────────────────────────────────
function SharePanel({ onClose, fromShare, onLoadSnap }) {
  const t        = useT();
  const saveMeta = useStore(s => s.saveMeta);
  const { createShare, addSnapshot, getMeta } = useShare();

  const [shareData, setShareData] = useState(
    fromShare?.meta
      ? { id: fromShare.id, snapshot_count: fromShare.meta.snapshot_count, snapshots: fromShare.meta.snapshots || [] }
      : null
  );
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [copied,    setCopied]    = useState(false);
  const [snapLabel, setSnapLabel] = useState('');
  const [snapUrl,   setSnapUrl]   = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);

  const linkBase = import.meta.env.VITE_SHARE_LINK_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  const shareUrl = shareData ? `${linkBase}/${shareData.id}` : null;

  function snapLink(n) {
    return n === 0 ? `${linkBase}/${shareData.id}` : `${linkBase}/${shareData.id}/${n}`;
  }

  async function handleCreate() {
    setLoading(true); setError(null);
    try {
      const data = await createShare(saveMeta?.partyName || null, isPrivate);
      const meta = await getMeta(data.id);
      setShareData({ ...data, snapshot_count: meta?.snapshot_count || 1, snapshots: meta?.snapshots || [] });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleAddSnap() {
    if (!shareData?.write_token) return;
    setLoading(true); setError(null); setSnapUrl(null);
    try {
      const data = await addSnapshot(shareData.id, shareData.write_token, snapLabel || null);
      const newSnap = { n: data.n, label: snapLabel || null, created_at: new Date().toISOString() };
      setShareData(prev => ({
        ...prev,
        snapshot_count: (prev.snapshot_count || 1) + 1,
        snapshots: [...(prev.snapshots || []), newSnap],
      }));
      setSnapUrl(snapLink(data.n));
      setSnapLabel('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="sw-tab-body">
      {!shareData ? (
        /* ── Sin enlace todavía ─────────────────────────────────────── */
        <div className="sw-create-section">
          <p className="sw-desc">{t('share.desc')}</p>
          <label className="sw-private-row">
            <input
              type="checkbox"
              className="sw-private-check"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
            />
            <span className="sw-private-text">
              <span className="sw-private-label">{t('share.private')}</span>
              <span className="sw-private-subdesc">{t('share.privateDesc')}</span>
            </span>
          </label>
          <button className="sw-create-btn" onClick={handleCreate} disabled={loading}>
            {loading ? t('share.creating') : t('share.create')}
          </button>
        </div>
      ) : (
        /* ── Con enlace ────────────────────────────────────────────── */
        <>
          {/* Enlace principal */}
          <div className="sw-url-section">
            <span className="sw-url-label">{t('share.linkLabel')}</span>
            <div className="sw-url-row">
              <input
                className="sw-url-input"
                value={shareUrl}
                readOnly
                onFocus={e => e.target.select()}
              />
              <button
                className={`btn btn-sm sw-copy-btn ${copied ? 'copied' : ''}`}
                onClick={() => copy(shareUrl)}
              >
                {copied ? t('share.copied') : t('share.copy')}
              </button>
            </div>
          </div>

          {/* Guardar versión — solo cuando tenemos write_token (sesión de autor) */}
          {shareData.write_token && (
            <div className="sw-snap-section">
              <div className="sw-snap-header">{t('share.addSnap')}</div>
              <div className="sw-snap-row">
                <input
                  className="sw-snap-input"
                  placeholder={t('share.snapLabel')}
                  value={snapLabel}
                  onChange={e => setSnapLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSnap(); }}
                />
                <button className="btn btn-sm" onClick={handleAddSnap} disabled={loading}>
                  {loading ? '…' : t('share.addSnapBtn')}
                </button>
              </div>
              {snapUrl && (
                <button className="sw-snap-created" onClick={() => copy(snapUrl)}>
                  <span className="sw-snap-created-label">{t('share.snapCreated')}</span>
                  <span className="sw-snap-created-url">{snapUrl}</span>
                </button>
              )}
            </div>
          )}

          {/* Lista de versiones — siempre visible cuando hay snapshots */}
          {shareData.snapshots?.length > 0 && (
            <div className="sw-snaps-list">
              <div className="sw-snaps-title">{t('share.snapshots')}</div>
              {[...shareData.snapshots].reverse().map(s => {
                const isActive = fromShare && s.n === fromShare.currentSnap;
                return (
                  <div key={s.n} className={`sw-snap-entry ${isActive ? 'active' : ''}`}>
                    <span className="sw-snap-n">#{s.n}</span>
                    <span className="sw-snap-entry-label">{s.label || t('share.snapDefault')}</span>
                    <span className="sw-snap-date">{new Date(s.created_at).toLocaleDateString()}</span>
                    <div className="sw-snap-actions">
                      <button
                        className="sw-snap-copy-btn"
                        onClick={() => copy(snapLink(s.n))}
                        title={t('share.copy')}
                      >⎘</button>
                      {onLoadSnap && !isActive && (
                        <button
                          className="sw-snap-copy-btn"
                          onClick={() => onLoadSnap(s.n)}
                          title={t('share.loadSnap')}
                        >↓</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {error && <div className="sw-error">{error}</div>}
    </div>
  );
}

// ── Panel: Feed del grupo ──────────────────────────────────────────────────────
function HeroAvatars({ heroIds, isAct2 }) {
  if (!heroIds?.length) return null;
  return (
    <div className="sw-feed-heroes">
      {heroIds.map(id => {
        const hero = HEROES_BY_ID[id];
        if (!hero) return null;
        const src = isAct2 ? (hero.imageAct2 || hero.image) : hero.image;
        return <img key={id} src={src} alt={hero.name || id} className="sw-feed-avatar" onError={e => e.target.style.display = 'none'} />;
      })}
    </div>
  );
}

function FeedPanel({ onLoadShare, onClose }) {
  const t    = useT();
  const lang = useLang();
  const { getFeed, getSnapshot, getMeta } = useShare();

  const [entries,  setEntries]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(0);
  const [fetching, setFetching] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const LIMIT = 20;

  useEffect(() => { loadFeed(0); }, []);

  async function loadFeed(offset) {
    setFetching(true); setError(null);
    try {
      const data = await getFeed(LIMIT, offset);
      if (!data) throw new Error('No response');
      setEntries(data.entries);
      setTotal(data.total);
      setPage(Math.floor(offset / LIMIT));
    } catch (err) { setError(err.message); }
    finally { setFetching(false); }
  }

  async function handleLoad(entry) {
    setLoading(true); setError(null);
    try {
      const [snap, meta] = await Promise.all([getSnapshot(entry.id, 0), getMeta(entry.id)]);
      if (!snap) throw new Error('Could not load snapshot');
      onLoadShare({ snap, meta, id: entry.id });
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="sw-tab-body sw-feed-body">
      {fetching && <div className="sw-feed-state">{t('feed.loading')}</div>}
      {!fetching && entries.length === 0 && <div className="sw-feed-state">{t('feed.empty')}</div>}
      {!fetching && entries.map(entry => {
        const isAct2 = (entry.act ?? 0) >= 1;
        const date = new Date(entry.created_at).toLocaleDateString(t('locale.date'), { day: 'numeric', month: 'short', year: 'numeric' });
        return (
          <div key={entry.id} className="sw-feed-entry">
            <HeroAvatars heroIds={entry.heroes} isAct2={isAct2} />
            <div className="sw-feed-info">
              <div className="sw-feed-name">{entry.partyName || entry.label || t('app.noParty')}</div>
              <div className="sw-feed-meta">
                <span className="sw-feed-act">{t('app.act')} {(entry.act ?? 0) + 1}</span>
                {entry.actionCount > 0 && <span>{entry.actionCount} {t('feed.actions')}</span>}
                {entry.snapshot_count > 1 && <span>{entry.snapshot_count} {t('feed.snaps')}</span>}
                <span className="sw-feed-date">{date}</span>
              </div>
            </div>
            <button className="btn btn-sm" onClick={() => handleLoad(entry)} disabled={loading}>{t('feed.load')}</button>
          </div>
        );
      })}
      {error && <div className="sw-error">{error}</div>}
      {totalPages > 1 && (
        <div className="sw-feed-pagination">
          <button className="btn btn-sm" onClick={() => loadFeed((page - 1) * LIMIT)} disabled={page === 0 || fetching}>←</button>
          <span>{page + 1} / {totalPages}</span>
          <button className="btn btn-sm" onClick={() => loadFeed((page + 1) * LIMIT)} disabled={page >= totalPages - 1 || fetching}>→</button>
        </div>
      )}
    </div>
  );
}

// ── Ventana principal ──────────────────────────────────────────────────────────
export default function ShareWindow({ onClose, saveLoaded, fromShare, onLoadSnap, onLoadShare }) {
  const t = useT();

  return createPortal(
    <div className="sw-overlay" onClick={onClose}>
      <div className="sw-modal" onClick={e => e.stopPropagation()}>

        <div className="sw-header">
          <span className="sw-title">
            {saveLoaded ? t('sw.tabShare') : t('sw.tabGroup')}
          </span>
          <button className="sw-close" onClick={onClose}>✕</button>
        </div>

        {saveLoaded
          ? <SharePanel
              onClose={onClose}
              fromShare={fromShare}
              onLoadSnap={onLoadSnap ? (n) => { onLoadSnap(n); onClose(); } : null}
            />
          : <FeedPanel onLoadShare={onLoadShare} onClose={onClose} />
        }

      </div>
    </div>
  , document.body);
}
