# API Cache System — Design Spec

**Date:** 2026-03-29

## Context

Building author profiles and related documents both hit the backend on every user interaction — switching authors on the same item re-fetches the full profile, and the Related Documents panel re-queries on every tab visit. These operations involve vector similarity lookups and author indexing on the server, making repeated identical requests wasteful. A client-side TTL cache eliminates redundant fetches during a working session while staying simple and dependency-free.

---

## 1. `TTLCache` Utility

**File:** `src/api/apiCache.ts`

A generic class used by both API modules:

```typescript
class TTLCache<K, V> {
  constructor(getTtlMs: () => number)
  get(key: K): V | null       // null if missing or expired
  set(key: K, value: V): void // stores with expiry = now + getTtlMs()
  clear(): void               // manual invalidation / testing
}
```

**Internals:**
- Backing store: `Map<K, { value: V; expiresAt: number }>`
- Eviction is lazy — expired entries are removed on `get()`, not via a background timer
- `getTtlMs` is a function (not a value) so it reads the current preference on every `set()` call

---

## 2. Cache Instances in API Modules

### `src/api/author.ts`

```typescript
const authorCache = new TTLCache<string, AuthorProfile>(() => getTtlMs());
```

- `fetchAuthorProfile(name)`: check `authorCache.get(name)` first; on miss, fetch and store result

### `src/api/search.ts`

```typescript
const similarCache = new TTLCache<string, SearchResult[]>(() => getTtlMs());
```

Cache keys:
- `similarItems(zoteroKey)` → key is `zoteroKey`
- `similarToMany(keys, limit)` → key is sorted keys joined: `"abc|def|xyz:5"` (include limit to avoid stale results on limit change)

`semanticSearch` is query-driven and non-repetitive — not cached (YAGNI).

---

## 3. Preferences

### `src/prefs.ts`

Add:
```typescript
export const getCacheTtlMinutes = () => get('cacheTtlMinutes') as number  // default: 30
export const getTtlMs = () => getCacheTtlMinutes() * 60 * 1000
```

Default registration (wherever other defaults are set):
```typescript
{ key: 'cacheTtlMinutes', val: 30 }
```

### `src/ui/Settings.tsx`

Add a "Cache duration" dropdown in the Performance section:

| Label    | Value |
|----------|-------|
| 10 minutes | 10  |
| 30 minutes | 30  |
| 1 hour     | 60  |

Pref key: `cacheTtlMinutes`. No cache-clear button — TTL handles expiry; Zotero restart clears in-memory cache.

---

## 4. Data Flow

```
User action (click author / open Related panel)
  → API function called
  → cache.get(key)
      hit  → return cached value immediately
      miss → fetch from server → cache.set(key, result) → return result
```

---

## 5. Verification

- Switch between authors on the same item rapidly — only the first request should hit the network (check DevTools / Zotero console)
- Open Related Documents panel, close, reopen — no new network request within TTL window
- Change TTL preference to 10 min, wait 11 min, reopen — fresh fetch occurs
- `similarToMany` with different key orderings should produce same cache key (sorted)
- Unit test `TTLCache`: hit, miss, expiry, clear
