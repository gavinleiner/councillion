#!/usr/bin/env python3
"""Complete eligible bird families plus documented domestic breeds: six questions."""
import collections,gzip,json,pathlib,re,sys,unicodedata
D=pathlib.Path(__file__).resolve().parents[1]/'data-snapshots/authored'
s=json.load(gzip.open(D/'sources/familiar-bird-families.json.gz'));spec=json.load(open(D/'bird-family-specifications.json'))['questions']
def norm(x):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',x).encode('ascii','ignore').decode().lower())
qs=[];checks=[]
for q in spec:
 names={};scientific={}
 def add(name,aliases=()):
  n=norm(name)
  if not n:return
  owner=names.setdefault(n,{'label':name,'aliases':set()});owner['aliases'].update(a for a in aliases if norm(a)!=n)
 for p in s['groups'][q['key']]['species']:add(p['name'],[p['scientific']]);scientific[norm(p['scientific'])]=norm(p['name'])
 if q['family']=='Anatidae':
  for p in s['domesticBreeds']:add(p['name'],p['aliases'])
 for v in q['groups']:name,*aliases=v.split('~');add(name,aliases)
 for canonical,aliases in q['aliases'].items():
  n=norm(canonical)
  assert n in names,(q['key'],'Unknown explicit alias owner',canonical)
  for a in aliases:
   k=norm(a);other=names.get(k)
   if other is not None and k!=n:
    names[n]['aliases'].update([other['label'],*other['aliases']]);del names[k]
   if n!=k:names[n]['aliases'].add(a)
 owners=collections.defaultdict(set)
 for k,p in names.items():
  for a in p['aliases']:
   if norm(a)not in names:owners[norm(a)].add(k)
 chosen={a:min(v)for a,v in owners.items()};exact={**{k:k for k in names},**chosen}
 missing=[n for n in q['familiar']if norm(n)not in exact]
 if missing:print('MISSING',q['key'],missing)
 if '--audit'in sys.argv:continue
 assert not missing,(q['key'],missing)
 assert not[n for n in q['exclude']if norm(n)in exact],q['key']
 common={exact[norm(n)]for n in q['familiar']};low={exact[norm(n)]for n in q['familiar'][:6]};rare=norm(q['rare']);assert rare in names and rare not in common,(q['key'],'Missing reviewed rare anchor',q['rare']);tiers=collections.defaultdict(list)
 for k,p in sorted(names.items()):
  points=100 if k==rare else 10 if k in low else 30 if k in common else 60 if len(p['label'])<25 else 85
  tiers[str(points)].append({'label':p['label'],'aliases':sorted(a for a in p['aliases']if norm(a)!=k and chosen.get(norm(a))==k)})
 qs.append({'id':'authored-'+q['key'],'concept':q['key'],'family':'nature','topic':'BIRD FAMILIES','prompt':q['prompt'],'scope':q['scope'],'format':'whole-taxonomic-group','rationale':'An independently recognizable whole bird group, with the complete publisher family species list and explicit public-name and breed reconciliation. Species, synonyms, domestic breeds and source sublists are answers in one question, never extra questions.','familiar':q['familiar'],'exclude':q['exclude'],'references':q['references'],'answers':dict(tiers)})
 checks.append({'id':'authored-'+q['key'],'sourceSpecies':len(s['groups'][q['key']]['species']),'canonicalNames':len(names),'independentFamiliarInputs':len(q['familiar']),'sourceSha256':s['rawResponseSha256']})
if '--audit'in sys.argv:sys.exit()
for p,t in {D/'batches/20-bird-families.json':json.dumps({'version':1,'questions':qs},ensure_ascii=False,separators=(',',':'))+'\n',D/'bird-family-checks.json':json.dumps(checks,ensure_ascii=False,indent=2)+'\n'}.items():
 if '--check'in sys.argv:assert p.read_text()==t,p
 else:p.write_text(t)
print(checks)
