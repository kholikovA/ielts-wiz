// Turn a listening spec's transcript into an audio file via a TTS API. Splits each
// section's transcript into speaker turns, gives each speaker a distinct voice, and
// concatenates the clips into one MP3. Works on any spec's `parts[].passage_paragraphs`
// — i.e. your own authored transcripts.
//
//   OPENAI_API_KEY=sk-... node tools/content-pipeline/synthesize-audio.mjs \
//     src/data/tests/listening/iw_listening_2.json --out public/listening/test2.mp3
//
// Without a key (or --out) it's a dry run: prints the voice plan + a rough cost.
// Naive MP3 concatenation plays fine in browsers; for a pristine master, synth
// per-turn (--segments dir) and merge with ffmpeg.

import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) { const k = t.slice(2); a[k] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true; }
    else a._.push(t);
  }
  return a;
}

// OpenAI TTS voices — first is the narrator; the rest cycle across speakers.
const VOICES = ['onyx', 'nova', 'echo', 'shimmer', 'fable', 'alloy'];

// Split a paragraph into { speaker, text } turns on "Name:" / "Name Name:" labels.
function turns(paragraph) {
  const re = /(^|\s)([A-Z][A-Za-z'’]+(?: [A-Z][A-Za-z'’]+){0,2}):\s+/g;
  const marks = [];
  let m;
  while ((m = re.exec(paragraph))) marks.push({ speaker: m[2], at: m.index + m[0].length, labelAt: m.index + m[1].length });
  if (!marks.length) return [{ speaker: 'Narrator', text: paragraph.trim() }];
  const out = [];
  if (marks[0].labelAt > 0) {
    const lead = paragraph.slice(0, marks[0].labelAt).trim();
    if (lead) out.push({ speaker: 'Narrator', text: lead });
  }
  marks.forEach((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].labelAt : paragraph.length;
    const text = paragraph.slice(mk.at, end).trim();
    if (text) out.push({ speaker: mk.speaker, text });
  });
  return out;
}

async function tts({ apiKey, model, voice, text }) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, voice, input: text, response_format: 'mp3' }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

const args = parseArgs(process.argv.slice(2));
const specPath = args._[0];
if (!specPath) { console.error('usage: synthesize-audio.mjs <spec.json> --out audio.mp3 [--model tts-1]'); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const apiKey = args.key || process.env.OPENAI_API_KEY;
const model = args.model || 'tts-1';
const out = args.out;

// Build the ordered list of turns across all sections, with an IELTS-style intro.
const items = [];
(spec.parts || []).forEach((part, i) => {
  items.push({ speaker: 'Narrator', text: `Section ${part.part_number}.` });
  (part.passage_paragraphs || []).forEach((p) => turns(p).forEach((t) => items.push(t)));
  if (i < spec.parts.length - 1) items.push({ speaker: 'Narrator', text: 'That is the end of this section.' });
});

// Assign voices: narrator fixed, others cycle.
const voiceOf = { Narrator: VOICES[0] };
let next = 1;
for (const it of items) if (!(it.speaker in voiceOf)) { voiceOf[it.speaker] = VOICES[next % VOICES.length]; next++; }

const chars = items.reduce((n, it) => n + it.text.length, 0);
console.log(`\n"${spec.title}" — ${items.length} turns, ${chars} characters`);
console.log('  voices: ' + Object.entries(voiceOf).map(([s, v]) => `${s}=${v}`).join(', '));
console.log(`  est. cost ≈ $${(chars / 1_000_000 * 15).toFixed(2)} (tts-1 @ $15/1M chars)`);

if (!out) { console.log('\nDry run. Add --out <file.mp3> and OPENAI_API_KEY to synthesize.\n'); process.exit(0); }
if (!apiKey) { console.error('\n✗ OPENAI_API_KEY not set.\n'); process.exit(1); }

const chunks = [];
for (let i = 0; i < items.length; i++) {
  const it = items[i];
  process.stdout.write(`\r  synthesizing ${i + 1}/${items.length}…   `);
  chunks.push(await tts({ apiKey, model, voice: voiceOf[it.speaker], text: it.text }));
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat(chunks));
console.log(`\n✓ Wrote ${out} (${(Buffer.concat(chunks).length / 1024 / 1024).toFixed(1)} MB). Set audio_url to its hosted URL.\n`);
