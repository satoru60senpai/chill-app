'use client';

// ============================================================
// Chill — Écran Accueil
// ============================================================

import { useMemo, useState } from 'react';
import { Bell, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useChillStore } from '@/lib/store';
import { useCatalog } from '@/lib/catalog';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/types';
import type { EventItem } from '@/lib/types';
import { formatFCFA, todayLabelFr } from '@/lib/format';
import {
  DisclaimerNote,
  MoodPill,
  PriceLabel,
  SectionHeader,
  SkeletonCard,
} from '@/components/chill/ui-bits';
import EventDetailDialog from '../EventDetailDialog';

export default function HomeScreen() {
  const { catalog, loading, weather } = useCatalog();
  const setTab = useChillStore((s) => s.setTab);
  const setPrefs = useChillStore((s) => s.setPrefs);
  const profile = useChillStore((s) => s.profile);
  const setGeneratorOpen = useChillStore((s) => s.setGeneratorOpen);
  const openPlace = useChillStore((s) => s.openPlace);
  const openCollection = useChillStore((s) => s.openCollection);
  const [event, setEvent] = useState<EventItem | null>(null);

  const placeMap = useMemo(
    () => new Map(catalog.places.map((p) => [p.id, p])),
    [catalog.places],
  );
  const popularPlaces = useMemo(
    () => catalog.places.filter((p) => p.isPopular),
    [catalog.places],
  );
  const featured = useMemo(
    () => catalog.collections.filter((c) => c.isFeatured),
    [catalog.collections],
  );
  const hero = featured[0];
  const budget = featured[1];
  const heroMinPrice = useMemo(() => {
    if (!hero) return 0;
    const prices = hero.placeIds
      .map((id) => placeMap.get(id)?.priceFrom)
      .filter((v): v is number => typeof v === 'number');
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [hero, placeMap]);

  const firstName = profile.name.trim() || 'toi';

  const handleMood = (key: string, label: string, emoji: string) => {
    setPrefs({ mood: key });
    setTab('discover');
    toast(`${emoji} Sélection : ${label}`);
  };

  return (
    <div className="px-4 pt-6 pb-28">
      {/* En-tête */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-rose to-brand-lavender flex items-center justify-center text-xl shadow-sm"
            aria-hidden
          >
            {profile.avatar}
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Bonjour</p>
            <p className="text-[15px] font-bold leading-tight text-brand-ink">
              {firstName} <span aria-hidden>👋</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.info('Pas de nouvelles notifications 🙂')}
            aria-label="Notifications"
            className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-brand-ink transition-transform active:scale-95"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setTab('discover')}
            aria-label="Rechercher"
            className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-brand-ink transition-transform active:scale-95"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
      </header>

      {/* Titre + méto */}
      <h1 className="mt-5 text-[26px] font-bold leading-tight text-brand-ink">
        On fait quoi aujourd&apos;hui ?
      </h1>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {weather.emoji} Lomé · {todayLabelFr()} · {weather.label} {weather.tempC}°C
      </p>

      {/* Moods */}
      <div className="mt-4 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
        {catalog.moods.map((mood) => (
          <MoodPill
            key={mood.key}
            mood={mood}
            onClick={() => handleMood(mood.key, mood.label, mood.emoji)}
          />
        ))}
      </div>

      {/* CTA générateur */}
      <div className="mt-5 rounded-3xl bg-gradient-to-r from-brand-rose to-brand-lavender p-5 text-white shadow-sm shadow-brand-rose/30">
        <p className="text-[17px] font-bold">Envie de sortir ?</p>
        <p className="mt-0.5 text-[12.5px] text-white/90">
          Crée ton programme sur mesure selon ton budget.
        </p>
        <button
          type="button"
          onClick={() => setGeneratorOpen(true)}
          className="mt-3 h-11 w-full rounded-2xl bg-white text-[14px] font-bold text-brand-ink shadow-sm transition-transform active:scale-95"
        >
          🎲 Générer mes idées
        </button>
      </div>

      {/* Populaires en ce moment */}
      <div className="-mx-4">
        <SectionHeader
          title="Populaires en ce moment"
          emoji="🔥"
          actionLabel="Voir tout"
          onAction={() => setTab('discover')}
        />
      </div>
      <div className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar">
        {loading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} className="h-44 w-40 shrink-0" />)
          : popularPlaces.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => openPlace(p.id)}
                className="w-40 shrink-0 rounded-2xl bg-white p-2 text-left shadow-sm transition-transform active:scale-[0.98]"
              >
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  loading="lazy"
                  className="h-28 w-full rounded-xl object-cover"
                />
                <p className="mt-2 truncate text-[13.5px] font-bold text-brand-ink">{p.name}</p>
                <p className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                  <span className="truncate">
                    {CATEGORY_EMOJI[p.category]} {CATEGORY_LABELS[p.category]} ·
                  </span>
                  <PriceLabel place={p} className="text-[11.5px]" />
                </p>
              </button>
            ))}
      </div>

      {/* Collection vedette */}
      {hero && (
        <button
          type="button"
          onClick={() => openCollection(hero.id)}
          className="relative mt-2 block h-44 w-full overflow-hidden rounded-3xl text-left shadow-sm transition-transform active:scale-[0.99]"
        >
          <img
            src={hero.coverImage}
            alt={hero.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent"
            aria-hidden
          />
          <span className="absolute top-3 left-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-ink">
            {hero.badge}
          </span>
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-[17px] font-bold leading-snug text-white">{hero.title}</p>
            <p className="mt-0.5 text-[12px] text-white/85">
              {hero.placeIds.length} programmes ·{' '}
              {heroMinPrice === 0 ? 'accès gratuit' : `à partir de ${formatFCFA(heroMinPrice)}`}
            </p>
          </div>
        </button>
      )}

      {/* Bannière petit budget */}
      {budget && (
        <button
          type="button"
          onClick={() => openCollection(budget.id)}
          className="mt-3 w-full rounded-2xl bg-brand-lavender-soft p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.99]"
        >
          <span
            className="h-10 w-10 shrink-0 rounded-full bg-white flex items-center justify-center text-lg"
            aria-hidden
          >
            🎯
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-bold text-brand-ink">
              {budget.title}
            </span>
            <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
              {budget.placeIds.length} places · mise à jour chaque semaine
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      )}

      {/* Ce week-end à Lomé */}
      <div className="-mx-4">
        <SectionHeader
          title="Ce week-end à Lomé"
          emoji="🎊"
          actionLabel="Tout voir"
          onAction={() => setTab('discover')}
        />
      </div>
      <div className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar">
        {catalog.events.map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => setEvent(ev)}
            className="w-60 shrink-0 text-left transition-transform active:scale-[0.98]"
          >
            <div className="relative">
              <img
                src={ev.imageUrl}
                alt={ev.title}
                loading="lazy"
                className="h-32 w-full rounded-2xl object-cover"
              />
              <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-brand-ink">
                {ev.category}
              </span>
            </div>
            <p className="mt-2 truncate text-[13.5px] font-bold text-brand-ink">{ev.title}</p>
            <p className="text-[11.5px] text-muted-foreground">
              {ev.timeText} · {ev.priceLabel}
            </p>
          </button>
        ))}
      </div>

      <DisclaimerNote className="mt-6 mb-2" />

      <EventDetailDialog event={event} onClose={() => setEvent(null)} />
    </div>
  );
}
