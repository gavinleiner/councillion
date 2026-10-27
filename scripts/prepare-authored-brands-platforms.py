"""Reconcile two whole familiar subjects, with explicit source and identity review.

Table rows, portfolio sections, countries and historic brand names never become
additional prompts. Admission remains separate in reviewed-standard/admission.
"""
import collections,gzip,json,pathlib,re,sys,unicodedata
R=pathlib.Path(__file__).resolve().parents[1];D=R/'data-snapshots/authored'
spec=json.loads((D/'brands-platforms-specifications.json').read_text())['questions']
policies=json.loads((D/'brands-platforms-review-policies.json').read_text())
sources=json.load(gzip.open(D/'sources/brands-platforms-list-sources.json.gz'))['data']
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def emit(path,value):
 text=json.dumps(value,ensure_ascii=False,indent=2)+'\n'
 if '--check'in sys.argv:assert path.read_text()==text,path
 else:path.write_text(text)
questions=[];ledgers={}
for q in spec:
 key=q['key'];policy=policies[key];raw=list(sources[key]['rows']);names={};held=[]
 for url,labels in policy['sourceSupplements'].items():
  raw.extend(dict(name=s,origin=url,field='explicit-reviewed-name-supplement')for s in labels.split('|'))
 for r in raw:
  old=r['name']
  if old in policy['holds']:
   held.append(dict(row=r,reason=policy['holds'][old]));continue
  label=policy['renameRepairs'].get(old,old);n=norm(label)
  assert n and not any(c in label for c in ['†','【','】','http://','https://']),(key,label)
  p=names.setdefault(n,dict(label=label,aliases=set(),origins=[]));p['origins'].append(r)
 for canonical,aliases in policy['aliasMerges'].items():
  hits=[names[norm(s)]for s in [canonical,*aliases]if norm(s)in names]
  hits=list({id(v):v for v in hits}.values())
  if not hits:continue
  p=dict(label=canonical,aliases=set(),origins=[])
  for hit in hits:
   p['origins']+=hit['origins'];p['aliases'].update([hit['label'],*hit['aliases']]);names.pop(norm(hit['label']),None)
  p['aliases'].update(aliases);p['aliases'].discard(canonical);names[norm(canonical)]=p
 owners={n:n for n in names}
 for n,p in names.items():
  p['aliases']={a for a in p['aliases']if norm(a)!=n}
  for a in p['aliases']:
   z=norm(a);assert z and(z not in owners or owners[z]==n),(key,'alias conflict',a);owners[z]=n
 missing=[s for s in q['familiar']if norm(s)not in owners];assert not missing,(key,missing)
 assert not[s for s in q['exclude']if norm(s)in owners],key
 familiar={owners[norm(s)]for s in q['familiar']};entry={owners[norm(s)]for s in q['familiar'][:6]};rare=owners[norm(q['rare'])]
 assert rare not in familiar,(key,'rare anchor is not rare')
 tiers=collections.defaultdict(list)
 for n,p in sorted(names.items()):
  points=10 if n in entry else 30 if n in familiar else 100 if n==rare else 60 if len(p['label'])<=20 else 85
  tiers[str(points)].append(dict(label=p['label'],aliases=sorted(p['aliases'])))
 questions.append(dict(id='authored-'+key,concept=key,family=q['family'],topic='HOTELS AND TRAVEL'if key=='hotel-brands'else'SOCIAL AND COMMUNITY PLATFORMS',prompt=q['prompt'],scope=q['scope'],format='whole-familiar-brands-platforms',rationale='One independently chosen recognizable whole subject. Complete retained public list sections and primary portfolios are reconciled with explicit heading/scope holds, historical continuity and actual public names. Invented initials, country slices and source headings never add answers or questions.',familiar=q['familiar'],exclude=q['exclude'],references=q['references'],answers=dict(tiers)))
 ledgers[key]=dict(sourceRows=len(raw),held=held,canonicalAnswers=len(names),independentFamiliarInputs=len(q['familiar']),canonicalSourceMap={p['label']:p['origins']for p in names.values()},publicAliases={p['label']:sorted(p['aliases'])for p in names.values()if p['aliases']})
emit(D/'batches/30-brands-platforms.json',dict(version=1,questions=questions))
emit(D/'brands-platforms-review-ledger.json',ledgers)
print([(q['id'],sum(map(len,q['answers'].values())))for q in questions])
