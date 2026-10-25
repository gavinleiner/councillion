// Explicit normal-play admission. Archived source predicates do not become
// good party questions merely because their answer inventory is large.
export const ORDINARY_POLICY_BUILD='20261025-expansion-v1';
const words=text=>new Set(text.split('|'));
const steam=words('Action|Adventure|RPG|Action RPG|Open World|Survival|Survival Horror|Horror|Psychological Horror|Co-op|Multiplayer|Singleplayer|Local Co-Op|Local Multiplayer|Split Screen|FPS|Shooter|Third-Person Shooter|Platformer|Puzzle|Strategy|RTS|Turn-Based Strategy|Turn-Based|Racing|Sports|Simulation|Sandbox|Building|Crafting|Farming Sim|Fishing|Cooking|Souls-like|Roguelike|Roguelite|Dungeon Crawler|Fighting|Stealth|Zombies|Superhero|Pirates|Space|Fantasy|Sci-fi|Detective|Choices Matter|Story Rich|Tower Defense|City Builder|Card Game|Board Game|Battle Royale|Metroidvania');
const genres=words('pop|rock|hip-hop|rap|country|metal|jazz|blues|classical|r-n-b|soul|funk|disco|dance|electronic|edm|punk|reggae|latin|folk|indie-pop|indie-rock|alternative|soundtracks|k-pop');
const artists=words('Taylor Swift|Drake|Beyoncé|Ariana Grande|The Weeknd|Eminem|Kanye West|Kendrick Lamar|Travis Scott|Post Malone|Rihanna|Justin Bieber|Billie Eilish|Dua Lipa|Bruno Mars|Ed Sheeran|Adele|Harry Styles|Olivia Rodrigo|Sabrina Carpenter|Lady Gaga|BTS|Bad Bunny|Coldplay|Imagine Dragons|Linkin Park|Metallica|Queen|The Beatles|Michael Jackson|Elton John|Katy Perry|Maroon 5|SZA|Doja Cat|Frank Ocean|Lana Del Rey|Tyler, The Creator');
const titleWords=words('love|night|day|world|life|home|time|heart|red|blue|black|white|gold|fire|water|star|king|queen|man|boy|girl|summer|winter|moon|sun|dream|happy|dead|war|city|house|baby');
export function ordinaryQuestionAllowed(pack){
 const p=pack.predicate??{};
 // Neither AND intersections nor OR unions with two Steam labels belong in
 // normal play. They remain readable only as explicit specialist questions.
 if(p.kind==='steam-tags'||p.kind==='steam-any-tags'||/Steam tagged .*”\s+(?:and|or)\s+“/i.test(pack.prompt))return false;
 if(pack.reviewId)return true;
 if(p.kind==='retained-bank')return !['egyptian-deities','tabletop-rpgs','pokemon-abilities'].includes(pack.id);
 if(p.kind==='steam-tag')return steam.has(p.tag);
 if(['film-genre','tv-genre'].includes(p.kind))return pack.familiarCount>=16;
 if(p.kind==='artist-credit')return artists.has(p.artist);
 if(p.kind==='music-genre')return genres.has(p.genre);
 if(p.kind==='title-word')return titleWords.has(p.word)&&pack.familiarCount>=40&&pack.answerCount>=100;
 if(['song-title-any-words','bank-union'].includes(p.kind))return true;
 return false;
}
