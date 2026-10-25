#!/usr/bin/env python3
"""Whole named rosters, never combinations of role, type, genre or release tags."""
import collections,gzip,html,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/'data-snapshots/authored/sources/character-rosters.json.gz'
s=json.load(gzip.open(SOURCE));qs=[]
def norm(x):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',x).encode('ascii','ignore').decode().lower())
def add(key,family,topic,prompt,scope,items,known,wrong,rare,refs,also_common='',aliases=None):
 familiar=known.split('|');common=set(also_common.split('|'));manual=aliases or {};merged={}
 for p in items:
  label=p['name'];k=norm(label)
  if re.search(r'\b(?:unidentified|unnamed|unknown)\b',label,re.I):continue
  if k not in merged:merged[k]={'name':label,'aliases':set()}
  merged[k]['aliases'].update(p.get('aliases',[]));merged[k]['aliases'].update(manual.get(label,[]))
 for p in merged.values():p['points']=100 if p['name']==rare else 10 if p['name']in familiar else 30 if p['name']in common else 60 if len(p['name'])<21 else 85
 # A shared nickname goes to one valid character, with familiar names taking
 # precedence. It never creates a second answer identity or an acronym.
 owners=collections.defaultdict(list)
 for k,p in merged.items():
  for a in p['aliases']:
   if norm(a)not in merged:owners[norm(a)].append(k)
 chosen={a:min(keys,key=lambda k:(merged[k]['points'],merged[k]['name']))for a,keys in owners.items()}
 tiers=collections.defaultdict(list)
 for k,p in merged.items():
  aliases=sorted({a for a in p['aliases']if norm(a)!=k and chosen.get(norm(a))==k})
  tiers[str(p['points'])].append('~'.join([p['name'],*aliases]))
 exact={norm(a)for v in tiers.values()for r in v for a in r.split('~')}
 assert all(norm(n)in exact for n in familiar),(key,'missing familiar entry')
 assert not any(norm(n)in exact for n in wrong.split('|')),(key,'out-of-scope character')
 assert norm(rare)in merged,(key,'missing rarity anchor')
 qs.append(dict(id='authored-'+key,concept=key,family=family,topic=topic,prompt=prompt,scope=scope,format='whole-roster',rationale='A whole recognizable cast or roster, with six separate familiar-name cases. It is not split into extra questions by element, role, release year or a second tag.',familiar=familiar,exclude=wrong.split('|'),references=refs,answers=dict(tiers)))
add('dota-heroes','gaming','Pick your hero','Name a playable hero in Dota 2.',
 'The complete official playable hero roster in the October 25, 2026 snapshot counts. Items, cosmetics and non-playable creeps are not heroes.',s['dota'],
 'Pudge|Invoker|Anti-Mage|Crystal Maiden|Juggernaut|Axe','Garen|Tracer','Largo',
 ['https://www.dota2.com/datafeed/herolist?language=english','https://www.dota2.com/heroes'],
 'Sniper|Lina|Luna|Zeus|Tiny|Tusk|Viper|Phantom Assassin|Shadow Fiend|Drow Ranger|Earthshaker|Bounty Hunter|Lion|Wraith King|Windranger|Nature\'s Prophet|Morphling|Storm Spirit|Sven|Puck|Mirana|Tidehunter|Witch Doctor|Kunkka|Rubick|Slark|Slardar|Faceless Void|Spirit Breaker|Ursa|Broodmother|Lifestealer|Monkey King|Legion Commander|Dazzle|Riki|Sand King|Silencer|Necrophos|Medusa|Spectre|Doom|Gyrocopter|Huskar|Alchemist')
add('overwatch-heroes','gaming','Heroes never die','Name a playable hero in Overwatch.',
 'The full official Overwatch roster in the October 25, 2026 snapshot counts, including heroes introduced while it was called Overwatch 2. Skins and unplayable story characters do not.',s['overwatch'],
 'Tracer|Mercy|Genji|D.Va|Reinhardt|Soldier: 76','Master Chief|Pudge','Doctrine',
 ['https://overwatch.blizzard.com/en-us/heroes/','https://news.blizzard.com/en-us/article/24246206/overwatch-spotlight-the-reign-of-talon-begins'],
 'Winston|Reaper|Widowmaker|Hanzo|Junkrat|Mei|Bastion|Zenyatta|Roadhog|Ana|Orisa|Moira|Zarya|Pharah|Doomfist|Sombra|Lúcio|Torbjörn|Brigitte|Ashe|Baptiste|Echo|Sigma|Kiriko|Sojourn|Junker Queen|Lifeweaver|Illari|Mauga|Venture|Juno',
 {'Cassidy':['Cole Cassidy','Jesse McCree','McCree'],'Wrecking Ball':['Hammond']})
# Nintendo's website groups 3 Mii types and 3 Pokémon under shared pages;
# Pyra and Mythra have separate fighter numbers. Split only these real fighters,
# not costume colors. Other alternate-costume names share their fighter's ID.
smash=[]
pretty={'MR. GAME & WATCH':'Mr. Game & Watch','Wii Fit TRAINER':'Wii Fit Trainer','Mii FIGHTER':'Mii Fighter','R.O.B.':'R.O.B.','DR. MARIO':'Dr. Mario','KING K. ROOL':'King K. Rool'}
for p in s['smash']:
 label=pretty.get(p['name'],p['name'].title());label=re.sub(r'\s+',' ',label).strip()
 if p['name']=='Mii FIGHTER':smash.extend({'name':n}for n in ['Mii Brawler','Mii Swordfighter','Mii Gunner'])
 elif p['name']=='POKÉMON TRAINER':smash.extend({'name':n}for n in ['Squirtle','Ivysaur','Charizard'])
 elif p['name']=='PYRA / MYTHRA':smash.extend({'name':n}for n in ['Pyra','Mythra'])
 elif p['name']=='STEVE / ALEX':smash.append({'name':'Steve','aliases':['Alex','Zombie','Enderman']})
 else:smash.append({'name':label})
assert len(smash)==89,len(smash)
add('smash-ultimate-fighters','gaming','Everybody is here','Name a playable fighter in Super Smash Bros. Ultimate.',
 'All base-game, Echo and DLC fighters count. Pokémon Trainer\'s three Pokémon, the three Mii fighting styles, and Pyra/Mythra count separately. Alternate costumes share the original fighter\'s answer; Assist Trophies do not count.',smash,
 'Mario|Pikachu|Kirby|Link|Sonic|Samus','Waluigi|Crash Bandicoot','Mii Swordfighter',
 ['https://www.smashbros.com/en_US/fighter/','https://www.smashbros.com/assets_v2/data/fighter.json'],
 'Luigi|Donkey Kong|Yoshi|Peach|Bowser|Zelda|Mewtwo|Fox|Captain Falcon|Ness|Jigglypuff|Sheik|Marth|Roy|Cloud|Sephiroth|Steve|Sora|Snake|Mega Man|Pac-Man|Samus|King Dedede|King K. Rool|Diddy Kong|Wario|Lucario|Charizard|Squirtle|Ivysaur|Pichu|Pit|Olimar|Villager|Isabelle|Shulk|Ryu|Ken|Terry|Kazuya|Bayonetta|Joker|Inkling|Piranha Plant|Daisy|Dr. Mario',
 {'Mr. Game & Watch':['Mr Game and Watch','Game and Watch'],'Ice Climbers':['Popo','Nana'],'Olimar':['Alph'],'Rosalina & Luma':['Rosalina','Luma','Rosalina and Luma'],'Bowser Jr.':['Bowser Junior','Iggy','Larry','Lemmy','Ludwig','Morton','Roy Koopa','Wendy'],'Banjo & Kazooie':['Banjo','Kazooie','Banjo and Kazooie'],'Duck Hunt':['Duck Hunt Duo'],'Terry':['Terry Bogard'],'Cloud':['Cloud Strife'],'Kazuya':['Kazuya Mishima'],'Samus':['Samus Aran'],'R.O.B.':['Robotic Operating Buddy'],'Charizard':['Pokemon Trainer','Pokémon Trainer']})
add('legendary-mythical-pokemon','gaming','Legend has it','Name a Legendary or Mythical Pokémon.',
 'Species classified as Legendary or Mythical in the pinned PokéAPI data count. Forms share their species\' answer identity. Pseudo-Legendary is a fan label and does not make a species Legendary.',s['pokemonLegendaryMythical'],
 'Mewtwo|Mew|Rayquaza|Arceus|Lugia|Ho-Oh','Pikachu|Charizard','Phione',
 ['https://pokeapi.co/docs/v2#pokemon-species','https://github.com/PokeAPI/pokeapi/tree/'+s['pokeapiCommit']+'/data/v2/csv'],
 'Articuno|Zapdos|Moltres|Entei|Raikou|Suicune|Celebi|Groudon|Kyogre|Latios|Latias|Jirachi|Deoxys|Dialga|Palkia|Giratina|Darkrai|Shaymin|Victini|Reshiram|Zekrom|Kyurem|Xerneas|Yveltal|Zygarde|Solgaleo|Lunala|Necrozma|Zacian|Zamazenta|Eternatus|Koraidon|Miraidon')
hp=s['harryPotter']
add('wizarding-world-characters','culture','Names in the record','Name a character from the Harry Potter books or films.',
 'Identifiable characters in the Harry Potter novels, films and their epilogues count, including creatures, ghosts and portraits. Real actors are not their fictional characters. Same-name characters share one answer identity.',hp,
 'Harry Potter|Hermione Granger|Ron Weasley|Albus Dumbledore|Rubeus Hagrid|Severus Snape','Gandalf|Percy Jackson','Godelot',
 ['https://hp-api.onrender.com/api/characters','https://hp-api.onrender.com/'],
 'Lord Voldemort|Draco Malfoy|Sirius Black|Remus Lupin|Neville Longbottom|Luna Lovegood|Ginny Weasley|Fred Weasley|George Weasley|Molly Weasley|Arthur Weasley|Dobby|Lucius Malfoy|Bellatrix Lestrange|Dolores Umbridge|Minerva McGonagall|Cedric Diggory|Cho Chang|Alastor Moody|Fleur Delacour|Viktor Krum|Peter Pettigrew|Nymphadora Tonks|Narcissa Malfoy|Percy Weasley|Bill Weasley|Charlie Weasley|James Potter|Lily Potter|Hedwig|Crookshanks|Fawkes|Nagini|Buckbeak|Aragog|Fang|Fluffy|Kreacher|Winky|Griphook|Gilderoy Lockhart|Filius Flitwick|Pomona Sprout|Sybill Trelawney|Horace Slughorn|Garrick Ollivander|Argus Filch|Quirinus Quirrell|Madam Pomfrey|Poppy Pomfrey|Vernon Dursley|Petunia Dursley|Dudley Dursley',
 {'Rubeus Hagrid':['Hagrid'],'Albus Dumbledore':['Dumbledore','Professor Dumbledore'],'Severus Snape':['Snape','Professor Snape'],'Minerva McGonagall':['McGonagall','Professor McGonagall'],'Lord Voldemort':['Voldemort','Tom Riddle','Tom Marvolo Riddle'],'Ron Weasley':['Ron','Ronald Weasley'],'Hermione Granger':['Hermione'],'Draco Malfoy':['Draco'],'Aurora Sinistra':['Professor Sinistra'],'Neville Longbottom':['Neville'],'Luna Lovegood':['Luna']})
target=ROOT/'data-snapshots/authored/batches/05-whole-character-rosters.json'
text=json.dumps({'version':1,'questions':qs},ensure_ascii=False,indent=2)+'\n'
if '--check'in sys.argv:assert target.read_text()==text,'Rebuild character roster questions'
else:target.write_text(text)
print([(q['id'],sum(map(len,q['answers'].values())))for q in qs])
