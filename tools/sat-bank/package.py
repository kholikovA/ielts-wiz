# Build the import package: <out>/bank.json (rows for sat_questions) + <out>/img/*.png
import os, json, os, shutil, sys
S = os.environ['SAT_WORK']
out = sys.argv[1]
bank = json.load(open(f'{S}/bank/bank.json')); keys = json.load(open(f'{S}/bank/keys.json'))
NOTES = {
  'bf5f80c6': 'Note: the official explanation says "Choice D is correct", but its own working shows the answer is A.',
  '1e11190a': 'Note: the official explanation says "Choice C is correct", but its working gives 5 pints of blackberries, which is choice B.',
}
rows = []
for q in bank:
    content = {k: q[k] for k in ('prompt', 'prompt_img', 'options') if k in q}
    key = dict(keys[q['id']])
    if q['id'] in NOTES: key['note'] = NOTES[q['id']]
    rows.append({'id': q['id'], 'test': q['test'], 'domain': q['domain'], 'skill': q['skill'], 'difficulty': q['difficulty'],
                 'type': q['type'], 'content': content, 'key': key, 'source': os.environ.get('SAT_SOURCE', 'College Board question bank export')})
os.makedirs(out, exist_ok=True)
json.dump({'version': 1, 'questions': rows}, open(f'{out}/bank.json', 'w'), separators=(',', ':'), ensure_ascii=False)
if os.path.exists(f'{out}/img'): shutil.rmtree(f'{out}/img')
shutil.copytree(f'{S}/bank/img', f'{out}/img')
print(len(rows), 'questions,', len(os.listdir(f'{out}/img')), 'images')
