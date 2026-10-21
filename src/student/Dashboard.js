import React from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import {
  attemptsFor, statusOf, isComplete, isOverdue, dueLabel, formatDate, srsStats, KINDS,
} from './homework';
import { endOfStudyDay } from './fsrs';
import {
  useHub, useAsync, Loaded, HubLink, StatusPill, PageTitle, Coin, EmptyPanel,
} from './ui';
import { JoinForm } from './StudentPages';

const WEEKDAY = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' });

// Homework that matters today: overdue, due before tomorrow's rollover, or
// posted today. Completed ones stay so progress is visible.
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

function WeekChart({ week }) {
  const max = Math.max(10, ...week.map((d) => d.coins));
  const today = week[week.length - 1]?.day;
  return (
    <div className="hub-week" aria-label="Coins earned per day this week">
      {week.map((d) => (
        <div key={d.day} className={`hub-week-col${d.day === today ? ' is-today' : ''}`}>
          <b>{d.coins || ''}</b>
          <div className={`hub-week-bar${d.coins ? '' : ' is-zero'}`} style={{ height: `${Math.max(2, (d.coins / max) * 80)}px` }} />
          <small>{WEEKDAY(d.day)}</small>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { user, profile, isTeacher } = useHub();
  const summary = useAsync(() => api.hubSummary(), [user.id]);
  const snap = useAsync(() => api.srsSnapshot(user.id), [user.id]);
  const classes = useAsync(api.myClasses, [user.id]);
  const hw = useAsync(async () => {
    const [items, results] = await Promise.all([api.studentHomework(user.id), api.testResults(user.id)]);
    return items.map((a) => {
      const attempts = attemptsFor(a, results);
      const base = statusOf(a, a.submission, attempts);
      return { ...a, attempts, status: isOverdue(a, base) ? 'overdue' : base };
    });
  }, [user.id]);

  const first = profile?.name?.split(' ')[0];
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <div className="hub-hello">
        <div>
          <h1>{first ? `Hi, ${first}` : 'Hi there'}</h1>
          <p>{dateLabel}</p>
        </div>
        {isTeacher && <HubLink to="/teach/assignments" className="btn btn-sm"><Icon name="graduation" size={14} /> Teaching</HubLink>}
      </div>

      <Loaded state={summary}>
        {(s) => (
          <div className="hub-stats">
            <HubLink to="/coins" className="card card-interactive hub-stat">
              <small><Coin /> Coins</small>
              <strong>{s.balance}</strong>
              <span>+{s.today} today · view history</span>
            </HubLink>
            <div className="card hub-stat">
              <small><Icon name="flame" size={14} /> Attendance streak</small>
              <strong>{s.attendance_streak}</strong>
              <span>{s.attendance?.sessions ? `${s.attendance.attended}/${s.attendance.sessions} classes attended` : 'No classes yet'}</span>
            </div>
            <div className="card hub-stat">
              <small><Icon name="checkCircle" size={14} /> Homework streak</small>
              <strong>{s.homework_streak}</strong>
              <span>on time in a row</span>
            </div>
            <Loaded state={snap} fallback={null}>
              {(data) => {
                const st = srsStats(data, new Date(), endOfStudyDay());
                return (
                  <HubLink to="/flashcards" className="card card-interactive hub-stat">
                    <small><Icon name="layers" size={14} /> Flashcards today</small>
                    <strong>{st.fresh + st.due}</strong>
                    <span>{st.fresh} new · {st.due} review</span>
                  </HubLink>
                );
              }}
            </Loaded>
          </div>
        )}
      </Loaded>

      <div className="hub-cols hub-section">
        <section>
          <Loaded state={hw}>
            {(rows) => {
              const today = todaysHomework(rows);
              const done = today.filter((a) => isComplete(a.status)).length;
              const upcoming = rows.filter((a) => !isComplete(a.status) && !today.includes(a)).slice(0, 4);
              return (
                <>
                  <div className="hub-today-head">
                    <h2 className="h3">Today's homework</h2>
                    <span className="hub-muted hub-num">{done}/{today.length} done</span>
                  </div>
                  {today.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <span className="hub-bar hub-bar--wide"><span style={{ width: `${(done / today.length) * 100}%` }} /></span>
                    </div>
                  )}
                  {today.length ? (
                    <div className="hub-list">
                      {today.map((a) => (
                        <HubLink key={a.id} to={`/homework/${a.id}`} className="card card-interactive hub-row">
                          <span className="hub-kind-icon"><Icon name={KINDS[a.kind]?.icon || 'edit'} size={16} /></span>
                          <div className="hub-row-main"><strong>{a.title}</strong><small>{dueLabel(a.due_at)}</small></div>
                          <StatusPill status={a.status} />
                        </HubLink>
                      ))}
                    </div>
                  ) : <div className="card"><p>Nothing due today.</p></div>}

                  {upcoming.length > 0 && (
                    <div className="hub-section" style={{ marginTop: 24 }}>
                      <div className="hub-section-head"><h2 className="h3">Coming up</h2><HubLink to="/homework">All homework</HubLink></div>
                      <div className="hub-list">
                        {upcoming.map((a) => (
                          <HubLink key={a.id} to={`/homework/${a.id}`} className="card card-interactive hub-row">
                            <span className="hub-kind-icon"><Icon name={KINDS[a.kind]?.icon || 'edit'} size={16} /></span>
                            <div className="hub-row-main"><strong>{a.title}</strong><small>{dueLabel(a.due_at)}</small></div>
                            <StatusPill status={a.status} />
                          </HubLink>
                        ))}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const feedback = rows.filter((a) => a.submission?.reviewed_at)
                      .sort((x, y) => y.submission.reviewed_at.localeCompare(x.submission.reviewed_at)).slice(0, 3);
                    return feedback.length > 0 && (
                      <div className="hub-section" style={{ marginTop: 24 }}>
                        <h2 className="h3">Recent feedback</h2>
                        <div className="hub-list">
                          {feedback.map((a) => (
                            <HubLink key={a.id} to={`/homework/${a.id}`} className="card card-interactive hub-row">
                              <div className="hub-row-main"><strong>{a.title}</strong><small>{formatDate(a.submission.reviewed_at)}</small></div>
                              {a.submission.band != null && <span className="pill pill-success">Band {Number(a.submission.band).toFixed(1)}</span>}
                            </HubLink>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              );
            }}
          </Loaded>
        </section>

        <aside className="hub-stack">
          <div className="card">
            <div className="hub-today-head"><h2 className="h3">This week</h2><Loaded state={summary} fallback={null}>{(s) => <span className="hub-muted hub-num">{s.week.reduce((t, d) => t + d.coins, 0)} coins</span>}</Loaded></div>
            <Loaded state={summary}>{(s) => <WeekChart week={s.week} />}</Loaded>
          </div>
          <HubLink to="/flashcards/study" className="card card-interactive hub-quick">
            <span className="hub-kind-icon"><Icon name="layers" size={16} /></span>
            <div><strong>Study flashcards</strong><small>New words first, then reviews</small></div>
            <Icon name="chevronRight" size={16} />
          </HubLink>
          <HubLink to="/games" className="card card-interactive hub-quick">
            <span className="hub-kind-icon"><Icon name="gamepad" size={16} /></span>
            <div><strong>Play a word game</strong><small>Practise the words you've learned</small></div>
            <Icon name="chevronRight" size={16} />
          </HubLink>
          <div className="card">
            <h2 className="h3" style={{ marginBottom: 8 }}>My classes</h2>
            <Loaded state={classes}>
              {(list) => (
                <>
                  {list.map((c) => (
                    <div key={c.id} className="hub-row" style={{ padding: '6px 0' }}>
                      <div className="hub-row-main"><strong>{c.name}</strong><small>{c.teacher_name || ''}</small></div>
                    </div>
                  ))}
                  <p style={{ margin: '8px 0' }}>{list.length ? 'Join another class' : 'Have a class code? Join here.'}</p>
                  <JoinForm onJoined={() => { classes.reload(); hw.reload(); summary.reload(); }} />
                </>
              )}
            </Loaded>
          </div>
        </aside>
      </div>
    </>
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
