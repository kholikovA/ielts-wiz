// A1 articles — everyday topics, simple present/past tense, short sentences.
// See src/data/articles/index.js for the article/vocab shape.

const a1 = [
  {
    id: 'a1-01-my-morning-routine',
    level: 'A1',
    title: 'My Morning Routine',
    topic: 'Daily life',
    estReadMinutes: 2,
    status: 'ready',
    summary: 'A simple story about how Maria starts her day, from waking up to leaving for work.',
    paragraphs: [
      'Maria wakes up at half past six every morning. She has a simple routine that helps her start the day well. First, she drinks a glass of water. Then she does some light exercise for ten minutes.',
      'After that, Maria takes a quick shower. She gets dressed and eats breakfast in the kitchen. Her favourite breakfast is toast with jam and a cup of tea. She never skips breakfast because it gives her energy.',
      'At half past seven, Maria leaves the house. Her commute to work takes about twenty minutes by bus. She usually reads a book or listens to music during the journey. By the time she arrives at the office, she feels ready for the day.',
      'In the evening, Maria comes home and feels a little exhausted. She likes to relax on the sofa and watch television for an hour before making dinner. A good routine, she says, makes every day easier.',
    ],
    vocab: {
      routine: {
        ipa: '/ruːˈtiːn/',
        partOfSpeech: 'noun',
        definition: 'a fixed, regular way of doing things',
        example: 'Brushing your teeth every morning is part of a healthy routine.',
        collocations: ['daily routine', 'morning routine', 'break a routine', 'get into a routine'],
      },
      exercise: {
        ipa: '/ˈeksəsaɪz/',
        partOfSpeech: 'noun',
        definition: 'physical activity done to stay healthy and fit',
        example: 'Doctors recommend thirty minutes of exercise a day.',
        collocations: ['do exercise', 'regular exercise', 'physical exercise', 'exercise routine'],
      },
      shower: {
        ipa: '/ˈʃaʊər/',
        partOfSpeech: 'noun',
        definition: 'an act of washing your whole body while standing under running water',
        example: 'I always have a shower before I go to bed.',
        collocations: ['take a shower', 'quick shower', 'cold shower', 'hot shower'],
      },
      breakfast: {
        ipa: '/ˈbrekfəst/',
        partOfSpeech: 'noun',
        definition: 'the first meal of the day, eaten in the morning',
        example: 'She always eats a big breakfast before school.',
        collocations: ['eat breakfast', 'skip breakfast', 'have breakfast', 'breakfast time'],
      },
      commute: {
        ipa: '/kəˈmjuːt/',
        partOfSpeech: 'noun',
        definition: 'the journey you make regularly between your home and your workplace',
        example: 'His commute to the office takes almost an hour.',
        collocations: ['daily commute', 'long commute', 'commute to work', 'shorten the commute'],
      },
      exhausted: {
        ipa: '/ɪɡˈzɔːstɪd/',
        partOfSpeech: 'adjective',
        definition: 'extremely tired',
        example: 'After the long flight, she felt completely exhausted.',
        collocations: ['feel exhausted', 'totally exhausted', 'exhausted from work', 'look exhausted'],
      },
      relax: {
        ipa: '/rɪˈlæks/',
        partOfSpeech: 'verb',
        definition: 'to rest and stop worrying or feeling tense',
        example: "It's important to relax after a stressful day at work.",
        collocations: ['relax at home', 'try to relax', 'relax and unwind', 'time to relax'],
      },
    },
  },
];

export default a1;
