// PART 4 — Tests 61–80 (Questions 31–40). Transcribed from "80 IELTS Listening
// Tests" (Proper English School), pp. 99–125. Answers: ../pdf-answers.json.
import { W, NOTES, TABLE, SENT, SUMMARY, ANS, ABC, CHOOSE, br, ul } from './_h.mjs';

const W1N = W('ONE WORD AND/OR A NUMBER');
const W2N = W('NO MORE THAN TWO WORDS AND/OR A NUMBER');
const W1 = W('ONE WORD ONLY');
const W2 = W('NO MORE THAN TWO WORDS');
const boxMatch = (lead, n, range, from, to) =>
  `${lead}<br>Choose <strong>${n}</strong> answers from the box and write the correct letter, <strong>${range.replace('-', '–')}</strong>, next to Questions ${from}–${to}.`;
const abcNext = (lead, from, to) =>
  `${lead}<br>Write the correct letter, <strong>A</strong>, <strong>B</strong> or <strong>C</strong>, next to Questions ${from}–${to}.`;
const P = (html, indent = 0) => ({ html, plain: true, indent });
const I = (html, indent = 1) => ({ html, indent });

export default [
  {
    id: 61, title: 'Ceramics, Glass and Concrete',
    groups: [
      { t: 'sentences', instr: br(SENT, W2N), headerNums: [31, 40], title: 'Ceramics', items: [
        'Ceramics date back approximately {{31}} .',
        'The first figurines were made in the area of {{32}} .',
        'Early humans could not use their pots to store {{33}} .',
        'The Chinese improved the quality of ceramics by mixing {{34}} with the clay.',
        'Chinese porcelain was also called {{35}} .',
        'Bottger added quartz and {{36}} to clay to make porcelain.',
      ] },
      { t: 'sentences', cont: true, title: 'Glass', items: [
        'Glass production is similar to clay ceramics apart from the rate of {{37}} .',
        'The Romans introduced the use of glass to make {{38}} .',
      ] },
      { t: 'sentences', cont: true, title: 'Concrete', items: [
        'The discovery of concrete is probably due to observing reactions of water and {{39}}',
        'The ability to build large {{40}} contributed to the success of the Roman Empire',
      ] },
    ],
    fix: { 31: '29,000 years / 29000 years', 40: 'harbours/harbors' },
  },
  {
    id: 62, title: 'Preparing and Giving a Presentation',
    groups: [
      { t: 'notes', instr: br(NOTES, W2), title: 'Preparing and Giving a Presentation', sections: [
        { h: 'Initial thoughts', items: [
          P('Most important consideration: your audience'),
          P('Three points to bear in mind:'),
          P('– what they need to know', 1),
          P('– how {{31}} they will be', 1),
          P('– how big the audience will be', 1),
        ] },
        { h: 'Structure', items: [P('Start with information that makes the audience {{32}}'), P('End with {{33}}')] },
        { h: 'Design', items: [P('The presentation needs to be {{34}}'), P('Vary content by using a mix of words and {{35}}')] },
        { h: 'Presenting', items: [
          P('Look at the audience, be enthusiastic and energetic'),
          P('Voice – vary speed and {{36}}'),
          P('Occasionally add {{37}} for greater impact'),
          P('Do not use {{38}} (e.g. appears, seems)'),
        ] },
        { h: 'Questions and Interruptions', items: [
          P('When asked a question, first of all you should {{39}}'),
          P('Minimise interruptions by {{40}} them'),
        ] },
      ] },
    ],
  },
  {
    id: 63, title: 'Hair',
    groups: [
      { t: 'notes', instr: br(NOTES, W1N), title: 'HAIR', sections: [
        { h: 'Facts about hair', items: [
          'main purpose – warmth and {{31}}',
          'main component <em>keratin</em> – makes fingernails {{32}}',
          'full head of hair can support a large weight – equal to two {{33}}',
          'average number of strands of hair – {{34}} for an adult',
          'large amount of money spent on {{35}} for hair in the UK',
        ] },
        { h: 'Structure of hair', items: [
          P('Three main parts:'),
          P('a) bulb – like a {{36}} over end of hair follicle', 1),
          P('b) root – contains glands that supply {{37}} to hair strand', 1),
          P('c) shaft – not {{38}}', 1),
        ] },
      ] },
      { t: 'summary', instr: br(SUMMARY, W1), title: 'Health and Hair', paras: [
        'Changes in diet will take longer to affect your hair than your {{39}} .',
        'Vitamins C, D and E are all important for healthy hair and {{40}} are one of the best sources of Vitamin C.',
      ] },
    ],
    fix: { 34: '100,000 / 100000 / 100 000' },
  },
  {
    id: 64, title: 'Maori Kite-making',
    groups: [
      { t: 'notes', instr: br(NOTES, W('ONE WORD')), title: 'Kite-making by the Maori people of New Zealand', sections: [
        { h: 'Making and appearance of the kites', items: [
          'The priests who made the kites had rules for size and scale',
          "{{31}} was not allowed during a kite's preparation",
        ] },
        { h: 'Kites:', items: [
          'often represented a bird, a god, or a {{32}}',
          'had frames that were decorated with grasses and {{33}}',
          'had a line of noisy {{34}} attached to them.',
          'could be triangular, rectangular or {{35}} shaped.',
          'had patterns made from clay mixed with {{36}} oil.',
          'sometimes had human-head masks with {{37}} and a tattoo.',
        ] },
        { h: 'Purpose and function of kites:', items: [
          'a way of sending {{38}} to the gods',
          'a way of telling other villages that a {{39}} was necessary',
          'a means of {{40}} if enemies were coming.',
        ] },
      ] },
    ],
  },
  {
    id: 65, title: 'Rock Art',
    groups: [
      { t: 'notes', instr: br(NOTES, W1), title: 'Rock art', sections: [
        { h: 'Why rock art is important to researchers', items: [P('It provides evidence about'), I('evolution'), I('{{31}}')] },
        { h: 'Global similarities in rock art', items: [
          'humans often had large {{32}}',
          'animals were common, but a {{33}} was always drawn from the side or from above',
          'unlikely that contact through {{34}} resulted in similar artistic styles',
        ] },
        { h: 'Why our ancestors produced rock art', items: [
          P('Research suggests rock art was produced'),
          I('firstly for reasons of {{35}}'),
          I('later for social, spiritual and {{36}} reasons.'),
        ] },
      ] },
      { t: 'notes', instr: br(ANS, W1), sections: [
        { h: '<span style="font-weight:500">What <strong>TWO</strong> images drawn by Aboriginal people show their contact with Europeans?</span>', items: ['{{37}}', '{{38}}'] },
        { h: '<span style="font-weight:500">Which human activities does the lecturer say are the main threats to Aboriginal rock art?</span>', items: ['{{39}}', 'vandalism', '{{40}}'] },
      ] },
    ],
    edits: [{ from: 'Complete the questions below.', to: 'Answer the questions below.', why: 'short-answer instruction' }],
  },
  {
    id: 66, title: 'The Weak-Tie Theory',
    groups: [
      { t: 'summary', instr: br(SUMMARY, W1), title: "The 'weak-tie' theory: how friends-of-friends influence us", paras: [
        "In 1973, Mark Granovetter claimed that the influence of 'weak-ties' can affect the behavior of populations in the fields of information science, politics and {{31}} . Although friends-of-friends may be unlike us, they have similar enough {{32}} to have a beneficial effect on our lives. An example of this influence is when we hear about {{33}} because information about them is provided by weak-ties. Since Granovetter proposed his theory, other studies have shown that weak-tie networks also benefit our {{34}} .",
      ] },
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [35, 36],
        q: 'Which does the speaker believe are <strong>TWO</strong> real benefits of online social networking?',
        o: ['people can gain higher self-esteem', 'people can access useful medical information', 'people can form relationships more quickly', 'people can improve academic performance', 'people can be reliably informed about current affairs'] },
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [37, 38],
        q: 'Which <strong>TWO</strong> problems related to online social networking will increase, according to the speaker?',
        o: ['criminal activity', 'poorer grades at school', 'a decline in physical fitness', 'less work done by employees', 'loss of career prospects'] },
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [39, 40],
        q: 'Which <strong>TWO</strong> claims are made by Robin Dunbar about social networking sites?',
        o: ['They are not helpful for developing certain social skills.', "They cannot fully reveal a person's real character.", 'They are not a good starting point for building new relationships.', 'They do not encourage people to widen their social circle.', 'They will not retain their popularity with the young generation.'] },
    ],
  },
  {
    id: 67, title: 'History of Fireworks in Europe',
    groups: [
      { t: 'notes', instr: br(NOTES, W1), title: 'History of Fireworks in Europe', sections: [
        { h: '13th-16th centuries', items: [
          'Fireworks were introduced from China.',
          'Their use was mainly to do with:',
          P('– war', 1),
          P('– {{31}} (in plays and festivals)', 1),
        ] },
        { h: '17th century', items: [
          'Various features of {{32}} were shown in fireworks displays.',
          'Scientists were interested in using ideas from fireworks displays:',
          P('– to make human {{33}} possible', 1),
          P('– to show the formation of {{34}}', 1),
          '<strong>London:</strong>',
          P('– Scientists were distrustful at first', 1),
          P('– Later, they investigated {{35}} uses of fireworks (e.g. for sailors)', 1),
          '<strong>St Petersburg:</strong>',
          P('– Fireworks were seen as a method of {{36}} for people', 1),
          '<strong>Paris:</strong>',
          P('– Displays emphasised the power of the {{37}}', 1),
          P('– Scientists aimed to provide {{38}}', 1),
        ] },
        { h: '18th century', items: [
          'Italian fireworks specialists became influential.',
          "Servandoni's fireworks display followed the same pattern as an {{39}} .",
          'The appeal of fireworks extended to the middle classes.',
          'Some displays demonstrated new scientific discoveries, such as {{40}} .',
        ] },
      ] },
    ],
    edits: [{ from: 'Complete the notes.', to: 'Complete the notes below.', why: 'standard wording' }],
  },
  {
    id: 68, title: 'New Caledonian Crows',
    groups: [
      { t: 'notes', instr: br(NOTES, W1), title: 'New Caledonian crows and the use of tools', sections: [
        { h: 'Examples of animals using tools', items: [
          'some chimpanzees use stones to break nuts',
          'Betty (New Caledonian crow) made a {{31}} out of wire to move a bucket of food',
        ] },
        { h: 'New Zealand and Oxford experiment', items: [
          'Three stages: crows needed to move a {{32}} in order to reach a short stick; then use the short stick to reach a long stick; then use the long stick to reach food',
        ] },
        { h: 'Oxford research', items: [
          'crows used sticks to investigate whether there was any {{33}} from an object',
          'research was inspired by seeing crows using tools on a piece of cloth to investigate a spider design',
          'Barney used a stick to investigate a snake made of {{34}}',
          'Pierre used a stick to investigate a {{35}}',
          'Corbeau used a stick to investigate a metal toad',
          'the crows only used sticks for the first contact',
        ] },
        { h: 'Conclusions of above research', items: [
          "ability to plan provides interesting evidence of the birds' cognition",
          "unclear whether this is evidence of the birds' {{36}}",
        ] },
        { h: 'Exeter and Oxford research in New Caledonia', items: [
          "scientists have attached very small cameras to birds' {{37}}",
          'food in the form of beetle larvae provides plenty of {{38}} for the birds',
          "larvae's specific {{39}} composition can be identified in birds that feed on them",
          'scientists will analyse what the birds include in their {{40}}',
        ] },
      ] },
    ],
  },
  {
    id: 69, title: 'Seminar on Rock Art',
    groups: [
      { t: 'notes', instr: br(NOTES, W1), title: 'SEMINAR ON ROCK ART', sections: [
        { items: [
          P('Preparation for fieldwork trip to Namibia in {{31}}'),
          P('Rock art in Namibia may be'),
          I('paintings'), I('engravings'),
        ] },
        { h: 'Earliest explanation of engravings of animal footprints', items: [P('They were used to help {{32}} learn about tracking')] },
        { h: 'But:', items: [
          I('Why are the tracks usually {{33}} ?'),
          I('Why are some engravings realistic and others unrealistic?'),
          I('Why are the unrealistic animals sometimes half {{34}} ?'),
        ] },
        { h: 'More recent explanation:', items: [P('Wise men may have been trying to control wild animals with {{35}}')] },
        { h: 'Comment:', items: [P('Earlier explanation was due to scholars over-generalising from their experience of a different culture.')] },
      ] },
      { t: 'sentences', instr: br(SENT, W1), items: [
        'If you look at a site from a {{36}} , you reduce visitor pressure.',
        'To camp on a site may be disrespectful to people from that {{37}} .',
        'Undiscovered material may be damaged by {{38}} .',
        'You should avoid {{39}} or tracing rock art as it is so fragile.',
        'In general, your aim is to leave the site {{40}} .',
      ] },
    ],
  },
  {
    id: 70, title: 'Handedness in Sport',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Left and Right Handedness in Sport', items: [
        { n: 31, q: 'Anita first felt the Matthews article was of value when she realised', o: ['how it would help her difficulties with left-handedness.', 'the relevance of connections he made with music.', 'the impressive size of his research project.'] },
        { n: 32, q: 'Anita feels that the findings on handedness will be of value in', o: ['helping sportspeople identify their weaknesses.', 'aiding sportspeople as they plan tactics for each game.', 'developing suitable training programmes for sportspeople.'] },
        { n: 33, q: 'Anita feels that most sports coaches', o: ['know nothing about the influence of handedness.', 'focus on the wrong aspects of performance.', 'underestimate what science has to offer sport.'] },
        { n: 34, q: 'A German study showed there was greater ‘mixed handedness’ in musicians who', o: ['started playing instruments in early youth.', 'play a string instrument such as the violin.', 'practise a great deal on their instrument.'] },
        { n: 35, q: 'Studies on ape behavior show that', o: ['apes which always use the same hand to get food are most successful.', 'apes have the same proportion of left- and right-handers as humans.', 'more apes are left-handed than right-handed.'] },
      ] },
      { t: 'table', instr: br(TABLE, W1N), head: ['Sport', 'Best laterality', 'Comments'], rows: [
        ['<strong>Hockey</strong>', 'mixed laterality', ul('hockey stick has to be used in {{36}}', 'mixed-handed players found to be much more {{37}} than others')],
        ['<strong>Tennis</strong>', 'single laterality', ul('gives a larger relevant field of {{38}}', 'cross-lateral players make {{39}} too late')],
        ['<strong>Gymnastics</strong>', 'cross laterality', ul('gymnasts’ {{40}} is important for performances')],
      ] },
    ],
    fix: { 36: '2/two directions' },
  },
  {
    id: 71, title: 'Hotels and the Tourist Industry',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Hotels and the tourist industry', items: [
        { n: 31, q: 'According to the speaker, how might a guest feel when staying in a luxury hotel?', o: ['impressed with the facilities', 'depressed by the experience', 'concerned at the high costs'] },
        { n: 32, q: 'According to recent research, luxury hotels overlook the need to', o: ['provide for the demands of important guests.', 'create a comfortable environment.', 'offer an individual and personal welcome.'] },
        { n: 33, q: 'The company focused their research on', o: ['a wide variety of hotels.', 'large, luxury hotel chains.', 'exotic holiday hotels.'] },
        { n: 34, q: 'What is the impact of outside environment on a hotel guest?', o: ['It has a considerable effect.', 'It has a very limited effect.', 'It has no effect whatsoever.'] },
      ] },
      { t: 'notes', instr: br(NOTES, W1), sections: [
        { items: [
          P('A company providing luxury serviced apartments aims to:'),
          I('cater specifically for {{35}} travellers'),
          I('provide a stylish {{36}} for guests to use'),
          I('set a trend throughout the {{37}} which becomes permanent'),
          P('Traditional holiday hotels attract people by:'),
          I('offering the chance to {{38}} their ordinary routine life'),
          I('making sure that they are cared for in all respects – like a {{39}}'),
          I('leaving small treats in their rooms – e.g. cosmetics or {{40}}'),
        ] },
      ] },
    ],
    edits: [{ from: 'MCQs printed as 32–35', to: '31–34', why: 'book misnumbers them (notes are 35–40; key is 31–34)' }],
  },
  {
    id: 72, title: 'Monosodium Glutamate',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Monosodium Glutamate (MSG)', items: [
        { n: 31, q: 'The speaker says the main topic of the lecture is', o: ['the history of monosodium glutamate.', 'the way monosodium glutamate works.', 'where monosodium glutamate is used.'] },
        { n: 32, q: 'In 1908, scientists in Japan', o: ['made monosodium glutamate.', 'began using kombu.', 'identified glutamate.'] },
        { n: 33, q: 'What change occurred in the manufacture of glutamate in 1956?', o: ['It began to be manufactured on a large scale.', 'The Japanese began extracting it from natural sources.', 'It became much more expensive to produce.'] },
      ] },
      { t: 'notes', instr: br(NOTES, W2), title: 'Monosodium Glutamate (MSG)', sections: [{ items: [
        'MSG contains',
        P('– glutamate (78.2%)', 1),
        P('– sodium (12.2%)', 1),
        P('– {{34}} (9.6%)', 1),
        'Glutamate is found in foods that contain protein such as {{35}} and {{36}}',
        'MSG is used in foods in many different parts of the world.',
        'In 1908 Kikunae Ikeda discovered a {{37}} .',
        'Our ability to detect glutamate makes sense because it is so {{38}} naturally.',
        'John Prescott suggests that:',
        P('– sweetness tells us that a food contains carbohydrates.', 1),
        P('– {{39}} tells us that a food contains toxins.', 1),
        P('– sourness tells us that a food is spoiled.', 1),
        P('– saltiness tells us that a food contains {{40}} .', 1),
      ] }] },
    ],
    fix: { 37: '5th/fifth/new taste' },
  },
  {
    id: 73, title: 'Geography',
    groups: [
      { t: 'notes', instr: br(NOTES, W1), title: 'Geography', sections: [
        { h: 'Studying geography helps us to understand:', items: [
          'The effects of different processes on the {{31}} of the Earth',
          'The dynamic between {{32}} and population',
        ] },
        { h: 'Two main branches of study:', items: ['Physical features', 'Human lifestyles and their {{33}}'] },
        { items: [
          P('<strong>Specific study areas:</strong> biophysical, topographic, political, social, economic, historical and {{34}} geography, and also cartography'),
          P('<strong>Key point:</strong> geography helps us to understand our surroundings and the associated {{35}}'),
        ] },
        { h: 'What do geographers do?', items: [
          'find data – e.g. conduct censuses, collect information in the form of {{36}} using computer and satellite technology',
          'analyse data – identify {{37}} , e.g. cause and effect',
          'Publish findings in form of:',
          P('a) maps', 1),
          P('- easy to carry', 2),
          P('- can show physical features of large and small areas', 2),
          P('- BUT a two-dimensional map will always have some {{38}}', 2),
          P('b) aerial photos', 1),
          P('- can show vegetation problems, {{39}} density, ocean floor etc.', 2),
          P('c) Landsat pictures sent to receiving stations', 1),
          P('- used for monitoring {{40}} conditions etc.', 2),
        ] },
      ] },
    ],
  },
  {
    id: 74, title: 'Research on Questions about Doctors',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Research on questions about doctors', items: [
        { n: 31, q: 'In order to set up her research programme, Shona got', o: ['advice from personal friends in other countries.', 'help from students in other countries.', "information from her tutor's contacts in other countries."] },
        { n: 32, q: 'What types of people were included in the research?', o: ['young people in their first job', 'men who were working', 'women who were unemployed'] },
        { n: 33, q: 'Shona says that in her questionnaire her aim was', o: ['to get a wide range of data.', "to limit people's responses.", 'to guide people through interviews.'] },
        { n: 34, q: "What do Shona's initial results show about medical services in Britain?", o: ['Current concerns are misrepresented by the press.', 'Financial issues are critical to the government.', 'Reforms within hospitals have been unsuccessful.'] },
        { n: 35, q: 'Shona needs to do further research in order to', o: ['present the government with her findings.', 'decide the level of extra funding needed.', 'identify the preferences of the public.'] },
        { n: 36, q: 'Shona has learnt from the research project that', o: ['it is important to plan projects carefully.', 'people do not like answering questions.', 'colleagues do not always agree.'] },
      ] },
      { t: 'match', instr: boxMatch('Which statement applies to each of the following people who were interviewed by Shona?', 'FOUR', 'A-F', 37, 40),
        bank: ['gave false data', 'decided to stop participating', 'refused to tell Shona about their job', 'kept changing their mind about participating', 'became very angry with Shona', 'was worried about confidentiality'],
        itemsTitle: 'People interviewed by Shona',
        items: [
          { n: 37, html: 'a person interviewed in the street' }, { n: 38, html: 'an undergraduate at the university' },
          { n: 39, html: 'a colleague in her department' }, { n: 40, html: 'a tutor in a foreign university' },
        ] },
    ],
  },
  {
    id: 75, title: 'Trying to Repeat Success',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Trying to repeat success', items: [
        { n: 31, q: 'Compared to introducing new business processes, attempts to copy existing processes are', o: ['more attractive.', 'more frequent.', 'more straightforward.'] },
        { n: 32, q: 'Most research into the repetition of success in business has', o: ['been done outside the United States.', 'produced consistent findings.', 'related to only a few contexts.'] },
        { n: 33, q: 'What does the speaker say about consulting experts?', o: ['Too few managers ever do it.', 'It can be useful in certain circumstances.', 'Experts are sometimes unwilling to give advice.'] },
        { n: 34, q: "An expert's knowledge about a business system may be incomplete because", o: ['some details are difficult for workers to explain.', 'workers choose not to mention certain details.', 'details are sometimes altered by workers.'] },
      ] },
      { t: 'notes', instr: br(NOTES, W1), title: 'Setting up systems based on an existing process', sections: [
        { h: 'Two mistakes', items: [P('Manager tries to:'), 'improve on the original process', 'create an ideal {{35}} from the best parts of several processes'] },
        { h: 'Cause of problems', items: [
          'information was inaccurate',
          'comparison between the business settings was invalid',
          'disadvantages were overlooked, e.g. effect of changes on {{36}}',
        ] },
        { h: 'Solution', items: [
          'change {{37}}',
          'impose rigorous {{38}}',
          'copy original very closely:',
          P('– physical features of the {{39}}', 1),
          P('– the {{40}} of original employees', 1),
        ] },
      ] },
    ],
  },
  {
    id: 76, title: 'Australian Aboriginal Rock Paintings',
    groups: [
      { t: 'grid', instr: abcNext('Which painting styles have the following features?', 31, 36), title: 'Australian Aboriginal Rock Paintings',
        legendTitle: 'Painting Styles', legend: ['Dynamic', 'Yam', 'Modern'], letters: 'A-C', itemsTitle: 'Features',
        items: [
          { n: 31, html: 'figures revealing bones' }, { n: 32, html: 'rounded figures' }, { n: 33, html: 'figures with parts missing' },
          { n: 34, html: 'figures smaller than life size' }, { n: 35, html: 'sea creatures' }, { n: 36, html: 'plants' },
        ] },
      { t: 'notes', instr: br(NOTES, W2), title: 'Rainbow Serpent Project', sections: [
        { items: [P('<strong>Aim of project:</strong> to identify the {{37}} used as the basis for the Rainbow Serpent')] },
        { h: 'Yam Period', items: ['environmental changes led to higher {{38}}', 'traditional activities were affected, especially {{39}}'] },
        { h: 'Rainbow Serpent image', items: ['similar to a sea horse', 'unusual because it appeared in inland areas', 'symbolises {{40}} in Aboriginal culture'] },
      ] },
    ],
  },
  {
    id: 77, title: 'Mass Strandings of Whales and Dolphins',
    groups: [
      { t: 'notes', instr: br(NOTES, W2), title: 'Mass Strandings of Whales and Dolphins', join: { 33: ' or ' }, sections: [
        { items: [
          P('Mass strandings: situations where groups of whales, dolphins, etc. swim onto the beach and die'),
          P('Common in areas where the {{31}} can change quickly'),
          P('Several other theories:'),
        ] },
        { h: 'Parasites', items: [P("e.g. some parasites can affect marine animals' {{32}} which they depend on for navigation")] },
        { h: 'Toxins', items: [
          P('Poisons from {{33}} or {{33}} are commonly consumed by whales'),
          P('e.g. Cape Cod (1988) – whales were killed by saxitoxin'),
        ] },
        { h: 'Accidental Strandings', items: [
          P('Animals may follow prey ashore, e.g. Thurston (1995)'),
          P('Unlikely because the majority of animals were not {{34}} when they stranded'),
        ] },
        { h: 'Human Activity', items: [
          P('{{35}} from military tests are linked to some recent strandings'),
          P('The Bahamas (2000) stranding was unusual because the whales'),
          'were all {{36}}',
          'were not in a {{37}}',
        ] },
        { h: 'Group Behaviour', items: [
          'More strandings in the most {{38}} species of whales',
          '1994 dolphin stranding – only the {{39}} was ill',
        ] },
        { h: 'Further Reading', items: [P('<em>Marine Mammals Ashore</em> (Connor) – gives information about stranding {{40}}')] },
      ] },
    ],
    fix: { 33: 'plants or animals/fish/fishes / animals/fish/fishes or plants' },
    edits: [{ from: 'information about strading', to: 'stranding', why: 'PDF typo' }],
  },
  {
    id: 78, title: 'Business Cultures',
    groups: [
      { t: 'form', instr: br(NOTES, W1), title: 'Business Cultures', rows: [
        { h: 'Power culture' },
        ['Characteristics of organisation', '– small'],
        ['', '– {{31}} power source'],
        ['', '– few rules and procedures'],
        ['', '– communication by {{32}}'],
        ['Advantage', '– can act quickly'],
        ['Disadvantage', '– might not act {{33}}'],
        ['Suitable employee', '– not afraid of {{34}}'],
        ['', '– doesn’t need job security'],
        { h: 'Role culture' },
        ['Characteristics of organisation', '– large, many {{35}}'],
        ['', '– specialised departments'],
        ['', '– rules and procedure e.g. job {{36}} and rules for discipline'],
        ['Advantages', '– economies of scale'],
        ['', '– successful when {{37}} ability is important'],
        ['Disadvantages', '– slow to see when {{38}} needed'],
        ['', '– slow to react'],
        ['Suitable employee', '– values security'],
        ['', '– doesn’t want {{39}}'],
        { h: 'Task culture' },
        ['Characteristics of organisation', '– project orientated'],
        ['', '– in competitive market or making product with short life'],
        ['', '– a lot of delegation'],
        ['Advantage', '– {{40}}'],
        ['Disadvantages', '– no economies of scale or special expertise'],
        ['Suitable employee', '– likes to work in groups'],
      ] },
    ],
  },
  {
    id: 79, title: 'The Underground House',
    groups: [
      { t: 'mcq', instr: ABC, items: [
        { n: 31, q: 'The owners of the underground house', o: ['had no experience of living in a rural area.', 'were interested in environmental issues.', 'wanted a professional project manager.'] },
        { n: 32, q: 'What does the speaker say about the site of the house?', o: ['The land was quite cheap.', 'Stone was being extracted nearby.', 'It was in a completely unspoilt area.'] },
      ] },
      { t: 'notes', instr: br(NOTES, W1N), title: 'The Underground House', sections: [
        { h: 'Design', items: [
          'Built in the earth, with two floors',
          'The south-facing side was constructed of two layers of {{33}}',
          'Photovoltaic tiles were attached',
          'A layer of foam was used to improve the {{34}} of the building',
        ] },
        { h: 'Special features', items: [
          'To increase the light, the building has many internal mirrors and {{35}}',
          'In future, the house may produce more {{36}} than it needs',
          'Recycled wood was used for the {{37}} of the house',
          'The system for processing domestic {{38}} is organic',
        ] },
        { h: 'Environmental issues', items: [
          'The use of large quantities of {{39}} in construction was environmentally harmful',
          'But the house will have paid its ‘environmental debt’ within {{40}}',
        ] },
      ] },
    ],
    fix: { 40: '15/fifteen years' },
  },
  {
    id: 80, title: 'Wildlife in City Gardens',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Wildlife in city gardens', items: [
        { n: 31, q: 'What led the group to choose their topic?', o: ['They were concerned about the decline of one species.', 'They were interested in the effects of city growth.', 'They wanted to investigate a recent phenomenon.'] },
        { n: 32, q: 'The exact proportion of land devoted to private gardens was confirmed by', o: ['consulting some official documents.', 'taking large-scale photos.', 'discussions with town surveyors.'] },
        { n: 33, q: 'The group asked garden owners to', o: ['take part in formal interviews.', 'keep a record of animals they saw.', 'get in contact when they saw a rare species.'] },
        { n: 34, q: 'The group made their observations in gardens', o: ['which had a large number of animal species.', 'which they considered to be representative.', 'which had stable populations of rare animals.'] },
        { n: 35, q: 'The group did extensive reading on', o: ['wildlife problems in rural areas.', 'urban animal populations.', 'current gardening practices.'] },
        { n: 36, q: 'The speaker focuses on three animal species because', o: ['a lot of data has been obtained about them.', 'the group were most interested in them.', 'they best indicated general trends.'] },
      ] },
      { t: 'table', instr: br(TABLE, W1), head: ['Animals', 'Reason for population increase in gardens', 'Comments'], rows: [
        ['{{37}}', 'suitable stretches of water', 'massive increase in urban population'],
        ['Hedgehogs', 'safer from {{38}} when in cities', 'easy to {{39}} them accurately'],
        ['Song thrushes', '– a variety of {{40}} to eat<br>– more nesting places available', 'large survey starting soon'],
      ] },
    ],
  },
];
