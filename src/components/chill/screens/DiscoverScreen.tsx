'use client';

// ============================================================
// Chill — Écran Découvrir (recherche, filtres, collections, lieux, événements)
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useChillStore } from '@/lib/store';
import { useCatalog } from '@/lib/catalog';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/types';
import type { EventItem, Place, PlaceCategory } from '@/lib/types';
import { LOME_CENTER, haversineKm } from '@/lib/format';
import { syncFavorite } from '@/lib/api';
import { Input } from '@/components/ui/input';
import {
  Chip,
  DisclaimerNote,
  EmptyState,
  FavButton,
  PriceLabel,
  RatingBadge,
  SectionHeader,
  SponsoredTag,
} from '@/components/chill/ui-bits';
import EventDetailDialog from '../EventDetailDialog';

type CategoryFilter = PlaceCategory | 'all';

export default function DiscoverScreen() {
  const { catalog } = useCatalog();
  const prefs = useChillStore((s) => s.prefs);
  const setPrefs = useChillStore((s) => s.setPrefs);
  const favorites = useChillStore((s) => s.favorites);
  const toggleFavorite = useChillStore((s) => s.toggleFavorite);
  const deviceId = useChillStore((s) => s.deviceId);
  const openPlace = useChillStore((s) => s.openPlace);
  const openCollection = useChillStore((s) => s.openCollection);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [event, setEvent] = useState<EventItem | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { timeout: 3000 },
    );
  }, []);

  const presentCategories = useMemo(
    () => Array.from(new Set(catalog.places.map((p) => p.category))),
    [catalog.places],
  );

  const activeMood = catalog.moods.find((m) => m.key === prefs.mood) ?? null;

  const filteredPlaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.places
      .filter((p) => {
        if (category !== 'all' && p.category !== category) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aMood = prefs.mood !== '' && a.moods.includes(prefs.mood) ? 1 : 0;
        const bMood = prefs.mood !== '' && b.moods.includes(prefs.mood) ? 1 : 0;
        if (aMood !== bMood) return bMood - aMood;
        if (a.isSponsored !== b.isSponsored) return a.isSponsored ? -1 : 1;
        return b.rating - a.rating;
      });
  }, [catalog.places, search, category, prefs.mood]);

  const distanceFor = (p: Place): number =>
    haversineKm(
      userLoc?.lat ?? LOME_CENTER.lat,
      userLoc?.lng ?? LOME_CENTER.lng,
      p.latitude,
      p.longitude,
    );

  const handleFav = (id: string) => {
    const next = toggleFavorite(id);
    syncFavorite(deviceId, id, next);
    toast(next ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris');
  };

  const searchActive = search.trim() !== '' || category !== 'all' || activeMood !== null;

  return (
    <div className="px-4 pt-6 pb-28">
      {/* En-tête */}
      <h1 className="text-[22px] font-bold text-brand-ink">Découvrir</h1>
      <p className="mt-0.5 text-[12.5px] text-muted-foreground">
        {catalog.places.length} adresses à Lomé
      </p>

      {/* Recherche */}
      <div className="relative mt-4">
        <Search
          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un lieu, un quartier…"
          aria-label="Rechercher un lieu, un quartier"
          className="h-11 rounded-2xl border-brand-rose-soft bg-white pr-3 pl-9 text-[13.5px] text-brand-ink"
        />
      </div>

      {/* Catégories */}
      <div className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>
          Tous
        </Chip>
        {presentCategories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </div>

      {/* Mood actif */}
      {activeMood && (
        <div className="mt-2.5 flex">
          <Chip active onClick={() => setPrefs({ mood: '' })}>
            {activeMood.emoji} {activeMood.label} <span aria-hidden>×</span>
          </Chip>
        </div>
      )}

      {/* Collections */}
      <div className="-mx-4">
        <SectionHeader title="Collections" emoji="📚" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {catalog.collections.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => openCollection(c.id)}
            className="text-left transition-transform active:scale-[0.98]"
          >
            <img
              src={c.coverImage}
              alt={c.title}
              loading="lazy"
              className="h-24 w-full rounded-2xl object-cover"
            />
            <span className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-brand-coral">
              {c.badge}
            </span>
            <p className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-brand-ink">
              {c.title}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{c.placeIds.length} adresses</p>
          </button>
        ))}
      </div>

      {/* Adresses */}
      <div className="-mx-4">
        <SectionHeader
          title="Adresses"
          emoji="📍"
          actionLabel="Filtres"
          onAction={() => toast('Filtres par quartier bientôt disponibles 😉')}
        />
      </div>
      {filteredPlaces.length === 0 && searchActive ? (
        <EmptyState
          emoji="🔍"
          title="Aucun résultat"
          subtitle="Essaie un autre mot-clé ou change de catégorie."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredPlaces.map((p) => {
            const dist = distanceFor(p).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => openPlace(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPlace(p.id);
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
                    {p.district} · {dist} km
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
      )}

      {/* Événements ce week-end */}
      <div className="-mx-4">
        <SectionHeader title="Événements ce week-end" emoji="🗓️" />
      </div>
      <div className="space-y-2.5">
        {catalog.events.map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => setEvent(ev)}
            className="w-full rounded-2xl bg-white p-3 shadow-sm flex items-center gap-3 text-left transition-transform active:scale-[0.99]"
          >
            <img
              src={ev.imageUrl}
              alt={ev.title}
              loading="lazy"
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold text-brand-ink">{ev.title}</p>
              <p className="text-[11.5px] text-muted-foreground">{ev.timeText}</p>
              <p className="text-[12px] font-bold text-brand-coral">{ev.priceLabel}</p>
              <p className="truncate text-[11px] text-muted-foreground">{ev.venue}</p>
            </div>
          </button>
        ))}
      </div>

      <DisclaimerNote className="mt-6" />

      <EventDetailDialog event={event} onClose={() => setEvent(null)} />
    </div>
  );
}
