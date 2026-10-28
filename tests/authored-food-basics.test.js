import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{PACK_BY_ID}from'../data.js';import{resolveAnswer}from'../answer-matching.js';
const specs=JSON.parse(readFileSync(new URL('../data-snapshots/authored/food-basics-specifications.json',import.meta.url))).questions;
const exact=(id,s)=>{const r=resolveAnswer(PACK_BY_ID.get('authored-'+id),s);assert.equal(r.status,'exact',id+': '+s);return r.answer.label;};
test('common culinary actions and whole edible seed classes are actually covered',()=>{for(const q of specs)for(const s of q.familiar)exact(q.key,s);});
test('real verb forms and public seed names share identity without initial shortcuts',()=>{
 for(const[a,b]of [['Knead','Kneading'],['Air fry','Air frying'],['Caramelising','Caramelization'],['Prove','Proofing'],['Peeling tomatoes','Peeling'],['Steeping','Infusion'],['Double boil','Bain-marie']])assert.equal(exact('cooking-techniques',a),exact('cooking-techniques',b));
 for(const[a,b]of [['Garbanzo bean','Chickpea'],['Linseed','Flaxseed'],['Corn','Maize'],['Pepita','Pumpkin seed'],['Water chestnut','Water caltrop'],['Filbert','Hazelnut']])assert.equal(exact('nuts-seeds',a),exact('nuts-seeds',b));
 for(const id of ['cooking-techniques','nuts-seeds'])for(const s of ['DF','SF','SN','PN'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-'+id),s).status,'exact',id+': '+s);
});
test('source utensils, finished dishes and botanical footers do not become exact food answers',()=>{
 for(const s of ['Fork','Vanilla','Lasagna','Anti-griddle','Syringe','Transglutaminase','Mother sauces','Maliard','Molecular gastronomy'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-cooking-techniques'),s).status,'exact',s);
 for(const s of ['Botanical nuts','Angiosperm','Gymnosperm','List of edible seeds','Sunflower oil'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-nuts-seeds'),s).status,'exact',s);
});
