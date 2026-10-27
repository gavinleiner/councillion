import test from 'node:test';import assert from 'node:assert/strict';import{PACK_BY_ID}from'../data.js';import{resolveAnswer}from'../answer-matching.js';
const exact=(key,n)=>{const r=resolveAnswer(PACK_BY_ID.get('authored-'+key),n);assert.equal(r.status,'exact',key+': '+n);return r.answer;};
test('ordinary names and real aliases are accepted across the whole object inventories',()=>{
 for(const[k,n]of [['writing-drawing-tools','Sharpie'],['writing-drawing-tools','Stylus'],['cleaning-equipment-kinds','Robot vacuum'],['makeup-product-kinds','Rouge'],['adhesive-kinds',"Elmer's"],['adhesive-kinds','Gorilla'],['toy-kinds','Lego'],['timepiece-kinds','Smartwatch'],['computer-device-kinds','Abacus'],['engine-kinds','Electric'],['flat-geometric-shapes','Heart'],['medical-instrument-kinds','EKG'],['printing-techniques','Riso'],['sculpture-kinds','Bronze'],['poem-forms','Blackout poem'],['art-movements-styles','Anime'],['flower-kinds','Lupin']])exact(k,n);
});
test('equivalent names cannot score twice while distinct devices and forms keep their own identities',()=>{
 for(const[k,x,y]of [['toy-kinds','Top','Spinning top'],['toy-kinds','Teddy','Teddy bear'],['timepiece-kinds','Clepsydra','Water clock'],['timepiece-kinds','Anniversary clock','Torsion pendulum clock'],['makeup-product-kinds','Rouge','Blush'],['flower-kinds','Cornflower',"Bachelor's button"],['art-movements-styles','Graffiti art','Graffiti']])assert.equal(exact(k,x).label,exact(k,y).label,k+': '+x);
 for(const[k,x,y]of [['engine-kinds','Turbojet','Turbofan'],['medical-instrument-kinds','Cardiograph','Ballistocardiograph'],['writing-drawing-tools','Digital pen','Stylus'],['poem-forms','Blackout poetry','Erasure poem']])assert.notEqual(exact(k,x).label,exact(k,y).label,k+': '+x);
});
test('source taxonomies do not admit parts, websites, three-dimensional shapes or individual works',()=>{
 for(const[k,n]of [['engine-kinds','Kick starter'],['engine-kinds','Electric generator'],['computer-device-kinds','Website'],['computer-device-kinds','Chatroom'],['flat-geometric-shapes','Cube'],['flat-geometric-shapes','Hyperbola'],['sculpture-kinds','The Thinker'],['poem-forms','Iambic pentameter'],['art-movements-styles','Vincent van Gogh']])assert.equal(resolveAnswer(PACK_BY_ID.get('authored-'+k),n).status,'missing',k+': '+n);
});
