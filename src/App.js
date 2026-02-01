import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';

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
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
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

// ==================== VOCABULARY DEFINITIONS ====================
const vocabDefinitions = {
  // Part 2 & 3 vocabulary - High-band expressions
  "adaptability": "ability to adjust to new conditions",
  "digital literacy": "skills needed to use digital technology",
  "paramount": "more important than anything else",
  "pivot": "change direction or strategy",
  "replicate": "copy or reproduce exactly",
  "psychological barriers": "mental obstacles that limit progress",
  "fixed mindsets": "beliefs that abilities cannot change",
  "hands-on approaches": "practical, active learning methods",
  "disconnect": "a lack of connection between things",
  "prioritise": "treat something as most important",
  "self-directed": "managed by oneself without external control",
  "motivated learners": "people eager to learn",
  "foundational knowledge": "basic understanding of a subject",
  "deepen expertise": "increase one's knowledge level",
  "extroverts": "outgoing, socially energetic people",
  "introverts": "people who prefer solitary activities",
  "tolerance": "ability to accept something difficult",
  "decentralisation": "distributing power away from central point",
  "vertical expansion": "building upwards, adding height",
  "pedestrian": "relating to people walking",
  "elevates stress hormones": "increases chemicals causing anxiety",
  "coping mechanisms": "strategies for dealing with difficulties",
  "per capita": "for each person; per individual",
  "carbon footprint": "total greenhouse gas emissions",
  "intrinsic": "belonging naturally; essential",
  "extrinsic motivations": "external rewards driving behaviour",
  "social capital": "networks and relationships that benefit people",
  "contentious": "causing disagreement or argument",
  "safety nets": "systems protecting against hardship",
  "empowerment": "giving someone confidence or power",
  "self-sufficiency": "ability to provide for oneself",
  "moral development": "growth of ethical understanding",
  "slacktivism": "supporting causes through minimal effort online",
  "sustained engagement": "continued focused attention",
  "fragmented": "broken into small parts",
  "consumption": "the act of using or receiving",
  "comprehension": "understanding of something",
  "retention": "ability to remember information",
  "tactile experience": "relating to the sense of touch",
  "modelling": "demonstrating behaviour for others to copy",
  "autonomy": "freedom to make own choices",
  "evolve": "develop gradually over time",
  "experiential": "based on experience rather than theory",
  "curation": "careful selection and organization",
  "correlated": "having a connection or relationship",
  "persist": "continue despite difficulties",
  "subjective": "based on personal feelings or opinions",
  "perpetually": "constantly; continuously",
  "dissatisfied": "not content or happy",
  "defer gratification": "delay reward for better outcome",
  "fixating": "focusing obsessively on something",
  "drawn to": "attracted to or interested in something",
  "qualified instructor": "a person with official credentials to teach",
  "invaluable": "extremely useful; indispensable",
  "extravagant": "excessive or expensive beyond necessity",
  "weighted keys": "piano keys that simulate the feel of real piano",
  "simultaneously": "at the same time",
  "demanding": "requiring much skill or effort",
  "consistent": "regular and unchanging in practice",
  "personal fulfilment": "a sense of satisfaction from achieving goals",
  "decompress": "relax and relieve stress",
  "in hindsight": "looking back at a past event with new understanding",
  "covered market": "a market with a roof over the stalls",
  "weave between": "move in and out among things",
  "haggling": "negotiating a price with a seller",
  "enthusiastically": "with great excitement and interest",
  "negotiating": "discussing to reach an agreement",
  "claustrophobic": "uncomfortably enclosed or crowded",
  "exhilarating": "making one feel very happy and excited",
  "immersed": "deeply involved or absorbed in something",
  "infectious": "spreading easily to others (of emotions)",
  "authenticity": "the quality of being genuine or real",
  "sanitised": "made overly clean or artificially safe",
  "harsh cold spell": "a period of extremely cold weather",
  "distressed": "suffering from anxiety or pain",
  "jammed": "stuck and unable to move",
  "gentle persuasion": "soft encouragement without force",
  "navigating the bureaucracy": "dealing with complex official procedures",
  "commit to": "dedicate oneself to something",
  "accompanied": "went somewhere with someone",
  "sorted properly": "organized or dealt with correctly",
  "token of appreciation": "a small gift showing gratitude",
  "conscious of": "aware of something",
  "profound impact": "a deep and significant effect",
  "introspective": "examining one's own thoughts and feelings",
  "traces": "follows the history or development of",
  "through the lens of": "from the perspective of",
  "cognitive revolution": "a major change in human thinking ability",
  "take for granted": "fail to appreciate something properly",
  "shared fictions": "collective beliefs or stories",
  "large-scale cooperation": "working together in big groups",
  "sparked": "started or triggered",
  "zoom out": "look at something from a broader perspective",
  "fundamentally": "at the most basic level",
  "sedentary": "involving much sitting and little exercise",
  "concerning indicators": "worrying signs or symptoms",
  "cardiovascular": "relating to the heart and blood vessels",
  "concrete": "specific and definite; not vague",
  "methodical": "done in a systematic, organized way",
  "mileage": "distance traveled, especially running",
  "accountability": "responsibility for one's actions",
  "overhauling": "thoroughly examining and improving",
  "off guard": "unprepared or surprised",
  "self-efficacy": "belief in one's ability to succeed",
  "spilled over": "extended beyond the original area",
  "enrolled": "officially registered for a course",
  "infectious passion": "enthusiasm that spreads to others",
  "fieldwork": "practical research done outside a lab",
  "evident concern": "clearly visible worry",
  "translate into": "result in or lead to",
  "coordinated": "organized and working together",
  "compelled": "felt strongly urged to do something",
  "transformative": "causing a major change",
  "tangible": "real and measurable; concrete",
  "invasive plants": "non-native plants that spread harmfully",
  "ripple effects": "consequences that spread outward",
  "first-choice": "preferred above all other options",
  "outstanding reputation": "an excellent public image",
  "world-class": "among the best in the world",
  "aligned with": "matching or agreeing with",
  "mundane": "ordinary and lacking excitement",
  "pop up": "appear suddenly or unexpectedly",
  "trembling": "shaking, usually from emotion",
  "sank in": "became fully understood or realized",
  "elation": "great happiness and excitement",
  "gruelling": "extremely tiring and demanding",
  "amplified": "increased or made stronger",
  "trajectory": "the path or direction of development",
  "long-haul flight": "a flight covering a great distance",
  "polite small talk": "light, casual conversation",
  "captivating": "holding attention completely",
  "relocated": "moved to a new place",
  "remarkable clarity": "unusual clearness of thought",
  "bitterness": "feelings of anger and resentment",
  "resilience": "ability to recover from difficulties",
  "dramatically": "in a sudden and striking way",
  "vivid pictures": "clear and detailed mental images",
  "immediate": "happening without delay",
  "optimistic outlook": "a positive view of the future",
  "openness": "willingness to accept new ideas",
  "wholeheartedly": "with complete enthusiasm",
  "renowned": "famous and respected",
  "breathtaking": "astonishing or awe-inspiring",
  "stunning": "extremely beautiful or impressive",
  "magnificent": "impressively beautiful or grand",
  "necropolis": "a large ancient cemetery",
  "mausoleum": "a building housing a tomb",
  "vibrant": "full of energy and life",
  "authentic": "genuine and original",
  "craftsmanship": "skill in making things by hand",
  "undiscovered": "not yet found or known about",
  "unforgettable": "impossible to forget",
  "rivals": "matches or equals in quality",
  "financing": "providing money for something",
  "conscious decision": "a deliberate, intentional choice",
  "postpone": "delay to a later time",
  "diligently": "with careful and persistent effort",
  "outright": "completely and immediately",
  "burdened": "weighed down by problems",
  "non-negotiable": "not open to discussion or change",
  "tested my patience": "made it hard to stay calm",
  "decline": "politely refuse",
  "dealership": "a business selling vehicles",
  "delayed gratification": "waiting for a reward instead of getting it immediately",
  "collared shirt": "a shirt with a folded collar",
  "emblem embroidered": "a symbol sewn onto fabric",
  "breast pocket": "a pocket on the chest of a shirt",
  "prohibited": "officially forbidden",
  "ritual": "a routine or ceremony",
  "spot checks": "random inspections",
  "detentions": "punishments requiring staying after school",
  "violations": "actions breaking rules",
  "adolescence": "the period of teenage years",
  "resenting": "feeling bitter about",
  "rigid": "strict and inflexible",
  "merits": "advantages or good qualities",
  "suppress": "hold back or restrain",
  "portable": "easily carried or moved",
  "sophisticated": "highly developed and complex",
  "revolutionary": "involving dramatic change",
  "integration": "combining into a single system",
  "condensed": "made shorter or more compact",
  "far-reaching": "having widespread effects",
  "instantaneous": "happening immediately",
  "unprecedented": "never happened before",
  "democratised": "made available to everyone",
  "legitimate concerns": "valid worries",
  "erosion": "gradual destruction or weakening",
  "significant": "important and meaningful",
  "assigned seats": "places given to specific people",
  "struck by": "impressed or surprised by",
  "gradually": "slowly over time",
  "inseparable": "unable to be separated",
  "elaborate": "detailed and complex",
  "makeshift": "temporary and improvised",
  "fascination": "intense interest",
  "crucial": "extremely important",
  "resolve conflicts": "settle disagreements",
  "unwavering": "steady and unchanging",
  "formative": "having a lasting influence on development",
  "stable": "not likely to change",
  "progression opportunities": "chances for advancement",
  "stifled": "held back or restricted",
  "unfulfilled": "not satisfied or completed",
  "portfolio": "a collection of work samples",
  "leap": "a big, risky move",
  "minimal obligations": "few responsibilities",
  "sporadic": "occurring irregularly",
  "relentlessly": "without stopping or giving up",
  "exceeded expectations": "performed better than expected",
  "calculated": "carefully planned",
  "leaps of faith": "acts of trust despite uncertainty",
  "undertook": "took on or committed to",
  "paediatric ward": "hospital section for children",
  "undertaking": "a task or project",
  "coordinate": "organize and bring together",
  "permits": "official permissions",
  "secure sponsorships": "obtain financial support",
  "pull it off": "succeed in doing something difficult",
  "atmosphere": "the mood or feeling of a place",
  "meaningful cause": "a purpose that matters",
  "delegate": "assign tasks to others",
  "inspire": "motivate or encourage",
  "gratifying": "giving satisfaction",
  "pharmaceutical": "relating to medicines",
  "vague understanding": "unclear or incomplete knowledge",
  "jumped at the opportunity": "eagerly accepted a chance",
  "strict security protocols": "rigid safety procedures",
  "donning": "putting on clothing",
  "high-tech equipment": "advanced technological devices",
  "sterile rooms": "completely clean, germ-free spaces",
  "controlled conditions": "carefully managed environments",
  "drug delivery systems": "methods of administering medicine",
  "commanding respect": "inspiring admiration",
  "newfound appreciation": "recently developed gratitude",
  "subsequently": "afterwards; as a result",
  "renowned primatologist": "famous expert on primates",
  "groundbreaking research": "innovative, pioneering study",
  "advocating": "publicly supporting a cause",
  "youth empowerment": "enabling young people to act",
  "community-centred": "focused on local communities",
  "holistic approach": "considering all aspects together",
  "legendary": "famous and admired",
  "persistence": "continuing despite difficulties",
  "scepticism": "doubt or questioning attitude",
  "absorb": "take in and understand fully",
  "rigorous": "extremely thorough and careful",
  "mutually exclusive": "cannot exist together",
  "embodies": "represents or expresses",
  "resonates": "has meaning or importance",
  "escape room": "a game where players solve puzzles to exit",
  "team-building": "activities to improve group cooperation",
  "interconnected puzzles": "puzzles that link together",
  "fictional": "imaginary; not real",
  "hierarchy": "a ranking system",
  "dissolved": "disappeared or broke down",
  "spotting hidden patterns": "noticing concealed connections",
  "step back": "pause to get perspective",
  "to spare": "remaining; left over",
  "revealed": "showed or uncovered",
  "team dynamics": "how a group works together",
  "inside jokes": "humor understood only by a group",
  "formal": "official and serious",
  "substantial": "large and significant",
  "monetary gift": "a gift of money",
  "cheque": "a written order to pay money",
  "transition into": "change or move into",
  "deliberated": "thought carefully about",
  "instinct": "natural, automatic response",
  "portion": "a part of something",
  "reasoned": "thought logically about",
  "set aside": "save for later use",
  "emergency fund": "money saved for unexpected costs",
  "impractical": "not sensible or realistic",
  "tremendously": "extremely; greatly",
  "empowered": "given confidence or power",
  "hesitant": "uncertain or reluctant",
  "conservative": "traditional; resistant to change",
  "off-putting": "unpleasant or discouraging",
  "culturally closed-minded": "unwilling to accept other cultures",
  "intimate establishment": "a small, cozy place",
  "remarkable precision": "exceptional accuracy",
  "melted on my tongue": "was extremely tender and delicious",
  "delicate": "subtle and refined",
  "complemented": "went well together with",
  "associated with": "connected to or linked with",
  "preconceived notions": "opinions formed beforehand",
  "consumed": "completely occupied or absorbed",
  "scale models": "small replicas built to proportion",
  "assembly": "putting parts together",
  "converted": "changed into something different",
  "dedicated workbench": "a special table for a hobby",
  "absorbed": "deeply focused and engaged",
  "meticulous": "extremely careful and precise",
  "genuine accomplishment": "a real achievement",
  "one-on-one time": "personal time with someone",
  "fondest memories": "most cherished recollections",
  "laid the foundation": "created the basis for",
  "nostalgic": "feeling sentimental about the past",
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

// ==================== SPEAKING PART 2 DATA (27 CUE CARDS) ====================
const speakingPart2Data = [
  {
    id: 1,
    topic: "Describe a Skill You Would Like to Learn",
    cueCard: {
      title: "Describe a skill you would like to learn",
      points: ["what the skill is", "how you would learn it", "how difficult you think it would be to learn", "and explain why you would like to learn this skill"],
      relatedPart3: "Learning New Skills"
    },
    answer: `I'd really love to learn how to play the piano – it's something I've been drawn to ever since I was a child listening to classical pieces on my parents' old record player.

If I were to pursue this seriously, I'd probably start by finding a qualified instructor rather than relying solely on online tutorials. While apps and YouTube videos can be helpful supplements, I believe having someone correct your posture and technique in real-time is invaluable, especially for beginners. I'd also need to invest in a decent digital piano for home practice – nothing extravagant, but something with weighted keys to simulate the feel of an acoustic instrument.

Honestly, I think it would be quite challenging at first. Learning to read sheet music while simultaneously coordinating both hands independently sounds incredibly demanding. I've heard that the first year or two can be particularly frustrating before things start to click. However, I'm told that with consistent daily practice, even just twenty or thirty minutes, progress becomes noticeable.

The main reason I want to learn is purely for personal fulfilment. There's something deeply satisfying about creating music with your own hands. I imagine coming home after a stressful day and losing myself in playing – it seems like the perfect way to decompress. Plus, it's a skill that stays with you for life and can bring joy to others as well.`,
    keyVocab: ["drawn to", "qualified instructor", "invaluable", "extravagant", "weighted keys", "simultaneously", "demanding", "consistent", "personal fulfilment", "decompress"]
  },
  {
    id: 2,
    topic: "Describe a Place You Visited That Was Crowded",
    cueCard: {
      title: "Describe a place you visited that was very crowded",
      points: ["where the place was", "when you visited it", "what you did there", "and explain how you felt about the crowds"],
      relatedPart3: "Crowded Places"
    },
    answer: `I'd like to talk about my visit to the Grand Bazaar in Istanbul, which I experienced during a trip to Turkey about two years ago.

I went there on a Saturday afternoon in late spring, which, in hindsight, was probably the worst possible timing. The bazaar is one of the oldest and largest covered markets in the world, with over four thousand shops spread across sixty-one streets. I wanted to buy some traditional Turkish ceramics and perhaps a handwoven rug as souvenirs.

Navigating through the narrow passageways was quite an adventure. I had to constantly weave between tour groups, local shoppers, and vendors calling out to passersby. The noise was overwhelming – a constant hum of haggling, conversations in dozens of languages, and merchants enthusiastically promoting their wares. I managed to find some beautiful hand-painted plates and spent about an hour negotiating prices, which is all part of the experience there.

To be honest, my feelings about the crowds were mixed. On one hand, I found it exhausting and slightly claustrophobic at times, especially when I got separated from my travel companion briefly. However, there was also something exhilarating about being immersed in such vibrant chaos. The energy was infectious, and the crowds somehow added to the authenticity of the experience. It wouldn't have felt the same if it had been empty and sanitised for tourists.`,
    keyVocab: ["in hindsight", "covered market", "weave between", "haggling", "enthusiastically", "negotiating", "claustrophobic", "exhilarating", "immersed", "infectious", "authenticity", "sanitised"]
  },
  {
    id: 3,
    topic: "Describe a Time You Helped Someone",
    cueCard: {
      title: "Describe a time when you helped someone",
      points: ["who you helped", "what the situation was", "how you helped them", "and explain how you felt about helping this person"],
      relatedPart3: "Helping Others"
    },
    answer: `I'd like to describe an occasion last winter when I helped my elderly neighbour, Mrs Chen, who lives alone in the apartment next to mine.

There was a particularly harsh cold spell, and one evening around eight o'clock, she knocked on my door looking quite distressed. Her heating had completely broken down, and she couldn't reach the emergency repair service – the lines were jammed with calls due to the weather. She was already shivering and clearly worried about getting through the night in a freezing apartment.

I immediately invited her to stay in my spare room for the night, which she initially refused out of politeness. After some gentle persuasion, she accepted. I made her some hot soup and found extra blankets. The next morning, I spent about two hours on the phone navigating the bureaucracy of her building management company until I finally got someone to commit to a same-day repair. I also accompanied her back to her apartment to wait for the technician, just to make sure everything was sorted properly.

The whole experience left me with a warm sense of satisfaction. Mrs Chen was so genuinely grateful – she kept thanking me repeatedly and later brought over a homemade meal as a token of appreciation. It reminded me how important community connections are, especially for people living alone. It also made me more conscious of checking in on vulnerable neighbours during extreme weather conditions.`,
    keyVocab: ["harsh cold spell", "distressed", "jammed", "gentle persuasion", "navigating the bureaucracy", "commit to", "accompanied", "sorted properly", "token of appreciation", "conscious of"]
  },
  {
    id: 4,
    topic: "Describe a Book That Had a Major Influence on You",
    cueCard: {
      title: "Describe a book that had a major influence on you",
      points: ["what the book was", "when you read it", "what it was about", "and explain how it influenced you"],
      relatedPart3: "Reading and Books"
    },
    answer: `The book that has probably had the most profound impact on my thinking is "Sapiens: A Brief History of Humankind" by Yuval Noah Harari. I read it about four years ago during a particularly introspective period in my life.

The book traces the entire history of our species, from the emergence of Homo sapiens in Africa to the present day. What makes it unique is Harari's approach – he examines humanity through the lens of cognitive, agricultural, and scientific revolutions, exploring how these transformations shaped our societies, beliefs, and behaviours. He raises fascinating questions about concepts we take for granted, like money, religion, and nation-states, arguing that these are essentially shared fictions that enable large-scale cooperation.

The influence this book had on me was quite significant. Firstly, it completely shifted my perspective on human achievement and progress. I began questioning assumptions I'd never thought to challenge before. Secondly, it sparked a genuine interest in anthropology and history that I've continued to pursue through further reading. Perhaps most importantly, it taught me to think about the bigger picture – to zoom out from daily concerns and consider how we, as a species, have arrived at this particular moment.

I've since recommended it to countless friends and family members. It's the kind of book that doesn't just inform you; it fundamentally changes how you see the world around you.`,
    keyVocab: ["profound impact", "introspective", "traces", "through the lens of", "cognitive revolution", "take for granted", "shared fictions", "large-scale cooperation", "sparked", "zoom out", "fundamentally"]
  },
  {
    id: 5,
    topic: "Describe a Goal You Set and Achieved",
    cueCard: {
      title: "Describe a goal you set for yourself and achieved",
      points: ["what the goal was", "when you set it", "how you achieved it", "and explain how you felt when you achieved it"],
      relatedPart3: "Goals and Ambitions"
    },
    answer: `I'd like to talk about running my first half-marathon, which was a goal I set approximately eighteen months ago after years of being relatively sedentary.

I decided to commit to this challenge after a routine health check revealed some concerning indicators. My doctor suggested I incorporate more cardiovascular exercise into my lifestyle, and rather than just casually jogging, I wanted something concrete to work towards. The half-marathon in my city was scheduled for six months later, which gave me a reasonable timeframe to prepare.

The training process was methodical. I followed a structured programme that gradually increased my weekly mileage while incorporating rest days to prevent injury. The first few weeks were brutal, honestly – I could barely run two kilometres without stopping. However, I joined a local running club which provided both accountability and encouragement. Having training partners who were going through the same struggles made an enormous difference. I also had to make significant lifestyle adjustments, including improving my sleep schedule and completely overhauling my diet.

Crossing that finish line was one of the most emotional moments of my adult life. I remember tears streaming down my face, which caught me completely off guard. It wasn't just about the physical achievement; it represented proving to myself that I could commit to something difficult and see it through. That sense of self-efficacy has since spilled over into other areas of my life, making me more confident about tackling challenging projects.`,
    keyVocab: ["sedentary", "concerning indicators", "cardiovascular", "concrete", "methodical", "mileage", "accountability", "overhauling", "off guard", "self-efficacy", "spilled over"]
  },
  {
    id: 6,
    topic: "Describe a Person Who Inspired You to Do Something Interesting",
    cueCard: {
      title: "Describe a person who inspired you to do something interesting",
      points: ["who the person was", "how you know them", "what they inspired you to do", "and explain why this was inspiring"],
      relatedPart3: "Inspiration and Role Models"
    },
    answer: `I'd like to talk about my university professor, Dr. Rahman, who taught environmental science during my undergraduate years and inspired me to get involved in local conservation efforts.

I first encountered Dr. Rahman in my second year when I enrolled in his course on ecosystems and biodiversity. What immediately struck me wasn't just his expertise, but his infectious passion for the subject. Unlike lecturers who simply delivered content, he would share personal stories from his fieldwork, bringing abstract concepts to life. He had spent years researching coral reef degradation in Southeast Asia and spoke about it with such evident concern and dedication.

What inspired me specifically was his philosophy that academic knowledge should translate into real-world action. He didn't just teach about environmental problems; he actively coordinated volunteer programmes for habitat restoration in wetlands near our campus. After several of his lectures, I felt compelled to join one of these weekend initiatives.

The experience was transformative. Getting my hands dirty planting native species and removing invasive plants gave me a tangible connection to environmentalism that textbooks couldn't provide. I continued volunteering throughout my remaining years at university and still participate in similar programmes today.

Dr. Rahman showed me that inspiration often comes from witnessing someone who genuinely lives their values rather than merely preaching them. His example demonstrated that one person's commitment can create ripple effects, motivating others to take meaningful action.`,
    keyVocab: ["enrolled", "infectious passion", "fieldwork", "evident concern", "translate into", "coordinated", "compelled", "transformative", "tangible", "invasive plants", "ripple effects"]
  },
  {
    id: 7,
    topic: "Describe a Time When You Received Good News",
    cueCard: {
      title: "Describe a time when you received good news",
      points: ["what the news was", "when and where you received it", "who gave you the news", "and explain how you felt about it"],
      relatedPart3: "News and Information"
    },
    answer: `I'd like to describe the moment I found out I'd been accepted into my first-choice graduate programme, which happened about three years ago.

I had applied to several universities for a master's degree in data science, but this particular institution was my dream school – it had an outstanding reputation, world-class faculty, and a curriculum that perfectly aligned with my career aspirations. The application process had been incredibly competitive, involving written exams, a portfolio submission, and two rounds of interviews.

I received the news via email on a Tuesday afternoon in late March. I was actually at work, sitting at my desk during a particularly mundane day, when I noticed the notification pop up on my phone. My heart immediately started racing because I recognised the sender. I remember my hands trembling slightly as I opened the message. When I saw the words "We are pleased to inform you" my mind went completely blank for a few seconds before the meaning sank in.

The feeling was absolutely overwhelming – a mixture of disbelief, relief, and pure elation. I had to excuse myself and step outside because I couldn't contain my emotions. I immediately called my parents, who had supported me throughout the gruelling application process, and hearing their joy amplified my own. My mother actually cried on the phone.

That news represented validation of years of hard work and opened doors that have shaped my entire career trajectory since then. It remains one of the happiest moments of my life.`,
    keyVocab: ["first-choice", "outstanding reputation", "world-class", "aligned with", "mundane", "pop up", "trembling", "sank in", "elation", "gruelling", "amplified", "trajectory"]
  },
  {
    id: 8,
    topic: "Describe an Interesting Old Person You Met",
    cueCard: {
      title: "Describe an interesting old person you met",
      points: ["who this person was", "where you met them", "what you talked about", "and explain why you found them interesting"],
      relatedPart3: "Elderly People in Society"
    },
    answer: `I'd like to tell you about Mr. Kowalski, an eighty-seven-year-old Polish gentleman I met during a long-haul flight from London to Singapore about two years ago.

We were seated next to each other in economy class, and what began as polite small talk evolved into one of the most captivating conversations I've ever had. Mr. Kowalski was travelling alone to visit his granddaughter who had relocated to Asia for work.

What made our conversation remarkable was learning about his extraordinary life story. He had survived the Second World War as a child in Warsaw, witnessed the entire communist era in Poland, and eventually emigrated to England in the 1970s. He spoke about these experiences with remarkable clarity and surprisingly little bitterness, instead focusing on the resilience and kindness he'd encountered along the way. He also shared his perspectives on how dramatically the world had changed during his lifetime – from a childhood without television to now using video calls to communicate with family across continents.

I found him fascinating for several reasons. Firstly, his storytelling ability was exceptional; he painted vivid pictures with words that made history feel immediate and personal. Secondly, despite everything he'd been through, he maintained an optimistic outlook and genuine curiosity about the world. He asked me thoughtful questions about my generation's concerns and genuinely listened to my answers. That openness to learning at his age was truly inspiring.

By the time we landed, I felt I'd gained a friend. We actually exchanged contact details and still send occasional emails to each other.`,
    keyVocab: ["long-haul flight", "polite small talk", "captivating", "relocated", "remarkable clarity", "bitterness", "resilience", "dramatically", "vivid pictures", "immediate", "optimistic outlook", "openness"]
  },
  {
    id: 9,
    topic: "Describe a Place in Your Country You Would Recommend to Visitors",
    cueCard: {
      title: "Describe a place in your country that you would recommend to visitors",
      points: ["where it is", "what people can see and do there", "how you know about this place", "and explain why you would recommend it"],
      relatedPart3: "Tourism"
    },
    answer: `I would wholeheartedly recommend visitors to my country explore the ancient city of Samarkand, located in eastern Uzbekistan along the historic Silk Road.

Samarkand is renowned for its breathtaking Islamic architecture, particularly the stunning blue-tiled monuments that date back to the Timurid Empire in the fourteenth and fifteenth centuries. The Registan Square, with its three magnificent madrasas, is considered one of the most impressive public squares in the world. Visitors can also explore the Shah-i-Zinda necropolis, the Bibi-Khanym Mosque, and the Gur-e-Amir mausoleum where Tamerlane himself is buried.

Beyond the architecture, there's the vibrant Siab Bazaar where you can sample local bread, dried fruits, and traditional crafts. The city offers excellent opportunities to experience authentic Central Asian cuisine and witness traditional craftsmanship like silk weaving and ceramic production that has been passed down through generations.

I first visited Samarkand during a family trip when I was a teenager, and I've returned twice since then, most recently last year. Each visit reveals something new, and I'm always struck by how the monuments seem to glow differently depending on the time of day and season.

I recommend it because it offers something truly unique – a window into a civilisation that once connected East and West, yet remains relatively undiscovered by mass tourism. The combination of historical significance, architectural beauty, and genuine hospitality from locals makes it an unforgettable destination that rivals any famous site in Europe or Asia.`,
    keyVocab: ["wholeheartedly", "renowned", "breathtaking", "stunning", "magnificent", "necropolis", "mausoleum", "vibrant", "authentic", "craftsmanship", "undiscovered", "unforgettable", "rivals"]
  },
  {
    id: 10,
    topic: "Describe a Time You Made a Decision to Wait for Something",
    cueCard: {
      title: "Describe a time when you made a decision to wait for something",
      points: ["what you waited for", "why you decided to wait", "how long you waited", "and explain how you felt about waiting"],
      relatedPart3: "Patience and Waiting"
    },
    answer: `I'd like to describe my decision to wait nearly two years before purchasing my first car, rather than rushing into a purchase when I first started working.

When I landed my first proper job after graduation, many of my colleagues were immediately financing new vehicles. There was considerable social pressure to do the same – having a car seemed like a symbol of adult success. However, I made a conscious decision to postpone this purchase and rely on public transport instead.

My reasoning was primarily financial. I calculated that by waiting and saving diligently, I could avoid taking on debt and instead pay for a vehicle outright. This meant I wouldn't be burdened by monthly payments or interest charges, which over several years would have added significantly to the total cost. I set up an automatic transfer to a dedicated savings account each month and treated it as non-negotiable.

Those two years tested my patience considerably. Commuting by bus and train added roughly an hour to my daily journey compared to driving. There were frustrating moments, particularly during winter or when I had to decline social invitations because of transportation limitations. I sometimes questioned whether the sacrifice was worth it.

However, when I finally walked into that dealership with enough cash for a reliable second-hand car, the feeling of financial freedom was extraordinary. I had no debt hanging over me, and the car felt genuinely earned rather than borrowed. The experience taught me valuable lessons about delayed gratification that I've applied to other major purchases since then.`,
    keyVocab: ["financing", "conscious decision", "postpone", "diligently", "outright", "burdened", "non-negotiable", "tested my patience", "decline", "dealership", "delayed gratification"]
  },
  {
    id: 11,
    topic: "Describe a Uniform You Wear",
    cueCard: {
      title: "Describe a uniform you wear (at school or work)",
      points: ["what it looks like", "when you wear it", "how you feel about wearing it", "and explain whether uniforms are common in your country"],
      relatedPart3: "Uniforms"
    },
    answer: `I'd like to describe the uniform I wore during my secondary school years, which left quite a lasting impression on me.

The uniform consisted of a white collared shirt, a navy blue blazer with the school emblem embroidered on the breast pocket, grey trousers, and a striped tie in the school colours of blue and silver. We were also required to wear black leather shoes – trainers were strictly prohibited. During winter, we could add a navy jumper, and in the warmer months, we were permitted to remove the blazer during lessons.

I wore this uniform five days a week for six years, from the ages of eleven to seventeen. Every morning involved the same ritual of ensuring the tie was properly knotted and the shirt was tucked in, as teachers would conduct spot checks and issue detentions for violations.

My feelings about the uniform evolved over time. Initially, as a young student, I actually felt proud wearing it – it made me feel part of something larger and somewhat grown-up. However, as I progressed through adolescence, I began resenting the lack of self-expression it represented. The strict enforcement felt unnecessarily rigid, especially regarding minor details like sock colours.

Uniforms are extremely common in my country, particularly in state schools and virtually all private institutions. There's an ongoing debate about their merits – supporters argue they promote equality and reduce peer pressure around clothing, while critics contend they suppress individuality and place financial burdens on families who must purchase specific items.`,
    keyVocab: ["collared shirt", "emblem embroidered", "breast pocket", "prohibited", "ritual", "spot checks", "detentions", "violations", "adolescence", "resenting", "rigid", "merits", "suppress"]
  },
  {
    id: 12,
    topic: "Describe an Invention That Has Changed People's Lives",
    cueCard: {
      title: "Describe an invention that has changed people's lives",
      points: ["what it is", "how it works", "what benefits it has brought", "and explain how it has changed people's lives"],
      relatedPart3: "Inventions and Technology"
    },
    answer: `I'd like to discuss the smartphone, which I believe represents one of the most transformative inventions of the modern era.

At its core, a smartphone is a portable computer that combines telecommunications with computing power. It operates through a combination of hardware components – including processors, memory, cameras, and sensors – and sophisticated software that enables countless applications. What makes it revolutionary is the integration of functions that previously required multiple separate devices: telephone, camera, music player, GPS navigator, and computer, all condensed into a pocket-sized gadget.

The benefits are far-reaching. Communication has become instantaneous and virtually free across global distances. Access to information is unprecedented – answers to almost any question are seconds away. Navigation has been simplified dramatically, eliminating the need for physical maps. Financial transactions can be completed from anywhere. Photography has been democratised, with everyone now carrying a capable camera. For businesses, smartphones have enabled new economic models and remote working capabilities.

The impact on daily life has been profound. Consider how people no longer memorise phone numbers, rarely get lost, can translate languages in real-time, and have entertainment constantly available. Social relationships have been reshaped – we maintain connections with far more people than previous generations could manage.

However, this change isn't entirely positive. There are legitimate concerns about addiction, reduced attention spans, privacy erosion, and the replacement of face-to-face interaction. The smartphone hasn't just changed what we can do; it has fundamentally altered how we think, relate, and experience the world around us.`,
    keyVocab: ["transformative", "portable", "sophisticated", "revolutionary", "integration", "condensed", "far-reaching", "instantaneous", "unprecedented", "democratised", "profound", "legitimate concerns", "erosion"]
  },
  {
    id: 13,
    topic: "Describe a Friend from Childhood",
    cueCard: {
      title: "Describe a friend from your childhood",
      points: ["who this person was", "how you met them", "what you used to do together", "and explain why this friendship was important to you"],
      relatedPart3: "Friendship"
    },
    answer: `I'd like to talk about my childhood best friend, Ahmed, who I consider one of the most significant people in my early life.

Ahmed and I met on our first day of primary school when we were both five years old. We were assigned seats next to each other, and I remember being struck by how shy he seemed initially – much like myself at that age. Our friendship developed gradually over shared lunches and playground games. By the end of that first term, we were inseparable.

Throughout our childhood, we spent countless hours together. After school, we would cycle around the neighbourhood, invent elaborate imaginary games, and build makeshift forts in each other's gardens. During summer holidays, we practically lived at each other's houses. We shared a passion for football and would spend entire weekends practising in the local park, dreaming of becoming professional players. We also developed a fascination with dinosaurs and would visit the natural history museum together regularly, memorising facts to impress each other.

This friendship was crucial to my development for several reasons. Ahmed was the first person outside my family who accepted me completely. With him, I learned important social skills – how to share, how to resolve conflicts, how to be a reliable companion. He also introduced me to interests I might never have discovered alone. When my parents went through a difficult period, his family's support and his unwavering friendship provided stability I desperately needed.

Although we've drifted somewhat as adults due to geographic distance, we still keep in touch and those formative years together shaped who I became.`,
    keyVocab: ["significant", "assigned seats", "struck by", "gradually", "inseparable", "elaborate", "makeshift", "fascination", "crucial", "resolve conflicts", "unwavering", "formative"]
  },
  {
    id: 14,
    topic: "Describe a Risk You Took That Had a Positive Result",
    cueCard: {
      title: "Describe a risk you took that had a positive result",
      points: ["what the risk was", "why you decided to take it", "what happened", "and explain how you felt about the outcome"],
      relatedPart3: "Risk-Taking"
    },
    answer: `I'd like to describe the risk I took when I decided to leave a stable corporate job to pursue a career in freelance graphic design about four years ago.

At the time, I was working as a marketing assistant at a well-established company with a decent salary, benefits, and clear progression opportunities. However, I felt creatively stifled and increasingly unfulfilled. I had been doing design work as a hobby for years and had built up a small portfolio through weekend projects. The risk was significant – I would be giving up guaranteed income, health insurance, and job security for an uncertain future as a self-employed creative.

I decided to take this leap primarily because I realised I was spending my days watching the clock, feeling that my potential was being wasted. A mentor encouraged me, pointing out that I was young, had minimal financial obligations, and could always return to corporate employment if things didn't work out. I saved enough to cover six months of expenses and submitted my resignation.

The first few months were terrifying, honestly. Work was sporadic, and I questioned my decision constantly. However, I networked relentlessly, built an online presence, and gradually began attracting clients. By the end of the first year, my income had matched my previous salary. Now, four years later, I run a small design studio with two employees.

The outcome has exceeded my expectations. Beyond the financial success, I wake up genuinely excited about my work. Taking that risk taught me that calculated leaps of faith, when prepared properly, can lead to extraordinary personal growth and satisfaction.`,
    keyVocab: ["stable", "progression opportunities", "stifled", "unfulfilled", "portfolio", "leap", "minimal obligations", "sporadic", "relentlessly", "exceeded expectations", "calculated", "leaps of faith"]
  },
  {
    id: 15,
    topic: "Describe Something You Did That Made You Feel Proud",
    cueCard: {
      title: "Describe something you did that made you feel proud",
      points: ["what you did", "when and where you did it", "how difficult it was", "and explain why it made you feel proud"],
      relatedPart3: "Pride and Achievement"
    },
    answer: `I'd like to describe organising a charity fundraiser for a local children's hospital, which I undertook about two years ago.

The event was a community fun run and family festival held in our city's main park on a Saturday in late spring. I had volunteered to lead the organising committee after learning that the hospital's paediatric ward desperately needed new equipment. What started as a simple idea during a conversation with friends evolved into a major undertaking involving months of planning.

The difficulty level was considerably higher than I had anticipated. I had to coordinate with local authorities for permits, recruit and manage over fifty volunteers, secure sponsorships from local businesses, arrange entertainment, organise catering, and handle marketing to attract participants. There were countless obstacles – a major sponsor pulled out two weeks before the event, weather forecasts looked threatening, and there were moments when I seriously doubted we could pull it off.

What made me ultimately proud was not just that the event succeeded, but how it succeeded. We attracted over eight hundred participants and raised approximately twenty thousand pounds for the hospital. The atmosphere on the day was genuinely joyful – families having fun while contributing to a meaningful cause.

However, the deepest source of pride came from the personal growth I experienced. I discovered leadership capabilities I didn't know I possessed. I learned to delegate, problem-solve under pressure, and inspire others to contribute their time and energy. Seeing the thank-you letter from the hospital, knowing that sick children would benefit from our efforts, remains one of the most gratifying moments of my life.`,
    keyVocab: ["undertook", "paediatric ward", "undertaking", "coordinate", "permits", "secure sponsorships", "pull it off", "atmosphere", "meaningful cause", "delegate", "inspire", "gratifying"]
  },
  {
    id: 16,
    topic: "Describe a Time You Visited a Friend or Family Member at Their Workplace",
    cueCard: {
      title: "Describe a time when you visited a friend or family member at their workplace",
      points: ["who you visited", "where they worked", "what you did there", "and explain how you felt about the visit"],
      relatedPart3: "Workplaces"
    },
    answer: `I'd like to describe visiting my older sister at her workplace, which is a research laboratory at a pharmaceutical company, approximately eighteen months ago.

My sister works as a biochemist, and I had always been curious about her job but only had a vague understanding of what she actually did day-to-day. When her company organised a "family day" where employees could bring relatives for a tour, I jumped at the opportunity.

The facility was far more impressive than I had imagined. After going through strict security protocols and donning a white lab coat and safety goggles, my sister showed me around different departments. I saw high-tech equipment I couldn't begin to understand, watched researchers working with microscopes and complex machinery, and visited the sterile rooms where experiments are conducted under controlled conditions. She explained her current project, which involved developing more effective drug delivery systems – essentially finding ways for medications to reach their targets in the body more efficiently.

The highlight was observing her team in action during a meeting, where they discussed their findings with genuine enthusiasm. It was fascinating to see my sister, whom I'd always known in a family context, commanding respect as an expert in her field.

I came away feeling immense pride in her achievements. The visit gave me a newfound appreciation for the complexity and importance of pharmaceutical research. It also sparked interesting conversations between us subsequently – I now understand her work well enough to ask meaningful questions, which has actually brought us closer. The experience reminded me that there are entire worlds behind the doors we pass every day.`,
    keyVocab: ["pharmaceutical", "vague understanding", "jumped at the opportunity", "strict security protocols", "donning", "high-tech equipment", "sterile rooms", "controlled conditions", "drug delivery systems", "commanding respect", "newfound appreciation", "subsequently"]
  },
  {
    id: 17,
    topic: "Describe a Person You Would Like to Study or Work With",
    cueCard: {
      title: "Describe a person you would like to study or work with",
      points: ["who this person is", "what they do", "what you would like to do with them", "and explain why you would like to study or work with them"],
      relatedPart3: "Working and Studying Together"
    },
    answer: `I'd like to talk about Dr. Jane Goodall, the renowned primatologist and conservationist, whom I would consider it an extraordinary privilege to work alongside.

Dr. Goodall is best known for her groundbreaking research on chimpanzees in Tanzania's Gombe Stream National Park, which began in 1960. Now in her nineties, she continues to travel extensively, advocating for environmental protection, animal welfare, and youth empowerment through her organisation, the Jane Goodall Institute.

If given the opportunity, I would love to participate in one of her conservation programmes, particularly the community-centred initiatives that work with local populations around protected habitats. I'm fascinated by the holistic approach her organisation takes – recognising that conservation cannot succeed without addressing the needs and concerns of people living alongside wildlife.

There are several reasons why working with Dr. Goodall appeals to me so strongly. Firstly, her patience and dedication are legendary – she spent decades observing chimpanzees before the scientific community fully recognised the significance of her findings. This persistence in the face of scepticism is something I deeply admire and would hope to absorb. Secondly, she represents a rare combination of rigorous scientific method and profound emotional connection to her subjects. She has shown that objectivity and empathy need not be mutually exclusive.

Most importantly, she embodies the belief that individual action matters. Her famous quote – "What you do makes a difference, and you have to decide what kind of difference you want to make" – resonates with me profoundly. Learning from someone who has so consistently lived by that philosophy would be genuinely life-changing.`,
    keyVocab: ["renowned primatologist", "groundbreaking research", "advocating", "youth empowerment", "community-centred", "holistic approach", "legendary", "persistence", "scepticism", "absorb", "rigorous", "mutually exclusive", "embodies", "resonates"]
  },
  {
    id: 18,
    topic: "Describe Something You Did with a Group of People",
    cueCard: {
      title: "Describe something you did with a group of people",
      points: ["what you did", "who was with you", "when and where you did it", "and explain how you felt about this experience"],
      relatedPart3: "Teamwork and Collaboration"
    },
    answer: `I'd like to describe participating in an escape room challenge with a group of colleagues, which we did as a team-building activity about eight months ago.

Our department of twelve people visited a local escape room venue one Friday evening after work. We were divided into two teams of six and given one hour to solve a series of interconnected puzzles that would eventually allow us to "escape" from a themed room – ours was designed as a detective's office where we had to solve a fictional murder mystery.

My team included people from different levels of our organisation – from junior assistants to senior managers – which initially felt slightly awkward given the usual workplace hierarchy. However, once the clock started ticking, those boundaries dissolved surprisingly quickly. We had to communicate constantly, share discoveries, and divide tasks according to each person's strengths. One colleague who is usually quite reserved turned out to be exceptional at spotting hidden patterns, while another who typically dominates meetings learned to step back and listen to others' ideas.

We managed to escape with just four minutes to spare, which triggered an incredibly satisfying celebration. However, what I valued most about the experience wasn't the victory itself but what it revealed about my colleagues. I discovered new sides to people I thought I knew well and developed respect for abilities I hadn't previously witnessed.

The experience had lasting effects on our team dynamics. We returned to the office on Monday with inside jokes, shared memories, and a better understanding of how each person thinks. It demonstrated that stepping outside our normal professional environment can strengthen working relationships in ways that formal team-building exercises rarely achieve.`,
    keyVocab: ["escape room", "team-building", "interconnected puzzles", "fictional", "hierarchy", "dissolved", "spotting hidden patterns", "step back", "to spare", "revealed", "team dynamics", "inside jokes", "formal"]
  },
  {
    id: 19,
    topic: "Describe a Time You Received Money as a Gift",
    cueCard: {
      title: "Describe a time when you received money as a gift",
      points: ["who gave you the money", "when you received it", "what you did with it", "and explain how you felt about receiving money as a gift"],
      relatedPart3: "Money and Gifts"
    },
    answer: `I'd like to describe receiving a substantial monetary gift from my grandparents when I graduated from university, which happened about five years ago.

My grandparents, who live in a different city and couldn't attend my graduation ceremony due to health reasons, sent me a card containing a cheque for what was, by my standards at that time, a significant sum – enough to cover several months of rent. Along with the cheque was a handwritten letter explaining that they wanted to help me transition into independent adult life and that I should use it however I thought best.

I deliberated for quite some time about how to spend it. My first instinct was to use it for something practical like paying off a portion of my student loan. However, I ultimately decided to put most of it towards a trip to Japan, something I had dreamed about for years but never thought I could afford. I reasoned that my grandparents would probably prefer I create lasting memories rather than simply reduce a debt balance by a small amount. I did set aside a portion for an emergency fund, so it wasn't entirely impractical.

My feelings about receiving money as a gift were somewhat mixed, honestly. On one hand, I felt tremendously grateful and touched by their generosity and thoughtfulness. On the other hand, there was a slight sense of awkwardness – money can feel impersonal compared to a carefully chosen physical gift. However, my grandmother later told me she preferred giving money because it empowered me to choose what I genuinely wanted, which changed my perspective on the matter entirely.`,
    keyVocab: ["substantial", "monetary gift", "cheque", "transition into", "deliberated", "instinct", "portion", "reasoned", "set aside", "emergency fund", "impractical", "tremendously", "empowered"]
  },
  {
    id: 20,
    topic: "Describe an Occasion When You Ate Something for the First Time",
    cueCard: {
      title: "Describe an occasion when you ate something for the first time",
      points: ["what you ate", "when and where you ate it", "what it tasted like", "and explain how you felt about eating it"],
      relatedPart3: "Food and Trying New Things"
    },
    answer: `I'd like to describe my first experience eating sushi, which happened during a business trip to Tokyo about six years ago.

Prior to this trip, I had been quite hesitant about raw fish. Growing up, my family's cuisine was fairly conservative, and the concept of eating uncooked seafood seemed strange, even slightly off-putting. However, my Japanese colleagues insisted on taking me to a traditional sushi restaurant in the Ginza district for an "authentic" experience, and I didn't want to appear culturally closed-minded.

The restaurant was a small, intimate establishment where we sat at a wooden counter facing the chef. I watched him prepare each piece with remarkable precision and care. When the first plate arrived – a selection including salmon, tuna, and sea bream – I felt genuinely nervous. My colleague demonstrated how to lightly dip the fish side into soy sauce and eat each piece in one bite.

The taste completely surprised me. The salmon practically melted on my tongue, with a delicate sweetness I hadn't anticipated. The rice had a subtle vinegar flavour that complemented the fish perfectly. What struck me most was the freshness – it tasted clean and pure, nothing like the fishy smell I had associated with seafood previously. By the end of the meal, I was requesting additional pieces.

This experience taught me an important lesson about being open to new experiences. I had almost let preconceived notions prevent me from discovering something I now genuinely love. Since then, sushi has become one of my favourite cuisines, and I seek out quality sushi restaurants wherever I travel. That meal fundamentally changed my relationship with food exploration.`,
    keyVocab: ["hesitant", "conservative", "off-putting", "culturally closed-minded", "intimate establishment", "remarkable precision", "melted on my tongue", "delicate", "complemented", "associated with", "preconceived notions", "fundamentally"]
  },
  {
    id: 21,
    topic: "Describe a Complaint You Made and Were Satisfied with the Result",
    cueCard: {
      title: "Describe a complaint you made and were satisfied with the result",
      points: ["what the complaint was about", "who you complained to", "what they did about it", "and explain why you were satisfied with the result"],
      relatedPart3: "Making Complaints"
    },
    answer: `I'd like to describe a complaint I made to an airline about two years ago after experiencing a particularly problematic flight and its aftermath.

My flight from London to Barcelona was delayed by nearly seven hours due to what the airline initially claimed was "operational reasons." We were kept waiting at the gate with minimal information, no food vouchers were offered for the first five hours, and when we finally boarded, the cabin crew seemed dismissive about the inconvenience caused. To make matters worse, my checked luggage went missing and wasn't delivered to my hotel until three days into my week-long trip.

I filed a formal complaint through the airline's website, detailing every issue: the lack of communication during the delay, the failure to provide adequate assistance, the missing luggage, and the overall poor customer service. I also cited EU passenger rights regulations, which entitled me to compensation for a delay of that length.

Initially, I received a generic, dismissive response that barely acknowledged my specific concerns. However, I persisted, escalating the complaint to their customer relations manager and including photographic evidence and timestamps. After about three weeks of correspondence, they offered a full refund of my ticket, substantial flight vouchers for future travel, and a formal apology acknowledging their failures.

I was satisfied primarily because they eventually took responsibility rather than deflecting blame. The financial compensation was appreciated, but what mattered more was feeling heard and validated. The experience also taught me that persistence in complaints often pays off – companies frequently hope initial brush-offs will make customers give up, but those who document their issues and follow proper channels tend to achieve fair resolutions.`,
    keyVocab: ["aftermath", "operational reasons", "minimal information", "dismissive", "filed a formal complaint", "cited", "generic", "persisted", "escalating", "correspondence", "substantial", "deflecting blame", "brush-offs", "resolutions"]
  },
  {
    id: 22,
    topic: "Describe an Activity You Enjoyed in Your Free Time When You Were Young",
    cueCard: {
      title: "Describe an activity you enjoyed in your free time when you were young",
      points: ["what the activity was", "who you did it with", "where you did it", "and explain why you enjoyed this activity"],
      relatedPart3: "Leisure Activities"
    },
    answer: `I'd like to talk about building model aircraft, which was my absolute passion throughout my childhood and early teenage years.

This hobby consumed most of my free time from about age nine until I was around fifteen. I would construct detailed scale models of both military and civilian aircraft, typically using plastic kits that required careful assembly and painting. My grandfather, a former engineer, introduced me to this activity and became my patient mentor throughout those years.

We usually worked in his garage, which he had converted into a small workshop with a dedicated workbench, proper lighting, and organised storage for all the tiny components and specialised tools required. On weekends, I would cycle to his house and spend entire afternoons there, completely absorbed in whatever project we were tackling.

I enjoyed this activity for multiple reasons. Firstly, the meticulous nature of the work suited my personality – I found genuine satisfaction in achieving accurate details and smooth paint finishes. Each completed model felt like a genuine accomplishment. Secondly, it provided valuable one-on-one time with my grandfather. Those hours together weren't just about building models; we would talk about history, his experiences, and life in general. Some of my fondest memories are of those quiet conversations while we worked side by side.

Additionally, the hobby taught me practical skills like patience, precision, and problem-solving when things went wrong. Looking back, I believe it also laid the foundation for my current attention to detail in professional contexts. Although I rarely build models anymore, I still have several of my best creations displayed at my parents' house, and they bring back wonderfully nostalgic feelings whenever I see them.`,
    keyVocab: ["consumed", "scale models", "assembly", "converted", "dedicated workbench", "absorbed", "meticulous", "genuine accomplishment", "one-on-one time", "fondest memories", "laid the foundation", "nostalgic"]
  },
  {
    id: 23,
    topic: "Describe an Important Event in Your Country's History",
    cueCard: {
      title: "Describe an important event in your country's history",
      points: ["what the event was", "when it happened", "why it was important", "and explain how it affected your country"],
      relatedPart3: "History and Society"
    },
    answer: `I'd like to describe the achievement of independence, which occurred in 1991 and marked a pivotal turning point in my country's history.

Before this, our nation had been part of a larger political union for several decades, during which our cultural identity, language, and traditions were often suppressed or discouraged. The independence movement gained momentum throughout the late 1980s, fuelled by both domestic demands for self-determination and broader geopolitical changes occurring worldwide.

The importance of this event cannot be overstated. For the first time in generations, our people could govern themselves, establish their own economic policies, and officially use their native language in government and education. It represented not just political freedom but a profound psychological shift – the emergence of a national identity that had been denied full expression for so long.

The effects on our country have been far-reaching and continue to shape our society today. Immediately following independence, there was an extremely challenging transition period involving economic restructuring, the establishment of new institutions, and the difficult process of building a functioning state essentially from scratch. Those early years involved significant hardship for many citizens.

However, the long-term impact has been largely positive. We have developed our own democratic institutions, joined international organisations, and experienced considerable economic growth. A new generation has grown up knowing only independence, taking for granted freedoms that their grandparents could only dream of. The anniversary of independence is now our most significant national holiday, celebrated with genuine emotion and patriotic pride that reminds us of what was sacrificed and achieved.`,
    keyVocab: ["pivotal turning point", "suppressed", "gained momentum", "self-determination", "geopolitical", "cannot be overstated", "psychological shift", "emergence", "far-reaching", "restructuring", "from scratch", "hardship", "taking for granted", "patriotic pride"]
  },
  {
    id: 24,
    topic: "Describe Something You Do to Maintain Good Health",
    cueCard: {
      title: "Describe something you do to try to stay healthy",
      points: ["what you do", "when you started doing it", "how much time you spend doing it", "and explain how it helps you stay healthy"],
      relatedPart3: "Health and Fitness"
    },
    answer: `I'd like to describe my practice of swimming regularly, which has become a cornerstone of my approach to maintaining good health over the past three years.

I started swimming consistently after experiencing persistent back problems from sitting at a desk for extended periods. My physiotherapist strongly recommended it as the ideal low-impact exercise for strengthening core muscles without putting additional stress on the spine. Initially, I was reluctant because I hadn't swum properly since childhood, but I decided to give it a serious try.

Currently, I swim approximately three times per week, usually early in the morning before work. Each session lasts around forty-five minutes to an hour, depending on how I'm feeling. I've found that the early morning routine works best for me – the pool is less crowded, and starting the day with exercise gives me sustained energy throughout the working hours.

The health benefits have been substantial and multi-faceted. Most noticeably, my chronic back pain has reduced dramatically – I rarely need to take painkillers anymore, which I previously relied on weekly. Beyond the physical improvements, swimming has had remarkable effects on my mental health. There's something meditative about the rhythmic nature of lap swimming; it clears my mind and reduces stress in ways I hadn't anticipated. I also sleep significantly better on days I've swum.

Additionally, my cardiovascular fitness has improved considerably. Activities that previously left me breathless, like climbing stairs quickly or running for a bus, now cause minimal exertion. I've come to view those morning swims not as a chore but as essential maintenance for both body and mind.`,
    keyVocab: ["cornerstone", "persistent", "extended periods", "low-impact", "reluctant", "sustained energy", "multi-faceted", "chronic", "dramatically", "meditative", "rhythmic", "lap swimming", "cardiovascular", "exertion", "essential maintenance"]
  },
  {
    id: 25,
    topic: "Describe a Movie You Would Like to Watch Again",
    cueCard: {
      title: "Describe a movie you would like to watch again",
      points: ["what the movie is", "what it's about", "when you first watched it", "and explain why you would like to watch it again"],
      relatedPart3: "Films and Entertainment"
    },
    answer: `I'd like to talk about "The Shawshank Redemption," a film I would happily watch for perhaps the twentieth time and still find deeply moving.

The movie, released in 1994, tells the story of Andy Dufresne, a banker who is wrongfully convicted of murdering his wife and her lover, and sentenced to life in Shawshank State Penitentiary. Over the course of nearly two decades, we follow his friendship with fellow prisoner Red, his quiet resilience in the face of brutality and injustice, and his unwavering hope that sustains him through unimaginable circumstances.

I first watched it as a teenager, probably around age sixteen, when my father introduced it to me as one of his favourite films. At that age, I appreciated it primarily as an engaging story with a satisfying conclusion. However, I've returned to it multiple times since, and my appreciation has deepened with each viewing.

I want to watch it again because it's one of those rare films that reveals new layers each time. The performances by Tim Robbins and Morgan Freeman are extraordinary – subtle and nuanced in ways that repay close attention. The themes of hope, friendship, patience, and the triumph of the human spirit feel increasingly relevant as I grow older and face my own challenges.

Furthermore, there's something about the film's craftsmanship – the cinematography, the pacing, the iconic narration – that provides genuine comfort. In a world that often feels chaotic and unfair, revisiting this story reminds me that perseverance and maintaining one's integrity can ultimately prevail. It's less escapism and more a kind of meditation on values worth holding onto.`,
    keyVocab: ["wrongfully convicted", "sentenced", "resilience", "brutality", "unwavering", "sustains", "engaging", "reveals new layers", "nuanced", "repay close attention", "triumph", "craftsmanship", "perseverance", "integrity", "prevail", "meditation"]
  },
  {
    id: 26,
    topic: "Describe a Successful Small Business",
    cueCard: {
      title: "Describe a successful small business that you know",
      points: ["what the business is", "what it sells or does", "how you know about it", "and explain why you think it is successful"],
      relatedPart3: "Business and Entrepreneurship"
    },
    answer: `I'd like to describe a small independent bookshop called "Chapter One" located in my neighbourhood, which I consider a wonderful example of successful small business operation.

The shop occupies a modest corner unit on the high street and specialises in carefully curated fiction, local history, and children's literature. Beyond simply selling books, they host regular events including author readings, book clubs, children's storytimes, and writing workshops. They also offer a popular "book subscription" service where they select titles based on your reading preferences and deliver them monthly.

I've been a regular customer since the shop opened about four years ago. The owner, Sarah, a former teacher, started the business after taking voluntary redundancy. I've watched it grow from a struggling new venture into a genuine community hub. I know about their success partly through my own observations and partly through conversations with Sarah about the business.

I believe the shop is successful for several reasons. Firstly, Sarah understood that simply selling books couldn't compete with online retailers, so she focused on creating an experience. The shop has comfortable seating, serves excellent coffee, and employs staff who genuinely know and love books. Their recommendations are thoughtful and personal – something algorithms cannot replicate.

Secondly, they've embedded themselves in the community. Local schools bring classes for visits, the book clubs create loyal regular customers, and their support for local authors has generated significant goodwill. They've also adapted cleverly, developing a strong online presence and offering local delivery during periods when in-person shopping was difficult.

The result is a business that not only survives but thrives, proving that small enterprises can succeed by offering something irreplaceable.`,
    keyVocab: ["modest", "curated", "host regular events", "subscription service", "voluntary redundancy", "struggling", "community hub", "experience", "algorithms", "replicate", "embedded", "goodwill", "adapted cleverly", "irreplaceable"]
  },
  {
    id: 27,
    topic: "Describe a New Law You Would Introduce",
    cueCard: {
      title: "Describe a new law you would like your country to have",
      points: ["what the law would be", "how the law would work", "who would benefit from it", "and explain why you think this law is needed"],
      relatedPart3: "Laws and Society"
    },
    answer: `I'd like to propose a law mandating comprehensive financial literacy education in all secondary schools as part of the core curriculum.

Under this law, students aged fourteen to sixteen would receive dedicated lessons covering practical financial skills: understanding credit and debt, budgeting and saving, the basics of taxation, how mortgages work, avoiding financial scams, and the fundamentals of investing. The course would include both theoretical knowledge and practical exercises, such as creating personal budgets and analysing real financial products.

The law would require the education ministry to develop a standardised curriculum with input from financial experts, educators, and consumer protection organisations. Schools would need to allocate at least two hours per week to this subject for a minimum of two academic years. Teachers would receive specialised training, and the subject would be assessed, giving it equal status to other core subjects.

The primary beneficiaries would be young people entering adulthood better equipped to make sound financial decisions. However, the benefits would extend to families and society more broadly through reduced personal debt, fewer financial crises, and less reliance on government support programmes.

I believe this law is desperately needed because our current education system sends young people into a complex financial world woefully unprepared. Too many adults struggle with debt, fall victim to predatory lending, or reach retirement with inadequate savings – problems that often stem from never having learned fundamental concepts. The cost to individuals, families, and the economy is enormous. Financial literacy should not be a privilege acquired through lucky circumstances or wealthy parents; it should be a basic right that schools guarantee to everyone.`,
    keyVocab: ["mandating", "comprehensive", "core curriculum", "dedicated lessons", "mortgages", "scams", "standardised curriculum", "allocate", "specialised training", "sound financial decisions", "woefully unprepared", "predatory lending", "inadequate", "fundamental concepts"]
  }
];

// ==================== SPEAKING PART 3 DATA (27 DISCUSSION TOPICS) ====================
const speakingPart3Data = [
  {
    id: 1,
    topic: "Learning New Skills",
    relatedPart2: 1,
    questions: [
      { q: "What skills do you think will be most important in the future?", answer: "I believe adaptability and digital literacy will be paramount. Technology is reshaping every industry so rapidly that the ability to continuously learn and pivot will matter more than specific technical knowledge. Critical thinking skills will also be crucial as artificial intelligence handles routine tasks, leaving humans to focus on complex problem-solving, creativity, and ethical decision-making that machines cannot replicate." },
      { q: "Why do some people find it harder to learn new skills than others?", answer: "There are multiple factors at play. Psychological barriers like fear of failure or fixed mindsets can be significant obstacles. Some people genuinely learn differently – they may struggle with traditional teaching methods but excel with hands-on approaches. Life circumstances matter too; someone juggling work and family responsibilities simply has less time and mental energy to dedicate to learning. Additionally, the quality of prior education creates unequal foundations." },
      { q: "Do you think schools focus enough on practical skills?", answer: "Honestly, I think most educational systems remain overly focused on academic knowledge at the expense of practical competencies. Students often graduate without understanding basic financial literacy, communication skills, or how to navigate workplace dynamics. There's a disconnect between what curricula prioritise and what adult life actually demands. That said, some progressive schools are addressing this with more project-based learning and real-world applications." },
      { q: "Is it better to learn skills formally through courses or informally by yourself?", answer: "It depends entirely on the skill and the individual. Self-directed learning offers flexibility and can be incredibly effective for motivated learners, especially with the wealth of resources available online. However, formal instruction provides structure, expert feedback, and credentials that employers recognise. The ideal approach is probably a combination – using formal education for foundational knowledge and self-study to deepen expertise in areas of personal interest." }
    ]
  },
  {
    id: 2,
    topic: "Crowded Places",
    relatedPart2: 2,
    questions: [
      { q: "Why do some people enjoy being in crowded places while others don't?", answer: "It largely comes down to personality and psychological makeup. Extroverts often draw energy from social environments and find crowds stimulating. Introverts, conversely, may find the same situations draining and overwhelming. Cultural background plays a role too – people raised in densely populated areas develop higher tolerance for crowds. Personal experiences matter as well; someone who's had a negative experience in a crowd may develop lasting discomfort." },
      { q: "How do you think cities can deal with overcrowding?", answer: "There's no single solution, but a combination of approaches seems necessary. Improving public transportation reduces the need for personal vehicles and makes space more efficient. Decentralisation – encouraging business development outside city centres – can distribute populations more evenly. Urban planning that prioritises vertical rather than horizontal expansion helps. Technology also offers solutions, like remote work reducing commuter density and smart systems managing pedestrian and traffic flows more efficiently." },
      { q: "Do you think overcrowding affects people's mental health?", answer: "Research strongly suggests it does. Constant exposure to crowded conditions elevates stress hormones, and the lack of personal space can trigger anxiety. Studies show higher rates of psychological disorders in very densely populated areas. People in overcrowded housing report feeling helpless and irritable. That said, humans are adaptable – many city dwellers develop coping mechanisms and find ways to create psychological space even in physically cramped environments." },
      { q: "Are there benefits to living in densely populated areas?", answer: "Absolutely. Dense populations make public services more efficient – better public transport, more cultural amenities, greater variety in shops and restaurants. Economic opportunities tend to concentrate where people cluster. Social diversity is another benefit; exposure to different perspectives and lifestyles broadens minds. There's also an environmental argument – per capita, dense urban living often has a smaller carbon footprint than suburban sprawl requiring car dependency and individual infrastructure." }
    ]
  },
  {
    id: 3,
    topic: "Helping Others",
    relatedPart2: 3,
    questions: [
      { q: "Why do some people like helping others?", answer: "There are both intrinsic and extrinsic motivations. Many people experience genuine psychological rewards from helping – it releases feel-good chemicals and boosts self-esteem. Some are driven by empathy, having experienced difficulties themselves. Cultural and religious values often emphasise service to others. There's also social capital to consider; helping builds relationships and community standing. Interestingly, research shows helping others actually improves the helper's wellbeing more than receiving help." },
      { q: "Do you think governments should do more to help people in need?", answer: "This is genuinely contentious. I believe there's a fundamental role for government in providing safety nets for those who cannot help themselves – the elderly, disabled, or those facing circumstances beyond their control. Markets alone won't address certain social needs. However, the mechanism matters enormously. Government assistance can sometimes create dependency rather than empowerment if poorly designed. The best approaches combine material support with pathways to self-sufficiency." },
      { q: "Is it important to teach children to help others?", answer: "I would argue it's essential. Children who learn to help others develop empathy, social awareness, and a sense of responsibility that benefit them throughout life. Early experiences of helping shape moral development and create patterns that persist into adulthood. Practically, helping others is a skill – recognising need, knowing how to respond appropriately, offering assistance without condescension – that improves with practice. Schools and families that model and encourage helping behaviour raise better citizens." },
      { q: "How has technology changed the way people help each other?", answer: "Technology has fundamentally transformed charitable giving and mutual aid. Crowdfunding platforms allow individuals to directly support specific causes or people in need across the globe. Social media mobilises responses to crises with unprecedented speed. Apps connect volunteers with local opportunities. Online communities provide emotional support across distances. However, there's a downside – technology can also create superficial 'slacktivism' where clicking 'share' replaces meaningful action, and digital divides exclude those most in need from these networks." }
    ]
  },
  {
    id: 4,
    topic: "Reading and Books",
    relatedPart2: 4,
    questions: [
      { q: "Do you think people read less now than in the past?", answer: "It's complicated. People certainly read fewer physical books and long-form content, but we're actually reading more text overall than any previous generation – emails, social media, articles, messages. What's changed is the nature and depth of reading. Sustained engagement with complex texts has declined, replaced by fragmented consumption of shorter pieces. Whether this represents a net loss depends on what you value about reading – if it's volume of words, we're doing well; if it's depth of understanding, there's genuine cause for concern." },
      { q: "Why do some people prefer e-books while others prefer physical books?", answer: "E-book enthusiasts typically value convenience – carrying hundreds of books on one device, adjustable font sizes, instant purchases, built-in dictionaries. Those who prefer physical books often cite the tactile experience, easier focus without digital distractions, and the pleasure of building a visible collection. There's also research suggesting comprehension and retention may be slightly better with physical pages. Interestingly, many readers use both formats depending on context – e-books for travel, physical for home." },
      { q: "How can parents encourage children to read more?", answer: "Modelling is crucial – children who see parents reading develop positive associations with books. Creating a book-rich environment where reading materials are accessible helps. Reading aloud together, even beyond early childhood, builds positive memories. Letting children choose their own reading material, even if it's not 'literary,' respects their autonomy. Limiting screen time creates space for reading. Most importantly, framing reading as pleasure rather than duty makes a significant difference – forced reading often backfires by creating negative associations." },
      { q: "Do you think bookshops will survive in the future?", answer: "I'm cautiously optimistic. Traditional bookshops selling only books at full price will continue struggling against online competition. However, those that evolve into experiential spaces – combining book sales with cafés, events, community gathering functions, and expert curation – can offer something e-commerce cannot. The survivors will be those that understand they're selling not just books but an experience, a relationship, and a sense of community. Independent bookshops with strong local identities seem better positioned than generic chains." }
    ]
  },
  {
    id: 5,
    topic: "Goals and Ambitions",
    relatedPart2: 5,
    questions: [
      { q: "Do you think ambitious people are more likely to succeed?", answer: "Ambition is certainly correlated with certain types of success, particularly material and career achievements. Ambitious people tend to set higher targets, work harder, and persist through obstacles. However, success is subjective – someone with modest ambitions who achieves contentment might be more successful in meaningful terms than a driven achiever who's perpetually dissatisfied. There's also the question of ethics; ambition without moral constraints can lead to success at others' expense, which I wouldn't call truly successful." },
      { q: "Why do some people give up on their goals easily?", answer: "Multiple factors contribute. Unrealistic goal-setting creates inevitable failure when expectations meet reality. Poor planning means people don't anticipate obstacles or create actionable steps. External pressures – financial constraints, family obligations, unsupportive environments – genuinely limit options. Some people lack the resilience to push through inevitable setbacks. Fear of failure can paradoxically cause people to give up before they can fail. Sometimes, abandoning goals is actually rational – recognising something isn't worth pursuing is wisdom, not weakness." },
      { q: "How important is it to have long-term goals in life?", answer: "I believe long-term goals provide direction and meaning, helping us make coherent decisions rather than drifting aimlessly. They create motivation to defer gratification and invest in our futures. However, excessive focus on distant goals can cause us to miss present opportunities or become rigid when circumstances change. The healthiest approach might be holding long-term goals loosely – having a direction while remaining flexible about specific destinations and enjoying the journey rather than fixating solely on arrivals." },
      { q: "Should parents set goals for their children?", answer: "There's a balance to strike. Parents should help children develop goal-setting skills and support their aspirations. However, imposing specific goals that reflect parents' unfulfilled ambitions rather than children's interests is problematic. Research shows intrinsic motivation – pursuing goals you've chosen – is more sustainable than extrinsic motivation. The parent's role is perhaps to expose children to possibilities, help them discover their interests, teach them how to set and work toward goals, and support the goals children choose for themselves." }
    ]
  },
  {
    id: 6,
    topic: "Inspiration and Role Models",
    relatedPart2: 6,
    questions: [
      { q: "Do you think celebrities make good role models?", answer: "It's highly variable. Some celebrities use their platforms responsibly, modelling values like hard work, charitable giving, or overcoming adversity. However, celebrity culture often promotes superficial values – appearance, wealth, fame – as measures of worth. The curated nature of celebrity public personas means we rarely see authentic struggles or failures. Children especially may develop unrealistic expectations. I think better role models are often people we can actually know – teachers, mentors, family members – whose full humanity, including flaws and growth, is visible." },
      { q: "Why do people need role models?", answer: "Humans are fundamentally social learners; we evolved to learn by observing others. Role models provide concrete examples of how values translate into action. They demonstrate that success is possible, which is particularly important for people from disadvantaged backgrounds who may not see achievement around them. Psychologically, role models help us envision our future selves and provide templates for navigating challenges. They also offer shortcuts – we can learn from their mistakes and successes without making every error ourselves." },
      { q: "How has social media changed the way we think about inspiration?", answer: "Social media has democratised inspiration in some ways – ordinary people sharing authentic journeys can reach millions. However, it's also created problems. Highlight-reel culture means we see only successes, not struggles, creating unrealistic comparisons. The volume of inspiring content can cause inspiration fatigue or substitute for actual action – consuming inspirational posts feels productive without requiring real effort. Algorithmic curation creates echo chambers. At its worst, social media turns inspiration into performance rather than genuine motivation for change." },
      { q: "Can people be inspired by failure as well as success?", answer: "Absolutely, and I'd argue failure is often more instructive than success. Witnessing how people respond to failure – with resilience, learning, and eventual recovery – provides more useful lessons than watching effortless achievement. Many inspiring figures are those who failed publicly and rebuilt. Failure humanises role models, making their success seem attainable. Understanding that failure is part of any meaningful pursuit helps people persist through their own setbacks. The most dangerous role models might be those whose failures remain hidden." }
    ]
  },
  {
    id: 7,
    topic: "News and Information",
    relatedPart2: 7,
    questions: [
      { q: "How has the way people get news changed in recent years?", answer: "The transformation has been dramatic. Traditional gatekeepers – newspapers, broadcast networks – have lost their monopoly as social media and digital platforms become primary news sources for many, especially younger people. News consumption has become more fragmented, personalised by algorithms, and continuous rather than scheduled. The line between news and opinion has blurred considerably. Citizen journalism has emerged, with ordinary people breaking stories. Trust has declined across all sources, and misinformation has become a serious challenge." },
      { q: "Do you think social media is a reliable source of news?", answer: "Generally, no. Social media platforms are designed for engagement, not accuracy, so sensational and emotional content spreads faster than nuanced truth. There's no editorial oversight or verification process. Algorithms create filter bubbles reinforcing existing beliefs. Deliberate misinformation campaigns exploit these platforms. That said, social media can surface important stories mainstream media ignores and provide diverse perspectives. The key is treating social media as a starting point for awareness, then verifying through reputable sources before accepting claims." },
      { q: "Is it important for people to keep up with current events?", answer: "I believe civic engagement requires some awareness of what's happening in the world. Informed citizens make better decisions at elections and in daily life. Complete disengagement enables others to make decisions affecting your life without your input. However, there's a point of diminishing returns – excessive news consumption, particularly negative news, demonstrably harms mental health without proportionally improving decision-making. The goal should be sufficient awareness for responsible citizenship, not compulsive consumption of every development." },
      { q: "How can people identify fake news?", answer: "Several strategies help. Check the source – is it a recognised news organisation with editorial standards? Look for corroboration – do other reputable outlets report the same facts? Be suspicious of emotional reactions – misinformation is designed to provoke outrage or fear. Check dates and context – old stories often recirculate as 'news.' Examine evidence – are claims supported by verifiable sources? Be aware of your own biases – we're more likely to accept uncritically things that confirm existing beliefs. When in doubt, specialised fact-checking websites can help verify specific claims." }
    ]
  },
  {
    id: 8,
    topic: "Elderly People in Society",
    relatedPart2: 8,
    questions: [
      { q: "How should society treat elderly people?", answer: "Society should treat elderly people with dignity, respect, and care while also recognising their continuing potential contributions. This means ensuring adequate healthcare, housing, and financial security. But it goes beyond material provision – combating loneliness, providing opportunities for social engagement and purpose, and valuing their perspectives. We should avoid both neglect and infantilisation. The goal should be supporting independence as long as possible while providing dignified care when needed. Importantly, treatment of the elderly reflects a society's fundamental values." },
      { q: "Why do some cultures respect the elderly more than others?", answer: "Cultural attitudes toward aging are shaped by various factors. Agricultural societies traditionally valued elders as repositories of knowledge essential for survival. Religions like Confucianism explicitly mandate respect for elders. Extended family structures common in some cultures keep generations connected. In contrast, youth-focused cultures that prize innovation and rapid change may view old age as obsolescence. Economic factors matter too – where elderly remain economically productive or control resources, respect follows. Urbanisation and nuclear families often weaken traditional respect patterns." },
      { q: "Do you think life is better for old people now than in the past?", answer: "In material terms, certainly – medical advances mean longer, healthier lives; pension systems and social security provide financial stability unknown to previous generations. However, other dimensions are more mixed. Traditional societies often integrated elders into extended families with clear roles and respect. Modern elderly people may enjoy better physical health but experience more loneliness, purposelessness, and the feeling of being burdensome. The answer really depends on which aspects of life you prioritise and which past era you compare with." },
      { q: "What problems do elderly people face in modern society?", answer: "The challenges are numerous. Loneliness and social isolation affect millions, with devastating health consequences. Financial insecurity remains common despite social systems. Healthcare systems often fail to address complex needs of aging bodies. Age discrimination in employment persists. Technology creates new barriers as digital literacy becomes essential. Finding meaning and purpose after career roles end is psychologically challenging. Inadequate care options – either unaffordable or poor quality – leave many families struggling. Family structures provide less support as people live further apart and women enter the workforce." }
    ]
  },
  {
    id: 9,
    topic: "Tourism",
    relatedPart2: 9,
    questions: [
      { q: "What are the advantages and disadvantages of tourism for a country?", answer: "The advantages include significant economic benefits – job creation, foreign currency, development of infrastructure that also serves locals. Tourism incentivises preservation of cultural heritage and natural environments. It promotes cross-cultural understanding. However, disadvantages can be substantial. Environmental damage, from carbon emissions to habitat destruction, is serious. Over-tourism can make cities unliveable for residents while commodifying culture. Economic benefits often leak to foreign-owned companies rather than local communities. Seasonal employment creates instability. Finding balance is challenging but essential." },
      { q: "How has tourism changed over the past few decades?", answer: "Tourism has become dramatically more accessible and democratised. Budget airlines opened international travel to the middle class. Technology transformed booking and planning – what once required travel agents now happens on smartphones. Social media has made certain destinations viral phenomena, sometimes overwhelmingly so. There's been diversification from traditional beach holidays toward experiences – adventure travel, culinary tourism, wellness retreats. Sustainable and responsible tourism has emerged as a movement, though its practice often lags behind its rhetoric. The pandemic caused a fundamental, possibly lasting, reassessment." },
      { q: "Do you think tourism will change in the future?", answer: "Almost certainly. Climate concerns will increasingly shape travel choices and policies – carbon taxes on flights may reduce long-haul travel, while slower, lower-impact tourism gains popularity. Technology will enhance experiences through virtual and augmented reality, though I doubt it will replace physical travel. Overtourism will force stricter management of popular destinations. Authentic, meaningful experiences will be valued over superficial sight-seeing. Post-pandemic, people seem to want more purposeful travel with longer stays rather than rushed itineraries. Space tourism will eventually become accessible to more than billionaires." },
      { q: "Is ecotourism really good for the environment?", answer: "It depends entirely on implementation. Genuine ecotourism – small-scale, locally owned, educating visitors, directly funding conservation, minimising impact – can create economic incentives to protect environments that might otherwise be exploited. However, the term is frequently misused for marketing purposes, a practice called 'greenwashing.' Large-scale operations calling themselves ecotourism may cause significant damage despite the label. The infrastructure required to bring tourists to pristine areas inevitably has some impact. True ecotourism exists but is the exception rather than the rule among operations claiming the title." }
    ]
  },
  {
    id: 10,
    topic: "Patience and Waiting",
    relatedPart2: 10,
    questions: [
      { q: "Why do some people find it difficult to be patient?", answer: "Several factors contribute. Our brains are wired to prefer immediate rewards over delayed ones – this served evolutionary purposes but creates problems in modern contexts requiring patience. Contemporary society reinforces impatience through instant gratification – fast food, streaming, same-day delivery. Some people have personality traits or neurological conditions that make waiting particularly difficult. Lack of trust that waiting will actually pay off reduces patience. High-stress environments deplete self-control resources needed for patience. Cultural conditioning matters too – some societies value speed more than others." },
      { q: "Do you think patience is a skill that can be learned?", answer: "Research strongly suggests it can. Mindfulness meditation demonstrably improves ability to tolerate discomfort and delay gratification. Cognitive strategies like reframing waiting periods or focusing on long-term goals help. Repeated practice builds tolerance – people become more patient through experience of waiting paying off. Understanding the neuroscience behind impatience helps people recognise and manage impulses. However, like any skill, some people have more natural aptitude than others. Developing patience requires motivation, since the immediate experience of learning it is, ironically, uncomfortable." },
      { q: "Has technology made people less patient?", answer: "There's considerable evidence it has. We've become accustomed to instantaneous access to information, entertainment, and communication. Studies show average attention spans have shortened. The dopamine-reward cycle of social media conditions us to expect constant stimulation. Even minor delays that previous generations took for granted now feel frustrating. However, this isn't necessarily permanent – the brain adapts both ways. Some technologies actually require patience, like slow-building games or meditation apps. The question is whether we choose technologies that build or erode patience." },
      { q: "Are there situations where being impatient is actually a good thing?", answer: "Absolutely. Impatience with injustice drives social progress – patient acceptance of discrimination or abuse enables its continuation. In emergencies, quick action matters more than careful deliberation. Innovation often comes from impatience with existing solutions. In competitive environments, speed can be decisive. Impatience can protect against exploitation – accepting unreasonable delays may signal you'll tolerate poor treatment. The key is distinguishing productive impatience that demands improvement from destructive impatience that sacrifices long-term gains for short-term satisfaction." }
    ]
  },
  {
    id: 11,
    topic: "Uniforms",
    relatedPart2: 11,
    questions: [
      { q: "What are the advantages and disadvantages of wearing uniforms?", answer: "Advantages include creating equality by reducing visible economic differences, building group identity and belonging, simplifying daily decisions about clothing, and representing an organisation professionally. For workplaces, uniforms aid customer identification of staff. Disadvantages centre on suppressing individual expression, which some argue harms personal development. The financial burden on families buying specific items can be significant. Uniforms may be uncomfortable or impractical for certain body types or activities. There's also the philosophical question of whether institutions should control something as personal as clothing." },
      { q: "Do you think uniforms help students focus on their studies?", answer: "The evidence is actually mixed. Proponents argue uniforms remove distractions of fashion competition and create a more academic atmosphere. Some studies show marginal improvements in discipline and attendance. However, other research finds no significant academic impact. The assumption that how students dress directly affects their learning is questionable. What probably matters more is the overall school culture of which uniforms are just one element. A uniform policy in an otherwise chaotic school won't transform outcomes, while excellent schools exist without uniforms." },
      { q: "Should employees be required to wear uniforms at work?", answer: "It depends significantly on the context. For safety reasons in industrial settings, or identification purposes in customer-facing roles, uniforms serve clear functional purposes. In highly professional contexts like healthcare or aviation, uniforms convey competence and inspire trust. However, mandatory uniforms in creative industries might signal distrust and suppress the individuality that's valued there. The key considerations should be practical necessity, employee comfort, whether the policy applies equally across hierarchies, and whether the organisation provides uniforms or expects employees to bear the cost." },
      { q: "Why do some people choose jobs that require uniforms?", answer: "Various motivations exist. Some people genuinely prefer the simplicity – not deciding what to wear saves time and mental energy. Uniforms can provide a sense of belonging and professional identity. For those from lower-income backgrounds, not needing a wardrobe of work clothes reduces financial pressure. Certain uniforms carry prestige and respect – military or medical uniforms, for instance. Some people prefer the clear boundary uniforms create between work and personal life. Others simply prioritise other aspects of a job more than dress code considerations." }
    ]
  },
  {
    id: 12,
    topic: "Inventions and Technology",
    relatedPart2: 12,
    questions: [
      { q: "What invention do you think has been most important in the last century?", answer: "While many candidates exist – computers, the internet, antibiotics – I would argue the transistor, invented in 1947, deserves recognition as the foundational invention enabling most others. Every digital device, from smartphones to medical equipment to the systems running modern infrastructure, depends on transistors. Without them, computers would still be room-sized, impractical machines. The information revolution that's transformed nearly every aspect of modern life rests on this single, unassuming invention. It's less famous than its descendants but more consequential than any of them individually." },
      { q: "Do you think technology always improves people's lives?", answer: "Not automatically or universally. Technology is a tool that can be used well or badly. The same technologies enabling global communication also enable surveillance and manipulation. Medical advances that save lives may also extend suffering. Automation that increases productivity also displaces workers. Social media connects people but also spreads misinformation and harms mental health. The impact depends on how technologies are designed, regulated, and used. What's clear is that technology alone doesn't guarantee improvement – wise governance, ethical consideration, and equitable distribution determine whether benefits are realised." },
      { q: "Should governments control new technologies?", answer: "Some regulation is necessary – uncontrolled deployment of powerful technologies can cause significant harm before markets or social norms adapt. Safety standards, privacy protections, and competition rules serve legitimate purposes. However, excessive or poorly designed regulation can stifle innovation and entrench incumbents. The challenge is timing – regulate too early and you may kill beneficial developments; too late and harms become entrenched. The ideal is flexible, principles-based regulation that adapts as technologies evolve, developed with input from technologists, ethicists, and affected communities." },
      { q: "What technologies do you think will be developed in the future?", answer: "Several trajectories seem likely. Artificial intelligence will become increasingly sophisticated and integrated into daily life and work. Biotechnology, including gene editing and personalised medicine, will transform healthcare. Clean energy technologies will improve as necessity drives investment. Autonomous vehicles will eventually become commonplace. Brain-computer interfaces are advancing rapidly. Quantum computing will unlock currently impossible calculations. What's harder to predict are entirely novel technologies – history shows the most transformative inventions often weren't anticipated. The convergence of multiple technologies will likely produce innovations we can't currently imagine." }
    ]
  },
  {
    id: 13,
    topic: "Friendship",
    relatedPart2: 13,
    questions: [
      { q: "What qualities do you think are important in a friend?", answer: "Reliability and trustworthiness are fundamental – you need to know a friend will keep confidences and be there when needed. Honesty matters, including the willingness to tell uncomfortable truths kindly. Genuine interest in your wellbeing, not just what you can provide, distinguishes real friends from acquaintances. Good friends offer support without judgement during difficult times. Shared values help, though not necessarily identical opinions. The ability to enjoy time together, whether through shared interests or simply comfortable conversation, is essential. Finally, reciprocity – friendship requires balanced investment from both sides." },
      { q: "Do you think it's harder to make friends as an adult?", answer: "Generally, yes. Childhood and student life provide ready-made contexts for meeting potential friends – shared classrooms, activities, and unstructured time. Adults have less free time, more competing obligations, and fewer natural opportunities for the repeated, low-stakes interactions that build friendships. Geographic mobility means people move away from existing networks. Established relationships often take priority over forming new ones. There's also awkwardness – approaching new potential friends feels uncomfortable in ways it didn't as children. However, adult friendships, when formed, often have more depth and intentionality precisely because they require more effort." },
      { q: "Is it possible to maintain friendships online?", answer: "Absolutely, though with limitations. Online communication sustains existing friendships across distances – regular contact, shared experiences through calls or games, and emotional support are all possible digitally. However, starting friendships entirely online is different from maintaining established ones. Something is lost without physical presence – body language, shared physical activities, the particular connection of being in the same space. Online friendships may remain shallower or develop more slowly. The ideal for most people is probably online maintenance supplemented by occasional in-person connection." },
      { q: "How has the concept of friendship changed over time?", answer: "Several shifts are evident. Traditional friendships were often limited by geography – your friends were essentially your neighbours. Modern transportation and communication removed that constraint. Historically, friendships were more gendered and class-bound; contemporary friendships cross more boundaries. The concept of 'chosen family' – friends taking roles traditionally held by blood relatives – has become more accepted. Social media has introduced 'friendship' as a category including very casual connections. Work-life changes mean people invest more in friendships and less in extended family than previous generations. What remains constant is the human need for connection and belonging." }
    ]
  },
  {
    id: 14,
    topic: "Risk-Taking",
    relatedPart2: 14,
    questions: [
      { q: "Why do some people enjoy taking risks while others avoid them?", answer: "Neuroscience shows individual differences in how brains process risk and reward. Some people's brains release more dopamine in response to uncertain outcomes, making risk inherently pleasurable. Personality traits like sensation-seeking vary naturally. Life experiences shape risk attitudes – people who've seen risks pay off become more comfortable taking them, while those burned by bad outcomes become cautious. Cultural conditioning matters too – some societies celebrate risk-takers while others value security. Economic circumstances influence how much you can afford to lose. There's no objectively 'right' level of risk tolerance." },
      { q: "Do you think young people take more risks than older people?", answer: "Generally yes, and there are biological reasons. The prefrontal cortex, responsible for evaluating consequences, doesn't fully develop until the mid-twenties, while the reward-seeking parts of the brain mature earlier. Young people also have less to lose – fewer dependents, more time to recover from setbacks, less accumulated wealth. Social factors contribute too – peer pressure is stronger among the young, and proving oneself often involves risky behaviour. However, this varies individually, and some young people are extremely cautious while some older people remain adventurous throughout life." },
      { q: "Are there benefits to taking risks?", answer: "Substantial benefits, when risks are calculated. Risk-taking enables innovation – entrepreneurship, scientific discovery, and artistic creation all require accepting uncertainty. Personal growth often comes through challenging ourselves beyond comfortable limits. Risk-takers may seize opportunities others miss. Career advancement often requires risking current security for potential improvement. Relationships require the emotional risk of vulnerability. A life without any risks might feel safe but also stagnant and unfulfilling. The key distinction is between thoughtful risks with acceptable downsides and reckless gambles with potentially catastrophic consequences." },
      { q: "How can people learn to make better decisions about risks?", answer: "Several strategies help. Understanding probability and statistics improves assessment of actual risk levels versus perceived ones – we often fear dramatic but unlikely dangers while ignoring mundane but probable ones. Considering not just downsides but also the risk of inaction – not taking opportunities has costs too. Seeking diverse perspectives challenges personal blind spots. Small experiments test ideas with limited downside before full commitment. Post-decision analysis – honestly evaluating outcomes – builds better intuitions over time. Distinguishing between reversible and irreversible decisions appropriately calibrates caution. Emotional awareness prevents fear or excitement from distorting judgement." }
    ]
  },
  {
    id: 15,
    topic: "Pride and Achievement",
    relatedPart2: 15,
    questions: [
      { q: "Is it good for people to feel proud of their achievements?", answer: "In moderation, absolutely. Healthy pride reinforces behaviours that led to achievement, motivating further effort. It builds self-esteem and confidence, which enable tackling new challenges. Acknowledging our achievements is honest – false modesty that denies genuine accomplishment is its own distortion. However, excessive pride that dismisses others' contributions, refuses to acknowledge luck or privilege, or creates complacency becomes problematic. The healthiest pride focuses on the process and effort rather than comparing oneself favourably to others. Pride should inspire continued growth, not satisfied stagnation." },
      { q: "Do you think people today care too much about success?", answer: "There's a strong argument that contemporary culture has developed an unhealthy obsession with certain narrow definitions of success – particularly wealth, status, and visible achievement. Social media amplifies this by creating constant comparison with others' highlight reels. This pressure contributes to mental health problems, particularly among young people. However, I'd distinguish between caring about meaningful accomplishment – which serves genuine human needs for purpose and contribution – and chasing external markers of success that don't actually bring fulfillment. The problem isn't caring about success; it's how we define it." },
      { q: "What factors contribute to people achieving their goals?", answer: "Multiple factors interact. Individual attributes matter – persistence, discipline, ability to delay gratification, resilience after setbacks. Clear goal-setting with specific, measurable milestones helps. Support systems – mentors, family, encouraging friends – make significant differences. Resources including education, financial stability, and connections create unequal starting points. Environmental factors like living in a society with opportunity and stability versus one plagued by conflict or corruption. Luck, while uncomfortable to acknowledge, genuinely plays a role. The most successful people typically benefit from favourable conditions in multiple categories, not just personal merit." },
      { q: "Should parents praise their children for every achievement?", answer: "Research actually suggests this can be counterproductive. Constant praise, especially for innate qualities like being 'smart' rather than effort, can create fragility – children become afraid of challenges that might reveal they're not as capable as praise suggested. They may become dependent on external validation rather than developing internal motivation. More effective is specific, process-focused praise that acknowledges genuine effort and improvement rather than generic congratulation. Children also benefit from learning to handle disappointment and failure constructively, which excessive praise prevents. Balance and authenticity matter more than volume of praise." }
    ]
  },
  {
    id: 16,
    topic: "Workplaces",
    relatedPart2: 16,
    questions: [
      { q: "What makes a good workplace?", answer: "Several elements combine. Fair compensation is foundational – people need to feel their work is appropriately valued. But beyond that, meaningful work that connects to purpose matters enormously. Good relationships with colleagues and management create psychological safety. Opportunities for growth and development signal investment in employees' futures. Reasonable work-life balance prevents burnout. Physical environment affects wellbeing more than often acknowledged. Autonomy and trust, rather than micromanagement, engage people. Clear communication reduces uncertainty and anxiety. Finally, alignment between stated values and actual practices builds or destroys trust." },
      { q: "How have workplaces changed in recent years?", answer: "The changes have been dramatic. Remote and hybrid work, accelerated by the pandemic, has become normalised in many industries. Hierarchies have flattened, with less formal management structures. Open-plan offices became dominant, though their effectiveness is increasingly questioned. Technology enables constant connectivity, blurring work-life boundaries. Diversity and inclusion have become explicit priorities, at least rhetorically. The gig economy has created new categories of work outside traditional employment. Employee expectations have shifted – younger workers particularly demand meaning, flexibility, and attention to wellbeing that previous generations rarely expected from employers." },
      { q: "Do you think working from home is better than working in an office?", answer: "It genuinely depends on the person, role, and circumstances. Remote work offers flexibility, eliminates commuting, and provides focused environments for independent tasks. However, offices provide spontaneous collaboration, clearer work-life boundaries, social connection, and easier onboarding for new employees. Creative work often benefits from in-person interaction, while administrative tasks may suit remote environments. Personal circumstances matter – someone with a comfortable home office, reliable childcare, and good self-discipline will thrive remotely, while others may struggle with isolation or distractions. The ideal for many is probably hybrid arrangements." },
      { q: "What challenges do young people face when they start working?", answer: "The transition is significant. Adapting from academic schedules to full-time work rhythms is tiring. Understanding unwritten workplace norms – office politics, communication styles, professional boundaries – takes time. Building credibility when lacking experience creates frustration. Managing finances independently, often while repaying student debt, causes stress. Many entry-level positions don't match educational credentials, creating disappointment. Finding mentorship in organisations less structured than universities can be difficult. Proving oneself while simultaneously learning is exhausting. The current generation also faces particular challenges – gig economy instability, housing costs, climate anxiety – that previous generations didn't navigate at the same stage." }
    ]
  },
  {
    id: 17,
    topic: "Working and Studying Together",
    relatedPart2: 17,
    questions: [
      { q: "Is it better to study alone or in a group?", answer: "Both have distinct advantages for different purposes. Solitary study allows complete focus, self-paced progress, and is essential for deep understanding of complex material. Group study offers different perspectives, explanation practice that reinforces learning, accountability, and social support. Research suggests initial learning is often more effective alone, while consolidation and application benefit from group discussion. Individual preferences matter – some people think better while talking, others need silence. The ideal approach probably combines both: independent study to build understanding, group work to test and apply it." },
      { q: "What makes a good team member?", answer: "Reliability is fundamental – delivering what you commit to when you commit to it. Communication skills matter enormously – both expressing ideas clearly and listening genuinely to others. Flexibility to take on different roles as situations require shows maturity. The ability to give and receive constructive feedback respectfully enables improvement. Good team members contribute ideas but don't dominate, support colleagues without enabling underperformance, and manage their own emotions. They focus on team success rather than individual credit. Perhaps most importantly, they're trustworthy – team members need confidence that you'll act in the team's interest." },
      { q: "How can conflicts be resolved when people work together?", answer: "Effective conflict resolution starts with addressing issues early before they escalate. Direct, respectful communication between parties is usually preferable to involving third parties unnecessarily. Focusing on interests and goals rather than positions often reveals common ground. Seeking to understand before seeking to be understood reduces defensiveness. Acknowledging that reasonable people can disagree, and that different perspectives have value, prevents zero-sum framing. When resolution seems impossible, compromise or neutral mediation may be necessary. Sometimes organizational processes need to decide when individuals cannot. The goal is workable solutions that preserve relationships." },
      { q: "Do you think competition or cooperation is more effective in work or study?", answer: "Context determines which is more appropriate. Cooperation produces better outcomes when tasks require diverse skills, when knowledge-sharing benefits everyone, or when innovation comes from combining perspectives. Competition can drive excellence when individual performance is measurable, when improvement comes from striving to outperform peers, or when resources are genuinely limited. The most effective environments often combine both – cooperation within teams competing against each other, or individual competition for recognition within collaborative cultures. Pure competition without cooperation creates toxic environments, while pure cooperation without any competition may lack motivation for excellence." }
    ]
  },
  {
    id: 18,
    topic: "Teamwork and Collaboration",
    relatedPart2: 18,
    questions: [
      { q: "Why is teamwork important?", answer: "Teamwork enables accomplishments impossible for individuals alone. Complex modern challenges – scientific research, business operations, social problems – require diverse expertise that no single person possesses. Teams provide redundancy and resilience when individuals struggle. They offer different perspectives that catch blind spots and generate more creative solutions. Social support within teams sustains motivation through difficulties. The process of articulating ideas to teammates often clarifies thinking. Practically, organisations require coordination among people, making teamwork skills essential for professional success. Well-functioning teams regularly outperform collections of talented individuals working separately." },
      { q: "What problems can occur when people work in teams?", answer: "Numerous challenges emerge. Social loafing – some members contributing less, relying on others – is common. Groupthink suppresses dissenting opinions, leading to poor decisions. Unclear roles create duplication or gaps. Communication failures cause misunderstandings and wasted effort. Personality conflicts can derail focus on tasks. Uneven power dynamics may silence valuable contributions from lower-status members. Coordinating schedules becomes difficult. Decision-making can be slow and frustrating. Credit allocation causes resentment when perceived as unfair. Managing these challenges requires explicit attention – successful teams don't just happen; they're deliberately cultivated." },
      { q: "How can technology help people work together?", answer: "Technology has dramatically expanded collaboration possibilities. Communication tools enable instant connection regardless of location. Shared documents allow simultaneous work without version-control chaos. Project management software tracks responsibilities and deadlines. Video conferencing approximates face-to-face interaction across distances. Cloud storage makes information accessible to all team members. Asynchronous tools enable collaboration across time zones. Data visualisation helps teams understand complex information collectively. However, technology also creates challenges – communication overload, screen fatigue, and the loss of informal interactions that build relationships. The key is thoughtful selection and use of tools appropriate to specific collaboration needs." },
      { q: "Do you think group activities are beneficial for children?", answer: "Research strongly supports their value. Group activities develop social skills essential for life – cooperation, negotiation, conflict resolution, leadership, and followership. Children learn to consider perspectives different from their own. They experience being part of something larger than themselves, building sense of community. Academic benefits come from peer learning and motivation. Emotional intelligence develops through navigating group dynamics. Physical activities in teams build fitness while making exercise enjoyable. However, quality matters – poorly supervised groups can teach negative lessons about bullying or exclusion. Adult guidance helps children process group experiences constructively." }
    ]
  },
  {
    id: 19,
    topic: "Money and Gifts",
    relatedPart2: 19,
    questions: [
      { q: "Is giving money as a gift appropriate?", answer: "Cultural context heavily influences this. In many Asian cultures, money gifts are traditional and entirely appropriate, especially for occasions like weddings or Chinese New Year. In other contexts, money can feel impersonal or suggest the giver didn't care enough to choose something specific. However, money offers practical advantages – the recipient can choose exactly what they want or need. For circumstances like students starting out or those facing financial hardship, money may be more helpful than physical gifts. The key is matching the gift to the relationship, occasion, and recipient's likely preferences." },
      { q: "Do expensive gifts show that someone cares more?", answer: "Not necessarily, and assuming so creates unhealthy dynamics. A thoughtful, modest gift that shows genuine attention to someone's interests often means more than an expensive generic one. The person who remembers your offhand mention of a book months ago demonstrates care more than someone who buys expensive but impersonal luxury items. That said, generosity matters, and within one's means, investing in quality shows respect. The most meaningful gifts combine thoughtfulness with appropriate generosity – not showing off wealth, but demonstrating that someone is worth your time, attention, and reasonable expense." },
      { q: "How do attitudes towards money differ between generations?", answer: "Significant differences exist. Older generations, shaped by economic hardship, often prioritise saving and view debt warily. Younger generations, facing different circumstances – higher education costs, housing unaffordability, climate uncertainty – may see traditional saving as insufficient or futile. Digital payments have changed younger people's relationship with physical money. Attitudes toward ethical spending differ – younger consumers more often consider environmental and social impacts. Work-money trade-offs vary – younger workers may prioritise meaning and flexibility over maximum earnings. However, generalising risks stereotyping; individual variation within generations exceeds differences between them." },
      { q: "Should parents give children money as pocket money?", answer: "Managed appropriately, pocket money teaches valuable financial skills. Children learn budgeting, saving for goals, making trade-offs, and experiencing consequences of spending decisions – all in a low-stakes environment. However, the approach matters enormously. Simply handing over money without any framework teaches little. More effective is combining regular allowances with conversations about money, expectations about what children should fund themselves, encouragement of saving, and perhaps matching contributions to teach the value of deferred gratification. The amount matters less than consistent, thoughtful implementation that builds financial capability." }
    ]
  },
  {
    id: 20,
    topic: "Food and Trying New Things",
    relatedPart2: 20,
    questions: [
      { q: "Why are some people unwilling to try new foods?", answer: "Multiple factors contribute. Evolutionary psychology suggests neophobia – fear of new foods – protected our ancestors from potential poisons. Some people have more sensitive palates, experiencing flavours more intensely. Childhood eating experiences shape adult preferences; children exposed to variety develop broader tastes. Cultural background influences what seems 'normal' versus threatening. Previous negative experiences with unfamiliar foods create lasting aversions. Anxiety disorders sometimes manifest as food avoidance. Social factors matter too – trying new foods often requires vulnerability, which some find uncomfortable. Importantly, food preferences can change; many adults come to enjoy what they rejected as children." },
      { q: "How has globalisation affected the food people eat?", answer: "The impact has been profound. Cuisines that were once exotic are now mainstream in most cities – sushi, tacos, curry, and pizza are globally ubiquitous. Ingredients previously unavailable except locally – tropical fruits, specialty spices, ethnic vegetables – stock ordinary supermarkets. Fusion cuisines blend traditions in novel ways. However, globalisation also threatens local food cultures as standardised fast food replaces traditional dishes. Industrial food systems have negative environmental and health consequences. There's tension between celebrating culinary diversity and the appropriation and distortion of traditional cuisines. Food globalisation reflects broader patterns of cultural exchange with similar opportunities and concerns." },
      { q: "Do you think people's eating habits are getting better or worse?", answer: "Evidence points in both directions. Positive trends include increased awareness of nutrition, growth of organic and sustainable food movements, and greater variety and access to healthy ingredients. However, ultra-processed food consumption has increased dramatically, contributing to obesity and related diseases. Eating has become faster and less social, with fewer family meals. Despite knowledge, translating awareness into behaviour remains challenging. The picture varies enormously by socioeconomic status – healthy eating often requires resources, time, and access that not everyone possesses. Overall, knowledge has improved but practice hasn't necessarily followed." },
      { q: "What role does food play in culture and traditions?", answer: "Food is absolutely central to cultural identity. Traditional dishes connect people to ancestors and heritage. Festive foods mark celebrations and create shared memories. Dietary laws and restrictions encode religious values. Offering food expresses hospitality and strengthens social bonds. Regional cuisines distinguish places and create local pride. Cooking techniques and recipes pass between generations, carrying history. Food rituals – whether Japanese tea ceremonies or family Sunday dinners – structure social life. Immigrant communities often maintain cultural identity partly through cuisine, even as other traditions fade. When people describe their culture, food is typically among the first elements mentioned." }
    ]
  },
  {
    id: 21,
    topic: "Making Complaints",
    relatedPart2: 21,
    questions: [
      { q: "Why do some people find it difficult to complain?", answer: "Several factors inhibit complaint behaviour. Cultural conditioning teaches many people, particularly women, to be accommodating and avoid conflict. Fear of confrontation or of being perceived as difficult stops many. Previous negative experiences where complaints weren't resolved or caused backlash create reluctance. Some people doubt whether their concerns are legitimate or worry they're being unreasonable. Power imbalances make complaining to authority figures feel risky. Low expectations – believing nothing will change anyway – reduce motivation. The emotional labour required to complain sometimes exceeds the expected benefit. These barriers mean problems often go unreported, enabling their continuation." },
      { q: "How should businesses respond to customer complaints?", answer: "Effective complaint handling follows predictable patterns. Acknowledge the complaint promptly – delays signal disregard. Listen fully before responding; customers want to feel heard. Apologise sincerely when the business is at fault, without defensive excuses. Offer concrete resolution matching the severity of the problem. Follow through on promises made. Learn from complaints to prevent recurrence – they're valuable feedback. Empower frontline staff to resolve issues without escalation. Thank customers for bringing problems to attention. Research shows customers whose complaints are well-handled often become more loyal than those who never had problems, demonstrating that complaint handling is an opportunity rather than just damage control." },
      { q: "Do you think social media has changed how people complain?", answer: "Dramatically so. Social media gives individual consumers unprecedented power – a single viral complaint can cause significant reputational damage to large companies. This shifts power toward consumers, incentivising better service. Public complaints create pressure to respond quickly and visibly. However, there are downsides. Some complaints are unfair or uninformed but still cause harm. The performative aspect of public complaints can prioritise attention over resolution. Businesses may focus more on managing perception than fixing problems. Pile-on dynamics can escalate beyond proportionate response. The best companies use social media as one channel among several, while consumers should consider whether public complaints serve their actual interests." },
      { q: "Is complaining always negative, or can it lead to positive outcomes?", answer: "Complaining definitely has positive potential. Legitimate complaints identify problems that need fixing – they're essential feedback mechanisms. When complaints lead to improvements, everyone benefits. The act of complaining asserts dignity and standards that silent acceptance would erode. Collective complaining drives social change – movements for rights begin with articulating grievances. However, complaining becomes counterproductive when it's chronic venting without seeking solutions, when it poisons relationships through constant negativity, or when it focuses on unchangeable circumstances. The distinction is between constructive complaints aimed at improvement and unproductive complaints that simply express dissatisfaction without purpose." }
    ]
  },
  {
    id: 22,
    topic: "Leisure Activities",
    relatedPart2: 22,
    questions: [
      { q: "How have leisure activities changed over the years?", answer: "The transformation has been substantial. Technology has created entirely new categories of leisure – video gaming, social media, streaming entertainment – that didn't exist for previous generations. Simultaneously, traditional activities like reading physical books have declined. Leisure has become more individualised and screen-based, less communal and physical. Commercial entertainment has expanded enormously, but so has awareness of its downsides, driving interest in experiences and outdoor activities. The boundary between work and leisure has blurred as devices keep us constantly connected. There's also greater variety available – niche interests can find communities online that couldn't exist locally." },
      { q: "Do you think people have enough free time today?", answer: "Despite productivity gains that should theoretically increase leisure, many people feel more time-pressured than ever. Several factors contribute. Work hours haven't decreased proportionally with productivity. Commuting consumes significant time in many countries. Domestic labour, though reduced by technology, remains substantial. The attention economy fills any available moment with demands. Childcare responsibilities, particularly for women, limit free time. However, objective data shows leisure time has actually increased modestly in developed countries – the perception of busyness may exceed reality. The question is partly about how time is experienced; fragmented, interrupted time feels less leisurely than consolidated periods, even if total hours are similar." },
      { q: "Are traditional leisure activities still popular?", answer: "Many maintain surprising resilience. Reading continues despite digital competition. Board games have experienced a renaissance, partly as reaction against screens. Gardening, crafts, and cooking remain popular, perhaps increasingly so as they offer tangible, analogue experiences contrasting with digital life. Outdoor activities like hiking have grown. Sports participation remains strong, though shifting between specific activities. However, the context has changed – traditional activities now compete for attention with powerful alternatives designed to capture engagement. People often feel nostalgic for traditional leisure while actually spending time on digital activities. The traditional activities that thrive tend to offer something screens cannot – physical engagement, social presence, or creative accomplishment." },
      { q: "Should children spend more time on educational activities or leisure?", answer: "This presents a false dichotomy. Play is educational – children develop social skills, creativity, problem-solving, and physical coordination through unstructured activities. Overscheduling children with formal education and organised activities can be counterproductive, creating stress and preventing self-directed learning. However, pure leisure without any structure may not develop specific skills effectively. The ideal balance varies by child, age, and context. Younger children generally benefit from more play; as children mature, more structured learning becomes appropriate. The quality of both educational activities and leisure matters more than quantity. Children who develop intrinsic motivation to learn through engaging experiences do better than those drilled in academic content while resenting it." }
    ]
  },
  {
    id: 23,
    topic: "History and Society",
    relatedPart2: 23,
    questions: [
      { q: "Why is it important to learn about history?", answer: "Understanding history provides essential context for the present – current institutions, conflicts, and cultures become comprehensible only through their development over time. History offers cautionary lessons; patterns repeat, and knowing how past decisions led to catastrophe can prevent recurrence. It develops critical thinking by requiring evaluation of evidence and multiple perspectives. History builds identity, connecting individuals to larger narratives and communities. It demonstrates that change is possible – things haven't always been this way and needn't remain so. Perhaps most importantly, historical perspective cultivates humility about our own certainties, recognising that contemporary assumptions will eventually seem as dated as those of the past." },
      { q: "Do you think people should learn about other countries' history?", answer: "Absolutely. National history alone creates distorted understanding; events occur in international contexts that parochial accounts ignore. Learning others' history builds empathy and reduces xenophobia by humanising people often reduced to stereotypes. It provides different perspectives on shared events – every war, for example, looks different from each side. Comparative history reveals what's universal and what's culturally specific about one's own society. In an interconnected world, ignorance of others' histories creates practical problems in diplomacy, business, and social interaction. However, teaching others' history must be done thoughtfully, with genuine engagement rather than superficial coverage that reinforces rather than challenges simplistic narratives." },
      { q: "How can history be made more interesting for students?", answer: "Several approaches help. Connecting history to present concerns makes relevance apparent – students engage more when they see how past events shaped their current lives. Narrative approaches that tell compelling stories with vivid characters work better than dry recitations of dates and facts. Primary sources let students experience historical voices directly rather than through textbook filters. Counterfactual questions – what if things had happened differently? – develop analytical thinking while engaging imagination. Local history connects abstract concepts to familiar places. Diverse perspectives, including previously marginalised voices, reveal more complete and interesting pictures. Interactive methods – simulations, debates, research projects – engage students more actively than passive learning." },
      { q: "Should historical monuments to controversial figures be removed?", answer: "This genuinely complex question defies simple answers. Monuments aren't merely historical records – they're expressions of values, deliberately placed to honour certain figures and signal what a society celebrates. When those values change, continued celebration becomes uncomfortable. However, removal can feel like erasing history or imposing contemporary judgements on different eras. Context matters enormously – a statue honouring a slave trader in a public square differs from one in a museum or cemetery. Better approaches might include recontextualization through additional information, relocation to appropriate settings, or commissioning new monuments that provide balance. Communities should make these decisions through inclusive democratic processes rather than either defending all monuments or removing all problematic figures." }
    ]
  },
  {
    id: 24,
    topic: "Health and Fitness",
    relatedPart2: 24,
    questions: [
      { q: "What are the main health problems in modern society?", answer: "Chronic non-communicable diseases dominate: cardiovascular conditions, diabetes, cancer, and respiratory diseases. Mental health problems – depression, anxiety, addiction – have reached epidemic proportions. Obesity affects growing portions of populations, particularly in developed countries. Despite medical advances, inequality means many lack access to basic healthcare. Sedentary lifestyles, processed diets, and chronic stress underlie many problems. Aging populations create increasing dementia prevalence. New challenges emerge – antimicrobial resistance threatens to make treatable infections deadly again. Social isolation has physical health consequences often underestimated. The pandemic revealed how fragile even advanced health systems can be when confronting novel threats." },
      { q: "Why do some people not take care of their health?", answer: "Multiple barriers exist. Health knowledge doesn't automatically translate to behaviour – people often know what's healthy but fail to act on it. Immediate pleasures compete with long-term benefits that feel abstract. Unhealthy options are often more convenient, cheaper, and aggressively marketed. Addiction hijacks decision-making around substances and behaviours. Time and energy constraints make healthy choices difficult. Mental health problems reduce motivation for self-care. Social environments either support or undermine individual choices. Economic precarity prioritises survival over optimal health. Some people simply don't believe health advice, having seen contradictory messages over time. Addressing this requires systemic changes beyond individual willpower – making healthy choices the default rather than requiring constant effort." },
      { q: "Do you think governments should do more to encourage healthy lifestyles?", answer: "I believe governments have legitimate roles in public health, though the appropriate extent is debatable. Infrastructure that enables activity – parks, cycling lanes, sports facilities – clearly serves public interest. Regulation of harmful products – tobacco, ultra-processed foods, addictive substances – has proven effective. Public education campaigns raise awareness. Healthcare systems should emphasise prevention alongside treatment. However, excessive intervention feels paternalistic – adults arguably have the right to make unhealthy choices if fully informed. The most defensible approach focuses on enabling healthy choices without mandating them, while protecting children and addressing commercial interests that profit from harming health." },
      { q: "How has technology affected people's health?", answer: "The impact is decidedly mixed. Medical technology has revolutionised diagnosis and treatment, extending and improving lives. Fitness trackers and health apps help many people monitor and improve their behaviours. Telemedicine increases healthcare access. However, technology also enables sedentary lifestyles – screens keep people sitting for extended periods. Social media contributes to mental health problems, particularly among young people. Sleep suffers from device use. Eye strain, repetitive injuries, and poor posture create new conditions. Food technology has made unhealthy options more appealing and accessible. The balance depends on how technology is used – it can support or undermine health depending on individual choices and societal regulation." }
    ]
  },
  {
    id: 25,
    topic: "Films and Entertainment",
    relatedPart2: 25,
    questions: [
      { q: "How has the film industry changed in recent years?", answer: "Transformation has been dramatic. Streaming platforms have disrupted theatrical distribution, with many films now premiering digitally. Franchise films and sequels dominate cinema, reducing space for original stories. International markets, particularly China, increasingly influence production decisions. Digital effects enable previously impossible visuals but also homogenise aesthetics. Independent filmmaking has paradoxically both struggled against corporate consolidation and thrived through lower production costs and streaming opportunities. The pandemic accelerated industry restructuring. Diversity in front of and behind cameras has improved, though progress remains uneven. Traditional studios face existential questions about their relevance in the streaming era." },
      { q: "Do you think films can influence people's behaviour?", answer: "Research suggests they can, though the mechanism is subtle rather than direct. Films shape cultural conversations, normalising or stigmatising behaviours. Repeated exposure to certain portrayals influences what seems acceptable or desirable. Characters provide models for emulation. However, the relationship isn't simple – audiences actively interpret rather than passively absorb messages, and existing attitudes filter reception. Individual films rarely cause behavioural change, but cumulative exposure to patterns across many films gradually shifts norms. The influence is perhaps strongest on unfamiliar topics where viewers lack other reference points. Concerns about violence, substance use, or stereotypes in film reflect genuine recognition of this influence." },
      { q: "Should governments regulate what films can be shown?", answer: "Some regulation seems appropriate, particularly protecting children from harmful content through rating systems. Preventing demonstrably harmful material – genuinely illegal content like child exploitation – is uncontroversial. However, beyond clear limits, regulation becomes problematic. Government control of artistic expression easily becomes political censorship. Who decides what's acceptable? Public standards vary across cultures and time periods. Adults generally should be able to choose what they watch. Rating systems that inform without prohibiting adult access represent reasonable middle ground. The most effective approach combines light government oversight with industry self-regulation and empowered consumers who can make informed choices." },
      { q: "Do you think streaming services will replace cinemas?", answer: "Complete replacement seems unlikely, though cinemas will certainly continue evolving. Theatrical releases offer something streaming cannot – the immersive experience of large screens, powerful sound, and communal viewing. Major event films benefit from theatrical release; seeing a film with an enthusiastic audience differs qualitatively from home viewing. However, mid-budget films that don't require theatrical presentation may migrate primarily to streaming. Cinemas will probably become more experience-focused – premium formats, improved comfort, food and drink options – to justify attendance. The pandemic demonstrated that cinemas aren't essential for film consumption, but also that many people missed them. A hybrid ecosystem seems more likely than winner-take-all outcomes." }
    ]
  },
  {
    id: 26,
    topic: "Business and Entrepreneurship",
    relatedPart2: 26,
    questions: [
      { q: "What qualities do successful entrepreneurs have?", answer: "Several characteristics recur. Resilience matters enormously – startups face constant rejection and setbacks, requiring ability to persist through failure. Risk tolerance is necessary since entrepreneurship involves significant uncertainty. Vision and ability to inspire others to share it enables building teams. Adaptability allows pivoting when initial plans prove flawed, which they invariably do. Problem-solving orientation focuses on creating value rather than just identifying issues. Financial understanding, even if not expertise, prevents avoidable mistakes. Network-building provides resources, advice, and opportunities. However, survivor bias means we overweight successful entrepreneurs' traits – many with identical qualities fail due to timing, luck, or circumstances beyond their control." },
      { q: "Do you think small businesses are important for the economy?", answer: "Vital. Small businesses create the majority of new jobs in most economies. They provide essential goods and services in communities that large corporations often neglect. They drive innovation – many transformative ideas emerge from small, agile companies rather than corporate bureaucracies. Small businesses create economic diversity and competition that prevents monopolistic concentration. They keep wealth circulating locally rather than extracting it to distant headquarters. The entrepreneurial opportunity they represent enables social mobility. Their struggles matter politically, representing widely shared interests against concentrated corporate power. However, romanticising small business shouldn't obscure that employees often face worse conditions than in larger organisations with more resources and oversight." },
      { q: "Why do some businesses fail?", answer: "Multiple factors contribute, often in combination. Insufficient market demand – building products nobody actually wants – is common. Running out of cash before becoming profitable kills promising ventures. Poor management decisions compound over time. Inability to adapt to changing circumstances leaves businesses behind. Founders' skill gaps – strong in product development but weak in finance, or vice versa – create vulnerabilities. Competition, both expected and unforeseen, can overwhelm advantages. Scaling too quickly strains operations, while scaling too slowly misses market windows. Partnership conflicts distract from business priorities. External factors like economic downturns, regulatory changes, or technological disruption can doom even well-run businesses. Success requires navigating multiple challenges; failure requires only one fatal mistake." },
      { q: "Is it better to start your own business or work for someone else?", answer: "Neither is universally better – it depends on individual circumstances and preferences. Self-employment offers autonomy, potentially unlimited upside, and the satisfaction of building something. However, it involves significant risk, unstable income, long hours, and constant responsibility. Employment provides security, benefits, structured advancement, and freedom from administrative burdens. The choice depends on risk tolerance, financial situation, personality, family obligations, and industry context. Some people thrive on entrepreneurial challenge; others flourish in organisational environments. The calculus changes over a lifetime – security may matter more with dependents, while risk tolerance might be higher when young. Neither path guarantees satisfaction or success." }
    ]
  },
  {
    id: 27,
    topic: "Laws and Society",
    relatedPart2: 27,
    questions: [
      { q: "Should all laws be the same for everyone?", answer: "In principle, equality before the law is fundamental to justice – no one should be above the law, and similar cases should be treated similarly. However, genuine equality sometimes requires recognising differences. Children cannot be held to adult standards. People with certain disabilities may need accommodations that others don't. Genuine need might justify treating the poor differently from the wealthy regarding fines. The distinction is between unjust discrimination – arbitrary differences based on irrelevant characteristics – and justified differentiation that promotes substantive equality. Laws should treat everyone equally in their fundamental rights while recognising that identical treatment sometimes produces unequal outcomes." },
      { q: "Why do people break laws?", answer: "Motivations are diverse. Economic necessity drives some crime – desperate people make desperate choices. Some laws are widely viewed as unjust, reducing compliance. Impulsivity and poor decision-making, sometimes linked to age, substances, or mental health, lead to law-breaking. Criminal subcultures normalise illegal behaviour within certain communities. Opportunity combined with low likelihood of consequences encourages violation. Some people simply miscalculate, believing they won't be caught. Certain personalities are genuinely antisocial. However, understanding motivations shouldn't excuse harmful behaviour – it should inform prevention and rehabilitation strategies that address root causes rather than only punishing symptoms." },
      { q: "How can society encourage people to obey laws?", answer: "Multiple approaches work together. Effective enforcement with appropriate consequences creates deterrence, though severity matters less than certainty of being caught. Legitimate laws that citizens perceive as fair generate more compliance than those seen as unjust. Education about laws and their purposes builds understanding. Social norms that reinforce legal compliance create informal pressure. Reducing inequality and desperation removes some motivations for law-breaking. Rehabilitation and reintegration programs prevent recidivism more effectively than purely punitive approaches. Ultimately, people obey laws most reliably when they feel part of the society those laws protect – alienation breeds disregard for rules made by perceived outsiders." },
      { q: "Do you think punishment for crimes should be more or less severe?", answer: "Research suggests the relationship between severity and deterrence is weaker than intuition suggests. Certainty of punishment matters more than severity – potential offenders don't typically calculate sentences carefully. Excessive sentences create injustice and enormous costs without proportionate benefits. However, inadequate consequences fail to express society's condemnation of serious wrongs and may leave victims feeling justice wasn't served. The most effective approaches combine appropriate accountability with rehabilitation, restitution, and reintegration. Focusing on outcomes rather than retribution – reducing future crime, repairing harm, restoring offenders to productive citizenship – should guide policy. Different crimes warrant different responses; violence requires different treatment than property crimes or regulatory violations." }
    ]
  }
];

const grammarLessons = [
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
const Logo = ({ onClick }) => (
  <div onClick={onClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <img 
      src="/logo.png" 
      alt="IELTS Wiz" 
      style={{
        height: '80px',
        width: 'auto',
        objectFit: 'contain',
      }}
    />
  </div>
);

// ==================== NAVIGATION ====================
const Navigation = ({ currentPage, setCurrentPage }) => {
  const { user, profile, signOut } = useAuth();
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
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo onClick={() => setCurrentPage('home')} />
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
          <ThemeToggle />
          {user ? (
            <>
              <button onClick={() => setCurrentPage('dashboard')} style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>Dashboard</button>
              <div onClick={() => signOut().then(() => setCurrentPage('home'))} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple-500), var(--purple-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', color: 'white' }}>
                {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <button onClick={() => setCurrentPage('login')} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))', color: 'white', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>Sign In</button>
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

// ==================== 80 LISTENING TESTS DATA ====================
const listeningTestsData = {
  part1: [
    {
      id: 1,
      title: "Preston Park Run",
      formTitle: "PRESTON PARK RUN",
      formSubtitle: "Details of run",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Start of run: in front of the", answer: "café" },
        { num: 2, text: "Time of start:", answer: "9 am" },
        { num: 3, text: "Length of run:", answer: "5 km" },
        { num: 4, text: "At end of run: volunteer scans", answer: "barcode" },
        { num: 5, text: "Best way to register: on the", answer: "website" },
        { num: 6, text: "Cost of run:", answer: "free" },
        { num: 7, text: "Contact name: Pete", answer: "Maughan" },
        { num: 8, text: "Phone number:", answer: "07732 445901" },
        { num: 9, text: "Activities: setting up course,", answer: "guiding" },
        { num: 10, text: "_______ for the weekly report", answer: "photography" },
      ]
    },
    {
      id: 2,
      title: "Short Story Competition",
      formTitle: "SHORT STORY COMPETITION",
      formSubtitle: "Entry Details",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Length of story: approximately", answer: "2000 words" },
        { num: 2, text: "Story must include: a", answer: "journey" },
        { num: 3, text: "Minimum age:", answer: "18" },
        { num: 4, text: "Last entry date: 1st", answer: "September" },
        { num: 5, text: "Web address: www.______.com", answer: "shortstory" },
        { num: 6, text: "Don't _______ the story to the organisers", answer: "email" },
        { num: 7, text: "The competition is judged by", answer: "professional writers" },
        { num: 8, text: "The top five stories will be available", answer: "online" },
        { num: 9, text: "The top story will be chosen by the", answer: "public" },
        { num: 10, text: "The first prize is a place at a writers' workshop in", answer: "Paris" },
      ]
    },
    {
      id: 3,
      title: "Sarah's Health & Fitness Club",
      formTitle: "SARAH'S HEALTH & FITNESS CLUB",
      formSubtitle: "Membership Application",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Last name:", answer: "Symonds" },
        { num: 2, text: "Year of birth:", answer: "1996" },
        { num: 3, text: "Type of Membership:", answer: "gold" },
        { num: 4, text: "Activities: Badminton and", answer: "swimming" },
        { num: 5, text: "To be paid", answer: "monthly" },
        { num: 6, text: "What exercise do you do regularly?", answer: "jogging" },
        { num: 7, text: "Do you have any injuries? has a", answer: "bad ankle" },
        { num: 8, text: "What is your goal? a better", answer: "fitness level" },
        { num: 9, text: "What is your occupation? a", answer: "charity worker" },
        { num: 10, text: "How did you hear about the club?", answer: "friend" },
      ]
    },
    {
      id: 4,
      title: "Community Centre Evening Classes",
      formTitle: "COMMUNITY CENTRE",
      formSubtitle: "Evening Classes Information",
      instruction: "Write NO MORE THAN ONE WORD AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Painting: at _______ pm on Tuesdays", answer: "7" },
        { num: 2, text: "What to bring: water jar and set of", answer: "brushes" },
        { num: 3, text: "Maori: in the small room at the _______ of the building", answer: "back" },
        { num: 4, text: "Maori language: starts in", answer: "October" },
        { num: 5, text: "Photography: the _______ for the camera", answer: "manual" },
        { num: 6, text: "Photography cost: £_______ – eight classes", answer: "" },
        { num: 7, text: "The watercolours class suits people who are", answer: "beginners" },
        { num: 8, text: "To find out about the Maori class, contact Jason", answer: "Woodhouse" },
        { num: 9, text: "For photography, check the _______ for the camera", answer: "settings" },
        { num: 10, text: "There is a trip to a local _______ in the final week", answer: "gallery" },
      ]
    },
    {
      id: 5,
      title: "City Transport Lost Property",
      formTitle: "CITY TRANSPORT LOST PROPERTY",
      formSubtitle: "Enquiry Form",
      instruction: "Write ONE WORD AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Description: black with thin _______ stripes", answer: "white" },
        { num: 2, text: "Other items: a set of _______ keys", answer: "office" },
        { num: 3, text: "a _______ in a box", answer: "camera" },
        { num: 4, text: "a blue", answer: "umbrella" },
        { num: 5, text: "Date and time: 2.00-2.30 pm on", answer: "13th May" },
        { num: 6, text: "Basic route: from the _______ to Highbury", answer: "airport" },
        { num: 7, text: "Mode of travel: left the suitcase in a", answer: "taxi" },
        { num: 8, text: "Name: Lisa", answer: "Docherty" },
        { num: 9, text: "Address: 15A _______ Rd, Highbury", answer: "River" },
        { num: 10, text: "Phone number:", answer: "" },
      ]
    },
    { id: 6, title: "Accommodation Form: Rental Properties", formTitle: "RENTAL PROPERTIES", formSubtitle: "Client Requirements", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 7, title: "Hostel Accommodation in Darwin", formTitle: "DARWIN HOSTEL BOOKING", formSubtitle: "Reservation Details", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 8, title: "Hilary Lodge Retirement Home", formTitle: "HILARY LODGE", formSubtitle: "Enquiry Form", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 9, title: "Transport from Airport to Milton", formTitle: "AIRPORT TRANSFER SERVICE", formSubtitle: "Booking Information", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 10, title: "Car Insurance", formTitle: "CAR INSURANCE QUOTE", formSubtitle: "Application Details", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 11, title: "Holiday Rental Enquiry", formTitle: "HOLIDAY RENTAL ENQUIRY", formSubtitle: "Property Details", instruction: "Write ONE WORD AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 12, title: "Homestay Application", formTitle: "HOMESTAY APPLICATION", formSubtitle: "Student Information", instruction: "Write ONE WORD AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 13, title: "Hotel Booking", formTitle: "HOTEL RESERVATION", formSubtitle: "Booking Details", instruction: "Write ONE WORD AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 14, title: "Total Insurance Incident Report", formTitle: "INCIDENT REPORT", formSubtitle: "Claim Details", instruction: "Write NO MORE THAN THREE WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 15, title: "Rented Properties Requirements", formTitle: "RENTAL REQUIREMENTS", formSubtitle: "Client Preferences", instruction: "Write ONE WORD AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 16, title: "West Bay Hotel Job", formTitle: "JOB APPLICATION", formSubtitle: "West Bay Hotel", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 17, title: "Restaurant Job Enquiry", formTitle: "RESTAURANT VACANCY", formSubtitle: "Position Details", instruction: "Write NO MORE THAN THREE WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 18, title: "Student Accommodation Form", formTitle: "STUDENT HOUSING", formSubtitle: "Application Form", instruction: "Write ONE WORD AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 19, title: "Holiday Apartments Comparison", formTitle: "APARTMENT COMPARISON", formSubtitle: "Feature Summary", instruction: "Write ONE WORD AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 20, title: "Health Centres Information", formTitle: "HEALTH CENTRES", formSubtitle: "Service Information", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
  ],
  part2: [
    { id: 21, title: "Pacton-on-Sea Bus Tour", formTitle: "BUS TOUR", formSubtitle: "Tour Information", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 22, title: "Sea Life Centre Information", formTitle: "SEA LIFE CENTRE", formSubtitle: "Visitor Information", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 23, title: "Hotel Event Planning", formTitle: "HOTEL EVENT", formSubtitle: "Planning Details", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 24, title: "Volunteer Conservation Work", formTitle: "CONSERVATION WORK", formSubtitle: "Volunteer Programme", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 25, title: "Town Map Directions", formTitle: "TOWN MAP", formSubtitle: "Location Guide", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 26, title: "Neighbourhood Safety Talk", formTitle: "NEIGHBOURHOOD SAFETY", formSubtitle: "Community Meeting", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 27, title: "Anglia Sculpture Park", formTitle: "SCULPTURE PARK", formSubtitle: "Visitor Guide", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 28, title: "Learning Resource Centre", formTitle: "RESOURCE CENTRE", formSubtitle: "Floor Plan", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 29, title: "PS Camping Holidays", formTitle: "CAMPING HOLIDAYS", formSubtitle: "Package Details", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 30, title: "City Development Plan", formTitle: "CITY DEVELOPMENT", formSubtitle: "Planning Proposal", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 31, title: "Sponsored Walking Holiday", formTitle: "WALKING HOLIDAY", formSubtitle: "Tour Details", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 32, title: "City Walking Tour", formTitle: "CITY TOUR", formSubtitle: "Walking Route", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 33, title: "The Dinosaur Museum", formTitle: "DINOSAUR MUSEUM", formSubtitle: "Exhibition Guide", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 34, title: "Wildlife Park Tour", formTitle: "WILDLIFE PARK", formSubtitle: "Tour Information", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 35, title: "The National Arts Centre", formTitle: "ARTS CENTRE", formSubtitle: "Programme Information", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 36, title: "Red Hill Suburb Improvements", formTitle: "SUBURB IMPROVEMENTS", formSubtitle: "Development Plan", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 37, title: "Sports World Store", formTitle: "SPORTS WORLD", formSubtitle: "Store Layout", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 38, title: "Parks and Open Spaces", formTitle: "PARKS & OPEN SPACES", formSubtitle: "Area Guide", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 39, title: "Winridge Forest Railway Park", formTitle: "RAILWAY PARK", formSubtitle: "Visitor Information", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 40, title: "Water Heater Instructions", formTitle: "WATER HEATER", formSubtitle: "Operating Instructions", instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
  ],
  part3: [
    { id: 41, title: "Computer System Discussion", formTitle: "COMPUTER SYSTEM", formSubtitle: "Discussion Notes", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 42, title: "University Subject Choices", formTitle: "SUBJECT CHOICES", formSubtitle: "Discussion", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 43, title: "Paper Production & Recycling", formTitle: "PAPER RECYCLING", formSubtitle: "Process Notes", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 44, title: "Food Waste Discussion", formTitle: "FOOD WASTE", formSubtitle: "Discussion Points", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 45, title: "Furniture Rossi Case Study", formTitle: "CASE STUDY", formSubtitle: "Business Analysis", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 46, title: "Biofuels Presentation", formTitle: "BIOFUELS", formSubtitle: "Presentation Notes", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 47, title: "Instant Coffee Marketing", formTitle: "COFFEE MARKETING", formSubtitle: "Case Study", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 48, title: "Museum Training Film", formTitle: "MUSEUM TRAINING", formSubtitle: "Film Discussion", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 49, title: "Individual Differences at Work", formTitle: "WORKPLACE DIFFERENCES", formSubtitle: "Lecture Notes", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 50, title: "Antarctic Centre Christchurch", formTitle: "ANTARCTIC CENTRE", formSubtitle: "Discussion", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 51, title: "Ocean Research Float Project", formTitle: "OCEAN RESEARCH", formSubtitle: "Project Discussion", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 52, title: "Geography Presentation", formTitle: "GEOGRAPHY", formSubtitle: "Presentation Notes", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 53, title: "Field Trip Proposal", formTitle: "FIELD TRIP", formSubtitle: "Planning Discussion", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 54, title: "Honey Bees in Australia", formTitle: "HONEY BEES", formSubtitle: "Research Discussion", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 55, title: "Latin American Studies", formTitle: "LATIN AMERICAN STUDIES", formSubtitle: "Course Discussion", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 56, title: "Course Financing Discussion", formTitle: "COURSE FINANCING", formSubtitle: "Student Discussion", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 57, title: "Marketing Course Feedback", formTitle: "MARKETING COURSE", formSubtitle: "Feedback Session", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 58, title: "Self-Access Centre", formTitle: "SELF-ACCESS CENTRE", formSubtitle: "Orientation", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 59, title: "Study Skills Tutorial", formTitle: "STUDY SKILLS", formSubtitle: "Tutorial Notes", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 60, title: "International Student Experience", formTitle: "STUDENT EXPERIENCE", formSubtitle: "Discussion", instruction: "Write NO MORE THAN TWO WORDS for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
  ],
  part4: [
    { id: 61, title: "Ceramics History", formTitle: "CERAMICS HISTORY", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 62, title: "Preparing a Presentation", formTitle: "PRESENTATION SKILLS", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 63, title: "Facts About Hair", formTitle: "HAIR FACTS", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 64, title: "Maori Kite-Making", formTitle: "KITE-MAKING", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 65, title: "Rock Art Research", formTitle: "ROCK ART", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 66, title: "Weak-Tie Theory", formTitle: "WEAK-TIE THEORY", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 67, title: "History of Fireworks in Europe", formTitle: "FIREWORKS HISTORY", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 68, title: "New Caledonian Crows", formTitle: "CROW RESEARCH", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 69, title: "Seminar on Rock Art", formTitle: "ROCK ART SEMINAR", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 70, title: "Handedness in Sport", formTitle: "HANDEDNESS", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 71, title: "Hotels and Tourism", formTitle: "TOURISM INDUSTRY", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 72, title: "Monosodium Glutamate (MSG)", formTitle: "MSG RESEARCH", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 73, title: "Geography Lecture", formTitle: "GEOGRAPHY LECTURE", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 74, title: "Research on Doctors", formTitle: "MEDICAL RESEARCH", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 75, title: "Repeating Business Success", formTitle: "BUSINESS SUCCESS", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 76, title: "Aboriginal Rock Paintings", formTitle: "ROCK PAINTINGS", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 77, title: "Mass Strandings of Whales", formTitle: "WHALE STRANDINGS", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 78, title: "Business Cultures", formTitle: "BUSINESS CULTURES", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 79, title: "Underground House Design", formTitle: "UNDERGROUND HOUSES", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
    { id: 80, title: "Wildlife in City Gardens", formTitle: "URBAN WILDLIFE", formSubtitle: "Lecture Notes", instruction: "Write ONE WORD ONLY for each answer.", questions: Array(10).fill(null).map((_, i) => ({ num: i+1, text: "Question " + (i+1), answer: "" })) },
  ]
};

// ==================== LISTENING PAGE ====================
const ListeningPage = ({ subPage, setSubPage }) => {
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
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>80 TESTS</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {currentTests.map((test, index) => (
                <div
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
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

// ==================== PLACEHOLDER PAGES ====================
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
  const { user, profile, signOut } = useAuth();
  if (!user) return null;
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Welcome, <span style={{ color: 'var(--purple-400)' }}>{profile?.name || 'Student'}</span></h1>
            <p style={{ color: 'var(--text-secondary)' }}>Target: Band {profile?.target_score || 7.0}</p>
          </div>
          <button onClick={() => signOut().then(() => setCurrentPage('home'))} style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Sign Out</button>
        </div>
        <div style={{ padding: '2rem', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Continue Learning</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[{ label: 'Listening', page: 'listening', icon: '🎧' }, { label: 'Reading', page: 'reading', icon: '📖' }, { label: 'Writing', page: 'writing', icon: '✍️' }, { label: 'Speaking', page: 'speaking', icon: '🎤' }].map((action) => (
              <button key={action.page} onClick={() => setCurrentPage(action.page)} style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{action.icon}</span><span style={{ fontWeight: '500' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== HOME PAGE ====================
const HomePage = ({ setCurrentPage }) => (<><HeroSection setCurrentPage={setCurrentPage} /><SkillsSection setCurrentPage={setCurrentPage} /></>);

// ==================== MAIN APP ====================
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [speakingSubPage, setSpeakingSubPage] = useState('overview');
  const [listeningSubPage, setListeningSubPage] = useState('overview');
  const { loading } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage setCurrentPage={setCurrentPage} />;
      case 'speaking': return <SpeakingPage subPage={speakingSubPage} setSubPage={setSpeakingSubPage} />;
      case 'listening': return <ListeningPage subPage={listeningSubPage} setSubPage={setListeningSubPage} />;
      case 'grammar': return <GrammarPage />;
      case 'reading': return <PlaceholderPage title="Reading Section" description="Passage analysis and practice questions. Coming soon!" icon="📖" />;
      case 'writing': return <PlaceholderPage title="Writing Section" description="Task 1 & Task 2 with model essays. Coming soon!" icon="✍️" />;
      case 'login': return <AuthPage type="login" setCurrentPage={setCurrentPage} />;
      case 'signup': return <AuthPage type="signup" setCurrentPage={setCurrentPage} />;
      case 'dashboard': return <Dashboard setCurrentPage={setCurrentPage} />;
      default: return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  // Reset sub-pages when changing main page
  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (page === 'speaking') setSpeakingSubPage('overview');
    if (page === 'listening') setListeningSubPage('overview');
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><div className="spinner" /></div>;

  return <div><Navigation currentPage={currentPage} setCurrentPage={handlePageChange} />{renderPage()}</div>;
};

const AppWithProviders = () => (<ThemeProvider><AuthProvider><App /></AuthProvider></ThemeProvider>);

export default AppWithProviders;
