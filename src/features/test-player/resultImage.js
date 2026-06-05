// Draws a branded result summary (logo, solver name, score/band, per-passage
// cards, and a per-question-type breakdown) to a canvas. Used both to download a
// PNG and to share one via the native share sheet (no caption — the stats live
// in the image itself).

import { perTypeStats } from './grading';

const COLOR_MAP = {
  green: { bg: '#dcfce7', fg: '#15803d', bar: '#16a34a' },
  yellow: { bg: '#fef3c7', fg: '#b45309', bar: '#d97706' },
  red: { bg: '#fee2e2', fg: '#b91c1c', bar: '#dc2626' },
  '': { bg: '#f5f5f5', fg: '#0a0a0a', bar: '#9333EA' },
};
const colorFor = (ratio) => (ratio >= 0.7 ? 'green' : ratio >= 0.5 ? 'yellow' : 'red');

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Build the result canvas. Calls `cb(canvas, slug)` once the brand logo loads.
function buildResultCanvas({ spec, grade, solverName, submittedAt }, cb) {
  const { correct, total, band, results } = grade;
  const isFullTest = total >= 40;
  const types = perTypeStats(spec, grade);

  const partOf = {};
  spec.parts.forEach((p) => p.question_groups.forEach((g) => g.questions.forEach((q) => { partOf[q.number] = p.part_number; })));
  const passageStats = spec.parts.map((p) => {
    const rows = results.filter((r) => partOf[r.q] === p.part_number);
    const c = rows.filter((r) => r.correct).length;
    return { part: p.part_number, correctInPart: c, total: rows.length, color: colorFor(rows.length ? c / rows.length : 0) };
  });
  const oc = COLOR_MAP[colorFor(total ? correct / total : 0)];
  const testTitle = spec.title || 'IELTS Reading Test';
  const slug = testTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'ielts_result';

  const brand = new Image();
  brand.src = '/logo-light.svg';

  const render = () => {
    const dpr = 2;
    const W = 1080;
    const topPad = 60;
    // Vertical layout (running): header → score cards → per-type rows → footer.
    const headerBottom = solverName ? 242 : 212;
    const topY = headerBottom + 24, topH = 132;
    const ppY = topY + topH + 32, ppH = 120;
    const ptTitleY = ppY + ppH + 52;
    const ptRowH = 46;
    const ptH = types.length ? types.length * ptRowH : 0;
    const H = ptTitleY + ptH + 84;

    const canvas = document.createElement('canvas');
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#9333EA'; ctx.fillRect(0, 0, W, 6);

    ctx.textAlign = 'center';
    if (brand.complete && brand.naturalWidth) {
      const lw = 260, lh = lw * (90 / 406);
      ctx.drawImage(brand, (W - lw) / 2, 40, lw, lh);
    } else {
      ctx.fillStyle = '#7E22CE'; ctx.font = "800 40px 'Inter', sans-serif";
      ctx.fillText('IELTS Wiz', W / 2, 86);
    }

    ctx.fillStyle = '#0a0a0a'; ctx.font = "700 28px 'Inter', sans-serif";
    ctx.fillText(testTitle, W / 2, 158);
    let hb = 158;
    if (solverName) {
      ctx.fillStyle = '#7E22CE'; ctx.font = "700 20px 'Inter', sans-serif";
      ctx.fillText(solverName, W / 2, 190); hb = 190;
    }
    ctx.fillStyle = '#525252'; ctx.font = "500 15px 'Inter', sans-serif";
    ctx.fillText('Result Summary', W / 2, hb + 26);

    const drawCard = (x, y, w, h, bg, valueText, valueColor, label) => {
      ctx.fillStyle = bg; roundRect(ctx, x, y, w, h, 14); ctx.fill();
      ctx.fillStyle = valueColor; ctx.font = "700 50px 'Inter', sans-serif"; ctx.textAlign = 'center';
      ctx.fillText(valueText, x + w / 2, y + h / 2 + 4);
      ctx.fillStyle = '#525252'; ctx.font = "600 13px 'Inter', sans-serif";
      ctx.fillText(label.toUpperCase(), x + w / 2, y + h - 18);
    };

    const topCardCount = isFullTest ? 2 : 1;
    const topCardW = (W - topPad * 2 - 24 * (topCardCount - 1)) / topCardCount;
    drawCard(topPad, topY, topCardW, topH, oc.bg, `${correct} / ${total}`, oc.fg, 'Correct');
    if (isFullTest) drawCard(topPad + topCardW + 24, topY, topCardW, topH, oc.bg, band !== null ? band.toFixed(1) : '—', oc.fg, 'Band Score');

    const ppCount = passageStats.length;
    const ppCardW = (W - topPad * 2 - 24 * (ppCount - 1)) / ppCount;
    passageStats.forEach((ps, i) => {
      const c = COLOR_MAP[ps.color];
      drawCard(topPad + i * (ppCardW + 24), ppY, ppCardW, ppH, c.bg, `${ps.correctInPart} / ${ps.total}`, c.fg, `Passage ${ps.part}`);
    });

    // Per-question-type breakdown: label · bar · score
    if (types.length) {
      ctx.fillStyle = '#0a0a0a'; ctx.font = "700 17px 'Inter', sans-serif"; ctx.textAlign = 'left';
      ctx.fillText('By question type', topPad, ptTitleY - 14);
      const labelW = 280, scoreW = 70, gap = 20;
      const barX = topPad + labelW + gap;
      const barW = W - topPad - scoreW - gap - barX;
      types.forEach((t, i) => {
        const y = ptTitleY + i * ptRowH;
        const cm = COLOR_MAP[colorFor(t.total ? t.correct / t.total : 0)];
        ctx.fillStyle = '#262626'; ctx.font = "500 15px 'Inter', sans-serif"; ctx.textAlign = 'left';
        ctx.fillText(t.label, topPad, y + 16);
        ctx.fillStyle = '#ececec'; roundRect(ctx, barX, y + 4, barW, 14, 7); ctx.fill();
        const fillW = Math.max(14, (barW * t.pct) / 100);
        ctx.fillStyle = cm.bar; roundRect(ctx, barX, y + 4, fillW, 14, 7); ctx.fill();
        ctx.fillStyle = '#525252'; ctx.font = "600 14px 'Inter', sans-serif"; ctx.textAlign = 'right';
        ctx.fillText(`${t.correct}/${t.total}`, W - topPad, y + 16);
      });
    }

    const when = submittedAt instanceof Date ? submittedAt : new Date();
    const dateStr = when.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      + ' · ' + when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a3a3a3'; ctx.font = "500 14px 'Inter', sans-serif";
    ctx.fillText(dateStr, W / 2, H - 46);
    ctx.fillStyle = '#737373'; ctx.font = "500 14px 'Inter', sans-serif";
    ctx.fillText('ielts-wiz.com', W / 2, H - 24);

    cb(canvas, slug);
  };

  if (brand.complete && brand.naturalWidth) render();
  else { brand.onload = render; brand.onerror = render; }
}

export function downloadResultImage(opts) {
  buildResultCanvas(opts, (canvas, slug) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${slug}_summary.png`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }, 'image/png');
  });
}

// Share the PNG via the native share sheet (Telegram/WhatsApp/etc.). Falls back
// to a download when file sharing isn't supported (most desktops).
export function shareResultImage(opts) {
  buildResultCanvas(opts, (canvas, slug) => {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `${slug}_summary.png`, { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          return;
        }
      } catch { /* user cancelled or share failed — fall through to download */ }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${slug}_summary.png`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }, 'image/png');
  });
}
