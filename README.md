# Zotero AI Companion

A Zotero 7 plugin that connects to a local AI backend and adds semantic search, document chat, similarity graph, library health monitoring, discovery, and index queue management.

## Features

- **Semantic search** — find papers by meaning, not just keywords
- **Document chat** — ask questions about any paper with PDF
- **Similarity graph** — visual D3 force graph of related items
- **Library health** — indexed/unindexed stats, paginated issue list, bulk actions
- **Discovery** — search PubMed, Semantic Scholar, and OpenAlex from within Zotero
- **Index queue** — monitor and retry background indexing jobs
- **AI metadata** — queue AI-enhanced metadata updates per item

## Requirements

- Zotero 7.0+
- [mcp-zotero-qdrant](https://github.com/dsmoz/mcp-zotero-qdrant) Flask backend running locally (default: `http://localhost:6500`)

## Installation

### From GitHub release (recommended)

1. Go to [Releases](https://github.com/dsmoz/zotero-ai-companion/releases/latest)
2. Download `zotero-ai-companion.xpi`
3. In Zotero: **Tools → Add-ons → gear icon → Install Add-on From File**

### Auto-update

Once installed, Zotero will check for updates automatically. To update manually: **Tools → Add-ons → gear icon → Check for Updates**.

## Usage

All features are accessible from the **AI Companion** menu in Zotero's Tools menu, and via right-click context menu on items.

| Panel | What it does |
|---|---|
| Similarity Graph | Visual map of semantically related items |
| Discovery | Search external sources and import results |
| Library Health | Stats, issues, bulk index/fix actions |
| Index Queue | Monitor background indexing jobs |
| AI Settings | Configure backend URL, sync schedule, chat model |

The **AI tab** also appears inside the Zotero item pane for per-item chat and similar item recommendations.

## Development

### Prerequisites

```bash
node >= 18
npm install
```

### Build

```bash
npm run build
# → build/zotero-ai-companion.xpi
```

Install the XPI in Zotero via **Tools → Add-ons → gear → Install Add-on From File**.

### Release

```bash
npm run release          # patch bump: 0.1.4 → 0.1.5
npm run release minor    # minor bump: 0.1.4 → 0.2.0
npm run release major    # major bump: 0.1.4 → 1.0.0
npm run release 1.2.3    # explicit version
```

This bumps the version, builds the XPI, pushes to GitHub, and creates a release. The `update.json` on `main` is updated automatically so Zotero picks up the new version.

Requires [GitHub CLI](https://cli.github.com/) (`gh`) authenticated with the repo.

## Project structure

```
addon/
  manifest.json           # Zotero 7 web extension manifest
  content/
    panel.xhtml           # Chrome window for floating panels
    icons/favicon.png     # Plugin icon

src/
  bootstrap.ts            # Plugin lifecycle hooks
  menu.ts                 # Tools menu + context menu
  events.ts               # Zotero item event hooks
  prefs.ts                # Preferences with defaults
  panel.tsx               # Panel router (reads ?panel= param)
  api/                    # Backend API clients (with caching)
  ui/                     # React panel components
  graph/
    network.html          # D3 force graph (D3 bundled locally)

scripts/
  build.mjs               # esbuild + XPI packaging
  release.mjs             # Version bump + GitHub release automation

update.json               # Zotero auto-update manifest (on GitHub main)
```

## License

MIT
