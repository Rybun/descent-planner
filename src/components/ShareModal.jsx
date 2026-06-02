import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../i18n';
import { useStore } from '../store';
import { useShare, getMyShares, SHARE_API } from '../hooks/useShare';
import './ShareModal.css';

export default function ShareModal({ onClose }) {
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
    setLoading(true);
    setError(null);
    try {
      const data = await createShare(saveMeta?.partyName || null);
      setShareData({
        ...data,
        snapshot_count: 1,
        snapshots: [{ n: 0, label: null, created_at: new Date().toISOString() }],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSnap() {
    if (!shareData?.write_token) return;
    setLoading(true);
    setError(null);
    setSnapUrl(null);
    try {
      const data = await addSnapshot(shareData.id, shareData.write_token, snapLabel || null);
      const newSnap = { n: data.n, label: snapLabel || null, created_at: new Date().toISOString() };
      setShareData(prev => ({
        ...prev,
        snapshot_count: (prev.snapshot_count || 1) + 1,
        snapshots: [...(prev.snapshots || []), newSnap],
      }));
      setSnapUrl(`${linkBase}/${shareData.id}/${data.n}`);
      setSnapLabel('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return createPortal(
    <div className="shr-overlay" onClick={onClose}>
      <div className="shr-modal" onClick={e => e.stopPropagation()}>

        <div className="shr-header">
          <span className="shr-title">{t('share.title')}</span>
          <button className="shr-close" onClick={onClose}>✕</button>
        </div>

        <div className="shr-body">
          {!shareData ? (
            <div className="shr-create-section">
              <p className="shr-desc">{t('share.desc')}</p>
              <button className="btn shr-create-btn" onClick={handleCreate} disabled={loading}>
                {loading ? t('share.creating') : t('share.create')}
              </button>
            </div>
          ) : (
            <>
              {/* URL principal */}
              <div className="shr-url-section">
                <span className="shr-url-label">{t('share.linkLabel')}</span>
                <div className="shr-url-row">
                  <input
                    className="shr-url-input"
                    value={shareUrl}
                    readOnly
                    onFocus={e => e.target.select()}
                  />
                  <button
                    className={`btn btn-sm shr-copy-btn ${copied ? 'copied' : ''}`}
                    onClick={() => copy(shareUrl)}
                    type="button"
                  >
                    {copied ? t('share.copied') : t('share.copy')}
                  </button>
                </div>
              </div>

              {/* Añadir checkpoint */}
              {shareData.write_token && (
                <div className="shr-snap-section">
                  <div className="shr-snap-header">{t('share.addSnap')}</div>
                  <div className="shr-snap-row">
                    <input
                      className="shr-snap-input"
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
                    <button className="shr-snap-created" onClick={() => copy(snapUrl)}>
                      <span className="shr-snap-created-label">{t('share.snapCreated')}</span>
                      <span className="shr-snap-created-url">{snapUrl}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Lista de checkpoints */}
              {shareData.snapshots?.length > 1 && (
                <div className="shr-snaps-list">
                  <div className="shr-snaps-title">{t('share.snapshots')}</div>
                  {[...shareData.snapshots].reverse().map(s => (
                    <div key={s.n} className="shr-snap-entry">
                      <span className="shr-snap-n">#{s.n}</span>
                      <span className="shr-snap-entry-label">
                        {s.label || t('share.snapDefault')}
                      </span>
                      <span className="shr-snap-date">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                      <button
                        className="shr-snap-copy-btn"
                        onClick={() => copy(s.n === 0 ? `${linkBase}/${shareData.id}` : `${linkBase}/${shareData.id}/${s.n}`)}
                        title={t('share.copy')}
                      >⎘</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {error && <div className="shr-error">{error}</div>}
        </div>
      </div>
    </div>
  , document.body);
}
