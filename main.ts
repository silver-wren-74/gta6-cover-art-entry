// Neon Coast Studio — hand-in program for gta6-cover-art-01 (Node 22, stdlib only).
// Copies the static app and its screenshots next to a dossier.json built with
// the vendored make.fun library, into $MAKEFUN_OUTPUT_DIR (or /output in the
// grader's container). Run locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app itself with any static file server rooted at app/.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const target = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(target, { recursive: true });

// The app ships exactly as authored: plain static files, no build step.
cpSync(join(repoRoot, 'app'), join(target, 'app'), { recursive: true });

// Screenshots are evidence for the judge; hand them in when present.
const shotsDir = join(target, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsDir, { recursive: true });
}

// Caps mirror the competition gate so this program refuses anything the
// scorer would refuse: at most 4 screenshots of 256 KiB each, and an app/
// tree of at most 993 entries / 48 MiB with paths of at most 1000 bytes.
const dossier = buildDossier(target, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(target, 'dossier.json'), dossier);
