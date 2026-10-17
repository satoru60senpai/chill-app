'use client';

// ============================================================
// Chill — Fiche collection (Sheet bas) ouverte via detailCollectionId
// ============================================================

import { useEffect, useState } from 'react';
import { ChevronRight, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useChillStore } from '@/lib/store';
import { useCatalog } from '@/lib/catalog';
import type { Place } from '@/lib/types';
import { LOME_CENTER, formatFCFA, haversineKm } from '@/lib/format';
import { syncFavorite } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { FavButton, PriceLabel, RatingBadge, SponsoredTag } from '@/components/chill/ui-bits';

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

function priceText(p: Place): string {
  return p.priceFrom === 0 ? 'Gratuit' : `dès ${formatFCFA(p.priceFrom)}`;
}

export default function CollectionDetailSheet() {
  const { catalog, collectionPlaces } = useCatalog();
  const detailCollectionId = useChillStore((s) => s.detailCollectionId);
  const closeCollection = useChillStore((s) => s.closeCollection);
  const openPlace = useChillStore((s) => s.openPlace);
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

  const collection =
    detailCollectionId !== null
      ? catalog.collections.find((c) => c.id === detailCollectionId)
      : undefined;
  const places = collection ? collectionPlaces(collection) : [];

  // Garde la dernière collection affichée pendant l'animation de fermeture
  // (pattern officiel « adjust state during render »)
  const [prevCollection, setPrevCollection] = useState(collection);
  if (collection !== prevCollection) setPrevCollection(collection);
  const shown = collection ?? prevCollection;
  const shownPlaces = shown ? collectionPlaces(shown) : [];

  const minPrice =
    shownPlaces.length > 0 ? Math.min(...shownPlaces.map((p) => p.priceFrom)) : 0;

  const handleFav = (id: string) => {
    const next = toggleFavorite(id);
    syncFavorite(deviceId, id, next);
    toast(next ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris');
  };

  const handleShare = async () => {
    if (!shown) return;
    const lines = shownPlaces.map((p) => `- ${p.name} (${p.district}) · ${priceText(p)}`);
    await shareOrCopy(
      shown.title,
      `📚 ${shown.title}\n\n${shownPlaces.length} adresses à Lomé :\n${lines.join('\n')}\n\nDécouvre plus d'idées avec Chill 🌴`,
    );
  };

  const openPlaceFromCollection = (id: string) => {
    closeCollection();
    openPlace(id);
  };

  return (
    <Sheet open={collection !== undefined} onOpenChange={(o) => { if (!o) closeCollection(); }}>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="h-[88dvh] max-w-[430px] mx-auto rounded-t-3xl p-0 gap-0 bg-brand-cream flex flex-col [&>button:last-child]:hidden"
      >
        {shown && (
          <>
            {/* En-tête image */}
            <div className="relative h-40 shrink-0">
              <img
                src={shown.coverImage}
                alt={shown.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent"
                aria-hidden
              />
              <span className="absolute top-3 left-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-ink">
                {shown.badge}
              </span>
              <button
                type="button"
                onClick={closeCollection}
                aria-label="Fermer la collection"
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/35 text-white flex items-center justify-center transition-transform active:scale-90"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
              <SheetTitle className="absolute bottom-3.5 left-4 right-4 text-[19px] font-bold leading-snug text-white">
                {shown.title}
              </SheetTitle>
            </div>

            {/* Contenu défilant */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <p className="text-[12.5px] text-muted-foreground">{shown.subtitle}</p>
                <p className="mt-0.5 text-[12.5px] font-semibold text-brand-ink">
                  {shownPlaces.length} adresses ·{' '}
                  {minPrice === 0 ? 'accès gratuit' : `à partir de ${formatFCFA(minPrice)}`}
                </p>
              </div>

              <div className="space-y-2.5">
                {shownPlaces.map((p) => {
                  const dist = haversineKm(
                    userLoc?.lat ?? LOME_CENTER.lat,
                    userLoc?.lng ?? LOME_CENTER.lng,
                    p.latitude,
                    p.longitude,
                  );
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openPlaceFromCollection(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openPlaceFromCollection(p.id);
                        }
                      }}
                      className="w-full cursor-pointer rounded-2xl bg-white p-3 shadow-sm flex items-center gap-3 text-left"
                    >
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center">
                          <p className="truncate text-[14px] font-bold text-brand-ink">{p.name}</p>
                          {p.isSponsored && (
                            <span className="ml-1 shrink-0">
                              <SponsoredTag />
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-muted-foreground">
                          {p.district} · {dist.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <PriceLabel place={p} />
                          <RatingBadge rating={p.rating} />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-center gap-1">
                        <FavButton
                          active={favorites.includes(p.id)}
                          onToggle={() => handleFav(p.id)}
                        />
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden />
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => void handleShare()}
                className="h-11 w-full rounded-2xl border-brand-rose-soft text-[13.5px] font-bold text-brand-ink"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Partager cette collection
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
