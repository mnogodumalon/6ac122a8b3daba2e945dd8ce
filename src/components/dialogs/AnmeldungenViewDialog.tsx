import type { Anmeldungen, Hunde, Kurse } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface AnmeldungenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Anmeldungen | null;
  onEdit: (record: Anmeldungen) => void;
  hundeList: Hunde[];
  kurseList: Kurse[];
}

export function AnmeldungenViewDialog({ open, onClose, record, onEdit, hundeList, kurseList }: AnmeldungenViewDialogProps) {
  function getHundeDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return hundeList.find(r => r.record_id === id)?.fields.hundename ?? '—';
  }

  function getKurseDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kurseList.find(r => r.record_id === id)?.fields.kursname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Anmeldungen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hund</Label>
            <p className="text-sm">{getHundeDisplayName(record.fields.hund)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kurs</Label>
            <p className="text-sm">{getKurseDisplayName(record.fields.kurs)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmeldedatum</Label>
            <p className="text-sm">{formatDate(record.fields.anmeldedatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bezahlt</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.bezahlt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.bezahlt ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bemerkung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bemerkung ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}