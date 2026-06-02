import React from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';

// IELTS Academic Reading — comprehensive guide page.
// Question-type taxonomy adapted from the Mastership masterclass curriculum
// (Introduction + Always/Mostly/Not In Order decks). Worked examples are
// real Cambridge IELTS passages used in that curriculum.

const STATS = [
  { label: 'Time',         value: '60 min',      hint: 'No extra transfer time' },
  { label: 'Passages',     value: '3',           hint: 'Increasing difficulty' },
  { label: 'Questions',    value: '40',          hint: '~13–14 per passage' },
  { label: 'Question types', value: '14',        hint: 'Grouped by predictability' },
];

const PASSAGES = [
  { id: 1, label: 'Passage 1', desc: 'Factual texts on accessible topics. Warm-up.', wordTarget: '~700 words', recommendMin: '17 min', accent: 'var(--violet-500)' },
  { id: 2, label: 'Passage 2', desc: 'Slightly more abstract. Difficulty ramps.',     wordTarget: '~800 words', recommendMin: '20 min', accent: 'var(--blue-500)' },
  { id: 3, label: 'Passage 3', desc: 'Long, argumentative — global structure + inference.', wordTarget: '~900 words', recommendMin: '23 min', accent: 'var(--green-500)' },
];

// Three predictability tiers. Colors match the green/amber/red dots used in
// the source curriculum so the visual cue is intuitive.
const TIER = {
  always: { label: 'Always in order', color: '#22C55E', blurb: 'Answers march down the passage. Knock these out first.' },
  mostly: { label: 'Mostly in order', color: '#F59E0B', blurb: 'Assume the order holds; adjacent pairs occasionally swap.' },
  not:    { label: 'Not in order',    color: '#EF4444', blurb: 'Answers scatter across paragraphs. Save these for last.' },
};

// The 14 official question types, grouped by predictability. Each entry packs:
//   • skill   — what is actually being tested
//   • approach — the 5-step procedure (Mastership "Basic Strategy")
//   • example — a worked question from a real Cambridge IELTS passage
const QUESTION_TYPES = [
  // ────────────────────────── ALWAYS IN ORDER ──────────────────────────
  {
    tier: 'always', name: 'Fill-in-the-Blank', icon: 'pen',
    aka: 'Note / Form Completion',
    skill: 'Scanning for exact words, recognising synonym paraphrase, and obeying word limits.',
    approach: [
      'Underline keywords in the gap sentence and any heading above it.',
      'Predict the part of speech the blank wants — noun, number, verb.',
      'Scan the passage for those keywords or their synonyms.',
      'Copy the answer verbatim from the passage. Never paraphrase your own.',
      'Re-check the word limit. "NO MORE THAN TWO WORDS" means two, not three.',
    ],
    example: {
      source: 'Cambridge IELTS — "Indoor Farming"',
      prompt: 'Complete the notes. Choose NO MORE THAN TWO WORDS from the passage.',
      question: 'Vertical farms are stacked layers grown under specialised _______.',
      answer: 'soft lights',
      why: 'A direct lift from the passage, two words exactly. Test-maker rewards verbatim copying, never paraphrase.',
    },
  },
  {
    tier: 'always', name: 'Multiple Choice', icon: 'layout',
    skill: 'Pinpointing the option the passage actually supports — not the one that merely sounds plausible.',
    approach: [
      'Read the question stem and underline what is being asked.',
      'Locate the relevant sentence(s) in the passage by keyword scan.',
      'Cross out the two options that the passage does NOT support.',
      'Choose between the remaining two by matching meaning, not vocabulary.',
      'Beware echo-words: the wrong answer often reuses passage vocabulary in a misleading frame.',
    ],
    example: {
      source: 'Cambridge IELTS — "The Power of Silent Genes"',
      prompt: 'Choose the correct letter, A, B, C or D.',
      question: 'Why are silent genes typically retained in a genome?',
      options: ['A. They are required during embryonic development', 'B. They protect against future environmental change', 'C. They reduce mutation rates in active genes', 'D. They allow rapid speciation under selection'],
      answer: 'B',
      why: 'The passage explicitly states that silent genes "act as an insurance policy" — paraphrased as protection against future change. A, C, D each twist a real passage phrase to sound right.',
    },
  },
  {
    tier: 'always', name: 'Short Answer', icon: 'quote',
    skill: 'Detail extraction under a strict word limit. Identifying the Wh-word the question hinges on.',
    approach: [
      'Spot the Wh-word — when, where, why, how, who, what — that tells you what to look for.',
      'Underline the unique noun or named entity in the question.',
      'Scan for that name; the answer sits within one or two sentences of it.',
      'Write the exact words from the passage. No grammatical reshuffling.',
      'Count words. Over-limit answers score zero even when meaning is right.',
    ],
    example: {
      source: 'Cambridge IELTS — "The Stepwells of Rajasthan"',
      prompt: 'Answer the questions. Use NO MORE THAN THREE WORDS from the passage.',
      question: 'What event led to the decline of stepwells?',
      answer: 'the arrival of British colonial rule',
      why: 'Direct extraction. "British rule" alone would be marked wrong if the passage frames it as "colonial rule" — copy the form used.',
    },
  },
  {
    tier: 'always', name: 'Yes / No / Not Given  ·  True / False / Not Given', icon: 'checkCircle',
    skill: 'Comparing statement meaning against passage meaning. Spotting extreme words ("all", "never", "only") that flip a verdict.',
    approach: [
      'Underline the verb and any extreme word in the statement.',
      'Scan the passage for the statement\'s unique keyword.',
      'Compare the part of speech / extreme word in statement vs. passage.',
      'SAME → Yes / True.   DIFFERENT → No / False.   MISSING → Not Given.',
      'If you can\'t find direct support OR contradiction, default to Not Given. Never infer.',
    ],
    example: {
      source: 'Cambridge IELTS — "The History of Glass" (Pilkington float-glass process)',
      prompt: 'Do the statements agree with the information given in the passage?',
      question: 'Pilkington\'s float-glass process eliminated all defects in plate glass production.',
      answer: 'No',
      why: 'The passage says the process "greatly reduced" defects, not that it "eliminated all" of them. The extreme word "all" flips this from a partial match to a clear No.',
    },
  },

  // ────────────────────────── MOSTLY IN ORDER ──────────────────────────
  {
    tier: 'mostly', name: 'Sentence Completion', icon: 'arrowRight',
    aka: 'Match endings from a list',
    skill: 'Reading two-sentence chunks of the passage and finding the ending that completes the stem logically.',
    approach: [
      'Underline keywords in each sentence STEM — usually richer than the endings.',
      'Tick the easiest stem (specific name, number, technical term) to start.',
      'Scan the passage; the matching sentence carries 1–2 synonyms of the stem.',
      'Pick the ending whose meaning fits the matched sentence — not its keywords.',
      'Cross out used endings: some are decoys and will never be needed.',
    ],
    example: {
      source: 'Cambridge IELTS — "Why Animals Migrate" (Hugh Dingle)',
      prompt: 'Complete each sentence with the correct ending, A–D.',
      question: '20. To prepare for migration, animals are likely to _______.',
      options: ['A. be discouraged by difficulties', 'B. follow a straight line', 'C. eat more than they need for immediate purposes', 'D. ignore distractions'],
      answer: 'C',
      why: 'Passage: "Birds will fatten themselves with heavy feeding in advance of a long migrational flight." "Fatten / heavy feeding in advance" → "eat more than they need for immediate purposes."',
    },
  },
  {
    tier: 'mostly', name: 'Table Completion', icon: 'layout',
    skill: 'Cross-referencing row + column to know what the gap actually asks for; respecting the word limit.',
    approach: [
      'Read both the row label and the column label before reading the gap.',
      'Underline the "easiest keyword" in the row — a specific noun beats a generic verb.',
      'Scan for it; the matching paragraph will fill multiple gaps in close succession.',
      'Fit the answer to the words BEFORE and AFTER the blank — grammar is half the test.',
      'Adjacent gaps may be in reversed order. Check both.',
    ],
    example: {
      source: 'Cambridge IELTS — "Geo-engineering Projects"',
      prompt: 'Complete the table. Choose ONE WORD from the passage.',
      question: 'Procedure: "release aerosol sprays into the stratosphere" → Aim: "to create _______ that would reduce the amount of light reaching Earth."',
      answer: 'clouds',
      why: 'Passage: "...sulphur dioxide would form clouds, which would, in turn, lead to a global dimming." Direct one-word lift connecting to "reduce light".',
    },
  },
  {
    tier: 'mostly', name: 'Diagram Labelling', icon: 'compass',
    skill: 'Mapping passage description onto a visual. Titles and labels of the diagram are scanning anchors.',
    approach: [
      'Use the diagram\'s title to find the matching paragraph fast.',
      'Underline existing labels — they tell you where the unknown labels sit.',
      'No background knowledge required. The passage explains everything.',
      'Scan for spatial / process words ("attached to", "raised", "between").',
      'Each gap = one sentence in the passage. Copy verbatim within the word limit.',
    ],
    example: {
      source: 'Cambridge IELTS — "The Falkirk Wheel"',
      prompt: 'Label the diagram. Choose ONE WORD from the passage.',
      question: '21. _______ raise boat 11m to level of Union Canal.',
      answer: 'Locks',
      why: 'Passage: "The remaining 11 metres of lift needed to reach the Union Canal is achieved by means of a pair of locks." "11 metres / Union Canal" maps directly to "locks".',
    },
  },
  {
    tier: 'mostly', name: 'Flow Chart Completion', icon: 'trending',
    skill: 'Tracking a process or chronology from beginning to end. Sequence is the scaffolding.',
    approach: [
      'Underline keywords (names, numbers, places) in each chart step.',
      'Assume strict chronology — the chart\'s direction matches the passage direction.',
      'Scan for the first step\'s keyword to anchor the relevant paragraph.',
      'Fit each gap to the words before and after — grammar must lock.',
      'Re-check word limit; "NO MORE THAN TWO WORDS AND/OR A NUMBER" lets you include digits.',
    ],
    example: {
      source: 'Cambridge IELTS — "The Production Process" (newspaper print)',
      prompt: 'Complete the flowchart. Choose NO MORE THAN THREE WORDS.',
      question: 'The final version of the text is _______ to the printing centre.',
      answer: 'transmitted electronically',
      why: 'Passage: "...all the pages are transmitted electronically from the prepress centre to the printing centre." Two-word lift fits the chart\'s active verb slot.',
    },
  },
  {
    tier: 'mostly', name: 'Summary Completion', icon: 'book',
    skill: 'Synthesising a paraphrased re-telling of a paragraph (or 2–4 paragraphs) and identifying missing pieces.',
    approach: [
      'Underline keywords in the summary, then LEAVE it for last.',
      'Tackle the easy/in-order question types first — you\'ll spot summary keywords as you scan.',
      'Mark those keywords in the passage as you encounter them.',
      'Return to the summary with the heavy lifting done; fill gaps using passage-order intuition.',
      'Type 1 (word bank): grammar must agree. Type 2 (from passage): copy verbatim, respect word limit.',
    ],
    example: {
      source: 'Cambridge IELTS — "Lapita: Pacific Explorers" (Éfaté burial site)',
      prompt: 'Complete the summary using the list A–J.',
      question: '"A 3,000-year-old burial ground...has been found on an abandoned _______ on the Pacific island of Éfaté."',
      options: ['A proof', 'B plantation', 'C harbor', 'D bones', 'E archaeological discovery', '...'],
      answer: 'B (plantation)',
      why: 'Passage: "An agricultural worker, digging in the grounds of a derelict plantation, scraped open a grave..." "Derelict plantation" = "abandoned plantation".',
    },
  },

  // ────────────────────────── NOT IN ORDER ──────────────────────────
  {
    tier: 'not', name: 'Matching (Names / Theories / Features)', icon: 'target',
    skill: 'Linking statements to the specific people, opinions, or items they belong to.',
    approach: [
      'Decide which list has better keywords — usually the answer choices (proper names).',
      'Underline every name / feature in the passage as you read.',
      'For each question, scan to where that statement\'s idea appears.',
      'Match to the closest name / feature in that sentence.',
      'Answer letters may repeat if the rubric allows it — re-read the instruction.',
    ],
    example: {
      source: 'Cambridge IELTS — "Educating Psyche / Gifted Children"',
      prompt: 'Match each statement with the correct person, A–E.',
      question: '20. Gifted children know how to channel their feelings to assist their learning.',
      options: ['A Freeman', 'B Shore and Kanevsky', 'C Elshout', 'D Simonton', 'E Boekaerts'],
      answer: 'E',
      why: 'Passage: "In Boekaerts\' (1991) review of emotion in the learning of very high IQ and highly achieving children, she found emotional forces in harness." "Emotional forces in harness" = "channel feelings to assist learning".',
    },
  },
  {
    tier: 'not', name: 'Classification', icon: 'layers',
    skill: 'Three-way categorisation — slotting each statement into one of a small set of categories.',
    approach: [
      'Underline the category keys at the top (e.g., A = before 1950, B = 1950–2000, C = after 2000).',
      'For each statement, identify the category-defining word inside it.',
      'Scan for that keyword in the passage.',
      'Verify against the category definition — beware partial overlaps.',
      'Categories repeat across questions, unlike standard Matching.',
    ],
    example: {
      source: 'Cambridge IELTS — "The History of Glassmaking"',
      prompt: 'Classify each finding as belonging to: A — pre-industrial era,  B — industrial revolution,  C — modern era.',
      question: 'The first mass-produced flat glass at affordable prices for housing.',
      answer: 'B',
      why: 'Passage attributes mass-produced flat glass to the 19th-century industrial revolution. The category-defining phrase "mass-produced...affordable" is the scanning anchor.',
    },
  },
  {
    tier: 'not', name: 'Matching Headings', icon: 'bookOpen',
    skill: 'Identifying the GIST of a paragraph — not a single detail it mentions.',
    approach: [
      'Skip the rubric example heading; cross it off the list.',
      'Start with the SHORTEST paragraph — fastest to read.',
      'Read sentence 1 and sentence 2. If still unsure, read the last sentence.',
      'Pick the heading whose MEANING matches; reject any heading that just reuses a passage word.',
      'Each heading is used once. There are always more headings than paragraphs.',
    ],
    example: {
      source: 'Cambridge IELTS — "The Little Ice Age" (Brian Fagan)',
      prompt: 'Choose the correct heading for paragraph D from the list i–vii.',
      question: 'Paragraph D: "This book is a narrative history of climatic shifts during the past ten centuries..."',
      options: ['i. How past climatic conditions can be determined', 'ii. A growing need for weather records', 'iii. A study covering a thousand years'],
      answer: 'iii',
      why: '"Ten centuries" = "a thousand years". The keyword "weather records" in (ii) is a trap — it appears in a NEARBY paragraph, not this one.',
    },
  },
  {
    tier: 'not', name: 'Pick 2–4 from List', icon: 'check',
    skill: 'Locating multiple correct statements scattered across paragraphs while ignoring decoys.',
    approach: [
      'Underline keywords in the question stem — usually richer than the answer choices.',
      'Leave this for last. As you answer easier questions, mark choice keywords in the passage.',
      'Some answer choices describe things the passage NEVER discusses. They\'re decoys.',
      'Each correct letter is supported by one specific sentence — find that sentence.',
      'Read the count carefully: "TWO" answers vs. "THREE" answers scored separately.',
    ],
    example: {
      source: 'Cambridge IELTS — "The Power of Online Social Networking"',
      prompt: 'Which TWO advantages are mentioned? Choose TWO letters, A–E.',
      question: 'Advantages of online social networking discussed by the writer.',
      options: ['A. Available 24/7', 'B. Efficient way to keep in touch with many people', 'C. Easy to form new friendships', 'D. Reassuring to be part of a network', 'E. Solves real-world relationship problems'],
      answer: 'B and D',
      why: 'B is supported by "our number of weak-tie contacts has exploded via online social networking". D by "we need never feel alone... there\'s more of a safety net". A, C, E each sound plausible but are never asserted.',
    },
  },
  {
    tier: 'not', name: 'Paragraph Location  ·  Which paragraph contains…?', icon: 'lightbulb',
    skill: 'Searching for VERY specific information — distinct from Headings, which test gist.',
    approach: [
      'Underline keywords (especially specific nouns) in each question.',
      'Leave these for last. While doing easy questions, mark any keyword sighted.',
      'Return to Paragraph Location questions with markers already in place.',
      'The information will be paraphrased — match by meaning, not vocabulary.',
      'A paragraph letter may repeat across questions if the rubric allows.',
    ],
    example: {
      source: 'Cambridge IELTS — "Geo-engineering"',
      prompt: 'Which paragraph contains the following information?',
      question: 'A common definition of geo-engineering.',
      answer: 'Paragraph A',
      why: 'Paragraph A: "...geo-engineering — a term which generally refers to the intentional large-scale manipulation of the environment." "Generally refers to" = "common definition".',
    },
  },
];

const KEYS_TO_SUCCESS = [
  { icon: 'bookOpen', title: 'Vocabulary',       text: 'Synonym recognition is half the reading test. Build paraphrase fluency — not lists of words.' },
  { icon: 'target',   title: 'IELTS Scan',       text: 'Read at 2× speed for keywords. Never start from sentence 1; jump to where the keyword lives.' },
  { icon: 'clock',    title: 'Time Management',  text: '17 / 20 / 23 minutes per passage. Drop a question after 90 seconds; come back at the end.' },
  { icon: 'check',    title: 'Question Strategy',text: 'Each question type has a fixed playbook. Knowing the playbook saves the time you need for hard questions.' },
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

const TierLegend = () => (
  <div className="card" style={{
    padding: 'var(--space-5)',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-5)',
  }}>
    {Object.entries(TIER).map(([key, t]) => (
      <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <span style={{
          flexShrink: 0,
          width: '12px', height: '12px', borderRadius: '50%',
          background: t.color, marginTop: '6px',
          boxShadow: `0 0 0 3px ${t.color}22`,
        }} />
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{t.label}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.blurb}</div>
        </div>
      </div>
    ))}
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

// Collapsible question-type row using a native <details> element — accessible
// by default, keyboard-friendly, no extra state plumbing.
const QuestionTypeRow = ({ t }) => {
  const tier = TIER[t.tier];
  return (
    <details className="qt-row" style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--r-lg)',
      borderLeft: `3px solid ${tier.color}`,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', background: tier.color,
            }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              {tier.label}
            </span>
          </div>
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
};

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
          lead="The shape of the test, what each passage looks like, all 14 question types — grouped by predictability — with the specific skill tested, a five-step playbook, and a worked Cambridge example for each."
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

        {/* Four keys to success */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>The four keys to reading success</h2>
        <p className="body" style={{ marginBottom: 'var(--space-5)' }}>
          Every high band score is built from the same four habits. Skip any one and your ceiling drops.
        </p>
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-5)' }}>
            {KEYS_TO_SUCCESS.map(k => <KeyRow key={k.title} k={k} />)}
          </div>
        </div>

        {/* Question types */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>The 14 question types</h2>
        <p className="body" style={{ marginBottom: 'var(--space-4)' }}>
          The 14 types fall into three predictability tiers. Knowing which tier you're in tells you whether to scan forward, scan around, or save the question for last. Open any row for the skill it tests, a five-step playbook, and a Cambridge example with the answer worked out.
        </p>
        <TierLegend />
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
          marginBottom: 'var(--space-10)',
        }}>
          {QUESTION_TYPES.map(t => <QuestionTypeRow key={t.name} t={t} />)}
        </div>

        {/* Tips */}
        <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Pacing &amp; exam-day strategy</h2>
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
          Question-type taxonomy and strategies adapted from the Mastership IELTS Reading masterclass curriculum. Worked examples drawn from official{' '}
          <a href="https://www.cambridge.org/gb/cambridgeenglish/catalog/cambridge-english-exams-ielts" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-400)' }}>Cambridge IELTS</a> test books.
          Format definitions from{' '}
          <a href="https://www.ielts.org/for-test-takers/test-format" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-400)' }}>ielts.org</a>.
        </p>
      </div>
    </div>
  );
}
