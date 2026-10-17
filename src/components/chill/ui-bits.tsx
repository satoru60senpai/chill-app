'use client';

// ============================================================
// Chill — Briques UI partagées entre les écrans
// ============================================================

import { Heart, MapPin, Sparkles, Star } from 'lucide-react';
import type { Mood, Place } from '@/lib/types';
import { formatFCFA } from '@/lib/format';
import { cn } from '@/lib/utils';

export function SectionHeader({
  title,
  emoji,
  actionLabel,
  onAction,
}: {
  title: string;
  emoji?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 mt-7 mb-3">
      <h2 className="text-[17px] font-bold text-brand-ink flex items-center gap-2">
        {emoji && <span aria-hidden>{emoji}</span>}
        {title}
      </h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-[13px] font-semibold text-brand-coral hover:text-brand-coral-deep transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-95',
        active
          ? 'bg-brand-coral text-white border-brand-coral shadow-sm shadow-brand-coral/30'
          : 'bg-white text-brand-ink border-brand-rose-soft hover:border-brand-rose',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function RatingBadge({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-brand-ink">
      <Star className="h-3.5 w-3.5 fill-brand-sun text-brand-sun" aria-hidden />
      {rating.toFixed(1).replace('.', ',')}
      {typeof reviewCount === 'number' && reviewCount > 0 && (
        <span className="font-medium text-muted-foreground">({reviewCount})</span>
      )}
    </span>
  );
}

export function PriceLabel({
  place,
  className,
}: {
  place: Pick<Place, 'priceFrom' | 'priceHint'>;
  className?: string;
}) {
  return (
    <span className={cn('text-[12.5px] font-bold text-brand-coral', className)}>
      {place.priceFrom === 0 ? 'Gratuit' : `dès ${formatFCFA(place.priceFrom).replace(' FCFA', ' FCFA')}`}
    </span>
  );
}

export function SponsoredTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-lavender-soft text-[10px] font-bold uppercase tracking-wide text-brand-lavender px-2 py-0.5">
      <Sparkles className="h-2.5 w-2.5" aria-hidden />
      Sponsorisé
    </span>
  );
}

export function MoodPill({ mood, active, onClick }: { mood: Mood; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-95',
        active
          ? 'bg-brand-coral text-white border-brand-coral shadow-sm shadow-brand-coral/30'
          : 'bg-white text-brand-ink border-brand-rose-soft hover:border-brand-rose',
      )}
    >
      <span aria-hidden>{mood.emoji}</span>
      {mood.label}
    </button>
  );
}

export function DistanceLabel({ km }: { km: number | null }) {
  if (km === null) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[11.5px] font-medium text-muted-foreground">
      <MapPin className="h-3 w-3" aria-hidden />
      {km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
    </span>
  );
}

export function FavButton({
  active,
  onToggle,
  className,
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={active}
      className={cn(
        'h-9 w-9 rounded-full flex items-center justify-center transition-all active:scale-90',
        active ? 'bg-brand-rose-soft' : 'bg-brand-cream hover:bg-brand-rose-soft/60',
        className,
      )}
    >
      <Heart
        className={cn('h-4.5 w-4.5 h-[18px] w-[18px] transition-colors', active ? 'fill-brand-coral text-brand-coral' : 'text-muted-foreground')}
        aria-hidden
      />
    </button>
  );
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-10 gap-2">
      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-3xl shadow-sm" aria-hidden>
        {emoji}
      </div>
      <h3 className="font-bold text-brand-ink">{title}</h3>
      {subtitle && <p className="text-[13px] text-muted-foreground leading-relaxed">{subtitle}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 rounded-full bg-brand-coral px-5 py-2.5 text-[13.5px] font-bold text-white shadow-sm shadow-brand-coral/30 active:scale-95 transition-transform"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white/70 animate-pulse', className)}>
      <div className="h-full w-full rounded-2xl bg-gradient-to-br from-brand-rose-soft/60 to-brand-lavender-soft/60" />
    </div>
  );
}

export function DisclaimerNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-[11px] leading-relaxed text-muted-foreground/90 px-1', className)}>
      💡 Prix et horaires indicatifs en FCFA, fournis à titre d&apos;estimation. Vérifiez auprès de
      l&apos;établissement avant de vous déplacer.
    </p>
  );
}
