#!/usr/bin/env python3
"""Build broad whole concepts; unanswered source gaps keep these as candidates."""
import collections,gzip,json,pathlib,re,sys,unicodedata
from authored_airport_source import augment_airports
ROOT=pathlib.Path(__file__).resolve().parents[1]
s=json.load(gzip.open(ROOT/'data-snapshots/authored/sources/open-knowledge.json.gz'))
supp=json.load(open(ROOT/'data-snapshots/authored/open-knowledge-supplements.json'))
checks=json.load(open(ROOT/'data-snapshots/authored/open-knowledge-challenges.json'))
def norm(x):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',x).encode('ascii','ignore').decode().lower())
specs=[
 ('record-labels','music','On the label','Name a record label or record company.','Real current and historical record labels, imprints and record companies count. A publisher, streaming platform or music store is not automatically a record label.','Columbia Records|Atlantic Records|Republic Records|Interscope Records|Motown|Def Jam Recordings','Canon camera|Hogwarts'),
 ('named-djs','music','On the decks','Name a real DJ or DJ act, past or present.','Real DJs and billed DJ duos or groups count, including people known for presenting recorded music on radio. Being a singer or producer alone does not make someone a DJ. Fictional story DJs and unrelated musical groups do not count.','David Guetta|Calvin Harris|Avicii|Tiesto|Marshmello|Skrillex','Sherlock Holmes|Columbia Records'),
 ('named-drummers','music','Behind the kit','Name a musician known for playing drums.','Real musicians known for playing drums count, including multi-instrumentalists and percussionists with a documented drum-playing career. An unrelated band member does not become a drummer just because the band has one.','Ringo Starr|Dave Grohl|Travis Barker|Phil Collins|Lars Ulrich|Neil Peart','Rick Savage|Lionel Messi'),
 ('keyboard-instruments','music','Keys to the music','Name a musical instrument with a keyboard.','Recognized keyboard-instrument types and documented named keyboard instruments or models count. Keys and buttons form the musical playing interface; having ordinary valves or attaching an external controller does not automatically qualify another instrument.','Piano|Organ|Synthesizer|Harpsichord|Accordion|Keytar','Violin|Trumpet'),
 ('named-airports','world','Departures','Name a real airport or airfield.','Named airports and airfields worldwide count, including historical facilities. An airport code must be an actual documented code or name; invented initials do not count.','John F. Kennedy International Airport|Los Angeles International Airport|Heathrow Airport|Singapore Changi Airport|Dubai International Airport|Haneda Airport','Big Ben|Hogwarts'),
 ('castles-palaces','world','Castle visit','Name a real castle or palace.','Named castles, palaces and châteaux worldwide count, including historical or ruined ones and real decorative castle attractions. A real theme-park castle based on fiction counts; a castle that exists only in a story and a generic type of building do not count.','Windsor Castle|Buckingham Palace|Palace of Versailles|Edinburgh Castle|Neuschwanstein Castle|Alhambra',"The Death Star|Elsa's fictional ice palace"),
 ('named-deserts','world','Dry country','Name a desert.','Recognized named hot, cold and polar deserts count. An individual dune or a generic sandy beach is not itself a named desert.','Sahara|Gobi Desert|Kalahari Desert|Namib Desert|Atacama Desert|Arabian Desert','Pacific Ocean|Amazon rainforest'),
 ('named-canals','world','Canal crossing','Name a real named canal.','Named canals, shipping channels and recognized artificial waterways count worldwide, including disused historical ones. Natural rivers are not automatically canals.','Suez Canal|Panama Canal|Erie Canal|Grand Canal|Rideau Canal|Corinth Canal','Nile River|Amazon River'),
 ('archaeological-sites','world','Digging into history','Name an archaeological site or ancient ruin.','Named archaeological sites, ancient ruins and recognized archaeological complexes count worldwide, including settlements and individual excavated monuments. Entire modern countries or generic objects are not named sites.','Machu Picchu|Pompeii|Stonehenge|Petra|Chichen Itza|Angkor Wat','Minecraft|United States'),
 ('named-mausoleums','world','Resting places','Name a real tomb, mausoleum or cemetery.','Named tombs, mausoleums, cemeteries and recognized named burial complexes count, including historical sites. A person or a generic grave type alone does not name a burial site.','Taj Mahal|Great Pyramid of Giza|Ming tombs|Lenin\'s Mausoleum|Lincoln Tomb|Mausoleum at Halicarnassus','Mount Everest|The Death Star'),
 ('named-waterfalls','world','Falling water','Name a real waterfall.','Named waterfalls and recognized waterfall complexes count worldwide. Multiple real falls with the same name share an answer identity. Fictional falls and generic words such as waterfall do not count.','Niagara Falls|Victoria Falls|Angel Falls|Iguazu Falls|Yosemite Falls|Looking Glass Falls','Hogwarts Falls|Pacific Ocean')
]
qs=[];issues=[];challenges=[];airport_proof=None
for key,family,topic,prompt,scope,examples,wrong in specs:
 # The desert candidate is now rebuilt from the complete primary gazetteer
 # and published desert list, retaining its original concept/ID.
 if key=='named-deserts':continue
 if key not in s['groups']:continue
 raw={p['id']:{**p,'aliases':list(p['aliases'])}for p in s['groups'][key]}
 fixes=supp.get(key,{})
 actual_codes=set();preferred_codes={}
 if key=='named-airports':raw,actual_codes,preferred_codes,airport_proof=augment_airports(raw)
 for qid in fixes.get('hold',{}):raw.pop(qid,None)
 generic={norm(a)for a in fixes.get('genericNames',[])}
 raw={k:{**v,'aliases':[a for a in v['aliases']if norm(a)not in generic]}for k,v in raw.items()if norm(v['name'])not in generic}
 for qid,label in fixes.get('labels',{}).items():
  assert qid in raw,(key,'Transliterated owner absent',qid)
  raw[qid]['aliases'].append(raw[qid]['name']);raw[qid]['name']=label
 for p in fixes.get('add',[]):
  qid='supplement-'+norm(p['name']);raw[qid]={'id':qid,'name':p['name'],'aliases':p['aliases'],'sitelinks':0}
  if 'pending'in p['evidence']or'require'in p['evidence']:issues.append({'question':key,'name':p['name'],'reason':p['evidence']})
 for qid,aliases in fixes.get('aliases',{}).items():
  if qid not in raw:issues.append({'question':key,'id':qid,'reason':'Alias owner absent from the current query; do not create a phantom answer'});continue
  raw[qid]['aliases'].extend(aliases)
 for fix in fixes.get('pending',[]):
  matches=[p for p in raw.values()if norm(p['name'])==norm(fix['lookup'])]
  if len(matches)==1:matches[0]['aliases'].extend(fix['aliases'])
  else:issues.append({'question':key,**fix})
 for canonical,aliases in fixes.get('namedAliases',{}).items():
  matches=[p for p in raw.values()if norm(p['name'])==norm(canonical)]
  assert matches,(key,'Explicit alias owner must actually exist',canonical)
  matches[0]['aliases'].extend(aliases)
 grouped={}
 for p in raw.values():
  name=p['name'];k=norm(name)
  if not k or re.fullmatch('Q[0-9]+',name)or len(name)>=180:
   issues.append({'question':key,'id':p['id'],'name':name,'reason':'No usable English/Latin answer label under the current display limit'});continue
  if k not in grouped:grouped[k]={'label':name,'aliases':set(),'sitelinks':0}
  row=grouped[k];row['aliases'].update(a for a in p['aliases']if norm(a));row['sitelinks']=max(row['sitelinks'],p.get('sitelinks',0))
 # A documented model/stage-name synonym must not remain separately scoreable
 # merely because the source also used it as another record's main label.
 for canonical,aliases in fixes.get('namedAliases',{}).items():
  owner=grouped[norm(canonical)]
  for alias in aliases:
   n=norm(alias);other=grouped.get(n)
   if other is not None and other is not owner:
    owner['aliases'].update([other['label'],*other['aliases']]);owner['sitelinks']=max(owner['sitelinks'],other['sitelinks']);del grouped[n]
 exact={k:k for k in grouped};alias_candidates=collections.defaultdict(set)
 for k,p in grouped.items():
  for a in p['aliases']:
   if norm(a)not in exact:alias_candidates[norm(a)].add(k)
 for a,keys in alias_candidates.items():exact[a]=min(keys,key=lambda k:(-grouped[k]['sitelinks'],grouped[k]['label']))
 familiar=examples.split('|');missing=[n for n in familiar if norm(n)not in exact]
 if missing:
  issues.append({'question':key,'reason':'Missing independently specified familiar answers; inventory not yet buildable','missing':missing});continue
 positive=checks['checks'].get(key,'').split('|')
 # Deliberately supplied probes may themselves reveal a bad assumption. Do
 # not turn every probe into an accepted answer. Preserve the disposition.
 rejected={'named-drummers':{'Rick Savage'},'keyboard-instruments':{'Vocoder','Sampler'},'named-mausoleums':set()}.get(key,set())
 result={'question':key,'checked':len(positive),'notAssumedValid':sorted(rejected),'missing':[n for n in positive if n not in rejected and norm(n)not in exact]}
 challenges.append(result)
 common={exact[norm(n)]for n in positive if n not in rejected and norm(n)in exact}
 low={exact[norm(n)]for n in familiar}
 for k,p in grouped.items():p['points']=100 if k==norm(fixes.get('rare',''))else 10 if k in low or p['sitelinks']>=100 else 30 if k in common or p['sitelinks']>=35 else 60 if p['sitelinks']>=8 else 85
 owners=collections.defaultdict(list)
 actual_short={norm(s)for s in [*fixes.get('actualShortNames',[]),*actual_codes]}
 for k,p in grouped.items():
  for a in p['aliases']:
   n=norm(a)
   if n not in grouped and(len(n)>=4 or n in actual_short):owners[n].append(k)
 chosen={a:min(v,key=lambda k:(grouped[k]['points'],-grouped[k]['sitelinks'],grouped[k]['label']))for a,v in owners.items()}
 for code,owner in preferred_codes.items():
  if owner in grouped and code not in grouped:chosen[code]=owner
 tiers=collections.defaultdict(list)
 for k,p in sorted(grouped.items()):
  tiers[str(p['points'])].append({'label':p['label'],'aliases':sorted(a for a in p['aliases']if norm(a)!=k and chosen.get(norm(a))==k)})
 tested=[n for n in positive if n not in rejected]if fixes.get('reviewed')else familiar
 if fixes.get('reviewed'):assert not result['missing'],(key,'Independent common inputs remain missing',result['missing'])
 qs.append(dict(id='authored-'+key,concept=key,family=family,topic=topic,prompt=prompt,scope=scope,format='whole-concept',rationale='One recognizable global subject with common entry answers and a long factual tail; never a tag pair, title-word filter, arbitrary country slice or popularity-only shortlist. Candidate source gaps remain separate from normal-play admission.',familiar=list(dict.fromkeys([*familiar,*tested])),exclude=list(dict.fromkeys([*wrong.split('|'),*fixes.get('extraNegative',[])])),references=['https://www.wikidata.org/wiki/Wikidata:Data_access','https://qlever.dev/wikidata/',*fixes.get('references',[])],answers=dict(tiers)))
files={ROOT/'data-snapshots/authored/batches/08-open-whole-concepts.json':json.dumps({'version':1,'questions':qs},ensure_ascii=False,separators=(',',':'))+'\n',ROOT/'data-snapshots/authored/open-knowledge-issues.json':json.dumps({'status':'Candidates require full classification, supplemental-evidence and familiar-name review before admission. No issue is waived by a large answer count.','issues':issues,'challenges':challenges},ensure_ascii=False,indent=2)+'\n'}
if airport_proof is not None:files[ROOT/'data-snapshots/authored/airport-source-checks.json']=json.dumps(airport_proof,ensure_ascii=False,indent=2)+'\n'
for p,text in files.items():
 if '--check'in sys.argv:assert p.read_text()==text,p
 else:p.write_text(text)
print([(q['id'],sum(map(len,q['answers'].values())))for q in qs]);print(len(issues),'unresolved evidence, classification or label issues')
