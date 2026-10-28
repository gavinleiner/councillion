import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveAnswer} from '../answer-matching.js';
const pack={id:'version-proof',preserveNumericTokens:true,literalAliases:{'Windows 1.0':'Windows version 1.0','Android 1.6':'Android Donut','IOS':'Cisco IOS'},answers:[
 {label:'Windows 10',points:10,aliases:[]},{label:'Windows version 1.0',points:85,aliases:[]},{label:'Windows 95',points:60,aliases:[]},
 {label:'Android 16',points:30,aliases:[]},{label:'Android Donut',points:85,aliases:['Donut']},
 {label:'iOS',points:10,aliases:[]},{label:'Cisco IOS',points:85,aliases:[]},
]};
const exact=input=>{const r=resolveAnswer(pack,input);assert.equal(r.status,'exact',input);return r.answer.label;};
test('opted-in version names retain decimal boundaries without requiring letter-case accuracy',()=>{
 assert.equal(exact('Windows 10'),'Windows 10');assert.equal(exact('WINDOWS 1.0'),'Windows version 1.0');
 assert.equal(exact('Android 16'),'Android 16');assert.equal(exact('android 1.6'),'Android Donut');
 assert.equal(exact('IOS'),'Cisco IOS');assert.equal(exact('iOS'),'iOS');
 for(const input of ['Windows 9.5','Windows 9-5','Android 99','WX'])assert.equal(resolveAnswer(pack,input).status,'missing',input);
});
test('dotted-version misspellings still propose the right identity after submission',()=>{
 const r=resolveAnswer(pack,'Windwos 1.0');assert.equal(r.status,'matched');assert.equal(r.answer.label,'Windows version 1.0');
 assert.equal(resolveAnswer(pack,'Windows 10').answer.corrected,false);
 const punctuation=resolveAnswer(pack,'Android 1-6');assert.equal(punctuation.status,'matched');assert.equal(punctuation.answer.label,'Android Donut');
});
test('existing packs retain ordinary punctuation folding unless they explicitly opt in',()=>{
 const ordinary={id:'ordinary',answers:[{label:'B-52',points:30,aliases:[]}]};
 assert.equal(resolveAnswer(ordinary,'B52').status,'exact');
 assert.equal(resolveAnswer(ordinary,'B 52').status,'exact');
});
