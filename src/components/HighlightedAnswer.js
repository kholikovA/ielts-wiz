import React from 'react';
import Vocab from './Vocab';
import { vocabDefinitions } from '../data/vocab-definitions';
import { speakingQuestions } from '../data/speaking-questions';

const HighlightedAnswer = ({ text, vocabList }) => {
  if (!vocabList || vocabList.length === 0) return text;
  
  // Create regex pattern from vocab list (escape special characters)
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = vocabList
    .sort((a, b) => b.length - a.length) // Sort by length (longest first) to match longer phrases first
    .map(escapeRegex)
    .join('|');
  
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    const lowerPart = part.toLowerCase();
    const matchedVocab = vocabList.find(v => v.toLowerCase() === lowerPart);
    if (matchedVocab && vocabDefinitions[matchedVocab.toLowerCase()]) {
      return <Vocab key={i} word={matchedVocab} meaning={vocabDefinitions[matchedVocab.toLowerCase()]}>{part}</Vocab>;
    }
    return part;
  });
};

// ==================== SPEAKING QUESTIONS DATA (Jan-Aug 2026) ====================
// Each answer is 2-4 sentences, natural, with vocab highlights
const speakingQuestionsJanAug2026 = [
  {
    id: 25,
    topic: "Animals and pets",
    period: "January - August 2026",
    questions: [
      {
        q: "Where do you prefer to keep your pet, indoors or outdoors?",
        answer: (
          <>
            I prefer keeping my cat indoors, mainly because I live in a flat and don't really have outdoor space. Plus, I think indoor pets tend to <Vocab word="bond" meaning="form a close emotional connection">bond</Vocab> more with their owners since they're always around. She does have access to a small balcony though, which she absolutely loves.
          </>
        )
      },
      {
        q: "What's your favourite animal?",
        answer: (
          <>
            I've always been <Vocab word="fascinated by" meaning="extremely interested in something">fascinated by</Vocab> elephants, actually. There's something incredible about how intelligent they are and the way they look after each other. I visited a sanctuary in Thailand a few years ago, and honestly, it <Vocab word="blew my mind" meaning="amazed or impressed me greatly">blew my mind</Vocab>.
          </>
        )
      },
      {
        q: "Have you ever had a pet?",
        answer: (
          <>
            Yeah, I grew up with a golden retriever called Max who was basically my <Vocab word="childhood companion" meaning="a close friend during early years of life">childhood companion</Vocab>. We got him when I was about seven, and he was around until I went to uni. Now I've got a rescue cat, and while it's a different <Vocab word="vibe" meaning="feeling or atmosphere">vibe</Vocab>, it's equally rewarding.
          </>
        )
      },
      {
        q: "What's the most popular animal in your country?",
        answer: (
          <>
            Dogs, <Vocab word="hands down" meaning="without any doubt; definitely">hands down</Vocab>. People treat them like family members these days, spending loads on fancy food and grooming. There's also been a <Vocab word="surge" meaning="sudden large increase">surge</Vocab> in cat cafés recently, which tells you something about how pet-obsessed we've become!
          </>
        )
      }
    ]
  },
  {
    id: 26,
    topic: "Days off",
    period: "January - August 2026",
    questions: [
      {
        q: "When was the last time you had a few days off?",
        answer: (
          <>
            I actually had a long weekend about two weeks ago when there was a public holiday. I <Vocab word="tacked on" meaning="added something extra to the end">tacked on</Vocab> a Monday as well, so I got four days to properly <Vocab word="unwind" meaning="relax after stress or tension">unwind</Vocab>. It made a huge difference to my energy levels, honestly.
          </>
        )
      },
      {
        q: "What do you do when you have days off?",
        answer: (
          <>
            It depends on my mood, really. Sometimes I just <Vocab word="veg out" meaning="relax completely, doing very little">veg out</Vocab> and binge-watch shows, but other times I'll go hiking or plan a <Vocab word="day trip" meaning="a journey to a place and back in one day">day trip</Vocab> somewhere. Lately I've been trying to be more productive, like learning new recipes or tackling DIY projects I've been <Vocab word="putting off" meaning="delaying or postponing something">putting off</Vocab>.
          </>
        )
      },
      {
        q: "What would you like to do if you had a day off tomorrow?",
        answer: (
          <>
            Oh, I'd probably start with a <Vocab word="leisurely" meaning="relaxed and unhurried">leisurely</Vocab> breakfast at this café I've been meaning to try. Then maybe spend the afternoon browsing bookshops without any time pressure. I'd <Vocab word="round it off" meaning="finish something in a satisfying way">round it off</Vocab> with dinner and board games with friends.
          </>
        )
      },
      {
        q: "Do you usually spend your days off with your parents or with your friends?",
        answer: (
          <>
            A bit of both, actually. My parents live about an hour away, so I try to visit them at least once or twice a month, usually for Sunday lunch. With friends, it's more <Vocab word="spontaneous" meaning="happening naturally without planning">spontaneous</Vocab> – we might just <Vocab word="grab brunch" meaning="casually meet for a late morning meal">grab brunch</Vocab> or do something on a whim.
          </>
        )
      }
    ]
  },
  {
    id: 27,
    topic: "Food",
    period: "January - August 2026",
    questions: [
      {
        q: "What kind of food did you like when you were young?",
        answer: (
          <>
            Like most kids, I was <Vocab word="obsessed with" meaning="thinking about something constantly">obsessed with</Vocab> anything sweet or fried. I absolutely loved my grandma's homemade dumplings and would literally count down the days until our next visit. My <Vocab word="palate" meaning="a person's ability to taste and appreciate food">palate</Vocab> was pretty basic back then compared to now!
          </>
        )
      },
      {
        q: "What kinds of food do you particularly like?",
        answer: (
          <>
            I'm really <Vocab word="into" meaning="interested in or enthusiastic about">into</Vocab> Southeast Asian food because of how it balances all these bold flavours. Thai and Vietnamese are probably my <Vocab word="go-to" meaning="favourite or most relied upon choice">go-to</Vocab> cuisines. I also love Japanese food – not just sushi, but the whole range from ramen to little <Vocab word="izakaya" meaning="Japanese-style casual bar serving food and drinks">izakaya</Vocab> dishes.
          </>
        )
      },
      {
        q: "What kinds of food are most popular in your country?",
        answer: (
          <>
            Traditional dishes are still <Vocab word="big" meaning="popular or important">big</Vocab>, especially rice-based meals and noodle soups. But Korean food has become <Vocab word="massive" meaning="extremely popular">massive</Vocab> recently, particularly among younger people – you'll find Korean BBQ places everywhere now. There's also a growing <Vocab word="health-conscious" meaning="aware of and caring about health">health-conscious</Vocab> crowd pushing for more plant-based options.
          </>
        )
      },
      {
        q: "Is there any food you don't like?",
        answer: (
          <>
            I <Vocab word="can't stand" meaning="strongly dislike">can't stand</Vocab> bitter melon, no matter how it's cooked. I've tried it stir-fried, in soups, even stuffed with meat, but my <Vocab word="taste buds" meaning="sensory organs on the tongue for tasting">taste buds</Vocab> just reject it. I'm also not <Vocab word="keen on" meaning="not enthusiastic about">keen on</Vocab> really strong cheeses, though I keep trying them hoping I'll <Vocab word="come around" meaning="gradually change opinion to accept something">come around</Vocab> eventually.
          </>
        )
      }
    ]
  },
  {
    id: 28,
    topic: "Keys",
    period: "January - August 2026",
    questions: [
      {
        q: "Have you ever locked yourself out?",
        answer: (
          <>
            Oh yes, and it was a nightmare! I stepped out to take the rubbish out, and the door <Vocab word="swung shut" meaning="closed quickly with a swinging motion">swung shut</Vocab> behind me with my keys on the counter. I was standing there in my pyjamas at 9pm, totally <Vocab word="mortified" meaning="extremely embarrassed">mortified</Vocab>. Had to knock on my neighbour's door and call a locksmith, which <Vocab word="cost me a fortune" meaning="was very expensive">cost me a fortune</Vocab>.
          </>
        )
      },
      {
        q: "Do you think it's a good idea to leave your keys with a neighbour?",
        answer: (
          <>
            It really depends on your relationship with them. I've <Vocab word="swapped" meaning="exchanged">swapped</Vocab> spare keys with the couple next door, and it gives me <Vocab word="peace of mind" meaning="a feeling of calm and security">peace of mind</Vocab> knowing someone I trust has access in emergencies. But I'd definitely be cautious about doing it with someone I didn't know well.
          </>
        )
      },
      {
        q: "Have you ever lost your keys?",
        answer: (
          <>
            I've had a few <Vocab word="close calls" meaning="situations that nearly resulted in something bad">close calls</Vocab> where I thought I'd lost them, only to find them in some random pocket. But once I genuinely lost my car keys at a beach – they must've fallen out while setting up our picnic. We spent ages <Vocab word="retracing our steps" meaning="going back over the same route to find something">retracing our steps</Vocab> but eventually had to give up.
          </>
        )
      },
      {
        q: "Do you always bring a lot of keys with you?",
        answer: (
          <>
            I try to keep it minimal, actually. I've only got three keys: flat, my parents' house for emergencies, and my bike lock. <Vocab word="Bulky" meaning="large and difficult to carry">Bulky</Vocab> keychains are so uncomfortable in your pocket! I've also switched to <Vocab word="keyless entry" meaning="system allowing access without physical keys">keyless entry</Vocab> where I can, which has <Vocab word="streamlined" meaning="made simpler and more efficient">streamlined</Vocab> things a lot.
          </>
        )
      }
    ]
  },
  {
    id: 29,
    topic: "Dreams",
    period: "January - August 2026",
    questions: [
      {
        q: "Do you remember your dreams when you wake up?",
        answer: (
          <>
            It's <Vocab word="hit or miss" meaning="sometimes successful, sometimes not">hit or miss</Vocab>, honestly. Sometimes I wake up with super vivid memories that almost feel like I've watched a film. Other times, I have this frustrating sense that I dreamed something interesting, but it <Vocab word="evaporates" meaning="disappears gradually">evaporates</Vocab> within seconds of opening my eyes.
          </>
        )
      },
      {
        q: "Do you think dreams will affect life?",
        answer: (
          <>
            I reckon they can, yeah. Dreams often <Vocab word="reflect" meaning="show or represent">reflect</Vocab> what's going on in our <Vocab word="subconscious" meaning="the part of mind not fully aware">subconscious</Vocab>, so paying attention to them can actually reveal anxieties or feelings we haven't fully acknowledged. I've had dreams that made me rethink certain relationships or decisions.
          </>
        )
      },
      {
        q: "Do you think dreams have special meanings?",
        answer: (
          <>
            I'm a bit <Vocab word="sceptical" meaning="having doubts about something">sceptical</Vocab> about universal dream symbolism, like the idea that water always means the same thing for everyone. I think dreams are pretty personal, so their meanings depend on your own experiences. But I do believe our minds use them to <Vocab word="process" meaning="deal with or work through">process</Vocab> emotions.
          </>
        )
      },
      {
        q: "Do you like hearing other people's dreams?",
        answer: (
          <>
            It really depends on how they tell it. Dreams can be <Vocab word="fascinating" meaning="extremely interesting">fascinating</Vocab> if the person shares the emotional impact or finds humour in the absurdity. But when someone <Vocab word="rambles on" meaning="talks for a long time without clear purpose">rambles on</Vocab> about every random detail, it gets a bit tedious, to be honest.
          </>
        )
      },
      {
        q: "Do you share your dreams with others?",
        answer: (
          <>
            Only when they're particularly striking or funny. I might share an amusing one with colleagues over lunch, or mention a recurring <Vocab word="anxiety dream" meaning="a dream reflecting worries or fears">anxiety dream</Vocab> to close friends. But I'm quite <Vocab word="selective" meaning="careful about what to choose or share">selective</Vocab> because I know dreams are way more interesting to the dreamer than anyone else!
          </>
        )
      }
    ]
  },
  {
    id: 30,
    topic: "Reading",
    period: "January - August 2026",
    questions: [
      {
        q: "Do you like reading?",
        answer: (
          <>
            Absolutely, it's one of my favourite things to do. I try to read for at least half an hour before bed every night – it's so much more <Vocab word="relaxing" meaning="reducing tension and anxiety">relaxing</Vocab> and <Vocab word="enriching" meaning="improving quality or value of something">enriching</Vocab> than scrolling through my phone. I genuinely can't imagine life without books.
          </>
        )
      },
      {
        q: "What books do you like to read?",
        answer: (
          <>
            My tastes are pretty <Vocab word="eclectic" meaning="including a wide variety of styles">eclectic</Vocab>. I love literary fiction with complex characters and <Vocab word="moral ambiguities" meaning="situations where right and wrong aren't clear">moral ambiguities</Vocab>. For non-fiction, I'm drawn to anything about psychology or history. Lately, I've been exploring translated works, which has been a great way to experience different storytelling traditions.
          </>
        )
      },
      {
        q: "What book did you read recently?",
        answer: (
          <>
            I just finished this <Vocab word="compelling" meaning="very interesting and holding attention">compelling</Vocab> book about how language shapes the way we think. It looked at languages with unique features and how speakers literally perceive the world differently. Totally <Vocab word="mind-blowing" meaning="extremely surprising or impressive">mind-blowing</Vocab> stuff.
          </>
        )
      },
      {
        q: "What did you learn from it?",
        answer: (
          <>
            The biggest <Vocab word="takeaway" meaning="key lesson or point learned">takeaway</Vocab> was realising how much our native language influences not just how we communicate, but how we actually perceive reality. It also made me more aware of <Vocab word="linguistic diversity" meaning="variety of different languages">linguistic diversity</Vocab> and how many languages are sadly <Vocab word="endangered" meaning="at risk of disappearing">endangered</Vocab> now.
          </>
        )
      }
    ]
  },
  {
    id: 31,
    topic: "Gifts",
    period: "January - August 2026",
    questions: [
      {
        q: "What kind of gifts are popular in your country?",
        answer: (
          <>
            For weddings, cash in fancy envelopes is still the <Vocab word="go-to" meaning="most popular or reliable choice">go-to</Vocab> gift. For birthdays, imported goods like premium chocolates or skincare are quite popular. Among younger people, there's been a shift towards <Vocab word="experience-based" meaning="related to activities rather than physical items">experience-based</Vocab> gifts like concert tickets or restaurant vouchers.
          </>
        )
      },
      {
        q: "What's the best gift you have ever received?",
        answer: (
          <>
            It was actually quite simple – a handwritten letter from my mum on my thirtieth birthday, with photos from every birthday I'd ever had. She'd written <Vocab word="reflections" meaning="thoughts or memories about past events">reflections</Vocab> about who I was at each age. I was completely <Vocab word="overwhelmed" meaning="affected by strong emotion">overwhelmed</Vocab>. It's <Vocab word="priceless" meaning="too valuable to have a price">priceless</Vocab> to me.
          </>
        )
      },
      {
        q: "What do you give others as gifts?",
        answer: (
          <>
            I try to give <Vocab word="thoughtful" meaning="showing careful consideration">thoughtful</Vocab>, personalised gifts rather than generic ones. I keep notes on my phone when people mention wanting something, then surprise them later. I find the <Vocab word="thought behind" meaning="intention or meaning of something">thought behind</Vocab> a gift matters way more than how much it costs.
          </>
        )
      },
      {
        q: "What gift have you received recently?",
        answer: (
          <>
            A friend gave me a coffee subscription for my birthday – they deliver beans from a different country each month. It's brilliant because it's not a <Vocab word="one-off" meaning="happening only once">one-off</Vocab> thing; I get to enjoy it all year. It's also introduced me to coffees I'd never have discovered <Vocab word="on my own" meaning="by myself, without help">on my own</Vocab>.
          </>
        )
      },
      {
        q: "How do we choose gifts?",
        answer: (
          <>
            The key is really knowing the person and their current situation. The best gifts <Vocab word="address a need" meaning="fulfil a requirement or desire">address a need</Vocab> they might have, even if they haven't said it. I also think about whether something will actually <Vocab word="add value" meaning="make life better or more useful">add value</Vocab> to their life or just become <Vocab word="clutter" meaning="untidy collection of things">clutter</Vocab>.
          </>
        )
      }
    ]
  },
  {
    id: 32,
    topic: "Morning time",
    period: "January - August 2026",
    questions: [
      {
        q: "Do you like to get up early?",
        answer: (
          <>
            I've <Vocab word="grown to appreciate" meaning="gradually learned to value something">grown to appreciate</Vocab> early mornings, though I wasn't always a morning person. There's something satisfying about getting things done before most people have even started their day. That said, leaving a warm bed is never easy!
          </>
        )
      },
      {
        q: "What is your morning routine?",
        answer: (
          <>
            I wake up around half six and do some light stretching to <Vocab word="ease into" meaning="gradually become comfortable with">ease into</Vocab> the day. Then I make a <Vocab word="pour-over" meaning="method of brewing coffee by pouring water over grounds">pour-over</Vocab> coffee, which has become almost <Vocab word="meditative" meaning="deeply thoughtful and calming">meditative</Vocab> for me. While drinking it, I review my calendar and <Vocab word="prioritise" meaning="decide what's most important">prioritise</Vocab> my tasks.
          </>
        )
      },
      {
        q: "What do you usually do in the morning?",
        answer: (
          <>
            Mornings are when I'm most <Vocab word="switched on" meaning="alert and mentally active">switched on</Vocab>, so I try to tackle my most challenging tasks first. I avoid checking emails until I've made progress on something meaningful. On weekends, it's more <Vocab word="laid-back" meaning="relaxed and easy-going">laid-back</Vocab> – maybe visiting the farmers' market or having a long breakfast.
          </>
        )
      }
    ]
  },
  {
    id: 33,
    topic: "Hobby",
    period: "January - August 2026",
    questions: [
      {
        q: "Do you have any hobbies?",
        answer: (
          <>
            Yeah, I've got a few that help me <Vocab word="switch off" meaning="relax and stop thinking about work">switch off</Vocab>. Photography has been a passion for ages – I love <Vocab word="candid" meaning="natural and unposed">candid</Vocab> street shots. I've also recently <Vocab word="taken up" meaning="started doing as a hobby">taken up</Vocab> pottery, which is surprisingly therapeutic. And I'd say cooking counts as a hobby too – I love experimenting with different cuisines.
          </>
        )
      },
      {
        q: "Do you have the same hobbies as your family members?",
        answer: (
          <>
            There's actually some overlap. My dad and I both love photography – he's the one who got me into it when I was a teenager. Mum and I share a love of cooking, though she's more traditional while I like <Vocab word="fusion" meaning="mixing different styles or types">fusion</Vocab> stuff. My sister and I have recently <Vocab word="bonded over" meaning="formed a closer relationship through shared activity">bonded over</Vocab> hiking.
          </>
        )
      },
      {
        q: "Did you have any hobbies when you were a child?",
        answer: (
          <>
            I was absolutely <Vocab word="consumed by" meaning="completely focused on or absorbed in">consumed by</Vocab> drawing and making comics. I'd spend hours filling notebooks with characters and storylines. I also collected stamps quite seriously – my grandad got me into that. Both taught me patience and attention to detail, which has <Vocab word="served me well" meaning="been useful or beneficial">served me well</Vocab> as an adult.
          </>
        )
      },
      {
        q: "Do you have a hobby that you've had since childhood?",
        answer: (
          <>
            Reading, definitely. I started with picture books, then children's fiction, and eventually proper novels. While my taste has evolved <Vocab word="dramatically" meaning="to a great degree">dramatically</Vocab>, the core pleasure of <Vocab word="losing myself" meaning="becoming completely absorbed">losing myself</Vocab> in a good book is exactly the same. I reckon it'll stay with me forever.
          </>
        )
      }
    ]
  },
  {
    id: 34,
    topic: "Sports teams",
    period: "January - August 2026",
    questions: [
      {
        q: "Have you ever been part of a sports team?",
        answer: (
          <>
            Yeah, I played basketball for my school team throughout secondary school. We weren't exactly <Vocab word="championship material" meaning="good enough to win competitions">championship material</Vocab>, but that didn't matter. It taught me loads about teamwork and handling pressure, and the <Vocab word="camaraderie" meaning="friendship and trust among a group">camaraderie</Vocab> created friendships that have lasted years.
          </>
        )
      }
    ]
  },
  {
    id: 35,
    topic: "Typing",
    period: "January - August 2026",
    questions: [
      {
        q: "Do you type on a desktop or laptop keyboard every day?",
        answer: (
          <>
            Absolutely, my work is pretty much all computer-based. I'd say I spend at least six or seven hours a day typing. At home, I've invested in a <Vocab word="mechanical keyboard" meaning="keyboard with individual switches under each key">mechanical keyboard</Vocab> that's much nicer to use – the <Vocab word="tactile feedback" meaning="physical sensation you feel when pressing">tactile feedback</Vocab> makes long sessions way more comfortable.
          </>
        )
      },
      {
        q: "When did you learn how to type on a keyboard?",
        answer: (
          <>
            I started using computers around age eight or nine, but I didn't learn to <Vocab word="touch-type" meaning="type without looking at the keyboard">touch-type</Vocab> properly until secondary school. Before that, I was a classic <Vocab word="hunt-and-peck" meaning="typing by looking for each key individually">hunt-and-peck</Vocab> typist. I'm really grateful for those lessons now – it's such an essential skill these days.
          </>
        )
      },
      {
        q: "How do you improve your typing?",
        answer: (
          <>
            I used online typing tutors at first, which <Vocab word="gamified" meaning="made into a game-like experience">gamified</Vocab> the practice with scores and timed tests. Now I think the best way is just to type a lot while being <Vocab word="mindful" meaning="paying attention deliberately">mindful</Vocab> of technique. Learning keyboard <Vocab word="shortcuts" meaning="quick key combinations for commands">shortcuts</Vocab> has also made me way more efficient overall.
          </>
        )
      }
    ]
  },
  {
    id: 36,
    topic: "Walking",
    period: "January - August 2026",
    questions: [
      {
        q: "Do you walk a lot?",
        answer: (
          <>
            I make a <Vocab word="conscious effort" meaning="deliberate attempt to do something">conscious effort</Vocab> to walk as much as possible. I walk to work when the weather's decent, which takes about twenty-five minutes each way. According to my phone, I average around eight thousand steps on workdays, more on weekends when I might go for a proper <Vocab word="ramble" meaning="a long walk in the countryside">ramble</Vocab>.
          </>
        )
      },
      {
        q: "Did you often go outside to have a walk when you were a child?",
        answer: (
          <>
            Yeah, it was quite different back then. We'd <Vocab word="wander around" meaning="walk without a particular destination">wander around</Vocab> the neighbourhood for hours without any real destination. Evening walks with the family after dinner were a regular thing, especially in summer. Walking was just the <Vocab word="default" meaning="standard or normal option">default</Vocab> way kids got around.
          </>
        )
      },
      {
        q: "Why do people like to walk in parks?",
        answer: (
          <>
            I think it fulfils a basic need to connect with nature, even in cities. Parks offer an escape from concrete and traffic – the greenery and fresh air have been <Vocab word="proven" meaning="shown to be true through evidence">proven</Vocab> to reduce stress. There's also the social aspect; you're in a shared space with other people and dogs, which creates a nice sense of <Vocab word="community" meaning="feeling of belonging with others">community</Vocab>.
          </>
        )
      },
      {
        q: "Where would you like to take a long walk if you had the chance?",
        answer: (
          <>
            I've always dreamed of walking part of the Camino de Santiago in Spain. There's something <Vocab word="appealing" meaning="attractive or interesting">appealing</Vocab> about following ancient <Vocab word="pilgrim" meaning="person who travels for religious reasons">pilgrim</Vocab> paths through varied landscapes and staying in small villages. The combination of physical challenge, history, and <Vocab word="disconnecting" meaning="taking a break from technology or routine">disconnecting</Vocab> from modern life sounds perfect.
          </>
        )
      },
      {
        q: "Where have you gone for a walk lately?",
        answer: (
          <>
            Just last weekend, I discovered a trail along an old railway line that's been converted into a <Vocab word="greenway" meaning="path through natural areas for walking or cycling">greenway</Vocab>. It was lovely – passed through some <Vocab word="scenic" meaning="having beautiful natural views">scenic</Vocab> spots and I <Vocab word="stumbled upon" meaning="found by chance">stumbled upon</Vocab> a charming café halfway through. Finding new routes in a familiar city is surprisingly satisfying.
          </>
        )
      }
    ]
  },
  {
    id: 37,
    topic: "Buildings",
    period: "January - August 2026",
    questions: [
      {
        q: "Do you take photos of buildings?",
        answer: (
          <>
            Yeah, <Vocab word="architectural photography" meaning="photography focused on buildings">architectural photography</Vocab> is something I've really got into. I love capturing the <Vocab word="juxtaposition" meaning="placing different things side by side">juxtaposition</Vocab> of old and new buildings, or interesting details like ornate doorways. When travelling, significant buildings are often the main focus of my photos.
          </>
        )
      },
      {
        q: "Is there a building that you would like to visit?",
        answer: (
          <>
            I'm <Vocab word="dying to" meaning="very eager to do something">dying to</Vocab> see the Sagrada Familia in Barcelona. Everyone who's been says photos just don't do justice to standing inside and watching light filter through those incredible stained glass windows. The fact that it's still being built after over a century makes it even more <Vocab word="intriguing" meaning="very interesting and curious">intriguing</Vocab>.
          </>
        )
      }
    ]
  },
  {
    id: 38,
    topic: "Views",
    period: "January - August 2026",
    questions: [
      {
        q: "Do you like taking pictures of different views?",
        answer: (
          <>
            I do, though I've become more <Vocab word="selective" meaning="careful about choosing">selective</Vocab> about when to reach for my camera versus just being present. I love capturing landscapes during <Vocab word="golden hour" meaning="time shortly after sunrise or before sunset">golden hour</Vocab> when the light is magical. But honestly, the best views often don't photograph well because they're about the complete <Vocab word="sensory" meaning="relating to physical senses">sensory</Vocab> experience.
          </>
        )
      },
      {
        q: "Do you prefer views in urban areas or rural areas?",
        answer: (
          <>
            Both <Vocab word="appeal to" meaning="are attractive to">appeal to</Vocab> me in different ways. Urban views satisfy my fascination with city life – dramatic skylines at night are incredible. But rural views offer a sense of peace that cities rarely match. If I had to choose, I'd probably <Vocab word="lean towards" meaning="slightly prefer">lean towards</Vocab> rural for their <Vocab word="restorative" meaning="having the ability to restore health or strength">restorative</Vocab> quality.
          </>
        )
      },
      {
        q: "Do you prefer views in your own country or in other countries?",
        answer: (
          <>
            Views abroad carry the excitement of <Vocab word="novelty" meaning="the quality of being new and unusual">novelty</Vocab>, which makes them feel special in the moment. But I've learned to appreciate views at home more over time, especially as I've explored beyond the usual tourist spots. There's something satisfying about finding <Vocab word="hidden gems" meaning="wonderful places not widely known">hidden gems</Vocab> close to home.
          </>
        )
      }
    ]
  },
  {
    id: 39,
    topic: "Scenery",
    period: "January - August 2026",
    questions: [
      {
        q: "Do you like to take pictures of good scenery?",
        answer: (
          <>
            Very much so, though my approach has evolved. I used to be <Vocab word="obsessed with" meaning="thinking about something constantly">obsessed with</Vocab> capturing every beautiful scene, sometimes missing the moment itself. Now I'm more balanced – sometimes I just <Vocab word="soak it in" meaning="fully enjoy an experience">soak it in</Vocab> rather than reaching for my phone. When I do take photos, I try to capture the emotional impact, not just what it looked like.
          </>
        )
      }
    ]
  },
  {
    id: 40,
    topic: "Childhood activities",
    period: "January - August 2026",
    questions: [
      {
        q: "What did you enjoy doing as a child?",
        answer: (
          <>
            My childhood was full of creative stuff and outdoor adventures. I was constantly drawing, building things with whatever I could find, and inventing <Vocab word="elaborate" meaning="detailed and complicated">elaborate</Vocab> imaginary worlds with friends. I also loved reading and could easily <Vocab word="lose track of time" meaning="not notice time passing">lose track of time</Vocab> with a good book. I was lucky to have the freedom to just explore.
          </>
        )
      },
      {
        q: "Did you enjoy your childhood?",
        answer: (
          <>
            Yeah, genuinely. I grew up in a stable, loving home where my curiosity was encouraged rather than <Vocab word="stifled" meaning="prevented from developing">stifled</Vocab>. We weren't wealthy, but my parents <Vocab word="prioritised" meaning="treated as most important">prioritised</Vocab> experiences and quality time together. The neighbourhood was safe enough that kids could <Vocab word="roam freely" meaning="move around without restrictions">roam freely</Vocab>, which gave me a real sense of independence.
          </>
        )
      }
    ]
  }
];




// ==================== THEME TOGGLE ====================

export default HighlightedAnswer;
