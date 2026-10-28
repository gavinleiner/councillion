#!/usr/bin/env python3
"""Whole recognizable mammal groups from the complete ASM species inventory."""
import collections,gzip,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data-snapshots/authored'
src=json.load(gzip.open(DATA/'sources/mdd-2.5-species.json.gz'))
spec=json.loads((DATA/'mammal-concept-specifications.json').read_text())['questions']
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
current={norm(p['sciName'].replace('_',' ')):p['id']for p in src['species']}
questions=[];checks=[];issues=[];held={}
for q in spec:
 k=q['key'];records=[p for p in src['species']if p['family']in q['families']or p['infraorder']in q['infraorders']]
 if k in ['wild-cat-kinds','wild-canid-kinds']:records=[p for p in records if p['domestic']!='1']
 names={};holds=[]
 for p in records:
  label=p['mainCommonName'];n=norm(label);assert n not in names,(k,'duplicate current common name',label)
  aliases=[p['sciName'].replace('_',' '),*p['otherCommonNames'].split('|')]
  for f in ['originalNameCombination','CMW_sciName','MSW3_sciName']:
   a=p.get(f,'').replace('_',' ').strip()
   if re.fullmatch(r'[A-Z][A-Za-z]+ [a-z]+(?: [a-z]+)?',a):aliases.append(a)
  clean=set()
  for a in aliases:
   if not a or a=='NA':continue
   if norm(a)in current and current[norm(a)]!=p['id']:
    holds.append({'species':p['id'],'alias':a,'reason':'This is the accepted name of another current species; current ownership takes priority.'});continue
   clean.add(a)
  names[n]={'label':label,'id':p['id'],'aliases':clean}
 for canonical,aliases in q['aliases'].items():
  assert norm(canonical)in names,(k,'unknown explicit alias owner',canonical)
  names[norm(canonical)]['aliases'].update(aliases)
 for item in q['groups']:
  label,*aliases=item.split('~');found={n for n,p in names.items()if norm(label)==n or any(norm(label)==norm(a)for a in p['aliases'])}
  if found:
   if len(found)>1:
    preferred=next((norm(b)for a,b in q['aliasOwners'].items()if norm(a)==norm(label)),None)
    assert preferred in found,(k,'group ambiguous with source name',label,found)
    found={preferred}
   names[next(iter(found))]['aliases'].update(aliases)
  else:names[norm(label)]={'label':label,'id':None,'aliases':set(aliases)}
 exact={n:n for n in names};owners=collections.defaultdict(set)
 for n,p in names.items():
  for a in p['aliases']:
   if norm(a)not in names:owners[norm(a)].add(n)
 ambiguous={}
 overrides={norm(a):norm(b)for a,b in q['aliasOwners'].items()}
 for a,options in owners.items():
  if a in overrides:assert overrides[a]in options,(k,'explicit alias owner not among source owners',a);exact[a]=overrides[a]
  elif len(options)==1:exact[a]=next(iter(options))
  else:ambiguous[a]=[names[n]['label']for n in sorted(options)]
 if ambiguous:issues.append((k,'choose real public alias owner',ambiguous));continue
 missing=[a for a in q['familiar']if norm(a)not in exact]
 if missing:issues.append((k,'missing independent familiar guess',missing));continue
 assert not[a for a in q['exclude']if norm(a)in exact],(k,'ineligible animal accepted')
 common={exact[norm(a)]for a in q['familiar']};low={exact[norm(a)]for a in q['familiar'][:6]};rare=exact[norm(q['rare'])];assert rare not in common,(k,'rare anchor was independently common')
 tiers=collections.defaultdict(list)
 for n,p in sorted(names.items()):
  score=10 if n in low else 30 if n in common else 100 if n==rare else 60 if len(p['label'])<=25 else 85
  tiers[str(score)].append({'label':p['label'],'aliases':sorted(a for a in p['aliases']if norm(a)!=n and exact.get(norm(a))==n)})
 questions.append(dict(id='authored-'+k,concept=k,family='nature',topic='ANIMAL KINDS',prompt=q['prompt'],scope=q['scope'],format='whole-taxonomic-group',rationale='One familiar whole mammal family or established clade, with all publisher species reconciled and independent familiar-name inputs. Species, scientific names, historical names and source countries are answer inventory, never additional questions. No country, color, habitat or title-word slices create questions.',familiar=q['familiar'],exclude=q['exclude'],references=[src['source'],src['archive'],*q['references']],answers=dict(tiers)))
 checks.append({'id':'authored-'+k,'publisherVersion':src['version'],'sourceSpecies':len(records),'canonicalAnswers':len(names),'familiarChecks':len(q['familiar']),'sourceCsvSha256':src['csvSha256'],'rareAnchor':q['rare']});held[k]=holds
assert not issues,issues
files={DATA/'batches/17-mammal-concepts.json':json.dumps({'version':1,'questions':questions},ensure_ascii=False,separators=(',',':'))+'\n',DATA/'mammal-concept-checks.json':json.dumps(checks,ensure_ascii=False,indent=2)+'\n',DATA/'mammal-concept-alias-holds.json':json.dumps(held,ensure_ascii=False,indent=2)+'\n'}
for p,t in files.items():
 if '--check'in sys.argv:assert p.read_text()==t,p
 else:p.write_text(t)
print(checks)
