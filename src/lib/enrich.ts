import type { EnrichedAnmeldungen } from '@/types/enriched';
import type { Anmeldungen, Hunde, Kurse } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface AnmeldungenMaps {
  hundeMap: Map<string, Hunde>;
  kurseMap: Map<string, Kurse>;
}

export function enrichAnmeldungen(
  anmeldungen: Anmeldungen[],
  maps: AnmeldungenMaps
): EnrichedAnmeldungen[] {
  return anmeldungen.map(r => ({
    ...r,
    hundName: resolveDisplay(r.fields.hund, maps.hundeMap, 'hundename'),
    kursName: resolveDisplay(r.fields.kurs, maps.kurseMap, 'kursname'),
  }));
}
