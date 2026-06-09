// Ingest a finished spec into the app: validate → mint an opaque slug → place the
// JSON in the right data folder → register it in manifest.js. Works for reading
// and listening. Dry-run by default; pass --write to actually touch files.
//
//   node tools/content-pipeline/ingest.mjs <spec.json> --skill listening \
//        --id iw_listening_2 --source iw_practice --n 2 [--write]
//
// Evidence/vocabulary enrichment (reading) is a separate AI step, not done here.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateSpec } from './schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; args[k] = v; }
    else args._.push(a);
  }
  return args;
}

const slugChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
function mintSlug(n = 16) {
  const bytes = crypto.randomBytes(n);
  let s = '';
  for (let i = 0; i < n; i++) s += slugChars[bytes[i] % slugChars.length];
  return s;
}

const args = parseArgs(process.argv.slice(2));
const specPath = args._[0];
if (!specPath) { console.error('usage: node ingest.mjs <spec.json> --skill reading|listening [--id ID] [--source SRC] [--n N] [--write]'); process.exit(2); }

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const skill = args.skill || (spec.skill === 'listening' || specPath.includes('listening') ? 'listening' : 'reading');
const source = args.source || (skill === 'listening' ? 'iw_practice' : 'imported');
const n = Number(args.n || 1);
const id = args.id || `${source}_${n}`;
const kind = skill === 'listening' ? 'listening_full' : 'reading_full';

// 1. Validate
const { errors, warnings, stats } = validateSpec(spec, skill);
console.log(`\n${skill} spec "${spec.title}" — ${stats.questions} questions, ${stats.answers} answers, ${stats.parts} parts`);
warnings.forEach((w) => console.log(`  ⚠ ${w}`));
errors.forEach((e) => console.log(`  ✗ ${e}`));
if (errors.length && !args.force) { console.log(`\nINVALID — fix ${errors.length} error(s) or pass --force.\n`); process.exit(1); }

// 2. Slug + target path
const slug = (typeof args.slug === 'string' && args.slug) || mintSlug();
const relDir = skill === 'listening' ? 'src/data/tests/listening' : `src/data/tests/reading/${source}`;
const fileBase = skill === 'listening' ? id : `test${n}`;
const relSpec = `${relDir}/${fileBase}.json`;
const importVar = (skill === 'listening' ? 'lsn_' : 'rdg_') + id.replace(/[^a-z0-9]+/gi, '');
const importPath = `./${relSpec.replace('src/data/tests/', '')}`;
const arrayName = skill === 'listening' ? 'LISTENING_TESTS' : 'READING_TESTS';
const entry = `  { source: '${source}', n: ${n}, kind: '${kind}', id: '${id}', slug: '${slug}', spec: ${importVar} },`;
const importLine = `import ${importVar} from '${importPath}';`;

console.log('\n— plan —');
console.log(`  file    → ${relSpec}`);
console.log(`  slug    → ${slug}   (URL: /${skill}-test/${slug})`);
console.log(`  import  → ${importLine}`);
console.log(`  entry   → ${entry.trim()}`);

if (!args.write) {
  console.log('\nDry run. Re-run with --write to place the file + edit manifest.js.\n');
  process.exit(errors.length ? 1 : 0);
}

// 3. Place spec file
const absSpec = path.join(ROOT, relSpec);
fs.mkdirSync(path.dirname(absSpec), { recursive: true });
fs.writeFileSync(absSpec, `${JSON.stringify(spec, null, 2)}\n`);

// 4. Edit manifest.js: insert import (before first `export`) + array entry (before its `];`)
const manifestPath = path.join(ROOT, 'src/data/tests/manifest.js');
let m = fs.readFileSync(manifestPath, 'utf8');
if (m.includes(importLine)) { console.log('  (import already present)'); }
else { m = m.replace(/\nexport const /, `\n${importLine}\nexport const `); }
const arrRe = new RegExp(`(export const ${arrayName} = \\[[\\s\\S]*?)\\n\\];`);
if (!arrRe.test(m)) { console.error(`Could not find ${arrayName} array in manifest.js — add the entry manually:\n${entry}`); process.exit(1); }
m = m.replace(arrRe, (full, head) => `${head}\n${entry}\n];`);
fs.writeFileSync(manifestPath, m);

console.log(`\n✓ Ingested. ${skill}-test live at /${skill}-test/${slug} once built.`);
if (skill === 'reading') console.log('  Next (optional): run the evidence/vocabulary enrichment, then open a PR.');
console.log('');
