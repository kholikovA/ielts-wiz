export const grammarLessons = [
  {
    id: 'complex-sentences',
    title: 'Complex Sentence Structures',
    category: 'Advanced',
    skills: ['Writing', 'Speaking'],
    description: 'Master subordinate clauses, relative clauses, and sophisticated sentence patterns.',
    content: {
      explanation: `Complex sentences contain an independent clause and one or more dependent clauses. They show relationships between ideas and demonstrate grammatical sophistication.

**Key structures:**
• Subordinate clauses (because, although, while, if, when)
• Relative clauses (who, which, that, whose, where)
• Participle clauses (-ing, -ed forms)
• Noun clauses (what, that, whether)`,
      examples: [
        { simple: "The student passed. She studied hard.", complex: "The student, who studied hard, passed with flying colours." },
        { simple: "I saw the film. It won many awards.", complex: "The film that I saw last night won numerous awards at Cannes." },
        { simple: "He finished his work. He went home.", complex: "Having finished his work, he went home feeling accomplished." }
      ],
      exercises: [
        {
          type: 'combine',
          instruction: 'Combine these sentences using a relative clause:',
          sentences: ["The book is fascinating.", "I borrowed the book from the library."],
          answer: "The book that/which I borrowed from the library is fascinating.",
          hint: "Use 'that' or 'which' to connect the sentences."
        },
        {
          type: 'combine',
          instruction: 'Combine using a participle clause:',
          sentences: ["She realized her mistake.", "She apologized immediately."],
          answer: "Realizing her mistake, she apologized immediately.",
          hint: "Convert the first sentence to an -ing form."
        },
        {
          type: 'combine',
          instruction: 'Combine using a subordinate clause:',
          sentences: ["The weather was terrible.", "We decided to stay indoors."],
          answer: "Because/Since the weather was terrible, we decided to stay indoors.",
          hint: "Use 'because' or 'since' to show cause and effect."
        },
        {
          type: 'fill',
          instruction: 'Complete with an appropriate relative pronoun:',
          sentence: "The professor _____ lectures I attended was incredibly knowledgeable.",
          answer: "whose",
          options: ["who", "whose", "which", "whom"]
        },
        {
          type: 'fill',
          instruction: 'Complete with an appropriate subordinator:',
          sentence: "_____ she had limited resources, she managed to complete the project successfully.",
          answer: "Although",
          options: ["Although", "Because", "Unless", "Until"]
        }
      ]
    }
  },
  {
    id: 'advanced-conditionals',
    title: 'Advanced Conditionals',
    category: 'Advanced',
    skills: ['Writing', 'Speaking'],
    description: 'Go beyond basic if-clauses to mixed conditionals and inverted structures.',
    content: {
      explanation: `Advanced conditionals allow you to express complex hypothetical situations, regrets, and unlikely scenarios with precision.

**Types covered:**
• Mixed conditionals (past condition → present result, or vice versa)
• Inverted conditionals (Had I known..., Were it not for...)
• Implied conditionals (Otherwise, But for...)
• Wish/If only structures`,
      examples: [
        { type: "Mixed (past→present)", example: "If I had studied medicine, I would be a doctor now." },
        { type: "Mixed (present→past)", example: "If she weren't so shy, she would have spoken up at the meeting." },
        { type: "Inverted", example: "Had I known about the traffic, I would have left earlier." },
        { type: "Implied", example: "I was exhausted; otherwise, I would have joined you." }
      ],
      exercises: [
        {
          type: 'transform',
          instruction: 'Rewrite using an inverted conditional (no "if"):',
          sentence: "If I had been informed earlier, I would have attended.",
          answer: "Had I been informed earlier, I would have attended.",
          hint: "Move 'had' to the beginning and remove 'if'."
        },
        {
          type: 'transform',
          instruction: 'Create a mixed conditional (past condition → present result):',
          sentence: "I didn't learn to drive. I can't help you move house now.",
          answer: "If I had learned to drive, I could help you move house now.",
          hint: "Use past perfect in the if-clause, would/could + base verb for the result."
        },
        {
          type: 'fill',
          instruction: 'Complete the mixed conditional:',
          sentence: "If he _____ (not/miss) his flight yesterday, he _____ (be) here with us now.",
          answer: "hadn't missed / would be",
          hint: "Past perfect for the condition, would + base verb for present result."
        },
        {
          type: 'fill',
          instruction: 'Complete the inverted conditional:',
          sentence: "_____ it not for your support, I would have given up long ago.",
          answer: "Were",
          options: ["Were", "Was", "Had", "If"]
        },
        {
          type: 'correct',
          instruction: 'Find and correct the error:',
          sentence: "If I would have known, I would have told you.",
          answer: "If I had known, I would have told you.",
          hint: "Don't use 'would' in the if-clause of third conditionals."
        }
      ]
    }
  },
  {
    id: 'hedging',
    title: 'Hedging & Cautious Language',
    category: 'Academic',
    skills: ['Writing'],
    description: 'Learn to express uncertainty and make qualified claims in academic writing.',
    content: {
      explanation: `Hedging is essential in academic writing to avoid making claims that are too strong or absolute. It shows critical thinking and awareness of limitations.

**Hedging devices:**
• Modal verbs (may, might, could, would)
• Adverbs (perhaps, possibly, probably, apparently)
• Tentative verbs (suggest, indicate, appear, seem, tend)
• Qualifying phrases (to some extent, in some cases, it is possible that)`,
      examples: [
        { strong: "Social media causes depression.", hedged: "Social media may contribute to depression in some individuals." },
        { strong: "This proves the theory is correct.", hedged: "This evidence appears to support the theory to some extent." },
        { strong: "All students prefer online learning.", hedged: "Many students seem to favour online learning in certain contexts." }
      ],
      exercises: [
        {
          type: 'transform',
          instruction: 'Rewrite with appropriate hedging:',
          sentence: "Video games make children violent.",
          answer: "Video games may contribute to aggressive behaviour in some children.",
          hint: "Use 'may/might' and qualify with 'some' or 'certain'."
        },
        {
          type: 'transform',
          instruction: 'Add hedging to this claim:',
          sentence: "Working from home increases productivity.",
          answer: "Working from home appears to increase productivity in certain contexts / for some employees.",
          hint: "Use 'appears to' or 'tends to' and add a qualifier."
        },
        {
          type: 'fill',
          instruction: 'Choose the most appropriate hedging expression:',
          sentence: "The results _____ that there is a correlation between diet and mood.",
          answer: "suggest",
          options: ["prove", "suggest", "confirm", "guarantee"]
        },
        {
          type: 'fill',
          instruction: 'Complete with appropriate hedging:',
          sentence: "This _____ be due to a lack of funding, although further research is needed.",
          answer: "could/may/might",
          hint: "Use a modal verb expressing possibility."
        },
        {
          type: 'identify',
          instruction: 'Which sentence uses hedging appropriately for academic writing?',
          options: [
            "Climate change definitely causes all natural disasters.",
            "Climate change is believed to contribute to the increasing frequency of extreme weather events.",
            "Climate change obviously destroys everything.",
            "Climate change has no effect on weather patterns."
          ],
          answer: 1,
          hint: "Look for tentative language and qualified claims."
        }
      ]
    }
  },
  {
    id: 'cohesive-devices',
    title: 'Cohesive Devices Mastery',
    category: 'Advanced',
    skills: ['Writing', 'Speaking'],
    description: 'Connect ideas seamlessly with advanced linking words and referencing.',
    content: {
      explanation: `Cohesive devices create flow and connection between ideas. Using a variety of these devices demonstrates language sophistication.

**Categories:**
• Addition: furthermore, moreover, in addition, not only... but also
• Contrast: nevertheless, nonetheless, whereas, conversely, on the contrary
• Cause/Effect: consequently, as a result, thereby, hence, thus
• Example: for instance, namely, such as, to illustrate
• Reference: the former, the latter, this, such, these factors`,
      examples: [
        { basic: "Also, the study found...", advanced: "Furthermore, the study revealed..." },
        { basic: "But this isn't always true.", advanced: "Nevertheless, this does not hold true in all contexts." },
        { basic: "So people started working from home.", advanced: "Consequently, remote working became increasingly prevalent." }
      ],
      exercises: [
        {
          type: 'fill',
          instruction: 'Choose the best cohesive device:',
          sentence: "The government invested heavily in education. _____, literacy rates improved dramatically.",
          answer: "Consequently",
          options: ["However", "Consequently", "Furthermore", "Nevertheless"]
        },
        {
          type: 'fill',
          instruction: 'Select the appropriate contrast linker:',
          sentence: "The theory sounds convincing; _____, there is little empirical evidence to support it.",
          answer: "nevertheless/however",
          options: ["furthermore", "therefore", "nevertheless", "moreover"]
        },
        {
          type: 'transform',
          instruction: 'Rewrite using a more sophisticated cohesive device:',
          sentence: "Many people exercise regularly. But they still have health problems.",
          answer: "Many people exercise regularly; nevertheless/nonetheless, they still experience health problems.",
          hint: "Replace 'but' with a more formal alternative."
        },
        {
          type: 'fill',
          instruction: 'Complete with an appropriate reference word:',
          sentence: "Both traditional and online education have merits. _____ offers face-to-face interaction, while _____ provides flexibility.",
          answer: "The former / the latter",
          hint: "Use formal reference terms for the first and second items mentioned."
        },
        {
          type: 'reorder',
          instruction: 'Which sequence of linkers creates the best flow?',
          paragraph: "Technology has transformed education. [1], students can access resources globally. [2], this raises concerns about screen time. [3], the benefits appear to outweigh the drawbacks.",
          options: [
            "However / Furthermore / Nevertheless",
            "For instance / However / On balance",
            "Therefore / Moreover / But",
            "Because / And / So"
          ],
          answer: 1,
          hint: "Think about the logical progression: example → contrast → conclusion."
        }
      ]
    }
  },
  {
    id: 'passive-nominalization',
    title: 'Passive Voice & Nominalization',
    category: 'Academic',
    skills: ['Writing'],
    description: 'Transform your writing with academic passive constructions and noun phrases.',
    content: {
      explanation: `Passive voice and nominalization are hallmarks of academic writing. They create objectivity, formality, and focus on actions/concepts rather than agents.

**Passive voice uses:**
• When the agent is unknown, obvious, or unimportant
• To maintain topic focus
• To create objectivity in academic writing

**Nominalization:** Converting verbs/adjectives into nouns
• develop → development
• analyze → analysis  
• significant → significance`,
      examples: [
        { active: "Researchers conducted the experiment.", passive: "The experiment was conducted by researchers." },
        { active: "We will analyze the data.", passive: "The data will be analyzed." },
        { verbal: "The economy grew rapidly.", nominalized: "The rapid growth of the economy..." },
        { verbal: "People consume too much.", nominalized: "Excessive consumption leads to..." }
      ],
      exercises: [
        {
          type: 'transform',
          instruction: 'Convert to passive voice:',
          sentence: "Scientists discovered a new species in the Amazon.",
          answer: "A new species was discovered in the Amazon (by scientists).",
          hint: "Move the object to subject position."
        },
        {
          type: 'transform',
          instruction: 'Nominalize the underlined verb:',
          sentence: "When people *communicate* effectively, misunderstandings decrease.",
          answer: "Effective communication leads to a decrease in misunderstandings.",
          hint: "Convert 'communicate' to the noun form."
        },
        {
          type: 'transform',
          instruction: 'Make this more academic using nominalization:',
          sentence: "People pollute the environment because they fail to recycle.",
          answer: "Environmental pollution results from a failure to recycle.",
          hint: "Convert 'pollute' and 'fail' to noun forms."
        },
        {
          type: 'fill',
          instruction: 'Complete with the correct passive form:',
          sentence: "The survey _____ (conduct) last month, and the results _____ (publish) next week.",
          answer: "was conducted / will be published",
          hint: "Match the tense indicators: 'last month' = past, 'next week' = future."
        },
        {
          type: 'identify',
          instruction: 'Which is the most appropriate nominalized form of "People increasingly rely on technology"?',
          options: [
            "People's increasing reliance on technology",
            "The increasing reliance on technology",
            "Technology is relied on increasingly",
            "Relying on technology is increasing"
          ],
          answer: 1,
          hint: "The best nominalization removes personal subjects and uses noun phrases."
        }
      ]
    }
  },
  {
    id: 'emphasis-cleft',
    title: 'Emphasis & Cleft Sentences',
    category: 'Advanced',
    skills: ['Writing', 'Speaking'],
    description: 'Add impact to your language with cleft sentences and emphatic structures.',
    content: {
      explanation: `Cleft sentences split a simple sentence to emphasize a particular element. They're powerful tools for highlighting information.

**Types:**
• It-clefts: "It was John who broke the window."
• What-clefts: "What I need is more time."
• All-clefts: "All I want is peace and quiet."
• The thing/reason/place clefts: "The reason I'm here is to help."

**Other emphasis structures:**
• Fronting: "Never have I seen such beauty."
• Do/does/did for emphasis: "I do appreciate your help."`,
      examples: [
        { neutral: "She needs support.", cleft: "What she needs is support." },
        { neutral: "The price surprised me.", cleft: "It was the price that surprised me." },
        { neutral: "I want to succeed.", cleft: "All I want is to succeed." },
        { neutral: "I have never seen this.", emphatic: "Never have I seen this." }
      ],
      exercises: [
        {
          type: 'transform',
          instruction: 'Rewrite as a what-cleft to emphasize "a solution":',
          sentence: "We need a solution to this problem.",
          answer: "What we need is a solution to this problem.",
          hint: "Start with 'What we need is...'"
        },
        {
          type: 'transform',
          instruction: 'Rewrite as an it-cleft to emphasize "the manager":',
          sentence: "The manager made the final decision.",
          answer: "It was the manager who made the final decision.",
          hint: "Use 'It was... who/that...'"
        },
        {
          type: 'transform',
          instruction: 'Create emphasis using fronting:',
          sentence: "I had rarely felt so inspired.",
          answer: "Rarely had I felt so inspired.",
          hint: "Move the negative adverb to the front and invert the subject-verb order."
        },
        {
          type: 'fill',
          instruction: 'Complete the cleft sentence:',
          sentence: "_____ really matters is your attitude, not your background.",
          answer: "What",
          options: ["What", "It", "That", "Which"]
        },
        {
          type: 'transform',
          instruction: 'Rewrite using "The reason... is that":',
          sentence: "I declined the offer because the salary was too low.",
          answer: "The reason I declined the offer is that the salary was too low.",
          hint: "Start with 'The reason I...' and use 'is that' before the explanation."
        }
      ]
    }
  },
];

