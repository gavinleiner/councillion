#!/usr/bin/env python3
"""One complete all-time player inventory per real franchise, not per season."""
import collections,gzip,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data-snapshots/authored'
source=json.load(gzip.open(DATA/'sources/nba-franchise-rosters.json.gz'))
spec=json.loads((DATA/'nba-franchise-specifications.json').read_text())['questions']
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def clean(s):
 s=re.sub(r'\s*\(formerly [^)]*\)','',s)
 old=None
 while old!=s:
  old=s;s=re.sub(r'\s*\(#[^)]*\)\s*$','',s);s=re.sub(r'^[\^*+†‡]+\s*|\s*[\^*+†‡]+$','',s).strip()
 return s
def number(v):
 try:return int(v.replace(',',''))
 except(ValueError,AttributeError):return None
def tenure(fields):
 values=[]
 for f in fields:
  if number(f.get('yrs'))is not None:values.append(number(f['yrs']));continue
  years=f.get('years','');ranges=re.findall(r'(\d{4})\s*[–-]\s*(\d{4})',years)
  if ranges:values.append(sum(max(1,int(b)-int(a))for a,b in ranges))
  elif years:values.append(len(set(re.findall(r'\b\d{4}\b',years))))
 return max(values,default=0)
trans=str.maketrans({'Đ':'Dj','đ':'dj','Ł':'L','ł':'l','Ø':'O','ø':'o','Ð':'D','ð':'d','Þ':'Th','þ':'th'})
questions=[];checks=[];holds={}
for q in spec:
 src=[s for s in source['teams']if s['team']==q['team']or q['team']=='Oklahoma City Thunder'and s['team']=='Seattle SuperSonics'];names={};held={}
 for t in src:
  for p in t['players']:
   label=clean(p['name']);key=norm(label)
   # The Lakers source has a distinct NBL-only table. This question's
   # NBA/BAA/ABA scope does not silently import a different league.
   if q['team']=='Los Angeles Lakers'and all('collegeteam'in f and 'predraftteam'not in f for f in p['appearanceFields']):held[label]='NBL-only source table; outside NBA/BAA/ABA scope.';continue
   flds=p['appearanceFields'];games=[number(f.get('gp'))for f in flds if number(f.get('gp'))is not None];pts=[number(f.get('pts'))for f in flds if number(f.get('pts'))is not None]
   player=names.setdefault(key,{'label':label,'aliases':set(),'gp':0,'pts':0,'seasons':0,'links':set()});player['gp']=max([player['gp'],*games]);player['pts']=max([player['pts'],*pts]);player['seasons']=max(player['seasons'],tenure(flds));player['links'].update(p['links'])
   translit=label.translate(trans)
   if norm(translit)!=key:player['aliases'].add(translit)
   simple=re.sub(r'\s+(?:Jr\.?|Sr\.?|II|III|IV)$','',label)
   if simple!=label:player['aliases'].add(simple)
 for label,aliases in q['aliases'].items():
  k=norm(label)
  if k not in names:continue
  for alias in aliases:
   if norm(alias)!=k:names[k]['aliases'].add(alias)
 # A full source name always wins. A shared surname uses the player with
 # greater franchise participation rather than offering a choice dialog.
 surnames=collections.defaultdict(list)
 for k,p in names.items():
  surname=re.sub(r'\s+(?:Jr\.?|Sr\.?|II|III|IV)$','',p['label']).split()[-1]
  if len(norm(surname))>=4:surnames[norm(surname)].append((surname,k))
 for options in surnames.values():
  surname,k=max(options,key=lambda v:(names[v[1]]['gp'],names[v[1]]['pts'],names[v[1]]['label']))
  if norm(surname)not in names:names[k]['aliases'].add(surname)
 owners=collections.defaultdict(list)
 for k,p in names.items():
  for a in p['aliases']:
   if norm(a)not in names:owners[norm(a)].append(k)
 exact={k:k for k in names}
 for a,ks in owners.items():exact[a]=max(ks,key=lambda k:(names[k]['gp'],names[k]['pts'],names[k]['label']))
 missing=[s for s in q['familiar']if norm(s)not in exact];assert not missing,(q['team'],'missing independent familiar players',missing)
 assert all(norm(s)not in exact for s in q['exclude']),(q['team'],'known non-player boundary became valid')
 common={exact[norm(s)]for s in q['familiar']}
 low={exact[norm(s)]for s in q['familiar'][:6]}
 # Rarity is relative to the player's participation on THIS franchise.
 # A one-game veteran can be a deep cut even when famous on another team.
 rare=min((k for k in names if k not in common),key=lambda k:(names[k]['gp']or 100000,names[k]['pts'],names[k]['label']))
 tiers=collections.defaultdict(list)
 for k,p in sorted(names.items()):
  if p['gp']:ordinary=30 if p['gp']>=250 else 60 if p['gp']>=50 else 85
  elif p['pts']:ordinary=30 if p['pts']>=2500 else 60 if p['pts']>=500 else 85
  else:ordinary=30 if p['seasons']>=5 else 60 if p['seasons']>=2 else 85
  points=10 if k in low else 100 if k==rare else 30 if k in common else ordinary
  tiers[str(points)].append({'label':p['label'],'aliases':sorted(a for a in p['aliases']if exact.get(norm(a))==k)})
 key=re.sub('[^a-z0-9]+','-',q['team'].lower())+'-players'
 prompt='Name a player who has played for the '+q['team']+'.'
 if q['team']=='Oklahoma City Thunder':prompt='Name a player who has played for the Thunder or Seattle SuperSonics.'
 scope='At least one first-team NBA, BAA or ABA game for this franchise counts, past or present. Coaches, draft rights and preseason-only appearances do not. '+q['history']
 questions.append(dict(id='authored-'+key,concept=key,family='sports',topic='FRANCHISE HISTORY',prompt=prompt,scope=scope.strip(),format='whole-franchise-roster',rationale='A complete all-time roster for one established franchise, with independent recognizable-player inputs. Former city/team names expand the same inventory; no per-year, position, tag or opponent slices create extra questions.',familiar=q['familiar'],exclude=q['exclude'],references=q['references'],answers=dict(tiers)))
 checks.append({'id':'authored-'+key,'franchise':q['team'],'canonicalPlayers':len(names),'sourceRosters':len(src),'familiarInputs':len(q['familiar']),'heldPlayers':len(held),'rareAnchor':names[rare]['label'],'sourceHtmlSha256':[s['htmlSha256']for s in src]});holds[key]=held
files={DATA/'batches/15-nba-franchise-rosters.json':json.dumps({'version':1,'questions':questions},ensure_ascii=False,separators=(',',':'))+'\n',DATA/'nba-franchise-checks.json':json.dumps(checks,ensure_ascii=False,indent=2)+'\n',DATA/'nba-franchise-holds.json':json.dumps(holds,ensure_ascii=False,indent=2)+'\n'}
for p,t in files.items():
 if '--check'in sys.argv:assert p.read_text()==t,p
 else:p.write_text(t)
print([(x['franchise'],x['canonicalPlayers'])for x in checks])
