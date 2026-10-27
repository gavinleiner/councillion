import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_BY_ID} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';
const dir=new URL('../data-snapshots/authored/',import.meta.url);
const specs=JSON.parse(readFileSync(new URL('frozen-brands-specifications.json',dir))).questions;
const ledger=JSON.parse(readFileSync(new URL('frozen-brands-review-ledger.json',dir)))['frozen-dessert-brands'];
const p=PACK_BY_ID.get('authored-frozen-dessert-brands');
const exact=input=>{const r=resolveAnswer(p,input);assert.equal(r.status,'exact',input);return r.answer;};
const same=(a,b)=>assert.equal(exact(a).label,exact(b).label,`${a}/${b}`);
const different=(a,b)=>assert.notEqual(exact(a).label,exact(b).label,`${a}/${b}`);

test('one broad frozen-dessert subject accepts all independent familiar names and maintains its boundaries',()=>{
 assert.equal(specs.length,1);assert.equal(specs[0].familiar.length,37);
 assert.ok(ledger.canonicalAnswers>=300);
 for(const input of specs[0].familiar)exact(input);
 for(const input of specs[0].exclude)assert.equal(resolveAnswer(p,input).status,'missing',input);
 assert.equal(exact('DQ').points,10);assert.equal(exact('Ben and Jerry\'s').points,10);
 assert.equal(exact('Antica Gelateria del Corso').points,85);
 assert.equal(exact('The Licktators').points,100);
});

test('actual regional names and renames share identity without collapsing brands under the same parent',()=>{
 for(const[a,b]of [["Dreyer's","Edy's"],["Edy's Pie",'Eskimo Pie'],['Cosmic Bliss','Coconut Bliss'],['3 Kaveria','3 Friends'],['3 Friends','3 Vänner'],["Wendy's Milk Bar","Wendy's Supa Sundaes"],['Bresler\'s Ice Cream',"Bresler's 33 Flavors"],['Van Leeuwen','Van Leeuwen Ice Cream'],["Jeni's","Jeni's Splendid Ice Creams"],['Mövenpick','Movenpick Ice Cream'],['DQ','Dairy Queen'],['COWS','Cows Creamery'],["Rita's","Rita's Italian Ice"]])same(a,b);
 for(const[a,b]of [['Breyers',"Dreyer's"],["Edy's","Edy's Pie"],['Blue Bell','Blue Bunny'],["Wall's",'Cornetto'],['Magnum','Cornetto'],['Popsicle','Fudgsicle'],['Popsicle','Creamsicle'],['Snickers','Twix'],['Mars','Milky Way'],['Eskimo','Eskimo Pie'],["Wendy's Milk Bar",'Frosty'],['Dairy Queen','Blizzard'],['Bon Ice','Bon Ice Cream'],['Hershey Creamery Company','Dove']])different(a,b);
});

test('licensed frozen lines, non-dairy products and house brands count without accepting every candy or flavor',()=>{
 for(const input of ['Snickers','Snickers Ice Cream','Twix','M&M\'S','Dove','Milky Way','Kind Frozen','Starburst Sorbet','Mars','Nutella','Kinder Bueno','Trolli Gummi Pop','Butterfinger','Great Value','Favorite Day','Sundae Shoppe','So Delicious','Oatly','NadaMoo!','Cosmic Bliss','Nandini','CreamBell','Samanco','Yukimi Daifuku','My/Mochi','Little Moons','Mini Melts','FatBoy','McFlurry','Frosty','Blizzard','SONIC Blast'])exact(input);
 for(const input of ['BB','HD','BJ','MCD','Slurpee Flavor Tie-Ins','24 Flavors of Soft Serve','Frozen pizza','Vanilla flavor','Snickers candy bar','Frosty Paws','Chocolate flavor','Ice cream scoop utensil'])assert.notEqual(resolveAnswer(p,input).status,'exact',input);
});

test('source and held ledgers distinguish original brand names from unsupported headings and parent propagation',()=>{
 for(const input of ['Slurpee Flavor Tie-Ins','24 Flavors of Soft Serve','Keventers Milkshake','Karnataka Milk Federation','Swisslion Group','Thirst Buster','Frosty Paws'])assert.ok(ledger.held.some(r=>r.label===input),input);
 const receipts=JSON.parse(readFileSync(new URL('frozen-brands-source-receipts.json',dir)));
 assert.ok(receipts.some(r=>r.status==='unavailable-no-retry'));
 assert.ok(receipts.some(r=>r.source==='indexed-complete-list-sections'));
 const names=Object.keys(ledger.canonicalSourceMap);
 assert.equal(names.length,new Set(names).size);assert.ok(!names.includes('Cookie dough flavor'));
});
