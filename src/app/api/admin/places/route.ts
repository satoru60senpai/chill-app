// Administration des lieux (§7.1 interface d'administration)
// POST   /api/admin/places        → upsert complet (X-Admin-Key)
// DELETE /api/admin/places?id=... → suppression (X-Admin-Key)
import { db } from '@/lib/db';
import { badRequest, isAdmin, json, safeParseArray, safeStringify, unauthorized } from '@/lib/server-utils';
import type { Place } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const p = (await request.json()) as Place;
    if (!p?.id || !p?.name) return badRequest('id et name requis');

    const data = {
      name: p.name,
      category: p.category ?? 'restaurant',
      description: p.description ?? '',
      district: p.district ?? 'Lomé',
      address: p.address ?? '',
      priceFrom: Math.max(0, Math.round(p.priceFrom ?? 0)),
      priceHint: p.priceHint ?? '',
      rating: Math.min(5, Math.max(0, p.rating ?? 4)),
      reviewCount: Math.max(0, Math.round(p.reviewCount ?? 0)),
      imageUrl: p.imageUrl || '/images/categories/restaurant.jpg',
      latitude: p.latitude ?? 6.1319,
      longitude: p.longitude ?? 1.2228,
      phone: p.phone ?? '',
      hours: p.hours ?? '',
      moods: safeStringify(p.moods),
      slots: safeStringify(p.slots),
      durationHint: p.durationHint ?? '',
      services: safeStringify(p.services),
      accessNote: p.accessNote ?? '',
      reliability: p.reliability ?? 'estime',
      lastVerified: p.lastVerified ?? '',
      isSponsored: !!p.isSponsored,
      isPopular: !!p.isPopular,
    };

    await db.place.upsert({ where: { id: p.id }, update: data, create: { id: p.id, ...data } });
    return json({ ok: true });
  } catch (error) {
    console.error('POST /api/admin/places', error);
    return json({ ok: false, error: 'Enregistrement impossible' }, 500);
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return badRequest('id requis');
  try {
    await db.place.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/admin/places', error);
    return json({ ok: false, error: 'Suppression impossible' }, 500);
  }
}

// Évite l'avertissement unused (utilisé indirectement par l'import)
void safeParseArray;
