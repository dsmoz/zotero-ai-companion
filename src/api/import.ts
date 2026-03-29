// src/api/import.ts
// Import is dispatched to the main Zotero window via zotero-ai-command,
// because Zotero.Translate and Zotero.Item are only available there.
import { DiscoveryResult } from './discovery';

export interface ImportResult {
  imported: number;
  failed: number;
  duplicates: number;
}

export function importToZotero(results: DiscoveryResult[]): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const xulWin = window.top ?? window;
    const target = ((xulWin as any).opener ?? xulWin) as Window;

    const listenerId = `ai-import-${Date.now()}`;

    function onResult(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.listenerId !== listenerId) return;
      target.removeEventListener('zotero-ai-import-result', onResult);
      if (detail.error) reject(new Error(detail.error));
      else resolve({ imported: detail.imported, failed: detail.failed, duplicates: detail.duplicates });
    }

    target.addEventListener('zotero-ai-import-result', onResult);

    target.dispatchEvent(new CustomEvent('zotero-ai-command', {
      detail: { command: 'importDiscoveryResults', results, listenerId },
      bubbles: true,
    }));

    // Timeout after 60s
    setTimeout(() => {
      target.removeEventListener('zotero-ai-import-result', onResult);
      reject(new Error('Import timed out'));
    }, 60_000);
  });
}
