import {BENCH_QUESTIONS,benchDeck,benchOptions} from './bench-data.js';
import {shuffle} from './question-selection.js';
export const TRIAL_BUILD='20261108-trial-by-puffer-v38';
export const TRIAL_QUESTIONS=BENCH_QUESTIONS;
export const TRIAL_BY_ID=new Map(TRIAL_QUESTIONS.map(q=>[q.id,q]));
export {benchOptions as trialOptions};
export const trialDeck=benchDeck;
export const TRIAL_TIMING={intro:6500,question:20000,answerReveal:5200,brief:7500,watch:4200,challenge:16000,verdict:6500,transition:2200,escapeIntro:12000,escapeQuestion:13000,escapeRun:4800,gate:4500};
export const TRIAL_GAMES={
 memory:{name:'CHAIN OF CUSTODY',scene:'archive',tag:'MEMORY',instructions:'Remember the five pieces of evidence, in order. When they disappear, rebuild the chain. One sealed attempt.',seconds:18,icon:0},
 maths:{name:'DEADLINE ARITHMETIC',scene:'floor',tag:'QUICK THINKING',instructions:'Solve as many short calculations as you can. A wrong answer costs one mark. Lowest defendants lose; a lone defendant needs three marks.',seconds:18,icon:3},
 cups:{name:'POISONED TESTIMONY',scene:'scales',tag:'BLUFF & SURVIVE',instructions:'Two members of the gallery secretly poison a cup. Defendants choose a drink without seeing the poison. The gallery can change its choice until the timer ends.',seconds:16,icon:2},
 greed:{name:'THE PLEA DEAL',scene:'cells',tag:'TRUST NOBODY',instructions:'Defendants secretly choose SHARE or STEAL. All share: all survive. A thief beats sharers. If every defendant steals, they all become ghosts.',seconds:16,icon:7},
 bids:{name:'BAIL HEARING',scene:'scales',tag:'SEALED BIDS',instructions:'Defendants secretly bid up to $500 of their cash. Every bid is paid. The lowest bidder is sentenced; a tie at the bottom catches everyone tied.',seconds:16,icon:4},
 pulse:{name:'BALANCE OF DOUBT',scene:'scales',tag:'TIMING',instructions:'Stop the swinging needle in the gold center. You have three attempts; your best counts. Land inside the gold band to survive.',seconds:14,icon:4},
 dice:{name:'CONTEMPT OF DICE',scene:'cells',tag:'PUSH YOUR LUCK',instructions:'Choose one, two or three dice. You need a total of 4, 7 or 9. Any 1 is fatal. More dice earn more cash if you survive.',seconds:14,icon:7},
 mirror:{name:'MIRRORED EVIDENCE',scene:'archive',tag:'SPOT THE REFLECTION',instructions:'Study the evidence grid. Select its exact left-to-right reflection. The other grids are decoys. One sealed choice.',seconds:16,icon:6}
};
export const TRIAL_GAME_IDS=Object.keys(TRIAL_GAMES);
// Category membership is explicit: the race judges every choice, including correct exclusions.
// Stable inventories; no current charts, sales estimates or changing record holders.
const set=(id,prompt,yes,no,source)=>({id,prompt,yes:yes.split('|'),no:no.split('|'),source});
export const TRIAL_ESCAPE_SETS=[
 set('planets','Planets in our solar system','Mercury|Venus|Earth|Mars|Jupiter|Saturn|Uranus|Neptune','Pluto|Titan|Europa|The Moon','https://science.nasa.gov/solar-system/planets/'),
 set('giants','The four giant planets','Jupiter|Saturn|Uranus|Neptune','Earth|Mars|Venus|Mercury','https://science.nasa.gov/solar-system/planets/'),
 set('rocky','Rocky planets in our solar system','Mercury|Venus|Earth|Mars','Jupiter|Saturn|Uranus|Neptune','https://science.nasa.gov/solar-system/planets/'),
 set('jupiter-moons','Moons of Jupiter','Io|Europa|Ganymede|Callisto','Titan|Triton|Phobos|Deimos','https://science.nasa.gov/jupiter/moons/'),
 set('pixar','Feature films made by Pixar','Toy Story|Finding Nemo|Cars|WALL-E|Inside Out|Coco|Ratatouille|Monsters, Inc.','Shrek|Frozen|Despicable Me|How to Train Your Dragon','https://www.pixar.com/feature-films'),
 set('dreamworks','DreamWorks animated films','Shrek|Kung Fu Panda|Madagascar|How to Train Your Dragon','Toy Story|Frozen|Finding Nemo|Moana','https://www.dreamworks.com/movies'),
 set('mario','Characters originating in the Mario series','Luigi|Bowser|Peach|Yoshi|Wario|Toad','Kirby|Sonic|Pikachu|Crash Bandicoot','https://mario.nintendo.com/characters/'),
 set('mario-enemies','Enemies in the Mario games','Goomba|Koopa Troopa|Boo|Piranha Plant','Octorok|Creeper|Metroid|Waddle Dee','https://mario.nintendo.com/characters/'),
 set('minecraft-mobs','Creatures found in Minecraft','Creeper|Enderman|Blaze|Ghast|Axolotl|Warden','Goomba|Chocobo|Pikachu|Korok','https://www.minecraft.net/en-us/about-minecraft'),
 set('pokemon-types','Pokémon types','Fairy|Steel|Ghost|Dragon|Bug|Dark','Sound|Crystal|Light|Cosmic','https://www.pokemon.com/us/pokedex'),
 set('chess','Standard chess pieces','King|Queen|Bishop|Knight|Rook|Pawn','Wizard|Archer|General|Cannon','https://handbook.fide.com/chapter/E012023'),
 set('nba','NBA team names','Bulls|Knicks|Lakers|Celtics|Spurs|Nuggets','Yankees|Steelers|Dodgers|Packers','https://www.nba.com/teams'),
 set('nfl','NFL team names','Packers|Steelers|Cowboys|Ravens|Eagles|Bills','Knicks|Celtics|Dodgers|Cubs','https://www.nfl.com/teams/'),
 set('mlb','MLB team names','Yankees|Dodgers|Cubs|Mets|Braves|Red Sox','Lakers|Chiefs|Celtics|Seahawks','https://www.mlb.com/team'),
 set('rackets','Sports played with a racket','Tennis|Badminton|Squash|Racquetball','Volleyball|Baseball|Hockey|Handball','https://www.britannica.com/sports/racket-sport'),
 set('track','Track-and-field events','Long jump|Discus|Javelin|Pole vault|Shot put','Pommel horse|Springboard diving|Slalom|Dressage','https://worldathletics.org/disciplines'),
 set('metals','Metallic chemical elements','Iron|Copper|Gold|Silver|Aluminium|Zinc','Carbon|Sulfur|Oxygen|Chlorine','https://periodic-table.rsc.org/'),
 set('noble','Noble gases','Helium|Neon|Argon|Krypton|Xenon','Hydrogen|Oxygen|Nitrogen|Chlorine','https://periodic-table.rsc.org/'),
 set('mammals','Mammals','Dolphin|Bat|Platypus|Whale|Seal|Otter','Shark|Penguin|Crocodile|Octopus','https://www.britannica.com/animal/mammal'),
 set('flightless','Birds that cannot fly','Ostrich|Emu|Kiwi|Penguin|Cassowary','Puffin|Pelican|Albatross|Flamingo','https://www.britannica.com/animal/flightless-bird'),
 set('reptiles','Reptiles','Crocodile|Turtle|Gecko|Iguana|Tortoise','Salamander|Frog|Newt|Caecilian','https://www.britannica.com/animal/reptile'),
 set('invertebrates','Animals without a backbone','Octopus|Crab|Jellyfish|Spider|Snail|Lobster','Shark|Frog|Snake|Eel','https://www.britannica.com/animal/invertebrate'),
 set('insects','Insects','Ant|Bee|Butterfly|Beetle|Dragonfly','Spider|Scorpion|Tick|Centipede','https://www.britannica.com/animal/insect'),
 set('eu-countries','Countries in Europe','Portugal|Poland|Austria|Greece|Norway|Ireland','Morocco|Japan|Peru|Thailand','https://www.britannica.com/place/Europe'),
 set('south-america','Countries in South America','Brazil|Argentina|Chile|Peru|Colombia|Uruguay','Mexico|Panama|Costa Rica|Cuba','https://www.britannica.com/place/South-America'),
 set('africa','Countries in Africa','Kenya|Ghana|Morocco|Nigeria|Senegal|Uganda','Jamaica|Nepal|Yemen|Oman','https://www.britannica.com/place/Africa'),
 set('landlocked','Countries with no ocean coastline','Bolivia|Nepal|Switzerland|Mongolia|Austria|Paraguay','Chile|Portugal|Vietnam|Norway','https://www.britannica.com/topic/landlocked-country'),
 set('pacific-states','US states with a Pacific Ocean coastline','California|Oregon|Washington|Alaska|Hawaii','Nevada|Arizona|Idaho|Utah','https://oceanservice.noaa.gov/facts/shorelength.html'),
 set('pasta','Shapes of pasta','Penne|Fusilli|Rigatoni|Farfalle|Orzo','Risotto|Polenta|Tiramisu|Gelato','https://www.britannica.com/topic/pasta'),
 set('strings','Bowed string instruments','Violin|Viola|Cello|Double bass','Flute|Clarinet|Trumpet|Tuba','https://www.britannica.com/art/stringed-instrument'),
 set('woodwinds','Woodwind instruments','Flute|Clarinet|Oboe|Bassoon|Saxophone','Trumpet|French horn|Trombone|Tuba','https://www.britannica.com/art/wind-instrument'),
 set('brass','Brass-family instruments','Trumpet|Trombone|Tuba|French horn','Saxophone|Flute|Clarinet|Oboe','https://www.britannica.com/art/brass-instrument')
];
export const TRIAL_ESCAPE_BY_ID=new Map(TRIAL_ESCAPE_SETS.map(q=>[q.id,q]));
export function escapeDraw(set,rng=Math.random){
 const yes=shuffle(set.yes,rng).slice(0,2),no=shuffle(set.no,rng).slice(0,2);
 return shuffle([...yes,...no],rng).slice(0,3).map((text,i)=>({id:String(i),text,correct:set.yes.includes(text)}));
}
export const TRIAL_PROPS=['Key','Gavel','Chalice','Law book','Scales','Shell','Quill','Ring'];
