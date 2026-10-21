// Builds public/dictation/test_N.json for the 80 Listening Part Practice tests:
// the recording's URL and one cue per transcript line (start time + text),
// for dictation homework. Run: node tools/dictation/build-test-cues.mjs
//
// Cue end times aren't stored here; the teacher's browser measures them from
// the audio when the assignment is created (see src/student/dictation/media.js).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTranscript } from '../listening-part-practice/transcript.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = path.join(root, 'tools/listening-part-practice/transcripts');
const out = path.join(root, 'public/dictation');
const audioUrl = (n) => `https://raw.githubusercontent.com/kholikovA/80-listening-audios/main/TEST%20${n}.mp3`;

// Recorded exam instructions rather than the dialogue/talk itself.
const ANNOUNCER = /^(test \d+\b|section \d|part \d|you will hear|you'll hear|first,? you have|now (listen|look|turn|you have|we shall)|you now have|you (will )?have (some|half a minute|\d+ seconds|one minute)|look at questions|before you hear|that is the end|this is the end|listen carefully|in this (test|part|section)|questions? \d+ (to|and) \d+\.?$)/i;

fs.mkdirSync(out, { recursive: true });
let n = 0;
for (const file of fs.readdirSync(src).filter((f) => /^test_\d+\.txt$/.test(f))) {
  const id = Number(file.match(/\d+/)[0]);
  const text = fs.readFileSync(path.join(src, file), 'utf8');
  const { paras } = parseTranscript(text, file);
  const cues = [];
  paras.forEach((p, pi) => p.forEach((c) => {
    const line = c.parts.map((x) => (typeof x === 'string' ? x : x.x)).join('').replace(/\s+/g, ' ').trim();
    if (!line) return;
    const cue = { s: c.t, text: line, p: pi };
    if (ANNOUNCER.test(line)) cue.a = 1;
    cues.push(cue);
  }));
  fs.writeFileSync(path.join(out, `test_${id}.json`), JSON.stringify({ id, audio: audioUrl(id), cues }));
  n += 1;
}
console.log(`wrote ${n} files to public/dictation/`);
