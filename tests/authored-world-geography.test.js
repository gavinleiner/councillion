import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_BY_ID} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';
const proof=JSON.parse(readFileSync(new URL('../data-snapshots/authored/world-geography-checks.json',import.meta.url)));
const specs=JSON.parse(readFileSync(new URL('../data-snapshots/authored/world-geography-specifications.json',import.meta.url))).questions;
const p=id=>PACK_BY_ID.get('authored-'+id);
test('whole global feature inventories retain complete eligible source classes rather than country slices or source page limits',()=>{
 const minimum={ 'mountains-peaks':476853,'islands-archipelagos':175037,deserts:348,beaches:16219,glaciers:8353,caves:4110,reservoirs:112870,dams:70192};
 for(const[key,total]of Object.entries(minimum)){
  const row=proof.find(r=>r.key===key);assert.ok(row,key);assert.equal(row.rawPrimaryRows,total,key);assert.equal(p(row.id.replace('authored-','')).answerCount,row.canonicalAnswers,key);
 }
 for(const spec of specs.filter(q=>q.buildStage==='reviewable-candidate')){
  const pack=PACK_BY_ID.get(spec.id);assert.ok(pack,spec.id);for(const input of spec.familiar)assert.equal(resolveAnswer(pack,input).status,'exact',spec.id+': '+input);
  for(const input of spec.exclude)assert.equal(resolveAnswer(pack,input).status,'missing',spec.id+': '+input);
 }
});
test('familiar English and historical place names share the real feature identity and score',()=>{
 for(const[id,a,b]of [
  ['mountains-peaks','Mount Fuji','Fujiyama'],['mountains-peaks','Vinson Massif','Mount Vinson'],
  ['named-deserts','Bledow Desert','Pustynia Bledowska'],['glaciers','Fedchenko Glacier','Vanch-Yakh Glacier'],
  ['glaciers','Briksdalsbreen','Brigsdalsbreen'],['glaciers','Sermeq Kujalleq','Jakobshavn Isbrae'],
  ['reservoirs','Harris Lake','Shearon Harris Reservoir'],['reservoirs','Lake Eucumbene','Eucumbene']
 ]){
  const one=resolveAnswer(p(id),a),two=resolveAnswer(p(id),b);assert.equal(one.status,'exact',a);assert.equal(two.status,'exact',b);assert.equal(one.answer.label,two.answer.label,a);assert.equal(one.answer.points,two.answer.points,a);
 }
 for(const name of ['Wrightsville Beach','Carolina Beach','Kure Beach'])assert.equal(resolveAnswer(p('beaches'),name).status,'exact',name);
 for(const name of ['Ireland','Maldives'])assert.equal(resolveAnswer(p('islands-archipelagos'),name).status,'exact',name);
 for(const name of ['Greenland Ice Sheet','Antarctic Ice Sheet'])assert.equal(resolveAnswer(p('glaciers'),name).status,'exact',name);
});
test('known wrong planet, object and feature-class names cannot become accepted names or correction offers',()=>{
 for(const[id,names]of [['mountains-peaks',['Olympus Mons','Himalayas','Volcano','Mountain']],['glaciers',['Iceberg','Iceberg lettuce','Frozen Lake Erie']],['islands-archipelagos',['Australia','United Kingdom','Island']],['named-deserts',['Desert','The desert']]])for(const n of names)assert.equal(resolveAnswer(p(id),n).status,'missing',id+': '+n);
 assert.equal(resolveAnswer(p('mountains-peaks'),'K2').status,'exact');
});
