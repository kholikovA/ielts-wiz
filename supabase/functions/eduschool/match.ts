// Fuzzy matching of hub names ("Shakhzoda Bahromova", "Abubakr D") to EduSchool
// records ("Bahromova Shahzoda Bahtyarovna"). Uzbek Latin is spelled many ways
// (kh/h/x, o'/u, g'/g, dropped apostrophes), so names are folded to one
// spelling first, then compared token by token in any order.

export type EsPerson = { id: string; fullName: string; firstName?: string | null; lastName?: string | null };
export type HubPerson = { id: string; name?: string | null; first_name?: string | null; last_name?: string | null };

export function fold(s: string): string {
  return s.toLowerCase()
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/o'/g, "u").replace(/g'/g, "g").replace(/'/g, "")
    .replace(/sh/g, "\u0001").replace(/ch/g, "\u0002")
    .replace(/kh/g, "x").replace(/h/g, "x").replace(/q/g, "k")
    .replace(/\u0001/g, "sh").replace(/\u0002/g, "ch")
    .replace(/[^a-z0-9\s-]/g, "");
}

const tokens = (s: string) => fold(s).split(/[\s-]+/).filter(Boolean);

function lev(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return d[b.length];
}

function sim(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return 0.95;
  return 1 - lev(a, b) / Math.max(a.length, b.length);
}

// 0..1: how well the hub name fits this EduSchool person (0 = ruled out).
export function score(hub: HubPerson, es: EsPerson): number {
  const raw = [hub.first_name, hub.last_name].filter(Boolean).join(" ").trim() || hub.name || "";
  const hubT = tokens(raw);
  const words = hubT.filter((t) => t.length >= 2);
  const initials = hubT.filter((t) => t.length === 1);
  const esT = tokens([es.fullName, es.firstName, es.lastName].filter(Boolean).join(" "));
  if (!words.length || !esT.length) return 0;
  if (initials.some((i) => !esT.some((t) => t.startsWith(i)))) return 0;
  const best = words.map((w) => Math.max(...esT.map((t) => sim(w, t))));
  // Every hub word must be close to something; one-word names need to be closer.
  if (Math.min(...best) < 0.6) return 0;
  const avg = best.reduce((a, b) => a + b, 0) / best.length;
  return words.length === 1 ? avg * 0.95 : avg;
}

// Confident, unambiguous match or null.
export function bestMatch(hub: HubPerson, roster: EsPerson[], taken: Set<string> = new Set()) {
  const ranked = roster
    .filter((p) => !taken.has(p.id))
    .map((p) => ({ p, s: score(hub, p) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);
  if (!ranked.length || ranked[0].s < 0.78) return null;
  if (ranked[1] && ranked[0].s - ranked[1].s < 0.1) return null;
  return ranked[0].p;
}

// Match a whole class, most confident first, never reusing a record.
export function matchAll(hubs: HubPerson[], roster: EsPerson[], taken: Set<string> = new Set()) {
  const pairs: { hub: HubPerson; es: EsPerson; s: number }[] = [];
  for (const h of hubs) {
    const m = bestMatch(h, roster, taken);
    if (m) pairs.push({ hub: h, es: m, s: score(h, m) });
  }
  pairs.sort((a, b) => b.s - a.s);
  const used = new Set(taken);
  const out = new Map<string, EsPerson>();
  for (const { hub, es } of pairs) {
    if (used.has(es.id)) continue;
    used.add(es.id);
    out.set(hub.id, es);
  }
  return out;
}
