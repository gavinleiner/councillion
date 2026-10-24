import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveAnswer,matchAnswer} from '../answer-matching.js';
import {deadlineAnswer} from '../answer-confirmation.js';
const bank=(labels,extra={})=>({answers:labels.map(label=>typeof label==='string'?{label,aliases:[],points:30}:label),...extra});
const p=bank([
 'Black Coffee','Diamond Sword','Chicken tikka masala','Paneer tikka masala',
 'Tyrannosaurus','Mozzarella','Pulp Fiction','Toy Story','Freddy Krueger',
 'Sword Of Night And Flame','The Good, the Bad and the Ugly','Malenia, Blade of Miquella',
 'United States','United Kingdom','New York City','New York State','Spider-Man',
 'Golden Gate Bridge','San Francisco Bay Bridge','Harry Potter and the Chamber of Secrets',
 {label:'Dark Souls II',aliases:['Dark Souls 2'],points:30},
 {label:'Dark Souls III',aliases:['Dark Souls 3'],points:85},
 {label:'Grand Theft Auto V',aliases:['GTA 5','GTA V'],points:10},
 {label:'National Aeronautics and Space Administration',aliases:['NASA'],points:10},
 {label:'NBA',aliases:[],points:10},'DOOM','#Drive','Connect Four','Up','It','Go','King','Red Fox'
]);
test('all 676 two-letter combinations reject unless explicitly present, never generated initials',()=>{
 const q=bank(['Black Bear','Brown Bear','Diamond Sword','Pulp Fiction','Toy Story','United States','United Kingdom','Iron Sword']);
 for(const a of 'abcdefghijklmnopqrstuvwxyz')for(const b of 'abcdefghijklmnopqrstuvwxyz')assert.equal(resolveAnswer(q,a+b).status,'missing',a+b);
 const actual=bank(['BB','UK','It','Up','C++',{label:'United States',aliases:['USA'],points:10}]);
 for(const q of ['BB','UK','It','Up','C++','USA'])assert.equal(resolveAnswer(actual,q).status,'exact',q);
 assert.equal(resolveAnswer(actual,'US').status,'missing');
 for(const q of ['DS','PF','TS','US','UK','NYC','GG','HP','SONAF'])assert.equal(resolveAnswer(p,q).status,'missing',q);
 for(const q of ['NBA','NASA','GTA 5'])assert.equal(resolveAnswer(p,q).status,'exact',q);
 // A near miss must not fuzzily expand a short acronym alias either.
 for(const q of ['NB','NNA','NAAA','NAS','GT','GT5'])assert.equal(resolveAnswer(p,q).status,'missing',q);
});
test('ordinary spelling mistakes retain each word instead of borrowing a whole phrase edit budget',()=>{
 const cases=[
  ['blak coffee','Black Coffee'],['black cofee','Black Coffee'],['black cofffee','Black Coffee'],
  ['dimond swrod','Diamond Sword'],['dimon sord','Diamond Sword'],['dimom swrd','Diamond Sword'],
  ['chiken tikka masla','Chicken tikka masala'],['tryannosuarus','Tyrannosaurus'],
  ['tyranasourus','Tyrannosaurus'],['tyranosaurus','Tyrannosaurus'],['mozarella','Mozzarella'],
  ['pulp fictin','Pulp Fiction'],['toy stroy','Toy Story'],['freddy kruger','Freddy Krueger'],
  ['melenia blade miquela','Malenia, Blade of Miquella'],['spidermaan','Spider-Man'],
  ['kign','King'],['kingg','King'],['doomm','DOOM'],['#drve','#Drive'],['connect foor','Connect Four'],['golden gate brigde','Golden Gate Bridge']
 ];
 for(const [typed,label]of cases){const r=resolveAnswer(p,typed);assert.equal(r.answer?.label,label,typed);assert.equal(r.status,'matched',typed);assert.equal(deadlineAnswer(p,typed),null,typed);}
});
test('extra unrelated words and replaced content words never disappear into a correction',()=>{
 for(const typed of [
  'locals coffee','coffee locals','locals black coffee','blue coffee','black shoe','diamond knife',
  'shoe tikka masala','qzxv coffee','coffee','sword','tikka','pizza pulp fiction','pulp fiction pizza',
  'freddy pizza','night flame pizza','sword night pizza','golden shoe bridge','golden bay bridge',
  'potter chamber pizza','diamond wooden sword','red shoe','random new york city','king horse'
 ])assert.equal(resolveAnswer(p,typed).status,'missing',typed);
});
test('function words and explicit context are harmless, while missing distinguishing words stay constrained',()=>{
 for(const [typed,label]of [
  ['the black coffee','Black Coffee'],['sword night flame','Sword Of Night And Flame'],
  ['flame night sword','Sword Of Night And Flame'],['night flame','Sword Of Night And Flame'],
  ['good bad ugly','The Good, the Bad and the Ugly'],
  ['harry potter chamber secrets','Harry Potter and the Chamber of Secrets'],
  ['golden gate','Golden Gate Bridge'],['the pulp fiction','Pulp Fiction'],
  ['i think it is diamond sword','Diamond Sword']
 ])assert.equal(resolveAnswer(p,typed).answer?.label,label,typed);
 for(const typed of ['new york','tikka masala','harry potter','good bad','night','bridge','golden'])assert.equal(resolveAnswer(p,typed).status,'missing',typed);
 const minecraft=bank(['Diamond Sword','Redstone Block'],{inputNoise:['minecraft']});
 assert.equal(matchAnswer(minecraft,'Minecraft dimond swrod')?.label,'Diamond Sword');
 assert.equal(matchAnswer(minecraft,'dimond swrod in minecraft')?.label,'Diamond Sword');
 assert.equal(matchAnswer(minecraft,'preminecraft diamond sword'),null);
 assert.equal(matchAnswer(minecraft,'minecraftian diamond sword'),null);
});
test('digits, signs and sequel identities are protected, even in a plausible misspelling',()=>{
 for(const [typed,label]of [['Dark Sould 3','Dark Souls III'],['Dark Sould III','Dark Souls III'],['Dark Sould 2','Dark Souls II'],['GTA 5','Grand Theft Auto V']])assert.equal(matchAnswer(p,typed)?.label,label,typed);
 for(const typed of ['Dark Souls','Dark Souls 4','Dark Sould 4','Dark Souls 23','GTA 6','Grand Theft Auto','Grand Theft Auto IV','Grand Theft Auto 6'])assert.equal(matchAnswer(p,typed),null,typed);
 const code=bank(['C++','C#']);for(const typed of ['C','C+','C##','C+++'])assert.equal(matchAnswer(code,typed),null,typed);
});
test('spacing, accents, punctuation, plurals and word order do not change points',()=>{
 const q=bank([{label:'Café au lait',aliases:['Cafe au lait'],points:85},'Diamond Sword','Black Coffee']);
 for(const typed of ['CAFÉ AU LAIT!','cafeaulait'])assert.equal(resolveAnswer(q,typed).status,'exact',typed);
 for(const typed of ['black coffees','coffee black','blackcofee','diamond sw ord','diamondswordd'])assert.ok(matchAnswer(q,typed),typed);
 assert.equal(matchAnswer(q,'cafe au laitt').points,85);
});
test('a curated short name works without guessing a new one from a shared noun',()=>{
 const q=bank([{label:'Freddy Krueger',aliases:['Freddy'],points:30},{label:'Harry Potter and the Sorcerer\'s Stone',aliases:['Sorcerer Stone'],points:85}]);
 assert.equal(resolveAnswer(q,'Freddy').status,'exact');assert.equal(matchAnswer(q,'fredddy')?.label,'Freddy Krueger');
 assert.equal(matchAnswer(q,'sorceror stone')?.points,85);assert.equal(matchAnswer(q,'stone'),null);
});
test('empty, punctuation-only, overlong and wrong-category inputs cannot become answers',()=>{
 for(const typed of ['',null,'...','🦐','a'.repeat(257),'zzqvxx','Black Coffee'+' '.repeat(256)])assert.equal(matchAnswer(p,typed),null);
 const q=bank(['Mosasaur','Mosasaurus'],{excludedAnswers:['Mosasaurus']});
 // Explicit inventory names still have priority; actual banks omit excluded names.
 assert.equal(resolveAnswer(q,'Mosasaurus').status,'exact');
 const excluded=bank(['Mosasaur'],{excludedAnswers:['Mosasaurus']});assert.equal(matchAnswer(excluded,'Mosasaurus'),null);
});
