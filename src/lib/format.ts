import type { WeatherInfo } from './types';

/** 1250 -> « 1 250 FCFA » */
export function formatFCFA(amount: number): string {
  const n = Math.round(amount);
  return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')} FCFA`;
}

/** 1250 -> « 1 250 » */
export function formatNumber(amount: number): string {
  const n = Math.round(amount);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
}

/** 4000 -> « 4k », 1500 -> « 1,5k » */
export function formatK(amount: number): string {
  if (amount >= 1000) {
    const v = amount / 1000;
    const txt = Number.isInteger(v) ? v.toString() : v.toFixed(1).replace('.', ',');
    return `${txt}k`;
  }
  return amount.toString();
}

/** Distance haversine en km (arrondie à 1 décimale) */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

/** Point de référence par défaut : Place de l'Indépendance, Lomé */
export const LOME_CENTER = { lat: 6.1319, lng: 1.2228 };

const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAYS_FR_CAP = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export function todayLabelFr(capitalized = true): string {
  const d = new Date();
  const label = DAYS_FR[d.getDay()];
  return capitalized ? DAYS_FR_CAP[d.getDay()] : label;
}

/** « Aujourd'hui » / « Demain » / « Samedi » / « Dimanche » selon le choix */
export function dayLabelFor(choice: 'aujourdhui' | 'demain' | 'weekend'): string {
  if (choice === 'aujourdhui') return 'Aujourd’hui';
  if (choice === 'demain') return 'Demain';
  // week-end : le samedi le plus proche (ou dimanche si on est dimanche)
  const d = new Date();
  if (d.getDay() === 0) return 'Dimanche';
  return 'Samedi';
}

/** « Samedi 5 juillet » style line */
export function dateLineFr(): string {
  const d = new Date();
  const cap = DAYS_FR_CAP[d.getDay()];
  return `${cap} ${d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'long' })}`;
}

/** Ajoute des minutes à « HH:MM » -> « HH:MM » */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

/** 100 -> « 1h40 », 60 -> « 1h », 45 -> « 45 min » */
export function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

export function round500(n: number): number {
  return Math.round(n / 500) * 500;
}

const WEATHER_MAP: { codes: number[]; label: string; emoji: string }[] = [
  { codes: [0], label: 'Ensoleillé', emoji: '☀️' },
  { codes: [1, 2], label: 'Plutôt dégagé', emoji: '🌤️' },
  { codes: [3], label: 'Nuageux', emoji: '⛅' },
  { codes: [45, 48], label: 'Brumeux', emoji: '🌫️' },
  { codes: [51, 53, 55, 56, 57], label: 'Bruine', emoji: '🌦️' },
  { codes: [61, 63, 65, 66, 67, 80, 81, 82], label: 'Pluie', emoji: '🌧️' },
  { codes: [71, 73, 75, 77], label: 'Temps inhabituel', emoji: '❄️' },
  { codes: [85, 86], label: 'Averses', emoji: '🌦️' },
  { codes: [95, 96, 99], label: 'Orage', emoji: '⛈️' },
];

export const WEATHER_FALLBACK: WeatherInfo = {
  label: 'Ensoleillé',
  emoji: '☀️',
  tempC: 29,
  source: 'fallback',
};

export function weatherFromCode(code: number, tempC: number): WeatherInfo {
  const found = WEATHER_MAP.find((w) => w.codes.includes(code));
  if (!found) return { ...WEATHER_FALLBACK, tempC, source: 'api' };
  return { label: found.label, emoji: found.emoji, tempC, source: 'api' };
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
