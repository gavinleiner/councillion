"""Add distinct, source-backed categories; freeze deterministic daily appointments.
No network or model calls. See DATA-SOURCES.md for scope and source notices.
"""
from pathlib import Path
import argparse,json,gzip,re,unicodedata,hashlib,collections,functools
from wordfreq import zipf_frequency
parser=argparse.ArgumentParser();parser.add_argument('--output-dir',type=Path);args=parser.parse_args()
repo=Path(__file__).resolve().parents[1];root=args.output_dir or repo;src=repo/'data-snapshots';out=root/'variety-banks';out.mkdir(parents=True,exist_ok=True)
def load(path):
 p=src/path;return json.loads(gzip.decompress(p.read_bytes())if p.suffix=='.gz'else p.read_text())
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower())
def valid(s):return 2<=len(s)<=150 and len(norm(s))>=2 and not re.search(r'\b(?:nigger|faggot|fuck|fucking|rape|raping|porn|hentai|incest|sexual|sex|orgasm|masturbation|pussy|tits|nude|nudes)\b',s,re.I) and not re.match(r'^(?:Q\d+|genus |family |order |subclass |unknown|unnamed|Team Mate \d|Enemy \d)',s,re.I)
@functools.lru_cache(maxsize=300000)
def freq(s):return zipf_frequency(s.lower(),'en')
def entry(name,aliases=(),prominence=0):return {'name':name,'aliases':list(aliases),'prominence':prominence}
def fingerprint(rows):return hashlib.sha256('\n'.join(sorted(norm(a[0])for a in rows)).encode()).hexdigest()
# Never count an identical complete answer set as a new category.
seen=set();knownpoints={};knownaliases={}
for meta in json.loads((repo/'fun-bank-manifest.json').read_text()):
 rows=json.loads(gzip.decompress((repo/'question-banks'/meta['answerFile']).read_bytes()));seen.add(fingerprint(rows))
 for label,points,aliases in rows:
  key=norm(label);knownpoints[key]=min(points,knownpoints.get(key,100));knownaliases.setdefault(key,set()).update(aliases)
oldpool=json.loads((repo/'question-answers.js').read_text().split('export const ANSWER_ROWS=',1)[1].split(';\n',1)[0]);oldrows=json.loads((repo/'question-catalog.js').read_text().split('const rows=',1)[1].split(';\n',1)[0])
for _,ids in oldrows:seen.add(fingerprint([oldpool[i]for i in ids]))
seenprompts={norm(p['prompt'])for p in load(Path('variety/base-prompts.json'))};meta=[];manifest=[];omitted=[]
def bank(key,family,topic,prompt,items,source,group,minimum=24,mixed=True,party=True):
 if norm(prompt)in seenprompts:omitted.append([key,'duplicate prompt']);return
 merged={}
 for a in items:
  if isinstance(a,str):a=entry(a)
  label=re.sub(r'\s+',' ',a['name']).strip();k=norm(label)
  if not valid(label):continue
  if k not in merged:merged[k]=entry(label,a.get('aliases',[]),a.get('prominence',0))
  else:merged[k]['aliases']+=a.get('aliases',[]);merged[k]['prominence']=max(merged[k]['prominence'],a.get('prominence',0))
 if len(merged)<minimum:omitted.append([key,'too few',len(merged)]);return
 owners=collections.defaultdict(set)
 for k,a in merged.items():
  for alias in a['aliases']:
   if valid(alias):owners[norm(alias)].add(k)
 rows=[]
 for k,a in merged.items():
  f=freq(a['name']);p=a['prominence'];points=knownpoints.get(k,10 if f>=5 or p>=1000000 else 30 if f>=4.1 or p>=200000 else 60 if f>=3.1 or p>=30000 else 85)
  aliases=sorted({x for x in a['aliases'] if valid(x)and norm(x)!=k and norm(x)not in merged and len(owners[norm(x)])==1})
  rows.append([a['name'],points,aliases])
 rows.sort(key=lambda a:a[0].casefold());fp=fingerprint(rows)
 if fp in seen:omitted.append([key,'duplicate answer set']);return
 seen.add(fp);seenprompts.add(norm(prompt))
 if not any(a[1]==100 for a in rows):
  candidates=[a for a in rows if a[1]>=60 and 5<=len(a[0])<=35]or rows;min(candidates,key=lambda a:(abs(freq(a[0])-2.7),a[0]))[1]=100
 payload=json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode();digest=hashlib.sha256(payload).hexdigest();id='var-'+key;filename=id+'.'+digest[:16]+'.json.gz';compressed=gzip.compress(payload,mtime=0);(out/filename).write_bytes(compressed)
 familiar=sum(a[1]<=60 for a in rows);m={'id':id,'family':family,'topic':topic,'prompt':prompt,'source':source,'group':group,'answerCount':len(rows),'answerFile':filename,'answerDirectory':'variety-banks','funVersion':5,'mixed':mixed,'partyEligible':party and familiar>=8 and len(rows)>=30,'dailyEligible':True,'ranking':'familiarity-v4','familiarCount':familiar}
 meta.append(m);manifest.append({**m,'sha256':digest,'answerSetSha256':fp,'downloadBytes':len(compressed),'tiers':dict(collections.Counter(a[1]for a in rows))})
# Curated WordNet senses: semantic kinds and synonyms, never arbitrary letter slices.
for p in load(Path('variety/wordnet-categories.json.gz')):
 bank('semantic-'+p['key'].replace('.','-'),p['family'],p['topic'],p['prompt'],p['items'],p['source'],p['group'])
# Filmographies and co-stars are genuinely different answer sets; source scope is explicit.
movies=load(Path('rework/movies.json.gz'));credits=collections.defaultdict(list)
for m in movies:
 if m['year']<1960:continue
 for actor in set(m['cast']):
  if valid(actor)and norm(actor)not in ['himself','herself','themselves','various','unknown','featuring','none']:credits[actor].append(m)
# Recognizable anchors are used in automatic games; the long filmography tail
# remains searchable as optional specialist practice rather than surprise trivia.
actoranchors=set('Tom Cruise|Tom Hanks|Brad Pitt|Leonardo DiCaprio|Dwayne Johnson|Robert Downey Jr.|Scarlett Johansson|Chris Hemsworth|Chris Evans|Samuel L. Jackson|Morgan Freeman|Jennifer Lawrence|Jennifer Aniston|Meryl Streep|Johnny Depp|Will Smith|Denzel Washington|Keanu Reeves|Jim Carrey|Adam Sandler|Jack Black|Ryan Reynolds|Ryan Gosling|Margot Robbie|Emma Stone|Emma Watson|Tom Holland|Harrison Ford|Mark Hamill|Carrie Fisher|Al Pacino|Robert De Niro|Christian Bale|Heath Ledger|Joaquin Phoenix|Nicolas Cage|Danny DeVito|Hugh Jackman|Anne Hathaway|Natalie Portman|Julia Roberts|Sandra Bullock|Angelina Jolie|Matt Damon|Ben Affleck|Robin Williams|Jackie Chan|Bruce Lee|Michelle Yeoh|Bruce Willis|Robert Duvall|Dennis Quaid|Gene Hackman|Donald Sutherland|Liam Neeson|Michael Caine|Willem Dafoe|Christopher Walken|John Goodman|Susan Sarandon|Julianne Moore|Burt Reynolds|Harvey Keitel|Woody Harrelson|Jeff Bridges|Alec Baldwin|Stanley Tucci|Sylvester Stallone|Kurt Russell|Anthony Hopkins|Alan Arkin|Laurence Fishburne|Tommy Lee Jones|Jack Nicholson|James Caan|Ed Harris|Danny Glover|Charles Bronson|John Travolta|Bill Murray|Steve Buscemi|Nicole Kidman|John Leguizamo|Walter Matthau|Bruce Dern|Nick Nolte|Dan Aykroyd|Sigourney Weaver|Ray Liotta|John Cusack|Gary Oldman|Mark Wahlberg|Dennis Hopper|John Malkovich|Whoopi Goldberg|Kevin Bacon|Kevin Costner|Michael Keaton|Eddie Murphy|Steve Martin|Chevy Chase|Martin Short|Owen Wilson|Luke Wilson|Vince Vaughn|Ben Stiller|Will Ferrell|Seth Rogen|Jonah Hill|Seth MacFarlane|Jason Bateman|Jason Sudeikis|Paul Rudd|Steve Carell|Jason Segel|Michael Cera|Andy Samberg|Bill Hader|Danny McBride|Kristen Wiig|Tina Fey|Amy Poehler|Melissa McCarthy|Maya Rudolph|Rebel Wilson|Anna Kendrick|Anna Faris|Kate Hudson|Drew Barrymore|Cameron Diaz|Demi Moore|Sharon Stone|Kate Winslet|Cate Blanchett|Kate Beckinsale|Rachel McAdams|Rachel Weisz|Reese Witherspoon|Kirsten Dunst|Christina Ricci|Christina Applegate|Halle Berry|Jada Pinkett Smith|Taraji P. Henson|Queen Latifah|Octavia Spencer|Viola Davis|Regina King|Angela Bassett|Helen Mirren|Judi Dench|Emma Thompson|Maggie Smith|Glenn Close|Diane Keaton|Diane Lane|Sally Field|Jessica Lange|Jamie Lee Curtis|Geena Davis|Winona Ryder|Alicia Silverstone|Jessica Alba|Jessica Biel|Charlize Theron|Salma Hayek|Penélope Cruz|Eva Mendes|Lucy Liu|Uma Thurman|Milla Jovovich|Zoe Saldana|Chloë Grace Moretz|Dakota Fanning|Elle Fanning|Amanda Seyfried|Megan Fox|Mila Kunis|Kristen Stewart|Robert Pattinson|Daniel Radcliffe|Rupert Grint|Elijah Wood|Sean Astin|Orlando Bloom|Viggo Mortensen|Ian McKellen|Patrick Stewart|Christopher Lee|Hugo Weaving|Sean Bean|Lena Headey|Peter Dinklage|Charles Dance|Tim Curry|Tim Allen|Tom Arnold|Bob Odenkirk|Bryan Cranston|Aaron Paul|Jon Hamm|J.K. Simmons|Kathy Bates|Richard Jenkins|Paul Giamatti|William H. Macy|Philip Seymour Hoffman|John C. Reilly|Channing Tatum|Jon Bernthal|Jake Gyllenhaal|Maggie Gyllenhaal|Andrew Garfield|Jesse Eisenberg|Joseph Gordon-Levitt|Michael B. Jordan|Michael Shannon|Michael Fassbender|Idris Elba|Djimon Hounsou|Chiwetel Ejiofor|Don Cheadle|Forest Whitaker|Wesley Snipes|Cuba Gooding Jr.|Ice Cube|Chris Tucker|Chris Rock|Kevin Hart|Martin Lawrence|Tyler Perry|Terry Crews|Ken Jeong|Kumail Nanjiani|Kal Penn|John Cho|Benedict Cumberbatch|Martin Freeman|Colin Firth|Colin Farrell|Brendan Gleeson|Brendan Fraser|Brendan Coyle|Sean Connery|Roger Moore|Pierce Brosnan|Daniel Craig|Jude Law|Ralph Fiennes|Liam Hemsworth|Chris Pine|Chris Pratt|Karl Urban|Hugh Grant|Hugh Laurie|Ewan McGregor|Gerard Butler|Jason Statham|Jet Li|Tony Jaa|Donnie Yen|Jean-Claude Van Damme|Chuck Norris|Steven Seagal|Arnold Schwarzenegger|Dolph Lundgren|Vin Diesel|Dwayne Johnson|Dave Bautista|John Cena|Kurtwood Smith|Rob Schneider|David Spade|David Schwimmer|Matthew Perry|Matt LeBlanc|Courteney Cox|Lisa Kudrow|Danny Trejo|Cheech Marin|Tommy Chong|Snoop Dogg|Eminem|Ludacris|50 Cent|David Bowie|Prince|Madonna|Cher|Barbra Streisand|Bette Midler|Whitney Houston|Dolly Parton'.split('|'))
for actor,films in sorted(credits.items()):
 if len({m['title']for m in films})<25:continue
 key=norm(actor);simple=lambda name:entry(name,knownaliases.get(norm(name),()))
 bank('films-with-'+key,'culture',actor.upper()+' · FILMS','Name an American movie featuring '+actor+', released before 2024. Voice roles count.',[simple(m['title'])for m in films],'American film cast facts through 2023; servant-42/wikipedia-movie-data, MIT.','film-casts',minimum=25,mixed=actor in actoranchors,party=actor in actoranchors)
 coactors={p for m in films for p in m['cast']if p!=actor and norm(p)not in ['himself','herself','themselves','various','unknown','none']}
 bank('costars-of-'+key,'culture',actor.upper()+' · CO-STARS','Name an actor who shared an American film with '+actor+' before 2024. Voice casts count.',[simple(p)for p in sorted(coactors)],'Shared cast membership of American films through 2023; servant-42/wikipedia-movie-data, MIT.','film-casts',minimum=35,mixed=actor in actoranchors,party=actor in actoranchors)
# Real franchise membership, including editions and spin-offs. No made-up title keyword matching.
for f in load(Path('variety/game-franchises.json.gz')):
 bank('games-'+norm(f['name']),'gaming',f['name'].upper()+' · GAMES','Name a game in the '+f['name']+' franchise. Spin-offs and named editions count.',[entry(x,knownaliases.get(norm(x),()))for x in f['games']],'GameDB/IGDB recorded franchise-to-game relationships and name index; see source manifest.','game-franchises',minimum=25)
for f in load(Path('variety/franchise-characters.json.gz')):
 bank('characters-'+norm(f['name']),'gaming',f['name'].upper()+' · CHARACTERS','Name a character from the '+f['name']+' games. Named NPCs count.',[entry(x,knownaliases.get(norm(x),()))for x in f['characters']if norm(x)not in ['guard','soldier','npc','boy','girl','man','woman','player','protagonist','citizen','worker','enemy']],'GameDB/IGDB character game memberships intersected with recorded franchise membership.','game-characters',minimum=25)
# Geographical scope is a real relationship; no population puzzle in the prompt.
countries={a['alpha_2']:a.get('common_name')or a['name']for a in load(Path('rework/countries.json'))};places=load(Path('variety/places.json.gz'));bycountry=collections.defaultdict(list);byregion=collections.defaultdict(list)
for p in places:
 bycountry[p['country']].append(entry(p['name'],p['aliases'],p['population']))
 if p['country']=='US':byregion[p['region']].append(entry(p['name'],p['aliases'],p['population']))
for code,items in sorted(bycountry.items()):
 if code in countries:bank('places-'+code.lower(),'world',countries[code].upper()+' · PLACES','Name a city or town in '+countries[code]+'.',items,'GeoNames cities1000 factual country membership, CC BY 4.0. Populated places; PPLX subdivisions excluded.','places-by-country',minimum=50)
states='AL Alabama|AK Alaska|AZ Arizona|AR Arkansas|CA California|CO Colorado|CT Connecticut|DE Delaware|FL Florida|GA Georgia|HI Hawaii|ID Idaho|IL Illinois|IN Indiana|IA Iowa|KS Kansas|KY Kentucky|LA Louisiana|ME Maine|MD Maryland|MA Massachusetts|MI Michigan|MN Minnesota|MS Mississippi|MO Missouri|MT Montana|NE Nebraska|NV Nevada|NH New Hampshire|NJ New Jersey|NM New Mexico|NY New York|NC North Carolina|ND North Dakota|OH Ohio|OK Oklahoma|OR Oregon|PA Pennsylvania|RI Rhode Island|SC South Carolina|SD South Dakota|TN Tennessee|TX Texas|UT Utah|VT Vermont|VA Virginia|WA Washington|WV West Virginia|WI Wisconsin|WY Wyoming'
for s in states.split('|'):
 code,name=s.split(' ',1);bank('places-us-'+code.lower(),'world',name.upper()+' · PLACES','Name a city or town in the U.S. state of '+name+'.',byregion[code],'GeoNames cities1000 country/admin1 membership; CC BY 4.0.','places-by-state',minimum=40)
# Shape the ordinary pool with content, not template count: no indistinguishable answer sets.
version=hashlib.sha256(json.dumps(meta,sort_keys=True).encode()).hexdigest()[:16]
(root/'variety-question-catalog.js').write_text('// Generated source-backed variety. See DATA-SOURCES.md.\nimport {createExtraCatalog} from \'./fun-bank-loader.js\';\nexport const VARIETY_BUILD='+json.dumps(version)+';\nexport const VARIETY_PACKS=createExtraCatalog('+json.dumps(meta,ensure_ascii=False,separators=(',',':'))+',VARIETY_BUILD);\n')
(root/'variety-bank-manifest.json').write_text(json.dumps({'build':version,'categories':manifest,'omitted':omitted},ensure_ascii=False,indent=2))
active={p['answerFile']for p in meta}
for p in out.glob('*.gz'):
 if p.name not in active:p.unlink()
print(json.dumps({'categories':len(meta),'entries':sum(p['answerCount']for p in meta),'party':sum(p['partyEligible']for p in meta),'families':dict(collections.Counter(p['family']for p in meta)),'bytes':sum(p.stat().st_size for p in out.glob('*.gz')),'build':version,'omitted':len(omitted)},indent=2))
