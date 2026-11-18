import React, { useState, useMemo } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { useAsync, Loaded, PageTitle, EmptyPanel, HubLink, BackLink, Avatar, KindTag, Coin, Bar, Seg } from './ui';
import { formatDate, dueLabel } from './homework';
import { buildOverview, STATE_LABEL } from './overviewStats';

// Viewer Overview (/overview): read-only stats for the groups a teacher shared
// with this account (class_viewers). Homework completion and scores, attendance
// and coins. No essays, feedback, answers or chat. Nothing here writes.

const PERIODS = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: 'all', label: 'All time', days: null },
];

// Kept across page changes so the back button lands on the same view.
let remembered = { period: '30d', classId: '' };
const cache = new Map();
function loadOverview(period) {
  if (!cache.has(period)) {
    const days = PERIODS.find((p) => p.value === period)?.days;
    const from = days ? new Date(Date.now() - days * 86400000).toISOString() : null;
    const p = api.viewerOverview(from);
    p.catch(() => cache.delete(period));
    cache.set(period, p);
  }
  return cache.get(period);
}

const dash = <span className="hub-muted">—</span>;
const percent = (v) => (v == null ? dash : `${v}%`);
const scoreText = (t) => {
  if (t.avgScore == null && t.avgBand == null) return dash;
  return [t.avgScore != null && `${t.avgScore}%`, t.avgBand != null && `Band ${t.avgBand}`].filter(Boolean).join(' · ');
};
const STATE_PILL = { on_time: 'pill pill-success', late: 'pill pill-amber', missing: 'pill hub-pill-danger', open: 'pill' };

function useOverview() {
  const [period, setPeriodRaw] = useState(remembered.period);
  const [classId, setClassRaw] = useState(remembered.classId);
  const setPeriod = (v) => { remembered = { ...remembered, period: v }; setPeriodRaw(v); };
  const setClassId = (v) => { remembered = { ...remembered, classId: v }; setClassRaw(v); };
  const state = useAsync(() => loadOverview(period), [period]);
  const o = useMemo(() => {
    if (!state.data) return null;
    const known = state.data.classes.some((c) => c.id === classId);
    return buildOverview(state.data, known ? classId : null);
  }, [state.data, classId]);
  return { period, setPeriod, classId, setClassId, state, o };
}

function Filters({ period, setPeriod, classId, setClassId, classes }) {
  return (
    <div className="hub-stats-bar">
      <Seg label="Period" value={period} onChange={setPeriod} options={PERIODS} />
      {classes.length > 1 && (
        <select className="form-input hub-stats-class" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Group">
          <option value="">All groups</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
    </div>
  );
}

function Tile({ icon, label, value, sub }) {
  return (
    <div className="card hub-stat">
      <small>{icon === 'coin' ? <Coin /> : <Icon name={icon} size={13} />} {label}</small>
      <strong>{value}</strong>
      <span>{sub}</span>
    </div>
  );
}

function SortTable({ columns, rows, initial, rowKey }) {
  const [sort, setSort] = useState(initial);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key) || columns[0];
    const val = (r) => { const v = col.sort(r); return v == null ? -Infinity : v; };
    return [...rows].sort((a, b) => { const x = val(a); const y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
  }, [rows, sort, columns]);
  const onSort = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === 'name' ? 1 : -1 }));
  return (
    <div className="hub-table-wrap">
      <table className="hub-table hub-stats-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} title={c.title} aria-sort={sort.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}>
                {c.sort ? (
                  <button type="button" onClick={() => onSort(c.key)} className={sort.key === c.key ? 'is-sorted' : ''}>
                    {c.label}
                    {sort.key === c.key && <Icon name="chevronDown" size={12} className={sort.dir > 0 ? 'is-up' : ''} />}
                  </button>
                ) : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={rowKey(r)}>{columns.map((c) => <td key={c.key} className={c.key === 'name' ? '' : 'hub-num'}>{c.cell(r)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DoneCell = ({ t }) => (t.donePct == null ? dash : (
  <span className="hub-stats-hw" title={`${t.done} of ${t.due} done${t.missing ? `, ${t.missing} missing` : ''}`}>
    <Bar value={t.donePct} /> {t.donePct}% <small>{t.done}/{t.due}</small>
  </span>
));
const AttCell = ({ t }) => (t.attendancePct == null ? dash : `${t.attendancePct}% (${t.attended}/${t.sessions})`);

const GROUP_COLUMNS = [
  { key: 'name', label: 'Group', sort: (r) => r.name.toLowerCase(), cell: (r) => <><strong>{r.name}</strong>{r.teacher && <small className="hub-ov-sub">{r.teacher}</small>}</> },
  { key: 'students', label: 'Students', sort: (r) => r.students, cell: (r) => r.students },
  { key: 'done', label: 'Homework done', sort: (r) => r.donePct, cell: (r) => <DoneCell t={r} /> },
  { key: 'onTime', label: 'On time', sort: (r) => r.onTimePct, cell: (r) => percent(r.onTimePct) },
  { key: 'score', label: 'Avg score', sort: (r) => r.avgScore, cell: scoreText },
  { key: 'att', label: 'Attendance', sort: (r) => r.attendancePct, cell: (r) => <AttCell t={r} /> },
  { key: 'coins', label: 'Coins earned', sort: (r) => r.coins, cell: (r) => <><Coin size={12} /> {r.coins}</> },
];

const HOMEWORK_COLUMNS = [
  { key: 'name', label: 'Homework', sort: (r) => r.title.toLowerCase(), cell: (r) => (
    <HubLink to={`/overview/homework/${r.id}`} className="hub-ov-link"><strong>{r.title}</strong><small className="hub-ov-sub"><KindTag kind={r.kind} /> · {r.className}</small></HubLink>
  ) },
  { key: 'due', label: 'Due', sort: (r) => (r.due_at ? new Date(r.due_at).getTime() : null), cell: (r) => (r.due_at ? formatDate(r.due_at, true) : dash) },
  { key: 'done', label: 'Done', sort: (r) => (r.recipients ? (r.done) / r.recipients : null), cell: (r) => (
    <span className="hub-stats-hw"><Bar value={r.recipients ? (r.done / r.recipients) * 100 : 0} /> <small>{r.done}/{r.recipients}</small></span>
  ) },
  { key: 'missing', label: 'Missing', sort: (r) => r.missing, cell: (r) => (r.missing ? <span className="hub-down">{r.missing}</span> : r.open ? <small className="hub-muted">open</small> : 0) },
  { key: 'score', label: 'Avg score', sort: (r) => r.avgScore ?? (r.avgBand != null ? r.avgBand * 10 : null), cell: scoreText },
];

const STUDENT_COLUMNS = [
  { key: 'name', label: 'Student', sort: (r) => (r.name || '').toLowerCase(), cell: (r) => (
    <HubLink to={`/overview/students/${r.id}`} className="hub-stats-person hub-ov-link">
      <span className="hub-person"><Avatar person={r} /><span><strong>{r.name || 'Unnamed'}</strong><small>{r.classNames.join(', ')}</small></span></span>
    </HubLink>
  ) },
  { key: 'done', label: 'Homework', sort: (r) => r.donePct, cell: (r) => <DoneCell t={r} /> },
  { key: 'missing', label: 'Missing', sort: (r) => r.missing, cell: (r) => (r.missing ? <span className="hub-down">{r.missing}</span> : 0) },
  { key: 'score', label: 'Avg score', sort: (r) => r.avgScore, cell: scoreText },
  { key: 'att', label: 'Attendance', sort: (r) => r.attendancePct, cell: (r) => <AttCell t={r} /> },
  { key: 'earned', label: 'Coins earned', title: 'Coins earned in this period', sort: (r) => Number(r.earned || 0), cell: (r) => <span className="hub-up">+{r.earned || 0}</span> },
  { key: 'balance', label: 'Balance', sort: (r) => Number(r.balance || 0), cell: (r) => <><Coin size={12} /> {r.balance || 0}</> },
  { key: 'streak', label: 'HW streak', title: 'Homework done on time in a row', sort: (r) => r.homework_streak, cell: (r) => r.homework_streak ?? dash },
  { key: 'active', label: 'Last active', sort: (r) => (r.last_active ? new Date(r.last_active).getTime() : null), cell: (r) => (r.last_active ? formatDate(r.last_active) : dash) },
];

function NoGroups() {
  return <EmptyPanel icon="eye" title="No groups shared with you yet" lead="Ask the teacher to add your account email as a viewer on their group's page." />;
}

export default function Overview() {
  const v = useOverview();
  return (
    <>
      <PageTitle eyebrow="Overview" title="How the groups are doing"
        lead="Homework, scores, attendance and coins for the groups shared with you. Read-only." />
      <Loaded state={v.state}>
        {(data) => (data.classes.length ? <OverviewBody v={v} /> : <NoGroups />)}
      </Loaded>
    </>
  );
}

function OverviewBody({ v }) {
  const { o, state } = v;
  const t = o.totals;
  return (
    <>
      <Filters {...v} classes={state.data.classes} />
      <div className="hub-stats">
        <Tile icon="checkCircle" label="Homework done" value={percent(t.donePct)} sub={`${t.done}/${t.due} due · ${t.missing} missing`} />
        <Tile icon="clock" label="On time" value={percent(t.onTimePct)} sub={`${t.onTime} handed in by the deadline`} />
        <Tile icon="target" label="Avg score" value={t.avgScore == null ? '—' : `${t.avgScore}%`} sub={t.avgBand != null ? `Writing: band ${t.avgBand}` : 'quizzes, dictations, tests'} />
        <Tile icon="clipboard" label="Attendance" value={percent(t.attendancePct)} sub={`${t.attended}/${t.sessions} classes`} />
        <Tile icon="coin" label="Coins earned" value={`+${t.coins}`} sub={`${t.students} students`} />
      </div>

      {o.groups.length > 1 && (
        <section className="hub-section">
          <h2 className="h3">Groups</h2>
          <SortTable columns={GROUP_COLUMNS} rows={o.groups} initial={{ key: 'name', dir: 1 }} rowKey={(r) => r.id} />
        </section>
      )}

      <section className="hub-section">
        <h2 className="h3">Homework ({o.homework.length})</h2>
        {o.homework.length
          ? <SortTable columns={HOMEWORK_COLUMNS} rows={o.homework} initial={{ key: 'due', dir: -1 }} rowKey={(r) => r.id} />
          : <p className="body hub-muted">No homework in this period.</p>}
      </section>

      <section className="hub-section">
        <h2 className="h3">Students ({o.students.length})</h2>
        {o.students.length
          ? <SortTable columns={STUDENT_COLUMNS} rows={o.students} initial={{ key: 'name', dir: 1 }} rowKey={(r) => r.id} />
          : <p className="body hub-muted">No students in this group yet.</p>}
      </section>
    </>
  );
}

// /overview/homework/:id — who has done one assignment, and their scores.
export function OverviewHomework({ id }) {
  const v = useOverview();
  return (
    <>
      <BackLink to="/overview" label="Overview" />
      <Loaded state={v.state}>
        {(data) => {
          const o = buildOverview(data, null);
          const a = o.homework.find((h) => h.id === id);
          if (!a) return <EmptyPanel icon="clipboard" title="Not in this period" lead="Pick a longer period on the Overview to see this homework." />;
          const people = new Map(o.students.map((s) => [s.id, s]));
          const rows = [...a.results].sort((x, y) => (people.get(x.student_id)?.name || '').localeCompare(people.get(y.student_id)?.name || ''));
          return (
            <>
              <PageTitle eyebrow={`${a.className} · ${dueLabel(a.due_at)}`} title={a.title}><KindTag kind={a.kind} /></PageTitle>
              <div className="hub-stats">
                <Tile icon="checkCircle" label="Done" value={`${a.done}/${a.recipients}`} sub={a.missing ? `${a.missing} missing` : a.open ? `${a.open} not done yet` : 'everyone'} />
                <Tile icon="clock" label="On time" value={percent(a.onTimePct)} sub={`${a.onTime} by the deadline`} />
                <Tile icon="target" label="Avg score" value={scoreText(a)} sub="of those who did it" />
              </div>
              <div className="hub-table-wrap">
                <table className="hub-table hub-stats-table">
                  <thead><tr><th>Student</th><th>Status</th><th>Handed in</th><th>Score</th></tr></thead>
                  <tbody>
                    {rows.map((r) => {
                      const p = people.get(r.student_id) || { id: r.student_id };
                      return (
                        <tr key={r.student_id}>
                          <td><HubLink to={`/overview/students/${p.id}`} className="hub-ov-link"><span className="hub-person"><Avatar person={p} /><strong>{p.name || 'Unnamed'}</strong></span></HubLink></td>
                          <td><span className={STATE_PILL[r.state]}>{STATE_LABEL[r.state]}</span></td>
                          <td className="hub-num">{r.done_at ? formatDate(r.done_at, true) : dash}</td>
                          <td className="hub-num">{r.score != null ? `${r.score}%` : r.band != null ? `Band ${r.band}` : dash}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          );
        }}
      </Loaded>
    </>
  );
}

// /overview/students/:id — one student's homework, attendance and coins.
export function OverviewStudent({ id }) {
  const v = useOverview();
  return (
    <>
      <BackLink to="/overview" label="Overview" />
      <Loaded state={v.state}>
        {(data) => {
          const o = buildOverview(data, null);
          const s = o.students.find((x) => x.id === id);
          if (!s) return <EmptyPanel icon="users" title="Student not found" lead="They may have left the group." />;
          const hw = new Map(o.homework.map((h) => [h.id, h]));
          const results = [...s.results].sort((x, y) => (hw.get(y.assignment_id).due_at || '').localeCompare(hw.get(x.assignment_id).due_at || ''));
          const sessions = new Map(o.sessions.map((x) => [x.id, x]));
          const marks = o.marks.filter((m) => m.student_id === id)
            .map((m) => ({ ...m, session: sessions.get(m.session_id) }))
            .sort((x, y) => y.session.held_at.localeCompare(x.session.held_at));
          const groupName = new Map(data.classes.map((c) => [c.id, c.name]));
          return (
            <>
              <header className="hub-title hub-ov-person">
                <Avatar person={s} size={48} />
                <div><span className="eyebrow">{s.classNames.join(', ')}</span><h1>{s.name || 'Unnamed'}</h1></div>
              </header>
              <Filters {...v} classes={[]} />
              <div className="hub-stats">
                <Tile icon="checkCircle" label="Homework done" value={percent(s.donePct)} sub={`${s.done}/${s.due} due · ${s.missing} missing`} />
                <Tile icon="target" label="Avg score" value={s.avgScore == null ? '—' : `${s.avgScore}%`} sub={s.avgBand != null ? `Writing: band ${s.avgBand}` : 'quizzes, dictations, tests'} />
                <Tile icon="clipboard" label="Attendance" value={percent(s.attendancePct)} sub={`${s.attended}/${s.sessions} classes`} />
                <Tile icon="coin" label="Coins" value={s.balance || 0} sub={`+${s.earned || 0} this period · ${s.week || 0} this week`} />
                <Tile icon="zap" label="Streaks" value={`${s.homework_streak ?? 0} HW`} sub={`${s.attendance_streak ?? 0} classes in a row · last active ${s.last_active ? formatDate(s.last_active) : 'never'}`} />
              </div>

              <section className="hub-section">
                <h2 className="h3">Homework</h2>
                {results.length ? (
                  <div className="hub-table-wrap">
                    <table className="hub-table hub-stats-table">
                      <thead><tr><th>Homework</th><th>Due</th><th>Status</th><th>Score</th></tr></thead>
                      <tbody>
                        {results.map((r) => {
                          const a = hw.get(r.assignment_id);
                          return (
                            <tr key={r.assignment_id}>
                              <td><HubLink to={`/overview/homework/${a.id}`} className="hub-ov-link"><strong>{a.title}</strong><small className="hub-ov-sub"><KindTag kind={a.kind} /> · {a.className}</small></HubLink></td>
                              <td className="hub-num">{a.due_at ? formatDate(a.due_at, true) : dash}</td>
                              <td><span className={STATE_PILL[r.state]}>{STATE_LABEL[r.state]}</span></td>
                              <td className="hub-num">{r.score != null ? `${r.score}%` : r.band != null ? `Band ${r.band}` : dash}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="body hub-muted">No homework in this period.</p>}
              </section>

              <section className="hub-section">
                <h2 className="h3">Attendance</h2>
                {marks.length ? (
                  <div className="hub-table-wrap">
                    <table className="hub-table hub-stats-table">
                      <thead><tr><th>Class</th><th>Group</th><th>Status</th></tr></thead>
                      <tbody>
                        {marks.map((m) => (
                          <tr key={m.session_id}>
                            <td>{formatDate(m.session.held_at, true)}{m.session.topic && <small className="hub-ov-sub">{m.session.topic}</small>}</td>
                            <td>{groupName.get(m.session.class_id)}</td>
                            <td><span className={m.status === 'absent' ? 'pill hub-pill-danger' : m.status === 'late' ? 'pill pill-amber' : m.status === 'excused' ? 'pill' : 'pill pill-success'}>
                              {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                            </span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="body hub-muted">No classes marked in this period.</p>}
              </section>
            </>
          );
        }}
      </Loaded>
    </>
  );
}
