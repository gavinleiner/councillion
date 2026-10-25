"""Apply explicit answer repairs to frozen catalogs without deleting history.

Run after a source-bank generator. --check verifies idempotence, byte hashes,
and the checked-in catalogs. It never infers new memberships from word overlap.
"""
from pathlib import Path
import json,gzip,re,hashlib,collections,unicodedata,argparse
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'data-snapshots/reviewed-standard'
check=argparse.ArgumentParser();check.add_argument('--check',action='store_true');args=check.parse_args()
norm=lambda s:re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
sha=lambda b:hashlib.sha256(b).hexdigest()
repairs=json.loads((SRC/'answer-repairs.json').read_text())['questions'];supplement=json.loads((SRC/'steam-supplement.json').read_text())
league=json.loads((SRC/'premier-league-players.json').read_text())['players']
configs=[('fun-question-catalog.js','createFunCatalog(','fun-bank-manifest.json'),('variety-question-catalog.js','createExtraCatalog(','variety-bank-manifest.json'),('discovery-question-catalog.js','createDiscoveryCatalog(','discovery-manifest.json'),('group-question-catalog.js','createGroupCatalog(','group-bank-manifest.json'),('distinct-question-catalog.js','createDistinctCatalog(','distinct-bank-manifest.json')]
catalogs=[];owners={}
for file,marker,manifest in configs:
 text=(ROOT/file).read_text();start=text.index(marker)+len(marker);rows,end=json.JSONDecoder().raw_decode(text[start:]);catalogs.append([file,manifest,text,start,start+end,rows]);owners.update({p['id']:p for p in rows})
changed=[];affected=set();report=[]
for id,p in owners.items():
 patch=repairs.get(id,{});pred=p.get('predicate')or{};steam=[]
 if pred.get('kind')=='steam-tag':steam=[s for s in supplement if pred['tag']in s['tags']]
 if not patch and not steam:continue
 data=ROOT/p.get('answerDirectory','question-banks')/p['answerFile'];rows=json.loads(gzip.decompress(data.read_bytes())if data.suffix=='.gz'else data.read_bytes());before=len(rows)
 rows=patch.get('replace',rows);remove={norm(n)for n in patch.get('remove',[])};rows=[[r[0],r[1],list(r[2])]for r in rows if norm(r[0])not in remove]
 namesIndex={}
 def indexrow(r):
  for name in [r[0],*r[2]]:namesIndex[norm(name)]=r
 for r in rows:indexrow(r)
 def lookup(name):return namesIndex.get(norm(name))
 if id=='group-q022':
  # Public first-team playing minutes establish professional participation.
  # A source inventory can expand a reviewed answer bank, never admit a prompt.
  for player in league:
   if player['minutes']<=0:raise ValueError('Unverified professional appearance')
   full=(player['first']+' '+player['last']).strip();display=player['display'];names=[full]
   if not re.search(r'[.\d]',display):
    if len(display.split())>=2:names.append(display)
    if not display.lower().startswith(player['first'].lower()):names.append(player['first']+' '+display)
    if norm(display)==norm(player['first']):names.append(display)
   r=next((found for name in names if (found:=lookup(name))is not None),None)
   if r is None:r=[full,30,[]];rows.append(r)
   r[2]+=names;indexrow(r)
 for label,points,aliases in [*patch.get('add',[]),*[[s['name'],10,s['aliases']]for s in steam]]:
  r=lookup(label)
  if r is None:r=[label,points,[]];rows.append(r)
  r[2]=list(set(r[2]+aliases));r[1]=min(r[1],points);indexrow(r)
 for label,aliases in patch.get('aliases',{}).items():
  r=lookup(label)
  if r is None:raise ValueError(id+': alias owner missing '+label)
  r[2]+=aliases;indexrow(r)
 for label,names in patch.get('merge',{}).items():
  r=lookup(label)
  if r is None:raise ValueError(id+': merge owner missing '+label)
  for other in list(rows):
   if other is not r and norm(other[0])in{norm(s)for s in names}:r[1]=min(r[1],other[1]);r[2]+=[other[0],*other[2]];rows.remove(other)
  r[2]+=names
 namesIndex.clear()
 for r in rows:indexrow(r)
 # Remove collisions, never let an alias silently steal another exact answer.
 canonical={norm(r[0])for r in rows};aliasOwners=collections.defaultdict(set)
 for r in rows:
  for a in r[2]:aliasOwners[norm(a)].add(norm(r[0]))
 for r in rows:r[2]=sorted(set(a for a in r[2]if norm(a)and norm(a)not in canonical and len(aliasOwners[norm(a)])==1))
 for r in rows:r[2]=[a for a in r[2]if norm(a)not in{norm(s)for s in patch.get('removeAliases',[])}]
 for label,points in patch.get('points',{}).items():
  r=lookup(label)
  if r is None:raise ValueError(id+': score owner missing '+label)
  r[1]=points
 if id=='group-q022':
  # A published player name (Haaland, Palmer, Smith Rowe) is not generated
  # initials. Recognize these names before fuzzy matching can suggest an
  # unrelated older athlete. Shared surnames choose one valid familiar owner;
  # full names still distinguish the people and retain their own identities.
  preferred={};canonicalOwners={norm(r[0]):r for r in rows}
  for player in league:
   display=player['display'];key=norm(display)
   if len(key)<4 or re.search(r'[.\d]',display):continue
   r=lookup(player['first']+' '+player['last'])
   if r is None:raise ValueError('League player disappeared during identity merge')
   if key in canonicalOwners and canonicalOwners[key]is not r:continue
   candidate=(r[1],-player['minutes'],player['id'],r,display)
   if key not in preferred or candidate[:3]<preferred[key][:3]:preferred[key]=candidate
  for r in rows:r[2]=[a for a in r[2]if norm(a)not in preferred or preferred[norm(a)][3]is r]
  for _,_,_,r,display in preferred.values():r[2].append(display)
 # Source supplements can add an alias already retained in an older revision.
 # Canonicalize after every supplement so rebuilding is byte-for-byte stable.
 for r in rows:r[2]=sorted(set(a for a in r[2]if norm(a)and norm(a)not in canonical))
 rows.sort(key=lambda r:norm(r[0]));raw=json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode();digest=sha(raw);filename=id+'.'+digest[:16]+'.json.gz';compressed=gzip.compress(raw,mtime=0);out=ROOT/'reviewed-banks'/filename
 if args.check:
  if not out.exists()or gzip.decompress(out.read_bytes())!=raw:changed.append(str(out.relative_to(ROOT)))
 else:out.parent.mkdir(exist_ok=True);out.write_bytes(compressed)
 p.update(patch.get('metadata',{}));p.update(answerDirectory='reviewed-banks',answerFile=filename,answerCount=len(rows),familiarCount=sum(r[1]<=30 for r in rows),identityHash=sha('\n'.join(sorted(canonical)).encode()),answerRepairVersion=1)
 affected.add(id);report.append([id,before,len(rows)])
if args.check and changed:raise SystemExit('Answer repair banks are stale: '+', '.join(changed))
for file,manifest,original,start,end,rows in catalogs:
 if not any(p['id']in affected and owners[p['id']]is p for p in rows):continue
 # Metadata belonging to overridden legacy versions is untouched.
 build=sha(json.dumps(rows,sort_keys=True,ensure_ascii=False).encode())[:16]
 text=original[:start]+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+original[end:]
 if file=='group-question-catalog.js':text=re.sub(r'(export const GROUP_QUESTION_BUILD=)"[^"]+"',lambda m:m[1]+json.dumps(build),text)
 else:
  index=start+len(json.dumps(rows,ensure_ascii=False,separators=(',',':')))
  text=text[:index]+re.sub(r'^,\s*"[^"]+"',','+json.dumps(build),text[index:],count=1)
 path=ROOT/file
 if text!=original:
  changed.append(file)
  if not args.check:path.write_text(text)
 path=ROOT/manifest;m=json.loads(path.read_text());categories=m if isinstance(m,list)else m['categories']
 for entry in categories:
  if entry['id']not in affected or owners[entry['id']]not in rows:continue
  p=owners[entry['id']];raw=gzip.decompress((ROOT/p['answerDirectory']/p['answerFile']).read_bytes());answers=json.loads(raw)
  entry.update(p);entry.update(sha256=sha(raw),downloadBytes=(ROOT/p['answerDirectory']/p['answerFile']).stat().st_size,tiers=dict(collections.Counter(r[1]for r in answers)))
 if not isinstance(m,list):
  m['build']=build
  if 'canonicalEntries'in m:m['canonicalEntries']=sum(p['answerCount']for p in categories)
 output=json.dumps(m,ensure_ascii=False,indent=2)+'\n'
 if output!=path.read_text():
  changed.append(manifest)
  if not args.check:path.write_text(output)
if args.check and changed:raise SystemExit('Answer repairs are stale: '+', '.join(changed))
print(json.dumps({'repairedQuestions':len(affected),'changedFiles':changed,**({}if args.check else {'rows':report})},indent=2))
