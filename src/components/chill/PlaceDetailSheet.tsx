'use client';

// ============================================================
// Chill — Fiche lieu (Sheet bas) ouverte via detailPlaceId
// ============================================================

import { useEffect, useState } from 'react';
import { Clock, MapPin, Navigation, Phone, ShieldCheck, Timer, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { useChillStore } from '@/lib/store';
import { useCatalog } from '@/lib/catalog';
import { CATEGORY_EMOJI, CATEGORY_LABELS, RELIABILITY_LABELS } from '@/lib/types';
import type { Mood, Place } from '@/lib/types';
import { LOME_CENTER, haversineKm } from '@/lib/format';
import { reportIssue, syncFavorite } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { DistanceLabel, FavButton, RatingBadge, SponsoredTag } from '@/components/chill/ui-bits';

export default function PlaceDetailSheet() {
  const { getPlace, catalog } = useCatalog();
  const detailPlaceId = useChillStore((s) => s.detailPlaceId);
  const closePlace = useChillStore((s) => s.closePlace);
  const favorites = useChillStore((s) => s.favorites);
  const toggleFavorite = useChillStore((s) => s.toggleFavorite);
  const deviceId = useChillStore((s) => s.deviceId);

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { timeout: 3000 },
    );
  }, []);

  const place = detailPlaceId !== null ? getPlace(detailPlaceId) : undefined;

  // Garde la dernière fiche affichée pendant l'animation de fermeture
  // (pattern officiel « adjust state during render »)
  const [prevPlace, setPrevPlace] = useState<Place | undefined>(place);
  if (place !== prevPlace) setPrevPlace(place);
  const shown = place ?? prevPlace;

  const handleFav = (id: string) => {
    const next = toggleFavorite(id);
    syncFavorite(deviceId, id, next);
    toast(next ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris');
  };

  const handleReport = (id: string) => {
    void reportIssue(deviceId, id, 'Information à vérifier');
    toast.success('Merci ! Notre équipe vérifie cette fiche 🙏');
  };

  const distKm = shown
    ? haversineKm(
        userLoc?.lat ?? LOME_CENTER.lat,
        userLoc?.lng ?? LOME_CENTER.lng,
        shown.latitude,
        shown.longitude,
      )
    : null;

  const ambianceMoods: Mood[] = shown
    ? shown.moods
        .map((key) => catalog.moods.find((m) => m.key === key))
        .filter((m): m is Mood => m !== undefined)
    : [];

  return (
    <Sheet open={place !== undefined} onOpenChange={(o) => { if (!o) closePlace(); }}>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="h-[93dvh] max-w-[430px] mx-auto rounded-t-3xl p-0 gap-0 bg-brand-cream flex flex-col [&>button:last-child]:hidden"
      >
        {shown && (
          <>
            {/* Zone image */}
            <div className="relative h-52 shrink-0">
              <img
                src={shown.imageUrl}
                alt={shown.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"
                aria-hidden
              />
              <button
                type="button"
                onClick={closePlace}
                aria-label="Fermer la fiche"
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/35 text-white flex items-center justify-center transition-transform active:scale-90"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
              <FavButton
                active={favorites.includes(shown.id)}
                onToggle={() => handleFav(shown.id)}
                className="absolute top-3 right-14 bg-white/90"
              />
              {shown.isSponsored && (
                <div className="absolute bottom-3 left-4">
                  <SponsoredTag />
                </div>
              )}
            </div>

            {/* Contenu défilant */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <SheetTitle className="text-[20px] font-bold leading-tight text-brand-ink">
                  {shown.name}
                </SheetTitle>
                <span className="shrink-0 rounded-full bg-brand-rose-soft px-2.5 py-1 text-[11px] font-bold text-brand-ink">
                  {CATEGORY_EMOJI[shown.category]} {CATEGORY_LABELS[shown.category]}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                <RatingBadge rating={shown.rating} reviewCount={shown.reviewCount} />
                <span aria-hidden>·</span>
                <span>{shown.district}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: MapPin, label: 'Quartier', value: shown.district },
                  { icon: Clock, label: 'Horaires', value: shown.hours },
                  { icon: Wallet, label: 'Budget', value: shown.priceHint },
                  { icon: Timer, label: 'Durée', value: shown.durationHint },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl bg-white p-3 shadow-sm">
                    <Icon className="h-4 w-4 text-brand-coral" aria-hidden />
                    <p className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-[12.5px] font-bold text-brand-ink">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-brand-lavender-soft p-3.5 text-[12.5px] text-brand-ink">
                <p>{shown.address}</p>
                {distKm !== null && (
                  <div className="mt-1">
                    <DistanceLabel km={distKm} />
                  </div>
                )}
                <p className="mt-1.5 text-[11.5px] italic text-muted-foreground">{shown.accessNote}</p>
              </div>

              <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-green" aria-hidden />
                {RELIABILITY_LABELS[shown.reliability]} · Vérifié {shown.lastVerified}
              </p>

              <div>
                <h3 className="text-[13.5px] font-bold text-brand-ink">C&apos;est quoi le plan ?</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-brand-ink/80">{shown.description}</p>
              </div>

              {ambianceMoods.length > 0 && (
                <div>
                  <h3 className="text-[13.5px] font-bold text-brand-ink">Ambiances</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ambianceMoods.map((m) => (
                      <span
                        key={m.key}
                        className="rounded-full border border-brand-rose-soft bg-brand-cream px-3 py-1.5 text-[12px] font-semibold text-brand-ink"
                      >
                        {m.emoji} {m.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {shown.services.length > 0 && (
                <div>
                  <h3 className="text-[13.5px] font-bold text-brand-ink">Services</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {shown.services.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-muted px-3 py-1.5 text-[12px] font-medium text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleReport(shown.id)}
                className="mt-2 text-[12px] text-muted-foreground underline underline-offset-2"
              >
                ⚠️ Signaler une info incorrecte
              </button>
            </div>

            {/* Actions fixes */}
            <div className="shrink-0 bg-white border-t border-brand-rose-soft px-4 py-3 pb-safe flex gap-2">
              <Button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${shown.latitude},${shown.longitude}`,
                    '_blank',
                  )
                }
                className="h-11 flex-1 rounded-2xl bg-brand-coral text-[14px] font-bold text-white shadow-sm shadow-brand-coral/30 hover:bg-brand-coral-deep"
              >
                <Navigation className="h-4 w-4" aria-hidden />
                Itinéraire
              </Button>
              {shown.phone && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`tel:${shown.phone.replace(/\s/g, '')}`, '_self')}
                  className="h-11 rounded-2xl border-brand-rose-soft px-4 text-[14px] font-bold text-brand-ink"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  Appeler
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
