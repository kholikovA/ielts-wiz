import React from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';

// IELTS Academic Reading — comprehensive guide page.
// Content sourced from ielts.org and ielts.idp.com (linked at footer).

const STATS = [
  { label: 'Time',         value: '60 min',      hint: 'No extra transfer time' },
  { label: 'Passages',     value: '3',           hint: 'Increasing difficulty' },
  { label: 'Questions',    value: '40',          hint: '~13–14 per passage' },
  { label: 'Question types', value: '14',        hint: 'Mixed within each passage' },
];

const PASSAGES = [
  { id: 1, label: 'Passage 1', desc: 'Factual texts on accessible topics. Warm-up.', wordTarget: '~700 words', recommendMin: '17 min', accent: 'var(--violet-500)' },
  { id: 2, label: 'Passage 2', desc: 'Slightly more abstract. Difficulty ramps.',     wordTarget: '~800 words', recommendMin: '20 min', accent: 'var(--blue-500)' },
  { id: 3, label: 'Passage 3', desc: 'Long, argumentative — global structure + inference.', wordTarget: '~900 words', recommendMin: '23 min', accent: 'var(--green-500)' },
];

const QUESTION_TYPES = [
  {
    name: 'Matching Headings',
    icon: 'bookOpen',
    desc: 'You\'re given a list of headings and have to match each to a paragraph in the passage.',
    task: 'Identify the main idea of each paragraph and pick its best label.',
    skill: 'Main idea recognition',
    tip: 'Read the heading list before you read the passage. There are more headings than paragraphs.',
  },
  {
    name: 'Matching Information',
    icon: 'layers',
    desc: 'Statements that describe specific information — you locate which paragraph contains each.',
    task: 'Scan the passage for a paraphrase of each statement and mark the paragraph letter.',
    skill: 'Paraphrase recognition',
    tip: 'Answers appear in NON-sequential order. Don\'t assume the first match is in paragraph A.',
  },
  {
    name: 'Matching Features',
    icon: 'target',
    desc: 'Match items in one list (e.g., researchers) to items in another (e.g., findings, dates).',
    task: 'Match facts, ideas, or opinions to the specific people, things, or times they relate to.',
    skill: 'Relationship + detail',
    tip: 'Underline names/dates in the passage as you read — they\'re the anchors.',
  },
  {
    name: 'Matching Sentence Endings',
    icon: 'arrowRight',
    desc: 'Sentence beginnings on the left, list of endings on the right. Pick the right ending.',
    task: 'Connect sentence stems with endings that complete them factually AND grammatically.',
    skill: 'Grammar + meaning',
    tip: 'Cross out endings that don\'t fit grammatically — that alone eliminates several distractors.',
  },
  {
    name: 'True / False / Not Given',
    icon: 'checkCircle',
    desc: 'Statements about the passage. Decide if each is true, false, or not stated.',
    task: 'Compare each statement to what the passage says. "Not Given" means the passage neither confirms nor denies.',
    skill: 'Factual verification',
    tip: 'If you can\'t find direct evidence either way, it\'s NOT GIVEN — don\'t infer.',
  },
  {
    name: 'Yes / No / Not Given',
    icon: 'checkCircle',
    desc: 'Same format as T/F/NG but about the writer\'s OPINIONS or claims rather than facts.',
    task: 'Decide whether each statement agrees with the writer\'s view.',
    skill: 'Inference + tone',
    tip: 'The text needs to clearly support or reject the view. Ambiguity = NOT GIVEN.',
  },
  {
    name: 'Multiple Choice',
    icon: 'layout',
    desc: 'Standard question with four options (A–D) — pick the best one.',
    task: 'Read the question, locate the relevant part of the passage, and choose the answer it supports.',
    skill: 'Detail + main idea',
    tip: 'Eliminate the two obviously wrong options first — usually leaves a clear winner.',
  },
  {
    name: 'List of Options',
    icon: 'check',
    desc: 'Select N correct answers from a longer list (e.g., "Which THREE materials are mentioned?").',
    task: 'Scan the passage and tick every option that\'s explicitly mentioned.',
    skill: 'Detail location',
    tip: 'Read the count requirement carefully — picking the wrong number always scores zero.',
  },
  {
    name: 'Sentence Completion',
    icon: 'pen',
    desc: 'Incomplete sentences with a blank. Fill it with words from the passage.',
    task: 'Use ONLY words from the passage (no synonyms of your own). Word limits are strict.',
    skill: 'Scanning + paraphrase',
    tip: 'Check the word limit ("NO MORE THAN TWO WORDS"). Going over = wrong even if correct.',
  },
  {
    name: 'Summary Completion',
    icon: 'quote',
    desc: 'A short paraphrase of part of the passage with gaps. Sometimes a word bank is given.',
    task: 'Fill gaps with words from the passage or the supplied word list, preserving grammar.',
    skill: 'Paraphrase + grammar',
    tip: 'Predict the part of speech of each gap (noun, adjective, verb) before scanning.',
  },
  {
    name: 'Note Completion',
    icon: 'pen',
    desc: 'A set of notes that paraphrase part of the passage. Fill in the missing words.',
    task: 'Locate the paraphrased section in the passage and copy the missing words.',
    skill: 'Scanning + paraphrase',
    tip: 'Notes follow passage order — once you find one answer, the next is downstream.',
  },
  {
    name: 'Table Completion',
    icon: 'layout',
    desc: 'A table summarising data from the passage with blank cells to fill.',
    task: 'Use the column/row headings as your search anchors.',
    skill: 'Detail location',
    tip: 'Read across BOTH the row and column to understand exactly what the gap is asking for.',
  },
  {
    name: 'Flow Chart Completion',
    icon: 'trending',
    desc: 'A diagram of a process or sequence with blank steps to complete.',
    task: 'Find the part of the passage that describes the process, then fill gaps in order.',
    skill: 'Sequence + paraphrase',
    tip: 'The chart is in sequence; the passage may not be. Re-order in your head as you read.',
  },
  {
    name: 'Diagram Label Completion',
    icon: 'compass',
    desc: 'An image (e.g., a machine, a plant cross-section) with blank labels to complete.',
    task: 'Match the descriptive language in the passage to the visual parts of the diagram.',
    skill: 'Spatial + paraphrase',
    tip: 'Diagrams often appear in technical passages — scan for technical nouns first.',
  },
];

const TIPS = [
  { icon: 'clock',  title: 'Time per passage scales', text: 'Recommend 17 / 20 / 23 minutes for passages 1 / 2 / 3. Don\'t spend equal time on each.' },
  { icon: 'target', title: 'Skim then scan', text: 'Read each passage once for the gist (1–2 min), then go back to the questions and scan for keywords.' },
  { icon: 'zap',    title: 'Don\'t over-read', text: 'You don\'t need to understand every word. Most questions test paraphrase recognition, not deep comprehension.' },
  { icon: 'check',  title: 'Answer every question', text: 'There\'s no penalty for wrong answers. Guess on anything you skip.' },
];

const StatCard = ({ label, value, hint }) => (
  <div style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--bg-secondary)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-color)' }}>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>{label}</div>
    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '4px' }}>{value}</div>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>{hint}</div>
  </div>
);

const PassagePanel = ({ p }) => (
  <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
    <div style={{
      width: '44px', height: '44px', borderRadius: 'var(--r-md)',
      background: `linear-gradient(135deg, ${p.accent}, var(--purple-700))`,
      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-md)',
    }}>{p.id}</div>
    <div>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{p.label}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p.desc}</div>
    </div>
    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      <span>{p.wordTarget}</span>
      <span>·</span>
      <span>Aim {p.recommendMin}</span>
    </div>
  </div>
);

const QuestionTypeCard = ({ t }) => (
  <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: 'var(--r-md)',
        background: 'var(--badge-bg)', color: 'var(--purple-300)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={t.icon} size={18} />
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-lg)', color: 'var(--text-primary)', margin: 0 }}>
        {t.name}
      </h3>
    </div>
    <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>{t.desc}</p>
    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
      <strong style={{ color: 'var(--text-primary)' }}>What you do.</strong> {t.task}
    </p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
      <span className="pill" style={{ fontSize: 'var(--text-xs)' }}>{t.skill}</span>
    </div>
    <div style={{
      marginTop: 'var(--space-2)', padding: 'var(--space-3)',
      background: 'var(--answer-bg)', borderRadius: 'var(--r-md)',
      borderLeft: '3px solid var(--purple-500)',
      fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
    }}>
      <strong style={{ color: 'var(--purple-300)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>Tip</strong>
      <div style={{ marginTop: '4px' }}>{t.tip}</div>
    </div>
  </div>
);

const TipRow = ({ t }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
    <div style={{
      flexShrink: 0,
      width: '32px', height: '32px', borderRadius: 'var(--r-md)',
      background: 'var(--badge-bg)', color: 'var(--purple-300)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={t.icon} size={16} />
    </div>
    <div>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{t.title}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{t.text}</div>
    </div>
  </div>
);

export default function AboutGuide({ setSubPage }) {
  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setSubPage('hub')}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <Icon name="arrowLeft" size={14} /> Reading hub
        </button>

        <PageHeader
          eyebrow="Reading · Guide"
          title={<>Everything about <span className="gradient-text">IELTS Academic Reading.</span></>}
          lead="The shape of the test, what each passage looks like, every question type with what's actually being tested and how to handle it, and a pacing strategy that works."
        />

        {/* Test at a glance */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)' }}>Test at a glance</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-10)',
        }}>
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* How the test works */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>How the test works</h2>
        <p className="body" style={{ marginBottom: 'var(--space-5)' }}>
          You get three passages of increasing difficulty. Each is about 700–900 words, roughly academic in register (extracts from journals, books, magazines, newspapers). Each passage carries ~13–14 questions of mixed types. There is <strong>no extra transfer time</strong> — the 60 minutes is all you get, end to end.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}>
          {PASSAGES.map(p => <PassagePanel key={p.id} p={p} />)}
        </div>
        {/* Difficulty bar */}
        <div style={{
          height: '6px', borderRadius: 'var(--r-pill)', overflow: 'hidden',
          background: 'linear-gradient(90deg, var(--violet-500) 0%, var(--blue-500) 50%, var(--green-500) 100%)',
          marginBottom: '6px',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-10)' }}>
          <span>Easier</span><span>Hardest</span>
        </div>

        {/* Question types */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>The 14 question types</h2>
        <p className="body" style={{ marginBottom: 'var(--space-5)' }}>
          Any passage mixes several of these types. The instructions always tell you what to do — but knowing each format ahead of time means you're never solving the test in real time.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-10)',
        }}>
          {QUESTION_TYPES.map(t => <QuestionTypeCard key={t.name} t={t} />)}
        </div>

        {/* Tips */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Strategy</h2>
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
            {TIPS.map(t => <TipRow key={t.title} t={t} />)}
          </div>
        </div>

        {/* CTA + sources */}
        <div className="card" style={{
          padding: 'var(--space-6)',
          background: 'linear-gradient(135deg, var(--purple-600-10), transparent)',
          borderColor: 'var(--purple-500-30)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'flex-start',
        }}>
          <h3 className="h3" style={{ color: 'var(--text-primary)' }}>Ready to practice?</h3>
          <p className="body" style={{ margin: 0 }}>69 authentic Reading passages across the three difficulty bands, auto-graded with Cambridge-style band conversion.</p>
          <button type="button" className="btn btn-primary" onClick={() => setSubPage('parts')} style={{ gap: 'var(--space-2)' }}>
            Go to Part Practice <Icon name="arrowRight" size={16} />
          </button>
        </div>
        <p style={{ marginTop: 'var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          Format and question-type definitions are drawn from{' '}
          <a href="https://www.ielts.org/for-test-takers/test-format" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-400)' }}>ielts.org</a> and{' '}
          <a href="https://ielts.idp.com/indonesia/about/news-and-articles/article-question-types-of-ielts-reading-test/en-gb" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-400)' }}>IDP IELTS</a>.
        </p>
      </div>
    </div>
  );
}
