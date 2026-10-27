import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{PACK_BY_ID}from'../data.js';import{resolveAnswer}from'../answer-matching.js';
const manifest=JSON.parse(readFileSync(new URL('../authored-bank-manifest.json',import.meta.url))).categories;
const ids=['pokemon-moves','pokemon-abilities','pokemon-items','pokemon-types','tea-brands','color-names'];
const exact=(key,input)=>{const r=resolveAnswer(PACK_BY_ID.get('authored-'+key),input);assert.equal(r.status,'exact',key+': '+input);return r.answer.label;};
test('complete new inventories retain every independent common input and reject known other concepts',()=>{
 for(const id of ids){const q=manifest.find(q=>q.id==='authored-'+id);assert.ok(q);for(const n of q.familiar)exact(id,n);for(const n of q.exclude)assert.equal(resolveAnswer(PACK_BY_ID.get(q.id),n).status,'missing',q.id+': '+n);}
});
test('Pokémon old public move names, duplicate implementations and real item abbreviations keep one identity',()=>{
 for(const[x,y]of [['Vice Grip','Vise Grip'],['Hi Jump Kick','High Jump Kick'],['Faint Attack','Feint Attack']])assert.equal(exact('pokemon-moves',x),exact('pokemon-moves',y));
 for(const n of ['TM01','TR01','Pokédex','Pokégear','Pokétch','C-Gear','PDA','Rotom Phone','Hopo Berry','Roseli Berry'])exact('pokemon-items',n);
 assert.notEqual(exact('pokemon-items','Pokédex'),exact('pokemon-items','Rotom Phone'));
 for(const n of ['TB','FB','TW'])assert.equal(resolveAnswer(PACK_BY_ID.get('authored-pokemon-moves'),n).status,'missing',n);
 assert.equal(exact('pokemon-types','Water type'),exact('pokemon-types','Water'));
 assert.equal(PACK_BY_ID.get('authored-pokemon-types').answers.length,19);
});
test('ordinary tea brand names and true color synonyms have stable shared identities',()=>{
 for(const[x,y]of [['Navy','Navy blue'],['Grey','Gray'],['Aqua','Cyan'],['Fuchsia','Magenta'],['Ochre','Ocher'],['Golden','Gold']])assert.equal(exact('color-names',x),exact('color-names',y));
 for(const n of ['Off-white','Burgundy','Rebecca Purple','Razzmic Berry','Slate grey'])exact('color-names',n);
 for(const[x,y]of [['Bigelow','Bigelow Tea Company'],['Numi','Numi Organic Tea'],['Brisk','Lipton Brisk'],['AriZona','Arizona Tea'],['Gold Peak','Gold Peak Tea']])assert.equal(exact('tea-brands',x),exact('tea-brands',y));
 assert.ok(!PACK_BY_ID.get('authored-tea-brands').answers.some(a=>/Companies portal|^Tea$/.test(a.label)));
});
test('flower additions restore common flowering shrubs and the ordinary honeysuckle identity',()=>{
 for(const n of ['Jasmine','Lily of the valley','Buttercup','Dandelion','Heather','Hollyhock','Azalea','Rhododendron','Wisteria','Clematis','Nasturtium','Honeysuckle','Poinsettia','Oleander','Periwinkle','Yarrow','Forsythia','Clivia','Sea holly','Monkshood'])exact('flower-kinds',n);
 assert.equal(exact('flower-kinds','Honeysuckle'),'Honeysuckle');assert.notEqual(exact('flower-kinds','Honeysuckle'),exact('flower-kinds','Meeting house'));
});
