# Explicit, topic-by-topic admission. No Steam tag permutations, letter/year
# slices, arbitrary country/city filters, or automatic admission of all metadata.
for id,family in [
 ('pepper-varieties','food'),('food-preparation-verbs','food'),('tea-varieties','food'),
 ('horse-breeds','nature'),('rabbit-breeds','nature'),('plant-common-names','nature'),
 ('catalog-cloud-types','science'),('programming-languages','science'),
 ('human-geographical-features','world'),('seas-and-gulfs','world'),
 ('guitar-makers','music'),('catalog-percussion-types','music'),('catalog-string-instrument-types','music'),('catalog-electronic-instrument-types','music'),
 ('catalog-musical-terms','music'),('catalog-poetic-forms','culture'),('catalog-rhetorical-types','culture'),
 ('modern-art-movements','culture'),('rope-knots','everyday'),('catalog-textile-types','everyday')
]:retain(id,family)

# Individually reviewed whole concepts, with familiar entry points. These
# do not restore country/season/tag intersections from the old archive.
for id,family,examples in [
 ('apple-varieties','food',['Granny Smith','Gala','Fuji','Honeycrisp','Red Delicious','Golden Delicious']),
 ('sausage-varieties','food',['Bratwurst','Chorizo','Salami','Pepperoni','Andouille','Kielbasa']),
 ('edible-fish','food',['Salmon','Tuna','Cod','Haddock','Trout','Mackerel']),
 ('edible-shellfish','food',['Shrimp','Lobster','Crab','Oyster','Mussel','Clam']),
 ('catalog-salads','food',['Caesar salad','Cobb salad','Greek salad','Potato salad','Waldorf salad','Coleslaw']),
 ('catalog-dumplings','food',['Gyoza','Pierogi','Momo','Wonton','Ravioli','Jiaozi']),
 ('catalog-fermented-foods','food',['Yogurt','Kimchi','Sauerkraut','Kombucha','Miso','Tempeh']),
 ('catalog-stews','food',['Goulash','Ratatouille','Beef bourguignon','Irish stew','Gumbo','Cassoulet']),
 ('catalog-citrus','food',['Orange','Lemon','Lime','Grapefruit','Mandarin','Pomelo']),
 ('animal-marsupials','nature',['Kangaroo','Koala','Wombat','Opossum','Wallaby','Tasmanian devil']),
 ('animal-primates','nature',['Chimpanzee','Gorilla','Orangutan','Lemur','Baboon','Gibbon']),
 ('animal-rodents','nature',['Mouse','Rat','Hamster','Guinea pig','Capybara','Beaver']),
 ('animal-frogs','nature',['Bullfrog','Tree frog','Poison dart frog','Common frog','Cane toad','Wood frog']),
 ('gem-materials','science',['Diamond','Ruby','Sapphire','Emerald','Opal','Amethyst']),
 ('catalog-space-probes','science',['Voyager 1','Voyager 2','Pioneer 10','Pioneer 11','Galileo','Juno']),
 ('academic-fields','science',['Mathematics','Physics','Chemistry','Biology','History','Geography'])
]:retain(id,family,examples=examples)
# Whole-team histories require no position, season, nationality or award filter.
# Recognition comes from the actual common major-league teams, not obscure clubs.
for p in legacy.values():
 if re.match(r'^discovery-(?:nfl|nba|mlb)-team-',p['id']):
  retain(p['id'],'sports')

# Literal kinds with concrete answer boundaries, reviewed individually.
wn_topics='''
cleaning.n.01|everyday|a way of cleaning something
repair.n.01|everyday|a type of repair or restoration
travel.n.01|world|a type of travel or transport
journey.n.01|world|a type of journey or trip
entertainment.n.01|culture|a form of entertainment
art.n.02|culture|an art or craft activity
ceremony.n.03|world|a type of ceremony
transaction.n.01|everyday|a type of financial transaction
teaching.n.01|everyday|a teaching or learning activity
measurement.n.01|science|a type of measurement
acoustic_device.n.01|science|a device that produces, records or controls sound
appliance.n.02|everyday|a type of household or workplace appliance
barrier.n.01|everyday|a type of physical barrier
box.n.01|everyday|a type of box or case
bridge.n.01|world|a type of bridge
circuit.n.01|science|a type of electrical circuit
coating.n.01|science|a material used as a coating
container.n.01|everyday|a type of container
cutting_implement.n.01|everyday|a tool used for cutting
decoration.n.01|everyday|a type of decoration
electronic_equipment.n.01|science|a type of electronic equipment
equipment.n.01|everyday|a piece of equipment
framework.n.03|everyday|a type of structural framework
game_equipment.n.01|sports|a piece of equipment used in a game
golf_equipment.n.01|sports|a piece of golf equipment
graphic_art.n.01|culture|a form of graphic art
implement.n.01|everyday|a tool or implement
jacket.n.01|everyday|a type of jacket
lever.n.01|science|a type of lever or lever-operated control
mechanical_device.n.01|science|a mechanical device
memory_device.n.01|science|a computer storage or memory device
optical_device.n.01|science|an optical device
paint.n.01|everyday|a type of paint
painting.n.01|culture|a painting or painting style
photographic_equipment.n.01|science|a piece of photography equipment
protective_covering.n.01|everyday|a type of protective covering
road.n.01|world|a type of road or route
sculpture.n.01|culture|a form of sculpture
seat.n.03|everyday|a type of seat
shelter.n.01|everyday|a type of shelter
source_of_illumination.n.01|science|a source of artificial light
stitch.n.01|everyday|a sewing or embroidery stitch
street.n.01|world|a type of street
table.n.02|everyday|a type of table
tower.n.01|world|a type of tower
wheel.n.01|science|a type of wheel
workplace.n.01|everyday|a type of workplace
performing_arts.n.01|culture|a performing art
telecommunication.n.01|science|a form of telecommunications
reference_book.n.01|culture|a type of reference book
document.n.01|everyday|a type of document
legal_document.n.01|everyday|a type of legal document
contract.n.01|everyday|a type of contract
software.n.01|science|a type of software
publication.n.01|culture|a type of publication
award.n.02|culture|a named award or type of award
gesture.n.02|everyday|a gesture or bodily signal
musical_composition.n.01|music|a type of musical composition
song.n.01|music|a type of song
social_event.n.01|everyday|a social event or gathering
contest.n.01|sports|a type of contest or competition
race.n.02|sports|a type of sporting race
pastry.n.02|food|a pastry or pastry variety
meat.n.01|food|a type or cut of meat
cut.n.06|food|a cut of meat
edible_fat.n.01|food|a fat or oil used in cooking
ingredient.n.03|food|an ingredient used in cooking
herb.n.02|food|a culinary herb
sauce.n.01|food|a sauce
wine.n.01|food|a type or established style of wine
liquor.n.01|food|a type of distilled spirit
financial_institution.n.01|everyday|a type of financial institution
industry.n.01|everyday|an industry
military_unit.n.01|world|a type of military unit
musical_organization.n.01|music|a type of musical group
school.n.01|everyday|a type of school or educational institution
committee.n.01|everyday|a type of committee or board
court.n.01|everyday|a type of court
political_system.n.01|world|a form of government or political system
desert.n.01|world|a desert
port.n.01|world|a port or harbour
national_park.n.01|world|a national park
mythical_being.n.01|culture|a mythical creature or being
greek_deity.n.01|culture|a Greek deity
roman_deity.n.01|culture|a Roman deity
cattle.n.01|nature|a breed or type of cattle
working_dog.n.01|nature|a working-dog breed
bird_of_prey.n.01|nature|a bird of prey
aquatic_bird.n.01|nature|a bird that lives around water
insect.n.01|nature|an insect
butterfly.n.01|nature|a type of butterfly
fungus.n.01|nature|a fungus
vine.n.01|nature|a climbing plant or vine
shrub.n.01|nature|a shrub or bush
aquatic_plant.n.01|nature|an aquatic plant
cereal.n.01|food|a cereal grain or cereal crop
nut.n.01|food|a nut or edible seed
plane_figure.n.01|science|a two-dimensional geometric shape
solid_figure.n.01|science|a three-dimensional geometric shape
alloy.n.01|science|an alloy
mixture.n.01|science|a mixture or blended substance
building_material.n.01|science|a building material
animal_product.n.01|nature|a material or product obtained from animals
leather.n.01|everyday|a type of leather or leather material
fiber.n.01|science|a natural or manufactured fibre
fuel.n.01|science|a fuel
gas.n.02|science|a gas or common gas mixture
liquid.n.03|science|a substance or mixture that is normally liquid at room temperature
oil.n.01|science|an oil
paper.n.01|everyday|a type of paper
wood.n.01|everyday|a type of wood
'''
wn={p['key']:p for p in read(SRC/'variety/wordnet-categories.json.gz')}
overrides=read(SRC/'distinct/inventory-overrides.json')
for line in wn_topics.strip().splitlines():
 key,family,phrase=line.split('|');p=wn[key]
 rows=named([r['name']+'~'+'~'.join(r.get('aliases',[]))for r in p['items']])
 if key=='herb.n.02':rows=[r for r in rows if r[0]not in ['black tea','congou','Darjeeling','green tea','hyson','oolong','orange pekoe','souchong','tea','tea bag']]
 if key=='school.n.01':rows=[r for r in rows if r[0]not in ['alma mater','Eton College',"Plato's Academy",'United States Air Force Academy','United States Military Academy','United States Naval Academy','Winchester College']];rows+=named('Elementary school|Middle school|High school|Kindergarten|Preschool|Montessori school|Special school|International school|Bilingual school|Online school|College|University|Community college')
 if key=='musical_organization.n.01':rows=[r for r in rows if r[0]not in ['Beatles','Laurel and Hardy','indie','section']]
 if key=='solid_figure.n.01':rows=named('Sphere|Cube|Cuboid~Rectangular prism|Cylinder|Cone|Pyramid|Prism|Tetrahedron|Octahedron|Dodecahedron|Icosahedron|Torus|Ellipsoid|Spheroid|Hemisphere|Frustum|Capsule|Triangular prism|Pentagonal prism|Hexagonal prism|Square pyramid|Pentagonal pyramid|Hexagonal pyramid|Parallelepiped|Cuboctahedron|Truncated tetrahedron|Truncated cube|Truncated octahedron|Truncated icosahedron|Rhombic dodecahedron|Rhombicuboctahedron|Antiprism|Trapezohedron|Oblate spheroid|Prolate spheroid')
 if key=='plane_figure.n.01':rows=named('Circle|Ellipse|Oval|Triangle|Square|Rectangle|Parallelogram|Rhombus|Trapezoid~Trapezium|Kite|Pentagon|Hexagon|Heptagon|Octagon|Nonagon|Decagon|Hendecagon|Dodecagon|Quadrilateral|Polygon|Semicircle|Annulus|Circular sector|Circular segment|Star|Heart|Crescent|Cross|Chevron|Lens|Lune|Squircle|Superellipse|Reuleaux triangle|Equilateral triangle|Isosceles triangle|Scalene triangle|Right triangle|Acute triangle|Obtuse triangle|Regular polygon|Concave polygon|Convex polygon|Irregular polygon|Cardioid|Nephroid|Lemniscate')
 o=overrides.get(key,{})
 if o:rows=named(o['answers'])
 add('kind-'+slug(key),family,phrase,'Name '+phrase+'.',rows,o.get('source',p['source']),'Established types and named examples count. Alternate standard names are the same answer.','kinds',examples=o.get('examples',[]),negative=o.get('negative',[]),origin='var-semantic-'+key.replace('.','-'))

# Familiar screen credits: one named person, any movie or TV show, any era.
# No country/year/genre intersections, no actor pairs, no manufactured title tags.
movies=read(SRC/'rework/movies.json.gz');filmVotes=collections.defaultdict(int)
for r in read(SRC/'discovery/films.json.gz'):filmVotes[norm(r[0])]=max(filmVotes[norm(r[0])],r[6])
actorSource=(ROOT/'scripts/build-variety-banks.py').read_text().split("actoranchors=set('",1)[1].split("'.split('|'))",1)[0].split('|')
actorNames=set(actorSource)
credits=collections.defaultdict(list);coactors=collections.defaultdict(set);actorKnown=collections.Counter();released=collections.defaultdict(set)
for m in movies:
 name=m['title'];cast=[n for n in m['cast']if valid(n)and norm(n)not in ['himself','herself','themselves','various','none','featuring','unknown']]
 for a in cast:
  if filmVotes[norm(name)]>=1000:actorKnown[a]+=1
  if a in actorNames:credits[a].append([name,10 if filmVotes[norm(name)]>=10000 else 30 if filmVotes[norm(name)]>=1000 else 60 if filmVotes[norm(name)]>=100 else 85,[]]);coactors[a].update(n for n in cast if n!=a);released[a].add(norm(name))
def screenName(name):return re.sub(r'\s*\((?:\d{4} )?(?:American |British |Canadian |Australian |French |Indian |animated |television |comedy |drama |action |horror |musical |short |romantic |science fiction )*(?:film|TV series|TV program|television series|miniseries)\)$','',name,flags=re.I).strip()
byScreen=collections.defaultdict(set)
for r in read(SRC/'distinct/screen-credits.json.gz')['rows']:
 raw=r['title'];a=r['actorName']
 if re.search(r'\b(?:upcoming|untitled)\b|\(film series\)|\(franchise\)|\b(?:202[7-9]|20[3-9]\d)\b',raw,re.I):continue
 title=screenName(raw)
 if not valid(title):continue
 # Raw disambiguated titles keep different productions apart in shared-cast facts.
 byScreen[raw].add(a)
 score=10 if filmVotes[norm(title)]>=10000 else 30 if filmVotes[norm(title)]>=1000 else 60 if filmVotes[norm(title)]>=100 else 85
 credits[a].append([title,score,[raw]if raw!=title else[]])
for cast in byScreen.values():
 for a in cast:coactors[a].update(n for n in cast if n!=a)
for actor,rs in sorted(credits.items()):
 familiar=sorted({r[0]for r in rs if r[1]<=30 and valid(r[0])},key=lambda s:(-filmVotes[norm(s)],s))
 if len(familiar)<6:continue
 if int(sha(actor),16)%2==0:add('screen-works-'+slug(actor),'culture',actor+' · screen credits','Name a movie or TV show featuring '+actor+'.',rs,'DBpedia factual screen-work credits, retrieved 2026-10-25, CC BY-SA 4.0; retained American film cast facts, servant-42/wikipedia-movie-data, MIT.','Released movies and TV series count, including credited supporting and voice roles. Name the work, not the character. Remakes with the same title count once. Source coverage can miss a credit.','screen-credits',examples=familiar[:6],minimum=12,finite=True)
 if int(sha(actor),16)%2==0:continue
 people=sorted(coactors[actor]);familiarPeople=[a for a in people if a in actorNames and actorKnown[a]>=6]
 if len(familiarPeople)<8:continue
 rs=[[n,10 if actorKnown[n]>=30 else 30 if actorKnown[n]>=6 or n in actorNames else 60 if actorKnown[n]>=2 else 85,[]]for n in people]
 # Unambiguous surnames are deliberate name aliases, never generated initials.
 last=collections.Counter(n.rsplit(' ',1)[-1]for n in people)
 for r in rs:
  surname=r[0].rsplit(' ',1)[-1]
  if ' 'in r[0]and last[surname]==1 and len(norm(surname))>=4 and surname not in ['Jr.','III','Sr.']:r[2].append(surname)
 add('screen-costars-'+slug(actor),'culture',actor+' · castmates','Name a cast member who has appeared in the same movie or TV series as '+actor+'.',rs,'DBpedia shared screen-work cast facts, CC BY-SA 4.0; retained film casts, servant-42/wikipedia-movie-data, MIT.','Cast membership in at least one shared released movie or TV series counts, including voice casts. They need not have shared a scene. Actor names count, not characters. Source coverage can miss a credit.','castmates',examples=sorted(familiarPeople,key=lambda a:-actorKnown[a])[:6])

# Additional familiar artists; the full retained discography remains intact.
artists=set('Arctic Monkeys|XXXTENTACION|Pink Floyd|Elvis Presley|Martin Garrix|OneRepublic|Lil Peep|Bring Me The Horizon|Alan Walker|Nirvana|Tove Lo|Marshmello|Burna Boy|The Strokes|Tiësto|David Guetta|DJ Snake|J Balvin|Sean Paul|John Mayer|Calvin Harris|BLACKPINK|Daddy Yankee|Lin-Manuel Miranda|Red Hot Chili Peppers|The Chainsmokers|ABBA|Three Days Grace|The Neighbourhood|AC/DC|Zedd|The Doors|Nickelback|Pearl Jam|The Rolling Stones|My Chemical Romance|Halsey|Nas|Charlie Puth|Kygo|Billy Joel|Ellie Goulding|The Notorious B.I.G.|Snoop Dogg'.split('|'))
for p in legacy.values():
 if p.get('predicate',{}).get('kind')=='artist-credit' and p['predicate']['artist']in artists:
  add('songs-'+slug(p['predicate']['artist']),'music',p['topic'],p['prompt'],bank(p['id']),p['source'],p.get('scope','Recorded songs and collaborations count. Alternate versions of one song share one answer.'),'artist-songs')

# Actual object sets from games, not tags attached to whole game titles.
for key,family,topic,prompt,file,selector,minimum in [
 ('valorant-agents','gaming','Valorant agents','Name an agent in Valorant.','valorant-agents.json',lambda r:True,24),
 ('valorant-weapons','gaming','Valorant weapons','Name a weapon in Valorant.','valorant-weapons.json',lambda r:True,12),
 ('mc-biomes','gaming','Minecraft biomes','Name a biome in Minecraft.','minecraft-official.json',lambda r:r['kind']=='biome',24),
 ('mc-enchantments','gaming','Minecraft enchantments','Name an enchantment in Minecraft.','minecraft-enchantments.json',lambda r:True,24),
 ('lol-champions','gaming','League of Legends champions','Name a champion in League of Legends.','lol-champions.json',lambda r:True,24),
 ('dota-heroes','gaming','Dota 2 heroes','Name a hero in Dota 2.','dota-heroes.json',lambda r:True,24),
 ('dota-items','gaming','Dota 2 items','Name an item in Dota 2.','dota-items.json',lambda r:True,24),
 ('elden-weapons','gaming','Elden Ring weapons','Name a weapon in Elden Ring.','elden-weapons.json',lambda r:True,24),
 ('elden-spells','gaming','Elden Ring sorceries','Name a sorcery in Elden Ring.','elden-sorceries.json',lambda r:True,24),
 ('elden-incantations','gaming','Elden Ring incantations','Name an incantation in Elden Ring.','elden-incantations.json',lambda r:True,24),
 ('elden-spirits','gaming','Elden Ring spirit ashes','Name a summonable spirit ash in Elden Ring.','elden-spirits.json',lambda r:True,24),
 ('elden-talismans','gaming','Elden Ring talismans','Name a talisman in Elden Ring.','elden-talismans.json',lambda r:True,24),
 ('elden-npcs','gaming','Elden Ring NPCs','Name a named NPC in Elden Ring.','elden-npcs.json',lambda r:True,24),
 ('stardew-crops-items','gaming','Stardew Valley items','Name an item in Stardew Valley.','stardew-objects.json',lambda r:True,24),
 ('stardew-furniture','gaming','Stardew Valley furniture','Name a piece of furniture in Stardew Valley.','stardew-furniture.json',lambda r:True,24),
 ('stardew-fish','gaming','Stardew Valley equipment','Name a tool or weapon in Stardew Valley.','stardew-tools.json',lambda r:True,12),
]:
 source=read(SRC/'rework'/file);labels=[r['displayName']if isinstance(r,dict)and 'displayName'in r else r['name']if isinstance(r,dict)and'name'in r else str(r)for r in source if selector(r)]
 if key=='stardew-fish':labels+=read(SRC/'rework/stardew-weapons.json')
 add(key,family,topic,prompt,named(labels),'Recorded official/community game-data inventories in data-snapshots/rework/source-manifest.json.','Base-game and recorded expansion names count. Versions of the same named object count once.','game-objects',minimum=minimum,finite=minimum<24,examples=['Vandal','Phantom','Classic','Sheriff','Ghost','Operator']if key=='valorant-weapons'else[])
for type,phrase in [('outfit','an outfit'),('emote','an emote'),('backpack','a back bling'),('glider','a glider'),('pickaxe','a pickaxe')]:
 labels=[r['name']for r in read(SRC/'rework/fortnite.json')if r['type']==type]
 add('fortnite-'+type,'gaming','Fortnite '+type,'Name '+phrase+' from Fortnite.',named(labels),'Fortnite-API recorded cosmetic names and types, 2026-10-22; https://fortnite-api.com/v2/cosmetics/br','Any recorded season or collaboration counts. These are cosmetic names, not Battle Royale weapon names.','game-objects')

cs=read(SRC/'distinct/cs2-weapons.json')
add('cs2-weapons','gaming','Counter-Strike 2 weapons','Name a weapon or grenade in Counter-Strike 2. Knife types count.',named([r['name']for r in cs['rows']if r['category']['name']not in ['Gloves']and r['name']!='Medi-Shot']),'ByMykel CSGO-API, parsed base-game weapon facts, MIT; pinned names in data-snapshots/distinct/cs2-weapons.json.','Base weapons, explosives and knife models count; cosmetic finishes, gloves and healing items do not.','game-objects',examples=['AK-47','AWP','M4A4','Glock-18','Desert Eagle','USP-S'],negative=['Vandal','Medi-Shot','Bloodhound Gloves'])

# Authored knowledge topics. Explicit false examples are recorded as negatives;
# no cartesian product of ingredients, places, countries, letters or years.
for line in (SRC/'distinct/authored-facts.tsv').read_text().splitlines():
 family,key,topic,prompt,answers=line.split('\t');positives=[];negatives=[]
 for item in answers.split('|'):
  if item.endswith('~DO-NOT-ACCEPT'):negatives.append(item.split('~')[0])
  else:positives.append(item)
 common={'flightless-birds':['Ostrich','Emu','Penguin','Kiwi','Dodo','Kakapo'],'egg-laying':['Bird','Chicken','Duck','Fish','Turtle','Snake'],'regeneration':['Lizard','Sea star','Crab','Lobster','Axolotl','Salamander'],'lab-tools':['Microscope','Pipette','Beaker','Test tube','Bunsen burner','Thermometer']}.get(key,[s.split('~')[0]for s in positives[:6]])
 add('facts-'+key,family,topic,prompt,named(positives),'Authored factual inventory and explicit aliases; primary background references in data-snapshots/distinct/sources.json.','Named examples and standard alternative names count. This is a finite curated inventory, not an exhaustive list of every real-world possibility.','authored-facts',examples=common,negative=negatives)

# Named airlines, including historical operators; codes are deliberately absent.
airlines=read(SRC/'distinct/airlines.json')['rows'];rows=[];shorts=collections.defaultdict(set)
for r in airlines:
 name=r['name'];alias=[r['alias']]if r['alias']and len(norm(r['alias']))>=4 else[]
 short=re.sub(r'\s+(?:Airlines|Airways|Air Lines|Air)$','',name,flags=re.I).strip()
 if len(norm(short))>=4:shorts[norm(short)].add(name)
 rows.append([name,10 if norm(name)in {norm(s)for s in ['American Airlines','Delta Air Lines','United Airlines','Southwest Airlines','British Airways','Air France','Lufthansa','Emirates','Qatar Airways','JetBlue Airways','Ryanair','easyJet','Qantas','Singapore Airlines','Air Canada','Alaska Airlines','Turkish Airlines','Japan Airlines','KLM Royal Dutch Airlines']}else 60,alias])
for r in rows:
 short=re.sub(r'\s+(?:Airlines|Airways|Air Lines|Air)$','',r[0],flags=re.I).strip()
 if len(shorts[norm(short)])==1 and short!=r[0]:r[2].append(short)
brands={'All Nippon Airways':['ANA'],'KLM Royal Dutch Airlines':['KLM'],'Scandinavian Airlines System':['SAS'],'SAS Scandinavian Airlines':['SAS'],'LOT Polish Airlines':['LOT'],'TAP Portugal':['TAP','TAP Air Portugal'],'TAAG Angola Airlines':['TAAG'],'Pakistan International Airlines':['PIA'],'Thai Airways International':['Thai Airways']}
for r in rows:r[2].extend(brands.get(r[0],[]))
add('airlines','world','Airlines','Name an airline, active now or in the past.',rows,'OpenFlights airline name inventory; https://openflights.org/data.php. Names and name aliases only.','The airline name counts. Airline codes and callsigns alone do not count unless they are the carrier’s actual public brand name.','authored-facts',examples=['American Airlines','Delta Air Lines','United Airlines','British Airways','Air France','Lufthansa'],negative=['AA','BA','UA','DL'])
