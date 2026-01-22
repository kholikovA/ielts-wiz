import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';

// ==================== CONTEXT ====================
const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ==================== COMPONENTS ====================

// Navigation Component
const Navigation = ({ currentPage, setCurrentPage }) => {
  const { user, profile, signOut } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'speaking', label: 'Speaking' },
    { id: 'writing', label: 'Writing' },
    { id: 'reading', label: 'Reading' },
    { id: 'listening', label: 'Listening' },
    { id: 'grammar', label: 'Grammar' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '1rem 2rem',
      background: 'rgba(9, 9, 11, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div 
          onClick={() => setCurrentPage('home')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--purple-600), var(--purple-800))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            fontSize: '1rem',
          }}>
            9+
          </div>
          <span style={{
            fontWeight: '700',
            fontSize: '1.25rem',
            letterSpacing: '-0.02em',
          }}>
            IELTS<span style={{ color: 'var(--purple-400)' }}>Pro</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hide-mobile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: currentPage === item.id ? 'var(--purple-700)' : 'transparent',
                color: currentPage === item.id ? 'white' : 'var(--gray-400)',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* User Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              <button
                onClick={() => setCurrentPage('dashboard')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--gray-300)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Dashboard
              </button>
              <div 
                onClick={() => setCurrentPage('dashboard')}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--purple-500), var(--purple-700))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {profile?.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <button
              onClick={() => setCurrentPage('login')}
              style={{
                padding: '0.625rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

// Hero Section
const HeroSection = ({ setCurrentPage }) => {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8rem 2rem 4rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      {/* Grid Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '1000px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Badge */}
        <div className="animate-fadeInUp" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '100px',
          background: 'rgba(147, 51, 234, 0.1)',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          marginBottom: '2rem',
          fontSize: '0.85rem',
          color: 'var(--purple-300)',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--success)',
            animation: 'pulse 2s infinite',
          }} />
          Academic IELTS Preparation
        </div>

        {/* Main Heading */}
        <h1 className="animate-fadeInUp" style={{
          fontSize: 'clamp(3rem, 8vw, 5.5rem)',
          fontWeight: '800',
          lineHeight: '1.1',
          marginBottom: '1.5rem',
          letterSpacing: '-0.03em',
          animationDelay: '0.1s',
        }}>
          Master IELTS with
          <br />
          <span className="gradient-text">Precision & Confidence</span>
        </h1>

        {/* Subheading */}
        <p className="animate-fadeInUp" style={{
          fontSize: '1.25rem',
          color: 'var(--gray-400)',
          maxWidth: '600px',
          margin: '0 auto 3rem',
          animationDelay: '0.2s',
        }}>
          Advanced strategies, real exam questions, and personalized tracking 
          to help you achieve your target band score.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fadeInUp" style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          animationDelay: '0.3s',
        }}>
          <button
            onClick={() => setCurrentPage('signup')}
            style={{
              padding: '1rem 2.5rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 30px rgba(147, 51, 234, 0.4)',
            }}
          >
            Start Free Trial
          </button>
          <button
            onClick={() => setCurrentPage('speaking')}
            style={{
              padding: '1rem 2.5rem',
              borderRadius: '14px',
              border: '1px solid var(--gray-700)',
              background: 'transparent',
              color: 'var(--gray-200)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Explore Resources
          </button>
        </div>

        {/* Stats */}
        <div className="animate-fadeInUp" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '4rem',
          marginTop: '5rem',
          flexWrap: 'wrap',
          animationDelay: '0.4s',
        }}>
          {[
            { value: '50K+', label: 'Students' },
            { value: '8.5', label: 'Avg Score' },
            { value: '1000+', label: 'Questions' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2.5rem',
                fontWeight: '700',
                color: 'var(--purple-400)',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: 'var(--gray-500)',
                marginTop: '0.25rem',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Skills Overview Section
const SkillsSection = ({ setCurrentPage }) => {
  const skills = [
    {
      id: 'speaking',
      title: 'Speaking',
      icon: '🎤',
      description: 'Practice with real exam questions and get feedback on all assessment criteria.',
      color: '#a855f7',
    },
    {
      id: 'writing',
      title: 'Writing',
      icon: '✍️',
      description: 'Master Task 1 and Task 2 with advanced grammar and essay structures.',
      color: '#ec4899',
    },
    {
      id: 'reading',
      title: 'Reading',
      icon: '📖',
      description: 'Build speed and accuracy with passage analysis techniques.',
      color: '#06b6d4',
    },
    {
      id: 'listening',
      title: 'Listening',
      icon: '🎧',
      description: 'Train your ear with varied accents and question types.',
      color: '#10b981',
    },
  ];

  return (
    <section style={{
      padding: '6rem 2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
        }}>
          Four Skills, One Goal
        </h2>
        <p style={{ color: 'var(--gray-400)', fontSize: '1.1rem' }}>
          Comprehensive preparation for every section of the IELTS Academic test
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
      }}>
        {skills.map((skill, index) => (
          <div
            key={skill.id}
            onClick={() => setCurrentPage(skill.id)}
            className="animate-fadeInUp"
            style={{
              padding: '2rem',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              animationDelay: `${index * 0.1}s`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = skill.color;
              e.currentTarget.style.boxShadow = `0 20px 40px ${skill.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {skill.icon}
            </div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '0.75rem',
              color: skill.color,
            }}>
              {skill.title}
            </h3>
            <p style={{
              color: 'var(--gray-400)',
              fontSize: '0.95rem',
              lineHeight: '1.6',
            }}>
              {skill.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

// Features Section
const FeaturesSection = ({ setCurrentPage }) => {
  return (
    <section style={{
      padding: '6rem 2rem',
      background: 'linear-gradient(180deg, transparent, rgba(147, 51, 234, 0.03), transparent)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem',
        }}>
          {/* Grammar Card */}
          <div
            onClick={() => setCurrentPage('grammar')}
            style={{
              padding: '2.5rem',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(147, 51, 234, 0.02))',
              border: '1px solid rgba(147, 51, 234, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--purple-400)',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Featured
            </div>
            <h3 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              marginBottom: '1rem',
            }}>
              Advanced Grammar
            </h3>
            <p style={{
              color: 'var(--gray-400)',
              marginBottom: '1.5rem',
              lineHeight: '1.7',
            }}>
              Master complex structures, conditionals, and cohesive devices 
              to boost your Writing and Speaking scores.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                background: 'rgba(147, 51, 234, 0.2)',
                fontSize: '0.8rem',
                color: 'var(--purple-300)',
              }}>
                Writing
              </span>
              <span style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                background: 'rgba(147, 51, 234, 0.2)',
                fontSize: '0.8rem',
                color: 'var(--purple-300)',
              }}>
                Speaking
              </span>
            </div>
          </div>

          {/* Speaking Questions Card */}
          <div
            onClick={() => setCurrentPage('speaking')}
            style={{
              padding: '2.5rem',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.02))',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: '#ec4899',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Updated Weekly
            </div>
            <h3 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              marginBottom: '1rem',
            }}>
              Recent Speaking Questions
            </h3>
            <p style={{
              color: 'var(--gray-400)',
              marginBottom: '1.5rem',
              lineHeight: '1.7',
            }}>
              Practice with the latest questions from actual IELTS exams, 
              organized by part and topic.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['Part 1', 'Part 2', 'Part 3'].map(part => (
                <span key={part} style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(236, 72, 153, 0.2)',
                  fontSize: '0.8rem',
                  color: '#f472b6',
                }}>
                  {part}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Speaking Page Component
const SpeakingPage = () => {
  const { user } = useAuth();
  const [selectedPart, setSelectedPart] = useState('part1');
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const parts = [
    { id: 'part1', label: 'Part 1', description: 'Introduction & Interview' },
    { id: 'part2', label: 'Part 2', description: 'Long Turn (Cue Card)' },
    { id: 'part3', label: 'Part 3', description: 'Discussion' },
  ];

  useEffect(() => {
    fetchQuestions();
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('speaking_questions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('skill', 'speaking');
      
      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleMarkComplete = async (questionId) => {
    if (!user) {
      alert('Please sign in to track your progress');
      return;
    }

    const isCompleted = progress.some(p => p.item_id === questionId);
    
    if (isCompleted) {
      // Remove progress
      try {
        await supabase
          .from('progress')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', questionId);
        
        setProgress(progress.filter(p => p.item_id !== questionId));
      } catch (error) {
        console.error('Error removing progress:', error);
      }
    } else {
      // Add progress
      try {
        const { data, error } = await supabase
          .from('progress')
          .insert({
            user_id: user.id,
            skill: 'speaking',
            category: selectedPart,
            item_id: questionId
          })
          .select()
          .single();
        
        if (error) throw error;
        setProgress([...progress, data]);
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  const isCompleted = (questionId) => progress.some(p => p.item_id === questionId);

  const filteredQuestions = questions.filter(q => q.part === selectedPart);

  if (loading) {
    return (
      <div style={{
        paddingTop: '100px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '0.75rem',
          }}>
            Speaking <span style={{ color: 'var(--purple-400)' }}>Practice</span>
          </h1>
          <p style={{ color: 'var(--gray-400)', fontSize: '1.1rem' }}>
            Real IELTS questions from recent exams. Practice each part systematically.
          </p>
        </div>

        {/* Part Selector */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}>
          {parts.map(part => (
            <button
              key={part.id}
              onClick={() => setSelectedPart(part.id)}
              style={{
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                border: selectedPart === part.id 
                  ? '1px solid var(--purple-500)' 
                  : '1px solid var(--gray-800)',
                background: selectedPart === part.id 
                  ? 'rgba(147, 51, 234, 0.1)' 
                  : 'transparent',
                color: selectedPart === part.id 
                  ? 'var(--purple-300)' 
                  : 'var(--gray-400)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                {part.label}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                {part.description}
              </div>
            </button>
          ))}
        </div>

        {/* Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredQuestions.map((q, index) => (
            <div
              key={q.id}
              className="animate-fadeInUp"
              style={{
                padding: '1.5rem',
                borderRadius: '16px',
                background: isCompleted(q.id) 
                  ? 'rgba(16, 185, 129, 0.05)' 
                  : 'rgba(255, 255, 255, 0.02)',
                border: isCompleted(q.id)
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.06)',
                animationDelay: `${index * 0.05}s`,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--purple-400)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                  }}>
                    {q.topic} • {q.date}
                  </span>
                  
                  {selectedPart === 'part2' ? (
                    <>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        marginTop: '0.5rem',
                        marginBottom: '1rem',
                        color: 'var(--gray-100)',
                      }}>
                        {q.question}
                      </h3>
                      {q.points && (
                        <div style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          background: 'rgba(147, 51, 234, 0.05)',
                          border: '1px solid rgba(147, 51, 234, 0.1)',
                        }}>
                          <p style={{
                            fontSize: '0.85rem',
                            color: 'var(--gray-400)',
                            marginBottom: '0.75rem',
                          }}>
                            You should say:
                          </p>
                          <ul style={{
                            listStyle: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                          }}>
                            {q.points.map((point, i) => (
                              <li key={i} style={{
                                fontSize: '0.95rem',
                                color: 'var(--gray-300)',
                                paddingLeft: '1rem',
                                position: 'relative',
                              }}>
                                <span style={{
                                  position: 'absolute',
                                  left: 0,
                                  color: 'var(--purple-400)',
                                }}>•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{
                      fontSize: '1.1rem',
                      marginTop: '0.5rem',
                      color: 'var(--gray-200)',
                    }}>
                      {q.question}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => handleMarkComplete(q.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: isCompleted(q.id)
                      ? '1px solid var(--success)'
                      : '1px solid var(--gray-700)',
                    background: isCompleted(q.id)
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'transparent',
                    color: isCompleted(q.id)
                      ? 'var(--success)'
                      : 'var(--gray-400)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isCompleted(q.id) ? '✓ Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Grammar Lessons Data
const grammarLessons = [
  {
    id: 'complex-sentences',
    title: 'Complex Sentence Structures',
    category: 'Advanced',
    skills: ['Writing', 'Speaking'],
    description: 'Master subordinate clauses, relative clauses, and sophisticated sentence patterns.',
    lessons: [
      { title: 'Subordinate Clauses', duration: '15 min' },
      { title: 'Relative Clauses', duration: '20 min' },
      { title: 'Participle Clauses', duration: '18 min' },
      { title: 'Practice Exercises', duration: '25 min' },
    ]
  },
  {
    id: 'advanced-conditionals',
    title: 'Advanced Conditionals',
    category: 'Advanced',
    skills: ['Writing', 'Speaking'],
    description: 'Go beyond basic if-clauses to mixed conditionals and inverted structures.',
    lessons: [
      { title: 'Mixed Conditionals', duration: '20 min' },
      { title: 'Inverted Conditionals', duration: '15 min' },
      { title: 'Implied Conditionals', duration: '18 min' },
      { title: 'Practice Exercises', duration: '30 min' },
    ]
  },
  {
    id: 'hedging',
    title: 'Hedging & Cautious Language',
    category: 'Academic',
    skills: ['Writing'],
    description: 'Learn to express uncertainty and make qualified claims in academic writing.',
    lessons: [
      { title: 'Modal Verbs for Hedging', duration: '15 min' },
      { title: 'Tentative Language', duration: '12 min' },
      { title: 'Qualifying Statements', duration: '15 min' },
      { title: 'Practice Exercises', duration: '20 min' },
    ]
  },
  {
    id: 'cohesive-devices',
    title: 'Cohesive Devices Mastery',
    category: 'Advanced',
    skills: ['Writing', 'Speaking'],
    description: 'Connect ideas seamlessly with advanced linking words and referencing.',
    lessons: [
      { title: 'Advanced Connectors', duration: '18 min' },
      { title: 'Reference & Substitution', duration: '20 min' },
      { title: 'Ellipsis Techniques', duration: '15 min' },
      { title: 'Practice Exercises', duration: '25 min' },
    ]
  },
  {
    id: 'passive-nominalization',
    title: 'Passive Voice & Nominalization',
    category: 'Academic',
    skills: ['Writing'],
    description: 'Transform your writing with academic passive constructions and noun phrases.',
    lessons: [
      { title: 'Passive Voice Variations', duration: '20 min' },
      { title: 'Nominalization Techniques', duration: '22 min' },
      { title: 'Academic Style', duration: '18 min' },
      { title: 'Practice Exercises', duration: '25 min' },
    ]
  },
  {
    id: 'emphasis-cleft',
    title: 'Emphasis & Cleft Sentences',
    category: 'Advanced',
    skills: ['Writing', 'Speaking'],
    description: 'Add impact to your language with cleft sentences and emphatic structures.',
    lessons: [
      { title: 'It-Cleft Sentences', duration: '15 min' },
      { title: 'What-Cleft Sentences', duration: '15 min' },
      { title: 'Fronting for Emphasis', duration: '18 min' },
      { title: 'Practice Exercises', duration: '20 min' },
    ]
  },
];

// Grammar Page Component
const GrammarPage = () => {
  const { user } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('skill', 'grammar');
      
      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const getLessonProgress = (lessonId) => {
    const completed = progress.filter(p => p.category === lessonId).length;
    const lesson = grammarLessons.find(l => l.id === lessonId);
    const total = lesson?.lessons.length || 1;
    return Math.round((completed / total) * 100);
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '0.75rem',
          }}>
            Advanced <span style={{ color: 'var(--purple-400)' }}>Grammar</span>
          </h1>
          <p style={{ color: 'var(--gray-400)', fontSize: '1.1rem' }}>
            Master the grammatical structures that will elevate your Writing and Speaking scores.
          </p>
        </div>

        {/* Lessons Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {grammarLessons.map((lesson, index) => {
            const progressPercent = getLessonProgress(lesson.id);
            
            return (
              <div
                key={lesson.id}
                className="animate-fadeInUp"
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animationDelay: `${index * 0.05}s`,
                }}
                onClick={() => setSelectedLesson(selectedLesson === lesson.id ? null : lesson.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--purple-600)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem',
                }}>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '6px',
                    background: lesson.category === 'Advanced' 
                      ? 'rgba(147, 51, 234, 0.2)' 
                      : 'rgba(6, 182, 212, 0.2)',
                    fontSize: '0.75rem',
                    color: lesson.category === 'Advanced' 
                      ? 'var(--purple-300)' 
                      : '#22d3ee',
                  }}>
                    {lesson.category}
                  </span>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {lesson.skills.map(skill => (
                      <span key={skill} style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        fontSize: '0.7rem',
                        color: 'var(--gray-400)',
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--gray-100)',
                }}>
                  {lesson.title}
                </h3>

                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--gray-400)',
                  lineHeight: '1.6',
                  marginBottom: '1rem',
                }}>
                  {lesson.description}
                </p>

                {/* Progress Bar */}
                <div style={{
                  height: '4px',
                  borderRadius: '2px',
                  background: 'var(--gray-800)',
                  overflow: 'hidden',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, var(--purple-600), var(--purple-400))',
                    transition: 'width 0.3s ease',
                  }} />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--gray-500)',
                }}>
                  <span>{lesson.lessons.length} lessons</span>
                  <span>{progressPercent}% complete</span>
                </div>

                {/* Expanded Content */}
                {selectedLesson === lesson.id && (
                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}>
                    {lesson.lessons.map((subLesson, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                        }}
                      >
                        <span style={{ color: 'var(--gray-300)' }}>
                          {subLesson.title}
                        </span>
                        <span style={{
                          fontSize: '0.8rem',
                          color: 'var(--gray-500)',
                        }}>
                          {subLesson.duration}
                        </span>
                      </div>
                    ))}
                    <button style={{
                      width: '100%',
                      marginTop: '1rem',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}>
                      Start Learning
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Placeholder Pages
const PlaceholderPage = ({ title, description }) => (
  <div style={{
    paddingTop: '100px',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.3 }}>
        🚧
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
        {title}
      </h1>
      <p style={{ color: 'var(--gray-400)' }}>
        {description}
      </p>
    </div>
  </div>
);

// Auth Pages
const AuthPage = ({ type, setCurrentPage }) => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (type === 'signup' && !name) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }

    try {
      if (type === 'signup') {
        const { data, error } = await signUp(email, password, name);
        if (error) throw error;
        setSuccess('Account created! Please check your email to confirm your account.');
      } else {
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        setCurrentPage('dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      paddingTop: '100px',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <div style={{
          padding: '2.5rem',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            textAlign: 'center',
          }}>
            {type === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{
            color: 'var(--gray-400)',
            textAlign: 'center',
            marginBottom: '2rem',
          }}>
            {type === 'login' 
              ? 'Sign in to continue your preparation' 
              : 'Start your journey to Band 9'}
          </p>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {type === 'signup' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: 'var(--gray-300)',
                  marginBottom: '0.5rem',
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--gray-800)',
                    background: 'var(--gray-900)',
                    color: 'var(--gray-100)',
                    fontSize: '1rem',
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                color: 'var(--gray-300)',
                marginBottom: '0.5rem',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--gray-800)',
                  background: 'var(--gray-900)',
                  color: 'var(--gray-100)',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                color: 'var(--gray-300)',
                marginBottom: '0.5rem',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--gray-800)',
                  background: 'var(--gray-900)',
                  color: 'var(--gray-100)',
                  fontSize: '1rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Please wait...' : (type === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            color: 'var(--gray-400)',
            fontSize: '0.9rem',
          }}>
            {type === 'login' ? (
              <>
                Don't have an account?{' '}
                <span
                  onClick={() => setCurrentPage('signup')}
                  style={{ color: 'var(--purple-400)', cursor: 'pointer' }}
                >
                  Sign up
                </span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span
                  onClick={() => setCurrentPage('login')}
                  style={{ color: 'var(--purple-400)', cursor: 'pointer' }}
                >
                  Sign in
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ setCurrentPage }) => {
  const { user, profile, signOut } = useAuth();
  const [progress, setProgress] = useState({ speaking: 0, writing: 0, grammar: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllProgress();
    }
  }, [user]);

  const fetchAllProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('skill')
        .eq('user_id', user.id);
      
      if (error) throw error;

      const counts = {
        speaking: data.filter(p => p.skill === 'speaking').length,
        writing: data.filter(p => p.skill === 'writing').length,
        grammar: data.filter(p => p.skill === 'grammar').length,
      };
      
      setProgress(counts);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentPage('home');
  };

  if (!user || loading) {
    return (
      <div style={{
        paddingTop: '100px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  const stats = [
    { label: 'Speaking Questions', value: progress.speaking, total: 16, color: '#a855f7' },
    { label: 'Writing Tasks', value: progress.writing, total: 10, color: '#ec4899' },
    { label: 'Grammar Lessons', value: progress.grammar, total: 24, color: '#06b6d4' },
  ];

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {/* Welcome Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '3rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
            }}>
              Welcome back, <span style={{ color: 'var(--purple-400)' }}>{profile?.name || 'Student'}</span>
            </h1>
            <p style={{ color: 'var(--gray-400)' }}>
              Target Band Score: {profile?.target_score || 7.0}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid var(--gray-700)',
              background: 'transparent',
              color: 'var(--gray-400)',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Progress Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '3rem',
        }}>
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                padding: '1.5rem',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2rem',
                fontWeight: '700',
                color: stat.color,
                marginBottom: '0.5rem',
              }}>
                {stat.value}/{stat.total}
              </div>
              <div style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>
                {stat.label}
              </div>
              <div style={{
                marginTop: '1rem',
                height: '4px',
                borderRadius: '2px',
                background: 'var(--gray-800)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(stat.value / stat.total) * 100}%`,
                  background: stat.color,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{
          padding: '2rem',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
          }}>
            Continue Learning
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { label: 'Practice Speaking', page: 'speaking', icon: '🎤' },
              { label: 'Study Grammar', page: 'grammar', icon: '📝' },
              { label: 'Writing Tasks', page: 'writing', icon: '✍️' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(action.page)}
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid var(--gray-800)',
                  background: 'transparent',
                  color: 'var(--gray-200)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
                <span style={{ fontWeight: '500' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Home Page
const HomePage = ({ setCurrentPage }) => (
  <>
    <HeroSection setCurrentPage={setCurrentPage} />
    <SkillsSection setCurrentPage={setCurrentPage} />
    <FeaturesSection setCurrentPage={setCurrentPage} />
  </>
);

// ==================== MAIN APP ====================
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { loading } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} />;
      case 'speaking':
        return <SpeakingPage />;
      case 'grammar':
        return <GrammarPage />;
      case 'writing':
        return <PlaceholderPage title="Writing Section" description="Task 1 and Task 2 practice coming soon. Check back for model essays, vocabulary, and grammar tips." />;
      case 'reading':
        return <PlaceholderPage title="Reading Section" description="Reading passages and practice questions coming soon." />;
      case 'listening':
        return <PlaceholderPage title="Listening Section" description="Listening practice with various accents coming soon." />;
      case 'login':
        return <AuthPage type="login" setCurrentPage={setCurrentPage} />;
      case 'signup':
        return <AuthPage type="signup" setCurrentPage={setCurrentPage} />;
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gray-950)',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderPage()}
    </div>
  );
};

// Wrap with AuthProvider
const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithAuth;
