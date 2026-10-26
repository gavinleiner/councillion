import test from'node:test';import assert from'node:assert/strict';import{PACK_BY_ID}from'../data.js';import{resolveAnswer}from'../answer-matching.js';
const a=(k,n)=>{const r=resolveAnswer(PACK_BY_ID.get('authored-'+k),n);assert.equal(r.status,'exact',k+':'+n);return r.answer.label;};
test('ordinary SpongeBob names and hero personas use the actual character identity',()=>{
 for(const n of ['Larry','Patchy','Potty','Neptune','Plankton','Karen','Squilliam Fancyson','Kevin the Sea Cucumber','Fuzzy Acorns','Burger Beard','Squidina'])a('spongebob-characters',n);
 for(const[x,y]of [['Quickster','SpongeBob'],['Captain Magma','Squidward'],['Elastic Waistband','Patrick'],['Miss Appear','Sandy']])assert.equal(a('spongebob-characters',x),a('spongebob-characters',y));
});
test('Toy Story keeps its real later-film and television characters, with no fake combined source headers',()=>{
 for(const n of ['Bo','Al','Duke','Pricklepants','Potato Head','Benson','Lilypad','Smarty Pants','Mira Nova','Booster','XR','Commander Nebula','NOS-4-A2','Era','Eon','Epoch'])a('toy-story-characters',n);
 assert.equal(a('toy-story-characters','Agent Z'),a('toy-story-characters','Warp Darkmatter'));
 const labels=PACK_BY_ID.get('authored-toy-story-characters').answers.map(a=>a.label);assert.ok(!labels.includes('The Raenoks are the fiercest aliens in the Galaxy. Kleev'));assert.ok(!labels.includes('Chlorm Scientists - Era'));
});
test('Shrek includes individual children, its actual parody character and the Puss in Boots spin-off casts',()=>{
 for(const n of ['Puss','Kitty','Fergus','Farkle','Felicia','Goldilocks','Papa Bear','Mama Bear','Baby Bear','Fifi','Dulcinea','Artephius','Pajuna','Toby','Mama Luna','Doctor','Ethical Bug'])a('shrek-characters',n);
 assert.equal(a('shrek-characters','Young Goldilocks'),a('shrek-characters','Goldilocks'));assert.equal(a('shrek-characters','The Wolf'),a('shrek-characters','Death'));
 assert.equal(resolveAnswer(PACK_BY_ID.get('authored-shrek-characters'),'Jiminy Cricket').status,'missing');
});
test('actors and setting names never become character answers',()=>{
 for(const[k,n]of [['spongebob-characters','Tom Kenny'],['spongebob-characters','Krusty Krab'],['toy-story-characters','Tom Hanks'],['toy-story-characters','Pizza Planet'],['shrek-characters','Mike Myers'],['shrek-characters','Duloc']])assert.equal(resolveAnswer(PACK_BY_ID.get('authored-'+k),n).status,'missing',n);
});
