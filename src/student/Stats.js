import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { useHub, useAsync, Loaded, PageTitle, EmptyPanel, PersonName, HubLink, Coin, Bar } from './ui';
import { presetRange, rangeLabel, formatDuration, monthGrid, parseDay, PRESETS, TRACKING_SINCE } from './statsDates';

// Teaching → Stats (/teach/stats): per-student activity over a date range.
// Data: teacher_hub_stats (supabase/migrations/20261109203040_hub_stats.sql).
// Days are study days (4am rollover in each student's timezone), like coins.

const pct = (n, d) => (d ? Math.round((n / d) * 100) : null);

const COLUMNS = [
  { key: 'name', label: 'Student', sort: (r) => (r.person.name || r.person.email || '').toLowerCase() },
  { key: 'seconds', label: 'Time on hub', title: 'Time with the hub on screen and in use', sort: (r) => r.seconds },
  { key: 'active_days', label: 'Active days', title: 'Days with at least 1 minute on the hub', sort: (r) => r.active_days },
  { key: 'hw', label: 'Homework', title: 'Homework due in this period that is done', sort: (r) => (r.hw_total ? r.hw_done / r.hw_total : -1) },
  { key: 'hw_on_time', label: 'On time', sort: (r) => (r.hw_total ? r.hw_on_time / r.hw_total : -1) },
  { key: 'coins_net', label: 'Coins', title: 'Coins gained minus coins lost in this period', sort: (r) => r.coins_net },
  { key: 'balance', label: 'Balance', title: 'Current coin balance', sort: (r) => r.balance },
  { key: 'attendance', label: 'Attendance', title: 'Classes attended out of marked classes (excused not counted)', sort: (r) => (r.sessions ? r.attended / r.sessions : -1) },
  { key: 'reviews', label: 'Card reviews', sort: (r) => r.reviews },
  { key: 'tests', label: 'Tests', sort: (r) => r.tests },
  { key: 'games', label: 'Games', sort: (r) => r.games },
];

export default function Stats() {
  const { user } = useHub();
  const [preset, setPreset] = useState('7d');
  const [custom, setCustom] = useState(null); // { from, to }
  const [classId, setClassId] = useState('');
  const range = preset === 'custom' && custom ? custom : presetRange(preset);

  const roster = useAsync(() => api.teacherStudents(user.id), [user.id]);
  const state = useAsync(() => api.teacherHubStats(range.from, range.to, classId || null), [range.from, range.to, classId]);

  return (
    <>
      <PageTitle eyebrow="Teaching" title="Stats"
        lead="How your students use the hub: time on screen, homework, coins and more for the period you pick." />
      <div className="hub-stats-bar">
        <div className="hub-seg" role="radiogroup" aria-label="Period">
          {PRESETS.map((p) => (
            <button key={p.value} type="button" role="radio" aria-checked={preset === p.value}
              className={preset === p.value ? 'is-selected' : ''} onClick={() => setPreset(p.value)}>
              {p.label}
            </button>
          ))}
        </div>
        <RangePicker value={range} active={preset === 'custom'}
          onApply={(r) => { setCustom(r); setPreset('custom'); }} />
        {roster.data?.classes?.length > 1 && (
          <select className="form-input hub-stats-class" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class">
            <option value="">All classes</option>
            {roster.data.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>
      <p className="hub-stats-range">
        <Icon name="calendar" size={14} /> {rangeLabel(range)}
        {range.from < TRACKING_SINCE && <span> · Time on hub is counted from {rangeLabel({ from: TRACKING_SINCE, to: TRACKING_SINCE })}.</span>}
      </p>
      <Loaded state={state}>
        {(data) => <StatsBody data={data} roster={roster.data} range={range} />}
      </Loaded>
    </>
  );
}

function StatsBody({ data, roster, range }) {
  const [sort, setSort] = useState({ key: 'seconds', dir: -1 });
  const people = useMemo(() => new Map((roster?.students || []).map((s) => [s.id, s])), [roster]);
  const rows = useMemo(() => (data?.students || []).map((r) => ({ ...r, person: people.get(r.id) || { id: r.id } })), [data, people]);
  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sort.key) || COLUMNS[1];
    return [...rows].sort((a, b) => {
      const x = col.sort(a); const y = col.sort(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [rows, sort]);

  if (!rows.length) return <EmptyPanel icon="users" title="No students yet" lead="Students appear here once they join one of your classes." />;

  const sum = (k) => rows.reduce((t, r) => t + Number(r[k] || 0), 0);
  const totalSeconds = sum('seconds');
  const activeStudents = rows.filter((r) => r.seconds >= 60).length;
  const hwPct = pct(sum('hw_done'), sum('hw_total'));
  const attPct = pct(sum('attended'), sum('sessions'));
  const onSort = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === 'name' ? 1 : -1 }));

  return (
    <>
      <div className="hub-stats">
        <div className="card hub-stat"><small><Icon name="clock" size={13} /> Time on hub</small><strong>{formatDuration(totalSeconds)}</strong>
          <span>{formatDuration(Math.round(totalSeconds / rows.length))} per student</span></div>
        <div className="card hub-stat"><small><Icon name="users" size={13} /> Active students</small><strong>{activeStudents}/{rows.length}</strong>
          <span>used the hub in this period</span></div>
        <div className="card hub-stat"><small><Icon name="checkCircle" size={13} /> Homework done</small><strong>{hwPct == null ? '—' : `${hwPct}%`}</strong>
          <span>{sum('hw_done')}/{sum('hw_total')} due · {sum('hw_missed')} missed</span></div>
        <div className="card hub-stat"><small><Coin /> Coins</small><strong>{sum('coins_net') > 0 ? '+' : ''}{sum('coins_net')}</strong>
          <span>+{sum('coins_earned')} earned · −{sum('coins_lost')} lost</span></div>
        <div className="card hub-stat"><small><Icon name="clipboard" size={13} /> Attendance</small><strong>{attPct == null ? '—' : `${attPct}%`}</strong>
          <span>{sum('attended')}/{sum('sessions')} classes</span></div>
      </div>

      {data.days.length > 1 && (
        <section className="hub-section">
          <h2 className="h3">Time on hub per day</h2>
          <DailyChart days={data.days} />
        </section>
      )}

      <section className="hub-section">
        <h2 className="h3">Students</h2>
        <div className="hub-table-wrap">
          <table className="hub-table hub-stats-table">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} title={c.title} aria-sort={sort.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}>
                    <button type="button" onClick={() => onSort(c.key)} className={sort.key === c.key ? 'is-sorted' : ''}>
                      {c.label}
                      {sort.key === c.key && <Icon name="chevronDown" size={12} className={sort.dir > 0 ? 'is-up' : ''} />}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const hw = pct(r.hw_done, r.hw_total);
                const onTime = pct(r.hw_on_time, r.hw_total);
                const att = pct(r.attended, r.sessions);
                return (
                  <tr key={r.id}>
                    <td><HubLink to={`/teach/students/${r.id}`} className="hub-stats-person"><PersonName person={r.person} /></HubLink></td>
                    <td className="hub-num">{formatDuration(r.seconds)}</td>
                    <td className="hub-num">{r.active_days}</td>
                    <td className="hub-num">
                      {hw == null ? <span className="hub-muted">—</span> : (
                        <span className="hub-stats-hw" title={`${r.hw_done} of ${r.hw_total} done${r.hw_missed ? `, ${r.hw_missed} missed` : ''}`}>
                          <Bar value={hw} /> {hw}% <small>{r.hw_done}/{r.hw_total}</small>
                        </span>
                      )}
                    </td>
                    <td className="hub-num">{onTime == null ? <span className="hub-muted">—</span> : `${onTime}%`}</td>
                    <td className="hub-num" title={`+${r.coins_earned} earned, −${r.coins_lost} lost`}>
                      <span className={r.coins_net > 0 ? 'hub-up' : r.coins_net < 0 ? 'hub-down' : ''}>{r.coins_net > 0 ? '+' : ''}{r.coins_net}</span>
                    </td>
                    <td className="hub-num"><Coin size={12} /> {r.balance}</td>
                    <td className="hub-num">{att == null ? <span className="hub-muted">—</span> : `${att}% (${r.attended}/${r.sessions})`}</td>
                    <td className="hub-num">{r.reviews}</td>
                    <td className="hub-num">{r.tests}</td>
                    <td className="hub-num">{r.games}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function DailyChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.seconds));
  const every = Math.ceil(days.length / 10); // at most ~10 date labels
  return (
    <div className="card hub-daychart" role="img" aria-label="Minutes on the hub per day">
      {days.map((d, i) => {
        const date = parseDay(d.day);
        return (
          <div key={d.day} className="hub-daychart-col" title={`${date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${formatDuration(d.seconds)}`}>
            <div className={`hub-week-bar${d.seconds ? '' : ' is-zero'}`} style={{ height: `${Math.max(2, (d.seconds / max) * 100)}%` }} />
            <small>{i % every === 0 ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ' '}</small>
          </div>
        );
      })}
    </div>
  );
}

// Custom period: a one-month calendar. First click sets the start, second the end.
function RangePicker({ value, active, onApply }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from: value.from, to: value.to });
  const [picking, setPicking] = useState(false); // waiting for the end date
  const [hover, setHover] = useState(null);
  const [month, setMonth] = useState(() => value.to.slice(0, 7));
  const ref = useRef(null);
  const today = presetRange('today').to;

  useEffect(() => {
    if (!open) return undefined;
    setDraft({ from: value.from, to: value.to });
    setPicking(false);
    setMonth(value.to.slice(0, 7));
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = (day) => {
    if (!picking) { setDraft({ from: day, to: day }); setPicking(true); return; }
    setDraft((d) => (day < d.from ? { from: day, to: d.from } : { from: d.from, to: day }));
    setPicking(false);
  };
  const shown = picking && hover
    ? (hover < draft.from ? { from: hover, to: draft.from } : { from: draft.from, to: hover })
    : draft;
  const shiftMonth = (n) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + n, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const [y, m] = month.split('-').map(Number);
  const title = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="hub-pop-wrap" ref={ref}>
      <button type="button" className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}>
        <Icon name="calendar" size={14} /> {active ? rangeLabel(value) : 'Custom'}
      </button>
      {open && (
        <div className="hub-pop hub-cal" role="dialog" aria-label="Choose dates">
          <div className="hub-cal-head">
            <button type="button" className="hub-icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month"><Icon name="chevronRight" size={16} className="hub-flip" /></button>
            <strong>{title}</strong>
            <button type="button" className="hub-icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month" disabled={month >= today.slice(0, 7)}><Icon name="chevronRight" size={16} /></button>
          </div>
          <div className="hub-cal-grid" onMouseLeave={() => setHover(null)}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <span key={d} className="hub-cal-dow">{d}</span>)}
            {monthGrid(y, m).map((day, i) => {
              if (!day) return <span key={`x${i}`} />;
              const inRange = day >= shown.from && day <= shown.to;
              const edge = day === shown.from || day === shown.to;
              return (
                <button key={day} type="button" disabled={day > today}
                  className={`hub-cal-day${inRange ? ' is-in' : ''}${edge ? ' is-edge' : ''}${day === today ? ' is-today' : ''}`}
                  onClick={() => pick(day)} onMouseEnter={() => setHover(day)} aria-pressed={edge}>
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>
          <div className="hub-cal-foot">
            <small>{picking ? 'Pick the end date' : rangeLabel(draft)}</small>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={picking}
              onClick={() => { onApply({ from: draft.from, to: draft.to > today ? today : draft.to }); setOpen(false); }}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

