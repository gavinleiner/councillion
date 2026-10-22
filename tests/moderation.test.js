import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDisplayName,safeDisplayName,containsBlockedLanguage,validateChat} from '../moderation.js';
import {readPlayerPreferences,savePlayerPreferences} from '../player-preferences.js';
test('blocks slurs with case, repetition, separators, leetspeak, invisible letters and homoglyphs',()=>{
 for(const name of ['NIGGER','n1gg3r','n.i.g.g.a','n i g g e r','ni\u200bgger','nіggеr','f4gg0t','retard123','N4Z1','fuck123'])assert.throws(()=>validateDisplayName(name),/different name/,name);
 for(const name of ['hi😀','abcdefghijklmnopq','<script>','Counsel\nNigger'])assert.throws(()=>validateDisplayName(name));
 assert.equal(safeDisplayName('NIGGER'),'Counsel');assert.equal(containsBlockedLanguage('hello friends'),false);assert.throws(()=>validateChat('you f4gg0t'),/court chat/);
});
test('keeps ordinary names and avoids substring false positives',()=>{
 for(const name of ['Gavin','Class Act','Scunthorpe','Cassidy','Raccoon','Dickens','Niger','O\'Brien','Counsel_42','Deep-Counsel'])assert.equal(validateDisplayName(name),name);
 assert.equal(validateDisplayName('  José  '),'Jose');
});
test('saved customization is scoped per Google account and invalid names are never persisted',()=>{
 const entries=new Map(),storage={getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v)},one={id:'one',name:'Gavin Leiner'},two={id:'two',name:'Friend Two'};
 savePlayerPreferences(storage,one,{name:'Counsel G',buddy:'angler',publicRoom:false});assert.deepEqual(readPlayerPreferences(storage,one),{name:'Counsel G',buddy:'angler',publicRoom:false});assert.equal(readPlayerPreferences(storage,two).name,'Friend');
 const before=[...entries];assert.throws(()=>savePlayerPreferences(storage,one,{name:'n1gg3r',buddy:'squid'}));assert.deepEqual([...entries],before);
 entries.set('fc:player:two',JSON.stringify({name:'NIGGER',buddy:'made-up'}));assert.deepEqual(readPlayerPreferences(storage,two),{name:'Counsel',buddy:'krill',publicRoom:true});
});
