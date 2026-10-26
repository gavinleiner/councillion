import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {AUTHORED_PACKS} from '../authored-question-catalog.js';
import {MIXED_PACKS,REVIEWED_PACKS,PACK_BY_ID} from '../data.js';
import {questionReview} from '../question-quality.js';
import {resolveAnswer,normalize} from '../answer-matching.js';
const manifest=JSON.parse(readFileSync(new URL('../authored-bank-manifest.json',import.meta.url)));
const admission=JSON.parse(readFileSync(new URL('../data-snapshots/reviewed-standard/admission.json',import.meta.url)));
const approved=new Set(admission.questions.map(p=>p.id));
const pack=id=>AUTHORED_PACKS.find(p=>p.id==='authored-'+id);

test('candidate inventories cannot count toward the live target or appear in optional play without explicit admission',()=>{
 assert.equal(AUTHORED_PACKS.length,manifest.count);
 assert.deepEqual(new Set(MIXED_PACKS.map(p=>p.id)),approved);
 for(const p of AUTHORED_PACKS){
  assert.equal(PACK_BY_ID.get(p.id),p);
  assert.equal(MIXED_PACKS.includes(p),approved.has(p.id));
  if(!approved.has(p.id)){assert.equal(questionReview(p).status,'archived');assert.ok(!REVIEWED_PACKS.includes(p));}
 }
});

test('every authored inventory has the exact bank hash and a usable unique canonical/alias index',()=>{
 for(const p of manifest.categories){
  const bytes=gunzipSync(readFileSync(new URL('../authored-banks/'+p.answerFile,import.meta.url))),rows=JSON.parse(bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256,p.id);
  assert.equal(rows.length,p.answerCount,p.id);
  const owners=new Map();
  for(const[label,points,aliases]of rows){
   assert.ok([10,30,60,85,100].includes(points),p.id);
   for(const n of [label,...aliases]){const key=normalize(n);assert.ok(key,p.id+': empty name');assert.ok(!owners.has(key)||owners.get(key)===label,p.id+': alias collision '+n);owners.set(key,label);}
  }
 }
});

test('independent familiar inputs and wrong boundaries are checked through the same matcher as actual play',()=>{
 for(const meta of manifest.categories){const p=PACK_BY_ID.get(meta.id),guarded={...p,answers:p.answers,excludedAnswers:meta.exclude};
  assert.ok(meta.familiar.length>=6,meta.id);
  for(const s of meta.familiar)assert.equal(resolveAnswer(guarded,s).status,'exact',meta.id+': '+s);
  for(const s of meta.exclude)assert.equal(resolveAnswer(guarded,s).status,'missing',meta.id+': '+s);
 }
});

test('the released-game inventories include the whole roster and do not turn alternate costumes into extra fighters',()=>{
 assert.equal(pack('smash-ultimate-fighters').answerCount,89);
 for(const n of ['Sora','Kazuya','Pyra','Mythra','Mii Brawler','Mii Swordfighter','Mii Gunner','Squirtle','Ivysaur','Charizard'])assert.equal(resolveAnswer(pack('smash-ultimate-fighters'),n).status,'exact',n);
 assert.notEqual(resolveAnswer(pack('smash-ultimate-fighters'),'Pyra').answer.label,resolveAnswer(pack('smash-ultimate-fighters'),'Mythra').answer.label);
 assert.equal(resolveAnswer(pack('smash-ultimate-fighters'),'Steve').answer.label,resolveAnswer(pack('smash-ultimate-fighters'),'Alex').answer.label);
 assert.equal(pack('dota-heroes').answerCount,127);assert.equal(resolveAnswer(pack('dota-heroes'),'Largo').status,'exact');
 assert.equal(pack('overwatch-heroes').answerCount,54);assert.equal(resolveAnswer(pack('overwatch-heroes'),'Doctrine').status,'exact');
 assert.equal(pack('legendary-mythical-pokemon').answerCount,94);
 for(const name of ['Mew','Mewtwo','Phione','Terapagos','Pecharunt'])assert.equal(resolveAnswer(pack('legendary-mythical-pokemon'),name).status,'exact',name);
});

test('Minecraft uses real item outputs and loot transformations, not just unmodified registry names',()=>{
 for(const name of ['Diamond','Glass','Iron Ingot','Charcoal','Steak','Cooked Beef'])assert.equal(resolveAnswer(pack('minecraft-furnace-results'),name).status,'exact',name);
 for(const name of ['Water Bottle','Enchanted Book','Cod','Raw Cod','Salmon','Raw Salmon','Bamboo'])assert.equal(resolveAnswer(pack('minecraft-fishing-catches'),name).status,'exact',name);
 assert.equal(pack('minecraft-fishing-catches').answerCount,22);
 for(const n of ['Cod','Raw Cod','Salmon','Raw Salmon','Fish','Book'])assert.equal(resolveAnswer(pack('minecraft-fishing-catches'),n).answer.points,10,n);
 for(const n of ['Steak','Cooked Beef','Iron','Gold','Copper'])assert.equal(resolveAnswer(pack('minecraft-furnace-results'),n).answer.points,10,n);
 for(const name of ['Coal','Lava Bucket','Dried Kelp Block','Mangrove Propagule'])assert.equal(resolveAnswer(pack('minecraft-furnace-fuel'),name).status,'exact',name);
 assert.notEqual(resolveAnswer(pack('minecraft-furnace-fuel'),'Netherrack').status,'exact');
});

test('the constellation question retains the complete published 88-name inventory',()=>{
 const source=JSON.parse(readFileSync(new URL('../data-snapshots/authored/sources/nasa-constellations.json',import.meta.url)));
 assert.equal(source.names.length,88);assert.equal(pack('official-constellations').answerCount,88);
 for(const n of source.names)assert.equal(resolveAnswer(pack('official-constellations'),n).status,'exact',n);
 assert.equal(resolveAnswer(pack('official-constellations'),'Capricorn').answer.label,'Capricornus');
});

test('the Super Bowl inventory reconciles at game grain, so early and recent champions cannot be omitted',()=>{
 const proof=JSON.parse(readFileSync(new URL('../data-snapshots/authored/sources/super-bowl-winners-by-game.json',import.meta.url)));
 assert.equal(proof.games.length,60);assert.deepEqual(proof.games.map(g=>g.superBowl),Array.from({length:60},(_,i)=>i+1));
 const expected=new Set(proof.games.map(g=>g.winningStarter));assert.equal(expected.size,36);
 const p=pack('super-bowl-winning-starters');assert.equal(p.answerCount,expected.size);
 assert.deepEqual(new Set(p.answers.map(a=>a.label)),expected);
 for(const game of proof.games)assert.equal(resolveAnswer(p,game.winningStarter).status,'exact','Super Bowl '+game.superBowl);
});

test('the F1 inventory reconciles every driver on every source page and retains normal public names',()=>{
 const proof=JSON.parse(readFileSync(new URL('../data-snapshots/authored/sources/f1-drivers.json',import.meta.url)));
 assert.equal(proof.total,881);assert.equal(proof.drivers.length,881);assert.equal(new Set(proof.drivers.map(d=>d.driverId)).size,881);
 let offset=0;for(const page of proof.requests){assert.equal(page.offset,offset);offset+=page.returned;}assert.equal(offset,proof.total);
 const p=pack('formula-one-drivers');assert.equal(p.answerCount,881);
 for(const d of proof.drivers)assert.equal(resolveAnswer(p,d.givenName+' '+d.familyName).status,'exact',d.driverId);
 for(const n of ['Juan Manuel Fangio','Sir Lewis Hamilton','Alex Albon','Kimi Antonelli','Arvid Lindblad','Schumacher','Checo'])assert.equal(resolveAnswer(p,n).status,'exact',n);
 for(const n of ['HAM','VER'])assert.equal(resolveAnswer(p,n).status,'missing',n+': official racing codes must not become guessed-name aliases');
});

test('ordinary shorthand names keep their real identity without farming a rare spelling neighbor',()=>{
 assert.equal(resolveAnswer(pack('garden-tools'),'Shoe').answer.label,'Gardening shoes');
 assert.equal(resolveAnswer(pack('garden-tools'),'Chainsaw').status,'exact');
 assert.equal(resolveAnswer(pack('kitchen-hand-tools'),'Chopping board').answer.label,'Cutting board');
 assert.equal(resolveAnswer(pack('kitchen-hand-tools'),'Egg whisk').answer.label,'Whisk');
 assert.equal(resolveAnswer(pack('laundry-supplies'),'All').answer.label,'All');
 assert.equal(resolveAnswer(pack('laundry-supplies'),'Fabric conditioner').answer.label,'Fabric softener');
 assert.equal(resolveAnswer(pack('nba-regular-season-mvps'),'Malone').answer.label,'Karl Malone');
 assert.equal(resolveAnswer(pack('super-bowl-winning-starters'),'Manning').answer.label,'Peyton Manning');
});

test('culture source gaps are repaired without treating directors, components or ordinary institutions as answers',()=>{
 for(const [id,inputs]of [
  ['fictional-detectives',['Inspector Gadget','Jessica Fletcher','Fox Mulder','L','L Lawliet','Benoit Blanc']],
  ['fictional-pirates',['Jack Sparrow','Captain Hook','Ridley','Hondo Ohnaka',"Captain K'nuckles"]],
  ['fictional-princesses',['Mulan','Moana','Raya','Princess Kida','Leia','Princess Odette']],
  ['named-fictional-vehicles',['Ecto-1','TARDIS','Hogwarts Express','Magic School Bus','Chitty Chitty Bang Bang']],
  ['fictional-schools',['Hogwarts',"Xavier's School for Gifted Youngsters",'U.A. High School','Bikini Bottom Boating School','Abbott Elementary']],
  ['heist-films',['Baby Driver','The Bad Guys','Fantastic Mr. Fox','American Animals']],
  ['time-travel-films',['Groundhog Day','Edge of Tomorrow','Avengers Endgame','Meet the Robinsons','Palm Springs']],
 ])for(const input of inputs)assert.equal(resolveAnswer(pack(id),input).status,'exact',id+': '+input);
 for(const [id,input]of [['heist-films','Quentin Tarantino'],['named-fictional-vehicles','Flux capacitor'],['fictional-schools','Harvard University'],['fictional-pirates','Captain Amelia']]){
  const meta=manifest.categories.find(p=>p.id==='authored-'+id),p=pack(id);
  assert.equal(resolveAnswer({...p,answers:p.answers,excludedAnswers:meta.exclude},input).status,'missing',input);
 }
 assert.equal(resolveAnswer(pack('fictional-schools'),'X-Mansion').answer.label,resolveAnswer(pack('fictional-schools'),"Xavier's School for Gifted Youngsters").answer.label);
 assert.equal(resolveAnswer(pack('time-travel-films'),'12 Monkeys').answer.label,resolveAnswer(pack('time-travel-films'),'Twelve Monkeys').answer.label);
 for(const n of ['XY','AB','MSB','HSE'])assert.equal(resolveAnswer(pack('fictional-schools'),n).status,'missing',n);
});

test('film classification and parsed factual lists retain source titles without silently importing other media',()=>{
 const source=JSON.parse(gunzipSync(readFileSync(new URL('../data-snapshots/authored/sources/culture-whole-concepts.json.gz',import.meta.url))));
 assert.ok(!source.filmEligibility.ids.includes('Q3772'),'Quentin Tarantino is a director, not a movie');
 assert.ok(!source.filmEligibility.ids.includes('Q91558'),'the Back to the Future franchise is not an extra movie');
 const sets=[['heist-films',['List of heist films']],['time-travel-films',['List of time travel works of fiction','List of films featuring time loops']]];
 for(const [id,lists]of sets)for(const title of lists)for(const name of source.lists[title].names)assert.equal(resolveAnswer(pack(id),name).status,'exact',id+': '+name);
 assert.ok(!source.lists['List of fictional schools'].names.includes('Jeffrey Richards (1988)'),'a bibliography author cannot become a school');
 const p=pack('fictional-schools');
 assert.equal(resolveAnswer(p,'Hogwarts').answer.label,'Hogwarts School of Witchcraft and Wizardry');
 assert.ok(!p.answers.some(a=>/pixula|agarrenme/i.test(a.label)), 'a vandalized source label must never ship as an answer');
});

test('the music-duo inventory keeps recognizable acts and merges documented former names',()=>{
 const p=pack('musical-duos');
 for(const input of ['Carpenters','The Chemical Brothers','Autechre','DOMi & JD Beck','DOMi and JD Beck','Tenacious D','CocoRosie','First Aid Kit','Magdalena Bay','MGMT'])assert.equal(resolveAnswer(p,input).status,'exact',input);
 assert.equal(resolveAnswer(p,'DOMi & JD Beck').answer.label,resolveAnswer(p,'DOMi and JD Beck').answer.label);
 assert.equal(resolveAnswer(p,'Tom and Jerry').answer.label,resolveAnswer(p,'Simon and Garfunkel').answer.label);
 const meta=manifest.categories.find(p=>p.id==='authored-musical-duos');
 for(const input of ['Moderat','Noisia','Aphex Twin'])assert.equal(resolveAnswer({...p,answers:p.answers,excludedAnswers:meta.exclude},input).status,'missing',input);
});

test('bird inventories reconcile every species in their publisher order, not a word in its name',()=>{
 const source=JSON.parse(gunzipSync(readFileSync(new URL('../data-snapshots/authored/sources/clements-bird-orders.json.gz',import.meta.url))));
 for(const [key,id,count]of [['owls','owl-kinds',248],['parrots','parrot-kinds',410],['penguins','penguin-kinds',19]]){
  const rows=source.groups[key].species,p=pack(id);assert.equal(rows.length,count);
  for(const r of rows){
   assert.equal(resolveAnswer(p,r.name).status,'exact',r.name);
   assert.equal(resolveAnswer(p,r.scientificName).answer.label,r.name,r.scientificName);
  }
 }
 assert.equal(resolveAnswer(pack('parrot-kinds'),'Budgie').answer.label,'Budgerigar');
 assert.equal(resolveAnswer(pack('parrot-kinds'),'African grey parrot').answer.label,'Gray Parrot');
 assert.equal(resolveAnswer(pack('penguin-kinds'),'Fairy penguin').answer.label,'Little Penguin');
 assert.equal(resolveAnswer(pack('penguin-kinds'),'Jackass penguin').answer.label,'African Penguin');
});

test('the bat inventory retains every current MDD species and accepted name without a popularity cutoff',()=>{
 const source=JSON.parse(gunzipSync(readFileSync(new URL('../data-snapshots/authored/sources/mdd-2.5-species.json.gz',import.meta.url))));
 assert.equal(source.version,'2.5');assert.equal(source.species.length,6904);assert.equal(new Set(source.species.map(p=>p.id)).size,6904);
 const bats=source.species.filter(p=>p.order==='Chiroptera'),p=pack('bat-kinds');assert.equal(bats.length,1514);
 for(const r of bats){
  const result=resolveAnswer(p,r.sciName.replaceAll('_',' '));
  assert.equal(result.status,'exact',r.sciName);
  assert.equal(result.answer.label,r.mainCommonName,r.sciName+': a legacy synonym must not override the accepted name');
 }
 for(const n of ['Vampire bat','Little brown bat','Big brown bat','Bumblebee bat','Flying fox','Fruit bat','Hammer-headed bat'])assert.equal(resolveAnswer(p,n).status,'exact',n);
});

test('common sports inputs work without granting a rare-label bonus for familiar synonyms',()=>{
 const combat=pack('combat-sports'),winter=pack('winter-sports');
 for(const n of ['Kenpo','Kempo','Jiu-jitsu','Drunken boxing','Eagle claw','White crane','Tai chi chuan','Shotokan','Kyokushin'])assert.equal(resolveAnswer(combat,n).status,'exact',n);
 assert.equal(resolveAnswer(combat,'Jiu-jitsu').answer.label,'Jujutsu');
 for(const n of ['Bobsledding','Ice skating','Ski','Snowboard','Downhill skiing','Nordic skiing','Snowball fight'])assert.equal(resolveAnswer(winter,n).status,'exact',n);
 assert.equal(resolveAnswer(winter,'Snowball fight').answer.label,'Yukigassen');
 assert.equal(resolveAnswer(winter,'Snowball fight').answer.points,30);
 assert.equal(resolveAnswer(winter,'Ski archery').answer.points,100);
 assert.equal(resolveAnswer(winter,'Downhill skiing').answer.label,'Downhill');
 assert.notEqual(resolveAnswer(winter,'Nordic skiing').answer.label,resolveAnswer(winter,'Cross-country skiing').answer.label);
});

test('the rock question includes basic classroom families and actual synonyms, not only specialist names',()=>{
 const p=pack('rock-types');
 for(const n of ['Igneous','Sedimentary','Metamorphic','Granite','Basalt','Marble','Sandstone','Limestone','Slate']){
  const result=resolveAnswer(p,n);assert.equal(result.status,'exact',n);assert.equal(result.answer.points,10,n);
 }
 for(const [a,b]of [['Diabase','Dolerite'],['Dolostone','Dolomite rock'],['Soapstone','Steatite'],['Intrusive','Plutonic'],['Extrusive','Volcanic']])assert.equal(resolveAnswer(p,a).answer.label,resolveAnswer(p,b).answer.label,a);
 assert.equal(resolveAnswer(p,'Aa').status,'exact','A genuine short Hawaiian rock name is not a generated abbreviation');
 const meta=manifest.categories.find(x=>x.id==='authored-rock-types');
 for(const n of ['Diamond','Quartz','Gold','Concrete','Mount Everest'])assert.equal(resolveAnswer({...p,answers:p.answers,excludedAnswers:meta.exclude},n).status,'missing',n);
});

test('whole-list questions cover common variants without importing producers, ingredients or rendering engines',()=>{
 for(const [id,inputs]of [
  ['cheese-types',['Jarlsberg','Oaxaca','Smoked cheddar','White cheddar','Fresh mozzarella','Queso blanco','Gjetost','Philadelphia','Kraft Singles']],
  ['flatbread-types',['Roti','Injera','Tortilla','Khachapuri','Gozleme','Papad']],
  ['pancake-dishes',['Buttermilk pancake','Dutch baby','Souffle pancake','Blueberry pancake','Flapjack','Aebleskiver']],
  ['stew-dishes',['Beef stew','Chicken stew','Vegetable stew','Lentil stew','Chili','Tagine','Kimchi jjigae']],
  ['web-browsers',['Chrome','Firefox','Safari','Edge','DuckDuckGo','Kiwi Browser','Samsung Internet']],
  ['cloud-kinds',['Cumulus','Altostratus','Mammatus','Thundercloud','Anvil cloud','Roll cloud','Wall cloud','Cumulus cloud','Condensation trail','Advection fog']],
 ])for(const input of inputs)assert.equal(resolveAnswer(pack(id),input).status,'exact',id+': '+input);
 for(const [id,inputs]of [
  ['cheese-types',['Allspice','Mahlep','Ardsallagh Goat Farm','Milk','Cauliflower cheese']],
  ['web-browsers',['WebKit','Blink','Gecko','Qt WebEngine','Bing','uBlock Origin']],
  ['cloud-kinds',['Lightning','Rainbow','Rain']],
 ]){
  const p=pack(id),meta=manifest.categories.find(m=>m.id===p.id),guarded={...p,answers:p.answers,excludedAnswers:meta.exclude};
  for(const input of inputs)assert.equal(resolveAnswer(guarded,input).status,'missing',id+': '+input);
 }
 for(const [id,a,b]of [['cheese-types','Parmesan','Parmigiano Reggiano'],['flatbread-types','Roti canai','Roti prata'],['pancake-dishes','American pancake','Flapjack'],['cloud-kinds','Mamma','Mammatus']])assert.equal(resolveAnswer(pack(id),a).answer.label,resolveAnswer(pack(id),b).answer.label);
 for(const input of ['GC','MF','SD'])assert.equal(resolveAnswer(pack('web-browsers'),input).status,'missing',input+': no generated browser initials');
});

test('music questions distinguish fictional story roles from real short names and documented live acts',()=>{
 for(const [id,inputs]of [
  ['record-labels',['XL','ECM','A&M','R&S','Fonograf','Akti','Medialayn']],
  ['named-djs',['ATB','BT','EDX','DJ AM','Gorgon City','Sub Zero Project','D-Block & S-te-Fan','Annie Mac','Bob Harris','Delilah']],
  ['named-drummers',['Debbi Peterson','Anderson Paak','ZackGrooves','II','Nyango Star','Martin Rongen']],
  ['keyboard-instruments',['Digital piano','Electronic keyboard','DX7','Mellotron','Keytar','Accordion']],
 ])for(const input of inputs)assert.equal(resolveAnswer(pack(id),input).status,'exact',id+': '+input);
 for(const [id,inputs]of [['named-drummers',['Animal','Russel Hobbs','Rodrick Heffley','S.H.E is the One World Tour']],['named-djs',['Alan Partridge','Vinyl Scratch','K.K. Slider']]]){
  const p=pack(id),meta=manifest.categories.find(m=>m.id===p.id),guarded={...p,answers:p.answers,excludedAnswers:meta.exclude};
  for(const input of inputs)assert.equal(resolveAnswer(guarded,input).status,'missing',id+': '+input);
 }
 const proof=JSON.parse(readFileSync(new URL('../data-snapshots/authored/sources/performer-classification.json',import.meta.url)));
 assert.ok(proof.excludeFictional.Q1846505);assert.ok(proof.excludeFictional.Q935785);
 assert.ok(proof.documentedRealPerformerOverrides.Q56351943);assert.ok(proof.documentedRealPerformerOverrides.Q2132281);
});

test('global waterway questions retain ordinary names and complex aliases without treating natural rivers or straits as canals',()=>{
 for(const input of ['Panama Canal','Suez Canal','Grand Canal','Rideau Canal','Manchester Ship Canal','Intracoastal Waterway'])assert.equal(resolveAnswer(pack('named-canals'),input).status,'exact',input);
 for(const input of ['Niagara Falls','Victoria Falls','Angel Falls','Yosemite Falls','Godafoss','Voringfossen','Plitvice','Krka Falls','Catarata del Toro'])assert.equal(resolveAnswer(pack('named-waterfalls'),input).status,'exact',input);
 const p=pack('named-canals'),meta=manifest.categories.find(m=>m.id===p.id),guarded={...p,answers:p.answers,excludedAnswers:meta.exclude};
 for(const input of ['Nile River','Amazon River','English Channel','Panama City'])assert.equal(resolveAnswer(guarded,input).status,'missing',input);
});

test('world inventories reconcile major ranges, public museum names and a renamed institution',()=>{
 for(const input of ['Scandinavian Mountains','Altai Mountains','Alaska Range','Lebanon Mountains'])assert.equal(resolveAnswer(pack('mountain-ranges'),input).status,'exact',input);
 for(const input of ['Museum of Science and Industry Chicago','Centre Pompidou','Auckland War Memorial Museum','Borghese Gallery','National Baseball Hall of Fame','Naismith Memorial Basketball Hall of Fame','Sarajevo Tunnel'])assert.equal(resolveAnswer(pack('museums'),input).status,'exact',input);
 assert.equal(resolveAnswer(pack('museums'),'MSI').answer.label,'Kenneth C. Griffin Museum of Science and Industry');
 assert.equal(resolveAnswer(pack('museums'),'MoMA').answer.label,'Museum of Modern Art');
 assert.equal(resolveAnswer(pack('museums'),'MoMA').answer.points,10);
 const p=pack('museums'),meta=manifest.categories.find(m=>m.id===p.id),guarded={...p,answers:p.answers,excludedAnswers:meta.exclude};
 for(const input of ['Museum','Art museum'])assert.equal(resolveAnswer(guarded,input).status,'missing',input+': a generic category placeholder is not a proper museum name');
});

test('whole artist catalogs accept recognizable short titles, retain released features and share version identities',()=>{
 for(const [id,inputs]of [
  ['taylor-swift-songs',['Better Man','Cruel Summer','All Too Well','Antihero']],
  ['the-weeknd-songs',['House of Balloons','Glass Table Girls','Wicked Games']],
  ['beyonce-songs',['Single Ladies','Run the World']],
  ['ariana-grande-songs',['We Cant Be Friends','Give It Up','LA Boyz','Seven Rings']],
  ['bruno-mars-songs',['Uptown Funk','Loves Train','Leave the Door Open']],
  ['dua-lipa-songs',['Cold Heart']],
  ['billie-eilish-songs',['Guess']],
  ['metallica-songs',['Seek and Destroy']],
  ['red-hot-chili-peppers-songs',['Snow']],
  ['twenty-one-pilots-songs',['Chlorine','Level of Concern']],
 ])for(const input of inputs)assert.equal(resolveAnswer(pack(id),input).status,'exact',id+': '+input);
 for(const [id,a,b]of [
  ['green-day-songs','Good Riddance','Time of Your Life'],
  ['twenty-one-pilots-songs','Chlorine','Chlorine (Mexico City)'],
  ['taylor-swift-songs','All Too Well','All Too Well (10 Minute Version)'],
  ['beyonce-songs',"All That I'm Lookin' For",'Sex Kitten'],
 ])assert.equal(resolveAnswer(pack(id),a).answer.label,resolveAnswer(pack(id),b).answer.label,id+': versions cannot score twice');
 for(const [id,input]of [['taylor-swift-songs','This Is What You Came For'],['kendrick-lamar-songs','The Ways'],['lady-gaga-songs','Quicksand'],['maroon-5-songs','Heard Em Say'],['the-weeknd-songs','Title Unknown']]){
  const p=pack(id),meta=manifest.categories.find(m=>m.id===p.id);
  assert.equal(resolveAnswer({...p,answers:p.answers,excludedAnswers:meta.exclude},input).status,'missing',id+': source context must establish actual performer eligibility');
 }
 for(const input of ['CRS','YWBM','BB'])assert.equal(resolveAnswer(pack('taylor-swift-songs'),input).status,'missing','No generated song initials: '+input);
});

test('all-time NBA inventories preserve franchise history, proper names and complete source tails',()=>{
 const proof=JSON.parse(gunzipSync(readFileSync(new URL('../data-snapshots/authored/sources/nba-franchise-rosters.json.gz',import.meta.url))));
 const checks=JSON.parse(readFileSync(new URL('../data-snapshots/authored/nba-franchise-checks.json',import.meta.url)));
 assert.equal(proof.teams.length,31);assert.equal(checks.length,30);
 assert.equal(checks.reduce((n,c)=>n+c.familiarInputs,0),508);
 for(const [id,inputs]of [
  ['boston-celtics-players',['Larry Bird','Jayson Tatum','Ray Allen','Shaquille O Neal']],
  ['los-angeles-lakers-players',['Kobe','Shaq','George Mikan','Ron Artest','Luka Doncic']],
  ['milwaukee-bucks-players',['Kareem','Lew Alcindor','Giannis','Damian Lillard']],
  ['dallas-mavericks-players',['JJ Barea','Luka','Cooper Flagg']],
  ['oklahoma-city-thunder-players',['Gary Payton','Shawn Kemp','Jack Sikma','Russell Westbrook','Chet Holmgren']],
  ['charlotte-hornets-players',['Alonzo Mourning','Kemba Walker','LaMelo Ball']],
  ['new-orleans-pelicans-players',['Chris Paul','Anthony Davis','Zion Williamson']],
  ['san-antonio-spurs-players',['Wemby','Victor Wembanyama','Tim Duncan']],
  ['atlanta-hawks-players',['Jackie Moore','Odie Spears']],
 ])for(const input of inputs)assert.equal(resolveAnswer(pack(id),input).status,'exact',id+': '+input);
 for(const c of checks)for(const a of pack(c.id.replace('authored-','')).answers)assert.ok(!/\(#|\(formerly|^[+^†‡]/.test(a.label),c.id+': source annotations are not names');
 const bulls=pack('chicago-bulls-players');
 for(const input of ['MJ','DR','SP'])assert.equal(resolveAnswer(bulls,input).status,'missing','No generated player initials: '+input);
 assert.equal(resolveAnswer(pack('los-angeles-lakers-players'),'Ron Artest').answer.label,resolveAnswer(pack('los-angeles-lakers-players'),'Metta World Peace').answer.label);
 assert.equal(resolveAnswer(pack('san-antonio-spurs-players'),'Wemby').answer.points,30);
 assert.equal(resolveAnswer(pack('los-angeles-lakers-players'),'Dave Latter').status,'missing','NBL-only table cannot leak into the NBA/BAA/ABA inventory');
 assert.ok(!AUTHORED_PACKS.some(p=>p.id==='authored-seattle-supersonics-players'),'former franchise names expand answers, not question counts');
});
