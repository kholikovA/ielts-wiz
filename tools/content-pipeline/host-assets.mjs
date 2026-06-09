// Host a listening test's assets (audio + labelling images) on your own GitHub
// Pages repo, then rewrite the spec's URLs to the public, hosted ones. This is the
// step that turns an extractor's source URLs into durable, self-hosted URLs.
//
//   GITHUB_TOKEN=ghp_xxx node tools/content-pipeline/host-assets.mjs <spec.json> \
//     --repo kholikovA/ielts-assets --branch main --dir listening/test2 \
//     --base-url https://kholikovA.github.io/ielts-assets/listening/test2 --write
//
// Dry-run (no token / no --write) just lists what WOULD be hosted.

import fs from 'node:fs';

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) { const k = t.slice(2); a[k] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true; }
    else a._.push(t);
  }
  return a;
}

const EXT_BY_TYPE = { 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'image/svg+xml': 'svg', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const isRemote = (u) => typeof u === 'string' && /^https?:\/\//.test(u);

// Every place a spec references an external asset, exposed as get/set accessors so
// we can rewrite the URL in place after hosting.
function assetSlots(spec) {
  const slots = [];
  if (isRemote(spec.audio_url)) slots.push({ kind: 'audio', get: () => spec.audio_url, set: (v) => { spec.audio_url = v; } });
  (spec.parts || []).forEach((part) => (part.question_groups || []).forEach((g) => {
    if (/labelling/.test(g.type || '') && isRemote(g.image_url)) {
      const q0 = g.questions && g.questions[0] && g.questions[0].number;
      slots.push({ kind: `img-q${q0 || 'x'}`, get: () => g.image_url, set: (v) => { g.image_url = v; } });
    }
  }));
  return slots;
}

async function download(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${url} → ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const ct = (r.headers.get('content-type') || '').split(';')[0].trim();
  let ext = (url.split('?')[0].match(/\.([a-z0-9]{2,5})$/i) || [])[1];
  if (!ext) ext = EXT_BY_TYPE[ct] || 'bin';
  return { buf, ext: ext.toLowerCase() };
}

async function ghPut({ token, repo, branch, repoPath, buf, message }) {
  const base = `https://api.github.com/repos/${repo}/contents/${repoPath}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  let sha;
  const head = await fetch(`${base}?ref=${branch}`, { headers });
  if (head.ok) sha = (await head.json()).sha; // file exists → update
  const res = await fetch(base, {
    method: 'PUT', headers,
    body: JSON.stringify({ message, branch, content: buf.toString('base64'), ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`upload ${repoPath} → ${res.status} ${await res.text()}`);
}

const args = parseArgs(process.argv.slice(2));
const specPath = args._[0];
if (!specPath) { console.error('usage: node host-assets.mjs <spec.json> --repo owner/name --dir DIR --base-url URL [--branch main] [--write]'); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const token = args.token || process.env.GITHUB_TOKEN;
const { repo, dir = '', branch = 'main', 'base-url': baseUrl } = args;

const slots = assetSlots(spec);
if (!slots.length) { console.log('No remote assets to host (audio_url + labelling image_urls are already local or absent).'); process.exit(0); }

const idBase = (spec.title || 'test').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
console.log(`\n${slots.length} asset(s) to host for "${spec.title}":`);
let counter = 0;
for (const slot of slots) {
  const srcUrl = slot.get();
  const idx = counter++;
  console.log(`  • ${slot.kind}: ${srcUrl}`);
  if (!args.write) continue;
  if (!token) { console.error('  ✗ no GITHUB_TOKEN — cannot upload. Set the token to write.'); process.exit(1); }
  if (!repo || !baseUrl) { console.error('  ✗ --repo and --base-url are required with --write.'); process.exit(1); }
  const { buf, ext } = await download(srcUrl);
  const filename = `${idBase}-${slot.kind}-${idx}.${ext}`;
  const repoPath = dir ? `${dir.replace(/\/$/, '')}/${filename}` : filename;
  await ghPut({ token, repo, branch, repoPath, buf, message: `Add ${filename}` });
  const publicUrl = `${baseUrl.replace(/\/$/, '')}/${filename}`;
  slot.set(publicUrl);
  console.log(`    → ${publicUrl}`);
}

if (args.write) {
  fs.writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`\n✓ Hosted ${slots.length} asset(s) and rewrote ${specPath}.\n`);
} else {
  console.log('\nDry run. Re-run with a GITHUB_TOKEN, --repo, --dir, --base-url and --write to host + rewrite.\n');
}
