import type { Hunde } from '@/types/app';
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

interface HundeViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Hunde | null;
  onEdit: (record: Hunde) => void;
}

export function HundeViewDialog({ open, onClose, record, onEdit }: HundeViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hunde anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Name des Hundes</Label>
            <p className="text-sm">{record.fields.hundename ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rasse</Label>
            <p className="text-sm">{record.fields.rasse ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geschlecht</Label>
            <Badge variant="secondary">{record.fields.geschlecht?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geburtsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.geburtsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bemerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bemerkungen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorname des Halters</Label>
            <p className="text-sm">{record.fields.halter_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachname des Halters</Label>
            <p className="text-sm">{record.fields.halter_nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">E-Mail des Halters</Label>
            <p className="text-sm">{record.fields.halter_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Telefon des Halters</Label>
            <p className="text-sm">{record.fields.halter_telefon ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}