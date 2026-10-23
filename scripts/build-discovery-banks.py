"""Build broad, finite, reproducible categories from reduced factual snapshots.
At most two independent facets; no letter/year permutations, tiny filtered lists,
or retired geographical/credit banks. Popularity admits a category, never caps its
answer inventory. Scores are editorial estimates, not measured response rates.
"""
import gzip,json,re,hashlib,unicodedata,itertools,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; SRC=ROOT/'data-snapshots/discovery'; OUT=ROOT/'discovery-banks';OUT.mkdir(exist_ok=True)
def load(f):return json.load(gzip.open(SRC/(f+'.json.gz')))
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).lower())
def slug(s):return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')
def score(n,levels=(100000,5000,500)):
 return 10 if n>=levels[0] else 30 if n>=levels[1] else 60 if n>=levels[2] else 85
catalog=[]; manifests=[]; fingerprints=set(); rejects=collections.Counter()
def add(key,topic,prompt,family,group,rows,source,minimum=50,known=8,top=2):
 prompt=re.sub(r'\ba ([aeiouAEIOU])',r'an \1',prompt).replace('Name a MLB','Name an MLB').replace('Name a NBA','Name an NBA').replace('Name a NFL','Name an NFL')
 merged={}
 for label,points,aliases in rows:
  label=re.sub(r'\s+',' ',label).strip();k=norm(label)
  if len(k)<2 or len(label)>160 or not re.search('[a-zA-Z]',unicodedata.normalize('NFKD',label)):continue
  if re.search(r'(?i)\b(hentai|porn|fuck|fucking|shit|nigger|nigga|faggot|rape|sex|sexy|sexual|cum|pussy|cock|dick|bitch)\b',label):continue
  a=merged.setdefault(k,[label,points,set()]);a[1]=min(a[1],points);a[2].update(x for x in aliases if isinstance(x,str) and norm(x) and norm(x)!=k and len(x)<=160)
 rows=[[v[0],v[1],sorted(v[2])] for k,v in sorted(merged.items())]
 common=sum(r[1]<=30 for r in rows);famous=sum(r[1]==10 for r in rows)
 if len(rows)<minimum or common<known or famous<top:rejects['size/familiarity']+=1;return
 fingerprint=hashlib.sha256('\n'.join(sorted(merged)).encode()).hexdigest()
 if fingerprint in fingerprints:rejects['identical answer set']+=1;return
 fingerprints.add(fingerprint)
 # A last name is accepted only when unambiguous within this question.
 if family=='sports':
  lasts=collections.Counter(norm(r[0].split()[-1]) for r in rows)
  for row in rows:
   last=row[0].split()[-1]
   if len(norm(last))>=4 and lasts[norm(last)]==1:row[2]=sorted(set(row[2]+[last]))
 owners=collections.defaultdict(set)
 for label,points,aliases in rows:
  for alias in [label]+aliases:owners[norm(alias)].add(norm(label))
 for row in rows:row[2]=sorted({alias for alias in row[2] if norm(alias)!=norm(row[0]) and len(owners[norm(alias)])==1})
 rare=[r for r in rows if r[1]==85]
 if len(rare)>=10:rare[-1][1]=100
 data=json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode();digest=hashlib.sha256(data).hexdigest()[:16];pid='discovery-'+key;name=f'{pid}.{digest}.json.gz';(OUT/name).write_bytes(gzip.compress(data,mtime=0))
 meta=dict(id=pid,topic=topic.upper(),prompt=prompt,family=family,group='discovery-'+group,answerCount=len(rows),answerFile=name,answerDirectory='discovery-banks',funVersion=6,mixed=True,partyEligible=True,dailyEligible=True,ranking='source-familiarity-v1',familiarCount=common,source=source,qualityVersion=1)
 catalog.append(meta);manifests.append(dict(id=pid,answerCount=len(rows),answerHash=digest,identityHash=fingerprint,familiarCount=common,topCount=famous,source=source,answerFile=name,answerDirectory='discovery-banks',sha256=hashlib.sha256(data).hexdigest()))
def combinations(facets,base):
 """Single facets plus two independent facets; reject redundant constraints."""
 for a in facets:yield (a,),base[a]
 for a,b in itertools.combinations(facets,2):
  if facets[a]==facets[b]:continue
  intersection=base[a]&base[b]
  if len(intersection)>=.88*min(len(base[a]),len(base[b])):continue
  yield (a,b),intersection
# Explicit, familiar Steam concepts. Ambiguous marketing/style adjectives stay out.
steam=load('steam');games=steam['games'];sets={k:set(v) for k,v in steam['tags'].items()}
facets=json.loads((SRC/'game-facets.json').read_text());types={t.strip():kind for kind,text in facets.items() for t in text.split('|')}
exclude=set('Atmospheric|Cinematic|Stylized|Realistic|Minimalist|Cute|Colorful|Story Rich|Narrative|Singleplayer|Online Co-Op|Co-op Campaign|Inventory Management|Economy|Resource Management|Transportation|Loot|Nonlinear|Choose Your Own Adventure|Class-Based|Team-Based|Party-Based RPG|Real-Time with Pause|Vehicle Combat|Gothic|Lovecraftian|Noir|Psychological Horror|Alternate History'.split('|'))
active={k:v for k,v in types.items() if k in sets and k not in exclude}
phrase={'RPG':'role-playing','FPS':'first-person shooter','RTS':'real-time strategy','JRPG':'Japanese role-playing','CRPG':'computer role-playing','MMORPG':'massively multiplayer role-playing','MOBA':'multiplayer online battle arena','Pixel Graphics':'pixel-art','Football (Soccer)':'soccer','Football (American)':'American football','Perma Death':'permadeath','Third Person':'third-person','Top-Down':'top-down','Side Scroller':'side-scrolling','Action-Adventure':'action-adventure','Point & Click':'point-and-click','Co-op':'co-op','Local Co-Op':'local co-op','Sci-fi':'science-fiction','Cartoony':'cartoon-style'}
candidates=[]
for tags,ids in combinations(active,sets):
 common=sum(games[k][2]>=5000 for k in ids);top=sum(games[k][2]>=20000 for k in ids)
 if len(ids)>=50 and common>=12 and top>=4:candidates.append((tags,ids,common,top))
# Prefer the broad familiar intersections, rather than accumulating every obscure pair.
candidates.sort(key=lambda x:(len(x[0]),-x[3],-x[2],x[0]))
for tags,ids,common,top in candidates[:1800]:
 ordered=sorted(tags,key=lambda t:({'style':0,'mechanic':1,'theme':2,'genre':3}[active[t]],t));label=' + '.join(phrase.get(t,t).lower() for t in ordered)
 prompt='Name a game on Steam tagged '+(' and '.join('“'+phrase.get(t,t)+'”' for t in ordered))+'.'
 add('steam-'+'-'.join(slug(t) for t in tags),label+' games',prompt,'gaming','steam-'+(next((slug(t) for t in ordered if active[t]=='genre'),'features')),[[games[k][0],score(games[k][2],(20000,5000,500)),games[k][1]] for k in sorted(ids)],'Steam community tags via SteamSpy, snapshot 2026-10-23; full named tag membership. Includes delisted titles.')
print('Steam',len(catalog),flush=True)
# Global console/platform genres: independent all-platform source, not Steam-only.
world=load('global-games');genres={int(r.split(',')[0]):r.strip().split(',',1)[1] for r in (SRC/'genres.csv').read_text().splitlines()[1:]};platforms={int(r.split(',')[0]):r.strip().split(',',1)[1] for r in (SRC/'platforms.csv').read_text().splitlines()}
keep_platforms={4,5,7,8,9,11,12,18,19,20,21,22,23,24,29,32,37,38,41,46,48,49,130,167,169}
genre_ids={4,5,7,8,9,10,11,12,13,14,15,16,24,26,25,30,31,33,34,35,36,2}
for platform in sorted(keep_platforms):
 for genre in [None]+sorted(genre_ids):
  rows=[(v[0],score(v[3],(500,50,5)),[]) for v in world.values() if platform in v[2] and (genre is None or genre in v[1])]
  g=genres.get(genre,'');p=platforms[platform];topic=(g+' · ' if g else '')+p
  add('console-'+str(platform)+('-'+str(genre) if genre else ''),topic,'Name '+('a '+g.lower()+' game' if g else 'a game')+' released for '+p+(' by November 2023.' if platform in {48,49,130,167,169} else '.'),'gaming','console-'+str(platform),rows,'PlayMyData / IGDB platform and genre facts, November 2023 snapshot; CC BY 4.0.',known=10,top=3)
print('With consoles',len(catalog),flush=True)
# Film genre, era and story concepts. Two facets at most; no isolated years.
films=load('films');genre_sets=collections.defaultdict(set);theme_sets=collections.defaultdict(set);company_sets=collections.defaultdict(set);decades=collections.defaultdict(set)
for i,r in enumerate(films):
 for g in r[3]:genre_sets[g].add(i)
 for t in r[4]:theme_sets[t].add(i)
 for c in r[5]:company_sets[c].add(i)
 try:decades[int(r[2])//10*10].add(i)
 except:pass
def filmrows(ids):return [[films[i][0],score(films[i][6],(10000,1000,100)),[films[i][1]]] for i in sorted(ids)]
source='TMDB factual metadata via Asaniczka full-movie dataset, curator version 1097 (ODC-By) plus Evan Christiawan 2010–2025 metadata (Zenodo 21920642, CC BY 4.0). Retrieved 2026-10-23. Released non-adult records with at least one vote; title/genre/keyword facts only.'
for g,ids in sorted(genre_sets.items()):
 if g in ['TV Movie']:continue
 add('film-genre-'+slug(g),g+' movies','Name a '+g.lower()+' movie.','culture','film-genre',filmrows(ids),source)
 for decade in range(1950,2030,10):
  add('film-'+slug(g)+'-'+str(decade),str(decade)+'s '+g,'Name a '+g.lower()+' movie released in the '+str(decade)+'s.','culture','film-era',filmrows(ids&decades[decade]),source)
themes='based on novel or book|biography|musical|concert|sports|christmas|revenge|based on true story|anime|martial arts|coming of age|friendship|sequel|police|found footage|black and white|ghost|high school|zombie|vampire|prison|politics|monster|remake|holiday|alien|superhero|dark comedy|gangster|dog|detective|slasher|film noir|time travel|marriage|cartoon|football (soccer)|stop motion|based on comic|magic|supernatural|anthology|spy|wedding|surrealism|school|based on manga|road trip|investigation|doctor|satire|dystopia|robbery|island|parody|hospital|nature|romantic comedy|fairy tale|dance|space|forest|kung fu|beach|train|dream|hotel|college|escape|neo-noir|lawyer|singer|writer|road movie|post-apocalyptic future|witch|corruption|soldier|survival|desert|mafia|orphan|filmmaking|robot|scientist|slapstick comedy|divorce|haunted house|animal|artist|cat|conspiracy|travel|experiment|gambling|boxing|photographer|journalist|jungle|future|nightmare|mountain|world war i|world war ii|heist|summer|musician|punk rock|samurai|halloween|psychological thriller|dancing|mixed martial arts|competition|werewolf|airplane|motorcycle|dinosaur|curse|rescue|baseball|based on children\'s book|military|basketball|pirate|winter|circus|castle|santa claus|disaster|whodunit|princess|farm|espionage|tragedy|fire|vacation|snow|twins|mistaken identity|alien invasion|rivalry|painter|period drama|photography|pilot|ship|american football|ninja|trial|ballet|sea|transformation|based on tv series|shark|secret agent|memory|hero|cold war|immigrant|historical figure|kaiju|revolution|prince|singing|painting|ufo|vigilante|spacecraft|courtroom|olympic games|wilderness|camping|boat|dragon|submarine|fashion|apocalypse|artificial intelligence|cowboy|battle|ocean|space travel|astronaut|prison escape|cyberpunk|adoption|giant monster|king|treasure|paranormal|casino|technology|clown|university|river|murder mystery|internet|philosophy|journey|disaster movie|bear|cyborg|computer|judge|moon|puppet|inventor|underwater|virtual reality|android|lion|disguise|social media|live action and animation|radio|earthquake|museum|birthday|car race'.split('|')
for t in themes:
 ids=theme_sets.get(t,set());words=t.replace('world war i','World War I').replace('based on','based on')
 prompt='Name a movie '+(words if t.startswith('based on') else 'featuring '+words)+'.'
 if t in ['sequel','remake','anthology','musical','biography','anime','satire','parody','disaster','romantic comedy','dark comedy','psychological thriller','film noir','neo-noir','period drama','road movie','slasher','whodunit','murder mystery']:prompt='Name a movie that is a '+words+'.'
 add('film-theme-'+slug(t),t+' movies',prompt,'culture','film-story',filmrows(ids),source,known=12,top=3)
 for g in ['Action','Adventure','Animation','Comedy','Drama','Family','Fantasy','Horror','Science Fiction','Thriller','Romance']:
  intersection=ids&genre_sets[g]
  if len(intersection)>=.88*min(len(ids) or 1,len(genre_sets[g])):continue
  add('film-'+slug(t)+'-'+slug(g),g+' · '+t,'Name a '+g.lower()+' movie '+(t if t.startswith('based on') else 'featuring '+t)+'.','culture','film-story',filmrows(intersection),source,known=12,top=3)
for c in ['Pixar','Walt Disney Pictures','Walt Disney Animation Studios','DreamWorks Animation','Studio Ghibli','Marvel Studios','Lucasfilm Ltd.','Illumination','A24','Blumhouse Productions','Legendary Pictures','New Line Cinema','Warner Bros. Pictures','Universal Pictures','Paramount Pictures','Columbia Pictures','Metro-Goldwyn-Mayer','20th Century Fox']:
 add('film-studio-'+slug(c),c,'Name a movie with '+c+' credited as a production company.','culture','film-studios',filmrows(company_sets[c]),source,minimum=30,known=8,top=2)
print('With films',len(catalog),flush=True)
# TVmaze genre and first-broadcast facts, including worldwide titles.
tv=load('television');tvsets=collections.defaultdict(set)
for i,r in enumerate(tv):
 for g in r[2]:tvsets[g].add(i)
for g,ids in sorted(tvsets.items()):
 rows=lambda choices:[[tv[i][0],score(tv[i][4],(99,85,50)),[]] for i in sorted(choices)]
 add('tv-'+slug(g),g+' TV shows','Name a TV or streaming show in the '+g.lower()+' genre.','culture','tv-genres',rows(ids),'TVmaze shows API full index through page 383, 2026-10-23. CC BY-SA; attribution in question-sources.html.',known=10,top=3)
 for decade in range(1960,2030,10):
  filtered={i for i in ids if tv[i][3].isdigit() and int(tv[i][3])//10*10==decade}
  add('tv-'+slug(g)+'-'+str(decade),str(decade)+'s '+g+' TV','Name a '+g.lower()+' show that first premiered in the '+str(decade)+'s.','culture','tv-era',rows(filtered),'TVmaze genre and premiere facts; CC BY-SA.',known=10,top=3)
 for g2 in sorted(tvsets):
  if g2<=g:continue
  intersection=ids&tvsets[g2]
  if len(intersection)>=.88*min(len(ids),len(tvsets[g2])):continue
  add('tv-'+slug(g)+'-'+slug(g2),g+' + '+g2+' TV','Name a show classified as both '+g.lower()+' and '+g2.lower()+'.','culture','tv-genres',rows(intersection),'TVmaze genre facts; CC BY-SA.',known=10,top=3)
for channel in ['Netflix','HBO','Hulu','Amazon Prime Video','Disney+','Apple TV+','ABC','CBS','NBC','FOX','BBC One','BBC Two','ITV1','Cartoon Network','Nickelodeon','Disney Channel','Adult Swim','The CW','Comedy Central','PBS','MTV']:
 ids={i for i,r in enumerate(tv) if channel in r[5]}
 add('tv-channel-'+slug(channel),channel+' originals','Name a show originally aired or commissioned by '+channel+'.','culture','tv-channels',[[tv[i][0],score(tv[i][4],(99,85,50)),[]] for i in sorted(ids)],'TVmaze original network/webChannel facts (not current streaming availability); CC BY-SA.',known=10,top=3)
print('With TV',len(catalog),flush=True)
# Music: full named source rows within broad genres, not one artist's obscure B-sides.
music=load('music');mgroups={
 'pop':'pop|dance|dance-pop|power-pop|synth-pop|indie-pop', 'rock':'rock|alt-rock|alternative|hard-rock|punk-rock|rock-n-roll|rockabilly|psych-rock',
 'hip-hop':'hip-hop|rap', 'electronic':'electronic|edm|electro|house|deep-house|progressive-house|trance|techno|dubstep|drum-and-bass',
 'jazz':'jazz', 'classical':'classical|opera|piano', 'country':'country|honky-tonk|bluegrass', 'metal':'metal|heavy-metal|death-metal|black-metal|metalcore',
 'blues':'blues','folk':'folk|singer-songwriter','punk':'punk|punk-rock|hardcore','soul':'soul|r-n-b|gospel','reggae':'reggae|reggaeton|ska|dub','disco':'disco|funk|groove',
 'latin':'latin|latino|salsa|samba|tango|brazil|mpb|sertanejo|pagode','k-pop':'k-pop','j-pop':'j-pop|j-rock|j-idol','acoustic':'acoustic|singer-songwriter', 'ambient':'ambient|chill|new-age',
 'dance':'dance|dancehall|edm|club|house','soundtrack':'disney|anime|show-tunes','indie':'indie|indie-pop|alternative','children\'s':'kids|children', 'singer-songwriter':'singer-songwriter'}
for genre,options in mgroups.items():
 subset=[r for r in music if r[3] in options.split('|')]
 for kind in ['song','artist','album']:
  rows=[]
  for title,artists,album,tag,pop in subset:
   if kind=='song':rows.append([title,score(pop,(80,60,35)),[title+' by '+a for a in artists]])
   elif kind=='artist':rows.extend([a,score(pop,(80,60,35)),[]] for a in artists)
   else:rows.append([album,score(pop,(80,60,35)),[]])
  add('music-'+slug(genre)+'-'+kind,genre+' '+kind+'s','Name '+('an ' if kind in ['artist','album'] else 'a ')+kind+' with '+genre+' music.','culture','music-'+kind,rows,'Maharshi Pandya Spotify tracks snapshot, revision 635b034; BSD. Genre associations and names only; no audio or lyrics.',known=12,top=3)
print('With music',len(catalog),flush=True)
# SPORTS. Career facts, not isolated-season stat quizzes. Names retain historical
# rosters and aliases; dates in prompts explicitly state finite source boundaries.
def personrow(name,years=0,aliases=(),fame=False):return [name,10 if fame or years>=15 else 30 if years>=6 else 60 if years>=2 else 85,list(aliases)]
nfl=load('nfl');nflpeople={}
for name,team,pos,year in nfl:
 p=nflpeople.setdefault(norm(name),{'name':name,'years':set(),'teams':set(),'positions':set()});p['years'].add(year);p['positions'].add(pos)
 if team in ['HOU','HST'] and year<1997:team='TEN'
 elif team in ['BAL','BLT'] and 1953<=year<=1983:team='IND'
 else:team={'SD':'LAC','OAK':'LV','RAI':'LV','STL':'LAR','RAM':'LAR','LA':'LAR','PHO':'ARI','ARZ':'ARI','CHC':'ARI','SL':'ARI','CHB':'CHI','BOS':'NE','CLV':'CLE'}.get(team,team)
 p['teams'].add(team)
nflstars=set(map(norm,'Tom Brady|Patrick Mahomes|Peyton Manning|Eli Manning|Aaron Rodgers|Josh Allen|Lamar Jackson|Joe Burrow|Joe Montana|Jerry Rice|Randy Moss|Rob Gronkowski|Travis Kelce|Derrick Henry|Saquon Barkley|Christian McCaffrey|Justin Jefferson|Tyreek Hill|CeeDee Lamb|Micah Parsons|Myles Garrett|Aaron Donald|Ray Lewis|Lawrence Taylor|Walter Payton|Barry Sanders|Emmitt Smith|Deion Sanders|Brett Favre|Dan Marino|Drew Brees|Troy Aikman|Terry Bradshaw|Jalen Hurts|Jayden Daniels|Brock Purdy|Justin Herbert|Caleb Williams|Drake Maye|Bo Nix|Archie Manning|Marshawn Lynch|Adrian Peterson|LaDainian Tomlinson|Tony Gonzalez|JJ Watt|TJ Watt|J.J. Watt|T.J. Watt|Odell Beckham Jr.|Davante Adams|Stefon Diggs|Jaxon Smith-Njigba|Cooper Kupp|Puka Nacua|Amon-Ra St. Brown|Bijan Robinson|Jahmyr Gibbs'.split('|')))
def nrows(ps):return [personrow(p['name'],len(p['years']),[re.sub(r'\s+(Jr\.?|Sr\.?|II|III|IV)$','',p['name'])],norm(p['name']) in nflstars) for p in ps]
ns='nflverse annual rosters 1920–2026; includes AFL, offseason and practice rosters. Names, positions and roster membership only.'
add('nfl-players','NFL players','Name a player who has been on an NFL or AFL roster (1920–2026).','sports','football',nrows(nflpeople.values()),ns)
positions={'quarterback':{'QB'},'running back':{'RB','FB'},'wide receiver':{'WR'},'tight end':{'TE'},'offensive lineman':{'OL','T','G','C'},'defensive lineman':{'DL','DE','DT','NT'},'linebacker':{'LB','ILB','OLB','MLB'},'defensive back':{'DB','CB','SS','FS','S'},'kicker or punter':{'K','P'},'cornerback':{'CB'},'safety':{'S','SS','FS'}}
for label,ps in positions.items():add('nfl-'+slug(label),label+'s','Name an NFL or AFL '+label+' (1920–2026).','sports','football',nrows(p for p in nflpeople.values() if p['positions']&ps),ns)
nflteams={'ARI':'Cardinals','ATL':'Falcons','BAL':'Ravens','BUF':'Bills','CAR':'Panthers','CHI':'Bears','CIN':'Bengals','CLE':'Browns','DAL':'Cowboys','DEN':'Broncos','DET':'Lions','GB':'Packers','HOU':'Texans','IND':'Colts','JAX':'Jaguars','KC':'Chiefs','LV':'Raiders','LAC':'Chargers','LAR':'Rams','MIA':'Dolphins','MIN':'Vikings','NE':'Patriots','NO':'Saints','NYG':'Giants','NYJ':'Jets','PHI':'Eagles','PIT':'Steelers','SF':'49ers','SEA':'Seahawks','TB':'Buccaneers','TEN':'Titans / Oilers','WAS':'Washington Commanders'}
for team,label in nflteams.items():add('nfl-team-'+team.lower(),label+' players','Name a player on the '+label+' franchise roster by 2026. Earlier team names count.','sports','football-teams',nrows(p for p in nflpeople.values() if team in p['teams']),ns)
# NBA: all-name index plus historical seasons. Team/position prompts stop at 2023
# because the 2024–25 career bridge has not been verified; no silent missing years.
nba=load('basketball');nbap={}
for _,last,first,name,active in nba['players']:nbap[norm(name)]={'name':name,'years':set(),'teams':set(),'pos':set(),'active':active}
for name,team,pos,year,gp in nba['history']:
 p=nbap.setdefault(norm(name),{'name':name,'years':set(),'teams':set(),'pos':set(),'active':False});p['years'].add(int(float(year)));p['teams'].add(team);p['pos'].update(pos.split('-'))
for name,team,season,gp in nba['recent']:
 p=nbap.setdefault(norm(name),{'name':name,'years':set(),'teams':set(),'pos':set(),'active':True});p['years'].add(int(season[:4])+1);p['teams'].add(team)
nbastars=set(map(norm,'Michael Jordan|LeBron James|Kobe Bryant|Stephen Curry|Kevin Durant|Shaquille O\'Neal|Magic Johnson|Larry Bird|Wilt Chamberlain|Bill Russell|Kareem Abdul-Jabbar|Tim Duncan|Allen Iverson|Dwyane Wade|Dirk Nowitzki|Giannis Antetokounmpo|Luka Doncic|Luka Dončić|Nikola Jokic|Nikola Jokić|Joel Embiid|Jayson Tatum|Jaylen Brown|Jalen Brunson|Shai Gilgeous-Alexander|Victor Wembanyama|Anthony Edwards|Ja Morant|Kyrie Irving|James Harden|Russell Westbrook|Chris Paul|Damian Lillard|Anthony Davis|Devin Booker|Donovan Mitchell|Cade Cunningham|Chet Holmgren|Paul George|Kawhi Leonard|Karl-Anthony Towns|LaMelo Ball|Cooper Flagg|Bill Walton|Charles Barkley|Patrick Ewing|Hakeem Olajuwon|Kevin Garnett|Paul Pierce|Vince Carter|Tracy McGrady|Steve Nash|Jason Kidd'.split('|')))
def brows(ps):return [personrow(p['name'],len(p['years']),fame=norm(p['name']) in nbastars) for p in ps]
bs='NBA all-player index (nba_api) plus Basketball Reference historical season facts and Justinas NBA players 1996–2023 (NBA.com source); season boundary explicit for team prompts.'
add('nba-players','NBA players','Name someone who has played in the NBA.','sports','basketball',brows(nbap.values()),bs)
add('wnba-players','WNBA players','Name someone who has played in the WNBA.','sports','basketball',[[p[3],10 if norm(p[3]) in set(map(norm,['Caitlin Clark','Angel Reese','Sabrina Ionescu','A’ja Wilson','A\'ja Wilson','Breanna Stewart','Diana Taurasi','Sue Bird','Lisa Leslie','Candace Parker','Maya Moore','Kelsey Plum','Paige Bueckers','Napheesa Collier'])) else 30 if p[4] else 60,[]] for p in nba['wnba_players']],bs)
for pos,label in [('G','guard'),('F','forward'),('C','center')]:
 add('nba-position-'+pos.lower(),'NBA '+label+'s','Name an NBA '+label+' who appeared in a season before 2018.','sports','basketball',brows(p for p in nbap.values() if pos in p['pos']),bs)
teamcodes={'ATL':{'ATL','STL','MLH','TRI'},'BOS':{'BOS'},'BRK':{'BRK','BKN','NJN','NYN','NJA'},'CHO':{'CHO','CHA','CHH'},'CHI':{'CHI'},'CLE':{'CLE'},'DAL':{'DAL'},'DEN':{'DEN'},'DET':{'DET','FTW'},'GSW':{'GSW','SFW','PHW'},'HOU':{'HOU','SDR'},'IND':{'IND'},'LAC':{'LAC','SDC','BUF'},'LAL':{'LAL','MNL'},'MEM':{'MEM','VAN'},'MIA':{'MIA'},'MIL':{'MIL'},'MIN':{'MIN'},'NOP':{'NOP','NOH','NOK'},'NYK':{'NYK'},'OKC':{'OKC','SEA'},'ORL':{'ORL'},'PHI':{'PHI','SYR'},'PHO':{'PHO','PHX'},'POR':{'POR'},'SAC':{'SAC','KCK','KCO','CIN','ROC'},'SAS':{'SAS'},'TOR':{'TOR'},'UTA':{'UTA','NOJ'},'WAS':{'WAS','WSB','CAP','BAL','CHZ','CHP'}}
teamnames={'BRK':'Brooklyn Nets','CHO':'Charlotte Hornets','PHO':'Phoenix Suns'}
for r in nba['teams']:teamnames[r[1]]=r[5]
for team,codes in teamcodes.items():
 label=teamnames[team]
 add('nba-team-'+team.lower(),label+' players','Name a '+label+' franchise player from 2022–23 or earlier. Previous team names count.','sports','basketball-teams',brows(p for p in nbap.values() if p['teams']&codes),bs)
# Major League Baseball. Appearances through 2025; not merely draft/signing lists.
mlb=load('baseball');bp={k:{'name':v[0],'aliases':[v[1]],'years':set(),'teams':set(),'positions':set()} for k,v in mlb['people'].items()}
latest={}
for pid,year,franchise,team,gamesplayed,pos in mlb['appearances']:
 if pid not in bp:continue
 p=bp[pid];p['years'].add(int(year));p['teams'].add(franchise);p['positions'].update(pos)
 if franchise not in latest or latest[franchise][0]<int(year):latest[franchise]=(int(year),team)
# Lahman retains an old Angels display label; official MLB directory uses this name.
if 'ANA' in latest:latest['ANA']=(latest['ANA'][0],'Los Angeles Angels')
star=set(mlb['hall'])|{k for k,n in mlb.get('allstarCounts',{}).items() if n>=6};awards=collections.defaultdict(set)
for pid,award in mlb['awards']:awards[award].add(pid)
def mrows(ids):return [personrow(bp[k]['name'],len(bp[k]['years']),bp[k]['aliases'],k in star) for k in ids if k in bp and bp[k]['years']]
ms='Sean Lahman Baseball Database through 2025, via Rdatasets/Lahman: People, Appearances, Teams, awards, AllstarFull and HallOfFame. Actual appearances; franchise relocation history included.'
add('mlb-players','MLB players','Name someone who has played Major League Baseball (through 2025).','sports','baseball',mrows(bp),ms)
for pos,label in [('p','pitcher'),('c','catcher'),('1b','first baseman'),('2b','second baseman'),('3b','third baseman'),('ss','shortstop'),('of','outfielder'),('dh','designated hitter')]:add('mlb-'+pos,'MLB '+label+'s','Name an MLB '+label+' (through 2025).','sports','baseball',mrows(k for k,v in bp.items() if pos in v['positions']),ms)
for key,label in [('hall','Baseball Hall of Fame inductee'),('allstar','MLB All-Star')]:add('mlb-'+key,label+'s','Name a '+('player inducted into the Baseball Hall of Fame by 2025.' if key=='hall' else 'player selected as an MLB All-Star by 2025.'),'sports','baseball',mrows(mlb[key]),ms)
for a in ['Most Valuable Player','Cy Young Award','Rookie of the Year','Gold Glove','Silver Slugger','World Series MVP','Hank Aaron Award']:
 add('mlb-award-'+slug(a),a+' winners','Name a player who has won the MLB '+a+' (through 2025).','sports','baseball-awards',mrows(awards[a]),ms,minimum=30)
for team,(year,label) in sorted(latest.items()):
 if year<2025:continue
 add('mlb-team-'+team.lower(),label+' players','Name a player who appeared for the '+label+' franchise by 2025. Earlier team names count.','sports','baseball-teams',mrows(k for k,v in bp.items() if team in v['teams']),ms)
# FIFA World Cup: explicit source-era boundaries, including men's and women's squads.
wc=load('worldcup');wp={};winners=dict(wc['tournaments'])
for k,(given,last,female,pos) in wc['players'].items():wp[k]={'name':('' if given in ['not applicable','NA'] else given+' ')+last,'aliases':[last] if not given else [],'female':female=='1','pos':set(pos),'teams':set(),'win':False,'tournaments':set()}
for pid,team,tourn in wc['squads']:
 if pid in wp:p=wp[pid];p['teams'].add(team);p['win']|=winners.get(tourn)==team;p['tournaments'].add(tourn)
wstars=set(map(norm,'Lionel Messi|Cristiano Ronaldo|Ronaldo|Pelé|Diego Maradona|Zinedine Zidane|Kylian Mbappé|Neymar|Harry Kane|Luka Modrić|Marta|Mia Hamm|Alex Morgan|Megan Rapinoe|Abby Wambach|Birgit Prinz|Michelle Akers|Christine Sinclair|Carli Lloyd|Hope Solo|Sun Wen|Sam Kerr|Robert Lewandowski|Luis Suárez|Mohamed Salah|Didier Drogba|Thierry Henry|Ronaldinho|Rivaldo|David Beckham|Wayne Rooney|Andrés Iniesta|Xavi|Sergio Ramos|Iker Casillas|Manuel Neuer|Thomas Müller|Franz Beckenbauer|Miroslav Klose|Gerd Müller|Johan Cruyff|Paolo Maldini|Gianluigi Buffon|Roberto Baggio|Zlatan Ibrahimović'.split('|')))
def wrows(ps):return [personrow(p['name'],len(p['tournaments'])*3,p['aliases'],norm(p['name']) in wstars) for p in ps]
ws='J. Fjelstul World Cup Database: men 1930–2022, women 1991–2019. Squad membership, positions, awards and tournament winners, not just match appearances.'
for female,era in [(False,'men’s, 1930–2022'),(True,'women’s, 1991–2019')]:
 subset=[p for p in wp.values() if p['female']==female and p['tournaments']];gender='women' if female else 'men'
 add('worldcup-'+gender,'World Cup players · '+gender,'Name a player named to a FIFA World Cup squad ('+era+').','sports','soccer',wrows(subset),ws)
 add('worldcup-winners-'+gender,'World Cup winners · '+gender,'Name a player on a winning FIFA World Cup squad ('+era+').','sports','soccer',wrows(p for p in subset if p['win']),ws)
 for pos,label in [('goal_keeper','goalkeeper'),('defender','defender'),('midfielder','midfielder'),('forward','forward')]:add('worldcup-'+gender+'-'+pos,'World Cup '+label+'s · '+gender,'Name a '+label+' named to a FIFA World Cup squad ('+era+').','sports','soccer',wrows(p for p in subset if pos in p['pos']),ws)
 for team in ['Argentina','Brazil','France','Germany','West Germany','England','Italy','Spain','Portugal','Netherlands','Uruguay','Mexico','United States','Japan','Canada','Australia','Sweden','Norway','China PR','Nigeria','South Korea','Cameroon','Ghana','Senegal','Croatia','Belgium','Denmark','Switzerland','Poland','Morocco','Colombia','Chile']:
  add('worldcup-'+gender+'-'+slug(team),team+' World Cup squad · '+gender,'Name a player named to a '+team+' World Cup squad ('+era+').','sports','soccer-teams',wrows(p for p in subset if team in p['teams']),ws,known=8,top=2)
# Olympic history includes the five additional Games through Milano-Cortina 2026.
oly=load('olympics');op={}
aliases={'Michael Fred Phelps, II':['Michael Phelps'],'Michael Fred Phelps II':['Michael Phelps'],'Usain St. Leo Bolt':['Usain Bolt'],'Kathleen Genevieve Ledecky':['Katie Ledecky'],'Michael Jeffrey Jordan':['Michael Jordan'],'Simone Arianne Biles':['Simone Biles'],'James Cleveland "Jesse" Owens':['Jesse Owens'],'Carlton Frederick "Carl" Lewis':['Carl Lewis'],'Nadia Elena Comăneci':['Nadia Comaneci']}
for pid,name,sport,season,medal,noc,year in oly:
 if sport in ['Art Competitions','Alpinism','Aeronautics']:continue
 p=op.setdefault(pid,{'name':name,'sports':set(),'seasons':set(),'years':set(),'medals':[],'aliases':set(aliases.get(name,[]))});p['sports'].add(sport);p['seasons'].add(season);p['years'].add(year);p.setdefault('sportmedals',{}).setdefault(sport,[])
 if medal in ['Gold','Silver','Bronze']:p['medals'].append(medal);p['sportmedals'][sport].append(medal)
 # Natural short full name plus quoted nickname, where present. No guessed initials.
 clean=re.sub(r'\s*\([^)]*\)|\s*"[^"]*"','',name).strip();words=clean.replace(',','').split()
 if len(words)>2:p['aliases'].add(words[0]+' '+words[-1])
 match=re.search(r'"([^"]+)"',name)
 if match and words:p['aliases'].add(match.group(1)+' '+words[-1])
def orows(ps):return [[p['name'],10 if len(p['medals'])>=5 else 30 if p['medals'] else 60 if len(p['years'])>=2 else 85,sorted(p['aliases'])] for p in ps]
os='Chester Ismay / ModernDive olympicAthletes 0.5.10, Olympedia and R. Griffin Olympic_history; 1896–Milano-Cortina 2026. CC BY 4.0. Medal corrections follow retained snapshot.'
add('olympic-athletes','Olympians','Name an athlete who has competed in an Olympic sport (through the 2026 Winter Games).','sports','olympics',orows(op.values()),os)
add('olympic-medalists','Olympic medalists','Name an Olympic medal-winning athlete (through the 2026 Winter Games).','sports','olympics',orows(p for p in op.values() if p['medals']),os)
add('olympic-gold','Olympic gold medalists','Name an Olympic gold medal-winning athlete (through the 2026 Winter Games).','sports','olympics',orows(p for p in op.values() if 'Gold' in p['medals']),os)
for season in ['Summer','Winter']:
 add('olympic-'+season.lower(),season+' Olympians','Name an athlete from the '+season+' Olympics (through 2026).','sports','olympics',orows(p for p in op.values() if season in p['seasons']),os)
for sport in sorted(set(r[2] for r in oly)-{'Art Competitions','Alpinism','Aeronautics'}):
 subset=[p for p in op.values() if sport in p['sports']]
 for medal in [False,True]:
  add('olympic-'+slug(sport)+('-medalists' if medal else ''),'Olympic '+sport+(' medalists' if medal else ''),'Name an Olympic '+sport.lower()+' '+('medalist' if medal else 'athlete')+' (through 2026).','sports','olympic-sports',orows(p for p in subset if not medal or p['sportmedals'].get(sport)),os,known=10,top=2)

# Official current team lists, checked 2026-10-23. One broad prompt per league.
nhl="Anaheim Ducks|Boston Bruins|Buffalo Sabres|Calgary Flames|Carolina Hurricanes|Chicago Blackhawks|Colorado Avalanche|Columbus Blue Jackets|Dallas Stars|Detroit Red Wings|Edmonton Oilers|Florida Panthers|Los Angeles Kings|Minnesota Wild|Montréal Canadiens|Nashville Predators|New Jersey Devils|New York Islanders|New York Rangers|Ottawa Senators|Philadelphia Flyers|Pittsburgh Penguins|San Jose Sharks|Seattle Kraken|St. Louis Blues|Tampa Bay Lightning|Toronto Maple Leafs|Utah Mammoth|Vancouver Canucks|Vegas Golden Knights|Washington Capitals|Winnipeg Jets".split('|')
add('nhl-teams','NHL teams','Name a current NHL team (2026–27).','sports','sports-teams',[[n,10 if n in ['Carolina Hurricanes','Boston Bruins','New York Rangers','Toronto Maple Leafs','Edmonton Oilers','Pittsburgh Penguins','Chicago Blackhawks','Detroit Red Wings'] else 30,[n.split(' ',1)[1]]+{'Columbus Blue Jackets':['Blue Jackets'],'Detroit Red Wings':['Red Wings'],'Toronto Maple Leafs':['Maple Leafs'],'Vegas Golden Knights':['Golden Knights']}.get(n,[])] for n in nhl],'NHL official team directory: https://www.nhl.com/info/teams/ (2026-10-23). Names only.',minimum=30)
add('nba-teams','NBA teams','Name an NBA team.','sports','sports-teams',[[r[5],10 if r[1] in ['LAL','BOS','GSW','CHI','NYK','CLE'] else 30,[r[2],r[1]]] for r in nba['teams']],'NBA official teams / nba_api static index, 2026-10-23.',minimum=30)
add('mlb-teams','MLB teams','Name a current MLB team (2026).','sports','sports-teams',[[label,10 if any(n in label for n in ['Yankees','Dodgers','Red Sox','Cubs','Mets','Braves']) else 30,{'Boston Red Sox':['Red Sox'],'Chicago White Sox':['White Sox'],'Toronto Blue Jays':['Blue Jays']}.get(label,[])] for year,label in latest.values() if year==2025],'MLB official team directory and Lahman 2025 Teams. https://www.mlb.com/team',minimum=30)

print('With sports',len(catalog),collections.Counter(p['family'] for p in catalog),flush=True)
# Stable metadata and independently compressed, content-addressed banks.
catalog.sort(key=lambda p:p['id']);manifests.sort(key=lambda p:p['id']);encoded=json.dumps(catalog,ensure_ascii=False,separators=(',',':'));build=hashlib.sha256(encoded.encode()).hexdigest()[:16]
(ROOT/'discovery-question-catalog.js').write_text('// Generated by scripts/build-discovery-banks.py. Facts and licenses: question-sources.html.\nimport {createDiscoveryCatalog} from "./fun-bank-loader.js";\nexport const DISCOVERY_BUILD='+json.dumps(build)+';\nexport const DISCOVERY_PACKS=createDiscoveryCatalog('+encoded+',DISCOVERY_BUILD);\n')
(ROOT/'discovery-manifest.json').write_text(json.dumps(manifests,ensure_ascii=False,indent=2)+'\n')
active_files={p['answerFile'] for p in catalog}
for f in OUT.glob('*.json.gz'):
 if f.name not in active_files:f.unlink()
print(json.dumps({'build':build,'questions':len(catalog),'answers':sum(p['answerCount'] for p in catalog),'sports':sum(p['family']=='sports' for p in catalog),'minAnswers':min(p['answerCount'] for p in catalog),'maxAnswers':max(p['answerCount'] for p in catalog),'rejected':rejects}),flush=True)
