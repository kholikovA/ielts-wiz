import React from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';

// IELTS Listening — comprehensive guide page.
// Content sourced from ielts.org (linked at footer).

const STATS = [
  { label: 'Audio time',     value: '~30 min',  hint: 'Single play, no rewind' },
  { label: 'Transfer time',  value: '10 min',   hint: 'Paper-based only' },
  { label: 'Sections',       value: '4',        hint: 'Increasing difficulty' },
  { label: 'Questions',      value: '40',       hint: '10 per section' },
];

const SECTIONS = [
  {
    id: 1, label: 'Section 1',
    context: 'Social',
    format: 'Conversation, 2 speakers',
    desc: 'An everyday social exchange — booking accommodation, enquiring about a service, joining a club, registering for an event.',
    sample: 'Caller asking for course details; receptionist filling in a form.',
    accent: 'var(--violet-500)',
  },
  {
    id: 2, label: 'Section 2',
    context: 'Social',
    format: 'Monologue, 1 speaker',
    desc: 'One person speaking on an everyday topic — a guided tour, a public talk, a radio piece about a local facility.',
    sample: 'A tour guide describing exhibits in a museum.',
    accent: 'var(--blue-500)',
  },
  {
    id: 3, label: 'Section 3',
    context: 'Academic / training',
    format: 'Conversation, up to 4 speakers',
    desc: 'A discussion in an educational or training setting — students and tutors planning a project, debating an assignment.',
    sample: 'Two students and a supervisor reviewing research methods.',
    accent: 'var(--blue-500)',
  },
  {
    id: 4, label: 'Section 4',
    context: 'Academic',
    format: 'Monologue, 1 speaker',
    desc: 'A university-style lecture on an academic subject. The most demanding section — sustained content, technical vocabulary.',
    sample: 'A lecturer presenting findings on a topic in biology, history, or psychology.',
    accent: 'var(--green-500)',
  },
];

const QUESTION_TYPES = [
  {
    name: 'Multiple Choice',
    icon: 'layout',
    desc: 'A question with three options (A/B/C) — pick the correct one. Sometimes you pick two answers from a longer list.',
    task: 'Listen for the option that matches what the speaker actually says, not what sounds plausible.',
    skill: 'Detail + paraphrase',
    tip: 'Distractors often mention the WRONG options before correcting to the right one — listen all the way through.',
  },
  {
    name: 'Matching',
    icon: 'layers',
    desc: 'A numbered list of items (e.g., people, options) is matched to a lettered list (e.g., features, comments).',
    task: 'As you hear each item, write the letter of the feature/comment that applies.',
    skill: 'Relationship recognition',
    tip: 'The numbered list usually follows the audio order — once you find one, the next is straight after.',
  },
  {
    name: 'Plan / Map / Diagram Labelling',
    icon: 'compass',
    desc: 'A visual (street map, building plan, machine diagram) with blank labels you fill from a word list.',
    task: 'Track the spatial language ("turn left", "next to", "on the south side") to locate each label.',
    skill: 'Spatial + direction',
    tip: 'Orient yourself BEFORE the audio starts — find north, the entrance, any named landmark.',
  },
  {
    name: 'Form / Note / Table / Flow-chart / Summary Completion',
    icon: 'pen',
    desc: 'A structured layout (form, notes, table, flow-chart, or paraphrased summary) with gaps to fill.',
    task: 'Fill each gap with words you hear, within the strict word limit (often "NO MORE THAN TWO WORDS").',
    skill: 'Scanning + word limit',
    tip: 'Predict the part of speech for each gap before the audio starts — noun? number? date?',
  },
  {
    name: 'Sentence Completion',
    icon: 'pen',
    desc: 'Incomplete sentences. Fill each blank with a word or short phrase from the audio.',
    task: 'Listen for the exact words that fit, respecting grammar AND the word limit.',
    skill: 'Listening + grammar',
    tip: 'The sentences are usually in audio order, so once you\'re on track, just keep moving.',
  },
  {
    name: 'Short-Answer Questions',
    icon: 'quote',
    desc: 'Direct questions about the audio. Answer each in a brief word or phrase.',
    task: 'Write the answer in the words the speaker uses — no paraphrasing on your part.',
    skill: 'Detail extraction',
    tip: 'Read the questions during the brief pauses provided. The order matches the audio.',
  },
];

const TIPS = [
  { icon: 'headphones', title: 'You only hear it once', text: 'No rewind, no replay. Read the next question while the answer to the current one is being said — multitask.' },
  { icon: 'target',     title: 'Use the prep time', text: 'Before each section, you get 30–60 seconds to read the questions. Use it to PREDICT what you\'re about to hear.' },
  { icon: 'pen',        title: 'Mind the word limit', text: '"NO MORE THAN TWO WORDS" means TWO max. Going over scores zero even if the meaning is right.' },
  { icon: 'check',      title: 'Don\'t leave blanks', text: 'No penalty for wrong answers. Guess on anything you missed — use the section\'s topic to make it plausible.' },
];

const StatCard = ({ label, value, hint }) => (
  <div style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--bg-secondary)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-color)' }}>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>{label}</div>
    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '4px' }}>{value}</div>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>{hint}</div>
  </div>
);

const SectionPanel = ({ s }) => (
  <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: 'var(--r-md)',
        background: `linear-gradient(135deg, ${s.accent}, var(--purple-700))`,
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-md)',
      }}>{s.id}</div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>{s.context}</span><span>·</span><span>{s.format}</span>
        </div>
      </div>
    </div>
    <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>{s.desc}</p>
    <div style={{
      fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
      padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--r-md)',
      background: 'var(--tag-bg)', fontStyle: 'italic',
    }}>
      e.g., {s.sample}
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
          <Icon name="arrowLeft" size={14} /> Listening hub
        </button>

        <PageHeader
          eyebrow="Listening · Guide"
          title={<>Everything about <span className="gradient-text">IELTS Listening.</span></>}
          lead="What you'll hear in each section, every question type with what's actually being tested and how to handle it, plus the prep habits that move band scores."
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

        {/* The four sections */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>The four sections</h2>
        <p className="body" style={{ marginBottom: 'var(--space-5)' }}>
          Sections 1–2 are everyday social situations; sections 3–4 are academic. Difficulty climbs across the four — by section 4 you're listening to a sustained academic lecture. Each section is 10 questions, with a short prep time before it starts and a short review time at the end.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}>
          {SECTIONS.map(s => <SectionPanel key={s.id} s={s} />)}
        </div>
        {/* Difficulty bar */}
        <div style={{
          height: '6px', borderRadius: 'var(--r-pill)', overflow: 'hidden',
          background: 'linear-gradient(90deg, var(--violet-500) 0%, var(--blue-500) 50%, var(--green-500) 100%)',
          marginBottom: '6px',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-10)' }}>
          <span>Social, easier</span><span>Academic, hardest</span>
        </div>

        {/* Question types */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>The 6 question types</h2>
        <p className="body" style={{ marginBottom: 'var(--space-5)' }}>
          Any section mixes several of these. The audio always announces the format before each block — knowing them in advance means zero parsing time.
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
          <p className="body" style={{ margin: 0 }}>80 authentic Listening tests across all four sections, auto-graded with Cambridge-style band conversion.</p>
          <button type="button" className="btn btn-primary" onClick={() => setSubPage('parts')} style={{ gap: 'var(--space-2)' }}>
            Go to Part Practice <Icon name="arrowRight" size={16} />
          </button>
        </div>
        <p style={{ marginTop: 'var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          Format and question-type definitions are drawn from{' '}
          <a href="https://www.ielts.org/for-test-takers/test-format" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-400)' }}>ielts.org</a>.
        </p>
      </div>
    </div>
  );
}
