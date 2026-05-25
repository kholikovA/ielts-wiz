// =============================================================================
// IELTSwiz Grammar Curriculum — data shape
//
// Levels 1–4 + four task-specific tracks. Topic shape:
//   {
//     id, title, tags, estimatedMinutes, status: 'ready'|'authored-stub'|'planned',
//     blurb,
//     sections: {
//       notice: { heading, examples: [{ text, highlights, note }] },
//       understand: { rules: [...], formBox?, useBox? },
//       commonMistakes: [{ wrong, right, explanation }],
//       practise: [{ type:'gap-fill'|'mcq', question, answer, explanation }],
//       produce: [{ type:'transform', prompt, answer, hints }],
//       apply: [{ type:'mini-task', taskType, prompt, modelAnswer, criteria }],
//       masteryTest: { questionCount, passingScore, questions: [...] }
//     }
//   }
//
// Only L1-01 (Articles) is fully authored. The other 31 topics carry the same
// shape with empty content arrays; the team fills them in over the 8-week
// roadmap. Switch `status` to 'ready' once a topic is fully populated.
// =============================================================================

// Re-usable empty shell so the page can render any topic safely.
const emptySections = () => ({
  notice: { heading: 'Notice the structure', examples: [] },
  understand: { rules: [], formBox: null, useBox: null },
  commonMistakes: [],
  practise: [],
  produce: [],
  apply: [],
  masteryTest: { questionCount: 15, passingScore: 0.85, questions: [] },
});

// -----------------------------------------------------------------------------
// LEVEL 1 — FOUNDATIONS
// -----------------------------------------------------------------------------

const articlesTopic = {
  id: 'L1-01',
  title: 'Articles: a / an / the / zero article',
  tags: ['accuracy', 'W-T1', 'W-T2', 'S-all', 'R'],
  estimatedMinutes: 45,
  status: 'ready',
  blurb: 'The single biggest accuracy issue for IELTS candidates from article-less L1s. Master the four-way distinction (a / an / the / zero) and stop bleeding marks on every paragraph.',
  sections: {
    notice: {
      heading: 'Notice the structure',
      examples: [
        {
          text: "The environment is suffering from a rise in pollution caused by industrial activity.",
          highlights: ["The environment", "a rise", "pollution", "industrial activity"],
          note: "Generic 'the' (the environment as a whole), indefinite 'a' for a first mention, zero article with abstract uncountable ('pollution'), zero article with a generic plural/uncountable phrase ('industrial activity').",
        },
        {
          text: "Education is essential for the development of any nation.",
          highlights: ["Education", "the development"],
          note: "Zero article with the generic abstract noun. 'The' because 'development' is post-modified by 'of any nation' (specific reference).",
        },
        {
          text: "The Internet has transformed the way we communicate.",
          highlights: ["The Internet", "the way"],
          note: "'The' with unique entities (the Internet, the sun, the government). 'The' with the pattern 'the way (that)' — a defined manner.",
        },
        {
          text: "A common solution to traffic congestion is the construction of more efficient public transport networks.",
          highlights: ["A common solution", "traffic congestion", "the construction", "more efficient public transport networks"],
          note: "Indefinite 'a' for one of several possible solutions. Zero article with the uncountable 'traffic congestion'. 'The' with 'construction of...' (post-modified, definite). Zero article with the generic plural phrase 'more efficient public transport networks'.",
        },
        {
          text: "Children who grow up in rural areas tend to have a stronger connection to nature.",
          highlights: ["Children", "rural areas", "a stronger connection", "nature"],
          note: "Zero article with the generic plural 'children' and generic plural 'rural areas'. 'A stronger connection' — first mention, comparative. Zero article with abstract 'nature'.",
        },
        {
          text: "The poor often bear the brunt of economic downturns.",
          highlights: ["The poor", "the brunt", "economic downturns"],
          note: "Generic 'the' + adjective for a class of people (the poor, the elderly, the unemployed). 'The brunt' — fixed phrase. Zero article with generic plural 'economic downturns'.",
        },
      ],
    },
    understand: {
      rules: [
        {
          rule: "Use 'the' for specific or already-mentioned entities, unique items, and superlatives.",
          examples: ["the government (unique)", "the most important issue (superlative)", "the sun (unique)", "the policy I mentioned (specific)"],
        },
        {
          rule: "Use 'a' or 'an' for non-specific, first-mention singular countable nouns.",
          examples: ["a major problem", "a renewable energy source", "an issue"],
        },
        {
          rule: "Use zero article (no article) with: plural generic nouns, uncountable abstract nouns, meals, transport with 'by', and most names of countries / cities.",
          examples: ["Children need education.", "Pollution is rising.", "by car / at home / in bed", "France / Tokyo"],
        },
        {
          rule: "Use generic 'the' + adjective to refer to a whole class of people.",
          examples: ["the elderly", "the rich", "the unemployed", "the homeless"],
        },
        {
          rule: "Use 'the' with a noun when it is post-modified by an 'of'-phrase that makes it specific.",
          examples: ["the development of technology", "the rise of social media", "the impact of globalisation"],
        },
      ],
      formBox: {
        title: 'Form',
        rows: [
          ['a + consonant SOUND', 'a university (yoo-), a one-off (wuh-)'],
          ['an + vowel SOUND', 'an hour (silent h), an MBA (em-)'],
          ['the (sing./pl., count./uncount.)', 'the issue, the issues, the air'],
          ['Ø (zero) + generic plural / uncountable', 'Children…, Education…'],
        ],
      },
      useBox: {
        title: 'When to use which',
        rows: [
          ['Specific, mutual reference', 'the'],
          ['First mention of a singular countable', 'a / an'],
          ['Generic statements (in general)', 'Ø + plural OR Ø + uncountable'],
          ['Class of people', 'the + adjective (the poor)'],
          ['Unique / one-of-a-kind', 'the (the sun, the government)'],
          ['Superlatives / ordinals', 'the (the best, the first)'],
        ],
      },
    },
    commonMistakes: [
      {
        wrong: "The life is short.",
        right: "Life is short.",
        explanation: "Generic abstract nouns take zero article. 'The life' would refer to a specific life.",
      },
      {
        wrong: "Education is important for the children.",
        right: "Education is important for children.",
        explanation: "Generic plural 'children' (= children in general) takes zero article. 'The children' refers to a specific group.",
      },
      {
        wrong: "I went to the home.",
        right: "I went home.",
        explanation: "'Home' takes zero article when used as a destination ('go home', 'stay home', 'leave home').",
      },
      {
        wrong: "Government should invest in renewable energy.",
        right: "The government should invest in renewable energy.",
        explanation: "'The government' is a unique entity in a given country — use 'the'.",
      },
      {
        wrong: "Pollution is a serious problem that affects the environment in many countries.",
        right: "Pollution is a serious problem that affects the environment in many countries.",
        explanation: "(This one is correct! Generic 'pollution' (Ø), 'a serious problem' (first mention, countable), 'the environment' (unique generic entity), 'many countries' (generic plural).",
      },
      {
        wrong: "An information is crucial.",
        right: "Information is crucial.",
        explanation: "'Information' is uncountable in English — never use 'an' or a plural form. Same for: advice, research, equipment, evidence, knowledge.",
      },
      {
        wrong: "The most of people prefer working from home.",
        right: "Most people prefer working from home.",
        explanation: "'Most' + plural noun takes zero article. 'The most' is used only as a superlative ('the most important').",
      },
      {
        wrong: "She is the best in mathematics.",
        right: "She is the best at mathematics.",
        explanation: "Article use is correct here — but note the preposition: 'good/best AT', not 'IN'.",
      },
      {
        wrong: "I am studying for an university degree.",
        right: "I am studying for a university degree.",
        explanation: "'University' begins with a /j/ (yoo-) sound, not a vowel sound, so it takes 'a', not 'an'.",
      },
      {
        wrong: "Population of urban areas is growing.",
        right: "The population of urban areas is growing.",
        explanation: "Post-modified by 'of urban areas' — this makes the noun specific, so 'the' is required.",
      },
    ],
    practise: [
      { type: 'gap-fill', question: "___ education is essential for ___ development of any nation.", answer: ["Ø", "the"], explanation: "Generic abstract 'education' = Ø. 'The development' post-modified by 'of any nation' = specific." },
      { type: 'gap-fill', question: "___ government has introduced ___ new tax policy.", answer: ["The", "a"], explanation: "Generic 'the government' (unique entity). First mention of a countable policy = 'a'." },
      { type: 'gap-fill', question: "___ children who grow up in cities tend to have less contact with ___ nature.", answer: ["Ø", "Ø"], explanation: "Generic plural 'children' = Ø. Abstract uncountable 'nature' = Ø." },
      { type: 'gap-fill', question: "She is studying for ___ MBA at ___ University of Cambridge.", answer: ["an", "the"], explanation: "'MBA' begins with 'em' (vowel sound) = 'an'. Universities of X take 'the'." },
      { type: 'gap-fill', question: "___ Internet has transformed ___ way we work.", answer: ["The", "the"], explanation: "Unique entity 'the Internet'. Fixed pattern 'the way (that)…'." },
      { type: 'gap-fill', question: "I take ___ bus to ___ work every morning.", answer: ["the", "Ø"], explanation: "Specific 'the bus' (the bus route I take). Zero article with 'work' as a destination." },
      { type: 'gap-fill', question: "___ unemployment is a major issue in many ___ developing countries.", answer: ["Ø", "Ø"], explanation: "Abstract uncountable. Generic plural after 'many'." },
      { type: 'gap-fill', question: "___ poor often suffer ___ most during economic crises.", answer: ["The", "the"], explanation: "Generic 'the poor'. Superlative 'the most'." },
      { type: 'gap-fill', question: "Globalisation has had ___ significant impact on ___ traditional cultures.", answer: ["a", "Ø"], explanation: "First mention, countable 'impact' = 'a'. Generic plural 'traditional cultures' = Ø." },
      { type: 'gap-fill', question: "___ research suggests that ___ exercise improves ___ mental health.", answer: ["Ø", "Ø", "Ø"], explanation: "Three uncountable abstract nouns, all generic." },
      { type: 'mcq', question: "Choose the best option: '___ rise of ___ social media has changed how we communicate.'", options: ["A / Ø", "The / Ø", "Ø / the", "The / the"], answer: 1, explanation: "'The rise of X' (post-modified, definite). 'Social media' is generic uncountable = Ø." },
      { type: 'mcq', question: "Choose the best option: 'I believe ___ governments should provide ___ free healthcare.'", options: ["Ø / Ø", "the / Ø", "Ø / the", "the / the"], answer: 0, explanation: "'Governments' (in general, plural) = Ø. 'Healthcare' (abstract uncountable) = Ø." },
      { type: 'mcq', question: "Choose the best option: 'He is ___ honest man.'", options: ["a", "an", "the", "Ø"], answer: 1, explanation: "'Honest' begins with a silent 'h' = vowel sound = 'an'." },
      { type: 'mcq', question: "Choose: '___ majority of ___ students believe ___ exams are stressful.'", options: ["A / the / the", "The / Ø / Ø", "Ø / the / the", "The / the / Ø"], answer: 1, explanation: "'The majority of' (fixed). 'Students' (generic plural) = Ø. 'Exams' (generic plural) = Ø." },
      { type: 'mcq', question: "Choose: 'It is ___ best way to solve ___ problem.'", options: ["a / a", "the / the", "Ø / the", "the / Ø"], answer: 1, explanation: "Superlative 'the best'. Specific 'the problem' (a particular one already understood from context)." },
      { type: 'gap-fill', question: "___ Eiffel Tower attracts ___ millions of tourists every year.", answer: ["The", "Ø"], explanation: "Unique monuments take 'the'. 'Millions of' takes no article (indefinite quantity)." },
      { type: 'gap-fill', question: "Many ___ students struggle with ___ vocabulary in ___ academic writing.", answer: ["Ø", "Ø", "Ø"], explanation: "All generic — plural, uncountable, uncountable abstract." },
      { type: 'gap-fill', question: "I have ___ interesting idea about ___ environment.", answer: ["an", "the"], explanation: "First mention, countable, vowel sound = 'an'. 'The environment' is a unique generic entity." },
      { type: 'gap-fill', question: "She is one of ___ most talented musicians in ___ country.", answer: ["the", "the"], explanation: "Superlative 'the most'. 'The country' (a specific one already in context)." },
      { type: 'gap-fill', question: "___ life in ___ big cities tends to be more stressful than ___ life in ___ countryside.", answer: ["Ø", "Ø", "Ø", "the"], explanation: "Generic 'life' = Ø. Generic plural 'big cities' = Ø. Generic 'life' again = Ø. 'The countryside' is a unique generic entity (always 'the')." },
    ],
    produce: [
      { type: 'transform', prompt: "Rewrite with correct articles: 'Government must invest in education for benefit of society.'", answer: "The government must invest in education for the benefit of society.", hints: ["'Government' is a unique entity in a country.", "'Education' is generic abstract.", "'Benefit of society' is post-modified — specific."] },
      { type: 'transform', prompt: "Rewrite with correct articles: 'Pollution is causing serious damage to environment in many of cities.'", answer: "Pollution is causing serious damage to the environment in many cities.", hints: ["'Environment' as a unique generic entity.", "Remove 'of' after 'many'."] },
      { type: 'transform', prompt: "Rewrite with correct articles: 'Elderly often face the loneliness in modern society.'", answer: "The elderly often face loneliness in modern society.", hints: ["Generic 'the' + adjective for a class of people.", "Abstract 'loneliness' = Ø."] },
      { type: 'transform', prompt: "Rewrite with correct articles: 'I would like to study at university to become a engineer.'", answer: "I would like to study at university to become an engineer.", hints: ["'University' as an institution = Ø.", "'Engineer' begins with a vowel sound = 'an'."] },
      { type: 'transform', prompt: "Rewrite: 'Most of people believe that internet has changed the world.'", answer: "Most people believe that the Internet has changed the world.", hints: ["'Most' + plural noun (no 'of').", "Unique entity 'the Internet'.", "Unique entity 'the world'."] },
      { type: 'transform', prompt: "Rewrite: 'Children who attend the private schools tend to have a better academic outcomes.'", answer: "Children who attend private schools tend to have better academic outcomes.", hints: ["Generic plural 'children' = Ø.", "Generic plural 'private schools' = Ø.", "Comparative + plural = Ø ('better academic outcomes')."] },
      { type: 'transform', prompt: "Rewrite: 'Number of students studying abroad has increased the dramatically.'", answer: "The number of students studying abroad has increased dramatically.", hints: ["'The number of' (post-modified — specific).", "'Dramatically' is an adverb — no article."] },
      { type: 'transform', prompt: "Rewrite: 'In conclusion, governments should encourage the use of renewable energies and reduce the dependence on fossil fuel.'", answer: "In conclusion, governments should encourage the use of renewable energy and reduce dependence on fossil fuels.", hints: ["Generic 'governments' = Ø (correct as is).", "'Renewable energy' is uncountable.", "'Dependence on' takes Ø.", "'Fossil fuels' (plural generic) = Ø."] },
      { type: 'transform', prompt: "Rewrite: 'A unemployment is one of biggest problems facing the modern societies.'", answer: "Unemployment is one of the biggest problems facing modern societies.", hints: ["Abstract uncountable 'unemployment' = Ø.", "'One of the' + superlative.", "Generic plural 'modern societies' = Ø."] },
      { type: 'transform', prompt: "Rewrite: 'Rise of the social media has had profound effect on a young people.'", answer: "The rise of social media has had a profound effect on young people.", hints: ["'The rise of X' (post-modified).", "'Social media' = Ø.", "First mention 'a profound effect'.", "Generic plural 'young people' = Ø."] },
      { type: 'transform', prompt: "Combine into one sentence with correct articles: 'There is poverty problem. The problem is widespread. It affects developing countries.'", answer: "Poverty is a widespread problem that affects developing countries.", hints: ["Abstract 'poverty' = Ø.", "First mention 'a widespread problem'.", "Generic plural 'developing countries' = Ø."] },
      { type: 'transform', prompt: "Rewrite: 'In a recent years, the use of smartphones has grown the rapidly.'", answer: "In recent years, the use of smartphones has grown rapidly.", hints: ["'Recent years' = generic plural = Ø.", "'The use of X' (post-modified) — keep 'the'.", "'Rapidly' is an adverb — no article."] },
      { type: 'transform', prompt: "Rewrite: 'Public transport in the cities is often more efficient than the private vehicles.'", answer: "Public transport in cities is often more efficient than private vehicles.", hints: ["'Public transport' generic = Ø.", "Generic plural 'cities' = Ø.", "Comparative with generic plural = Ø."] },
      { type: 'transform', prompt: "Rewrite: 'I think the work-life balance is essential to the happiness.'", answer: "I think work-life balance is essential to happiness.", hints: ["Abstract concept = Ø.", "Abstract 'happiness' = Ø."] },
      { type: 'transform', prompt: "Rewrite: 'The Tokyo is the one of the most populated cities in world.'", answer: "Tokyo is one of the most populated cities in the world.", hints: ["City names = Ø.", "'One of the' + superlative (no extra 'the').", "'The world' is a unique entity."] },
    ],
    apply: [
      {
        type: 'mini-task', taskType: 'S-P1',
        prompt: "Answer in 1-2 sentences: What do you do in your free time?",
        modelAnswer: "I'm a big fan of reading, especially novels by Latin American authors. On weekends, I usually head to the public library to find something new.",
        criteria: ["Articles used correctly throughout", "Mix of 'a', 'the', and zero", "Sounds natural for spoken English"],
      },
      {
        type: 'mini-task', taskType: 'S-P2',
        prompt: "Answer in 2-3 sentences: Describe a book you recently enjoyed.",
        modelAnswer: "I recently finished a novel called 'The Overstory' by Richard Powers. It's a sweeping story about the relationship between humans and trees, and it completely changed the way I look at nature. What struck me most was the depth of research behind every chapter.",
        criteria: ["'A novel' for first mention", "'The relationship between X and Y'", "Abstract 'nature' zero-article", "'The way' (fixed pattern)"],
      },
      {
        type: 'mini-task', taskType: 'W-T2',
        prompt: "Write a 2-sentence introduction to this Task 2 question: 'Some people believe that the government should provide free education for all citizens. To what extent do you agree?'",
        modelAnswer: "The question of whether governments should fully fund education for every citizen has long divided opinion. While free universal education has clear social benefits, its financial sustainability is a matter that warrants careful examination.",
        criteria: ["'The question of whether…' frame", "Generic plural 'governments' = Ø", "Abstract 'education' = Ø", "'A matter that warrants…'"],
      },
      {
        type: 'mini-task', taskType: 'W-T1',
        prompt: "Write 1 sentence describing this fictional trend: 'In 2010, traffic accidents were 50,000. In 2020, traffic accidents were 80,000.'",
        modelAnswer: "The number of traffic accidents rose substantially, climbing from 50,000 in 2010 to 80,000 in 2020.",
        criteria: ["'The number of' (post-modified)", "'Traffic accidents' generic plural", "Trend verb + preposition pattern"],
      },
      {
        type: 'mini-task', taskType: 'S-P3',
        prompt: "Answer in 2-3 sentences: Do you think the role of the family is changing in modern society?",
        modelAnswer: "I would say it definitely is. In the past, families tended to be larger and more interconnected, whereas these days the nuclear family — just parents and their children — has become the norm in most cities. That said, the emotional role of the family hasn't really changed at all.",
        criteria: ["'The role of the family' (specific concept)", "Generic plural 'families'", "'The nuclear family' (specific institution)", "'The norm', 'the past' (fixed)"],
      },
    ],
    masteryTest: {
      questionCount: 15,
      passingScore: 0.85,
      timeLimitSec: 12 * 60,
      questions: [
        // Mix of recognition (gap-fill, MCQ) + production (transform).
        { type: 'gap-fill', question: "___ poverty is one of ___ greatest challenges of our time.", answer: ["Ø", "the"], explanation: "Abstract 'poverty' = Ø. Superlative 'the greatest'." },
        { type: 'gap-fill', question: "___ rise of ___ artificial intelligence has raised ___ ethical concerns.", answer: ["The", "Ø", "Ø"], explanation: "'The rise of X' (post-modified). 'Artificial intelligence' generic = Ø. Generic plural 'ethical concerns' = Ø." },
        { type: 'mcq', question: "Choose: '___ healthcare system in my country needs significant reform.'", options: ["A", "The", "Ø", "An"], answer: 1, explanation: "Specific, post-modified by 'in my country' = 'the'." },
        { type: 'mcq', question: "Choose: 'Many ___ believe that ___ honesty is ___ best policy.'", options: ["people / the / a", "people / Ø / the", "the people / honesty / a", "Ø / Ø / the"], answer: 1, explanation: "'Many people' (generic plural). Abstract 'honesty' = Ø. Superlative 'the best'." },
        { type: 'gap-fill', question: "She wants to become ___ engineer at ___ NASA.", answer: ["an", "Ø"], explanation: "'Engineer' begins with vowel = 'an'. Acronyms read letter-by-letter starting with consonant (en) — but 'NASA' is read as a word 'nassa' starting with 'n' (consonant) … and proper-noun organisations of this form take Ø." },
        { type: 'gap-fill', question: "___ majority of ___ research suggests that ___ exercise improves ___ mental health.", answer: ["The", "Ø", "Ø", "Ø"], explanation: "'The majority of' (fixed). Three uncountable abstract nouns = Ø." },
        { type: 'transform', prompt: "Rewrite: 'In a modern world, governments must protect a environment.'", answer: "In the modern world, governments must protect the environment.", hints: ["'The modern world' is a unique generic entity.", "'The environment' is a unique generic entity."] },
        { type: 'transform', prompt: "Rewrite: 'Children of today are spending too much time on the social media.'", answer: "Children today are spending too much time on social media.", hints: ["Generic plural 'children' = Ø.", "'Social media' is generic uncountable = Ø."] },
        { type: 'transform', prompt: "Rewrite: 'Number of tourists visiting the Japan has increased the dramatically.'", answer: "The number of tourists visiting Japan has increased dramatically.", hints: ["'The number of' (post-modified).", "Country names = Ø.", "'Dramatically' is an adverb."] },
        { type: 'gap-fill', question: "He is ___ most talented student in ___ class.", answer: ["the", "the"], explanation: "Superlative 'the most'. Specific 'the class'." },
        { type: 'mcq', question: "Choose: '___ elderly often feel isolated in ___ Western societies.'", options: ["The / the", "Ø / Ø", "The / Ø", "Ø / the"], answer: 2, explanation: "'The elderly' (generic class of people). Generic plural 'Western societies' = Ø." },
        { type: 'transform', prompt: "Combine: 'I have a opinion. The opinion is about a importance of the education.'", answer: "I have an opinion about the importance of education.", hints: ["'An opinion' (vowel sound).", "'The importance of X' (post-modified).", "Abstract 'education' = Ø."] },
        { type: 'gap-fill', question: "___ Amazon rainforest is ___ largest tropical forest in ___ world.", answer: ["The", "the", "the"], explanation: "Geographic features (rainforests, rivers, oceans) take 'the'. Superlative. 'The world'." },
        { type: 'transform', prompt: "Rewrite: 'Public transport in the urban areas is often more efficient than private vehicles in countryside.'", answer: "Public transport in urban areas is often more efficient than private vehicles in the countryside.", hints: ["Generic 'urban areas' = Ø.", "'The countryside' is a unique generic entity — always 'the'."] },
        { type: 'mcq', question: "Choose: 'It is widely believed that ___ unemployment is ___ growing concern in ___ developed countries.'", options: ["the / a / the", "Ø / a / Ø", "Ø / the / Ø", "the / Ø / the"], answer: 1, explanation: "Abstract 'unemployment' = Ø. First mention countable 'a growing concern'. Generic plural 'developed countries' = Ø." },
      ],
    },
  },
};

// Helper: build a stub topic with the given metadata.
const stub = ({ id, title, tags, mins, blurb }) => ({
  id, title, tags,
  estimatedMinutes: mins,
  status: 'planned',
  blurb,
  sections: emptySections(),
});

const LEVELS = [
  {
    id: 'L1',
    name: 'Foundations',
    tagline: 'Fix the accuracy issues that cost you marks',
    estimatedHours: 12,
    topics: [
      articlesTopic,
      stub({ id: 'L1-02', title: 'Subject–Verb Agreement', tags: ['accuracy', 'W-T1', 'W-T2', 'S-all'], mins: 35, blurb: 'Singular vs. plural agreement, the tricky cases (each of, one of the X who…, collective nouns, "there is/are", "a number of vs. the number of").' }),
      stub({ id: 'L1-03', title: 'Countable vs. Uncountable Nouns', tags: ['accuracy', 'W-T2', 'S-all', 'R'], mins: 30, blurb: 'The IELTS troublemakers: information, advice, research, equipment, evidence, knowledge — when to quantify, when nouns are both.' }),
      stub({ id: 'L1-04', title: 'Dependent Prepositions', tags: ['accuracy', 'W-T2', 'S-P3', 'R'], mins: 40, blurb: 'High-frequency verb+prep / adj+prep / noun+prep combinations: depend on, suffer from, result in, aware of, similar to, increase in.' }),
      stub({ id: 'L1-05', title: 'Word Forms (Derivation)', tags: ['accuracy', 'W-T2', 'S-P3', 'R'], mins: 35, blurb: 'Noun → Verb → Adjective → Adverb families and IELTS-critical roots: economy / economic / economical / economically.' }),
      stub({ id: 'L1-06', title: 'Basic Tense Accuracy', tags: ['accuracy', 'W-T1', 'W-T2', 'S-all'], mins: 45, blurb: 'Present simple vs. continuous (states vs. actions), past simple vs. present perfect — the #1 tense error.' }),
      stub({ id: 'L1-07', title: 'Punctuation', tags: ['accuracy', 'W-T1', 'W-T2'], mins: 25, blurb: 'Comma splices, semicolons for related clauses, apostrophes, commas with subordinate clauses.' }),
      stub({ id: 'L1-08', title: 'Word Order', tags: ['accuracy', 'W-T2', 'S-all'], mins: 30, blurb: 'Adjective order, adverb placement, question formation, indirect questions, phrasal verb object placement.' }),
    ],
  },
  {
    id: 'L2',
    name: 'Building Complexity',
    tagline: 'Move from simple to confidently mixed sentence types — Band 6 → 7',
    estimatedHours: 18,
    topics: [
      stub({ id: 'L2-01', title: 'Subordinate Clauses (Adverbial)', tags: ['range', 'W-T2', 'S-P3'], mins: 45, blurb: 'Contrast, reason, purpose, result, time, condition — the connective backbone of complex sentences.' }),
      stub({ id: 'L2-02', title: 'Relative Clauses', tags: ['range', 'W-T2', 'S-P3', 'R'], mins: 45, blurb: 'Defining vs. non-defining, the comma rule, pronoun choice, prepositions in relative clauses.' }),
      stub({ id: 'L2-03', title: 'Reduced Relative Clauses', tags: ['range', 'W-T2', 'S-P3', 'R'], mins: 40, blurb: '"People living in cities…" / "The policy introduced last year…" — a huge marker of advanced writing.' }),
      stub({ id: 'L2-04', title: 'Conditionals — Full System', tags: ['range', 'W-T2', 'S-P3'], mins: 50, blurb: 'Zero, first, second, third, and mixed conditionals — plus alternatives to "if" (unless, provided that, suppose).' }),
      stub({ id: 'L2-05', title: 'Passive Voice', tags: ['range', 'W-T1', 'W-T2', 'R'], mins: 45, blurb: 'All tenses, when to use passive, reporting passives, get-passive, causative (have/get something done).' }),
      stub({ id: 'L2-06', title: 'Perfect Aspects', tags: ['range', 'W-T2', 'S-all'], mins: 50, blurb: 'Present perfect vs. past simple (the deepest tense issue), past perfect, future perfect.' }),
      stub({ id: 'L2-07', title: 'Gerunds and Infinitives', tags: ['range', 'W-T2', 'S-all'], mins: 40, blurb: 'Verb + gerund, verb + infinitive, verbs with both (meaning changes), preposition + gerund.' }),
      stub({ id: 'L2-08', title: 'Modals — Core', tags: ['range', 'W-T2', 'S-all'], mins: 35, blurb: 'Ability, permission, obligation, possibility, deduction — and how the past forms work.' }),
    ],
  },
  {
    id: 'L3',
    name: 'Academic Register',
    tagline: 'The Band 7 → 8 leap — sound like an academic writer',
    estimatedHours: 18,
    topics: [
      stub({ id: 'L3-01', title: 'Nominalisation', tags: ['range', 'W-T1', 'W-T2'], mins: 50, blurb: 'The single biggest Band 8 marker. "Governments increased taxes" → "The increase in taxation by governments."' }),
      stub({ id: 'L3-02', title: 'Hedging and Stance Markers', tags: ['range', 'W-T2', 'S-P3'], mins: 40, blurb: 'Probability, frequency, quantity, certainty, distancing — Band 8 writing avoids absolutes.' }),
      stub({ id: 'L3-03', title: 'Advanced Cohesive Devices', tags: ['range', 'W-T2'], mins: 40, blurb: 'Addition, contrast, cause/effect, exemplification, concession, summary — beyond "however" and "moreover".' }),
      stub({ id: 'L3-04', title: 'Advanced Comparatives and Quantifiers', tags: ['range', 'W-T1'], mins: 35, blurb: 'Significantly higher than, nowhere near as… as, the vast majority, the more… the more — critical for Task 1.' }),
      stub({ id: 'L3-05', title: 'Reporting Verbs', tags: ['range', 'W-T2', 'R'], mins: 35, blurb: 'Beyond say/tell — argue, claim, contend, suggest, acknowledge, dispute, with their grammatical patterns.' }),
      stub({ id: 'L3-06', title: 'Cause and Effect Range', tags: ['range', 'W-T2'], mins: 30, blurb: 'Owing to, in light of, stem from, give rise to, culminate in, engender — beyond "because".' }),
      stub({ id: 'L3-07', title: 'Emphasis Structures (Lite)', tags: ['range', 'W-T2'], mins: 30, blurb: 'It-clefts and wh-clefts: "It is education that determines outcomes." / "What governments must do is invest."' }),
      stub({ id: 'L3-08', title: 'Articles in Academic Context', tags: ['accuracy', 'W-T1', 'W-T2'], mins: 30, blurb: 'Generic "the" (the elderly, the rich), "the" with abstract trends (the rise of social media), Task 1 captions.' }),
    ],
  },
  {
    id: 'L4',
    name: 'Sophistication',
    tagline: 'Band 8+ markers — use sparingly, but use them',
    estimatedHours: 12,
    topics: [
      stub({ id: 'L4-01', title: 'Inversion for Emphasis', tags: ['sophistication', 'W-T2'], mins: 35, blurb: '"Not only does pollution…", "Rarely has a policy…", "Only by addressing…" — use 1-2 per essay max.' }),
      stub({ id: 'L4-02', title: 'Cleft Sentences (Advanced)', tags: ['sophistication', 'W-T2', 'S-P3'], mins: 35, blurb: 'It-clefts ("It was not until…"), wh-clefts ("What is needed is…"), all-clefts ("All that matters is…").' }),
      stub({ id: 'L4-03', title: 'Participle Clauses (Advanced)', tags: ['sophistication', 'W-T2'], mins: 40, blurb: '"Living in a rural area…", "Faced with rising costs…", "Having considered both sides…"' }),
      stub({ id: 'L4-04', title: 'Inverted Conditionals', tags: ['sophistication', 'W-T2'], mins: 30, blurb: '"Were governments to invest…", "Had the policy been implemented…", "Should the trend continue…"' }),
      stub({ id: 'L4-05', title: 'Subjunctive', tags: ['sophistication', 'W-T2'], mins: 30, blurb: 'Mandative subjunctive ("It is essential that he be…"), wish / if only, "It\'s (high) time + past simple".' }),
      stub({ id: 'L4-06', title: 'Advanced Modal Constructions', tags: ['sophistication', 'W-T2', 'S-P3'], mins: 30, blurb: 'Perfect modals (should have done, must have been), be supposed to / meant to / bound to / due to.' }),
      stub({ id: 'L4-07', title: 'Discourse-Level Cohesion', tags: ['sophistication', 'W-T2'], mins: 30, blurb: 'Theme/rheme progression, old → new info, "this/these" + summary noun, sentence-initial adverbials.' }),
      stub({ id: 'L4-08', title: 'Stylistic Range', tags: ['sophistication', 'W-T2'], mins: 25, blurb: 'Sentence variety, strategic fragments, parallel structures — the rhythm of a Band 8+ essay.' }),
    ],
  },
];

// -----------------------------------------------------------------------------
// TASK-SPECIFIC TRACKS
// -----------------------------------------------------------------------------

const TASK_TRACKS = [
  {
    id: 'TT-W1',
    name: 'Writing Task 1 Language Pack',
    tagline: 'Describe graphs, charts, processes, maps, tables',
    iconName: 'trending',
    modules: [
      { title: 'Trend verbs',           items: ['rose', 'climbed', 'surged', 'soared', 'plummeted', 'plunged', 'dipped', 'fluctuated', 'stabilised', 'levelled off', 'plateaued', 'peaked'] },
      { title: 'Trend adverbs',         items: ['sharply', 'dramatically', 'significantly', 'considerably', 'marginally', 'slightly', 'gradually', 'steadily'] },
      { title: 'Noun forms of trends',  items: ['a sharp rise', 'a steady decline', 'a marginal increase', 'a dramatic fluctuation'] },
      { title: 'Comparison language',   items: ['compared to', 'in contrast with', 'while', 'whereas', 'by comparison', 'conversely'] },
      { title: 'Approximation',         items: ['approximately', 'roughly', 'just under / over', 'slightly more / less than', 'in the region of'] },
      { title: 'Time markers',          items: ['over the period', 'throughout the decade', 'between X and Y', 'from X onwards'] },
      { title: 'Process language (passive)', items: ['is filtered', 'is then heated', 'is subsequently transferred to', 'after which it is…'] },
      { title: 'Sequencing',            items: ['initially', 'in the first stage', 'following this', 'subsequently', 'at this point', 'finally'] },
      { title: 'Map description',       items: ['located to the north of', 'situated adjacent to', 'demolished', 'redeveloped', 'expanded'] },
      { title: 'Overview phrasing',     items: ['Overall, it is clear that…', 'The most striking feature is…', 'The data reveals that…'] },
    ],
  },
  {
    id: 'TT-W2',
    name: 'Writing Task 2 Language Pack',
    tagline: 'Essay structures and argument language',
    iconName: 'pen',
    modules: [
      { title: 'Introduction frames',   items: ['The question of whether… has long been debated…', 'In recent years, … has become an increasingly contentious issue…'] },
      { title: 'Thesis statements',     items: ['This essay will argue that…', 'While there are arguments on both sides, I firmly believe that…'] },
      { title: 'Opinion phrases (formal)', items: ['In my view, …', 'From my perspective, …', 'It is my contention that…', 'I would argue that…'] },
      { title: 'Concession',            items: ['While it is true that…', 'Admittedly, …', 'It cannot be denied that…'] },
      { title: 'Counter-argument',      items: ['However, this view overlooks…', 'Despite this, …', 'Nevertheless, …'] },
      { title: 'Adding examples',       items: ['For instance, …', 'A case in point is…', 'This is exemplified by…'] },
      { title: 'Hedging claims',        items: ['This may suggest that…', 'It could be argued that…', 'There is a tendency for…'] },
      { title: 'Cause/effect chains',   items: ['This, in turn, leads to…', 'The knock-on effect is…', 'This phenomenon gives rise to…'] },
      { title: 'Conclusion frames',     items: ['In conclusion, while … it is clear that…', 'To sum up, although both sides have merit, …'] },
    ],
  },
  {
    id: 'TT-S',
    name: 'Speaking Fluency Structures',
    tagline: 'Natural spoken grammar — high Grammatical Range without sounding written',
    iconName: 'mic',
    modules: [
      { title: 'Part 1 patterns',       items: ['Present simple for routines', 'used to + V for past habits', 'would + V for past routines'] },
      { title: 'Part 2 narrative',      items: ['Past continuous (backdrop) + past simple (events)', 'Past perfect for prior context', 'While I was -ing, suddenly…'] },
      { title: 'Part 3 speculation',    items: ['It depends on…', 'I would imagine that…', 'It\'s likely that…', 'If we look at…', 'Were this to happen…'] },
      { title: 'Fillers (natural)',     items: ['Well, …', 'I mean, …', 'The thing is, …', 'Actually, …', 'To be honest, …', 'What I\'d say is…'] },
      { title: 'Opinion softeners',     items: ['I tend to think…', 'I\'d say…', 'If you ask me…', 'From my point of view…'] },
      { title: 'Idiomatic structures',  items: ['I\'m into…', 'I\'m a big fan of…', 'It\'s not really my cup of tea', 'I can\'t get enough of…'] },
      { title: 'Conditionals in Speaking', items: ['Real conditionals for likely futures', 'Second conditional for hypotheticals'] },
      { title: 'Speculation about past', items: ['It must have been…', 'They might have…', 'I suppose it would have…'] },
      { title: 'Past vs. present',      items: ['These days, … whereas in the past, …', 'Compared to when I was younger…'] },
    ],
  },
  {
    id: 'TT-LR',
    name: 'Listening & Reading Grammar',
    tagline: 'Recognition-focused — grammar that affects comprehension',
    iconName: 'book',
    modules: [
      { title: 'Paraphrase patterns',   items: ['Active ↔ passive', 'Noun ↔ verb forms', 'Synonym + structural shift'] },
      { title: 'Negation traps',        items: ['hardly', 'scarcely', 'barely', 'by no means', 'far from', 'anything but'] },
      { title: 'Quantifier traps (TFNG)', items: ['most vs. all', 'often vs. always', 'may vs. will'] },
      { title: 'Reference resolution',  items: ['Tracking what this / that / such / these refers to'] },
      { title: 'Reduced clauses (recognition)', items: ['Spotting reduced relatives in dense passages'] },
      { title: 'Linking-word logic',    items: ['Cause/effect, contrast, concession markers as signals'] },
      { title: 'Numbers and dates',     items: ['Fractions, decimals, ratios, percentages, ordinals'] },
      { title: 'Spelling patterns',     items: ['Double consonants, silent letters, common IELTS misspellings'] },
    ],
  },
];

export const grammarCurriculum = { levels: LEVELS, taskTracks: TASK_TRACKS };

// Convenience lookup — flat map of topic-id → { topic, levelId, levelName }.
export const TOPIC_INDEX = (() => {
  const idx = {};
  LEVELS.forEach(level => {
    level.topics.forEach(topic => {
      idx[topic.id] = { topic, levelId: level.id, levelName: level.name };
    });
  });
  return idx;
})();
