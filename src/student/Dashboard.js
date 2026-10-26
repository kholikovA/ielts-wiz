import React, { useState, useEffect, useRef } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import {
  attemptsFor, statusOf, isComplete, isOverdue, dueLabel, pct, KINDS, todaysHomework,
} from './homework';
import { endOfStudyDay } from './fsrs';
import {
  useHub, useAsync, Loaded, HubLink, StatusPill, PageTitle, Coin, EmptyPanel, Avatar,
} from './ui';
import { rankFor, RANKS } from './ranks';
import MascotProgress from './MascotProgress';

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
  if (a.kind === 'dictation' && a.submission?.data?.score) return `${a.submission.data.score.accuracy}% accurate`;
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

// Start of the current study week: Monday 04:00 local time.
function studyWeekStart(now = new Date()) {
  const d = new Date(now.getTime() - 4 * 3600000);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return new Date(d.getTime() + 4 * 3600000);
}

function StreakCard({ icon, label, unit, value, marks, week }) {
  return (
    <div className="card dash-signal">
      <div className="dash-signal-head"><Icon name={icon} size={15} /> {label}</div>
      <div className="dash-signal-value"><strong><CountUp value={value} /></strong><span>{unit}</span></div>
      {marks && marks.length > 0 && (
        <div className="dash-marks" aria-label="Recent">
          {marks.map((m, i) => <span key={i} className={`dash-mark is-${m}`} title={m} />)}
        </div>
      )}
      {week && (
        <div className="dash-next">
          <div className="dash-next-row">
            <span>{week.text}</span>
            {week.coins != null && <span className={`hub-num${week.state === 'off' ? ' hub-muted' : ''}`}><Coin size={12} /> +{week.coins}</span>}
          </div>
          <span className="hub-bar hub-bar--wide"><span style={{ width: `${week.progress * 100}%`, background: week.state === 'off' ? 'var(--h-danger)' : undefined }} /></span>
        </div>
      )}
    </div>
  );
}

const MAX_TODAY = 6;
const MAX_BOARD = 6;

function Leaderboard({ rows }) {
  if (!rows.length) return <p className="dash-empty">Join a class to see the leaderboard.</p>;
  const top = rows.slice(0, MAX_BOARD);
  const myIndex = rows.findIndex((r) => r.is_me);
  const list = myIndex >= MAX_BOARD ? [...top.slice(0, MAX_BOARD - 1), { ...rows[myIndex], place: myIndex + 1 }] : top;
  return (
    <ol className="dash-board">
      {list.map((r, i) => (
        <li key={r.student_id} className={r.is_me ? 'is-me' : ''}>
          <span className={`dash-board-place${(r.place || i + 1) <= 3 ? ` is-top is-${r.place || i + 1}` : ''}`}>{r.place || i + 1}</span>
          <Avatar person={{ name: r.name, avatar_character: r.avatar_character }} size={26} />
          <span className="dash-board-name">{r.is_me ? 'You' : r.name}</span>
          <b className="hub-num"><Coin size={12} /> {r.week}</b>
        </li>
      ))}
    </ol>
  );
}

export function Dashboard() {
  const { user } = useHub();
  const data = useAsync(async () => {
    const [summary, snap, items, results, recent, rules, attendance, board] = await Promise.all([
      api.hubSummary(),
      // Secondary panels degrade to empty instead of blanking the dashboard.
      api.srsSnapshot(user.id).catch(() => ({ cards: [], reviews: [] })),
      api.studentHomework(user.id),
      api.testResults(user.id).catch(() => []),
      api.coinHistory(user.id, 3).catch(() => []),
      api.rewardRules().catch(() => []),
      api.studentAttendance(user.id).catch(() => []),
      api.classLeaderboard().catch(() => []),
    ]);
    const rows = items.map((a) => {
      const attempts = attemptsFor(a, results);
      const base = statusOf(a, a.submission, attempts);
      return { ...a, attempts, status: isOverdue(a, base) ? 'overdue' : base };
    });
    const coins = Object.fromEntries(rules.filter((r) => r.enabled).map((r) => [r.key, r.coins]));
    return { summary, snap, rows, recent, coins, attendance, board };
  }, [user.id]);

  return (
    <Loaded state={data}>
      {({ summary, snap, rows, recent, coins, attendance, board }) => {
        const today = todaysHomework(rows, endOfStudyDay());
        const doneToday = today.filter((a) => isComplete(a.status)).length;
        const weekStart = studyWeekStart();
        const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

        // This week's attendance: perfect so far → on track for the bonus.
        const weekSessions = attendance.filter((r) => r.class_sessions && new Date(r.class_sessions.held_at) >= weekStart && new Date(r.class_sessions.held_at) < weekEnd);
        const attended = weekSessions.filter((r) => r.status === 'present' || r.status === 'late').length;
        const absent = weekSessions.filter((r) => r.status === 'absent').length;
        const attWeek = !weekSessions.length
          ? { text: 'No classes this week', state: 'none', progress: 0, coins: coins.week_perfect_attendance }
          : absent
            ? { text: `Missed ${absent} this week`, state: 'off', progress: 1, coins: coins.week_perfect_attendance }
            : { text: `Perfect week · ${attended} attended`, state: 'on', progress: 1, coins: coins.week_perfect_attendance };

        // This week's homework: everything due so far done on time.
        const weekDue = rows.filter((a) => a.due_at && new Date(a.due_at) >= weekStart && new Date(a.due_at) < weekEnd);
        const missed = weekDue.filter((a) => a.status === 'overdue').length;
        const doneWeek = weekDue.filter((a) => isComplete(a.status)).length;
        const hwWeek = !weekDue.length
          ? { text: 'Nothing due this week', state: 'none', progress: 0, coins: coins.week_perfect_homework }
          : missed
            ? { text: `Missed ${missed} this week`, state: 'off', progress: 1, coins: coins.week_perfect_homework }
            : { text: `${doneWeek}/${weekDue.length} done this week`, state: 'on', progress: doneWeek / weekDue.length, coins: coins.week_perfect_homework };

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
          <div className="dash3">
            {/* ── Left: today's homework ── */}
            <section className="dash3-col">
              <div className="card dash3-card dash3-hw">
                <div className="hub-section-head"><h2 className="h3">Today's homework</h2><HubLink to="/homework">All homework</HubLink></div>
                <MascotProgress done={doneToday} total={today.length} compact />
                {today.length ? (
                  <div className="dash3-list">
                    {today.slice(0, MAX_TODAY).map((a) => {
                      const prog = itemProgress(a, snap.cards);
                      return (
                        <HubLink key={a.id} to={`/homework/${a.id}`} className="dash-hw">
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
                    {today.length > MAX_TODAY && <HubLink to="/homework" className="dash3-more">+{today.length - MAX_TODAY} more in Homework</HubLink>}
                  </div>
                ) : (
                  <div className="dash-quiet"><Icon name="checkCircle" size={18} /><span>Nothing due today. A good day to get ahead with flashcards or a game.</span></div>
                )}
              </div>
            </section>

            {/* ── Middle: level + streaks ── */}
            <section className="dash3-col">
              <HubLink to="/coins" className="dash-rank dash3-level" aria-label={`Level ${rank.rank.name}, ${summary.balance} coins`}>
                <span className="dash3-eyebrow">Your level</span>
                <Crest index={rank.index} />
                <span className="dash-rank-name">{rank.rank.name}</span>
                <span className="dash-rank-step">Level {rank.index + 1} of {RANKS.length}</span>
                <span className="dash-rank-coins"><Coin size={16} /> <CountUp value={summary.balance} /></span>
                <span className="dash-rank-today">+{summary.today} today</span>
                {rank.next && (
                  <span className="dash-rank-next">
                    <span className="dash-rank-bar"><span style={{ width: `${rank.progress * 100}%` }} /></span>
                    <small>{rank.toNext} to {rank.next.name}</small>
                  </span>
                )}
              </HubLink>
              <div className="dash3-streaks">
                <StreakCard icon="flame" label="Attendance streak" unit={summary.attendance_streak === 1 ? 'class' : 'classes'}
                  value={summary.attendance_streak} week={attWeek} marks={attMarks} />
                <StreakCard icon="checkCircle" label="Homework streak" unit="on time"
                  value={summary.homework_streak} week={hwWeek} marks={hwMarks} />
              </div>
            </section>

            {/* ── Right: coins ── */}
            <section className="dash3-col">
              <div className="card dash3-card">
                <div className="hub-section-head"><h2 className="h3">This week</h2>
                  <span className="hub-muted hub-num"><Coin size={12} /> {summary.week.reduce((t, d) => t + d.coins, 0)}</span>
                </div>
                <WeekChart week={summary.week} />
              </div>
              <div className="card dash3-card">
                <div className="hub-section-head"><h2 className="h3">Recent coins</h2><HubLink to="/coins">History</HubLink></div>
                {recent.length ? (
                  <ul className="dash-feed">
                    {recent.slice(0, 3).map((t) => (
                      <li key={t.id}><span>{t.label}</span><b className={t.amount < 0 ? 'is-neg' : ''}>{t.amount > 0 ? '+' : ''}{t.amount}</b></li>
                    ))}
                  </ul>
                ) : <p className="dash-empty">Your first coins will show up here.</p>}
              </div>
              <div className="card dash3-card dash3-grow">
                <div className="hub-section-head"><h2 className="h3">Leaderboard</h2><small className="hub-muted">last 7 days</small></div>
                <Leaderboard rows={board} />
              </div>
            </section>
          </div>
        );
      }}
    </Loaded>
  );
}

// ── Coins: balance, history, how to earn ─────────────────────────────────────
export const SourceTag = ({ source }) => (
  source === 'teacher'
    ? <span className="pill pill-accent"><Icon name="graduation" size={11} /> Teacher</span>
    : <span className="pill"><Icon name="zap" size={11} /> Automatic</span>
);

export function EarnTable({ rules }) {
  const list = rules.filter((r) => r.enabled).sort((a, b) => (b.coins > 0) - (a.coins > 0) || a.sort - b.sort);
  return (
    <div className="hub-table-wrap">
      <table className="hub-table hub-rules">
        <tbody>
          {list.map((r) => (
            <tr key={r.key}>
              <td style={{ whiteSpace: 'normal' }}>
                {r.label}
                {r.description && <div className="hub-muted" style={{ fontSize: 12 }}>{r.description.replace('this many', String(r.threshold || 2))}</div>}
              </td>
              <td className={`hub-num ${r.coins < 0 ? 'hub-neg' : 'hub-pos'}`}>{r.coins > 0 ? '+' : ''}{r.coins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CoinsPage({ studentId }) {
  const { user } = useHub();
  const uid = studentId || user.id;
  const summary = useAsync(() => api.hubSummary(studentId || null), [uid]);
  const history = useAsync(() => api.coinHistory(uid), [uid]);
  const rules = useAsync(api.rewardRules, []);

  return (
    <>
      <PageTitle eyebrow="Rewards" title="Coins" lead="Coins reward consistency: finishing homework on time, learning your words, and coming to class." />
      <div className="hub-cols">
        <section>
          <Loaded state={summary}>
            {(s) => (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="hub-coin-hero"><Coin size={22} /><strong>{s.balance}</strong><span className="hub-muted">{s.today >= 0 ? '+' : ''}{s.today} today</span></div>
              </div>
            )}
          </Loaded>
          <Loaded state={history}>
            {(rows) => {
              if (!rows.length) return <EmptyPanel icon="coin" title="No coins yet" lead="Finish today's homework or play a word game to earn your first coins." />;
              const days = [];
              rows.forEach((t) => {
                const last = days[days.length - 1];
                if (last && last.day === t.day) last.rows.push(t);
                else days.push({ day: t.day, rows: [t] });
              });
              return (
                <div className="hub-list">
                  {days.map((d) => {
                    const total = d.rows.reduce((sum, r) => sum + r.amount, 0);
                    return (
                      <React.Fragment key={d.day}>
                        <div className="hub-day-label">
                          {new Date(`${d.day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                          <span style={{ float: 'right' }} className="hub-num">{total >= 0 ? '+' : ''}{total}</span>
                        </div>
                        {d.rows.map((t) => (
                          <div key={t.id} className="hub-row" style={{ borderBottom: '1px solid var(--h-border)' }}>
                            <div className="hub-row-main">
                              <span>{t.label}</span>
                              <small>{new Date(t.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</small>
                            </div>
                            <SourceTag source={t.source} />
                            <span className={`hub-amount${t.amount < 0 ? ' is-neg' : ''}`}>{t.amount > 0 ? '+' : ''}{t.amount}</span>
                          </div>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            }}
          </Loaded>
        </section>
        <aside>
          <h2 className="h3" style={{ marginBottom: 12 }}>How coins work</h2>
          <Loaded state={rules}>
            {(list) => (
              <>
                <EarnTable rules={list} />
                <p className="form-help">These are automatic. Your teacher can also give or take coins, shown as "Teacher" in your history.</p>
              </>
            )}
          </Loaded>
        </aside>
      </div>
    </>
  );
}
