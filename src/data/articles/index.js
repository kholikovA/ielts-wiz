// Articles curriculum — graded reading texts across the six CEFR levels.
//
// Article shape:
//   {
//     id, level, title, topic, estReadMinutes, status: 'ready' | 'draft',
//     summary,               // one-line teaser for the hub card
//     paragraphs: [string],  // plain text — target words are matched by
//                             // exact surface form against `vocab` keys
//     vocab: {
//       <exact word/phrase as it appears in paragraphs, lowercase>: {
//         ipa, partOfSpeech, definition, example, collocations: [string],
//       },
//     },
//   }
//
// Content is split one file per level so it can be authored/extended
// independently (see the project plan for the phased content rollout).

import a1 from './a1';
import a2 from './a2';
import b1 from './b1';
import b2 from './b2';
import c1 from './c1';
import c2 from './c2';

export const CEFR_LEVELS = [
  { id: 'A1', name: 'Beginner',            tagline: 'Everyday topics, short simple sentences.',       tint: { soft: 'rgba(16, 185, 129, 0.12)',  hard: 'var(--green-500)' } },
  { id: 'A2', name: 'Elementary',          tagline: 'Familiar situations, simple connected text.',     tint: { soft: 'rgba(59, 130, 246, 0.12)',  hard: 'var(--blue-500)' } },
  { id: 'B1', name: 'Intermediate',        tagline: 'Everyday and work topics, clear opinions.',       tint: { soft: 'rgba(168, 85, 247, 0.12)',  hard: 'var(--purple-500)' } },
  { id: 'B2', name: 'Upper-intermediate',  tagline: 'Abstract topics, more complex argument.',         tint: { soft: 'rgba(245, 158, 11, 0.12)',  hard: 'var(--amber-500)' } },
  { id: 'C1', name: 'Advanced',            tagline: 'Academic and professional topics, nuanced text.', tint: { soft: 'rgba(236, 72, 153, 0.12)',  hard: 'var(--violet-500)' } },
  { id: 'C2', name: 'Mastery',             tagline: 'Sophisticated, idiomatic, near-native text.',     tint: { soft: 'rgba(239, 68, 68, 0.12)',   hard: 'var(--error)' } },
];

export const ARTICLES = [...a1, ...a2, ...b1, ...b2, ...c1, ...c2].filter(a => a.status === 'ready');

export const ARTICLE_INDEX = ARTICLES.reduce((index, article) => {
  index[article.id] = article;
  return index;
}, {});
