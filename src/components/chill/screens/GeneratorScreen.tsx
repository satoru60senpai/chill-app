'use client';

// ============================================================
// Chill — Générateur de sorties (overlay plein écran)
// Mood, budget, personnes, moment, jour → programme sur mesure.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { useChillStore } from '@/lib/store';
import { useCatalog } from '@/lib/catalog';
import { generateOuting } from '@/lib/generator';
import { formatK, formatNumber } from '@/lib/format';
import type { DayChoice, OutingPlanDraft, TimeSlot } from '@/lib/types';
import { TIMESLOT_LABELS } from '@/lib/types';
import { syncPlanSave } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Chip } from '@/components/chill/ui-bits';
import PlanDetailView, { sharePlan } from '@/components/chill/PlanDetailView';
import { cn } from '@/lib/utils';

const TIME_SLOTS = Object.keys(TIMESLOT_LABELS) as TimeSlot[];

const DAY_CHOICES: { key: DayChoice; label: string }[] = [
  { key: 'aujourdhui', label: 'Aujourd’hui' },
  { key: 'demain', label: 'Demain' },
  { key: 'weekend', label: 'Ce week-end' },
];

const PEOPLE_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8];

export default function GeneratorScreen() {
  const generatorOpen = useChillStore((s) => s.generatorOpen);
  const setGeneratorOpen = useChillStore((s) => s.setGeneratorOpen);
  const prefs = useChillStore((s) => s.prefs);
  const setPrefs = useChillStore((s) => s.setPrefs);
  const openPlace = useChillStore((s) => s.openPlace);
  const savePlan = useChillStore((s) => s.savePlan);
  const deviceId = useChillStore((s) => s.deviceId);
  const { catalog } = useCatalog();

  const [plan, setPlan] = useState<OutingPlanDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const seedRef = useRef(Math.floor(Math.random() * 1e9));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Bloque le défilement de l'écran de fond tant que le générateur est ouvert
  useEffect(() => {
    if (!generatorOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [generatorOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const buildPlan = () => {
    seedRef.current += 1;
    setPlan(generateOuting(catalog, prefs, seedRef.current));
  };

  const handleGenerate = () => {
    if (generating) return;
    setGenerating(true);
    timerRef.current = setTimeout(() => {
      buildPlan();
      setGenerating(false);
    }, 800);
  };

  const handleReset = () => {
    setPrefs({
      mood: 'chill',
      budgetPerPerson: 6000,
      strict: false,
      people: 2,
      timeSlot: 'apres-midi',
      dayChoice: 'aujourdhui',
    });
    toast('Critères réinitialisés');
  };

  const handleSave = () => {
    if (!plan) return;
    savePlan(plan);
    syncPlanSave(deviceId, plan);
    toast.success('Sortie enregistrée dans « Mes sorties » 💾');
  };

  const handleShare = () => {
    if (plan) sharePlan(plan);
  };

  return (
    <AnimatePresence>
      {generatorOpen && (
        <motion.div
          ref={scrollRef}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 260 }}
          className="fixed inset-0 z-30 mx-auto max-w-[430px] overflow-y-auto bg-brand-cream"
        >
          {/* Entête sticky */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-rose-soft/60 bg-brand-cream/95 px-4 py-3.5 backdrop-blur">
            <button
              type="button"
              onClick={() => setGeneratorOpen(false)}
              aria-label="Fermer le générateur"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform active:scale-95"
            >
              <X className="h-5 w-5 text-brand-ink" aria-hidden />
            </button>
            <h1 className="text-[16px] font-bold text-brand-ink">Générateur de sorties</h1>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Réinitialiser les critères"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform active:scale-95"
            >
              <RotateCcw className="h-[18px] w-[18px] text-brand-ink" aria-hidden />
            </button>
          </header>

          <div className="space-y-5 px-4 pb-32 pt-4">
            {/* Mood */}
            <section>
              <h2 className="mb-2.5 text-[16px] font-bold text-brand-ink">Quelle est ton envie ?</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {catalog.moods.map((m) => {
                  const active = prefs.mood === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPrefs({ mood: m.key })}
                      className={cn(
                        'relative rounded-2xl border-2 p-3.5 text-left transition-all active:scale-[0.98]',
                        active ? 'border-brand-coral bg-brand-rose-soft/60' : 'border-transparent bg-white shadow-sm',
                      )}
                    >
                      <span className="text-[20px]" aria-hidden>
                        {m.emoji}
                      </span>
                      <p className="mt-1 text-[13px] font-bold text-brand-ink">{m.label}</p>
                      {active && (
                        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-coral">
                          <Check className="h-3 w-3 text-white" aria-hidden />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Budget */}
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-brand-ink">Budget par personne</p>
                <p className="text-[22px] font-bold text-brand-coral">
                  {formatNumber(prefs.budgetPerPerson)} FCFA
                </p>
              </div>
              <Slider
                min={1000}
                max={15000}
                step={500}
                value={[prefs.budgetPerPerson]}
                onValueChange={(v) => setPrefs({ budgetPerPerson: v[0] ?? prefs.budgetPerPerson })}
                aria-label="Budget par personne"
                className="mt-3 [&_[data-slot=slider-range]]:bg-brand-coral [&_[data-slot=slider-thumb]]:border-brand-coral"
              />
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>{formatK(1000)}</span>
                <span>{formatK(15000)}</span>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center gap-3">
                <Switch
                  checked={prefs.strict}
                  onCheckedChange={(v) => setPrefs({ strict: v })}
                  aria-label="Budget non négociable"
                  className="data-[state=checked]:bg-brand-coral"
                />
                <div>
                  <p className="text-[13px] font-bold text-brand-ink">Budget non négociable</p>
                  <p className="text-[11.5px] leading-snug text-muted-foreground">
                    Aucune idée au-dessus du plafond.
                  </p>
                </div>
              </div>
            </section>

            {/* Personnes */}
            <section>
              <h2 className="mb-2.5 text-[14px] font-bold text-brand-ink">Combien de personnes ?</h2>
              <div className="flex flex-wrap gap-2">
                {PEOPLE_CHOICES.map((n) => (
                  <Chip key={n} active={prefs.people === n} onClick={() => setPrefs({ people: n })}>
                    {n}
                  </Chip>
                ))}
              </div>
            </section>

            {/* Moment */}
            <section>
              <h2 className="mb-2.5 text-[14px] font-bold text-brand-ink">Quel moment ?</h2>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((key) => {
                  const meta = TIMESLOT_LABELS[key];
                  return (
                    <Chip key={key} active={prefs.timeSlot === key} onClick={() => setPrefs({ timeSlot: key })}>
                      <span aria-hidden>{meta.emoji}</span>
                      {meta.label}
                    </Chip>
                  );
                })}
              </div>
            </section>

            {/* Jour */}
            <section>
              <h2 className="mb-2.5 text-[14px] font-bold text-brand-ink">Quel jour ?</h2>
              <div className="flex flex-wrap gap-2">
                {DAY_CHOICES.map((d) => (
                  <Chip key={d.key} active={prefs.dayChoice === d.key} onClick={() => setPrefs({ dayChoice: d.key })}>
                    {d.label}
                  </Chip>
                ))}
              </div>
            </section>

            {/* CTA */}
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="h-[52px] w-full rounded-2xl bg-brand-coral text-[15.5px] font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-coral-deep active:scale-[0.98]"
            >
              {generating ? (
                <>
                  <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
                  On compose ton programme…
                </>
              ) : (
                '🎲 Générer mes idées'
              )}
            </Button>

            {/* Résultat */}
            {plan && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">
                <PlanDetailView plan={plan} onStepClick={(placeId) => openPlace(placeId)} />
                <Button
                  onClick={handleSave}
                  className="h-12 w-full rounded-2xl bg-brand-coral text-[14.5px] font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-coral-deep"
                >
                  💾 Enregistrer cette sortie
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="h-12 rounded-2xl border-brand-rose-soft text-[13.5px] font-bold text-brand-ink hover:bg-brand-rose-soft/40"
                  >
                    🔄 Régénérer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="h-12 rounded-2xl border-brand-rose-soft text-[13.5px] font-bold text-brand-ink hover:bg-brand-rose-soft/40"
                  >
                    📤 Partager
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="mx-auto block text-[12.5px] text-muted-foreground hover:text-brand-ink"
                >
                  Modifier mes critères ↑
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
