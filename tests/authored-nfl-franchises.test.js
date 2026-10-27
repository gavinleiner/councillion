import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{PACK_BY_ID,MIXED_PACKS,PARTY_PACKS}from'../data.js';import{resolveAnswer}from'../answer-matching.js';
const specs=JSON.parse(readFileSync(new URL('../data-snapshots/authored/nfl-franchise-specifications.json',import.meta.url))).questions;
const byCode=new Map(specs.map(q=>[q.teamCode,q]));
const pack=code=>{const q=byCode.get(code),p=PACK_BY_ID.get('authored-'+q.key);return {...p,excludedAnswers:q.exclude};};
const exact=(code,s)=>{const r=resolveAnswer(pack(code),s);assert.equal(r.status,'exact',code+': '+s);return r.answer.label;};
test('all 32 whole roster inventories include every independently chosen familiar player',()=>{for(const q of specs)for(const s of q.familiar)exact(q.teamCode,s);});
test('same-city predecessors and reused team codes do not become the current franchise',()=>{
 for(const[yes,no,name]of [['ten','hou','Warren Moon'],['ten','hou','Earl Campbell'],['ind','bal','Johnny Unitas'],['sf','ind','Y.A. Tittle'],['lar','cle','Ralph Isselhardt'],['lar','ari','Marshall Faulk'],['ari','lar','Dan Dierdorf']]){exact(yes,name);assert.equal(resolveAnswer(pack(no),name).status,'missing',no+': '+name);}
 for(const[code,s]of [['buf','John Batorski'],['dal','George Taliaferro']])assert.equal(resolveAnswer(pack(code),s).status,'missing',code+': '+s);
});
test('full-name collisions keep verified player aliases in the right franchise',()=>{
 for(const[yes,no,name]of [['car','nyg','Steve Smith Sr.'],['dal','buf','Ed Too Tall Jones'],['ten','ne','Billy White Shoes Johnson'],['cle','lar','Clay Matthews Jr.'],['gb','cle','Clay Matthews III'],['mia','den','Patrick Surtain Sr.'],['ari','ind','Michael Pittman Sr.']]){exact(yes,name);assert.equal(resolveAnswer(pack(no),name).status,'missing',no+': '+name);}
 exact('nyg','Steve Smith');exact('den','Pat Surtain II');exact('ind','Michael Pittman Jr.');
});
test('genuine personal name changes share identity; generated initials are absent',()=>{
 assert.equal(exact('cin','Chad Johnson'),exact('cin','Chad Ochocinco'));assert.equal(exact('cle','Josh Cribbs'),exact('cle','Joshua Cribbs'));assert.equal(exact('lar','Elroy Hirsch'),exact('lar','Crazy Legs Hirsch'));
 for(const code of ['buf','kc','ne'])for(const s of ['JA','PM','TB','J.Allen','P.Mahomes','T.Brady'])assert.equal(resolveAnswer(pack(code),s).status,'missing',code+': '+s);
});
test('all source rows and qualified historical franchise seasons stay represented',()=>{
 const q=JSON.parse(readFileSync(new URL('../data-snapshots/authored/nfl-franchise-checks.json',import.meta.url)));assert.equal(q.sourceRosterRecords,142739);assert.equal(q.checks.length,32);
 const id=code=>'authored-'+byCode.get(code).key;
 for(const[code,years]of [['chi',[1920,1921,1922]],['lar',[1937,1945,1946,1995,2002,2016]],['ari',[1920,1944,1960,1988]],['lac',[1960,1961,2017]],['was',[1932,1937]],['nyg',[1925,1927,1929]],['pit',[1943,1944]]]){
  const r=q.checks.find(p=>p.id===id(code));for(const y of years)assert.ok(r.coverageYears.includes(y),code+': '+y);
 }
});
test('only the balanced seven approved NFL additions enter both ordinary pools',()=>{
 const expected=new Set(['buf','car','dal','kc','ne','phi','sf'].map(c=>'authored-'+byCode.get(c).key));
 const actual=MIXED_PACKS.filter(q=>q.group==='authored-whole-nfl-franchise-roster').map(q=>q.id);assert.deepEqual(new Set(actual),expected);assert.deepEqual(PARTY_PACKS.map(q=>q.id),MIXED_PACKS.map(q=>q.id));
});
