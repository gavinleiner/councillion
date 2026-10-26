#!/usr/bin/env python3
"""Character lists retain the whole named franchise, never per-film variants."""
import collections,gzip,json,pathlib,re,sys,unicodedata
D=pathlib.Path(__file__).resolve().parents[1]/'data-snapshots/authored';s=json.load(gzip.open(D/'sources/friendly-culture-names.json.gz'));spec=json.load(open(D/'friendly-culture-specifications.json'))['questions']
def norm(v):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',v).encode('ascii','ignore').decode().lower())
qs=[];checks=[];issues=[]
for q in spec:
 names={}
 def add(name,aliases=()):
  n=norm(name)
  if not n:return
  p=names.setdefault(n,{'label':name,'aliases':set()});p['aliases'].update(a for a in aliases if norm(a)and norm(a)!=n)
 for row in s['groups'][q['key']]:
  if row['name']in q['holds']:continue
  add(q['renames'].get(row['name'],row['name']),row['aliases'])
 for p in q['additions']:add(p['label'],p.get('aliases',[]))
 for canonical,aliases in q['aliases'].items():
  n=norm(canonical);assert n in names,(q['key'],'Unknown explicit alias owner',canonical)
  for alias in aliases:
   k=norm(alias);other=names.get(k)
   if other and k!=n:names[n]['aliases'].update([other['label'],*other['aliases']]);del names[k]
   if n!=k:names[n]['aliases'].add(alias)
 owners=collections.defaultdict(set)
 for n,p in names.items():
  for a in p['aliases']:
   if norm(a)not in names:owners[norm(a)].add(n)
 chosen={a:min(v)for a,v in owners.items()};exact={**{n:n for n in names},**chosen};missing=[n for n in q['familiar']if norm(n)not in exact];bad=[n for n in q['exclude']if norm(n)in exact]
 if missing or bad:issues.append({'key':q['key'],'missing':missing,'wrong':bad});continue
 rare=norm(q['rare']);assert rare in names,(q['key'],'Rare anchor absent');low={exact[norm(n)]for n in q['familiar'][:6]};common={exact[norm(n)]for n in q['familiar']};tiers=collections.defaultdict(list)
 for n,p in sorted(names.items()):
  tier=100 if n==rare else 10 if n in low else 30 if n in common else 60 if len(p['label'])<24 else 85
  tiers[str(tier)].append({'label':p['label'],'aliases':sorted(a for a in p['aliases']if norm(a)!=n and chosen.get(norm(a))==n)})
 qs.append(dict(id='authored-'+q['key'],concept=q['key'],family='culture',topic='CHARACTER ROLL CALL',prompt=q['prompt'],scope=q['scope'],format='whole-franchise-characters',rationale='A whole recognizable fictional world, with common entry characters and its retained full named source lists. Canonical public names, nicknames and personas share the supported identity. Film, episode, season, surname and source-section variants do not create extra questions.',familiar=q['familiar'],exclude=q['exclude'],references=q['references'],answers=dict(tiers)))
 checks.append({'id':'authored-'+q['key'],'canonicalNames':len(names),'rawSourceFields':len(s['groups'][q['key']]),'familiarInputs':len(q['familiar']),'explicitHeldNames':len(q['holds'])})
if '--audit'in sys.argv:print(json.dumps(issues,ensure_ascii=False,indent=2));sys.exit()
assert not issues,issues
for p,t in {D/'batches/22-friendly-culture.json':json.dumps({'version':1,'questions':qs},ensure_ascii=False,separators=(',',':'))+'\n',D/'friendly-culture-checks.json':json.dumps(checks,ensure_ascii=False,indent=2)+'\n'}.items():
 if '--check'in sys.argv:assert p.read_text()==t,p
 else:p.write_text(t)
print(checks)
