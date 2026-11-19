# Question bank → Words

`bank_words` lists every B2+ word and idiomatic phrasal verb that students meet in
the question bank (SAT questions and IELTS bank tests). Teachers assign them from
Teaching → Question bank → Words as flashcards (AI-enriched) plus "Use it".

Re-run after importing new questions. Cached AI cards and hidden flags are kept.

```sh
DB="docker exec -i supabase-db-1buwthblm3xjdr80kj6einmo psql -U supabase_admin -d postgres -At"
ssh root@194.163.149.123 "$DB" <<< "select json_build_object('id',id,'test',test,'content',content) from sat_questions;" > sat.jsonl
ssh root@194.163.149.123 "$DB" <<< "select json_build_object('id',id,'skill',skill,'spec',spec) from ielts_tests;" > ielts.jsonl

python3 -m venv venv && venv/bin/pip install "spacy==3.7.5" wordfreq lemminflect
venv/bin/python -m spacy download en_core_web_sm
mkdir -p lists && (cd lists &&
  curl -sSLO https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv &&
  curl -sSLO https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/octanove-vocabulary-profile-c1c2-1.0.csv)

venv/bin/python -I extract.py sat.jsonl ielts.jsonl lists out.json   # also writes out.names.json (skipped names)
venv/bin/python -I to_sql.py out.json | ssh root@194.163.149.123 "$DB"
```

Word lists: CEFR-J Vocabulary Profile 1.5 (Tono Laboratory, TUFS) and Octanove
Vocabulary Profile C1/C2 1.0 (CC BY-SA 4.0), via openlanguageprofiles/olp-en-cefrj.
