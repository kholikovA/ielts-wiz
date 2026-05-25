import React from 'react';
import { getActivityByDay } from '../../lib/progressStore';

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

const ActivityHeatmap = () => {
  const { grid, max } = buildGrid();
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
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={cell.future ? '' : `${cell.date}: ${cell.count} test${cell.count === 1 ? '' : 's'}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      background: cell.future ? 'transparent' : shadeFor(cell.count, max || 1),
                      border: cell.future ? 'none' : '1px solid rgba(0,0,0,0.04)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
