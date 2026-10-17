// Signalements d'informations incorrectes (§12 du cahier des charges)
// POST   /api/reports            → { deviceId, placeId, message }
// GET    /api/reports            → liste (admin, X-Admin-Key)
// DELETE /api/reports?id=...     → marquer traité / supprimer (admin)
import { db } from '@/lib/db';
import { badRequest, isAdmin, json, unauthorized } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { deviceId?: string; placeId?: string; message?: string };
    const { deviceId, placeId, message } = body;
    if (!deviceId || !placeId) return badRequest('deviceId et placeId requis');

    const place = await db.place.findUnique({ where: { id: placeId } });
    if (!place) return badRequest('Lieu inconnu');

    await db.report.create({
      data: {
        placeId,
        message: (message || 'Information à vérifier').slice(0, 500),
      },
    });
    return json({ ok: true });
  } catch (error) {
    console.error('POST /api/reports', error);
    return json({ ok: false }, 500);
  }
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const rows = await db.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: { place: { select: { name: true } } },
    });
    return json(
      rows.map((r) => ({
        id: r.id,
        placeId: r.placeId,
        placeName: r.place?.name ?? r.placeId,
        message: r.message,
        handled: r.handled,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error('GET /api/reports', error);
    return json([]);
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return badRequest('id requis');
  try {
    await db.report.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/reports', error);
    return json({ ok: false }, 500);
  }
}
