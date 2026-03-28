// src/api/graph.ts
import { apiFetch } from './client';

export interface GraphNode {
  id: string;
  title: string;
  collection: string;
  date: string;
  creators: Array<{ firstName: string; lastName: string }>;
  citation_count: number;
  in_library: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'semantic' | 'citation' | 'coauthor';
  weight: number;
  target_in_library: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const CACHE_TTL_MS = 5 * 60_000; // 5 minutes — graph data is expensive to compute
const graphCache = new Map<string, { data: GraphData; at: number }>();

export async function fetchGraphData(
  collection?: string,
  threshold = 0.75,
  force = false,
): Promise<GraphData> {
  const params = new URLSearchParams({ threshold: String(threshold) });
  if (collection) params.set('collection', collection);
  const cacheKey = params.toString();

  if (!force) {
    const cached = graphCache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;
  }

  const data = await apiFetch<GraphData>(`/graph/nodes?${params}`);
  graphCache.set(cacheKey, { data, at: Date.now() });
  return data;
}

export function invalidateGraphCache() {
  graphCache.clear();
}
