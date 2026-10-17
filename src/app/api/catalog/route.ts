// GET /api/catalog — bundle complet (lieux, collections, événements, moods)
import { db } from '@/lib/db';
import { dbToCollection, dbToEvent, dbToMood, dbToPlace, json } from '@/lib/server-utils';
import type { CatalogBundle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [places, collections, events, moods] = await Promise.all([
      db.place.findMany(),
      db.collection.findMany({ include: { collectionPlaces: true } }),
      db.event.findMany(),
      db.mood.findMany({ orderBy: { order: 'asc' } }),
    ]);

    const bundle: CatalogBundle = {
      places: places.map(dbToPlace),
      collections: collections.map(dbToCollection),
      events: events.map(dbToEvent),
      moods: moods.map(dbToMood),
    };

    return json(bundle);
  } catch (error) {
    console.error('GET /api/catalog', error);
    return json({ error: 'Catalogue indisponible' }, 500);
  }
}
