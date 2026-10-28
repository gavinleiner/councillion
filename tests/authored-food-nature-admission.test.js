import test from 'node:test';import assert from 'node:assert/strict';import {PACK_BY_ID}from'../data.js';import{resolveAnswer}from'../answer-matching.js';const p=id=>PACK_BY_ID.get('authored-'+id),a=(id,n)=>{const r=resolveAnswer(p(id),n);assert.equal(r.status,'exact',id+': '+n);return r.answer;};
test('ordinary cereal names stay separate from similarly spelled historic products and flattened lists cannot become products',()=>{
 for(const n of ['Muesli','Granola','Porridge',"Flahavan's Progress Oatlets","Kavanagh's Porridge",'Curves Fruit & Nut Crunch','Curves Honey Crunch'])a('breakfast-cereal-products',n);
 assert.notEqual(a('breakfast-cereal-products','Muesli').label,a('breakfast-cereal-products','Mueslix').label);assert.notEqual(a('breakfast-cereal-products','Granola').label,a('breakfast-cereal-products','Granula').label);
 const names=p('breakfast-cereal-products').answers.map(a=>a.label);assert.ok(!names.includes("Porridge Flahavan's Progress Oatlets Kavanagh's Porridge"));assert.ok(!names.includes('Curves Fruit & Nut Crunch Curves Honey Crunch'));
});
test('conventional food names and singular cookie names have explicit identities without broad spelling guesses',()=>{
 for(const n of ['Digestive','Thin Mint','Samoa','Tagalong','Do-si-do','Trefoil','Madeleine','Amaretti'])a('cookie-biscuit-types',n);
 for(const n of ['Boston cream pie','Whoopie pie','Engadine nut tart'])a('named-pies',n);
 for(const n of ['Frittata','Pizza','Chocolate cake'])assert.equal(resolveAnswer(p('named-pies'),n).status,'missing',n);
 for(const n of ['Birthday Cake Remix','Chubby Hubby'])a('ice-cream-flavors',n);a('fermentation-foods','Tabasco');
 for(const n of ['Beignet','Churro','Kolache','Spring roll','Pastéis de nata'])a('pastry-types',n);assert.notEqual(a('pastry-types','Beignet').label,a('pastry-types','Bignè').label);
});
test('leaf-parcel spellings share one identity and a real rice-cake noodle dish retains its own name',()=>{
 for(const[x,y]of [['Patoleo','Patholi'],['Khao tom mat','Khao tom mud']])assert.equal(a('leaf-wrapped-food',x).label,a('leaf-wrapped-food',y).label);
 for(const n of ['Udon','Udon soup','Soba','Spaghetti','Rabokki'])a('noodle-dishes',n);assert.equal(a('noodle-dishes','Rabokki').label,'Rabokki');assert.ok(!p('noodle-dishes').answers.some(a=>a.label==='Tteok-bokki noodles'));
 for(const n of ['Tteokbokki','Fusilli','Rice','Potato'])assert.equal(resolveAnswer(p('noodle-dishes'),n).status,'missing',n);
});
test('real sport and nature names are complete for the independent sweep and synonym variations cannot score twice',()=>{
 a('motorsport-disciplines','Rally');a('motorsport-disciplines','Trials');a('motorsport-disciplines','Drag boat racing');a('motorsport-disciplines','Motorcycle road racing');
 assert.equal(a('bodyweight-exercises','Natural leg extension').label,a('bodyweight-exercises','Reverse Nordic curl').label);
 a('bioluminescent-animals','Bermuda fireworm');assert.equal(a('bioluminescent-animals','Odontosyllis enopla').label,'Bermuda fireworm');
 for(const n of ['Locust','Desert locust','Migratory locust','Leatherback turtle'])a('migrating-animals',n);
 for(const n of ['Giraffe','Okapi','Horned lizard','Rhinoceros beetle'])a('animals-with-horns',n);
 for(const n of ['Horned owl','Unicorn','Walrus'])assert.equal(resolveAnswer(p('animals-with-horns'),n).status,'missing',n);
 for(const n of ['Peanut','Taro','Sweet potato','Lotus root','Jicama'])a('underground-food-crops',n);
});
