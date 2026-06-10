// Turn a listening spec's transcript into an exam-style MP3 using Azure Neural TTS
// + SSML. Adds the things that make audio sound like a real IELTS recording: a
// formal narrator, accent-varied character voices (en-GB/AU/US/NZ), measured
// pacing, and SSML-timed reading pauses between sections. Content-agnostic — runs
// on any spec's `parts[].passage_paragraphs` (your own authored transcripts).
//
//   AZURE_SPEECH_KEY=... node tools/content-pipeline/synthesize-azure.mjs \
//     src/data/tests/listening/iw_listening_2.json --region uksouth \
//     --out public/listening/test2.mp3
//
// Dry run (no key/--out): prints the voice/accent plan, char count, est. cost+length.

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

const NARRATOR = 'en-GB-RyanNeural';            // formal exam narrator
const POOL = [                                   // characters: varied accent + gender
  'en-GB-SoniaNeural', 'en-AU-WilliamNeural', 'en-US-JennyNeural', 'en-NZ-MollyNeural',
  'en-GB-ThomasNeural', 'en-AU-NatashaNeural', 'en-US-GuyNeural', 'en-GB-LibbyNeural',
];
const accentOf = (v) => ({ GB: 'British', AU: 'Australian', US: 'American', NZ: 'NZ' }[v.split('-')[1]] || v);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Split a paragraph into { speaker, text } turns on "Name:" / "Name Name:" labels.
function turns(paragraph) {
  const re = /(^|\s)([A-Z][A-Za-z'’]+(?: [A-Z][A-Za-z'’]+){0,2}):\s+/g;
  const marks = [];
  let m;
  while ((m = re.exec(paragraph))) marks.push({ speaker: m[2], at: m.index + m[0].length, labelAt: m.index + m[1].length });
  if (!marks.length) return [{ speaker: 'Narrator', text: paragraph.trim() }];
  const out = [];
  if (marks[0].labelAt > 0) { const lead = paragraph.slice(0, marks[0].labelAt).trim(); if (lead) out.push({ speaker: 'Narrator', text: lead }); }
  marks.forEach((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].labelAt : paragraph.length;
    const text = paragraph.slice(mk.at, end).trim();
    if (text) out.push({ speaker: mk.speaker, text });
  });
  return out;
}

// Azure caps a single <break> at 5s; chain to reach longer reading pauses.
const breaks = (sec) => '<break time="5000ms"/>'.repeat(Math.floor(sec / 5)) + (sec % 5 ? `<break time="${(sec % 5) * 1000}ms"/>` : '');

async function speak({ key, region, format, ssml }) {
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': format,
      'User-Agent': 'ielts-wiz-synth',
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Azure ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

const ssmlFor = (voice, inner) =>
  `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-GB">` +
  `<voice name="${voice}"><prosody rate="-4%">${inner}</prosody></voice></speak>`;

const args = parseArgs(process.argv.slice(2));
const specPath = args._[0];
if (!specPath) { console.error('usage: synthesize-azure.mjs <spec.json> --region <r> --out <file.mp3>'); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const key = args.key || process.env.AZURE_SPEECH_KEY;
const region = args.region || process.env.AZURE_SPEECH_REGION;
const out = args.out;
const format = args.format || 'audio-24khz-48kbitrate-mono-mp3';
const readPause = Number(args['read-pause'] || 10);

// Ordered items: narrator scaffolding + timed pauses + transcript turns.
const items = [];
items.push({ speaker: 'Narrator', text: 'Welcome to the IELTS Wiz Listening practice test. You will hear four separate recordings and answer questions on each. Each recording is played once only. Write your answers as you listen.' });
(spec.parts || []).forEach((part, i) => {
  const sub = (part.section_subtitle || '').trim().replace(/\.$/, '');
  const lead = sub ? `Section ${part.part_number}. In this section, you will hear ${sub.charAt(0).toLowerCase() + sub.slice(1)}. First, you have some time to look at the questions.`
                   : `Section ${part.part_number}. First, you have some time to look at the questions.`;
  items.push({ speaker: 'Narrator', text: lead });
  items.push({ pause: readPause });
  (part.passage_paragraphs || []).forEach((p) => turns(p).forEach((t) => items.push(t)));
  items.push({ speaker: 'Narrator', text: `That is the end of Section ${part.part_number}.` });
  if (i < spec.parts.length - 1) items.push({ pause: 4 });
});

// Assign a consistent voice per speaker; narrator fixed.
const voiceOf = { Narrator: NARRATOR };
let next = 0;
for (const it of items) if (it.speaker && !(it.speaker in voiceOf)) { voiceOf[it.speaker] = POOL[next % POOL.length]; next++; }

const chars = items.reduce((n, it) => n + (it.text ? it.text.length : 0), 0);
console.log(`\n"${spec.title}" — ${items.length} segments, ${chars} characters`);
console.log('  cast: ' + Object.entries(voiceOf).map(([s, v]) => `${s}=${v.split('-').slice(1).join('-')} (${accentOf(v)})`).join(', '));
console.log(`  est. cost ≈ $${(chars / 1_000_000 * 15).toFixed(2)}  ·  ~${Math.round(chars / 14 / 60)} min speech + pauses`);

if (!out) { console.log('\nDry run. Add --region, AZURE_SPEECH_KEY and --out to synthesize.\n'); process.exit(0); }
if (!key || !region) { console.error('\n✗ Need AZURE_SPEECH_KEY and --region (e.g. uksouth).\n'); process.exit(1); }

const chunks = [];
for (let i = 0; i < items.length; i++) {
  process.stdout.write(`\r  synthesizing ${i + 1}/${items.length}…   `);
  const it = items[i];
  const voice = it.pause ? NARRATOR : voiceOf[it.speaker];
  const inner = it.pause ? breaks(it.pause) : `${esc(it.text)}<break time="700ms"/>`;
  chunks.push(await speak({ key, region, format, ssml: ssmlFor(voice, inner) }));
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat(chunks));
console.log(`\n✓ Wrote ${out} (${(Buffer.concat(chunks).length / 1024 / 1024).toFixed(1)} MB). Host it and set the test's audio_url.\n`);
