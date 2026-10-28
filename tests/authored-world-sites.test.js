import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';import{PACK_BY_ID}from'../data.js';import{resolveAnswer}from'../answer-matching.js';
const p=k=>PACK_BY_ID.get('authored-'+k);
test('airport codes come from documented source fields and resolve to the actual facility',()=>{
 const s=JSON.parse(gunzipSync(readFileSync(new URL('../data-snapshots/authored/sources/ourairports-full.json.gz',import.meta.url))));assert.equal(s.airports.length,86286);
 for(const[code,re]of [['RDU',/Raleigh.Durham/i],['ILM',/Wilmington/i],['CLT',/Charlotte Douglas/i],['LHR',/Heathrow/i],['JFK',/Kennedy/i]]){assert.ok(s.airports.some(r=>r.iata_code===code));const r=resolveAnswer(p('named-airports'),code);assert.equal(r.status,'exact');assert.match(r.answer.label,re);}
});
test('primary site names and true aliases share their supported identities',()=>{
 for(const[k,inputs]of [['castles-palaces',['Cinderella Castle','Chateau de Chambord','Hogwarts Castle']],['archaeological-sites',['Sanchi','Pyramids of Giza','Mesa Verde']],['named-mausoleums',["Grant's Tomb","Itmad-ud-Daulah's Tomb",'Anitkabir','Graceland','Les Invalides','Monticello','Mount Vernon']]])for(const n of inputs)assert.equal(resolveAnswer(p(k),n).status,'exact',n);
 assert.equal(resolveAnswer(p('named-mausoleums'),"Grant's Tomb").answer.label,resolveAnswer(p('named-mausoleums'),'General Grant National Memorial').answer.label);
});
test('generic feature words and unnamed placeholders never identify named sites',()=>{
 for(const[k,words]of [['named-airports',['Airport','Airfield']],['castles-palaces',['Castle','Palace']],['archaeological-sites',['Pyramid','Archaeological site','Unnamed']],['named-mausoleums',['Tomb','Cemetery','Mausoleum']]])for(const word of words)assert.equal(resolveAnswer(p(k),word).status,'missing',k+':'+word);
});
