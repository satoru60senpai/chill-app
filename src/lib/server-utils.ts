// ============================================================
// Chill — Utilitaires serveur (routes API)
// ============================================================

import type { CollectionItem, EventItem, Mood, Place, PriceReliability, PlaceCategory, SlotKey } from '@/lib/types';

export const ADMIN_KEY = process.env.ADMIN_KEY || 'chill-admin-2025';

export function isAdmin(request: Request): boolean {
  return request.headers.get('X-Admin-Key') === ADMIN_KEY;
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function badRequest(message: string): Response {
  return Response.json({ ok: false, error: message }, { status: 400 });
}

export function unauthorized(): Response {
  return Response.json({ ok: false, error: 'Clé admin invalide' }, { status: 401 });
}

// ---- Convertisseurs DB -> types applicatifs ----

 
export function dbToPlace(row: any): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category as PlaceCategory,
    description: row.description,
    district: row.district,
    address: row.address,
    priceFrom: row.priceFrom,
    priceHint: row.priceHint,
    rating: row.rating,
    reviewCount: row.reviewCount,
    imageUrl: row.imageUrl,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone ?? '',
    hours: row.hours,
    moods: safeParseArray(row.moods),
    slots: safeParseArray(row.slots) as SlotKey[],
    durationHint: row.durationHint ?? '',
    services: safeParseArray(row.services),
    accessNote: row.accessNote ?? '',
    reliability: (row.reliability ?? 'estime') as PriceReliability,
    lastVerified: row.lastVerified ?? '',
    isSponsored: row.isSponsored,
    isPopular: row.isPopular,
  };
}

export function dbToEvent(row: any): EventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    venue: row.venue,
    timeText: row.timeText,
    priceLabel: row.priceLabel,
    imageUrl: row.imageUrl,
    category: row.category ?? '',
  };
}

export function dbToMood(row: any, index: number): Mood {
  return {
    key: row.key,
    label: row.label,
    short: row.short,
    emoji: row.emoji,
    color: row.color,
    order: row.order ?? index,
  };
}

export function dbToCollection(row: any): CollectionItem {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    badge: row.badge,
    coverImage: row.coverImage,
    isFeatured: row.isFeatured,
    placeIds: (row.collectionPlaces ?? [])
      .slice()
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((cp: any) => cp.placeId),
  };
}

export function safeParseArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? []);
  } catch {
    return '[]';
  }
}
