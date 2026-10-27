"""Reconcile two whole subjects; inventory rows, regions and models are not prompts."""
import collections,gzip,json,pathlib,re,sys,unicodedata
R=pathlib.Path(__file__).resolve().parents[1];D=R/'data-snapshots/authored'
policies=json.loads((D/'vehicle-console-review-policies.json').read_text())
source=json.load(gzip.open(D/'sources/vehicle-console-list-sources.json.gz'))['data']['questions']
assert [p['question']for p in policies.values()]==json.loads((D/'vehicle-console-specifications.json').read_text())['questions']
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def emit(path,value):
 text=json.dumps(value,ensure_ascii=False,indent=2)+'\n'
 if '--check'in sys.argv:assert path.read_text()==text,path
 else:path.write_text(text)
questions=[];ledgers={}
for key,policy in policies.items():
 q=policy['question'];names={};held=[];rows=list(source[key]);publicFirstGen=collections.defaultdict(set)
 for url,labels in policy['sourceSupplements'].items():rows.extend(dict(name=s,origin=url,role='explicit-name-supplement')for s in labels.split('|'))
 for r in rows:
  old=r['name']
  if old in policy['holds']:held.append(dict(row=r,reason=policy['holds'][old]));continue
  labels=policy.get('splitRows',{}).get(old,[policy['renameRepairs'].get(old,old)])
  for label in labels:
   raw_label=label
   if r['role']=='first-generation-released-system':
    maker={'Atari, Inc.':'Atari','Koninklijke Philips NV':'Philips','Coleco Industries, Inc.':'Coleco','APF Electronics, Inc.':'APF','Nintendo Co., Ltd.':'Nintendo','Universal Research Laboratories, Inc.':'Universal Research Laboratories'}.get(r['manufacturer'],r['manufacturer'])
    label=raw_label if norm(raw_label).startswith(norm(maker))else maker+' '+raw_label
    publicFirstGen[raw_label].add(norm(label))
   n=norm(label);assert n and len(label)<180 and not any(c in label for c in ['【','】','†','~~']),(key,label)
   p=names.setdefault(n,dict(label=label,aliases=set(),origins=[]));p['origins'].append(r);p['aliases'].update(r.get('aliases',[]))
 if key=='game-console-models':
  generic=re.compile(r'^(?:tv|video|colour|color|electronic|computer|sports?|super|home|programmable|multi|television|console|game|games|system|digital|tele|tennis|and|\s|[-/])+$',re.I)
  for label,owners in publicFirstGen.items():
   if len(owners)!=1 or generic.fullmatch(label)or norm(label)in names:continue
   names[next(iter(owners))]['aliases'].add(label)
 for canonical,aliases in policy['aliasMerges'].items():
  hits=list({id(names[norm(s)]):names[norm(s)]for s in [canonical,*aliases]if norm(s)in names}.values())
  if not hits:continue
  p=dict(label=canonical,aliases=set(),origins=[])
  for hit in hits:
   p['origins']+=hit['origins'];p['aliases'].update([hit['label'],*hit['aliases']]);names.pop(norm(hit['label']),None)
  p['aliases'].update(aliases);p['aliases'].discard(canonical);names[norm(canonical)]=p
 owners={n:n for n in names};aliasConflicts=[]
 for n,p in names.items():
  p['aliases']={a for a in p['aliases']if norm(a)and norm(a)!=n}
  for a in sorted(p['aliases']):
   z=norm(a)
   if z in owners and owners[z]!=n:
    p['aliases'].remove(a);aliasConflicts.append(dict(alias=a,heldOwner=p['label'],owner=names[owners[z]]['label']));continue
   owners[z]=n
 assert not[s for s in q['familiar']if norm(s)not in owners],key
 assert not[s for s in q['exclude']if norm(s)in owners],key
 entry={owners[norm(s)]for s in policy['entry']};familiar={owners[norm(s)]for s in q['familiar']};moderate={owners[norm(s)]for s in policy['moderate']};rare=owners[norm(policy['rare'])]
 assert rare not in familiar and rare not in entry,key
 tiers=collections.defaultdict(list)
 for n,p in sorted(names.items()):
  points=10 if n in entry else 30 if n in familiar else 100 if n==rare else 60 if n in moderate else 85
  tiers[str(points)].append(dict(label=p['label'],aliases=sorted(p['aliases'])))
 questions.append(dict(id='authored-'+key,concept=key,family=q['family'],topic='VEHICLE MAKERS'if key=='motor-vehicle-brands'else'GAMING HARDWARE',prompt=q['prompt'],scope=q['scope'],format='whole-vehicle-makers'if key=='motor-vehicle-brands'else'whole-gaming-hardware',rationale='One independently chosen familiar whole subject. Complete retained source sections expand its answer inventory. Named identity, actual public aliases, source continuations, generic descriptors and release boundaries are explicitly reconciled. Country, year, model, tag or source-row slices do not create additional prompts.',familiar=q['familiar'],exclude=q['exclude'],references=q['references'],answers=dict(tiers)))
 ledgers[key]=dict(sourceRows=len(rows),canonicalAnswers=len(names),independentFamiliarInputs=len(q['familiar']),held=held,aliasOwnerDecisions=aliasConflicts,canonicalSourceMap={p['label']:p['origins']for p in names.values()},publicAliases={p['label']:sorted(p['aliases'])for p in names.values()if p['aliases']})
emit(D/'batches/31-vehicle-console.json',dict(version=1,questions=questions));emit(D/'vehicle-console-review-ledger.json',ledgers)
print([(q['id'],sum(map(len,q['answers'].values())))for q in questions])
