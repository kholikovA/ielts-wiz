import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';
import { vocabDefinitions } from './data/vocab-definitions';
import { speakingPart2Data } from './data/speaking-part2';
import { speakingPart3Data } from './data/speaking-part3';
import { grammarLessons } from './data/grammar-lessons';
import { listeningTestsData } from './data/listening-tests';
import { readingPassage1Tests } from './data/reading-passage1';
import { readingPassage2Tests } from './data/reading-passage2';
import { readingPassage3Tests } from './data/reading-passage3';
import AVATAR_OPTIONS from './data/avatar-options';


// ==================== THEME CONTEXT ====================
const ThemeContext = createContext({});
export const useTheme = () => useContext(ThemeContext);

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ==================== AUTH CONTEXT ====================
const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email, password, name, additionalInfo = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { 
        data: { 
          name,
          target_score: additionalInfo.target_score,
          prep_duration: additionalInfo.prep_duration,
          referral_source: additionalInfo.referral_source,
          goals: additionalInfo.goals
        } 
      }
    });
    // If signup successful, also create profile directly
    if (data?.user && !error) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        name: name,
        target_score: additionalInfo.target_score || 7.0,
        prep_duration: additionalInfo.prep_duration,
        referral_source: additionalInfo.referral_source,
        goals: additionalInfo.goals,
        created_at: new Date().toISOString()
      });
    }
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== CUSTOM AUDIO PLAYER ====================
const AudioPlayer = ({ testId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioRef = useRef(null);

  const audioUrl = `https://kholikova.github.io/80-listening-audios/TEST%20${testId}.mp3`;
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeSpeed = (speed) => {
    audioRef.current.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      padding: '1.25rem 1.5rem',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
      marginBottom: '1.5rem',
    }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        controlsList="nodownload nofullscreen noremoteplayback"
        preload="metadata"
        style={{ display: 'none' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Time & Progress */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', minWidth: '45px' }}>
              {formatTime(currentTime)}
            </span>
            
            {/* Progress Bar */}
            <div
              onClick={handleSeek}
              style={{
                flex: 1,
                height: '6px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '3px',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'white',
                borderRadius: '3px',
                transition: 'width 0.1s linear',
              }} />
              <div style={{
                position: 'absolute',
                left: `${progressPercent}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '14px',
                height: '14px',
                background: 'white',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
            
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', minWidth: '45px', textAlign: 'right' }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Speed Control */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
            }}
          >
            {playbackRate}x
          </button>
          
          {showSpeedMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: '0.5rem',
              background: 'var(--card-bg)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              zIndex: 10,
            }}>
              {speeds.map(speed => (
                <button
                  key={speed}
                  onClick={() => changeSpeed(speed)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: playbackRate === speed ? 'var(--purple-600)' : 'transparent',
                    color: playbackRate === speed ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.75rem', textAlign: 'center' }}>
        🎧 Listen carefully – you will hear the recording only once in the real test
      </p>
    </div>
  );
};

// ==================== TOOLTIP COMPONENT ====================
const Vocab = ({ word, meaning, children }) => {
  const [show, setShow] = useState(false);
  
  return (
    <span 
      style={{ position: 'relative', display: 'inline' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        background: 'linear-gradient(120deg, var(--highlight-bg) 0%, var(--highlight-bg) 100%)',
        backgroundSize: '100% 40%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '0 90%',
        color: 'var(--highlight-text)',
        fontWeight: '500',
        cursor: 'help',
        borderBottom: '2px dotted var(--purple-400)',
        paddingBottom: '1px',
      }}>
        {children || word}
      </span>
      {show && (
        <span style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'var(--tooltip-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          maxWidth: '280px',
          whiteSpace: 'normal',
          textAlign: 'center',
          lineHeight: '1.4',
        }}>
          <span style={{
            display: 'block',
            fontWeight: '600',
            color: 'var(--purple-400)',
            marginBottom: '4px',
            fontSize: '0.8rem',
          }}>
            {word}
          </span>
          {meaning}
          <span style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid var(--tooltip-bg)',
          }} />
        </span>
      )}
    </span>
  );
};


// Helper function to highlight vocabulary words in text
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
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '0.5rem',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        background: 'var(--card-bg)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
      }}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
};

// ==================== LOGO ====================
const Logo = ({ onClick }) => {
  const { isDark } = useTheme();
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <img
        src={isDark ? "/logo-dark.svg" : "/logo-light.svg"}
        alt="IELTS Wiz"
        style={{
          height: '36px',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

// ==================== NAVIGATION ====================
const Navigation = ({ currentPage, setCurrentPage }) => {
  const { user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navItems = [
    { id: 'listening', label: 'Listening' },
    { id: 'reading', label: 'Reading' },
    { id: 'writing', label: 'Writing' },
    { id: 'speaking', label: 'Speaking' },
    { id: 'grammar', label: 'Grammar' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '0.75rem 2rem',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <Logo onClick={() => setCurrentPage('home')} />
        <div className="hide-mobile" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                padding: '0.5rem 0.875rem',
                borderRadius: '8px',
                border: 'none',
                background: currentPage === item.id ? 'var(--purple-600)' : 'transparent',
                color: currentPage === item.id ? 'white' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <div onClick={() => setShowProfileMenu(prev => !prev)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: profile?.avatar_index >= 0 ? 'transparent' : 'linear-gradient(135deg, var(--purple-500), var(--purple-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', color: 'white', overflow: 'hidden', border: profile?.avatar_index >= 0 ? '2px solid var(--purple-500)' : 'none' }}>
                {profile?.avatar_index >= 0 && typeof AVATAR_OPTIONS !== 'undefined' && AVATAR_OPTIONS[profile.avatar_index] ? (
                  <img src={AVATAR_OPTIONS[profile.avatar_index]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()
                )}
              </div>
              {showProfileMenu && (
                <div style={{ position: 'absolute', top: '44px', right: 0, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.5rem', minWidth: '180px', zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                  <button onClick={() => { setCurrentPage('dashboard'); setShowProfileMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    Dashboard
                  </button>
                  <button onClick={() => { toggleTheme(); setShowProfileMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left' }}>
                    {isDark ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    )}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                  <button onClick={() => { signOut().then(() => setCurrentPage('home')); setShowProfileMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <ThemeToggle />
              <button onClick={() => setCurrentPage('login')} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))', color: 'white', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>Sign In</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// ==================== HERO SECTION ====================
const HeroSection = ({ setCurrentPage }) => (
  <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8rem 2rem 4rem', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: '20%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--glow-color) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)`, backgroundSize: '60px 60px', pointerEvents: 'none' }} />
    <div style={{ maxWidth: '1000px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
      <div className="animate-fadeInUp" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '100px', background: 'var(--badge-bg)', border: '1px solid var(--purple-500-30)', marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--purple-300)' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
        Academic IELTS Preparation
      </div>
      <h1 className="animate-fadeInUp" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        Become an<br /><span className="gradient-text">IELTS Wizard</span>
      </h1>
      <p className="animate-fadeInUp" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem' }}>
        Real exam questions, Band 9 sample answers, and expert strategies to achieve your target score.
      </p>
      <div className="animate-fadeInUp" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setCurrentPage('signup')} style={{ padding: '1rem 2.5rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))', color: 'white', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 30px rgba(147, 51, 234, 0.4)' }}>Start Free</button>
        <button onClick={() => setCurrentPage('speaking')} style={{ padding: '1rem 2.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>Browse Questions</button>
      </div>
    </div>
  </section>
);

// ==================== SKILLS SECTION ====================
const SkillsSection = ({ setCurrentPage }) => {
  const skills = [
    { id: 'listening', title: 'Listening', icon: '🎧', description: 'Train your ear with varied accents and question types.', color: '#10b981' },
    { id: 'reading', title: 'Reading', icon: '📖', description: 'Build speed and accuracy with passage analysis techniques.', color: '#06b6d4' },
    { id: 'writing', title: 'Writing', icon: '✍️', description: 'Master Task 1 and Task 2 with advanced grammar and structures.', color: '#ec4899' },
    { id: 'speaking', title: 'Speaking', icon: '🎤', description: 'Practice with real exam questions and Band 9 sample answers.', color: '#a855f7' },
  ];

  return (
    <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>Four Skills, One Goal</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Comprehensive preparation for every section of IELTS Academic</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {skills.map((skill, index) => (
          <div key={skill.id} onClick={() => setCurrentPage(skill.id)} className="animate-fadeInUp" style={{ padding: '2rem', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.3s ease', animationDelay: `${index * 0.1}s` }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{skill.icon}</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.75rem', color: skill.color }}>{skill.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{skill.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// ==================== SPEAKING PAGE ====================
const SpeakingPage = ({ subPage, setSubPage }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showAnswers, setShowAnswers] = useState({});
  const [selectedPart2Topic, setSelectedPart2Topic] = useState(null);
  const [selectedPart3Topic, setSelectedPart3Topic] = useState(null);

  const toggleAnswer = (topicId, qIndex) => {
    const key = `${topicId}-${qIndex}`;
    setShowAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Sub-navigation for speaking
  const speakingSubNav = [
    { id: 'overview', label: 'Overview' },
    { id: 'part1-2026', label: 'Part 1' },
    { id: 'part2-2026', label: 'Part 2' },
    { id: 'part3-2026', label: 'Part 3' },
  ];

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Speaking <span style={{ color: 'var(--purple-400)' }}>Practice</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Real IELTS questions with natural Band 9 answers</p>
        </div>

        {/* Sub Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {speakingSubNav.map(item => (
            <button
              key={item.id}
              onClick={() => { setSubPage(item.id); setSelectedTopic(null); setSelectedPart2Topic(null); setSelectedPart3Topic(null); }}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '10px',
                border: (subPage || 'overview') === item.id ? 'none' : '1px solid var(--border-color)',
                background: (subPage || 'overview') === item.id ? 'linear-gradient(135deg, var(--purple-600), var(--purple-700))' : 'transparent',
                color: (subPage || 'overview') === item.id ? 'white' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Overview Page */}
        {(subPage || 'overview') === 'overview' && (
          <div>
            {/* About IELTS Speaking */}
            <div style={{ padding: '2rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>About IELTS Speaking</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1rem' }}>
                The IELTS Speaking test is a face-to-face interview lasting 11-14 minutes, designed to assess your ability to communicate effectively in English. It evaluates you across four key criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1rem' }}>
                The test consists of three parts. Part 1 involves personal questions about familiar topics like home, work, and interests (4-5 minutes). Part 2 requires you to speak for 1-2 minutes on a given topic after one minute of preparation – this is known as the "long turn." Part 3 features a two-way discussion with the examiner on more abstract themes related to Part 2 (4-5 minutes).
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                Success in the Speaking test comes from natural delivery, varied vocabulary, accurate grammar, and clear pronunciation. Our practice materials include authentic questions from recent exams and Band 9 model answers to help you understand what examiners are looking for.
              </p>
              <a 
                href="https://www.ielts.org/for-test-takers/how-ielts-is-scored" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: 'var(--purple-400)', 
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                📚 View Official IELTS Speaking Resources →
              </a>
            </div>

            {/* Part Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div onClick={() => setSubPage('part1-2026')} style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎤</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Part 1: Introduction</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>Personal questions about familiar topics. 4-5 minutes. 16 topics available.</p>
              </div>
              <div onClick={() => setSubPage('part2-2026')} style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Part 2: Long Turn</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>Speak for 1-2 minutes on a given topic with preparation time. 27 cue cards.</p>
              </div>
              <div onClick={() => setSubPage('part3-2026')} style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Part 3: Discussion</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>Abstract questions related to Part 2 topics. 4-5 minutes. 27 discussion topics.</p>
              </div>
            </div>
          </div>
        )}

        {/* Part 1 Jan-Aug 2026 Questions */}
        {subPage === 'part1-2026' && (
          <div>
            <div style={{ padding: '1rem 1.5rem', borderRadius: '12px', background: 'var(--tag-bg)', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                💡 <strong>Tip:</strong> Hover over <span style={{ color: 'var(--purple-400)', borderBottom: '2px dotted var(--purple-400)' }}>highlighted words</span> to see meanings
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {speakingQuestionsJanAug2026.map((topic, index) => (
                <div key={topic.id} className="animate-fadeInUp" style={{ borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', overflow: 'hidden', animationDelay: `${index * 0.03}s` }}>
                  <div onClick={() => setSelectedTopic(selectedTopic === topic.id ? null : topic.id)} style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--purple-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>{index + 1}</span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{topic.topic}</h3>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '44px' }}>{topic.questions.length} questions • Part 1</p>
                    </div>
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', transform: selectedTopic === topic.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>▼</span>
                  </div>

                  {selectedTopic === topic.id && (
                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                      {topic.questions.map((item, qIndex) => (
                        <div key={qIndex} style={{ padding: '1.25rem 0', borderBottom: qIndex < topic.questions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                          <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{item.q}</p>
                          
                          <button onClick={() => toggleAnswer(topic.id, qIndex)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--purple-500)', background: showAnswers[`${topic.id}-${qIndex}`] ? 'var(--purple-600)' : 'transparent', color: showAnswers[`${topic.id}-${qIndex}`] ? 'white' : 'var(--purple-400)', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                            {showAnswers[`${topic.id}-${qIndex}`] ? 'Hide Answer' : 'Show Band 9 Answer'}
                          </button>

                          {showAnswers[`${topic.id}-${qIndex}`] && (
                            <div style={{ marginTop: '1rem', padding: '1.25rem', borderRadius: '12px', background: 'var(--answer-bg)', border: '1px solid var(--purple-500-30)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', fontSize: '0.7rem', fontWeight: '700', color: '#1a1a1a' }}>BAND 9</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Sample Answer</span>
                              </div>
                              <p style={{ fontSize: '0.95rem', lineHeight: '1.9', color: 'var(--text-primary)' }}>{item.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Part 2 Questions */}
        {subPage === 'part2-2026' && (
          <div>
            <div style={{ padding: '1rem 1.5rem', borderRadius: '12px', background: 'var(--tag-bg)', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                📝 <strong>Part 2 Format:</strong> You'll receive a cue card with a topic and points to cover. You have 1 minute to prepare, then speak for 1-2 minutes.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {speakingPart2Data.map((topic, index) => (
                <div key={topic.id} className="animate-fadeInUp" style={{ borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', overflow: 'hidden', animationDelay: `${index * 0.02}s` }}>
                  <div onClick={() => setSelectedPart2Topic(selectedPart2Topic === topic.id ? null : topic.id)} style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #ec4899, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>{index + 1}</span>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{topic.topic}</h3>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '44px' }}>Related Part 3: {topic.cueCard.relatedPart3}</p>
                    </div>
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', transform: selectedPart2Topic === topic.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>▼</span>
                  </div>

                  {selectedPart2Topic === topic.id && (
                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                      {/* Cue Card */}
                      <div style={{ margin: '1.25rem 0', padding: '1.5rem', borderRadius: '12px', background: 'var(--tag-bg)', border: '2px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--purple-400)', marginBottom: '1rem' }}>📋 Cue Card</h4>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>{topic.cueCard.title}</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>You should say:</p>
                        <ul style={{ paddingLeft: '1.25rem', marginBottom: '0', listStyle: 'none' }}>
                          {topic.cueCard.points.map((point, i) => (
                            <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{point}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Sample Answer */}
                      <button 
                        onClick={() => toggleAnswer(`p2-${topic.id}`, 0)} 
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--purple-500)', background: showAnswers[`p2-${topic.id}-0`] ? 'var(--purple-600)' : 'transparent', color: showAnswers[`p2-${topic.id}-0`] ? 'white' : 'var(--purple-400)', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', marginBottom: '1rem' }}
                      >
                        {showAnswers[`p2-${topic.id}-0`] ? 'Hide Sample Answer' : 'Show Band 9 Sample Answer'}
                      </button>

                      {showAnswers[`p2-${topic.id}-0`] && (
                        <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--answer-bg)', border: '1px solid var(--purple-500-30)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', fontSize: '0.7rem', fontWeight: '700', color: '#1a1a1a' }}>BAND 9</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Sample Answer (1-2 minutes) • Hover highlighted words for definitions</span>
                          </div>
                          {/* Split answer into paragraphs matching bullet points */}
                          {topic.answer.split('\n\n').map((paragraph, pIndex) => (
                            <div key={pIndex} style={{ marginBottom: pIndex < topic.answer.split('\n\n').length - 1 ? '1rem' : 0 }}>
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <span style={{ 
                                  minWidth: '24px', 
                                  height: '24px', 
                                  borderRadius: '50%', 
                                  background: 'var(--purple-600)', 
                                  color: 'white', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  fontSize: '0.75rem', 
                                  fontWeight: '600',
                                  flexShrink: 0,
                                  marginTop: '2px'
                                }}>
                                  {pIndex + 1}
                                </span>
                                <div>
                                  {topic.cueCard.points[pIndex] && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--purple-400)', marginBottom: '0.35rem', fontWeight: '500', textTransform: 'capitalize' }}>
                                      {topic.cueCard.points[pIndex].replace('and explain ', '')}
                                    </p>
                                  )}
                                  <p style={{ fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                                    <HighlightedAnswer text={paragraph} vocabList={topic.keyVocab} />
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Link to Part 3 */}
                      <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--tag-bg)' }}>
                        <button 
                          onClick={() => { setSubPage('part3-2026'); setSelectedPart3Topic(topic.id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--purple-400)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          💬 View Related Part 3 Questions: {topic.cueCard.relatedPart3} →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Part 3 Questions */}
        {subPage === 'part3-2026' && (
          <div>
            <div style={{ padding: '1rem 1.5rem', borderRadius: '12px', background: 'var(--tag-bg)', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                💬 <strong>Part 3 Format:</strong> The examiner asks abstract questions related to Part 2. Give extended answers (20-30 seconds each) with explanations and examples.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {speakingPart3Data.map((topic, index) => (
                <div key={topic.id} className="animate-fadeInUp" style={{ borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', overflow: 'hidden', animationDelay: `${index * 0.02}s` }}>
                  <div onClick={() => setSelectedPart3Topic(selectedPart3Topic === topic.id ? null : topic.id)} style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>{index + 1}</span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{topic.topic}</h3>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '44px' }}>{topic.questions.length} questions • Part 3</p>
                    </div>
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', transform: selectedPart3Topic === topic.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>▼</span>
                  </div>

                  {selectedPart3Topic === topic.id && (
                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                      {topic.questions.map((item, qIndex) => (
                        <div key={qIndex} style={{ padding: '1.25rem 0', borderBottom: qIndex < topic.questions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                          <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{item.q}</p>
                          
                          <button onClick={() => toggleAnswer(`p3-${topic.id}`, qIndex)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--purple-500)', background: showAnswers[`p3-${topic.id}-${qIndex}`] ? 'var(--purple-600)' : 'transparent', color: showAnswers[`p3-${topic.id}-${qIndex}`] ? 'white' : 'var(--purple-400)', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                            {showAnswers[`p3-${topic.id}-${qIndex}`] ? 'Hide Answer' : 'Show Band 9 Answer'}
                          </button>

                          {showAnswers[`p3-${topic.id}-${qIndex}`] && (
                            <div style={{ marginTop: '1rem', padding: '1.25rem', borderRadius: '12px', background: 'var(--answer-bg)', border: '1px solid var(--purple-500-30)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', fontSize: '0.7rem', fontWeight: '700', color: '#1a1a1a' }}>BAND 9</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Sample Answer (20-30 seconds) • Hover highlighted words for definitions</span>
                              </div>
                              <p style={{ fontSize: '0.95rem', lineHeight: '1.9', color: 'var(--text-primary)' }}>
                                <HighlightedAnswer text={item.answer} vocabList={Object.keys(vocabDefinitions)} />
                              </p>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Link back to Part 2 */}
                      <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--tag-bg)' }}>
                        <button 
                          onClick={() => { setSubPage('part2-2026'); setSelectedPart2Topic(topic.relatedPart2); }}
                          style={{ background: 'none', border: 'none', color: 'var(--purple-400)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          📝 View Related Part 2 Cue Card →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== GRAMMAR PAGE ====================
const GrammarPage = () => {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswerSubmit = (lessonId, exerciseIndex, userAnswer) => {
    const key = `${lessonId}-${exerciseIndex}`;
    setUserAnswers(prev => ({ ...prev, [key]: userAnswer }));
    setShowResults(prev => ({ ...prev, [key]: true }));
  };

  const isCorrect = (lessonId, exerciseIndex, lesson) => {
    const key = `${lessonId}-${exerciseIndex}`;
    const userAnswer = userAnswers[key];
    const exercise = lesson.content.exercises[exerciseIndex];
    
    if (exercise.type === 'identify' || exercise.type === 'reorder') {
      return userAnswer === exercise.answer;
    }
    
    if (!userAnswer) return false;
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedAnswer = exercise.answer.toLowerCase().trim();
    
    // Check for multiple acceptable answers (separated by /)
    const acceptableAnswers = normalizedAnswer.split('/').map(a => a.trim());
    return acceptableAnswers.some(a => normalizedUser.includes(a) || a.includes(normalizedUser));
  };

  const resetLesson = (lessonId) => {
    const lesson = grammarLessons.find(l => l.id === lessonId);
    if (lesson) {
      lesson.content.exercises.forEach((_, i) => {
        const key = `${lessonId}-${i}`;
        setUserAnswers(prev => { const n = {...prev}; delete n[key]; return n; });
        setShowResults(prev => { const n = {...prev}; delete n[key]; return n; });
      });
    }
    setCurrentExercise(0);
    setShowExplanation(false);
  };

  const selectedLessonData = grammarLessons.find(l => l.id === selectedLesson);

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Advanced <span style={{ color: 'var(--purple-400)' }}>Grammar</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Master the structures that will elevate your Writing and Speaking scores
          </p>
        </div>

        {!selectedLesson ? (
          // Lesson Grid
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {grammarLessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="animate-fadeInUp"
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animationDelay: `${index * 0.05}s`,
                }}
                onClick={() => { setSelectedLesson(lesson.id); setShowExplanation(false); setCurrentExercise(0); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '6px',
                    background: lesson.category === 'Advanced' ? 'var(--purple-600-20)' : 'var(--cyan-600-20)',
                    fontSize: '0.75rem',
                    color: lesson.category === 'Advanced' ? 'var(--purple-300)' : 'var(--cyan-300)',
                  }}>
                    {lesson.category}
                  </span>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {lesson.skills.map(skill => (
                      <span key={skill} style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: 'var(--tag-bg)',
                        fontSize: '0.7rem',
                        color: 'var(--text-tertiary)',
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {lesson.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
                  {lesson.description}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {lesson.content.exercises.length} exercises
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Lesson Detail View
          <div>
            <button
              onClick={() => { setSelectedLesson(null); resetLesson(selectedLesson); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginBottom: '1.5rem',
              }}
            >
              ← Back to lessons
            </button>

            <div style={{
              padding: '2rem',
              borderRadius: '20px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '6px',
                    background: selectedLessonData.category === 'Advanced' ? 'var(--purple-600-20)' : 'var(--cyan-600-20)',
                    fontSize: '0.75rem',
                    color: selectedLessonData.category === 'Advanced' ? 'var(--purple-300)' : 'var(--cyan-300)',
                  }}>
                    {selectedLessonData.category}
                  </span>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.75rem', color: 'var(--text-primary)' }}>
                    {selectedLessonData.title}
                  </h2>
                </div>
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: showExplanation ? 'var(--purple-600)' : 'var(--tag-bg)',
                    color: showExplanation ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {showExplanation ? 'Hide Theory' : 'Show Theory'}
                </button>
              </div>

              {showExplanation && (
                <div style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'var(--tag-bg)',
                  marginBottom: '1.5rem',
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    📚 Theory & Explanation
                  </h3>
                  <div style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                    {selectedLessonData.content.explanation.split('\n').map((line, i) => {
                      // Handle **bold** text
                      const parts = line.split(/\*\*(.*?)\*\*/g);
                      return (
                        <div key={i} style={{ marginBottom: line.startsWith('•') ? '0.25rem' : '0.5rem' }}>
                          {parts.map((part, j) => 
                            j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Examples:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedLessonData.content.examples.map((ex, i) => (
                      <div key={i} style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'var(--answer-bg)',
                        border: '1px solid var(--purple-500-30)',
                      }}>
                        {ex.simple && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Simple:</div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ex.simple}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Complex:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.complex}</div>
                          </>
                        )}
                        {ex.type && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>{ex.type}:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.example}</div>
                          </>
                        )}
                        {ex.strong && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Too strong:</div>
                            <div style={{ color: '#f87171', marginBottom: '0.5rem', textDecoration: 'line-through' }}>{ex.strong}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Hedged:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.hedged}</div>
                          </>
                        )}
                        {ex.basic && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Basic:</div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ex.basic}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Advanced:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.advanced}</div>
                          </>
                        )}
                        {ex.active && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Active:</div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ex.active}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Passive:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.passive}</div>
                          </>
                        )}
                        {ex.verbal && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Verbal:</div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ex.verbal}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Nominalized:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.nominalized}</div>
                          </>
                        )}
                        {ex.neutral && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Neutral:</div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ex.neutral}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Cleft/Emphatic:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.cleft || ex.emphatic}</div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise Navigation */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {selectedLessonData.content.exercises.map((_, i) => {
                  const key = `${selectedLesson}-${i}`;
                  const answered = showResults[key];
                  const correct = answered && isCorrect(selectedLesson, i, selectedLessonData);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentExercise(i)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: currentExercise === i ? '2px solid var(--purple-500)' : '1px solid var(--border-color)',
                        background: answered ? (correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)') : 'transparent',
                        color: currentExercise === i ? 'var(--purple-400)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Exercise */}
              {(() => {
                const exercise = selectedLessonData.content.exercises[currentExercise];
                const key = `${selectedLesson}-${currentExercise}`;
                const answered = showResults[key];
                const correct = answered && isCorrect(selectedLesson, currentExercise, selectedLessonData);

                return (
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    background: 'var(--tag-bg)',
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--purple-400)', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Exercise {currentExercise + 1} of {selectedLessonData.content.exercises.length}
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {exercise.instruction}
                    </p>

                    {exercise.sentences && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'var(--card-bg)',
                        marginBottom: '1rem',
                        border: '1px solid var(--border-color)',
                      }}>
                        {exercise.sentences.map((s, i) => (
                          <div key={i} style={{ color: 'var(--text-secondary)', marginBottom: i < exercise.sentences.length - 1 ? '0.5rem' : 0 }}>
                            {i + 1}. {s}
                          </div>
                        ))}
                      </div>
                    )}

                    {exercise.sentence && !exercise.options && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'var(--card-bg)',
                        marginBottom: '1rem',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}>
                        {exercise.sentence}
                      </div>
                    )}

                    {exercise.paragraph && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'var(--card-bg)',
                        marginBottom: '1rem',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6',
                      }}>
                        {exercise.paragraph}
                      </div>
                    )}

                    {/* Input/Options based on exercise type */}
                    {(exercise.type === 'combine' || exercise.type === 'transform' || exercise.type === 'correct') && (
                      <div>
                        <textarea
                          placeholder="Type your answer here..."
                          value={userAnswers[key] || ''}
                          onChange={(e) => setUserAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={answered}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            minHeight: '80px',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                          }}
                        />
                        {exercise.hint && !answered && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            💡 Hint: {exercise.hint}
                          </p>
                        )}
                      </div>
                    )}

                    {exercise.type === 'fill' && exercise.options && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {exercise.options.map((option, i) => (
                          <button
                            key={i}
                            onClick={() => !answered && setUserAnswers(prev => ({ ...prev, [key]: option }))}
                            disabled={answered}
                            style={{
                              padding: '0.625rem 1.25rem',
                              borderRadius: '8px',
                              border: userAnswers[key] === option ? '2px solid var(--purple-500)' : '1px solid var(--border-color)',
                              background: userAnswers[key] === option ? 'var(--purple-600-20)' : 'transparent',
                              color: 'var(--text-primary)',
                              cursor: answered ? 'default' : 'pointer',
                              fontWeight: userAnswers[key] === option ? '600' : '400',
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {exercise.type === 'fill' && !exercise.options && (
                      <div>
                        <input
                          type="text"
                          placeholder="Type your answer..."
                          value={userAnswers[key] || ''}
                          onChange={(e) => setUserAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={answered}
                          style={{
                            width: '100%',
                            padding: '0.875rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                          }}
                        />
                        {exercise.hint && !answered && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            💡 Hint: {exercise.hint}
                          </p>
                        )}
                      </div>
                    )}

                    {(exercise.type === 'identify' || exercise.type === 'reorder') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {exercise.options.map((option, i) => (
                          <button
                            key={i}
                            onClick={() => !answered && setUserAnswers(prev => ({ ...prev, [key]: i }))}
                            disabled={answered}
                            style={{
                              padding: '1rem',
                              borderRadius: '10px',
                              border: userAnswers[key] === i ? '2px solid var(--purple-500)' : '1px solid var(--border-color)',
                              background: userAnswers[key] === i ? 'var(--purple-600-20)' : 'transparent',
                              color: 'var(--text-primary)',
                              cursor: answered ? 'default' : 'pointer',
                              textAlign: 'left',
                              fontWeight: userAnswers[key] === i ? '500' : '400',
                            }}
                          >
                            {String.fromCharCode(65 + i)}. {option}
                          </button>
                        ))}
                        {exercise.hint && !answered && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            💡 Hint: {exercise.hint}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submit / Result */}
                    <div style={{ marginTop: '1.5rem' }}>
                      {!answered ? (
                        <button
                          onClick={() => handleAnswerSubmit(selectedLesson, currentExercise, userAnswers[key])}
                          disabled={!userAnswers[key] && userAnswers[key] !== 0}
                          style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: (!userAnswers[key] && userAnswers[key] !== 0) ? 'var(--tag-bg)' : 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                            color: (!userAnswers[key] && userAnswers[key] !== 0) ? 'var(--text-tertiary)' : 'white',
                            fontWeight: '600',
                            cursor: (!userAnswers[key] && userAnswers[key] !== 0) ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Check Answer
                        </button>
                      ) : (
                        <div style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          background: correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
                          border: `1px solid ${correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>{correct ? '✅' : '❌'}</span>
                            <span style={{ fontWeight: '600', color: correct ? '#34d399' : '#f87171' }}>
                              {correct ? 'Correct!' : 'Not quite right'}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <strong>Model answer:</strong> {exercise.answer}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Next Exercise Button */}
                    {answered && currentExercise < selectedLessonData.content.exercises.length - 1 && (
                      <button
                        onClick={() => setCurrentExercise(currentExercise + 1)}
                        style={{
                          marginTop: '1rem',
                          padding: '0.75rem 2rem',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Next Exercise →
                      </button>
                    )}

                    {answered && currentExercise === selectedLessonData.content.exercises.length - 1 && (
                      <div style={{ marginTop: '1rem' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          🎉 You've completed all exercises in this lesson!
                        </p>
                        <button
                          onClick={() => resetLesson(selectedLesson)}
                          style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            fontWeight: '500',
                            cursor: 'pointer',
                            marginRight: '0.75rem',
                          }}
                        >
                          Try Again
                        </button>
                        <button
                          onClick={() => { setSelectedLesson(null); resetLesson(selectedLesson); }}
                          style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Back to Lessons
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



// ==================== LISTENING PAGE ====================
const ListeningPage = ({ subPage, setSubPage, setCurrentPage }) => {
  const { user } = useAuth();
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedPart, setSelectedPart] = useState('part1');
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerChange = (questionNum, value) => {
    setUserAnswers(prev => ({ ...prev, [questionNum]: value }));
  };

  const checkAnswers = () => {
    if (!selectedTest) return;
    let correct = 0;
    selectedTest.questions.forEach(q => {
      const userAns = (userAnswers[q.num] || '').toLowerCase().trim();
      const correctAns = (q.answer || '').toLowerCase().trim();
      if (correctAns && userAns === correctAns) {
        correct++;
      }
    });
    setScore(correct);
    setShowResults(true);
  };

  const resetTest = () => {
    setUserAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const listeningSubNav = [
    { id: 'overview', label: 'Overview' },
    { id: '80-tests', label: '80 Listening Tests' },
  ];

  const partTabs = [
    { id: 'part1', label: 'Part 1 (Tests 1-20)', description: 'Section 1: Everyday social contexts' },
    { id: 'part2', label: 'Part 2 (Tests 21-40)', description: 'Section 2: Everyday social monologue' },
    { id: 'part3', label: 'Part 3 (Tests 41-60)', description: 'Section 3: Educational/training contexts' },
    { id: 'part4', label: 'Part 4 (Tests 61-80)', description: 'Section 4: Academic monologue' },
  ];

  const currentTests = listeningTestsData[selectedPart] || [];

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Listening <span style={{ color: 'var(--purple-400)' }}>Practice</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Train your ear with varied accents and question types</p>
        </div>

        {/* Sub Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {listeningSubNav.map(item => (
            <button
              key={item.id}
              onClick={() => { setSubPage(item.id); setSelectedTest(null); }}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '10px',
                border: (subPage || 'overview') === item.id ? 'none' : '1px solid var(--border-color)',
                background: (subPage || 'overview') === item.id ? 'linear-gradient(135deg, var(--purple-600), var(--purple-700))' : 'transparent',
                color: (subPage || 'overview') === item.id ? 'white' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {(subPage || 'overview') === 'overview' && (
          <div>
            {/* About IELTS Listening */}
            <div style={{ padding: '2rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>About IELTS Listening</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1rem' }}>
                The IELTS Listening test takes approximately 30 minutes (plus 10 minutes transfer time) and consists of four recorded sections of increasing difficulty. You will hear each recording only once, so developing strong note-taking and prediction skills is essential for success.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1rem' }}>
                Section 1 features a conversation between two speakers in an everyday social context, such as making a booking or asking for information. Section 2 presents a monologue on an everyday topic, like a local facilities guide. Section 3 involves a discussion between up to four people in an educational setting. Section 4 is an academic lecture or talk on a topic of general interest.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                Question types include multiple choice, matching, plan/map/diagram labelling, form/note/table/flowchart completion, and sentence completion. Our practice tests expose you to various British, American, Australian, and other accents you'll encounter in the real exam.
              </p>
              <a 
                href="https://www.ielts.org/for-test-takers/test-format" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: 'var(--purple-400)', 
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                📚 View Official IELTS Listening Resources →
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {[
                { icon: '🎧', title: 'Section 1', desc: 'Conversation between two people in everyday context' },
                { icon: '📢', title: 'Section 2', desc: 'Monologue in everyday social context' },
                { icon: '🎓', title: 'Section 3', desc: 'Conversation in educational/training context' },
                { icon: '📚', title: 'Section 4', desc: 'Academic lecture or talk' },
              ].map((item, i) => (
                <div key={i} onClick={() => setSubPage('80-tests')} style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <div onClick={() => setSubPage('80-tests')} style={{ padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(135deg, var(--purple-600-10), var(--purple-700-5))', border: '1px solid var(--purple-500-30)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '0.7rem', fontWeight: '600', color: 'white', letterSpacing: '0.5px', lineHeight: '1' }}>80 TESTS</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>80 IELTS Listening Tests</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Complete practice tests covering all four sections with audio</p>
            </div>
          </div>
        )}

        {/* 80 Listening Tests */}
        {subPage === '80-tests' && !selectedTest && (
          <div>
            {/* Part Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {partTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedPart(tab.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: selectedPart === tab.id ? 'none' : '1px solid var(--border-color)',
                    background: selectedPart === tab.id ? 'var(--purple-600)' : 'transparent',
                    color: selectedPart === tab.id ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {partTabs.find(t => t.id === selectedPart)?.description}
            </p>

            {/* Tests Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {currentTests.map((test, index) => (
                <div
                  key={test.id}
                  onClick={() => { if (!user) { setCurrentPage('login'); return; } setSelectedTest(test); }}
                  className="animate-fadeInUp"
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    animationDelay: `${index * 0.02}s`,
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'var(--purple-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: 'white',
                  }}>
                    {test.id}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {test.title.length > 20 ? test.title.slice(0, 20) + '...' : test.title}
                  </p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    10 questions
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Test View */}
        {subPage === '80-tests' && selectedTest && (
          <div>
            <button
              onClick={() => { setSelectedTest(null); resetTest(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginBottom: '1.5rem',
              }}
            >
              ← Back to tests
            </button>

            <div style={{
              padding: '2rem',
              borderRadius: '20px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
            }}>
              {/* Test Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'white',
                }}>
                  {selectedTest.id}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Test {selectedTest.id}: {selectedTest.title}
                  </h2>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    Section {selectedTest.id <= 20 ? 1 : selectedTest.id <= 40 ? 2 : selectedTest.id <= 60 ? 3 : 4} • 10 Questions
                  </p>
                </div>
              </div>

              {/* Custom Audio Player */}
              <AudioPlayer testId={selectedTest.id} />

              {/* Score Display */}
              {showResults && (
                <div style={{
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  background: score >= 7 ? 'rgba(34, 197, 94, 0.1)' : score >= 5 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${score >= 7 ? 'rgba(34, 197, 94, 0.3)' : score >= 5 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Your Score: {score}/10
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {score >= 8 ? 'Excellent!' : score >= 6 ? 'Good job!' : score >= 4 ? 'Keep practicing!' : 'Review the answers below'}
                    </p>
                  </div>
                  <button
                    onClick={resetTest}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* IELTS-Style Form/Note Layout */}
              <div style={{
                border: '2px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '1.5rem',
              }}>
                {/* Form Title Header */}
                <div style={{
                  background: 'var(--purple-600)',
                  padding: '1rem 1.5rem',
                  textAlign: 'center',
                }}>
                  <h3 style={{ 
                    color: 'white', 
                    fontSize: '1.1rem', 
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    {selectedTest.formTitle || selectedTest.title}
                  </h3>
                  {selectedTest.formSubtitle && (
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {selectedTest.formSubtitle}
                    </p>
                  )}
                </div>

                {/* Instruction */}
                <div style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--tag-bg)',
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {selectedTest.instruction || 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.'}
                  </p>
                </div>

                {/* Questions as Form Fields */}
                <div style={{ padding: '1.5rem' }}>
                  {selectedTest.questions.map((q, i) => {
                    const userAns = userAnswers[q.num] || '';
                    const correctAns = q.answer || '';
                    const isCorrect = showResults && correctAns && userAns.toLowerCase().trim() === correctAns.toLowerCase().trim();
                    const isWrong = showResults && correctAns && userAns && !isCorrect;
                    
                    return (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.875rem 0',
                        borderBottom: i < selectedTest.questions.length - 1 ? '1px solid var(--border-color)' : 'none',
                      }}>
                        {/* Question Number */}
                        <span style={{
                          minWidth: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: showResults 
                            ? (isCorrect ? 'rgba(34, 197, 94, 0.2)' : isWrong ? 'rgba(239, 68, 68, 0.2)' : 'var(--purple-600-20)')
                            : 'var(--purple-600-20)',
                          border: showResults
                            ? (isCorrect ? '2px solid #22c55e' : isWrong ? '2px solid #ef4444' : 'none')
                            : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: showResults 
                            ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--purple-400)')
                            : 'var(--purple-400)',
                          flexShrink: 0,
                        }}>
                          {showResults ? (isCorrect ? '✓' : isWrong ? '✗' : q.num) : q.num}
                        </span>

                        {/* Question Text with Inline Input */}
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            fontSize: '0.95rem',
                            color: 'var(--text-primary)',
                            lineHeight: '1.8',
                          }}>
                            <span>{q.text}</span>
                            <input
                              type="text"
                              value={userAns}
                              onChange={(e) => handleAnswerChange(q.num, e.target.value)}
                              disabled={showResults}
                              placeholder="________"
                              style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: '4px',
                                border: showResults 
                                  ? (isCorrect ? '2px solid #22c55e' : isWrong ? '2px solid #ef4444' : '1px solid var(--border-color)')
                                  : '1px solid var(--border-color)',
                                background: showResults
                                  ? (isCorrect ? 'rgba(34, 197, 94, 0.1)' : isWrong ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)')
                                  : 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                width: '140px',
                                textAlign: 'center',
                                fontWeight: '500',
                              }}
                            />
                          </div>
                          
                          {/* Show correct answer if wrong */}
                          {isWrong && correctAns && (
                            <p style={{ 
                              marginTop: '0.5rem', 
                              fontSize: '0.85rem', 
                              color: '#22c55e',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}>
                              <span style={{ fontWeight: '500' }}>Correct answer:</span> {correctAns}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Check Answers Button */}
              {!showResults ? (
                <button 
                  onClick={checkAnswers}
                  style={{
                    padding: '0.875rem 2rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '1rem',
                  }}
                >
                  Check Answers
                </button>
              ) : (
                <button 
                  onClick={resetTest}
                  style={{
                    padding: '0.875rem 2rem',
                    borderRadius: '10px',
                    border: '1px solid var(--purple-500)',
                    background: 'transparent',
                    color: 'var(--purple-400)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '1rem',
                  }}
                >
                  Reset & Try Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};




// ==================== READING PAGE COMPONENT ====================
// ==================== READING PAGE COMPONENT ====================
// ==================== READING PAGE COMPONENT ====================
const ReadingPage = ({ subPage, setSubPage, setCurrentPage }) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(20 * 60);
  const [timerMode, setTimerMode] = useState('countdown');
  const [timerRunning, setTimerRunning] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [panelWidth, setPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [completedTests, setCompletedTests] = useState(() => {
    const saved = localStorage.getItem('completedReadingTests');
    if (!saved) return [];
    let arr = JSON.parse(saved);
    // Migrate old IDs: 31-40 were renumbered to 21-30
    const migrated = arr.map(id => (id >= 31 && id <= 40) ? id - 10 : id);
    const unique = [...new Set(migrated)];
    if (JSON.stringify(unique) !== JSON.stringify(arr)) {
      localStorage.setItem('completedReadingTests', JSON.stringify(unique));
    }
    return unique;
  });
  const [highlightPopup, setHighlightPopup] = useState({ show: false, x: 0, y: 0, range: null, isHighlighted: false });
  const timerRef = useRef(null);
  const passageRef = useRef(null);
  const questionsRef = useRef(null);
  const containerRef = useRef(null);

  // Inject CSS for timer blink animation and input placeholder styling
  useEffect(() => {
    const styleId = 'timer-blink-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        html {
          overflow-y: scroll;
        }
        @keyframes timerBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .completion-input::placeholder {
          font-family: inherit;
          text-align: center;
          color: var(--text-muted);
          opacity: 0.6;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Get the correct test array based on subPage
  const getTestArray = () => {
    if (subPage === 'passage3') return readingPassage3Tests;
    if (subPage === 'passage2') return readingPassage2Tests;
    return readingPassage1Tests;
  };

  const selectedTest = selectedTestId ? getTestArray().find(t => t.id === selectedTestId) : null;

  // Parse URL on mount and on popstate (back/forward)
  useEffect(() => {
    const syncFromUrl = () => {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'reading' && pathParts[1] && pathParts[2]) {
        const testId = parseInt(pathParts[2]);
        const passage = pathParts[1];
        const tests = passage === 'passage3' ? readingPassage3Tests : passage === 'passage2' ? readingPassage2Tests : readingPassage1Tests;
        if (tests.find(t => t.id === testId)) {
          setSelectedTestId(testId);
          setSubPage(passage);
          return;
        }
      }
      // No test ID in URL - clear selection
      setSelectedTestId(null);
      setUserAnswers({});
      setShowResults(false);
      setShowResultsModal(false);
      setTimerRunning(false);
      clearInterval(timerRef.current);
      if (pathParts[0] === 'reading' && pathParts[1]) {
        setSubPage(pathParts[1]);
      }
    };
    syncFromUrl();
    const handleReadingPopState = () => syncFromUrl();
    window.addEventListener('popstate', handleReadingPopState);
    return () => window.removeEventListener('popstate', handleReadingPopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer logic
  useEffect(() => {
    if (selectedTest && timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (timerMode === 'countdown') {
            return prev <= 0 ? 0 : prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [selectedTest, timerRunning, timerMode]);

  // Handle dragging for panel resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth >= 25 && newWidth <= 75) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Highlight popup on text selection
  useEffect(() => {
    const handleMouseUp = (e) => {
      // Small delay to let selection complete
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          const range = selection.getRangeAt(0);
          const passageEl = passageRef.current;
          const questionsEl = questionsRef.current;
          
          // Check if selection is within our content areas
          if ((passageEl && passageEl.contains(range.commonAncestorContainer)) ||
              (questionsEl && questionsEl.contains(range.commonAncestorContainer))) {
            
            // Check if selection is inside an existing highlight
            let parent = range.commonAncestorContainer;
            while (parent && parent !== document.body) {
              if (parent.classList && parent.classList.contains('user-highlight')) {
                setHighlightPopup({
                  show: true,
                  x: e.clientX,
                  y: e.clientY - 50,
                  range: null,
                  isHighlighted: true,
                  highlightEl: parent
                });
                return;
              }
              parent = parent.parentNode;
            }
            
            setHighlightPopup({
              show: true,
              x: e.clientX,
              y: e.clientY - 50,
              range: range.cloneRange(),
              isHighlighted: false,
              highlightEl: null
            });
          }
        }
      }, 10);
    };

    const handleMouseDown = (e) => {
      // Hide popup if clicking outside
      if (!e.target.closest('.highlight-popup')) {
        setHighlightPopup({ show: false, x: 0, y: 0, range: null, isHighlighted: false });
      }
    };

    if (selectedTest) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousedown', handleMouseDown);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [selectedTest]);

  const applyHighlight = () => {
    if (highlightPopup.range) {
      try {
        const span = document.createElement('span');
        span.style.backgroundColor = 'rgba(255, 235, 59, 0.6)';
        span.style.borderRadius = '2px';
        span.style.padding = '0 2px';
        span.className = 'user-highlight';
        highlightPopup.range.surroundContents(span);
        window.getSelection().removeAllRanges();
      } catch (e) {
        // Cross-element selection - ignore
      }
    }
    setHighlightPopup({ show: false, x: 0, y: 0, range: null, isHighlighted: false });
  };

  const removeHighlight = () => {
    if (highlightPopup.highlightEl) {
      const parent = highlightPopup.highlightEl.parentNode;
      const text = document.createTextNode(highlightPopup.highlightEl.textContent);
      parent.replaceChild(text, highlightPopup.highlightEl);
      parent.normalize();
    }
    window.getSelection().removeAllRanges();
    setHighlightPopup({ show: false, x: 0, y: 0, range: null, isHighlighted: false });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTest = (testId) => {
    if (!user) {
      setCurrentPage('login');
      return;
    }
    setSelectedTestId(testId);
    setUserAnswers({});
    setShowResults(false);
    setShowResultsModal(false);
    setTimerSeconds(timerMode === 'countdown' ? 20 * 60 : 0);
    setTimerRunning(true);
    window.history.pushState({}, '', `/reading/${subPage}/${testId}`);
  };

  const exitTest = () => {
    setSelectedTestId(null);
    setUserAnswers({});
    setShowResults(false);
    setShowResultsModal(false);
    setTimerRunning(false);
    clearInterval(timerRef.current);
    // Remove highlights
    document.querySelectorAll('.user-highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    window.history.pushState({}, '', `/reading/${subPage}`);
  };

  const handleAnswerChange = (questionNum, value) => {
    if (!showResults) {
      setUserAnswers(prev => ({ ...prev, [questionNum]: value }));
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
    setShowResultsModal(true);
    setTimerRunning(false);
    // Mark test as completed
    if (!completedTests.includes(selectedTestId)) {
      const newCompleted = [...completedTests, selectedTestId];
      setCompletedTests(newCompleted);
      localStorage.setItem('completedReadingTests', JSON.stringify(newCompleted));
    }
  };

  const calculateScore = () => {
    if (!selectedTest) return { correct: 0, total: 0 };
    let correct = 0;
    let total = 0;
    selectedTest.questions.forEach(section => {
      section.items.forEach(item => {
        total++;
        const userAns = (userAnswers[item.num] || '').toLowerCase().trim();
        const correctAns = item.answer.toLowerCase().trim();
        if (userAns === correctAns) correct++;
      });
    });
    return { correct, total };
  };

  const getBandScore = (correct, total) => {
    const pct = (correct / total) * 100;
    if (pct >= 90) return 9;
    if (pct >= 80) return 8;
    if (pct >= 70) return 7;
    if (pct >= 60) return 6;
    if (pct >= 50) return 5;
    if (pct >= 40) return 4;
    if (pct >= 30) return 3;
    return 2;
  };

  const scrollToQuestion = (num) => {
    const el = document.getElementById(`question-${num}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ========== Overview Page ==========
  if (subPage === 'overview') {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            📖 Reading Section
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Practice with authentic IELTS reading passages and questions
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div 
              onClick={() => { setSubPage('passage1'); window.history.pushState({}, '', '/reading/passage1'); }}
              style={{ 
                padding: '2rem', borderRadius: '16px', 
                background: 'linear-gradient(135deg, var(--purple-600-10), var(--purple-700-5))', 
                border: '1px solid var(--purple-500-30)', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '0.7rem', fontWeight: '600', color: 'white', letterSpacing: '0.6px', lineHeight: '1.5' }}>40 TESTS</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Passage 1 Practice</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>13 questions • T/F/NG, completion, matching, MCQ</p>
            </div>

            <div 
              onClick={() => { setSubPage('passage2'); window.history.pushState({}, '', '/reading/passage2'); }}
              style={{ 
                padding: '2rem', borderRadius: '16px', 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))', 
                border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: '#3b82f6', fontSize: '0.7rem', fontWeight: '600', color: 'white', letterSpacing: '0.5px', lineHeight: '1' }}>10 TESTS</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Passage 2 Practice</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>13 questions • Matching headings, MCQ, T/F/NG, completion</p>
            </div>

            <div 
              onClick={() => { setSubPage('passage3'); window.history.pushState({}, '', '/reading/passage3'); }}
              style={{ 
                padding: '2rem', borderRadius: '16px', background: 'var(--card-bg)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: '#10b981', fontSize: '0.7rem', fontWeight: '600', color: 'white', letterSpacing: '0.5px', lineHeight: '1' }}>9 TESTS</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Passage 3 Practice</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>14 questions • Advanced difficulty • Matching, MCQ, T/F/NG</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== Passage 1 Test List ==========
  if (subPage === 'passage1' && !selectedTestId) {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <button
            onClick={() => { setSubPage('overview'); window.history.pushState({}, '', '/reading'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', border: 'none', background: 'var(--card-bg)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ← Back to Overview
          </button>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Passage 1 Practice Tests
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            12–13 questions per test • 20 minutes recommended
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {readingPassage1Tests.map((test) => {
              const isCompleted = completedTests.includes(test.id);
              return (
                <div
                  key={test.id}
                  onClick={() => startTest(test.id)}
                  style={{
                    padding: '1.5rem', borderRadius: '12px', background: 'var(--card-bg)',
                    border: `1px solid ${isCompleted ? '#22c55e' : 'var(--border-color)'}`, 
                    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
                  }}
                >
                  {isCompleted && (
                    <div style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '1rem' }}>✓</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--purple-400)' }}>TEST {test.id}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', paddingRight: isCompleted ? '2rem' : 0 }}>{test.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{test.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========== Passage 2 Test List ==========
  if (subPage === 'passage2' && !selectedTestId) {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <button
            onClick={() => { setSubPage('overview'); window.history.pushState({}, '', '/reading'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', border: 'none', background: 'var(--card-bg)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ← Back to Overview
          </button>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Passage 2 Practice Tests
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            13 questions per test • 20 minutes recommended
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {readingPassage2Tests.map((test) => {
              const isCompleted = completedTests.includes(test.id);
              return (
                <div
                  key={test.id}
                  onClick={() => startTest(test.id)}
                  style={{
                    padding: '1.5rem', borderRadius: '12px', background: 'var(--card-bg)',
                    border: `1px solid ${isCompleted ? '#22c55e' : 'var(--border-color)'}`, 
                    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
                  }}
                >
                  {isCompleted && (
                    <div style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '1rem' }}>✓</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#60a5fa' }}>TEST {test.id}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', paddingRight: isCompleted ? '2rem' : 0 }}>{test.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{test.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========== Passage 3 Test List ==========
  if (subPage === 'passage3' && !selectedTestId) {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <button
            onClick={() => { setSubPage('overview'); window.history.pushState({}, '', '/reading'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', border: 'none', background: 'var(--card-bg)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ← Back to Overview
          </button>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Passage 3 Practice Tests
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            14 questions per test • 20 minutes recommended • Advanced difficulty
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {readingPassage3Tests.map((test) => {
              const isCompleted = completedTests.includes(test.id);
              return (
                <div
                  key={test.id}
                  onClick={() => startTest(test.id)}
                  style={{
                    padding: '1.5rem', borderRadius: '12px', background: 'var(--card-bg)',
                    border: `1px solid ${isCompleted ? '#22c55e' : 'var(--border-color)'}`, 
                    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
                  }}
                >
                  {isCompleted && (
                    <div style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '1rem' }}>✓</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10b981' }}>TEST {test.id}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', paddingRight: isCompleted ? '2rem' : 0 }}>{test.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{test.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========== Active Test View (Full Screen - covers navbar) ==========
  if (selectedTest) {
    const { correct, total } = calculateScore();
    const bandScore = getBandScore(correct, total);
    const allQuestionNums = selectedTest.questions.flatMap(s => s.items.map(i => i.num));

    return (
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', 
        zIndex: 1000, overflow: 'hidden'
      }}>
        {/* Highlight Popup */}
        {highlightPopup.show && (
          <div 
            className="highlight-popup"
            style={{
              position: 'fixed',
              left: Math.min(highlightPopup.x, window.innerWidth - 160),
              top: Math.max(highlightPopup.y, 10),
              background: isDark ? '#2a2a3d' : 'white',
              borderRadius: '12px',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.12)',
              padding: '0.35rem',
              display: 'flex',
              flexDirection: 'column',
              minWidth: '150px',
              zIndex: 2000,
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <button
              onClick={highlightPopup.isHighlighted ? removeHighlight : applyHighlight}
              style={{
                padding: '0.55rem 0.75rem', borderRadius: '8px', border: 'none',
                background: 'transparent', color: isDark ? 'var(--text-primary)' : '#333', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '0.6rem',
                textAlign: 'left', width: '100%'
              }}
              onMouseEnter={e => e.target.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              Highlight
            </button>
            {highlightPopup.isHighlighted && (
              <button
                onClick={removeHighlight}
                style={{
                  padding: '0.55rem 0.75rem', borderRadius: '8px', border: 'none',
                  background: 'transparent', color: isDark ? 'var(--text-primary)' : '#333', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  textAlign: 'left', width: '100%'
                }}
                onMouseEnter={e => e.target.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
                Clear
              </button>
            )}
            {!highlightPopup.isHighlighted && (
              <button
                onClick={() => setHighlightPopup({ show: false, x: 0, y: 0, range: null, isHighlighted: false })}
                style={{
                  padding: '0.55rem 0.75rem', borderRadius: '8px', border: 'none',
                  background: 'transparent', color: isDark ? 'var(--text-primary)' : '#333', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  textAlign: 'left', width: '100%'
                }}
                onMouseEnter={e => e.target.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
                Clear
              </button>
            )}
          </div>
        )}

        {/* ===== FIXED HEADER ===== */}
        <header style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
          padding: '0.75rem 1.5rem', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)',
          flexShrink: 0, zIndex: 100
        }}>
          {/* Left: logo + test name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--purple-500)' }}>IELTS</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Test {selectedTest.id}</span>
          </div>

          {/* Center: Timer - always centered */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '36px' }}>
            {/* Hide/Show button */}
            <button onClick={() => setShowTimer(!showTimer)} title={showTimer ? 'Hide timer' : 'Show timer'}
              style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              {showTimer ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
            
            {/* Timer display - use visibility instead of conditional render to keep size stable */}
            <div 
              onClick={() => setTimerRunning(!timerRunning)}
              title={timerRunning ? 'Click to pause' : 'Click to resume'}
              style={{
                display: 'flex', alignItems: 'center', padding: '0.35rem 0.75rem',
                background: !showTimer ? 'transparent' : (timerMode === 'countdown' && timerSeconds <= 120) || (timerMode === 'stopwatch' && timerSeconds >= 1080) ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)', 
                borderRadius: '8px', border: showTimer ? '1px solid var(--border-color)' : '1px solid transparent',
                cursor: showTimer ? 'pointer' : 'default',
                animation: !timerRunning && showTimer ? 'timerBlink 1s ease-in-out infinite' : 'none',
                visibility: showTimer ? 'visible' : 'hidden'
              }}>
              <span style={{ 
                fontSize: '1.1rem', fontWeight: '600', 
                color: (timerMode === 'countdown' && timerSeconds <= 120) || (timerMode === 'stopwatch' && timerSeconds >= 1080) ? '#ef4444' : 'var(--text-primary)', 
                fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums'
              }}>
                {formatTime(timerSeconds)}
              </span>
            </div>
            
            {/* Mode toggle button */}
            <button onClick={() => { setTimerMode(m => m === 'countdown' ? 'stopwatch' : 'countdown'); setTimerSeconds(timerMode === 'countdown' ? 0 : 20*60); }} title={timerMode === 'countdown' ? 'Switch to stopwatch' : 'Switch to countdown'}
              style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              {timerMode === 'countdown' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="13" r="8"/>
                  <path d="M12 9v4l2 2"/>
                  <path d="M5 3L2 6"/>
                  <path d="M22 6l-3-3"/>
                  <path d="M9 1h6"/>
                  <path d="M12 1v3"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              )}
            </button>
          </div>

          {/* Right: theme toggle + exit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <button onClick={exitTest}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}>
              Exit
            </button>
          </div>
        </header>

        {/* ===== INSTRUCTION BAR ===== */}
        <div style={{ padding: '0.75rem 1.5rem', background: isDark ? '#1e293b' : '#f1f5f9', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Read the text and answer questions 1-13</p>
        </div>

        {/* ===== MAIN CONTENT AREA ===== */}
        <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* LEFT PANEL - Passage */}
          <div 
            ref={passageRef}
            style={{ 
              width: `${panelWidth}%`, 
              overflowY: 'auto', 
              padding: '1.5rem',
              borderRight: '1px solid var(--border-color)',
              background: 'var(--bg-primary)'
            }}
          >
            <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', color: 'var(--purple-500)', marginBottom: '0.5rem' }}>
              {selectedTest.title}
            </h2>
            {selectedTest.subtitle && selectedTest.subtitleInPassage && <p style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}>
              {selectedTest.subtitle}
            </p>}
            <div 
              className="passage-content"
              style={{ color: 'var(--text-primary)', lineHeight: '1.9', fontSize: '1.05rem' }}
              dangerouslySetInnerHTML={{ __html: selectedTest.passage.replace(/<\/p>/g, '</p><br/>') }}
            />
          </div>

          {/* DRAGGABLE DIVIDER */}
          <div
            onMouseDown={() => setIsDragging(true)}
            style={{
              width: '6px', cursor: 'col-resize', background: isDragging ? 'var(--purple-500)' : 'var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'background 0.2s'
            }}
          >
            <div style={{ width: '2px', height: '40px', background: isDragging ? 'white' : 'var(--text-muted)', borderRadius: '2px' }} />
          </div>

          {/* RIGHT PANEL - Questions */}
          <div 
            ref={questionsRef}
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '1.5rem',
              background: 'var(--bg-primary)'
            }}
          >
            {selectedTest.questions.map((section, sIdx) => (
              <div key={sIdx} style={{ marginBottom: '2rem' }}>
                {/* Question rubric */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{section.rubric}</h4>
                  <p 
                    style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ 
                      __html: section.instruction
                        .replace(/(NO MORE THAN [A-Z\s]+WORDS?)/gi, '<strong style="color: var(--text-primary)">$1</strong>')
                        .replace(/(ONE WORD ONLY)/gi, '<strong style="color: var(--text-primary)">$1</strong>')
                        .replace(/(ONE WORD AND\/OR A NUMBER)/gi, '<strong style="color: var(--text-primary)">$1</strong>')
                    }}
                  />
                </div>

                {/* Section title (for completion type) */}
                {section.title && (
                  <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '2px solid var(--purple-500)', paddingBottom: '0.5rem' }}>
                    {section.title}
                  </h3>
                )}

                {/* T/F/NG & Y/N/NG Questions */}
                {(section.type === 'tfng' || section.type === 'ynng') && section.items.map((item) => {
                  const userAns = userAnswers[item.num] || '';
                  const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                  const isWrong = showResults && userAns && !isCorrect;

                  return (
                    <div 
                      key={item.num} 
                      id={`question-${item.num}`}
                      style={{ marginBottom: '1.5rem' }}
                    >
                      <p style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
                        <strong style={{ color: 'var(--purple-400)' }}>{item.num}.</strong> {item.text}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(section.type === 'tfng' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']).map(opt => (
                          <label key={opt} style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem',
                            borderRadius: '8px', cursor: showResults ? 'default' : 'pointer',
                            border: `1px solid ${showResults && item.answer.toUpperCase() === opt ? '#22c55e' : 'var(--border-color)'}`,
                            background: showResults 
                              ? (item.answer.toUpperCase() === opt ? 'rgba(34, 197, 94, 0.1)' : (userAns === opt && !isCorrect ? 'rgba(239, 68, 68, 0.1)' : 'transparent'))
                              : (userAns === opt ? (isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)') : 'transparent')
                          }}>
                            <input type="radio" name={`q${item.num}`} value={opt} checked={userAns === opt}
                              onChange={() => handleAnswerChange(item.num, opt)} disabled={showResults}
                              style={{ width: '18px', height: '18px', accentColor: 'var(--purple-500)' }} />
                            <span style={{ color: 'var(--text-primary)' }}>{opt}</span>
                            {showResults && item.answer.toUpperCase() === opt && <span style={{ marginLeft: 'auto', color: '#22c55e' }}>✓</span>}
                            {showResults && userAns === opt && !isCorrect && <span style={{ marginLeft: 'auto', color: '#ef4444' }}>✗</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* MCQ Questions */}
                {section.type === 'mcq' && section.items.map((item) => {
                  const userAns = userAnswers[item.num] || '';
                  const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();

                  return (
                    <div 
                      key={item.num} 
                      id={`question-${item.num}`}
                      style={{ marginBottom: '1.5rem' }}
                    >
                      <p style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>
                        <strong style={{ color: 'var(--purple-400)' }}>{item.num}.</strong> {item.question || item.text}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {item.options.map(opt => {
                          // Extract letter and text - handle formats like "A) text" or "A. text" or just "A text"
                          const letterMatch = opt.match(/^([A-D])[\).\s]+(.+)$/);
                          const optLetter = letterMatch ? letterMatch[1] : opt.charAt(0);
                          const optText = letterMatch ? letterMatch[2] : opt.substring(2).trim();
                          const isCorrectOpt = showResults && item.answer.toUpperCase() === optLetter;
                          const isUserChoice = userAns.toUpperCase() === optLetter;
                          
                          return (
                            <label key={opt} style={{ 
                              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem',
                              borderRadius: '8px', cursor: showResults ? 'default' : 'pointer',
                              border: `1px solid ${isCorrectOpt ? '#22c55e' : 'var(--border-color)'}`,
                              background: showResults 
                                ? (isCorrectOpt ? 'rgba(34, 197, 94, 0.1)' : (isUserChoice && !isCorrect ? 'rgba(239, 68, 68, 0.1)' : 'transparent'))
                                : (isUserChoice ? (isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)') : 'transparent')
                            }}>
                              <input type="radio" name={`q${item.num}`} value={optLetter} checked={isUserChoice}
                                onChange={() => handleAnswerChange(item.num, optLetter)} disabled={showResults}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--purple-500)' }} />
                              <span style={{ color: 'var(--text-primary)' }}>{optText}</span>
                              {isCorrectOpt && <span style={{ marginLeft: 'auto', color: '#22c55e' }}>✓</span>}
                              {showResults && isUserChoice && !isCorrect && <span style={{ marginLeft: 'auto', color: '#ef4444' }}>✗</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Matching Questions */}
                {section.type === 'matching' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {section.items.map((item) => {
                      const userAns = userAnswers[item.num] || '';
                      const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                      const isWrong = showResults && userAns && !isCorrect;

                      return (
                        <div 
                          key={item.num} 
                          id={`question-${item.num}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
                        >
                          <strong style={{ color: 'var(--purple-400)', minWidth: '30px' }}>{item.num}.</strong>
                          <span style={{ color: 'var(--text-primary)', flex: 1, minWidth: '200px', fontSize: '1.05rem' }}>{item.text}</span>
                          <input 
                            type="text" 
                            value={userAns} 
                            onChange={(e) => handleAnswerChange(item.num, e.target.value.toUpperCase())}
                            disabled={showResults} 
                            maxLength={1} 
                            placeholder="_"
                            style={{ 
                              width: '45px', padding: '0.5rem', textAlign: 'center', borderRadius: '6px', 
                              border: `2px solid ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`,
                              background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)',
                              color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: '600', fontSize: '1rem'
                            }} 
                          />
                          {showResults && isWrong && (
                            <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>✗ {item.answer}</span>
                          )}
                          {showResults && isCorrect && (
                            <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Completion Questions */}
                {section.type === 'completion' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {section.noteLines ? (
                      /* Note completion: structured with headings, context bullets, and question bullets */
                      section.noteLines.map((line, lIdx) => {
                        if (line.lineType === 'heading') {
                          return <p key={lIdx} style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: lIdx > 0 ? '1rem' : '0', marginBottom: '0.25rem' }}>{line.text}</p>;
                        }
                        if (line.lineType === 'context') {
                          return <p key={lIdx} style={{ fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: '1.6', paddingLeft: '1rem' }}>• {line.text}</p>;
                        }
                        if (line.lineType === 'question') {
                          const item = section.items.find(it => it.num === line.num);
                          if (!item) return null;
                          const userAns = userAnswers[line.num] || '';
                          const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                          const isWrong = showResults && userAns && !isCorrect;
                          return (
                            <div key={lIdx} id={`question-${line.num}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: '1.8', paddingLeft: '1rem' }}>
                              <span>• {line.beforeText}</span>
                              <input type="text" value={userAns} onChange={(e) => handleAnswerChange(line.num, e.target.value)} disabled={showResults} placeholder={String(line.num)} className="completion-input"
                                style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', minWidth: '140px', maxWidth: '200px', border: `2px dashed ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`, background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '1.05rem', fontFamily: 'inherit', textAlign: 'center' }} />
                              {line.afterText && <span>{line.afterText}</span>}
                              {showResults && (
                                <span style={{ color: isCorrect ? '#22c55e' : '#ef4444', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                  {isCorrect ? '✓' : `✗ Correct: ${item.answer}`}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })
                    ) : (
                      /* Sentence/Summary completion: each sentence with inline input */
                      section.items.map((item) => {
                        const userAns = userAnswers[item.num] || '';
                        const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                        const isWrong = showResults && userAns && !isCorrect;
                        return (
                          <div key={item.num} id={`question-${item.num}`} style={{ fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: '2.2', marginBottom: '0.75rem' }}>
                            {item.beforeText && <span>{item.beforeText} </span>}
                            <input type="text" value={userAns} onChange={(e) => handleAnswerChange(item.num, e.target.value)} disabled={showResults} placeholder={String(item.num)} className="completion-input"
                              style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', minWidth: '140px', maxWidth: '200px', border: `2px dashed ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`, background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '1.05rem', fontFamily: 'inherit', textAlign: 'center', verticalAlign: 'middle' }} />
                            {item.afterText && <span> {item.afterText}</span>}
                            {showResults && (
                              <span style={{ color: isCorrect ? '#22c55e' : '#ef4444', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                {isCorrect ? '✓' : `✗ ${item.answer}`}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Short Answer Questions */}
                {section.type === 'short-answer' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {section.items.map((item) => {
                      const userAns = userAnswers[item.num] || '';
                      const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                      const isWrong = showResults && userAns && !isCorrect;
                      return (
                        <div key={item.num} id={`question-${item.num}`} style={{ marginBottom: '0.5rem' }}>
                          <p style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
                            <strong style={{ color: 'var(--purple-400)' }}>{item.num}.</strong> {item.text}
                          </p>
                          <input type="text" value={userAns} onChange={(e) => handleAnswerChange(item.num, e.target.value)} disabled={showResults} placeholder="Type your answer..."
                            style={{ width: '100%', maxWidth: '400px', padding: '0.6rem 1rem', borderRadius: '6px', border: `2px solid ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`, background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '1.05rem', fontFamily: 'inherit' }} />
                          {showResults && (
                            <span style={{ color: isCorrect ? '#22c55e' : '#ef4444', fontSize: '0.85rem', marginLeft: '0.75rem' }}>
                              {isCorrect ? '✓' : `✗ Correct: ${item.answer}`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Matching Headings Questions */}
                {section.type === 'matching-headings' && (
                  <div>
                    {/* List of headings */}
                    <div style={{ 
                      background: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      marginBottom: '1.5rem',
                      border: '1px solid var(--purple-500-30)'
                    }}>
                      <p style={{ fontWeight: '600', color: 'var(--purple-400)', marginBottom: '0.75rem' }}>List of Headings</p>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {section.headings.map((heading, idx) => (
                          <p key={idx} style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{heading}</p>
                        ))}
                      </div>
                    </div>
                    {/* Questions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {section.items.map((item) => {
                        const userAns = userAnswers[item.num] || '';
                        const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                        const isWrong = showResults && userAns && !isCorrect;

                        return (
                          <div 
                            key={item.num} 
                            id={`question-${item.num}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
                          >
                            <strong style={{ color: 'var(--purple-400)', minWidth: '30px' }}>{item.num}.</strong>
                            <span style={{ color: 'var(--text-primary)', minWidth: '100px', fontSize: '1.05rem' }}>Paragraph {item.paragraph}</span>
                            <input 
                              type="text" 
                              value={userAns} 
                              onChange={(e) => handleAnswerChange(item.num, e.target.value.toLowerCase())}
                              disabled={showResults} 
                              maxLength={4} 
                              placeholder="___"
                              style={{ 
                                width: '60px', padding: '0.5rem', textAlign: 'center', borderRadius: '6px', 
                                border: `2px solid ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`,
                                background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)',
                                color: 'var(--text-primary)', fontWeight: '600', fontSize: '1rem'
                              }} 
                            />
                            {showResults && isWrong && (
                              <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>✗ {item.answer}</span>
                            )}
                            {showResults && isCorrect && (
                              <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Matching Information Questions */}
                {section.type === 'matching-info' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                      NB: You may use any letter more than once.
                    </p>
                    {section.items.map((item) => {
                      const userAns = userAnswers[item.num] || '';
                      const isCorrect = showResults && userAns.toUpperCase().trim() === item.answer.toUpperCase().trim();
                      const isWrong = showResults && userAns && !isCorrect;
                      // Determine dropdown options based on paragraphRange or default to A-I
                      const paragraphRange = section.paragraphRange || 'A-I';
                      const rangeMatch = paragraphRange.match(/([A-Z])-([A-Z])/);
                      const startChar = rangeMatch ? rangeMatch[1].charCodeAt(0) : 65;
                      const endChar = rangeMatch ? rangeMatch[2].charCodeAt(0) : 73;
                      const options = [];
                      for (let i = startChar; i <= endChar; i++) {
                        options.push(String.fromCharCode(i));
                      }

                      return (
                        <div 
                          key={item.num} 
                          id={`question-${item.num}`}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}
                        >
                          <strong style={{ color: 'var(--purple-400)', minWidth: '30px', paddingTop: '0.25rem' }}>{item.num}.</strong>
                          <span style={{ color: 'var(--text-primary)', flex: 1, minWidth: '200px', lineHeight: '1.6', fontSize: '1.05rem' }}>{item.text}</span>
                          <select 
                            value={userAns} 
                            onChange={(e) => handleAnswerChange(item.num, e.target.value.toUpperCase())}
                            disabled={showResults} 
                            style={{ 
                              width: '60px', padding: '0.5rem', textAlign: 'center', borderRadius: '6px', 
                              border: `2px solid ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`,
                              background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)',
                              color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: '600', fontSize: '1rem',
                              cursor: showResults ? 'not-allowed' : 'pointer'
                            }} 
                          >
                            <option value="">--</option>
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          {showResults && isWrong && (
                            <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>✗ {item.answer}</span>
                          )}
                          {showResults && isCorrect && (
                            <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== FIXED FOOTER ===== */}
        <footer style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.5rem', background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)',
          flexShrink: 0, zIndex: 100
        }}>
          {/* Question numbers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', color: 'white', marginRight: '0.5rem', padding: '0.4rem 0.75rem', background: 'var(--purple-600)', borderRadius: '6px', fontSize: '0.85rem' }}>Part 1</span>
            {allQuestionNums.map(num => {
              const answered = !!userAnswers[num];
              const userAns = userAnswers[num] || '';
              const item = selectedTest.questions.flatMap(s => s.items).find(i => i.num === num);
              const isCorrect = showResults && item && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
              const isWrong = showResults && answered && !isCorrect;
              
              return (
                <button
                  key={num}
                  onClick={() => scrollToQuestion(num)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '6px', border: 'none',
                    background: showResults 
                      ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--bg-secondary)')
                      : (answered ? 'var(--purple-600)' : 'var(--bg-secondary)'),
                    color: (showResults ? (isCorrect || isWrong) : answered) ? 'white' : 'var(--text-secondary)',
                    fontWeight: '500', fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  {num}
                </button>
              );
            })}
            <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {Object.keys(userAnswers).length} of {allQuestionNums.length}
            </span>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={showResults}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
              background: showResults ? '#22c55e' : 'var(--purple-600)',
              color: 'white', fontWeight: '600', cursor: showResults ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {showResults ? `✓ Score: ${correct}/${total} (Band ${bandScore})` : '✓ Submit'}
          </button>
        </footer>

        {/* Results Modal */}
        {showResultsModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
          }} onClick={() => setShowResultsModal(false)}>
            <div style={{
              background: 'var(--card-bg)', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center'
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.5rem' }}>Test Results</h2>
              <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'var(--purple-400)' }}>{correct}/{total}</div>
              <div style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Band Score: {bandScore}</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Time taken: {formatTime(timerMode === 'countdown' ? (20*60 - timerSeconds) : timerSeconds)}
              </p>
              <button
                onClick={() => setShowResultsModal(false)}
                style={{ padding: '0.75rem 2rem', borderRadius: '10px', border: 'none', background: 'var(--purple-600)', color: 'white', fontWeight: '600', cursor: 'pointer' }}
              >
                Review Answers
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

const PlaceholderPage = ({ title, description, icon }) => (
  <div style={{ paddingTop: '100px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>{icon}</div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </div>
  </div>
);

// ==================== AUTH PAGE ====================
const AuthPage = ({ type, setCurrentPage }) => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // For multi-step signup
  
  // Marketing/profile questions
  const [targetScore, setTargetScore] = useState('7.0');
  const [prepDuration, setPrepDuration] = useState('');
  const [hearAboutUs, setHearAboutUs] = useState('');
  const [goals, setGoals] = useState([]);

  const goalOptions = [
    'Practice speaking skills',
    'Improve listening comprehension',
    'Learn grammar structures',
    'Get band 9 sample answers',
    'Take mock tests',
    'Track my progress'
  ];

  const handleGoalToggle = (goal) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    
    if (type === 'signup') {
      if (step === 1) {
        if (!email || !password || !name) { 
          setError('Please fill in all fields'); 
          setLoading(false); 
          return; 
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        setStep(2);
        setLoading(false);
        return;
      }
      
      // Step 2 - complete signup with profile data
      try {
        const { error } = await signUp(email, password, name, {
          target_score: targetScore,
          prep_duration: prepDuration,
          referral_source: hearAboutUs,
          goals: goals
        });
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm.');
      } catch (err) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    } else {
      // Login
      if (!email || !password) { 
        setError('Please fill in all fields'); 
        setLoading(false); 
        return; 
      }
      try {
        const { error } = await signIn(email, password);
        if (error) throw error;
        setCurrentPage('dashboard');
      } catch (err) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: type === 'signup' && step === 2 ? '520px' : '420px', padding: '2rem' }}>
        <div style={{ padding: '2.5rem', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', textAlign: 'center', color: 'var(--text-primary)' }}>
            {type === 'login' ? 'Welcome back' : step === 1 ? 'Create account' : 'Almost there!'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
            {type === 'login' ? 'Sign in to continue' : step === 1 ? 'Start your IELTS journey' : 'Tell us about your goals'}
          </p>
          
          {error && <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</div>}
          {success && <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{success}</div>}
          
          <form onSubmit={handleSubmit}>
            {type === 'signup' && step === 1 && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
              </>
            )}
            
            {type === 'signup' && step === 2 && (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>What's your target IELTS band score?</label>
                  <select value={targetScore} onChange={(e) => setTargetScore(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="5.5">Band 5.5</option>
                    <option value="6.0">Band 6.0</option>
                    <option value="6.5">Band 6.5</option>
                    <option value="7.0">Band 7.0</option>
                    <option value="7.5">Band 7.5</option>
                    <option value="8.0">Band 8.0</option>
                    <option value="8.5+">Band 8.5+</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>How long have you been preparing for IELTS?</label>
                  <select value={prepDuration} onChange={(e) => setPrepDuration(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select an option</option>
                    <option value="just-started">Just getting started</option>
                    <option value="less-1-month">Less than 1 month</option>
                    <option value="1-3-months">1-3 months</option>
                    <option value="3-6-months">3-6 months</option>
                    <option value="6-months-plus">More than 6 months</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>How did you hear about IELTS Wiz?</label>
                  <select value={hearAboutUs} onChange={(e) => setHearAboutUs(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select an option</option>
                    <option value="google">Google search</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="friend">Friend or family</option>
                    <option value="teacher">Teacher recommendation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>What do you want to achieve? (Select all that apply)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {goalOptions.map(goal => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => handleGoalToggle(goal)}
                        style={{
                          padding: '0.5rem 0.875rem',
                          borderRadius: '20px',
                          border: goals.includes(goal) ? '1px solid var(--purple-500)' : '1px solid var(--border-color)',
                          background: goals.includes(goal) ? 'var(--purple-600-20)' : 'transparent',
                          color: goals.includes(goal) ? 'var(--purple-400)' : 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {type === 'login' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
              </>
            )}
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {type === 'signup' && step === 2 && (
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '0.875rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }}
                >
                  Back
                </button>
              )}
              <button 
                type="submit" 
                disabled={loading} 
                style={{ flex: 1, padding: '0.875rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))', color: 'white', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Please wait...' : (type === 'login' ? 'Sign In' : step === 1 ? 'Continue' : 'Create Account')}
              </button>
            </div>
          </form>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {type === 'login' ? (
              <>Don't have an account? <span onClick={() => setCurrentPage('signup')} style={{ color: 'var(--purple-400)', cursor: 'pointer' }}>Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => setCurrentPage('login')} style={{ color: 'var(--purple-400)', cursor: 'pointer' }}>Sign in</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== DASHBOARD ====================
const Dashboard = ({ setCurrentPage }) => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editTarget, setEditTarget] = useState(profile?.target_score || '7.0');
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [completedListening, setCompletedListening] = useState(() => {
    const saved = localStorage.getItem('completedListeningTests');
    return saved ? JSON.parse(saved) : [];
  });
  const [completedReading, setCompletedReading] = useState(() => {
    const saved = localStorage.getItem('completedReadingTests');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (profile?.target_score) {
      setEditTarget(profile.target_score.toString());
    }
  }, [profile]);

  const handleSaveTarget = async () => {
    setSaving(true);
    const { error } = await updateProfile({ target_score: parseFloat(editTarget) });
    setSaving(false);
    if (!error) {
      setIsEditing(false);
    }
  };

  const handleAvatarSelect = async (avatarIndex) => {
    await updateProfile({ avatar_index: avatarIndex });
    setShowAvatarPicker(false);
  };

  const selectedAvatar = profile?.avatar_index != null ? profile.avatar_index : -1;

  const ProgressBar = ({ completed, total, color }) => (
    <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min((completed / total) * 100, 100)}%`, height: '100%', borderRadius: '4px', background: color, transition: 'width 0.5s ease' }} />
    </div>
  );

  const sections = [
    { label: 'Listening', page: 'listening', color: 'var(--purple-500)', completed: completedListening.length, total: 80, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>) },
    { label: 'Reading - Passage 1', page: 'reading', color: '#8b5cf6', completed: completedReading.filter(id => id >= 1 && id <= 40).length, total: 40, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>) },
    { label: 'Reading - Passage 2', page: 'reading', color: '#3b82f6', completed: completedReading.filter(id => id >= 41 && id <= 50).length, total: 10, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>) },
    { label: 'Reading - Passage 3', page: 'reading', color: '#10b981', completed: completedReading.filter(id => id >= 51 && id <= 59).length, total: 9, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>) },
  ];

  if (!user) return null;
  
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div 
            onClick={() => setShowAvatarPicker(true)}
            style={{ 
              width: '72px', height: '72px', borderRadius: '50%', 
              background: selectedAvatar >= 0 ? 'transparent' : 'linear-gradient(135deg, var(--purple-500), var(--purple-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
              border: '3px solid var(--purple-500)',
              transition: 'all 0.2s ease'
            }}
          >
            {selectedAvatar >= 0 && typeof AVATAR_OPTIONS !== 'undefined' && AVATAR_OPTIONS[selectedAvatar] ? (
              <img src={AVATAR_OPTIONS[selectedAvatar]} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white' }}>
                {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </span>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: 'var(--purple-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--card-bg)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {profile?.name || 'Student'}
            </h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{profile?.email || user.email}</p>
          </div>
        </div>

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAvatarPicker(false)}>
            <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '2rem', maxWidth: '420px', width: '90%', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--text-primary)', textAlign: 'center' }}>Choose Your Avatar</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {typeof AVATAR_OPTIONS !== 'undefined' && AVATAR_OPTIONS.map((src, i) => (
                  <div 
                    key={i}
                    onClick={() => handleAvatarSelect(i)}
                    style={{ 
                      width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden',
                      cursor: 'pointer', border: selectedAvatar === i ? '3px solid var(--purple-500)' : '3px solid transparent',
                      transition: 'all 0.2s ease', background: 'var(--bg-secondary)'
                    }}
                  >
                    <img src={src} alt={`Avatar ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAvatarPicker(false)} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Target Score Card */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              Target Band Score
            </h2>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--purple-500)', background: 'transparent', color: 'var(--purple-400)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => { setIsEditing(false); setEditTarget(profile?.target_score?.toString() || '7.0'); }}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveTarget}
                  disabled={saving}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: 'var(--purple-600)', color: 'white', fontSize: '0.8rem', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
          
          {!isEditing ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--purple-400)' }}>{profile?.target_score || '7.0'}</span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>/ 9.0</span>
            </div>
          ) : (
            <select 
              value={editTarget} 
              onChange={(e) => setEditTarget(e.target.value)}
              style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: '600', cursor: 'pointer', width: '120px' }}
            >
              {['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'].map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          )}
        </div>

        {/* Progress Section */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Your Progress
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {sections.map((s) => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '500' }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                    {s.label}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>
                    {s.completed} / {s.total}
                  </span>
                </div>
                <ProgressBar completed={s.completed} total={s.total} color={s.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Continue Learning */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Continue Learning
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Listening', page: 'listening', desc: '80 Practice Tests', color: 'var(--purple-500)' },
              { label: 'Reading', page: 'reading', desc: '59 Practice Tests', color: '#3b82f6' },
              { label: 'Speaking', page: 'speaking', desc: 'Part 1, 2, 3', color: '#10b981' },
              { label: 'Grammar', page: 'grammar', desc: '6 Lessons', color: '#f59e0b' },
            ].map((action) => (
              <button 
                key={action.page} 
                onClick={() => setCurrentPage(action.page)} 
                style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: action.color, marginBottom: '0.75rem' }} />
                <span style={{ fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>{action.label}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{action.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(135deg, var(--purple-600-20), var(--purple-700-20))', border: '1px solid var(--purple-500-30)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'text-bottom', marginRight: '0.4rem' }}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>
            Today's Tip
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            In Speaking Part 2, use the one minute preparation time wisely. Jot down 2-3 key points for each bullet on the cue card, then speak for the full 2 minutes by expanding on each point with examples and details.
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== HOME PAGE ====================
const HomePage = ({ setCurrentPage }) => (<><HeroSection setCurrentPage={setCurrentPage} /><SkillsSection setCurrentPage={setCurrentPage} /></>);

// ==================== URL ROUTING HELPERS ====================
const parseUrlToState = () => {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  
  if (parts.length === 0 || parts[0] === 'home') {
    return { page: 'home', subPage: 'overview' };
  }
  
  const page = parts[0];
  const subPage = parts[1] || 'overview';
  
  return { page, subPage };
};

const stateToUrl = (page, subPage) => {
  if (page === 'home') return '/';
  if (subPage && subPage !== 'overview') return `/${page}/${subPage}`;
  return `/${page}`;
};

// ==================== MAIN APP ====================
const App = () => {
  const [currentPage, setCurrentPage] = useState(() => parseUrlToState().page);
  const [speakingSubPage, setSpeakingSubPage] = useState(() => {
    const { page, subPage } = parseUrlToState();
    return page === 'speaking' ? subPage : 'overview';
  });
  const [listeningSubPage, setListeningSubPage] = useState(() => {
    const { page, subPage } = parseUrlToState();
    return page === 'listening' ? subPage : 'overview';
  });
  const [readingSubPage, setReadingSubPage] = useState(() => {
    const { page, subPage } = parseUrlToState();
    return page === 'reading' ? subPage : 'overview';
  });
  const { loading } = useAuth();

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const { page, subPage } = parseUrlToState();
      setCurrentPage(page);
      if (page === 'speaking') setSpeakingSubPage(subPage);
      if (page === 'listening') setListeningSubPage(subPage);
      if (page === 'reading') setReadingSubPage(subPage);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when page changes
  const navigateTo = (page, subPage = 'overview') => {
    const url = stateToUrl(page, subPage);
    window.history.pushState({}, '', url);
    setCurrentPage(page);
    if (page === 'speaking') setSpeakingSubPage(subPage);
    if (page === 'listening') setListeningSubPage(subPage);
    if (page === 'reading') setReadingSubPage(subPage);
  };

  // Update URL when subpage changes
  const updateSubPage = (page, subPage) => {
    const url = stateToUrl(page, subPage);
    window.history.pushState({}, '', url);
    if (page === 'speaking') setSpeakingSubPage(subPage);
    if (page === 'listening') setListeningSubPage(subPage);
    if (page === 'reading') setReadingSubPage(subPage);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage setCurrentPage={navigateTo} />;
      case 'speaking': return <SpeakingPage subPage={speakingSubPage} setSubPage={(sp) => updateSubPage('speaking', sp)} />;
      case 'listening': return <ListeningPage subPage={listeningSubPage} setSubPage={(sp) => updateSubPage('listening', sp)} setCurrentPage={setCurrentPage} />;
      case 'reading': return <ReadingPage subPage={readingSubPage} setSubPage={(sp) => updateSubPage('reading', sp)} setCurrentPage={setCurrentPage} />;
      case 'grammar': return <GrammarPage />;
      case 'writing': return <PlaceholderPage title="Writing Section" description="Task 1 & Task 2 with model essays. Coming soon!" icon="✍️" />;
      case 'login': return <AuthPage type="login" setCurrentPage={navigateTo} />;
      case 'signup': return <AuthPage type="signup" setCurrentPage={navigateTo} />;
      case 'dashboard': return <Dashboard setCurrentPage={navigateTo} />;
      default: return <HomePage setCurrentPage={navigateTo} />;
    }
  };

  // Reset sub-pages when changing main page
  const handlePageChange = (page) => {
    navigateTo(page, 'overview');
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><div className="spinner" /></div>;

  return <div><Navigation currentPage={currentPage} setCurrentPage={handlePageChange} />{renderPage()}</div>;
};

const AppWithProviders = () => (<ThemeProvider><AuthProvider><App /></AuthProvider></ThemeProvider>);

export default AppWithProviders;
