#!/usr/bin/env node
/**
 * THE RECORDING PACK.
 *
 * "The audio has not been recorded" has been the College's largest
 * outstanding item for weeks, described as needing "a studio" — which
 * is jargon, and unhelpful jargon, because it makes a week of work
 * sound like a facility purchase.
 *
 * It is not a facility purchase. Every script is written. Every clip
 * has a declared language variety, a speaker count and a target speaking
 * rate, because the curriculum authors specified them. What is missing
 * is a person reading them aloud into a microphone.
 *
 * So this generates the thing that turns that sentence into a job: a
 * pack a voice artist can be handed, with every clip, its script, how
 * fast to read it, how many voices it needs, and the exact filename the
 * platform expects back. Generated from the database rather than typed,
 * so it cannot drift from what the platform will actually look for.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');

const SEEDS = [];
for (let n = 1; n <= 6; n++) SEEDS.push(`seed-curriculum-level-${n}.sql`);
for (let n = 1; n <= 6; n++) SEEDS.push(`seed-audio-level-${n}.sql`);

function read() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (const f of SEEDS) db.exec(fs.readFileSync(`${ROOT}/sql/${f}`, 'utf8'));
  const all = (s) => db.prepare(s).all();
  const out = {
    assets: all('SELECT * FROM audio_assets ORDER BY id'),
    cues: all('SELECT * FROM audio_cues ORDER BY audio_asset_id, start_ms'),
    targets: all('SELECT * FROM pronunciation_targets ORDER BY id'),
  };
  db.close();
  return out;
}
const D = read();
if (!D.assets.length) throw new Error('No audio assets — the pack would be empty.');

const recorded = D.assets.filter((a) => a.media_url);
if (recorded.length) {
  console.log(`NOTE  ${recorded.length} of ${D.assets.length} clips already carry a media_url. `
    + 'They are marked DONE in the pack rather than re-requested.');
}

// Level from the id convention: aud_l3_m7_listen -> 3
const levelOf = (id) => {
  const m = /^aud_l(\d)_/.exec(id);
  if (!m) throw new Error(`Cannot read a level from asset id "${id}" — fix the id or this rule, not the pack.`);
  return Number(m[1]);
};
const KIND = {
  listening: 'Listening passage',
  model_pronunciation: 'Pronunciation model',
  dictation: 'Dictation',
  dialogue: 'Dialogue',
};
const kindLabel = (k) => KIND[k] || k;

const VARIETY = { BrE: 'British English', AmE: 'American English', Intl: 'International / mixed' };
const varietyLabel = (v) => VARIETY[v] || v;

const byLevel = new Map();
for (const a of D.assets) {
  const l = levelOf(a.id);
  if (!byLevel.has(l)) byLevel.set(l, []);
  byLevel.get(l).push(a);
}

const totalWords = D.assets.reduce((n, a) =>
  n + ((a.transcript || '').match(/\S+/g) || []).length, 0);
// A working estimate for planning only: reading time at the declared
// rate, times three for retakes, direction and gaps between clips.
const readMinutes = D.assets.reduce((n, a) => {
  const words = ((a.transcript || '').match(/\S+/g) || []).length;
  return n + words / (a.target_wpm || 120);
}, 0);
const sessionHours = Math.ceil((readMinutes * 3) / 60);

const multiVoice = D.assets.filter((a) => (a.speaker_count || 1) > 1);
const varieties = [...new Set(D.assets.map((a) => a.variety))];

const lines = [];
const w = (s = '') => lines.push(s);

w('# IEFC Recording Pack');
w();
w('**For the person recording the audio. Everything here is generated from');
w('the curriculum database, so it matches exactly what the platform will');
w('look for.**');
w();
w('---');
w();
w('## What this job actually is');
w();
w('Read scripts aloud into a microphone, in a quiet room. That is the whole');
w('job. There is no filming, no music, no sound design, and no studio');
w('booking required.');
w();
w('| | |');
w('|---|---|');
w(`| Clips to record | **${D.assets.length}** |`);
w(`| Total words | ~${totalWords.toLocaleString('en-GB')} |`);
w(`| Reading time at the specified rates | ~${Math.round(readMinutes)} minutes |`);
w(`| Realistic session time, including retakes and direction | **~${sessionHours} hours** |`);
w(`| Clips needing two or more voices | ${multiVoice.length} |`);
w(`| Language varieties required | ${varieties.map(varietyLabel).join(', ')} |`);
w();
w('Two people, two sittings. That is the honest size of the thing that has');
w('been described as "needing a studio" — and the description was mine, and');
w('it was wrong enough to make the job look bigger than it is.');
w();
w('## What you need');
w();
w('- **A quiet room.** Soft furnishings, no air conditioning running, no');
w('  traffic. A bedroom with curtains and a wardrobe beats an office.');
w('- **A decent microphone.** A USB condenser microphone is sufficient. A');
w('  phone held close is better than an expensive microphone across a');
w('  reverberant room, because the enemy here is echo, not fidelity.');
w('- **A pop filter**, or a sock over the microphone. Plosives on `p` and');
w('  `b` ruin an otherwise good take, and learners are listening to');
w('  exactly those sounds.');
w('- **Free recording software.** Audacity or Ocenaudio will do all of it.');
w();
w('## What the recordings must be');
w();
w('These are teaching materials, not a podcast. The requirements are');
w('unusual and each has a reason:');
w();
w('- **Clean, not produced.** No music, no reverb, no compression that');
w('  smooths consonants. A learner at A1 is straining to hear the');
w('  difference between two similar sounds; anything smeared over them');
w('  defeats the lesson.');
w('- **At the stated speed, not slower.** Each clip carries a target');
w('  words-per-minute figure. Do not slow down to be kind — the whole');
w('  point of the listening strand is coping with real pace. If a clip');
w('  says 90 wpm, 90 wpm is the lesson.');
w('- **Natural, not over-enunciated.** Say "wanna" if that is what a');
w('  speaker says. Several lessons specifically teach connected speech,');
w('  and a careful reading destroys the feature being taught.');
w('- **One take per clip, one file per clip.** Do not concatenate.');
w('- **WAV, 48 kHz, 16-bit or better, mono** unless the clip specifies');
w('  more than one speaker, in which case still mono — the voices should');
w('  be distinguishable by voice, not by ear position.');
w('- **Half a second of silence** at the start and end of every file. Not');
w('  more; the platform handles the pause.');
w();
w('## Filenames');
w();
w('One file per clip, named exactly with the clip ID given in the tables');
w('below, `.wav` appended. So `aud_l1_m1_listen` becomes:');
w();
w('    aud_l1_m1_listen.wav');
w();
w('Nothing else — no spaces, no level prefix, no version number. The');
w('platform matches on the ID.');
w();
w('## About the `|` marks in the scripts');
w();
w('A vertical bar separates **speaker turns**, not sentences. In a');
w('two-voice clip the turns alternate: first turn voice A, second voice B,');
w('and so on. In a one-voice clip the bar marks a distinct item that needs');
w('a clear gap after it — leave about a second.');
w();
w('---');
w();

for (const level of [...byLevel.keys()].sort((a, b) => a - b)) {
  const assets = byLevel.get(level);
  const words = assets.reduce((n, a) => n + ((a.transcript || '').match(/\S+/g) || []).length, 0);
  w(`## Level ${level} — ${assets.length} clips, ~${words.toLocaleString('en-GB')} words`);
  w();
  for (const a of assets) {
    const cues = D.cues.filter((c) => c.audio_asset_id === a.id);
    w(`### \`${a.id}\`${a.media_url ? '  — **DONE, do not re-record**' : ''}`);
    w();
    w(`**${a.title}**`);
    w();
    w(`- Type: ${kindLabel(a.kind)}`);
    w(`- Voices: ${a.speaker_count || 1}`);
    w(`- Accent: ${varietyLabel(a.variety)}`);
    w(`- Speed: **${a.target_wpm} words per minute**`);
    if (cues.length) {
      w(`- ${cues.length} teaching point${cues.length === 1 ? '' : 's'} marked in this clip — `
        + 'say them naturally; do not stress them for emphasis, or the exercise gives itself away.');
    }
    w();
    w('> ' + String(a.transcript || '').split(' | ').join('\n>\n> '));
    w();
  }
  w('---');
  w();
}

w('## When you are finished');
w();
w('Send the folder of `.wav` files. Nothing needs renaming, converting or');
w('organising into subfolders — the IDs carry the structure.');
w();
w('If a script reads badly aloud, say so rather than smoothing it over. A');
w('line that a real speaker would never say is a defect in the curriculum,');
w('and the College would rather fix it than record it.');
w();
w('---');
w();
w('*Generated by `scripts/build-recording-pack.js` from the curriculum');
w('database. Regenerate rather than editing this file by hand.*');

const outPath = path.join(ROOT, 'docs/recording-pack.md');
fs.writeFileSync(outPath, lines.join('\n') + '\n');
console.log(`Wrote docs/recording-pack.md — ${D.assets.length} clips across ${byLevel.size} levels, `
  + `~${totalWords.toLocaleString('en-GB')} words, ~${sessionHours}h estimated session time.`);
