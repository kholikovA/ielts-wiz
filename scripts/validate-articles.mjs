#!/usr/bin/env node
/**
 * Validate an Articles data file (src/data/articles/<level>.js) against the
 * schema in src/data/articles/index.js and the one rule that's easy to get
 * wrong when authoring by hand: a vocab dict key must literally appear in
 * the article's paragraph text, matched the exact same way the reader
 * component matches it (case-insensitive, \b word-boundary), or the word
 * silently never highlights.
 *
 * Usage:  node scripts/validate-articles.mjs src/data/articles/a2.js
 * Exit non-zero if any ERROR is found (warnings don't fail the build).
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/validate-articles.mjs <path-to-level-file.js>');
  process.exit(1);
}

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const WORD_COUNT_GUIDANCE = {
  A1: [100, 220], A2: [150, 300], B1: [220, 400],
  B2: [320, 500], C1: [420, 650], C2: [550, 850],
};

async function main() {
  const mod = await import(pathToFileURL(resolve(target)).href);
  const articles = mod.default;
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(m);
  const W = (m) => warnings.push(m);

  if (!Array.isArray(articles)) {
    console.error('ERROR: default export is not an array');
    process.exit(1);
  }

  const seenIds = new Set();

  articles.forEach((article, i) => {
    const tag = `[${i}] ${article?.id || '(no id)'}`;

    ['id', 'level', 'title', 'topic', 'summary'].forEach((f) => {
      if (!article[f] || typeof article[f] !== 'string') E(`${tag}: missing/invalid "${f}"`);
    });
    if (typeof article.estReadMinutes !== 'number' || article.estReadMinutes <= 0) {
      E(`${tag}: "estReadMinutes" must be a positive number`);
    }
    if (article.status !== 'ready' && article.status !== 'draft') {
      E(`${tag}: "status" must be "ready" or "draft", got ${JSON.stringify(article.status)}`);
    }
    if (article.id) {
      if (seenIds.has(article.id)) E(`${tag}: duplicate id "${article.id}"`);
      seenIds.add(article.id);
    }
    if (!Array.isArray(article.paragraphs) || article.paragraphs.length === 0) {
      E(`${tag}: "paragraphs" must be a non-empty array of strings`);
      return;
    }
    const fullText = article.paragraphs.join(' ');
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    const bounds = WORD_COUNT_GUIDANCE[article.level];
    if (bounds && (wordCount < bounds[0] * 0.7 || wordCount > bounds[1] * 1.3)) {
      W(`${tag}: ${wordCount} words is well outside the ${article.level} guidance range (${bounds[0]}-${bounds[1]})`);
    }

    const vocab = article.vocab || {};
    const vocabKeys = Object.keys(vocab);
    if (vocabKeys.length < 4) W(`${tag}: only ${vocabKeys.length} vocab entries (aim for 6-10)`);

    vocabKeys.forEach((key) => {
      const entry = vocab[key];
      const vtag = `${tag} vocab["${key}"]`;
      if (!entry.ipa || !/^\/.*\/$/.test(entry.ipa)) E(`${vtag}: missing/invalid "ipa" (expected /.../ format)`);
      if (!entry.partOfSpeech) E(`${vtag}: missing "partOfSpeech"`);
      if (!entry.definition) E(`${vtag}: missing "definition"`);
      if (!entry.example) E(`${vtag}: missing "example"`);
      if (!Array.isArray(entry.collocations) || entry.collocations.length < 2) {
        E(`${vtag}: "collocations" must be an array of at least 2 entries`);
      }
      // The exact rule ArticleReader.js uses to highlight words — if this
      // doesn't match, the word silently never becomes clickable.
      const regex = new RegExp(`\\b${escapeRegex(key)}\\b`, 'i');
      if (!regex.test(fullText)) {
        E(`${vtag}: key does not appear as a whole word anywhere in "paragraphs" — it will never highlight`);
      }
      // Example sentences should also demonstrate the word, but in any form —
      // this is a soft check since inflection varies.
      const looseRegex = new RegExp(escapeRegex(key.replace(/s$|ed$|ing$/, '')), 'i');
      if (entry.example && !looseRegex.test(entry.example)) {
        W(`${vtag}: example sentence doesn't obviously contain the word`);
      }
    });
  });

  console.log(`${target}: ${articles.length} article(s), ${errors.length} error(s), ${warnings.length} warning(s)`);
  warnings.forEach((w) => console.log(`  WARN  ${w}`));
  errors.forEach((e) => console.log(`  ERROR ${e}`));
  if (errors.length) process.exit(1);
}

main().catch((e) => { console.error('FAILED TO LOAD:', e); process.exit(1); });
