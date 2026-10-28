#!/usr/bin/env python3
"""Whole computer-language, astronaut and space-agency factual name lists."""
import collections,gzip,json,pathlib,re,sys,unicodedata
D=pathlib.Path(__file__).resolve().parents[1]/'data-snapshots/authored';s=json.load(gzip.open(D/'sources/computer-space-whole-lists.json.gz'));spec=json.load(open(D/'computer-space-specifications.json'))['questions']
def norm(x):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',x).encode('ascii','ignore').decode().lower())
qs=[];checks=[];issues=[]
for q in spec:
 names={}
 def add(name,aliases):
  n=norm(name)
  if not n:return
  p=names.setdefault(n,{'label':name,'aliases':set()});p['aliases'].update(a for a in aliases if norm(a)and norm(a)!=n)
 for p in s['groups'][q['key']]:
  if p['name']in q['holds']:continue
  name=q.get('renames',{}).get(p['name'],p['name']);aliases=[a for a in p['aliases']if a not in q.get('aliasHolds',{}).get(p['name'],[])]
  if q['key']=='astronauts-cosmonauts':
   tokens=re.sub(r'\s+(?:Jr\.?|Sr\.?|II|III|IV)$','',name).split()
   if len(tokens)>2 and not re.fullmatch('[A-Z]\\.?',tokens[0]):aliases.append(tokens[0]+' '+tokens[-1])
  if q['key']=='government-space-agencies':
   aliases=[a for v in aliases for a in re.split(r'\s+or\s+|\s+',v)if norm(a)]
  add(name,aliases)
 for p in q['additions']:add(p['label'],p.get('aliases',[]))
 for canonical,aliases in q['aliases'].items():
  key=norm(canonical)
  if key not in names:issues.append([q['key'],'Unknown explicit alias owner',canonical]);continue
  for a in aliases:
   k=norm(a);other=names.get(k)
   if other is not None and k!=key:names[key]['aliases'].update([other['label'],*other['aliases']]);del names[k]
   if k!=key:names[key]['aliases'].add(a)
 owners=collections.defaultdict(set)
 for k,p in names.items():
  for a in p['aliases']:
   if norm(a)not in names:owners[norm(a)].add(k)
 chosen={a:min(v)for a,v in owners.items()}
 for a,canonical in q.get('preferredAliases',{}).items():
  k=norm(canonical)
  assert k in names and k in owners[norm(a)],(q['key'],'Explicit preferred alias must be source-supported',a)
  chosen[norm(a)]=k
 exact={**{k:k for k in names},**chosen};missing=[n for n in q['familiar']if norm(n)not in exact];bad=[n for n in q['exclude']if norm(n)in exact]
 if missing:issues.append([q['key'],'Missing familiar names',missing])
 if bad:issues.append([q['key'],'Wrong categories present',bad])
 if missing or bad:continue
 rare=norm(q['rare']);assert rare in names,(q['key'],'Missing rare anchor',q['rare']);common={exact[norm(n)]for n in q['familiar']};low={exact[norm(n)]for n in q['familiar'][:6]};tiers=collections.defaultdict(list)
 for k,p in sorted(names.items()):
  tier=100 if k==rare else 10 if k in low else 30 if k in common else 60 if len(p['label'])<25 else 85
  tiers[str(tier)].append({'label':p['label'],'aliases':sorted(a for a in p['aliases']if norm(a)!=k and chosen.get(norm(a))==k)})
 qs.append(dict(id='authored-'+q['key'],concept=q['key'],family='science',topic='COMPUTERS AND SPACE',prompt=q['prompt'],scope=q['scope'],format='whole-concept',rationale='One complete recognizable subject, with actual names, independent familiar-input cases and explicit wrong-category exclusions. Source inventory records, acronym translations and list subsections do not add questions.',familiar=q['familiar'],exclude=q['exclude'],references=q['references'],answers=dict(tiers)))
 checks.append({'id':'authored-'+q['key'],'sourceRows':len(s['groups'][q['key']]),'heldRows':len(q['holds']),'canonicalAnswers':len(names),'familiarInputs':len(q['familiar'])})
if '--audit'in sys.argv:
 print(json.dumps(issues,ensure_ascii=False,indent=2));sys.exit()
assert not issues,issues
for p,t in {D/'batches/21-computer-space.json':json.dumps({'version':1,'questions':qs},ensure_ascii=False,separators=(',',':'))+'\n',D/'computer-space-checks.json':json.dumps(checks,ensure_ascii=False,indent=2)+'\n'}.items():
 if '--check'in sys.argv:assert p.read_text()==t,p
 else:p.write_text(t)
print(checks)
