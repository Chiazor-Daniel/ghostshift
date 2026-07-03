/** In-memory GET cache with TTL — makes page navigation feel instant. */

const store = new Map()

export function cacheGet(key) {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expires) {
    store.delete(key)
    return undefined
  }
  return entry.data
}

export function cacheSet(key, data, ttlMs = 45_000) {
  store.set(key, { data, expires: Date.now() + ttlMs })
}

export function cacheInvalidate(prefix = '') {
  if (!prefix) {
    store.clear()
    return
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

export function cacheTtlForPath(path) {
  if (path.includes('/analytics/executive-summary')) return 5 * 60_000
  if (path.includes('/analytics/burnout')) return 2 * 60_000
  if (path.includes('/integrations/ai/')) return 60_000
  return 45_000
}
