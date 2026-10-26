import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';import{PACK_BY_ID}from'../data.js';import{resolveAnswer}from'../answer-matching.js';
const p=id=>PACK_BY_ID.get('authored-'+id),answer=(id,input)=>{const r=resolveAnswer(p(id),input);assert.equal(r.status,'exact',id+': '+input);return r.answer;};
test('named SI prefixes keep the entire valid range inside one unit question and never stack mass prefixes',()=>{
 for(const name of ['Meter','Metre','Kilogram','Mile','Byte','MPH','Hectopascal','Microradian','Ronnametre','Quectogram','Kilokatal','Microdegree Celsius','Megacoulomb','Millisecond','Kilowatt'])answer('measurement-unit-names',name);
 assert.equal(answer('measurement-unit-names','MPH').label,answer('measurement-unit-names','Mile per hour').label);
 for(const name of ['Kilokilogram','Dollar','Banana scale','XY'])assert.equal(resolveAnswer(p('measurement-unit-names'),name).status,'missing',name);
 assert.equal(p('measurement-unit-names').answerCount,925);
});
test('real bone positions and left/right names are accepted without confusing tissues or pigments with structures',()=>{
 for(const [a,b]of [['Left femur','Femur'],['Right collarbone','Clavicle'],['C3','Third cervical vertebra'],['T12','Twelfth thoracic vertebra'],['Rib 8','Eighth rib']])assert.equal(answer('human-bone-names',a).label,answer('human-bone-names',b).label);
 assert.equal(p('human-bone-names').answerCount,124);answer('cell-structure-names','Cell capsule');answer('cell-structure-names','Bacterial capsule');
 for(const n of ['Chlorophyll','Kidney','Brain'])assert.equal(resolveAnswer(p('cell-structure-names'),n).status,'missing',n);
});
test('the whole wizarding cast retains source names, repairs official spellings and includes missing familiar characters',()=>{
 const source=JSON.parse(gunzipSync(readFileSync(new URL('../data-snapshots/authored/sources/character-rosters.json.gz',import.meta.url))));
 const repairs=JSON.parse(readFileSync(new URL('../data-snapshots/authored/wizarding-world-supplements.json',import.meta.url)));
 for(const r of source.harryPotter)if(!/\b(?:unidentified|unnamed|unknown)\b/i.test(r.name))answer('wizarding-world-characters',repairs.rename[r.name]??r.name);
 for(const name of ['Dean Thomas','Nagini','Viktor Krum','Quirinus Quirrell','Ollivander'])answer('wizarding-world-characters',name);
 for(const[input,proper]of [['Victor Krum','Viktor Krum'],['Quirinus Quirrel','Quirinus Quirrell']]){const r=resolveAnswer(p('wizarding-world-characters'),input);assert.equal(r.status,'matched',input);assert.equal(r.answer.label,proper,input);}assert.equal(answer('wizarding-world-characters','Ollivander').label,'Garrick Ollivander');
 for(const name of ['Daniel Radcliffe','Gandalf','Queenie Goldstein'])assert.equal(resolveAnswer(p('wizarding-world-characters'),name).status,'missing',name);
 assert.equal(p('wizarding-world-characters').answerCount,437);
});
test('real sushi styles, dressing names, pizza styles and product names do not depend on fuzzy spelling rescue',()=>{
 for(const[id,names]of [['sushi-preparations',['Temari','Temaki','Inari','Inarizushi']],['salad-dressings',['Italian','French','Russian','Poppy seed','Sesame ginger','Greek','Avocado ranch']],['pizza-styles',['Neapolitan','Sicilian','French bread pizza','Tavern style','Quad Cities style']],['soft-drink-products',['Mug','Baja Blast']]])for(const name of names)answer(id,name);
 assert.notEqual(answer('sushi-preparations','Temari').label,answer('sushi-preparations','Temaki').label);assert.equal(answer('sushi-preparations','Temari').label,'Temari sushi');
 assert.equal(answer('sushi-preparations','Inari').label,'Inari sushi');assert.equal(resolveAnswer(p('sushi-preparations'),'Sashimi').status,'missing');
 assert.equal(answer('soft-drink-products','Baja Blast').label,'Mountain Dew Baja Blast');
});
