'use client';

// ============================================================
// Chill — Dialog de détail d'un événement week-end
// ============================================================

import { useState } from 'react';
import { MapPin, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import type { EventItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

/** Partage natif si dispo, sinon copie dans le presse-papier */
async function shareOrCopy(title: string, text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return;
    } catch {
      return; // partage annulé par l'utilisateur
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copié dans le presse-papier 📋');
      return;
    } catch {
      // presse-papier indisponible
    }
  }
  toast.error('Partage indisponible sur cet appareil');
}

export default function EventDetailDialog({
  event,
  onClose,
}: {
  event: EventItem | null;
  onClose: () => void;
}) {
  // Garde le dernier événement affiché pendant l'animation de fermeture
  const [prevEvent, setPrevEvent] = useState<EventItem | null>(event);
  if (event !== prevEvent) setPrevEvent(event);
  const shown = event ?? prevEvent;

  const handleShare = async () => {
    if (!shown) return;
    await shareOrCopy(
      shown.title,
      `🎊 ${shown.title} · ${shown.timeText} · ${shown.venue} — ${shown.priceLabel}. Infos et idées de sorties : l'app Chill 🌴`,
    );
  };

  return (
    <Dialog open={event !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-w-[360px] sm:max-w-[360px] rounded-3xl p-0 gap-0 overflow-hidden bg-brand-cream"
      >
        {shown && (
          <>
            <img
              src={shown.imageUrl}
              alt={shown.title}
              loading="lazy"
              className="h-40 w-full rounded-t-3xl object-cover"
            />
            <div className="p-5 space-y-3">
              <span className="inline-block rounded-full bg-brand-rose-soft px-2.5 py-1 text-[11px] font-bold text-brand-ink">
                {shown.category}
              </span>
              <DialogTitle className="text-[17px] font-bold leading-snug text-brand-ink">
                {shown.title}
              </DialogTitle>
              <p className="text-[12.5px] font-bold text-brand-coral">
                {shown.timeText} · {shown.priceLabel}
              </p>
              <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {shown.venue}
              </p>
              <p className="text-[13px] leading-relaxed text-brand-ink/80">{shown.description}</p>
              <Button
                variant="outline"
                onClick={() => void handleShare()}
                className="h-11 w-full rounded-2xl border-brand-rose-soft text-[13.5px] font-bold text-brand-ink"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Partager
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
