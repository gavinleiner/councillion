"""Build original, source-backed trivia packs; no network requests at play time.
See DATA-SOURCES.md. Run with --source-dir pointing at the recorded snapshot.
"""
from pathlib import Path
import argparse,json,re,unicodedata,math,collections,csv,zipfile,io,hashlib
from wordfreq import zipf_frequency
parser=argparse.ArgumentParser();parser.add_argument('--source-dir',type=Path,default=Path(__file__).resolve().parents[1]/'data-snapshots'/'expansion');parser.add_argument('--output-dir',type=Path,default=Path(__file__).resolve().parents[1]);args=parser.parse_args();src=args.source_dir;root=args.output_dir
used=set();packs=[];omitted=[]
def load(path):
 used.add(path);return json.loads((src/path).read_text())
def corp(path,key=None):
 v=load('corpora/'+path+'.json');return v[key] if key else v
normalize=lambda s:re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower())
def clean(s):return re.sub(r'\s+',' ',str(s)).strip()
def entry(s,aliases=(),pop=0):return {'label':clean(s),'aliases':list(aliases),'pop':pop}
def acceptable(label):
 return 2<=len(label)<=100 and bool(re.search('[A-Za-z]',unicodedata.normalize('NFKD',label))) and not re.match(r'^(?:Q\d+|Category:|Template:|Wikimedia |list of |unnamed |unknown |hypothetical )',label,re.I) and not re.search(r'\b(?:fuck|fucking|shit|nigger|niggers|faggot|faggots)\b',label,re.I)
def bank(id,family,topic,prompt,items,source,group=None,common=(),familiar=(),gems=(),min_answers=40):
 merged={}
 for item in items:
  if isinstance(item,str):item=entry(item)
  label=clean(item['label']);key=normalize(label)
  if not acceptable(label)or not key:continue
  if key not in merged:merged[key]={**item,'label':label,'aliases':list(item.get('aliases',[]))}
  else:
   old=merged[key];old['aliases']+=item.get('aliases',[])+([label]if label!=old['label']else[]);old['pop']=max(old.get('pop',0),item.get('pop',0))
 if len(merged)<min_answers:
  omitted.append((id,len(merged)));return
 rows=list(merged.values());owners=collections.defaultdict(set)
 for a in rows:
  for s in [a['label']]+a['aliases']:owners[normalize(s)].add(normalize(a['label']))
 common={normalize(x)for x in common};familiar={normalize(x)for x in familiar};gems={normalize(x)for x in gems}
 for a in rows:
  a['aliases']=sorted({clean(x)for x in a['aliases'] if acceptable(clean(x)) and len(clean(x))<=100 and normalize(x)!=normalize(a['label']) and len(owners[normalize(x)])==1})[:12]
  f=zipf_frequency(a['label'].lower(),'en')
  if family=='words':
   w=a['label'].lower();bases=[]
   if w.endswith('ies'):bases.append(w[:-3]+'y')
   for ending in ['s','es','ed','ing']:
    if w.endswith(ending):
     b=w[:-len(ending)];bases.extend([b,b+'e',b[:-1]if len(b)>2 and b[-1]==b[-2]else b])
   f=max([f]+[zipf_frequency(b,'en')for b in bases if b in wordset])
  # Source prominence is a broad familiarity hint; it is not player answer frequency.
  if a.get('pop',0)>0:f=max(f,1.4+math.log10(a['pop']+1)*1.05)
  a['_f']=f;key=normalize(a['label'])
  a['points']=10 if key in common or f>=5 else 30 if key in familiar or f>=4.1 else 60 if f>=3.1 else 85
  if key in gems:a['points']=100
 if not any(a['points']==100 for a in rows):
  candidates=[a for a in rows if a['points']==85 and len(a['label'])<=40]or[a for a in rows if a['points']>=60]or rows
  chosen=min(candidates,key=lambda a:(a['_f'],len(a['label']),a['label']));chosen['points']=100
 rows=sorted(rows,key=lambda a:(-a['_f'],a['label'].casefold()))
 for a in rows:
  for k in ['_f','pop','id']:a.pop(k,None)
 packs.append({'id':id,'family':family,'topic':topic,'prompt':prompt,'source':source,'ranking':'familiarity-v2','group':group or id,'dailyEligible':True,'answers':rows})
def cp(id,fam,topic,prompt,path,key,field=None,**kw):
 a=corp(path,key);a=[entry(x[field])if field and isinstance(x,dict) else x for x in a]
 bank(id,fam,topic,prompt,a,'Corpora, Darius Kazemi and contributors, CC0; '+path+'.json. Snapshot 2026-10-22.',**kw)
# Distinct broad subjects; source quirks and narrow subsets are handled below.
defs=[
('apple-varieties','food','THE ORCHARD','Name an apple cultivar, including heritage varieties.','foods/apple_cultivars','cultivars',None),
('sandwiches','food','BETWEEN THE SLICES','Name a named sandwich or established sandwich filling combination.','foods/sandwiches','sandwiches','name'),
('sausage-varieties','food','LINKS IN THE CHAIN','Name a type of sausage, including regional and cured varieties.','foods/sausages','sausages',None),
('tea-varieties','food','STEEPED IN TRADITION','Name a tea, tea style, or established herbal infusion. Named blends count.','foods/tea','teas',None),
('culinary-fruits','food','BEYOND THE FRUIT BOWL','Name a culinary fruit, including regional names and cultivated varieties.','foods/fruits','fruits',None),
('culinary-vegetables','food','THE GREENGROCER','Name a vegetable or edible plant part commonly cooked as a vegetable.','foods/vegetables','vegetables',None),
('edible-fish','food','ON THE FISHMONGER’S SLAB','Name a fish eaten as food. Species and established market names count.','foods/fish','fish',None),
('edible-shellfish','food','SHELLS AT THE TABLE','Name an edible shellfish or other edible aquatic invertebrate. Cephalopods count.','foods/shellfish','fish',None),
('cocktail-names','food','THE MIXOLOGIST’S INDEX','Name a classic or named cocktail.','foods/iba_cocktails','cocktails',None),
('dog-breeds','nature','CANINE COUNSEL','Name a dog breed, including historical breeds.','animals/dogs','dogs',None),
('horse-breeds','nature','THE STABLE REGISTER','Name a horse breed, including historical and regional breeds.','animals/horses','horses',None),
('pony-breeds','nature','SMALL HORSES, BIG REPUTATIONS','Name a pony breed, including historical and regional breeds.','animals/ponies','ponies',None),
('donkey-breeds','nature','THE LONG-EARED REGISTER','Name a donkey breed, including historical and regional breeds.','animals/donkeys','donkeys',None),
('cat-breeds','nature','FELINE LINEAGES','Name a cat breed, including experimental and historical breeds.','animals/cats','cats',None),
('rabbit-breeds','nature','BEYOND THE RABBIT HUTCH','Name a rabbit breed.','animals/rabbits','rabbits',None),
('cephalopod-body','nature','ANATOMY OF AN OCTOPUS','Name an anatomical structure found in an octopus, squid, cuttlefish, or nautilus.','animals/cephalopod_anatomy','parts',None),
('ant-body','nature','SMALL-SCALE ANATOMY','Name an anatomical structure found in an ant.','animals/ant_anatomy','parts',None),
('flower-names','nature','IN BLOOM','Name a flowering plant commonly grown for its flowers.','plants/flowers','flowers',None),
('plant-common-names','nature','THE FIELD BOTANIST','Name a plant by a common name. Trees, shrubs, herbs, and garden plants count.','plants/plants','plants','name'),
('gem-materials','science','THE LAPIDARY’S CABINET','Name a mineral or other natural material used as a gemstone.','materials/gemstones','gemstones',None),
('weather-conditions','science','READING THE SKY','Name a weather condition or atmospheric phenomenon.','science/weather_conditions','conditions',None),
('meteorology-terms','science','THE WEATHER DESK','Name a term used in meteorology, including weather phenomena, processes, and instruments.','science/meteorology','meteorology',None),
('computing-disciplines','science','BRANCHES OF COMPUTING','Name a computing field, method, or computer-science topic.','technology/computer_sciences','computer_sciences',None),
('geographical-features','world','SHAPING THE EARTH','Name a natural geographical feature or landform. Human-made features do not count.','geography/geographic_features','entries',None),
('human-geographical-features','world','PEOPLE CHANGE THE LAND','Name a human-made geographical feature or type of built site.','geography/anthropogenic_features','entries',None),
('named-winds','world','WHICH WAY THE WIND BLOWS','Name a regional or named wind, including historical names.','geography/winds','winds',None),
('seas-and-gulfs','world','BEYOND THE FIVE OCEANS','Name a sea, gulf, bay, or strait.','geography/oceans','seas','name'),
('london-tube-stations','world','MIND THE GAP','Name a London Underground station, including former station names.','geography/london_underground_stations','stations','name'),
('english-towns','world','A MAP OF ENGLAND','Name a town or city in England.','geography/english_towns_cities','towns',None),
('music-styles','culture','WHAT’S YOUR GENRE?','Name a musical genre or subgenre.','music/genres','genres',None),
('guitar-makers','culture','ON THE HEADSTOCK','Name a guitar manufacturer or established guitar brand, including historical makers.','music/a_list_of_guitar_manufacturers','guitar manufacturing companies','name'),
('board-game-titles','culture','AROUND THE TABLE','Name a board game or tabletop strategy game. Named games and commercial titles count.','games/board_games','games',None),
('tolkien-characters','culture','THERE AND BACK AGAIN','Name a character from Tolkien’s Middle-earth writings.','humans/tolkienCharacterNames','names',None),
('egyptian-deities','culture','BY THE NILE','Name an Egyptian deity, including regional forms and alternate names.','mythology/egyptian_gods','egyptian_gods',None),
('literary-authors','culture','THE BOOKSHELF’S BYLINES','Name an author of a published book. Fiction and nonfiction writers count.','humans/authors','authors',None),
('tabletop-rpgs','culture','ROLL FOR INITIATIVE','Name a tabletop role-playing game.','games/rpg/rpg_games','rpgs',None),
('obsolete-jobs','everyday','JOBS TIME FORGOT','Name a historical occupation or obsolete job title.','humans/obsolete-occupations','occupations',None),
('occupation-titles','everyday','A DIFFERENT LINE OF WORK','Name an occupation or recognized job title.','humans/occupations','occupations',None),
('fabric-types','everyday','THE FABRIC SHOP','Name a fabric or textile type, including named weaves and historical cloths.','materials/fabrics','fabrics',None),
('clothing-items','everyday','WHAT’S IN THE WARDROBE?','Name an item or established style of clothing.','objects/clothing','clothes',None),
('household-appliances','everyday','PLUGGED INTO DAILY LIFE','Name an appliance or powered device used in a home.','technology/appliances','appliances',None),
('room-types','everyday','BEHIND THE DOOR','Name a type of room or specialized indoor space.','architecture/rooms','rooms',None),
('rope-knots','everyday','TIED UP','Name a knot, bend, hitch, splice, or named rope arrangement.','technology/knots','knots',None),
('programming-languages','everyday','SPEAKING TO MACHINES','Name a programming language, including historical languages and recognized dialects.','technology/programming_languages',None,None),
('web-colour-names','everyday','COLOURS THE BROWSER KNOWS','Name a standard CSS named colour. Hex codes and RGB numbers do not count.','colors/web_colors','colors','color'),
('named-colours','everyday','A MORE PRECISE SHADE','Name a named colour, including traditional and artists’ colour names. Numbers alone do not count.','colors/wikipedia',None,'name'),
('academic-fields','science','BEYOND THE SCHOOL TIMETABLE','Name an academic discipline or specialized field of study.','books/academic_subjects','subjects',None),
]
for row in defs:
 try:cp(*row)
 except (KeyError,TypeError)as e:omitted.append((row[0],str(e)))
# Repair source scope rather than admit generic verbs such as “be” and “add”.
prep=corp('foods/verbs','verbs');reject=set('add allow alternate arrange be carry circle cover divide drop finish fold follow form gather give hold increase leave let line make match move open place put reach reduce remove repeat rest return roll run save scatter select separate serve set shape slip stand start stick stop strain take taste transfer turn use work wrap'.split())
prep=[x for x in prep if x.lower()not in reject]
conjugations={r['infinitive'][0]:r.get('gerund',[])+r.get('participle',[]) for r in corp('words/verbs_with_conjugations')}
bank('food-preparation-verbs','food','FROM RECIPE TO VERB','Name a specific food-preparation action or cooking technique, such as braising or julienning.',[entry(x,conjugations.get(x,[]))for x in prep], 'Corpora foods/verbs.json, CC0; generic instructional verbs removed.',common=['bake','boil','fry','grill','chop','roast'],group='food-techniques')
peppers=[x for k,v in corp('foods/hot_peppers').items()if isinstance(v,list)for x in v]
bank('pepper-varieties','food','TURN UP THE HEAT','Name a pepper variety or cultivar. Sweet peppers count too.',peppers,'Corpora foods/hot_peppers.json, CC0.',common=['Jalapeño','Habanero','Cayenne','Bell pepper'],group='food-plants')
# Sandwich names get common forms; aliases must not create new canonical answers.
for p in packs:
 if p['id']=='sandwiches':
  for a in p['answers']:
   if not a['label'].lower().endswith('sandwich'):a['aliases'].append(a['label']+' sandwich')
# North-American bird families, combined by real taxonomic/field-guide groups.
bs=corp('animals/birds_north_america','birds')
birdsets=[('waterfowl','ON THE POND','Name a duck, goose, or swan species recorded in North America.',['Ducks, Geese, and Swans']),('wading-shorebirds','AT THE WATER’S EDGE','Name a heron, egret, ibis, spoonbill, stork, rail, plover, sandpiper, or phalarope species recorded in North America.',['Bitterns, Herons, and Allies','Ibises and Spoonbills','Storks','Rails, Gallinules, and Coots','Lapwings and Plovers','Sandpipers, Phalaropes, and Allies']),('birds-of-prey','EYES ON THE HUNT','Name a hawk, kite, eagle, falcon, vulture, or owl species recorded in North America.',['Hawks, Kites, Eagles, and Allies','Typical Owls','Barn-Owls','Caracaras and Falcons','New World Vultures']),('seabirds','OVER OPEN WATER','Name a shearwater, petrel, storm-petrel, albatross, gull, tern, skimmer, auk, murre, or puffin species recorded in North America.',['Shearwaters and Petrels','Storm-Petrels','Albatrosses','Gulls, Terns, and Skimmers','Auks, Murres, and Puffins']),('warblers-sparrows','THE SMALL SONGBIRDS','Name a New World warbler or sparrow species recorded in North America. Towhees and juncos count.',['Wood-Warblers','Emberizids']),('forest-songbirds','SONGS IN THE TREES','Name a thrush, vireo, jay, crow, blackbird, or finch species recorded in North America.',['Thrushes','Vireos','Jays and Crows','Blackbirds','Fringilline and Cardueline Finches and Allies'])]
for slug,topic,prompt,families in birdsets:
 bank('bird-'+slug,'nature',topic,prompt,[x for g in bs if g['family']in families for x in g['members']],'Corpora historical ABA North-America checklist, CC0; selected field-guide families.',group='bird-species')
# Source-backed taxonomy; only English-labelled, traceable records are admitted.
wddefs=[
('soups','food','SOUP’S ON','Name a named soup or established soup variety.','food-soups'),('cakes','food','LET THEM NAME CAKE','Name a cake, torte, or established cake variety.','food-baking'),('breads','food','FLOUR, WATER, TRADITION','Name a bread or established regional bread variety. Flatbreads count.','food-breads'),('desserts','food','ROOM FOR DESSERT','Name a dessert, sweet dish, or confection.','food-sweets'),('salads','food','MORE THAN LETTUCE','Name a named salad or established salad variety.','food-salads'),('rice-dishes','food','AROUND THE WORLD IN RICE','Name a named dish made with rice.','food-rice'),('dumplings','food','WRAPPED, FILLED, OR DROPPED','Name a dumpling or established regional dumpling variety.','food-dumplings'),('noodles','food','LONG STRANDS','Name a type of noodle or a named noodle dish.','food-noodles'),('pasta','food','PASTA SHAPES AND PLATES','Name a pasta shape or named pasta dish.','food-pasta'),('fermented-foods','food','TIME DOES THE COOKING','Name a fermented food or drink, including named traditional varieties.','food-fermentation'),('street-foods','food','FROM A STREET-FOOD STALL','Name a food or named dish traditionally sold as street food.','food-street'),('flatbreads','food','ON THE GRIDDLE','Name a flatbread or established regional flatbread variety.','food-breads'),('stews','food','LOW AND SLOW','Name a stew or named stew variety.','food-stews'),('snacks','food','BETWEEN MEALS','Name a snack food or established named snack. Brands of specific snacks count.','food-snacks'),('coffee-drinks','food','MORE THAN A BLACK COFFEE','Name a coffee drink or established coffee preparation.','food-drinks'),('confectionery','food','THE SWEET COUNTER','Name a confection, candy, or established sweet variety.','food-sweets'),('edible-nuts','food','CRACKING THE CASE','Name an edible nut or seed commonly treated as a culinary nut.','food-plants'),('citrus','food','ZEST FOR KNOWLEDGE','Name a citrus fruit, cultivar, or hybrid.','food-plants'),
('mineral-species','science','THE MINERAL CABINET','Name a mineral species or recognized mineral variety.','minerals'),('space-missions','science','MISSION CONTROL','Name a named space mission, including uncrewed and planned missions.','space-exploration'),('space-probes','science','ROBOTIC EXPLORERS','Name an uncrewed space probe or planetary lander.','space-exploration'),('physical-laws','science','THE LAWS OF NATURE','Name a named scientific law or physical principle.','physics'),('mathematical-theorems','science','Q.E.D.','Name a mathematical theorem. Named lemmas and corollaries count.','mathematics'),('geometric-clean','science','SHAPE OF THINGS','Name a named geometric shape, solid, or family of geometric figures.','mathematics'),('branches-mathematics','science','A BRANCH OF MATHEMATICS','Name a branch or specialized field of mathematics.','mathematics'),('cloud-types','science','CLOUD ATLAS','Name a cloud type, species, or recognized cloud formation.','atmosphere'),
('ocean-currents','world','MOVING SEAS','Name a named ocean current.','oceanography'),('writing-systems','world','HOW WE WRITE','Name a writing system, script, or named alphabet. Historical scripts count.','languages'),
('instrument-types','culture','THE ORCHESTRA AND BEYOND','Name a type of musical instrument. Named instrument families count.','music-instruments'),('percussion-types','culture','HIT, SHAKE, SCRAPE','Name a percussion instrument.','music-instruments'),('string-instrument-types','culture','ON STRINGS','Name a stringed musical instrument.','music-instruments'),('wind-instrument-types','culture','SOUND ON THE AIR','Name a wind instrument, including brass and woodwind instruments.','music-instruments'),('electronic-instrument-types','culture','ELECTRONIC SOUNDMAKERS','Name an electronic musical instrument or named synthesizer model.','music-instruments'),('genre-clean','culture','A MUSICAL FAMILY TREE','Name a musical genre or subgenre.','music-genres'),('rock-subgenres','culture','ROCK’S BRANCHES','Name a rock-music genre or subgenre.','music-genres'),('jazz-subgenres','culture','ALL THAT JAZZ','Name a jazz genre or established jazz style.','music-genres'),('electronic-subgenres','culture','FROM THE CIRCUIT BOARD','Name an electronic-music genre or subgenre.','music-genres'),('folk-subgenres','culture','LOCAL ROOTS','Name a folk-music genre or regional folk style.','music-genres'),('dances','culture','LEARN THE STEPS','Name a dance style, traditional dance, or named social dance.','dance'),('card-games','culture','DEAL ME IN','Name a card game, including games with a dedicated card deck.','tabletop-games'),('mythical-creature-types','culture','FROM MYTH AND FANTASY','Name a type of creature from mythology, folklore, or fantasy.','mythology'),('architecture-clean','culture','THE BUILT TRADITION','Name an architectural style or movement.','art-styles'),('art-clean','culture','BREAKING WITH TRADITION','Name an art movement or artistic style.','art-styles'),('musical-terms','culture','ON THE MUSICAL SCORE','Name an established musical term or instruction.','music-theory'),('musical-scales','culture','SCALES AND MODES','Name a musical scale, mode, or named scale family.','music-theory'),('poetic-forms','culture','THE SHAPE OF A POEM','Name a poetic form or named verse structure.','literature'),('rhetorical-types','culture','WORDS WITH AN EFFECT','Name a rhetorical or stylistic device.','literature'),('literary-clean','culture','A DIFFERENT KIND OF STORY','Name a literary genre or subgenre.','literature'),('fictional-robots','culture','SOME ASSEMBLY REQUIRED','Name a named fictional robot or android.','fiction-characters'),('fictional-dragons','culture','HERE BE DRAGONS','Name a named dragon from fiction.','fiction-characters'),('fictional-detectives','culture','ON THE FICTIONAL CASE','Name a fictional detective.','fiction-characters'),
('furniture-types','everyday','A ROOM TO FURNISH','Name a type or established style of furniture.','home'),('jewelry-types','everyday','SMALL ADORNMENTS','Name a type or established style of jewellery.','clothing'),('hand-tool-types','everyday','BY HAND','Name a type of hand tool.','tools'),('textile-types','everyday','WEAVE, KNIT, FELT','Name a textile, fabric, or named weave.','textiles'),('printing-techniques','everyday','MAKING AN IMPRESSION','Name a printing or printmaking technique.','printing')]
for key,fam,topic,prompt,group in wddefs:
 path='sources/wd-'+key+'.json'
 if not(src/path).exists():omitted.append((key,'source missing'));continue
 v=load(path);items=[entry(x['label'],x['aliases'],x.get('links',0))for x in v['rows']]
 # Some roots contain individual museum instruments; class-only snapshots are used above.
 if key=='electronic-instrument-types':items=[x for x in items if not re.search(r'\b(?:microphone|loudspeaker|amplifier|headphone)\b',x['label'],re.I)]
 bank('catalog-'+key,fam,topic,prompt,items,'Wikidata contributors, CC0; recorded query '+v['root']+' in '+path+'; snapshot 2026-10-22.',group=group,min_answers=30 if key in ['fictional-detectives','cloud-types'] else 40)

cp('modern-art-movements','culture','A BREAK WITH TRADITION','Name a modern art movement, artistic school, or recognized visual-art style.','art/isms','isms',group='art-styles')

# Lexical challenges use precise predicates, not invented answer lists.
lexicon=(src.parent/'enable1.txt').read_text().splitlines();words=[w for w in lexicon if len(w)>=3 and acceptable(w)];wordset=set(words)
phon=collections.defaultdict(list)
for line in (src.parent/'cmudict.txt').read_text().splitlines():
 parts=line.split()
 if len(parts)<2:continue
 w=re.sub(r'\(\d+\)$','',parts[0]);phon[w].append(parts[1:])
lexsource='ENABLE public-domain lexicon; CMU Pronouncing Dictionary BSD license where pronunciation is used. Exact lexical predicate; proper names excluded.'
vowels=set('aeiou');roman=set('mdclxvi');left=set('qwertasdfgzxcvb');right=set('yuiophjklnm');top=set('qwertyuiop')
lexdefs=[
('palindromes','BACK TO FRONT','Name an English palindrome of at least three letters, such as “level”.',lambda w:w==w[::-1]),
('roman-letter-words','WHEN IN ROME','Name an English word of at least three letters made only from Roman-numeral letters: I, V, X, L, C, D, M.',lambda w:set(w)<=roman),
('top-row-words','THE TYPEWRITER CHALLENGE','Name an English word of at least five letters typed only on the top letter row: QWERTYUIOP.',lambda w:len(w)>=5 and set(w)<=top),
('left-hand-words','LEFT HAND ONLY','Name an English word of at least six letters typed only with standard left-hand touch-typing letters: QWERTASDFGZXCVB.',lambda w:len(w)>=6 and set(w)<=left),
('right-hand-words','RIGHT HAND ONLY','Name an English word of at least four letters typed only with standard right-hand touch-typing letters: YUIOPHJKLNM.',lambda w:len(w)>=4 and set(w)<=right),
('all-five-vowels','THE WHOLE VOWEL SET','Name an English word containing A, E, I, O, and U. They may appear in any order.',lambda w:vowels<=set(w)),
('y-as-only-vowel','WHY IS THE VOWEL?','Name an English word of at least four letters containing Y but no A, E, I, O, or U.',lambda w:len(w)>=4 and 'y'in w and not(vowels&set(w))),
('vowels-in-order','AN ORDERLY VOWEL PARADE','Name an English word whose vowels include A, E, I, O, U in that order, such as “facetious”.',lambda w:bool(re.search('a[^aeiou]*e[^aeiou]*i[^aeiou]*o[^aeiou]*u',w))),
('three-double-pairs','SEEING DOUBLE, THREE TIMES','Name an English word containing at least three pairs of identical adjacent letters.',lambda w:len(re.findall(r'(.)\1',w))>=3),
('four-consonants','A CONSONANT CLUSTER','Name an English word containing at least five consonant letters in a row. Y counts as a consonant here.',lambda w:bool(re.search('[^aeiou]{5}',w))),
('bookend-syllables','MATCHING ENDS','Name an English word of at least seven letters with the same first three and last three letters.',lambda w:len(w)>=7 and w[:3]==w[-3:]),
('alphabet-run','LETTERS IN A ROW','Name an English word containing three consecutive alphabet letters in order, such as DEF or STU.',lambda w:any('abcdefghijklmnopqrstuvwxyz'[i:i+3]in w for i in range(24))),
('word-ology','THE STUDY OF ENDINGS','Name an English word ending in -ology.',lambda w:w.endswith('ology')),
('word-phobia','A FEARFUL ENDING','Name an English word ending in -phobia.',lambda w:w.endswith('phobia')),
('word-mancy','READING THE SIGNS','Name an English word ending in -mancy, a divination term.',lambda w:w.endswith('mancy')),
('word-auto','SELF-STARTERS','Name an English word beginning with AUTO-.',lambda w:w.startswith('auto')),
('word-micro','SMALL BEGINNINGS','Name an English word beginning with MICRO-.',lambda w:w.startswith('micro')),
('word-geo','EARTH AT THE START','Name an English word beginning with GEO-.',lambda w:w.startswith('geo')),
('word-tele','FROM A DISTANCE','Name an English word beginning with TELE-.',lambda w:w.startswith('tele')),
('word-chrono','TIME AT THE START','Name an English word beginning with CHRONO-.',lambda w:w.startswith('chrono')),
]
for key,topic,prompt,predicate in lexdefs:bank('lex-'+key,'words',topic,prompt,[w for w in words if predicate(w)],lexsource,group='lex-'+key)
def syllables(pron):return sum(any(c.isdigit()for c in p)for p in pron)
bank('lex-long-monosyllables','words','ONE BEAT, MANY LETTERS','Name an English word of at least seven letters pronounced as one syllable in a standard pronunciation.',[w for w in words if len(w)>=7 and any(syllables(p)==1 for p in phon[w])],lexsource,group='pronunciation')
pronwords=collections.defaultdict(set)
for w in words:
 for pron in phon[w]:pronwords[tuple(re.sub('[0-9]','',x)for x in pron)].add(w)
homophones={w for group in pronwords.values()if len(group)>1 for w in group}
bank('lex-homophones','words','SAME SOUND, DIFFERENT SPELLING','Name an English word with another English word pronounced exactly the same way in at least one standard pronunciation.',homophones,lexsource,group='pronunciation')
def rime(pron):
 stressed=[i for i,p in enumerate(pron)if p.endswith(('1','2'))]
 if not stressed:return None
 return tuple(re.sub('[0-9]','',p)for p in pron[stressed[-1]:])
for target in ['night','day','blue','green','sound','face','heart','air','go','red','ball','door']:
 rhymes={rime(p)for p in phon[target]};rhymes.discard(None)
 items=[w for w in words if w!=target and any(rime(p)in rhymes for p in phon[w])]
 bank('rhyme-'+target,'words','RHYMES WITH '+target.upper(),'Name an English word that rhymes with “'+target+'” in at least one standard pronunciation. Proper names do not count.',items,lexsource,group='rhymes')
# Nobel data: factual names/award categories only; no biography or motivation text.
nobel=load('sources/nobel-laureates.json')['laureates'];nobel=[x for x in nobel if any(int(p['awardYear'])<=2025 for p in x['nobelPrizes'])]
def nobelrow(x):
 label=x.get('knownName',x.get('orgName',{})).get('en','');full=x.get('fullName',{}).get('en','');last=x.get('familyName',{}).get('en','')
 return entry(label,[v for v in [full,last]if v and len(v)>=4],60)
for category,family,topic in [('Physics','science','NOBEL IDEAS: PHYSICS'),('Chemistry','science','NOBEL IDEAS: CHEMISTRY'),('Physiology or Medicine','science','NOBEL IDEAS: MEDICINE'),('Literature','culture','LITERATURE’S NOBEL NAMES'),('Peace','culture','THE PEACE PRIZE'),('Economic Sciences','everyday','THE ECONOMICS PRIZE')]:
 items=[nobelrow(x)for x in nobel if any(p['category']['en']==category and int(p['awardYear'])<=2025 for p in x['nobelPrizes'])]
 bank('nobel-'+normalize(category),family,topic,'Name a recipient of the '+('Nobel Prize in '+category if category not in ['Peace','Economic Sciences'] else 'Nobel Peace Prize' if category=='Peace'else 'Nobel Memorial Prize in Economic Sciences')+', awarded by the end of 2025. People and awarded organizations count.',items,'Nobel Prize API, Nobel Prize Outreach; names/categories through 2025. Source terms and attribution in DATA-SOURCES.md.',group='nobel-prizes',common=['Albert Einstein','Marie Curie','Martin Luther King Jr.','Nelson Mandela','Barack Obama','Ernest Hemingway','Bob Dylan','Milton Friedman'])
bank('nobel-all','culture','THE LAUREATE ROLL','Name a person or organization awarded a Nobel Prize or the Nobel Memorial Prize in Economic Sciences by the end of 2025.',[nobelrow(x)for x in nobel],'Nobel Prize API, Nobel Prize Outreach; names/categories through 2025.',group='nobel-prizes',common=['Albert Einstein','Marie Curie','Martin Luther King Jr.','Nelson Mandela','Bob Dylan'])
# Element predicates use properties, not arbitrary letter-list slices.
elements=load('sources/periodic-table.json')['elements'];elements=[e for e in elements if e['number']<=118]
def elrow(e):return entry(e['name'],[e['symbol']]+(['Aluminum']if e['name']=='Aluminium'else[])+(['Sulphur']if e['name']=='Sulfur'else[]))
elementdefs=[('solid-elements','SOLID AT ROOM TEMPERATURE','Name an element that is solid at standard room temperature.',lambda e:e['phase']=='Solid'),('metal-elements','THE METAL REGISTER','Name a metallic chemical element. Metalloids do not count.',lambda e:'metal'in e['category']and'metalloid'not in e['category']and'nonmetal'not in e['category']),('naturally-occurring-elements','BEFORE THE LABORATORY','Name a chemical element with atomic number 1–94, including elements found naturally only in traces.',lambda e:e['number']<=94),('heavy-elements','BEYOND IRON','Name an element with atomic number greater than 26.',lambda e:e['number']>26),('discovered-before-1900','THE OLD PERIODIC TABLE','Name an element known or first discovered before 1900.',lambda e:bool(re.search(r'\b(?:1[0-8]\d{2}|[1-9]\d{0,2})\b',str(e.get('discovered_by','')))))]
# Discovery dates are not provided as a consistent structured property; do not infer them from discoverer names.
for slug,topic,prompt,pred in elementdefs[:4]:bank('element-'+slug,'science',topic,prompt,[elrow(e)for e in elements if pred(e)],'Bowserinator/Periodic-Table-JSON, CC BY-SA 3.0; only named element properties used.',group='periodic-table',common=['Iron','Gold','Silver','Copper','Carbon','Oxygen','Hydrogen'],gems=['Praseodymium','Oganesson','Tennessine'])
# PokéAPI: species, typing, and generation facts; alternate forms are merged by species.
def table(name):
 used.add('sources/'+name+'.csv');return list(csv.DictReader((src/'sources'/ (name+'.csv')).open()))
species=table('pokemon-species');species={int(x['id']):x for x in species}
names={int(x['pokemon_species_id']):x['name']for x in table('pokemon-species-names')if x['local_language_id']=='9'}
pokemon={int(x['id']):x for x in table('pokemon')};types=collections.defaultdict(set)
for x in table('pokemon-types'):
 p=pokemon[int(x['pokemon_id'])];types[int(p['species_id'])].add(int(x['type_id']))
typeNames={int(x['type_id']):x['name']for x in table('pokemon-type-names')if x['local_language_id']=='9'and int(x['type_id'])<=18}
pokesource='PokéAPI factual species/typing tables, BSD-3-Clause; Pokémon names are Nintendo trademarks. Snapshot 2026-10-22. Any official form’s type counts; forms share one canonical species.'
def pokerow(i):
 n=names[i];alts=[]
 if i==29:alts=['Nidoran female','Nidoran F']
 if i==32:alts=['Nidoran male','Nidoran M']
 if i==122:alts=['Mr Mime']
 return entry(n,alts,200 if int(species[i]['generation_id'])==1 else 25)
# Gender signs must stay distinct under the game normalizer.
names[29]='Nidoran (female)';names[32]='Nidoran (male)'
for typeId,name in sorted(typeNames.items()):
 bank('pokemon-type-'+name.lower(),'culture',name.upper()+'-TYPE ROLL CALL','Name a Pokémon that has '+name+' typing in at least one official form. Give the species name; alternate forms count once.',[pokerow(i)for i in species if i in names and typeId in types[i]],pokesource,group='pokemon',common=['Pikachu','Charizard','Bulbasaur','Squirtle','Mewtwo','Eevee','Gengar','Snorlax','Jigglypuff'])
bank('pokemon-species','culture','GOTTA NAME THEM','Name a Pokémon species. Official species through the snapshot count; alternate forms count once.',[pokerow(i)for i in species if i in names],pokesource,group='pokemon',common=['Pikachu','Charizard','Bulbasaur','Squirtle','Eevee','Mewtwo','Mew','Gengar','Snorlax'])
bank('pokemon-original-151','culture','BACK TO KANTO','Name one of the original 151 Pokémon species.',[pokerow(i)for i in species if i<=151 and i in names],pokesource,group='pokemon',common=['Pikachu','Charizard','Bulbasaur','Squirtle','Eevee','Mewtwo','Mew'])
bank('pokemon-dual-types','culture','TWO TYPES, ONE SPECIES','Name a Pokémon species that has two types in at least one official form.',[pokerow(i)for i in species if i in names and any(len({int(t['type_id'])for t in []})for _ in [])],pokesource,group='pokemon') if False else None
# Named official abilities add a separate game-system question, not another species list.
abilityNames={int(x['ability_id']):x['name']for x in table('pokemon-ability-names')if x['local_language_id']=='9'and int(x['ability_id'])<10000}
bank('pokemon-abilities','culture','THE HIDDEN ADVANTAGE','Name an official Pokémon Ability. Move names do not count.',list(abilityNames.values()),pokesource,group='pokemon',common=['Levitate','Intimidate','Overgrow','Blaze','Torrent','Sturdy','Pressure'])
# GeoNames: names/country/coordinates from a frozen gazetteer, with all matching rows retained.
used.update(['sources/cities15000.zip','sources/countryInfo.txt'])
countries={}
for line in (src/'sources/countryInfo.txt').read_text().splitlines():
 if not line or line.startswith('#'):continue
 c=line.split('\t');countries[c[0]]={'name':c[4],'capital':c[5],'continent':c[8],'currency':c[10],'languages':c[15],'neighbors':c[17].split(',')if len(c)>17 else[]}
with zipfile.ZipFile(src/'sources/cities15000.zip')as z:citytext=z.read('cities15000.txt').decode()
cities=[]
for line in citytext.splitlines():
 c=line.split('\t');pop=int(c[14]);
 if pop<50000 or c[7]=='PPLX':continue
 cities.append({'label':c[2]or c[1],'native':c[1],'lat':float(c[4]),'lon':float(c[5]),'code':c[8],'capital':c[7]=='PPLC','pop':pop})
cityaliases={'New York City':['New York','NYC'],'Mumbai':['Bombay'],'Kolkata':['Calcutta'],'Kyiv':['Kiev'],'Ho Chi Minh City':['Saigon'],'Beijing':['Peking'],'Guangzhou':['Canton'],'Saint Petersburg':['St Petersburg','St. Petersburg'],'Washington':['Washington DC','Washington D.C.'],'The Hague':['Den Haag'],'Munich':['München'],'Cologne':['Köln'],'Florence':['Firenze'],'Turin':['Torino'],'Milan':['Milano'],'Venice':['Venezia'],'Rome':['Roma']}
def cityrow(c):return entry(c['label'],[c['native']]+cityaliases.get(c['label'],[]),max(1,c['pop']//1000))
citysource='GeoNames cities15000/countryInfo, CC BY 4.0; frozen 2026-10-22. City proper population at least 50,000 in the snapshot, not metro population.'
citydefs=[('south-equator','SOUTH OF THE LINE','south of the Equator',lambda c:c['lat']<0),('tropics','IN THE TROPICS','between the Tropics of Cancer and Capricorn',lambda c:abs(c['lat'])<23.44),('north-50','NORTHERN CITIES','north of 50° north latitude',lambda c:c['lat']>50),('south-30','SOUTHERN SKIES','south of 30° south latitude',lambda c:c['lat']< -30),('west-100','WESTERN LONGITUDES','west of 100° west longitude',lambda c:c['lon']< -100),('east-120','FAR EASTERN LONGITUDES','east of 120° east longitude',lambda c:c['lon']>120),('euro-cities','WHERE THE EURO GOES','in a country or territory using the euro',lambda c:countries.get(c['code'],{}).get('currency')=='EUR'),('spanish-cities','SPANISH ON THE MAP','in a country listing Spanish among its official or principal languages',lambda c:any(x.split('-')[0]=='es'for x in countries.get(c['code'],{}).get('languages','').split(','))),('french-cities','FRENCH ON THE MAP','in a country listing French among its official or principal languages',lambda c:any(x.split('-')[0]=='fr'for x in countries.get(c['code'],{}).get('languages','').split(','))),('portuguese-cities','PORTUGUESE ON THE MAP','in a country listing Portuguese among its official or principal languages',lambda c:any(x.split('-')[0]=='pt'for x in countries.get(c['code'],{}).get('languages','').split(',')))]
for code,description in [('EU','Europe'),('AF','Africa'),('AS','Asia'),('SA','South America'),('NA','North America, including Central America and the Caribbean'),('OC','Oceania')]:citydefs.append(('continent-'+code.lower(),description.upper()+' ON THE MAP','in '+description,lambda c,code=code:countries.get(c['code'],{}).get('continent')==code))
for slug,topic,where,pred in citydefs:bank('city-'+slug,'world',topic,'Name a city with at least 50,000 residents '+where+'. City proper, not metro population.',[cityrow(c)for c in cities if pred(c)],citysource,group='cities')
# Geographic knowledge combines meaningful country properties; no state-name padding.
countryaliases={'United States':['USA','US','United States of America'],'United Kingdom':['UK','Britain'],'Czechia':['Czech Republic'],'South Korea':['Republic of Korea'],'North Korea':['DPRK'],'Ivory Coast':["Côte d’Ivoire",'Cote d Ivoire'],'Türkiye':['Turkey'],'Democratic Republic of the Congo':['DRC','DR Congo'],'Republic of the Congo':['Congo Republic'],'Eswatini':['Swaziland']}
# Sovereign-country inventory: only the established original country list is used, rather than all GeoNames territories.
countrylabels=corp('geography/countries','countries');allowed={normalize(x)for x in countrylabels}
ct=[(code,c)for code,c in countries.items()if normalize(c['name'])in allowed or c['name']in ['Turkey','Czechia','Eswatini']]
countrydefs=[('country-neighbours','NEIGHBOURS ON LAND','Name a sovereign country with at least one land-border neighbour.',lambda code,c:bool(c['neighbors'])),('country-western-languages','A LINGUISTIC MAP','Name a country listing English, French, Spanish, or Portuguese among its principal languages.',lambda code,c:any(x.split('-')[0]in['en','fr','es','pt']for x in c['languages'].split(','))),('country-multi-neighbours','THREE OR MORE NEIGHBOURS','Name a country with at least three land-border neighbours.',lambda code,c:len(c['neighbors'])>=3),('country-own-currency','COINS OF THE REALM','Name a country using a currency other than the euro or US dollar.',lambda code,c:c['currency']not in['USD','EUR']),('country-dollar-currency','DOLLARS, DINARS, POUNDS, AND PESOS','Name a country whose currency is named a dollar, dinar, pound, or peso.',lambda code,c:False)]
for slug,topic,prompt,pred in countrydefs[:4]:bank(slug,'world',topic,prompt,[entry(c['name'],countryaliases.get(c['name'],[]))for code,c in ct if pred(code,c)],'GeoNames countryInfo and Corpora sovereign-country list; frozen snapshot. Country names/aliases merged.',group='countries')
# Alphabet-limited countries/capitals are not multiplied into dozens of near-identical prompts.
bank('world-capitals','world','SEAT OF GOVERNMENT','Name a national capital city.',[entry(c['capital'])for code,c in ct if c['capital']],'GeoNames countryInfo; national capitals in the frozen country inventory.',group='capitals',common=['London','Paris','Tokyo','Washington','Rome','Berlin'])
# Common-name taxon snapshots: grouped kinds and species, living or extinct.
for key,topic,noun in [('mammals','FUR, MILK, AND RARE ANSWERS','mammal'),('marsupials','POUCH-BEARING LINEAGES','marsupial'),('primates','OUR BRANCH OF THE TREE','primate'),('bats','WINGS AFTER DARK','bat'),('rodents','THE GNAWING ORDER','rodent'),('snakes','SCALES WITHOUT LEGS','snake'),('salamanders','NEWTS AND THEIR RELATIVES','salamander or newt'),('frogs','FROGS AND TOADS','frog or toad'),('sharks','CARTILAGE AND TEETH','shark')]:
 path='sources/taxon-'+key+'.json'
 if not(src/path).exists():continue
 v=load(path);items=[entry(x['label'],x['aliases']+[x['sci']],x['links'])for x in v['rows']if normalize(x['label'])!=normalize(x['sci'])]
 bank('animal-'+key,'nature',topic,'Name a kind of '+noun+'. Named groups and species, living or extinct, count; a common or scientific name is accepted.',items,'Wikidata taxon hierarchy, CC0; English common-name records under '+v['root']+'. Scientific synonyms are aliases. Snapshot 2026-10-22.',group='animal-'+key)
awarddefs=[('oscar-animation','ANIMATED ON THE BALLOT','a film nominated for the Academy Award for Best Animated Feature'),('oscar-international','WORLD CINEMA’S BALLOT','a film nominated for the Academy Award for Best International Feature Film (formerly Best Foreign Language Film)'),('oscar-documentary','DOCUMENTING THE BALLOT','a film nominated for the Academy Award for Best Documentary Feature'),('oscar-effects','IMPOSSIBLE IMAGES','a film nominated for the Academy Award for Best Visual Effects'),('oscar-cinematography','THROUGH THE LENS','a film nominated for the Academy Award for Best Cinematography'),('oscar-editing','MAKING THE CUT','a film nominated for the Academy Award for Best Film Editing'),('oscar-costumes','DRESSED FOR THE OSCARS','a film nominated for the Academy Award for Best Costume Design'),('oscar-director','BEHIND THE CAMERA','a person nominated for the Academy Award for Best Director'),('oscar-actor','LEADING ACTORS ON THE BALLOT','a person nominated for the Academy Award for Best Actor'),('oscar-actress','LEADING ACTRESSES ON THE BALLOT','a person nominated for the Academy Award for Best Actress'),('grammy-album','ALBUM OF THE YEAR BALLOT','an album nominated for the Grammy Award for Album of the Year'),('hugo-novel','SCIENCE FICTION’S BALLOT','a book nominated for the Hugo Award for Best Novel'),('pulitzer-fiction','FICTION’S PULITZER ROLL','a book that won or was a finalist for the Pulitzer Prize for Fiction')]
for key,topic,what in awarddefs:
 path='sources/award-'+key+'.json'
 if not(src/path).exists():continue
 v=load(path);items=[entry(x['label'],x['aliases'],x['links'])for x in v['rows']]
 bank('award-'+key,'culture',topic,'Name '+what+'. Winners count too. Through the source snapshot of October 2026.',items,'Wikidata award/nomination statements, CC0; works/people restricted to the appropriate entity type. Query '+v['root']+' recorded in '+path+'.',group='award-'+('oscars'if key.startswith('oscar')else key))
# Correct source issues and combine broad synonym scopes before counting packs.
byid={p['id']:p for p in packs}
# One canonical question for pasta/noodles avoids two near-identical banks.
if 'catalog-noodles'in byid and 'catalog-pasta'in byid:
 a=byid['catalog-noodles'];b=byid['catalog-pasta'];a['prompt']='Name a type of pasta or noodle, or a named dish built around pasta or noodles.';a['topic']='NOODLES, SHAPES, AND PLATES';a['answers']+=b['answers'];packs.remove(b)
# Subject boundaries backed by the upstream data, rather than narrower claims it cannot support.
changes={
 'culinary-fruits':('Name an edible botanical fruit, including fruits commonly cooked as vegetables.','BOTANICAL FRUITS ON THE TABLE'),
 'catalog-physical-laws':('Name a named physical law, theory, principle, effect, or phenomenon.','LAWS AND EFFECTS'),
 'catalog-musical-terms':('Name an established term used in music theory, performance, or the recording industry.','THE MUSIC LEXICON'),
 'catalog-textile-types':('Name a textile material, named weave, or type of textile product.','TEXTILES AND WHAT WE MAKE'),
 'catalog-furniture-types':('Name a type of furniture or household furnishing.','A ROOM TO FURNISH'),
 'catalog-hand-tool-types':('Name a manual tool or hand-held implement. Kitchen and craft utensils count.','TOOLS WITHOUT A MOTOR'),
 'element-solid-elements':('Name an element known or predicted to be solid at standard room temperature.','SOLID AT ROOM TEMPERATURE'),
 'catalog-fictional-dragons':('Name a named dragon or named dragon species from fiction.','HERE BE DRAGONS'),
}
for key,(prompt,topic)in changes.items():
 if key in byid:byid[key].update(prompt=prompt,topic=topic)
# Sources with unresolved taxonomy contamination or incomplete familiar names are omitted.
for key in ['catalog-art-clean','catalog-architecture-clean','catalog-geometric-clean','catalog-rhetorical-devices','catalog-fictional-detectives','music-styles']:
 if key in byid:packs.remove(byid[key]);omitted.append((key,'scope/coverage review; omitted rather than padded'))
# Familiar answers are calibrated within their subject, not by phrase frequency alone.
common_answers={
 'dog-breeds':['Labrador Retriever','Golden Retriever','German Shepherd','Poodle','Beagle','Chihuahua','Bulldog','Pug','Boxer','Dachshund'],
 'cat-breeds':['Persian','Siamese','Maine Coon','Bengal','Ragdoll','Sphynx','British Shorthair'],
 'horse-breeds':['Thoroughbred','Arabian Horse','Appaloosa','Clydesdale','American Quarter Horse'],
 'culinary-fruits':['Apple','Banana','Orange','Strawberry','Grape','Mango','Pineapple','Watermelon'],
 'culinary-vegetables':['Carrot','Potato','Onion','Broccoli','Lettuce','Cucumber','Spinach','Tomato'],
 'sandwiches':['Grilled cheese','Club','BLT','Ham and cheese','Peanut butter and jelly','Bacon','Egg'],
 'catalog-noodles':['Spaghetti','Penne','Macaroni','Lasagna','Lasagne','Ramen','Udon','Soba','Fettuccine'],
 'catalog-cakes':['Chocolate cake','Cheesecake','Carrot cake','Cupcake','Sponge cake','Birthday cake'],
 'catalog-soups':['Chicken soup','Tomato soup','Chicken noodle soup','Miso soup','French onion soup','Minestrone','Gazpacho'],
 'catalog-breads':['Baguette','Sourdough','White bread','Whole wheat bread','Naan','Pita','Tortilla','Bagel'],
 'catalog-mineral-species':['Quartz','Diamond','Graphite','Calcite','Gypsum','Talc','Pyrite','Halite'],
 'programming-languages':['Python','JavaScript','Java','C','C++','C#','Ruby','PHP','TypeScript','Rust','Go'],
 'catalog-genre-clean':['Jazz','Rock music','Pop music','Classical music','Hip-hop','Country music','Electronic music','Blues','Reggae','Heavy metal music'],
 'catalog-instrument-types':['Guitar','Piano','Violin','Flute','Drum','Trumpet','Saxophone','Cello','Harp','Clarinet'],
 'catalog-hand-tool-types':['Hammer','Screwdriver','Axe','Pliers','Scissors','Shovel','Spoon','Fork','Knife'],
 'occupation-titles':['Teacher','Doctor','Lawyer','Engineer','Nurse','Chef','Police officer','Accountant','Dentist'],
}
for p in packs:
 keys={normalize(x)for x in common_answers.get(p['id'],[])}
 for a in p['answers']:
  if keys & {normalize(x)for x in [a['label']]+a['aliases']}:a['points']=10
  if p['id']=='guitar-makers':
   for brand in ['Fender','Gibson','Ibanez','Yamaha','Taylor','Gretsch','Rickenbacker']:
    if a['label'].lower().startswith(brand.lower()):a['aliases'].append(brand);a['points']=10
   bare=re.sub(r' (?:Guitars|Guitar Company)$','',a['label'])
   if bare!=a['label']:a['aliases'].append(bare)

# Clean known misspellings, consolidate established synonyms, and repair common omissions.
fixes={'chrysantemum':'chrysanthemum','camellias':'camellia','roses':'rose','mandarine':'mandarin','rock melon':'cantaloupe','kiwi fruit':'kiwi','lotus flower':'lotus','purple mangosteen':'mangosteen','passionfruit':'passion fruit','dragonfruit':'dragon fruit'}
exclusions={
 'food-preparation-verbs':{'be','allow','give','let','make','use','serve','set','stand','increase','decrease','continue','happen','keep','lay','pass','try','want'},
 'catalog-hand-tool-types':{'menorah','forklift','broom closet','wheelbarrow','wheelchair','ladder','sarcophagus','electric chair'},
 'catalog-furniture-types':{'saddle','coffin','sarcophagus','electric chair','sundial','menorah','kitchen stove','stove','sewing machine'},
 'catalog-fictional-robots':{'android','fictional android','humanoid robot','giant robot','robot','gynoid','mecha','fictional robot','autonomous robot'},
 'catalog-literary-clean':{'theology','letter','proverb'},
 'catalog-rhetorical-types':{'lullaby','Semitic people'},
}
for p in packs:
 merged={}
 for a in p['answers']:
  old=a['label'];a['label']=fixes.get(old.lower(),old);a['aliases']+=([old]if old!=a['label']else[])
  if a['label'].lower()in exclusions.get(p['id'],set()):continue
  key=normalize(a['label'])
  if key not in merged:merged[key]=a
  else:merged[key]['aliases']+=a['aliases']+[a['label']];merged[key]['points']=min(merged[key]['points'],a['points'])
 p['answers']=list(merged.values())
 # Preserve one special discovery if a normalization merge removed the selected one.
 if not any(a['points']==100 for a in p['answers']):p['answers'][-1]['points']=100
 owners=collections.defaultdict(set)
 for a in p['answers']:
  for alias in [a['label']]+a['aliases']:owners[normalize(alias)].add(normalize(a['label']))
 for a in p['answers']:a['aliases']=sorted({x for x in a['aliases']if normalize(x)!=normalize(a['label'])and len(owners[normalize(x)])==1})[:12]
# Identical normalized answer sets are not marketed as distinct questions.
seen={}
for p in list(packs):
 signature=hashlib.sha256('\n'.join(sorted(normalize(a['label'])for a in p['answers'])).encode()).hexdigest()
 if signature in seen:packs.remove(p);omitted.append((p['id'],'identical answer set to '+seen[signature]));continue
 seen[signature]=p['id'];p['answerHash']=signature;p['answerCount']=len(p['answers'])
# A shared compact row pool is parsed once; answer objects hydrate only for visited packs.
pool=[];poolids={};rows=[];manifest=[]
for p in packs:
 ids=[]
 for a in p['answers']:
  row=[a['label'],a['points'],a['aliases']];key=json.dumps(row,ensure_ascii=False,separators=(',',':'))
  if key not in poolids:poolids[key]=len(pool);pool.append(row)
  ids.append(poolids[key])
 meta={k:v for k,v in p.items()if k!='answers'};rows.append([meta,ids]);manifest.append({**meta,'tiers':dict(sorted(collections.Counter(a['points']for a in p['answers']).items()))})
build=hashlib.sha256(json.dumps(pool,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()[:16]
js="// Generated catalogue metadata. Sources: DATA-SOURCES.md.\nimport {createCatalog} from './question-bank-loader.js';\nconst rows="+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+';\nexport const CATALOG_BUILD='+json.dumps(build)+';\nexport const CATALOG_PACKS=createCatalog(rows,CATALOG_BUILD);\n'
answerjs='// Generated answer rows. Data attribution/license: DATA-SOURCES.md.\nexport const CATALOG_ANSWER_BUILD='+json.dumps(build)+';\nexport const ANSWER_ROWS='+json.dumps(pool,ensure_ascii=False,separators=(',',':'))+';\n'
root.mkdir(parents=True,exist_ok=True);(root/'question-catalog.js').write_text(js);(root/'question-answers.js').write_text(answerjs);(root/'catalog-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));(root/'catalog-source-files.json').write_text(json.dumps(sorted(used),indent=2));
print(json.dumps({'newPacks':len(packs),'answerEntries':sum(p['answerCount']for p in packs),'distinctNormalizedLabels':len({normalize(a['label'])for p in packs for a in p['answers']}),'sharedRows':len(pool),'families':dict(collections.Counter(p['family']for p in packs)),'min':min(p['answerCount']for p in packs),'max':max(p['answerCount']for p in packs),'omitted':omitted},indent=2))
