import React, { useMemo, useRef, useState } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { useHub, useAsync, Loaded, PageTitle, Seg, ErrorNote, EmptyPanel } from './ui';
import { BankTabs } from './ielts/IeltsBank';
import { WORDBANK_PREFILL_KEY } from './homework';

// Teaching → Question bank → Words: every B2+ word (and idiomatic phrasal verb)
// students meet in the question bank, from bank_words (scripts/word-bank).
// The teacher picks a class, sees which words it hasn't had yet (most frequent
// first), selects a batch and assigns it: Claude writes the meaning in the sense
// used in the bank, an example, gap-fills, word forms and collocations (cached
// per word, so each word is enriched once), then the assignment form opens with
// the flashcards filled in and "Use it" ticked.

const PAGE = 80;
const LEVELS = ['B2', 'C1', 'C2'];
const SOURCES = [
  { key: 'sat_rw', label: 'SAT Reading & Writing' },
  { key: 'sat_math', label: 'SAT Math' },
  { key: 'ielts_reading', label: 'IELTS Reading' },
  { key: 'ielts_listening', label: 'IELTS Listening' },
];
const SOURCE_SHORT = { sat_rw: 'SAT R&W', sat_math: 'SAT Math', ielts_reading: 'IELTS Reading', ielts_listening: 'IELTS Listening' };
const norm = (s) => String(s || '').trim().toLowerCase();

// The example sentence with the word highlighted.
function Example({ ex }) {
  if (!ex) return null;
  const i = ex.w ? ex.s.indexOf(ex.w) : -1;
  if (i < 0) return <p className="wb-ex">{ex.s}</p>;
  return <p className="wb-ex">{ex.s.slice(0, i)}<mark>{ex.w}</mark>{ex.s.slice(i + ex.w.length)}</p>;
}

// Which classes (or individual students) already had each word, from the teacher's
// flashcard and "Use it" assignments. A class counts when the assignment was for the
// class or reached at least half of its students.
function givenIndex(assignments, roster) {
  const classStudents = new Map(roster.classes.map((c) => [c.id, roster.students.filter((s) => s.classIds.includes(c.id)).map((s) => s.id)]));
  const index = new Map(); // front -> Set(classId)
  assignments.forEach((a) => {
    let fronts = [];
    if (a.kind === 'flashcards') fronts = (a.payload?.cards || []).map((c) => c.f);
    else if (a.kind === 'sentences') fronts = (a.payload?.words || []).map((w) => w.w);
    else return;
    const recips = new Set((a.assignment_recipients || []).map((r) => r.student_id));
    const classes = [];
    classStudents.forEach((ids, cid) => {
      if (a.class_id === cid || (ids.length && ids.filter((id) => recips.has(id)).length * 2 >= ids.length)) classes.push(cid);
    });
    fronts.forEach((f) => {
      const k = norm(f);
      if (!k) return;
      const set = index.get(k) || new Set();
      classes.forEach((c) => set.add(c));
      set.add('*');
      index.set(k, set);
    });
  });
  return index;
}

export default function WordBank() {
  const { user, go } = useHub();
  const data = useAsync(async () => {
    const [words, roster, assignments] = await Promise.all([api.bankWords(), api.teacherStudents(user.id), api.teacherAssignments(user.id)]);
    return { words, roster, assignments };
  }, [user.id]);
  const [classId, setClassId] = useState('*');
  const [hideGiven, setHideGiven] = useState(true);
  const [levels, setLevels] = useState(new Set());
  const [sources, setSources] = useState(new Set());
  const [kind, setKind] = useState('all');
  const [minFreq, setMinFreq] = useState(1);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('freq');
  const [showHidden, setShowHidden] = useState(false);
  const [selected, setSelected] = useState([]); // words, in the order picked
  const [shown, setShown] = useState(PAGE);
  const [batch, setBatch] = useState(20);
  const [cards, setCards] = useState({}); // word -> card enriched in this session
  const [hiddenNow, setHiddenNow] = useState({}); // word -> hidden, changed in this session
  const [busy, setBusy] = useState(null); // enrichment progress 0..1
  const [error, setError] = useState(null);
  const top = useRef(null);

  const toggleIn = (set, setSet, v) => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); setSet(n); setShown(PAGE); };
  const toggleWord = (w) => setSelected((cur) => (cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w]));

  const given = useMemo(() => (data.data ? givenIndex(data.data.assignments, data.data.roster) : new Map()), [data.data]);
  const isGiven = (r) => [r.word, ...(r.forms || [])].some((f) => given.get(norm(f))?.has(classId));
  const isHidden = (r) => (r.word in hiddenNow ? hiddenNow[r.word] : r.hidden);
  const cardOf = (r) => cards[r.word] || r.card;

  const setHidden = async (r, hidden) => {
    setHiddenNow((m) => ({ ...m, [r.word]: hidden }));
    setSelected((cur) => cur.filter((x) => x !== r.word));
    try { await api.hideBankWord(r.word, hidden); } catch (err) { setError(err); setHiddenNow((m) => ({ ...m, [r.word]: !hidden })); }
  };

  // Enrich what isn't cached yet, then open the assignment form with everything filled in.
  const assign = async (rows) => {
    setError(null);
    const need = rows.filter((r) => !cardOf(r)?.b);
    const fresh = {};
    if (need.length) {
      setBusy(0);
      try {
        const out = await api.enrichCards(need.map((r) => ({ f: r.word, ctx: r.examples?.[0]?.s })), setBusy);
        out.forEach((x) => { const { f, ...card } = x; if (card.b) fresh[norm(f)] = card; });
        const saves = need.filter((r) => fresh[norm(r.word)]).map((r) => api.saveBankCard(r.word, fresh[norm(r.word)]).catch(() => null));
        await Promise.all(saves);
        setCards((m) => ({ ...m, ...Object.fromEntries(need.filter((r) => fresh[norm(r.word)]).map((r) => [r.word, fresh[norm(r.word)]])) }));
      } catch (err) { setError(err); setBusy(null); return; }
      setBusy(null);
    }
    const deck = rows.map((r) => ({ f: r.word, ...(fresh[norm(r.word)] || cardOf(r) || {}) })).filter((c) => c.b);
    const missing = rows.length - deck.length;
    if (!deck.length) { setError({ message: 'The AI could not write meanings for these words. Try again.' }); return; }
    const names = deck.slice(0, 3).map((c) => c.f).join(', ');
    const prefill = {
      cards: deck,
      title: `Words: ${names}${deck.length > 3 ? ` +${deck.length - 3}` : ''}`,
      classIds: classId !== '*' ? [classId] : [],
      missing,
    };
    try { sessionStorage.setItem(WORDBANK_PREFILL_KEY, JSON.stringify(prefill)); } catch { /* storage off: the form opens empty */ }
    go('/teach/assignments/new?words=1');
  };

  return (
    <>
      <PageTitle eyebrow="Teaching" title="Question bank"
        lead="Every B2+ word students meet in the question bank's questions, passages and options. Assign them class by class until they understand all of it.">
        <div className="hub-actions"><BankTabs active="words" /></div>
      </PageTitle>
      <Loaded state={data}>
        {({ words, roster }) => {
          if (!words.length) return <EmptyPanel icon="layers" title="No words yet" lead="The word list is built from the question bank. It will appear here once it has been generated." />;
          const visible = words.filter((r) => !isHidden(r));
          const coverAll = visible.length;
          const coverGiven = visible.filter(isGiven);
          const sumFreq = (l) => l.reduce((n, r) => n + r.freq, 0);
          const weighted = sumFreq(visible) ? Math.round((sumFreq(coverGiven) / sumFreq(visible)) * 100) : 0;
          const q = norm(query);
          // With sources ticked, counts, the minimum and sorting use only those sources:
          // "cubic" is in 31 Math questions but only 1 Reading & Writing question.
          const freqIn = (r) => (sources.size ? Object.entries(r.sources || {}).reduce((n, [k, v]) => n + (sources.has(k) ? v : 0), 0) : r.freq);
          const exampleOf = (r) => (sources.size && r.examples?.find((e) => sources.has(e.k))) || (sources.size ? null : r.examples?.[0]);
          let list = (showHidden ? words.filter(isHidden) : visible).filter((r) => (!levels.size || levels.has(r.level))
            && freqIn(r) > 0
            && (kind === 'all' || r.kind === kind)
            && freqIn(r) >= minFreq
            && (!q || r.word.includes(q) || (r.forms || []).some((f) => f.includes(q)) || norm(cardOf(r)?.b).includes(q))
            && (showHidden || !hideGiven || !isGiven(r)));
          if (sources.size && sort === 'freq') list = [...list].sort((a, b) => freqIn(b) - freqIn(a) || a.word.localeCompare(b.word));
          if (sort === 'az') list = [...list].sort((a, b) => a.word.localeCompare(b.word));
          if (sort === 'level') list = [...list].sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || freqIn(b) - freqIn(a));
          const byWord = new Map(words.map((r) => [r.word, r]));
          const chosen = selected.map((w) => byWord.get(w)).filter(Boolean);
          const className = classId === '*' ? 'any of your classes' : roster.classes.find((c) => c.id === classId)?.name;
          const counts = { B2: 0, C1: 0, C2: 0 };
          visible.forEach((r) => { counts[r.level] += 1; });
          return (
            <div className="bank" ref={top}>
              <aside className="card bank-filters">
                <div className="form-field">
                  <label className="form-label" htmlFor="wb-class">Class</label>
                  <select id="wb-class" className="form-select" value={classId} onChange={(e) => { setClassId(e.target.value); setShown(PAGE); }}>
                    <option value="*">All my classes</option>
                    {roster.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="wb-cover" title="Share of the bank's B2+ words already assigned">
                    <div className="wb-cover-bar"><span style={{ width: `${weighted}%` }} /></div>
                    <small><strong>{coverGiven.length}</strong> of {coverAll} words given to {className}. They cover <strong>{weighted}%</strong> of where B2+ words appear in the bank.</small>
                  </div>
                  <label className="bank-check"><input type="checkbox" checked={hideGiven} onChange={(e) => { setHideGiven(e.target.checked); setShown(PAGE); }} /> Hide words already given</label>
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="wb-q">Search</label>
                  <input id="wb-q" className="form-input" value={query} onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }} placeholder="Word or meaning" spellCheck={false} />
                </div>
                <div className="bank-group">
                  <span className="form-label">Level</span>
                  <div className="bank-chips">{LEVELS.map((l) => (
                    <button key={l} type="button" className={`chip${levels.has(l) ? ' is-selected' : ''}`} onClick={() => toggleIn(levels, setLevels, l)}>{l} <small>{counts[l]}</small></button>
                  ))}</div>
                </div>
                <div className="bank-group">
                  <span className="form-label">Found in</span>
                  {SOURCES.map((s) => {
                    const n = visible.filter((r) => (r.sources?.[s.key] || 0) >= minFreq).length;
                    return n ? (
                      <label key={s.key} className="bank-check"><input type="checkbox" checked={sources.has(s.key)} onChange={() => toggleIn(sources, setSources, s.key)} /> {s.label} <small>{n}</small></label>
                    ) : null;
                  })}
                </div>
                <div className="bank-group">
                  <span className="form-label">Type</span>
                  <Seg label="Type" value={kind} onChange={(v) => { setKind(v); setShown(PAGE); }} options={[
                    { value: 'all', label: 'All' }, { value: 'word', label: 'Words' }, { value: 'phrase', label: 'Phrasal verbs' },
                  ]} />
                </div>
                <div className="bank-group">
                  <label className="form-label" htmlFor="wb-freq">Appears in at least</label>
                  <select id="wb-freq" className="form-select" value={minFreq} onChange={(e) => { setMinFreq(Number(e.target.value)); setShown(PAGE); }}>
                    {[1, 2, 3, 5, 10, 20].map((n) => <option key={n} value={n}>{n} question{n === 1 ? '' : 's'}</option>)}
                  </select>
                </div>
                <div className="bank-group">
                  <label className="form-label" htmlFor="wb-sort">Sort</label>
                  <select id="wb-sort" className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="freq">Most frequent first</option><option value="level">Level (B2 first)</option><option value="az">A–Z</option>
                  </select>
                </div>
                <label className="bank-check bank-group"><input type="checkbox" checked={showHidden} onChange={(e) => { setShowHidden(e.target.checked); setShown(PAGE); }} /> Show hidden words only</label>
              </aside>

              <section className="bank-results">
                {error && <ErrorNote error={error} />}
                <div className="bank-bar">
                  <strong>{list.length} word{list.length === 1 ? '' : 's'}</strong>
                  <span className="bank-bar-spacer" />
                  <span className="bank-random">
                    <input className="form-input" type="number" min="1" max="100" value={batch} onChange={(e) => setBatch(e.target.value)} aria-label="How many" />
                    <button type="button" className="btn btn-sm" disabled={!list.length || showHidden}
                      onClick={() => setSelected((cur) => [...cur, ...list.filter((r) => !cur.includes(r.word)).slice(0, Number(batch) || 0).map((r) => r.word)])}>Select next</button>
                  </span>
                  {selected.length > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelected([])}>Clear ({selected.length})</button>}
                </div>
                {!list.length && <EmptyPanel icon="checkCircle" title={hideGiven && !showHidden ? 'Every word here has been given' : 'No words match'} lead={hideGiven && !showHidden ? 'Untick "Hide words already given" to see them again.' : 'Try other filters.'} />}
                <div className="bank-list">
                  {list.slice(0, shown).map((r) => {
                    const card = cardOf(r);
                    const sel = selected.includes(r.word);
                    return (
                      <article key={r.word} className={`card bank-row wb-row${sel ? ' is-selected' : ''}`}>
                        <div className="bank-row-head">
                          <input type="checkbox" checked={sel} disabled={showHidden} onChange={() => toggleWord(r.word)} aria-label={`Select ${r.word}`} />
                          <strong className="wb-word">{r.word}</strong>
                          <span className="wb-pos">{r.pos}</span>
                          <span className={`pill wb-level is-${r.level.toLowerCase()}`}>{r.level}</span>
                          {isGiven(r) && <span className="pill pill-success">Given</span>}
                          <span className="wb-freq" title={Object.entries(r.sources || {}).map(([k, n]) => `${SOURCE_SHORT[k] || k}: ${n}`).join(' · ')}>
                            in {freqIn(r)} {sources.size === 1 ? `${SOURCE_SHORT[[...sources][0]]} ` : ''}{freqIn(r) === 1 ? 'question' : 'questions'}
                          </span>
                          <button type="button" className="btn btn-ghost btn-sm wb-hide" onClick={() => setHidden(r, !isHidden(r))}
                            title={isHidden(r) ? 'Show this word again' : 'Hide this word for all teachers (e.g. a name or a word students know)'}>
                            <Icon name={isHidden(r) ? 'eye' : 'close'} size={13} /> {isHidden(r) ? 'Unhide' : 'Hide'}
                          </button>
                        </div>
                        {card?.b && <p className="wb-meaning">{card.b}</p>}
                        <Example ex={exampleOf(r)} />
                      </article>
                    );
                  })}
                </div>
                {list.length > shown && <button type="button" className="btn btn-block" onClick={() => setShown((n) => n + PAGE)}>Show more ({list.length - shown} left)</button>}
              </section>

              {chosen.length > 0 && (
                <div className="bank-dock">
                  {busy != null ? (
                    <span className="dx-progress" style={{ marginTop: 0 }}><span className="dx-spin" /> Writing meanings, examples and collocations… {Math.round(busy * 100)}%</span>
                  ) : (
                    <>
                      <span><strong>{chosen.length}</strong> selected · {chosen.filter((r) => cardOf(r)?.b).length} already enriched</span>
                      <button type="button" className="btn btn-primary" onClick={() => assign(chosen)}>
                        <Icon name="sparkle" size={16} /> Enrich &amp; assign
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        }}
      </Loaded>
    </>
  );
}
