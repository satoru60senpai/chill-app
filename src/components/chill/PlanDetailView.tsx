'use client';

// ============================================================
// Chill — Vue détaillée d'un programme de sortie
// (entête dégradé, déroulé horaire, bonus événement, budget)
// Utilisée par le Générateur et par « Mes sorties ».
// ============================================================

import { toast } from 'sonner';
import type { OutingPlanDraft } from '@/lib/types';
import { planToShareText } from '@/lib/generator';
import { formatFCFA } from '@/lib/format';
import { Separator } from '@/components/ui/separator';
import { DisclaimerNote } from '@/components/chill/ui-bits';
import { cn } from '@/lib/utils';

/** Partage sans friction : Web Share API si dispo, sinon copie presse-papiers */
export function sharePlan(plan: OutingPlanDraft) {
  const text = planToShareText(plan);
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    navigator.share({ title: plan.title, text }).catch(() => undefined);
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Programme copié — colle-le sur WhatsApp 📋'))
      .catch(() => toast.error('Copie impossible'));
  } else {
    toast.error('Copie impossible');
  }
}

export default function PlanDetailView({
  plan,
  onStepClick,
}: {
  plan: OutingPlanDraft;
  onStepClick?: (placeId: string) => void;
}) {
  const maxAmount = Math.max(...plan.breakdown.map((b) => b.amount), 1);

  return (
    <div>
      {/* Entête dégradé */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-rose via-[#E9A0C8] to-brand-lavender p-5 text-white shadow-md">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/25 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide">
            {plan.moodLabel}
          </span>
          <span className="rounded-full bg-white/25 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide">
            {plan.strict ? '🔒 Budget non négociable' : 'Budget flexible'}
          </span>
        </div>
        <h2 className="mt-2.5 text-[20px] font-bold leading-snug">{plan.title}</h2>
        <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10.5px] font-bold">
          <span className="rounded-full bg-white/25 px-2.5 py-1">⏱ {plan.durationLabel}</span>
          <span className="rounded-full bg-white/25 px-2.5 py-1">{plan.steps.length} étapes</span>
          <span className="rounded-full bg-white/25 px-2.5 py-1">{formatFCFA(plan.totals.perPerson)}/pers.</span>
        </div>
        {plan.peopleCount > 1 && (
          <p className="mt-1.5 text-[11.5px] text-white/85">
            Soit {formatFCFA(plan.totals.group)} pour {plan.peopleCount} personnes
          </p>
        )}
      </div>

      {/* Déroulé de la sortie */}
      <div className="mt-3 rounded-3xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-[15px] font-bold text-brand-ink">Déroulé de la sortie</h3>
        <div className="flex flex-col">
          {plan.steps.map((step, i) => {
            const last = i === plan.steps.length - 1;
            return (
              <div key={step.id} className="flex gap-3">
                <span className="w-11 shrink-0 pt-0.5 text-[12px] font-bold text-brand-coral">{step.time}</span>
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-coral" aria-hidden />
                  {!last && <span className="w-px flex-1 bg-brand-rose-soft" aria-hidden />}
                </div>
                <div className={cn('min-w-0 flex-1', !last && 'pb-4')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-bold text-brand-ink">{step.title}</p>
                    <span
                      className={cn(
                        'whitespace-nowrap text-[13px] font-bold',
                        step.cost > 0 ? 'text-brand-coral' : 'text-[#4E8D63]',
                      )}
                    >
                      {step.cost > 0 ? formatFCFA(step.cost) : 'Gratuit'}
                    </span>
                  </div>
                  {onStepClick ? (
                    <button
                      type="button"
                      onClick={() => onStepClick(step.placeId)}
                      className="block max-w-full truncate text-left text-[12px] text-muted-foreground hover:underline"
                    >
                      {step.placeName} · {step.placeDistrict}
                    </button>
                  ) : (
                    <span className="block truncate text-[12px] text-muted-foreground">
                      {step.placeName} · {step.placeDistrict}
                    </span>
                  )}
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">{step.durationLabel}</p>
                  {step.note && <p className="mt-0.5 text-[11px] italic text-muted-foreground">{step.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bonus événement */}
      {plan.eventBonus && (
        <div className="mt-3 flex gap-3 rounded-2xl border border-brand-sun/40 bg-brand-sun/15 p-3.5">
          <img
            src={plan.eventBonus.imageUrl}
            alt={plan.eventBonus.title}
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-brand-ink/70">✨ Bonus à ajouter</p>
            <p className="mt-0.5 text-[13px] font-bold leading-snug text-brand-ink">{plan.eventBonus.title}</p>
            <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
              {plan.eventBonus.timeText} · {plan.eventBonus.venue}
            </p>
          </div>
        </div>
      )}

      {/* Détail du budget */}
      <div className="mt-3 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold text-brand-ink">Détail du budget</h3>
          <span className="rounded-full bg-brand-cream px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Estimé
          </span>
        </div>
        <div className="mt-3 space-y-2.5">
          {plan.breakdown.map((line) => (
            <div key={line.key} className="flex items-center gap-2">
              <span className="flex-1 truncate text-[12.5px] text-brand-ink/90">{line.label}</span>
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-black/5" aria-hidden>
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(line.amount / maxAmount) * 100}%`, backgroundColor: line.color }}
                />
              </span>
              <span className="whitespace-nowrap text-[12.5px] font-bold tabular-nums text-brand-ink">
                {formatFCFA(line.amount)}
              </span>
            </div>
          ))}
        </div>
        <Separator className="mt-3" />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[14px] font-bold text-brand-ink">Total estimé / pers.</span>
          <span className="text-[16px] font-bold text-brand-coral">{formatFCFA(plan.totals.perPerson)}</span>
        </div>
        {plan.peopleCount > 1 && (
          <p className="mt-1 text-right text-[12px] text-muted-foreground">
            Total groupe : {formatFCFA(plan.totals.group)}
          </p>
        )}
      </div>

      <DisclaimerNote className="mt-3" />
    </div>
  );
}
