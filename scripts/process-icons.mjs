// Génère toutes les icônes app + splash Capacitor depuis public/icons/icon-source.png
// Usage : node scripts/process-icons.mjs
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = '/home/z/my-project';
const SRC = path.join(ROOT, 'public/icons/icon-source.png');
const CREAM = { r: 253, g: 247, b: 239, alpha: 1 }; // #FDF7EF

async function ensure(input) {
  if (!fs.existsSync(input)) throw new Error(`Source manquante : ${input}`);
  const meta = await sharp(input).metadata();
  console.log(`Source : ${input} (${meta.width}x${meta.height}, ${meta.format})`);
}

// Icône simple redimensionnée (cover carré)
async function resizeIcon(size, out) {
  await sharp(SRC).resize(size, size, { fit: 'cover', position: 'centre' }).png().toFile(out);
  console.log(`OK  ${path.relative(ROOT, out)} (${size}x${size})`);
}

// Icône maskable : fond crème uni + icône à 78% centrée
async function maskable(size, iconRatio, out) {
  const inner = Math.round(size * iconRatio);
  const iconBuf = await sharp(SRC).resize(inner, inner, { fit: 'contain', background: CREAM }).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: CREAM },
  })
    .composite([{ input: iconBuf, gravity: 'centre' }])
    .png()
    .toFile(out);
  console.log(`OK  ${path.relative(ROOT, out)} (maskable ${size}x${size}, icône ${Math.round(iconRatio * 100)}%)`);
}

// Splash Capacitor : 2732x2732 fond crème + icône ~800px centrée
async function splash(size, iconSize, out) {
  const iconBuf = await sharp(SRC).resize(iconSize, iconSize, { fit: 'contain', background: CREAM }).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: CREAM },
  })
    .composite([{ input: iconBuf, gravity: 'centre' }])
    .png()
    .toFile(out);
  console.log(`OK  ${path.relative(ROOT, out)} (${size}x${size}, icône ${iconSize}px)`);
}

try {
  await ensure(SRC);

  // Icônes principales (1024 sert aussi à assets/icon.png pour Capacitor)
  await resizeIcon(1024, path.join(ROOT, 'public/icons/icon-1024.png'));
  await resizeIcon(1024, path.join(ROOT, 'assets/icon.png'));
  await resizeIcon(512, path.join(ROOT, 'public/icons/icon-512.png'));
  await resizeIcon(192, path.join(ROOT, 'public/icons/icon-192.png'));
  await resizeIcon(180, path.join(ROOT, 'public/icons/apple-touch-icon.png'));
  await resizeIcon(32, path.join(ROOT, 'public/icons/favicon-32.png'));

  // Variantes maskable + splash (safe-zone 78% recommandée)
  await maskable(512, 0.78, path.join(ROOT, 'public/icons/icon-maskable-512.png'));
  await splash(2732, 800, path.join(ROOT, 'assets/splash.png'));

  console.log('\nIcônes + splash générés avec succès.');
  process.exit(0);
} catch (e) {
  console.error('ERREUR :', e.message);
  process.exit(1);
}
