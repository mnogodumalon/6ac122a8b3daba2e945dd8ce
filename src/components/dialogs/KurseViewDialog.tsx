import type { Kurse } from '@/types/app';
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

interface KurseViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Kurse | null;
  onEdit: (record: Kurse) => void;
}

export function KurseViewDialog({ open, onClose, record, onEdit }: KurseViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kurse anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kursname</Label>
            <p className="text-sm">{record.fields.kursname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kursart</Label>
            <Badge variant="secondary">{record.fields.kursart?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorname des Trainers</Label>
            <p className="text-sm">{record.fields.trainer_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachname des Trainers</Label>
            <p className="text-sm">{record.fields.trainer_nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Termin</Label>
            <p className="text-sm">{formatDate(record.fields.termin)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dauer in Minuten</Label>
            <p className="text-sm">{record.fields.dauer_minuten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ort</Label>
            <p className="text-sm">{record.fields.ort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Maximale Teilnehmerzahl</Label>
            <p className="text-sm">{record.fields.max_teilnehmer ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Preis in Euro</Label>
            <p className="text-sm">{record.fields.preis ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}