import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Hunde, Kurse, Anmeldungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [hunde, setHunde] = useState<Hunde[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [hundeData, kurseData, anmeldungenData] = await Promise.all([
        LivingAppsService.getHunde(),
        LivingAppsService.getKurse(),
        LivingAppsService.getAnmeldungen(),
      ]);
      setHunde(hundeData);
      setKurse(kurseData);
      setAnmeldungen(anmeldungenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [hundeData, kurseData, anmeldungenData] = await Promise.all([
          LivingAppsService.getHunde(),
          LivingAppsService.getKurse(),
          LivingAppsService.getAnmeldungen(),
        ]);
        setHunde(hundeData);
        setKurse(kurseData);
        setAnmeldungen(anmeldungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const hundeMap = useMemo(() => {
    const m = new Map<string, Hunde>();
    hunde.forEach(r => m.set(r.record_id, r));
    return m;
  }, [hunde]);

  const kurseMap = useMemo(() => {
    const m = new Map<string, Kurse>();
    kurse.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kurse]);

  return { hunde, setHunde, kurse, setKurse, anmeldungen, setAnmeldungen, loading, error, fetchAll, hundeMap, kurseMap };
}