import { useCallback } from 'react';
import { useStore } from '../store';

// URL relativa vacía = usa el mismo origen (descent.rybun.rocks en prod, localhost en dev)
export const SHARE_API = import.meta.env.VITE_SHARE_API_URL || '';

export function useShare() {
  const gameState      = useStore(s => s.gameState);
  const saveMeta       = useStore(s => s.saveMeta);
  const actionHistory  = useStore(s => s.actionHistory);
  const originalState  = useStore(s => s.originalState);
  const rawSaveContent = useStore(s => s.rawSaveContent);
  const heroLoadouts   = useStore(s => s.heroLoadouts);

  // rawSaveContent es el .SAV tal cual se subió: el servidor lo guarda para
  // que, al abrir el enlace, se reinterprete con el parser vigente EN ESE
  // MOMENTO en vez de con el que existía cuando se compartió — así un enlace
  // no se queda "congelado" sin los campos que se añadan más adelante (XP,
  // misiones, habilidades...). save/saveMeta se siguen mandando igual, solo
  // para que el feed público pueda mostrar una vista previa sin tener que
  // reinterpretar cada .SAV.
  const createShare = useCallback(async (label, isPrivate) => {
    const res = await fetch(`${SHARE_API}/api/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ save: gameState, saveMeta, actionHistory, originalState, rawSaveContent, heroLoadouts, label, private: isPrivate || false }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  }, [gameState, saveMeta, actionHistory, originalState, rawSaveContent, heroLoadouts]);

  const addSnapshot = useCallback(async (id, label) => {
    const res = await fetch(`${SHARE_API}/api/share/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ save: gameState, saveMeta, actionHistory, originalState, rawSaveContent, heroLoadouts, label }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  }, [gameState, saveMeta, actionHistory, originalState, rawSaveContent, heroLoadouts]);

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
