// Administration des collections éditoriales (§5.13)
// POST   /api/admin/collections        → upsert avec placeIds (X-Admin-Key)
// DELETE /api/admin/collections?id=... → suppression
import { db } from '@/lib/db';
import { badRequest, isAdmin, json, unauthorized } from '@/lib/server-utils';
import type { CollectionItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const c = (await request.json()) as CollectionItem;
    if (!c?.id || !c?.title) return badRequest('id et title requis');

    const base = {
      title: c.title,
      subtitle: c.subtitle ?? '',
      badge: c.badge ?? '',
      coverImage: c.coverImage || '/images/cover-budget.jpg',
      isFeatured: !!c.isFeatured,
    };

    const placeIds = Array.isArray(c.placeIds) ? c.placeIds : [];
    const validIds: string[] = [];
    for (const pid of placeIds) {
      const exists = await db.place.findUnique({ where: { id: pid } });
      if (exists) validIds.push(pid);
    }

    await db.collection.upsert({
      where: { id: c.id },
      update: base,
      create: { id: c.id, ...base },
    });

    // Remplace les jointures
    await db.collectionPlace.deleteMany({ where: { collectionId: c.id } });
    if (validIds.length > 0) {
      await db.collectionPlace.createMany({
        data: validIds.map((placeId, order) => ({ collectionId: c.id, placeId, order })),
      });
    }
    return json({ ok: true });
  } catch (error) {
    console.error('POST /api/admin/collections', error);
    return json({ ok: false, error: 'Enregistrement impossible' }, 500);
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return badRequest('id requis');
  try {
    await db.collection.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/admin/collections', error);
    return json({ ok: false, error: 'Suppression impossible' }, 500);
  }
}
