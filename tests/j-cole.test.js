import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_BY_ID,MIXED_PACKS,PARTY_PACKS} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';
import {newParty,startParty,answerParty} from '../engine.js';
const specs=JSON.parse(readFileSync(new URL('../data-snapshots/authored/batches/40-j-cole-requested.json',import.meta.url))).questions;
test('exactly five deliberately requested Cole tasks enter the same balanced Daily/Puffer pool',()=>{
 assert.equal(specs.length,5);for(const q of specs){const p=PACK_BY_ID.get(q.id);assert.ok(MIXED_PACKS.includes(p)&&PARTY_PACKS.includes(p));assert.ok(p.answers.length>=20);for(const input of q.familiar)assert.equal(resolveAnswer(p,input).status,'exact',input);for(const input of q.exclude)assert.equal(resolveAnswer(p,input).status,'missing',input);}
 assert.equal(MIXED_PACKS.length,479);
});
test('all defining-album tracks include deluxe skits and every anniversary bonus, not just hit singles',()=>{
 const f=PACK_BY_ID.get('authored-j-cole-forest-hills-songs'),b=PACK_BY_ID.get('authored-j-cole-born-sinner-songs');assert.equal(f.answers.length,21);assert.equal(b.answers.length,21);
 for(const s of ['Home Soon','Die Together','Judgement Day','Winter Wonderland','Keep Heaven Dancing','Miles','Black Man in Hollywood','Obviously'])assert.equal(resolveAnswer(f,s).status,'exact',s);
 for(const s of ['Miss America','New York Times','Is She Gon Pop','Sparks Will Fly',"Where's Jermaine?",'Kerney Sermon'])assert.equal(resolveAnswer(b,s).status,'exact',s);
 assert.equal(resolveAnswer(b,'No Role Modelz').status,'missing');assert.equal(resolveAnswer(f,'Power Trip').status,'missing');
});
test('common public spellings and real stage names work without arbitrary initials',()=>{
 for(const[id,inputs]of [['songs',['No Role Models','Love Yours','Wet Dreams','GOMD','A Tale of Two Cities','7 Minute Drill','Stick','First Person Shooter']],['projects',['Cole World','Forest Hills Drive','Truly Yours II','The Fall Off']],['collaborators',['Jay Z','J.I.D.','Yasiin Bey','Young Jeezy','Curren$y','Currensy','Beyoncé','Jhené Aiko']]])for(const input of inputs)assert.equal(resolveAnswer(PACK_BY_ID.get('authored-j-cole-'+id),input).status,'exact',input);
 for(const s of ['NR','WM','JC','FK'])assert.equal(resolveAnswer(PACK_BY_ID.get('authored-j-cole-songs'),s).status,'missing');
});
test('Krillion picks are real published entries and not fabricated rarity statistics',()=>{
 for(const[key,input]of [['songs','Visionz of Home'],['projects','Forest Hills Drive Live'],['collaborators','Treasure Davis'],['forest-hills-songs','Keep Heaven Dancing'],['born-sinner-songs',"Where's Jermaine?"]]){const r=resolveAnswer(PACK_BY_ID.get('authored-j-cole-'+key),input);assert.equal(r.status,'exact');assert.equal(r.answer.points,100);}
});
test('Puffer awards a canonical song once and rejects unrelated releases',()=>{
 const s=newParty([{id:'a',name:'A'},{id:'b',name:'B'}],()=>0);s.packIds=['authored-j-cole-songs'];startParty(s,1000,()=>0);
 assert.ok(answerParty(s,'a','No Role Models',1100).answer);assert.match(answerParty(s,'b','No Role Modelz',1200).error,/Already/);assert.ok(answerParty(s,'b','Power Trip',1300).answer);assert.equal(s.used.length,2);assert.ok(answerParty(s,'a','HUMBLE.',1400).error);
});
