import React, { useState, useEffect, useRef } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import {
  attemptsFor, statusOf, isComplete, isOverdue, dueLabel, srsStats, pct, KINDS,
} from './homework';
import { endOfStudyDay } from './fsrs';
import {
  useHub, useAsync, Loaded, HubLink, StatusPill, PageTitle, Coin, EmptyPanel,
} from './ui';
import { JoinForm } from './StudentPages';
import { rankFor, nextMilestone, RANKS } from './ranks';

const WEEKDAY = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Count up to `value` once on mount (and smoothly to later changes).
function useCountUp(value, ms = 900) {
  const [shown, setShown] = useState(reducedMotion() ? value : 0);
  const from = useRef(shown);
  useEffect(() => {
    if (reducedMotion()) { setShown(value); return undefined; }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(a + (value - a) * eased);
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

const CountUp = ({ value }) => <>{useCountUp(value)}</>;

function Ring({ value, size = 132, stroke = 10, children }) {
  const [shown, setShown] = useState(reducedMotion() ? value : 0);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(value)); return () => cancelAnimationFrame(id); }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="dash-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="dash-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#dash-ring-grad)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} className="dash-ring-arc" />
      </svg>
      <div className="dash-ring-label">{children}</div>
    </div>
  );
}

// A small faceted crest; facets light up with rank.
function Crest({ index }) {
  const lit = (i) => (i <= index ? 'currentColor' : 'rgba(255,255,255,0.12)');
  return (
    <svg className="dash-crest" viewBox="0 0 64 72" width="64" height="72" aria-hidden="true">
      <path d="M32 2 60 18v36L32 70 4 54V18Z" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <path d="M32 10 52 22 32 34 12 22Z" fill={lit(0)} opacity="0.9" />
      <path d="M12 26 30 37v22L12 48Z" fill={lit(1)} opacity="0.75" />
      <path d="M52 26 34 37v22l18-11Z" fill={lit(2)} opacity="0.75" />
      <path d="M32 10 52 22v4L32 14 12 26v-4Z" fill={lit(3)} opacity="0.5" />
      <path d="M12 48 30 59v4L12 52Z" fill={lit(4)} opacity="0.5" />
      <path d="M52 48 34 59v4l18-11Z" fill={lit(5)} opacity="0.5" />
    </svg>
  );
}

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), ms); return () => clearInterval(id); }, [ms]);
  return now;
}

function Countdown({ at }) {
  const now = useNow(1000);
  const diff = Math.max(0, new Date(at) - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  if (diff === 0) return <span className="dash-count">Starting now</span>;
  return (
    <span className="dash-count" aria-label={`${d} days ${h} hours ${m} minutes`}>
      {d > 0 && <><b>{d}</b><i>d</i></>}<b>{pad(h)}</b><i>h</i><b>{pad(m)}</b><i>m</i>{d === 0 && <><b>{pad(s)}</b><i>s</i></>}
    </span>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// Homework that matters today: overdue, due before the 4am rollover, or posted today.
function todaysHomework(rows) {
  const end = endOfStudyDay();
  const start = new Date(end.getTime() - 86400000);
  return rows.filter((a) => {
    const due = a.due_at ? new Date(a.due_at) : null;
    const posted = new Date(a.publish_at || a.created_at);
    if (a.status === 'overdue') return true;
    if (due && due <= end && due >= start) return true;
    if (posted >= start) return true;
    return !isComplete(a.status) && due && due <= end;
  });
}

// 0..1 progress for one homework item.
function itemProgress(a, cards) {
  if (isComplete(a.status)) return 1;
  if (a.kind === 'flashcards') {
    const mine = cards.filter((c) => c.assignment_id === a.id);
    return mine.length ? mine.filter((c) => c.state !== 0).length / mine.length : 0;
  }
  if (a.kind === 'test') return a.attempts.length ? 1 : 0;
  return a.status === 'started' ? 0.5 : 0;
}

function itemNote(a, cards) {
  if (a.kind === 'flashcards') {
    const mine = cards.filter((c) => c.assignment_id === a.id);
    return `${mine.filter((c) => c.state !== 0).length}/${mine.length} words`;
  }
  if (a.kind === 'test' && a.attempts.length) return `best ${Math.max(...a.attempts.map((r) => pct(r.correct, r.total)))}%`;
  if (a.submission?.band != null) return `band ${Number(a.submission.band).toFixed(1)}`;
  return dueLabel(a.due_at);
}

function WeekChart({ week }) {
  const max = Math.max(10, ...week.map((d) => d.coins));
  const today = week[week.length - 1]?.day;
  return (
    <div className="dash-week" aria-label="Coins earned per day this week">
      {week.map((d) => (
        <div key={d.day} className={`dash-week-col${d.day === today ? ' is-today' : ''}`} title={`${d.coins} coins`}>
          <div className="dash-week-track"><div className="dash-week-bar" style={{ height: `${(d.coins / max) * 100}%` }} /></div>
          <small>{WEEKDAY(d.day)}</small>
        </div>
      ))}
    </div>
  );
}

function StreakCard({ icon, label, unit, value, next, marks }) {
  const span = next ? Math.max(1, next.at - next.from) : 1;
  const into = next ? Math.max(0, value - next.from) : 0;
  return (
    <div className="card dash-signal">
      <div className="dash-signal-head"><Icon name={icon} size={15} /> {label}</div>
      <div className="dash-signal-value"><strong><CountUp value={value} /></strong><span>{unit}</span></div>
      {marks && marks.length > 0 && (
        <div className="dash-marks" aria-label="Recent">
          {marks.map((m, i) => <span key={i} className={`dash-mark is-${m}`} title={m} />)}
        </div>
      )}
      {next ? (
        <div className="dash-next">
          <div className="dash-next-row"><span>Next bonus at {next.at}</span><span className="hub-num"><Coin size={12} /> +{next.coins}</span></div>
          <span className="hub-bar hub-bar--wide"><span style={{ width: `${(into / span) * 100}%` }} /></span>
        </div>
      ) : <div className="dash-next"><span className="hub-muted">Keep it going</span></div>}
    </div>
  );
}

export function Dashboard() {
  const { user, profile, isTeacher } = useHub();
  const data = useAsync(async () => {
    const [summary, snap, items, results, recent, milestones, repeat, session, attendance] = await Promise.all([
      api.hubSummary(),
      api.srsSnapshot(user.id),
      api.studentHomework(user.id),
      api.testResults(user.id),
      api.coinHistory(user.id, 40),
      api.streakMilestones().catch(() => []),
      api.streakRepeat().catch(() => []),
      api.nextSession().catch(() => null),
      api.studentAttendance(user.id).catch(() => []),
    ]);
    const rows = items.map((a) => {
      const attempts = attemptsFor(a, results);
      const base = statusOf(a, a.submission, attempts);
      return { ...a, attempts, status: isOverdue(a, base) ? 'overdue' : base };
    });
    return { summary, snap, rows, recent, milestones, repeat: Object.fromEntries(repeat.map((r) => [r.kind, r.every])), session, attendance };
  }, [user.id]);
  const classes = useAsync(api.myClasses, [user.id]);

  const first = profile?.name?.split(' ')[0];

  return (
    <Loaded state={data}>
      {({ summary, snap, rows, recent, milestones, repeat, session, attendance }) => {
        const st = srsStats(snap, new Date(), endOfStudyDay());
        const today = todaysHomework(rows);
        const todayKey = summary.week[summary.week.length - 1]?.day;
        const playedToday = recent.some((t) => t.day === todayKey && t.label.startsWith('Word game'));

        // Today's plan: flashcards, each homework item for today, one game.
        const plan = [];
        if (st.total > 0) {
          const left = st.fresh + st.due;
          plan.push({ key: 'fc', label: left ? `Flashcards · ${left} waiting` : 'Flashcards cleared', done: left === 0, to: '/flashcards/study' });
        }
        today.forEach((a) => plan.push({ key: a.id, label: a.title, done: isComplete(a.status), to: `/homework/${a.id}` }));
        plan.push({ key: 'game', label: 'One word game', done: playedToday, to: '/games' });
        const done = plan.filter((p) => p.done).length;
        const left = plan.length - done;

        const rank = rankFor(summary.balance);
        const attMarks = attendance.filter((r) => r.class_sessions)
          .sort((x, y) => y.class_sessions.held_at.localeCompare(x.class_sessions.held_at))
          .slice(0, 6).reverse().map((r) => r.status);
        const hwMarks = rows.filter((a) => a.due_at && new Date(a.due_at) < new Date())
          .sort((x, y) => y.due_at.localeCompare(x.due_at)).slice(0, 6).reverse()
          .map((a) => {
            if (!isComplete(a.status)) return 'absent';
            const at = a.submission?.submitted_at || a.attempts[0]?.completed_at;
            return at && new Date(at) > new Date(a.due_at) ? 'late' : 'present';
          });

        return (
          <div className="dash">
            {/* ── Hero ── */}
            <section className="dash-hero">
              <div className="dash-hero-main">
                <span className="dash-eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <h1>{greeting()}{first ? `, ${first}` : ''}.</h1>
                <p className="dash-status">
                  {left === 0
                    ? 'All clear for today. Your streaks are safe.'
                    : `${left} ${left === 1 ? 'thing' : 'things'} left on today's plan.`}
                </p>
                <div className="dash-plan">
                  <Ring value={plan.length ? done / plan.length : 0}>
                    <strong><CountUp value={done} /><span>/{plan.length}</span></strong>
                    <small>today</small>
                  </Ring>
                  <ul className="dash-plan-list">
                    {plan.slice(0, 5).map((p) => (
                      <li key={p.key}>
                        <HubLink to={p.to} className={`dash-plan-item${p.done ? ' is-done' : ''}`}>
                          <span className="dash-check">{p.done && <Icon name="check" size={12} />}</span>
                          <span className="dash-plan-label">{p.label}</span>
                          {!p.done && <Icon name="arrowRight" size={14} className="dash-plan-go" />}
                        </HubLink>
                      </li>
                    ))}
                    {plan.length > 5 && <li className="dash-plan-more">+{plan.length - 5} more in Homework</li>}
                  </ul>
                </div>
              </div>

              <HubLink to="/coins" className="dash-rank" aria-label={`Rank ${rank.rank.name}, ${summary.balance} coins`}>
                <Crest index={rank.index} />
                <span className="dash-rank-name">{rank.rank.name}</span>
                <span className="dash-rank-step">Rank {rank.index + 1} of {RANKS.length}</span>
                <span className="dash-rank-coins"><Coin size={16} /> <CountUp value={summary.balance} /></span>
                <span className="dash-rank-today">+{summary.today} today</span>
                {rank.next && (
                  <span className="dash-rank-next">
                    <span className="dash-rank-bar"><span style={{ width: `${rank.progress * 100}%` }} /></span>
                    <small>{rank.toNext} to {rank.next.name}</small>
                  </span>
                )}
              </HubLink>
            </section>

            {/* ── Signals ── */}
            <section className="dash-signals">
              <StreakCard icon="flame" label="Attendance streak" unit={summary.attendance_streak === 1 ? 'class in a row' : 'classes in a row'}
                value={summary.attendance_streak} next={nextMilestone('attendance', summary.attendance_streak, milestones, repeat)} marks={attMarks} />
              <StreakCard icon="checkCircle" label="Homework streak" unit="on time in a row"
                value={summary.homework_streak} next={nextMilestone('homework', summary.homework_streak, milestones, repeat)} marks={hwMarks} />
              <div className="card dash-signal dash-class">
                <div className="dash-signal-head"><Icon name="calendar" size={15} /> Next class</div>
                {session ? (
                  <>
                    <Countdown at={session.held_at} />
                    <div className="dash-class-meta">
                      <strong>{session.classes?.name}</strong>
                      <span>{new Date(session.held_at).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{session.topic ? ` · ${session.topic}` : ''}</span>
                    </div>
                  </>
                ) : (
                  <div className="dash-class-empty">
                    <span>No class scheduled yet.</span>
                    <small>Attended {summary.attendance?.attended || 0} of {summary.attendance?.sessions || 0} so far.</small>
                  </div>
                )}
              </div>
            </section>

            {/* ── Work + momentum ── */}
            <div className="hub-cols dash-row">
              <section>
                <div className="hub-section-head"><h2 className="h3">Today's homework</h2><HubLink to="/homework">All homework</HubLink></div>
                {today.length ? (
                  <div className="hub-list">
                    {today.map((a) => {
                      const prog = itemProgress(a, snap.cards);
                      return (
                        <HubLink key={a.id} to={`/homework/${a.id}`} className="card card-interactive dash-hw">
                          <span className="hub-kind-icon"><Icon name={KINDS[a.kind]?.icon || 'edit'} size={16} /></span>
                          <div className="dash-hw-main">
                            <div className="dash-hw-top"><strong>{a.title}</strong><StatusPill status={a.status} /></div>
                            <div className="dash-hw-bottom">
                              <span className="hub-bar hub-bar--wide"><span style={{ width: `${prog * 100}%` }} /></span>
                              <small>{itemNote(a, snap.cards)}</small>
                            </div>
                          </div>
                        </HubLink>
                      );
                    })}
                  </div>
                ) : (
                  <div className="card dash-quiet"><Icon name="checkCircle" size={18} /><span>Nothing due today. A good day to get ahead with flashcards or a game.</span></div>
                )}

                <div className="dash-actions">
                  {[
                    { to: '/flashcards/study', icon: 'layers', label: 'Flashcards', note: `${st.fresh + st.due} today` },
                    { to: '/games', icon: 'gamepad', label: 'Word games', note: '6 formats' },
                    { to: '/homework', icon: 'edit', label: 'Homework', note: `${rows.filter((a) => !isComplete(a.status)).length} open` },
                    { to: '/progress', icon: 'trending', label: 'Progress', note: 'scores & history' },
                  ].map((q) => (
                    <HubLink key={q.to} to={q.to} className="card card-interactive dash-action">
                      <Icon name={q.icon} size={18} />
                      <strong>{q.label}</strong>
                      <small>{q.note}</small>
                    </HubLink>
                  ))}
                </div>
              </section>

              <aside className="hub-stack">
                <div className="card">
                  <div className="hub-section-head" style={{ marginBottom: 4 }}>
                    <h2 className="h3">This week</h2>
                    <span className="hub-muted hub-num"><Coin size={12} /> {summary.week.reduce((t, d) => t + d.coins, 0)}</span>
                  </div>
                  <WeekChart week={summary.week} />
                </div>
                <div className="card">
                  <div className="hub-section-head" style={{ marginBottom: 8 }}><h2 className="h3">Recent coins</h2><HubLink to="/coins">History</HubLink></div>
                  {recent.length ? (
                    <ul className="dash-feed">
                      {recent.slice(0, 5).map((t) => (
                        <li key={t.id}><span>{t.label}</span><b className={t.amount < 0 ? 'is-neg' : ''}>{t.amount > 0 ? '+' : ''}{t.amount}</b></li>
                      ))}
                    </ul>
                  ) : <p>Your first coins will show up here.</p>}
                </div>
                <div className="card">
                  <h2 className="h3" style={{ marginBottom: 8 }}>My classes</h2>
                  <Loaded state={classes} fallback={null}>
                    {(list) => (
                      <>
                        {list.map((c) => (
                          <div key={c.id} className="dash-class-row"><strong>{c.name}</strong><small>{c.teacher_name || ''}</small></div>
                        ))}
                        <JoinForm onJoined={() => { classes.reload(); data.reload(); }} />
                      </>
                    )}
                  </Loaded>
                </div>
                {isTeacher && <HubLink to="/teach/assignments" className="btn btn-block"><Icon name="graduation" size={14} /> Open Teaching</HubLink>}
              </aside>
            </div>
          </div>
        );
      }}
    </Loaded>
  );
}

// ── Coins: balance, how to earn, history ─────────────────────────────────────
export function CoinsPage({ studentId }) {
  const { user } = useHub();
  const uid = studentId || user.id;
  const summary = useAsync(() => api.hubSummary(studentId || null), [uid]);
  const history = useAsync(() => api.coinHistory(uid), [uid]);
  const rules = useAsync(async () => {
    const [r, m] = await Promise.all([api.rewardRules(), api.streakMilestones()]);
    return { rules: r, milestones: m };
  }, []);

  return (
    <>
      <PageTitle eyebrow="Rewards" title="Coins" lead="Coins reward effort: studying every day, finishing homework on time, and coming to class." />
      <div className="hub-cols">
        <section>
          <Loaded state={summary}>
            {(s) => (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="hub-coin-hero"><Coin size={22} /><strong>{s.balance}</strong><span className="hub-muted">+{s.today} today</span></div>
              </div>
            )}
          </Loaded>
          <Loaded state={history}>
            {(rows) => {
              if (!rows.length) return <EmptyPanel icon="coin" title="No coins yet" lead="Study flashcards, play a word game or finish homework to earn your first coins." />;
              const days = [];
              rows.forEach((t) => {
                const last = days[days.length - 1];
                if (last && last.day === t.day) last.rows.push(t);
                else days.push({ day: t.day, rows: [t] });
              });
              return (
                <div className="hub-list">
                  {days.map((d) => (
                    <React.Fragment key={d.day}>
                      <div className="hub-day-label">
                        {new Date(`${d.day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                        <span style={{ float: 'right' }} className="hub-num">+{d.rows.reduce((s, r) => s + r.amount, 0)}</span>
                      </div>
                      {d.rows.map((t) => (
                        <div key={t.id} className="hub-row" style={{ borderBottom: '1px solid var(--h-border)' }}>
                          <div className="hub-row-main"><span>{t.label}</span><small>{new Date(t.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</small></div>
                          <span className={`hub-amount${t.amount < 0 ? ' is-neg' : ''}`}>{t.amount > 0 ? '+' : ''}{t.amount}</span>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              );
            }}
          </Loaded>
        </section>
        <aside>
          <h2 className="h3" style={{ marginBottom: 12 }}>How to earn</h2>
          <Loaded state={rules}>
            {({ rules: list, milestones }) => (
              <>
                <div className="hub-table-wrap">
                  <table className="hub-table hub-rules">
                    <tbody>
                      {list.filter((r) => !r.key.endsWith('_percent') && !r.key.startsWith('streak_')).map((r) => (
                        <tr key={r.key}>
                          <td style={{ whiteSpace: 'normal' }}>{r.label}{r.daily_cap ? <div className="hub-muted" style={{ fontSize: 12 }}>up to {r.daily_cap}/day</div> : null}</td>
                          <td className="hub-num">{r.coins}{r.bonus ? `–${r.coins + r.bonus}` : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="form-help">Late homework and repeated tests earn {list.find((r) => r.key === 'homework_late_percent')?.coins ?? 50}% of the coins.</p>
                <h2 className="h3" style={{ margin: '20px 0 12px' }}>Streak bonuses</h2>
                <div className="hub-table-wrap">
                  <table className="hub-table hub-rules">
                    <tbody>
                      {milestones.map((m) => (
                        <tr key={`${m.kind}${m.at}`}>
                          <td>{m.kind === 'attendance' ? `${m.at} classes in a row` : `${m.at} homework on time in a row`}</td>
                          <td className="hub-num">+{m.coins}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Loaded>
        </aside>
      </div>
    </>
  );
}
