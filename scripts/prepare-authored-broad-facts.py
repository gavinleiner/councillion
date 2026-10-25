#!/usr/bin/env python3
"""Whole factual concepts with explicit name repairs; no country/tag slicing."""
import collections,gzip,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1]
s=json.load(gzip.open(ROOT/'data-snapshots/authored/sources/broad-facts.json.gz'))
supp=json.load(open(ROOT/'data-snapshots/authored/broad-supplements.json'))
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
specs=[
 ('musical-duos','music','Better as two','Name a music act known as a duo.','Current and historical musical duos count. Ordinary backing musicians do not change a two-person act into a larger group. Two solo artists who collaborated once are not automatically a named duo.','Daft Punk|Simon & Garfunkel|OutKast|Twenty One Pilots|Pet Shop Boys|Hall & Oates|Roxette','Adele|Michael Jackson','Alton & Jimmy'),
 ('mountain-ranges','world','High company','Name a real mountain range.','Named ranges, chains, mountain systems and subranges count, anywhere in the world. A single peak by itself is not a range.','Himalayas|Andes|Alps|Rocky Mountains|Appalachian Mountains|Pyrenees','Mount Everest|Atlantic Ocean','Gamburtsev Mountain Range'),
 ('museums','world','Museum trip','Name a real museum.','Named museums and museum complexes count, including historical institutions. Multiple institutions with the same name share an answer identity. A type of museum or a fictional museum is not a named real institution.','Louvre|British Museum|Metropolitan Museum of Art|Museum of Modern Art|Prado Museum|Solomon R. Guggenheim Museum','Hogwarts|The Death Star','Sulabh International Museum of Toilets')
]
qs=[];omissions=[]
for key,family,topic,prompt,scope,examples,wrong,rare in specs:
 raw=s['groups'][key];byid={r['id']:{**r,'aliases':list(r['aliases'])}for r in raw}
 for row in supp[key]['add']:byid[row['id']]=row
 for qid,als in supp[key]['aliases'].items():
  assert qid in byid,(key,'Missing supplement owner',qid)
  byid[qid]['aliases']=list(set(byid[qid]['aliases']+als))
 merged={}
 for p in byid.values():
  label=p['name']
  if len(label)>=180:
   short=[a for a in p['aliases']if 4<=len(norm(a))and len(a)<180]
   if short:label=min(short,key=lambda a:(len(a),a));p['aliases'].append(p['name'])
   else:
    omissions.append({'group':key,'id':p['id'],'name':label,'reason':'No documented name under the current answer-display length limit'});continue
  k=norm(label)
  if not k or re.fullmatch(r'Q\d+',label):
   omissions.append({'group':key,'id':p['id'],'name':label,'reason':'No usable documented Latin-script name in the English-label snapshot'});continue
  if k not in merged:merged[k]={'label':label,'aliases':set(),'sitelinks':0}
  row=merged[k];row['sitelinks']=max(row['sitelinks'],p['sitelinks']);row['aliases'].update(a for a in p['aliases']if norm(a)and (len(norm(a))>=4 or a in ['V&A','Met']))
 exact={norm(n):k for k,p in merged.items()for n in [p['label'],*p['aliases']]}
 for familiar in examples.split('|'):assert norm(familiar)in exact,(key,'Missing familiar answer',familiar)
 familiar_keys={exact[norm(n)]for n in examples.split('|')}
 rarekey=norm(rare);assert rarekey in merged,(key,rare)
 for k,p in merged.items():p['points']=100 if k==rarekey else 10 if k in familiar_keys or p['sitelinks']>=100 else 30 if p['sitelinks']>=35 else 60 if p['sitelinks']>=8 else 85
 owners=collections.defaultdict(list)
 for k,p in merged.items():
  for a in p['aliases']:
   if norm(a)not in merged:owners[norm(a)].append(k)
 chosen={a:min(keys,key=lambda k:(merged[k]['points'],-merged[k]['sitelinks'],merged[k]['label']))for a,keys in owners.items()}
 tiers=collections.defaultdict(list)
 for k,p in sorted(merged.items()):tiers[str(p['points'])].append({'label':p['label'],'aliases':sorted({a for a in p['aliases']if norm(a)!=k and chosen.get(norm(a))==k})})
 qs.append(dict(id='authored-'+key,concept=key,family=family,topic=topic,prompt=prompt,scope=scope,format='whole-concept',rationale='A globally recognizable whole subject with a large factual inventory, rather than a country/year slice or a pair of generated tags. Popularity informs the scoring tier, not whether an answer is retained.',familiar=examples.split('|'),exclude=wrong.split('|'),references=['https://www.wikidata.org/wiki/Wikidata:Data_access','https://qlever.dev/wikidata/'],answers=dict(tiers)))
target=ROOT/'data-snapshots/authored/batches/06-broad-concepts.json';text=json.dumps({'version':1,'questions':qs},ensure_ascii=False,separators=(',',':'))+'\n'
if '--check'in sys.argv:assert target.read_text()==text,'Rebuild the factual concept batch'
else:target.write_text(text)
op=ROOT/'data-snapshots/authored/source-omissions.json';ot=json.dumps(omissions,ensure_ascii=False,indent=2)+'\n'
if '--check'in sys.argv:assert op.read_text()==ot,'Refresh source omissions'
else:op.write_text(ot)
print([(q['id'],sum(map(len,q['answers'].values())))for q in qs]);print(len(omissions),'unusable source labels held for a later source repair')
