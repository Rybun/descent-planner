import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useT, useLang, getName } from '../i18n';
import { useStore } from '../store';
import { useShare, getMyShares, SHARE_API } from '../hooks/useShare';
import { HEROES_BY_ID } from '../gamedata/heroes';
import './ShareWindow.css';

// ── Tab: Compartir ─────────────────────────────────────────────────────────────
function ShareTab({ onClose }) {
  const t        = useT();
  const saveMeta = useStore(s => s.saveMeta);
  const { createShare, addSnapshot } = useShare();

  const slotGUID      = saveMeta?.slotGUID;
  const existingShare = slotGUID ? (getMyShares()[slotGUID] || null) : null;

  const [shareData, setShareData] = useState(existingShare);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [copied,    setCopied]    = useState(false);
  const [snapLabel, setSnapLabel] = useState('');
  const [snapUrl,   setSnapUrl]   = useState(null);

  const linkBase = import.meta.env.VITE_SHARE_LINK_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  const shareUrl = shareData ? `${linkBase}/${shareData.id}` : null;

  async function handleCreate() {
    setLoading(true); setError(null);
    try {
      const data = await createShare(saveMeta?.partyName || null);
      setShareData({ ...data, snapshot_count: 1, snapshots: [{ n: 0, label: null, created_at: new Date().toISOString() }] });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleAddSnap() {
    if (!shareData?.write_token) return;
    setLoading(true); setError(null); setSnapUrl(null);
    try {
      const data = await addSnapshot(shareData.id, shareData.write_token, snapLabel || null);
      const newSnap = { n: data.n, label: snapLabel || null, created_at: new Date().toISOString() };
      setShareData(prev => ({ ...prev, snapshot_count: (prev.snapshot_count || 1) + 1, snapshots: [...(prev.snapshots || []), newSnap] }));
      setSnapUrl(`${linkBase}/${shareData.id}/${data.n}`);
      setSnapLabel('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="sw-tab-body">
      {!shareData ? (
        <div className="sw-create-section">
          <p className="sw-desc">{t('share.desc')}</p>
          <button className="btn sw-create-btn" onClick={handleCreate} disabled={loading}>
            {loading ? t('share.creating') : t('share.create')}
          </button>
        </div>
      ) : (
        <>
          <div className="sw-url-section">
            <span className="sw-url-label">{t('share.linkLabel')}</span>
            <div className="sw-url-row">
              <input className="sw-url-input" value={shareUrl} readOnly onFocus={e => e.target.select()} />
              <button className={`btn btn-sm sw-copy-btn ${copied ? 'copied' : ''}`} onClick={() => copy(shareUrl)}>
                {copied ? t('share.copied') : t('share.copy')}
              </button>
            </div>
          </div>

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

          {shareData.snapshots?.length > 1 && (
            <div className="sw-snaps-list">
              <div className="sw-snaps-title">{t('share.snapshots')}</div>
              {[...shareData.snapshots].reverse().map(s => (
                <div key={s.n} className="sw-snap-entry">
                  <span className="sw-snap-n">#{s.n}</span>
                  <span className="sw-snap-entry-label">{s.label || t('share.snapDefault')}</span>
                  <span className="sw-snap-date">{new Date(s.created_at).toLocaleDateString()}</span>
                  <button className="sw-snap-copy-btn" onClick={() => copy(s.n === 0 ? `${linkBase}/${shareData.id}` : `${linkBase}/${shareData.id}/${s.n}`)} title={t('share.copy')}>⎘</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {error && <div className="sw-error">{error}</div>}
    </div>
  );
}

// ── Tab: Grupo (feed) ──────────────────────────────────────────────────────────
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

function FeedTab({ onLoadShare, onClose }) {
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

// ── Tab: Checkpoints ───────────────────────────────────────────────────────────
function SnapsTab({ fromShare, onLoadSnap }) {
  const t = useT();
  if (!fromShare?.meta?.snapshots?.length) return (
    <div className="sw-tab-body"><div className="sw-feed-state">{t('share.snapDefault')}</div></div>
  );
  return (
    <div className="sw-tab-body">
      {fromShare.meta.snapshots.map(s => (
        <button
          key={s.n}
          className={`sw-snap-pick-entry ${s.n === fromShare.currentSnap ? 'active' : ''}`}
          onClick={() => onLoadSnap(s.n)}
        >
          <span className="sw-snap-n">#{s.n}</span>
          <span className="sw-snap-pick-label">{s.label || t('share.snapDefault')}</span>
          <span className="sw-snap-date">{new Date(s.created_at).toLocaleDateString()}</span>
        </button>
      ))}
    </div>
  );
}

// ── Ventana principal ──────────────────────────────────────────────────────────
export default function ShareWindow({ onClose, saveLoaded, fromShare, onLoadSnap, onLoadShare }) {
  const t = useT();

  const tabs = [
    ...(saveLoaded ? [{ id: 'share', label: t('sw.tabShare') }] : []),
    { id: 'feed',  label: t('sw.tabGroup') },
    ...(fromShare  ? [{ id: 'snaps', label: t('sw.tabSnaps') }] : []),
  ];

  const [tab, setTab] = useState(saveLoaded ? 'share' : 'feed');

  return createPortal(
    <div className="sw-overlay" onClick={onClose}>
      <div className="sw-modal" onClick={e => e.stopPropagation()}>

        <div className="sw-header">
          <div className="sw-tabs">
            {tabs.map(tb => (
              <button key={tb.id} className={`sw-tab ${tab === tb.id ? 'active' : ''}`} onClick={() => setTab(tb.id)}>
                {tb.label}
              </button>
            ))}
          </div>
          <button className="sw-close" onClick={onClose}>✕</button>
        </div>

        {tab === 'share' && saveLoaded && <ShareTab onClose={onClose} />}
        {tab === 'feed'  && <FeedTab onLoadShare={onLoadShare} onClose={onClose} />}
        {tab === 'snaps' && fromShare && <SnapsTab fromShare={fromShare} onLoadSnap={(n) => { onLoadSnap(n); onClose(); }} />}

      </div>
    </div>
  , document.body);
}
