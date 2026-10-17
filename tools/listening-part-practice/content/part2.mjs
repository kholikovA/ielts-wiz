// PART 2 — Tests 21–40 (Questions 11–20). Transcribed from "80 IELTS Listening
// Tests" (Proper English School), pp. 27–61. Maps/plans/diagrams are the
// book's own images (public/tests/img/). Answers: ../pdf-answers.json.
import { W, NOTES, FORM, TABLE, SENT, ANS, ABC, CHOOSE, br, ul } from './_h.mjs';

const W2N = W('NO MORE THAN TWO WORDS AND/OR A NUMBER');
const W3N = W('NO MORE THAN THREE WORDS AND/OR A NUMBER');
const W1N = W('ONE WORD AND/OR A NUMBER');
const W2 = W('NO MORE THAN TWO WORDS');
const W3 = W('NO MORE THAN THREE WORDS');
const IMG = (n) => `/tests/img/test${n}.png`;
const labelLetters = (what, range, from, to) =>
  `Label the ${what} below.<br>Write the correct letter, <strong>${range.replace('-', '–')}</strong>, next to Questions ${from}–${to}.`;
const boxMatch = (lead, n, range, from, to) =>
  `${lead}<br>Choose <strong>${n}</strong> answers from the box and write the correct letter, <strong>${range.replace('-', '–')}</strong>, next to Questions ${from}–${to}.`;
const abcNext = (lead, from, to) =>
  `${lead}<br>Write the correct letter, <strong>A</strong>, <strong>B</strong> or <strong>C</strong>, next to Questions ${from}–${to}.`;

/** Pie chart with the given fraction shaded clockwise from 12 o'clock. */
function pie(letter, frac) {
  const a = frac * 2 * Math.PI;
  const x = (37 + 34 * Math.sin(a)).toFixed(1);
  const y = (37 - 34 * Math.cos(a)).toFixed(1);
  const large = frac > 0.5 ? 1 : 0;
  return `<span class="opt-figure"><svg viewBox="0 0 74 74" role="img" aria-label="Pie chart ${letter}">`
    + `<path d="M37 37 L37 3 A34 34 0 ${large} 1 ${x} ${y} Z" fill="currentColor" fill-opacity="0.32"/>`
    + `<circle cx="37" cy="37" r="34" fill="none" stroke="currentColor" stroke-width="1.5"/>`
    + `<line x1="37" y1="37" x2="37" y2="3" stroke="currentColor" stroke-width="1.2"/>`
    + `<line x1="37" y1="37" x2="${x}" y2="${y}" stroke="currentColor" stroke-width="1.2"/>`
    + `</svg><strong>${letter}</strong></span>`;
}

export default [
  {
    id: 21, title: 'Pacton-on-Sea Bus Tour',
    groups: [
      { t: 'table', instr: br(TABLE, W3N), title: 'PACTON-ON-SEA BUS TOUR', head: ['Bus stops', 'Location', 'Things to see'], rows: [
        ['Bus stop 1', 'train station', 'start of tour'],
        ['Bus stop 2', 'the aquarium', 'dolphins and {{11}}'],
        ['Bus stop 3', '{{12}}', 'yachts and power boats'],
        ['Bus stop 4', '{{13}} centre', 'very old {{14}}'],
      ] },
      { t: 'sentences', instr: br(SENT, W2N), items: [
        'You need to have a {{15}} to buy a ticket for £10.',
        'The bus tour lasts {{16}} in total.',
        'The cost of the bus ticket includes entrance to the {{17}} .',
        'You can listen to an audio commentary which has been made by the {{18}}',
        'If the weather is wet, it is a good idea to bring {{19}} .',
        'Don’t forget to bring your {{20}} when you book online.',
      ] },
    ],
    fix: { 12: 'old fishing village', 20: 'e(-)ticket / e ticket' },
  },
  {
    id: 22, title: 'Sea Life Centre',
    groups: [
      { t: 'short', instr: br(ANS, W3), title: 'Sea Life Centre – information', items: [
        'What was the Sea Life Centre previously called? {{11}}',
        'What is the newest attraction called? {{12}}',
        'When is the main feeding time? {{13}}',
        'What can you do with a VIP ticket? {{14}}',
        'What special event will the Sea Life Centre arrange for you? {{15}}',
        'Where will the petition for animal conservation be sent to? {{16}}',
        'What can you use to test what you have learnt? {{17}}',
      ] },
      { t: 'match', instr: boxMatch('What does the guide say about each attraction?', 'THREE', 'A-E', 18, 20),
        bank: ['Aquarium', 'Crocodile Cave', 'Penguin Park', 'Seal Centre', 'Turtle Town'],
        items: [{ n: 18, html: 'must not miss' }, { n: 19, html: 'temporarily closed' }, { n: 20, html: 'large queues' }] },
    ],
    fix: { 11: 'world of water', 13: "(at) noon / (at) midday / (at) 12 o'clock / (at) 12 pm" },
    edits: [{ from: 'Complete the questions below.', to: 'Answer the questions below.', why: 'short-answer instruction' }],
  },
  {
    id: 23, title: 'Hotel Event Arrangements',
    groups: [
      { t: 'mcq', instr: ABC, items: [
        { n: 11, q: 'The next event at the hotel will be a', o: ['trade fair.', 'wedding.', 'party.'] },
        { n: 12, q: 'The number of guests will be', o: ['less than 50.', 'from 50 to 100.', 'more than 100.'] },
        { n: 13, q: 'Guests will start arriving at', o: ['7.15.', '7.30.', '7.45.'] },
        { n: 14, q: 'The entertainment will be a', o: ['live band.', 'comedian.', 'magician.'] },
      ] },
      { t: 'match', instr: boxMatch('Who will be responsible for the following jobs as the guests arrive?', 'THREE', 'A-E', 15, 17),
        bank: ['Susan', 'Ahmed', 'Gary', 'Olav', 'Monica'],
        items: [{ n: 15, html: 'offer drinks to guests' }, { n: 16, html: "take guests' coats and hats" }, { n: 17, html: 'show guests where to go' }] },
      { t: 'sentences', instr: br(SENT, W3), title: 'General instructions', items: [
        'In order to get the guests to move to the restaurant the hotel manager will {{18}}',
        'Seating plans will be placed on each table and also in the {{19}} .',
        'There will be a total of three {{20}} .',
      ] },
    ],
  },
  {
    id: 24, title: 'Hadley Park Community Gardens',
    groups: [
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [11, 12],
        q: 'Which <strong>TWO</strong> tasks will the volunteers in Group A be responsible for?',
        o: ['widening pathways', 'planting trees', 'picking up rubbish', 'putting up signs', 'building fences'] },
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [13, 14],
        q: 'Which <strong>TWO</strong> items should volunteers in Group A bring with them?',
        o: ['food and water', 'boots', 'gloves', 'raincoats', 'their own tools'] },
      { t: 'grid', instr: labelLetters('plan', 'A-I', 15, 20), image: IMG(24), w: 1173, h: 1110,
        alt: 'Plan of Hadley Park Community Gardens Project with locations A to I', letters: 'A-I',
        items: [
          { n: 15, html: 'Vegetables beds' }, { n: 16, html: 'Bee hives' }, { n: 17, html: 'Seating' },
          { n: 18, html: 'Adventure playground' }, { n: 19, html: 'Sand area' }, { n: 20, html: 'Pond' },
        ] },
    ],
  },
  {
    id: 25, title: 'Town Map and Walking Tracks',
    groups: [
      { t: 'grid', instr: labelLetters('map', 'A-H', 11, 15), image: IMG(25), w: 991, h: 555,
        alt: 'Town map with Pine Street, Willow Lane, Mountain Road, pond and locations A to H', letters: 'A-H',
        items: [
          { n: 11, html: 'supermarket' }, { n: 12, html: 'climbing supplies store' }, { n: 13, html: 'museum' },
          { n: 14, html: 'bike hire' }, { n: 15, html: 'café' },
        ] },
      { t: 'grid', instr: abcNext('What comment does the speaker make about each of the following tracks?', 16, 20),
        legend: ['It is possible to get lost here.', 'It only offers basic accommodation.', 'It requires physical strength.'],
        letters: 'A-C', itemsTitle: 'Track',
        items: [
          { n: 16, html: 'North Point' }, { n: 17, html: 'Silver River' }, { n: 18, html: 'Valley Crossing' },
          { n: 19, html: 'Stonebridge' }, { n: 20, html: 'Henderson Ridge' },
        ] },
    ],
  },
  {
    id: 26, title: 'Neighbourhood Crime Prevention',
    groups: [
      { t: 'sentences', instr: br(SENT, W2), items: [
        'The police officer suggests neighbours give each other their {{11}} .',
        "Neighbours should discuss what to do if there's any kind of {{12}} .",
        "It's a good idea to leave on the {{13}} .",
        'Think carefully about where you put any {{14}} .',
        "It's a good idea to buy good-quality {{15}} .",
      ] },
      { t: 'match', instr: boxMatch('Which crime prevention measure is proposed for each area affected by crime?', 'FIVE', 'A-G', 16, 20),
        bankTitle: 'Proposed crime prevention measures',
        bank: ['install more lighting', 'have more police officers on patrol', 'remove surrounding vegetation', 'contact local police', 'fix damage quickly', 'change road design', 'use security cameras'],
        itemsTitle: 'Areas affected by crime',
        items: [
          { n: 16, html: 'skate park' }, { n: 17, html: 'local primary schools' }, { n: 18, html: 'Abbotsford Street' },
          { n: 19, html: 'shops on Victoria Street' }, { n: 20, html: 'supermarket car park' },
        ] },
    ],
  },
  {
    id: 27, title: 'Anglia Sculpture Park',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Anglia Sculpture Park', items: [
        { n: 11, q: 'The land where the Sculpture Park is located was previously', o: ['completely covered by forest.', 'the site of a private house.', 'occupied by a factory.'] },
        { n: 12, q: 'What is unusual about the Anglia Sculpture Park?', o: ['Artists have made sculptures especially for it.', 'Some of its sculptures were donated by the artists.', 'It only shows contemporary sculptures.'] },
        { n: 13, q: "What is the theme of Joe Tremain’s 'burnt' sculptures?", o: ['the contrast between nature and urban life', 'the effect of man on the environment', 'the violence of nature'] },
        { n: 14, q: 'The path by the Lower Lake', o: ['is rather wet in some places.', 'has recently been repaired.', 'is difficult to walk on.'] },
        { n: 15, q: 'What does the speaker say about the Visitor Centre?', o: ['It is being enlarged at present.', 'It has received an international award.', 'It was designed by a Canadian architect.'] },
        { n: 16, q: 'Today, visitors can buy snacks and sandwiches', o: ['at the kiosk.', 'in the Terrace Room.', 'at the Lower Lake Café.'] },
      ] },
      { t: 'grid', instr: labelLetters('map', 'A-F', 17, 20), image: IMG(27), w: 977, h: 925,
        alt: 'Map of Anglia Sculpture Park with Upper and Lower Lake, bridge and locations A to F', letters: 'A-F',
        items: [
          { n: 17, html: 'Joe Tremain sculptures' }, { n: 18, html: 'Giorgio Catalucci bird sculptures' },
          { n: 19, html: 'Garden Gallery' }, { n: 20, html: 'Long House' },
        ] },
    ],
  },
  {
    id: 28, title: 'Learning Resource Centre',
    groups: [
      { t: 'grid', instr: labelLetters('plan', 'A-H', 11, 15), title: 'Plan of learning Resource Centre (Ground Floor)',
        image: IMG(28), w: 798, h: 575, alt: 'Ground-floor plan of the Learning Resource Centre with study area, stairs, desk, entrance and locations A to H', letters: 'A-H',
        items: [
          { n: 11, html: 'Newspapers' }, { n: 12, html: 'Computers' }, { n: 13, html: 'Photocopier' },
          { n: 14, html: 'Café' }, { n: 15, html: 'Sports books' },
        ] },
      { t: 'table', instr: br(TABLE, W('ONE WORD ONLY')), title: 'New staff responsibilities', head: ['Name', 'New responsibility'], rows: [
        ['<strong>Jenny Reed</strong>', 'Buying {{16}} for the Centre'],
        ['<strong>Phil Penshurst</strong>', 'Help with writing {{17}} for courses'],
        ['<strong>Tom Salisbury</strong>', 'Information on topics related to the {{18}}'],
        ['<strong>Saeed Aktar</strong>', 'Finding a {{19}}'],
        ['<strong>Shilpa Desai</strong>', 'Help with {{20}}'],
      ] },
    ],
  },
  {
    id: 29, title: 'PS Camping Holidays',
    groups: [
      { t: 'mcq', instr: ABC, items: [
        { n: 11, q: 'PS Camping has been organising holidays for', o: ['15 years.', '20 years.', '25 years.'] },
        { n: 12, q: 'The company has most camping sites in', o: ['France.', 'Italy.', 'Switzerland.'] },
        { n: 13, q: 'Which organised activity can children do every day of the week?', o: ['football', 'drama', 'model making'] },
        { n: 14, q: 'Some areas of the sites have a ‘no noise’ rule after', o: ['9.30 p.m.', '10.00 p.m.', '10.30 p.m.'] },
        { n: 15, q: 'The holiday insurance that is offered by PS Camping', o: ['can be charged on an annual basis.', 'is included in the price of the holiday.', 'must be taken out at the time of booking.'] },
        { n: 16, q: 'Customers who recommend PS Camping to friends will receive', o: ['a free gift.', 'an upgrade to a luxury tent.', 'a discount.'] },
      ] },
      { t: 'grid', instr: abcNext('What does the speaker say about the following items?', 17, 20),
        legend: ['They are provided in all tents.', 'They are found in central areas of the campsite.', 'They are available on request.'],
        letters: 'A-C',
        items: [
          { n: 17, html: 'barbecues' }, { n: 18, html: 'toys' }, { n: 19, html: 'cool boxes' }, { n: 20, html: 'mops and buckets' },
        ] },
    ],
  },
  {
    id: 30, title: 'Boat Trip and City Tours',
    groups: [
      { t: 'imggaps', instr: br('Label the plan below.', W2), image: IMG(30), w: 866, h: 453,
        alt: 'Boat trip route along the river with Stop A Green Banks, Stop B, Stop C Roman Landing and Stop D',
        gaps: [{ n: 11, x: 31.2, y: 89.8, w: 20.5 }, { n: 12, x: 71.0, y: 41.5, w: 21.4 }] },
      { t: 'table', instr: br(TABLE, W2N), head: ['', 'Attraction', 'Further Information'], rows: [
        ['<strong>STOP A:</strong><br>Main Booking Office:<br>First boat: 8 a.m.<br>Last boat:<br>{{13}} p.m.', 'Palace', ul('has lovely {{14}}')],
        ['<strong>STOP B:</strong>', '{{15}}', ul('has good {{16}} of city centre')],
        ['<strong>STOP C:</strong>', 'Museum', ul('bookshop specialising in the {{17}} of the local area')],
        ['<strong>STOP D:</strong>', 'Entertainment Complex', ul('{{18}} cinema', 'bowling alley', 'video games arcade')],
      ] },
      { t: 'short', instr: br(ANS, W3N), items: [
        'How often do the Top Bus Company tours run? {{19}}',
        'Where can you catch a Number One Sightseeing Tour from? {{20}}',
      ] },
    ],
    fix: {
      18: '7/seven screen',
      19: 'every 20/twenty minutes / every 20/twenty mins',
      20: '(from) (the) Central Station',
    },
    edits: [{ from: 'Write NO MORE THAN THREE WORDS…', to: 'Answer the questions below.', why: 'instruction line missing in book' }],
  },
  {
    id: 31, title: 'Sponsored Walking Holiday',
    groups: [
      { t: 'mcq', instr: ABC, title: 'SPONSORED WALKING HOLIDAY', items: [
        { n: 11, q: 'On the holiday, you will be walking for', o: ['6 days.', '8 days.', '10 days.'] },
        { n: 12, q: 'What proportion of the sponsorship money goes to charity?',
          pre: '<div class="pie-legend"><span class="pie-swatch" style="background:currentColor;opacity:.32"></span>Money going to charity</div>',
          o: [pie('A', 1 / 3), pie('B', 1 / 2), pie('C', 2 / 3)], optText: ['Chart A', 'Chart B', 'Chart C'] },
        { n: 13, q: 'Each walker’s sponsorship money goes to one', o: ['student.', 'teacher.', 'school.'] },
        { n: 14, q: 'When you start the trek you must be', o: ['interested in getting fit.', 'already quite fit.', 'already very fit.'] },
        { n: 15, q: 'As you walk you will carry', o: ['all of your belongings.', 'some of your belongings.', 'none of your belongings.'] },
        { n: 16, q: 'The Semira Region has a long tradition of', o: ['making carpets.', 'weaving blankets.', 'carving wood.'] },
      ] },
      { t: 'table', instr: br(FORM, W('ONE WORD ONLY')), title: 'ITINERARY', rows: [
        ['Day 1', 'arrive in Kishba'], ['Day 2', 'rest day'], ['Day 3', 'spend all day in a {{17}}'],
        ['Day 4', 'visit a school'], ['Day 5', 'rest day'], ['Day 6', 'see a {{18}} with old carvings'],
        ['Day 7', 'rest day'], ['Day 8', 'swim in a {{19}}'], ['Day 9', 'visit a {{20}}'], ['Day 10', 'depart from kishba'],
      ] },
    ],
  },
  {
    id: 32, title: 'Bicentennial Park Tour',
    groups: [
      { t: 'mcq', instr: ABC, items: [
        { n: 11, q: 'What kind of tour is Sally leading?', o: ['a bus tour', 'a train tour', 'a walking tour'] },
        { n: 12, q: 'The original buildings on the site were', o: ['houses.', 'industrial buildings.', 'shops.'] },
        { n: 13, q: 'The local residents wanted to use the site for', o: ['leisure.', 'apartment blocks.', 'a sports centre.'] },
        { n: 14, q: 'The Tower is at the centre of the', o: ['nature reserve.', 'formal gardens.', 'Bicentennial Park.'] },
      ] },
      { t: 'imggaps', instr: br('Label the plan below.', W2), image: IMG(32), w: 1071, h: 789,
        alt: 'Plan of the park and Olympic site: lake, island, tower, benches, pond, stadium, swimming pool, indoor arena and station',
        gaps: [{ n: 15, x: 65.8, y: 97.0, w: 17.4 }, { n: 16, x: 6.8, y: 82.6, w: 16.8 }, { n: 17, x: 47.7, y: 38.7, w: 16.8 }] },
      { t: 'table', instr: br(TABLE, W2), title: 'Nature Reserve', head: ['Area', 'Facility', 'Activity'], rows: [
        ['The Mangroves', 'boardwalk', '{{18}}'],
        ['Frog Pond', 'outdoor classroom', '{{19}}'],
        ['The Waterbird Refuge', '{{20}}', 'bird watching'],
      ] },
    ],
  },
  {
    id: 33, title: 'The Dinosaur Museum',
    groups: [
      { t: 'sentences', instr: br(SENT, W2N), title: 'The Dinosaur Museum', items: [
        'The museum closes at {{11}} p.m. on Mondays.',
        'The museum is not open on {{12}} .',
        'School groups are met by tour guides in the {{13}} .',
        'The whole visit takes 90 minutes, including {{14}} minutes for the guided tour.',
        'There are {{15}} behind the museum where students can have lunch.',
      ] },
      { t: 'multi', instr: CHOOSE('THREE', 'A-G'), n: [16, 17, 18],
        q: 'Which <strong>THREE</strong> activities can students have with them in the museum?',
        o: ['food', 'water', 'cameras', 'books', 'bags', 'pens', 'worksheets'] },
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [19, 20],
        q: 'Which <strong>TWO</strong> activities can students do after the tour at present?',
        o: ['build model dinosaurs', 'watch films', 'draw dinosaurs', 'find dinosaur eggs', 'play computer games'] },
    ],
    fix: {
      12: '25(th) December / December 25(th) / Christmas Day',
      13: 'car park / car-park / carpark / parking lot',
    },
    edits: [
      { from: 'AND/OR NUMBER', to: 'AND/OR A NUMBER', why: 'standard wording' },
      { from: 'Which TWO activities can students have with them', to: 'Which THREE activities', why: 'PDF says TWO but asks for three letters (key: C, F, G)' },
    ],
  },
  {
    id: 34, title: 'Agricultural Park',
    groups: [
      { t: 'mcq', instr: ABC, items: [
        { n: 11, q: 'According to the speaker, the main purposes of the park are', o: ['education and entertainment.', 'research and education.', 'research and entertainment.'] },
      ] },
      { t: 'imggaps', instr: br('Complete the plan below.', W2), image: IMG(34), w: 1172, h: 982,
        alt: 'Plan of the Agricultural Park: rare breeds section, grazing area, reception block, experimental crops area, lake and marsh',
        gaps: [{ n: 12, x: 60.7, y: 23.4, w: 15.8 }, { n: 13, x: 32.4, y: 72.6, w: 15.6 }, { n: 14, x: 58.4, y: 83.5, w: 15.6 }] },
      { t: 'mcq', instr: ABC, items: [
        { n: 15, q: 'When are the experimental areas closed to the public?', o: ['all the year round', 'almost all the year', 'a short time every year'] },
        { n: 16, q: 'How can you move around the park?', o: ['by tram, walking or bicycle', 'by solar car or bicycle', 'by bicycle, walking or bus'] },
        { n: 17, q: 'The rare breed animals kept in the park include', o: ['hens and horses.', 'goats and cows.', 'goats and hens.'] },
        { n: 18, q: 'What is the main purpose of having the Rare Breeds Section?', o: ['to save unusual animals', 'to keep a variety of breeds', 'to educate the public'] },
        { n: 19, q: 'What can you see in the park at the present time?', o: ['the arrival of wild birds', 'fruit tree blossom', 'a demonstration of fishing'] },
        { n: 20, q: 'The shop contains books about', o: ['animals.', 'local traditions.', 'the history of the park.'] },
      ] },
    ],
  },
  {
    id: 35, title: 'The National Arts Centre',
    groups: [
      { t: 'form', instr: br(NOTES, W2N), title: 'THE NATIONAL ARTS CENTRE', rows: [
        ['<strong>Well known for</strong>', '{{11}}'],
        ['<strong>Complex consists of</strong>', 'concert rooms'],
        ['', 'theatres'], ['', 'cinemas'], ['', 'art galleries'], ['', 'public library'], ['', 'restaurants'],
        ['', 'a {{12}}'],
        ['<strong>Historical background</strong>', '1940 – area destroyed by bombs'],
        ['', '1960s-1970s – Centre was {{13}} and built'],
        ['', 'in {{14}} – opened to public'],
        ['<strong>Managed by</strong>', 'the {{15}}'],
        ['<strong>Open</strong>', '{{16}} days per year'],
      ] },
      { t: 'table', instr: br(TABLE, W3N), head: ['Day', 'Time', 'Event', 'Venue', 'Ticket price'], rows: [
        ['Monday and Tuesday', '7.30 p.m.', '‘The Magic Flute’ (opera by Mozart)', '{{17}}', 'from £8.00'],
        ['Wednesday', '8.00 p.m.', '‘{{18}}’ (Canadian film)', 'Cinema 2', '£ {{19}}'],
        ['Saturday and Sunday', '11 a.m. to 10 p.m.', '‘{{20}}’ (art exhibition)', 'Gallery 1', 'free'],
      ] },
    ],
    fix: { 14: '1983 / (the) 1980s' },
  },
  {
    id: 36, title: 'Red Hill Suburb Improvements',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Improvement to Red Hill Suburb', items: [
        { n: 11, q: 'Community groups are mainly concerned about', o: ['pedestrian safety.', 'traffic jams.', 'increased pollution.'] },
        { n: 12, q: 'It has been decided that the overhead power lines will be', o: ['extended.', 'buried.', 'repaired.'] },
        { n: 13, q: 'The expenses related to the power lines will be paid for by', o: ['the council.', 'the power company.', 'local businesses.'] },
      ] },
      { t: 'grid', instr: labelLetters('map', 'A-H', 14, 20), title: 'Red Hill Improvement Plan', image: IMG(36), w: 1123, h: 610,
        alt: 'Red Hill streets (Hill Street, Evelyn Street, Days Road, Thomas Street, Carberry Street) with a supermarket and locations A to H', letters: 'A-H',
        items: [
          { n: 14, html: 'trees' }, { n: 15, html: 'wider footpaths' }, { n: 16, html: 'coloured road surface' },
          { n: 17, html: 'new sign' }, { n: 18, html: 'traffic lights' }, { n: 19, html: 'artwork' },
          { n: 20, html: "children's playground" },
        ] },
    ],
  },
  {
    id: 37, title: 'Sports World',
    groups: [
      { t: 'notes', instr: br(NOTES, W1N), title: 'SPORTS WORLD', sections: [{ items: [
        'a new {{11}} of an international sports goods company',
        'located in the shopping centre to the {{12}} of Bradcaster',
        'has sports {{13}} and equipment on floors 1-3',
        'can get you any item within {{14}} days',
        'shop specializes in equipment for {{15}}',
        'has a special section which just sells {{16}}',
      ] }] },
      { t: 'mcq', instr: ABC, items: [
        { n: 17, q: 'A champion athlete will be in the shop', o: ['on Saturday morning only.', 'all day Saturday.', 'for the whole weekend.'] },
        { n: 18, q: 'The first person to answer 20 quiz questions correctly will win', o: ['gym membership.', 'a video.', 'a calendar.'] },
      ] },
      { t: 'multi', instr: CHOOSE('TWO', 'A-E'), n: [19, 20],
        q: 'Which <strong>TWO</strong> pieces of information does the speaker give about the fitness test?',
        o: ['You need to reserve a place.', 'It is free to account holders.', 'You get advice on how to improve your health.', 'It takes place in a special clinic.', 'It is cheaper this month.'] },
    ],
    edits: [{ from: 'ONE WORD AND/OR NUMBER', to: 'ONE WORD AND/OR A NUMBER', why: 'standard wording' }],
  },
  {
    id: 38, title: 'Parks and Open Spaces',
    groups: [
      { t: 'table', instr: br(TABLE, W3), title: 'Parks and open spaces', head: ['Name of place', 'Of particular interest', 'Open'], join: { 12: ' and ' }, rows: [
        ['Halland Common', 'source of River Ouse', '24 hours'],
        ['Holt Island', 'many different {{11}}', 'between {{12}} and {{12}}'],
        ['Longfield Country Park', 'reconstruction of a 2,000-year-old {{13}} with activities for children', 'daylight hours'],
      ] },
      { t: 'mcq', instr: ABC, title: 'Longfield Park', items: [
        { n: 14, q: "As part of Monday's activity, visitors will", o: ['prepare food with herbs.', 'meet a well-known herbalist.', 'dye cloth with herbs.'] },
        { n: 15, q: 'For the activity on Wednesday,', o: ['only group bookings are accepted.', 'visitors should book in advance.', 'attendance is free.'] },
        { n: 16, q: 'For the activity on Saturday, visitors should', o: ['come in suitable clothing.', 'make sure they are able to stay for the whole day.', 'tell the rangers before the event what they wish to do.'] },
      ] },
      { t: 'grid', instr: labelLetters('map', 'A-I', 17, 20), image: IMG(38), w: 1227, h: 653,
        alt: 'Map of Hinchingbrooke Park with lake, west and east gates, refreshments and locations A to I', letters: 'A-I',
        items: [{ n: 17, html: 'bird hide' }, { n: 18, html: 'dog-walking area' }, { n: 19, html: 'flower garden' }, { n: 20, html: 'wooded area' }] },
    ],
    fix: { 12: 'Friday and Sunday' },
    edits: [{ from: '12: Friday/Sunday', to: 'one question, two boxes', why: 'answer needs both days ("between Friday and Sunday")' }],
  },
  {
    id: 39, title: 'Winridge Forest Railway Park',
    groups: [
      { t: 'mcq', instr: ABC, title: 'Winridge Forest Railway Park', items: [
        { n: 11, q: "Simon's idea for a theme park came from", o: ['his childhood hobby.', 'his interest in landscape design.', 'his visit to another park.'] },
        { n: 12, q: 'When they started, the family decided to open the park only when', o: ['the weather was expected to be good.', 'the children weren’t at school.', 'there were fewer farming commitments.'] },
        { n: 13, q: 'Since opening, the park has had', o: ['50,000 visitors.', '1,000,000 visitors.', '1,500,000 visitors.'] },
      ] },
      { t: 'match', instr: boxMatch('What is currently the main area of work of each of the following people?', 'FIVE', 'A-H', 14, 18),
        bankTitle: 'Area of work',
        bank: ['advertising', 'animal care', 'building', 'educational links', 'engine maintenance', 'food and drink', 'sales', 'staffing'],
        itemsTitle: 'People',
        items: [
          { n: 14, html: 'Simon (the speaker)' }, { n: 15, html: 'Liz' }, { n: 16, html: 'Sarah' },
          { n: 17, html: 'Duncan' }, { n: 18, html: 'Judith' },
        ] },
      { t: 'table', instr: br(TABLE, W1N), head: ['Feature', 'Size', 'Biggest challenge', 'Target age group'], rows: [
        ['Railway', '1.2 Km', 'Making tunnels', ''],
        ['Go-Kart arena', '{{19}} m<sup>2</sup>', 'Removing mounds on the track', '{{20}} year-olds'],
      ] },
    ],
    fix: { 20: '5 to 12 / five to twelve' },
  },
  {
    id: 40, title: 'Holiday Home Guide',
    groups: [
      { t: 'match', instr: 'Label the diagram below.<br>Choose <strong>THREE</strong> answers from the box and write the correct letter, <strong>A–E</strong>, next to Questions 11–13.',
        title: 'Water Heater', image: IMG(40), w: 851, h: 710,
        alt: 'Diagram of a water heater control panel with central heating radiators and hot water dials, and labels 11, 12 and 13',
        bank: ['electricity indicator', 'on/off switch', 'reset button', 'time control', 'warning indicator'],
        items: [{ n: 11, html: '' }, { n: 12, html: '' }, { n: 13, html: '' }] },
      { t: 'match', instr: boxMatch('Where can each of the following items be found?', 'FIVE', 'A-G', 14, 18),
        bankTitle: 'Locations',
        bank: ['in box on washing machine', 'in cupboard on landing', 'in chest of drawers', 'next to window in living room', 'on shelf by back door', 'on top of television', 'under kitchen sink'],
        items: [
          { n: 14, html: 'pillows' }, { n: 15, html: 'washing powder' }, { n: 16, html: 'key' },
          { n: 17, html: 'light bulbs' }, { n: 18, html: 'map' },
        ] },
      { t: 'notes', instr: br(NOTES, W1N), sections: [{ items: [
        { html: 'The best place to park in town – next to the station', plain: true },
        { html: 'Phone number for takeaway pizzas – {{19}}', plain: true },
        { html: 'Railway museum closed on {{20}}', plain: true },
      ] }] },
    ],
  },
];
