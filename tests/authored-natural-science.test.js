import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_BY_ID} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';
const specs=JSON.parse(readFileSync(new URL('../data-snapshots/authored/natural-science-specifications.json',import.meta.url))).questions;
const get=k=>PACK_BY_ID.get('authored-'+k);
const hit=(k,s)=>{const r=resolveAnswer(get(k),s);assert.equal(r.status,'exact',k+': '+s);return r.answer.label;};
test('all eight independently written natural and academic inventories cover their common inputs',()=>{for(const q of specs)for(const s of q.familiar)hit(q.key,s);});
test('modern biological classification excludes known historical dictionary errors',()=>{
 for(const[k,inputs]of Object.entries({'fungus-kinds':['Slime mold','Water mold','Clubroot fungus'],'reptile-kinds':['Dimetrodon','Synapsid','Hoop snake'],'crustacean-kinds':['Horseshoe crab'],'mollusk-kinds':['Lobster'],'arachnid-kinds':['Centipede']}))for(const s of inputs)assert.notEqual(resolveAnswer(get(k),s).status,'exact',k+': '+s);
});
test('real scientific and public animal names share one identity',()=>{
 for(const[k,a,b]of [['fungus-kinds','Maitake','Hen of the woods'],['fungus-kinds','Porcini','Boletus edulis'],['fungus-kinds','Enoki','Winter mushroom'],['reptile-kinds','Anguis fragilis','Slow worm'],['reptile-kinds','Nile crocodile','African crocodile'],['amphibian-kinds','Red eft','Eastern newt'],['mollusk-kinds','Queen conch','Strombus gigas'],['crustacean-kinds','Pistol shrimp','Snapping shrimp'],['arachnid-kinds','Ixodes dammini','Deer tick'],['arachnid-kinds','Ricinuleid','Hooded tickspider']])assert.equal(hit(k,a),hit(k,b),a+' / '+b);
});
test('different real species and research subjects keep their own identities',()=>{
 for(const[k,a,b]of [['reptile-kinds','Asp viper','Egyptian cobra'],['reptile-kinds','Copperhead','Lowland copperhead'],['arachnid-kinds','Whip spider','Whip scorpion'],['science-branches','Neurology','Neuroscience'],['mathematics-branches','Real analysis','Complex analysis']])assert.notEqual(hit(k,a),hit(k,b),a+' / '+b);
});
test('academic fields reject pseudoscience without fabricated acronym shortcuts',()=>{
 for(const s of ['Astrology','Phrenology','Palm reading'])assert.notEqual(resolveAnswer(get('science-branches'),s).status,'exact',s);
 for(const s of ['CS','DS','QI'])assert.notEqual(resolveAnswer(get('science-branches'),s).status,'exact',s);
 for(const s of ['GT','NT','DE'])assert.notEqual(resolveAnswer(get('mathematics-branches'),s).status,'exact',s);
});
