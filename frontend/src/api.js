import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_URL });

/* ─── Simple in-memory cache ───────────────────────────────
   Stores { data, ts } per cache key.
   TTL: 60 seconds (stale data is refetched transparently).
   Cache is busted whenever the user saves/edits/deletes.
─────────────────────────────────────────────────────────── */
const CACHE_TTL = 60_000; // 60 s
const _cache = new Map();

export function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.data;
}

export function cacheSet(key, data) {
  _cache.set(key, { data, ts: Date.now() });
}

/** Call after any mutating action (save/edit/delete) */
export function cacheBust(prefix) {
  for (const key of _cache.keys()) {
    if (!prefix || key.startsWith(prefix)) _cache.delete(key);
  }
}

export default api;
