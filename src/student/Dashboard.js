import React, { useState } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import {
  withStatus, isComplete, dueLabel, pct, KINDS, todaysHomework,
} from './homework';
import { endOfStudyDay } from './fsrs';
import {
  useHub, useAsync, useCountUp, Loaded, HubLink, StatusPill, PageTitle, Coin, EmptyPanel, Avatar,
} from './ui';
import DashboardHero from './DashboardHero';
import MascotProgress from './MascotProgress';
import Flame from './Flame';
import { attendanceMarks, homeworkMarks, markLabel, MARKS } from './welcome';
import './dashboard.css';

const WEEKDAY = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });

const CountUp = ({ value }) => <>{useCountUp(value)}</>;

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
          <div className="dash-week-track"><div className="dash-week-bar" style={{ height: `${(Math.max(0, d.coins) / max) * 100}%` }} /></div>
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

const MARK_TITLE = {
  attendance: { present: 'Came to class', late: 'Came late', absent: 'Missed' },
  homework: { present: 'Done on time', late: 'Done late', absent: 'Not done' },
};

// One streak: the count, the recent run as a row of flames, and this week's bonus.
function StreakCard({ tone, label, unit, value, marks, week, empty }) {
  const blanks = Math.max(0, MARKS - marks.length);
  return (
    <div className={`card d4-card d4-streak d4-streak--${tone}`}>
      <div className="d4-streak-top">
        <div>
          <span className="d4-label">{label}</span>
          <div className="d4-streak-value"><strong><CountUp value={value} /></strong><span>{unit}</span></div>
        </div>
        <span className="d4-streak-flame"><Flame size={46} tone={tone} state={value > 0 ? 'lit' : 'empty'} alive /></span>
      </div>
      {marks.length ? (
        <div className="d4-marks">
          {marks.map((m, i) => (
            <span key={i} className={`d4-mark is-${m.status}`} title={`${MARK_TITLE[tone][m.status]} · ${m.at.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}`}>
              <Flame size={28} tone={tone} state={m.lit ? 'lit' : 'empty'} />
              <small>{markLabel(m.at)}</small>
            </span>
          ))}
          {Array.from({ length: blanks }, (_, i) => <span key={`b${i}`} className="d4-mark is-blank"><i /><small>&nbsp;</small></span>)}
        </div>
      ) : <p className="dash-empty d4-marks-empty">{empty}</p>}
      <div className={`d4-bonus is-${week.state}`}>
        <span>{week.text}</span>
        {week.coins != null && <span className="hub-num"><Coin size={12} /> +{week.coins}</span>}
      </div>
    </div>
  );
}

const MAX_TODAY = 8;
const MAX_LATER = 6;
const MAX_BOARD = 5;

// Rows come back one per (class, member); rank each class on its own.
function Leaderboard({ rows: all }) {
  const classes = [];
  const byClass = new Map();
  for (const r of all) {
    if (!byClass.has(r.class_id)) { byClass.set(r.class_id, []); classes.push({ id: r.class_id, name: r.class_name }); }
    byClass.get(r.class_id).push(r);
  }
  // Ranked by the same balance the Coins card shows.
  for (const list of byClass.values()) list.sort((x, y) => Number(y.balance) - Number(x.balance) || Number(y.week) - Number(x.week) || String(x.name).localeCompare(String(y.name)));
  const [picked, setPicked] = useState(null);
  const classId = byClass.has(picked) ? picked : classes[0]?.id;
  if (!classes.length) return <p className="dash-empty">Join a class to see the leaderboard.</p>;
  const rows = byClass.get(classId);
  const top = rows.slice(0, MAX_BOARD);
  const myIndex = rows.findIndex((r) => r.is_me);
  const list = myIndex >= MAX_BOARD ? [...top.slice(0, MAX_BOARD - 1), { ...rows[myIndex], place: myIndex + 1 }] : top;
  return (
    <>
      {classes.length > 1 && (
        <div className="hub-seg dash-board-classes" role="radiogroup" aria-label="Class">
          {classes.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={c.id === classId}
              className={c.id === classId ? 'is-selected' : ''} onClick={() => setPicked(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <ol className="dash-board">
        {list.map((r, i) => (
          <li key={r.student_id} className={r.is_me ? 'is-me' : ''}>
            <span className={`dash-board-place${(r.place || i + 1) <= 3 ? ` is-top is-${r.place || i + 1}` : ''}`}>{r.place || i + 1}</span>
            <Avatar person={{ name: r.name, avatar_character: r.avatar_character }} size={26} />
            <span className="dash-board-name">{r.is_me ? 'You' : r.name}</span>
            <b className="hub-num"><Coin size={12} /> {r.balance}</b>
          </li>
        ))}
      </ol>
    </>
  );
}

export function Dashboard() {
  const { user, profile } = useHub();
  const data = useAsync(async () => {
    const [summary, snap, items, results, rules, attendance, board, slots, session] = await Promise.all([
      api.hubSummary(),
      // Secondary panels degrade to empty instead of blanking the dashboard.
      api.srsSnapshot(user.id).catch(() => ({ cards: [], reviews: [] })),
      api.studentHomework(user.id),
      api.testResults(user.id).catch(() => []),
      api.rewardRules().catch(() => []),
      api.studentAttendance(user.id).catch(() => []),
      api.classLeaderboard().catch(() => []),
      api.classSchedule().catch(() => []),
      api.nextSession().catch(() => null),
    ]);
    const coins = Object.fromEntries(rules.filter((r) => r.enabled).map((r) => [r.key, r.coins]));
    return { summary, snap, rows: withStatus(items, results), coins, attendance, board, slots, session };
  }, [user.id]);

  return (
    <div className="stage">
    <Loaded state={data}>
      {({ summary, snap, rows, coins, attendance, board, slots, session }) => {
        // Overdue work drops off the dashboard; it stays listed under Homework.
        const today = todaysHomework(rows, endOfStudyDay()).filter((a) => a.status !== 'overdue');
        const doneToday = today.filter((a) => isComplete(a.status)).length;
        const weekStart = studyWeekStart();
        const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

        // This week's attendance: perfect so far → on track for the bonus.
        const weekSessions = attendance.filter((r) => r.class_sessions && new Date(r.class_sessions.held_at) >= weekStart && new Date(r.class_sessions.held_at) < weekEnd);
        const attended = weekSessions.filter((r) => r.status === 'present' || r.status === 'late').length;
        const absent = weekSessions.filter((r) => r.status === 'absent').length;
        const attWeek = !weekSessions.length
          ? { text: 'No classes yet this week', state: 'none', coins: coins.week_perfect_attendance }
          : absent
            ? { text: `Missed ${absent} this week`, state: 'off', coins: coins.week_perfect_attendance }
            : { text: `Perfect week so far · ${attended} attended`, state: 'on', coins: coins.week_perfect_attendance };

        // This week's homework: everything due so far done on time.
        const weekDue = rows.filter((a) => a.due_at && new Date(a.due_at) >= weekStart && new Date(a.due_at) < weekEnd);
        const missed = weekDue.filter((a) => a.status === 'overdue').length;
        const doneWeek = weekDue.filter((a) => isComplete(a.status)).length;
        const hwWeek = !weekDue.length
          ? { text: 'Nothing due this week', state: 'none', coins: coins.week_perfect_homework }
          : missed
            ? { text: `Missed ${missed} this week`, state: 'off', coins: coins.week_perfect_homework }
            : { text: `${doneWeek}/${weekDue.length} done this week`, state: 'on', coins: coins.week_perfect_homework };

        const weekCoins = summary.week.reduce((t, d) => t + d.coins, 0);

        // Still open and not part of today: what to get ahead on, soonest first.
        const todayIds = new Set(today.map((a) => a.id));
        const later = rows.filter((a) => !todayIds.has(a.id) && !isComplete(a.status) && a.status !== 'overdue' && a.due_at)
          .sort((x, y) => x.due_at.localeCompare(y.due_at)).slice(0, MAX_LATER);
        const comingUp = later.length > 0 && (
          <>
            <div className="d4-sub">Coming up</div>
            {later.map((a) => (
              <HubLink key={a.id} to={`/homework/${a.id}`} className="dash-hw d4-next">
                <span className="hub-kind-icon"><Icon name={KINDS[a.kind]?.icon || 'edit'} size={14} /></span>
                <strong>{a.title}</strong>
                <small>{dueLabel(a.due_at)}</small>
              </HubLink>
            ))}
          </>
        );

        return (
          <div className="dash4">
            <DashboardHero name={profile?.name} slots={slots} session={session} homework={rows} />

            <div className="dash4-grid">
              {/* ── Today's homework ── */}
              <section className="card d4-card d4-hw">
                <div className="hub-section-head"><h2 className="h3">Today's homework</h2><HubLink to="/homework">All homework</HubLink></div>
                <MascotProgress done={doneToday} total={today.length} compact />
                {today.length ? (
                  <div className="d4-list">
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
                    {today.length > MAX_TODAY && <HubLink to="/homework" className="d4-more">+{today.length - MAX_TODAY} more in Homework</HubLink>}
                    {comingUp}
                  </div>
                ) : later.length ? (
                  <>
                    <div className="dash-quiet"><Icon name="checkCircle" size={18} /><span>Nothing due today. Get ahead on what is coming.</span></div>
                    <div className="d4-list">{comingUp}</div>
                  </>
                ) : (
                  <div className="dash-quiet d4-quiet"><Icon name="checkCircle" size={18} /><span>Nothing due today. A good day to get ahead with flashcards or a game.</span></div>
                )}
              </section>

              {/* ── Streaks ── */}
              <div className="d4-col">
                <StreakCard tone="attendance" label="Attendance streak"
                  unit={summary.attendance_streak === 1 ? 'class in a row' : 'classes in a row'}
                  value={summary.attendance_streak} week={attWeek} marks={attendanceMarks(attendance)}
                  empty="Your classes will show up here." />
                <StreakCard tone="homework" label="Homework streak" unit="on time in a row"
                  value={summary.homework_streak} week={hwWeek} marks={homeworkMarks(rows)}
                  empty="Your homework days will show up here." />
              </div>

              {/* ── Coins + leaderboard ── */}
              <div className="d4-col">
                <section className="card d4-card d4-coins">
                  <div className="hub-section-head"><h2 className="h3">Coins</h2><HubLink to="/coins">History</HubLink></div>
                  <div className="d4-balance">
                    <span className="d4-balance-coin"><Coin size={20} /></span>
                    <strong><CountUp value={summary.balance} /></strong>
                    <span className="d4-balance-side">
                      <b className={summary.today < 0 ? 'is-neg' : ''}>{summary.today >= 0 ? '+' : ''}{summary.today} today</b>
                      <small>{weekCoins >= 0 ? '+' : ''}{weekCoins} in 7 days</small>
                    </span>
                  </div>
                  <WeekChart week={summary.week} />
                </section>
                <section className="card d4-card d4-board">
                  <div className="hub-section-head"><h2 className="h3">Leaderboard</h2><small className="hub-muted">total coins</small></div>
                  <Leaderboard rows={board} />
                </section>
              </div>
            </div>
          </div>
        );
      }}
    </Loaded>
    </div>
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

// A student's coin history grouped by day. Used on the student's Coins page and
// on the teacher's student page. `version` lets a parent force a reload.
export function CoinHistory({ uid, version = 0, empty }) {
  const history = useAsync(() => api.coinHistory(uid), [uid, version]);
  return (
    <Loaded state={history}>
      {(rows) => {
        if (!rows.length) return empty || <EmptyPanel icon="coin" title="No coins yet" lead="Finish today's homework or play a word game to earn your first coins." />;
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
  );
}

export function CoinsPage({ studentId }) {
  const { user } = useHub();
  const uid = studentId || user.id;
  const summary = useAsync(() => api.hubSummary(studentId || null), [uid]);
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
          <CoinHistory uid={uid} />
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
