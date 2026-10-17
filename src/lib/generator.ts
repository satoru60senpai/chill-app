// ============================================================
// Chill — Générateur de sorties (moteur à règles, 100% client)
// Respecte le budget (y compris le plafond strict « non négociable »),
// le mood, le nombre de personnes, le moment et le jour.
// ============================================================

import type {
  CatalogBundle,
  EventItem,
  GeneratorPrefs,
  OutingPlanDraft,
  OutingStep,
  Place,
  SlotKey,
  TimeSlot,
} from './types';
import { TIMESLOT_LABELS } from './types';
import { addMinutes, dayLabelFor, formatFCFA, minutesToLabel, round500, uid } from './format';

interface StepTemplate {
  slot: SlotKey;
  title: string;
  minutes: number;
  weight: number;
  optional?: boolean;
}

const TEMPLATES: Record<TimeSlot, { steps: StepTemplate[] }> = {
  matin: {
    steps: [
      { slot: 'activity', title: 'Activité du matin', minutes: 90, weight: 0.3 },
      { slot: 'pause', title: 'Pause gourmande', minutes: 45, weight: 0.15, optional: true },
      { slot: 'food', title: 'Brunch', minutes: 75, weight: 0.4 },
    ],
  },
  'apres-midi': {
    steps: [
      { slot: 'food', title: 'Déjeuner', minutes: 90, weight: 0.42 },
      { slot: 'relax', title: 'Détente', minutes: 75, weight: 0.3 },
      { slot: 'pause', title: 'Pause gourmande', minutes: 40, weight: 0.12, optional: true },
      { slot: 'sunset', title: 'Coucher de soleil', minutes: 45, weight: 0.04 },
    ],
  },
  soir: {
    steps: [
      { slot: 'sunset', title: 'Coucher de soleil', minutes: 45, weight: 0.08, optional: true },
      { slot: 'food', title: 'Dîner', minutes: 90, weight: 0.5 },
      { slot: 'night', title: 'Fin de soirée', minutes: 60, weight: 0.3 },
    ],
  },
  soiree: {
    steps: [
      { slot: 'food', title: 'Dîner', minutes: 75, weight: 0.4 },
      { slot: 'night', title: 'Soirée', minutes: 120, weight: 0.45 },
      { slot: 'pause', title: 'Retour au calme', minutes: 30, weight: 0.08, optional: true },
    ],
  },
  journee: {
    steps: [
      { slot: 'activity', title: 'Découverte', minutes: 90, weight: 0.28 },
      { slot: 'food', title: 'Déjeuner', minutes: 90, weight: 0.4 },
      { slot: 'relax', title: 'Détente', minutes: 75, weight: 0.25 },
      { slot: 'sunset', title: 'Coucher de soleil', minutes: 45, weight: 0.05 },
    ],
  },
};

/** Multiplicateur de dépense réelle vs prix affiché (« dès X FCFA ») */
const SPEND_MULT: Record<string, number> = {
  restaurant: 1.6,
  cafe: 1.2,
  beach: 1.0,
  nature: 1.0,
  lounge: 1.5,
  culture: 1.0,
  shopping: 1.0,
  sport: 1.2,
  night: 1.5,
  spa: 1.0,
};

const BREAKDOWN_STYLE: Record<string, { label: string; color: string }> = {
  food: { label: 'Restauration', color: '#EF7A64' },
  pause: { label: 'Gourmandises', color: '#F4B942' },
  relax: { label: 'Détente & activités', color: '#B9A6E8' },
  activity: { label: 'Détente & activités', color: '#B9A6E8' },
  sunset: { label: 'Détente & activités', color: '#B9A6E8' },
  night: { label: 'Sorties nocturnes', color: '#F9A9C5' },
};

/** Générateur pseudo-aléatoire déterministe (mulberry32) */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Coût réel estimé par personne pour un lieu */
export function placeCost(place: Place): number {
  if (place.priceFrom === 0) return 0;
  return round500(place.priceFrom * (SPEND_MULT[place.category] ?? 1));
}

function moodMatches(place: Place, moodKey: string): boolean {
  if (moodKey === 'surprise') return true;
  return place.moods.includes(moodKey);
}

function pickPlace(
  places: Place[],
  slot: SlotKey,
  mood: string,
  maxCost: number | null,
  usedIds: Set<string>,
  rng: () => number,
): Place | null {
  const bySlot = places.filter((p) => p.slots.includes(slot) && !usedIds.has(p.id));
  if (bySlot.length === 0) return null;
  const candidates = bySlot.filter((p) => moodMatches(p, mood));
  const pool = candidates.length > 0 ? candidates : bySlot;
  if (maxCost !== null) {
    const affordable = pool.filter((p) => placeCost(p) <= maxCost);
    if (affordable.length > 0) {
      // Tri par rating desc puis choix pondéré parmi le top
      const sorted = affordable.sort((a, b) => b.rating - a.rating);
      const top = sorted.slice(0, Math.min(3, sorted.length));
      return shuffled(top, rng)[0];
    }
    // Aucun abordable : on tente le moins cher du pool
    const cheapest = pool.sort((a, b) => placeCost(a) - placeCost(b))[0];
    return cheapest ?? null;
  }
  const sorted = pool.sort((a, b) => b.rating - a.rating);
  const top = sorted.slice(0, Math.min(4, sorted.length));
  return shuffled(top, rng)[0];
}

function pickEvent(events: EventItem[], rng: () => number): EventItem | undefined {
  if (events.length === 0) return undefined;
  return shuffled(events, rng)[0];
}

export function generateOuting(
  catalog: CatalogBundle,
  prefs: GeneratorPrefs,
  seed: number = Math.floor(Math.random() * 1e9),
): OutingPlanDraft {
  const rng = mulberry32(seed);
  const { places, events } = catalog;
  const template = TEMPLATES[prefs.timeSlot];
  const start = TIMESLOT_LABELS[prefs.timeSlot].start;

  // 1. Budget disponible par personne après transport + marge de sécurité
  const transport = 500;
  const safetyBase = prefs.strict ? round500(prefs.budgetPerPerson * 0.1) : 0;
  let usable = prefs.budgetPerPerson - transport - safetyBase;
  if (usable < 0) usable = 0;

  const usedIds = new Set<string>();
  const built: { tpl: StepTemplate; place: Place }[] = [];

  // 2. Construction des étapes (les obligatoires d'abord)
  const ordered = [...template.steps].sort((a, b) => Number(a.optional ?? false) - Number(b.optional ?? false));
  for (const tpl of ordered) {
    const target = tpl.weight * usable;
    const maxCost = prefs.strict ? Math.max(target, 500) : null;
    const place = pickPlace(places, tpl.slot, prefs.mood, maxCost, usedIds, rng);
    if (place) {
      usedIds.add(place.id);
      built.push({ tpl, place });
    }
  }

  // 3. Mode strict : si on dépasse, on retire les étapes optionnelles les plus chères
  const costOf = (b: { tpl: StepTemplate; place: Place }) => placeCost(b.place);
  if (prefs.strict) {
    let totalSteps = built.reduce((s, b) => s + costOf(b), 0);
    while (totalSteps > usable && built.length > 2) {
      // retire l'étape optionnelle la plus chère, sinon la moins utile (poids le plus faible)
      const idx = built
        .map((b, i) => ({ i, optional: b.tpl.optional ?? false, cost: costOf(b), weight: b.tpl.weight }))
        .filter((b) => b.optional || b.weight <= 0.15)
        .sort((a, b) => b.cost - a.cost)[0];
      if (!idx) {
        const minIdx = built.reduce((min, b, i) => (costOf(b) > costOf(built[min]) ? min : i), 0);
        totalSteps -= costOf(built[minIdx]);
        built.splice(minIdx, 1);
        break;
      }
      totalSteps -= idx.cost;
      built.splice(idx.i, 1);
    }
  }

  // 4. Assemblage des étapes avec horaires
  let cursor = start;
  const steps: OutingStep[] = built.map((b) => {
    const cost = placeCost(b.place);
    const step: OutingStep = {
      id: uid(),
      time: cursor,
      title: b.tpl.title,
      slot: b.tpl.slot,
      placeId: b.place.id,
      placeName: b.place.name,
      placeDistrict: b.place.district,
      cost,
      durationLabel: minutesToLabel(b.tpl.minutes),
      note:
        b.tpl.slot === 'sunset' && cost === 0
          ? 'Gratuit · prévoyez juste le transport'
          : undefined,
    };
    cursor = addMinutes(cursor, b.tpl.minutes);
    return step;
  });

  const perPersonSteps = steps.reduce((s, st) => s + st.cost, 0);
  const totalPerPerson = perPersonSteps + transport + safetyBase;
  const durationMin = template.steps
    .filter((t) => steps.some((s) => s.slot === t.slot))
    .reduce((s, t) => s + t.minutes, 0);

  // 5. Détail du budget
  const groups = new Map<string, number>();
  for (const st of steps) {
    const key = st.slot === 'activity' || st.slot === 'sunset' ? (st.slot === 'sunset' ? 'relax' : st.slot) : st.slot;
    if (st.slot === 'activity') {
      groups.set('relax', (groups.get('relax') ?? 0) + st.cost);
    } else {
      groups.set(key, (groups.get(key) ?? 0) + st.cost);
    }
  }
  const breakdown = Array.from(groups.entries()).map(([key, amount]) => ({
    key,
    label: BREAKDOWN_STYLE[key]?.label ?? 'Autres',
    amount,
    color: BREAKDOWN_STYLE[key]?.color ?? '#3A3344',
  }));
  breakdown.push({ key: 'transport', label: 'Transport (zémidjan A/R)', amount: transport, color: '#8FBF9F' });
  if (safetyBase > 0) {
    breakdown.push({ key: 'safety', label: 'Marge de sécurité', amount: safetyBase, color: '#9AA0A6' });
  }
  breakdown.sort((a, b) => b.amount - a.amount);

  const mood = catalog.moods.find((m) => m.key === prefs.mood);
  const dayLabel = dayLabelFor(prefs.dayChoice);
  const timeLabel = TIMESLOT_LABELS[prefs.timeSlot].label.toLowerCase();

  // 6. Bonus événement (mood surprise ou week-end festif)
  let eventBonus: OutingPlanDraft['eventBonus'];
  if (prefs.mood === 'surprise' || (prefs.mood === 'festive' && prefs.dayChoice === 'weekend')) {
    const ev = pickEvent(events, rng);
    if (ev) {
      eventBonus = { title: ev.title, timeText: ev.timeText, venue: ev.venue, imageUrl: ev.imageUrl };
    }
  }

  return {
    id: uid(),
    title: `${dayLabel} ${mood?.short ?? 'sortie'} à Lomé`,
    moodKey: prefs.mood,
    moodLabel: mood?.label ?? 'Sortie',
    dayLabel,
    timeLabel,
    budgetPerPerson: prefs.budgetPerPerson,
    strict: prefs.strict,
    peopleCount: prefs.people,
    createdAt: new Date().toISOString(),
    durationLabel: minutesToLabel(durationMin),
    steps,
    totals: {
      perPerson: totalPerPerson,
      group: totalPerPerson * prefs.people,
      transport,
      safety: safetyBase,
    },
    breakdown,
    eventBonus,
    status: 'planned',
  };
}

/** Résumé texte prêt à partager (WhatsApp / SMS) — partage sans friction */
export function planToShareText(plan: OutingPlanDraft): string {
  const lines: string[] = [];
  lines.push(`🌴 CHILL — ${plan.title}`);
  lines.push(`⏱ ${plan.durationLabel} · ${plan.steps.length} étapes · ${formatFCFA(plan.totals.perPerson)}/pers.`);
  if (plan.peopleCount > 1) lines.push(`👥 Pour ${plan.peopleCount} personnes : ${formatFCFA(plan.totals.group)}`);
  lines.push('');
  for (const s of plan.steps) {
    lines.push(`${s.time} — ${s.title} : ${s.placeName} (${s.placeDistrict})${s.cost > 0 ? ` · ${formatFCFA(s.cost)}` : ' · Gratuit'}`);
  }
  if (plan.eventBonus) {
    lines.push('');
    lines.push(`✨ Bonus : ${plan.eventBonus.title} · ${plan.eventBonus.timeText} · ${plan.eventBonus.venue}`);
  }
  lines.push('');
  lines.push('💡 Estimations indicatives en FCFA — proposé par Chill, l’appli qui répond à « On fait quoi aujourd’hui ? »');
  return lines.join('\n');
}
