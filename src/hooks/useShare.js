import { useCallback } from 'react';
import { useStore } from '../store';

// URL relativa vacía = usa el mismo origen (descent.rybun.rocks en prod, localhost en dev)
export const SHARE_API = import.meta.env.VITE_SHARE_API_URL || '';

const LS_KEY = 'descent_shares'; // { [slotGUID]: { id, write_token, label, snapshot_count, snapshots[] } }

export function getMyShares() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

function persistShare(slotGUID, data) {
  if (!slotGUID) return;
  const all = getMyShares();
  all[slotGUID] = { ...all[slotGUID], ...data };
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

export function useShare() {
  const gameState     = useStore(s => s.gameState);
  const saveMeta      = useStore(s => s.saveMeta);
  const actionHistory = useStore(s => s.actionHistory);

  const createShare = useCallback(async (label) => {
    const res = await fetch(`${SHARE_API}/api/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ save: gameState, saveMeta, actionHistory, label }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const data = await res.json();
    const now = new Date().toISOString();
    persistShare(saveMeta?.slotGUID, {
      id:             data.id,
      write_token:    data.write_token,
      label:          label || saveMeta?.partyName || null,
      snapshot_count: 1,
      snapshots:      [{ n: 0, label: label || null, created_at: now }],
    });
    return data;
  }, [gameState, saveMeta, actionHistory]);

  const addSnapshot = useCallback(async (id, writeToken, label) => {
    const res = await fetch(`${SHARE_API}/api/share/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Write-Token': writeToken },
      body: JSON.stringify({ save: gameState, saveMeta, actionHistory, label }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const data = await res.json();
    const slotGUID = saveMeta?.slotGUID;
    if (slotGUID) {
      const all  = getMyShares();
      const mine = all[slotGUID];
      if (mine) {
        mine.snapshot_count = (mine.snapshot_count || 1) + 1;
        mine.snapshots = [
          ...(mine.snapshots || []),
          { n: data.n, label: label || null, created_at: new Date().toISOString() },
        ];
        localStorage.setItem(LS_KEY, JSON.stringify(all));
      }
    }
    return data;
  }, [gameState, saveMeta, actionHistory]);

  const getMeta = useCallback(async (id) => {
    const res = await fetch(`${SHARE_API}/api/share/${id}`);
    if (!res.ok) return null;
    return res.json();
  }, []);

  const getSnapshot = useCallback(async (id, n = 0) => {
    const res = await fetch(`${SHARE_API}/api/share/${id}/${n}`);
    if (!res.ok) return null;
    return res.json();
  }, []);

  const getFeed = useCallback(async (limit = 30, offset = 0) => {
    const res = await fetch(`${SHARE_API}/api/feed?limit=${limit}&offset=${offset}`);
    if (!res.ok) return null;
    return res.json();
  }, []);

  return { createShare, addSnapshot, getMeta, getSnapshot, getFeed };
}
