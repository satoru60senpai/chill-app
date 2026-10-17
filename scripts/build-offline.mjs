// ============================================================
// Chill — Build statique hors-ligne (pour l'APK Capacitor)
// 1) Écarte temporairement les routes API serveur
// 2) Exporte le site en statique avec NEXT_PUBLIC_OFFLINE=1
//    (le client utilise le catalogue embarqué + localStorage)
// 3) Restaure les routes API
// ============================================================
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiDir = path.join(root, 'src', 'app', 'api');
const backupDir = path.join(root, '.api-backup-offline');

function moveAway() {
  if (fs.existsSync(apiDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
    fs.renameSync(apiDir, backupDir);
    console.log('→ Routes API écartées (build statique)');
  }
}

function restore() {
  if (fs.existsSync(backupDir)) {
    fs.rmSync(apiDir, { recursive: true, force: true });
    fs.renameSync(backupDir, apiDir);
    console.log('← Routes API restaurées');
  }
}

process.on('exit', restore);
process.on('SIGINT', () => {
  restore();
  process.exit(130);
});

moveAway();
try {
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_OFFLINE: '1',
      CHILL_STATIC_EXPORT: '1',
    },
  });
  console.log('✅ Export statique prêt dans ./out');
} catch (err) {
  console.error('❌ Échec du build hors-ligne');
  process.exitCode = 1;
} finally {
  restore();
}
