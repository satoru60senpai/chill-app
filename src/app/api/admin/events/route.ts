// Administration des événements
// POST   /api/admin/events        → upsert (X-Admin-Key)
// DELETE /api/admin/events?id=... → suppression
import { db } from '@/lib/db';
import { badRequest, isAdmin, json, unauthorized } from '@/lib/server-utils';
import type { EventItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const e = (await request.json()) as EventItem;
    if (!e?.id || !e?.title) return badRequest('id et title requis');

    const data = {
      title: e.title,
      description: e.description ?? '',
      venue: e.venue ?? '',
      timeText: e.timeText ?? '',
      priceLabel: e.priceLabel ?? 'Entrée libre',
      imageUrl: e.imageUrl || '/images/events/marche-creatif.jpg',
      category: e.category ?? '',
    };

    await db.event.upsert({ where: { id: e.id }, update: data, create: { id: e.id, ...data } });
    return json({ ok: true });
  } catch (error) {
    console.error('POST /api/admin/events', error);
    return json({ ok: false, error: 'Enregistrement impossible' }, 500);
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return badRequest('id requis');
  try {
    await db.event.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/admin/events', error);
    return json({ ok: false, error: 'Suppression impossible' }, 500);
  }
}
