import React from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';

// IELTS Listening — comprehensive guide page.
// Question-type entries follow the same structure as the Reading guide:
// skill tested, a stepped approach, and a worked Cambridge example.

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
    aka: '3-option pick · or "Choose TWO from a longer list"',
    typicalSection: 'Sections 2–4',
    skill: 'Distinguishing the speaker\'s final position from distractors — including wrong options the speaker mentions before correcting themselves.',
    approach: [
      'Read every option BEFORE the audio starts during the prep window.',
      'Underline the difference between the options — that\'s what the speaker tests.',
      'Listen to the WHOLE answer; the speaker often raises wrong options first ("I considered X, but actually we went with Y").',
      'Match meaning, not vocabulary — option wording will paraphrase the audio.',
      'If two options sound right, pick the one supported by the speaker\'s final statement.',
    ],
    example: {
      source: 'Cambridge IELTS Listening — Section 3 (student tutorial)',
      prompt: 'Choose the correct letter, A, B or C.',
      question: 'What did the students decide to focus their project on?',
      options: ['A. The history of the local museum', 'B. The visitor experience at the museum', 'C. The educational role of the museum'],
      answer: 'B',
      why: 'One student suggests A, the supervisor proposes C, and the second student lands on B as the agreed scope. Always wait for the final agreed position.',
    },
  },
  {
    name: 'Matching',
    icon: 'layers',
    typicalSection: 'Sections 2–3',
    skill: 'Pairing each numbered item to a lettered feature/opinion as the speaker moves through them.',
    approach: [
      'Read both lists during the prep window.',
      'The numbered items follow audio order — once you\'re tracking item 1, item 2 comes next.',
      'For each item, listen for the FEATURE in the answer list, not the item name itself.',
      'Cross off each letter as it\'s used (unless the rubric allows repeats).',
      'A skipped item = missed item. Move on rather than getting stuck.',
    ],
    example: {
      source: 'Cambridge IELTS Listening — Section 3 (project responsibilities)',
      prompt: 'Match each team member with their task. Write the correct letter, A–F.',
      question: '21. Maria  →  ?',
      options: ['A. Designing the questionnaire', 'B. Booking interview rooms', 'C. Recording the interviews', 'D. Editing the final report'],
      answer: 'A',
      why: 'Audio: "Maria, you\'re great at writing — could you put together the questions?" "Writing the questions" = "designing the questionnaire". Synonym match.',
    },
  },
  {
    name: 'Plan / Map / Diagram Labelling',
    icon: 'compass',
    typicalSection: 'Section 2 (often) · Section 4 (diagrams)',
    skill: 'Tracking spatial language ("turn left", "opposite", "on the north side") to attach each label to the correct location.',
    approach: [
      'Orient yourself BEFORE the audio starts — find north, the entrance, any named landmark.',
      'Trace the speaker\'s route with your pen on the map as they describe it.',
      'When you hear a label keyword from the answer list, mark the location.',
      'Beware of corrections: "It used to be there, but now it\'s here" — pick the current location.',
      'For diagrams: technical nouns are your scanning anchors. Listen for them by name.',
    ],
    example: {
      source: 'Cambridge IELTS Listening — Section 2 (museum floor plan)',
      prompt: 'Label the plan. Choose from the list A–H.',
      question: '14. The gift shop  →  ?',
      answer: 'C (south wing, opposite the café)',
      why: 'Audio: "As you come in through the main entrance, the café is on your right; just across the corridor on the left, you\'ll find the gift shop." "Opposite the café" = correct location.',
    },
  },
  {
    name: 'Form / Note / Table / Flow-chart / Summary Completion',
    icon: 'pen',
    typicalSection: 'Section 1 (forms) · Section 4 (notes, tables, summaries)',
    skill: 'Filling structured layouts with the exact words you hear, within a strict word limit.',
    approach: [
      'Predict the part of speech for every blank — noun? number? date? name?',
      'For numbers, listen for the FULL form: "two hundred and fifty" not "2 50".',
      'For names, the speaker will usually spell them out.',
      'Write what you hear — never invent a paraphrase.',
      'Re-check the word limit. "NO MORE THAN TWO WORDS" means two, not three.',
    ],
    example: {
      source: 'Cambridge IELTS Listening — Section 1 (booking form)',
      prompt: 'Complete the form. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.',
      question: 'Type of accommodation: _______',
      answer: 'shared apartment',
      why: 'Audio: "I\'d prefer something shared rather than a studio — a shared apartment, ideally." Two-word answer, copied verbatim.',
    },
  },
  {
    name: 'Sentence Completion',
    icon: 'pen',
    typicalSection: 'Section 4 (most common)',
    skill: 'Hearing the exact word(s) that complete a sentence stem, while keeping grammar intact.',
    approach: [
      'Read every sentence in the prep window — they preview the lecture\'s structure.',
      'Underline the grammar of the gap (subject? object? after a preposition?).',
      'The sentences follow audio order — when you\'re lost, jump to the next one.',
      'Listen for paraphrase of the words BEFORE the gap; the answer follows.',
      'Spelling matters. A misheard word is wrong even if the meaning is right.',
    ],
    example: {
      source: 'Cambridge IELTS Listening — Section 4 (academic lecture)',
      prompt: 'Complete the sentences. Use NO MORE THAN TWO WORDS.',
      question: 'Early researchers focused mainly on the _______ of the species.',
      answer: 'feeding habits',
      why: 'Audio: "The earliest fieldwork concentrated on what they ate and when — essentially the feeding habits of the species." Direct lift from the lecturer\'s summary.',
    },
  },
  {
    name: 'Short-Answer Questions',
    icon: 'quote',
    typicalSection: 'Sections 1–2',
    skill: 'Direct extraction of brief factual details. Wh-questions, short answers, strict word limits.',
    approach: [
      'Identify the Wh-word in each question — when, where, why, how, who, what.',
      'Predict the answer\'s form: a name? a number? a place?',
      'Questions follow audio order. Stay aligned with the speaker.',
      'Use the exact words the speaker uses. No paraphrasing on your part.',
      'If you miss one, leave it blank, move on, and come back during the transfer window.',
    ],
    example: {
      source: 'Cambridge IELTS Listening — Section 1 (club registration)',
      prompt: 'Answer the questions. Use NO MORE THAN THREE WORDS.',
      question: 'What document does the applicant need to bring?',
      answer: 'a passport photo',
      why: 'Audio: "Oh, and you\'ll need to bring along a passport photo when you come in to complete the registration." Three-word lift.',
    },
  },
];

const KEYS_TO_SUCCESS = [
  { icon: 'headphones', title: 'Active listening',  text: 'Read the next question while the answer to the current one is being said. The audio doesn\'t wait.' },
  { icon: 'target',     title: 'Use the prep window',text: 'Every section gives you 30–60 seconds before the audio starts. Predict what you\'re about to hear.' },
  { icon: 'pen',        title: 'Spelling + word limit',text: 'A correct meaning with a misspelling or extra word scores zero. Both rules apply to every gap-fill type.' },
  { icon: 'check',      title: 'Never leave blanks', text: 'No penalty for wrong answers. Use the section topic to make a plausible guess on anything missed.' },
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

const KeyRow = ({ k }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
    <div style={{
      flexShrink: 0,
      width: '32px', height: '32px', borderRadius: 'var(--r-md)',
      background: 'var(--badge-bg)', color: 'var(--purple-300)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={k.icon} size={16} />
    </div>
    <div>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: 'var(--text-sm)' }}>{k.title}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{k.text}</div>
    </div>
  </div>
);

// Collapsible question-type row, matching the Reading guide's pattern.
const QuestionTypeRow = ({ t }) => (
  <details className="qt-row" style={{
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--r-lg)',
    borderLeft: '3px solid var(--purple-500)',
    overflow: 'hidden',
  }}>
    <summary style={{
      cursor: 'pointer',
      listStyle: 'none',
      padding: 'var(--space-4) var(--space-5)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
    }}>
      <span style={{
        flexShrink: 0,
        width: '36px', height: '36px', borderRadius: 'var(--r-md)',
        background: 'var(--badge-bg)', color: 'var(--purple-300)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={t.icon} size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-md)', color: 'var(--text-primary)', margin: 0 }}>
            {t.name}
          </h3>
          {t.aka && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              · {t.aka}
            </span>
          )}
        </div>
        {t.typicalSection && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            Most common in: {t.typicalSection}
          </div>
        )}
      </div>
      <Icon name="chevronDown" size={16} aria-hidden />
    </summary>

    <div style={{
      padding: '0 var(--space-5) var(--space-5)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
      borderTop: '1px solid var(--border-color)',
      paddingTop: 'var(--space-4)',
    }}>
      {/* Skill */}
      <div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--purple-300)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
          What it tests
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t.skill}</div>
      </div>

      {/* Approach */}
      <div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--purple-300)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
          How to approach
        </div>
        <ol style={{ margin: 0, paddingLeft: '1.25em', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
          {t.approach.map((step, i) => <li key={i} style={{ marginBottom: '4px' }}>{step}</li>)}
        </ol>
      </div>

      {/* Cambridge example */}
      <div style={{
        padding: 'var(--space-4)',
        background: 'var(--answer-bg)',
        borderRadius: 'var(--r-md)',
        borderLeft: '3px solid var(--purple-500)',
      }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--purple-300)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
          Cambridge example
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
          {t.example.source}
        </div>
        {t.example.prompt && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 'var(--space-2)' }}>
            {t.example.prompt}
          </div>
        )}
        <blockquote style={{
          margin: 0,
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--r-sm)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
        }}>
          {t.example.question}
        </blockquote>
        {t.example.options && (
          <ul style={{ margin: 'var(--space-2) 0 0', paddingLeft: '1.25em', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, listStyle: 'none' }}>
            {t.example.options.map((opt, i) => <li key={i}>{opt}</li>)}
          </ul>
        )}
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
            Answer
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--green-500)', fontWeight: 600 }}>{t.example.answer}</span>
        </div>
        <div style={{ marginTop: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Why.</strong> {t.example.why}
        </div>
      </div>
    </div>
  </details>
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
          lead="What you'll hear in each section, all 6 question types — with the specific skill tested, a stepped playbook, and a worked Cambridge example for each — plus the prep habits that move band scores."
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

        {/* Four keys to success */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>The four keys to listening success</h2>
        <p className="body" style={{ marginBottom: 'var(--space-5)' }}>
          Listening rewards focused habits more than vocabulary breadth. These four are the ones that move bands.
        </p>
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-5)' }}>
            {KEYS_TO_SUCCESS.map(k => <KeyRow key={k.title} k={k} />)}
          </div>
        </div>

        {/* Question types */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>The 6 question types</h2>
        <p className="body" style={{ marginBottom: 'var(--space-5)' }}>
          Any section mixes several of these. The audio always announces the format before each block — knowing them in advance means zero parsing time. Open any row for the skill it tests, a stepped playbook, and a Cambridge example with the answer worked out.
        </p>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
          marginBottom: 'var(--space-10)',
        }}>
          {QUESTION_TYPES.map(t => <QuestionTypeRow key={t.name} t={t} />)}
        </div>

        {/* Tips */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Exam-day strategy</h2>
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
          Worked examples drawn from official{' '}
          <a href="https://www.cambridge.org/gb/cambridgeenglish/catalog/cambridge-english-exams-ielts" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-400)' }}>Cambridge IELTS</a> test books.
          Format definitions from{' '}
          <a href="https://www.ielts.org/for-test-takers/test-format" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-400)' }}>ielts.org</a>.
        </p>
      </div>
    </div>
  );
}
