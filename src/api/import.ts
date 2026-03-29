// src/api/import.ts
import { DiscoveryResult } from './discovery';

export interface ImportResult {
  title: string;
  success: boolean;
  duplicate?: boolean;
  error?: string;
}

function normalizeDoi(doi: string): string {
  return doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:\s*/i, '').trim();
}

function itemInCollection(item: any, collectionID: number): boolean {
  return (item.getCollections() as number[]).includes(collectionID);
}

async function addItemToCollection(Z: any, itemID: number, collectionID: number): Promise<void> {
  const collection = Z.Collections.get(collectionID);
  if (collection) {
    collection.addItem(itemID);
    await collection.saveTx();
  }
}

/** Look up by DOI or PMID using Zotero.Translate.Search (event-based API). */
async function lookupByIdentifier(Z: any, idObj: Record<string, string>): Promise<boolean> {
  return new Promise((resolve) => {
    const translate = new Z.Translate.Search();
    translate.setIdentifier(idObj);

    translate.setHandler('translators', (_: any, translators: any[]) => {
      if (!translators?.length) { resolve(false); return; }
      translate.setTranslator(translators);
      translate.translate();
    });

    translate.setHandler('done', (_: any, success: boolean) => {
      resolve(!!success);
    });

    translate.setHandler('error', (_: any, err: any) => {
      console.warn('[AI Import] translate error:', err);
      resolve(false);
    });

    translate.getTranslators();
  });
}

/** Save item manually when identifier lookup is unavailable or fails. */
async function saveManually(Z: any, r: DiscoveryResult, collectionID?: number): Promise<void> {
  const item = new Z.Item('journalArticle');
  item.setField('title', r.title);
  if (r.journal) item.setField('publicationTitle', r.journal);
  if (r.year)    item.setField('date', r.year);
  const cleanDoi = r.doi ? normalizeDoi(r.doi) : '';
  if (cleanDoi)  item.setField('DOI', cleanDoi);
  if (r.url)     item.setField('url', r.url);
  item.setCreators(
    r.authors.map((a: string) => {
      const parts = a.trim().split(/\s+/);
      const lastName = parts.pop() ?? a;
      const firstName = parts.join(' ');
      return { firstName, lastName, creatorType: 'author' };
    })
  );
  const abstract = (r.abstract || r.snippet || '').replace(/<[^>]+>/g, ' ').trim();
  if (abstract) item.setField('abstractNote', abstract);
  await item.saveTx();
  if (collectionID) await addItemToCollection(Z, item.id, collectionID);
}

export async function importToZotero(
  results: DiscoveryResult[],
  collectionID?: number,
): Promise<ImportResult[]> {
  const Z = (globalThis as any).Zotero;
  const out: ImportResult[] = [];

  for (const r of results) {
    try {
      const cleanDoi = r.doi ? normalizeDoi(r.doi) : '';

      // Try identifier lookup first (DOI preferred, then PMID)
      let savedByLookup = false;
      if (cleanDoi || r.pmid) {
        const idObj = cleanDoi ? { DOI: cleanDoi } : { PMID: r.pmid! };
        try {
          savedByLookup = await lookupByIdentifier(Z, idObj);
        } catch (lookupErr) {
          console.warn('[AI Import] lookup failed, will save manually:', lookupErr);
        }
      }

      // Fall back to manual item creation
      if (!savedByLookup) {
        await saveManually(Z, r, collectionID);
      }

      out.push({ title: r.title, success: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[AI Import] failed for', r.title, '—', msg);
      out.push({ title: r.title, success: false, error: msg });
    }
  }

  return out;
}
