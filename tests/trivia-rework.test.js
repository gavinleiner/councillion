import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {PACKS,MIXED_PACKS,PLAY_PACKS} from '../data.js';
import {FUN_PACKS} from '../fun-question-catalog.js';
import {matchAnswer,resolveAnswer,normalize,practiceDraw,random,dailyPacks} from '../engine.js';
const pack=id=>PACKS.find(p=>p.id===id);
test('main rotation uses approachable mixed topics, with specialists available separately',()=>{
 assert.ok(MIXED_PACKS.length>=60);assert.ok(PLAY_PACKS.length>MIXED_PACKS.length);
 assert.ok(!MIXED_PACKS.some(p=>/^(lex-|bird-warblers|city-west-100)/.test(p.id)||p.family==='words'));
 assert.ok(MIXED_PACKS.some(p=>p.id==='fun-minecraft'));assert.ok(MIXED_PACKS.some(p=>p.id==='fun-food'));
 for(let i=0;i<10;i++){const day=new Date(Date.UTC(2026,9,24+i)).toISOString().slice(0,10),draw=dailyPacks(day);assert.equal(draw.length,7);assert.equal(new Set(draw.map(p=>p.id)).size,7);assert.ok(draw.every(p=>MIXED_PACKS.includes(p)));}
});
test('major inventories include their unfamiliar tail and do not count aliases as answers',async()=>{
 assert.ok(pack('fun-video-games').answerCount>300000);assert.ok(pack('fun-movies').answerCount>40000);assert.ok(pack('fun-tv').answerCount>100000);assert.ok(pack('fun-cities').answerCount>100000);assert.ok(pack('fun-birds').answerCount>11000);
 const manifest=JSON.parse(await readFile(new URL('../fun-bank-manifest.json',import.meta.url),'utf8'));
 for(const p of FUN_PACKS){const compressed=await readFile(new URL('../question-banks/'+p.answerFile,import.meta.url)),raw=gunzipSync(compressed),rows=JSON.parse(raw);assert.equal(rows.length,p.answerCount,p.id);assert.equal(new Set(rows.map(a=>normalize(a[0]))).size,rows.length,p.id);assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.find(x=>x.id===p.id).sha256);assert.ok(rows.some(a=>a[1]===100));}
});
test('latest Minecraft labels and potion variants survive the bank merge',async()=>{
 const names=JSON.parse(await readFile(new URL('../data-snapshots/rework/minecraft-official.json',import.meta.url),'utf8'));
 for(const row of names)assert.ok(matchAnswer(pack('fun-minecraft'),row.displayName),row.displayName);
 for(const q of ['Blue Axolotl','Charged Creeper','Sulfur Cube','Potion of Healing','Notch Apple'])assert.ok(matchAnswer(pack('fun-minecraft'),q),q);
});
test('multiple typos, known aliases, omissions and reordered words resolve without substituting unrelated words',()=>{
 for(const q of ['dimon sord','dimom swrd','dimond swrod'])assert.equal(matchAnswer(pack('fun-minecraft'),q)?.label,'Diamond Sword',q);
 for(const q of ['night flame','flame night sword'])assert.match(matchAnswer(pack('fun-elden-ring'),q)?.label??'',/Sword Of Night And Flame/i,q);
 assert.equal(matchAnswer(pack('fun-elden-ring'),'sword night pizza'),null,'a different word is not a spelling correction');
 assert.match(matchAnswer(pack('fun-game-bosses'),'melenia blade miquela')?.label??'',/Malenia/i);
 assert.equal(matchAnswer(pack('fun-movies'),'sorcerer stone')?.label,"Harry Potter and the Sorcerer's Stone");
 assert.equal(matchAnswer(pack('fun-minecraft'),'qzxvjkppqq9'),null);
});
test('known abbreviations and nicknames take priority over accidental initials',()=>{
 for(const[id,q,label]of [['fun-tv','JJK','Jujutsu Kaisen'],['fun-tv','demon slayer','Demon Slayer: Kimetsu no Yaiba'],['fun-video-games','GTA 5','Grand Theft Auto V'],['fun-video-games','BOTW','The Legend of Zelda: Breath of the Wild'],['fun-movie-actors','The Rock','Dwayne Johnson']])assert.equal(matchAnswer(pack(id),q)?.label,label);
 const result=resolveAnswer({answers:[{label:'Black Bear',points:10,aliases:[]},{label:'Brown Bear',points:85,aliases:[]}]},'BB');assert.equal(result.answer,undefined);assert.equal(result.status,'missing');assert.equal(result.choices.length,0);
});
test('forgiving matching preserves exact names, scores and numeric sequel identity',()=>{
 const p={answers:[{label:'Dark Souls II',points:30,aliases:['Dark Souls 2']},{label:'Dark Souls III',points:85,aliases:['Dark Souls 3']}]};assert.equal(matchAnswer(p,'Dark Souls 2').label,'Dark Souls II');assert.equal(matchAnswer(p,'Dark Sould 3')?.label,'Dark Souls III');assert.equal(matchAnswer(p,'Dark Souls 4'),null);
 assert.equal(matchAnswer(pack('fun-minecraft'),'dimond swrod').points,matchAnswer(pack('fun-minecraft'),'Diamond Sword').points);
 assert.equal(matchAnswer(pack('dinosaur-genera'),'Mosasaurus'),null);assert.ok(matchAnswer(pack('fun-prehistoric'),'Mosasaurus'));
});
test('repeat practice draws exhaust the mixed pool before recycling and survive queue persistence',()=>{
 let queue=[],seen=[],rng=random(321);
 for(let i=0;i<Math.ceil(MIXED_PACKS.length/7)+3;i++){const draw=practiceDraw(JSON.parse(JSON.stringify(queue)),null,rng);assert.equal(draw.ids.length,7);assert.equal(new Set(draw.ids).size,7);seen.push(...draw.ids);queue=draw.remaining;}
 assert.equal(new Set(seen.slice(0,MIXED_PACKS.length)).size,MIXED_PACKS.length);
 const featured=practiceDraw([], 'lex-top-row-words',random(4));assert.equal(featured.ids[0],'lex-top-row-words');assert.ok(featured.ids.slice(1).every(id=>MIXED_PACKS.some(p=>p.id===id)));
});
