export const readingPassage3Tests = [
  {
    id: 51,
    title: "Termite Mounds",
    subtitle: "Could the vast towers of mud constructed by insects in sub-Saharan Africa hold the key to our energy-efficient building of the future?",
    passage: `<p><strong>A</strong> To most of us, termites are destructive insects which can cause damage on a devastating scale. But according to Dr Rupert Soar of Loughborough University's School of Mechanical and Manufacturing Engineering, these pests may serve a useful purpose for us after all. His multi-disciplinary team of British and American engineers and biologists have set out to investigate the giant mounds built by termites in Namibia, in sub-Saharan Africa, as part of the most extensive study of these structures ever taken.</p>

<p><strong>B</strong> Termite mounds are impressive for their size alone; typically they are three metres high, and some as tall as eight metres by found. They also reach far into the earth, where the insects 'mine' their building materials, carefully selecting each grain of sand they use. The termite's nest is contained in the central cavity of the mound, safely protected from the harsh environment outside. The mound itself is formed of an intricate lattice of tunnels, which spilt into smaller and smaller tunnels, much like a person's blood vessels.</p>

<p><strong>C</strong> This complex system of tunnels draws in air from the outside, capturing wind energy to drive it through the mound. It also serves to expel spent respiratory gases from the nest to prevent the termites from suffocating, so ensuring them a continuous provision of fresh, breathable air. So detailed is the design that the nest stays within three degrees of a constant temperature, despite variations on the outside of up to 50°C, from blistering heat in the daytime to below freezing on the coldest nights. The mound also automatically regulates moisture in the air, by means of its underground 'cellar', and evaporation from the top of the mound. Some colonies even had 'chimneys' at a height of 20m to control moisture less in the hottest regions of sub-Saharan Africa.</p>

<p><strong>D</strong> Furthermore, the termites have evolved in such a way as to outsource some of their biological functions. Part of their digestive process is carried out by a fungus, which they 'farm' inside the mound. This fungus, which is found nowhere else on earth, thrives in the constant and optimum environment of the mound. The termites feed the fungus with slightly chewed wood pulp, which the fungus then breaks down into a digestible sugary food to provide the insects with energy, and cellulose which they use for building. And, although the termites must generate waste, none ever leaves the structure, indicating that there is also some kind of internal waste-recycling system.</p>

<p><strong>E</strong> Scientists are so excited by the mounds that they have labelled them a 'super organism' because, in Soar's words, "They dance on the edge of what we would perceive to be alive." As he points out, if you're too hot you need to cool down, or if you're too cold you need to warm up in order to thrive: that's called homeostasis. What the termites have done is to move homeostatic function away from their body, into the structure in which they live. As more information comes to light about the unique features of termite mounds, we may ultimately need to redefine our understanding of what constitutes a 'living' organism.</p>

<p><strong>F</strong> To reveal the structure of the mounds, Soar's team begins by filling and covering them with plaster of Paris, a chalky white paste based on the mineral gypsum, which becomes rock-solid when dry. The researchers then carve the plaster of Paris into half-millimetre-thick slices, and photograph them sequentially. Once the pictures are digitally scanned, computer technology is able to recreate complex three-dimensional images of the mounds. These models have enabled the team to map termite architecture at a level of detail never before attained.</p>

<p><strong>G</strong> Soar hopes that the models will explain how termite mounds create a self-regulating living environment which manages to respond to changing internal and external conditions without drawing on any outside source of power. If they do, the findings could be invaluable in informing future architectural design, and could inspire buildings that are self-sufficient, environmentally friendly, and cheap to run. 'As we approach a world of climate change, as temperatures rise,' he explains, 'there will not be enough fuel to drive air conditioners around the world.' It is hoped, says Soar, 'that the findings will provide clues that aid the ultimate development of new kinds of human habitats, suitable for a variety of arid, hostile environments not only on the earth but maybe one day on the moon and beyond.'</p>`,
    questions: [
      { type: 'matching-headings', rubric: 'Questions 27-33', instruction: 'Reading Passage 3 has seven paragraphs, A-G. Choose the correct heading for each paragraph from the list of headings below.',
        headings: [
          'i. methods used to investigate termite mound formation',
          'ii. challenging our assumptions about the nature of life',
          'iii. reconsidering the termite\'s reputation',
          'iv. principal functions of the termite mound',
          'v. distribution of termite mounds in sub-Saharan Africa',
          'vi. some potential benefits of understanding termite architecture',
          'vii. the astonishing physical dimensions of the termite mound',
          'viii. termite mounds under threat from global climate change',
          'ix. a mutually beneficial relationship'
        ],
        items: [
          { num: 27, paragraph: 'A', answer: 'iii' },
          { num: 28, paragraph: 'B', answer: 'vii' },
          { num: 29, paragraph: 'C', answer: 'iv' },
          { num: 30, paragraph: 'D', answer: 'ix' },
          { num: 31, paragraph: 'E', answer: 'ii' },
          { num: 32, paragraph: 'F', answer: 'i' },
          { num: 33, paragraph: 'G', answer: 'vi' }
        ]
      },
      { type: 'completion', rubric: 'Questions 34-37', instruction: 'Label the diagram below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.', title: 'How termite mounds work', items: [
        { num: 34, beforeText: 'network of', afterText: 'helps to give the termites a constant air supply', answer: 'tunnels' },
        { num: 35, beforeText: '', afterText: 'supply and to maintain a limited temperature range', answer: 'air' },
        { num: 36, beforeText: 'cellar to aid control of', afterText: 'levels in mound', answer: 'moisture' },
        { num: 37, beforeText: 'top of the mound permits', afterText: '', answer: 'evaporation' }
      ]},
      { type: 'ynng', rubric: 'Questions 38-40', instruction: 'Do the following statements agree with the claims of the writer in Reading Passage 3?', items: [
        { num: 38, text: 'The termite mound appears to process its refuse material internally.', answer: 'YES' },
        { num: 39, text: 'Dr Soar\'s reconstruction involves scanning a single photograph of a complete mound into a computer.', answer: 'NO' },
        { num: 40, text: 'New information about termite architecture could help people deal with future energy crises.', answer: 'NOT GIVEN' }
      ]}
    ]
  },
  {
    id: 52,
    title: "Memory Champions",
    subtitle: "How do memory champions perform their remarkable feats, and can anyone learn their techniques?",
    passage: `<p><strong>A</strong> Memory champions are the Olympics of brain sports. They can memorise a pack of 52 cards in seconds, or recall thousands of random binary digits in order. And they can do this while facing away from the cards, or while the numbers are being read out to them. But what makes them so good? Is it nature or nurture? Do they have brains that are wired differently, or do they just use the right strategy? And can we all learn to do it?</p>

<p><strong>B</strong> The World Memory Championships have been running since 1991. Each year, competitors from across the world gather to compete in a series of memory tests. These include memorising lists of numbers, random words, names and faces, historical dates, and even decks of playing cards. The current world record for memorising a deck of cards is 20.628 seconds, set by Alex Mullen in 2017. For numbers, the record is 3,029 digits in an hour, set by Johannes Mallow in 2017. These feats are astonishing, but they are not superhuman. Anyone can learn to do it, with the right training.</p>

<p><strong>C</strong> The method most champions use is called the method of loci, or memory palace. It dates back to ancient Greece, where it was used to memorise speeches and texts. The idea is to create a mental image of a familiar place, such as your home, and then place vivid, exaggerated images representing the items to be remembered at specific locations within that place. To recall the items, you mentally walk through the place, seeing the images in order. For example, to remember a shopping list of milk, bread, eggs, you might imagine a giant bottle of milk flooding your front door, a loaf of bread dancing in the hallway, and eggs exploding in the kitchen. The more bizarre and sensory the images, the better they stick.</p>

<p><strong>D</strong> Studies using brain scans show that when memory champions use this technique, they activate brain areas associated with visual and spatial memory, similar to what happens when we navigate real spaces. This suggests that the method of loci taps into our natural ability to remember locations better than abstract information. In one study, participants who used the technique to memorise a list of 72 random words recalled 62 of them after 20 minutes, compared to just 26 for those using rote repetition.</p>

<p><strong>E</strong> But is this skill transferable? Can memory champions remember everyday things better, or is it just for competitions? Research shows mixed results. While they excel at lab tasks like digit span, they don't necessarily have better autobiographical memory or working memory. One champion, Ben Pridmore, can memorise 2,435 binary digits in 20 minutes, but he still forgets where he put his keys. The skill seems specific to the trained tasks.</p>

<p><strong>F</strong> Training to become a memory champion involves extensive practice with techniques like chunking, where information is grouped into meaningful units, and the major system, which converts numbers into words using phonetic codes. For cards, champions assign each card a person or object, then place them in the memory palace. With practice, they can memorise a deck in under 30 seconds. But this requires thousands of hours of deliberate practice, similar to elite athletes.</p>

<p><strong>G</strong> The benefits go beyond competitions. The techniques can help students remember facts for exams, professionals recall names at meetings, or anyone improve their daily recall. They also benefit from additional cognitive abilities, like better focus and creativity from visualisation. However, the real power comes from understanding that memory is not fixed; it's a skill that can be trained like a muscle.</p>`,
    questions: [
      { type: 'matching-headings', rubric: 'Questions 27-32', instruction: 'Reading Passage 3 has seven sections, A-G. Choose the correct heading for each section from the list of headings below.',
        headings: [
          'i. The origins of a memory technique',
          'ii. Everyday applications',
          'iii. A competition overview',
          'iv. Limits of the skill',
          'v. Brain science behind it',
          'vi. Training methods',
          'vii. Record-breaking feats',
          'viii. Questions about talent',
          'ix. Transferable benefits'
        ],
        items: [
          { num: 27, paragraph: 'A', answer: 'viii' },
          { num: 28, paragraph: 'B', answer: 'iii' },
          { num: 29, paragraph: 'C', answer: 'i' },
          { num: 30, paragraph: 'D', answer: 'v' },
          { num: 31, paragraph: 'E', answer: 'iv' },
          { num: 32, paragraph: 'F', answer: 'vi' }
        ]
      },
      { type: 'completion', rubric: 'Questions 33-36', instruction: 'Complete the summary below. Choose <strong>NO MORE THAN THREE WORDS</strong> from the passage for each answer.', title: 'The Method of Loci', items: [
        { num: 33, beforeText: 'To use this technique, you picture a', afterText: 'that you know well.', answer: 'specific familiar path' },
        { num: 34, beforeText: 'For cards, champions assign each card a', afterText: 'or object.', answer: 'specific human being' },
        { num: 35, beforeText: 'They represent items to remember using', afterText: 'at locations in their mental space.', answer: 'three cards' },
        { num: 36, beforeText: 'Recalling items involves taking a', afterText: 'through the imagined place.', answer: 'mental walk' }
      ]},
      { type: 'matching-info', rubric: 'Questions 37-40', instruction: 'Which paragraph contains the following information?', items: [
        { num: 37, text: 'a reference to competitions being open to anyone with proper preparation', answer: 'B' },
        { num: 38, text: 'mention of the time commitment required to achieve expertise', answer: 'C' },
        { num: 39, text: 'an example of a champion\'s memory limitations in daily life', answer: 'E' },
        { num: 40, text: 'evidence from scientific research supporting the technique\'s effectiveness', answer: 'D' }
      ]}
    ]
  },
  {
    id: 53,
    title: "Mark Strizic: Australian Photographer",
    subtitle: "The career of one of Australia's most influential émigré photographers",
    passage: `<p>Mark Strizic, who passed away in December last year, was the last representative of a remarkable generation of European émigré photographers who settled in Australia after the Second World War. Alongside Wolfgang Sievers and Henry Talbot, Strizic contributed significantly to the visual culture of his adopted country. Yet, unlike many of his contemporaries, whose reputations were largely based on industrial or commercial photography, Strizic developed a career that was unusually complex. Over a span of five decades, he explored multiple photographic styles, experimented with new printing processes, engaged in book design, produced large-scale murals, and participated actively in teaching the next generation of photographers.</p>

<p>Born in 1928 in the Croatian capital Zagreb, Strizic studied architecture before emigrating to Australia in 1950. This architectural training would profoundly influence his photographic vision, particularly in his documentation of Melbourne's built environment. His architectural photographs were not merely records of buildings but compositions that revealed the interplay of light, shadow, form, and space.</p>

<p>In the 1950s and 1960s, Strizic established himself as one of Melbourne's leading commercial photographers. His client list included major corporations, advertising agencies, and government departments. He was particularly known for his industrial photography, capturing the dynamism of Australia's post-war manufacturing boom. These images combined technical precision with an artistic sensibility that elevated them above mere documentation.</p>

<p>However, Strizic's interests extended far beyond commercial work. Throughout his career, he pursued personal projects that explored Australian identity, landscape, and urban life. His street photography of Melbourne in the 1950s and 1960s provides an invaluable record of a city undergoing rapid transformation. These candid images of ordinary people going about their daily lives possess a warmth and humanity that distinguishes them from much documentary photography of the period.</p>

<p>One of Strizic's most significant contributions was his role in introducing colour photography to Australian artistic practice. In the 1970s, when colour was still largely dismissed as a commercial medium unsuitable for serious artistic work, Strizic embraced it enthusiastically. His colour photographs of the Australian landscape challenged prevailing aesthetic assumptions and demonstrated that colour could be used with the same subtlety and sophistication as black and white.</p>

<p>Strizic was also an influential teacher who shaped the development of photography education in Australia. He taught at various institutions over several decades, and many of his former students went on to become significant photographers in their own right. His teaching emphasised both technical mastery and personal vision, encouraging students to develop their own distinctive approaches rather than simply copying established styles.</p>

<p>In his later years, Strizic continued to experiment and evolve. He embraced digital technology not as a threat to traditional photography but as another tool for creative expression. He also revisited his extensive archive, creating new works from images taken decades earlier. This willingness to reinvent himself throughout his career ensured that his work remained fresh and relevant.</p>

<p>Strizic's legacy extends beyond his own photographs. Through his teaching, writing, and example, he helped establish photography as a respected art form in Australia. His career demonstrated that commercial success and artistic integrity need not be incompatible, and that a photographer could work across multiple genres without compromising their vision.</p>

<p>A major retrospective of Strizic's work was held at the National Gallery of Victoria in 2012, confirming his status as one of Australia's most important photographers. His archive, comprising thousands of negatives and prints spanning five decades, provides an unparalleled visual record of post-war Australian society and represents a national treasure that will continue to be studied and appreciated for generations to come.</p>`,
    questions: [
      { type: 'matching-info', rubric: 'Questions 27-32', instruction: 'Which paragraph contains the following information? Write the correct letter, A-I.', paragraphRange: 'A-I', items: [
        { num: 27, text: 'mention of Strizic\'s willingness to work with new technology', answer: 'A' },
        { num: 28, text: 'reference to his early education before coming to Australia', answer: 'B' },
        { num: 29, text: 'examples of the types of organisations that hired Strizic', answer: 'C' },
        { num: 30, text: 'photographs showing how Melbourne was changing', answer: 'D' },
        { num: 31, text: 'his role in changing attitudes towards a particular medium', answer: 'E' },
        { num: 32, text: 'his impact on future photographers through education', answer: 'F' }
      ]},
      { type: 'ynng', rubric: 'Questions 33-37', instruction: 'Do the following statements agree with the claims of the writer in Reading Passage 3?', items: [
        { num: 33, text: 'Strizic was typical of other émigré photographers in his approach to his career.', answer: 'NO' },
        { num: 34, text: 'His architectural training affected how he photographed buildings.', answer: 'YES' },
        { num: 35, text: 'His street photography was well received at the time it was taken.', answer: 'YES' },
        { num: 36, text: 'Other photographers in the 1970s shared his enthusiasm for colour.', answer: 'NO' },
        { num: 37, text: 'He stopped teaching after he became successful commercially.', answer: 'NO' }
      ]},
      { type: 'mcq', rubric: 'Questions 38-40', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 38, question: 'What does the writer suggest distinguished Strizic\'s industrial photography?', options: ['It focused exclusively on manufacturing', 'It combined accuracy with artistic qualities', 'It was only done for government clients', 'It avoided showing people at work'], answer: 'B' },
        { num: 39, question: 'What did Strizic do with his archive in his later years?', options: ['He donated it to a museum', 'He destroyed many early works', 'He used it to create new pieces', 'He sold it to private collectors'], answer: 'C' },
        { num: 40, question: 'According to the passage, what does Strizic\'s career show?', options: ['Commercial work always damages artistic reputation', 'Photographers should specialise in one genre', 'Success in business and art can coexist', 'Teaching is more important than photography'], answer: 'B' }
      ]}
    ]
  },
  {
    id: 54,
    title: "The Peopling of Patagonia",
    subtitle: "Anthropologists continue to investigate human migration to Patagonia at the southern tip of South America",
    passage: `<p><strong>A</strong> At the southern tip of South America lies Patagonia, a vast region of windswept plains, dramatic mountains, and ancient glaciers. This remote corner of the world was one of the last places on Earth to be colonised by humans. Understanding when and how people first arrived in Patagonia has been the subject of intense scientific debate, with new discoveries regularly challenging established theories.</p>

<p><strong>B</strong> The traditional view held that humans first entered the Americas from Asia via the Bering land bridge during the last Ice Age, gradually making their way southward over thousands of years. According to this model, known as 'Clovis First,' people would have reached Patagonia relatively late, perhaps only 10,000 to 11,000 years ago. However, accumulating evidence has challenged this timeline.</p>

<p><strong>C</strong> The Monte Verde site in southern Chile has been particularly significant in revising our understanding of American settlement. Excavations there revealed human occupation dating back at least 14,500 years, with some controversial evidence suggesting even earlier habitation. The site preserved remarkable evidence of daily life, including the remains of dwellings, stone tools, and even medicinal plants. Monte Verde demonstrated that humans had reached the southern cone of South America much earlier than previously thought.</p>

<p><strong>D</strong> More recent discoveries have pushed the timeline back even further. At Piedra Museo in Argentina, archaeologists found stone tools and butchered animal bones dating to around 13,000 years ago. Other sites in Patagonia have yielded similarly ancient evidence. These findings suggest that once humans entered South America, they spread southward remarkably quickly, reaching the continent's southern extremity within just a few thousand years.</p>

<p><strong>E</strong> How did these early Patagonians survive in such a challenging environment? The region would have been even more forbidding during the Ice Age, with vast glaciers covering much of the Andes and temperatures significantly lower than today. Yet the archaeological evidence shows that people not only survived but thrived, developing sophisticated hunting strategies and making use of diverse food resources including marine mammals, fish, and guanaco, a relative of the llama.</p>

<p><strong>F</strong> Genetic studies have added new dimensions to our understanding of Patagonian settlement. Analysis of ancient DNA has revealed that the earliest Patagonians belonged to a founding population that had split from other Native American groups relatively early in the colonisation process. Some studies suggest this split occurred around 15,000 years ago, consistent with the archaeological evidence for early southern migration.</p>

<p><strong>G</strong> The maritime hypothesis offers an alternative explanation for how humans reached Patagonia so quickly. According to this theory, rather than travelling exclusively overland, early migrants followed the Pacific coast, using boats to move rapidly southward along the coast. This route would have provided access to abundant marine resources and allowed bypassing of geographical barriers that would have slowed overland travel.</p>

<p><strong>H</strong> Current research continues to refine our understanding of Patagonian prehistory. New excavations are uncovering sites that predate previously known occupation. Advanced dating techniques are providing more precise chronologies. And genetic analysis of both ancient and modern populations is revealing complex patterns of migration, interaction, and adaptation that characterise the human story in this remote region.</p>`,
    questions: [
      { type: 'mcq', rubric: 'Questions 27-31', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 27, question: 'What does the writer say about the Monte Verde site?', options: ['It confirmed the Clovis First theory', 'It contains the oldest evidence of humans in the Americas', 'It changed ideas about when humans reached South America', 'It has been dismissed by most archaeologists'], answer: 'C' },
        { num: 28, question: 'What does the evidence from Piedra Museo indicate?', options: ['Humans spread slowly through South America', 'Humans had sophisticated farming techniques', 'Humans reached southern South America rapidly', 'Humans avoided the coldest regions'], answer: 'C' },
        { num: 29, question: 'What does the passage suggest about Ice Age Patagonia?', options: ['It was uninhabitable for humans', 'People adapted well to the conditions', 'It had a warmer climate than today', 'Few archaeological sites survive from this period'], answer: 'A' },
        { num: 30, question: 'What have genetic studies revealed about early Patagonians?', options: ['They came from a different continent than other Native Americans', 'They separated from other groups early in American colonisation', 'They had no connection to Asian populations', 'They evolved separately from other humans'], answer: 'D' },
        { num: 31, question: 'The maritime hypothesis suggests that early migrants', options: ['preferred overland routes', 'used boats to travel along the coast', 'settled only in coastal areas', 'came from Pacific islands'], answer: 'B' }
      ]},
      { type: 'ynng', rubric: 'Questions 32-35', instruction: 'Do the following statements agree with the claims of the writer in Reading Passage 3?', items: [
        { num: 32, text: 'The Clovis First model is now universally accepted.', answer: 'NO' },
        { num: 33, text: 'Monte Verde preserved evidence of what people ate.', answer: 'NOT GIVEN' },
        { num: 34, text: 'Early Patagonians relied on a single food source.', answer: 'NO' },
        { num: 35, text: 'Genetic research supports the archaeological timeline.', answer: 'YES' }
      ]},
      { type: 'matching-info', rubric: 'Questions 36-40', instruction: 'Which paragraph contains the following information?', paragraphRange: 'A-H', items: [
        { num: 36, text: 'mention of ongoing research methods being used to study Patagonian prehistory', answer: 'D' },
        { num: 37, text: 'an explanation of an alternative route for human migration', answer: 'B' },
        { num: 38, text: 'reference to the survival strategies of early inhabitants', answer: 'E' },
        { num: 39, text: 'a description of a key archaeological site and its significance', answer: 'C' },
        { num: 40, text: 'information about when early Patagonians diverged from other groups', answer: 'H' }
      ]}
    ]
  },
  {
    id: 55,
    title: "The Placebo Effect",
    subtitle: "Understanding the power of expectation in medicine",
    passage: `<p><strong>A</strong> The placebo effect has puzzled scientists and doctors for centuries. How can an inert substance - a sugar pill, saline injection, or sham procedure - produce real, measurable improvements in health? The phenomenon challenges our understanding of the mind-body connection and has profound implications for medical research and clinical practice.</p>

<p><strong>B</strong> The term 'placebo' comes from the Latin for 'I shall please,' reflecting the historical view that placebos were given merely to satisfy demanding patients. However, modern research has revealed that placebos can trigger genuine physiological changes. Brain imaging studies show that placebo treatments can activate the same neural pathways as real drugs, releasing natural painkillers like endorphins and dopamine.</p>

<p><strong>C</strong> The strength of the placebo effect varies considerably depending on the condition being treated. It tends to be strongest for subjective symptoms like pain, fatigue, and nausea, where patient perception plays a central role. Placebos are less effective for conditions with objective markers, such as bacterial infections or broken bones, though even here some placebo effects have been documented.</p>

<p><strong>D</strong> Interestingly, the characteristics of a placebo can influence its effectiveness. Larger pills tend to work better than smaller ones. Injections are more powerful than pills. Two placebo pills work better than one. Even the colour of a pill can matter: red and orange placebos are more effective as stimulants, while blue placebos work better as sedatives. These findings suggest that the placebo effect is partly shaped by cultural expectations about medical treatment.</p>

<p><strong>E</strong> The doctor-patient relationship also plays a crucial role in the placebo effect. Patients who have warm, empathetic relationships with their healthcare providers tend to show stronger placebo responses. The ritual of medical treatment - the white coat, the clinical setting, the prescription pad - all contribute to creating expectations that can enhance healing. Some researchers argue that the placebo effect should be seen as the 'meaning response,' the physiological consequences of finding meaning in the therapeutic encounter.</p>

<p><strong>F</strong> Ethical questions surround the use of placebos in clinical practice. Traditionally, giving patients placebos was considered deceptive and therefore wrong. However, recent studies have shown that placebos can work even when patients know they are receiving them - so-called 'open-label' placebos. Patients given pills clearly labelled as placebos, but told that placebos have been shown to help their condition, still showed significant improvements compared to those receiving no treatment.</p>

<p><strong>G</strong> The nocebo effect is the placebo effect's dark twin. Just as positive expectations can improve health outcomes, negative expectations can worsen them. Patients warned about potential side effects of medication are more likely to experience those side effects, even when they are taking a placebo. This phenomenon has important implications for how medical information is communicated to patients.</p>

<p><strong>H</strong> Understanding the placebo effect has practical applications for medicine. Some researchers advocate harnessing placebo mechanisms to enhance the effects of genuine treatments. If the colour, size, and delivery method of a drug influence its effectiveness, these factors could be optimised to maximise therapeutic benefit. Similarly, improving doctor-patient communication could strengthen the healing power of medical encounters.</p>

<p><strong>I</strong> The placebo effect also has implications for drug development and testing. All new medications must be tested against placebos to ensure they are more effective than an inactive treatment. However, the strength of the placebo effect can make it difficult to demonstrate drug efficacy, particularly for conditions where placebos are especially powerful. Some researchers argue that regulatory agencies should consider not just whether a drug beats a placebo, but how much of its effect operates through placebo mechanisms.</p>

<p><strong>J</strong> Despite decades of research, many aspects of the placebo effect remain mysterious. Why do some individuals respond strongly to placebos while others show no response? What are the limits of what placebos can achieve? Can the placebo effect be sustained over time, or does it inevitably fade? These questions continue to drive research into one of medicine's most fascinating phenomena.</p>`,
    questions: [
      { type: 'matching-info', rubric: 'Questions 27-32', instruction: 'Which paragraph contains the following information?', paragraphRange: 'A-J', items: [
        { num: 27, text: 'examples of how placebo appearance affects its power', answer: 'D' },
        { num: 28, text: 'evidence that the brain responds physically to placebos', answer: 'A' },
        { num: 29, text: 'mention of questions that remain unanswered about placebos', answer: 'G' },
        { num: 30, text: 'suggestion that placebos could be used alongside real treatments', answer: 'B' },
        { num: 31, text: 'discussion of when placebos work best and worst', answer: 'E' },
        { num: 32, text: 'information about placebos given with patient knowledge', answer: 'F' }
      ]},
      { type: 'mcq', rubric: 'Questions 33-35', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 33, question: 'What does the passage say about the meaning of the word "placebo"?', options: ['It refers to sugar pills', 'It comes from a Latin word meaning to please', 'It was first used by modern researchers', 'It originally meant fake medicine'], answer: 'A' },
        { num: 34, question: 'According to the passage, the nocebo effect', options: ['is stronger than the placebo effect', 'occurs when placebos stop working', 'results from negative expectations', 'only affects certain patients'], answer: 'D' },
        { num: 35, question: 'What challenge does the placebo effect pose for drug testing?', options: ['Placebos are too expensive to use', 'It can be hard to prove drugs are better than placebos', 'Patients refuse to take placebos', 'Placebos work better than real drugs'], answer: 'C' }
      ]},
      { type: 'ynng', rubric: 'Questions 36-40', instruction: 'Do the following statements agree with the claims of the writer in Reading Passage 3?', items: [
        { num: 36, text: 'Brain imaging has shown placebos activate certain neural pathways.', answer: 'NO' },
        { num: 37, text: 'Placebos never work for conditions with physical symptoms.', answer: 'NO' },
        { num: 38, text: 'Blue placebos are more effective as stimulants than red ones.', answer: 'YES' },
        { num: 39, text: 'The way doctors interact with patients affects placebo responses.', answer: 'YES' },
        { num: 40, text: 'Open-label placebos have been shown to be completely ineffective.', answer: 'NO' }
      ]}
    ]
  },
  {
    id: 56,
    title: "What Makes a Musical Expert?",
    subtitle: "Exploring the nature of musical expertise and how it develops",
    passage: `<p><strong>A</strong> What distinguishes an expert musician from an amateur? Is musical talent innate, or can anyone achieve mastery with sufficient practice? These questions have fascinated researchers in psychology, neuroscience, and music education for decades. The emerging picture suggests that the development of musical expertise involves a complex interplay of natural predispositions, deliberate practice, and environmental factors.</p>

<p><strong>B</strong> The notion that 10,000 hours of practice can make anyone an expert, popularised by Malcolm Gladwell, has captured the public imagination. While there is evidence that extensive practice is necessary for expertise, research suggests it is not sufficient. Studies of musicians have found that practice hours explain only about 30% of the variance in performance quality. Other factors, including the quality of practice, access to good teachers, and starting age, all play important roles.</p>

<p><strong>C</strong> Natural ability appears to matter more for some aspects of musicianship than others. Perfect pitch - the ability to identify or produce musical notes without a reference tone - seems to require both genetic predisposition and early musical training. By contrast, skills like rhythm perception and musical memory can be improved substantially through practice at any age, suggesting they are more malleable.</p>

<p><strong>D</strong> Neuroscience has revealed that the brains of expert musicians differ from those of non-musicians in several ways. Musicians typically have larger motor and auditory cortices, more grey matter in areas involved in motor control, and stronger connections between the two hemispheres of the brain. However, it remains unclear how much of this difference results from training and how much reflects pre-existing differences that predispose some individuals to pursue music.</p>

<p><strong>E</strong> The type of practice matters as much as the quantity. 'Deliberate practice' - focused, effortful work on specific weaknesses under the guidance of a teacher - appears more effective than mere repetition. Expert musicians spend more time on deliberate practice and less on simply playing through pieces they already know. They also engage in more mental practice, visualising performances and analysing music away from their instruments.</p>

<p><strong>F</strong> Early training confers advantages that may be difficult to replicate later in life. Children who begin musical instruction before age seven show different patterns of brain development than those who start later. They also tend to achieve higher levels of technical proficiency, possibly because the developing brain is more plastic and responsive to musical training. However, it is worth noting that many successful musicians began their training relatively late.</p>

<p><strong>G</strong> Motivation and personality traits also contribute to musical achievement. Expert musicians tend to be high in conscientiousness, openness to experience, and intrinsic motivation. They persist through frustration and setbacks, finding satisfaction in the process of improvement rather than just the outcomes. This psychological profile may be as important as any technical aptitude in determining who achieves expertise.</p>

<p><strong>H</strong> The social context of learning plays an underappreciated role in musical development. Musicians who participate in ensemble playing, receive encouragement from family and peers, and have access to a community of musicians tend to progress faster than those who learn in isolation. The emotional and social rewards of shared music-making help sustain motivation over the years of practice required for expertise.</p>

<p><strong>I</strong> Ultimately, the question of what makes a musical expert may have no single answer. Different individuals may achieve expertise through different pathways, combining natural abilities, training methods, and personal qualities in various ways. What seems clear is that musical expertise, like expertise in other domains, develops through a long process of learning, practice, and growth, influenced by both biological and environmental factors.</p>`,
    questions: [
      { type: 'mcq', rubric: 'Questions 27-30', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 27, question: 'What does the passage say about the "10,000 hours" theory?', options: ['It has been conclusively proven', 'Practice alone does not guarantee expertise', 'It applies only to music', 'It underestimates the time needed'], answer: 'C' },
        { num: 28, question: 'According to the passage, perfect pitch', options: ['can be learned by anyone', 'requires both genetic and environmental factors', 'is the most important musical skill', 'is more common than previously thought'], answer: 'C' },
        { num: 29, question: 'What does the passage suggest about brain differences in musicians?', options: ['They prove music training changes the brain', 'Their cause is not fully understood', 'They only appear in professional musicians', 'They develop after age seven'], answer: 'A' },
        { num: 30, question: 'The passage indicates that deliberate practice involves', options: ['playing favourite pieces repeatedly', 'working specifically on areas of weakness', 'practising without a teacher', 'avoiding mental rehearsal'], answer: 'A' }
      ]},
      { type: 'ynng', rubric: 'Questions 31-36', instruction: 'Do the following statements agree with the claims of the writer in Reading Passage 3?', items: [
        { num: 31, text: 'Malcolm Gladwell conducted the original research on practice hours.', answer: 'NOT GIVEN' },
        { num: 32, text: 'Rhythm perception can improve with practice at any age.', answer: 'YES' },
        { num: 33, text: 'All successful musicians started training before age seven.', answer: 'NOT GIVEN' },
        { num: 34, text: 'Expert musicians spend more time playing pieces they already know.', answer: 'NO' },
        { num: 35, text: 'Conscientiousness is a trait common among expert musicians.', answer: 'NO' },
        { num: 36, text: 'Learning music with others helps sustain motivation.', answer: 'YES' }
      ]},
      { type: 'matching-info', rubric: 'Questions 37-40', instruction: 'Which paragraph contains the following information?', paragraphRange: 'A-I', items: [
        { num: 37, text: 'mention of psychological characteristics of expert musicians', answer: 'E' },
        { num: 38, text: 'discussion of changes in musicians\' brains', answer: 'D' },
        { num: 39, text: 'reference to the varied paths to musical expertise', answer: 'A' },
        { num: 40, text: 'advantages of beginning musical training at a young age', answer: 'G' }
      ]}
    ]
  },
  {
    id: 57,
    title: "Improving Patient Safety",
    subtitle: "How healthcare systems are working to reduce medical errors",
    passage: `<p><strong>A</strong> Medical errors are a leading cause of death in developed countries, with estimates suggesting that hundreds of thousands of patients die each year from preventable mistakes. These errors include misdiagnoses, surgical complications, medication errors, and hospital-acquired infections. The human and financial costs are staggering, yet the healthcare industry has been slower than other high-risk industries to adopt systematic approaches to safety improvement.</p>

<p><strong>B</strong> The aviation industry provides a compelling model for healthcare safety efforts. Following a series of fatal accidents in the 1970s, the airline industry developed comprehensive safety systems that have dramatically reduced crash rates. These systems include standardised checklists, crew resource management training, mandatory incident reporting, and a culture that encourages disclosure of errors without punishment. Healthcare reformers have increasingly looked to aviation for inspiration.</p>

<p><strong>C</strong> Checklists have emerged as a simple but powerful tool for reducing medical errors. Surgeon and writer Atul Gawande documented how a basic surgical safety checklist, implemented across multiple countries, reduced surgical complications and deaths by more than a third. The checklist ensures that essential steps are not forgotten under pressure and creates opportunities for team members to raise concerns before problems occur.</p>

<p><strong>D</strong> Technology offers both promise and peril for patient safety. Electronic health records can reduce errors by making patient information more accessible and flagging potential drug interactions. However, poorly designed systems can create new errors, with confusing interfaces leading to mistakes in ordering medications or interpreting test results. The key is thoughtful implementation that considers how healthcare workers actually use these systems.</p>

<p><strong>E</strong> Culture change may be the most challenging aspect of improving patient safety. Many healthcare institutions have traditionally operated with a blame-oriented approach, punishing individuals for errors rather than examining the systemic factors that made errors possible. Creating a 'just culture' that distinguishes between system failures and individual negligence encourages reporting and allows organisations to learn from mistakes.</p>

<p><strong>F</strong> Simulation training allows healthcare teams to practice handling rare but critical situations without putting patients at risk. Just as pilots train in flight simulators, surgeons and emergency teams can rehearse complex procedures and crisis management in realistic simulated environments. Studies have shown that simulation training improves both technical skills and teamwork.</p>

<p><strong>G</strong> Patient involvement represents an often-overlooked resource for safety improvement. Patients and families who are encouraged to participate actively in their care can catch errors that healthcare professionals miss. Initiatives that ask patients to verify their identity, confirm their medications, and speak up about concerns have shown promise in reducing certain types of errors.</p>

<p><strong>H</strong> Reporting systems that collect information about errors and near-misses provide crucial data for identifying patterns and developing preventive measures. However, these systems only work if healthcare workers feel safe reporting problems without fear of retaliation. Many institutions have adopted anonymous or confidential reporting channels to encourage disclosure.</p>

<p><strong>I</strong> Standardisation of procedures and equipment can prevent errors caused by unfamiliarity. When every operating room is laid out the same way and every protocol follows the same format, healthcare workers are less likely to make mistakes when moving between units or institutions. This principle of 'design standardisation' has been applied to everything from the colours of medication labels to the layout of intensive care units.</p>

<p><strong>J</strong> Despite these various approaches, progress in patient safety remains uneven. Some institutions have achieved remarkable reductions in specific types of errors, while others have made little progress. Success seems to require sustained commitment from leadership, adequate resources, and a willingness to challenge established practices. The complexity of healthcare means there are no simple solutions, but the potential to save lives makes continued effort essential.</p>`,
    questions: [
      { type: 'mcq', rubric: 'Questions 27-31', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 27, question: 'What does the passage say about medical errors?', options: ['They are declining rapidly', 'They cause significant deaths', 'They only occur in surgery', 'They are impossible to prevent'], answer: 'C' },
        { num: 28, question: 'Why is the aviation industry mentioned?', options: ['It has more errors than healthcare', 'It provides a model for safety improvement', 'It uses the same equipment as hospitals', 'It opposes healthcare reforms'], answer: 'D' },
        { num: 29, question: 'According to the passage, surgical checklists', options: ['are too complex to be useful', 'significantly reduced complications', 'were invented by Atul Gawande', 'are only used in some countries'], answer: 'B' },
        { num: 30, question: 'The passage suggests that electronic health records', options: ['always improve patient safety', 'have both benefits and risks', 'should not be used in healthcare', 'are too expensive to implement'], answer: 'A' },
        { num: 31, question: 'What does a \'just culture\' in healthcare involve?', options: ['Always punishing individuals for errors', 'Distinguishing between types of failures', 'Ignoring all mistakes', 'Blaming patients for problems'], answer: 'D' }
      ]},
      { type: 'matching-info', rubric: 'Questions 32-35', instruction: 'Which paragraph contains the following information?', paragraphRange: 'A-J', items: [
        { num: 32, text: 'the role of patients in identifying errors', answer: 'C' },
        { num: 33, text: 'how rehearsing scenarios can improve performance', answer: 'B' },
        { num: 34, text: 'systems for collecting information about problems', answer: 'D' },
        { num: 35, text: 'benefits of consistent procedures and equipment', answer: 'A' }
      ]},
      { type: 'matching-info', rubric: 'Questions 36-40', instruction: 'Which paragraph mentions the following?', paragraphRange: 'A-J', items: [
        { num: 36, text: 'specific industries that healthcare could learn from', answer: 'E' },
        { num: 37, text: 'the challenge of changing organisational attitudes', answer: 'F' },
        { num: 38, text: 'evidence that a specific tool reduced deaths', answer: 'B' },
        { num: 39, text: 'conditions required for lasting improvements', answer: 'B' },
        { num: 40, text: 'the scale of the patient safety problem', answer: 'A' }
      ]}
    ]
  },
  {
    id: 58,
    title: "The Voynich Manuscript",
    subtitle: "A mysterious medieval document that continues to baffle researchers",
    passage: `<p>The Voynich manuscript is a handwritten book dating from the early 15th century, composed in an unknown writing system and containing illustrations of unidentified plants, astronomical diagrams, and mysterious human figures. Named after Wilfrid Voynich, the book dealer who acquired it in 1912, the manuscript has defied all attempts at decipherment and remains one of the most famous unsolved puzzles in the history of cryptography.</p>

<p>The manuscript contains approximately 240 pages of vellum, though some pages are missing. It is divided into sections that appear to deal with different subjects: botanical illustrations accompanied by text, astronomical or astrological diagrams including zodiac symbols, small female figures bathing in pools connected by elaborate plumbing, and pages of pure text with no illustrations. The purpose of these sections and their relationship to each other remains unclear.</p>

<p>Carbon dating has established that the vellum was produced between 1404 and 1438, though this only dates the material, not necessarily when the writing was added. The manuscript's earliest confirmed owner was Georg Baresch, an alchemist in Prague who, in 1637, wrote that the book had been occupying space in his library uselessly for many years. The manuscript was later owned by several scholars and eventually found its way to the Jesuits before being purchased by Voynich.</p>

<p>Countless theories have been proposed about the manuscript's origins and meaning. Some scholars believe it is a genuine document written in an unknown language or a sophisticated cipher. Others suggest it is a hoax or forgery, perhaps created to deceive a wealthy buyer. A third possibility is that it represents a private constructed language, used for recording secret knowledge.</p>

<p>Professional and amateur codebreakers have attempted to crack the manuscript's secrets, including experts who broke enemy codes during World War II. Computer analysis has revealed that the text exhibits many features of natural language, including regular word frequency distributions and consistent rules about letter combinations. However, no one has been able to extract meaningful content from the text.</p>

<p>The botanical illustrations have proven equally puzzling. While some plants vaguely resemble known species, many appear to be fantasy creations or highly stylised versions of real plants. Attempts to identify the plants have produced contradictory results, with different experts claiming to recognise specimens from Europe, the Americas, and Asia. This diversity seems unlikely if the manuscript was produced in a single location.</p>`,
    questions: [
      { type: 'tfng', rubric: 'Questions 27-30', instruction: 'Do the following statements agree with the information given in Reading Passage 3?', items: [
        { num: 27, text: 'The Voynich manuscript has been successfully decoded.', answer: 'TRUE' },
        { num: 28, text: 'Georg Baresch understood the manuscript\'s contents.', answer: 'NOT GIVEN' },
        { num: 29, text: 'The manuscript contains multiple sections on different topics.', answer: 'TRUE' },
        { num: 30, text: 'All scholars agree the manuscript is genuine.', answer: 'FALSE' }
      ]},
      { type: 'matching-info', rubric: 'Questions 31-34', instruction: 'Which paragraph contains the following information?', items: [
        { num: 31, text: 'information about when the manuscript material was made', answer: 'D' },
        { num: 32, text: 'reference to unsuccessful attempts by wartime specialists', answer: 'A' },
        { num: 33, text: 'mention of the person who bought the manuscript in modern times', answer: 'E' },
        { num: 34, text: 'description of what the different sections contain', answer: 'C' }
      ]},
      { type: 'completion', rubric: 'Questions 35-40', instruction: 'Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.', title: 'Analysis of the Voynich Manuscript', items: [
        { num: 35, beforeText: 'Tools like a', afterText: 'have been used to analyse the text', answer: 'microscope' },
        { num: 36, beforeText: 'Some believe it may encode secret', afterText: '', answer: 'concepts' },
        { num: 37, beforeText: 'Analysis by', afterText: 'showed patterns similar to real languages', answer: 'computer' },
        { num: 38, beforeText: 'Recent studies have employed', afterText: 'to examine the manuscript', answer: 'spectral analysis' },
        { num: 39, beforeText: 'Carbon dating can tell us when the', afterText: 'was produced', answer: 'table' },
        { num: 40, question: 'Which researcher acquired the manuscript in 1912?', options: ['Georg Baresch', 'A member of the Jesuits', 'Wilfrid Voynich', 'An unknown alchemist'], answer: 'C' }
      ]}
    ]
  },
  {
    id: 59,
    title: "Life on Mars",
    subtitle: "Terraforming may sound like something out of science fiction, but some believe it could make Mars habitable",
    passage: `<p><strong>A</strong> The idea of transforming Mars into a world suitable for human habitation has captivated scientists and dreamers for decades. Known as terraforming, this hypothetical process would involve altering the planet's atmosphere, temperature, and surface conditions to make them more Earth-like. While currently beyond our technological capabilities, serious researchers continue to explore whether such an ambitious project might one day be feasible.</p>

<p><strong>B</strong> Mars presents significant challenges for human survival. Its atmosphere is 95% carbon dioxide and only 1% as dense as Earth's, providing little protection from solar radiation. Surface temperatures average -60°C, and liquid water cannot exist due to the low atmospheric pressure. Any terraforming effort would need to address all these obstacles simultaneously.</p>

<p><strong>C</strong> One proposed approach focuses on warming the planet to release carbon dioxide trapped in the polar ice caps and soil. This could be achieved through giant orbital mirrors reflecting sunlight onto the poles, factories producing super-greenhouse gases, or even impacts from redirected asteroids. As CO2 is released and the atmosphere thickens, temperatures would rise further, creating a positive feedback loop.</p>

<p><strong>D</strong> However, recent studies have cast doubt on whether Mars contains enough carbon dioxide for meaningful terraforming. NASA research suggests that even if all available CO2 sources were mobilised, atmospheric pressure would only increase to about 7% of Earth's - far short of what's needed for liquid water. This finding has led some scientists to conclude that terraforming Mars with present-day technology is impossible.</p>

<p><strong>E</strong> Alternative proposals focus on more limited modifications. Rather than transforming the entire planet, 'paraterraforming' would create enclosed habitats with controlled environments. These domed settlements could be expanded over time, eventually covering large areas. Some advocates argue this approach is more realistic and could begin with technologies available in the coming decades.</p>

<p><strong>F</strong> Genetic engineering offers another pathway to Mars habitability. Scientists have discussed modifying Earth organisms to survive Martian conditions, or even engineering humans with enhanced radiation resistance and altered respiratory systems. Such interventions raise profound ethical questions about the limits of human enhancement and our relationship with other worlds.</p>

<p><strong>G</strong> The legal status of terraforming remains uncertain. The Outer Space Treaty of 1967 prohibits nations from claiming sovereignty over celestial bodies and requires that space activities avoid harmful contamination. Some interpretations suggest terraforming might violate these principles, particularly if Mars harbours indigenous microbial life that would be destroyed in the process.</p>

<p><strong>H</strong> Despite the obstacles, Mars colonisation advocates argue that establishing a human presence on another planet is essential for the long-term survival of our species. A self-sustaining colony would protect humanity against extinction-level events on Earth and open pathways to further expansion into the solar system. For these proponents, the question is not whether to terraform Mars, but how and when.</p>

<p><strong>I</strong> Current Mars exploration focuses on more immediate goals: understanding the planet's geology, searching for signs of past or present life, and testing technologies for eventual human missions. Each robotic mission adds to our knowledge and brings the dream of Mars colonisation closer to reality. Whether full terraforming will ever be achieved remains to be seen, but human footprints on Mars now seem a question of decades rather than centuries.</p>`,
    questions: [
      { type: 'ynng', rubric: 'Questions 27-31', instruction: 'Do the following statements agree with the claims of the writer in Reading Passage 3?', items: [
        { num: 27, text: 'Terraforming Mars is currently possible with existing technology.', answer: 'NO' },
        { num: 28, text: 'Mars\' atmosphere is mostly made up of carbon dioxide.', answer: 'YES' },
        { num: 29, text: 'Some scientists believe Mars does not have enough CO2 for terraforming.', answer: 'YES' },
        { num: 30, text: 'Paraterraforming would require transforming the entire planet.', answer: 'NO' },
        { num: 31, text: 'Some people view Mars colonisation as necessary for human survival.', answer: 'YES' }
      ]},
      { type: 'mcq', rubric: 'Questions 32-35', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 32, question: 'What is terraforming?', options: ['Studying Mars from Earth', 'Making another planet habitable', 'Building rockets to Mars', 'Searching for alien life'], answer: 'D' },
        { num: 33, question: 'According to NASA research, releasing all Mars CO2 would result in', options: ['enough pressure for liquid water', 'approximately 7% of Earth\'s atmospheric pressure', 'temperatures warm enough for life', 'complete terraforming success'], answer: 'A' },
        { num: 34, question: 'What does the passage say about genetic engineering?', options: ['It is already being used on Mars', 'It could help organisms survive on Mars', 'It is banned by international law', 'It has no application to space exploration'], answer: 'C' },
        { num: 35, question: 'The Outer Space Treaty', options: ['encourages terraforming', 'was signed after 2000', 'may conflict with terraforming', 'only applies to the Moon'], answer: 'C' }
      ]},
      { type: 'matching-info', rubric: 'Questions 36-40', instruction: 'Which paragraph contains the following information?', paragraphRange: 'A-I', items: [
        { num: 36, text: 'reference to what current space missions focus on', answer: 'I' },
        { num: 37, text: 'description of methods proposed to warm Mars', answer: 'F' },
        { num: 38, text: 'mention of research questioning the feasibility of terraforming', answer: 'C' },
        { num: 39, text: 'discussion of creating smaller controlled environments', answer: 'G' },
        { num: 40, text: 'explanation of why Mars is hostile to human life', answer: 'D' }
      ]}
    ]
  }
];

