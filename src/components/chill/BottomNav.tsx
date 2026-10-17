'use client';

import { CalendarHeart, Compass, Home, UserRound } from 'lucide-react';
import type { Tab } from '@/lib/types';
import { cn } from '@/lib/utils';

const ITEMS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { key: 'home', label: 'Accueil', icon: Home },
  { key: 'discover', label: 'Découvrir', icon: Compass },
  { key: 'outings', label: 'Mes sorties', icon: CalendarHeart },
  { key: 'profile', label: 'Profil', icon: UserRound },
];

export default function BottomNav({ current, onChange }: { current: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 inset-x-0 z-40"
    >
      <div className="max-w-[430px] mx-auto">
        <div className="bg-white/92 backdrop-blur-md border-t border-brand-rose-soft/70 px-2 pt-1.5 pb-safe shadow-[0_-8px_24px_rgba(58,51,68,0.06)]">
          <ul className="flex items-stretch justify-around">
            {ITEMS.map(({ key, label, icon: Icon }) => {
              const active = current === key;
              return (
                <li key={key} className="flex-1">
                  <button
                    type="button"
                    onClick={() => onChange(key)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'w-full min-h-[52px] flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors',
                      active ? 'text-brand-coral' : 'text-muted-foreground hover:text-brand-ink',
                    )}
                  >
                    <Icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} strokeWidth={active ? 2.4 : 2} />
                    <span className={cn('text-[10.5px] leading-tight', active ? 'font-bold' : 'font-medium')}>
                      {label}
                    </span>
                    <span
                      className={cn(
                        'h-1 w-1 rounded-full transition-all',
                        active ? 'bg-brand-coral' : 'bg-transparent',
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
