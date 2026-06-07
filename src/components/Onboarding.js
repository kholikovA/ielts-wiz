import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Onboarding.css';

/* ------------------------------------------------------------------ options */

const BANDS = ['5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

// "When's your test?" as an ordered spectrum (soonest → later). Keeps the
// original options and adds 3–6 months and 6 months+.
const TIMEFRAMES = [
  { value: 'lt2w', short: '2 weeks' },
  { value: 'lt1m', short: '1 month' },
  { value: '1to3m', short: '1–3 mo' },
  { value: '3to6m', short: '3–6 mo' },
  { value: '6plus', short: '6 mo+' },
  { value: 'not_booked', short: 'Not booked' },
];

const PURPOSES = [
  { value: 'study', icon: 'cap', t: 'Studying abroad', d: 'University or college admission', country: true },
  { value: 'immigration', icon: 'globe', t: 'Immigration / PR', d: 'Permanent residency or visa', country: true },
  { value: 'work', icon: 'work', t: 'Work / licensing', d: 'Nursing, medicine, engineering & more', country: true },
  { value: 'personal', icon: 'star', t: 'Personal goal', d: 'Self-improvement or to keep skills sharp', country: false },
];

// Common study / immigration destinations for IELTS Academic takers.
const DESTINATIONS = [
  'Australia', 'Canada', 'United Kingdom', 'United States', 'New Zealand', 'Ireland', 'Germany',
  'France', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria',
  'Belgium', 'Spain', 'Italy', 'Portugal', 'Poland', 'Czechia', 'Hungary', 'Lithuania', 'Latvia',
  'Estonia', 'Malta', 'Cyprus', 'Singapore', 'United Arab Emirates', 'Qatar', 'Saudi Arabia',
  'Hong Kong', 'South Korea', 'Japan', 'Malaysia', 'Other / Multiple',
];

const PREV_BANDS = ['<5', '5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8+'];

// First language — a comprehensive list of major world languages.
const LANGUAGES = [
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Assamese', 'Azerbaijani', 'Basque',
  'Belarusian', 'Bengali', 'Bhojpuri', 'Bosnian', 'Bulgarian', 'Burmese', 'Cantonese', 'Catalan',
  'Cebuano', 'Chichewa', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian',
  'Filipino (Tagalog)', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek', 'Gujarati',
  'Hausa', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Igbo', 'Indonesian', 'Italian', 'Japanese',
  'Javanese', 'Kannada', 'Kazakh', 'Khmer', 'Kinyarwanda', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao',
  'Latvian', 'Lithuanian', 'Macedonian', 'Malay', 'Malayalam', 'Maltese', 'Mandarin Chinese',
  'Marathi', 'Mongolian', 'Nepali', 'Norwegian', 'Odia (Oriya)', 'Oromo', 'Pashto', 'Persian (Farsi)',
  'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian', 'Serbian', 'Sindhi', 'Sinhala', 'Slovak',
  'Slovenian', 'Somali', 'Spanish', 'Swahili', 'Swedish', 'Tajik', 'Tamil', 'Telugu', 'Thai',
  'Tigrinya', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uzbek', 'Vietnamese', 'Welsh', 'Xhosa',
  'Yoruba', 'Zulu', 'Other',
];

// "How much can you study per week?" as a slider with four stops.
const WEEKLY = [
  { value: 'lt2', label: 'Under 2 hours' },
  { value: '2to5', label: '2–5 hours' },
  { value: '5to10', label: '5–10 hours' },
  { value: '10plus', label: '10+ hours' },
];

const FOCUS = [
  { value: 'speaking', label: 'Speaking fluency' },
  { value: 'listening', label: 'Listening' },
  { value: 'reading', label: 'Reading strategies' },
  { value: 'writing', label: 'Writing Task 1 & 2' },
  { value: 'grammar', label: 'Grammar & accuracy' },
  { value: 'vocab', label: 'Vocabulary range' },
  { value: 'models', label: 'Band 9 model answers' },
  { value: 'mocks', label: 'Full mock tests' },
];

const VALUE_LINES = {
  1: 'Tell us about your test so we can match difficulty & pacing.',
  2: "Your goal shapes which skills and examples we surface first.",
  3: 'This lets us calibrate the plan to your current level.',
  4: "We'll turn everything into a plan built around you.",
};

const TOTAL_STEPS = 4;

/* -------------------------------------------------------------------- icons */

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Chevron = () => (
  <svg className="chev" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const PurposeIcon = ({ name }) => {
  if (name === 'cap') return <svg viewBox="0 0 24 24" fill="none"><path d="M22 10L12 5 2 10l10 5 10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" stroke="currentColor" strokeWidth="1.8" /></svg>;
  if (name === 'globe') return <svg viewBox="0 0 24 24" fill="none"><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /></svg>;
  if (name === 'work') return <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18" stroke="currentColor" strokeWidth="1.8" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>;
};

const firstName = (profile) => {
  const n = (profile?.name || '').trim();
  return n ? n.split(/\s+/)[0] : null;
};

// Load the onboarding's display fonts only while this screen is mounted.
function useOnboardingFonts() {
  useEffect(() => {
    if (document.getElementById('iw-onb-fonts')) return;
    const pre1 = Object.assign(document.createElement('link'), { rel: 'preconnect', href: 'https://fonts.googleapis.com' });
    const pre2 = Object.assign(document.createElement('link'), { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' });
    const css = Object.assign(document.createElement('link'), {
      id: 'iw-onb-fonts', rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap',
    });
    document.head.append(pre1, pre2, css);
  }, []);
}

/* ---------------------------------------------------------------- component */

export default function Onboarding() {
  const { profile, updateProfile } = useAuth();
  useOnboardingFonts();

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [targetBand, setTargetBand] = useState(null);
  const [timeframe, setTimeframe] = useState(null);
  const [purpose, setPurpose] = useState(null);
  const [destination, setDestination] = useState('');
  const [takenBefore, setTakenBefore] = useState(null);
  const [previousBand, setPreviousBand] = useState(null);
  const [firstLanguage, setFirstLanguage] = useState('');
  const [weeklyIdx, setWeeklyIdx] = useState(1);
  const [focusAreas, setFocusAreas] = useState([]);
  const [email, setEmail] = useState(profile?.email || '');
  const [optIn, setOptIn] = useState(true);

  const name = firstName(profile);
  const showCountry = purpose && purpose !== 'personal';
  const countryLabel = purpose === 'immigration' ? 'Which country are you applying to?'
    : purpose === 'work' ? 'Where will you be working?' : 'Where are you headed?';

  const toggleFocus = (v) =>
    setFocusAreas((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearErr = (key) => setErrors((e) => (e[key] ? { ...e, [key]: false } : e));

  const validate = () => {
    const need = step === 1 ? ['targetBand', 'timeframe'] : step === 2 ? ['purpose'] : [];
    const vals = { targetBand, timeframe, purpose };
    const next = {};
    need.forEach((k) => { if (!vals[k]) next[k] = true; });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => ({
    testType: 'academic',
    targetBand,
    timeframe,
    purpose,
    destination: showCountry ? (destination || null) : null,
    takenBefore,
    previousBand: takenBefore === 'retaking' ? previousBand : null,
    firstLanguage: firstLanguage || null,
    weeklyTime: WEEKLY[weeklyIdx].value,
    focusAreas,
    reminderEmail: email.trim() || profile?.email || null,
    remindersOptIn: optIn,
  });

  // Save the questionnaire. Core fields go to typed columns; the full payload
  // goes to a jsonb `onboarding` column when it exists, falling back gracefully
  // if that migration hasn't run yet. Does NOT flip `onboarded` — that happens
  // on "Start practising" so the completion screen gets to show.
  const persist = async () => {
    const base = {};
    if (targetBand) base.target_score = Number(targetBand);
    if (focusAreas.length) base.goals = focusAreas;
    let res = await updateProfile({ ...base, onboarding: buildPayload() });
    if (res && res.error) res = await updateProfile(base);
    return res;
  };

  const next = async () => {
    if (!validate()) return;
    if (step < TOTAL_STEPS) { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setSaving(true);
    await persist();           // best-effort; UX continues regardless
    setSaving(false);
    setDone(true);
  };

  const finishToApp = async () => {
    setSaving(true);
    const { error } = await updateProfile({ onboarded: true }); // flips the gate → unmounts
    if (error) setSaving(false); // let them retry; otherwise component unmounts
  };

  const skip = async () => {
    setSaving(true);
    const { error } = await updateProfile({ onboarded: true });
    if (error) setSaving(false);
  };

  const pct = done ? 100 : Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="iw-onb">
      <div className="ambient" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      <main className="card" role="form" aria-label="IELTS Wiz onboarding">
        <div className="head">
          <div className="brand">
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21l3-12 4 5 3-8 4 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="name">IELTS <b>WIZ</b></span>
          </div>
          <div className="step-count" aria-live="polite">{done ? 'Done' : <>Step <b>{step}</b> of {TOTAL_STEPS}</>}</div>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <div className="progress__fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="value-line">{done ? 'Your profile is complete — thank you!' : VALUE_LINES[step]}</div>

        <div className="stage">
          {done ? (
            <section className="complete">
              <div className="seal"><Check /></div>
              <h2>You&rsquo;re all set{name ? <>, <span className="accent">{name}</span></> : ''}</h2>
              <p>Your personalised IELTS plan is ready. Let&rsquo;s get you to that band.</p>
              <button type="button" className="btn btn--primary" onClick={finishToApp} disabled={saving}>
                {saving ? 'Loading…' : 'Start practising'}
              </button>
            </section>
          ) : (
            <>
              {/* STEP 1 — your exam (academic-only, so no test-type question) */}
              {step === 1 && (
                <section className="step" key="s1">
                  <h1 className="step-title reveal">Welcome{name ? <>, <span className="accent">{name}</span></> : ''}</h1>
                  <p className="step-sub reveal">A few quick taps and we&rsquo;ll build a practice plan around your exam. Takes ~30 seconds.</p>

                  <div className={`field reveal${errors.targetBand ? ' is-error' : ''}`}>
                    <div className="field__label">What overall band are you aiming for?</div>
                    <div className="pill-row">
                      {BANDS.map((b) => (
                        <button key={b} type="button" className={`pill band${targetBand === b ? ' is-sel' : ''}`}
                          aria-pressed={targetBand === b} onClick={() => { setTargetBand(b); clearErr('targetBand'); }}>{b}</button>
                      ))}
                    </div>
                    <div className="err-msg">Choose your target band.</div>
                  </div>

                  <div className={`field reveal${errors.timeframe ? ' is-error' : ''}`}>
                    <div className="field__label">When&rsquo;s your test? <span className="field__opt">— helps us pace you</span></div>
                    <div className="spectrum" role="group" aria-label="Test timeframe">
                      {TIMEFRAMES.map((t) => (
                        <button key={t.value} type="button" className={`spectrum__seg${timeframe === t.value ? ' is-sel' : ''}`}
                          aria-pressed={timeframe === t.value} onClick={() => { setTimeframe(t.value); clearErr('timeframe'); }}>{t.short}</button>
                      ))}
                    </div>
                    <div className="err-msg">Roughly when are you sitting the exam?</div>
                  </div>
                </section>
              )}

              {/* STEP 2 — your goal */}
              {step === 2 && (
                <section className="step" key="s2">
                  <h2 className="step-title reveal">Your <span className="accent">goal</span></h2>
                  <p className="step-sub reveal">Knowing why you&rsquo;re taking IELTS lets us prioritise the right skills and examples.</p>

                  <div className={`field reveal${errors.purpose ? ' is-error' : ''}`}>
                    <div className="field__label">What&rsquo;s the IELTS for?</div>
                    <div className="opt-grid">
                      {PURPOSES.map((p) => (
                        <button key={p.value} type="button" className={`opt${purpose === p.value ? ' is-sel' : ''}`}
                          aria-pressed={purpose === p.value} onClick={() => { setPurpose(p.value); clearErr('purpose'); }}>
                          <span className="ic"><PurposeIcon name={p.icon} /></span>
                          <span className="txt"><span className="t">{p.t}</span><span className="d">{p.d}</span></span>
                          <span className="check"><Check /></span>
                        </button>
                      ))}
                    </div>
                    <div className="err-msg">Let us know your goal so we can personalise.</div>

                    {showCountry && (
                      <div className="conditional">
                        <div className="field__label">{countryLabel}</div>
                        <div className="select-wrap">
                          <select value={destination} onChange={(e) => setDestination(e.target.value)}>
                            <option value="" disabled>Select a country</option>
                            {DESTINATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <Chevron />
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* STEP 3 — starting point */}
              {step === 3 && (
                <section className="step" key="s3">
                  <h2 className="step-title reveal">Your <span className="accent">starting point</span></h2>
                  <p className="step-sub reveal">We&rsquo;ll calibrate the plan to exactly where you are right now.</p>

                  <div className="field reveal">
                    <div className="field__label">Have you taken IELTS before?</div>
                    <div className="opt-grid cols-2">
                      <button type="button" className={`opt${takenBefore === 'first_time' ? ' is-sel' : ''}`} aria-pressed={takenBefore === 'first_time'}
                        onClick={() => { setTakenBefore('first_time'); setPreviousBand(null); }}>
                        <span className="txt"><span className="t">First time</span></span><span className="check"><Check /></span>
                      </button>
                      <button type="button" className={`opt${takenBefore === 'retaking' ? ' is-sel' : ''}`} aria-pressed={takenBefore === 'retaking'}
                        onClick={() => setTakenBefore('retaking')}>
                        <span className="txt"><span className="t">Improving my score</span></span><span className="check"><Check /></span>
                      </button>
                    </div>
                    {takenBefore === 'retaking' && (
                      <div className="conditional">
                        <div className="field__label">Your most recent overall band</div>
                        <div className="pill-row">
                          {PREV_BANDS.map((b) => (
                            <button key={b} type="button" className={`pill band${previousBand === b ? ' is-sel' : ''}`}
                              aria-pressed={previousBand === b} onClick={() => setPreviousBand(b)}>{b}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="field reveal">
                    <div className="field__label">Your first language <span className="field__opt">— tailors common-error tips</span></div>
                    <div className="select-wrap">
                      <select value={firstLanguage} onChange={(e) => setFirstLanguage(e.target.value)}>
                        <option value="" disabled>Select language</option>
                        {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <Chevron />
                    </div>
                  </div>

                  <div className="field reveal">
                    <div className="field__label">How much can you study per week?</div>
                    <div className="slider-wrap">
                      <div className="slider-readout">
                        <span className="val">{WEEKLY[weeklyIdx].label}</span>
                        <span className="unit">per week</span>
                      </div>
                      <input
                        type="range" className="slider" min={0} max={WEEKLY.length - 1} step={1}
                        value={weeklyIdx} onChange={(e) => setWeeklyIdx(Number(e.target.value))}
                        style={{ '--fill': `${(weeklyIdx / (WEEKLY.length - 1)) * 100}%` }}
                        aria-label="Weekly study time" aria-valuetext={WEEKLY[weeklyIdx].label}
                      />
                      <div className="slider-ticks">
                        {WEEKLY.map((w, i) => <span key={w.value} className={i === weeklyIdx ? 'is-on' : ''}>{w.label.replace(' hours', '').replace('Under ', '<')}</span>)}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* STEP 4 — personalise */}
              {step === 4 && (
                <section className="step" key="s4">
                  <h2 className="step-title reveal">Build your <span className="accent">plan</span></h2>
                  <p className="step-sub reveal">Last step — pick what matters most and we&rsquo;ll put it front and centre.</p>

                  <div className="field reveal">
                    <div className="field__label">What do you want to focus on? <span className="field__opt">— choose any</span></div>
                    <div className="pill-row">
                      {FOCUS.map((f) => (
                        <button key={f.value} type="button" className={`pill${focusAreas.includes(f.value) ? ' is-sel' : ''}`}
                          aria-pressed={focusAreas.includes(f.value)} onClick={() => toggleFocus(f.value)}>{f.label}</button>
                      ))}
                    </div>
                  </div>

                  <div className="field reveal" style={{ marginBottom: 6 }}>
                    <div className="field__label">Where should we send your study plan?</div>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
                    <button type="button" className={`optin${optIn ? ' is-on' : ''}`} aria-pressed={optIn} onClick={() => setOptIn(!optIn)}>
                      <span className="box"><Check /></span>
                      <span className="ot"><b>Email me my personalised plan</b> plus weekly tips and a reminder before test day.</span>
                    </button>
                    <div className="privacy">
                      <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                      We&rsquo;ll never share your details. Unsubscribe anytime.
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {!done && (
          <>
            <div className="nav">
              <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)} style={{ visibility: step === 1 ? 'hidden' : 'visible' }}>
                <svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>Back
              </button>
              <button type="button" className="btn btn--primary" onClick={next} disabled={saving}>
                {step === TOTAL_STEPS ? (saving ? 'Building…' : 'Build my study plan') : 'Continue'}
                {step === TOTAL_STEPS
                  ? <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : <svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            </div>
            <button type="button" className="skip" onClick={skip} disabled={saving}>Skip for now</button>
          </>
        )}
      </main>
    </div>
  );
}
