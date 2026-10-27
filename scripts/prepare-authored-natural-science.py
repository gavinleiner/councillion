#!/usr/bin/env python3
"""Whole nature and academic subjects, reconciled by actual sense and public name."""
import collections,gzip,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data-snapshots/authored'
sources=json.load(gzip.open(DATA/'sources/natural-science-wordnet.json.gz'))['categories']
spec=json.loads((DATA/'natural-science-specifications.json').read_text())['questions']
supplemental={}
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def display(s):return s[0].upper()+s[1:]
questions=[];checks=[];holds={};issues=[]
for q in spec:
 k=q['key'];names={};held=[]
 def insert(label,aliases,origin):
  key=norm(label);p=names.setdefault(key,{'label':display(label),'aliases':set(),'origins':[]});p['origins'].append(origin)
  p['aliases'].update(a for a in aliases if norm(a)!=key)
 for row in sources[k]['items']:
  name=row['name']
  if row['synset'] in q['synsetHolds'] or name in q['holds']:
   held.append({'name':name,'synset':row['synset'],'reason':q['synsetHolds'].get(row['synset'],q['holds'].get(name))});continue
  label=q['synsetRenames'].get(row['synset'],q['renames'].get(name,name));aliases=[a for a in row['aliases']if a not in q['aliasHolds'].get(name,[])]
  if label!=name and name not in q.get('omitOriginalAliases',[]):aliases.append(name)
  insert(label,aliases,{'synset':row['synset']})
 for label in supplemental.get(k,{}).get('names',[]):
  if label in q['holds']:continue
  insert(q['renames'].get(label,label),[],{'supplementalList':True})
 for row in q['additions']:insert(row['label'],row['aliases'],{'editorialAddition':True})
 # Canonical identity always protects an exact name. Synonyms merge identities
 # only when explicitly declared in authoring inputs (not by token overlap).
 for row in q.get('merges',[]):
  target,old=norm(row['into']),norm(row['from'])
  assert target in names,(k,'missing merge target',row)
  if old==target or old not in names:continue
  v=names.pop(old);names[target]['aliases'].add(v['label']);names[target]['aliases'].update(v['aliases']);names[target]['origins'].extend(v['origins'])
 for p in names.values():p['aliases']={a for a in p['aliases']if norm(a)not in names}
 owners=collections.defaultdict(set)
 for key,p in names.items():
  for a in p['aliases']:owners[norm(a)].add(key)
 conflicts={a:sorted(v)for a,v in owners.items()if len(v)>1}

 overrides={norm(a):norm(b) for a,b in q.get('aliasOwners',{}).items()}
 unresolved={a:sorted(v) for a,v in conflicts.items() if a not in overrides}
 if unresolved:issues.append((k,'ambiguous source alias',unresolved))
 exact={key:key for key in names}
 for a,v in owners.items():
  if a in overrides:
   assert overrides[a]in v,(k,'alias override not supported by source',a,v);exact[a]=overrides[a]
  elif len(v)==1:exact[a]=next(iter(v))
 for key,p in names.items():p['aliases']={a for a in p['aliases'] if exact.get(norm(a))==key}
 missing=[v for v in q['familiar']if norm(v)not in exact]
 if missing:issues.append((k,'missing independent familiar input',missing));continue
 assert not[v for v in q['exclude']if norm(v)in exact],(k,'negative boundary is present')
 common={exact[norm(v)]for v in q['familiar']};low={exact[norm(v)]for v in q['familiar'][:6]}
 # Points are explicitly editorial, not claimed player-frequency measurements.
 rare_candidates=[key for key in names if key not in common];rare=exact.get(norm(q['rare']))if q.get('rare')else None
 assert rare in names and rare not in common,(k,'rare anchor must be explicitly reviewed',q.get('rare'))
 tiers=collections.defaultdict(list)
 for key,p in sorted(names.items()):
  tier=10 if key in low else 30 if key in common else 100 if key==rare else 60 if p['origins'][-1].get('editorialAddition')else 85
  tiers[str(tier)].append({'label':p['label'],'aliases':sorted(p['aliases'])})
 questions.append(dict(id='authored-'+k,concept=k,family=q['family'],topic='ANIMALS AND ACADEMIC FIELDS',prompt=q['prompt'],scope=q['scope'],format='whole-natural-science-concept',rationale='One independently chosen, recognizable whole category. Full source descendants are reconciled by word sense; explicit holds remove content, components, fantasy individuals and misleading taxonomy entries. Modern common answers and actual public synonyms fill dictionary omissions. No property joins, object-use combinations or source subsections create extra questions.',familiar=q['familiar'],exclude=q['exclude'],references=q['references'],answers=dict(tiers)))
 checks.append({'id':'authored-'+k,'root':q['root'],'sourceVersion':sources[k]['version'],'sourceRows':len(sources[k]['items']),'heldRows':len(held),'canonicalAnswers':len(names),'familiarInputs':len(q['familiar']),'rareAnchor':names[rare]['label']});holds[k]={'rows':held,'aliasHolds':q['aliasHolds']}
assert not issues,issues
files={DATA/'batches/27-natural-science.json':json.dumps({'version':1,'questions':questions},ensure_ascii=False,separators=(',',':'))+'\n',DATA/'natural-science-checks.json':json.dumps(checks,ensure_ascii=False,indent=2)+'\n',DATA/'natural-science-holds.json':json.dumps(holds,ensure_ascii=False,indent=2)+'\n'}
for p,t in files.items():
 if '--check'in sys.argv:assert p.read_text()==t,p
 else:p.write_text(t)
print([(x['id'],x['canonicalAnswers'])for x in checks])
