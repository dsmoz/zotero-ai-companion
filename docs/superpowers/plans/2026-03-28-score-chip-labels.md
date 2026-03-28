# Score Chip Labels & Similarity Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace numeric similarity scores in the Related Documents panel with word labels (Best / Good / Fair) and add a minimum match preference to filter which documents appear.

**Architecture:** Add `SCORE_THRESHOLDS` and `getRelatedMinScore()` to `prefs.ts`; update `ScoreChip` to render a word label using a pure `scoreLabel()` helper; filter results in `RelatedDocsPanel` before render; add a segmented control row to `Settings.tsx`.

**Tech Stack:** React 18, TypeScript, Zotero Prefs API, esbuild

---

## File Map

| File | Change |
|------|--------|
| `src/prefs.ts` | Add `chatRelatedMinLabel` default, `SCORE_THRESHOLDS` constant, `getRelatedMinScore()`, `getChatRelatedMinLabel()`, `setChatRelatedMinLabel()` |
| `src/ui/components/ScoreChip.tsx` | Replace integer display with word label via `scoreLabel()` helper |
| `src/ui/components/RelatedDocsPanel.tsx` | Filter `items` by `getRelatedMinScore()` before rendering |
| `src/ui/Settings.tsx` | Add "Minimum match" segmented row to CHAT section |

---

### Task 1: Add threshold constants and pref to `prefs.ts`

**Files:**
- Modify: `src/prefs.ts`

- [ ] **Step 1: Add `chatRelatedMinLabel` to DEFAULTS and export helpers**

Replace the content of `src/prefs.ts` with the following (adds `chatRelatedMinLabel` default, `SCORE_THRESHOLDS`, `getRelatedMinScore`, `getChatRelatedMinLabel`, `setChatRelatedMinLabel`):

```typescript
// src/prefs.ts
const PREFIX = 'extensions.zotero-ai';

const DEFAULTS = {
  apiUrl: 'http://localhost:6500',
  syncInterval: 12,
  syncOnStartup: true,
  autoSync: true,
  theme: 'auto',
  accentColor: 'blue',
  graphNodeSize: 'M',
  chatModel: 'google/gemma-2-9b-it',
  chatMaxChunks: 8,
  chatRelatedMax: 5,
  chatRelatedMinLabel: 'Good',
  chatStream: true,
  discoveryPubmed: true,
  discoverySemanticScholar: true,
  discoveryOpenAlex: false,
  autoCascadeDelete: false,
} as const;

type PrefKey = keyof typeof DEFAULTS;

function get<K extends PrefKey>(key: K): typeof DEFAULTS[K] {
  const val = (globalThis as any).Zotero?.Prefs?.get(`${PREFIX}.${key}`);
  return val !== undefined ? (val as typeof DEFAULTS[K]) : DEFAULTS[key];
}

function set<K extends PrefKey>(key: K, value: typeof DEFAULTS[K]): void {
  (globalThis as any).Zotero?.Prefs?.set(`${PREFIX}.${key}`, value);
}

export const SCORE_THRESHOLDS: Record<string, number> = {
  Best: 0.75,
  Good: 0.60,
  Fair: 0.45,
};

export const getApiUrl = () => get('apiUrl') as string;
export const setApiUrl = (v: string) => set('apiUrl', v as typeof DEFAULTS['apiUrl']);
export const getSyncInterval = () => get('syncInterval') as number;
export const setSyncInterval = (v: number) => set('syncInterval', v as typeof DEFAULTS['syncInterval']);
export const getTheme = () => get('theme') as string;
export const setTheme = (v: string) => set('theme', v as typeof DEFAULTS['theme']);
export const getAccentColor = () => get('accentColor') as string;
export const setAccentColor = (v: string) => set('accentColor', v as typeof DEFAULTS['accentColor']);
export const getGraphNodeSize = () => get('graphNodeSize') as string;
export const getChatModel = () => get('chatModel') as string;
export const getChatMaxChunks = () => get('chatMaxChunks') as number;
export const getChatRelatedMax = () => get('chatRelatedMax') as number;
export const getChatRelatedMinLabel = () => get('chatRelatedMinLabel') as string;
export const setChatRelatedMinLabel = (v: string) => set('chatRelatedMinLabel', v as typeof DEFAULTS['chatRelatedMinLabel']);
export const getRelatedMinScore = () => SCORE_THRESHOLDS[getChatRelatedMinLabel()] ?? 0.60;
export const getChatStream = () => get('chatStream') as boolean;
export const getSyncOnStartup = () => get('syncOnStartup') as boolean;
export const getAutoSync = () => get('autoSync') as boolean;
export const getAutoCascadeDelete = () => get('autoCascadeDelete') as boolean;
export const getDiscoverySources = () => ({
  pubmed: get('discoveryPubmed') as boolean,
  semantic_scholar: get('discoverySemanticScholar') as boolean,
  openalex: get('discoveryOpenAlex') as boolean,
});
export { set as setPref, get as getPref };
```

- [ ] **Step 2: Commit**

```bash
git add src/prefs.ts
git commit -m "feat: add chatRelatedMinLabel pref and SCORE_THRESHOLDS"
```

---

### Task 2: Update `ScoreChip` to show word labels

**Files:**
- Modify: `src/ui/components/ScoreChip.tsx`

- [ ] **Step 1: Rewrite `ScoreChip.tsx`**

```typescript
import React from 'react';
import { SCORE_THRESHOLDS } from '../../prefs';

interface Props { score: number; }

export function scoreLabel(score: number): 'Best' | 'Good' | 'Fair' {
  if (score >= SCORE_THRESHOLDS.Best) return 'Best';
  if (score >= SCORE_THRESHOLDS.Good) return 'Good';
  return 'Fair';
}

export function ScoreChip({ score }: Props) {
  const label = scoreLabel(score);
  const color = label === 'Best' ? '#a6e3a1' : label === 'Good' ? '#f9e2af' : '#f38ba8';
  return (
    <span style={{
      background: color, color: '#1e1e2e',
      borderRadius: 3, padding: '1px 6px',
      fontSize: '0.65rem', fontWeight: 600,
    }}>
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/components/ScoreChip.tsx
git commit -m "feat: replace numeric score with word label in ScoreChip"
```

---

### Task 3: Filter results in `RelatedDocsPanel`

**Files:**
- Modify: `src/ui/components/RelatedDocsPanel.tsx`

- [ ] **Step 1: Import `getRelatedMinScore` and filter items before render**

Add `getRelatedMinScore` to the import from `../../prefs`, then filter the items array before rendering. Replace the import line and the two `setItems` call sites:

```typescript
// src/ui/components/RelatedDocsPanel.tsx
import React, { useState, useEffect } from 'react';
import { ArrowsIn, ArrowsOut, Chat } from '@phosphor-icons/react';
import { similarToMany, semanticSearch, SearchResult } from '../../api/search';
import { getChatRelatedMax, getRelatedMinScore } from '../../prefs';
import { ScoreChip } from './ScoreChip';

function openDocChat(zoteroKey: string) {
  const target: Window = (window.opener as Window) ?? window;
  target.dispatchEvent(new CustomEvent('zotero-ai-command', {
    detail: { command: 'openSingleDocChat', keys: [zoteroKey] },
    bubbles: true,
  }));
}

interface Props {
  sourceKeys?: string[];
  query?: string;
}

export function RelatedDocsPanel({ sourceKeys = [], query }: Props) {
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const limit = getChatRelatedMax();
    const minScore = getRelatedMinScore();
    const filter = (results: SearchResult[]) => results.filter(r => r.score >= minScore);

    if (query) {
      setLoading(true);
      semanticSearch(query, limit)
        .then(r => setItems(filter(r)))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else if (sourceKeys.length > 0) {
      setLoading(true);
      similarToMany(sourceKeys, limit)
        .then(r => setItems(filter(r)))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sourceKeys.join(','), query ?? '']);

  if (!loading && items.length === 0) return null;

  return (
    <div style={{
      borderTop: '1px solid #313244',
      background: '#181825',
      flexShrink: 0,
    }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'transparent', border: 'none',
          padding: '5px 10px', cursor: 'pointer', color: '#6c7086',
        }}
      >
        <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Related documents {!loading && `(${items.length})`}
        </span>
        {collapsed ? <ArrowsOut size={11} /> : <ArrowsIn size={11} />}
      </button>

      {!collapsed && (
        <div style={{ paddingBottom: 6 }}>
          {loading ? (
            <div style={{ padding: '4px 10px', color: '#6c7086', fontSize: '0.7rem' }}>Loading…</div>
          ) : (
            items.map(item => (
              <div key={item.zotero_key} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '3px 10px',
              }}>
                <ScoreChip score={item.score} />
                <span style={{
                  flex: 1, color: '#cdd6f4', fontSize: '0.72rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </span>
                {item.date && (
                  <span style={{ color: '#6c7086', fontSize: '0.65rem', flexShrink: 0 }}>
                    {item.date.slice(0, 4)}
                  </span>
                )}
                <button
                  onClick={() => openDocChat(item.zotero_key)}
                  title="Chat with this document"
                  style={{
                    background: 'transparent', border: 'none', flexShrink: 0,
                    color: '#6c7086', cursor: 'pointer', padding: '1px 2px',
                    display: 'flex', alignItems: 'center',
                    borderRadius: 3,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent, #89b4fa)')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6c7086')}
                >
                  <Chat size={12} weight="regular" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/components/RelatedDocsPanel.tsx
git commit -m "feat: filter related docs by minimum match threshold"
```

---

### Task 4: Add "Minimum match" setting to `Settings.tsx`

**Files:**
- Modify: `src/ui/Settings.tsx`

- [ ] **Step 1: Import new pref helpers**

Update the import from `../prefs` to include `getChatRelatedMinLabel` and `setChatRelatedMinLabel`:

```typescript
import {
  getApiUrl, setApiUrl, getSyncInterval, setSyncInterval,
  getTheme, setTheme, getAutoSync, getChatModel, getChatMaxChunks, getChatRelatedMax,
  getSyncOnStartup, getDiscoverySources, setPref,
  getChatRelatedMinLabel, setChatRelatedMinLabel,
} from '../prefs';
```

- [ ] **Step 2: Add state for `chatRelatedMinLabel`**

Add after the `chatRelatedMax` state line (line 28):

```typescript
const [chatRelatedMinLabel, setChatRelatedMinLabelState] = useState(getChatRelatedMinLabel());
```

- [ ] **Step 3: Add the settings row in the CHAT section**

Add after the "Related docs" row (after line 116 in original, inside the CHAT `<section>`):

```typescript
{row('Minimum match', segmented(['Fair', 'Good', 'Best'], chatRelatedMinLabel, v => {
  setChatRelatedMinLabelState(v);
  setChatRelatedMinLabel(v);
}))}
```

- [ ] **Step 4: Commit**

```bash
git add src/ui/Settings.tsx
git commit -m "feat: add minimum match setting to preferences"
```

---

### Task 5: Build and verify

- [ ] **Step 1: Build the plugin**

```bash
npm run build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 2: Manual verification checklist**

1. Reload the plugin in Zotero (Tools → Developer → Restart with Logging, or reload the plugin).
2. Open a document that has indexed content → Related Documents panel appears.
3. Chips show "Best", "Good", or "Fair" — no numbers.
4. Open Settings → CHAT section → "Minimum match" row is present with Fair / Good / Best segments. "Good" is selected by default.
5. Switch to "Best" → only high-similarity docs appear (or panel hides if none qualify).
6. Switch to "Fair" → more docs appear.
7. Restart Zotero → the preference persists.

- [ ] **Step 3: Final commit if any build fixes were needed**

```bash
git add -p
git commit -m "fix: build corrections after score label integration"
```
