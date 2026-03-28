# Zotero AI Companion — CLAUDE.md

See [README.md](README.md) for project overview, features, and user-facing docs.

## Build and release

```bash
npm run build     # builds XPI to build/zotero-ai-companion.xpi
npm run release   # bumps patch version, builds, pushes to GitHub, creates release
```

**Do not run `npm run release` unless the user explicitly asks.** Use `npm run build` for testing changes.

The release script bumps version in `package.json` + `addon/manifest.json`, builds, updates `update.json`, commits, tags, pushes, and creates a GitHub release with the XPI attached.

## Source map

```
src/
  bootstrap.ts        Plugin lifecycle: startup, shutdown, onMainWindowLoad/Unload
  menu.ts             Tools menu + context menu (XUL oncommand pattern)
  events.ts           Zotero item event hooks
  prefs.ts            All preferences + defaults (prefix: extensions.zotero-ai)
  panel.tsx           Panel entry point — reads ?panel= URL param, renders component

  api/
    client.ts         apiFetch() — base URL from prefs, 3x retry on 5xx
    health.ts         fetchLibraryHealth (60s cache), indexAllPending, fixOrphans, invalidateHealthCache
    graph.ts          fetchGraphData (5min cache), invalidateGraphCache
    sync.ts           triggerSync
    sync-status.ts    fetchSyncStatus, updateItemMetadata, patchSyncStatus
    chat.ts           streamChat (SSE)
    search.ts         semanticSearch
    discovery.ts      discoverySearch
    jobs.ts           fetchJobs, retryJob
    author.ts         fetchAuthor

  ui/
    HealthPanel.tsx   Stats + paginated issues list + action buttons
    GraphTab.tsx      D3 graph via iframe + postMessage
    DiscoveryPanel.tsx External source search
    IndexQueue.tsx    Job queue monitor
    ItemPaneTab.tsx   AI tab in item pane (chat + similar)
    Settings.tsx      All settings UI
    components/       SectionHeader, StatusDot, Toggle, ConfirmDialog, ScoreChip

  graph/
    network.html      D3 force graph — loads d3.min.js locally (NO CDN)
```

## Critical Zotero 7 constraints

- **`strict_min_version: "6.999"`** — Zotero 7's internal version. `"7.0"` breaks installation.
- **`update_url` required** in `manifest.json` — omitting it causes "Extension is invalid".
- **`icons` field required** in `manifest.json`.
- **Panels must be `.xhtml`** — `openDialog` with `.html` fails silently in chrome context.
- **No CDN** — Zotero's chrome sandbox blocks external requests. D3 is bundled from `node_modules/d3/dist/d3.min.js`.
- **XUL menus**: use `setAttribute('oncommand', inlineJS)` — `addEventListener('command')` does not fire.
- **Window lookup**: use `Services.wm.getEnumerator('')` loop — `getWindowByName` does not exist.
- **Bootstrap shim**: `ctx._globalThis = ctx` — lifecycle functions (`startup`, `shutdown`, etc.) are set directly on `_globalThis`, not `exports`.

## Backend

Flask backend at `/Users/danilodasilva/Documents/Programming/mcp-servers/mcp-zotero-qdrant`.

All calls go through `apiFetch()` → base URL from prefs (default `http://localhost:6500`) + prefix `/api/plugin`.

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Connection check |
| `/health/library` | GET | Library stats + issues |
| `/sync` | POST | Queue all unindexed items |
| `/cleanup/orphans` | POST | Remove orphaned synctracker records |
| `/graph/nodes` | GET | D3 graph data |
| `/search` | GET | Semantic search |
| `/similar/:key` | GET | Similar items |
| `/chat/stream` | POST | SSE chat stream |
| `/discovery/search` | GET | External source search |
| `/jobs` | GET | Queue status |
| `/jobs/:id/retry` | POST | Retry failed job |
| `/items/:key` | DELETE | Cascade delete |
| `/sync-status` | GET | All item sync statuses |
| `/items/:key/sync-status` | PATCH | Update one item status |
| `/items/:key/metadata` | POST | Queue AI metadata update |

## Caching

- **Health**: 60s TTL — call `invalidateHealthCache()` after any mutation (indexAllPending, fixOrphans).
- **Graph**: 5min TTL — call `invalidateGraphCache()` after mutations.
- Pagination in HealthPanel reads from cache — no extra API calls on page turns.

## Preferences

Stored under `extensions.zotero-ai.*` via `Zotero.Prefs`. All defaults in `src/prefs.ts`.

| Key | Default |
|---|---|
| `apiUrl` | `http://localhost:6500` |
| `syncInterval` | `12` (hours) |
| `syncOnStartup` | `true` |
| `autoSync` | `true` |
| `theme` | `auto` |
| `chatModel` | `google/gemma-2-9b-it` |
| `chatMaxChunks` | `8` |
| `healthPageSize` | `10` |
| `discoveryPubmed` | `true` |
| `discoverySemanticScholar` | `true` |
| `discoveryOpenAlex` | `false` |

## GitHub

Repo: `dsmoz/zotero-ai-companion` — releases tagged `vX.Y.Z`, XPI as `zotero-ai-companion.xpi`. `update.json` on `main` is what Zotero polls for auto-updates.
