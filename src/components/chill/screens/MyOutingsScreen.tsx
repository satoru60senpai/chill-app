'use client';

// ============================================================
// Chill — Écran « Mes sorties » : stats, favoris, programmes
// enregistrés (filtre Toutes / À venir / Terminées) + détail.
// ============================================================

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useChillStore } from '@/lib/store';
import { useCatalog } from '@/lib/catalog';
import { formatFCFA, formatK } from '@/lib/format';
import { syncPlanDelete, syncPlanStatus } from '@/lib/api';
import type { Place } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EmptyState, PriceLabel, SectionHeader } from '@/components/chill/ui-bits';
import PlanDetailView, { sharePlan } from '@/components/chill/PlanDetailView';
import { cn } from '@/lib/utils';

type OutingFilter = 'all' | 'planned' | 'done';

const FILTERS: { key: OutingFilter; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'planned', label: 'À venir' },
  { key: 'done', label: 'Terminées' },
];

export default function MyOutingsScreen() {
  const plans = useChillStore((s) => s.plans);
  const favorites = useChillStore((s) => s.favorites);
  const deviceId = useChillStore((s) => s.deviceId);
  const openPlace = useChillStore((s) => s.openPlace);
  const setGeneratorOpen = useChillStore((s) => s.setGeneratorOpen);
  const setPlanStatus = useChillStore((s) => s.setPlanStatus);
  const deletePlan = useChillStore((s) => s.deletePlan);
  const { getPlace } = useCatalog();

  const [filter, setFilter] = useState<OutingFilter>('all');
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);

  const favoritePlaces = favorites.map((id) => getPlace(id)).filter((p): p is Place => p !== undefined);

  const avgBudget =
    plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.budgetPerPerson, 0) / plans.length) : null;

  const visiblePlans = plans
    .filter((p) => (filter === 'all' ? true : p.status === filter))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openPlan = plans.find((p) => p.id === openPlanId) ?? null;

  const handleToggleStatus = (planId: string, current: 'planned' | 'done') => {
    const next = current === 'done' ? 'planned' : 'done';
    setPlanStatus(planId, next);
    syncPlanStatus(deviceId, planId, next);
    toast(next === 'done' ? 'Sortie marquée comme terminée ✅' : 'Sortie replacée dans « À venir »');
  };

  const handleDelete = (planId: string) => {
    deletePlan(planId);
    syncPlanDelete(deviceId, planId);
    toast('Sortie supprimée');
    setOpenPlanId(null);
  };

  return (
    <div className="pb-28 pt-6">
      <div className="px-4">
        <h1 className="text-[22px] font-bold text-brand-ink">Mes sorties</h1>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          {plans.length} programme{plans.length > 1 ? 's' : ''} enregistré{plans.length > 1 ? 's' : ''}
        </p>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 text-center shadow-sm">
            <p className="text-[18px] font-bold text-brand-coral">{plans.length}</p>
            <p className="text-[10.5px] text-muted-foreground">Créées</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 text-center shadow-sm">
            <p className="text-[18px] font-bold text-brand-coral">{plans.filter((p) => p.status === 'done').length}</p>
            <p className="text-[10.5px] text-muted-foreground">Terminées</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 text-center shadow-sm">
            <p className="text-[12px] font-bold leading-tight text-brand-coral">
              {avgBudget !== null ? `${formatK(avgBudget)} FCFA` : '—'}
            </p>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">Budget moyen</p>
          </div>
        </div>
      </div>

      {/* Favoris */}
      {favoritePlaces.length > 0 && (
        <section className="mt-1">
          <SectionHeader title="Mes favoris" emoji="❤️" />
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 pt-1">
            {favoritePlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => openPlace(place.id)}
                className="w-32 shrink-0 rounded-2xl bg-white p-2 text-left shadow-sm transition-transform active:scale-[0.97]"
              >
                <img
                  src={place.imageUrl}
                  alt={place.name}
                  loading="lazy"
                  className="h-24 w-full rounded-xl object-cover"
                />
                <p className="mt-1.5 truncate text-[12px] font-bold text-brand-ink">{place.name}</p>
                <PriceLabel place={place} className="text-[11px]" />
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="px-4">
        {/* Filtre segmenté */}
        <div className="mt-4 flex rounded-2xl bg-brand-rose-soft/50 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'h-9 flex-1 rounded-xl text-[12.5px] transition-all',
                filter === f.key ? 'bg-white font-bold text-brand-ink shadow-sm' : 'font-semibold text-brand-ink/60',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste des programmes */}
        {plans.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white/70">
            <EmptyState
              emoji="🗓️"
              title="Aucune sortie enregistrée"
              subtitle="Génère ton premier programme sur mesure selon ton mood et ton budget."
              actionLabel="🎲 Générer mes idées"
              onAction={() => setGeneratorOpen(true)}
            />
          </div>
        ) : visiblePlans.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white/70 p-4 text-center text-[12.5px] text-muted-foreground">
            Rien dans cette catégorie pour le moment.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {visiblePlans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setOpenPlanId(p.id)}
                className="w-full rounded-2xl bg-white p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <p className="flex-1 truncate text-[14.5px] font-bold text-brand-ink">{p.title}</p>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold',
                      p.status === 'done' ? 'bg-brand-green/20 text-[#4E8D63]' : 'bg-brand-rose-soft text-brand-coral',
                    )}
                  >
                    {p.status === 'done' ? 'Terminée' : 'À venir'}
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {p.dayLabel} · {p.timeLabel} · {p.steps.length} étapes
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-brand-coral">{formatFCFA(p.totals.perPerson)}/pers.</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dialog détail */}
      <Dialog open={openPlan !== null} onOpenChange={(o) => { if (!o) setOpenPlanId(null); }}>
        <DialogContent className="max-h-[85dvh] max-w-[400px] gap-0 overflow-y-auto rounded-3xl p-5">
          <DialogHeader className="sr-only">
            <DialogTitle>Détail de la sortie</DialogTitle>
          </DialogHeader>
          {openPlan && (
            <div className="space-y-2.5">
              <PlanDetailView plan={openPlan} />
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => handleToggleStatus(openPlan.id, openPlan.status)}
                  className="h-11 rounded-2xl border-brand-rose-soft px-2 text-[12.5px] font-bold text-brand-ink hover:bg-brand-rose-soft/40"
                >
                  🔄 Marquer {openPlan.status === 'done' ? 'à refaire' : 'terminée'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sharePlan(openPlan)}
                  className="h-11 rounded-2xl border-brand-rose-soft text-[12.5px] font-bold text-brand-ink hover:bg-brand-rose-soft/40"
                >
                  📤 Partager
                </Button>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-2xl border-red-200 text-[13px] font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[330px] rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette sortie ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Le programme « {openPlan.title} » sera définitivement retiré de tes sorties.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(openPlan.id)}
                      className="rounded-xl bg-red-500 text-white hover:bg-red-600"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
