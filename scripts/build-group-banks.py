"""Build the group's finite, source-backed pool from its 98 approved styles.

Use PYTHONPATH pointing at the existing wordfreq runtime. No network or model
calls occur during play. Every generated membership has a recorded predicate;
popularity gates admission, never truncates an admitted answer inventory.
"""
from pathlib import Path
import argparse,collections,functools,gzip,hashlib,itertools,json,re,unicodedata
from wordfreq import zipf_frequency

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'data-snapshots'
OUT=ROOT/'group-banks'
parser=argparse.ArgumentParser();parser.add_argument('--probe',action='store_true');parser.add_argument('--reselect',action='store_true',help='Explicitly replace the frozen editorial selection');parser.add_argument('--refresh-held',action='store_true',help='Preserve surviving frozen IDs and replace held prompts with authored accessible alternatives');parser.add_argument('--candidate-report',type=Path,help='Write candidate metadata for an offline editorial review');args=parser.parse_args()
def load(path):
 p=SRC/path
 return json.loads(gzip.decompress(p.read_bytes()) if p.suffix=='.gz' else p.read_text())
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower())
def slug(s):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower()).strip('-')
def sha(b):return hashlib.sha256(b).hexdigest()
def literal(file,marker):return json.JSONDecoder().raw_decode((ROOT/file).read_text().split(marker,1)[1])[0]
def words(s):return set(re.findall(r"[a-z]+(?:'[a-z]+)?",unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()))
@functools.lru_cache(maxsize=200000)
def freq(s):return zipf_frequency(s.lower(),'en')
BLOCK=re.compile(r'\b(porn|hentai|nigger|faggot|rape|raping|incest|orgasm|masturbation|pussy|nude|nudes|sexual|sex|cum|fucking|fuck|shit)\b',re.I)
def valid(s):return 0<len(norm(s)) and len(s)<170 and not BLOCK.search(s) and not re.match(r'^(?:Q\d+|unknown|unnamed|Team Mate \d|Enemy \d|NPC \d|\?+)',s,re.I)
def gamevalid(s):return valid(s) and not re.search(r'\b(?:demo|playtest|soundtrack|artbook|dedicated server|benchmark|sdk|software development kit)\b',s,re.I)
def row(label,points=60,aliases=()):return [str(label).strip(),points,list(aliases)]
def points(pop,levels):return 10 if pop>=levels[0] else 30 if pop>=levels[1] else 60 if pop>=levels[2] else 85
VERSION_WORDS=re.compile(r'\b(?:remaster\w*|remix\w*|mix|edit|version|live|acoustic|slowed|reverb\w*|sped|radio|mono|stereo|instrumental|karaoke|cover|bonus|anniversary|deluxe|recording)\b',re.I)
def songtitle(title):
 clean=title.strip()
 while ' - ' in clean and VERSION_WORDS.search(clean.rsplit(' - ',1)[1]):clean=clean.rsplit(' - ',1)[0].strip()
 clean=re.sub(r'\s*[\[(]([^\])]+)[\])]',lambda m:'' if VERSION_WORDS.search(m[1]) or re.match(r'(?:feat\.?|ft\.?|with)\b',m[1],re.I) else m[0],clean).strip()
 clean=re.sub(r'\s+(?:feat\.|ft\.)\s+.*$','',clean,flags=re.I).strip()
 return clean or title
legacy={}
for file,marker in [('fun-question-catalog.js','createFunCatalog('),('variety-question-catalog.js','createExtraCatalog('),('discovery-question-catalog.js','createDiscoveryCatalog(')]:
 for m in literal(file,marker):legacy[m['id']]=m
table=literal('question-answers.js','export const ANSWER_ROWS=')
inline={m['id']:[table[i] for i in ids] for m,ids in literal('question-catalog.js','const rows=')}
for m,ids in literal('question-catalog.js','const rows='):legacy[m['id']]=m
for m,rs in literal('expanded-banks.js','const rows='):legacy[m['id']]=m;inline[m['id']]=rs
@functools.lru_cache(maxsize=200)
def bankrows(id):
 if id in inline:return inline[id]
 m=legacy[id];return json.loads(gzip.decompress((ROOT/m.get('answerDirectory','question-banks')/m['answerFile']).read_bytes()))
def existing(ids):return [list(r) for id in ids for r in bankrows(id)]
def named(labels,common=()):
 common={norm(s) for s in common}
 return [row(s,10 if norm(s) in common else 30 if freq(s)>=4.1 else 60 if freq(s)>=3.1 else 85) for s in labels]

candidates=[];rejected=collections.Counter();fingerprints={};promptkeys=set();equivalents={}
def add(id,prompt,family,group,rows,source,*,priority=0,minimum=30,known=8,predicate=None,reviewId=None,scope=None):
 merged={}
 for label,p,aliases in rows:
  label=re.sub(r'\s+',' ',label).strip();k=norm(label)
  if not valid(label):continue
  if k not in merged:merged[k]=[label,p,set()]
  old=merged[k];old[1]=min(p,old[1]);old[2].update([a for a in aliases if isinstance(a,str) and valid(a)])
  if old[0]!=label:old[2].add(label)
 core=sum(v[1]<=30 for v in merged.values())
 if len(merged)<minimum or core<known:rejected['too few answers or familiar core']+=1;return
 pk=norm(prompt);fp=sha('\n'.join(sorted(merged)).encode())
 if pk in promptkeys:rejected['duplicate wording']+=1;return
 # Keep approved wording when it duplicates an older/general source bank.
 if fp in fingerprints:
  other=fingerprints[fp]
  if not reviewId:
   if predicate and predicate.get('kind')=='retained-bank':equivalents[id]=other['id']
   rejected['identical complete answer set']+=1;return
  if other.get('reviewId'):raise ValueError('Two approved questions have identical answer sets: '+id)
  candidates.remove(other);promptkeys.discard(norm(other['prompt']))
 owners=collections.defaultdict(set)
 for k,(label,p,aliases) in merged.items():
  for a in aliases:owners[norm(a)].add(k)
 rows=[[v[0],v[1],sorted(a for a in v[2] if norm(a)!=k and norm(a)not in merged and len(owners[norm(a)])==1)] for k,v in sorted(merged.items())]
 if not any(r[1]==100 for r in rows) and (not predicate or predicate.get('kind')!='retained-bank'):
  rare=[r for r in rows if r[1]>=60 and len(r[0])<65]
  if rare:min(rare,key=lambda r:sha((id+r[0]).encode()))[1]=100
 meta=dict(id=id,prompt=prompt,family=family,topic=group.replace('-',' ').upper(),group='group-'+group,rows=rows,source=source,answerCount=len(rows),familiarCount=core,identityHash=fp,priority=priority,predicate=predicate,reviewId=reviewId,scope=scope)
 candidates.append(meta);fingerprints[fp]=meta;promptkeys.add(pk)

# Curated seeds are implemented separately from the generic source predicates.
namespace=globals()
exec((ROOT/'scripts/group-approved-recipes.py').read_text(),namespace)

# Carry familiar original general categories forward, with their actual scopes.
for id in load(Path('group/legacy-core-ids.json')):
 if id not in legacy:continue
 m=legacy[id]
 add(id,m['prompt'],m['family'],'broad-'+m.get('group',m['family']),bankrows(id),m.get('source','Retained factual inventory; DATA-SOURCES.md'),priority=90,predicate={'kind':'retained-bank','id':id})
 selected=next((c for c in candidates if c['id']==id),None)
 if selected:
  for key in ['literalAliases','inputNoise','excludedAnswers']:
   if key in m:selected[key]=m[key]

steam=load(Path('discovery/steam.json.gz'));games=steam['games'];tagsets={t:set(ids) for t,ids in steam['tags'].items()}
# Exactly one literal Steam label. Do not expand RPG into an invented tag string.
for tag,ids in sorted(tagsets.items()):
 if BLOCK.search(tag):continue
 rs=[row(games[i][0],points(games[i][2],(20000,5000,500)),games[i][1]) for i in sorted(ids) if gamevalid(games[i][0])]
 add('group-steam-'+slug(tag),'Name a game on Steam tagged “'+tag+'”.','gaming','steam-single-tag',rs,'Steam community tags via SteamSpy; full retained tag membership, 2026-10-23. Names reconciled with the recorded Steam catalog.',priority=85,predicate={'kind':'steam-tag','tag':tag})
# Keep approachable two-tag questions too; the feedback requested some single
# labels, not removal of every intersection. Limit pairs to familiar themes.
pairHold=set('Atmospheric|Cinematic|Stylized|Realistic|Minimalist|Cute|Colorful|Story Rich|Narrative|Singleplayer|Online Co-Op|Co-op Campaign|Inventory Management|Economy|Resource Management|Transportation|Loot|Nonlinear|Choose Your Own Adventure|Class-Based|Team-Based|Party-Based RPG|Real-Time with Pause|Gothic|Lovecraftian|Noir|Isometric|Grand Strategy|Precision Platformer|Procedural Generation|Level Editor|Moddable|Auto Battler|Real Time Tactics|Text-Based|Multiple Endings'.split('|'))
pairHold-=set('Atmospheric|Cinematic|Stylized|Cute|Colorful|Story Rich'.split('|'))
pairTags=sorted(t for t in tagsets if t not in pairHold and not BLOCK.search(t))
redundant={frozenset(p.split('|')) for p in ['Action|Action-Adventure','Adventure|Action-Adventure','RPG|Action RPG','RPG|CRPG','RPG|JRPG','RPG|MMORPG','Shooter|FPS','Shooter|Third-Person Shooter','Shooter|Top-Down Shooter','Horror|Survival Horror','Horror|Psychological Horror','Survival|Survival Horror','Animals|Cats','Animals|Dogs','Space|Spaceships','Space|Space Sim','Farming|Farming Sim','Roguelike|Roguelite','Fantasy|Dark Fantasy','Co-op|Multiplayer','Co-op|Local Co-Op','Multiplayer|Local Co-Op','War|World War I','War|World War II','Military|War']}
for a,b in itertools.combinations(pairTags,2):
 if frozenset([a,b]) in redundant:continue
 ids=tagsets.get(a,set())&tagsets.get(b,set())
 if len(ids)<50 or len(ids)/min(len(tagsets[a]),len(tagsets[b]))>=.96:continue
 if sum(games[i][2]>=20000 for i in ids)<6:continue
 rs=[row(games[i][0],points(games[i][2],(20000,5000,500)),games[i][1]) for i in sorted(ids) if gamevalid(games[i][0])]
 add('group-steam-'+slug(a)+'-and-'+slug(b),'Name a game on Steam tagged “'+a+'” and “'+b+'”.','gaming','steam-two-tags',rs,'Steam community tags via SteamSpy; complete retained intersection, 2026-10-23.',priority=84,minimum=50,known=20,predicate={'kind':'steam-tags','tags':[a,b]})
print('After approved/core/Steam:',len(candidates),flush=True)

films=load(Path('discovery/films.json.gz'));tv=load(Path('discovery/television.json.gz'));rawmusic=load(Path('discovery/music.json.gz'));music=[[songtitle(r[0]),*r[1:]] for r in rawmusic]
songAliases=collections.defaultdict(set)
for r in rawmusic:songAliases[songtitle(r[0])].add(r[0])
# Additional one-property inventories, rather than narrowing two independent
# tags or asking for an isolated year, minor locality or obscure cast role.
keywords=collections.defaultdict(list);studios=collections.defaultdict(list);genres=collections.defaultdict(list)
badthemes=re.compile(r'\b(?:rape|incest|abuse|suicide|pedophil|porn|sex|erotic|fetish|torture|holocaust|nazi|nazis|antisemit|child murder|infanticide)\b',re.I)
for r in films:
 rs=row(r[0],points(r[6],(10000,1000,100)),[r[1]])
 for k in r[4]:keywords[k].append(rs)
 for k in r[5]:studios[k].append(rs)
 for k in r[3]:genres[k].append(rs)
for keyword,rs in sorted(keywords.items()):
 if badthemes.search(keyword) or len(keyword.split())>3 or freq(keyword)<3.8 or any(re.search(r'\d',w) for w in keyword.split()):continue
 add('group-movie-tag-'+slug(keyword),'Name a movie tagged “'+keyword+'”.','culture','movie-story-tag',rs,'TMDB factual story-keyword memberships in the retained released-movie snapshot; DATA-SOURCES.md.',priority=63,known=10,predicate={'kind':'film-keyword','tag':keyword},scope='Movie names recorded under this story keyword. The bank contains the complete retained keyword set, without a popularity cap; metadata can omit a film.')
for studio,rs in sorted(studios.items()):
 if studio not in ['Walt Disney Pictures','Walt Disney Productions','Walt Disney Animation Studios','Pixar','DreamWorks Animation','DreamWorks Pictures','Warner Bros. Pictures','Warner Bros. Animation','Warner Bros.','Universal Pictures','Paramount Pictures','Columbia Pictures','Sony Pictures','Sony Pictures Animation','20th Century Fox','20th Century Studios','Metro-Goldwyn-Mayer','New Line Cinema','Lionsgate','Marvel Studios','Marvel Entertainment','DC Entertainment','A24','Studio Ghibli','Illumination','Illumination Entertainment','Nickelodeon Movies','Blumhouse Productions','Lucasfilm Ltd.','Touchstone Pictures','Miramax']:continue
 add('group-movies-by-studio-'+slug(studio),'Name a movie produced by '+studio+'.','culture','movie-studio',rs,'TMDB factual production-company credits in the retained released-movie snapshot; DATA-SOURCES.md.',priority=60,known=15,predicate={'kind':'film-studio','studio':studio})
for genre,rs in sorted(genres.items()):
 if not genre or genre in ['TV Movie']:continue
 add('group-movie-genre-'+slug(genre),'Name '+('an ' if genre[0].lower() in 'aeiou' else 'a ')+genre.lower()+' movie.','culture','movie-genre',rs,'TMDB factual genre memberships in the retained released-movie snapshot; DATA-SOURCES.md.',priority=82,predicate={'kind':'film-genre','genre':genre})
movieGenres=['Action','Adventure','Animation','Comedy','Crime','Drama','Family','Fantasy','Horror','Mystery','Romance','Science Fiction','Thriller','War','Western','Music','History']
for a,b in itertools.combinations(movieGenres,2):
 rs=[row(r[0],points(r[6],(10000,1000,100)),[r[1]]) for r in films if a in r[3] and b in r[3]]
 add('group-movie-genres-'+slug(a)+'-and-'+slug(b),'Name a movie that mixes '+a.lower()+' and '+b.lower()+'.','culture','movie-two-genres',rs,'TMDB recorded genre memberships; both genres required.',priority=70,minimum=50,known=20,predicate={'kind':'film-genres','genres':[a,b]})
themeText='aliens:alien,alien invasion,extraterrestrial;robots:robot,android,artificial intelligence;zombies:zombie,zombies;vampires:vampire,vampires;ghosts:ghost,haunted house;witches:witch,witchcraft;wizards:wizard,sorcerer;superheroes:superhero,super power,superpower;dinosaurs:dinosaur,dinosaurs;time travel:time travel,time loop;pirates:pirate,pirates;dragons:dragon,dragons;magic:magic,magical;heists:heist,bank robbery,robbery;prisons:prison,prison escape;detectives:detective,private detective;spies:spy,secret agent,espionage;martial arts:martial arts,kung fu,karate;boxing:boxing,boxer;basketball:basketball;football:american football,football (soccer),soccer;baseball:baseball;car racing:car race,car racing,race car;disasters:disaster,natural disaster;the apocalypse:apocalypse,post-apocalyptic,post apocalypse;high school:high school,high school student;college:college,university;Christmas:christmas;Halloween:halloween;summer camp:summer camp;treasure hunting:treasure hunt,treasure;giant monsters:giant monster,kaiju;talking animals:talking animal,talking animals,anthropomorphic animal;dogs:dog,dogs;cats:cat,cats;horses:horse,horses;sharks:shark,shark attack;space travel:space travel,outer space,space station,spacecraft;islands:island,desert island;jungles:jungle;road trips:road trip;car chases:car chase;rescues:rescue,rescue mission;friendship:friendship,best friend;supernatural powers:supernatural,psychic power,telekinesis;revenge:revenge;dreams:dream,nightmare;weddings:wedding,marriage;competitions:competition,tournament,contest;underdogs:underdog;video games:video game,virtual reality;courtrooms:courtroom,trial,lawyer;police:police,police officer;vigilantes:vigilante;kidnapping:kidnapping;twins:twins,twin;mistaken identities:mistaken identity,disguise;memory loss:amnesia,memory loss;body swapping:body swap;rock bands:rock band,rock music;singers:singer,singing;dancing:dancing,dance;the ocean:ocean,sea,underwater;war:war,world war ii,world war i;supernatural creatures:supernatural creature,monster,werewolf'
themes={name:set(tags.split(',')) for name,tags in (part.split(':',1) for part in themeText.split(';'))}
themeTags=collections.defaultdict(set)
for theme,tags in themes.items():
 for tag in tags:themeTags[tag].add(theme)
themeRows=collections.defaultdict(list)
for r in films:
 matched={theme for tag in r[4] for theme in themeTags.get(tag,[])}
 if matched:
  entry=row(r[0],points(r[6],(10000,1000,100)),[r[1]])
  for genre in r[3]:
   for theme in matched:themeRows[genre,theme].append(entry)
for theme,tags in themes.items():
 for genre in movieGenres:
  rs=themeRows[genre,theme]
  add('group-movie-'+slug(genre)+'-theme-'+slug(theme),'Name '+('an ' if genre[0].lower() in 'aeiou' else 'a ')+genre.lower()+' movie involving '+theme+'.','culture','movie-genre-theme',rs,'TMDB recorded genre and story-keyword memberships; complete retained matching set.',priority=69,minimum=30,known=12,predicate={'kind':'film-genre-theme','genre':genre,'tags':sorted(tags)},scope='The recorded genre and at least one of the listed story keywords must match. Source metadata may omit a film; plot membership is not inferred from its title.')
for genre in sorted({g for r in tv for g in r[2]}):
 if not genre:continue
 rs=[row(r[0],points(r[4],(100,85,50))) for r in tv if genre in r[2]]
 add('group-show-genre-'+slug(genre),'Name '+('an ' if genre[0].lower() in 'aeiou' else 'a ')+genre.lower()+' TV or streaming show.','culture','show-genre',rs,'TVmaze full retained show index and genre memberships; CC BY-SA 4.0.',priority=71,minimum=50,known=20,predicate={'kind':'tv-genre','genre':genre})
for kind in ['song','artist']:
 bygenre=collections.defaultdict(list)
 for title,artists,album,genre,pop in music:
  if kind=='artist':bygenre[genre].extend(row(a,points(pop,(75,45,20))) for a in artists)
  else:bygenre[genre].append(row(title,points(pop,(75,45,20)),songAliases[title]))
 for genre,rs in sorted(bygenre.items()):
  if badthemes.search(genre) or genre=='show-tunes':continue
  add('group-music-'+slug(genre)+'-'+kind,'Name '+('an '+kind if kind in ['artist','album'] else 'a song')+' associated with '+genre+' music.','music','music-genre-'+kind,rs,'Recorded track-genre associations in Maharshi Pandya Spotify factual snapshot, BSD, revision 635b034.',priority=62,known=12,predicate={'kind':'music-genre','genre':genre,'entity':kind})

# Recorded creator credits are expanded only when they have a substantial
# familiar core. No arbitrary obscure developer gets a two-game quiz.
creatorpath=SRC/'group/steam-creator-facts.json.gz'
if creatorpath.exists():
 creatorFacts=load(Path('group/steam-creator-facts.json.gz'))
 for role in ['developers','publishers']:
  creators=collections.defaultdict(list)
  for r in creatorFacts:
   if gamevalid(r['name']):
    for name in r[role]:creators[name].append(row(r['name'],points(r['positive'],(20000,5000,500))))
  for name,rs in sorted(creators.items()):
   add('group-games-'+role+'-'+slug(name),'Name a game '+('developed' if role=='developers' else 'published')+' by '+name+'.','gaming','game-'+role,rs,'Steam catalog recorded developer/publisher credits, retained 2026-10-23; names and credits only.',priority=60,known=12,predicate={'kind':'steam-creator','role':role,'name':name})

media={
 'movie':(films,0,6,(10000,1000,100),'culture','TMDB factual released-title metadata, retained 2026-10-23; DATA-SOURCES.md'),
 'show':(tv,0,4,(100,85,50),'culture','TVmaze full retained show index, 2026-10-23; CC BY-SA; https://www.tvmaze.com/api'),
 'song':(music,0,4,(75,50,20),'music','Maharshi Pandya Spotify tracks factual names, BSD, revision 635b034'),
 'game':([r for r in games.values() if gamevalid(r[0])],0,2,(20000,5000,500),'gaming','Full retained Steam game names, reconciled with the 2026-10-23 catalog; SteamSpy review-count familiarity proxy')
}
print('Curated/core/Steam candidates:',len(candidates),flush=True)
stop=set('the and for but not you your yours our ours their theirs they them this that these those with from into onto than then what when where which while who whom whose how why are was were been being have has had will would could should can may might must does did doing done more most much many some any only just very really also both each every other another such same without through about above below after before between against under over along upon out off all there here two one three four five six seven eight nine ten first second third part volume edition remaster remastered collection complete definitive soundtrack original bonus track album deluxe version instrumental remix acoustic live official greatest best hits season episode series television radio video game movie film songs music feat featuring presents special'.split())
stop.update('des com der die das les los las del une un non est pour que como para nos sur von zur mit und aux slowed reverb sped remixes mixes edits remastering remastering reissue deluxe dubbed subtitles compilation'.split())
englishContent=set(load(Path('group/title-english-words.json')))
places=set('scotland england wales ireland france germany italy spain portugal sweden norway finland denmark iceland russia ukraine poland greece turkey israel jordan china japan korea india pakistan bangladesh sri lanka nepal bhutan thailand vietnam cambodia laos malaysia indonesia philippines australia zealand canada america mexico brazil argentina colombia chile peru ecuador bolivia venezuela uruguay paraguay cuba jamaica haiti bahamas egypt algeria morocco libya tunisia ethiopia kenya nigeria ghana tanzania uganda congo sudan zimbabwe zambia botswana namibia angola mozambique madagascar mauritius seychelles fiji samoa tonga tuvalu palau kiribati nauru maldives bahrain qatar oman yemen syria iran iraq afghanistan armenia azerbaijan georgia kazakhstan uzbekistan turkmenistan kyrgyzstan tajikistan mongolia singapore brunei timor cyprus malta luxembourg liechtenstein switzerland austria belgium netherlands monaco andorra serbia croatia bosnia slovenia slovakia czechia romania bulgaria albania montenegro kosovo macedonia estonia latvia lithuania belarus moldova hungary texas alaska hawaii california florida virginia carolina dakota mississippi missouri alabama arizona ohio utah oregon nevada colorado wyoming montana idaho kansas nebraska iowa wisconsin michigan illinois indiana maine vermont hampshire maryland delaware pennsylvania york jersey louisiana tennessee kentucky georgia oklahoma arkansas massachusetts connecticut boston london paris miami chicago tokyo seoul beijing mumbai delhi sydney melbourne hollywood bollywood berlin rome vienna madrid barcelona lisbon athens amsterdam copenhagen stockholm oslo helsinki dublin'.split())

# The approved title-pattern ideas generalize to meaningful common words, never
# arbitrary letters, initialisms or year/decade slices. Whole tokens only.
for kind,(records,col,popcol,levels,family,source) in media.items():
 index=collections.defaultdict(list);major=collections.defaultdict(set);majorLimit={'movie':2000,'show':90,'song':65,'game':10000}[kind]
 for r in records:
  label=r[col]
  for w in words(label):
   if w in englishContent and w not in stop and w not in places and freq(w)>=4.1:
    index[w].append(row(label,points(r[popcol],levels),songAliases[label] if kind=='song' else []))
    if r[popcol]>=majorLimit:major[w].add(norm(label))
 for w,rs in sorted(index.items()):
  if len(major[w])<4:continue
  add('group-'+kind+'-word-'+slug(w),'Name '+('an album' if kind=='album' else 'a '+('TV or streaming show' if kind=='show' else ('video game' if kind=='game' else kind)))+' with “'+w+'” in its title.',family,kind+'-title-word',rs,source,priority=45+min(10,freq(w)),minimum=24,known=8,predicate={'kind':'title-word','media':kind,'word':w},scope='The complete standalone word must appear in the recorded title. Punctuation and case do not matter. Subtitle words count; substrings do not.')

print('With literal title words:',len(candidates),flush=True)
# Actual semantic title patterns, e.g. a movie with an animal/food/place in its
# title, not an asserted theme inferred from the title alone.
semantic=load(Path('variety/wordnet-categories.json.gz'))
deny=set('entity object whole unit part component substance artifact abstraction communication cognition act action event happening occurrence relation person group thing people stuff quantity state process condition quality system category kind type form variety'.split())
concreteTitleKinds=set('domestic animal|shark|bird|bird of prey|frog|lizard|snake|whale|working dog|cat|insect|butterfly|horse|cattle|fish|food fish|aircraft|airplane|bag|ball|boat|box|bridge|building|cap|car|chair|clothing|coat|computer|container|decoration|dwelling|electrical device|electronic device|engine|fabric|furniture|hand tool|house|jacket|jewelry|knife|lamp|machine|motor vehicle|musical instrument|paint|painting|photograph|place of business|place of worship|road|room|rope|sculpture|seat|shelter|ship|shoe|shop|sports equipment|station|street|table|tool|tower|tube|vehicle|vessel|weapon|wheel|wind instrument|dish|meal|candy|dessert|baked goods|cake|meat|bread|produce|vegetable|bean|apple|seafood|ingredient|herb|sauce|dairy product|cheese|beverage|wine|liquor|mixed drink|cocktail|desert|capital|city|national park|park|port|town|national capital|european country|african country|asian country|pine|flower|grass|cereal|fruit tree|vine|tree|fruit|seed|nut|leaf|material|alloy|chemical element|metallic element|mineral|rock|animal skin|leather|steel|fiber|fuel|gas|crystal|liquid|oil|paper|wood|occupation|profession|crime|sport|game|card game|dancing|gesture|sound|social event|musical organization|school|court|fictional character'.split('|'))
vocabularies=[]
for category in semantic:
 label=category['key'].split('.')[0].replace('_',' ')
 if label not in concreteTitleKinds or label in deny or len(label.split())>3 or freq(label)<3.6:continue
 terms={s.lower().replace('_',' ') for a in category['items'] for s in [a['name'],*a.get('aliases',[])] if valid(s) and len(norm(s))>=2 and len(s.split())<=3}
 # A generic parent label itself counts too ("dog" is a kind of animal).
 terms.add(label)
 vocabularies.append((category,label,terms))
allterms={re.sub('[^a-z0-9]+',' ',s).strip() for _,_,terms in vocabularies for s in terms}
mediaIndexes={}
for kind,(records,col,popcol,levels,family,source) in media.items():
 index=collections.defaultdict(list)
 for r in records:
  tokens=re.findall('[a-z0-9]+',unicodedata.normalize('NFKD',r[col]).encode('ascii','ignore').decode().lower())
  phrases={' '.join(tokens[i:i+n]) for n in (1,2,3) for i in range(len(tokens)-n+1)}
  for phrase in phrases&allterms:index[phrase].append(r)
 mediaIndexes[kind]=index
for category,label,terms in vocabularies:
 for kind,(records,col,popcol,levels,family,source) in media.items():
  found={(r[col],r[popcol]):r for term in terms for r in mediaIndexes[kind].get(re.sub('[^a-z0-9]+',' ',term).strip(),[])}
  rs=[row(r[col],points(r[popcol],levels),songAliases[r[col]] if kind=='song' else []) for r in found.values()]
  phrase={'domestic animal':'an animal','baked goods':'a baked food','clothing':'an item of clothing','sports equipment':'a piece of sports equipment','furniture':'a piece of furniture','food fish':'a fish','wind instrument':'a wind instrument','jewelry':'a piece of jewelry','produce':'a fruit or vegetable','dairy product':'a dairy product','musical organization':'a musical group'}.get(label,('an ' if label[0] in 'aeiou' else 'a ')+label)
  add('group-'+kind+'-title-kind-'+slug(label),'Name '+('an album' if kind=='album' else 'a '+('TV or streaming show' if kind=='show' else ('video game' if kind=='game' else kind)))+' with the name of '+phrase+' in its title.',family,kind+'-title-category',rs,source+'; Princeton WordNet noun-kind vocabulary, WordNet license.',priority=56,minimum=24,known=6,predicate={'kind':'title-vocabulary','media':kind,'wordnet':category['key']},scope='A standalone name from this category must occur in the title or subtitle. It need not describe the plot. Homonyms count as words in a title.')

# Full retained tracks by an artist, with collaboration names kept. A category
# needs multiple familiar tracks; no one-hit or tiny discography quiz.
artistrows=collections.defaultdict(list);artistStrong=collections.defaultdict(set)
for title,artists,album,tag,pop in music:
 for artist in artists:
  artistrows[artist].append(row(title,points(pop,(75,45,20)),songAliases[title]))
  if pop>=60:artistStrong[artist].add(norm(title))
for artist,rs in sorted(artistrows.items()):
 if not valid(artist):continue
 if sum(r[1]<=30 for r in rs)<12:continue
 if len(artistStrong[artist])<12:continue
 add('group-songs-by-'+slug(artist),'Name a song recorded by '+artist+'. Collaborations count.','music','artist-songs',rs,'Recorded Spotify track-to-artist credits, Maharshi Pandya BSD factual snapshot, revision 635b034.',priority=58,minimum=24,known=8,predicate={'kind':'artist-credit','artist':artist})

exec((ROOT/'scripts/group-accessible-recipes.py').read_text(),globals())
counts=collections.Counter(c['group'] for c in candidates)
print(json.dumps({'candidates':len(candidates),'formats':counts,'rejected':rejected},indent=2),flush=True)
if args.candidate_report:
 args.candidate_report.write_text(json.dumps([{k:v for k,v in c.items() if k!='rows'} for c in candidates],ensure_ascii=False,indent=2)+'\n')
if args.probe:raise SystemExit()
if len(candidates)<5000:raise ValueError('Not enough qualified candidates; do not pad or publish a false count.')

# Editorial selection is finite and frozen. At runtime all 5,000 IDs have the
# same opportunity in a full unseen Fisher-Yates shuffle, without family cycles.
approved=[c for c in candidates if c.get('reviewId')]
must=[c for c in candidates if c['priority']>=80 and not c.get('reviewId')]
chosen=approved+must;remaining=[c for c in candidates if c not in chosen]
formats=collections.defaultdict(list)
for c in remaining:formats[c['group']].append(c)
for group,items in formats.items():items.sort(key=lambda c:(-c['priority'],-min(100,c['familiarCount']),sha(c['id'].encode())))
while len(chosen)<5000:
 for group in sorted(formats):
  if formats[group] and len(chosen)<5000:chosen.append(formats[group].pop(0))
 if not any(formats.values()) and len(chosen)<5000:raise ValueError('Selection exhausted')
if len({c['id'] for c in chosen})!=5000 or len({c['identityHash'] for c in chosen})!=5000:raise ValueError('Duplicate question identity')
if len(approved)!=98:raise ValueError('Every one of the 98 approved proposals must be playable')
selection=SRC/'group/selected-ids.json'
if args.refresh_held:
 byid={c['id']:c for c in candidates};previous=json.loads(selection.read_text());chosen=[byid[id] for id in previous if id in byid]
 replacements=collections.defaultdict(list)
 for c in candidates:
  if c['id'].startswith('group-open-') and c['id'] not in previous:replacements[c['family']].append(c)
 for bucket in replacements.values():bucket.sort(key=lambda c:(-c['familiarCount'],c['id']))
 while len(chosen)<5000:
  progress=False
  for family in sorted(replacements):
   if replacements[family] and len(chosen)<5000:chosen.append(replacements[family].pop(0));progress=True
  if not progress:raise ValueError('Not enough reviewed accessible replacements; do not restore held prompts or pad the count.')
 selection.write_text(json.dumps([c['id'] for c in chosen],indent=2)+'\n')
elif selection.exists() and not args.reselect:
 ids=json.loads(selection.read_text());byid={c['id']:c for c in candidates}
 if len(ids)!=5000 or len(set(ids))!=5000 or any(id not in byid for id in ids):raise ValueError('A frozen selected question no longer meets its source gates; explicitly review before reselection.')
 chosen=[byid[id] for id in ids]
else:selection.write_text(json.dumps([c['id'] for c in chosen],indent=2)+'\n')
if {c['reviewId'] for c in chosen if c.get('reviewId')}!={c['reviewId'] for c in approved}:raise ValueError('Frozen selection omits an approved question')
OUT.mkdir(exist_ok=True);metadata=[];manifest=[]
for c in chosen:
 payload=json.dumps(c['rows'],ensure_ascii=False,separators=(',',':')).encode();digest=sha(payload);filename=c['id']+'.'+digest[:16]+'.json.gz'
 compressed=(OUT/filename).read_bytes() if (OUT/filename).exists() else gzip.compress(payload,mtime=0)
 if not (OUT/filename).exists():(OUT/filename).write_bytes(compressed)
 meta={k:v for k,v in c.items() if k not in ['rows','priority'] and v is not None};meta.update(answerFile=filename,answerDirectory='group-banks',funVersion=7,groupProfileVersion=1,dailyEligible=True,partyEligible=True,mixed=True,ranking='group-familiarity-v1')
 pred=c.get('predicate') or {}
 meta['topic']=str(pred.get('tag') or pred.get('artist') or pred.get('word') or pred.get('genre') or pred.get('studio') or (c['prompt'][7:].rstrip('.') if c.get('reviewId') else c['topic'])).upper()
 if pred.get('kind')=='title-vocabulary':meta['topic']=pred['wordnet'].split('.')[0].replace('_',' ').upper()+' IN A TITLE'
 metadata.append(meta);manifest.append({**meta, 'sha256':digest,'downloadBytes':len(compressed),'tiers':dict(collections.Counter(r[1] for r in c['rows']))})
build=sha(json.dumps(metadata,sort_keys=True).encode())[:16]
archive={}
archivefile=ROOT/'group-question-archive.js'
if archivefile.exists():
 for m in literal('group-question-archive.js','createHistoricalCatalog('):archive[m['id']]=m
oldmanifest=ROOT/'group-bank-manifest.json'
if oldmanifest.exists():
 active={c['id'] for c in chosen}
 for m in json.loads(oldmanifest.read_text())['categories']:
  if m['id'] not in active:archive[m['id']]={**{k:v for k,v in m.items() if k not in ['sha256','downloadBytes','tiers']},'ordinaryRetired':True}
archivefile.write_text('// Historical banks only: never admitted to ordinary games.\nimport {createHistoricalCatalog} from "./fun-bank-loader.js";\nexport const GROUP_ARCHIVED_PACKS=createHistoricalCatalog('+json.dumps(list(archive.values()),ensure_ascii=False,separators=(',',':'))+');\n')
(ROOT/'group-question-catalog.js').write_text('// Generated by scripts/build-group-banks.py; finite factual snapshots.\nimport {createGroupCatalog} from "./fun-bank-loader.js";\nexport const GROUP_QUESTION_BUILD='+json.dumps(build)+';\nexport const GROUP_EQUIVALENTS='+json.dumps(equivalents,separators=(',',':'))+';\nexport const GROUP_PACKS=createGroupCatalog('+json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+',GROUP_QUESTION_BUILD);\n')
report={'build':build,'count':len(chosen),'approved':98,'families':dict(collections.Counter(c['family'] for c in chosen)),'formats':dict(collections.Counter(c['group'] for c in chosen)),'canonicalEntries':sum(c['answerCount'] for c in chosen),'coverage':'Finite recorded inventories, not every possible real-world answer. Title membership is literal, not inferred plot meaning. Popularity proxies are editorial ranking inputs, not player answer frequencies.','categories':manifest}
(ROOT/'group-bank-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(ROOT/'group-question-list.csv').write_text('id,subject,question,canonical_answers\n'+'\n'.join(','.join('"'+str(v).replace('"','""')+'"' for v in [c['id'],c['family'],c['prompt'],c['answerCount']]) for c in chosen)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='categories'},indent=2))
