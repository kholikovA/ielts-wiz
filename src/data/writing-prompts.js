// =============================================================================
// IELTS Writing prompts — Academic Task 1 + Task 2.
//
// Shape per prompt:
//   { id, title, prompt, visualUrl?, type, wordTarget, timeLimitMin,
//     rubric: [{ id, label, criteria: [...] }],
//     bandNineModel?: { text, annotations? } }
//
// Task 1: graphs, charts, processes, maps — academic only.
// Task 2: discursive essay on a contemporary issue.
// Five prompts in each section. One full Band-9 model on each side (the rest
// are stubs so the team can author them).
// =============================================================================

const TASK1_RUBRIC = [
  { id: 'task-achievement', label: 'Task Achievement', criteria: [
    'Clear overview of main trends / key features',
    'All key data accurately reported',
    'No invented data or missing details',
  ] },
  { id: 'coherence-cohesion', label: 'Coherence & Cohesion', criteria: [
    'Logical paragraphing (intro, overview, body)',
    'Variety of linkers (whereas, by contrast, while)',
    'Reference words used appropriately',
  ] },
  { id: 'lexical-resource', label: 'Lexical Resource', criteria: [
    'Range of trend verbs + adverbs (rose sharply, fluctuated marginally)',
    'Noun-form alternatives (a steady decline)',
    'Approximation language (just under, roughly)',
    'No repetition of key terms',
  ] },
  { id: 'grammatical-range', label: 'Grammatical Range', criteria: [
    'Mix of simple and complex sentences',
    'Accurate use of comparatives + superlatives',
    'Passive voice for processes / unknown agents',
    'Correct articles and prepositions',
  ] },
];

const TASK2_RUBRIC = [
  { id: 'task-response', label: 'Task Response', criteria: [
    'Position is clear and consistent',
    'Each body paragraph develops one main idea fully',
    'Specific examples support every claim',
    'Conclusion restates position without repeating verbatim',
  ] },
  { id: 'coherence-cohesion', label: 'Coherence & Cohesion', criteria: [
    'Topic sentence opens each paragraph',
    'Within-paragraph progression (claim → evidence → analysis)',
    'Cross-paragraph linkers (however, by contrast, similarly)',
    'No over-use of mechanical connectors',
  ] },
  { id: 'lexical-resource', label: 'Lexical Resource', criteria: [
    'Topic-specific vocabulary (urbanisation, sustainability)',
    'Hedging language (tends to, is likely to, arguably)',
    'Collocations (raise awareness, address concerns)',
    'No avoidance of difficult words',
  ] },
  { id: 'grammatical-range', label: 'Grammatical Range', criteria: [
    'Nominalisation (the rise of, the impact of)',
    'Conditionals + relative clauses',
    'Passive voice where appropriate',
    'Accurate punctuation and articles',
  ] },
];

const TASK1_PROMPTS = [
  {
    id: 'T1-01',
    title: 'Population growth in five Asian cities',
    prompt: "The chart below shows the population of five major Asian cities (Tokyo, Shanghai, Mumbai, Jakarta, and Manila) in 1990, 2010, and projected figures for 2030.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    type: 'task1-chart',
    wordTarget: 150,
    timeLimitMin: 20,
    rubric: TASK1_RUBRIC,
    status: 'authored',
    bandNineModel: {
      text: "The bar chart compares the populations of five Asian metropolises — Tokyo, Shanghai, Mumbai, Jakarta, and Manila — across three points in time: 1990, 2010, and 2030 (projected).\n\nOverall, while every city saw substantial growth between 1990 and 2010, Tokyo is forecast to be overtaken by Shanghai and Mumbai by 2030, signalling a shift in the centre of urban gravity from East Asia towards South and South-East Asia.\n\nIn 1990, Tokyo dwarfed its peers at approximately 32 million inhabitants, almost double the size of second-placed Mumbai (around 16 million). By 2010, Tokyo's lead had narrowed considerably as Shanghai and Mumbai had climbed past 20 million each, while Jakarta and Manila grew more modestly, peaking at roughly 14 and 12 million respectively.\n\nThe most striking projection is for 2030. Shanghai is expected to surge past 30 million, with Mumbai following closely at around 28 million — both eclipsing Tokyo, whose population is forecast to plateau just below its 2010 figure. Jakarta and Manila are projected to continue their steady upward trajectory, reaching approximately 18 and 16 million respectively.",
      annotations: [
        { phrase: 'overall, while every city saw substantial growth', why: 'Overview that captures the macro pattern before any specifics — required for Band 9 in Task 1.' },
        { phrase: 'is forecast to be overtaken by', why: 'Passive + projection-appropriate modal. Avoids "will be" repetition.' },
        { phrase: 'dwarfed', why: 'Strong, precise trend verb. Avoids generic "was bigger than".' },
        { phrase: 'narrowed considerably', why: 'Verb + adverb collocation that signals direction + magnitude without using "decreased".' },
        { phrase: 'is expected to surge past', why: 'Hedged forecast verb + dramatic trend verb — appropriate for 2030 projection.' },
        { phrase: 'steady upward trajectory', why: 'Noun phrase variant instead of "a gradual increase" — adds lexical range.' },
      ],
    },
  },
  {
    id: 'T1-02',
    title: 'Process: how solar panels generate electricity',
    prompt: "The diagram below shows how solar panels generate electricity for residential use.\n\nSummarise the information by selecting and reporting the main features. You should write at least 150 words.",
    type: 'task1-process',
    wordTarget: 150,
    timeLimitMin: 20,
    rubric: TASK1_RUBRIC,
    status: 'stub',
  },
  {
    id: 'T1-03',
    title: 'Map: changes to a coastal village (1970 vs 2020)',
    prompt: "The two maps below show a coastal village in 1970 and the same area in 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    type: 'task1-map',
    wordTarget: 150,
    timeLimitMin: 20,
    rubric: TASK1_RUBRIC,
    status: 'stub',
  },
  {
    id: 'T1-04',
    title: 'Line graph: smartphone ownership 2005–2025',
    prompt: "The line graph below shows the percentage of adults owning a smartphone in four countries between 2005 and 2025.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    type: 'task1-line',
    wordTarget: 150,
    timeLimitMin: 20,
    rubric: TASK1_RUBRIC,
    status: 'stub',
  },
  {
    id: 'T1-05',
    title: 'Table: household energy use by source',
    prompt: "The table below shows the proportion of household energy use by source (gas, electricity, oil, renewables) in four countries in 2024.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    type: 'task1-table',
    wordTarget: 150,
    timeLimitMin: 20,
    rubric: TASK1_RUBRIC,
    status: 'stub',
  },
];

const TASK2_PROMPTS = [
  {
    id: 'T2-01',
    title: 'Remote work: a permanent shift?',
    prompt: "Some people argue that the rise of remote work has permanently changed the workplace for the better. Others contend that it weakens collaboration, professional development, and company culture.\n\nDiscuss both views and give your own opinion.",
    type: 'task2-discuss',
    wordTarget: 250,
    timeLimitMin: 40,
    rubric: TASK2_RUBRIC,
    status: 'authored',
    bandNineModel: {
      text: "The pandemic-driven shift to remote work has triggered a sustained debate over whether dispersed teams represent the future of professional life or a passing experiment that erodes the foundations of effective work. While both positions have merit, I would argue that the answer is neither categorical — the optimal arrangement depends heavily on the nature of the work and the maturity of the worker.\n\nProponents of remote work point, quite rightly, to substantial productivity gains, the elimination of commutes, and a markedly improved work-life balance. Workers reclaim hours each week, parents are more present at home, and companies access talent unconstrained by geography. Software engineers, writers, and analysts — whose output is largely individual and asynchronous — have demonstrated that physical proximity is not a prerequisite for high performance. Indeed, many such workers report being measurably more productive at home than in a fluorescent-lit open-plan office.\n\nHowever, the counter-argument is compelling for early-career professionals. Mentorship, tacit knowledge transfer, and the kind of incidental learning that happens at a colleague's desk are extraordinarily difficult to replicate over video calls. A junior employee who has never sat through a difficult client conversation in person, or watched a senior colleague navigate a crisis, is at a structural disadvantage. Likewise, creative collaboration — the kind that emerges from spontaneous whiteboard sessions — does suffer when every interaction must be scheduled.\n\nThe most pragmatic conclusion, in my view, is that the binary framing of \"remote versus office\" is itself the problem. Hybrid arrangements that bring teams together for collaborative work and creative thinking, while preserving individual focus time at home, are likely to dominate. The challenge for leaders is not to mandate a location but to design work itself around the activities that genuinely benefit from co-location.",
      annotations: [
        { phrase: 'has triggered a sustained debate over whether… or…', why: 'Introduction frame from the Task 2 language pack — sets up both sides without rephrasing the question.' },
        { phrase: 'neither categorical — the optimal arrangement depends heavily on', why: 'Hedged thesis. Band 9 essays rarely take an absolute position; they qualify.' },
        { phrase: 'Proponents of remote work point, quite rightly, to', why: 'Concession + reporting verb structure. "Quite rightly" softens; "point to" sounds academic.' },
        { phrase: 'unconstrained by geography', why: 'Reduced participle clause modifying "talent" — Level 2 grammar marker.' },
        { phrase: 'is not a prerequisite for', why: 'Nominalisation + formal register, beats "you don\'t need".' },
        { phrase: 'the kind of incidental learning that happens at a colleague\'s desk', why: 'Concrete imagery — Band 9 essays anchor abstract claims in tangible detail.' },
        { phrase: 'A junior employee who has never sat through a difficult client conversation…', why: 'Extended example with specific consequence. Demonstrates depth of thought.' },
        { phrase: "the binary framing of 'remote versus office' is itself the problem", why: "Reframing move — the strongest essays don't pick a side, they reframe the question." },
        { phrase: 'design work itself around the activities that genuinely benefit from co-location', why: 'Forward-looking, specific conclusion. No empty platitudes about "balance".' },
      ],
    },
  },
  {
    id: 'T2-02',
    title: 'Standardised testing in higher education',
    prompt: "Some universities have moved away from standardised entrance exams, arguing that they disadvantage students from less wealthy backgrounds. Others believe such exams remain the fairest way to compare applicants.\n\nDiscuss both views and give your own opinion.",
    type: 'task2-discuss',
    wordTarget: 250,
    timeLimitMin: 40,
    rubric: TASK2_RUBRIC,
    status: 'stub',
  },
  {
    id: 'T2-03',
    title: 'Government investment in space exploration',
    prompt: "Some people believe that governments should prioritise spending on solving terrestrial problems such as poverty and climate change, rather than funding space exploration. Others argue that space research yields long-term benefits that justify the cost.\n\nTo what extent do you agree or disagree?",
    type: 'task2-opinion',
    wordTarget: 250,
    timeLimitMin: 40,
    rubric: TASK2_RUBRIC,
    status: 'stub',
  },
  {
    id: 'T2-04',
    title: 'Childhood and unstructured play',
    prompt: "In many countries, children today spend less time on unstructured outdoor play than previous generations.\n\nWhat are the causes of this change, and what effects might it have on children's development?",
    type: 'task2-problem',
    wordTarget: 250,
    timeLimitMin: 40,
    rubric: TASK2_RUBRIC,
    status: 'stub',
  },
  {
    id: 'T2-05',
    title: 'Social media as a news source',
    prompt: "An increasing number of people get their news primarily from social media rather than from traditional newspapers or broadcasters.\n\nDo the advantages of this trend outweigh the disadvantages?",
    type: 'task2-adv-disadv',
    wordTarget: 250,
    timeLimitMin: 40,
    rubric: TASK2_RUBRIC,
    status: 'stub',
  },
];

export const writingPrompts = { task1: TASK1_PROMPTS, task2: TASK2_PROMPTS };

export const PROMPT_INDEX = (() => {
  const idx = {};
  [...TASK1_PROMPTS, ...TASK2_PROMPTS].forEach(p => { idx[p.id] = p; });
  return idx;
})();
