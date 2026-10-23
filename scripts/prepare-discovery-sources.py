"""Reduce downloaded public datasets to factual fields used by the builder.
Usage: python3 scripts/prepare-discovery-sources.py /path/to/downloads
No images, biographies, lyrics, summaries, birth dates or contact details retained.
"""
import ast,csv,gzip,json,sys
from pathlib import Path
from collections import defaultdict
src=Path(sys.argv[1]); dest=Path(__file__).resolve().parents[1]/'data-snapshots/discovery';dest.mkdir(parents=True,exist_ok=True)
def read(f):return json.load(gzip.open(src/f))
def csvs(f):return csv.DictReader(open(src/f,encoding='utf-8-sig'))
def save(f,v):
 b=json.dumps(v,ensure_ascii=False,separators=(',',':')).encode();(dest/f).write_bytes(gzip.compress(b,mtime=0));print(f,len(v),len(b),flush=True)
# Steam: full memberships, not just the popular first page. Keep prior names as aliases.
steam=read('steamspy-facts.json.gz'); current={str(r['appID']):r['name'] for r in read('steam-facts.json.gz')};games={};tags={}
for tag,rows in steam.items():
 tags[tag.strip()]=[]
 for k,r in rows.items():
  name=current.get(k) or r['name'];name=name.strip()
  if not name:continue
  tags[tag.strip()].append(k)
  old=games.get(k);pop=max(r.get('positive',0),old[2] if old else 0)
  aliases=sorted(set((old[1] if old else [])+([r['name']] if r['name']!=name else [])))
  games[k]=[name,aliases,pop]
save('steam.json.gz',{'games':games,'tags':tags})
# Worldwide platform/genre membership, including Nintendo and non-Steam games.
world={}
for file in src.glob('all_games_*.csv'):
 for r in csvs(file.name):
  def arr(v):
   try:return json.loads(v)
   except:return []
  k=r['id'];g=world.setdefault(k,[r['name'],set(),set(),0]);g[1].update(arr(r['genres']));g[2].update(arr(r['platforms']))
  try:g[3]=max(g[3],float(r['people_polled']))
  except:pass
save('global-games.json.gz',{k:[v[0],sorted(v[1]),sorted(v[2]),v[3]] for k,v in world.items()})
# One-vote gate excludes empty/unreleased placeholder records; all votes above it retained.
films=[]
filmmap={r['id']:r for r in read('film-facts.json.gz')}
if (src/'movies-recent.csv').exists():
 for r in csvs('movies-recent.csv'):
  if r['adult'].lower()=='true':continue
  old=filmmap.get(r['movie_id'],{});old.update(id=r['movie_id'],title=r['title'],release_date=r['release_date'],status=r['status'],adult=r['adult'],genres=r['genres'].replace('|',', '),production_companies=r['production_companies'].replace('|',', '),vote_count=r['vote_count']);old.setdefault('original_title',r['title']);old.setdefault('keywords','');filmmap[r['movie_id']]=old
for r in filmmap.values():
 try:v=int(float(r['vote_count']))
 except:continue
 if v<1 or not r['release_date'] or r['status']!='Released':continue
 films.append([r['title'],r['original_title'],r['release_date'][:4],r['genres'].split(', '),r['keywords'].split(', '),r['production_companies'].split(', '),v])
save('films.json.gz',films)
shows=[]
for r in read('tvmaze-facts.json.gz'):
 shows.append([r['name'],r['type'],r['genres'],(r['premiered'] or '')[:4],r['weight'] or 0,sorted(set(x['name'] for x in [r['network'],r['webChannel']] if x))])
save('television.json.gz',shows)
save('music.json.gz',[[r['track_name'],r['artists'].split(';'),r['album_name'],r['track_genre'],int(r['popularity'])] for r in csvs('spotify.csv')])
save('nfl.json.gz',[[r['full_name'],r['team'],r['position'],r['season']] for r in read('nfl-roster-facts.json.gz') if r['full_name']])
nba={};tree=ast.parse(open(src/'nba-players.py').read())
for x in tree.body:
 if isinstance(x,ast.Assign) and x.targets[0].id in ['players','wnba_players','teams','wnba_teams']:nba[x.targets[0].id]=ast.literal_eval(x.value)
nba['history']=[[r['Player'].rstrip('*'),r['Tm'],r['Pos'],r['Year'],r['G']] for r in csvs('nba-history.csv') if r['Player'] and r['Year']]
nba['recent']=[[r['player_name'],r['team_abbreviation'],r['season'],r['gp']] for r in csvs('nba-all-seasons.csv')]
nba['current']=[[r['PLAYER_NAME'],r['TEAM_ABBREVIATION'],r['GP']] for r in csvs('nba-player_per_game.csv')]
save('basketball.json.gz',nba)
people={r['playerID']:[r['nameFirst']+' '+r['nameLast'],r['nameGiven']+' '+r['nameLast']] for r in csvs('lahman-People.csv')}
teams={(r['yearID'],r['teamID']):[r['franchID'],r['name']] for r in csvs('lahman-Teams.csv')}
baseball={'people':people,'appearances':[],'awards':[],'allstar':[],'hall':[]}
for r in csvs('lahman-Appearances.csv'):
 if not int(r['G_all'] or 0):continue
 t=teams.get((r['yearID'],r['teamID']),['',r['teamID']]);baseball['appearances'].append([r['playerID'],r['yearID'],*t,int(r['G_all']),[p for p in ['p','c','1b','2b','3b','ss','lf','cf','rf','of','dh'] if int(r['G_'+p] or 0)>0]])
baseball['awards']=[[r['playerID'],r['awardID']] for r in csvs('lahman-AwardsPlayers.csv')]
baseball['allstar']=sorted(set(r['playerID'] for r in csvs('lahman-AllstarFull.csv')))
from collections import Counter
baseball['allstarCounts']=dict(Counter(r['playerID'] for r in csvs('lahman-AllstarFull.csv')))
baseball['hall']=sorted(set(r['playerID'] for r in csvs('lahman-HallOfFame.csv') if r['inducted']=='Y' and r['category']=='Player'))
save('baseball.json.gz',baseball)
wc={}
wc['players']={r['player_id']:[r['given_name'],r['family_name'],r['female'],[p for p in ['goal_keeper','defender','midfielder','forward'] if r[p]=='1']] for r in csvs('worldcup-players.csv')}
wc['squads']=[[r['player_id'],r['team_name'],r['tournament_id']] for r in csvs('worldcup-squads.csv')]
wc['tournaments']=[[r['tournament_id'],r['winner']] for r in csvs('worldcup-tournaments.csv')]
wc['awards']=[[r['player_id'],r['award_name']] for r in csvs('worldcup-award_winners.csv')]
save('worldcup.json.gz',wc)
save('olympics.json.gz',[[r['ID'],r['Name'],r['Sport'],r['Season'],r['Medal'],r['NOC'],r['Year']] for r in csvs('olympics-through-2026.csv')])
