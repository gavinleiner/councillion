import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';import{PACK_BY_ID}from'../data.js';import{resolveAnswer}from'../answer-matching.js';
const p=k=>PACK_BY_ID.get('authored-'+k);
test('complete bird-family species names remain exact answers and scientific names share identity',()=>{
 const s=JSON.parse(gunzipSync(readFileSync(new URL('../data-snapshots/authored/sources/familiar-bird-families.json.gz',import.meta.url))));
 for(const[k,g]of Object.entries(s.groups))for(const r of g.species){const a=resolveAnswer(p(k),r.name),b=resolveAnswer(p(k),r.scientific);assert.equal(a.status,'exact',r.name);assert.equal(b.status,'exact',r.scientific);assert.equal(a.answer.label,b.answer.label);}
});
test('public bird names and domestic breeds stay usable after taxonomy spelling changes',()=>{
 for(const[k,inputs]of [['duck-goose-swan-kinds',['Greylag goose','Pekin duck','Indian Runner duck','Embden goose']],['woodpecker-kinds',['Green woodpecker']],['hummingbird-kinds',['Booted racket-tail']],['gull-tern-kinds',['Fairy tern']],['swallow-martin-kinds',['Red-rumped swallow']],['heron-egret-bittern-kinds',['Grey heron']]])for(const n of inputs)assert.equal(resolveAnswer(p(k),n).status,'exact',n);
});
test('computer languages preserve real short language names without editor shortcuts',()=>{
 for(const n of ['C','C++','C#','R','Go','Python','Visual Basic','Scratch','Blockly','SQL','HTML','CSS'])assert.equal(resolveAnswer(p('computer-languages'),n).status,'exact',n);
 assert.notEqual(resolveAnswer(p('computer-languages'),'C').answer.label,resolveAnswer(p('computer-languages'),'C++').answer.label);
 for(const n of ['Microsoft Word','English','JSON'])assert.equal(resolveAnswer(p('computer-languages'),n).status,'missing',n);
});
test('documented astronaut nicknames and space-agency acronyms resolve to their real identities',()=>{
 for(const n of ['Gus Grissom','Deke Slayton','Pete Conrad','Gene Cernan','Butch Wilmore','Tim Peake'])assert.equal(resolveAnswer(p('astronauts-cosmonauts'),n).status,'exact',n);
 const a=resolveAnswer(p('astronauts-cosmonauts'),'Butch Wilmore'),b=resolveAnswer(p('astronauts-cosmonauts'),'Barry Wilmore');assert.equal(a.answer.label,b.answer.label);
 for(const n of ['NASA','ESA','ISRO','JAXA','CNSA','CSA'])assert.equal(resolveAnswer(p('government-space-agencies'),n).status,'exact',n);
 assert.equal(resolveAnswer(p('government-space-agencies'),'CSA').answer.label,'Canadian Space Agency');
});
