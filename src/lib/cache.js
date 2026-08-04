/**
 * Two-tier client cache.
 *
 * Tier 1 is an in-memory Map - instant, survives route changes, dies on reload.
 * Tier 2 is sessionStorage, so a reload or a return visit within the tab still
 * paints from cache while the network revalidates.
 *
 * Entries are namespaced by tag so a write can drop everything it affects
 * (e.g. saving a scholarship clears every cached scholarship list page).
 */

const STORAGE_PREFIX = "myscholy:cache:";
const memory = new Map();

let storage;
try {
  // Private-mode Safari and some embedded browsers throw on access.
  storage = window.sessionStorage;
  const probe = `${STORAGE_PREFIX}__probe`;
  storage.setItem(probe, "1");
  storage.removeItem(probe);
} catch {
  storage = null;
}

function now() {
  return Date.now();
}

function readStorage(key) {
  if (!storage) return undefined;
  try {
    const raw = storage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeStorage(key, entry) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota exceeded - drop our own entries and give up quietly.
    clearStorage();
  }
}

function clearStorage(predicate) {
  if (!storage) return;
  try {
    for (let i = storage.length - 1; i >= 0; i -= 1) {
      const key = storage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      if (!predicate || predicate(key.slice(STORAGE_PREFIX.length))) {
        storage.removeItem(key);
      }
    }
  } catch {
    /* nothing we can do */
  }
}

/** Read a cache entry. Returns `{ value, stale }` or `undefined` on a miss. */
export function get(key) {
  let entry = memory.get(key);
  if (!entry) {
    entry = readStorage(key);
    if (entry) memory.set(key, entry);
  }
  if (!entry) return undefined;

  if (entry.hardExpiry && entry.hardExpiry < now()) {
    remove(key);
    return undefined;
  }
  return { value: entry.value, stale: entry.expiry < now() };
}

/**
 * Store a value.
 * @param {number} ttl      milliseconds the value is considered fresh
 * @param {number} maxAge   milliseconds before it is discarded entirely;
 *                          between ttl and maxAge it is served as stale while
 *                          a background revalidation runs.
 */
export function set(key, value, { ttl = 60_000, maxAge = 30 * 60_000, tags = [] } = {}) {
  const entry = {
    value,
    expiry: now() + ttl,
    hardExpiry: now() + Math.max(ttl, maxAge),
    tags,
  };
  memory.set(key, entry);
  writeStorage(key, entry);
}

export function remove(key) {
  memory.delete(key);
  if (storage) {
    try {
      storage.removeItem(STORAGE_PREFIX + key);
    } catch {
      /* ignore */
    }
  }
}

/** Drop every entry carrying one of the given tags. */
export function invalidateTags(...tags) {
  const wanted = new Set(tags.flat());
  const dropped = new Set();

  for (const [key, entry] of memory) {
    if (entry.tags?.some((tag) => wanted.has(tag))) {
      dropped.add(key);
      memory.delete(key);
    }
  }

  clearStorage((key) => {
    if (dropped.has(key)) return true;
    const entry = readStorage(key);
    return Boolean(entry?.tags?.some((tag) => wanted.has(tag)));
  });
}

export function clear() {
  memory.clear();
  clearStorage();
}
