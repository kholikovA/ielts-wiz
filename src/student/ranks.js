// Ranks earned from lifetime coins, and "next bonus" maths for streaks. Pure.

export const RANKS = [
  { name: 'Novice', at: 0 },
  { name: 'Apprentice', at: 300 },
  { name: 'Adept', at: 1000 },
  { name: 'Scholar', at: 2500 },
  { name: 'Magus', at: 6000 },
  { name: 'Archmage', at: 12000 },
];

// { rank, index, next, progress (0..1), toNext }
export function rankFor(coins) {
  let index = 0;
  RANKS.forEach((r, i) => { if (coins >= r.at) index = i; });
  const rank = RANKS[index];
  const next = RANKS[index + 1] || null;
  const progress = next ? (coins - rank.at) / (next.at - rank.at) : 1;
  return { rank, index, next, progress: Math.max(0, Math.min(1, progress)), toNext: next ? next.at - coins : 0 };
}

// Next streak milestone after `streak`, including the repeating bonus past the
// last configured milestone. milestones: [{ kind, at, coins }], repeat: { kind: every }.
export function nextMilestone(kind, streak, milestones, repeat = {}) {
  const list = milestones.filter((m) => m.kind === kind).sort((a, b) => a.at - b.at);
  if (!list.length) return null;
  const upcoming = list.find((m) => m.at > streak);
  const prevAt = [...list].reverse().find((m) => m.at <= streak)?.at || 0;
  if (upcoming) return { at: upcoming.at, coins: upcoming.coins, from: prevAt };
  const last = list[list.length - 1];
  const every = repeat[kind];
  if (!every) return null;
  const steps = Math.floor((streak - last.at) / every) + 1;
  const at = last.at + steps * every;
  return { at, coins: last.coins, from: at - every };
}
