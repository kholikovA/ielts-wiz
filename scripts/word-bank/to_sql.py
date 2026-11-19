"""Turn extract.py's JSON into SQL that upserts public.bank_words.

Re-running keeps each word's cached AI card and hidden flag; words no longer
found in the bank are set to freq 0 (kept, so their cards aren't lost).

    python to_sql.py out.json > load.sql
"""
import json
import sys


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


def main(path):
    rows = json.load(open(path, encoding='utf-8'))
    print('begin;')
    print('create temp table _bw (like public.bank_words including defaults) on commit drop;')
    for r in rows:
        examples = [{'s': e['s'], 'src': e['src'], 'w': e['w']} for e in r['examples']]
        forms = 'array[' + ','.join(q(f) for f in r['forms']) + ']::text[]' if r['forms'] else "'{}'::text[]"
        print('insert into _bw (word, kind, level, pos, freq, sources, forms, examples, zipf) values ('
              f"{q(r['word'])}, {q(r['kind'])}, {q(r['level'])}, {q(r['pos'])}, {int(r['freq'])}, "
              f"{q(json.dumps(r['sources']))}::jsonb, {forms}, {q(json.dumps(examples, ensure_ascii=False))}::jsonb, {r['zipf']});")
    print('''insert into public.bank_words (word, kind, level, pos, freq, sources, forms, examples, zipf, updated_at)
select word, kind, level, pos, freq, sources, forms, examples, zipf, now() from _bw
on conflict (word) do update set kind = excluded.kind, level = excluded.level, pos = excluded.pos, freq = excluded.freq,
  sources = excluded.sources, forms = excluded.forms, examples = excluded.examples, zipf = excluded.zipf, updated_at = now();
update public.bank_words b set freq = 0, sources = '{}'::jsonb, updated_at = now()
 where not exists (select 1 from _bw where _bw.word = b.word) and b.freq <> 0;
select count(*) as words from public.bank_words where freq > 0;
commit;''')


if __name__ == '__main__':
    main(sys.argv[1])
