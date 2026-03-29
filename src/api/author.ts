// src/api/author.ts
import { apiFetch } from './client';
import { TTLCache } from './apiCache';
import { getTtlMs } from '../prefs';

export interface AuthorProfile {
  author: string;
  items: Array<{ key: string; title: string; date: string; abstract?: string; itemType?: string }>;
  coauthors: string[];
}

const authorCache = new TTLCache<string, AuthorProfile>(() => getTtlMs());

export async function fetchAuthorProfile(authorName: string): Promise<AuthorProfile> {
  const cached = authorCache.get(authorName);
  if (cached) return cached;
  const result = await apiFetch<AuthorProfile>(`/author/${encodeURIComponent(authorName)}`);
  authorCache.set(authorName, result);
  return result;
}
