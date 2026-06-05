// Port of the standalone HTML's generateResultImage — draws a branded result
// summary (logo, solver name, score/band, per-passage cards) to a canvas and
// downloads it as a PNG. Same layout and colors as the old share image.

const COLOR_MAP = {
  green: { bg: '#dcfce7', fg: '#15803d' },
  yellow: { bg: '#fef3c7', fg: '#b45309' },
  red: { bg: '#fee2e2', fg: '#b91c1c' },
  '': { bg: '#f5f5f5', fg: '#0a0a0a' },
};
const colorFor = (ratio) => (ratio >= 0.7 ? 'green' : ratio >= 0.5 ? 'yellow' : 'red');

export function downloadResultImage({ spec, grade, solverName }) {
  const { correct, total, band, results } = grade;
  const isFullTest = total >= 40;

  const partOf = {};
  spec.parts.forEach((p) => p.question_groups.forEach((g) => g.questions.forEach((q) => { partOf[q.number] = p.part_number; })));
  const passageStats = spec.parts.map((p) => {
    const rows = results.filter((r) => partOf[r.q] === p.part_number);
    const c = rows.filter((r) => r.correct).length;
    return { part: p.part_number, correctInPart: c, total: rows.length, color: colorFor(rows.length ? c / rows.length : 0) };
  });
  const oc = COLOR_MAP[colorFor(total ? correct / total : 0)];
  const testTitle = spec.title || 'IELTS Reading Test';

  const brand = new Image();
  brand.src = '/logo-light.svg';

  const render = () => {
    const dpr = 2;
    const W = 1080, H = 720;
    const canvas = document.createElement('canvas');
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#9333EA';
    ctx.fillRect(0, 0, W, 6);

    ctx.textAlign = 'center';
    if (brand.complete && brand.naturalWidth) {
      const lw = 250, lh = lw * (90 / 390);
      ctx.drawImage(brand, (W - lw) / 2, 40, lw, lh);
    } else {
      ctx.fillStyle = '#7E22CE';
      ctx.font = "800 40px 'Inter', sans-serif";
      ctx.fillText('IELTS Wiz', W / 2, 86);
    }

    ctx.fillStyle = '#0a0a0a';
    ctx.font = "700 28px 'Inter', sans-serif";
    ctx.fillText(testTitle, W / 2, 158);

    let headerBottom = 158;
    if (solverName) {
      ctx.fillStyle = '#7E22CE';
      ctx.font = "700 20px 'Inter', sans-serif";
      ctx.fillText(solverName, W / 2, 190);
      headerBottom = 190;
    }

    ctx.fillStyle = '#525252';
    ctx.font = "500 15px 'Inter', sans-serif";
    ctx.fillText('Result Summary', W / 2, headerBottom + 26);
    headerBottom += 26;

    ctx.fillStyle = '#737373';
    ctx.font = "500 14px 'Inter', sans-serif";
    ctx.fillText('ielts-wiz.com', W / 2, H - 30);

    const drawCard = (x, y, w, h, bg, valueText, valueColor, label) => {
      const r = 14;
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = valueColor;
      ctx.font = "700 56px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(valueText, x + w / 2, y + h / 2 + 6);
      ctx.fillStyle = '#525252';
      ctx.font = "600 13px 'Inter', sans-serif";
      ctx.fillText(label.toUpperCase(), x + w / 2, y + h - 20);
    };

    const topY = headerBottom + 26, topH = 140, topPad = 60;
    const topCardCount = isFullTest ? 2 : 1;
    const topCardW = (W - topPad * 2 - 24 * (topCardCount - 1)) / topCardCount;
    drawCard(topPad, topY, topCardW, topH, oc.bg, `${correct} / ${total}`, oc.fg, 'Correct');
    if (isFullTest) {
      drawCard(topPad + topCardW + 24, topY, topCardW, topH, oc.bg, band !== null ? band.toFixed(1) : '—', oc.fg, 'Band Score');
    }

    const ppY = topY + topH + 40, ppH = 140, ppCount = passageStats.length;
    const ppCardW = (W - topPad * 2 - 24 * (ppCount - 1)) / ppCount;
    passageStats.forEach((ps, i) => {
      const c = COLOR_MAP[ps.color];
      drawCard(topPad + i * (ppCardW + 24), ppY, ppCardW, ppH, c.bg, `${ps.correctInPart} / ${ps.total}`, c.fg, `Passage ${ps.part}`);
    });

    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillStyle = '#a3a3a3';
    ctx.font = "500 14px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(dateStr, W / 2, H - 50);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug = testTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      a.href = url;
      a.download = `${slug || 'ielts_result'}_summary.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }, 'image/png');
  };

  if (brand.complete && brand.naturalWidth) render();
  else { brand.onload = render; brand.onerror = render; }
}
