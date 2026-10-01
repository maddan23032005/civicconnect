/**
 * Cache layer. Currently in-memory with TTL + LRU eviction.
 * API matches Redis so swapping to Upstash means editing this file only.
 */

const store = new Map();
const MAX_KEYS = 5000;

let hits = 0;
let misses = 0;

function isExpired(entry) {
  return entry.expiresAt !== null && entry.expiresAt < Date.now();
}

function evictIfNeeded() {
  if (store.size <= MAX_KEYS) return;
  const oldest = store.keys().next().value;
  store.delete(oldest);
}

export const cache = {
  async get(key) {
    const entry = store.get(key);
    if (!entry) { misses++; return null; }
    if (isExpired(entry)) { store.delete(key); misses++; return null; }
    hits++;
    store.delete(key);
    store.set(key, entry);           // refresh LRU position
    return entry.value;
  },

  async set(key, value, ttlSeconds = 300) {
    evictIfNeeded();
    store.set(key, {
      value,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
    });
    return "OK";
  },

  async del(key) {
    return store.delete(key) ? 1 : 0;
  },

  async delPattern(prefix) {
    let count = 0;
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) { store.delete(key); count++; }
    }
    return count;
  },

  async incr(key, ttlSeconds = 60) {
    const current = (await this.get(key)) || 0;
    const next = Number(current) + 1;
    await this.set(key, next, ttlSeconds);
    return next;
  },

  async flush() {
    store.clear();
    return "OK";
  },

  stats() {
    const total = hits + misses;
    return {
      keys: store.size,
      hits,
      misses,
      hitRate: total ? +((hits / total) * 100).toFixed(1) : 0,
      backend: "in-memory",
    };
  },
};

setInterval(() => {
  for (const [key, entry] of store.entries()) {
    if (isExpired(entry)) store.delete(key);
  }
}, 60_000).unref();

export async function cached(key, ttlSeconds, producer) {
  const hit = await cache.get(key);
  if (hit !== null) return hit;
  const value = await producer();
  await cache.set(key, value, ttlSeconds);
  return value;
}
