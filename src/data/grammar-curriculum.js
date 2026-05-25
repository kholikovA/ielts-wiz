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
      {
        id: 'L1-02',
        title: 'Subject–Verb Agreement',
        tags: ['accuracy', 'W-T1', 'W-T2', 'S-all'],
        estimatedMinutes: 35,
        status: 'ready',
        blurb: 'Singular vs. plural agreement, the tricky cases (each of, one of the X who…, collective nouns, "there is/are", "a number of vs. the number of").',
        sections: {
          notice: {
            heading: 'Notice the structure',
            examples: [
              {
                text: "The number of international students at British universities has risen sharply over the past decade.",
                highlights: ["The number of", "has risen"],
                note: "'The number of X' is always singular — the head of the subject is 'number', not 'students'.",
              },
              {
                text: "A number of governments have introduced strict regulations on carbon emissions.",
                highlights: ["A number of", "have introduced"],
                note: "'A number of X' means 'several X' and is always plural — opposite to 'the number of'.",
              },
              {
                text: "Each of the proposed solutions has its own drawbacks.",
                highlights: ["Each of", "has"],
                note: "'Each of + plural noun' takes a singular verb. 'Each' is the grammatical subject.",
              },
              {
                text: "There are several reasons why people choose to migrate to urban areas.",
                highlights: ["There are", "reasons"],
                note: "With 'there is/are', the verb agrees with the noun that follows — here, the plural 'reasons'.",
              },
              {
                text: "The government is planning to invest more heavily in renewable energy this year.",
                highlights: ["The government", "is planning"],
                note: "Collective nouns (government, team, committee, family) in British English typically take a singular verb when acting as one unit.",
              },
              {
                text: "She is one of the few candidates who have passed every module on the first attempt.",
                highlights: ["one of the few candidates who", "have passed"],
                note: "In 'one of the X who…', the verb in the relative clause agrees with the plural noun (candidates), not 'one'.",
              },
            ],
          },
          understand: {
            rules: [
              {
                rule: "A singular subject takes a singular verb; a plural subject takes a plural verb. The verb agrees with the head of the subject phrase, not the nearest noun.",
                examples: ["The impact of new technologies is significant.", "The benefits of regular exercise are well documented."],
              },
              {
                rule: "'The number of + plural noun' is singular. 'A number of + plural noun' is plural.",
                examples: ["The number of cars on the road has doubled.", "A number of policies have failed to address the issue."],
              },
              {
                rule: "Indefinite pronouns like each, every, either, neither, one, somebody, everyone are singular — even when followed by 'of + plural noun'.",
                examples: ["Each of the students is required to submit an essay.", "Neither of the proposals offers a clear solution."],
              },
              {
                rule: "With 'there is/are', the verb agrees with the noun that follows it.",
                examples: ["There is a growing concern about climate change.", "There are many factors contributing to obesity."],
              },
              {
                rule: "Collective nouns (government, team, family, committee, public, staff) take a singular verb when treated as a unit; a plural verb when emphasising individual members (more common in British English).",
                examples: ["The committee has reached a decision.", "The team are arguing among themselves."],
              },
              {
                rule: "In 'one of the X who/that…', the relative clause verb is plural because it agrees with the plural noun, not with 'one'.",
                examples: ["He is one of the few politicians who genuinely care about the environment.", "This is one of the issues that need urgent attention."],
              },
            ],
            formBox: {
              title: 'Form',
              rows: [
                ['Singular subject + V-s', 'The government provides…'],
                ['Plural subject + V (base)', 'Governments provide…'],
                ['Each / Every / One of the + plural N + V-s', 'Each of the students has…'],
                ['A number of + plural N + V (base)', 'A number of factors contribute…'],
                ['The number of + plural N + V-s', 'The number of factors is…'],
              ],
            },
            useBox: {
              title: 'When to use which',
              rows: [
                ['Subject = abstract uncountable (information, advice)', 'Singular verb'],
                ['Subject = each / every / one of', 'Singular verb'],
                ['Subject = a number of / many of / several of', 'Plural verb'],
                ['Subject = the number of / the amount of', 'Singular verb'],
                ['Subject = neither/either of + plural', 'Singular verb (formal)'],
                ['Subject = collective noun acting as one unit', 'Singular verb (British formal)'],
              ],
            },
          },
          commonMistakes: [
            {
              wrong: "The number of tourists are increasing every year.",
              right: "The number of tourists is increasing every year.",
              explanation: "'The number of' is always singular — 'number' is the head noun, not 'tourists'.",
            },
            {
              wrong: "A number of studies shows that pollution affects mental health.",
              right: "A number of studies show that pollution affects mental health.",
              explanation: "'A number of X' means 'several X' and is plural.",
            },
            {
              wrong: "Each of the proposed measures have its own limitations.",
              right: "Each of the proposed measures has its own limitations.",
              explanation: "'Each of + plural noun' takes a singular verb.",
            },
            {
              wrong: "There is many advantages to studying abroad.",
              right: "There are many advantages to studying abroad.",
              explanation: "'There is/are' agrees with the noun that follows — here, the plural 'advantages'.",
            },
            {
              wrong: "Information about scholarships are available on the website.",
              right: "Information about scholarships is available on the website.",
              explanation: "'Information' is uncountable and singular — the verb agrees with it, not with 'scholarships'.",
            },
            {
              wrong: "She is one of the few researchers who has studied this phenomenon.",
              right: "She is one of the few researchers who have studied this phenomenon.",
              explanation: "In 'one of the X who…', the verb agrees with the plural noun (researchers).",
            },
            {
              wrong: "Neither of the policies have been successful.",
              right: "Neither of the policies has been successful.",
              explanation: "'Neither of' takes a singular verb in formal academic writing.",
            },
            {
              wrong: "The government are planning to raise taxes.",
              right: "The government is planning to raise taxes.",
              explanation: "Collective nouns acting as a unit are typically singular in IELTS writing.",
            },
            {
              wrong: "Twenty per cent of the population live below the poverty line.",
              right: "Twenty per cent of the population lives below the poverty line.",
              explanation: "With 'X per cent of + singular/uncountable noun', the verb is singular (population is treated as a unit here).",
            },
            {
              wrong: "Statistics shows that the unemployment rate is falling.",
              right: "Statistics show that the unemployment rate is falling.",
              explanation: "'Statistics' (data) is plural. ('Statistics' meaning the subject is singular: 'Statistics is a difficult subject.')",
            },
          ],
          practise: [
            { type: 'gap-fill', question: "The number of students enrolling in online courses ___ (have/has) grown rapidly.", answer: ["has"], explanation: "'The number of' is singular." },
            { type: 'gap-fill', question: "A number of countries ___ (have/has) banned single-use plastics.", answer: ["have"], explanation: "'A number of' is plural." },
            { type: 'gap-fill', question: "Each of the proposed reforms ___ (have/has) significant implications.", answer: ["has"], explanation: "'Each of' takes a singular verb." },
            { type: 'gap-fill', question: "There ___ (is/are) several reasons for the decline in birth rates.", answer: ["are"], explanation: "Verb agrees with plural 'reasons'." },
            { type: 'gap-fill', question: "Information about the new policy ___ (is/are) available on the government website.", answer: ["is"], explanation: "'Information' is uncountable singular." },
            { type: 'gap-fill', question: "He is one of the few politicians who ___ (admit/admits) past mistakes.", answer: ["admit"], explanation: "Relative verb agrees with plural 'politicians'." },
            { type: 'gap-fill', question: "Neither of the candidates ___ (have/has) addressed the housing crisis adequately.", answer: ["has"], explanation: "'Neither of' is singular in formal writing." },
            { type: 'gap-fill', question: "The committee ___ (is/are) expected to publish its report next month.", answer: ["is"], explanation: "Collective noun acting as a unit (note 'its')." },
            { type: 'gap-fill', question: "Research into renewable energy ___ (suggest/suggests) that solar power could replace fossil fuels.", answer: ["suggests"], explanation: "'Research' is uncountable singular." },
            { type: 'gap-fill', question: "Statistics ___ (show/shows) that women now outnumber men in higher education.", answer: ["show"], explanation: "'Statistics' (data) is plural." },
            { type: 'mcq', question: "Choose the correct verb: 'The impact of social media on teenagers ___ widely debated.'", options: ["are", "is", "have", "were"], answer: 1, explanation: "The head of the subject is 'impact' (singular), not 'teenagers'." },
            { type: 'mcq', question: "Choose: 'Every student in these classes ___ a laptop.'", options: ["need", "needs", "are needing", "have"], answer: 1, explanation: "'Every + singular noun' takes a singular verb." },
            { type: 'mcq', question: "Choose: 'The majority of young people ___ smartphones daily.'", options: ["uses", "use", "is using", "has used"], answer: 1, explanation: "'The majority of + plural noun' takes a plural verb (members are emphasised)." },
            { type: 'mcq', question: "Choose: 'There ___ a number of factors that contribute to obesity.'", options: ["is", "are", "has", "have"], answer: 1, explanation: "'A number of factors' is plural; verb agrees with that." },
            { type: 'mcq', question: "Choose: 'Evidence from recent studies ___ that exercise improves cognitive function.'", options: ["suggest", "suggests", "are suggesting", "have suggested"], answer: 1, explanation: "'Evidence' is uncountable singular." },
            { type: 'gap-fill', question: "Twenty per cent of the workforce ___ (is/are) employed in the service sector.", answer: ["is"], explanation: "Percent + uncountable/collective singular noun = singular." },
            { type: 'gap-fill', question: "Most of the data ___ (was/were) collected through interviews.", answer: ["was"], explanation: "In modern usage, 'data' as a body of information is often treated as singular." },
            { type: 'gap-fill', question: "Either coal or natural gas ___ (is/are) likely to remain the dominant energy source.", answer: ["is"], explanation: "With 'either…or', the verb agrees with the nearer noun ('gas' = singular)." },
            { type: 'gap-fill', question: "Neither the teacher nor the students ___ (was/were) aware of the change.", answer: ["were"], explanation: "With 'neither…nor', the verb agrees with the nearer noun ('students' = plural)." },
            { type: 'gap-fill', question: "The economic and social impact of unemployment ___ (is/are) far-reaching.", answer: ["is"], explanation: "'Impact' is singular; both adjectives modify the same noun." },
          ],
          produce: [
            { type: 'transform', prompt: "Fix the agreement error: 'The number of accidents on motorways have decreased significantly.'", answer: "The number of accidents on motorways has decreased significantly.", hints: ["'The number of' = singular", "Verb agrees with 'number'."] },
            { type: 'transform', prompt: "Fix: 'A number of factors contributes to climate change.'", answer: "A number of factors contribute to climate change.", hints: ["'A number of' = plural", "Verb agrees with the plural noun."] },
            { type: 'transform', prompt: "Fix: 'Each of the proposals have its own merits.'", answer: "Each of the proposals has its own merits.", hints: ["'Each of' = singular", "Use singular 'has'."] },
            { type: 'transform', prompt: "Fix: 'There is many advantages to working from home.'", answer: "There are many advantages to working from home.", hints: ["Verb agrees with plural 'advantages'.", "Use 'There are'."] },
            { type: 'transform', prompt: "Fix: 'Information about visa requirements are listed below.'", answer: "Information about visa requirements is listed below.", hints: ["'Information' is uncountable singular.", "Use 'is'."] },
            { type: 'transform', prompt: "Fix: 'She is one of the few experts who studies ancient languages.'", answer: "She is one of the few experts who study ancient languages.", hints: ["'One of the X who…' = plural verb.", "Use 'study'."] },
            { type: 'transform', prompt: "Fix: 'Neither of the solutions have been tested properly.'", answer: "Neither of the solutions has been tested properly.", hints: ["'Neither of' = singular (formal).", "Use 'has'."] },
            { type: 'transform', prompt: "Fix: 'Research show that pollution causes respiratory diseases.'", answer: "Research shows that pollution causes respiratory diseases.", hints: ["'Research' is uncountable singular.", "Use 'shows'."] },
            { type: 'transform', prompt: "Fix: 'The government are responsible for ensuring public safety.'", answer: "The government is responsible for ensuring public safety.", hints: ["Collective noun acting as a unit.", "Singular in formal writing."] },
            { type: 'transform', prompt: "Fix: 'Statistics shows that obesity rates are rising worldwide.'", answer: "Statistics show that obesity rates are rising worldwide.", hints: ["'Statistics' (data) = plural.", "Use 'show'."] },
            { type: 'transform', prompt: "Fix: 'Twenty per cent of the population live in poverty.'", answer: "Twenty per cent of the population lives in poverty.", hints: ["% + singular collective noun = singular.", "Use 'lives'."] },
            { type: 'transform', prompt: "Fix: 'The benefits of regular exercise is well established.'", answer: "The benefits of regular exercise are well established.", hints: ["The subject is plural 'benefits'.", "Verb agrees with the head noun."] },
            { type: 'transform', prompt: "Combine using 'There + verb': 'Several reasons. They explain the housing crisis.'", answer: "There are several reasons that explain the housing crisis.", hints: ["Use 'there are' for plural.", "Add a relative clause with 'that'."] },
            { type: 'transform', prompt: "Combine: 'Many students. They struggle with academic vocabulary.'", answer: "Many students struggle with academic vocabulary.", hints: ["'Many + plural noun' = plural verb.", "Use base form 'struggle'."] },
            { type: 'transform', prompt: "Fix: 'The amount of plastic waste produced each year are alarming.'", answer: "The amount of plastic waste produced each year is alarming.", hints: ["'The amount of' = singular.", "Use 'is'."] },
          ],
          apply: [
            {
              type: 'mini-task', taskType: 'W-T1',
              prompt: "Write 1 sentence describing this trend: 'In 2010, the number of electric cars sold in Europe was 5,000. In 2020, it was 800,000.'",
              modelAnswer: "The number of electric cars sold in Europe rose dramatically, climbing from 5,000 in 2010 to 800,000 in 2020.",
              criteria: ["'The number of' + singular verb ('rose')", "Trend verb + adverb", "Accurate figures with prepositions"],
            },
            {
              type: 'mini-task', taskType: 'W-T2',
              prompt: "Write a 2-sentence introduction to: 'Many people believe that the government should be responsible for citizens' health. To what extent do you agree?'",
              modelAnswer: "There is a long-standing debate about how far governments should be involved in safeguarding the health of their citizens. While state-funded healthcare has clear social benefits, the question of whether full responsibility ought to rest with the government is far from settled.",
              criteria: ["'There is + singular noun'", "Plural 'governments' + plural verb", "Collective 'the government' + singular verb (later)", "Accurate agreement throughout"],
            },
            {
              type: 'mini-task', taskType: 'S-P3',
              prompt: "Answer in 2-3 sentences: Do you think the number of people using public transport will increase in the future?",
              modelAnswer: "I think the number of people using public transport is definitely going to grow, especially in cities where congestion is becoming unmanageable. A number of governments have already started investing in better metro networks, and that's likely to encourage more people to leave their cars at home.",
              criteria: ["'The number of' + singular verb", "'A number of' + plural verb", "Natural spoken hedging"],
            },
            {
              type: 'mini-task', taskType: 'S-P2',
              prompt: "Answer in 2-3 sentences: Describe a problem in your local area.",
              modelAnswer: "One of the biggest issues we have at the moment is traffic congestion, particularly during rush hour. Each of the main roads into the city centre gets completely blocked, and there are very few alternatives for commuters who don't want to drive.",
              criteria: ["'One of the + plural N + V'", "'Each of + plural N + sing. V'", "'There are + plural N'"],
            },
            {
              type: 'mini-task', taskType: 'W-T2',
              prompt: "Write 2 sentences arguing that 'Working from home benefits society'.",
              modelAnswer: "A number of recent studies have shown that working from home reduces commuter traffic and lowers carbon emissions. In addition, the number of employees reporting higher job satisfaction has risen sharply since flexible arrangements became widespread.",
              criteria: ["'A number of' + plural verb", "'The number of' + singular verb", "Both used contrastively in one passage"],
            },
          ],
          masteryTest: {
            questionCount: 15,
            passingScore: 0.85,
            timeLimitSec: 12 * 60,
            questions: [
              { type: 'gap-fill', question: "The number of women in senior management positions ___ (have/has) increased over the past decade.", answer: ["has"], explanation: "'The number of' = singular." },
              { type: 'gap-fill', question: "A number of researchers ___ (have/has) questioned the validity of the study.", answer: ["have"], explanation: "'A number of' = plural." },
              { type: 'gap-fill', question: "Each of these issues ___ (require/requires) careful consideration.", answer: ["requires"], explanation: "'Each of' = singular." },
              { type: 'gap-fill', question: "There ___ (is/are) numerous factors influencing student performance.", answer: ["are"], explanation: "Verb agrees with plural 'factors'." },
              { type: 'gap-fill', question: "Evidence from recent surveys ___ (suggest/suggests) a shift in attitudes.", answer: ["suggests"], explanation: "'Evidence' is uncountable singular." },
              { type: 'gap-fill', question: "Neither of the proposed solutions ___ (address/addresses) the root cause.", answer: ["addresses"], explanation: "'Neither of' = singular (formal)." },
              { type: 'mcq', question: "Choose: 'The committee ___ unable to reach a unanimous decision.'", options: ["were", "was", "are", "have been"], answer: 1, explanation: "Collective noun acting as a unit = singular." },
              { type: 'mcq', question: "Choose: 'Statistics ___ that obesity is on the rise globally.'", options: ["shows", "show", "is showing", "has shown"], answer: 1, explanation: "'Statistics' (data) = plural." },
              { type: 'mcq', question: "Choose: 'He is one of the few authors who ___ multiple languages.'", options: ["writes", "write", "is writing", "has written"], answer: 1, explanation: "'One of the X who…' = plural verb." },
              { type: 'mcq', question: "Choose: 'The impact of automation on jobs ___ a topic of widespread concern.'", options: ["are", "is", "have been", "were"], answer: 1, explanation: "Head noun 'impact' = singular." },
              { type: 'transform', prompt: "Fix: 'The number of cyclists in the city have tripled since 2015.'", answer: "The number of cyclists in the city has tripled since 2015.", hints: ["'The number of' = singular.", "Use 'has'."] },
              { type: 'transform', prompt: "Fix: 'A number of factors contributes to academic success.'", answer: "A number of factors contribute to academic success.", hints: ["'A number of' = plural.", "Use 'contribute'."] },
              { type: 'transform', prompt: "Fix: 'There is many people who oppose the new tax.'", answer: "There are many people who oppose the new tax.", hints: ["Verb agrees with plural 'people'.", "Use 'There are'."] },
              { type: 'transform', prompt: "Fix: 'Each of the participants were given a questionnaire.'", answer: "Each of the participants was given a questionnaire.", hints: ["'Each of' = singular.", "Use 'was'."] },
              { type: 'transform', prompt: "Fix: 'Research into the effects of pollution show that air quality is worsening.'", answer: "Research into the effects of pollution shows that air quality is worsening.", hints: ["'Research' is uncountable singular.", "Use 'shows'."] },
            ],
          },
        },
      },
      {
        id: 'L1-03',
        title: 'Countable vs. Uncountable Nouns',
        tags: ['accuracy', 'W-T2', 'S-all', 'R'],
        estimatedMinutes: 30,
        status: 'ready',
        blurb: 'The IELTS troublemakers: information, advice, research, equipment, evidence, knowledge — when to quantify, when nouns are both.',
        sections: {
          notice: {
            heading: 'Notice the structure',
            examples: [
              {
                text: "The teacher gave us some useful information about the upcoming exam.",
                highlights: ["some useful information"],
                note: "'Information' is uncountable in English — never 'informations' and never 'an information'. Use quantifiers like some, much, a piece of, a great deal of.",
              },
              {
                text: "Most experts agree that further research is needed in this area.",
                highlights: ["research", "is needed"],
                note: "'Research' is uncountable. Singular verb. To count, say 'a piece of research' or 'a study'.",
              },
              {
                text: "Modern laboratories require expensive equipment to carry out advanced experiments.",
                highlights: ["equipment", "experiments"],
                note: "'Equipment' is uncountable (no 'equipments'). 'Experiments' is countable and plural here.",
              },
              {
                text: "There is little evidence to suggest that strict punishment reduces crime.",
                highlights: ["little evidence"],
                note: "'Evidence' is uncountable. Use 'little', 'much', 'a piece of evidence'.",
              },
              {
                text: "Studying abroad gave me a wealth of experience that I could never have gained at home.",
                highlights: ["a wealth of experience"],
                note: "'Experience' as an uncountable abstract noun = general experience in life/work.",
              },
              {
                text: "I had some unforgettable experiences during my year in Japan.",
                highlights: ["some unforgettable experiences"],
                note: "'Experiences' as a countable noun = individual events/episodes. Same noun, two different meanings!",
              },
            ],
          },
          understand: {
            rules: [
              {
                rule: "Uncountable nouns have no plural form and cannot be used with 'a/an'. They take a singular verb.",
                examples: ["Information is useful.", "Advice is appreciated.", "Furniture is expensive."],
              },
              {
                rule: "To quantify uncountable nouns, use 'a piece of', 'an item of', 'a bit of', or specific units (a litre of, a kilo of).",
                examples: ["a piece of advice", "an item of clothing", "two pieces of luggage", "a bottle of water"],
              },
              {
                rule: "IELTS troublemakers that are ALWAYS uncountable: information, advice, research, equipment, evidence, knowledge, news, furniture, traffic, accommodation, machinery, luggage, baggage, vocabulary, progress, scenery, weather.",
                examples: ["The research suggests…", "Her vocabulary is impressive.", "The scenery was breathtaking."],
              },
              {
                rule: "Some nouns are countable AND uncountable, with different meanings: experience, paper, time, work, room, glass, light, business, hair.",
                examples: ["Paper (material) vs. a paper (an academic article)", "Time (concept) vs. three times (occasions)", "Work (job/task) vs. a work (an artwork)"],
              },
              {
                rule: "Use 'much' / 'little' / 'a great deal of' with uncountables; 'many' / 'few' / 'a great number of' with countables. 'A lot of' / 'plenty of' work with both.",
                examples: ["much pollution / many cars", "little progress / few opportunities", "a lot of traffic / a lot of vehicles"],
              },
              {
                rule: "Abstract nouns ending in -ment, -ity, -ness, -tion are often uncountable (development, equality, happiness, education) — but some are countable (decision, opinion, suggestion).",
                examples: ["Equality is essential.", "Happiness depends on health.", "She made a wise decision."],
              },
            ],
            formBox: {
              title: 'Form',
              rows: [
                ['Countable singular', 'a problem, the issue, one country'],
                ['Countable plural', 'problems, issues, countries'],
                ['Uncountable', 'information, advice, research (no plural, no a/an)'],
                ['Quantifying uncountable', 'a piece of advice, much information, little progress'],
                ['Both: meaning shifts', 'experience (uncount.) / experiences (count.)'],
              ],
            },
            useBox: {
              title: 'When to use which',
              rows: [
                ['Quantifying with much/little', 'Uncountable only'],
                ['Quantifying with many/few', 'Countable plural only'],
                ['Quantifying with some/any/a lot of', 'Both'],
                ['First mention of one thing', 'a/an (countable) or Ø (uncountable)'],
                ['General/abstract concept', 'Usually uncountable + Ø article'],
                ['Specific instance/episode', 'Often countable (an experience, a study)'],
              ],
            },
          },
          commonMistakes: [
            {
              wrong: "The teacher gave me many useful informations.",
              right: "The teacher gave me a lot of useful information.",
              explanation: "'Information' is always uncountable — no plural, no 'many'.",
            },
            {
              wrong: "I need an advice about my essay.",
              right: "I need some advice about my essay. / I need a piece of advice…",
              explanation: "'Advice' is uncountable — never 'an advice' or 'advices'.",
            },
            {
              wrong: "Researchers have done many researches into this topic.",
              right: "Researchers have carried out a lot of research into this topic.",
              explanation: "'Research' is uncountable. To count, use 'studies' or 'pieces of research'.",
            },
            {
              wrong: "The school provides modern equipments for science classes.",
              right: "The school provides modern equipment for science classes.",
              explanation: "'Equipment' is uncountable — no plural form.",
            },
            {
              wrong: "There are many evidences to support this claim.",
              right: "There is a lot of evidence to support this claim.",
              explanation: "'Evidence' is uncountable. Use 'a great deal of evidence' or 'pieces of evidence'.",
            },
            {
              wrong: "She has a wide knowledges of literature.",
              right: "She has a wide knowledge of literature.",
              explanation: "'Knowledge' is uncountable. 'A wide knowledge of X' is a fixed academic phrase.",
            },
            {
              wrong: "I watched the news on TV. They were depressing.",
              right: "I watched the news on TV. It was depressing.",
              explanation: "'News' looks plural but is uncountable singular. Use 'it' and singular verbs.",
            },
            {
              wrong: "We bought new furnitures for the living room.",
              right: "We bought new furniture for the living room.",
              explanation: "'Furniture' is uncountable. To count, say 'pieces of furniture'.",
            },
            {
              wrong: "The traffic in big cities are getting worse every year.",
              right: "The traffic in big cities is getting worse every year.",
              explanation: "'Traffic' is uncountable singular — takes a singular verb.",
            },
            {
              wrong: "I have made a good progress in my English.",
              right: "I have made good progress in my English.",
              explanation: "'Progress' is uncountable — no 'a'. The fixed expression is 'make progress'.",
            },
          ],
          practise: [
            { type: 'gap-fill', question: "I need ___ (a/some) advice about which university to apply to.", answer: ["some"], explanation: "'Advice' is uncountable — use 'some'." },
            { type: 'gap-fill', question: "The library provides ___ (much/many) useful information for postgraduate students.", answer: ["much"], explanation: "'Information' is uncountable — use 'much'." },
            { type: 'gap-fill', question: "There ___ (is/are) strong evidence that air pollution causes asthma.", answer: ["is"], explanation: "'Evidence' is uncountable singular." },
            { type: 'gap-fill', question: "Modern hospitals require expensive ___ (equipment/equipments) to function.", answer: ["equipment"], explanation: "'Equipment' is uncountable — no plural." },
            { type: 'gap-fill', question: "Recent ___ (research/researches) suggests that screen time affects sleep quality.", answer: ["research"], explanation: "'Research' is uncountable." },
            { type: 'gap-fill', question: "She has gained valuable ___ (experience/experiences) working in international organisations.", answer: ["experience"], explanation: "Uncountable abstract — general work background." },
            { type: 'gap-fill', question: "Travelling around Asia gave me many wonderful ___ (experience/experiences).", answer: ["experiences"], explanation: "Countable — individual events." },
            { type: 'gap-fill', question: "Students have made significant ___ (progress/progresses) in their language skills.", answer: ["progress"], explanation: "'Progress' is uncountable." },
            { type: 'gap-fill', question: "There ___ (is/are) too much traffic during rush hour.", answer: ["is"], explanation: "'Traffic' is uncountable singular." },
            { type: 'gap-fill', question: "The hotel provides comfortable ___ (accommodation/accommodations) for all guests.", answer: ["accommodation"], explanation: "British English: 'accommodation' is uncountable (and preferred in IELTS)." },
            { type: 'mcq', question: "Choose: 'I would like to give you ___ on improving your writing.'", options: ["an advice", "some advices", "a piece of advice", "many advices"], answer: 2, explanation: "'Advice' is uncountable — 'a piece of advice' is the correct way to quantify." },
            { type: 'mcq', question: "Choose: 'The news from the conflict zone ___ very disturbing.'", options: ["are", "is", "have been", "were"], answer: 1, explanation: "'News' is uncountable singular." },
            { type: 'mcq', question: "Choose: 'My grandmother has a wide ___ of traditional remedies.'", options: ["knowledges", "knowledge", "knowing", "known"], answer: 1, explanation: "'Knowledge' is uncountable." },
            { type: 'mcq', question: "Choose: 'I bought two new ___ for the bedroom.'", options: ["furniture", "furnitures", "pieces of furniture", "piece of furniture"], answer: 2, explanation: "To count uncountable 'furniture', use 'pieces of furniture'." },
            { type: 'mcq', question: "Choose: 'The teacher published a new ___ on early language acquisition.'", options: ["research", "paper", "evidence", "vocabulary"], answer: 1, explanation: "'A paper' (countable — an academic article) is the natural choice; the others are uncountable here." },
            { type: 'gap-fill', question: "There is ___ (little/few) evidence that strict laws reduce drug use.", answer: ["little"], explanation: "'Little' goes with uncountable nouns." },
            { type: 'gap-fill', question: "Very ___ (little/few) people can afford private healthcare in some countries.", answer: ["few"], explanation: "'Few' goes with countable plural nouns." },
            { type: 'gap-fill', question: "She gave me a very useful ___ (suggestion/advice).", answer: ["suggestion"], explanation: "'Suggestion' is countable (takes 'a'); 'advice' is uncountable." },
            { type: 'gap-fill', question: "We need ___ (a great deal of/a great number of) patience when teaching young children.", answer: ["a great deal of"], explanation: "'A great deal of' goes with uncountable nouns ('patience')." },
            { type: 'gap-fill', question: "There are ___ (a great deal of/a great number of) reasons why people emigrate.", answer: ["a great number of"], explanation: "'A great number of' goes with countable plural nouns." },
          ],
          produce: [
            { type: 'transform', prompt: "Fix: 'The teacher gave us many useful informations.'", answer: "The teacher gave us a lot of useful information.", hints: ["'Information' is uncountable.", "Use 'a lot of' or 'much'."] },
            { type: 'transform', prompt: "Fix: 'My friend gave me an advice about studying abroad.'", answer: "My friend gave me some advice about studying abroad.", hints: ["'Advice' is uncountable.", "Use 'some' or 'a piece of'."] },
            { type: 'transform', prompt: "Fix: 'Scientists have done many researches into climate change.'", answer: "Scientists have carried out a lot of research into climate change.", hints: ["'Research' is uncountable.", "Verb 'carry out' is more academic than 'do'."] },
            { type: 'transform', prompt: "Fix: 'The school bought new equipments for the chemistry lab.'", answer: "The school bought new equipment for the chemistry lab.", hints: ["'Equipment' is uncountable.", "No plural form."] },
            { type: 'transform', prompt: "Fix: 'There are many evidences that pollution harms health.'", answer: "There is strong evidence that pollution harms health.", hints: ["'Evidence' is uncountable singular.", "Use 'is' + 'strong evidence'."] },
            { type: 'transform', prompt: "Fix: 'She has wide knowledges of European history.'", answer: "She has a wide knowledge of European history.", hints: ["'Knowledge' is uncountable.", "'A wide knowledge of X' is a fixed phrase."] },
            { type: 'transform', prompt: "Fix: 'The news this morning were quite shocking.'", answer: "The news this morning was quite shocking.", hints: ["'News' is uncountable singular.", "Use 'was'."] },
            { type: 'transform', prompt: "Fix: 'I have made a great progress in my IELTS preparation.'", answer: "I have made great progress in my IELTS preparation.", hints: ["'Progress' is uncountable.", "No article."] },
            { type: 'transform', prompt: "Fix: 'The traffic during rush hours are unbearable.'", answer: "The traffic during rush hour is unbearable.", hints: ["'Traffic' is uncountable singular.", "'Rush hour' is also uncountable in this phrase."] },
            { type: 'transform', prompt: "Fix: 'My uncle has a lot of experiences in the banking industry.'", answer: "My uncle has a lot of experience in the banking industry.", hints: ["Here 'experience' = general background (uncountable).", "No 's'."] },
            { type: 'transform', prompt: "Rewrite without 'a': 'I would like to give a piece of an advice to new students.'", answer: "I would like to give a piece of advice to new students.", hints: ["'Advice' takes no article.", "'A piece of + uncountable noun (no article)'."] },
            { type: 'transform', prompt: "Rewrite: 'The hotel offered three different accommodations for tourists.'", answer: "The hotel offered three different types of accommodation for tourists.", hints: ["'Accommodation' is uncountable.", "Use 'types of'."] },
            { type: 'transform', prompt: "Fix: 'The vocabularies in academic writing are difficult to master.'", answer: "The vocabulary used in academic writing is difficult to master.", hints: ["'Vocabulary' is uncountable.", "Singular verb."] },
            { type: 'transform', prompt: "Fix: 'There are too many homeworks for students these days.'", answer: "There is too much homework for students these days.", hints: ["'Homework' is uncountable.", "'There is + much'."] },
            { type: 'transform', prompt: "Combine: 'The government released information. The information was about new tax policies.'", answer: "The government released information about new tax policies.", hints: ["No article with generic 'information'.", "No repetition needed."] },
          ],
          apply: [
            {
              type: 'mini-task', taskType: 'W-T2',
              prompt: "Write 2 sentences using 'research', 'evidence', and 'information' correctly.",
              modelAnswer: "Recent research into the long-term effects of social media has revealed troubling patterns among adolescents. There is now substantial evidence that excessive screen time is linked to anxiety, and most schools provide information to parents on how to set healthy limits.",
              criteria: ["'Research' uncountable + singular verb", "'Evidence' uncountable + 'substantial'", "'Information' uncountable + 'provide'"],
            },
            {
              type: 'mini-task', taskType: 'S-P1',
              prompt: "Answer in 1-2 sentences: What kind of music do you listen to?",
              modelAnswer: "I'm really into jazz, especially older recordings from the 1960s. My dad has a great knowledge of the genre, so I've picked up a lot of information about different artists just from talking to him.",
              criteria: ["'Knowledge' uncountable", "'Information' uncountable", "Natural spoken register"],
            },
            {
              type: 'mini-task', taskType: 'S-P2',
              prompt: "Answer in 2-3 sentences: Describe an experience that taught you something important.",
              modelAnswer: "One experience that really shaped me was volunteering at a homeless shelter during my gap year. It gave me a kind of perspective on life that no amount of school education could have provided, and the people I met there had so much knowledge to share about resilience.",
              criteria: ["'One experience' (countable)", "'A kind of perspective'", "'Knowledge' uncountable", "Coherent narrative"],
            },
            {
              type: 'mini-task', taskType: 'W-T1',
              prompt: "Write 1 sentence describing this fact: 'In 2020, fast food companies produced 8 million tonnes of plastic packaging.'",
              modelAnswer: "In 2020, fast food companies produced approximately 8 million tonnes of plastic packaging, contributing significantly to global waste.",
              criteria: ["'Packaging' uncountable", "'Waste' uncountable", "Precise figures"],
            },
            {
              type: 'mini-task', taskType: 'W-T2',
              prompt: "Write 2 sentences arguing that 'Practical experience is more valuable than academic study'.",
              modelAnswer: "While academic study provides the theoretical foundation a profession requires, it is practical experience that ultimately teaches the soft skills employers value most. A graduate may have a wide knowledge of marketing theory, for example, but only on-the-job experience reveals how to handle a difficult client.",
              criteria: ["'Experience' uncountable (correctly)", "'Knowledge' uncountable", "'A graduate' countable", "Contrasted accurately"],
            },
          ],
          masteryTest: {
            questionCount: 15,
            passingScore: 0.85,
            timeLimitSec: 12 * 60,
            questions: [
              { type: 'gap-fill', question: "Recent ___ (research/researches) suggests that processed food contributes to obesity.", answer: ["research"], explanation: "'Research' is uncountable." },
              { type: 'gap-fill', question: "There ___ (is/are) overwhelming evidence that climate change is human-induced.", answer: ["is"], explanation: "'Evidence' is uncountable singular." },
              { type: 'gap-fill', question: "We need ___ (a lot of/many) information before making a decision.", answer: ["a lot of"], explanation: "'Information' is uncountable — 'a lot of', not 'many'." },
              { type: 'gap-fill', question: "She gave me some valuable ___ (advices/advice) on managing stress.", answer: ["advice"], explanation: "'Advice' is uncountable." },
              { type: 'gap-fill', question: "Modern factories require sophisticated ___ (machinery/machineries) to operate.", answer: ["machinery"], explanation: "'Machinery' is uncountable." },
              { type: 'mcq', question: "Choose: 'The traffic in central Tokyo ___ extremely heavy during weekdays.'", options: ["are", "is", "were", "have been"], answer: 1, explanation: "'Traffic' is uncountable singular." },
              { type: 'mcq', question: "Choose: 'She gained considerable ___ during her time abroad.'", options: ["experiences", "an experience", "experience", "many experience"], answer: 2, explanation: "Here 'experience' = general background (uncountable)." },
              { type: 'mcq', question: "Choose: 'There has been little ___ in negotiations so far.'", options: ["progresses", "progress", "a progress", "progressing"], answer: 1, explanation: "'Progress' is uncountable." },
              { type: 'mcq', question: "Choose: 'My grandfather has a wide ___ of folk songs from this region.'", options: ["knowledges", "knowledge", "knowings", "known"], answer: 1, explanation: "'Knowledge' is uncountable; fixed phrase 'a wide knowledge of'." },
              { type: 'mcq', question: "Choose: 'The hotel provides comfortable ___ for international guests.'", options: ["accommodations", "accommodation", "an accommodation", "accomodation"], answer: 1, explanation: "British English: 'accommodation' is uncountable." },
              { type: 'transform', prompt: "Fix: 'The library gave me many useful informations about scholarships.'", answer: "The library gave me a lot of useful information about scholarships.", hints: ["'Information' uncountable.", "Use 'a lot of'."] },
              { type: 'transform', prompt: "Fix: 'Scientists have made many researches into renewable energy.'", answer: "Scientists have carried out a lot of research into renewable energy.", hints: ["'Research' uncountable.", "Verb 'carry out' fits better."] },
              { type: 'transform', prompt: "Fix: 'There are no evidences that the new policy works.'", answer: "There is no evidence that the new policy works.", hints: ["'Evidence' uncountable singular.", "'There is + no'."] },
              { type: 'transform', prompt: "Fix: 'I have made a good progress in my Spanish lessons.'", answer: "I have made good progress in my Spanish lessons.", hints: ["'Progress' uncountable.", "No article."] },
              { type: 'transform', prompt: "Fix: 'The school bought new sport equipments for the gym.'", answer: "The school bought new sports equipment for the gym.", hints: ["'Equipment' uncountable.", "'Sports equipment' is the fixed compound."] },
            ],
          },
        },
      },
      {
        id: 'L1-04',
        title: 'Dependent Prepositions',
        tags: ['accuracy', 'W-T2', 'S-P3', 'R'],
        estimatedMinutes: 40,
        status: 'ready',
        blurb: 'High-frequency verb+prep / adj+prep / noun+prep combinations: depend on, suffer from, result in, aware of, similar to, increase in.',
        sections: {
          notice: {
            heading: 'Notice the structure',
            examples: [
              {
                text: "The success of any policy largely depends on public support and consistent funding.",
                highlights: ["depends on"],
                note: "'Depend ON' (not 'from' or 'of'). One of the most commonly misused dependent prepositions in IELTS.",
              },
              {
                text: "Many developing countries continue to suffer from chronic food insecurity.",
                highlights: ["suffer from"],
                note: "'Suffer FROM' (illness, problem, lack). Note: 'suffer a loss/defeat' takes no preposition.",
              },
              {
                text: "Rising temperatures have resulted in widespread habitat loss for polar species.",
                highlights: ["resulted in"],
                note: "'Result IN' (= cause / lead to). Compare 'result FROM' (= be caused by). Critical distinction.",
              },
              {
                text: "Citizens should be aware of the impact their consumption choices have on the planet.",
                highlights: ["aware of"],
                note: "'Aware OF' (not 'about' in formal writing). Adjective + preposition.",
              },
              {
                text: "There has been a significant increase in the number of women entering STEM fields.",
                highlights: ["increase in"],
                note: "'Increase IN' (the area/category that changed). 'Increase OF' = the size of the change. Both possible but 'in' is far more common.",
              },
              {
                text: "Researchers attribute the recent decline in birth rates to economic uncertainty.",
                highlights: ["attribute", "to"],
                note: "'Attribute X TO Y' — a high-value academic structure. Same pattern: blame X on Y, dedicate X to Y.",
              },
            ],
          },
          understand: {
            rules: [
              {
                rule: "Verb + preposition combinations must be memorised — they don't follow logical patterns. Common: depend on, suffer from, result in/from, contribute to, deal with, focus on, rely on, consist of, apply for, apply to.",
                examples: ["depend on funding", "suffer from anxiety", "contribute to growth", "deal with stress"],
              },
              {
                rule: "Some verbs change meaning with different prepositions: 'result in' (= cause) vs. 'result from' (= be caused by); 'apply for' (a job) vs. 'apply to' (an institution).",
                examples: ["Overwork resulted in burnout.", "Burnout resulted from overwork.", "She applied for the position.", "She applied to Oxford."],
              },
              {
                rule: "Adjective + preposition combinations: aware of, similar to, different from, interested in, capable of, responsible for, dependent on, familiar with, related to.",
                examples: ["aware of the risks", "similar to last year", "different from the original", "responsible for emissions"],
              },
              {
                rule: "Noun + preposition combinations follow specific patterns: an increase in, a decrease in, an impact on, an effect on, a solution to, a cause of, a reason for, an alternative to, a lack of.",
                examples: ["a sharp rise in obesity", "the impact on the economy", "a solution to the housing crisis"],
              },
              {
                rule: "Some common errors come from L1 transfer. 'Discuss', 'enter', 'reach', 'mention', 'request' take NO preposition in English (though equivalents often do in other languages).",
                examples: ["discuss the issue (NOT discuss about)", "enter the room (NOT enter to)", "reach a decision (NOT reach to)"],
              },
              {
                rule: "Three-word patterns: 'attribute X to Y', 'blame X on Y', 'protect X from Y', 'prevent X from + ing', 'accuse X of + ing'.",
                examples: ["He blamed his failure on the system.", "Vaccines protect children from disease.", "Laws prevent companies from polluting."],
              },
            ],
            formBox: {
              title: 'Form — high-frequency combos',
              rows: [
                ['Verb + prep', 'depend on, suffer from, result in, contribute to, focus on'],
                ['Adj + prep', 'aware of, similar to, different from, responsible for'],
                ['Noun + prep', 'increase in, impact on, solution to, cause of, reason for'],
                ['NO prep needed', 'discuss X, enter X, reach X, mention X, request X'],
                ['3-word patterns', 'attribute X to Y, blame X on Y, prevent X from -ing'],
              ],
            },
            useBox: {
              title: 'When to use which preposition',
              rows: [
                ['Cause / lead to', 'result IN, lead TO, contribute TO'],
                ['Be caused by', 'result FROM, stem FROM, arise FROM'],
                ['Affect / influence', 'impact ON, effect ON, influence ON'],
                ['Answer / remedy', 'solution TO, answer TO, response TO'],
                ['Be careful of / aware of', 'aware OF, conscious OF, mindful OF'],
                ['Apply (job vs. uni)', 'apply FOR a job, apply TO a university'],
              ],
            },
          },
          commonMistakes: [
            {
              wrong: "The economy depends from foreign investment.",
              right: "The economy depends on foreign investment.",
              explanation: "'Depend ON' — never 'from' or 'of'.",
            },
            {
              wrong: "Children should be aware about the dangers of social media.",
              right: "Children should be aware of the dangers of social media.",
              explanation: "'Aware OF' is the academic-standard form. 'Aware about' is non-standard.",
            },
            {
              wrong: "Climate change will result on serious consequences.",
              right: "Climate change will result in serious consequences.",
              explanation: "'Result IN' = lead to / cause. Common L1 transfer error.",
            },
            {
              wrong: "We need to discuss about the proposal.",
              right: "We need to discuss the proposal.",
              explanation: "'Discuss' takes a direct object — no preposition.",
            },
            {
              wrong: "She is married with a doctor.",
              right: "She is married to a doctor.",
              explanation: "'Married TO' — very high-frequency IELTS error.",
            },
            {
              wrong: "There has been a sharp increase of pollution levels.",
              right: "There has been a sharp increase in pollution levels.",
              explanation: "'Increase IN' (the area/category). 'Of' refers to the size, not the dimension.",
            },
            {
              wrong: "Smoking is the main cause for lung cancer.",
              right: "Smoking is the main cause of lung cancer.",
              explanation: "'Cause OF X' but 'reason FOR X'. Easy to confuse.",
            },
            {
              wrong: "The government must find a solution for the housing crisis.",
              right: "The government must find a solution to the housing crisis.",
              explanation: "'Solution TO X' (not 'for'). Same pattern: answer to, response to.",
            },
            {
              wrong: "Many young people suffer of depression.",
              right: "Many young people suffer from depression.",
              explanation: "'Suffer FROM' (an illness / condition).",
            },
            {
              wrong: "This essay will focus in three main arguments.",
              right: "This essay will focus on three main arguments.",
              explanation: "'Focus ON' — never 'in'.",
            },
          ],
          practise: [
            { type: 'gap-fill', question: "The future of our planet depends ___ the choices we make today.", answer: ["on"], explanation: "depend ON" },
            { type: 'gap-fill', question: "Millions of people in developing countries suffer ___ malnutrition.", answer: ["from"], explanation: "suffer FROM (an illness/condition)" },
            { type: 'gap-fill', question: "Cutting carbon emissions will result ___ a healthier planet.", answer: ["in"], explanation: "result IN = cause / lead to" },
            { type: 'gap-fill', question: "Rising sea levels result ___ the melting of polar ice caps.", answer: ["from"], explanation: "result FROM = be caused by" },
            { type: 'gap-fill', question: "Universities should contribute ___ economic development through innovation.", answer: ["to"], explanation: "contribute TO" },
            { type: 'gap-fill', question: "Consumers should be aware ___ the environmental cost of fast fashion.", answer: ["of"], explanation: "aware OF" },
            { type: 'gap-fill', question: "The new policy is similar ___ the one introduced last year.", answer: ["to"], explanation: "similar TO" },
            { type: 'gap-fill', question: "His perspective is very different ___ mine.", answer: ["from"], explanation: "different FROM (also 'than' in US English, but 'from' is standard)" },
            { type: 'gap-fill', question: "Governments are ultimately responsible ___ the welfare of their citizens.", answer: ["for"], explanation: "responsible FOR" },
            { type: 'gap-fill', question: "There has been a steady rise ___ obesity rates over the past decade.", answer: ["in"], explanation: "rise/increase IN" },
            { type: 'gap-fill', question: "The pandemic has had a profound impact ___ global tourism.", answer: ["on"], explanation: "impact ON" },
            { type: 'gap-fill', question: "Renewable energy may be the long-term solution ___ the climate crisis.", answer: ["to"], explanation: "solution TO" },
            { type: 'mcq', question: "Choose: 'The success of a business largely depends ___ effective management.'", options: ["from", "of", "on", "to"], answer: 2, explanation: "depend ON" },
            { type: 'mcq', question: "Choose: 'The committee will discuss ___ the proposal next week.'", options: ["about", "on", "with", "Ø (no preposition)"], answer: 3, explanation: "'Discuss' takes a direct object — no preposition." },
            { type: 'mcq', question: "Choose: 'Smoking is widely regarded as a leading cause ___ heart disease.'", options: ["for", "of", "to", "with"], answer: 1, explanation: "cause OF" },
            { type: 'mcq', question: "Choose: 'She decided to apply ___ a position at a multinational company.'", options: ["to", "for", "on", "at"], answer: 1, explanation: "apply FOR a job; apply TO a company/uni" },
            { type: 'mcq', question: "Choose: 'I am not familiar ___ the new software.'", options: ["of", "to", "with", "for"], answer: 2, explanation: "familiar WITH" },
            { type: 'gap-fill', question: "Scientists attribute the decline in bee populations ___ pesticide use.", answer: ["to"], explanation: "attribute X TO Y" },
            { type: 'gap-fill', question: "Vaccinations help to protect children ___ infectious diseases.", answer: ["from"], explanation: "protect X FROM Y" },
            { type: 'gap-fill', question: "Strict regulations could prevent companies ___ polluting rivers.", answer: ["from"], explanation: "prevent X FROM + -ing" },
          ],
          produce: [
            { type: 'transform', prompt: "Fix: 'The country's economy depends from agricultural exports.'", answer: "The country's economy depends on agricultural exports.", hints: ["depend ON", "Never 'from' or 'of'."] },
            { type: 'transform', prompt: "Fix: 'Children should be aware about the risks of online gaming.'", answer: "Children should be aware of the risks of online gaming.", hints: ["aware OF", "'About' is informal/non-standard."] },
            { type: 'transform', prompt: "Fix: 'Air pollution can result on serious respiratory problems.'", answer: "Air pollution can result in serious respiratory problems.", hints: ["result IN = cause", "Lead to a consequence."] },
            { type: 'transform', prompt: "Fix: 'Many people suffer of stress in high-pressure jobs.'", answer: "Many people suffer from stress in high-pressure jobs.", hints: ["suffer FROM (a condition)", "Not 'of'."] },
            { type: 'transform', prompt: "Fix: 'The course focuses in academic writing skills.'", answer: "The course focuses on academic writing skills.", hints: ["focus ON", "Never 'in' or 'at'."] },
            { type: 'transform', prompt: "Fix: 'We need to discuss about the new marketing strategy.'", answer: "We need to discuss the new marketing strategy.", hints: ["'Discuss' = no preposition.", "Direct object only."] },
            { type: 'transform', prompt: "Fix: 'There has been a sharp increase of unemployment.'", answer: "There has been a sharp increase in unemployment.", hints: ["increase IN", "Refers to the area changing."] },
            { type: 'transform', prompt: "Fix: 'Smoking is one of the main causes for lung cancer.'", answer: "Smoking is one of the main causes of lung cancer.", hints: ["cause OF", "Not 'for'."] },
            { type: 'transform', prompt: "Fix: 'The government should find a solution for the traffic problem.'", answer: "The government should find a solution to the traffic problem.", hints: ["solution TO", "Same as answer TO, response TO."] },
            { type: 'transform', prompt: "Fix: 'Her writing style is quite different than mine.'", answer: "Her writing style is quite different from mine.", hints: ["different FROM (formal standard)", "'Than' is informal US."] },
            { type: 'transform', prompt: "Fix: 'He blamed the failure to the economic downturn.'", answer: "He blamed the failure on the economic downturn.", hints: ["blame X ON Y", "Three-word pattern."] },
            { type: 'transform', prompt: "Fix: 'Vaccines protect children against diseases.'", answer: "Vaccines protect children from diseases.", hints: ["protect X FROM Y", "('Against' works in some contexts but 'from' is safer here.)"] },
            { type: 'transform', prompt: "Combine using 'contribute to': 'Smoking is one factor. Lung cancer is the result.'", answer: "Smoking contributes to lung cancer.", hints: ["contribute TO", "Use present simple."] },
            { type: 'transform', prompt: "Combine using 'result from': 'There was an economic crisis. Poor management caused it.'", answer: "The economic crisis resulted from poor management.", hints: ["result FROM = be caused by", "Use past simple."] },
            { type: 'transform', prompt: "Fix: 'She got married with her childhood friend.'", answer: "She got married to her childhood friend.", hints: ["married TO", "Common L1 transfer error."] },
          ],
          apply: [
            {
              type: 'mini-task', taskType: 'W-T2',
              prompt: "Write 2 sentences using 'depend on', 'result in', and 'aware of' on the topic of climate change.",
              modelAnswer: "The future of our planet depends on the actions taken by governments today. Failing to address rising emissions will result in irreversible damage, and citizens must therefore be aware of how their own behaviour contributes to the crisis.",
              criteria: ["'Depend on' used correctly", "'Result in' for consequence", "'Aware of' for adjective+prep", "Cohesive paragraph"],
            },
            {
              type: 'mini-task', taskType: 'S-P3',
              prompt: "Answer in 2-3 sentences: What are the main causes of pollution in big cities?",
              modelAnswer: "I'd say the main cause of urban pollution is the sheer number of cars on the roads, especially during rush hour. A lot of it also stems from heavy industry on the outskirts, and unfortunately, many governments haven't found an effective solution to either problem yet.",
              criteria: ["'Cause of' (not 'for')", "'Stem from'", "'Solution to'", "Natural spoken register"],
            },
            {
              type: 'mini-task', taskType: 'W-T1',
              prompt: "Write 1 sentence describing this trend: 'Obesity rates in the UK rose from 15% in 2000 to 28% in 2020.'",
              modelAnswer: "Between 2000 and 2020, the United Kingdom witnessed a substantial increase in obesity rates, with figures climbing from 15% to 28%.",
              criteria: ["'Increase in' (not 'of')", "Trend verb 'climb from X to Y'", "Time markers"],
            },
            {
              type: 'mini-task', taskType: 'W-T2',
              prompt: "Write a 2-sentence body opening for: 'Many people argue that governments should focus more on environmental protection. Discuss.'",
              modelAnswer: "Those who argue in favour of stricter environmental policy point to the long-term benefits for both public health and the economy. Pollution, for instance, contributes to a wide range of respiratory illnesses, and the cost of treating these conditions could be drastically reduced by addressing the causes at their source.",
              criteria: ["'Argue in favour of'", "'Contribute to'", "'Cause of' / 'cost of'", "Multiple deps used naturally"],
            },
            {
              type: 'mini-task', taskType: 'S-P1',
              prompt: "Answer in 1-2 sentences: Do you usually depend on technology in your daily life?",
              modelAnswer: "Honestly, I depend on my phone for almost everything — from getting to work to staying in touch with my family. I'd say I'm fairly aware of how much I rely on it, but I'm not sure I could really cut down.",
              criteria: ["'Depend on'", "'Rely on'", "'Aware of'", "Spoken-natural"],
            },
          ],
          masteryTest: {
            questionCount: 15,
            passingScore: 0.85,
            timeLimitSec: 12 * 60,
            questions: [
              { type: 'gap-fill', question: "The quality of public services depends ___ adequate government funding.", answer: ["on"], explanation: "depend ON" },
              { type: 'gap-fill', question: "Air pollution can result ___ serious health problems for children.", answer: ["in"], explanation: "result IN = lead to" },
              { type: 'gap-fill', question: "A lack of exercise is one of the main causes ___ obesity in young adults.", answer: ["of"], explanation: "cause OF" },
              { type: 'gap-fill', question: "Governments must find a long-term solution ___ the housing shortage.", answer: ["to"], explanation: "solution TO" },
              { type: 'gap-fill', question: "There has been a significant rise ___ the cost of living in major cities.", answer: ["in"], explanation: "rise IN" },
              { type: 'gap-fill', question: "Students should be aware ___ the consequences of plagiarism.", answer: ["of"], explanation: "aware OF" },
              { type: 'mcq', question: "Choose: 'The new tax policy is very similar ___ the one introduced last year.'", options: ["with", "to", "as", "from"], answer: 1, explanation: "similar TO" },
              { type: 'mcq', question: "Choose: 'Many people suffer ___ chronic stress in fast-paced workplaces.'", options: ["from", "of", "with", "by"], answer: 0, explanation: "suffer FROM" },
              { type: 'mcq', question: "Choose: 'We must discuss ___ the proposal in detail.'", options: ["about", "on", "with", "Ø"], answer: 3, explanation: "'Discuss' = no preposition." },
              { type: 'mcq', question: "Choose: 'She decided to apply ___ a master's programme in Australia.'", options: ["for", "to", "on", "with"], answer: 0, explanation: "apply FOR a programme/position; apply TO an institution" },
              { type: 'transform', prompt: "Fix: 'The economy depends from oil exports.'", answer: "The economy depends on oil exports.", hints: ["depend ON", "Not 'from'."] },
              { type: 'transform', prompt: "Fix: 'Climate change will result on more extreme weather.'", answer: "Climate change will result in more extreme weather.", hints: ["result IN", "Not 'on'."] },
              { type: 'transform', prompt: "Fix: 'There has been a sharp increase of crime in this area.'", answer: "There has been a sharp increase in crime in this area.", hints: ["increase IN", "Not 'of'."] },
              { type: 'transform', prompt: "Fix: 'The minister blamed the crisis to mismanagement.'", answer: "The minister blamed the crisis on mismanagement.", hints: ["blame X ON Y", "Three-word pattern."] },
              { type: 'transform', prompt: "Fix: 'We need a clear solution for these problems.'", answer: "We need a clear solution to these problems.", hints: ["solution TO", "Not 'for'."] },
            ],
          },
        },
      },
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
