// PART 3 — Tests 41–60 (Questions 21–30). Transcribed from "80 IELTS Listening
// Tests" (Proper English School), pp. 62–98. Answers: ../pdf-answers.json.
import { W, NOTES, TABLE, SENT, SUMMARY, FLOW, ANS, ABC, CHOOSE, br } from './_h.mjs';

const W1N = W('ONE WORD AND/OR A NUMBER');
const W2N = W('NO MORE THAN TWO WORDS AND/OR A NUMBER');
const W3N = W('NO MORE THAN THREE WORDS AND/OR A NUMBER');
const W1 = W('ONE WORD ONLY');
const W2 = W('NO MORE THAN TWO WORDS');
const IMG = (n) => `/tests/img/test${n}.png`;
const boxMatch = (lead, n, range, from, to) =>
  `${lead}<br>Choose <strong>${n}</strong> answers from the box and write the correct letter, <strong>${range.replace('-', '–')}</strong>, next to Questions ${from}–${to}.`;
const abcNext = (lead, from, to) =>
  `${lead}<br>Write the correct letter, <strong>A</strong>, <strong>B</strong> or <strong>C</strong>, next to Questions ${from}–${to}.`;

export default [
  {
    id: 41, title: 'College Computer System',
    groups: [
      { t: 'mcq', instr: ABC, items: [
        { n: 21, q: 'Dave Hedley says that the computer system has', o: ['too many users.', 'never worked well.', 'become outdated.'] },
        { n: 22, q: 'The main problem with the computer system is that it', o: ['is too slow.', 'stops working.', 'displays incorrect data.'] },
        { n: 23, q: 'Timetabling has become an issue because', o: ['there is not enough time for anyone to do it.', 'the system does not handle course options.', 'the courses are constantly changing.'] },
        { n: 24, q: 'To solve the timetabling issues, Randhir suggests that', o: ['students should create their own timetables.', 'Dave should have someone to assist him.', 'the number of courses should be reduced.'] },
        { n: 25, q: 'Randhir says that a new system may', o: ['need to be trialled.', 'still have problems.', 'be more economical.'] },
        { n: 26, q: 'Improving the existing system will take', o: ['a few weeks.', 'four or five months.', 'nine months.'] },
      ] },
      { t: 'flow', instr: br(NOTES, W2), boxes: [
        '<strong>Next steps</strong><br>Get approval from {{27}}',
        'Complete a {{28}} form',
        'Book a {{29}} with the systems analyst',
        'Set up a {{30}} with technologies team',
      ] },
    ],
  },
  {
    id: 42, title: 'Starting University',
    groups: [
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [21, 22],
        q: 'Which <strong>TWO</strong> subjects did Martina like before going to university?',
        o: ['Art', 'English', 'French', 'History', 'Science'] },
      { t: 'summary', instr: br(SUMMARY, W2), title: "George's experience of university", paras: [
        'George is studying Mechanical Engineering which involves several disciplines. He is finding {{23}} the most difficult. At the moment, his course is mainly {{24}} . He will soon have an assignment which involves a study of {{25}} . He thinks there are too many {{26}} and would like less of them.',
      ] },
      { t: 'mcq', instr: ABC, items: [
        { n: 27, q: 'Martina thinks the students at her university are', o: ['sociable.', 'intelligent.', 'energetic.'] },
        { n: 28, q: 'George hopes that his tutor will help him', o: ['lose his shyness.', 'settle into university.', 'get to know his subject better.'] },
        { n: 29, q: 'What does Martina know about her first assignment?', o: ['the topic', 'the length', 'the deadline'] },
        { n: 30, q: 'George would like to live', o: ['in a hall of residence.', 'in a flat on his own.', 'with a host family.'] },
      ] },
    ],
  },
  {
    id: 43, title: 'Paper Production and Recycling',
    groups: [
      { t: 'imggaps', instr: br(FLOW, W2), title: 'Paper Production and Recycling', image: IMG(43), w: 1386, h: 833,
        alt: 'Cycle diagram: production (raw materials, remove bark, chop wood, add … then heat and pulp mixture) and recycling (collect used paper, … used paper, use chemicals, heat and pulp recycled mixture) around paper produced in machine',
        gaps: [
          { n: 21, x: 19.2, y: 16.8, w: 15.4 }, { n: 22, x: 29.7, y: 82.8, w: 9.4 }, { n: 23, x: 54.6, y: 12.4, w: 8.2 },
          { n: 24, x: 87.6, y: 42.0, w: 7.8 }, { n: 25, x: 73.7, y: 75.9, w: 15.6 },
        ] },
      { t: 'short', instr: br(ANS, W2), items: [
        'What part of the assignment is Alan going to start working on? {{26}}',
        'Where will Melanie get more information on used paper collection? {{27}}',
        'What will they add to the assignment to make it more interesting? {{28}}',
        'What do they agree to complete by the end of the month? {{29}}',
        'Who will they ask to review their work? {{30}}',
      ] },
    ],
    edits: [{ from: 'Questions 21-22', to: 'Questions 21–25', why: 'the flow-chart has five gaps' }],
  },
  {
    id: 44, title: 'Food Waste',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Food Waste', items: [
        { n: 21, q: 'What point does Robert make about the 2013 study in Britain?', o: ['It focused more on packaging than wasted food.', 'It proved that households produced more waste than restaurants.', 'It included liquid waste as well as solid waste.'] },
        { n: 22, q: 'The speakers agree that food waste reports should emphasise the connection between carbon dioxide emissions and', o: ['food production.', 'transport of food to landfill sites.', 'distribution of food products.'] },
        { n: 23, q: 'Television programmes now tend to focus on', o: ['the nutritional value of food products.', 'the origin of food products.', 'the chemicals found in food products.'] },
        { n: 24, q: 'For Anna, the most significant point about food waste is', o: ['the moral aspect.', 'the environmental impact.', 'the economic effect.'] },
        { n: 25, q: 'Anna and Robert decide to begin their presentation by', o: ['handing out a questionnaire.', 'providing statistical evidence.', 'showing images of wasted food.'] },
      ] },
      { t: 'match', instr: boxMatch('What advantage do the speakers identify for each of the following projects?', 'FIVE', 'A-G', 26, 30),
        bankTitle: 'Advantages',
        bank: ['It should save time.', 'It will create new jobs.', 'It will benefit local communities.', 'It will make money.', 'It will encourage personal responsibility.', 'It will be easy to advertise.', 'It will involve very little cost.'],
        itemsTitle: 'Projects',
        items: [
          { n: 26, html: 'edible patch' }, { n: 27, html: 'ripeness sensor' }, { n: 28, html: 'waste tracking technology' },
          { n: 29, html: 'smartphone application' }, { n: 30, html: 'food waste composting' },
        ] },
    ],
  },
  {
    id: 45, title: 'Furniture Rossi Case Study',
    groups: [
      { t: 'mcq', instr: ABC, items: [
        { n: 21, q: 'Why has James chosen to do a case study on the company <em>Furniture Rossi</em>?', o: ['It has enjoyed global success.', 'It is still in a developmental phase.', 'It is an example of a foreign company being rebranded for Australia.'] },
        { n: 22, q: 'According to James, why did Luca Rossi start a furniture company?', o: ['Furniture-making was already a family occupation.', 'Rossi saw a need for hand-crafted furniture.', 'The work Rossi had done previously was unrewarding.'] },
        { n: 23, q: 'What gave <em>Furniture Rossi</em> a competitive advantage over other furniture companies?', o: ['its staff', 'its lower prices', 'its locally sourced products'] },
        { n: 24, q: 'What does the tutor recommend James does when writing the second draft of his case study?', o: ['provide more detailed references', 'check for written accuracy', 'add his own views'] },
        { n: 25, q: "What do the tutor and James agree was wrong with James' last presentation?", o: ['It was too short.', 'It focused too much on statistics.', 'There was not enough interaction with the audience.'] },
      ] },
      { t: 'flow', instr: `${FLOW}<br>Choose <strong>FIVE</strong> answers from the list below and write the correct letter, <strong>A–G</strong>, next to Questions 26–30.`,
        title: 'History of Furniture Rossi',
        bank: ['website', 'locations', 'designs', 'TV advertising campaigns', 'quality', 'values', 'software programs'],
        boxes: [
          'The product {{d26}} led to a wider customer base.',
          'Greater customer demand meant other {{d27}} were needed.',
          'Better {{d28}} increased overall profitability.',
          'Changes to the {{d29}} were brought on by customer complaints.',
          '<em>Furniture Rossi</em> wants to make people more aware of its {{d30}} .',
        ] },
    ],
  },
  {
    id: 46, title: 'Biofuels Presentation',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Presentation on the problems and potential of biofuels', items: [
        { n: 21, q: 'Mike suggests they begin their presentation by', o: ['explaining what kind of harm is caused by fossil fuels.', 'pointing out that biofuels were in use before fossil fuels.', 'ensuring students know the difference between fossil fuels and biofuels.'] },
        { n: 22, q: 'Karina doesn’t want to discuss the production of ethanol because', o: ['other students will already be familiar with the process.', 'there will not be time to cover more important information.', 'they may not provide an accurate description.'] },
        { n: 23, q: 'Which source of biofuel do the students agree is least environmentally friendly?', o: ['sugar cane', 'corn', 'canola'] },
        { n: 24, q: 'What is the main problem facing the development of the biofuel industry in the USA?', o: ['inadequate infrastructure for transporting ethanol', 'not enough farmers growing biofuel crops', 'little government support of biofuel development'] },
        { n: 25, q: 'Karina doubts that sugar cane production in Brazil will', o: ['lead to the loss of wildlife habitats.', 'create a large number of jobs in the biofuel sector.', "continue to provide enough energy for the country's needs."] },
        { n: 26, q: 'Karina and Mike conclude that in order to increase the use of biofuels', o: ['the price of fossil fuels must go up.', 'more machinery must be adapted to use them.', 'production methods must be more energy-efficient.'] },
      ] },
      { t: 'notes', instr: br(ANS, W2), sections: [
        { h: '<span style="font-weight:500">What <strong>TWO</strong> biofuel-related problems do Mike and Karina decide to focus on in the last section of their presentation?</span>', items: ['{{27}}', '{{28}}'] },
        { h: '<span style="font-weight:500">Which two sources of biofuel do Mike and Karina say are being tried out?</span>', items: ['{{29}}', 'algae', '{{30}}'] },
      ] },
    ],
    edits: [{ from: 'Mike and Kerina', to: 'Mike and Karina', why: 'PDF typo (name is Karina)' }],
  },
  {
    id: 47, title: 'Marketing Report',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Marketing report', items: [
        { n: 21, q: 'Why did Leo choose instant coffee as the topic for his marketing report?', o: ['He found plenty of material on the topic.', 'He had some practical experience in the area.', 'He had an idea of a brand he wanted to target.'] },
        { n: 22, q: 'Leo discovered that in Australia, recent technological developments', o: ['are producing less healthy types of instant coffee.', 'are reducing the demand for instant coffee.', 'are improving the quality of instant coffee.'] },
        { n: 23, q: "What do the speakers agree about Leo's table of coffee products?", o: ['It needs more explanation in the text.', 'It is factually inaccurate in some places.', 'It would be best to put this in the appendix.'] },
        { n: 24, q: 'What do they decide about the description of Shaffers coffee as a market follower?', o: ['Leo needs to define his terms.', 'Leo needs to provide more evidence.', 'Leo needs to put it in a different section.'] },
        { n: 25, q: "What does Anna say about originality in someone's first marketing report?", o: ['Clear analysis of data can be considered original.', 'Graphs and diagrams should be original, not copied.', 'Reports should contain some original data collected by the student.'] },
        { n: 26, q: 'What difference between his school assignments and this report has surprised Leo?', o: ['not knowing the criteria for getting a good mark', 'being required to produce work without assistance', 'having to do a great deal of research'] },
      ] },
      { t: 'notes', instr: br(NOTES, W1), title: 'Notes on specific sections of marketing report', sections: [
        { h: 'Executive summary', items: ['Give a brief overview including the {{27}}'] },
        { h: 'Problems', items: ['Link each problem to a {{28}} which explains it'] },
        { h: 'Implementation', items: ['Practical solution to problems', 'Include details such as participants, {{29}} and sequence', 'Selection is often poorly done because of lack of {{30}}'] },
        { h: 'Conclusion', items: ['Don’t use new material here'] },
      ] },
    ],
  },
  {
    id: 48, title: 'Training Film Project',
    groups: [
      { t: 'match', instr: boxMatch('What helped Stewart with each of the following stages in making his training film for museum employees?', 'SEVEN', 'A-I', 21, 27),
        bankTitle: 'What helped Stewart',
        bank: ['advice from friends', 'information on a website', 'being allowed extra time', 'meeting a professional film maker', 'good weather conditions', 'getting a better computer', 'support of a manager', 'help from a family member', 'work on a previous assignment'],
        itemsTitle: 'Stages in making the training film for museum employees',
        items: [
          { n: 21, html: 'finding a location' }, { n: 22, html: 'deciding on equipment' }, { n: 23, html: 'writing the script' },
          { n: 24, html: 'casting' }, { n: 25, html: 'filming' }, { n: 26, html: 'editing' }, { n: 27, html: 'designing the DVD cover' },
        ] },
      { t: 'notes', instr: br(NOTES, W1), title: "Stewart's work placement: benefits to the Central Museum Association", sections: [{ items: [
        "his understanding of the Association's {{28}}",
        'the reduction in expense',
        'increased co-operation between {{29}}',
        'continuous {{30}} which led to a better product',
        'ideas for distribution of the film',
      ] }] },
    ],
    edits: [{ from: 'Complete the notes.', to: 'Complete the notes below.', why: 'standard wording' }],
  },
  {
    id: 49, title: 'Individuals in the Workplace',
    groups: [
      { t: 'notes', instr: br(NOTES, W1), title: 'DIFFERENCES BETWEEN INDIVIDUALS IN THE WORKPLACE', sections: [
        { h: 'Individuals bring different:', items: ['ideas', '{{21}}', 'learning experiences'] },
        { h: 'Work behaviour differences are due to:', items: ['personality', '{{22}}'] },
        { h: 'Effects of diversity on companies:', items: [
          { html: '<em>Advantage: diversity develops</em> {{23}}', plain: true, indent: 1 },
          { html: '<em>Disadvantage: diversity can cause conflict</em>', plain: true, indent: 1 },
        ] },
      ] },
      { t: 'mcq', instr: ABC, items: [
        { n: 24, q: 'Janice thinks that employers should encourage workers who are', o: ['potential leaders.', 'open to new ideas.', 'good at teamwork.'] },
        { n: 25, q: 'Janice suggests that managers may find it difficult to', o: ['form successful groups.', 'balance conflicting needs.', 'deal with uncooperative workers.'] },
        { n: 26, q: 'Janice believes employers should look for job applicants who', o: ['can think independently.', 'will obey the system.', 'can solve problems.'] },
        { n: 27, q: 'Janice believes managers should', o: ['demonstrate good behaviour.', 'encourage co-operation early on.', 'increase financial incentives.'] },
      ] },
      { t: 'sentences', instr: br(SENT, W1), items: [
        "All managers need to understand their employees and recognise their company's {{28}} .",
        "When managing change, increasing the company's {{29}} may be more important than employee satisfaction.",
        'During periods of change, managers may have to cope with increased amounts of {{30}} .',
      ] },
    ],
  },
  {
    id: 50, title: 'The Antarctic Centre',
    groups: [
      { t: 'mcq', instr: ABC, items: [
        { n: 21, q: 'The Antarctic Centre was established in Christchurch because', o: ['New Zealand is a member of the Antarctic Treaty.', 'Christchurch is geographically well positioned.', 'the climate of Christchurch is suitable.'] },
        { n: 22, q: 'One role of the Antarctic Centre is to', o: ['provide expeditions with suitable equipment.', 'provide researchers with financial assistance.', 'ensure that research is internationally relevant.'] },
        { n: 23, q: "The purpose of the Visitors' Centre is to", o: ['provide accommodation.', 'run training sessions.', 'show people what Antarctica is like.'] },
        { n: 24, q: 'Dr Merrywhether says that Antarctica is', o: ['unlike any other country.', 'extremely beautiful.', 'too cold for tourists.'] },
        { n: 25, q: 'According to Dr Merrywhether, Antarctica is very cold because', o: ['of the shape of the continent.', 'it is surrounded by a frozen sea.', 'it is an extremely dry continent.'] },
        { n: 26, q: 'Dr Merrywhether thinks Antarctica was part of another continent because', o: ['he has done his own research in the area.', 'there is geological evidence of this.', 'it is very close to South America.'] },
      ] },
      { t: 'table', instr: br(TABLE, W('ONE WORD AND/OR TWO NUMBERS')), title: 'ANTARCTIC TREATY', head: ['Date', 'Event'], join: { 27: ' to ' }, rows: [
        ['1870', '<em>Polar Research meeting</em>'],
        ['{{27}} to {{27}}', '<em>1st International Polar Year</em>'],
        ['1957', '<em>Antarctic Treaty was proposed</em>'],
        ['1959', '<em>Antarctic Treaty was</em> {{28}}'],
      ] },
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [29, 30],
        q: 'Which <strong>TWO</strong> achievements of the Antarctic Treaty are mentioned by the speakers?',
        o: ['no military use', 'animals protected', 'historic sites preserved', 'no nuclear testing', 'fishing rights protected'] },
    ],
    fix: { 27: '1882 to (18)83' },
  },
  {
    id: 51, title: 'Ocean Research: Robotic Floats',
    groups: [
      { t: 'notes', instr: br(NOTES, W1N), title: 'OCEAN RESEARCH', sections: [
        { h: 'The Robotic Float Project', items: ['Float is shaped like a {{21}}', 'Scientists from {{22}} have worked on the project so far'] },
      ] },
      { t: 'imggaps', instr: br('Complete the diagram below.', W1N), image: IMG(51), w: 1004, h: 1008,
        alt: 'The operational cycle: a float dropped into the ocean from a boat, a global satellite and a meteorological station',
        gaps: [{ n: 23, x: 8.2, y: 75.4, w: 14.6 }, { n: 24, x: 36.2, y: 90.5, w: 16.9 }, { n: 25, x: 72.0, y: 73.6, w: 14.4 }] },
      { t: 'grid', instr: abcNext('In what time period can data from the float projects help with the following things?', 26, 30),
        legend: ['At present', 'In the near future', 'In the long-term future'], letters: 'A-C',
        items: [
          { n: 26, html: 'understanding of El Niño' }, { n: 27, html: 'understanding of climate change' }, { n: 28, html: 'naval rescues' },
          { n: 29, html: 'sustainable fishing practices' }, { n: 30, html: 'crop selection' },
        ] },
    ],
    fix: {
      22: '13/thirteen (different) countries',
      24: '50/fifty km(s) / 50/fifty kilometres / 50/fifty kilometers',
    },
  },
  {
    id: 52, title: 'Geography Presentation',
    groups: [
      { t: 'notes', instr: br(SENT, W('NO MORE THAN ONE WORD AND/OR A NUMBER')), sections: [{ items: [
        { html: 'The presentation will last 15 minutes.', plain: true },
        { html: 'There will be {{21}} minutes for questions.', plain: true },
        { html: 'The presentation will not be {{22}} .', plain: true },
      ] }] },
      { t: 'grid', instr: abcNext('What do the students decide about each topic for the geography presentation?', 23, 26),
        legend: ['They will definitely include this topic.', 'They might include this topic.', 'They will not include this topic.'], letters: 'A-C',
        items: [
          { n: 23, html: 'Geographical Location' }, { n: 24, html: 'Economy' },
          { n: 25, html: 'Overview of Education System' }, { n: 26, html: 'Role of English Language' },
        ] },
      { t: 'table', instr: br(TABLE, W2), head: ['Information/visual aid', 'Where from?'], rows: [
        ['Overhead projector', 'the {{27}}'],
        ['Map of West Africa', 'the {{28}}'],
        ['Map of the islands', 'a tourist brochure'],
        ['Literacy figures', 'the {{29}}'],
        ['{{30}} on school places', 'as above'],
      ] },
    ],
    fix: { 21: '5/five' },
  },
  {
    id: 53, title: 'Field Trip Proposal',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Field Trip Proposal', items: [
        { n: 21, q: 'The tutor thinks that Sandra’s proposal', o: ['should be re-ordered in some parts.', 'needs a contents page.', 'ought to include more information.'] },
        { n: 22, q: 'The proposal would be easier to follow if Sandra', o: ['inserted subheadings.', 'used more paragraphs.', 'shortened her sentences.'] },
        { n: 23, q: "What was the problem with the formatting on Sandra's proposal?", o: ['Separate points were not clearly identified.', 'The headings were not always clear.', 'Page numbering was not used in an appropriate way.'] },
        { n: 24, q: 'Sandra became interested in visiting the Navajo National Park through', o: ['articles she read.', 'movies she saw as a child.', 'photographs she found on the internet.'] },
      ] },
      { t: 'multi', instr: CHOOSE('THREE', 'A-G'), n: [25, 26, 27],
        q: 'Which <strong>THREE</strong> topics does Sandra agree to include in the proposal?',
        o: ['climate change', 'field trip activities', 'geographical features', 'impact of tourism', 'myths and legends', 'plant and animal life', 'social history'] },
      { t: 'sentences', instr: br(SENT, W1N), items: [
        'The tribal park covers {{28}} hectares.',
        'Sandra suggests that they share the {{29}} for transport.',
        'She says they could also explore the local {{30}} .',
      ] },
    ],
    fix: { 28: '12,000 / 12000' },
  },
  {
    id: 54, title: 'Honey Bees in Australia',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Honey Bees in Australia', items: [
        { n: 21, q: 'Where in Australia have Asian honey bees been found in the past?', o: ['Queensland', 'New South Wales', 'several states'] },
        { n: 22, q: 'A problem with Asian honey bees is that they', o: ['attack native bees.', 'carry parasites.', 'damage crops.'] },
        { n: 23, q: 'What point is made about Australian bees?', o: ['Their honey varies in quality.', 'Their size stops them from pollinating some flowers.', 'They are sold to customers abroad.'] },
        { n: 24, q: 'Grant Freeman says that if Asian honey bees got into Australia,', o: ["the country's economy would be affected.", 'they could be used in the study of allergies.', 'certain areas of agriculture would benefit.'] },
      ] },
      { t: 'summary', instr: br(SUMMARY, W1), title: 'Looking for Asian honey bees', paras: [
        'Birds called Rainbow Bee Eaters eat only {{25}} and cough up small bits of skeleton and other products in a pellet.',
        'Researchers go to the locations the bee eaters like to use for {{26}} . They collect the pellets and take them to a {{27}} for analysis.',
        'Here {{28}} is used to soften them, and the researchers look for the {{29}} of Asian bees in the pellets.',
        'The benefit of this research is that the result is more {{30}} than searching for live Asian bees',
      ] },
    ],
  },
  {
    id: 55, title: 'Latin American Studies',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Latin American studies', items: [
        { n: 21, q: 'Paul decided to get work experience in South America because he wanted', o: ['to teach English there.', 'to improve his Spanish.', 'to learn about Latin American life.'] },
        { n: 22, q: 'What project work did Paul originally intend to get involved in?', o: ['construction', 'agriculture', 'tourism'] },
        { n: 23, q: 'Why did Paul change from one project to another?', o: ['His first job was not well organised.', 'He found doing the routine work very boring.', 'The work was too physically demanding.'] },
        { n: 24, q: 'In the village community, he learnt how important it was to', o: ['respect family life.', 'develop trust.', 'use money wisely.'] },
        { n: 25, q: 'What does Paul say about his project manager?', o: ['He let Paul do most of the work.', 'His plans were too ambitious.', 'He was very supportive of Paul.'] },
        { n: 26, q: 'Paul was surprised to be given', o: ['a computer to use.', 'so little money to live on.', 'an extension to his contract.'] },
      ] },
      { t: 'grid', instr: abcNext('What does Paul decide about each of the following modules?', 27, 30),
        legend: ['He will do this.', 'He might do this.', "He won't do this."], letters: 'A-C', itemsTitle: 'Module',
        items: [
          { n: 27, html: 'Gender Studies in Latin America' }, { n: 28, html: 'Second Language Acquisition' },
          { n: 29, html: "Indigenous Women's Lives" }, { n: 30, html: 'Portuguese Language Studies' },
        ] },
    ],
  },
  {
    id: 56, title: 'Course Funding and Exam Preparation',
    groups: [
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [21, 22],
        q: 'In which <strong>TWO</strong> ways is Dan financing his course?',
        o: ['He is receiving money from the government.', 'His family are willing to help him.', 'The college is giving him a small grant.', 'His local council is supporting him for a limited period.', 'A former employer is providing partial funding.'] },
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [23, 24],
        q: 'Which <strong>TWO</strong> reasons does Jeannie give for deciding to leave some college clubs?',
        o: ['She is not sufficiently challenged.', 'The activity interferes with her studies.', 'She does not have enough time.', 'The activity is too demanding physically.', 'She does not think she is any good at the activity.'] },
      { t: 'mcq', instr: ABC, items: [
        { n: 25, q: 'What does Dan say about the seminars on the course?', o: ['The other students do not give him a chance to speak.', 'The seminars make him feel inferior to the other students.', 'The preparation for seminars takes too much time.'] },
        { n: 26, q: 'What does Jeannie say about the tutorials on the course?', o: ['They are an inefficient way of providing guidance.', 'They are more challenging than she had expected.', 'They are helping her to develop her study skills.'] },
      ] },
      { t: 'flow', instr: br(FLOW, W2N), title: 'Advice on exam preparation', boxes: [
        'Make sure you know the exam requirements',
        'Find some past papers',
        'Work out your {{27}} for revision and write them on a card',
        'Make a {{28}} and keep it in view',
        'Divide revision into {{29}} for each day',
        'Write one {{30}} about each topic',
        'Practice writing some exam answers',
      ] },
    ],
    edits: [{ from: 'Choose NO MORE THAN TWO WORDS AND/OR NUMBER', to: 'NO MORE THAN TWO WORDS AND/OR A NUMBER', why: 'PDF typo (Choose → Write; adds A)' }],
  },
  {
    id: 57, title: 'Course Feedback',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Course Feedback', items: [
        { n: 21, q: 'One reason why Spiros felt happy about his marketing presentation was that', o: ['he was not nervous.', 'his style was good.', 'the presentation was the best in his group.'] },
        { n: 22, q: "What surprised Hiroko about the other students' presentations?", o: ['Their presentations were not interesting.', 'They found their presentations stressful.', 'They didn’t look at the audience enough.'] },
        { n: 23, q: 'After she gave her presentation, Hiroko felt', o: ['delighted.', 'dissatisfied.', 'embarrassed.'] },
        { n: 24, q: 'How does Spiros feel about his performance in tutorials?', o: ['not very happy', 'really pleased', 'fairly confident'] },
        { n: 25, q: 'Why can the other students participate so easily in discussions?', o: ['They are polite to each other.', 'They agree to take turns in speaking.', 'They know each other well.'] },
        { n: 26, q: 'Why is Hiroko feeling more positive about tutorials now?', o: ["She finds the other students' opinions more interesting.", 'She is making more of a contribution.', 'The tutor includes her in the discussion.'] },
        { n: 27, q: 'To help her understand lectures, Hiroko', o: ['consulted reference materials.', 'had extra tutorials with her lecturers.', 'borrowed lecture notes from other students.'] },
        { n: 28, q: 'What does Spiros think of his reading skills?', o: ['He reads faster than he used to.', 'It still takes him a long time to read.', 'He tends to struggle with new vocabulary.'] },
        { n: 29, q: "What is Hiroko's subject area?", o: ['environmental studies', 'health education', 'engineering'] },
        { n: 30, q: 'Hiroko thinks that in the reading classes the students should', o: ['learn more vocabulary.', 'read more in their own subject areas.', 'develop better reading strategies.'] },
      ] },
    ],
  },
  {
    id: 58, title: 'Self-Access Centre',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Self-Access Centre', items: [
        { n: 21, q: 'Students want to keep the Self-Access Centre because', o: ['they enjoy the variety of equipment.', 'they like being able to work on their own.', 'it is an important part of their studies.'] },
        { n: 22, q: 'Some teachers would prefer to', o: ['close the Self-Access Centre.', 'move the Self-Access Centre elsewhere.', 'restrict access to the Self-Access Centre.'] },
        { n: 23, q: "The students' main concern about using the library would be", o: ['the size of the library.', 'difficulty in getting help.', 'the lack of materials.'] },
        { n: 24, q: 'The Director of Studies is concerned about', o: ['the cost of upgrading the centre.', 'the lack of space in the centre.', 'the difficulty in supervising the centre.'] },
      ] },
      { t: 'notes', instr: br(NOTES, W2), title: 'Necessary improvements to the existing Self-Access Centre', sections: [
        { h: 'Equipment', items: [{ html: 'Replace computers to create more space.', plain: true }] },
        { h: 'Resources', items: [
          { html: 'The level of the {{25}} materials, in particular, should be more clearly shown.', plain: true },
          { html: 'Update the {{26}} collection.', plain: true },
          { html: 'Buy some {{27}} and divide them up.', plain: true },
        ] },
        { h: 'Use of the room', items: [
          { html: 'Speak to the teachers and organise a {{28}} for supervising the centre.', plain: true },
          { html: 'Install an {{29}} .', plain: true },
          { html: 'Restrict personal use of {{30}} on computers.', plain: true },
        ] },
      ] },
    ],
  },
  {
    id: 59, title: 'Study Skills Tutorial',
    groups: [
      { t: 'form', instr: br(NOTES, W2N), headerNums: [21, 30], title: 'Study Skills Tutorial – Caroline Benning', rows: [
        ['Dissertation topic', 'the {{21}}'],
        ['Strengths', '• {{22}}'],
        ['', '• computer modelling'],
        ['Weaknesses', '• lack of background information'],
        ['', '• poor {{23}} skills'],
      ] },
      { t: 'table', cont: true, head: ['Possible strategy', 'Benefits', 'Problems'], rows: [
        ['peer group discussion', 'increases {{24}}', 'dissertations tend to contain the same {{25}}'],
        ['use the {{26}} service', 'provides structured programme', 'limited {{27}}'],
        ['consult study skills books', 'are a good source of reference', 'can be too {{28}}'],
      ] },
      { t: 'form', cont: true, rows: [
        ['<strong>Recommendations</strong>', '• use a card index'],
        ['', '• read all notes {{29}}'],
        ['<strong>Next tutorial date</strong>', '{{30}} January'],
      ] },
    ],
    fix: { 29: '3/three times', 30: '25(th)' },
  },
  {
    id: 60, title: "Studying Abroad: Kira's Year",
    groups: [
      { t: 'mcq', instr: ABC, items: [
        { n: 21, q: 'In her home country, Kira had', o: ['completed a course.', 'done two years of a course.', 'found her course difficult.'] },
        { n: 22, q: 'To succeed with assignments, Kira had to', o: ['read faster.', 'write faster.', 'change her way of thinking.'] },
      ] },
      { t: 'sentences', instr: br(SENT, W1), items: [
        'Kira says that lecturers are easier to {{23}} than those in her home country.',
        'Paul suggests that Kira may be more {{24}} than when she was studying before.',
        'Kira says that students want to discuss things that worry them or that {{25}} them very much.',
      ] },
      { t: 'short', instr: br(ANS, W3N), items: [
        'How did the students do their practical sessions? {{26}}',
        'In the second semester how often did Kira work in a hospital? {{27}}',
        'How much full-time work did Kira do during the year? {{28}}',
        'Having completed the year, how does Kira feel? {{29}}',
        'In addition to the language, what do overseas students need to become familiar with? {{30}}',
      ] },
    ],
    fix: {
      26: '(in) groups',
      27: 'every 2/two days',
      28: '2/two weeks',
      30: '(the) education system',
    },
  },
];
