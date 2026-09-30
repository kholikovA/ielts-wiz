// C1 articles — abstract / academic topics, longer paragraphs, higher-register
// vocabulary and collocations. See src/data/articles/index.js for the shape.

const c1 = [
  {
    id: 'c1-01-urban-green-space',
    level: 'C1',
    title: 'The Quiet Value of Urban Green Space',
    topic: 'Environment & Society',
    estReadMinutes: 6,
    status: 'ready',
    summary: 'Why the parks and trees that disappear first as cities grow may be far more important than they look.',
    paragraphs: [
      'Rapid urbanisation has transformed the way most people live, work, and spend their free time. As cities expand outward and upward, green space — parks, gardens, tree-lined streets — is often the first thing to disappear under new roads and apartment blocks. Yet a growing body of research suggests that this trade-off comes at a real cost, one that goes far beyond aesthetics.',
      'City life has become increasingly sedentary. Long commutes, desk-based jobs, and hours spent in front of screens leave little room for the incidental physical activity that a walk through a park naturally encourages. Public health researchers have found that access to green space correlates with measurably lower rates of obesity, anxiety, and cardiovascular disease. In one widely cited study, residents living within a ten-minute walk of a park reported significantly better mental wellbeing than those without accessible green space nearby.',
      'Green space also plays a quieter, ecological role. Even a modest urban park can support surprising levels of biodiversity, offering a home to birds, insects, and pollinators that would otherwise struggle to survive amid concrete and traffic. Trees mitigate the urban heat island effect, cooling neighbourhoods that would otherwise trap heat throughout the summer, and they filter pollutants from the air residents breathe every day.',
      'The trouble is that green space is rarely distributed fairly. Wealthier neighbourhoods tend to have leafy, well-maintained parks within easy reach, while lower-income areas are often left with far less. Urban planners are now under growing pressure to make city planning more equitable, ensuring that the benefits of green space are not reserved for those who can already afford them. Some cities have inadvertently made this problem worse: redevelopment projects intended to revitalise a neighbourhood have, in several documented cases, removed the last remaining park to make way for new housing.',
      'None of this is merely theoretical. The benefits are tangible: shorter recovery times after surgery for patients with a view of greenery, lower crime rates in well-planted public spaces, and children who perform better at school when their classroom looks out onto trees rather than a car park. Recent studies continue to underscore the need for city governments to treat green space not as a luxury to be added once everything else is built, but as essential infrastructure — as necessary to a functioning city as its roads, schools, or hospitals.',
    ],
    vocab: {
      urbanisation: {
        ipa: '/ˌɜːbənaɪˈzeɪʃən/',
        partOfSpeech: 'noun',
        definition: 'the process by which more and more people move to live in cities and towns',
        example: 'Rapid urbanisation has put enormous pressure on housing in the capital.',
        collocations: ['rapid urbanisation', 'urbanisation process', 'drive urbanisation', 'unplanned urbanisation'],
      },
      sedentary: {
        ipa: '/ˈsedəntri/',
        partOfSpeech: 'adjective',
        definition: 'involving little physical activity; spending most of the time sitting',
        example: 'A sedentary lifestyle is linked to a higher risk of heart disease.',
        collocations: ['sedentary lifestyle', 'sedentary behaviour', 'sedentary job', 'increasingly sedentary'],
      },
      correlates: {
        ipa: '/ˈkɒrəleɪts/',
        partOfSpeech: 'verb',
        definition: 'has a mutual relationship with something, so that one thing tends to change as the other does',
        example: 'Access to parks correlates strongly with lower stress levels among residents.',
        collocations: ['correlate with', 'strongly correlate', 'closely correlated', 'correlate directly'],
      },
      accessible: {
        ipa: '/əkˈsesəbl/',
        partOfSpeech: 'adjective',
        definition: 'able to be reached, entered, or used easily',
        example: 'The new park was designed to be accessible to wheelchair users.',
        collocations: ['easily accessible', 'publicly accessible', 'accessible to all', 'remain accessible'],
      },
      biodiversity: {
        ipa: '/ˌbaɪəʊdaɪˈvɜːsəti/',
        partOfSpeech: 'noun',
        definition: 'the variety of plant and animal life in a particular habitat',
        example: 'Urban gardens can support surprising levels of biodiversity.',
        collocations: ['support biodiversity', 'loss of biodiversity', 'biodiversity hotspot', 'protect biodiversity'],
      },
      equitable: {
        ipa: '/ˈekwɪtəbl/',
        partOfSpeech: 'adjective',
        definition: 'fair and impartial; treating everyone equally',
        example: 'City planners are under pressure to ensure a more equitable distribution of green space.',
        collocations: ['equitable distribution', 'equitable access', 'more equitable', 'socially equitable'],
      },
      tangible: {
        ipa: '/ˈtændʒəbl/',
        partOfSpeech: 'adjective',
        definition: 'clear and definite; real enough to be perceived or shown, not just theoretical',
        example: 'The health benefits of green space are tangible, not just theoretical.',
        collocations: ['tangible benefits', 'tangible evidence', 'tangible impact', 'produce tangible results'],
      },
      inadvertently: {
        ipa: '/ˌɪnədˈvɜːtəntli/',
        partOfSpeech: 'adverb',
        definition: 'without intention; by accident',
        example: 'New developments can inadvertently remove the very green spaces residents value most.',
        collocations: ['inadvertently create', 'inadvertently cause', 'inadvertently undermine', 'almost inadvertently'],
      },
      underscore: {
        ipa: '/ˌʌndəˈskɔːr/',
        partOfSpeech: 'verb',
        definition: 'to emphasise or show the importance of something',
        example: "The study's findings underscore the need for better urban planning.",
        collocations: ['underscore the need for', 'underscore the importance of', 'further underscore', 'underscore a point'],
      },
      mitigate: {
        ipa: '/ˈmɪtɪɡeɪt/',
        partOfSpeech: 'verb',
        definition: 'to make something less severe, serious, or harmful',
        example: 'Planting trees can help mitigate the effects of air pollution.',
        collocations: ['mitigate the effects of', 'mitigate risk', 'help mitigate', 'mitigate against'],
      },
    },
  },
];

export default c1;
