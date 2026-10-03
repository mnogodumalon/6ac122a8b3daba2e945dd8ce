import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichAnmeldungen } from '@/lib/enrich';
import type { EnrichedAnmeldungen } from '@/types/enriched';
import type { Kurse, Anmeldungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash, IconUsers, IconCalendar, IconClock, IconMapPin, IconCurrencyEuro, IconDog, IconChevronRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KurseDialog } from '@/components/dialogs/KurseDialog';
import { AnmeldungenDialog } from '@/components/dialogs/AnmeldungenDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { StatCard } from '@/components/StatCard';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

const APPGROUP_ID = '6ac122a8b3daba2e945dd8ce';
const REPAIR_ENDPOINT = '/claude/build/repair';

const STATUS_COLORS: Record<string, string> = {
  angemeldet: 'bg-blue-100 text-blue-700',
  bestaetigt: 'bg-green-100 text-green-700',
  warteliste: 'bg-yellow-100 text-yellow-700',
  storniert: 'bg-red-100 text-red-700',
};

const KURSART_COLORS: Record<string, string> = {
  welpenkurs: 'bg-amber-50 border-amber-200',
  grundkurs: 'bg-blue-50 border-blue-200',
  fortgeschrittene: 'bg-purple-50 border-purple-200',
  agility: 'bg-green-50 border-green-200',
  einzeltraining: 'bg-rose-50 border-rose-200',
};

const KURSART_BADGE: Record<string, string> = {
  welpenkurs: 'bg-amber-100 text-amber-700',
  grundkurs: 'bg-blue-100 text-blue-700',
  fortgeschrittene: 'bg-purple-100 text-purple-700',
  agility: 'bg-green-100 text-green-700',
  einzeltraining: 'bg-rose-100 text-rose-700',
};

export default function DashboardOverview() {
  const {
    hunde, kurse, anmeldungen,
    hundeMap, kurseMap,
    loading, error, fetchAll,
  } = useDashboardData();

  // All hooks BEFORE early returns
  const enrichedAnmeldungen = enrichAnmeldungen(anmeldungen, { hundeMap, kurseMap });

  const [selectedKurs, setSelectedKurs] = useState<Kurse | null>(null);
  const [kurseDialogOpen, setKurseDialogOpen] = useState(false);
  const [editKurs, setEditKurs] = useState<Kurse | null>(null);
  const [deleteKurs, setDeleteKurs] = useState<Kurse | null>(null);
  const [anmeldungDialogOpen, setAnmeldungDialogOpen] = useState(false);
  const [editAnmeldung, setEditAnmeldung] = useState<EnrichedAnmeldungen | null>(null);
  const [deleteAnmeldung, setDeleteAnmeldung] = useState<EnrichedAnmeldungen | null>(null);

  const [filter, setFilter] = useState<'alle' | 'upcoming'>('upcoming');

  const today = startOfDay(new Date());

  const sortedKurse = useMemo(() => {
    const filtered = filter === 'upcoming'
      ? kurse.filter(k => !k.fields.termin || isAfter(parseISO(k.fields.termin), today))
      : kurse;
    return [...filtered].sort((a, b) => {
      if (!a.fields.termin && !b.fields.termin) return 0;
      if (!a.fields.termin) return 1;
      if (!b.fields.termin) return -1;
      return a.fields.termin.localeCompare(b.fields.termin);
    });
  }, [kurse, filter, today]);

  const kursAnmeldungen = useMemo(() => {
    const map = new Map<string, EnrichedAnmeldungen[]>();
    enrichedAnmeldungen.forEach(a => {
      const id = extractRecordId(a.fields.kurs);
      if (!id) return;
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(a);
    });
    return map;
  }, [enrichedAnmeldungen]);

  const selectedKursAnmeldungen = useMemo(() => {
    if (!selectedKurs) return [];
    return kursAnmeldungen.get(selectedKurs.record_id) ?? [];
  }, [selectedKurs, kursAnmeldungen]);

  const stats = useMemo(() => {
    const aktive = anmeldungen.filter(a => a.fields.status?.key !== 'storniert');
    const bezahlt = anmeldungen.filter(a => a.fields.bezahlt === true);
    const upcoming = kurse.filter(k => k.fields.termin && isAfter(parseISO(k.fields.termin), today));
    return { hunde: hunde.length, kurse: kurse.length, anmeldungen: aktive.length, bezahlt: bezahlt.length, upcoming: upcoming.length };
  }, [hunde, kurse, anmeldungen, today]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleDeleteKurs = async () => {
    if (!deleteKurs) return;
    await LivingAppsService.deleteKurseEntry(deleteKurs.record_id);
    if (selectedKurs?.record_id === deleteKurs.record_id) setSelectedKurs(null);
    setDeleteKurs(null);
    fetchAll();
  };

  const handleDeleteAnmeldung = async () => {
    if (!deleteAnmeldung) return;
    await LivingAppsService.deleteAnmeldungenEntry(deleteAnmeldung.record_id);
    setDeleteAnmeldung(null);
    fetchAll();
  };

  const formatTermin = (termin?: string) => {
    if (!termin) return '—';
    try {
      return format(parseISO(termin), 'EEE dd.MM. · HH:mm', { locale: de });
    } catch { return termin; }
  };

  const getBelegung = (kurs: Kurse) => {
    const anm = kursAnmeldungen.get(kurs.record_id) ?? [];
    const aktiv = anm.filter(a => a.fields.status?.key !== 'storniert').length;
    const max = kurs.fields.max_teilnehmer ?? 0;
    return { aktiv, max };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Kursplan</h1>
          <p className="text-sm text-muted-foreground">{stats.upcoming} bevorstehende Kurse · {stats.hunde} Hunde registriert</p>
        </div>
        <Button onClick={() => { setEditKurs(null); setKurseDialogOpen(true); }} className="shrink-0">
          <IconPlus size={16} className="mr-1.5 shrink-0" />
          Kurs hinzufügen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Hunde" value={String(stats.hunde)} description="registriert" icon={<IconDog size={18} className="text-muted-foreground" />} />
        <StatCard title="Kurse" value={String(stats.kurse)} description="gesamt" icon={<IconCalendar size={18} className="text-muted-foreground" />} />
        <StatCard title="Anmeldungen" value={String(stats.anmeldungen)} description="aktiv" icon={<IconUsers size={18} className="text-muted-foreground" />} />
        <StatCard title="Bezahlt" value={String(stats.bezahlt)} description="Anmeldungen" icon={<IconCurrencyEuro size={18} className="text-muted-foreground" />} />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Kursliste */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('upcoming')}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === 'upcoming' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Kommende
            </button>
            <button
              onClick={() => setFilter('alle')}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === 'alle' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Alle
            </button>
          </div>

          <div className="space-y-2">
            {sortedKurse.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 border rounded-2xl bg-muted/30">
                <IconCalendar size={40} className="text-muted-foreground" stroke={1.5} />
                <p className="text-sm text-muted-foreground">Noch keine Kurse vorhanden</p>
                <Button size="sm" variant="outline" onClick={() => { setEditKurs(null); setKurseDialogOpen(true); }}>
                  <IconPlus size={14} className="mr-1" />Ersten Kurs anlegen
                </Button>
              </div>
            )}
            {sortedKurse.map(kurs => {
              const { aktiv, max } = getBelegung(kurs);
              const isSelected = selectedKurs?.record_id === kurs.record_id;
              const artKey = kurs.fields.kursart?.key ?? '';
              const cardBg = KURSART_COLORS[artKey] ?? 'bg-gray-50 border-gray-200';
              const badgeCls = KURSART_BADGE[artKey] ?? 'bg-gray-100 text-gray-700';
              const full = max > 0 && aktiv >= max;
              return (
                <div
                  key={kurs.record_id}
                  onClick={() => setSelectedKurs(isSelected ? null : kurs)}
                  className={`border rounded-2xl p-4 cursor-pointer transition-all ${cardBg} ${isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'}`}
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {kurs.fields.kursart && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeCls}`}>
                            {kurs.fields.kursart.label}
                          </span>
                        )}
                        {full && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Ausgebucht</span>}
                      </div>
                      <p className="font-semibold text-sm text-foreground truncate">{kurs.fields.kursname ?? '—'}</p>
                      {kurs.fields.termin && (
                        <p className="text-xs text-muted-foreground mt-0.5">{formatTermin(kurs.fields.termin)}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {kurs.fields.ort && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconMapPin size={11} className="shrink-0" />
                            <span className="truncate max-w-[120px]">{kurs.fields.ort}</span>
                          </span>
                        )}
                        {kurs.fields.dauer_minuten && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconClock size={11} className="shrink-0" />{kurs.fields.dauer_minuten} Min.
                          </span>
                        )}
                        {kurs.fields.preis != null && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconCurrencyEuro size={11} className="shrink-0" />{formatCurrency(kurs.fields.preis)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => { e.stopPropagation(); setEditKurs(kurs); setKurseDialogOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-white/70 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <IconPencil size={13} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteKurs(kurs); }}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground leading-none">{aktiv}{max > 0 ? `/${max}` : ''}</p>
                        <p className="text-xs text-muted-foreground">Plätze</p>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                      <IconChevronRight size={12} />Details & Anmeldungen
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail-Panel */}
        <div className="lg:col-span-3">
          {!selectedKurs ? (
            <div className="flex flex-col items-center justify-center h-full min-h-48 border rounded-2xl bg-muted/20 gap-3 py-16">
              <IconCalendar size={40} className="text-muted-foreground" stroke={1.5} />
              <p className="text-sm text-muted-foreground">Kurs auswählen, um Anmeldungen zu sehen</p>
            </div>
          ) : (
            <div className="border rounded-2xl overflow-hidden bg-card">
              {/* Kurs-Header */}
              <div className="p-5 border-b">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {selectedKurs.fields.kursart && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${KURSART_BADGE[selectedKurs.fields.kursart.key] ?? 'bg-gray-100 text-gray-700'}`}>
                        {selectedKurs.fields.kursart.label}
                      </span>
                    )}
                    <h2 className="font-bold text-lg mt-1 truncate">{selectedKurs.fields.kursname ?? '—'}</h2>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {selectedKurs.fields.termin && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <IconCalendar size={14} className="shrink-0" />
                          {formatDate(selectedKurs.fields.termin)} · {selectedKurs.fields.termin.slice(11, 16)} Uhr
                        </span>
                      )}
                      {selectedKurs.fields.ort && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <IconMapPin size={14} className="shrink-0" />{selectedKurs.fields.ort}
                        </span>
                      )}
                      {selectedKurs.fields.dauer_minuten && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <IconClock size={14} className="shrink-0" />{selectedKurs.fields.dauer_minuten} Min.
                        </span>
                      )}
                      {selectedKurs.fields.trainer_vorname && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <IconUsers size={14} className="shrink-0" />
                          {selectedKurs.fields.trainer_vorname} {selectedKurs.fields.trainer_nachname ?? ''}
                        </span>
                      )}
                    </div>
                    {selectedKurs.fields.beschreibung && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{selectedKurs.fields.beschreibung}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {selectedKurs.fields.preis != null && (
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(selectedKurs.fields.preis)}</p>
                    )}
                    {selectedKurs.fields.max_teilnehmer && (
                      <p className="text-sm text-muted-foreground">
                        {selectedKursAnmeldungen.filter(a => a.fields.status?.key !== 'storniert').length} / {selectedKurs.fields.max_teilnehmer} Plätze
                      </p>
                    )}
                  </div>
                </div>

                {/* Belegungsbalken */}
                {selectedKurs.fields.max_teilnehmer && (
                  <div className="mt-3">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (selectedKursAnmeldungen.filter(a => a.fields.status?.key !== 'storniert').length / selectedKurs.fields.max_teilnehmer!) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Anmeldungen */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Anmeldungen ({selectedKursAnmeldungen.length})</h3>
                  <Button
                    size="sm"
                    onClick={() => { setEditAnmeldung(null); setAnmeldungDialogOpen(true); }}
                  >
                    <IconPlus size={14} className="mr-1 shrink-0" />Anmelden
                  </Button>
                </div>

                {selectedKursAnmeldungen.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <IconDog size={36} className="text-muted-foreground" stroke={1.5} />
                    <p className="text-sm text-muted-foreground">Noch keine Anmeldungen für diesen Kurs</p>
                    <Button size="sm" variant="outline" onClick={() => { setEditAnmeldung(null); setAnmeldungDialogOpen(true); }}>
                      <IconPlus size={13} className="mr-1" />Ersten Hund anmelden
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedKursAnmeldungen.map(a => {
                      const statusKey = a.fields.status?.key ?? '';
                      const statusCls = STATUS_COLORS[statusKey] ?? 'bg-gray-100 text-gray-700';
                      const hund = a.fields.hund ? hundeMap.get(extractRecordId(a.fields.hund) ?? '') : null;
                      return (
                        <div key={a.record_id} className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <IconDog size={15} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{a.hundName || '—'}</p>
                              {hund && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {hund.fields.rasse ?? ''}{hund.fields.halter_nachname ? ` · ${hund.fields.halter_vorname ?? ''} ${hund.fields.halter_nachname}` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {a.fields.anmeldedatum && (
                              <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(a.fields.anmeldedatum)}</span>
                            )}
                            {a.fields.bezahlt && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium hidden sm:block">✓ Bezahlt</span>
                            )}
                            {a.fields.status && (
                              <Badge className={`text-xs shrink-0 ${statusCls} border-0`}>{a.fields.status.label}</Badge>
                            )}
                            <button
                              onClick={() => { setEditAnmeldung(a); setAnmeldungDialogOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <IconPencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteAnmeldung(a)}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                            >
                              <IconTrash size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialoge */}
      <KurseDialog
        open={kurseDialogOpen}
        onClose={() => { setKurseDialogOpen(false); setEditKurs(null); }}
        onSubmit={async (fields) => {
          if (editKurs) {
            await LivingAppsService.updateKurseEntry(editKurs.record_id, fields);
          } else {
            await LivingAppsService.createKurseEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editKurs?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Kurse']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kurse']}
      />

      <AnmeldungenDialog
        open={anmeldungDialogOpen}
        onClose={() => { setAnmeldungDialogOpen(false); setEditAnmeldung(null); }}
        onSubmit={async (fields) => {
          const submitFields = { ...fields };
          if (!editAnmeldung && selectedKurs) {
            submitFields.kurs = createRecordUrl(APP_IDS.KURSE, selectedKurs.record_id);
          }
          if (editAnmeldung) {
            await LivingAppsService.updateAnmeldungenEntry(editAnmeldung.record_id, submitFields);
          } else {
            await LivingAppsService.createAnmeldungenEntry(submitFields);
          }
          fetchAll();
        }}
        defaultValues={editAnmeldung ? {
          ...editAnmeldung.fields,
          kurs: editAnmeldung.fields.kurs ?? (selectedKurs ? createRecordUrl(APP_IDS.KURSE, selectedKurs.record_id) : undefined),
        } : selectedKurs ? { kurs: createRecordUrl(APP_IDS.KURSE, selectedKurs.record_id) } : undefined}
        hundeList={hunde}
        kurseList={kurse}
        enablePhotoScan={AI_PHOTO_SCAN['Anmeldungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Anmeldungen']}
      />

      <ConfirmDialog
        open={!!deleteKurs}
        title="Kurs löschen"
        description={`Soll der Kurs "${deleteKurs?.fields.kursname ?? ''}" wirklich gelöscht werden? Alle zugehörigen Anmeldungen bleiben bestehen.`}
        onConfirm={handleDeleteKurs}
        onClose={() => setDeleteKurs(null)}
      />

      <ConfirmDialog
        open={!!deleteAnmeldung}
        title="Anmeldung löschen"
        description={`Soll die Anmeldung von "${deleteAnmeldung?.hundName ?? '—'}" wirklich gelöscht werden?`}
        onConfirm={handleDeleteAnmeldung}
        onClose={() => setDeleteAnmeldung(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="lg:col-span-3 h-64 rounded-2xl" />
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
