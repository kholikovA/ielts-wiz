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
      { q: "What skills do you think will be most important in the future?", answer: "That's a great question. I'd say adaptability is probably the biggest one – you know, being able to learn new things quickly because technology keeps changing everything. And honestly, I think critical thinking will matter a lot too. Like, with AI doing more routine work, humans need to focus on creative problem-solving." },
      { q: "Why do some people find it harder to learn new skills than others?", answer: "Well, there are a few reasons. Some people have this fear of failing which holds them back. Others might've had bad experiences in school. And let's be honest – if you're working full-time and have kids, finding time to learn something new is really tough." },
      { q: "Do you think schools focus enough on practical skills?", answer: "Mm, not really, in my opinion. I left school not knowing how to do taxes or manage money properly. Schools teach lots of theory, but there's definitely a gap when it comes to real-world stuff like communication skills or working with other people." },
      { q: "Is it better to learn skills formally through courses or informally by yourself?", answer: "I think it depends on what you're learning. For something like coding, you can totally teach yourself online. But for other things – medicine, obviously – you need proper training. Personally, I like a mix. Get the basics from a course, then practice on your own." }
    ]
  },
  {
    id: 2,
    topic: "Crowded Places",
    relatedPart2: 2,
    questions: [
      { q: "Why do some people enjoy being in crowded places while others don't?", answer: "I think it's mostly about personality. Some people – extroverts – get energised by busy environments. They love the buzz. Others find it draining. I'm somewhere in between, actually. It also depends on the situation – a concert crowd feels different from being stuck in a packed train." },
      { q: "How do you think cities can deal with overcrowding?", answer: "There's no easy fix, is there? But better public transport would help massively. And encouraging people to work from home – that's already made a difference. Some places are trying to spread things out more, so not everything's crammed into one central area." },
      { q: "Do you think overcrowding affects people's mental health?", answer: "Yeah, I think it definitely can. When you never get personal space, it's bound to stress you out. I've read that people in really crowded housing feel more anxious. Though humans are pretty adaptable – city dwellers seem to find ways to cope." },
      { q: "Are there benefits to living in densely populated areas?", answer: "Oh, absolutely. More people means more restaurants, more shops, better transport. And there's the social side – you meet all sorts of different people. Plus, funnily enough, it can be more environmentally friendly because you don't need a car." }
    ]
  },
  {
    id: 3,
    topic: "Helping Others",
    relatedPart2: 3,
    questions: [
      { q: "Why do some people like helping others?", answer: "Well, honestly, it just feels good, doesn't it? There's that warm feeling you get when you help someone out. For some people it's religious or cultural values. And people who've struggled themselves are often more likely to help others in similar situations." },
      { q: "Do you think governments should do more to help people in need?", answer: "That's tricky because it depends where you draw the line. I mean, yes, there should be a safety net – for people who genuinely can't help themselves. But you don't want to create dependency either. The best programs help people get back on their feet." },
      { q: "Is it important to teach children to help others?", answer: "Definitely. Kids who learn to think about others tend to grow into more empathetic adults. It's best learned by doing – volunteering together as a family, that sort of thing. Schools can help too, but I think it starts at home really." },
      { q: "How has technology changed the way people help each other?", answer: "Massively! Think about crowdfunding – you can help someone on the other side of the world. Social media spreads awareness quickly. Though I do worry sometimes that people just share things and feel like they've done their bit, when nothing much has changed." }
    ]
  },
  {
    id: 4,
    topic: "Reading and Books",
    relatedPart2: 4,
    questions: [
      { q: "Do you think people read less now than in the past?", answer: "It's interesting, actually. People probably read fewer books, but we're constantly reading – texts, emails, social media, articles. The difference is the depth. We skim a lot more than we used to. Whether that's worse depends on how you look at it." },
      { q: "Why do some people prefer e-books while others prefer physical books?", answer: "E-books are just so convenient – you can carry hundreds on one device. But there's something about holding a real book, isn't there? The feel of it, seeing how far you've got. I use both – e-books when travelling, real books at home." },
      { q: "How can parents encourage children to read more?", answer: "The biggest thing is leading by example – if kids see parents reading, they're more likely to pick it up. Making books accessible, letting them choose what they want. And limiting screen time helps too, obviously." },
      { q: "Do you think bookshops will survive in the future?", answer: "I hope so! The ones doing well seem to create an experience – nice café, author events, helpful staff. You can't get that from Amazon. Big chains might struggle, but local independent bookshops with loyal customers should be alright." }
    ]
  },
  {
    id: 5,
    topic: "Goals and Ambitions",
    relatedPart2: 5,
    questions: [
      { q: "Do you think ambitious people are more likely to succeed?", answer: "Generally yes, but it depends how you define success. Ambitious people set bigger goals and work harder. But someone with modest goals who achieves them and is happy – isn't that success too? Plus, extreme ambition without principles can lead to harmful things." },
      { q: "Why do some people give up on their goals easily?", answer: "Often it's because they set unrealistic goals to begin with. Or they didn't plan properly – big dream but no actual steps. Life gets in the way too. Sometimes giving up isn't failure though – it's just realising something isn't right for you." },
      { q: "How important is it to have long-term goals in life?", answer: "I think having some direction is important – otherwise you're just drifting. But holding on too rigidly can be a problem. Life changes, you change. Having a general direction but being flexible about how you get there seems best." },
      { q: "Should parents set goals for their children?", answer: "They should help children develop goal-setting skills, definitely. But imposing specific goals – like 'you must be a doctor' – that's problematic. Kids need to find their own path. Parents can support whatever interests emerge, but goals should come from the child." }
    ]
  },
  {
    id: 6,
    topic: "Inspiration and Role Models",
    relatedPart2: 6,
    questions: [
      { q: "Do you think celebrities make good role models?", answer: "Some do, some don't. There are celebrities who use their fame for good. But celebrity culture often promotes shallow values – looks, money, fame. I think better role models are usually people you actually know, who you can see dealing with real life." },
      { q: "Why do people need role models?", answer: "We're social creatures – we learn by watching others. Role models show us what's possible and give us something to aspire to. They're especially important for young people or anyone trying to achieve something in a field where they don't see people like themselves." },
      { q: "How has social media changed the way we think about inspiration?", answer: "It's a double-edged sword. You can find inspiration from ordinary people sharing their journeys. But there's so much fake perfection – highlight reels that make everyone feel inadequate. Sometimes people scroll through inspirational content instead of actually doing anything." },
      { q: "Can people be inspired by failure as well as success?", answer: "Absolutely – maybe even more so. Seeing how someone bounces back from failure is way more useful than watching someone succeed effortlessly. Failure stories are relatable. They show the path isn't straight and setbacks aren't the end." }
    ]
  },
  {
    id: 7,
    topic: "News and Media",
    relatedPart2: 7,
    questions: [
      { q: "How has the way people get news changed in recent years?", answer: "Dramatically! People used to wait for the evening news. Now it's constant – on your phone, social media, everywhere. The sources have multiplied too. Anyone can become a news source now, which has good and bad sides." },
      { q: "Do you think social media is a reliable source of news?", answer: "Generally, no. Things spread because they're sensational, not because they're accurate. There's no fact-checking before something goes viral. Social media can surface stories media ignores though. The key is verifying things before believing them." },
      { q: "Is it important for people to keep up with current events?", answer: "To some extent – you need to know enough to vote sensibly. But constantly following news, especially negative news, isn't healthy. I try to stay informed without becoming obsessed with checking headlines every hour." },
      { q: "How can people identify fake news?", answer: "Check the source – is it reputable? Look for the same story elsewhere. Be suspicious of anything that makes you really emotional – fake news is designed to provoke. And honestly, just slow down before sharing." }
    ]
  },
  {
    id: 8,
    topic: "Elderly People",
    relatedPart2: 8,
    questions: [
      { q: "How should society treat elderly people?", answer: "With respect and dignity, obviously. But also recognising they still have lots to contribute. It's about balance between providing care and not treating them like children. Loneliness is huge for older people, so including them in society matters." },
      { q: "Why do some cultures respect the elderly more than others?", answer: "In traditional societies, older people held valuable knowledge. In fast-changing modern cultures, there's this attitude that older people are out of touch. Religious and family values play a role too. Extended families naturally keep generations connected." },
      { q: "Do you think life is better for old people now than in the past?", answer: "In some ways – healthcare is better, people live longer and healthier. But there's more isolation now. Older people used to live with families; now many live alone. So physically better off, perhaps, but socially more complicated." },
      { q: "What problems do elderly people face in modern society?", answer: "Loneliness is a big one – it can literally make you sick. Technology can be a barrier too; everything's online but not everyone can keep up. Financial worries, inadequate care options, age discrimination... it's quite a long list unfortunately." }
    ]
  },
  {
    id: 9,
    topic: "Tourism and Travel",
    relatedPart2: 9,
    questions: [
      { q: "What are the advantages and disadvantages of tourism for a country?", answer: "The advantages are obvious – jobs, money, infrastructure development. But over-tourism can ruin the very places people want to see. Local prices go up, traditional communities get displaced. It's about finding a balance." },
      { q: "How has tourism changed over the past few decades?", answer: "It's become so much more accessible. Budget airlines, online booking – travel used to be for the wealthy, now ordinary families can go abroad. Social media changed things too – places become famous overnight because of Instagram." },
      { q: "Do you think tourism will change in the future?", answer: "Probably. Climate concerns might make people think twice about long flights. Sustainable tourism is growing – people want authentic experiences, not just ticking off famous sites. Virtual reality might play a role, though I'm not sure it could replace actually being somewhere." },
      { q: "Is ecotourism really good for the environment?", answer: "In theory, yes – if done properly. Real ecotourism funds conservation and educates visitors. But the term gets used as marketing when reality doesn't match. Getting tourists to pristine areas inevitably has some impact, even with good intentions." }
    ]
  },
  {
    id: 10,
    topic: "Patience",
    relatedPart2: 10,
    questions: [
      { q: "Why do some people find it difficult to be patient?", answer: "We're kind of wired for instant gratification, aren't we? And modern life makes it worse – we can get almost anything immediately. Fast food, streaming, same-day delivery. Some people naturally have more patience than others too." },
      { q: "Do you think patience is a skill that can be learned?", answer: "Yeah, I think so. Meditation seems to help people become more patient. Even just practising waiting – putting your phone away instead of checking it constantly – can build tolerance. It's uncomfortable at first but you get better." },
      { q: "Has technology made people less patient?", answer: "Almost certainly. When you can Google anything instantly, waiting even a few seconds feels annoying. Social media conditions us to expect constant stimulation. Though some apps try to help with patience – meditation apps, for example." },
      { q: "Are there situations where being impatient is actually a good thing?", answer: "Definitely. Impatience with injustice drives social change. In emergencies, you need to act fast. And in competitive situations, being too patient means missing opportunities. It's about knowing when patience is a virtue and when it's not." }
    ]
  },
  {
    id: 11,
    topic: "Success and Achievement",
    relatedPart2: 11,
    questions: [
      { q: "How do people measure success in your country?", answer: "Money, mostly, if I'm honest. Career status, property ownership, that kind of thing. Though younger generations seem to value work-life balance more. There's still pressure from older generations though, and success tends to be materialistically defined." },
      { q: "What factors contribute to people achieving their goals?", answer: "Hard work matters, obviously, but so does luck and circumstance – where you're born, what opportunities you have. Support systems help too – having people who believe in you. And setting realistic goals with clear steps rather than vague dreams." },
      { q: "Do you think successful people have a responsibility to help others?", answer: "I think there's something to that, yeah. If you've benefited from society or luck, giving something back seems right. But it shouldn't be forced. The best help comes from genuinely wanting to, not from obligation." },
      { q: "Is it possible to be successful without working hard?", answer: "Some people get lucky – inherit money, win the lottery. But usually, even 'overnight successes' have years of hard work behind them. Sustainable success almost always involves effort. Whether pure luck counts as real success is another question." }
    ]
  },
  {
    id: 12,
    topic: "Working Together",
    relatedPart2: 12,
    questions: [
      { q: "What are the benefits of people working together as a team?", answer: "You get different perspectives and skills coming together. One person's weakness might be another's strength. And honestly, working with others is often more enjoyable – you can bounce ideas around, share the load when things get tough." },
      { q: "How can conflicts be resolved when people work together?", answer: "Communication is key – talking things through before they escalate. Trying to understand where the other person's coming from rather than just defending your position. Sometimes you need someone neutral to help see the issue differently." },
      { q: "Are some people naturally better at teamwork than others?", answer: "Probably. Some people just find it easier to collaborate, to let others take credit. But I think teamwork skills can be learned too. Someone quite individualistic can become better at teamwork with practice and the right environment." },
      { q: "Do you think schools prepare students well for working in teams?", answer: "There's more group work now, which is good. But often one person ends up doing all the work, which defeats the purpose. Good team projects need structure and accountability. Some schools do it well, others not so much." }
    ]
  },
  {
    id: 13,
    topic: "Money and Spending",
    relatedPart2: 13,
    questions: [
      { q: "Do you think people spend too much money on unnecessary things?", answer: "A lot of people do, yeah. Advertising is so good at making you feel like you need stuff. And social media creates pressure to have the latest things. But what's 'unnecessary' is subjective – one person's waste might be another's joy." },
      { q: "Should parents give children money as pocket money?", answer: "I think so. It's a good way to teach money management. Kids can learn about saving, making choices, dealing with consequences. The amount matters less than having consistency and talking about money openly." },
      { q: "Why do some people save money while others prefer to spend it immediately?", answer: "Some of it's personality – some people are naturally cautious. Upbringing plays a role too – if your parents were savers, you probably picked that up. And your financial situation matters – it's easier to save when basics are covered." },
      { q: "Do you think attitudes towards money differ between generations?", answer: "Definitely. Older generations tend to be more careful, having lived through tougher times perhaps. Younger people are accused of being frivolous, but they face different challenges – house prices, job security. Priorities shift." }
    ]
  },
  {
    id: 14,
    topic: "Nature and Environment",
    relatedPart2: 14,
    questions: [
      { q: "Why is it important for people to spend time in nature?", answer: "There's loads of research showing it reduces stress and improves mental health. Being around trees and greenery calms people down. And I think there's something deeper – we evolved in nature, and modern life can feel very artificial." },
      { q: "Do you think enough is being done to protect the environment?", answer: "Honestly, no. There's lots of talk and some action, but the scale of the problem is huge and responses feel slow. Individual efforts help, but without big changes from governments and corporations, it's not enough." },
      { q: "How can we encourage people to be more environmentally conscious?", answer: "Making it easy helps – good recycling systems, affordable public transport. Education from a young age. And honestly, seeing consequences makes people care more. When people experience extreme weather, they start taking climate change seriously." },
      { q: "What are the main environmental problems facing your country?", answer: "Air pollution in cities is big. Waste management – too much going to landfill. Water quality in some areas. And like everywhere, we're contributing to climate change. There's been progress but plenty more to do." }
    ]
  },
  {
    id: 15,
    topic: "Change and Progress",
    relatedPart2: 15,
    questions: [
      { q: "Why do some people resist change?", answer: "Change is uncomfortable – it means leaving familiar territory. Some people are naturally more risk-averse. And sometimes resistance is sensible – not all change is good. People often push back when change is imposed rather than chosen." },
      { q: "Do you think all changes in society have been positive?", answer: "Definitely not. Some changes bring problems we didn't anticipate. Social media connected us but created new mental health issues. Economic changes lifted many out of poverty but increased inequality. Progress is messy and mixed." },
      { q: "How do people adapt to major changes in their lives?", answer: "It varies hugely. Some people are naturally adaptable; others struggle more. Support from family and friends helps. Time helps too – even big changes become normal eventually. Having some control over the change makes a difference." },
      { q: "Is technological progress always beneficial?", answer: "Not always. Every technology can be used well or badly. Nuclear energy can power cities or destroy them. The internet educates but also spreads misinformation. We need to think more carefully about how we use technology." }
    ]
  },
  {
    id: 16,
    topic: "Communication",
    relatedPart2: 16,
    questions: [
      { q: "How has technology changed the way people communicate?", answer: "Massively. We can reach anyone anywhere instantly now. But communication is often shorter, more visual, more public. Face-to-face conversations might be declining. Whether that's better or worse is debatable." },
      { q: "Do you think face-to-face communication is still important?", answer: "Absolutely. You miss so much without it – body language, tone, real presence. Deep relationships are hard to build through screens alone. Most people feel this, which is why we still meet up despite being able to video call." },
      { q: "Why do some people find it difficult to express themselves?", answer: "Confidence is a big factor – fear of being judged or misunderstood. Some people just process internally rather than externally. Cultural and family backgrounds matter too – if you were discouraged from speaking up as a child, it's hard to start as an adult." },
      { q: "Is there too much communication in modern life?", answer: "Sometimes it feels like it, yeah. Constant pings and notifications can be exhausting. We're always reachable, which sounds good but can feel overwhelming. Learning to disconnect is becoming an important skill." }
    ]
  },
  {
    id: 17,
    topic: "Science and Discovery",
    relatedPart2: 17,
    questions: [
      { q: "Do you think scientific research is important for society?", answer: "Absolutely essential. Vaccines, clean water, electricity, the internet – all from scientific research. Even basic research that doesn't seem useful often leads to breakthroughs later." },
      { q: "Should governments spend more money on science?", answer: "In my view, yes. Science funding is pretty low. Short-term thinking dominates politics, but science often needs long-term investment. Private companies won't fund everything because some research isn't immediately profitable but is still valuable." },
      { q: "Are there any areas of scientific research that concern you?", answer: "AI is both exciting and concerning – we're creating something potentially smarter than us without knowing where it leads. Genetic engineering raises ethical questions. Some weapons research is worrying. The problem is, you can't really stop knowledge from advancing." },
      { q: "Why are some people suspicious of scientists?", answer: "Sometimes scientists have been wrong, or science has been misused. People feel talked down to. And when scientific findings conflict with beliefs or economic interests, there's pushback. Scientists aren't always great at explaining things to non-experts." }
    ]
  },
  {
    id: 18,
    topic: "Art and Creativity",
    relatedPart2: 18,
    questions: [
      { q: "Do you think art is important in society?", answer: "Very much so. Art challenges us, makes us feel things, helps us understand different perspectives. Life without art would be pretty bleak. Even people who say they're not into art usually enjoy music or films or something." },
      { q: "Should governments fund the arts?", answer: "Some funding makes sense, especially for things that wouldn't survive commercially but have cultural value. Museums, community arts programs. But art that's popular should probably support itself. It's about balance." },
      { q: "Why do some people consider themselves not creative?", answer: "Often because school made them feel their creativity wasn't valued. There's this idea that creativity means painting or writing, but it appears in all sorts of ways – problem-solving, cooking, decorating. Most people are more creative than they realise." },
      { q: "Has technology changed how people create and consume art?", answer: "Definitely. Creating art is more accessible – you can make music on your phone. But consuming art has changed too – streaming, social media, everything's more instant. Some say it's democratised art; others worry about attention spans." }
    ]
  },
  {
    id: 19,
    topic: "Health and Lifestyle",
    relatedPart2: 19,
    questions: [
      { q: "Why do you think many people lead unhealthy lifestyles?", answer: "Modern life makes it hard to be healthy. We sit at desks, healthy food is expensive and takes time to prepare, we're stressed. Unhealthy options are convenient and cheap and engineered to be addictive. It's not just about willpower – the environment matters." },
      { q: "Should governments do more to promote healthy living?", answer: "There's a role for government – making healthy choices easier and cheaper. But where's the line? People should have freedom to make their own choices. Maybe education and environment rather than banning things." },
      { q: "Do you think people are more health-conscious now than in the past?", answer: "In some ways, yes. More awareness of nutrition, more people exercising, fewer smokers. But we have new problems – screen time, sedentary jobs, mental health issues. So more conscious perhaps, but not necessarily healthier overall." },
      { q: "How has technology affected people's health?", answer: "Mixed impact. Medical technology has obviously improved health massively. But everyday technology – sitting at computers, looking at phones – creates problems. Mental health and social media is a big topic. Sleep disruption from screens. It's a trade-off." }
    ]
  },
  {
    id: 20,
    topic: "History and Traditions",
    relatedPart2: 20,
    questions: [
      { q: "Why is it important to learn about history?", answer: "To avoid repeating mistakes, mainly. History shows us where things came from, why societies are the way they are. It helps you understand the present and make better decisions. Plus it's just fascinating – human stories across time." },
      { q: "Should old traditions be preserved or allowed to fade away?", answer: "It depends on the tradition. Some are beautiful and meaningful and worth keeping. Others are harmful or just outdated. We shouldn't preserve things just because they're old. But losing all tradition means losing identity and connection to the past." },
      { q: "Do you think modern technology helps preserve cultural heritage?", answer: "In some ways, yes. You can digitise old documents, create virtual museum tours, record traditional music. But technology also accelerates cultural change, which can mean traditional practices get abandoned. It's a double-edged sword." },
      { q: "Are young people less interested in history than previous generations?", answer: "Maybe in traditional academic history. But there's huge interest through other channels – podcasts, YouTube, documentaries. It's just consumed differently. And some topics – social history, forgotten voices – are getting more attention from young people." }
    ]
  },
  {
    id: 21,
    topic: "Social Responsibility",
    relatedPart2: 21,
    questions: [
      { q: "Do you think individuals can make a difference to social problems?", answer: "Small differences, yes. Individual actions add up. But for big problems – poverty, climate change – we need collective action and systemic change. It's not fair to put all responsibility on individuals when governments and corporations have more power." },
      { q: "Should businesses be required to help their local communities?", answer: "There's something appealing about that, but required gets complicated. I think businesses that give back tend to do better anyway – good reputation, loyal employees. Maybe incentives rather than requirements work better." },
      { q: "Why do some people volunteer while others don't?", answer: "Time is the big barrier – not everyone has spare hours. Some volunteer because of values or because they enjoy the social side. People who've been helped often want to help others. Some just never thought about it or don't know how to start." },
      { q: "Do you think wealthy people have more responsibility to help society?", answer: "In a way, yes – they have more capacity. And often their wealth came from using shared resources. But I'm not sure about moral obligation – it's better when giving comes from wanting to. Expecting the wealthy to solve everything lets governments off the hook." }
    ]
  },
  {
    id: 22,
    topic: "Local Area and Community",
    relatedPart2: 22,
    questions: [
      { q: "What makes a good neighbourhood?", answer: "Safety's important. Friendly neighbours who look out for each other. Good local amenities – shops, parks, transport. A mix of people but with community spirit. Clean streets. It's harder to define than you'd think – you know a good neighbourhood when you feel it." },
      { q: "How can communities become closer?", answer: "Shared spaces help – parks, community centres, local events. When people have reasons to interact, relationships form. Social media groups for local areas can help too. But it takes effort and someone willing to organise things." },
      { q: "Do you think community spirit has declined in recent years?", answer: "In some ways, maybe. People are busier, more mobile, spend time online. Fewer people know their neighbours well. But community can form differently now – online groups, interest-based rather than location-based. It's changing rather than just declining." },
      { q: "Should people be involved in local decision-making?", answer: "Definitely. Decisions affect people's daily lives, so they should have a say. Local knowledge is valuable – councils don't always understand what areas need. Though getting people engaged is challenging – most are too busy until something directly affects them." }
    ]
  },
  {
    id: 23,
    topic: "Sports and Exercise",
    relatedPart2: 23,
    questions: [
      { q: "Why do some people prefer watching sports rather than playing them?", answer: "It's easier, for one thing. You can enjoy the skill and drama without effort or injury risk. Some love the social aspect – watching with friends. And not everyone is athletic, but they can still appreciate sport." },
      { q: "Do you think professional athletes are paid too much?", answer: "It seems excessive sometimes, but they're paid what the market supports. Fans pay for tickets, sponsors pay for exposure. It's supply and demand. Whether society should value athletes over nurses... that's a bigger question." },
      { q: "Should schools focus more on physical education?", answer: "I think so, yes. Many kids don't get enough exercise, and habits form young. PE shouldn't just be about competition though – finding activities kids actually enjoy matters. Not everyone likes team sports, so variety is important." },
      { q: "How has technology changed the way people exercise?", answer: "Apps tracking everything, home workouts on YouTube, virtual cycling – so many options now. Wearables make people more aware of how much they move. But technology can also make us more sedentary, so it cuts both ways." }
    ]
  },
  {
    id: 24,
    topic: "Language Learning",
    relatedPart2: 24,
    questions: [
      { q: "Why is learning English important in many countries?", answer: "It's the global language of business, science, the internet. Like it or not, English opens doors. Films, music, research papers – so much is in English. Countries where people speak English well tend to have economic advantages." },
      { q: "What is the best age to start learning a foreign language?", answer: "Younger is generally better – children's brains are more plastic, they pick up pronunciation easily. But adults can learn effectively too, especially if motivated. The best age to start is really just as soon as possible." },
      { q: "Do you think translation technology will make language learning unnecessary?", answer: "For basic communication, maybe it already has. But for real connection, for working deeply in another culture, machines aren't enough. There are nuances that don't translate. Languages won't become unnecessary, but reasons to learn them might shift." },
      { q: "How can languages be preserved in a globalised world?", answer: "Teaching them to children is crucial. Documentation and recording help. Making speakers proud of their heritage language. Government support for minority language education. Technology can actually help – apps for endangered languages, online communities." }
    ]
  },
  {
    id: 25,
    topic: "Music and Culture",
    relatedPart2: 25,
    questions: [
      { q: "What role does music play in different cultures?", answer: "Huge role. Music marks celebrations, rituals, mourning. It preserves stories and history. It brings people together. Every culture has music because it's so fundamental – it crosses language barriers and touches people emotionally in ways words can't." },
      { q: "Do you think music preferences are influenced by where you grow up?", answer: "Definitely. You absorb the music around you as a child. If your parents played classical or hip hop or folk, that shapes your taste. Though with streaming, people are exposed to more variety, so preferences might be less geographically determined now." },
      { q: "Has technology changed how people experience music?", answer: "Completely. We've gone from live only, to records, to CDs, to streaming anything instantly. Music is everywhere, which is amazing but also less special maybe. Going to concerts feels more valuable because it's a genuine experience." },
      { q: "Why do some music styles become popular worldwide while others remain local?", answer: "Catchy beats and simple melodies travel well. English language helps. Marketing and platforms matter – if Spotify pushes something, it spreads. Some music is tied to specific cultural contexts and doesn't translate well without that background." }
    ]
  },
  {
    id: 26,
    topic: "Food and Culture",
    relatedPart2: 26,
    questions: [
      { q: "Why is food such an important part of culture?", answer: "It's tied to identity, memory, tradition. Family recipes passed down, festival dishes, everyday meals. Food rituals bring people together. And honestly, we all have to eat, so it's natural it becomes meaningful. Food tells you a lot about a place." },
      { q: "Do you think globalisation has affected traditional cuisines?", answer: "Definitely. You can get almost any cuisine anywhere now, which is great for variety but maybe dilutes what's local. Some traditional dishes are disappearing as younger generations prefer international options. Though there's a counter-movement valuing local food too." },
      { q: "Should parents teach their children how to cook?", answer: "Absolutely. Cooking is a basic life skill. It's healthier and cheaper than ready meals. And there's the cultural aspect – recipes and traditions passed down. Plus cooking together is a nice way to spend time with kids." },
      { q: "Why are some people willing to spend a lot of money on food?", answer: "For some it's about quality – genuinely better ingredients and skill. Social status plays a role too. The experience matters – ambiance, service, novelty. And for food enthusiasts, it's a hobby they're willing to invest in." }
    ]
  },
  {
    id: 27,
    topic: "Technology and Daily Life",
    relatedPart2: 27,
    questions: [
      { q: "How dependent are people on technology nowadays?", answer: "Very. Try living without your phone for a day – most people would struggle. We rely on technology for communication, navigation, work, entertainment, shopping... everything really. Whether that dependency is good or bad is debatable, but it's definitely real." },
      { q: "Do you think technology has made life better or worse?", answer: "Both, honestly. Medical advances, access to information, connecting with people worldwide – clearly better. But mental health issues from social media, privacy concerns, job losses to automation – real downsides. Technology is neutral; it's how we use it that matters." },
      { q: "Are there any technologies you think we would be better off without?", answer: "That's hard because most have good and bad uses. Maybe some social media features that are deliberately addictive? Weapons of mass destruction, obviously. But even then... the knowledge can't be unlearned. It's about how we choose to use technology." },
      { q: "How do you think technology will change daily life in the future?", answer: "AI will be everywhere – assistants, automation, maybe companions. Probably more virtual and augmented reality. Working from anywhere will be normal. But I hope we keep some tech-free spaces too. The trend seems to be more integration of technology into everything." }
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
      formSubtitle: "Registration Details",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Location: meet in front of the", answer: "café" },
        { num: 2, text: "Day of the week:", answer: "Saturday" },
        { num: 3, text: "Start time:", answer: "9 am" },
        { num: 4, text: "Distance:", answer: "5 km" },
        { num: 5, text: "At finish: volunteers will scan your", answer: "barcode" },
        { num: 6, text: "Registration: best done on the", answer: "website" },
        { num: 7, text: "Participation fee: £", answer: "0" },
        { num: 8, text: "Volunteer contact name: Pete", answer: "Maughan" },
        { num: 9, text: "Phone number:", answer: "07732 445901" },
        { num: 10, text: "Help needed with: photography for the", answer: "weekly report" }
      ]
    },
    {
      id: 2,
      title: "Short Story Competition",
      formTitle: "SHORT STORY COMPETITION",
      formSubtitle: "Entry Requirements",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Maximum word count:", answer: "2000" },
        { num: 2, text: "Story must include: a", answer: "journey" },
        { num: 3, text: "Minimum age of entrants:", answer: "18" },
        { num: 4, text: "Closing date: 1st", answer: "September" },
        { num: 5, text: "Submit entries at: www.", answer: "shortstory" },
        { num: 6, text: "Don't send your story by", answer: "email" },
        { num: 7, text: "Judging panel: professional", answer: "writers" },
        { num: 8, text: "Top five will be published", answer: "online" },
        { num: 9, text: "Winner chosen by: the", answer: "public" },
        { num: 10, text: "First prize: workshop in", answer: "Paris" }
      ]
    },
    {
      id: 3,
      title: "Fitness Club Membership",
      formTitle: "HEALTH & FITNESS CLUB",
      formSubtitle: "New Member Registration",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Surname:", answer: "Symonds" },
        { num: 2, text: "Date of birth: 14th March", answer: "1996" },
        { num: 3, text: "Membership type:", answer: "gold" },
        { num: 4, text: "Main activities: badminton and", answer: "swimming" },
        { num: 5, text: "Payment frequency:", answer: "monthly" },
        { num: 6, text: "Current exercise:", answer: "jogging" },
        { num: 7, text: "Medical issue: problem with", answer: "ankle" },
        { num: 8, text: "Fitness goal: improve", answer: "stamina" },
        { num: 9, text: "Occupation:", answer: "nurse" },
        { num: 10, text: "How did you hear about us: through a", answer: "friend" }
      ]
    },
    {
      id: 4,
      title: "Community Centre Classes",
      formTitle: "COMMUNITY CENTRE",
      formSubtitle: "Evening Class Information",
      instruction: "Write NO MORE THAN ONE WORD AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Watercolour painting: Tuesdays at", answer: "7 pm" },
        { num: 2, text: "Materials: bring brushes and water", answer: "jar" },
        { num: 3, text: "Photography: room at the", answer: "back" },
        { num: 4, text: "Photography starts in:", answer: "October" },
        { num: 5, text: "Bring your camera", answer: "manual" },
        { num: 6, text: "Photography course fee: £", answer: "75" },
        { num: 7, text: "Art class suits:", answer: "beginners" },
        { num: 8, text: "Contact for language class: Jason", answer: "Woodhouse" },
        { num: 9, text: "Check camera", answer: "settings" },
        { num: 10, text: "Final week trip to local", answer: "gallery" }
      ]
    },
    {
      id: 5,
      title: "Lost Property Enquiry",
      formTitle: "LOST PROPERTY OFFICE",
      formSubtitle: "Item Report Form",
      instruction: "Write ONE WORD AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Item lost: suitcase with", answer: "stripes" },
        { num: 2, text: "Contents include:", answer: "keys" },
        { num: 3, text: "Also contains a", answer: "camera" },
        { num: 4, text: "And a blue", answer: "umbrella" },
        { num: 5, text: "Date lost:", answer: "th May" },
        { num: 6, text: "Journey from:", answer: "airport" },
        { num: 7, text: "Lost in a:", answer: "taxi" },
        { num: 8, text: "Name: Lisa", answer: "Docherty" },
        { num: 9, text: "Street name:", answer: "River" },
        { num: 10, text: "Best contact time:", answer: "evening" }
      ]
    },
    {
      id: 6,
      title: "Apartment Rental",
      formTitle: "PROPERTY RENTAL AGENCY",
      formSubtitle: "Tenant Requirements",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Property type:", answer: "apartment" },
        { num: 2, text: "Maximum rent: £", answer: "850" },
        { num: 3, text: "Preferred area:", answer: "centre" },
        { num: 4, text: "Must have:", answer: "parking" },
        { num: 5, text: "Number of bedrooms:", answer: "2" },
        { num: 6, text: "Move-in date: 1st", answer: "December" },
        { num: 7, text: "Current postcode:", answer: "SW1 4PT" },
        { num: 8, text: "Reason for moving:", answer: "new job" },
        { num: 9, text: "Contact phone:", answer: "07855 441290" },
        { num: 10, text: "Best time to call:", answer: "afternoon" }
      ]
    },
    {
      id: 7,
      title: "Hostel Booking",
      formTitle: "CITY BACKPACKER HOSTEL",
      formSubtitle: "Reservation Form",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Room type:", answer: "dormitory" },
        { num: 2, text: "Number of nights:", answer: "5" },
        { num: 3, text: "Arrival date:", answer: "23rd June" },
        { num: 4, text: "Guest surname:", answer: "Thompson" },
        { num: 5, text: "Nationality:", answer: "British" },
        { num: 6, text: "Price per night: $", answer: "25" },
        { num: 7, text: "Breakfast:", answer: "included" },
        { num: 8, text: "Airport pickup:", answer: "yes" },
        { num: 9, text: "Flight arrives:", answer: "am" },
        { num: 10, text: "Dietary requirement:", answer: "vegetarian" }
      ]
    },
    {
      id: 8,
      title: "Retirement Home",
      formTitle: "HILLCREST LODGE",
      formSubtitle: "Information Request",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Room type preferred:", answer: "single" },
        { num: 2, text: "Building has floors:", answer: "3" },
        { num: 3, text: "Monthly fee: £", answer: "2500" },
        { num: 4, text: "Meals:", answer: "included" },
        { num: 5, text: "Activities include gardening and", answer: "crafts" },
        { num: 6, text: "Nurse available:", answer: "daily" },
        { num: 7, text: "Visiting hours start:", answer: "10 am" },
        { num: 8, text: "Nearest bus stop on", answer: "Oak Street" },
        { num: 9, text: "Manager name: Mrs", answer: "Patterson" },
        { num: 10, text: "Open day on:", answer: "Sunday" }
      ]
    },
    {
      id: 9,
      title: "Airport Transfer",
      formTitle: "AIRPORT SHUTTLE SERVICE",
      formSubtitle: "Booking Details",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Destination town:", answer: "Milton" },
        { num: 2, text: "Number of passengers:", answer: "3" },
        { num: 3, text: "Pickup time:", answer: "2.30 pm" },
        { num: 4, text: "Terminal number:", answer: "2" },
        { num: 5, text: "Vehicle type:", answer: "minivan" },
        { num: 6, text: "Total cost: £", answer: "85" },
        { num: 7, text: "Payment method:", answer: "card" },
        { num: 8, text: "Driver name:", answer: "Collins" },
        { num: 9, text: "Company phone:", answer: "0800 567890" },
        { num: 10, text: "Meeting point:", answer: "arrivals hall" }
      ]
    },
    {
      id: 10,
      title: "Car Insurance",
      formTitle: "VEHICLE INSURANCE QUOTE",
      formSubtitle: "Application Form",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Cover type:", answer: "comprehensive" },
        { num: 2, text: "Car make:", answer: "Toyota" },
        { num: 3, text: "Year of manufacture:", answer: "2019" },
        { num: 4, text: "Annual mileage:", answer: "10000" },
        { num: 5, text: "Driver age:", answer: "28" },
        { num: 6, text: "Years with licence:", answer: "6" },
        { num: 7, text: "Previous claims:", answer: "none" },
        { num: 8, text: "Occupation:", answer: "teacher" },
        { num: 9, text: "Postcode:", answer: "M15 6AA" },
        { num: 10, text: "Start date: 1st", answer: "April" }
      ]
    },
    {
      id: 11,
      title: "Holiday Cottage Rental",
      formTitle: "LAKESIDE COTTAGE RENTAL",
      formSubtitle: "Booking Enquiry",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Number of guests:", answer: "4" },
        { num: 2, text: "Preferred location: near the", answer: "lake" },
        { num: 3, text: "Arrival date:", answer: "15th August" },
        { num: 4, text: "Length of stay:", answer: "one week" },
        { num: 5, text: "Budget per night: £", answer: "120" },
        { num: 6, text: "Essential feature:", answer: "wifi" },
        { num: 7, text: "Pets:", answer: "one dog" },
        { num: 8, text: "Name: Sarah", answer: "Mitchell" },
        { num: 9, text: "Email: sarahm@", answer: "quickmail" },
        { num: 10, text: "Preferred contact:", answer: "phone" }
      ]
    },
    {
      id: 12,
      title: "Homestay Application",
      formTitle: "INTERNATIONAL HOMESTAY",
      formSubtitle: "Student Placement Form",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Student name: Carlos", answer: "Rodriguez" },
        { num: 2, text: "Country:", answer: "Spain" },
        { num: 3, text: "Age:", answer: "19" },
        { num: 4, text: "Course type:", answer: "English" },
        { num: 5, text: "Duration:", answer: "3 months" },
        { num: 6, text: "Diet:", answer: "no pork" },
        { num: 7, text: "Allergy:", answer: "cats" },
        { num: 8, text: "Hobby:", answer: "football" },
        { num: 9, text: "Room type:", answer: "single" },
        { num: 10, text: "Area preference:", answer: "city centre" }
      ]
    },
    {
      id: 13,
      title: "Hotel Conference Booking",
      formTitle: "GRAND HOTEL CONFERENCE",
      formSubtitle: "Event Booking Form",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Company name:", answer: "Apex Solutions" },
        { num: 2, text: "Event type:", answer: "training" },
        { num: 3, text: "Date required:", answer: "22nd March" },
        { num: 4, text: "Number attending:", answer: "45" },
        { num: 5, text: "Room setup:", answer: "theatre style" },
        { num: 6, text: "Equipment needed:", answer: "projector" },
        { num: 7, text: "Catering: lunch and", answer: "breaks" },
        { num: 8, text: "Parking spaces:", answer: "1000" },
        { num: 9, text: "Contact: Mr", answer: "Harrison" },
        { num: 10, text: "Special request:", answer: "vegetarian options" }
      ]
    },
    {
      id: 14,
      title: "Insurance Claim",
      formTitle: "TRAVEL INSURANCE CLAIM",
      formSubtitle: "Incident Report",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Policy number:", answer: "TRV7842" },
        { num: 2, text: "Destination country:", answer: "Italy" },
        { num: 3, text: "Incident date:", answer: "8th July" },
        { num: 4, text: "Item lost:", answer: "laptop" },
        { num: 5, text: "Value: £", answer: "800" },
        { num: 6, text: "Location of loss:", answer: "hotel" },
        { num: 7, text: "Reported to:", answer: "police" },
        { num: 8, text: "Report number:", answer: "PL45891" },
        { num: 9, text: "Witness name:", answer: "hotel manager" },
        { num: 10, text: "Documents attached:", answer: "receipt" }
      ]
    },
    {
      id: 15,
      title: "Library Membership",
      formTitle: "CENTRAL LIBRARY",
      formSubtitle: "Membership Application",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Membership type:", answer: "adult" },
        { num: 2, text: "Name: Emma", answer: "Thornton" },
        { num: 3, text: "Address: 45", answer: "Pine Avenue" },
        { num: 4, text: "Postcode:", answer: "CB4 2RT" },
        { num: 5, text: "Phone:", answer: "07712 334521" },
        { num: 6, text: "ID provided:", answer: "passport" },
        { num: 7, text: "Main interest:", answer: "history" },
        { num: 8, text: "Borrowing limit:", answer: "12 items" },
        { num: 9, text: "Renewal method:", answer: "online" },
        { num: 10, text: "Newsletter:", answer: "yes" }
      ]
    },
    {
      id: 16,
      title: "Restaurant Job Application",
      formTitle: "RIVERSIDE RESTAURANT",
      formSubtitle: "Staff Application Form",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Position:", answer: "waiter" },
        { num: 2, text: "Applicant: David", answer: "Chen" },
        { num: 3, text: "Age:", answer: "22" },
        { num: 4, text: "Experience:", answer: "2 years" },
        { num: 5, text: "Previous employer:", answer: "cafe" },
        { num: 6, text: "Available from:", answer: "immediately" },
        { num: 7, text: "Availability:", answer: "weekends" },
        { num: 8, text: "Transport:", answer: "bicycle" },
        { num: 9, text: "Language:", answer: "Mandarin" },
        { num: 10, text: "Reference: former", answer: "manager" }
      ]
    },
    {
      id: 17,
      title: "Gym Induction",
      formTitle: "POWERFIT GYM",
      formSubtitle: "Induction Booking",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Member name:", answer: "Kelly Richards" },
        { num: 2, text: "Membership number:", answer: "PF4521" },
        { num: 3, text: "Induction date:", answer: "Monday" },
        { num: 4, text: "Time slot:", answer: "6 pm" },
        { num: 5, text: "Trainer name:", answer: "Marcus" },
        { num: 6, text: "Focus area:", answer: "weight loss" },
        { num: 7, text: "Current fitness:", answer: "low" },
        { num: 8, text: "Medical condition:", answer: "asthma" },
        { num: 9, text: "Locker number:", answer: "47" },
        { num: 10, text: "Bring:", answer: "towel" }
      ]
    },
    {
      id: 18,
      title: "Student Accommodation",
      formTitle: "UNIVERSITY HOUSING",
      formSubtitle: "Room Allocation Form",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Student ID:", answer: "S72" },
        { num: 2, text: "Name: Priya", answer: "Sharma" },
        { num: 3, text: "Course:", answer: "Medicine" },
        { num: 4, text: "Year of study:", answer: "first" },
        { num: 5, text: "Room preference:", answer: "en-suite" },
        { num: 6, text: "Catering:", answer: "self-catered" },
        { num: 7, text: "Move-in date:", answer: "18th September" },
        { num: 8, text: "Contract length:", answer: "weeks" },
        { num: 9, text: "Special need:", answer: "quiet area" },
        { num: 10, text: "Deposit: £", answer: "350" }
      ]
    },
    {
      id: 19,
      title: "Dentist Appointment",
      formTitle: "SMILE DENTAL CLINIC",
      formSubtitle: "Patient Registration",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Patient: Robert", answer: "Barnes" },
        { num: 2, text: "Date of birth:", answer: "7th May 1985" },
        { num: 3, text: "Address: 23", answer: "Maple Road" },
        { num: 4, text: "Phone:", answer: "07934 112876" },
        { num: 5, text: "Problem:", answer: "toothache" },
        { num: 6, text: "Duration of pain:", answer: "one week" },
        { num: 7, text: "Allergies:", answer: "penicillin" },
        { num: 8, text: "Last dental visit:", answer: "2 years ago" },
        { num: 9, text: "Preferred day:", answer: "Thursday" },
        { num: 10, text: "Payment:", answer: "insurance" }
      ]
    },
    {
      id: 20,
      title: "Driving School",
      formTitle: "ROADWISE DRIVING SCHOOL",
      formSubtitle: "Lesson Booking",
      instruction: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      questions: [
        { num: 1, text: "Student: Amy", answer: "Fletcher" },
        { num: 2, text: "Age:", answer: "17" },
        { num: 3, text: "Licence type:", answer: "provisional" },
        { num: 4, text: "Lesson type:", answer: "manual" },
        { num: 5, text: "Package:", answer: "hours" },
        { num: 6, text: "Cost: £", answer: "580" },
        { num: 7, text: "Available day:", answer: "Saturday" },
        { num: 8, text: "Pickup address:", answer: "home" },
        { num: 9, text: "Instructor:", answer: "Brian" },
        { num: 10, text: "Test date:", answer: "15th November" }
      ]
    }
  ],
  part2: [
    {
      id: 21,
      title: "Bus Tour Guide",
      formTitle: "PACTON-ON-SEA BUS TOUR",
      formSubtitle: "Places of Interest",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Tour duration:", answer: "hours" },
        { num: 2, text: "First stop: the old", answer: "lighthouse" },
        { num: 3, text: "Built in:", answer: "1872" },
        { num: 4, text: "Second stop has a famous", answer: "statue" },
        { num: 5, text: "The museum contains", answer: "exhibits" },
        { num: 6, text: "Third stop: the", answer: "harbour" },
        { num: 7, text: "Fresh", answer: "fish" },
        { num: 8, text: "Famous for:", answer: "seafood restaurants" },
        { num: 9, text: "Final stop: shopping", answer: "district" },
        { num: 10, text: "Tour ends at:", answer: "pm" }
      ]
    },
    {
      id: 22,
      title: "Sea Life Centre",
      formTitle: "OCEAN WORLD SEA LIFE CENTRE",
      formSubtitle: "Visitor Information",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Total number of species:", answer: "300" },
        { num: 2, text: "Main tank holds", answer: "sharks" },
        { num: 3, text: "Feeding time:", answer: "pm" },
        { num: 4, text: "Touch pool contains", answer: "starfish" },
        { num: 5, text: "Penguin area temperature:", answer: "degrees" },
        { num: 6, text: "New exhibit:", answer: "jellyfish" },
        { num: 7, text: "Located on floor:", answer: "second" },
        { num: 8, text: "Gift shop sells", answer: "toys" },
        { num: 9, text: "Cafe overlooks:", answer: "main tank" },
        { num: 10, text: "Parking:", answer: "free" }
      ]
    },
    {
      id: 23,
      title: "Hotel Facilities",
      formTitle: "GRANDVIEW HOTEL",
      formSubtitle: "Guest Information",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Pool open until:", answer: "10 pm" },
        { num: 2, text: "Gym located on floor:", answer: "basement" },
        { num: 3, text: "Spa booking: at", answer: "reception" },
        { num: 4, text: "Restaurant serves:", answer: "international" },
        { num: 5, text: "Breakfast time:", answer: "7-10 am" },
        { num: 6, text: "Room service available:", answer: "24 hours" },
        { num: 7, text: "WiFi password:", answer: "grandview2024" },
        { num: 8, text: "Laundry returned in:", answer: "same day" },
        { num: 9, text: "Checkout time:", answer: "11 am" },
        { num: 10, text: "Airport shuttle: every", answer: "30 minutes" }
      ]
    },
    {
      id: 24,
      title: "Volunteer Programme",
      formTitle: "WILDLIFE CONSERVATION PROJECT",
      formSubtitle: "Volunteer Information",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Project location:", answer: "rainforest" },
        { num: 2, text: "Main focus:", answer: "bird species" },
        { num: 3, text: "Minimum stay:", answer: "2 weeks" },
        { num: 4, text: "Accommodation:", answer: "shared cabins" },
        { num: 5, text: "Meals:", answer: "provided" },
        { num: 6, text: "Work starts at:", answer: "6 am" },
        { num: 7, text: "Main task:", answer: "data collection" },
        { num: 8, text: "Training on day:", answer: "one" },
        { num: 9, text: "Day off:", answer: "Sunday" },
        { num: 10, text: "Must bring:", answer: "walking boots" }
      ]
    },
    {
      id: 25,
      title: "Town Walking Tour",
      formTitle: "HISTORIC TOWN CENTRE WALK",
      formSubtitle: "Tour Route Information",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Meeting point: the", answer: "town hall" },
        { num: 2, text: "Tour starts at:", answer: "10.30 am" },
        { num: 3, text: "First building: the old", answer: "courthouse" },
        { num: 4, text: "Date built:", answer: "1756" },
        { num: 5, text: "Second stop: the", answer: "cathedral" },
        { num: 6, text: "Famous for its", answer: "stained glass" },
        { num: 7, text: "Third stop: the covered", answer: "market" },
        { num: 8, text: "Open since:", answer: "medieval times" },
        { num: 9, text: "Tour finishes at:", answer: "castle" },
        { num: 10, text: "Refreshments at:", answer: "tea rooms" }
      ]
    },
    {
      id: 26,
      title: "Neighbourhood Watch",
      formTitle: "COMMUNITY SAFETY SCHEME",
      formSubtitle: "Information for Residents",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Scheme started:", answer: "last year" },
        { num: 2, text: "Coordinator name:", answer: "Mrs Phillips" },
        { num: 3, text: "Meetings held:", answer: "monthly" },
        { num: 4, text: "Location:", answer: "community hall" },
        { num: 5, text: "Main concern:", answer: "burglary" },
        { num: 6, text: "Report suspicious activity to:", answer: "police" },
        { num: 7, text: "Emergency number:", answer: "999" },
        { num: 8, text: "Non-emergency:", answer: "101" },
        { num: 9, text: "Stickers for:", answer: "windows" },
        { num: 10, text: "Website:", answer: "safestreets" }
      ]
    },
    {
      id: 27,
      title: "Sculpture Park",
      formTitle: "MEADOWLAND SCULPTURE PARK",
      formSubtitle: "Visitor Guide",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Park area:", answer: "50 acres" },
        { num: 2, text: "Number of sculptures:", answer: "over 80" },
        { num: 3, text: "Most famous piece: The", answer: "Iron Giant" },
        { num: 4, text: "Artist:", answer: "Henry Moore" },
        { num: 5, text: "Indoor gallery:", answer: "near entrance" },
        { num: 6, text: "Audio guide cost:", answer: "£5" },
        { num: 7, text: "Children's trail:", answer: "free" },
        { num: 8, text: "Cafe specialty:", answer: "homemade cakes" },
        { num: 9, text: "Shop sells:", answer: "art prints" },
        { num: 10, text: "Closes at:", answer: "5 pm" }
      ]
    },
    {
      id: 28,
      title: "Learning Centre",
      formTitle: "ADULT LEARNING CENTRE",
      formSubtitle: "Facilities Map",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Reception on floor:", answer: "ground" },
        { num: 2, text: "Computer suite room:", answer: "A12" },
        { num: 3, text: "Library open until:", answer: "9 pm" },
        { num: 4, text: "Cafe in the:", answer: "basement" },
        { num: 5, text: "Art studios on floor:", answer: "third" },
        { num: 6, text: "Language labs room:", answer: "B7" },
        { num: 7, text: "Toilets near:", answer: "stairs" },
        { num: 8, text: "Disabled access via:", answer: "lift" },
        { num: 9, text: "First aid in:", answer: "reception" },
        { num: 10, text: "Car park at:", answer: "rear" }
      ]
    },
    {
      id: 29,
      title: "Camping Holidays",
      formTitle: "OUTDOOR ADVENTURE CAMPING",
      formSubtitle: "Site Information",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Campsite location:", answer: "forest edge" },
        { num: 2, text: "Tent pitches:", answer: "150" },
        { num: 3, text: "Showers:", answer: "free" },
        { num: 4, text: "Shop sells:", answer: "basics" },
        { num: 5, text: "Nearest town:", answer: "5 km" },
        { num: 6, text: "Activities: hiking and", answer: "fishing" },
        { num: 7, text: "Bike hire at:", answer: "reception" },
        { num: 8, text: "Quiet hours:", answer: "10 pm" },
        { num: 9, text: "BBQ area near:", answer: "lake" },
        { num: 10, text: "Dogs:", answer: "welcome" }
      ]
    },
    {
      id: 30,
      title: "City Development",
      formTitle: "NEWTOWN DEVELOPMENT PLAN",
      formSubtitle: "Proposed Changes",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Project completion:", answer: "2026" },
        { num: 2, text: "New housing units:", answer: "500" },
        { num: 3, text: "Shopping centre in:", answer: "north area" },
        { num: 4, text: "New park size:", answer: "10 acres" },
        { num: 5, text: "Transport: new", answer: "bus station" },
        { num: 6, text: "School type:", answer: "primary" },
        { num: 7, text: "Medical facility:", answer: "health centre" },
        { num: 8, text: "Parking spaces:", answer: "1000" },
        { num: 9, text: "Cycle paths:", answer: "throughout" },
        { num: 10, text: "Community centre near:", answer: "lake" }
      ]
    },
    {
      id: 31,
      title: "Walking Holiday",
      formTitle: "LAKELAND WALKING HOLIDAY",
      formSubtitle: "Tour Information",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Duration:", answer: "7 days" },
        { num: 2, text: "Difficulty level:", answer: "moderate" },
        { num: 3, text: "Daily distance:", answer: "15 km" },
        { num: 4, text: "Accommodation:", answer: "guest houses" },
        { num: 5, text: "Meals: breakfast and", answer: "packed lunch" },
        { num: 6, text: "Luggage:", answer: "transferred" },
        { num: 7, text: "Group size:", answer: "maximum 12" },
        { num: 8, text: "Guide provided:", answer: "yes" },
        { num: 9, text: "Best months:", answer: "May-September" },
        { num: 10, text: "Price includes:", answer: "maps" }
      ]
    },
    {
      id: 32,
      title: "City Walking Tour",
      formTitle: "RIVERSIDE CITY TOUR",
      formSubtitle: "Points of Interest",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Start point:", answer: "central station" },
        { num: 2, text: "First stop: the old", answer: "bridge" },
        { num: 3, text: "Built in:", answer: "1850" },
        { num: 4, text: "Second stop:", answer: "art gallery" },
        { num: 5, text: "Famous for:", answer: "impressionist paintings" },
        { num: 6, text: "Third stop: the", answer: "parliament" },
        { num: 7, text: "Photo opportunity at:", answer: "river terrace" },
        { num: 8, text: "Lunch at:", answer: "market square" },
        { num: 9, text: "Final stop:", answer: "botanical gardens" },
        { num: 10, text: "Tour ends:", answer: "3 pm" }
      ]
    },
    {
      id: 33,
      title: "Dinosaur Museum",
      formTitle: "NATURAL HISTORY MUSEUM",
      formSubtitle: "Dinosaur Exhibition",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Exhibition floor:", answer: "second" },
        { num: 2, text: "Number of skeletons:", answer: "15" },
        { num: 3, text: "Largest: the", answer: "T-Rex" },
        { num: 4, text: "Found in:", answer: "Montana" },
        { num: 5, text: "Interactive area for:", answer: "children" },
        { num: 6, text: "Dig pit:", answer: "included" },
        { num: 7, text: "Film shows every:", answer: "30 minutes" },
        { num: 8, text: "Duration:", answer: "15 minutes" },
        { num: 9, text: "Gift shop level:", answer: "ground" },
        { num: 10, text: "Popular item:", answer: "fossil replicas" }
      ]
    },
    {
      id: 34,
      title: "Wildlife Park",
      formTitle: "SAFARI WILDLIFE PARK",
      formSubtitle: "Visitor Information",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Park area:", answer: "200 acres" },
        { num: 2, text: "Animal species:", answer: "over 100" },
        { num: 3, text: "Safari bus: every", answer: "20 minutes" },
        { num: 4, text: "Lion feeding:", answer: "2.30 pm" },
        { num: 5, text: "Elephant walk:", answer: "11 am" },
        { num: 6, text: "Penguin pool:", answer: "near entrance" },
        { num: 7, text: "Children's farm:", answer: "free" },
        { num: 8, text: "Picnic area:", answer: "lakeside" },
        { num: 9, text: "Restaurant specialty:", answer: "burgers" },
        { num: 10, text: "Last entry:", answer: "4 pm" }
      ]
    },
    {
      id: 35,
      title: "Arts Centre",
      formTitle: "RIVERSIDE ARTS CENTRE",
      formSubtitle: "This Month's Programme",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Main theatre seats:", answer: "450" },
        { num: 2, text: "Current play:", answer: "Hamlet" },
        { num: 3, text: "Runs until:", answer: "March 15th" },
        { num: 4, text: "Cinema shows:", answer: "classic films" },
        { num: 5, text: "Every:", answer: "Wednesday" },
        { num: 6, text: "Art exhibition:", answer: "photography" },
        { num: 7, text: "Artist:", answer: "local" },
        { num: 8, text: "Gallery admission:", answer: "free" },
        { num: 9, text: "Music: jazz on", answer: "Friday" },
        { num: 10, text: "Box office:", answer: "10 am-8 pm" }
      ]
    },
    {
      id: 36,
      title: "Suburb Development",
      formTitle: "GREENFIELD HOUSING ESTATE",
      formSubtitle: "New Development Information",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Total homes:", answer: "350" },
        { num: 2, text: "Types: houses and", answer: "apartments" },
        { num: 3, text: "Prices from: £", answer: "250000" },
        { num: 4, text: "Show home opens:", answer: "weekends" },
        { num: 5, text: "Location:", answer: "south side" },
        { num: 6, text: "Transport:", answer: "bus link" },
        { num: 7, text: "School:", answer: "walking distance" },
        { num: 8, text: "Park area:", answer: "central" },
        { num: 9, text: "Completion:", answer: "2025" },
        { num: 10, text: "Sales office:", answer: "on site" }
      ]
    },
    {
      id: 37,
      title: "Sports Shop",
      formTitle: "SPORTS WORLD STORE",
      formSubtitle: "Store Guide",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Ground floor:", answer: "footwear" },
        { num: 2, text: "First floor:", answer: "clothing" },
        { num: 3, text: "Second floor:", answer: "equipment" },
        { num: 4, text: "Running section:", answer: "rear" },
        { num: 5, text: "Tennis near:", answer: "lifts" },
        { num: 6, text: "Golf:", answer: "basement" },
        { num: 7, text: "Fitting rooms:", answer: "each floor" },
        { num: 8, text: "Returns at:", answer: "customer service" },
        { num: 9, text: "Cafe on floor:", answer: "second" },
        { num: 10, text: "Open until:", answer: "9 pm" }
      ]
    },
    {
      id: 38,
      title: "City Parks Guide",
      formTitle: "CITY PARKS AND GARDENS",
      formSubtitle: "Visitor Information",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Largest park:", answer: "Victoria Park" },
        { num: 2, text: "Area:", answer: "80 acres" },
        { num: 3, text: "Best for:", answer: "cycling" },
        { num: 4, text: "Rose garden in:", answer: "Memorial Gardens" },
        { num: 5, text: "Blooms:", answer: "June-August" },
        { num: 6, text: "Children's playground:", answer: "Riverside Park" },
        { num: 7, text: "Equipment:", answer: "recently updated" },
        { num: 8, text: "Dog walking:", answer: "all parks" },
        { num: 9, text: "Must be:", answer: "on lead" },
        { num: 10, text: "Maps available:", answer: "visitor centre" }
      ]
    },
    {
      id: 39,
      title: "Railway Park",
      formTitle: "HERITAGE RAILWAY MUSEUM",
      formSubtitle: "Visitor Guide",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Number of engines:", answer: "25" },
        { num: 2, text: "Oldest from:", answer: "1875" },
        { num: 3, text: "Train rides:", answer: "weekends" },
        { num: 4, text: "Departure:", answer: "hourly" },
        { num: 5, text: "Route length:", answer: "3 miles" },
        { num: 6, text: "Signal box:", answer: "original" },
        { num: 7, text: "Workshop tours:", answer: "Saturdays" },
        { num: 8, text: "Model railway:", answer: "upstairs" },
        { num: 9, text: "Cafe serves:", answer: "light meals" },
        { num: 10, text: "Gift shop specialty:", answer: "train models" }
      ]
    },
    {
      id: 40,
      title: "Home Appliance Guide",
      formTitle: "ECOHEAT WATER HEATER",
      formSubtitle: "Installation Guide",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Capacity:", answer: "50 litres" },
        { num: 2, text: "Install in:", answer: "kitchen or bathroom" },
        { num: 3, text: "Minimum clearance:", answer: "10 cm" },
        { num: 4, text: "Power supply:", answer: "240V" },
        { num: 5, text: "Heating time:", answer: "2 hours" },
        { num: 6, text: "Thermostat range:", answer: "40-80 degrees" },
        { num: 7, text: "Safety feature:", answer: "auto shutoff" },
        { num: 8, text: "Warranty:", answer: "5 years" },
        { num: 9, text: "Service:", answer: "annual" },
        { num: 10, text: "Customer line:", answer: "0800 123456" }
      ]
    }
  ],
  part3: [
    {
      id: 41,
      title: "Assignment Discussion",
      formTitle: "COMPUTER SYSTEMS ASSIGNMENT",
      formSubtitle: "Tutorial Discussion Notes",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Assignment topic:", answer: "network security" },
        { num: 2, text: "Word limit:", answer: "3000" },
        { num: 3, text: "Main source:", answer: "journal articles" },
        { num: 4, text: "Focus on recent:", answer: "case studies" },
        { num: 5, text: "Include:", answer: "diagrams" },
        { num: 6, text: "Reference style:", answer: "Harvard" },
        { num: 7, text: "Draft due:", answer: "next Friday" },
        { num: 8, text: "Feedback from:", answer: "tutor" },
        { num: 9, text: "Final submission:", answer: "online" },
        { num: 10, text: "Worth:", answer: "40 percent" }
      ]
    },
    {
      id: 42,
      title: "Course Selection",
      formTitle: "SUBJECT CHOICE DISCUSSION",
      formSubtitle: "Academic Advisor Meeting",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Student major:", answer: "biology" },
        { num: 2, text: "Wants to add:", answer: "chemistry" },
        { num: 3, text: "Required course:", answer: "statistics" },
        { num: 4, text: "Schedule conflict:", answer: "Tuesday morning" },
        { num: 5, text: "Alternative:", answer: "online section" },
        { num: 6, text: "Lab times:", answer: "afternoons" },
        { num: 7, text: "Recommended elective:", answer: "genetics" },
        { num: 8, text: "Career goal:", answer: "research" },
        { num: 9, text: "Internship:", answer: "summer" },
        { num: 10, text: "Apply by:", answer: "March" }
      ]
    },
    {
      id: 43,
      title: "Recycling Project",
      formTitle: "PAPER RECYCLING RESEARCH",
      formSubtitle: "Project Planning Discussion",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Project focus:", answer: "campus recycling" },
        { num: 2, text: "Data collection:", answer: "survey" },
        { num: 3, text: "Sample size:", answer: "200 students" },
        { num: 4, text: "Location:", answer: "library" },
        { num: 5, text: "Time needed:", answer: "two weeks" },
        { num: 6, text: "Analysis method:", answer: "statistical" },
        { num: 7, text: "Compare with:", answer: "other universities" },
        { num: 8, text: "Presentation:", answer: "poster" },
        { num: 9, text: "Submit to:", answer: "Dr Wilson" },
        { num: 10, text: "Deadline:", answer: "end of term" }
      ]
    },
    {
      id: 44,
      title: "Food Waste Seminar",
      formTitle: "FOOD WASTE REDUCTION PROJECT",
      formSubtitle: "Seminar Discussion Notes",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Main problem:", answer: "overproduction" },
        { num: 2, text: "Biggest waste:", answer: "vegetables" },
        { num: 3, text: "Solution:", answer: "better planning" },
        { num: 4, text: "Technology:", answer: "apps" },
        { num: 5, text: "Consumer education:", answer: "essential" },
        { num: 6, text: "Supermarket role:", answer: "reduce packaging" },
        { num: 7, text: "Restaurant approach:", answer: "smaller portions" },
        { num: 8, text: "Composting:", answer: "encouraged" },
        { num: 9, text: "Government action:", answer: "legislation" },
        { num: 10, text: "Target reduction:", answer: "50 percent" }
      ]
    },
    {
      id: 45,
      title: "Business Case Study",
      formTitle: "STARTUP COMPANY ANALYSIS",
      formSubtitle: "Tutorial Discussion",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Company type:", answer: "tech startup" },
        { num: 2, text: "Founded:", answer: "2018" },
        { num: 3, text: "Initial product:", answer: "mobile app" },
        { num: 4, text: "Target market:", answer: "young professionals" },
        { num: 5, text: "Funding source:", answer: "venture capital" },
        { num: 6, text: "First challenge:", answer: "user acquisition" },
        { num: 7, text: "Solution:", answer: "social media" },
        { num: 8, text: "Current revenue:", answer: "profitable" },
        { num: 9, text: "Expansion plan:", answer: "international" },
        { num: 10, text: "Key success factor:", answer: "innovation" }
      ]
    },
    {
      id: 46,
      title: "Biofuels Presentation",
      formTitle: "RENEWABLE ENERGY SEMINAR",
      formSubtitle: "Biofuels Discussion",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Main source:", answer: "plant material" },
        { num: 2, text: "Common crop:", answer: "corn" },
        { num: 3, text: "Process:", answer: "fermentation" },
        { num: 4, text: "Advantage:", answer: "renewable" },
        { num: 5, text: "Problem:", answer: "land use" },
        { num: 6, text: "Competes with:", answer: "food production" },
        { num: 7, text: "Second generation:", answer: "waste materials" },
        { num: 8, text: "More:", answer: "sustainable" },
        { num: 9, text: "Current use:", answer: "transport" },
        { num: 10, text: "Future:", answer: "aviation fuel" }
      ]
    },
    {
      id: 47,
      title: "Marketing Research",
      formTitle: "COFFEE SHOP MARKETING",
      formSubtitle: "Research Project Meeting",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Research method:", answer: "interviews" },
        { num: 2, text: "Target group:", answer: "regular customers" },
        { num: 3, text: "Sample size:", answer: "30" },
        { num: 4, text: "Duration:", answer: "15 minutes" },
        { num: 5, text: "Recording:", answer: "audio" },
        { num: 6, text: "Key question:", answer: "brand loyalty" },
        { num: 7, text: "Analyse using:", answer: "themes" },
        { num: 8, text: "Compare with:", answer: "competitors" },
        { num: 9, text: "Present findings:", answer: "report" },
        { num: 10, text: "Submit by:", answer: "December" }
      ]
    },
    {
      id: 48,
      title: "Museum Training",
      formTitle: "VOLUNTEER TRAINING SESSION",
      formSubtitle: "Museum Guide Programme",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Training duration:", answer: "two days" },
        { num: 2, text: "First session:", answer: "history" },
        { num: 3, text: "Learn about:", answer: "collections" },
        { num: 4, text: "Practice:", answer: "role play" },
        { num: 5, text: "Focus on:", answer: "communication" },
        { num: 6, text: "Handle difficult:", answer: "questions" },
        { num: 7, text: "Tour length:", answer: "45 minutes" },
        { num: 8, text: "Group size:", answer: "maximum 15" },
        { num: 9, text: "Uniform:", answer: "provided" },
        { num: 10, text: "Shifts:", answer: "flexible" }
      ]
    },
    {
      id: 49,
      title: "Workplace Study",
      formTitle: "OFFICE CULTURE RESEARCH",
      formSubtitle: "Dissertation Discussion",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Research focus:", answer: "open offices" },
        { num: 2, text: "Compared to:", answer: "traditional" },
        { num: 3, text: "Data from:", answer: "observations" },
        { num: 4, text: "Plus:", answer: "interviews" },
        { num: 5, text: "Measure:", answer: "productivity" },
        { num: 6, text: "Also:", answer: "satisfaction" },
        { num: 7, text: "Sample:", answer: "three companies" },
        { num: 8, text: "Duration:", answer: "six months" },
        { num: 9, text: "Challenge:", answer: "access" },
        { num: 10, text: "Ethics approval:", answer: "required" }
      ]
    },
    {
      id: 50,
      title: "Antarctic Research",
      formTitle: "CLIMATE RESEARCH PROJECT",
      formSubtitle: "Field Study Discussion",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Location:", answer: "research station" },
        { num: 2, text: "Duration:", answer: "three months" },
        { num: 3, text: "Focus:", answer: "ice cores" },
        { num: 4, text: "Equipment:", answer: "drilling" },
        { num: 5, text: "Data shows:", answer: "climate history" },
        { num: 6, text: "Going back:", answer: "thousands of years" },
        { num: 7, text: "Team size:", answer: "eight" },
        { num: 8, text: "Communication:", answer: "satellite" },
        { num: 9, text: "Challenge:", answer: "extreme cold" },
        { num: 10, text: "Funding from:", answer: "government" }
      ]
    },
    {
      id: 51,
      title: "Ocean Float Project",
      formTitle: "MARINE POLLUTION STUDY",
      formSubtitle: "Research Methodology Discussion",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Study area:", answer: "Pacific Ocean" },
        { num: 2, text: "Focus:", answer: "plastic waste" },
        { num: 3, text: "Collection method:", answer: "nets" },
        { num: 4, text: "Sample depth:", answer: "surface" },
        { num: 5, text: "Analysis:", answer: "laboratory" },
        { num: 6, text: "Identify:", answer: "source" },
        { num: 7, text: "Main type:", answer: "microplastics" },
        { num: 8, text: "Impact on:", answer: "marine life" },
        { num: 9, text: "Solution:", answer: "prevention" },
        { num: 10, text: "Policy recommendation:", answer: "ban" }
      ]
    },
    {
      id: 52,
      title: "Geography Project",
      formTitle: "URBAN GEOGRAPHY ASSIGNMENT",
      formSubtitle: "Project Planning Meeting",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Topic:", answer: "gentrification" },
        { num: 2, text: "Area studied:", answer: "inner city" },
        { num: 3, text: "Method:", answer: "mapping" },
        { num: 4, text: "Data source:", answer: "census" },
        { num: 5, text: "Time period:", answer: "20 years" },
        { num: 6, text: "Show:", answer: "changes" },
        { num: 7, text: "Include:", answer: "photographs" },
        { num: 8, text: "Interview:", answer: "residents" },
        { num: 9, text: "Presentation:", answer: "visual" },
        { num: 10, text: "Assessment:", answer: "group" }
      ]
    },
    {
      id: 53,
      title: "Field Trip Planning",
      formTitle: "ECOLOGY FIELD TRIP",
      formSubtitle: "Planning Meeting Notes",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Destination:", answer: "nature reserve" },
        { num: 2, text: "Date:", answer: "next Saturday" },
        { num: 3, text: "Departure:", answer: "8 am" },
        { num: 4, text: "Transport:", answer: "minibus" },
        { num: 5, text: "Study:", answer: "bird species" },
        { num: 6, text: "Equipment:", answer: "binoculars" },
        { num: 7, text: "Bring:", answer: "notebook" },
        { num: 8, text: "Wear:", answer: "waterproof clothing" },
        { num: 9, text: "Lunch:", answer: "packed" },
        { num: 10, text: "Return by:", answer: "5 pm" }
      ]
    },
    {
      id: 54,
      title: "Honey Bee Study",
      formTitle: "POLLINATION RESEARCH",
      formSubtitle: "Experiment Discussion",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Research focus:", answer: "bee behaviour" },
        { num: 2, text: "Location:", answer: "university farm" },
        { num: 3, text: "Number of hives:", answer: "six" },
        { num: 4, text: "Monitoring:", answer: "cameras" },
        { num: 5, text: "Record:", answer: "flight patterns" },
        { num: 6, text: "Count:", answer: "flower visits" },
        { num: 7, text: "Duration:", answer: "summer months" },
        { num: 8, text: "Compare:", answer: "different crops" },
        { num: 9, text: "Threat:", answer: "pesticides" },
        { num: 10, text: "Conservation:", answer: "essential" }
      ]
    },
    {
      id: 55,
      title: "Latin American Course",
      formTitle: "STUDY ABROAD PROGRAMME",
      formSubtitle: "Course Information Session",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Destination:", answer: "Mexico" },
        { num: 2, text: "Duration:", answer: "one semester" },
        { num: 3, text: "Focus:", answer: "language" },
        { num: 4, text: "Also:", answer: "culture" },
        { num: 5, text: "Accommodation:", answer: "host family" },
        { num: 6, text: "Meals:", answer: "included" },
        { num: 7, text: "Classes:", answer: "mornings" },
        { num: 8, text: "Excursions:", answer: "weekends" },
        { num: 9, text: "Credits:", answer: "transferable" },
        { num: 10, text: "Apply by:", answer: "January" }
      ]
    },
    {
      id: 56,
      title: "Course Financing",
      formTitle: "STUDENT FINANCE MEETING",
      formSubtitle: "Funding Options Discussion",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Tuition fee: £", answer: "9250" },
        { num: 2, text: "Living costs: £", answer: "12000" },
        { num: 3, text: "Loan covers:", answer: "tuition" },
        { num: 4, text: "Maintenance based on:", answer: "household income" },
        { num: 5, text: "Repayment starts:", answer: "after graduation" },
        { num: 6, text: "Threshold: £", answer: "27295" },
        { num: 7, text: "Apply through:", answer: "online" },
        { num: 8, text: "Deadline:", answer: "May" },
        { num: 9, text: "Also apply for:", answer: "bursaries" },
        { num: 10, text: "Part-time work:", answer: "recommended" }
      ]
    },
    {
      id: 57,
      title: "Marketing Feedback",
      formTitle: "PRESENTATION FEEDBACK SESSION",
      formSubtitle: "Marketing Module Discussion",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Presentation topic:", answer: "brand strategy" },
        { num: 2, text: "Positive: good", answer: "structure" },
        { num: 3, text: "Clear:", answer: "introduction" },
        { num: 4, text: "Improve:", answer: "eye contact" },
        { num: 5, text: "Slides had too much:", answer: "text" },
        { num: 6, text: "Use more:", answer: "visuals" },
        { num: 7, text: "Examples:", answer: "relevant" },
        { num: 8, text: "Timing:", answer: "slightly over" },
        { num: 9, text: "Questions handled:", answer: "well" },
        { num: 10, text: "Overall grade:", answer: "B+" }
      ]
    },
    {
      id: 58,
      title: "Self-Access Centre",
      formTitle: "LANGUAGE LEARNING CENTRE",
      formSubtitle: "Orientation Session",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Opening hours:", answer: "9 am-9 pm" },
        { num: 2, text: "Computers:", answer: "30" },
        { num: 3, text: "Booking:", answer: "not required" },
        { num: 4, text: "Software:", answer: "language learning" },
        { num: 5, text: "DVDs:", answer: "foreign films" },
        { num: 6, text: "Borrowing period:", answer: "one week" },
        { num: 7, text: "Conversation groups:", answer: "daily" },
        { num: 8, text: "Sign up at:", answer: "reception" },
        { num: 9, text: "Tutors available:", answer: "by appointment" },
        { num: 10, text: "Membership:", answer: "free" }
      ]
    },
    {
      id: 59,
      title: "Study Skills Session",
      formTitle: "ACADEMIC WRITING WORKSHOP",
      formSubtitle: "Session Notes",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Focus:", answer: "essay structure" },
        { num: 2, text: "Introduction includes:", answer: "thesis statement" },
        { num: 3, text: "Body paragraphs:", answer: "one idea each" },
        { num: 4, text: "Use:", answer: "topic sentences" },
        { num: 5, text: "Support with:", answer: "evidence" },
        { num: 6, text: "Conclusion:", answer: "summarise" },
        { num: 7, text: "Avoid:", answer: "new information" },
        { num: 8, text: "Referencing:", answer: "essential" },
        { num: 9, text: "Plagiarism:", answer: "serious offence" },
        { num: 10, text: "Proofread:", answer: "always" }
      ]
    },
    {
      id: 60,
      title: "Student Survey",
      formTitle: "STUDENT EXPERIENCE SURVEY",
      formSubtitle: "Focus Group Discussion",
      instruction: "Write NO MORE THAN TWO WORDS for each answer.",
      questions: [
        { num: 1, text: "Survey about:", answer: "accommodation" },
        { num: 2, text: "Positive:", answer: "location" },
        { num: 3, text: "Near:", answer: "campus" },
        { num: 4, text: "Problem:", answer: "noise" },
        { num: 5, text: "From:", answer: "traffic" },
        { num: 6, text: "Kitchen:", answer: "too small" },
        { num: 7, text: "Need more:", answer: "storage" },
        { num: 8, text: "Laundry:", answer: "expensive" },
        { num: 9, text: "Internet:", answer: "unreliable" },
        { num: 10, text: "Overall:", answer: "satisfactory" }
      ]
    }
  ],
  part4: [
    {
      id: 61,
      title: "Ceramics History",
      formTitle: "HISTORY OF CERAMICS",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Earliest pottery found in:", answer: "China" },
        { num: 2, text: "Made from:", answer: "clay" },
        { num: 3, text: "Shaped using a:", answer: "wheel" },
        { num: 4, text: "Fired in a:", answer: "kiln" },
        { num: 5, text: "High temperature creates:", answer: "strength" },
        { num: 6, text: "Glaze adds:", answer: "colour" },
        { num: 7, text: "Trade spread along:", answer: "routes" },
        { num: 8, text: "European production in:", answer: "Italy" },
        { num: 9, text: "Industrial revolution: mass", answer: "production" },
        { num: 10, text: "Today: both art and", answer: "industry" }
      ]
    },
    {
      id: 62,
      title: "Presentation Skills",
      formTitle: "EFFECTIVE PRESENTATIONS",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "First step:", answer: "planning" },
        { num: 2, text: "Know your:", answer: "audience" },
        { num: 3, text: "Clear:", answer: "structure" },
        { num: 4, text: "Strong:", answer: "opening" },
        { num: 5, text: "Main points:", answer: "three" },
        { num: 6, text: "Visual aids:", answer: "simple" },
        { num: 7, text: "Avoid reading from:", answer: "notes" },
        { num: 8, text: "Make eye:", answer: "contact" },
        { num: 9, text: "Control:", answer: "nerves" },
        { num: 10, text: "Practice:", answer: "essential" }
      ]
    },
    {
      id: 63,
      title: "Hair Science",
      formTitle: "THE SCIENCE OF HAIR",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Hair made of:", answer: "protein" },
        { num: 2, text: "Grows from:", answer: "follicles" },
        { num: 3, text: "Average growth per month:", answer: "centimetre" },
        { num: 4, text: "Colour from:", answer: "melanin" },
        { num: 5, text: "Grey hair lacks:", answer: "pigment" },
        { num: 6, text: "Texture determined by:", answer: "genes" },
        { num: 7, text: "Damage from:", answer: "heat" },
        { num: 8, text: "Also chemicals like:", answer: "bleach" },
        { num: 9, text: "Healthy hair needs:", answer: "nutrition" },
        { num: 10, text: "Regular:", answer: "trimming" }
      ]
    },
    {
      id: 64,
      title: "Kite History",
      formTitle: "HISTORY OF KITES",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Origin:", answer: "China" },
        { num: 2, text: "Years ago:", answer: "3000" },
        { num: 3, text: "Made from:", answer: "bamboo" },
        { num: 4, text: "And:", answer: "silk" },
        { num: 5, text: "Used in:", answer: "warfare" },
        { num: 6, text: "For:", answer: "signalling" },
        { num: 7, text: "Also:", answer: "measurement" },
        { num: 8, text: "Franklin studied:", answer: "electricity" },
        { num: 9, text: "Modern material:", answer: "nylon" },
        { num: 10, text: "Sport:", answer: "kite-surfing" }
      ]
    },
    {
      id: 65,
      title: "Rock Art",
      formTitle: "PREHISTORIC ROCK ART",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Oldest art:", answer: "cave" },
        { num: 2, text: "Location:", answer: "France" },
        { num: 3, text: "Age:", answer: "40000" },
        { num: 4, text: "Common subject:", answer: "animals" },
        { num: 5, text: "Made with:", answer: "minerals" },
        { num: 6, text: "Red from:", answer: "ochre" },
        { num: 7, text: "Black from:", answer: "charcoal" },
        { num: 8, text: "Purpose:", answer: "unknown" },
        { num: 9, text: "Perhaps:", answer: "ritual" },
        { num: 10, text: "Conservation:", answer: "difficult" }
      ]
    },
    {
      id: 66,
      title: "Social Networks",
      formTitle: "SOCIAL NETWORK THEORY",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Networks are:", answer: "connections" },
        { num: 2, text: "Nodes are:", answer: "people" },
        { num: 3, text: "Links are:", answer: "relationships" },
        { num: 4, text: "Strong ties:", answer: "family" },
        { num: 5, text: "Weak ties:", answer: "acquaintances" },
        { num: 6, text: "Spread of:", answer: "information" },
        { num: 7, text: "Six degrees of:", answer: "separation" },
        { num: 8, text: "Online networks:", answer: "larger" },
        { num: 9, text: "But:", answer: "weaker" },
        { num: 10, text: "Impact on:", answer: "business" }
      ]
    },
    {
      id: 67,
      title: "Fireworks History",
      formTitle: "THE HISTORY OF FIREWORKS",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Invented in:", answer: "China" },
        { num: 2, text: "Contain:", answer: "gunpowder" },
        { num: 3, text: "Spread via:", answer: "trade" },
        { num: 4, text: "To:", answer: "Europe" },
        { num: 5, text: "Used for:", answer: "celebrations" },
        { num: 6, text: "Colours from:", answer: "metals" },
        { num: 7, text: "Red from:", answer: "strontium" },
        { num: 8, text: "Green from:", answer: "barium" },
        { num: 9, text: "Modern shows:", answer: "computerised" },
        { num: 10, text: "Safety:", answer: "important" }
      ]
    },
    {
      id: 68,
      title: "Crow Intelligence",
      formTitle: "INTELLIGENCE IN CROWS",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Crows use:", answer: "tools" },
        { num: 2, text: "To get:", answer: "food" },
        { num: 3, text: "Can solve:", answer: "problems" },
        { num: 4, text: "Remember:", answer: "faces" },
        { num: 5, text: "Hold:", answer: "grudges" },
        { num: 6, text: "Communicate:", answer: "danger" },
        { num: 7, text: "Through:", answer: "calls" },
        { num: 8, text: "Brain size:", answer: "large" },
        { num: 9, text: "Comparable to:", answer: "primates" },
        { num: 10, text: "Studied for:", answer: "cognition" }
      ]
    },
    {
      id: 69,
      title: "Aboriginal Art",
      formTitle: "AUSTRALIAN ABORIGINAL ART",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Oldest tradition:", answer: "continuous" },
        { num: 2, text: "Rock art age:", answer: "65000" },
        { num: 3, text: "Represents:", answer: "Dreamtime" },
        { num: 4, text: "Stories of:", answer: "creation" },
        { num: 5, text: "Dot painting:", answer: "modern" },
        { num: 6, text: "Started in:", answer: "1970s" },
        { num: 7, text: "Symbols:", answer: "meaningful" },
        { num: 8, text: "Passed down through:", answer: "generations" },
        { num: 9, text: "Now sold:", answer: "internationally" },
        { num: 10, text: "Concerns about:", answer: "authenticity" }
      ]
    },
    {
      id: 70,
      title: "Handedness Research",
      formTitle: "LEFT AND RIGHT HANDEDNESS",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Most people:", answer: "right-handed" },
        { num: 2, text: "Percentage left:", answer: "10" },
        { num: 3, text: "Determined by:", answer: "genes" },
        { num: 4, text: "Also:", answer: "environment" },
        { num: 5, text: "Brain:", answer: "asymmetric" },
        { num: 6, text: "Left hand controlled by:", answer: "right" },
        { num: 7, text: "Hemisphere linked to:", answer: "creativity" },
        { num: 8, text: "Left-handers more:", answer: "artistic" },
        { num: 9, text: "Historically:", answer: "discriminated" },
        { num: 10, text: "Now:", answer: "accepted" }
      ]
    },
    {
      id: 71,
      title: "Tourism Impact",
      formTitle: "TOURISM AND ECONOMY",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Tourism creates:", answer: "jobs" },
        { num: 2, text: "In:", answer: "hospitality" },
        { num: 3, text: "And:", answer: "transport" },
        { num: 4, text: "Brings:", answer: "revenue" },
        { num: 5, text: "To local:", answer: "businesses" },
        { num: 6, text: "Problem:", answer: "seasonality" },
        { num: 7, text: "Environmental:", answer: "damage" },
        { num: 8, text: "Overcrowding in:", answer: "popular" },
        { num: 9, text: "Solution:", answer: "sustainable" },
        { num: 10, text: "Tourism needs:", answer: "management" }
      ]
    },
    {
      id: 72,
      title: "MSG Research",
      formTitle: "MONOSODIUM GLUTAMATE",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "MSG is a:", answer: "flavouring" },
        { num: 2, text: "Discovered in:", answer: "Japan" },
        { num: 3, text: "From:", answer: "seaweed" },
        { num: 4, text: "Taste:", answer: "umami" },
        { num: 5, text: "Found in:", answer: "tomatoes" },
        { num: 6, text: "And:", answer: "cheese" },
        { num: 7, text: "Health concerns:", answer: "unfounded" },
        { num: 8, text: "Studies show:", answer: "safe" },
        { num: 9, text: "Used in:", answer: "processed" },
        { num: 10, text: "Foods worldwide:", answer: "common" }
      ]
    },
    {
      id: 73,
      title: "Geographical Features",
      formTitle: "FORMATION OF LANDSCAPES",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Mountains form from:", answer: "plates" },
        { num: 2, text: "Collision creates:", answer: "uplift" },
        { num: 3, text: "Example:", answer: "Himalayas" },
        { num: 4, text: "Valleys from:", answer: "erosion" },
        { num: 5, text: "By:", answer: "rivers" },
        { num: 6, text: "Or:", answer: "glaciers" },
        { num: 7, text: "Deserts from:", answer: "climate" },
        { num: 8, text: "Lack of:", answer: "rainfall" },
        { num: 9, text: "Coastlines shaped by:", answer: "waves" },
        { num: 10, text: "Constant:", answer: "change" }
      ]
    },
    {
      id: 74,
      title: "Medical Research",
      formTitle: "CLINICAL TRIALS",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Trials test:", answer: "drugs" },
        { num: 2, text: "Phase one:", answer: "safety" },
        { num: 3, text: "Small:", answer: "groups" },
        { num: 4, text: "Phase two:", answer: "effectiveness" },
        { num: 5, text: "Compare with:", answer: "placebo" },
        { num: 6, text: "Phase three:", answer: "larger" },
        { num: 7, text: "Double:", answer: "blind" },
        { num: 8, text: "Neither knows:", answer: "treatment" },
        { num: 9, text: "Approval from:", answer: "regulators" },
        { num: 10, text: "Then:", answer: "marketing" }
      ]
    },
    {
      id: 75,
      title: "Business Success",
      formTitle: "ENTREPRENEURSHIP",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Entrepreneurs need:", answer: "vision" },
        { num: 2, text: "And:", answer: "determination" },
        { num: 3, text: "Start with:", answer: "idea" },
        { num: 4, text: "Research:", answer: "market" },
        { num: 5, text: "Write:", answer: "plan" },
        { num: 6, text: "Secure:", answer: "funding" },
        { num: 7, text: "Build:", answer: "team" },
        { num: 8, text: "Accept:", answer: "risk" },
        { num: 9, text: "Learn from:", answer: "failure" },
        { num: 10, text: "Keep:", answer: "adapting" }
      ]
    },
    {
      id: 76,
      title: "Whale Behaviour",
      formTitle: "WHALE COMMUNICATION",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Whales use:", answer: "sound" },
        { num: 2, text: "Called:", answer: "songs" },
        { num: 3, text: "Travel:", answer: "underwater" },
        { num: 4, text: "Long:", answer: "distances" },
        { num: 5, text: "Purpose:", answer: "mating" },
        { num: 6, text: "Also:", answer: "navigation" },
        { num: 7, text: "Each population:", answer: "different" },
        { num: 8, text: "Songs:", answer: "evolve" },
        { num: 9, text: "Threatened by:", answer: "noise" },
        { num: 10, text: "From:", answer: "ships" }
      ]
    },
    {
      id: 77,
      title: "Business Culture",
      formTitle: "CORPORATE CULTURE",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Culture is:", answer: "values" },
        { num: 2, text: "And:", answer: "behaviours" },
        { num: 3, text: "Set by:", answer: "leadership" },
        { num: 4, text: "Affects:", answer: "performance" },
        { num: 5, text: "Strong cultures:", answer: "consistent" },
        { num: 6, text: "Employees:", answer: "motivated" },
        { num: 7, text: "Poor cultures:", answer: "toxic" },
        { num: 8, text: "High:", answer: "turnover" },
        { num: 9, text: "Change requires:", answer: "time" },
        { num: 10, text: "And:", answer: "commitment" }
      ]
    },
    {
      id: 78,
      title: "Underground Homes",
      formTitle: "EARTH-SHELTERED HOUSING",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Built:", answer: "underground" },
        { num: 2, text: "Or into:", answer: "hillsides" },
        { num: 3, text: "Natural:", answer: "insulation" },
        { num: 4, text: "Temperature:", answer: "stable" },
        { num: 5, text: "Less:", answer: "energy" },
        { num: 6, text: "For heating and:", answer: "cooling" },
        { num: 7, text: "Challenge:", answer: "lighting" },
        { num: 8, text: "Use:", answer: "skylights" },
        { num: 9, text: "Damp:", answer: "prevention" },
        { num: 10, text: "Growing:", answer: "popularity" }
      ]
    },
    {
      id: 79,
      title: "Urban Wildlife",
      formTitle: "WILDLIFE IN CITIES",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Cities have:", answer: "wildlife" },
        { num: 2, text: "Common:", answer: "foxes" },
        { num: 3, text: "And:", answer: "birds" },
        { num: 4, text: "Attracted by:", answer: "food" },
        { num: 5, text: "And:", answer: "shelter" },
        { num: 6, text: "Parks provide:", answer: "habitat" },
        { num: 7, text: "Gardens:", answer: "important" },
        { num: 8, text: "Problems:", answer: "conflict" },
        { num: 9, text: "With:", answer: "humans" },
        { num: 10, text: "Need:", answer: "coexistence" }
      ]
    },
    {
      id: 80,
      title: "Sleep Research",
      formTitle: "THE SCIENCE OF SLEEP",
      formSubtitle: "Lecture Notes",
      instruction: "Write ONE WORD ONLY for each answer.",
      questions: [
        { num: 1, text: "Sleep is:", answer: "essential" },
        { num: 2, text: "Brain:", answer: "consolidates" },
        { num: 3, text: "Memories during:", answer: "REM" },
        { num: 4, text: "Body:", answer: "repairs" },
        { num: 5, text: "Recommended hours:", answer: "eight" },
        { num: 6, text: "Lack affects:", answer: "concentration" },
        { num: 7, text: "And:", answer: "mood" },
        { num: 8, text: "Insomnia:", answer: "common" },
        { num: 9, text: "Causes:", answer: "stress" },
        { num: 10, text: "Good:", answer: "hygiene" }
      ]
    }
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

// ==================== READING TESTS DATA (PASSAGE 1) ====================
const readingPassage1Tests = [
  {
    id: 31,
    title: "A Survivor's Story",
    subtitle: "One native bird in New Zealand that has managed to survive the introduction of non-native species",
    passage: `<p>As an island country with a fauna dominated by birds, New Zealand was once home to an owl species which is now extinct, the laughing owl, named for its distinctive cry. This bird was widespread throughout the islands when European settlers arrived in the middle of the 19th century and it remained in good numbers for some years thereafter. Where other native birds suffered from predation by the Polynesian rat, the laughing owl turned the tables and adapted its diet to include the rodent. It was also capable of catching and killing the other New Zealand owl, the morepork, and even larger birds, such as the weka. However, the laughing owl was wiped out around the beginning of the 20th century. Its demise caused by specimen collectors, habitat changes, and non-native predators including cats and stoats. Surprisingly, it is the smaller owl, the morepork, that has managed to survive until this day.</p>
<p>Speckled dark brown, with yellow eyes and long tails, they are around 29 centimeters long from head to tail and 175 grams in weight. Moreporks have fringes on the edge of their feathers, so they can fly almost silently and not alert potential prey. They have acute hearing and their large eyes are very sensitive to light.</p>
<p>Moreporks nest in tree hollows, in clumps of plants, or in cavities among rocks and roots. In the wild, moreporks usually start nesting in October, although zoo specimens have been recorded nesting in midwinter, possibly stimulated by an ample food supply. The female lays up to three white eggs, which she incubates for 20 to 30 days. During this time, she rarely hunts, and the male brings food to her. Once the chicks hatch, she stays mainly on the nest until the young owls are fully feathered. When hatched, chicks are covered in light grey down, and have their eyes closed. The eyes do not open until the eighth day after hatching. They can fly at around 35 days.</p>
<p>By day, moreporks sleep in roosts. By night, they hunt a variety of animals -- mainly large invertebrates including scarab and huhu beetles, moths, caterpillars and spiders. They also take small birds and mice. They can find suitable food in pine forests as well as native forest. A morepork uses its sharp talons to catch or stun its prey, which it then carries away in its bill. Moreporks are clever hunters, and birds such as robins, grey warblers and fantails can end up as their prey. In the day, these small birds sometimes mob drowsy moreporks and chase them away from their roosts. They force the sleepy predators to search for a more peaceful spot.</p>
<p>Moreporks have proved to be ungracious hosts. Scientists trying to establish a population of plovers on Motuora island in New Zealand's Hauraki Gulf were mystified as to why only two birds survived out of 75 placed there. The culprits turned out to be five pairs of moreporks that ate or chased away the new arrivals.</p>
<p>Although moreporks are still considered to be relatively common, it is likely that numbers are in gradual decline due to predation and loss of habitat. As the female is a hole-nester, she is vulnerable to predators such as stoats and possums during the breeding season, and eggs and chicks will also be at risk from rats. The use of pesticides is another possible threat to the owls though not a direct one. As moreporks are at the top of the food chain, they could be affected by an accumulative poison by consuming prey that has ingested poison.</p>
<p>The New Zealand Department of Conservation is taking steps to ensure the preservation of New Zealand's only native owl. The department is involved in measuring the population of moreporks and has put transmitters on a number of birds to determine survival and mortality. As well as being New Zealand's only native owl, the morepork has symbolic and spiritual importance, so in monitoring the birds it is hoped that the morepork will continue to survive and thrive.</p>
<p>At dusk, the melancholy sound of the morepork can be heard in forests and parks as it calls to other moreporks and claims territory. Its Maori name (ruru) echoes its two-part cry. In the tradition of the Maori people of New Zealand, the morepork, or ruru, was often seen as a careful guardian. A number of sayings referred to the bird's alertness. As a bird of the night, it was associated with the spirit world. Moreporks were believed to act as messengers to the gods in the heavens, flying along spiritual paths in the sky. They were the mediums used to communicate with the gods. The occasional high, piercing call of the morepork signified bad news, but the lower-pitched and more common "ruru" call heralded good news.</p>`,
    questions: [
      { type: 'tfng', rubric: 'Questions 1-7', instruction: 'Do the following statements agree with the information given in Reading Passage 1?', items: [
        { num: 1, text: 'Early European settlers made detailed studies of the morepork.', answer: 'NOT GIVEN' },
        { num: 2, text: 'The Polynesian rat had a negative effect on the number of laughing owls.', answer: 'FALSE' },
        { num: 3, text: 'The laughing owl was larger than the morepork.', answer: 'TRUE' },
        { num: 4, text: 'Rats pose a risk to young moreporks.', answer: 'TRUE' },
        { num: 5, text: 'The New Zealand Department of Conservation is hoping to limit the population of moreporks.', answer: 'FALSE' },
        { num: 6, text: 'Other bird species are frightened away when they hear the morepork\'s cry.', answer: 'NOT GIVEN' },
        { num: 7, text: 'In Maori tradition, the low call of the morepork had negative associations.', answer: 'FALSE' }
      ]},
      { type: 'completion', rubric: 'Questions 8-13', instruction: 'Complete the notes below. Choose ONE WORD AND/OR A NUMBER from the passage for each answer.', title: 'The Morepork', items: [
        { num: 8, beforeText: 'Appearance: approximately', afterText: 'in length', answer: '29 centimeters' },
        { num: 9, beforeText: 'Nesting: nests in trees, plants or spaces in roots and', afterText: '', answer: 'rocks' },
        { num: 10, beforeText: 'Hunting: transports its prey using its', afterText: '', answer: 'bill' },
        { num: 11, beforeText: 'can be chased away by other birds during the', afterText: '', answer: 'day' },
        { num: 12, beforeText: 'attacked', afterText: 'that had been introduced to Motuora island', answer: 'plovers' },
        { num: 13, beforeText: 'Threats: may be exposed to', afterText: 'in their prey', answer: 'poison' }
      ]}
    ]
  },
  {
    id: 32,
    title: "Wood: A Valuable Resource in New Zealand's Economy",
    subtitle: "The role of forestry in New Zealand's economic development",
    passage: `<p>New Zealand's economy has long depended on the export of primary products. Although traditionally this trade has been dominated by meat and dairy products, wood has become an increasingly significant export commodity over recent decades. Today, forestry and wood processing contribute around 3% of New Zealand's GDP and employ approximately 60,000 people.</p>
<p>The forestry industry in New Zealand is predominantly based on exotic, or introduced, species. The first exotic forests were planted in the early 1900s, primarily to replace native forests that had been cleared for farming. Today, approximately 90% of New Zealand's plantation forests are Pinus radiata, a softwood species originally from California. This tree grows particularly well in New Zealand's temperate climate, reaching maturity in just 25-30 years compared to 80 years or more in its native habitat.</p>
<p>New Zealand is uniquely positioned to supply wood to Asian markets due to its geographical location. Shipping costs to major markets such as China, Japan, and South Korea are considerably lower than from competing countries like Canada or Scandinavia. This advantage has helped New Zealand become one of the world's largest exporters of logs.</p>
<p>The export sector has grown substantially in recent years. China has emerged as the dominant market, taking approximately 80% of New Zealand's log exports. This heavy reliance on a single market has raised concerns about vulnerability to economic fluctuations and trade disputes.</p>
<p>Sustainability is a key focus for New Zealand's forestry industry. Unlike many countries where deforestation remains a significant problem, New Zealand's plantation forests are replanted after harvesting. The industry has also adopted various environmental certification schemes to demonstrate its commitment to sustainable practices.</p>
<p>Looking ahead, the industry faces several challenges. Climate change may affect tree growth rates and increase the risk of pests and diseases. Competition from other countries and wood substitutes also poses a threat. However, increasing global demand for sustainable building materials provides opportunities for growth.</p>`,
    questions: [
      { type: 'tfng', rubric: 'Questions 1-6', instruction: 'Do the following statements agree with the information given in Reading Passage 1?', items: [
        { num: 1, text: 'Meat and dairy have always been New Zealand\'s most valuable exports.', answer: 'FALSE' },
        { num: 2, text: 'Pinus radiata grows faster in New Zealand than in California.', answer: 'TRUE' },
        { num: 3, text: 'New Zealand is the world\'s largest exporter of logs.', answer: 'NOT GIVEN' },
        { num: 4, text: 'China purchases most of the logs exported from New Zealand.', answer: 'FALSE' },
        { num: 5, text: 'New Zealand\'s native forests are being cleared for timber production.', answer: 'NOT GIVEN' },
        { num: 6, text: 'Plantation forests in New Zealand are replanted after trees are cut.', answer: 'TRUE' }
      ]},
      { type: 'completion', rubric: 'Questions 7-13', instruction: 'Complete the notes below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', title: 'New Zealand Forestry Industry', items: [
        { num: 7, beforeText: 'New Zealand has lower', afterText: 'to Asian markets than Canada', answer: 'shipping costs' },
        { num: 8, beforeText: 'Forestry is an important', afterText: 'for New Zealand', answer: 'export sector' },
        { num: 9, beforeText: 'The industry employs approximately', afterText: 'people', answer: '60000' },
        { num: 10, beforeText: 'Most plantation forests consist of', afterText: 'trees', answer: 'softwood' },
        { num: 11, beforeText: 'The industry demonstrates', afterText: 'through environmental certification', answer: 'sustainability' },
        { num: 12, beforeText: 'Competition comes from countries like Canada and', afterText: '', answer: 'scandinavian countries' },
        { num: 13, beforeText: 'Future challenges include competition from', afterText: '', answer: 'wood substitutes' }
      ]}
    ]
  },
  {
    id: 33,
    title: "Portrait of Bianca Sforza",
    subtitle: "The investigation of a Renaissance artwork",
    passage: `<p>In 1998, a painting was sold at auction for $21,850 to an art collector named Peter Silverman. The portrait, executed in pen and colored chalks on vellum, depicted a young woman in profile, dressed in Renaissance fashion. Although the seller believed it to be a 19th-century German work, Silverman became convinced that it was something far more significant.</p>
<p>The portrait shows a young woman with her hair bound in an elaborate golden net, wearing a dress typical of the late 15th century Italian courts. Her expression is serene yet somewhat melancholic, with downcast eyes and a subtle smile. The technical skill evident in the work suggested to Silverman that this might be the work of a major Renaissance master.</p>
<p>Silverman took the portrait to various experts for analysis. Martin Kemp, an Oxford professor and Leonardo da Vinci scholar, was initially skeptical but became intrigued after examining the painting closely. He noted several features consistent with Leonardo's known works, including the lefthandedness evident in the hatching marks and the sophisticated treatment of the subject's costume and hair.</p>
<p>Scientific analysis was conducted in Switzerland using various techniques. X-ray examination revealed that the work was executed on a single piece of vellum with no later additions or alterations to the composition. Analysis of the paint layer showed that the pigments used were consistent with those available in the late 15th century.</p>
<p>One particularly significant finding concerned the subject's eyes. Close examination revealed that the pupils had been rendered using the sfumato technique, a method of blending colors pioneered by Leonardo. This subtle gradation created a sense of depth and lifelike quality characteristic of his portraits.</p>
<p>Based on historical research and comparison with other works, experts proposed that the subject was Bianca Sforza, a young noblewoman who was legitimized as an heir to the Duke of Milan in 1489. She was later married at age 13 and died in childbirth at 14, making this portrait a rare record of her brief life.</p>
<p>Despite the compelling evidence, the attribution to Leonardo remains controversial. Some scholars argue that the painting could be by a talented follower or student. The debate highlights the challenges of art authentication, where scientific analysis, stylistic comparison, and historical research must all align to reach a definitive conclusion.</p>`,
    questions: [
      { type: 'ynng', rubric: 'Questions 1-5', instruction: 'Do the following statements agree with the claims of the writer in Reading Passage 1?', items: [
        { num: 1, text: 'Peter Silverman paid too much for the portrait.', answer: 'YES' },
        { num: 2, text: 'Martin Kemp immediately recognized the painting as Leonardo\'s work.', answer: 'NO' },
        { num: 3, text: 'The hatching marks suggest the artist was left-handed.', answer: 'YES' },
        { num: 4, text: 'The portrait shows signs of having been altered over time.', answer: 'NO' },
        { num: 5, text: 'Bianca Sforza lived to old age.', answer: 'NOT GIVEN' }
      ]},
      { type: 'mcq', rubric: 'Questions 6-9', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 6, text: 'When the painting was first sold, it was thought to be', options: ['A. a Renaissance masterpiece', 'B. a 19th-century German work', 'C. a portrait by Leonardo', 'D. an Italian court painting'], answer: 'B' },
        { num: 7, text: 'The sfumato technique was used in the painting\'s', options: ['A. background', 'B. pupils', 'C. costume', 'D. hair'], answer: 'B' },
        { num: 8, text: 'Scientific analysis was conducted in', options: ['A. Oxford', 'B. Switzerland', 'C. Italy', 'D. Germany'], answer: 'B' },
        { num: 9, text: 'The attribution to Leonardo', options: ['A. has been universally accepted', 'B. remains controversial', 'C. has been definitively proven', 'D. was rejected by Kemp'], answer: 'B' }
      ]},
      { type: 'completion', rubric: 'Questions 10-13', instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', items: [
        { num: 10, beforeText: 'Scientific analysis was conducted in', afterText: '', answer: 'switzerland' },
        { num: 11, beforeText: 'Analysis of the', afterText: 'confirmed the pigments were period-appropriate', answer: 'paint layer' },
        { num: 12, beforeText: 'The sfumato technique created depth in the', afterText: '', answer: 'pupils' },
        { num: 13, beforeText: 'The debate highlights challenges in', afterText: '', answer: 'art authentication' }
      ]}
    ]
  },
  {
    id: 34,
    title: "The Pearl",
    subtitle: "The history and significance of pearls throughout human civilization",
    passage: `<p><strong>A</strong> Pearls have captivated humans for thousands of years. Unlike other gemstones that must be mined from the earth and cut to reveal their beauty, pearls emerge from the sea fully formed, requiring no enhancement to display their lustrous appeal. This natural perfection made them highly prized in ancient civilizations.</p>
<p><strong>B</strong> In ancient Rome, pearls were considered the ultimate status symbol. Only the highest-ranking citizens were permitted to wear them, and Julius Caesar reportedly passed a law limiting pearl ownership to the ruling classes. The Roman general Vitellius is said to have financed an entire military campaign by selling just one of his mother's pearl earrings.</p>
<p><strong>C</strong> Pearl fishing has been practiced for millennia in various parts of the world. The Persian Gulf was historically one of the most important sources, with Bahrain being particularly renowned for the quality of its pearls. In eastern countries such as China and Japan, pearl diving was a respected profession, though it came with significant risks including drowning and shark attacks.</p>
<p><strong>D</strong> The discovery of abundant oyster beds in the Americas following Columbus's voyages led to a "pearl rush" in the 16th century. Spanish conquistadors extracted enormous quantities of pearls from the waters around Venezuela and Panama. However, overfishing quickly depleted these resources.</p>
<p><strong>E</strong> The development of cultured pearls in Japan in the early 20th century revolutionized the industry. Kokichi Mikimoto perfected a technique for inducing oysters to produce pearls around inserted irritants. This made pearls accessible to ordinary consumers for the first time, though it also reduced their perceived value as rare treasures.</p>
<p><strong>F</strong> Today, Australia is one of the world's leading producers of South Sea pearls, which are prized for their large size and silvery-white color. China has emerged as the dominant producer of freshwater cultured pearls, flooding the market with affordable options. Meanwhile, Mallorca in Spain has become famous for its artificial pearls, which closely mimic the appearance of natural specimens.</p>
<p><strong>G</strong> Natural pearls remain extremely rare and valuable. Most come from older jewelry being resold, as wild pearl oysters are now scarce. A perfectly round natural pearl of good size can command prices exceeding those of diamonds of similar weight.</p>`,
    questions: [
      { type: 'matching', rubric: 'Questions 1-4', instruction: 'The passage has seven paragraphs, A-G. Which paragraph contains the following information?', items: [
        { num: 1, text: 'A comparison between natural and cultured pearls', answer: 'A' },
        { num: 2, text: 'A method that made pearls available to more people', answer: 'E' },
        { num: 3, text: 'The current rarity of natural pearls', answer: 'G' },
        { num: 4, text: 'Dangers associated with obtaining pearls', answer: 'C' }
      ]},
      { type: 'completion', rubric: 'Questions 5-10', instruction: 'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', title: 'The History of Pearls', items: [
        { num: 5, beforeText: 'In', afterText: ', pearls were restricted to the elite', answer: 'ancient Rome' },
        { num: 6, beforeText: 'Pearl diving was practiced in', afterText: 'such as China and Japan', answer: 'eastern countries' },
        { num: 7, beforeText: '', afterText: 'is famous for its artificial pearls', answer: 'Mallorca' },
        { num: 8, beforeText: 'Cultured pearls were developed in', afterText: '', answer: 'Japan' },
        { num: 9, beforeText: '', afterText: 'is a leading producer of South Sea pearls', answer: 'Australia' },
        { num: 10, beforeText: '', afterText: 'was historically known for high-quality natural pearls', answer: 'Bahrain' }
      ]},
      { type: 'tfng', rubric: 'Questions 11-13', instruction: 'Do the following statements agree with the information given in Reading Passage 1?', items: [
        { num: 11, text: 'Roman law restricted who could own pearls.', answer: 'TRUE' },
        { num: 12, text: 'Spanish pearl fishing in the Americas was sustainable.', answer: 'NOT GIVEN' },
        { num: 13, text: 'Natural pearls can be more valuable than diamonds.', answer: 'TRUE' }
      ]}
    ]
  },
  {
    id: 35,
    title: "Ambergris",
    subtitle: "The mysterious substance from the sea",
    passage: `<p>Ambergris is one of the most unusual and valuable substances found in nature. For centuries, its origins remained a mystery, with various theories ranging from sea foam to the droppings of mythical birds. We now know that it is produced in the digestive system of sperm whales, though the exact process remains partially unclear.</p>
<p>When sperm whales consume squid, their primary food source, the hard beaks of the squid cannot be digested. These accumulate in the whale's intestines, where they become coated with a waxy substance secreted by the whale's body. This mass may be expelled naturally or released when the whale dies. Either way, ambergris eventually makes its way to the ocean surface.</p>
<p>Fresh ambergris has a soft, almost tar-like consistency and an unpleasant fecal odor. However, exposure to sun, salt water, and air transforms it over years or even decades. It hardens into a waxy substance and develops a complex, pleasant aroma that has been described as sweet, earthy, and marine. The vomiting of the substance by the whale is one theory of how it is expelled, though this remains debated among scientists.</p>
<p>Historically, ambergris was highly prized in perfumery for its ability to fix fragrances and make them last longer on the skin. A tiny amount could make a perfume's scent persist for hours rather than minutes. It was also used in traditional medicine and even in cooking, though these uses have largely disappeared.</p>
<p>Today, synthetic alternatives have largely replaced ambergris in the perfume industry. However, collectors and traditional perfumers still seek out natural ambergris, and large pieces can fetch extraordinary prices. A 15-kilogram piece found on a beach in Thailand was reportedly worth over $200,000.</p>
<p>Finding ambergris is entirely a matter of luck. It can wash up on beaches anywhere in the world, though it is most commonly found in regions near sperm whale habitats. Beachcombers who discover it often have no idea what they have found, as it can easily be mistaken for ordinary rocks or debris.</p>`,
    questions: [
      { type: 'mcq', rubric: 'Questions 1-6', instruction: 'Choose the correct letter, A, B, C or D.', items: [
        { num: 1, text: 'Ambergris is produced by', options: ['A. sea birds', 'B. ocean waves', 'C. sperm whales', 'D. squid'], answer: 'C' },
        { num: 2, text: 'The hard parts of squid that accumulate are the', options: ['A. beaks', 'B. tentacles', 'C. eyes', 'D. bodies'], answer: 'A' },
        { num: 3, text: 'Fresh ambergris smells', options: ['A. sweet', 'B. marine', 'C. earthy', 'D. unpleasant'], answer: 'D' },
        { num: 4, text: 'The transformation of ambergris takes', options: ['A. days', 'B. years', 'C. hours', 'D. minutes'], answer: 'B' },
        { num: 5, text: 'Ambergris was traditionally valued in perfumery because it', options: ['A. made perfumes last longer', 'B. added color', 'C. was cheap', 'D. smelled of the sea'], answer: 'A' },
        { num: 6, text: 'Finding ambergris depends mainly on', options: ['A. skill', 'B. equipment', 'C. luck', 'D. knowledge'], answer: 'A' }
      ]},
      { type: 'completion', rubric: 'Questions 7-9', instruction: 'Complete the sentences below. Choose ONE WORD from the passage for each answer.', items: [
        { num: 7, beforeText: 'Squid', afterText: 'accumulate in the whale\'s intestines', answer: 'beaks' },
        { num: 8, beforeText: 'One theory suggests ambergris is expelled through', afterText: '', answer: 'vomiting' },
        { num: 9, beforeText: 'Over time, ambergris', afterText: 'into a waxy substance', answer: 'hardens' }
      ]},
      { type: 'tfng', rubric: 'Questions 10-13', instruction: 'Do the following statements agree with the information given in Reading Passage 1?', items: [
        { num: 10, text: 'Scientists fully understand how ambergris is formed.', answer: 'NOT GIVEN' },
        { num: 11, text: 'Ambergris is still commonly used in cooking.', answer: 'NOT GIVEN' },
        { num: 12, text: 'Synthetic substitutes have completely replaced natural ambergris.', answer: 'FALSE' },
        { num: 13, text: 'Ambergris is most often found far from whale habitats.', answer: 'NOT GIVEN' }
      ]}
    ]
  },
  {
    id: 36,
    title: "Tulip Mania",
    subtitle: "The rise and fall of tulip prices in 17th-century Holland",
    passage: `<p><strong>A</strong> In the early 17th century, the Netherlands experienced one of history's most remarkable economic phenomena: tulip mania. During this period, the price of tulip bulbs soared to extraordinary heights before crashing dramatically, ruining many speculators in the process.</p>
<p><strong>B</strong> Tulips were introduced to Western Europe from the Ottoman Empire in the mid-16th century. The flowers quickly became popular among the wealthy classes, who prized them for their vivid colors and exotic origins. Unlike other flowers, tulips could produce unpredictable variations in their colors and patterns, making rare varieties highly sought after.</p>
<p><strong>C</strong> By the 1630s, tulip trading had become a major component of Dutch commerce. Professional traders, wealthy merchants, and ordinary citizens all participated in the market. Some varieties became extraordinarily valuable: a single bulb of the prized Semper Augustus variety reportedly sold for 10,000 guilders – enough to buy a grand house in Amsterdam.</p>
<p><strong>D</strong> The market was particularly active during the winter months when bulbs could not be inspected in the ground. This led to trading in tulip futures – contracts for bulbs that would be delivered in the spring. Speculators bought and sold these contracts, hoping to profit from price increases.</p>
<p><strong>E</strong> The bubble burst in February 1637. Within days, prices collapsed to a fraction of their peak values. Those who had invested heavily in tulips faced financial ruin. The causes of the crash remain debated, but likely included oversupply, a plague epidemic that reduced demand, and simply the realization that prices had risen to unsustainable levels.</p>
<p><strong>F</strong> The long-term economic impact of tulip mania on the Dutch economy is often overstated. Most trading occurred among a relatively small group of speculators, and the broader economy continued to prosper. However, the episode has become a powerful symbol of speculative excess and the dangers of asset bubbles.</p>
<p><strong>G</strong> Today, tulip mania is frequently cited in discussions of modern financial bubbles, from the dot-com crash to cryptocurrency speculation. The lesson that prices can become detached from fundamental value remains relevant centuries later.</p>
<p><strong>H</strong> The Netherlands remains the world's leading producer of tulips, exporting billions of bulbs annually. The industry has never again experienced such extreme price volatility, but tulips continue to hold a special place in Dutch culture and commerce.</p>`,
    questions: [
      { type: 'matching', rubric: 'Questions 1-5', instruction: 'The passage has eight paragraphs, A-H. Which paragraph contains the following information?', items: [
        { num: 1, text: 'The impact of disease on the tulip market', answer: 'C' },
        { num: 2, text: 'The origins of tulips in Europe', answer: 'A' },
        { num: 3, text: 'A method of trading that developed in winter', answer: 'D' },
        { num: 4, text: 'Modern comparisons to tulip mania', answer: 'G' },
        { num: 5, text: 'The current state of tulip production', answer: 'H' }
      ]},
      { type: 'tfng', rubric: 'Questions 6-10', instruction: 'Do the following statements agree with the information given in Reading Passage 1?', items: [
        { num: 6, text: 'All Dutch citizens participated in tulip trading.', answer: 'NOT GIVEN' },
        { num: 7, text: 'The most expensive tulip bulb could buy a large house.', answer: 'FALSE' },
        { num: 8, text: 'Tulip futures were contracts for future delivery.', answer: 'TRUE' },
        { num: 9, text: 'The crash destroyed the Dutch economy.', answer: 'FALSE' },
        { num: 10, text: 'The Netherlands still leads global tulip production.', answer: 'TRUE' }
      ]},
      { type: 'completion', rubric: 'Questions 11-13', instruction: 'Complete the sentences below. Choose ONE WORD from the passage for each answer.', items: [
        { num: 11, beforeText: 'Tulip trading became a major part of Dutch', afterText: '', answer: 'commerce' },
        { num: 12, beforeText: 'Tulips were prized for their varied', afterText: 'and patterns', answer: 'colors' },
        { num: 13, beforeText: 'The market attracted', afterText: 'hoping to profit', answer: 'speculators' }
      ]}
    ]
  },
  {
    id: 37,
    title: "Caral: An Ancient South American City",
    subtitle: "Discoveries about one of the oldest urban centers in the Americas",
    passage: `<p>The ancient city of Caral, located in the Supe Valley of Peru, has revolutionized our understanding of early civilization in the Americas. Dating back approximately 5,000 years, it is now recognized as one of the oldest urban centers in the Western Hemisphere, contemporary with the great pyramids of Egypt.</p>
<p>Caral was first surveyed in 1905, but its significance was not recognized for nearly a century. Archaeologists initially assumed the site dated to a much later period because they found no ceramics – pottery was considered a hallmark of complex societies. It was only when carbon dating was applied to plant materials found at the site that the true age of Caral was revealed.</p>
<p>The city covers approximately 150 acres and includes six large pyramidal structures, numerous smaller buildings, two sunken circular plazas, and residential areas. The largest pyramid stands about 60 feet tall and was constructed in successive layers over several centuries. These monumental structures required coordinated labor by hundreds or thousands of workers.</p>
<p>One of Caral's most intriguing aspects is its apparent lack of warfare. Archaeologists have found no weapons, defensive walls, or evidence of violent conflict. This stands in stark contrast to later South American civilizations, which often engaged in warfare and human sacrifice.</p>
<p>The economy of Caral appears to have been based on fishing and farming. The coastal location provided abundant fish, which were preserved by drying. Cotton was a major crop, with seeds found throughout the site. Inland communities provided agricultural products, suggesting an extensive trade network. The residents also grew maize, which became a staple food, and used canals for irrigation.</p>
<p>Archaeologists have used a technique called flotation to recover small plant remains from the soil. This involves mixing soil samples with water, causing lighter organic materials to float to the surface where they can be collected. Through this method, researchers have identified numerous cultivated and wild plant species used by Caral's inhabitants.</p>
<p>The collapse of Caral around 1800 BCE remains something of a mystery. Possible explanations include environmental changes, such as a major earthquake that may have disrupted irrigation systems, or social factors that led to the abandonment of the city.</p>`,
    questions: [
      { type: 'tfng', rubric: 'Questions 1-6', instruction: 'Do the following statements agree with the information given in Reading Passage 1?', items: [
        { num: 1, text: 'Caral was recognized as an important site immediately after its discovery.', answer: 'FALSE' },
        { num: 2, text: 'The age of Caral was determined using carbon dating.', answer: 'TRUE' },
        { num: 3, text: 'The largest pyramid was built in one construction phase.', answer: 'FALSE' },
        { num: 4, text: 'Evidence suggests Caral was a peaceful society.', answer: 'TRUE' },
        { num: 5, text: 'Caral traded exclusively with coastal communities.', answer: 'NOT GIVEN' },
        { num: 6, text: 'The exact cause of Caral\'s abandonment is known.', answer: 'FALSE' }
      ]},
      { type: 'completion', rubric: 'Questions 7-13', instruction: 'Complete the notes below. Choose ONE WORD from the passage for each answer.', title: 'Caral: Key Facts', items: [
        { num: 7, beforeText: 'Cotton', afterText: 'were found throughout the site', answer: 'seeds' },
        { num: 8, beforeText: 'Coastal communities provided', afterText: 'for inland areas', answer: 'shells' },
        { num: 9, beforeText: 'Coastal residents ate dried', afterText: '', answer: 'fish' },
        { num: 10, beforeText: 'Irrigation was provided by', afterText: '', answer: 'canals' },
        { num: 11, beforeText: '', afterText: 'became a staple food crop', answer: 'maize' },
        { num: 12, beforeText: '', afterText: 'was an important crop for trade', answer: 'cotton' },
        { num: 13, beforeText: 'The', afterText: 'technique was used to recover plant remains', answer: 'flotation' }
      ]}
    ]
  },
  {
    id: 38,
    title: "The History of Tea",
    subtitle: "How tea became the world's most popular beverage",
    passage: `<p>Tea has been consumed for thousands of years and is now the most widely drunk beverage in the world after water. Its origins lie in ancient China, where legend attributes its discovery to Emperor Shen Nung in 2737 BCE, though archaeological evidence suggests tea drinking began somewhat later.</p>
<p>The earliest physical evidence of tea comes from tombs dating to around 200 BCE, where containers of tea leaves have been found. By the Tang Dynasty (618-907 CE), tea had become China's national drink. The first book devoted entirely to tea, written by Lu Yu in 760 CE, established the cultural significance of tea preparation and consumption.</p>
<p>Buddhist monks played a crucial role in spreading tea culture. They used tea to help stay awake during long meditation sessions and carried the practice to Japan and other Asian countries. In Japan, tea drinking developed into an elaborate ritual known as the tea ceremony.</p>
<p>Europeans first encountered tea in the 16th century through Portuguese traders. However, it was the Dutch who established the first significant tea trade with China in the early 17th century. The Dutch East India Company began importing tea to Europe, where it quickly became fashionable among the wealthy.</p>
<p>Tea arrived in Britain in the mid-17th century and became increasingly popular, particularly after Catherine of Braganza, the Portuguese wife of Charles II, introduced tea drinking at court. By the 18th century, tea had become Britain's national beverage, though high taxes led to widespread smuggling.</p>
<p>The British tea trade with China created an enormous trade deficit, as China accepted only silver in payment. This led to the infamous opium trade, as Britain sought goods that China would buy. When China attempted to suppress the opium trade, the result was the Opium Wars of the 1840s.</p>
<p>The British subsequently developed tea plantations in India and Ceylon (now Sri Lanka) to reduce dependence on Chinese tea. Tea from these regions eventually came to dominate the market. The development of fast sailing ships called clippers in the mid-19th century made tea transport faster and more economical.</p>`,
    questions: [
      { type: 'completion', rubric: 'Questions 1-7', instruction: 'Complete the notes below. Choose ONE WORD from the passage for each answer.', title: 'The History of Tea', items: [
        { num: 1, beforeText: 'Early evidence of tea found in ancient', afterText: '', answer: 'tombs' },
        { num: 2, beforeText: 'Lu Yu wrote the first', afterText: 'about tea', answer: 'book' },
        { num: 3, beforeText: 'Buddhist', afterText: 'helped spread tea to other countries', answer: 'monks' },
        { num: 4, beforeText: 'The', afterText: 'established the first major European tea trade', answer: 'Dutch' },
        { num: 5, beforeText: 'High taxes in Britain led to tea', afterText: '', answer: 'smuggling' },
        { num: 6, beforeText: 'Britain developed tea plantations in', afterText: 'and Ceylon', answer: 'India' },
        { num: 7, beforeText: 'Fast ships called', afterText: 'improved tea transport', answer: 'clippers' }
      ]},
      { type: 'tfng', rubric: 'Questions 8-13', instruction: 'Do the following statements agree with the information given in Reading Passage 1?', items: [
        { num: 8, text: 'Archaeological evidence confirms that Emperor Shen Nung discovered tea.', answer: 'FALSE' },
        { num: 9, text: 'The Japanese tea ceremony was influenced by Chinese practices.', answer: 'NOT GIVEN' },
        { num: 10, text: 'The Portuguese established the first European tea trade with China.', answer: 'FALSE' },
        { num: 11, text: 'Catherine of Braganza popularized tea drinking in the British court.', answer: 'TRUE' },
        { num: 12, text: 'The Opium Wars were caused by disputes over tea trade.', answer: 'TRUE' },
        { num: 13, text: 'Chinese tea still dominates the British market today.', answer: 'NOT GIVEN' }
      ]}
    ]
  },
  {
    id: 39,
    title: "The Life of Beatrix Potter",
    subtitle: "The creator of Peter Rabbit and her remarkable achievements",
    passage: `<p>Beatrix Potter, born in London in 1866, is best known as the creator of Peter Rabbit and numerous other beloved children's characters. However, her life encompassed far more than children's literature – she was also a serious naturalist, a successful businesswoman, and a dedicated conservationist.</p>
<p>Potter's childhood was isolated but intellectually stimulating. Educated at home by a governess, she had few friends her own age but developed an intense interest in the natural world. She kept a menagerie of small animals, which she studied and drew meticulously. As a teenager, she began recording her observations in a diary written in a secret code that was not deciphered until after her death.</p>
<p>Potter taught herself to draw by copying works in museums and galleries. She became particularly skilled at painting fungi and other botanical subjects. Her detailed illustrations of mushrooms caught the attention of professional artists and scientists, who encouraged her to pursue this work.</p>
<p>In her late twenties, Potter developed an interest in mycology, the study of fungi. She conducted careful research, including growing fungal cultures and examining specimens under a microscope. She eventually wrote a paper on spore germination that was presented to the Linnean Society in 1897. However, as a woman and an amateur, her scientific contributions received little recognition at the time.</p>
<p>The Tale of Peter Rabbit originated in a letter Potter wrote to a sick child in 1893. She later expanded this into a book, which she initially self-published in 1901 before finding a commercial publisher. The book was an immediate success, and Potter went on to write and illustrate over twenty more books.</p>
<p>The profits from her books allowed Potter to purchase Hill Top Farm in England's Lake District, fulfilling a long-held ambition to own property in the countryside. She became increasingly devoted to sheep farming and land conservation, eventually owning thousands of acres which she left to the National Trust upon her death in 1943.</p>
<p>Today, Potter is remembered not only for her contributions to children's literature but also for her role in preserving the Lake District landscape. Her former homes are now museums, visited by hundreds of thousands of people each year.</p>`,
    questions: [
      { type: 'completion', rubric: 'Questions 1-6', instruction: 'Complete the notes below. Choose ONE WORD from the passage for each answer.', title: 'Beatrix Potter: Early Life', items: [
        { num: 1, beforeText: 'Potter was educated at home by a', afterText: '', answer: 'governess' },
        { num: 2, beforeText: 'She kept observations in a coded', afterText: '', answer: 'diary' },
        { num: 3, beforeText: 'She learned to draw by copying works from', afterText: 'and galleries', answer: 'artists' },
        { num: 4, beforeText: 'She studied botanical subjects in', afterText: '', answer: 'museums' },
        { num: 5, beforeText: 'She had a long-held', afterText: 'to own countryside property', answer: 'ambition' },
        { num: 6, beforeText: 'Her paper was about', afterText: ', the study of fungi', answer: 'mycology' }
      ]},
      { type: 'tfng', rubric: 'Questions 7-13', instruction: 'Do the following statements agree with the information given in Reading Passage 1?', items: [
        { num: 7, text: 'Potter had many close friends during her childhood.', answer: 'FALSE' },
        { num: 8, text: 'Her secret diary was decoded while she was still alive.', answer: 'NOT GIVEN' },
        { num: 9, text: 'Potter was self-taught as an artist.', answer: 'TRUE' },
        { num: 10, text: 'Her scientific work was highly praised by the Linnean Society.', answer: 'FALSE' },
        { num: 11, text: 'Peter Rabbit was first written as a letter.', answer: 'TRUE' },
        { num: 12, text: 'Potter\'s first book was published by a major company.', answer: 'FALSE' },
        { num: 13, text: 'Potter\'s Lake District properties are now national parks.', answer: 'NOT GIVEN' }
      ]}
    ]
  },
  {
    id: 40,
    title: "Chilli Peppers",
    subtitle: "The science and culture of spicy food",
    passage: `<p>Chilli peppers are among the most widely used spices in the world, adding heat and flavor to cuisines on every continent. Originally native to the Americas, they were spread globally by European explorers and traders, becoming essential ingredients in Asian, African, and European cooking.</p>
<p>The heat of chilli peppers comes from capsaicin, a chemical compound concentrated in the seeds and white membranes of the fruit. When capsaicin contacts nerve receptors in the mouth, it triggers a burning sensation that the brain interprets as heat. This sensation is not actual temperature – chilli peppers do not raise the temperature of food – but a neurological response to the chemical.</p>
<p>The intensity of chilli heat is measured on the Scoville scale, developed by pharmacist Wilbur Scoville in 1912. Pure capsaicin scores 16 million units, while a common jalapeño pepper rates around 5,000 units. The world's hottest peppers, such as the Carolina Reaper, can exceed 2 million units.</p>
<p>Before the invention of refrigeration, chilli peppers served an important preservation function. Their antimicrobial properties helped prevent food spoilage, which may explain why hot spices became particularly popular in tropical regions where food spoils quickly.</p>
<p>Eating spicy food triggers the release of endorphins, natural pain-relieving chemicals that produce feelings of pleasure. This may explain why some people actively seek out increasingly hot foods despite the discomfort involved. The body also responds to capsaicin by producing sweat, which helps cool the body in hot climates.</p>
<p>Chilli peppers feature in folk remedies around the world. They are used to treat conditions ranging from sore throats to arthritis. Modern research has confirmed some health benefits: capsaicin can speed up metabolism, potentially aiding weight loss, and may help protect the stomach lining against ulcers.</p>
<p>The global chilli market continues to grow, with new hybrid varieties being developed for both flavor and heat intensity. While some enthusiasts compete to eat the hottest peppers, others appreciate the subtler flavors that different varieties can bring to food. Chilli festivals and eating contests have become popular events, and recipes incorporating chillies are shared worldwide.</p>`,
    questions: [
      { type: 'tfng', rubric: 'Questions 1-7', instruction: 'Do the following statements agree with the information given in Reading Passage 1?', items: [
        { num: 1, text: 'Chilli peppers originated in Asia.', answer: 'FALSE' },
        { num: 2, text: 'Capsaicin actually increases the temperature of food.', answer: 'TRUE' },
        { num: 3, text: 'The Scoville scale measures flavor intensity.', answer: 'FALSE' },
        { num: 4, text: 'Jalapeño peppers are hotter than Carolina Reapers.', answer: 'FALSE' },
        { num: 5, text: 'Chillies were used to preserve food before modern methods existed.', answer: 'FALSE' },
        { num: 6, text: 'All folk remedies using chilli have been scientifically verified.', answer: 'NOT GIVEN' },
        { num: 7, text: 'The chilli market is expanding.', answer: 'TRUE' }
      ]},
      { type: 'completion', rubric: 'Questions 8-13', instruction: 'Complete the sentences below. Choose ONE WORD from the passage for each answer.', items: [
        { num: 8, beforeText: 'Before', afterText: ', chillies helped preserve food', answer: 'refrigeration' },
        { num: 9, beforeText: 'Capsaicin makes the body', afterText: 'to cool down', answer: 'sweat' },
        { num: 10, beforeText: 'Chillies are shared globally through', afterText: '', answer: 'recipes' },
        { num: 11, beforeText: 'Capsaicin can increase', afterText: 'and aid weight loss', answer: 'metabolism' },
        { num: 12, beforeText: 'Capsaicin may help protect the', afterText: 'lining', answer: 'stomach' },
        { num: 13, beforeText: 'Endorphins produce feelings similar to those from', afterText: '', answer: 'exercise' }
      ]}
    ]
  }
];

// ==================== READING PAGE COMPONENT ====================
// ==================== READING PAGE COMPONENT ====================
// ==================== READING PAGE COMPONENT ====================
const ReadingPage = ({ subPage, setSubPage }) => {
  const { isDark } = useTheme();
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
    return saved ? JSON.parse(saved) : [];
  });
  const [highlightPopup, setHighlightPopup] = useState({ show: false, x: 0, y: 0, range: null, isHighlighted: false });
  const timerRef = useRef(null);
  const passageRef = useRef(null);
  const questionsRef = useRef(null);
  const containerRef = useRef(null);

  const selectedTest = selectedTestId ? readingPassage1Tests.find(t => t.id === selectedTestId) : null;

  // Parse URL on mount
  useEffect(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'reading' && pathParts[1] === 'passage1' && pathParts[2]) {
      const testId = parseInt(pathParts[2]);
      if (readingPassage1Tests.find(t => t.id === testId)) {
        setSelectedTestId(testId);
        setSubPage('passage1');
      }
    }
  }, []);

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
    setSelectedTestId(testId);
    setUserAnswers({});
    setShowResults(false);
    setShowResultsModal(false);
    setTimerSeconds(timerMode === 'countdown' ? 20 * 60 : 0);
    setTimerRunning(true);
    window.history.pushState({}, '', `/reading/passage1/${testId}`);
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
    window.history.pushState({}, '', '/reading/passage1');
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
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>10 TESTS</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Passage 1 Practice</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>13 questions • T/F/NG, completion, matching, MCQ</p>
            </div>

            {['Passage 2', 'Passage 3'].map((name, i) => (
              <div key={i} style={{ padding: '2rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', opacity: 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>📄</span>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', background: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>COMING SOON</span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{name} Practice</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Coming soon</p>
              </div>
            ))}
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
            13 questions per test • 20 minutes recommended
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
              left: Math.min(highlightPopup.x, window.innerWidth - 150),
              top: Math.max(highlightPopup.y, 10),
              background: isDark ? '#374151' : 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              padding: '0.5rem',
              display: 'flex',
              gap: '0.5rem',
              zIndex: 2000
            }}
          >
            {highlightPopup.isHighlighted ? (
              <button
                onClick={removeHighlight}
                style={{
                  padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none',
                  background: '#ef4444', color: 'white', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: '500'
                }}
              >
                Remove Highlight
              </button>
            ) : (
              <button
                onClick={applyHighlight}
                style={{
                  padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none',
                  background: 'rgba(255, 235, 59, 0.8)', color: '#333', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem'
                }}
              >
                🖍️ Highlight
              </button>
            )}
          </div>
        )}

        {/* ===== FIXED HEADER ===== */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.5rem', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)',
          flexShrink: 0, zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--purple-500)' }}>IELTS</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Test {selectedTest.id}</span>
          </div>

          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {showTimer && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                background: timerMode === 'countdown' && timerSeconds <= 60 ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)', 
                borderRadius: '8px', border: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '1.1rem' }}>⏱</span>
                <span style={{ 
                  fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '600', 
                  color: timerMode === 'countdown' && timerSeconds <= 60 ? '#ef4444' : 'var(--text-primary)', 
                  minWidth: '60px' 
                }}>
                  {formatTime(timerSeconds)}
                </span>
              </div>
            )}
            <button onClick={() => setShowTimer(!showTimer)} title={showTimer ? 'Hide timer' : 'Show timer'}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              {showTimer ? '🙈' : '👁️'}
            </button>
            <button onClick={() => { setTimerMode(m => m === 'countdown' ? 'stopwatch' : 'countdown'); setTimerSeconds(timerMode === 'countdown' ? 0 : 20*60); }} title="Toggle countdown/stopwatch"
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              {timerMode === 'countdown' ? '⏳' : '⏱'}
            </button>
            <button onClick={() => setTimerRunning(!timerRunning)} title={timerRunning ? 'Pause' : 'Resume'}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              {timerRunning ? '⏸' : '▶️'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={exitTest}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
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
            <h2 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '600', color: 'var(--purple-500)', marginBottom: '0.5rem' }}>
              {selectedTest.title}
            </h2>
            <p style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {selectedTest.subtitle}
            </p>
            <div 
              style={{ color: 'var(--text-primary)', lineHeight: '1.8', fontSize: '0.95rem' }}
              dangerouslySetInnerHTML={{ __html: selectedTest.passage }}
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
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{section.instruction}</p>
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
                      <p style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
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
                      <p style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                        <strong style={{ color: 'var(--purple-400)' }}>{item.num}.</strong> {item.text}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {item.options.map(opt => {
                          const optLetter = opt.charAt(0);
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
                              <span style={{ color: 'var(--text-primary)' }}>{opt}</span>
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
                          <span style={{ color: 'var(--text-primary)', flex: 1, minWidth: '200px' }}>{item.text}</span>
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

                {/* Completion Questions - Styled like the HTML */}
                {section.type === 'completion' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {section.items.map((item) => {
                      const userAns = userAnswers[item.num] || '';
                      const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                      const isWrong = showResults && userAns && !isCorrect;

                      return (
                        <div 
                          key={item.num} 
                          id={`question-${item.num}`}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            flexWrap: 'wrap',
                            fontSize: '0.95rem', 
                            color: 'var(--text-primary)',
                            lineHeight: '1.8'
                          }}
                        >
                          <strong style={{ color: 'var(--purple-400)', marginRight: '0.25rem' }}>{item.num}.</strong>
                          {item.beforeText && <span>{item.beforeText}</span>}
                          <input 
                            type="text" 
                            value={userAns} 
                            onChange={(e) => handleAnswerChange(item.num, e.target.value)}
                            disabled={showResults} 
                            placeholder="____________"
                            style={{ 
                              padding: '0.4rem 0.6rem', 
                              borderRadius: '4px', 
                              minWidth: '140px',
                              maxWidth: '200px',
                              border: `2px dashed ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`,
                              background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)',
                              color: 'var(--text-primary)',
                              fontSize: '0.95rem'
                            }} 
                          />
                          {item.afterText && <span>{item.afterText}</span>}
                          {showResults && (
                            <span style={{ 
                              color: isCorrect ? '#22c55e' : '#ef4444', 
                              fontSize: '0.85rem',
                              marginLeft: '0.5rem'
                            }}>
                              {isCorrect ? '✓' : `✗ Correct: ${item.answer}`}
                            </span>
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

  if (!user) return null;
  
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Welcome back, <span style={{ color: 'var(--purple-400)' }}>{profile?.name || 'Student'}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {profile?.email}
            </p>
          </div>
          <button 
            onClick={() => signOut().then(() => setCurrentPage('home'))} 
            style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Sign Out
          </button>
        </div>

        {/* Target Score Card */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>🎯 Target Band Score</h2>
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
              style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                background: 'var(--input-bg)', 
                color: 'var(--text-primary)', 
                fontSize: '1.5rem', 
                fontWeight: '600',
                cursor: 'pointer',
                width: '120px'
              }}
            >
              {['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'].map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          )}
          
          <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'var(--tag-bg)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {parseFloat(profile?.target_score || 7) >= 7.5 
                ? '🌟 Aiming high! Focus on advanced vocabulary and complex grammar structures.'
                : parseFloat(profile?.target_score || 7) >= 6.5
                ? '📈 Solid goal! Build fluency and work on extending your answers.'
                : '💪 Great starting point! Focus on accuracy and common topic vocabulary.'}
            </p>
          </div>
        </div>

        {/* Study Sections */}
        <div style={{ padding: '2rem', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>📚 Continue Learning</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Speaking', page: 'speaking', icon: '🎤', desc: 'Part 1, 2, 3 Practice' },
              { label: 'Listening', page: 'listening', icon: '🎧', desc: '80 Practice Tests' },
              { label: 'Grammar', page: 'grammar', icon: '📝', desc: '6 Essential Lessons' },
              { label: 'Reading', page: 'reading', icon: '📖', desc: 'Coming Soon' },
              { label: 'Writing', page: 'writing', icon: '✍️', desc: 'Coming Soon' }
            ].map((action) => (
              <button 
                key={action.page} 
                onClick={() => setCurrentPage(action.page)} 
                style={{ 
                  padding: '1.25rem', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  background: 'transparent', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer', 
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.5rem' }}>{action.icon}</span>
                <span style={{ fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>{action.label}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{action.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(135deg, var(--purple-600-20), var(--purple-700-20))', border: '1px solid var(--purple-500-30)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>💡 Today's Tip</h3>
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
      case 'listening': return <ListeningPage subPage={listeningSubPage} setSubPage={(sp) => updateSubPage('listening', sp)} />;
      case 'reading': return <ReadingPage subPage={readingSubPage} setSubPage={(sp) => updateSubPage('reading', sp)} />;
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
