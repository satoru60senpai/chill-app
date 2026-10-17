// ============================================================
// Chill — Types partagés (contrat unique pour toute l'app)
// ============================================================

export type Tab = 'home' | 'discover' | 'outings' | 'profile';

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'beach'
  | 'nature'
  | 'lounge'
  | 'culture'
  | 'shopping'
  | 'sport'
  | 'night'
  | 'spa';

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café & douceurs',
  beach: 'Plage',
  nature: 'Nature',
  lounge: 'Lounge',
  culture: 'Culture',
  shopping: 'Shopping',
  sport: 'Loisirs & sport',
  night: 'Soirée',
  spa: 'Bien-être',
};

export const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  restaurant: '🍽️',
  cafe: '☕',
  beach: '🏖️',
  nature: '🌿',
  lounge: '🛋️',
  culture: '🎨',
  shopping: '🛍️',
  sport: '🎳',
  night: '🎶',
  spa: '💆',
};

/** Rôle possible d'un lieu dans un programme de sortie */
export type SlotKey = 'food' | 'relax' | 'pause' | 'sunset' | 'activity' | 'night';

export type TimeSlot = 'matin' | 'apres-midi' | 'soir' | 'soiree' | 'journee';

export const TIMESLOT_LABELS: Record<TimeSlot, { label: string; emoji: string; start: string }> = {
  matin: { label: 'Matin', emoji: '🌅', start: '09:30' },
  'apres-midi': { label: 'Après-midi', emoji: '☀️', start: '14:00' },
  soir: { label: 'Soir', emoji: '🌆', start: '18:15' },
  soiree: { label: 'Soirée', emoji: '🌙', start: '19:30' },
  journee: { label: 'Journée', emoji: '🌻', start: '10:00' },
};

export type DayChoice = 'aujourdhui' | 'demain' | 'weekend';

export type PriceReliability = 'confirme' | 'partenaire' | 'estime';

export const RELIABILITY_LABELS: Record<PriceReliability, string> = {
  confirme: 'Prix confirmé',
  partenaire: 'Renseigné par le partenaire',
  estime: 'Estimation Chill',
};

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  description: string;
  district: string;
  address: string;
  /** Prix de départ en FCFA (0 = gratuit) */
  priceFrom: number;
  /** Ex : « Entrée 2 000 FCFA » ou « Plats dès 1 500 FCFA » */
  priceHint: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
  phone: string;
  hours: string;
  moods: string[];
  slots: SlotKey[];
  /** Ex : « ~1h30 » */
  durationHint: string;
  services: string[];
  accessNote: string;
  reliability: PriceReliability;
  lastVerified: string;
  isSponsored: boolean;
  isPopular: boolean;
}

export interface CollectionItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  coverImage: string;
  isFeatured: boolean;
  placeIds: string[];
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  venue: string;
  /** Ex : « Dim · 10h – 18h » */
  timeText: string;
  /** Ex : « Entrée libre » */
  priceLabel: string;
  imageUrl: string;
  category: string;
}

export interface Mood {
  key: string;
  label: string;
  /** Forme courte pour les titres : « détente », « entre amis »… */
  short: string;
  emoji: string;
  color: string;
}

export interface CatalogBundle {
  places: Place[];
  collections: CollectionItem[];
  events: EventItem[];
  moods: Mood[];
}

// ---------------- Sorties générées ----------------

export interface OutingStep {
  id: string;
  /** « 14:00 » */
  time: string;
  title: string;
  slot: SlotKey;
  placeId: string;
  placeName: string;
  placeDistrict: string;
  /** Coût estimé par personne en FCFA */
  cost: number;
  /** « 1h30 » */
  durationLabel: string;
  note?: string;
}

export interface BudgetLine {
  key: string;
  label: string;
  amount: number;
  color: string;
}

export interface OutingPlanDraft {
  id: string;
  title: string;
  moodKey: string;
  moodLabel: string;
  dayLabel: string;
  timeLabel: string;
  budgetPerPerson: number;
  strict: boolean;
  peopleCount: number;
  createdAt: string;
  /** « ~4h » */
  durationLabel: string;
  steps: OutingStep[];
  totals: {
    perPerson: number;
    group: number;
    transport: number;
    safety: number;
  };
  breakdown: BudgetLine[];
  eventBonus?: {
    title: string;
    timeText: string;
    venue: string;
    imageUrl: string;
  };
  status: 'planned' | 'done';
}

export interface GeneratorPrefs {
  mood: string;
  budgetPerPerson: number;
  strict: boolean;
  people: number;
  timeSlot: TimeSlot;
  dayChoice: DayChoice;
}

export interface Profile {
  name: string;
  avatar: string;
  defaultBudget: number;
  city: string;
  notifEnabled: boolean;
}

export interface WeatherInfo {
  label: string;
  emoji: string;
  tempC: number;
  source: 'api' | 'fallback';
}

export interface ReportItem {
  id: string;
  placeId: string;
  placeName: string;
  message: string;
  createdAt: string;
}
