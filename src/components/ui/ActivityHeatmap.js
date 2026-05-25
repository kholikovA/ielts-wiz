import React, { useState } from 'react';
import { getActivityByDay, getActivityOnDate, labelForKind } from '../../lib/progressStore';

// GitHub-style activity heatmap. Renders the last `weeks` columns of 7 days
// each, with cell shade proportional to # of tests completed that day.
//
// Reads from progressStore (versioned localStorage), so this is intentionally
// stateless — re-renders pick up writes from HTML test submits.

const WEEKS = 26;     // ~6 months
const DAYS = 7;
const CELL = 12;      // px
const GAP = 3;

const isoDay = (date) => date.toISOString().slice(0, 10);

const buildGrid = () => {
  const byDay = getActivityByDay();
  const today = new Date();
  // Start of the column containing today's date — align to Sunday-start week.
  const dayOfWeek = today.getDay(); // 0 = Sun
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - dayOfWeek)); // end of this week
  end.setHours(0, 0, 0, 0);

  const grid = []; // [week][day]
  let max = 0;
  for (let w = WEEKS - 1; w >= 0; w--) {
    const col = [];
    for (let d = 0; d < DAYS; d++) {
      const cursor = new Date(end);
      cursor.setDate(end.getDate() - (w * 7 + (6 - d)));
      const k = isoDay(cursor);
      const count = byDay[k] || 0;
      if (count > max) max = count;
      col.push({ date: k, count, future: cursor > today });
    }
    grid.push(col);
  }
  return { grid, max };
};

const shadeFor = (count, max) => {
  if (count === 0) return 'var(--tag-bg)';
  if (max <= 1) return 'rgba(168, 85, 247, 0.75)';
  const ratio = count / max;
  if (ratio < 0.25) return 'rgba(168, 85, 247, 0.25)';
  if (ratio < 0.5)  return 'rgba(168, 85, 247, 0.45)';
  if (ratio < 0.75) return 'rgba(168, 85, 247, 0.65)';
  return 'rgba(168, 85, 247, 0.9)';
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (iso) => {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return iso; }
};

const DayDetailModal = ({ date, entries, onClose, onGoToHistory }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
      <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>{formatDate(date)}</div>
      <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
        {entries.length === 0 ? 'Nothing logged' : `${entries.length} test${entries.length === 1 ? '' : 's'} completed`}
      </h3>
      {entries.length === 0 ? (
        <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
          No activity recorded on this date.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          {entries.map((e, i) => {
            const ratio = e.total > 0 ? e.correct / e.total : 0;
            const color = ratio >= 0.85 ? 'var(--success)' : ratio >= 0.6 ? 'var(--amber-400)' : 'var(--error)';
            return (
              <div key={i} className="panel" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                    {labelForKind(e.t)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    Test {e.id}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color, fontSize: 'var(--text-lg)' }}>
                    {e.correct}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>/ {e.total}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {onGoToHistory && (
          <button type="button" className="btn btn-secondary" onClick={onGoToHistory} style={{ flex: 1 }}>
            See full history
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={onClose} style={{ flex: 1 }}>
          Close
        </button>
      </div>
    </div>
  </div>
);

const ActivityHeatmap = ({ onGoToHistory }) => {
  const { grid, max } = buildGrid();
  const [selectedDate, setSelectedDate] = useState(null);
  const totalThisWindow = grid.reduce(
    (sum, week) => sum + week.reduce((s, d) => s + d.count, 0),
    0
  );

  // Month labels: show the month of the first day in each week column when
  // the month changes vs the previous column.
  const monthLabelByCol = grid.map((col, i) => {
    const firstDay = new Date(col[0].date);
    const prev = i === 0 ? null : new Date(grid[i - 1][0].date);
    if (!prev || firstDay.getMonth() !== prev.getMonth()) {
      return MONTH_LABELS[firstDay.getMonth()];
    }
    return '';
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {totalThisWindow} test{totalThisWindow === 1 ? '' : 's'} in the last 6 months
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          <span>Less</span>
          {[0, 0.2, 0.5, 0.8, 1].map((r, i) => (
            <span key={i} style={{
              width: `${CELL}px`, height: `${CELL}px`, borderRadius: 2,
              background: r === 0 ? 'var(--tag-bg)' : `rgba(168, 85, 247, ${0.25 + r * 0.65})`,
              display: 'inline-block',
            }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: GAP }}>
          {/* Month labels row */}
          <div style={{ display: 'flex', gap: GAP, marginLeft: 0, height: 14 }}>
            {monthLabelByCol.map((label, i) => (
              <div key={i} style={{ width: CELL, fontSize: 10, color: 'var(--text-tertiary)' }}>
                {label}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div style={{ display: 'flex', gap: GAP }}>
            {grid.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {week.map((cell, di) => {
                  const interactive = !cell.future && cell.count > 0;
                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => interactive && setSelectedDate(cell.date)}
                      disabled={!interactive}
                      title={cell.future ? '' : `${cell.date}: ${cell.count} test${cell.count === 1 ? '' : 's'}`}
                      aria-label={cell.future ? '' : `${cell.count} tests on ${cell.date}`}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 2,
                        background: cell.future ? 'transparent' : shadeFor(cell.count, max || 1),
                        border: cell.future ? 'none' : '1px solid rgba(0,0,0,0.04)',
                        cursor: interactive ? 'pointer' : 'default',
                        padding: 0,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          entries={getActivityOnDate(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onGoToHistory={onGoToHistory ? () => { setSelectedDate(null); onGoToHistory(); } : null}
        />
      )}
    </div>
  );
};

export default ActivityHeatmap;
