// src/api/health.ts
import { apiFetch } from './client';

export interface HealthIssue {
  zotero_key: string;
  title: string;
  issue_type: 'failed_sync' | 'missing_pdf' | 'not_indexed';
  error_message?: string;
}

export interface LibraryHealth {
  indexed: number;
  unindexed: number;
  failed: number;
  missing_pdf: number;
  total: number;
  sync_percentage: string;
  last_sync: string;
  status: string;
  issues: HealthIssue[];
}

export async function fetchLibraryHealth(): Promise<LibraryHealth> {
  return apiFetch<LibraryHealth>('/health/library');
}

export async function indexAllPending(): Promise<{ queued: number }> {
  return apiFetch<{ queued: number }>('/sync', { method: 'POST' });
}

export async function fixOrphans(): Promise<{ removed: number; dry_run: boolean }> {
  return apiFetch('/cleanup/orphans', {
    method: 'POST',
    body: JSON.stringify({ dry_run: false }),
  });
}
