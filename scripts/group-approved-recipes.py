"""Implement the approved prompts with scoped source predicates and curated facts.
Executed in build-group-banks.py's namespace. These are not six-example banks.
"""
approved=load(Path('group/approved-prompts.json'))
manual={key:values.split(';') for key,values in (line.split('\t',1) for line in (SRC/'group/manual-answers.tsv').read_text().splitlines() if line.strip() and not line.startswith('#'))}
for line in (SRC/'group/completion-answers.tsv').read_text().splitlines():
 key,values=line.split('\t',1);manual[key]=values.split(';')
def discard(key,text):
 bad={norm(s) for s in text.split('|')};manual[key]=[s for s in manual.get(key,[]) if norm(s) not in bad]
# Explicit negative boundary checks prevent false positives from a broad theme.
discard('q001',"Dinkum|I Am Future|Squirrel Stapler|Untitled Deer Game|Rocket Raccoon|Animal Well|The Sims 4 Cats and Dogs|The Sims 2 Pets")
discard('q003',"Path of Exile 2|The Battle for Polytopia|Deltarune|Deltarune Demo|Arknights Endfield|SpenCo")
discard('q007',"Carmelita Fox")
discard('q008',"Nectar|Ambrosia|Ether|Full Heal|Antidote|Buffalo Steak Sandvich|Food|Blissful Bonanza")
discard('q015',"Shield Bubble|Peely's Plunder|Birthday Present|Mounted Turret|Mending Machine|Cucumber|Klapberry|Golden Splash|Golden Banana|Flint-Knock Pistol|Lawn Chair|Pineapple Pizza|Slurp Barrel|Slurp Truck|Slurp Cactus|Campfire|Cozy Campfire")
discard('q016',"Shockwave Grenade|Chug Cannon")
discard('q027',"TOMS|Rothy's|SpenCo")
discard('q034',"On-Gaku|School-Live!|Utawarerumono|Azur Lane Queen's Orders|Red Dead Redemption The Man from Blackwater|The Division Agent Origins|Kirby Right Back at Ya")
discard('q039',"Bel-Air|Chewin' the Fat")
discard('q040',"Batman|Green Arrow|Rorschach|Anna|Mirabel|Edna Mode|Gru|Sokka|Suki|Sam Manson|Timmy Turner|Perry the Platypus|Phineas Flynn|Ferb Fletcher|Kim Possible|Rufus|Vampire|Frodo|Legolas|Alisha Daniels")
discard('q041',"The Doctor|General Grievous|RoboCop|Dogmeat|Napstablook|Murder Drones|Pearl|Qwark|Inspector Gadget|F.R.I.D.A.Y.|J.A.R.V.I.S.|HAL 9000|Samantha|Cortana|Mother|MOTHER|Batou|Motoko Kusanagi|Alita|Gally|Giftia|Gedachtnis|Carl|Steel|Rex|Alfred|Kronos|Bolts|Destructo|Tobor|Tima|Penny|Ash")
discard('q042',"Elmer Fudd|Marvin the Martian|Gossamer|E.T.|Groot|Superman|Supergirl|Superboy|Bat-Mite")
discard('q044',"Vilgefortz|Captain Huggy Face|Chester|Jorgen Von Strangle|Scratch|Sniff|Seth of Septarsis|Queen Eclipsa|The Void|Dr. Schadenfreude")
discard('q045',"Krusty Krab|Wakanda|Sokovia|Latveria|Genosha|Sakaar|Xandar|Titan|Tatooine|Gondor|Panem|District 12|Munchkinland|Erebor|Coruscant|The Overlook Hotel|Gilead|Storm's End|Casterly Rock|Dragonstone|Driftmark|Riverrun|Highgarden|The Eyrie|Albion|Lancre|DunBroch|Motunui|Kumandra|Pride Rock|Farrow|Earthsea|Blackwater|Rhodes|Valentine|Saint Denis|Strawberry|Annesburg|Armadillo|Tumbleweed|Ludendorff|Los Santos|Vice City|Liberty City|San Fierro|Las Venturas|Bullworth|San Andreas|Delfino Plaza|Mushroom Kingdom|Flint Lockwood's Island|Brasso|Freetown|Gondolin|Winterfell|New Asgard")
discard('q046',"Abra Stone|Skye Riley|The Look-See|Siren Head|The Rake|SCP-096|SCP-173|The Trapper|The Book of the Dead|Necronomicon|Gizmo|Amy Peterson|Peter Vincent|Louis de Pointe du Lac|Oskar|The Girl with All the Gifts|Maxine Minx|Ester Coleman|The Death Mist|The Conjuring Devil|The Demon|Sinister Demon|Behind the Mask Killer|The Cannibal Family|The Crocodile")
discard('q050',"Pet Shop Boys|Eurythmics|Brooks and Dunn|Simon and Garfunkel|MGMT")
discard('q059',"Moi moi|Bhurta|Sabatata")
discard('q060',"Doner kebab|Toad in the hole|Shami kebab|Chapli kebab|Galouti kebab|Bunny chow on a stick|Spaghetti on a stick|Mozzarella stick")
discard('q061',"Aguapanela")
discard('q062',"Baked ziti|Sopa de letras|Noodles")
discard('q064',"Flanax|Hajmola|Strepsils|Vicks|Tango|Koka|Gomze|Sergio|Caramel|Frog|Foam Bananas|Shrimps|White Mice|Fisherman's Friend|Litago|Ovaltine|Mantecol|Nucrem")
discard('q065',"Huddle House|Waffle House|IHOP|Denny's|Bob Evans|Cracker Barrel|Shoney's|Applebee's|Chili's|TGI Fridays|Red Robin|Ruby Tuesday|P.F. Chang's|Outback Steakhouse|True Food Kitchen|Wagamama|YO! Sushi|Sushiro|Kura Sushi|Genki Sushi|Hama Sushi|Chuy's|Ocean Basket|Spur|Big Boy|Johnny Rockets|Hooters|Buffalo Wild Wings|Mellow Mushroom|Anthony's Coal Fired Pizza|Bagel Brands")
discard('q067',"Sotteok|Croziflette|Fufu|Cornish pasty|Irish stew|Raclette|Moussaka|Fisherman's pie|Fish pie|Shepherd's pie|Cottage pie|Bangers and mash|Raclette|Tatties and neeps|Boureka")
discard('q069',"Zebrafish|Hobo spider|Water boatman|Biting midge|Mosquito|Horsefly|Tsetse fly|Flea|Tick|Leech|Eastern tent caterpillar|Assassin bug|Kissing bug|Bloodworm|Bobbit worm|Garter snake|Hognose snake|Vine snake")
discard('q070',"Arctic wolf|Arctic weasel|Siberian weasel|Goldfish|Koi|Peppered moth|Leaf insect|Chiton|Herring|Guppy|Burbot")
discard('q072',"Sunda colugo|Binturong|Babirusa|Mountain tapir|Sea snake")
discard('q074',"Scorpion|Seahorse|Coelacanth|Aphid|Ray|Vine snake|Caecilian")
discard('q075',"Numbat|Degu|Agouti|Ground squirrel|Gundi")
discard('q078',"Cloudberry|Coconut palm|Christmas cactus|Easter cactus|Thanksgiving cactus|Breadfruit|Fuchsia|Mock orange|Norfolk Island pine|Patagonian cypress|Scotch broom|Broom|Bromeliad")
# Remove speculative tail entries and enforce the actual approved boundaries.
manual['q010']=manual['q010'][:manual['q010'].index('Yharnam')]+['Yharnam','Central Yharnam','Cathedral Ward','Old Yharnam','Forbidden Woods','Byrgenwerth','Cainhurst Castle','Hunter\'s Dream','Fishing Hamlet','Anor Londo','Firelink Shrine','Blighttown','Sen\'s Fortress','Undead Burg','Ash Lake','Rapture','Columbia','Aperture Science','Black Mesa','Hallownest','Dirtmouth','Greenpath','Deepnest','City of Tears','Crystal Peak','Queen\'s Gardens']
manual['q032']=[s for s in manual['q032'] if s!='Shaquille O Ne al']
discard('q029',"Buffalo Bills")
discard('q023',"Disc golf|Ultimate|Ultimate frisbee|Disc dog|KanJam|Badminton|Shuttlecock|Jianzi|Ringette|Cornhole|Washers|Quoits|Beer die|Buzkashi|Jugger")
discard('q024',"Horseball|Underwater rugby|Raspall|Valencian pilota|Broomstacking|Jai alai|Basque pelota")
animalNames=set('cardinals falcons ravens panthers bears bengals broncos lions colts jaguars rams dolphins eagles seahawks pelicans bucks bulls hornets hawks grizzlies raptors timberwolves orioles jays rays tigers diamondbacks cubs marlins ducks bruins predators penguins sharks kraken mammoth coyotes thrashers seals rhinos wolves leopards bulldogs roosters eels rabbitohs magpies cats swans crows kangaroos cheetahs jaguares ospreys brumbies bunnies buffalo bisons bison stags wasps dragons wolves hens geese wombats sharks scorpions'.split())
manual['q029']=[s for s in manual['q029'] if words(s)&animalNames]
discard('q079',"Voyager 1|Voyager 2|New Horizons|Pioneer 10|Pioneer 11|Juno spacecraft|Cassini spacecraft|Galileo spacecraft|Hubble Space Telescope|James Webb Space Telescope|International Space Station|Galilean moons|Kuiper Belt|Oort Cloud|Asteroid belt|Saturn's rings|A Ring|B Ring|C Ring|D Ring|E Ring|F Ring|G Ring")
discard('q082',"Optical fiber|Fiber optic cable|Light pipe|Mirror|Moon")
discard('q082',"Light pen")
discard('q008',"Lord's Heal|Great Heal|Urgent Heal|Erdtree Heal|Heal from Afar")
discard('q084',"Frontal bone|Sphenoid bone|Orbicularis oris")
discard('q062',"Pierogi|Maultaschen|Pelmeni|Vareniki|Khinkali|Manti")
discard('q091',"Cobb salad|Coq au vin jaune|Ricotta salata|Dolcelatte|Napoleon cake|Battenberg cake|Pasta alla Norma|Spaghetti alla puttanesca|Trenette al pesto|Torta tenerina|Torta della nonna|Peshawari naan|Earl Grey tea|Shawarma Iskender|Tacos al pastor|Enchiladas suizas|Chiles en nogada|Dulce de leche|Maris Piper|King Edward potato|Russet Burbank|Honeydew melon|Pecan|Macadamia nut|Bock beer|Cioppino San Francisco|Kielbasa krakowska|Lahmacun Antep|Gose")
discard('q095',"Email account|Online account|Bank account|Password manager|Security app|Locker combination")
discard('q096',"Mouse|Computer mouse|Skate shoe|Sewing machine|Wheel of a fishing reel")
discard('q097',"Chase Pay|Coupon")
discard('q098',"Computer mouse|Presentation clicker")
discard('q100',"Seed packet|Rosetta Stone device|Ghost-hunting kit")
# One-word stage names are not bands, full names, or an automatically shortened
# surname. Keep the explicit mononym distinction approved in the tryout.
if 'q054' in manual:
 manual['q054']=manual['q054'][:manual['q054'].index('Beethoven')]
 manual['q054']=[n for n in manual['q054'] if len(n.split())==1]
 discard('q054',"DPR|BOL4|Nulbarich|Yorushika|Zutomayo|Snap|Scooter|Corona|Slander|Boney M|B'z|Yonezu|Hikaru|Utada|Nina|Soweto|Moblack|Enigma|AMEME")
# Work means an actual human task, not an arbitrary animal being exhibited or
# studied. The transport/hunting/detection portion is retained with additions.
if 'q076' in manual:manual['q076']=manual['q076'][:manual['q076'].index('Peacock')]+['Cormorant','Falcon','Peregrine falcon','Gyrfalcon','Saker falcon','Lanner falcon','Harris\'s hawk','Red-tailed hawk','Goshawk','Golden eagle','Ferret','Cat','Gambian pouched rat','African giant pouched rat','Capuchin monkey','Pig-tailed macaque','Macaque','Monkey','Honeybee','Bumblebee']

sr={}
def put(key,rows):sr[key]=rows
def addnames(key,names):sr.setdefault(key,[]).extend(named(names))
def source(id):return bankrows(id)
def tagrows(tag):
 s=load(Path('discovery/steam.json.gz'));return [row(s['games'][i][0],points(s['games'][i][2],(20000,5000,500)),s['games'][i][1]) for i in s['tags'].get(tag,[])]
put('q002',tagrows('Driving'))
put('q003',named(load(Path('group/steam-free-titles.json'))))
put('q004',tagrows('Local Co-Op')+tagrows('Split Screen'))
put('q005',tagrows('Crafting'));put('q006',tagrows('Fishing'))
put('q009',named(load(Path('rework/elden-weapons.json'))))
put('q010',named(load(Path('rework/elden-locations.json'))))
mcEntities=load(Path('rework/minecraft-entities.json'))
put('q011',named([r['displayName'] for r in mcEntities if r['category'] in ['Hostile mobs','Neutral mobs']]))
mcFoods=load(Path('rework/minecraft-foods.json'))
# Bucket entities are not edible even when a food API places them near fish.
put('q012',named([r['displayName'] for r in mcFoods if not r['name'].endswith('_bucket') and r['name'] not in ['cake','milk_bucket']]))
addnames('q012',['Cake','Dried Kelp','Rotten Flesh','Spider Eye','Chorus Fruit','Sweet Berries','Glow Berries','Pufferfish','Poisonous Potato'])
woodSpecies=['Oak','Spruce','Birch','Jungle','Acacia','Dark Oak','Mangrove','Cherry','Bamboo','Pale Oak','Crimson','Warped']
woodProducts=['Planks','Stairs','Slab','Fence','Fence Gate','Door','Trapdoor','Pressure Plate','Button','Sign','Hanging Sign']
crafts=[species+' '+product for species in woodSpecies for product in woodProducts]
crafts += [species+' '+product for species in woodSpecies if species not in ['Crimson','Warped','Bamboo'] for product in ['Boat','Boat with Chest']]
crafts += [material+' '+tool for material in ['Wooden','Stone','Iron','Golden','Diamond'] for tool in ['Sword','Pickaxe','Axe','Shovel','Hoe']]
crafts += ['Bamboo Raft','Bamboo Raft with Chest','Bamboo Mosaic','Bamboo Mosaic Stairs','Bamboo Mosaic Slab','Crafting Table','Chest','Trapped Chest','Barrel','Stick','Bowl','Ladder','Torch','Soul Torch','Redstone Torch','Redstone Repeater','Redstone Comparator','Tripwire Hook','Piston','Sticky Piston','Note Block','Jukebox','Bookshelf','Chiseled Bookshelf','Lectern','Loom','Cartography Table','Fletching Table','Smithing Table','Grindstone','Campfire','Soul Campfire','Scaffolding','Armor Stand','Painting','Item Frame','Glow Item Frame','Shield','Bow','Crossbow','Arrow','Fishing Rod','Carrot on a Stick','Warped Fungus on a Stick','Rail','Powered Rail','Activator Rail','Lever','Wooden Sword','Wooden Pickaxe','Fence','Boat','Door','Trapdoor','Sign','Hanging Sign','Pressure Plate','Button','Planks','Wooden Slab','Wooden Stairs']
crafts += [color+' Bed' for color in ['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black']]
put('q013',named(crafts))
sr['q013']=[r for r in sr['q013'] if r[0] not in ['Redstone Repeater','Redstone Comparator','Sticky Piston','Glow Item Frame','Carrot on a Stick','Warped Fungus on a Stick']]
put('q018',source('pokemon-original-151'))
put('q019',named(load(Path('rework/elden-bosses.json'))))
put('q020',existing(['board-game-titles','catalog-card-games']))
put('q021',existing(['discovery-nba-teams','discovery-mlb-teams','discovery-nhl-teams']))
addnames('q021','Arizona Cardinals|Atlanta Falcons|Baltimore Ravens|Buffalo Bills|Carolina Panthers|Chicago Bears|Cincinnati Bengals|Cleveland Browns|Dallas Cowboys|Denver Broncos|Detroit Lions|Green Bay Packers|Houston Texans|Indianapolis Colts|Jacksonville Jaguars|Kansas City Chiefs|Las Vegas Raiders|Los Angeles Chargers|Los Angeles Rams|Miami Dolphins|Minnesota Vikings|New England Patriots|New Orleans Saints|New York Giants|New York Jets|Philadelphia Eagles|Pittsburgh Steelers|San Francisco 49ers|Seattle Seahawks|Tampa Bay Buccaneers|Tennessee Titans|Washington Commanders|Washington Redskins|Washington Football Team|Oakland Raiders|San Diego Chargers|St. Louis Rams|Houston Oilers|Tennessee Oilers|Baltimore Colts|St. Louis Cardinals|Boston Patriots'.split('|'))
put('q022',existing(['discovery-nfl-players','discovery-nba-players','discovery-mlb-players','discovery-wnba-players','discovery-worldcup-men','discovery-worldcup-women']))
for position in ['skater','goalie']:
 nhl=load(Path('group/nhl-'+position+'.json.gz'))
 if len(nhl['players'])!=nhl['total']:raise ValueError('NHL career index is incomplete')
 sr['q022'].extend(row(r['name'],points(r['games'],(1000,500,100))) for r in nhl['players'])
sr['q022'].extend(row(s,30) for s in 'Sachin Tendulkar|Virat Kohli|MS Dhoni|Mahendra Singh Dhoni|Rohit Sharma|Shane Warne|Ricky Ponting|Glenn McGrath|Adam Gilchrist|Steve Smith|David Warner|Pat Cummins|Mitchell Starc|Jasprit Bumrah|Hardik Pandya|Ravindra Jadeja|Ravichandran Ashwin|Yuvraj Singh|Sourav Ganguly|Rahul Dravid|Virender Sehwag|Anil Kumble|Kapil Dev|Sunil Gavaskar|Brian Lara|Viv Richards|Chris Gayle|Kieron Pollard|Dwayne Bravo|Andre Russell|Nicholas Pooran|Kumar Sangakkara|Mahela Jayawardene|Muttiah Muralitharan|Lasith Malinga|Sanath Jayasuriya|Shakib Al Hasan|Tamim Iqbal|Rashid Khan|Mohammad Nabi|Babar Azam|Shaheen Afridi|Shahid Afridi|Wasim Akram|Waqar Younis|Shoaib Akhtar|Imran Khan|Inzamam-ul-Haq|Javed Miandad|Mohammad Rizwan|Ben Stokes|Joe Root|Jos Buttler|James Anderson|Stuart Broad|Alastair Cook|Eoin Morgan|Kevin Pietersen|Andrew Flintoff|Ian Botham|Kane Williamson|Trent Boult|Tim Southee|Brendon McCullum|Daniel Vettori|Ross Taylor|AB de Villiers|Jacques Kallis|Dale Steyn|Shaun Pollock|Graeme Smith|Faf du Plessis|Quinton de Kock|Kagiso Rabada|Morne Morkel|Herschelle Gibbs|Meg Lanning|Ellyse Perry|Alyssa Healy|Beth Mooney|Ashleigh Gardner|Megan Schutt|Smriti Mandhana|Harmanpreet Kaur|Mithali Raj|Jhulan Goswami|Shafali Verma|Deepti Sharma|Charlotte Edwards|Sarah Taylor|Katherine Sciver-Brunt|Natalie Sciver-Brunt|Heather Knight|Sophie Ecclestone|Danni Wyatt|Suzie Bates|Sophie Devine|Amelia Kerr|Marizanne Kapp|Laura Wolvaardt|Chloe Tryon|Hayley Matthews|Stafanie Taylor|Deandra Dottin|Chamari Athapaththu|Nida Dar|Sana Mir|Richie McCaw|Dan Carter|Jonah Lomu|Jonny Wilkinson|Brian O\'Driscoll|Shane Williams|Gareth Thomas|Sergio Parisse|Bryan Habana|Siya Kolisi|Cheslin Kolbe|Eben Etzebeth|Antoine Dupont|Romain Ntamack|Johnny Sexton|Owen Farrell|Maro Itoje|Beauden Barrett|Brodie Retallick|Kieran Read|Ma\'a Nonu|Sonny Bill Williams|Israel Folau|Cameron Smith|Johnathan Thurston|Darren Lockyer|Billy Slater|Cooper Cronk|Greg Inglis|Nathan Cleary|James Tedesco|Dylan Edwards|Dustin Martin|Lance Franklin|Gary Ablett Jr.|Patrick Dangerfield|Marcus Bontempelli|Nat Fyfe|Christian Petracca|Nick Daicos|Scott Pendlebury|Toby Greene|Nathan MacKinnon|Connor McDavid|Leon Draisaitl|Sidney Crosby|Alex Ovechkin|Wayne Gretzky|Mario Lemieux|Bobby Orr|Gordie Howe|Michael Morkov|Wilfredo Leon|Earvin Ngapeth|Yuji Nishida|Yuki Ishikawa|Bruno Rezende|Giba|Sergio Santos|Karch Kiraly|Kerri Walsh Jennings|Misty May-Treanor|Paola Egonu|Tijana Boskovic|Zhu Ting|Kim Yeon-koung|Gabi Guimaraes|Isabelle Haak|Melissa Vargas'.split('|'))
olympic=load(Path('discovery/olympics.json.gz'))
put('q025',named(sorted({r[2] for r in olympic})))
import csv
with (ROOT/'../../work/large-question-expansion/olympics-through-2026.csv').open() as handle:
 events={r['Event'] for r in csv.DictReader(handle) if r['Event']}
addnames('q025',sorted(events))
put('q026',[row(r[0],30 if r[1]<=10 else 85,r[2]) for r in source('discovery-olympic-gold')])

f=load(Path('discovery/films.json.gz'))
def filmswith(check):return [row(r[0],points(r[6],(10000,1000,100)),[r[1]]) for r in f if check(r)]
put('q033',filmswith(lambda r:'sequel' in r[4]))
put('q034',filmswith(lambda r:'based on video game' in r[4]))
put('q035',filmswith(lambda r:bool(set(r[4])&{'space','space travel','outer space','spacecraft','astronaut','space station','space opera'})))
put('q036',filmswith(lambda r:'Animation' in r[3] and bool(set(r[4])&{'talking animal','talking animals','anthropomorphic animal'})))
put('q037',filmswith(lambda r:'superhero' in r[4]))
t=load(Path('discovery/television.json.gz'))
put('q038',[row(r[0],points(r[4],(100,85,50))) for r in t if r[1]=='Animation'])
# The legacy robot inventory also included software-only AI and cyborgs.
# Use the explicitly reviewed physical robots rather than that broad source.
put('q041',[])
movies=load(Path('rework/movies.json.gz'))
mcuTitles={norm(s) for s in 'Iron Man|The Incredible Hulk|Iron Man 2|Thor|Captain America: The First Avenger|The Avengers|Iron Man 3|Thor: The Dark World|Captain America: The Winter Soldier|Guardians of the Galaxy|Avengers: Age of Ultron|Ant-Man|Captain America: Civil War|Doctor Strange|Guardians of the Galaxy Vol. 2|Spider-Man: Homecoming|Thor: Ragnarok|Black Panther|Avengers: Infinity War|Ant-Man and the Wasp|Captain Marvel|Avengers: Endgame|Spider-Man: Far From Home|Black Widow|Shang-Chi and the Legend of the Ten Rings|Eternals|Spider-Man: No Way Home|Doctor Strange in the Multiverse of Madness|Thor: Love and Thunder|Black Panther: Wakanda Forever|Ant-Man and the Wasp: Quantumania|Guardians of the Galaxy Vol. 3|The Marvels'.split('|')}
manual['q043']='Ryan Reynolds|Hugh Jackman|Emma Corrin|Matthew Macfadyen|Dafne Keen|Jennifer Garner|Wesley Snipes|Channing Tatum|Blake Lively|Henry Cavill|Leslie Uggams|Karan Soni|Morena Baccarin|Brianna Hildebrand|Shioli Kutsuna|Rob Delaney|Stefan Kapicic|Aaron Stanford|Matthew McConaughey|Harrison Ford|Anthony Mackie|Danny Ramirez|Shira Haas|Carl Lumbly|Tim Blake Nelson|Liv Tyler|Florence Pugh|Sebastian Stan|David Harbour|Wyatt Russell|Hannah John-Kamen|Olga Kurylenko|Julia Louis-Dreyfus|Lewis Pullman|Geraldine Viswanathan|Pedro Pascal|Vanessa Kirby|Joseph Quinn|Ebon Moss-Bachrach|Ralph Ineson|Julia Garner|Natasha Lyonne|Paul Walter Hauser|Sarah Niles|Kelsey Grammer'.split('|')
put('q043',named(sorted({actor for film in movies if film['year']>=2008 and norm(film['title']) in mcuTitles for actor in film['cast']})))
put('q047',[]);put('q048',[]);put('q049',[])
musicRows=load(Path('discovery/music.json.gz'))
names='jolene|roxanne|eleanor|rigby|billie jean|jessie|stacy|jenny|jennie|jane|judy|jude|michelle|martha|julia|lucy|marianne|marie|maggie|diana|dirty diana|alexander|alejandro|fernando|roberto|johnny|joey|tommy|billy|bobby|sally|sue|susan|suzie|susie|suzanne|caroline|carolina|sara|sarah|delilah|samson|sammy|samantha|nikita|daniel|levon|bennie|norma jean|candle in the wind|penny lane|ophelia|rosanna|rhiannon|valerie|vincent|buddy holly|layla|cecilia|danny|benny|bette|marlene|darlene|janine|joanne|jolene|lola|mona|laura|lorraine|natalie|charlene|charlotte|emily|emma|annabelle|isabelle|isabel|abraham|mary|maria|marilyn|joseph|josephine|mary jane|peggy sue|barbara ann|barbara|barbara allen|daisy|daisy jane|heather|becky|angie|angela|clint eastwood|james brown|michael jackson|mick jagger|rita|pamela|sean|audrey|aubrey|angeline|adeline'.split('|')
names=[n for n in names if n not in ['candle in the wind','penny lane','daisy']]
colors=set('red orange yellow green blue indigo violet purple pink black white brown grey gray silver gold golden crimson scarlet emerald ruby turquoise sapphire lilac lavender magenta cyan teal maroon beige ivory auburn amber silver gold'.split())
numberwords=set('one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion'.split())
for title,artists,album,genre,pop in musicRows:
 titleTokens=words(title);normalized=' '+re.sub('[^a-z0-9]+',' ',title.lower())+' '
 if any(' '+n+' ' in normalized for n in names):sr['q047'].append(row(title,points(pop,(75,45,20))))
 if titleTokens&colors:sr['q048'].append(row(title,points(pop,(75,45,20))))
 for artist in artists:
  if re.search(r'\d',artist) or words(artist)&numberwords:sr['q049'].append(row(artist,points(pop,(75,45,20))))
put('q056',source('catalog-wind-instrument-types'))
put('q062',[])
for category in load(Path('variety/wordnet-categories.json.gz')):
 if category['key'] in ['pasta.n.02','macaroni.n.01','noodle.n.01']:addnames('q062',[r['name'] for r in category['items']])
put('q063',source('catalog-breads'));put('q066',source('catalog-coffee-drinks'))
put('q068',existing(['culinary-fruits','catalog-citrus']))
put('q073',source('animal-sharks'))
put('q074',source('fun-birds'))
put('q075',source('animal-bats'))
put('q077',existing(['culinary-fruits','culinary-vegetables']))
addnames('q077','Basil|Rosemary|Thyme|Sage|Oregano|Mint|Peppermint|Spearmint|Cilantro|Coriander|Parsley|Dill|Chives|Fennel|Tarragon|Lemongrass|Bay laurel|Curry leaf|Black pepper|Cumin|Caraway|Fenugreek|Turmeric|Ginger|Galangal|Garlic|Onion|Mustard|Sesame|Sunflower|Pumpkin|Flax|Chia|Rice|Wheat|Oats|Barley|Rye|Corn|Millet|Sorghum|Quinoa|Amaranth|Buckwheat|Soybean|Peanut|Chickpea|Lentil|Coffee|Cacao|Tea|Sugar cane|Sugar beet'.split('|'))
put('q079',source('first-thousand-minor-planets'))
put('q080',[]);put('q086',[])
for category in load(Path('variety/wordnet-categories.json.gz')):
 if category['key']=='measuring_instrument.n.01':addnames('q080',[r['name'] for r in category['items']])
 if category['key']=='aircraft.n.01':addnames('q086',[r['name'] for r in category['items']])
put('q083',source('weather-conditions'))

# Synonyms are one canonical answer. These are explicit editorial aliases,
# including established abbreviations; there is no initials-generation rule.
synonyms={
 'q022':'MS Dhoni|Mahendra Singh Dhoni',
 'q021':'Washington Commanders|Washington Football Team|Washington Redskins;Las Vegas Raiders|Oakland Raiders|Los Angeles Raiders;Los Angeles Rams|St. Louis Rams;Los Angeles Chargers|San Diego Chargers;Tennessee Titans|Tennessee Oilers|Houston Oilers;Indianapolis Colts|Baltimore Colts;Arizona Cardinals|St. Louis Cardinals|Phoenix Cardinals;New England Patriots|Boston Patriots',
 'q023':'Football|Soccer|Association football;Billiards|Billiards sports',
 'q041':'Chopper|C1-10P;M-O|MO;BURN-E|Burn-E;B1 Battle Droid|Battle Droid;Mr. Handy|Mister Handy;Jenny Wakeman|XJ-9;Robby the Robot|Robby;GIR|Gir;Dr. Nefarious|Nefarious;Ladybug|Ladybird',
 'q047':'Me and Bobby McGee|Me & Bobby McGee;Billie Jean|Billy Jean',
 'q051':'The Notorious B.I.G.|Biggie Smalls|Biggie;2Pac|Tupac Shakur|Tupac;Sean Combs|Puff Daddy|P. Diddy|Diddy;MF DOOM|Viktor Vaughn|King Geedorah',
 'q063':'Pita|Pitta;Roti|Roti bread',
 'q071':'Ladybug|Ladybird;Firefly|Lightning bug;Jersey tiger moth|Jersey tiger;Mantis|Praying mantis',
 'q076':'Ox|Oxen;Water buffalo|Domestic buffalo',
 'q081':'Clothes dryer|Tumble dryer;Electric shaver|Electric razor;Tram|Streetcar;Elevator|Lift;Moving walkway|Travelator;Windshield wiper|Windscreen wiper|Wiper motor;Electric bicycle|E-bike;Overlocker|Serger;VCR|Video cassette recorder;Record player|Turntable',
 'q082':'Light-emitting diode|LED;Compact fluorescent lamp|CFL;Television|TV;Firefly|Lightning bug;Aurora borealis|Northern lights;Aurora australis|Southern lights;Neon sign|Neon light;Nightlight|Night light;Halogen lamp|Halogen bulb;Chemical light|Chem light;Glow paint|Glow-in-the-dark paint|Phosphorescent paint;Strobe|Strobe light;Plasma ball|Plasma globe',
 'q085':'Aluminum|Aluminium;Sulfur|Sulphur;Cesium|Caesium',
 'q087':'Big Ben|Elizabeth Tower;Uluru|Ayers Rock;Mount Everest|Everest;Great Sphinx|Sphinx of Giza;Hagia Sophia|Ayasofya;Notre-Dame de Paris|Notre Dame Cathedral;Taj Mahal|Tajmahal',
 'q089':'Disney California Adventure|California Adventure;Universal Islands of Adventure|Islands of Adventure;Universal Epic Universe|Epic Universe;Hong Kong Disneyland|Disneyland Hong Kong;Walt Disney Studios Park|Disney Adventure World;Six Flags La Ronde|La Ronde',
 'q091':'Beef bourguignon|Boeuf bourguignon;Chicken Kyiv|Kiev chicken|Chicken Kiev;Oaxaca cheese|Oaxacan cheese;Shirazi salad|Shiraz salad;Parmesan|Parmigiano Reggiano',
 'q093':'Backpack|Book bag;Pencil case|Pencil pouch;Sneakers|Trainers;Sticky notes|Post-it notes;Earbuds|Earphones',
 'q094':'Trash can|Wastebasket;Faucet|Tap;Body wash|Shower gel;Nail clipper|Nail clippers;Hair straightener|Flat iron',
 'q095':'Bicycle lock|Bike lock;Padlock|Pad lock;Cash register|Till;Safety deposit box|Safe deposit box;Car trunk|Boot;Roof box|Car roof box',
 'q096':'Shopping cart|Shopping trolley;Stroller|Pram|Pushchair;Roller skates|Rollerskates;Inline skates|Rollerblade|Rollerblades;Go-kart|Go kart;Waste bin|Trash bin|Garbage can;Electric scooter|E-scooter',
 'q097':'Check|Cheque;Electronic check|E-check;Credit card|Credit;Debit card|Debit;Electronic funds transfer|EFT;ACH transfer|ACH;Apple Pay|ApplePay;Google Pay|GPay;Mastercard|Master Card;Cash App|CashApp;Wi-Fi payment|Wifi payment',
 'q098':'Television|TV|Smart TV;Stereo|Hi-fi;RC car|Remote control car;Drone|Quadcopter;Electric fireplace|Fireplace;Blinds|Roller shades',
 'q099':'Trousers|Pants;Overalls|Dungarees;Coveralls|Boiler suit;Fanny pack|Bum bag;Sneakers|Trainers;Zip-up hoodie|Zipped hoodie',
 'q100':'E-book|Ebook;Wi-Fi hotspot|Mobile hotspot;Kill A Watt meter|Kilowatt meter|Energy meter;Shop vacuum|Wet-dry vacuum;Carpet cleaner|Carpet shampooer;Portable scanner|Document scanner;E-audiobook|Digital audiobook'
}
def applySynonyms(rs,text):
 for group in text.split(';'):
  names=group.split('|');keys={norm(s) for s in names};found=[r for r in rs if norm(r[0]) in keys]
  if not found:continue
  keep=next((r for r in found if norm(r[0])==norm(names[0])),found[0]);keep[0]=names[0];keep[1]=min(r[1] for r in found);keep[2]=list(set(names[1:]+[a for r in found for a in [r[0],*r[2]]]));rs=[r for r in rs if r not in found or r is keep]
 return rs

for p in approved:
 key=p['id'];rs=list(sr.get(key,[]))+named(manual.get(key,[]))
 if key in synonyms:rs=applySynonyms(rs,synonyms[key])
 if key in ['q002','q003','q004','q005','q006']:rs=[r for r in rs if gamevalid(r[0])]
 if key=='q019':
  shorts={'Malenia':'Malenia, Blade of Miquella','Radahn':'Starscourge Radahn','Margit':'Margit, the Fell Omen','Morgott':'Morgott, the Omen King','Rennala':'Rennala, Queen of the Full Moon','Rykard':'Rykard, Lord of Blasphemy','Mohg':'Mohg, Lord of Blood','Godfrey':'Godfrey, First Elden Lord','Messmer':'Messmer the Impaler','Maliketh':'Maliketh, the Black Blade','Radagon':'Radagon of the Golden Order'}
  for short,long in shorts.items():
   matches=[r for r in rs if norm(r[0])==norm(long)]
   if matches:matches[0][2].append(short);rs=[r for r in rs if norm(r[0])!=norm(short) or norm(short)==norm(long)]
 if key=='q021':
  nicknames='Arizona Cardinals|Atlanta Falcons|Baltimore Ravens|Buffalo Bills|Carolina Panthers|Chicago Bears|Cincinnati Bengals|Cleveland Browns|Dallas Cowboys|Denver Broncos|Detroit Lions|Green Bay Packers|Houston Texans|Indianapolis Colts|Jacksonville Jaguars|Kansas City Chiefs|Las Vegas Raiders|Los Angeles Chargers|Los Angeles Rams|Miami Dolphins|Minnesota Vikings|New England Patriots|New Orleans Saints|New York Giants|New York Jets|Philadelphia Eagles|Pittsburgh Steelers|San Francisco 49ers|Seattle Seahawks|Tampa Bay Buccaneers|Tennessee Titans|Washington Commanders'.split('|')
  for r in rs:
   if r[0] in nicknames:r[2].append(r[0].split()[-1])
 # Explicit familiar aliases only; never generate initials from arbitrary names.
 aliasesByQuestion={'q043':{'Robert Downey Jr.':['Robert Downey Junior','RDJ'],'Samuel L. Jackson':['Samuel Jackson'],'Dwayne Johnson':['The Rock']},'q088':{'United Kingdom':['UK','Britain','Great Britain'],'Federated States of Micronesia':['Micronesia'],'Cabo Verde':['Cape Verde'],'Timor-Leste':['East Timor']},'q090':{'St. Louis':['Saint Louis'],'St. Moritz':['Saint Moritz'],'Turin':['Torino'],'Milan':['Milano'],'Cortina d\'Ampezzo':['Cortina'],'Pyeongchang':['Pyeongchang-gun']},'q092':{'United States':['USA','United States of America','US'],'China':['People\'s Republic of China'],'North Korea':['DPRK'],'Turkey':['Türkiye'],'Cabo Verde':['Cape Verde'],'Timor-Leste':['East Timor'],'Federated States of Micronesia':['Micronesia']}}
 for r in rs:r[2].extend(aliasesByQuestion.get(key,{}).get(r[0],[]))
 # The proposal's verified previews remain exact matches, not fuzzy guesses.
 for s in p['examples']:
  found=next((r for r in rs if norm(s) in [norm(r[0]),*[norm(a) for a in r[2]]]),None)
  if found:found[1]=10
  else:rs.append(row(s,10))
 add('group-'+key,p['prompt'],p['family'],'approved-'+p['family'],rs,'Curated group-approved inventory; source links in question-research.js and retained game/sports/food/science snapshots. See GROUP-POOL.md.',priority=100,minimum=12,known=6,predicate={'kind':'approved-recipe','review':key},reviewId=key,scope=p['scope'])
missing=set(p['id'] for p in approved)-set(c['reviewId'] for c in candidates if c.get('reviewId'))
if missing and not args.probe:raise ValueError('Approved recipes still need a complete playable inventory: '+str(sorted(missing)))
if missing:print('Approved recipes needing more factual rows:',sorted(missing),flush=True)
