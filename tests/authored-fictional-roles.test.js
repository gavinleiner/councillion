import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_BY_ID} from '../data.js';
import {resolveAnswer,normalize} from '../answer-matching.js';
import {newParty,startParty,answerParty} from '../engine.js';
const dir=new URL('../data-snapshots/authored/',import.meta.url);
const specs=JSON.parse(readFileSync(new URL('fictional-roles-specifications.json',dir))).questions;
const ledger=JSON.parse(readFileSync(new URL('fictional-roles-review-ledger.json',dir)))['fictional-spies'];
const p=PACK_BY_ID.get('authored-fictional-spies');
const exact=input=>{const r=resolveAnswer(p,input);assert.equal(r.status,'exact',input);return r.answer;};
const same=(a,b)=>assert.equal(exact(a).label,exact(b).label,`${a}/${b}`);
const different=(a,b)=>assert.notEqual(exact(a).label,exact(b).label,`${a}/${b}`);

test('one whole fictional covert-role subject preserves all34 original common inputs, not one question per character',()=>{
 assert.equal(specs.length,1);assert.equal(specs[0].familiar.length,34);assert.ok(p.answers.length>=300);
 for(const input of specs[0].familiar)exact(input);
 for(const input of specs[0].exclude)assert.notEqual(resolveAnswer(p,input).status,'exact',input);
 assert.equal(exact('James Bond').points,10);assert.equal(exact('Alec Leamas').points,100);
 assert.equal(exact('Gru').label,'Gru');assert.equal(exact('Gru').points,10);
 same('Gru','Felonious Gru');
 assert.equal(resolveAnswer(p,'Felonius Gru').status,'matched');
});

test('actual identities and public codenames work without generated initials or actor-name shortcuts',()=>{
 for(const[a,b]of [['James Bond','007'],['Perry the Platypus','Agent P'],['Maxwell Smart','Agent 86'],['Loid Forger','Twilight'],['Fiona Frost','Nightfall'],['Natasha Romanoff','Black Widow'],['Natasha Romanova','Black Widow'],['Gary Unwin','Eggsy'],['Winter Soldier','Bucky Barnes'],['Quake','Daisy Johnson'],['Skye','Daisy Johnson'],['Agent 13','Sharon Carter'],['Harry Hart','Galahad'],['Big Boss','Naked Snake'],['Desolation Jones','Michael Jones'],['Sherlock Holmes','Altamont'],['Alec Trevelyan','006']])same(a,b);
 for(const input of ['M','Q','Spy','Sam','Clover','Alex','John Smith','Jane Smith','Number Six','Raiden','Stan Smith'])exact(input);
 for(const input of ['JB','NP','TF','Tom Cruise','Rowan Atkinson','Ian Fleming','Daniel Craig'])assert.notEqual(resolveAnswer(p,input).status,'exact',input);
 assert.equal(p.preserveNumericTokens,true);
 for(const input of ['0.07','0.06','Agent 4.7','Agent 9.9'])assert.notEqual(resolveAnswer(p,input).status,'exact',input);
});

test('different people sharing roles, short names or codenames remain different answers',()=>{
 for(const[a,b]of [['Solid Snake','Big Boss'],['Big Boss','Venom Snake'],['Solid Snake','Venom Snake'],['Harry Hart','Gary Unwin'],['Natasha Romanoff','Natasha Fatale'],['Sam (Totally Spies)','Sam (Spynet)'],['Sam (Totally Spies)','Sam Fisher'],['John Smith','Jane Smith'],['Agent Six','Six (Agent Six of Hearts)'],['Number Six','Agent Six'],['Agent J','Agent K'],['Agent 13','Agent 13 (Get Smart)']])different(a,b);
 const owners=new Map();for(const answer of p.answers)for(const label of [answer.label,...answer.aliases]){const n=normalize(label);assert.ok(!owners.has(n)||owners.get(n)===answer.label,label);owners.set(n,answer.label);}
});

test('source-role holds do not turn titles, groups, police, mascots and real performers into spy answers',()=>{
 for(const input of ['Jake Peralta','Brooklyn Nine Nine','MI6','Spy Kids','McGruff the Crime Dog','Cybersix','Howard Finch','The Man from UNCLE','Magnifying glass'])assert.notEqual(resolveAnswer(p,input).status,'exact',input);
 assert.ok(ledger.held.length>=40);assert.ok(ledger.held.some(r=>r.sourceLine===285));assert.ok(ledger.held.some(r=>r.sourceLine===366));
 const receipts=JSON.parse(readFileSync(new URL('fictional-roles-source-receipts.json',dir)));
 assert.ok(receipts.some(r=>r.status==='unavailable-no-retry'));assert.ok(receipts.some(r=>r.access==='public-indexed-source-text-not-raw-html'));
 // Science/medical source captures are preparation, not a silently admitted second question.
 assert.equal(PACK_BY_ID.has('authored-fictional-scientists-doctors'),false);
});

test('Puffer awards distinct real Snake characters, while a repeated codename alias leaves the turn unchanged',()=>{
 const s=newParty([{id:'a',name:'A'},{id:'b',name:'B'}],()=>0);s.packIds=['authored-fictional-spies'];assert.ok(startParty(s,1000,()=>0));
 const a=answerParty(s,'a','Naked Snake',1100),b=answerParty(s,'b','Solid Snake',1200);assert.ok(a.answer);assert.ok(b.answer);assert.notEqual(a.answer.label,b.answer.label);assert.equal(s.used.length,2);
 assert.equal(s.players[0].score,a.answer.points);assert.equal(s.players[1].score,b.answer.points);
 const repeat=answerParty(s,'a','Big Boss',1300);assert.match(repeat.error,/Already/);assert.equal(s.used.length,2);assert.equal(s.turn,0);
 const wrong=answerParty(s,'a','Tom Cruise',1400);assert.ok(wrong.error);assert.equal(s.used.length,2);assert.equal(s.turn,0);
});
