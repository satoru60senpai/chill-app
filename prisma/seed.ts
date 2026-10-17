// ============================================================
// Chill — Seed de la base : catalogue de démonstration Lomé
// Usage : bun prisma/seed.ts  (ou bun run db:seed)
// ============================================================

import { PrismaClient } from '@prisma/client';
import { SEED_COLLECTIONS, SEED_EVENTS, SEED_MOODS, SEED_PLACES } from '../src/lib/seed-data';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seed Chill — Lomé, Togo');

  // Nettoyage (ordre respectant les FK)
  await db.report.deleteMany();
  await db.favorite.deleteMany();
  await db.outingPlan.deleteMany();
  await db.collectionPlace.deleteMany();
  await db.collection.deleteMany();
  await db.event.deleteMany();
  await db.mood.deleteMany();
  await db.place.deleteMany();

  // Lieux
  for (const p of SEED_PLACES) {
    await db.place.create({
      data: {
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        district: p.district,
        address: p.address,
        priceFrom: p.priceFrom,
        priceHint: p.priceHint,
        rating: p.rating,
        reviewCount: p.reviewCount,
        imageUrl: p.imageUrl,
        latitude: p.latitude,
        longitude: p.longitude,
        phone: p.phone,
        hours: p.hours,
        moods: JSON.stringify(p.moods),
        slots: JSON.stringify(p.slots),
        durationHint: p.durationHint,
        services: JSON.stringify(p.services),
        accessNote: p.accessNote,
        reliability: p.reliability,
        lastVerified: p.lastVerified,
        isSponsored: p.isSponsored,
        isPopular: p.isPopular,
      },
    });
  }
  console.log(`  ✅ ${SEED_PLACES.length} lieux`);

  // Collections + jointures
  for (const c of SEED_COLLECTIONS) {
    await db.collection.create({
      data: {
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        badge: c.badge,
        coverImage: c.coverImage,
        isFeatured: c.isFeatured,
        collectionPlaces: {
          create: c.placeIds.map((placeId, order) => ({ placeId, order })),
        },
      },
    });
  }
  console.log(`  ✅ ${SEED_COLLECTIONS.length} collections`);

  // Événements
  for (const e of SEED_EVENTS) {
    await db.event.create({ data: { ...e } });
  }
  console.log(`  ✅ ${SEED_EVENTS.length} événements`);

  // Moods
  for (const [i, m] of SEED_MOODS.entries()) {
    await db.mood.create({ data: { key: m.key, label: m.label, short: m.short, emoji: m.emoji, color: m.color, order: i } });
  }
  console.log(`  ✅ ${SEED_MOODS.length} moods`);

  console.log('🌴 Base prête !');
}

main()
  .catch((e) => {
    console.error('❌ Seed échoué :', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
