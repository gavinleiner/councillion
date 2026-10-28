#!/usr/bin/env python3
"""Whole global physical features, with complete source and explicit admission."""
import collections,gzip,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1];D=ROOT/'data-snapshots/authored';S=D/'sources/geonames-world'
spec=json.load(open(D/'world-geography-specifications.json'))['questions'];lists=json.load(gzip.open(D/'sources/world-published-list-names.json.gz'))['lists']
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
generic={norm(x)for x in ['island','islands','beach','beaches','reservoir','the reservoir','dam','the dam','cave','caves','forest','forests','the forest','glacier','glaciers','iceberg','valley','canyon','gorge','cape','headland','mountain','mountains','peak','volcano','reef','reefs','atoll','garden','gardens','zoo','animal park','aquarium','zoological park','desert','the desert','sandy desert','botanical garden','public garden','national park']}
def usable(s):return norm(s)and len(s)<180 and norm(s)not in generic and not re.fullmatch(r'[\d\W]+',s)and not re.match(r'^(?:unnamed|unknown|unidentified|list of|lists of|forests of )\b',s,re.I)and not re.search(r'https?://|www\.|^Q\d+$',s)
issues=[];checks=[];holds={};files={}
for q in spec:
 if q.get('buildStage')=='source-audit'and '--audit-all'not in sys.argv:continue
 key=q['key'];names={};held=[];aliases_index=collections.defaultdict(set);row_ids=collections.defaultdict(set);raw_count=0;kept_rows=0
 explicit_holds={norm(n):reason for n,reason in q['holds'].items()};short={norm(n)for n in q['actualShortNames']}
 def add(name,aliases=(),provenance=None):
  label=name.strip();n=norm(label)
  if not usable(label):held.append({'name':label,'reason':'No usable qualified proper-name label; generic object word, technical URL/ID or unnamed feature.'});return None
  if n in explicit_holds:held.append({'name':label,'reason':explicit_holds[n]});return None
  p=names.setdefault(n,{'label':label,'aliases':set(),'sourceRows':0,'prominence':0})
  p['sourceRows']+=1;p['prominence']=max(p['prominence'],len(aliases))
  for a in aliases:
   a=a.strip();an=norm(a)
   if usable(a)and(len(an)>=4 or an in short)and an not in explicit_holds and an!=n:p['aliases'].add(a);aliases_index[an].add(n)
  if provenance:row_ids[n].add(provenance)
  return n
 for source in q['geoSources']:
  for line in gzip.open(S/(source+'.jsonl.gz'),'rt'):
   p=json.loads(line)
   if key=='mountains-peaks'and p['feature']in ['T.MTS','T.PKS']:continue
   raw_count+=1;name=p['asciiName']or p['name'];bad={norm(a)for a in q.get('aliasHolds',{}).get(name,[])}
   valid_aliases=[a for a in [p['name'],*p['aliases']]if norm(a)not in bad]
   if bad:held.extend({'name':a,'id':p['id'],'reason':'Misleading entity/planet alias: preserve the actual Earth place name without treating a god-group or the Martian Olympus Mons as an English Earth-mountain answer.'}for a in [p['name'],*p['aliases']]if norm(a)in bad)
   result=add(name,valid_aliases,p['id'])
   if result:kept_rows+=1
 # The primary source's exact qualified name wins over an ambiguous alias.
 def owner(text):
  n=norm(text)
  if n in names:return n
  choices=aliases_index.get(n,set())&names.keys()
  return min(choices,key=lambda k:(-names[k]['prominence'],names[k]['label']))if choices else None
 for title in q['listSources']:
  if title not in lists:continue
  for row in lists[title]['names']:
   name=row['name']
   # A mixed dam/reservoir list is not permission to classify every lake as
   # artificial or to turn every power station into a dam.
   if key=='dams'and not re.search(r'\b(?:dam|barrage|weir|barragem|dike)\b',name,re.I):continue
   if key=='reservoirs'and not re.search(r'\b(?:reservoir|embalse|represa)\b',name,re.I):continue
   n=owner(name)
   if n:names[n]['aliases'].add(name)
   else:add(name,(),title)
 for row in q['additions']:
  assert row.get('evidence')and row.get('references'),(key,'unsupported supplemental name',row)
  n=owner(row['label'])
  if n:names[n]['aliases'].update(row.get('aliases',[]))
  else:add(row['label'],row.get('aliases',[]),'explicit-primary-supplement')
 for canonical,aliases in q['aliases'].items():
  n=owner(canonical)
  if not n:issues.append({'question':key,'unknownAliasOwner':canonical});continue
  for a in aliases:
   other=owner(a)
   if other and other!=n and norm(a)in names:
    moved=names.pop(other);names[n]['aliases'].update([moved['label'],*moved['aliases']]);row_ids[n].update(row_ids.pop(other,set()))
   names[n]['aliases'].add(a);aliases_index[norm(a)].add(n)
 for old,canonical in q.get('merges',[]):
  n=owner(canonical);o=owner(old);assert n and o,(key,'unknown merge',old,canonical)
  if n!=o:
   moved=names.pop(o);names[n]['aliases'].update([moved['label'],*moved['aliases']]);row_ids[n].update(row_ids.pop(o,set()))
 # Rebuild ownership after identity merges. Shared proper names choose an
 # independently familiar owner, then source prominence, never rarest points.
 canonical={n:n for n in names};owners=collections.defaultdict(set)
 for n,p in names.items():
  for a in p['aliases']:
   if norm(a)not in names:owners[norm(a)].add(n)
 for a,ks in owners.items():canonical[a]=min(ks,key=lambda k:(-names[k]['prominence'],names[k]['label']))
 missing=[a for a in q['familiar']if norm(a)not in canonical]
 rare=canonical.get(norm(q['rare']))
 if missing or rare is None:
  issues.append({'question':key,'missingCommon':missing,'missingRare':q['rare']if rare is None else None})
  holds[key]=held;continue
 assert not[a for a in q['exclude']if norm(a)in canonical],(key,'a proposed wrong boundary is accepted; investigate its real meaning',[a for a in q['exclude']if norm(a)in canonical])
 common={canonical[norm(a)]for a in q['familiar']};low={canonical[norm(a)]for a in q['familiar'][:8]};assert rare not in common,(key,'rare anchor was familiar')
 tiers=collections.defaultdict(list)
 for n,p in sorted(names.items()):
  points=10 if n in low or len(n)<=3 else 100 if n==rare else 30 if n in common or p['sourceRows']>=20 or p['prominence']>=35 else 60 if p['sourceRows']>=3 or p['prominence']>=4 else 85
  tiers[str(points)].append({'label':p['label'],'aliases':sorted(a for a in p['aliases']if norm(a)!=n and canonical.get(norm(a))==n)})
 out={'id':q['id'],'concept':q['concept'],'family':'world','topic':'ON THE MAP','prompt':q['prompt'],'scope':q['scope'],'format':'whole-concept','rationale':'One independently chosen whole global feature category, never one question per country, altitude, letter or paired label. All primary source rows of eligible feature classes are reconciled. Common-name and source-eligibility checks supplement the gazetteer; real synonyms share scoring identity.','familiar':q['familiar'],'exclude':q['exclude'],'references':q['references'],'answers':dict(tiers)}
 files[D/'batches'/('18-world-'+key+'.json')]=json.dumps({'version':1,'questions':[out]},ensure_ascii=False,separators=(',',':'))+'\n'
 checks.append({'id':q['id'],'key':key,'rawPrimaryRows':raw_count,'qualifiedPrimaryRows':kept_rows,'canonicalAnswers':len(names),'familiarChecks':len(q['familiar']),'rareAnchor':names[rare]['label'],'geoSources':q['geoSources'],'listSources':q['listSources']});holds[key]=held
files[D/'world-geography-issues.json']=json.dumps(issues,ensure_ascii=False,indent=2)+'\n';files[D/'world-geography-checks.json']=json.dumps(checks,ensure_ascii=False,indent=2)+'\n';files[D/'world-geography-holds.json']=json.dumps(holds,ensure_ascii=False,indent=2)+'\n'
if '--audit'in sys.argv or '--audit-all'in sys.argv:
 for p,t in files.items():
  if p.parent.name!='batches':p.write_text(t)
 print(json.dumps(issues,ensure_ascii=False,indent=2));print('fully buildable',len(checks),'of',len(spec));sys.exit()
assert not issues,issues
for p,t in files.items():
 if '--check'in sys.argv:assert p.read_text()==t,p
 else:p.write_text(t)
print([(c['id'],c['canonicalAnswers'])for c in checks])
