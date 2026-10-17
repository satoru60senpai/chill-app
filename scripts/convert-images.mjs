// Convertit les PNG bruts de tmp-imggen en JPEG optimisés dans public/images
// Usage : node scripts/convert-images.mjs
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = '/home/z/my-project';
const SRC = path.join(ROOT, 'tmp-imggen');

const MAP = [
  // Covers (paysage 1344x768)
  ['cover-weekend.png', 'public/images/cover-weekend.jpg', 1344, 768],
  ['cover-budget.png', 'public/images/cover-budget.jpg', 1344, 768],
  // Places (carré 1024x1024)
  ['chez-adjo.png', 'public/images/places/chez-adjo.jpg', 1024, 1024],
  ['cafe-la-tasse.png', 'public/images/places/cafe-la-tasse.jpg', 1024, 1024],
  ['jardin-evasion.png', 'public/images/places/jardin-evasion.jpg', 1024, 1024],
  ['plage-lome.png', 'public/images/places/plage-lome.jpg', 1024, 1024],
  ['le-pecheur.png', 'public/images/places/le-pecheur.jpg', 1024, 1024],
  ['blue-bay.png', 'public/images/places/blue-bay.jpg', 1024, 1024],
  ['marche-akodessewa.png', 'public/images/places/marche-akodessewa.jpg', 1024, 1024],
  ['musee-golfe.png', 'public/images/places/musee-golfe.jpg', 1024, 1024],
  ['place-souvenir.png', 'public/images/places/place-souvenir.jpg', 1024, 1024],
  ['lagune-lome.png', 'public/images/places/lagune-lome.jpg', 1024, 1024],
  ['rooftop-228.png', 'public/images/places/rooftop-228.jpg', 1024, 1024],
  ['parc-amouti.png', 'public/images/places/parc-amouti.jpg', 1024, 1024],
  // Categories (carré 1024x1024)
  ['cat-restaurant.png', 'public/images/categories/restaurant.jpg', 1024, 1024],
  ['cat-cafe.png', 'public/images/categories/cafe.jpg', 1024, 1024],
  ['cat-beach.png', 'public/images/categories/beach.jpg', 1024, 1024],
  ['cat-nature.png', 'public/images/categories/nature.jpg', 1024, 1024],
  ['cat-lounge.png', 'public/images/categories/lounge.jpg', 1024, 1024],
  ['cat-culture.png', 'public/images/categories/culture.jpg', 1024, 1024],
  ['cat-sport.png', 'public/images/categories/sport.jpg', 1024, 1024],
  ['cat-night.png', 'public/images/categories/night.jpg', 1024, 1024],
  ['cat-spa.png', 'public/images/categories/spa.jpg', 1024, 1024],
  ['cat-family.png', 'public/images/categories/family.jpg', 1024, 1024],
  // Events (paysage 1344x768)
  ['marche-creatif.png', 'public/images/events/marche-creatif.jpg', 1344, 768],
  ['beach-sunday.png', 'public/images/events/beach-sunday.jpg', 1344, 768],
  ['yoga.png', 'public/images/events/yoga.jpg', 1344, 768],
  ['concert.png', 'public/images/events/concert.jpg', 1344, 768],
  ['brunch.png', 'public/images/events/brunch.jpg', 1344, 768],
];

let ok = 0, fail = 0;
for (const [src, dest, w, h] of MAP) {
  const srcPath = path.join(SRC, src);
  const destPath = path.join(ROOT, dest);
  try {
    await sharp(srcPath)
      .resize(w, h, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toFile(destPath);
    const kb = Math.round(fs.statSync(destPath).size / 1024);
    console.log(`OK  ${dest} (${kb} Ko)`);
    ok++;
  } catch (e) {
    console.error(`FAIL ${dest}: ${e.message}`);
    fail++;
  }
}
console.log(`\n${ok} converties, ${fail} échecs`);
process.exit(fail > 0 ? 1 : 0);
