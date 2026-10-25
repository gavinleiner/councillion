"""Build individually admitted broad questions, never tag-pair permutations.
Source banks are finite. A numerical target cannot override editorial admission.
"""
from pathlib import Path
import json,gzip,re,hashlib,collections,unicodedata,argparse,sys,functools
from wordfreq import zipf_frequency
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'data-snapshots';OUT=ROOT/'distinct-banks'
parser=argparse.ArgumentParser();parser.add_argument('--probe',action='store_true');args=parser.parse_args()
def read(p):
 p=Path(p);return json.loads(gzip.decompress(p.read_bytes()) if p.suffix=='.gz' else p.read_text())
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower())
def slug(s):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')
def sha(s):return hashlib.sha256(s.encode()if isinstance(s,str)else s).hexdigest()
def literal(file,marker):return json.JSONDecoder().raw_decode((ROOT/file).read_text().split(marker,1)[1])[0]
legacy={}
for f,m in [('group-question-catalog.js','createGroupCatalog('),('fun-question-catalog.js','createFunCatalog('),('variety-question-catalog.js','createExtraCatalog('),('discovery-question-catalog.js','createDiscoveryCatalog(')]:
 for p in literal(f,m):legacy[p['id']]=p
inline={};table=literal('question-answers.js','export const ANSWER_ROWS=')
for p,ids in literal('question-catalog.js','const rows='):inline[p['id']]=[table[i]for i in ids];legacy[p['id']]=p
for p,rows in literal('expanded-banks.js','const rows='):inline[p['id']]=rows;legacy[p['id']]=p

def bank(id):
 if id in inline:return inline[id]
 p=legacy[id];return read(ROOT/p.get('answerDirectory','question-banks')/p['answerFile'])
@functools.lru_cache(maxsize=200000)
def frequency(s):return zipf_frequency(s,'en')
def named(s):
 if isinstance(s,str):s=s.split('|')
 out=[]
 for item in s:
  parts=item.split('~');name=parts[0].strip();f=frequency(name);out.append([name,10 if f>=4.7 else 30 if f>=4 else 60 if f>=3 else 85,parts[1:]])
 return out
ban=re.compile(r'\b(?:porn|hentai|nigger|faggot|rape|incest|orgasm|masturbat\w*|pussy|nude|sexual|sex)\b',re.I)
def valid(s):return isinstance(s,str)and 0<len(norm(s))and len(s)<180 and not ban.search(s)and not re.match(r'^(?:Q\d+|unknown|unnamed|Team Mate \d|NPC \d|Additional Voices|Voice Talent)$',s,re.I)
seen_sets={};seen_prompts=set();recipes=[];rejected=[]
semantic_exclusions=read(SRC/'distinct/semantic-exclusions.json')
retained_repairs=read(SRC/'distinct/retained-repairs.json')
for p in read(SRC/'distinct/baseline-pool.json')['categories']:
 rs=bank(p['id']);seen_sets[sha('\n'.join(sorted(set(norm(r[0])for r in rs))))]=p['id'];seen_prompts.add(norm(p['prompt']))
def add(key,family,topic,prompt,rows,source,scope,kind,examples=(),negative=(),minimum=24,finite=False,origin=None):
 if key in semantic_exclusions:
  rejected.append([key,semantic_exclusions[key]]);return
 merged={}
 for label,points,aliases in rows:
  if not valid(label):continue
  k=norm(label)
  if k not in merged:merged[k]=[re.sub(r'\s+',' ',label).strip(),points,set()]
  merged[k][1]=min(points,merged[k][1]);merged[k][2].update(a for a in aliases if valid(a))
 canonical=set(merged);fp=sha('\n'.join(sorted(canonical)))
 if len(merged)<minimum or norm(prompt)in seen_prompts or fp in seen_sets:
  rejected.append([key,'too small/duplicate',len(merged)]);return
 owners=collections.defaultdict(set)
 for k,(_,_,aliases)in merged.items():
  for a in aliases:owners[norm(a)].add(k)
 rs=[]
 for k,(label,points,aliases)in sorted(merged.items()):rs.append([label,points,sorted(a for a in aliases if norm(a)!=k and norm(a)not in canonical and len(owners[norm(a)])==1)])
 exact={norm(s):r[0]for r in rs for s in [r[0],*r[2]]}
 if examples and any(norm(s)not in exact for s in examples):raise ValueError('Missing familiar example '+key+': '+','.join(s for s in examples if norm(s)not in exact))
 if any(norm(s)in exact for s in negative):raise ValueError('Boundary contamination '+key)
 # Explicit familiar examples anchor rarity within this question. Source-backed
 # lower scores are retained; this is editorial grading, not live frequencies.
 for index,name in enumerate(examples):
  label=exact[norm(name)]
  next(r for r in rs if r[0]==label)[1]=min(next(r for r in rs if r[0]==label)[1],10 if index<2 else 30)
 if not any(r[1]==100 for r in rs):
  rare=[r for r in rs if r[1]>=60]
  if rare:min(rare,key=lambda r:sha(key+r[0]))[1]=100
 p={'id':'distinct-'+key,'family':family,'topic':topic.upper(),'prompt':prompt,'source':source,'scope':scope,'group':'distinct-'+kind,'answerCount':len(rs),'familiarCount':sum(r[1]<=30 for r in rs),'editorialVersion':1,'editorialExamples':list(examples),'editorialNegative':list(negative),'naturalFinite':finite,'originId':origin if origin in legacy else None,'identityHash':fp,'predicate':{'kind':'authored-topic','recipe':key,'format':kind},'rows':rs}
 recipes.append(p);seen_sets[fp]=p['id'];seen_prompts.add(norm(prompt))

def retain(id,family=None,prompt=None,examples=(),negative=()):
 p=legacy[id]
 repair=retained_repairs.get(id,{})
 rows=named(repair['replace'])if 'replace'in repair else bank(id)
 for label,points,aliases in named(repair.get('add',[])):
  names={norm(label),*(norm(a)for a in aliases)}
  match=next((r for r in rows if norm(r[0])in names or names.intersection(norm(a)for a in r[2])),None)
  if match:match[2]=sorted(set([*match[2],*aliases,label])-{match[0]})
  else:rows.append([label,points,aliases])
 for r in rows:
  r[2]+=repair.get('aliases',{}).get(r[0],[])
  if 'tailPoints'in repair:r[1]=repair['tailPoints']
  r[1]=repair.get('points',{}).get(r[0],r[1])
 rows=[r for r in rows if norm(r[0])not in {norm(n)for n in repair.get('remove',[])}]
 add('inventory-'+id,family or p['family'],p['topic'],prompt or p['prompt'],rows,repair.get('source',p.get('source','Retained factual inventory; DATA-SOURCES.md')),p.get('scope','Types, named examples and established synonyms count. This is a finite source inventory.'),'kinds',examples,negative,origin=id)
exec((ROOT/'scripts/distinct-topic-recipes.py').read_text(),globals())
print(json.dumps({'admitted':len(recipes),'families':dict(collections.Counter(p['family']for p in recipes)),'formats':dict(collections.Counter(p['group']for p in recipes)),'rejected':rejected},indent=2))
if args.probe:sys.exit()
OUT.mkdir(exist_ok=True);meta=[];manifest=[]
for p in recipes:
 rows=p.pop('rows');raw=json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode();digest=sha(raw);filename=p['id']+'.'+digest[:16]+'.json.gz';compressed=gzip.compress(raw,mtime=0);(OUT/filename).write_bytes(compressed)
 p.update(answerDirectory='distinct-banks',answerFile=filename,funVersion=8,dailyEligible=True,partyEligible=True,mixed=True,ranking='editorial-familiarity-v1');meta.append(p);manifest.append({**p,'sha256':digest,'downloadBytes':len(compressed),'tiers':dict(collections.Counter(r[1]for r in rows))})
build=sha(json.dumps(meta,sort_keys=True,ensure_ascii=False))[:16]
(ROOT/'distinct-question-catalog.js').write_text("// Generated from admitted topic recipes; full inventories load per question.\nimport {createDistinctCatalog} from './fun-bank-loader.js';\nexport const DISTINCT_PACKS=createDistinctCatalog("+json.dumps([{k:v for k,v in p.items() if k not in ['editorialExamples','editorialNegative']}for p in meta],ensure_ascii=False,separators=(',',':'))+','+json.dumps(build)+');\n')
(ROOT/'distinct-bank-manifest.json').write_text(json.dumps({'build':build,'count':len(meta),'categories':manifest},ensure_ascii=False,indent=2)+'\n')
