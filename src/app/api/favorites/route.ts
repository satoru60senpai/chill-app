// Favoris — miroir serveur (source de vérité : appareil)
// GET  /api/favorites?deviceId=...  → liste des placeId
// POST /api/favorites               → { deviceId, placeId, fav }
import { db } from '@/lib/db';
import { badRequest, json } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  if (!deviceId) return badRequest('deviceId requis');
  try {
    const rows = await db.favorite.findMany({ where: { deviceId }, select: { placeId: true } });
    return json(rows.map((r) => r.placeId));
  } catch (error) {
    console.error('GET /api/favorites', error);
    return json([], 200);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { deviceId?: string; placeId?: string; fav?: boolean };
    const { deviceId, placeId, fav } = body;
    if (!deviceId || !placeId || typeof fav !== 'boolean') return badRequest('deviceId, placeId, fav requis');

    const place = await db.place.findUnique({ where: { id: placeId } });
    if (!place) return badRequest('Lieu inconnu');

    if (fav) {
      await db.favorite.upsert({
        where: { deviceId_placeId: { deviceId, placeId } },
        update: {},
        create: { deviceId, placeId },
      });
    } else {
      await db.favorite.deleteMany({ where: { deviceId, placeId } });
    }
    return json({ ok: true });
  } catch (error) {
    console.error('POST /api/favorites', error);
    return json({ ok: false }, 500);
  }
}
