// src/api/discovery.ts
import { apiFetch } from './client';
import { getDiscoverySources } from '../prefs';

export interface DiscoveryResult {
  title: string;
  authors: string[];
  journal: string;
  year: string;
  doi: string;
  source: string;
  pmid?: string;
  s2_id?: string;
  url?: string;
  snippet?: string;
}

// Client-side TTL cache: key → {results, at}
const _cache = new Map<string, { results: DiscoveryResult[]; at: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(query: string, sources: string[], limit: number): string {
  return `${query.trim().toLowerCase()}|${[...sources].sort().join(',')}|${limit}`;
}

export function invalidateDiscoveryCache(): void {
  _cache.clear();
}

export async function discoverySearch(
  query: string,
  sources?: string[],
  limit?: number,
): Promise<DiscoveryResult[]> {
  const activeSources = sources ?? getDiscoverySources()
    .filter(s => s.enabled)
    .map(s => s.id);
  if (activeSources.length === 0) return [];

  const effectiveLimit = limit ?? 10;
  const key = cacheKey(query, activeSources, effectiveLimit);
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.results;

  const params = new URLSearchParams({
    q: query,
    sources: activeSources.join(','),
    limit: String(effectiveLimit),
  });
  const data = await apiFetch<{ results: DiscoveryResult[] }>(`/discovery/search?${params}`);
  _cache.set(key, { results: data.results, at: Date.now() });
  return data.results;
}
