#!/usr/bin/env python3
"""Complete named Pokémon concepts; no per-type, generation or property recipes."""
import collections,csv,gzip,hashlib,io,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data-snapshots/authored'
s=json.load(gzip.open(DATA/'sources/pokemon-whole-inventories.json.gz'))
spec=json.loads((DATA/'pokemon-inventory-specifications.json').read_text())['questions']
def norm(v):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',v).encode('ascii','ignore').decode().lower())
def rows(file):return list(csv.DictReader(io.StringIO(s['files'][file]['csv'])))
questions=[];checks=[]
for q in spec:
 base=q['table'];idkey=base+'_id';names={r[idkey]:r['name']for r in rows(base+'_names.csv')if r['local_language_id']=='9'}
 names.update(q.get('missingEnglish',{}));table={'move':'moves','ability':'abilities','item':'items','type':'types'}[base];items=rows(table+'.csv');canonical={};held=[]
 for item in items:
  itemid=item['id']
  if itemid in q.get('heldIds',{}):held.append({'id':itemid,'reason':q['heldIds'][itemid]});continue
  assert itemid in names,(q['key'],'missing English label',item)
  label=names[itemid];key=norm(label);p=canonical.setdefault(key,{'label':label,'aliases':set(),'sourceIds':[]});p['sourceIds'].append(itemid)
 for row in q.get('supplement',[]):
  key=norm(row['label']);v=canonical.setdefault(key,{'label':row['label'],'aliases':set(),'sourceIds':[]});v['aliases'].update(row.get('aliases',[]));v['sourceIds'].append(row['evidence'])
 for label,aliases in q.get('aliases',{}).items():
  assert norm(label)in canonical,(q['key'],'alias target missing',label)
  canonical[norm(label)]['aliases'].update(aliases)
 if base=='type':
  for p in canonical.values():p['aliases'].add(p['label']+' type')
 exact={key:key for key in canonical}
 for key,p in canonical.items():
  for alias in p['aliases']:
   k=norm(alias);assert k not in exact or exact[k]==key,(q['key'],'ambiguous alias',alias)
   exact[k]=key
 missing=[n for n in q['familiar']if norm(n)not in exact];assert not missing,(q['key'],'missing independently specified familiar answer',missing)
 assert not[n for n in q['exclude']if norm(n)in exact],q['key']
 rare=norm(q['rare']);assert rare in canonical,(q['key'],'missing rare anchor',q['rare'])
 known={exact[norm(n)]for n in q['familiar']};low={exact[norm(n)]for n in q['familiar'][:6]};assert rare not in known
 tiers=collections.defaultdict(list)
 for key,p in sorted(canonical.items()):
  points=10 if key in low else 30 if key in known else 100 if key==rare else 85
  tiers[str(points)].append({'label':p['label'],'aliases':sorted(a for a in p['aliases']if norm(a)!=key)})
 refs=[*(r['evidence']for r in q.get('supplement',[])),'https://pokeapi.co/docs/v2','https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv']
 refs.extend(s['files'][f]['url']for f in [table+'.csv',base+'_names.csv'])
 questions.append(dict(id='authored-'+q['key'],concept=q['key'],family='gaming',topic='POKÉMON',prompt=q['prompt'],scope=q['scope'],format='whole-game-concept',rationale='One whole independently chosen recognizable game concept. The full source IDs and official English names are reconciled, duplicate version labels share identity and historical public names are explicit. Types, generations, power and item properties never create extra questions.',familiar=q['familiar'],exclude=q['exclude'],references=refs,answers=dict(tiers),naturalFinite=q.get('naturalFinite',False)))
 checks.append({'id':'authored-'+q['key'],'sourceRows':len(items),'held':held,'canonicalAnswers':len(canonical),'independentInputs':len(q['familiar']),'rareAnchor':q['rare'],'sourceIdsByCanonicalName':{p['label']:p['sourceIds']for p in canonical.values()}})
files={DATA/'batches/24-pokemon-whole-concepts.json':json.dumps({'version':1,'questions':questions},ensure_ascii=False,separators=(',',':'))+'\n',DATA/'pokemon-inventory-checks.json':json.dumps(checks,ensure_ascii=False,indent=2)+'\n'}
for p,t in files.items():
 if '--check'in sys.argv:assert p.read_text()==t,p
 else:p.write_text(t)
print([(c['id'],c['canonicalAnswers'])for c in checks])
