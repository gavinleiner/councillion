// Familiar subjects can support a real challenge without specialist catalogs.
export const BENCH_CHALLENGE_CATEGORIES=new Set([
 'block-party','game-faces','game-worlds','boss-room','nintendo-neighbors','arcade-tokens','gaming-duos','battle-ready',
 'court-side','big-games','rule-book','sports-kit','ball-games','olympic-headliners','racing-lines','on-the-pitch',
 'animated-evidence','movie-icons','small-screen','cartoon-crew','after-school-tv','secret-identities','streaming-night','movie-night',
 'name-that-artist','band-practice','on-the-playlist','pop-roll-call','rap-city','album-sleeves','turn-it-up','sing-along',
 'world-landmarks','passport-stamps','historys-headliners','river-run','map-key','city-nicknames','flag-facts','earths-extremes',
 'animal-evidence','under-the-sea','planet-files','weather-report','body-of-evidence','space-neighbors','natural-oddities','bug-life',
 'kitchen-counter','around-the-house','what-does-it-do','drive-through','logo-lineup','yes-chef','breakfast-club','sweet-tooth',
 'tabletop-time','story-shelf','greek-to-me','fairy-tale-file','mythical-lineup','puzzle-table','make-some-art','book-covers'
]);
export const BENCH_HELD_CLUES=new Set(['nintendo-neighbors-alt-5','on-the-pitch-alt-4','album-sleeves-alt-4','album-sleeves-alt-5','ball-games-alt-5','sports-kit-alt-5','olympic-headliners-alt-4','racing-lines-alt-5','weather-report-alt-5','what-does-it-do-alt-4','make-some-art-alt-5','map-key-alt-5']);
// Original multiple-choice prompts, independently checked against these primary
// sources. The clues above retain their existing source-linked fact lineage.
export const BENCH_ORIGINALS=[
 ['orange-box-outsider','Gaming','Which game was NOT in Valve’s original Orange Box?', 'Left 4 Dead',['Portal','Team Fortress 2','Half-Life 2'],3,'https://store.steampowered.com/sub/469/'],
 ['netherite-lava','Gaming','You drop one ingot into Minecraft lava. Which one can survive?', 'Netherite',['Gold','Iron','Copper'],3,'https://www.minecraft.net/en-us/article/taking-inventory--netherite-ingot'],
 ['blue-shell-chase','Gaming','In Mario Kart 8, who is the blue Spiny Shell coming for?', 'The racer in first place',['The closest racer','The racer with the most coins','The racer who last hit you'],2,'https://csassets.nintendo.com/noaext/image/private/t_KA_PDF/manual-WiiU-Mario_Kart_8?_a=BATCtdAA0'],
 ['venus-slow-spin','Nature','On which planet does one full spin take longer than a trip around the Sun?', 'Venus',['Mars','Jupiter','Earth'],4,'https://science.nasa.gov/venus/venus-facts/']
].map(([id,subject,prompt,answer,distractors,difficulty,source])=>({id:'bench-original-'+id,subject,category:'COUNSEL’S PICKS',prompt,answer,distractors,difficulty,source,aliases:[]}));

const mobs=['Creeper','Blaze','The Wither','Enderman','Shulker','Warden','Piglin','Ghast','Evoker','Phantom','Guardian'];
const enchantments=['Mending','Unbreaking','Fortune','Silk Touch','Looting','Loyalty','Fire Protection'];
const nba=['Michael Jordan','Stephen Curry','Giannis Antetokounmpo','Wilt Chamberlain','Tim Duncan','Hakeem Olajuwon','LeBron James','Shaquille O’Neal','Kobe Bryant','Kevin Durant'];
const clubs=['Real Madrid','Barcelona','Bayern Munich','Liverpool','Manchester City','Paris Saint-Germain','Juventus','Arsenal'];
const countries=['Qatar','Brazil','Argentina','France','Germany','Spain','Portugal','England','Croatia','Italy'];
const authors=['Roald Dahl','Lois Lowry','J. K. Rowling','George Orwell','Ray Bradbury','Harper Lee','Suzanne Collins','Rick Riordan','J. R. R. Tolkien','C. S. Lewis','Stephen King','Frank Herbert','Charles Dickens','Jane Austen','F. Scott Fitzgerald','Agatha Christie','Arthur Conan Doyle'];
const tv=['Stranger Things','Breaking Bad','Parks and Recreation','Severance','The Office','Friends','The Good Place','Arcane','One Piece','Ted Lasso','Wednesday','Game of Thrones'];
const characters=['Walter White','Jesse Pinkman','Tony Soprano','Dexter Morgan','Jimmy McGill','Michael Scott','Saul Goodman','Dwight Schrute'];
const actors=['Heath Ledger','Joaquin Phoenix','Jared Leto','Christian Bale','Tom Hardy','Gary Oldman','Robert Pattinson','Jake Gyllenhaal'];
const nbaTeams=['Los Angeles Lakers','Boston Celtics','Chicago Bulls','Golden State Warriors','Toronto Raptors','San Antonio Spurs','Milwaukee Bucks','Brooklyn Nets','Houston Rockets'];
const leagues=['National Hockey League','National Basketball Association','National Football League','Major League Baseball','Major League Soccer'];
const colors=['Red','Blue','Green','Yellow','Purple','Black','White','Orange'];
const movieCountries=['Wakanda','Zamunda','Sokovia','Latveria','Genovia','Themyscira'];
const carBrands=['DeLorean','Porsche','Ferrari','Lamborghini','Lotus','Maserati'];
const fictionalCompanies=['Dunder Mifflin','Pied Piper','Initech','Waystar Royco','Sterling Cooper','Los Pollos Hermanos'];
const songCatalogs=[['Lose Yourself','Stan','Without Me','Not Afraid','The Real Slim Shady','Mockingbird','Rap God'],['Bad Guy','Ocean Eyes','Lovely','Everything I Wanted','Happier Than Ever'],['No Role Modelz','Middle Child','Wet Dreamz','Power Trip','Love Yourz','Work Out','Crooked Smile'],['Bad Romance','Poker Face','Born This Way','Paparazzi','Shallow'],['Drivers License','Good 4 U','Vampire','Deja Vu','Traitor']];
const key=x=>x.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const belongs=(pool,answer)=>pool.some(p=>key(p)===key(answer));
export function benchTypedDistractors(category,q,fallback){let pool;
 if(category==='block-party')pool=belongs(mobs,q.answer)?mobs:belongs(enchantments,q.answer)?enchantments:null;
 if(category==='court-side')pool=belongs(nba,q.answer)?nba:belongs(nbaTeams,q.answer)?nbaTeams:null;
 if(category==='big-games'&&belongs(leagues,q.answer))pool=leagues;
 if(category==='on-the-pitch')pool=belongs(clubs,q.answer)?clubs:belongs(countries,q.answer)?countries:null;
 if(['story-shelf','book-covers','detective-shelf'].includes(category)){if(belongs(authors,q.answer))pool=authors;else return fallback.filter(x=>!belongs(authors,x));}
 if(['small-screen','streaming-night','after-school-tv'].includes(category))pool=belongs(tv,q.answer)?tv:belongs(characters,q.answer)?characters:belongs(fictionalCompanies,q.answer)?fictionalCompanies:null;
 if(category==='movie-icons')pool=belongs(actors,q.answer)?actors:belongs(colors,q.answer)?colors:belongs(movieCountries,q.answer)?movieCountries:belongs(carBrands,q.answer)?carBrands:null;
 if(['on-the-playlist','sing-along'].includes(category)){const songs=songCatalogs.find(s=>belongs(s,q.answer));if(songs)pool=songs;}
 return pool?pool.filter(x=>!belongs([q.answer,...q.aliases],x)):fallback;
}
export function benchQuestionText(prompt){if(/^This\b/.test(prompt))return prompt.replace(/^This\b/,'Which').replace(/\.$/,'?');return prompt;}
