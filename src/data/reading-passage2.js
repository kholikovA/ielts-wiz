export const readingPassage2Tests = [
  {
    id: 41,
    title: "The Rise of Urban Farming",
    subtitle: "How cities are transforming their approach to food production",
    passage: `<p><strong>A</strong> The concept of growing food in urban environments is not new – city dwellers have cultivated vegetables in backyards and on windowsills for generations. However, a significant shift is occurring as urban farming moves from a hobby practiced by enthusiastic amateurs to a commercial enterprise that could help address global food security challenges. Modern urban farms employ sophisticated technologies and innovative techniques that would have seemed like science fiction just a few decades ago.</p>
<p><strong>B</strong> Vertical farming represents one of the most dramatic innovations in urban agriculture. These facilities stack growing beds in layers, sometimes dozens of stories high, within controlled indoor environments. LED lights provide the precise wavelengths plants need for photosynthesis, while hydroponic or aeroponic systems deliver nutrients directly to roots without soil. The controlled conditions allow year-round production regardless of external weather, and the closed systems use up to 95% less water than traditional agriculture.</p>
<p><strong>C</strong> The economics of vertical farming have improved substantially. Early ventures struggled with the enormous energy costs required to power lights and climate control systems. However, advances in LED efficiency and renewable energy have changed the calculation. A vertical farm in Singapore now produces vegetables at prices competitive with imported produce, while a facility in New Jersey supplies restaurants throughout New York City with freshly harvested greens delivered within hours of picking.</p>
<p><strong>D</strong> Rooftop farms represent another approach to urban agriculture. Unlike vertical farms, these operations use natural sunlight, dramatically reducing energy requirements. The Brooklyn Grange in New York City operates the world's largest rooftop soil farms, spanning over two acres across multiple buildings. Beyond producing vegetables, these green roofs provide additional benefits: they reduce building heating and cooling costs, manage stormwater runoff, and create habitat for pollinators in otherwise barren urban landscapes.</p>
<p><strong>E</strong> Critics argue that urban farming cannot meaningfully contribute to food supply at scale. Traditional rural agriculture benefits from economies of scale that urban operations cannot match. Land in cities is expensive, and the compact nature of urban farms means they cannot compete with vast rural operations in terms of total output. A single large farm in California's Central Valley might produce more lettuce in a year than all urban farms in North America combined.</p>
<p><strong>F</strong> Proponents counter that urban farms should not be evaluated solely on production volume. These operations excel at growing high-value crops like herbs and specialty greens that command premium prices. They can also produce varieties bred for flavor rather than transportability – crops that would not survive the journey from distant farms to urban supermarkets. Furthermore, the educational value of urban farms in reconnecting city residents with food production has benefits that resist quantification.</p>
<p><strong>G</strong> The environmental arguments for urban farming are complex. While local production eliminates transportation emissions and reduces packaging waste, the energy intensity of indoor growing can offset these gains. A comprehensive life-cycle assessment found that greenhouse-grown tomatoes in the UK had a larger carbon footprint than those shipped from Spain, where natural conditions favor production. The calculation varies by crop, location, and the specific technologies employed.</p>
<p><strong>H</strong> Looking ahead, the integration of urban farming into city planning represents perhaps the most promising development. Singapore has incorporated vertical farming into its national food security strategy, aiming to produce 30% of nutritional needs locally by 2030. Paris has approved plans for the world's largest urban farm on an exhibition center rooftop. As cities grow and agricultural land diminishes, the ability to produce food where people live may shift from an interesting experiment to an essential component of sustainable urban development.</p>`,
    questions: [
      { type: 'matching-headings', rubric: 'Questions 1-8', instruction: 'The reading passage has eight paragraphs, A-H. Choose the correct heading for each paragraph from the list of headings below.', 
        headings: [
          'i. Calculating the true environmental impact',
          'ii. A solution to global hunger',
          'iii. Long-term planning for food production',
          'iv. Limitations compared to conventional agriculture',
          'v. The financial viability of indoor growing',
          'vi. Historical origins of urban food cultivation',
          'vii. Benefits beyond food production',
          'viii. Arguments supporting urban agriculture',
          'ix. Technology enabling new growing methods',
          'x. Government opposition to urban farms'
        ],
        items: [
          { num: 1, paragraph: 'A', answer: 'vi' },
          { num: 2, paragraph: 'B', answer: 'ix' },
          { num: 3, paragraph: 'C', answer: 'v' },
          { num: 4, paragraph: 'D', answer: 'vii' },
          { num: 5, paragraph: 'E', answer: 'iv' },
          { num: 6, paragraph: 'F', answer: 'viii' },
          { num: 7, paragraph: 'G', answer: 'i' },
          { num: 8, paragraph: 'H', answer: 'iii' }
        ]
      },
      { type: 'completion', rubric: 'Questions 9-13', instruction: 'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', title: 'Vertical Farming Technology', items: [
        { num: 9, beforeText: 'Vertical farms use', afterText: 'to provide light for plants', answer: 'LED lights' },
        { num: 10, beforeText: 'Plants receive nutrients through hydroponic or', afterText: 'systems', answer: 'aeroponic' },
        { num: 11, beforeText: 'These systems use significantly less', afterText: 'than traditional farms', answer: 'water' },
        { num: 12, beforeText: 'The main challenge was high', afterText: 'costs for lighting and climate control', answer: 'energy' },
        { num: 13, beforeText: 'A farm in Singapore now has prices that match', afterText: 'produce', answer: 'imported' }
      ]}
    ]
  },
  {
    id: 42,
    title: "The Science of Sleep",
    subtitle: "Understanding why we sleep and what happens when we don't",
    passage: `<p><strong>A</strong> Sleep has long puzzled scientists. From an evolutionary perspective, the unconscious state seems remarkably dangerous – animals that sleep are vulnerable to predators and cannot forage for food or care for offspring. Yet every animal species studied, from fruit flies to elephants, engages in some form of sleep or sleep-like behavior, suggesting that the benefits must outweigh the considerable risks.</p>
<p><strong>B</strong> Research has revealed that sleep serves multiple essential functions. During sleep, the brain consolidates memories, transferring information from short-term to long-term storage. Studies show that people who sleep after learning new material remember it better than those who remain awake for the same period. The sleeping brain also appears to solve problems creatively, with many scientific insights and artistic inspirations emerging from dreams or the moments between sleep and waking.</p>
<p><strong>C</strong> Perhaps most remarkably, scientists have discovered that the brain has its own waste-removal system that operates primarily during sleep. The glymphatic system, identified only in 2012, pumps cerebrospinal fluid through brain tissue, flushing out toxic proteins that accumulate during waking hours. These proteins include beta-amyloid, associated with Alzheimer's disease, raising the possibility that chronic sleep deprivation may contribute to neurodegenerative conditions.</p>
<p><strong>D</strong> Sleep architecture varies across the night. The first hours of sleep are dominated by deep slow-wave sleep, during which the brain's electrical activity synchronizes in slow, rhythmic patterns. Growth hormone is released, tissues repair themselves, and the immune system strengthens. Later in the night, rapid eye movement (REM) sleep predominates, characterized by vivid dreams, paralyzed muscles, and brain activity patterns resembling wakefulness.</p>
<p><strong>E</strong> The consequences of insufficient sleep extend far beyond tiredness. Sleep-deprived individuals show impaired judgment, reduced reaction times, and difficulty regulating emotions. Studies of medical residents working extended shifts found error rates comparable to those with blood alcohol levels exceeding legal driving limits. Chronic sleep restriction has been linked to obesity, diabetes, cardiovascular disease, and shortened lifespan.</p>
<p><strong>F</strong> Modern life poses unprecedented challenges to healthy sleep. Electric lighting extends the day, suppressing the hormone melatonin that signals sleepiness. Screens emit blue light particularly effective at disrupting circadian rhythms. The constant connectivity enabled by smartphones creates pressure to remain available around the clock, while caffeine consumption masks the natural drive to sleep.</p>
<p><strong>G</strong> Individual sleep needs vary considerably. While the average adult requires seven to nine hours nightly, some people function well on six hours, and others need ten. Age significantly affects sleep patterns – teenagers' circadian rhythms shift later, making early school start times particularly challenging, while older adults often experience fragmented sleep and earlier waking times. Genetics also plays a role, with some individuals naturally inclined toward morningness or eveningness.</p>
<p><strong>H</strong> Improving sleep often requires addressing multiple factors. Sleep hygiene recommendations include maintaining consistent sleep and wake times, keeping bedrooms cool and dark, avoiding screens before bed, and limiting caffeine to morning hours. For some individuals, cognitive behavioral therapy for insomnia (CBT-I) proves more effective than sleeping pills, addressing the anxiety and rumination that perpetuate sleep difficulties without the side effects and dependency risks of medication.</p>`,
    questions: [
      { type: 'mcq', rubric: 'Questions 1-5', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 1, question: 'According to the passage, what makes sleep seem evolutionarily problematic?', options: ['A) It requires too much energy', 'B) Animals are defenseless while sleeping', 'C) Not all animals need sleep', 'D) It prevents growth'], answer: 'B' },
        { num: 2, question: 'The glymphatic system was discovered', options: ['A) in the early 2000s', 'B) over twenty years ago', 'C) relatively recently', 'D) through dream research'], answer: 'C' },
        { num: 3, question: 'What characterizes the early part of the night\'s sleep?', options: ['A) Vivid dreaming', 'B) REM sleep', 'C) Deep slow-wave sleep', 'D) Light sleep only'], answer: 'C' },
        { num: 4, question: 'Studies of sleep-deprived medical residents showed their performance was similar to', options: ['A) people who had consumed alcohol', 'B) individuals with chronic illness', 'C) elderly patients', 'D) those on medication'], answer: 'A' },
        { num: 5, question: 'According to the passage, CBT-I is particularly useful because it', options: ['A) works faster than medication', 'B) is less expensive than pills', 'C) avoids the drawbacks of sleeping pills', 'D) can be done without professional help'], answer: 'C' }
      ]},
      { type: 'tfng', rubric: 'Questions 6-10', instruction: 'Do the following statements agree with the information given in the passage?', items: [
        { num: 6, text: 'Some scientists believe sleep developed as a way to avoid predators.', answer: 'NOT GIVEN' },
        { num: 7, text: 'Beta-amyloid buildup is definitively caused by lack of sleep.', answer: 'FALSE' },
        { num: 8, text: 'Blue light from screens has a particularly strong effect on sleep.', answer: 'TRUE' },
        { num: 9, text: 'All adults need between seven and nine hours of sleep.', answer: 'FALSE' },
        { num: 10, text: 'Teenagers naturally tend to fall asleep and wake up later than adults.', answer: 'TRUE' }
      ]},
      { type: 'completion', rubric: 'Questions 11-13', instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', items: [
        { num: 11, beforeText: 'During sleep, the brain moves information from short-term to', afterText: 'storage', answer: 'long-term' },
        { num: 12, beforeText: 'The release of', afterText: 'hormone occurs during slow-wave sleep', answer: 'growth' },
        { num: 13, beforeText: 'Melatonin is the hormone that indicates it is time to feel', afterText: '', answer: 'sleepiness' }
      ]}
    ]
  },
  {
    id: 43,
    title: "Coral Reef Conservation",
    subtitle: "The challenges of protecting marine ecosystems in a changing world",
    passage: `<p><strong>A</strong> Coral reefs, often called the rainforests of the sea, support approximately 25% of all marine species despite covering less than 1% of the ocean floor. These remarkable ecosystems provide essential services to human communities: they protect coastlines from storms and erosion, support fisheries that feed millions of people, generate tourism revenue, and serve as sources for pharmaceutical compounds. Yet coral reefs face an unprecedented crisis, with scientists warning that most reefs could disappear within decades without dramatic intervention.</p>
<p><strong>B</strong> Climate change poses the gravest threat to coral survival. Corals exist in a narrow temperature range, and even small increases in water temperature can trigger coral bleaching. During bleaching events, stressed corals expel the symbiotic algae that provide them with nutrients and color, leaving behind white skeletons. While corals can recover from brief bleaching episodes, prolonged or repeated events prove fatal. The 2016-2017 bleaching event killed half the corals on Australia's Great Barrier Reef.</p>
<p><strong>C</strong> Ocean acidification compounds the temperature threat. As oceans absorb carbon dioxide from the atmosphere, seawater becomes more acidic. This acidification reduces the availability of calcium carbonate, the building block corals use to construct their skeletons. In increasingly acidic conditions, corals grow more slowly and existing structures become more vulnerable to erosion. Some projections suggest that by mid-century, ocean chemistry may become too hostile for coral reef formation in many areas.</p>
<p><strong>D</strong> Local stressors add to global pressures. Coastal development destroys reef habitat and increases sediment runoff that smothers corals and blocks light. Agricultural fertilizers fuel algal blooms that compete with corals for space. Overfishing removes herbivorous fish that would otherwise keep algae in check, and destructive fishing practices using explosives or cyanide directly damage reef structures. While these local factors are more immediately controllable than climate change, addressing them requires coordination among diverse stakeholders with competing interests.</p>
<p><strong>E</strong> Conservation efforts operate on multiple fronts. Marine protected areas (MPAs) restrict harmful activities in designated zones, allowing damaged reefs to recover. Studies show that well-managed MPAs can increase coral cover and fish populations significantly. However, MPAs alone cannot address threats that originate outside their boundaries, such as warming waters or pollution carried by currents.</p>
<p><strong>F</strong> Scientists are developing innovative techniques to accelerate reef recovery. Coral gardening involves collecting coral fragments, growing them in nurseries, and transplanting them to degraded reefs. Heat-resistant coral strains, either identified in naturally warm environments or developed through selective breeding, may help reefs withstand future temperature extremes. Some researchers are even exploring the possibility of genetically engineering corals with enhanced tolerance to stress.</p>
<p><strong>G</strong> The scale of restoration needed exceeds current capacity by orders of magnitude. The Great Barrier Reef alone spans 344,400 square kilometers – far too large for fragment-by-fragment restoration. Researchers are investigating techniques to scale up interventions, including using robots to plant coral larvae and deploying devices that attract coral spawn to depleted areas. These approaches remain experimental, and none can substitute for addressing the root causes of coral decline.</p>
<p><strong>H</strong> The fate of coral reefs ultimately depends on global action to limit climate change. Scientists estimate that even if global warming is limited to 1.5°C above pre-industrial levels – the most ambitious target of the Paris Agreement – 70-90% of existing coral reefs may be lost. Higher warming levels would eliminate virtually all reefs. Saving what remains requires both immediate action to reduce local stressors and transformative changes to energy systems that would halt and eventually reverse the accumulation of greenhouse gases in the atmosphere.</p>`,
    questions: [
      { type: 'matching-info', rubric: 'Questions 1-6', instruction: 'Which paragraph contains the following information? Write the correct letter, A-H.', items: [
        { num: 1, text: 'a comparison between the scale of damage and restoration capability', answer: 'G' },
        { num: 2, text: 'examples of the economic value reefs provide to people', answer: 'A' },
        { num: 3, text: 'the chemical process affecting coral skeleton formation', answer: 'C' },
        { num: 4, text: 'evidence of the effectiveness of protected areas', answer: 'E' },
        { num: 5, text: 'multiple human activities that harm reefs directly', answer: 'D' },
        { num: 6, text: 'the relationship between coral and another organism during stress', answer: 'B' }
      ]},
      { type: 'completion', rubric: 'Questions 7-10', instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.', items: [
        { num: 7, beforeText: 'Coral reefs occupy less than', afterText: 'of the total ocean area', answer: '1%' },
        { num: 8, beforeText: 'The 2016-2017 bleaching caused the death of', afterText: 'of corals on the Great Barrier Reef', answer: 'half' },
        { num: 9, beforeText: 'Algal growth is normally controlled by fish that eat', afterText: '', answer: 'herbivorous' },
        { num: 10, beforeText: 'If warming reaches 1.5°C, up to', afterText: 'of coral reefs may disappear', answer: '90%' }
      ]},
      { type: 'tfng', rubric: 'Questions 11-13', instruction: 'Do the following statements agree with the information given in the passage?', items: [
        { num: 11, text: 'Corals can survive extended periods of bleaching if conditions eventually improve.', answer: 'FALSE' },
        { num: 12, text: 'Marine protected areas can solve problems caused by climate change.', answer: 'FALSE' },
        { num: 13, text: 'Robotic coral planting has already been successfully deployed at scale.', answer: 'FALSE' }
      ]}
    ]
  },
  {
    id: 44,
    title: "The Psychology of Decision Making",
    subtitle: "Why humans often make irrational choices",
    passage: `<p><strong>A</strong> Classical economics assumed humans were rational actors who carefully weighed costs and benefits before making decisions. This assumption, while mathematically convenient, fails to describe how people actually behave. Decades of research in behavioral economics and psychology have revealed systematic patterns in how human judgment departs from rational ideals – patterns that have profound implications for everything from personal finance to public policy.</p>
<p><strong>B</strong> One of the most influential concepts to emerge from this research is loss aversion. Experiments consistently show that people feel the pain of losses more intensely than the pleasure of equivalent gains – roughly twice as intensely, according to most estimates. This asymmetry explains why investors often hold losing stocks too long, hoping to avoid realizing a loss, while selling winning stocks too quickly to lock in gains. It also explains why people frequently reject gambles that would be advantageous on average, such as a 50% chance to win $150 versus a 50% chance to lose $100.</p>
<p><strong>C</strong> The way choices are presented, or framed, dramatically affects decisions. A medical treatment described as having a 90% survival rate seems more appealing than one with a 10% mortality rate, despite the identical information. Ground beef labeled as 75% lean sells better than identical beef labeled 25% fat. These framing effects violate the economic assumption that people respond to objective reality rather than its description, yet they appear consistently across cultures and contexts.</p>
<p><strong>D</strong> Humans also struggle with probability, particularly small probabilities. People systematically overestimate the likelihood of dramatic but rare events like plane crashes or terrorist attacks, while underestimating common risks like car accidents or heart disease. This helps explain why some individuals purchase lottery tickets while remaining uninsured against more probable misfortunes. The availability of vivid examples in memory, often supplied by news media, distorts perceived probability.</p>
<p><strong>E</strong> Present bias describes the tendency to overvalue immediate rewards relative to future ones. Most people, when offered a choice between $100 today and $110 in a week, choose the immediate payment – even though the one-week return vastly exceeds any available investment opportunity. This bias contributes to undersaving for retirement, difficulty adhering to diet and exercise plans, and the challenge of addressing long-term problems like climate change that require present sacrifices for future benefits.</p>
<p><strong>F</strong> Choice overload represents another departure from the rational model. While classical economics suggests that more options always improve outcomes by allowing finer calibration to preferences, experiments reveal that too many choices can paralyze decision-making. In one famous study, supermarket shoppers encountered displays featuring either 6 or 24 varieties of jam. While the larger display attracted more attention, shoppers who saw it were far less likely to actually purchase jam. The effort required to evaluate numerous options can exceed the benefits of having them.</p>
<p><strong>G</strong> Understanding these patterns has practical applications. Policymakers have learned to design choices that account for human psychology rather than fighting against it. Automatic enrollment in retirement savings plans, with the option to opt out, dramatically increases participation compared to voluntary enrollment, even though the same options exist in both cases. Simplifying paperwork and reducing the number of decisions required has improved take-up of beneficial programs from healthcare to education.</p>
<p><strong>H</strong> Critics worry that such interventions, sometimes called "nudges," represent paternalistic manipulation. Defenders counter that any choice architecture influences decisions – there is no neutral design – and that thoughtful architecture that helps people achieve their own stated goals differs from manipulation toward ends they would reject. The debate continues, but the underlying research has fundamentally changed our understanding of how humans actually make decisions.</p>`,
    questions: [
      { type: 'matching-headings', rubric: 'Questions 1-8', instruction: 'Choose the correct heading for each paragraph from the list below.', 
        headings: [
          'i. Using psychology to improve policy outcomes',
          'ii. The challenge of having too many options',
          'iii. Overturning traditional economic assumptions',
          'iv. Difficulty in assessing risk accurately',
          'v. Ethical concerns about behavioral interventions',
          'vi. The influence of description on choice',
          'vii. Preferring the certain to the uncertain',
          'viii. Why people fear losing more than they enjoy winning',
          'ix. The tendency to prioritize immediate gratification',
          'x. How culture shapes decision making'
        ],
        items: [
          { num: 1, paragraph: 'A', answer: 'iii' },
          { num: 2, paragraph: 'B', answer: 'viii' },
          { num: 3, paragraph: 'C', answer: 'vi' },
          { num: 4, paragraph: 'D', answer: 'iv' },
          { num: 5, paragraph: 'E', answer: 'ix' },
          { num: 6, paragraph: 'F', answer: 'ii' },
          { num: 7, paragraph: 'G', answer: 'i' },
          { num: 8, paragraph: 'H', answer: 'v' }
        ]
      },
      { type: 'tfng', rubric: 'Questions 9-13', instruction: 'Do the following statements agree with the information given in the passage?', items: [
        { num: 9, text: 'Loss aversion causes people to take risks they should avoid.', answer: 'FALSE' },
        { num: 10, text: 'Framing effects occur regardless of cultural background.', answer: 'TRUE' },
        { num: 11, text: 'Media coverage can distort people\'s perception of how likely events are.', answer: 'TRUE' },
        { num: 12, text: 'The jam study showed that having more choices increased sales.', answer: 'FALSE' },
        { num: 13, text: 'Automatic enrollment in savings plans removes choice from participants.', answer: 'FALSE' }
      ]}
    ]
  },
  {
    id: 45,
    title: "The History of Writing Systems",
    subtitle: "How humans developed the technology of recording language",
    passage: `<p><strong>A</strong> Writing stands among humanity's most transformative inventions. Before writing, knowledge could only be transmitted through speech, limiting information to what individuals could remember and relay in person. Writing externalized memory, allowing complex ideas to be preserved indefinitely and transmitted across vast distances. This seemingly simple technology enabled the accumulation of knowledge across generations that underlies modern civilization.</p>
<p><strong>B</strong> The earliest writing systems emerged independently in at least three locations: Mesopotamia around 3200 BCE, Egypt around 3000 BCE, and China around 1200 BCE. Mesoamerican writing may represent a fourth independent invention, though some scholars argue for diffusion from other cultures. In each case, writing arose in complex societies with centralized administration, suggesting that record-keeping needs drove its development.</p>
<p><strong>C</strong> Mesopotamian cuneiform illustrates how writing evolved from simpler precursors. For millennia before writing, people used small clay tokens in various shapes to record economic transactions – a sphere might represent a measure of grain, a cone an amount of oil. Eventually, scribes began impressing these tokens into clay tablets, creating marks that represented the tokens. These pictographic marks gradually became more abstract and were used to represent sounds rather than just objects, enabling the recording of language rather than merely quantities.</p>
<p><strong>D</strong> Writing systems vary fundamentally in what units of language they represent. Logographic systems use symbols for words or morphemes; Chinese writing exemplifies this approach, with thousands of characters representing meaningful units. Syllabic systems use symbols for syllables, as in Japanese hiragana. Alphabetic systems, like the one you are reading now, represent individual sounds with separate characters, theoretically requiring only a small number of symbols to encode any word.</p>
<p><strong>E</strong> The alphabet was invented only once in human history. All alphabetic writing systems descend from a single ancestor developed by Semitic peoples in the region of modern Syria and Palestine around 1800 BCE. These inventors borrowed the idea of writing from Egyptian hieroglyphics but radically simplified it, selecting symbols for consonant sounds only. The Greeks later added vowels, creating the complete alphabet that spread throughout the Mediterranean and eventually the world.</p>
<p><strong>F</strong> The technology of writing involves not only the symbols themselves but the materials on which they are inscribed. Clay tablets dominated in Mesopotamia, where clay was abundant and papyrus unavailable. Egyptians wrote on papyrus, a paper-like material made from reeds. The Chinese invented paper around 100 CE, a technology that reached Europe only in the 12th century. Each material shaped writing practices – the curved strokes of Chinese calligraphy, for instance, reflect the properties of brush and paper.</p>
<p><strong>G</strong> For most of history, literacy remained restricted to small elites. The complexity of some writing systems posed one barrier – mastering thousands of Chinese characters requires years of study. Social restrictions posed another, with writing often reserved for specialized classes of scribes and priests. Mass literacy emerged only with the spread of printing, universal education, and in some cases, script reforms that simplified writing systems.</p>
<p><strong>H</strong> Digital technology represents the latest revolution in writing. Electronic texts can be searched, copied, and transmitted instantaneously at minimal cost. More fundamentally, computers have transformed writing from a purely human activity to one that machines can perform. Software translates between languages, generates text from prompts, and even composes creative works. Whether these capabilities will prove as transformative as the original invention of writing remains to be seen.</p>`,
    questions: [
      { type: 'mcq', rubric: 'Questions 1-4', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 1, question: 'According to the passage, writing first developed because of', options: ['A) religious requirements', 'B) artistic expression', 'C) administrative needs', 'D) communication with distant communities'], answer: 'C' },
        { num: 2, question: 'The passage suggests that Mesopotamian pictographs', options: ['A) were copied from Egypt', 'B) evolved from a counting system', 'C) originally represented sounds', 'D) were invented by a single person'], answer: 'B' },
        { num: 3, question: 'What distinguishes alphabetic systems from other writing systems?', options: ['A) They are easier to learn', 'B) They represent individual sounds', 'C) They were invented more recently', 'D) They require fewer materials'], answer: 'B' },
        { num: 4, question: 'The passage indicates that mass literacy', options: ['A) existed in ancient civilizations', 'B) developed recently in historical terms', 'C) requires alphabetic writing', 'D) spread from China'], answer: 'B' }
      ]},
      { type: 'matching-info', rubric: 'Questions 5-9', instruction: 'Which paragraph contains the following information?', items: [
        { num: 5, text: 'the geographic origin of alphabetic writing', answer: 'E' },
        { num: 6, text: 'factors that limited who could read and write', answer: 'G' },
        { num: 7, text: 'how physical materials affected writing styles', answer: 'F' },
        { num: 8, text: 'evidence that writing developed in multiple places separately', answer: 'B' },
        { num: 9, text: 'the fundamental difference writing made to human knowledge', answer: 'A' }
      ]},
      { type: 'completion', rubric: 'Questions 10-13', instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', items: [
        { num: 10, beforeText: 'Clay tokens were used to document', afterText: 'before writing developed', answer: 'economic transactions' },
        { num: 11, beforeText: 'The alphabet was based on symbols from Egyptian', afterText: '', answer: 'hieroglyphics' },
        { num: 12, beforeText: 'Paper technology was invented by the', afterText: '', answer: 'Chinese' },
        { num: 13, beforeText: 'Modern software can now produce', afterText: 'works', answer: 'creative' }
      ]}
    ]
  },
  {
    id: 46,
    title: "Sustainable Architecture",
    subtitle: "Building designs that minimize environmental impact",
    passage: `<p><strong>A</strong> Buildings account for nearly 40% of global energy consumption and a comparable share of carbon emissions. As the world seeks to address climate change, the architecture and construction industries face pressure to fundamentally rethink how structures are designed, built, and operated. Sustainable architecture aims to minimize the environmental impact of buildings throughout their lifecycles while creating healthy, productive spaces for occupants.</p>
<p><strong>B</strong> Passive design strategies reduce energy needs by working with natural forces rather than against them. Building orientation can maximize winter solar gain while minimizing summer heat. Thermal mass – heavy materials like concrete or stone – absorbs heat during warm periods and releases it when temperatures drop, stabilizing interior conditions. Natural ventilation, carefully designed to capture prevailing breezes, can reduce or eliminate the need for mechanical cooling in many climates.</p>
<p><strong>C</strong> The materials from which buildings are constructed carry their own environmental burdens. Concrete, the world's most widely used construction material, generates approximately 8% of global carbon emissions, largely from the chemical reactions required to produce cement. Steel production is similarly carbon-intensive. Sustainable architecture increasingly employs alternative materials – timber, bamboo, rammed earth – that can store carbon rather than release it, and recycled or reclaimed materials that avoid the impacts of new production.</p>
<p><strong>D</strong> High-performance building envelopes represent another crucial element. Advanced glazing systems admit daylight while blocking heat transfer far more effectively than traditional windows. Superinsulation reduces heat loss through walls and roofs to minimal levels. Air-tight construction, combined with mechanical ventilation systems that recover heat from exhaust air, prevents the drafts that plague older buildings while maintaining fresh air quality.</p>
<p><strong>E</strong> Renewable energy systems can transform buildings from energy consumers to energy producers. Rooftop solar panels have become increasingly cost-effective, with some buildings generating more electricity than they consume over the course of a year. Ground-source heat pumps tap the stable temperatures of the earth to provide efficient heating and cooling. Small-scale wind turbines and micro-hydropower systems offer additional options in suitable locations.</p>
<p><strong>F</strong> Water efficiency has gained attention as freshwater scarcity intensifies in many regions. Low-flow fixtures reduce consumption without noticeably affecting user experience. Greywater systems recycle water from sinks and showers for toilet flushing or irrigation. Rainwater harvesting captures precipitation for non-potable uses. Some innovative buildings treat wastewater on-site using constructed wetlands or living machines that employ plants and microorganisms to purify effluent.</p>
<p><strong>G</strong> Beyond environmental performance, sustainable buildings aim to support human health and well-being. Abundant daylight, shown by research to improve mood and productivity, requires careful design to achieve without overheating. Materials selections that avoid volatile organic compounds and other harmful emissions maintain indoor air quality. Access to nature, even views of plants from windows, has documented psychological benefits that designers increasingly seek to provide.</p>
<p><strong>H</strong> The economics of sustainable building have shifted dramatically. While green buildings once carried significant cost premiums, advances in technology and growing demand have narrowed the gap. Lifecycle cost analysis often reveals that higher upfront investments yield savings through reduced operating costs. Certification systems like LEED and BREEAM have created market recognition for sustainable buildings, with certified properties commanding rental and sale premiums. As energy costs rise and regulations tighten, conventional buildings increasingly risk becoming obsolete.</p>`,
    questions: [
      { type: 'matching-headings', rubric: 'Questions 1-8', instruction: 'Choose the correct heading for each paragraph from the list below.',
        headings: [
          'i. The economic case for green construction',
          'ii. Generating power from buildings',
          'iii. The significant contribution of buildings to emissions',
          'iv. Preserving water resources',
          'v. Designing for human wellbeing',
          'vi. Choosing materials with lower environmental costs',
          'vii. Improving the outer shell of buildings',
          'viii. Future regulatory requirements',
          'ix. Harnessing natural conditions for climate control',
          'x. The role of vegetation in building design'
        ],
        items: [
          { num: 1, paragraph: 'A', answer: 'iii' },
          { num: 2, paragraph: 'B', answer: 'ix' },
          { num: 3, paragraph: 'C', answer: 'vi' },
          { num: 4, paragraph: 'D', answer: 'vii' },
          { num: 5, paragraph: 'E', answer: 'ii' },
          { num: 6, paragraph: 'F', answer: 'iv' },
          { num: 7, paragraph: 'G', answer: 'v' },
          { num: 8, paragraph: 'H', answer: 'i' }
        ]
      },
      { type: 'completion', rubric: 'Questions 9-13', instruction: 'Complete the notes below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', title: 'Key Elements of Sustainable Architecture', items: [
        { num: 9, beforeText: 'Thermal mass: materials like concrete absorb and release', afterText: '', answer: 'heat' },
        { num: 10, beforeText: 'Concrete production creates about', afterText: 'of carbon emissions globally', answer: '8%' },
        { num: 11, beforeText: 'Alternative materials such as timber can actually', afterText: 'carbon', answer: 'store' },
        { num: 12, beforeText: 'Ground-source systems use earth\'s stable', afterText: 'for heating and cooling', answer: 'temperatures' },
        { num: 13, beforeText: 'Research shows daylight can improve', afterText: 'as well as mood', answer: 'productivity' }
      ]}
    ]
  },
  {
    id: 47,
    title: "Animal Migration Patterns",
    subtitle: "Understanding the remarkable journeys animals undertake",
    passage: `<p><strong>A</strong> Each year, billions of animals undertake journeys of remarkable scale and precision. Arctic terns fly from pole to pole and back, covering up to 90,000 kilometers annually. Wildebeest cross the Serengeti in herds of millions, following seasonal rains. Salmon return from ocean feeding grounds to the exact streams where they hatched years earlier. These migrations represent some of nature's most impressive phenomena, the product of evolutionary pressures acting over millions of years.</p>
<p><strong>B</strong> Migration serves several essential functions. Most fundamentally, it allows animals to exploit resources that are available only seasonally in particular locations. Northern breeding grounds offer long summer days for raising young, while tropical wintering areas provide food when northern regions freeze. Some migrations follow food sources directly – humpback whales travel between nutrient-rich polar feeding waters and warm tropical breeding lagoons. Others track seasonal rainfall patterns that determine vegetation growth.</p>
<p><strong>C</strong> Navigation during migration requires sophisticated sensory capabilities that scientists are still working to fully understand. Many birds possess an internal magnetic compass, using magnetite crystals in their beaks or quantum effects in their eyes to detect Earth's magnetic field. The sun's position provides directional information, corrected for time of day using internal clocks. At night, some species navigate by the stars. Salmon appear to follow magnetic maps and chemical gradients in ocean water, eventually recognizing the unique smell of their natal streams.</p>
<p><strong>D</strong> Young animals often undertake their first migration without guidance from experienced adults. Cuckoos raised by foster parents of different species somehow know to migrate to Africa and return to Europe the following spring. This innate programming must encode both direction and distance of travel, and appears to be updated by natural selection as conditions change. When European blackcaps began spending winters in Britain rather than Spain, adapting to bird-feeder abundance and milder winters, their offspring inherited the novel route.</p>
<p><strong>E</strong> Climate change increasingly disrupts migration patterns. Rising temperatures shift the timing of seasonal events – spring arrives earlier, autumn later. Animals that cue migration using day length rather than temperature may find themselves arriving at breeding grounds before food becomes available, or after peak abundance has passed. The mismatch between migrating animals and the resources they depend on threatens populations already stressed by habitat loss and other pressures.</p>
<p><strong>F</strong> Human infrastructure creates additional hazards. Collisions with buildings kill an estimated one billion birds annually in North America alone. Fences block the movement of large mammals across rangelands. Dams obstruct fish migration, fragmenting populations and preventing access to spawning habitat. Light pollution disorients nocturnal migrants, causing birds to circle illuminated buildings until they drop from exhaustion.</p>
<p><strong>G</strong> Conservation efforts increasingly focus on protecting migration corridors – the routes and stopover sites that migrants depend on throughout their journeys. A bird may breed in Canada, winter in Argentina, and rely on wetlands in multiple countries along the way. Protecting breeding habitat alone cannot ensure survival if critical refueling sites disappear. International agreements have emerged to coordinate conservation across the ranges of migratory species.</p>
<p><strong>H</strong> Tracking technology has revolutionized migration research. Miniaturized GPS transmitters now allow scientists to follow individual animals in real time, revealing patterns invisible to earlier observers. Geolocators weighing less than a gram record light levels that indicate location, enabling tracking of small songbirds across hemispheric journeys. These tools have produced surprising discoveries – routes that cross open oceans, altitude records that rival commercial aircraft – while identifying threats and priority areas for conservation action.</p>`,
    questions: [
      { type: 'tfng', rubric: 'Questions 1-6', instruction: 'Do the following statements agree with the information given in the passage?', items: [
        { num: 1, text: 'Arctic terns have the longest annual migration of any bird.', answer: 'NOT GIVEN' },
        { num: 2, text: 'Scientists fully understand how birds navigate using magnetic fields.', answer: 'FALSE' },
        { num: 3, text: 'Cuckoos learn their migration route from their biological parents.', answer: 'FALSE' },
        { num: 4, text: 'European blackcaps changed their migration pattern within a generation.', answer: 'NOT GIVEN' },
        { num: 5, text: 'Building collisions are a significant cause of bird deaths.', answer: 'TRUE' },
        { num: 6, text: 'Modern tracking devices can follow the smallest birds across continents.', answer: 'TRUE' }
      ]},
      { type: 'matching-info', rubric: 'Questions 7-10', instruction: 'Which paragraph contains the following information?', items: [
        { num: 7, text: 'how animals inherit knowledge of migration routes', answer: 'D' },
        { num: 8, text: 'international cooperation in protecting migrants', answer: 'G' },
        { num: 9, text: 'reasons why animals travel long distances seasonally', answer: 'B' },
        { num: 10, text: 'the impact of artificial lighting on migrating birds', answer: 'F' }
      ]},
      { type: 'completion', rubric: 'Questions 11-13', instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', items: [
        { num: 11, beforeText: 'Salmon use the distinctive', afterText: 'of their birth streams to find them again', answer: 'smell' },
        { num: 12, beforeText: 'Animals may arrive at breeding grounds when', afterText: 'is not at its highest level', answer: 'food' },
        { num: 13, beforeText: 'Protecting only breeding areas is insufficient because', afterText: 'sites are also essential', answer: 'stopover' }
      ]}
    ]
  },
  {
    id: 48,
    title: "The Economics of Happiness",
    subtitle: "Can money buy well-being?",
    passage: `<p><strong>A</strong> For centuries, philosophers have debated the nature of happiness and the means to achieve it. In recent decades, economists and psychologists have joined this inquiry, developing quantitative measures of well-being and investigating its determinants. Their findings challenge common assumptions about the relationship between wealth and happiness, with implications for how societies should measure progress and set priorities.</p>
<p><strong>B</strong> Early happiness research established what became known as the Easterlin paradox. At any given moment, wealthier individuals within a country report higher life satisfaction than poorer ones – a relationship that holds across cultures. However, as countries grow wealthier over time, average happiness does not increase correspondingly. Americans in the 2020s are no happier than their grandparents in the 1950s, despite vastly higher incomes. Beyond a certain threshold, more money seems to produce diminishing returns for well-being.</p>
<p><strong>C</strong> Several mechanisms may explain this paradox. Adaptation theory suggests that people quickly adjust to changes in circumstances, returning to a baseline happiness level. A salary increase produces temporary elation, but expectations rise accordingly, and the new income soon feels normal. Social comparison theory emphasizes that people evaluate their situation relative to others. When everyone's income rises together, no one feels relatively better off. Material improvements also bring their own frustrations – more possessions mean more to maintain, insure, and eventually replace.</p>
<p><strong>D</strong> Research has identified factors that contribute to happiness beyond income. Strong relationships consistently emerge as crucial – people with close friendships and satisfying family connections report higher life satisfaction across all income levels. Meaningful work matters independently of the salary it provides; unemployment causes misery beyond its financial impact. Physical and mental health powerfully affect well-being, as does a sense of control over one's life. Living in a society with low corruption, effective institutions, and social trust also contributes to citizen happiness.</p>
<p><strong>E</strong> The findings have prompted some economists to question Gross Domestic Product as the primary measure of national progress. GDP captures market transactions but ignores unpaid work, leisure time, environmental quality, and social cohesion. A country might increase GDP by working longer hours while relationships deteriorate and stress-related illness rises. Alternative measures like the Genuine Progress Indicator attempt to account for factors that GDP misses, though defining and measuring these factors presents challenges.</p>
<p><strong>F</strong> Some governments have begun explicitly prioritizing happiness in policy decisions. Bhutan famously adopted Gross National Happiness as its guiding metric in the 1970s, evaluating policies based on their effects on psychological well-being, cultural vitality, environmental sustainability, and good governance. More recently, the United Kingdom and several other nations have incorporated subjective well-being measures into their national statistics, supplementing economic indicators with surveys of life satisfaction.</p>
<p><strong>G</strong> Critics raise several objections to happiness-based policy. Measuring subjective well-being involves significant challenges – self-reported happiness varies with mood, question wording, and cultural norms about appropriate responses. More fundamentally, some argue that governments should not concern themselves with citizens' psychological states. Providing freedom and opportunity should suffice; whether people choose to pursue happiness or other goals is properly their own affair.</p>
<p><strong>H</strong> The research nonetheless offers valuable insights for individual choices. Spending money on experiences rather than possessions tends to produce more lasting satisfaction. Investing in time with loved ones pays dividends in well-being. Comparing oneself to those with less rather than more fosters contentment. While no formula guarantees happiness, understanding its determinants can help people make choices more likely to enhance their life satisfaction.</p>`,
    questions: [
      { type: 'mcq', rubric: 'Questions 1-5', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 1, question: 'The Easterlin paradox refers to the finding that', options: ['A) wealthy countries are the happiest', 'B) economic growth does not increase average happiness', 'C) poor people adapt better to hardship', 'D) happiness cannot be measured accurately'], answer: 'B' },
        { num: 2, question: 'According to adaptation theory, a pay raise', options: ['A) will permanently increase happiness', 'B) produces temporary satisfaction', 'C) causes people to work harder', 'D) leads to immediate dissatisfaction'], answer: 'B' },
        { num: 3, question: 'The passage suggests that unemployment affects happiness', options: ['A) only through income loss', 'B) primarily among the young', 'C) in ways beyond financial impact', 'D) less than originally thought'], answer: 'C' },
        { num: 4, question: 'What criticism is made of GDP as a progress measure?', options: ['A) It is difficult to calculate accurately', 'B) It ignores important aspects of quality of life', 'C) It has been abandoned by most countries', 'D) It overestimates economic activity'], answer: 'B' },
        { num: 5, question: 'The passage indicates that Bhutan', options: ['A) was the first country to measure GDP', 'B) has abandoned happiness measures as impractical', 'C) pioneered the use of well-being as a policy guide', 'D) influenced the United Kingdom to reject GDP'], answer: 'C' }
      ]},
      { type: 'matching-info', rubric: 'Questions 6-9', instruction: 'Which paragraph contains the following information?', items: [
        { num: 6, text: 'practical advice for enhancing personal well-being', answer: 'H' },
        { num: 7, text: 'objections to government focus on happiness', answer: 'G' },
        { num: 8, text: 'reasons why higher income may not increase satisfaction', answer: 'C' },
        { num: 9, text: 'non-financial factors that influence life satisfaction', answer: 'D' }
      ]},
      { type: 'completion', rubric: 'Questions 10-13', instruction: 'Complete the sentences below. Choose NO MORE THAN THREE WORDS from the passage for each answer.', items: [
        { num: 10, beforeText: 'People assess their circumstances by comparing with', afterText: '', answer: 'others' },
        { num: 11, beforeText: 'The Genuine Progress Indicator tries to measure things', afterText: 'does not capture', answer: 'GDP' },
        { num: 12, beforeText: 'Happiness surveys may be affected by', afterText: ', wording, and cultural differences', answer: 'mood' },
        { num: 13, beforeText: 'Research shows that', afterText: 'provide more enduring satisfaction than physical items', answer: 'experiences' }
      ]}
    ]
  },
  {
    id: 49,
    title: "The Development of Antibiotics",
    subtitle: "A medical revolution and its challenges",
    passage: `<p><strong>A</strong> The discovery of antibiotics stands among the most significant advances in medical history. Before these drugs became available, minor wounds could prove fatal if they became infected, and common illnesses like pneumonia and tuberculosis killed millions annually. The introduction of penicillin and subsequent antibiotics transformed medicine, enabling surgeries, transplants, and cancer treatments that would otherwise be too risky, and extending average life expectancy by decades.</p>
<p><strong>B</strong> Alexander Fleming's discovery of penicillin in 1928 is one of science's most famous accidents. Returning from vacation, Fleming noticed that mold contamination had killed bacteria in a culture dish he had left uncovered. Rather than discarding the dish, he investigated further, eventually isolating the substance responsible – penicillin. However, Fleming lacked the resources to develop his discovery into a usable drug. That task fell to Howard Florey and Ernst Chain, who in 1940 demonstrated penicillin's effectiveness in treating infections and developed methods for its mass production.</p>
<p><strong>C</strong> The success of penicillin sparked intensive searches for additional antibiotics. Soil bacteria proved particularly productive sources, yielding streptomycin (the first treatment for tuberculosis), tetracycline, and many others. The period from 1950 to 1970 is sometimes called the golden age of antibiotic discovery, during which most major classes of these drugs were identified. Pharmaceutical companies invested heavily in this research, confident that new antibiotics would continue to emerge as needed.</p>
<p><strong>D</strong> Antibiotic resistance was recognized as a potential problem from the beginning. Fleming himself warned in his 1945 Nobel lecture that improper use could lead bacteria to develop resistance. The mechanism is straightforward: antibiotics kill susceptible bacteria but leave resistant variants to multiply. Through overuse in human medicine, routine administration to healthy farm animals, and inadequate infection control, humanity has accelerated bacterial evolution toward resistance on a massive scale.</p>
<p><strong>E</strong> The resistance crisis has intensified while the discovery pipeline has dried up. Few major pharmaceutical companies maintain active antibiotic research programs. The economics are unfavorable – antibiotics are used briefly and should be reserved for serious infections, limiting the market compared to drugs for chronic conditions. The technical challenges have also grown; the easily discovered antibiotics have been found, and finding new ones requires increasingly sophisticated and expensive research.</p>
<p><strong>F</strong> Some bacteria have developed resistance to virtually all available antibiotics, raising the specter of a post-antibiotic era in which common infections once again become deadly. Drug-resistant tuberculosis already kills hundreds of thousands annually. Hospital-acquired infections with resistant organisms extend hospital stays, increase healthcare costs, and cause tens of thousands of deaths in developed countries alone. Routine procedures like joint replacements could become too dangerous to perform.</p>
<p><strong>G</strong> Addressing the crisis requires action on multiple fronts. Antibiotic stewardship programs in hospitals and clinics aim to ensure appropriate use, avoiding unnecessary prescriptions and selecting the narrowest-spectrum drug effective against an infection. Regulations to restrict agricultural antibiotic use have been implemented in some countries. Infection prevention through improved hygiene, vaccination, and diagnostic testing can reduce the need for antibiotics in the first place.</p>
<p><strong>H</strong> Innovative approaches to incentivizing antibiotic development are also being explored. Subscription models would pay companies fixed amounts for providing access to new antibiotics, decoupling revenue from volume sold and encouraging appropriate use. Prize funds could reward successful development of drugs targeting priority pathogens. Public funding for basic research has increased, as has collaboration between academic institutions and smaller biotechnology companies that may be more willing to pursue antibiotics than pharmaceutical giants are.</p>`,
    questions: [
      { type: 'tfng', rubric: 'Questions 1-5', instruction: 'Do the following statements agree with the information given in the passage?', items: [
        { num: 1, text: 'Fleming immediately recognized the commercial potential of penicillin.', answer: 'FALSE' },
        { num: 2, text: 'Streptomycin was developed from soil-dwelling microorganisms.', answer: 'TRUE' },
        { num: 3, text: 'Fleming predicted that bacteria might become resistant to antibiotics.', answer: 'TRUE' },
        { num: 4, text: 'Drug-resistant tuberculosis has been eliminated in developed countries.', answer: 'FALSE' },
        { num: 5, text: 'Pharmaceutical companies have increased their antibiotic research investments.', answer: 'FALSE' }
      ]},
      { type: 'matching-info', rubric: 'Questions 6-9', instruction: 'Which paragraph contains the following information?', items: [
        { num: 6, text: 'the medical advances that antibiotics made possible', answer: 'A' },
        { num: 7, text: 'new financial arrangements to encourage drug development', answer: 'H' },
        { num: 8, text: 'the economic reasons why companies avoid antibiotic research', answer: 'E' },
        { num: 9, text: 'strategies for reducing antibiotic consumption', answer: 'G' }
      ]},
      { type: 'completion', rubric: 'Questions 10-13', instruction: 'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', title: 'The Antibiotic Resistance Problem', items: [
        { num: 10, beforeText: 'Antibiotics eliminate bacteria that are susceptible but allow', afterText: 'variants to survive and reproduce', answer: 'resistant' },
        { num: 11, beforeText: 'The problem has been worsened by giving antibiotics to', afterText: 'that are not ill', answer: 'farm animals' },
        { num: 12, beforeText: 'Infections caused by resistant bacteria lead to longer', afterText: 'and higher costs', answer: 'hospital stays' },
        { num: 13, beforeText: 'Stewardship programs help ensure that the drugs with the', afterText: 'spectrum are chosen', answer: 'narrowest' }
      ]}
    ]
  },
  {
    id: 50,
    title: "Language and Thought",
    subtitle: "Does the language we speak shape how we think?",
    passage: `<p><strong>A</strong> The relationship between language and thought has fascinated scholars for centuries. Does the language we speak merely express our thoughts, or does it actively shape them? The most famous formulation of the latter view, known as the Sapir-Whorf hypothesis after linguists Edward Sapir and Benjamin Lee Whorf, proposed that linguistic categories determine cognitive categories – that speakers of different languages literally perceive and think about the world differently.</p>
<p><strong>B</strong> Strong versions of linguistic determinism have largely been abandoned. Claims that the Hopi language, lacking tenses, caused its speakers to have no concept of time proved unfounded upon closer examination. Similarly, the notion that languages with fewer color terms prevent their speakers from distinguishing colors has been refuted by perception studies. Clearly, humans can think about things for which their language lacks words, and speakers of all languages share fundamental cognitive capacities.</p>
<p><strong>C</strong> However, weaker versions of linguistic relativity continue to find support in careful research. Languages differ in which distinctions they require speakers to make. English speakers must indicate whether an action occurred in past or present; Mandarin speakers can leave tense unmarked. Spanish speakers must specify whether an object is male or female through grammatical gender; English speakers need not. These obligatory distinctions may not prevent other conceptualizations but could make certain thoughts more habitual or accessible.</p>
<p><strong>D</strong> Spatial language provides compelling evidence for subtle linguistic effects on thought. Some languages describe spatial relations using relative terms like "left" and "right," which depend on the speaker's perspective. Others use absolute terms like "north" and "south," regardless of orientation. Speakers of absolute-direction languages demonstrate superior orientation abilities, maintaining awareness of cardinal directions even in unfamiliar environments or enclosed spaces – a skill apparently developed through constant linguistic practice.</p>
<p><strong>E</strong> Color perception offers another illuminating domain. While all humans can distinguish a similar range of colors, languages carve the color spectrum differently. Russian has separate basic terms for light blue and dark blue, which English lumps together as "blue." Experiments show Russian speakers are faster at distinguishing light and dark blue shades than English speakers, but only when they can use verbal labels – suggesting that language affects categorical perception without altering fundamental color vision.</p>
<p><strong>F</strong> Grammatical gender has unexpectedly pervasive effects. When asked to personify objects, speakers tend to match their attributions to grammatical gender – describing a grammatically feminine bridge as elegant and a grammatically masculine one as sturdy, for instance. These associations persist even when speakers use a language without grammatical gender, indicating that the native language leaves lasting cognitive imprints. Such effects appear trivial but may shape broader patterns of association and metaphor.</p>
<p><strong>G</strong> Number words influence mathematical cognition in documented ways. Children learning languages with regular, transparent number systems (like Chinese, where eleven is expressed as "ten-one") master counting and arithmetic faster than those learning irregular systems (like English, with its opaque "eleven"). The cognitive burden of memorizing arbitrary names for numbers delays the development of number concepts, though the ultimate mathematical abilities of adults appear similar across language groups.</p>
<p><strong>H</strong> The practical implications of language effects remain debated. Some researchers argue that linguistic diversity represents a cognitive resource, offering different tools for thinking about common human challenges. Others suggest that language effects are too small and too easily overcome by deliberate effort to matter much in practice. What seems clear is that language is neither a neutral medium for expressing pre-formed thoughts nor a prison that determines what can be thought, but something more subtle – a cultural tool that guides attention and shapes the habits of mind through which we engage the world.</p>`,
    questions: [
      { type: 'matching-headings', rubric: 'Questions 1-8', instruction: 'Choose the correct heading for each paragraph from the list below.',
        headings: [
          'i. How describing direction affects mental skills',
          'ii. The rejection of extreme claims',
          'iii. Effects on learning mathematics',
          'iv. The continuing debate about significance',
          'v. The original theory linking language and cognition',
          'vi. Evidence from how languages categorize colors',
          'vii. The influence of assigned noun categories',
          'viii. How languages encode time and identity',
          'ix. Support for modified versions of the theory',
          'x. Practical applications of linguistic research'
        ],
        items: [
          { num: 1, paragraph: 'A', answer: 'v' },
          { num: 2, paragraph: 'B', answer: 'ii' },
          { num: 3, paragraph: 'C', answer: 'ix' },
          { num: 4, paragraph: 'D', answer: 'i' },
          { num: 5, paragraph: 'E', answer: 'vi' },
          { num: 6, paragraph: 'F', answer: 'vii' },
          { num: 7, paragraph: 'G', answer: 'iii' },
          { num: 8, paragraph: 'H', answer: 'iv' }
        ]
      },
      { type: 'completion', rubric: 'Questions 9-13', instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', items: [
        { num: 9, beforeText: 'The Sapir-Whorf hypothesis suggested that language', afterText: 'perception and thinking', answer: 'determines' },
        { num: 10, beforeText: 'Research showed that Hopi speakers did have a concept of', afterText: '', answer: 'time' },
        { num: 11, beforeText: 'English combines light and dark blue into a single', afterText: 'term', answer: 'basic' },
        { num: 12, beforeText: 'Speakers may describe bridges differently based on their', afterText: 'gender', answer: 'grammatical' },
        { num: 13, beforeText: 'Chinese has a more', afterText: 'number system than English', answer: 'transparent' }
      ]}
    ]
  }
];

