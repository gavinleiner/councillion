import test from 'node:test';
import assert from 'node:assert/strict';
import {PACKS,PLAY_PACKS} from '../data.js';
import {EXPANDED_PACKS} from '../expanded-banks.js';
import {dailyPacks,DAILY_FAMILIES,matchAnswer} from '../engine.js';
const find=id=>PACKS.find(p=>p.id===id);
test('daily rotation covers seven subjects, never repeats an adjacent day, and preserves legacy saves',()=>{
 let previous=[];for(let n=0;n<730;n++){
  const date=new Date(Date.UTC(2026,0,1+n)).toISOString().slice(0,10),packs=dailyPacks(date);
  assert.deepEqual(packs.map(p=>p.family).sort(),[...DAILY_FAMILIES].sort());
  assert.ok(packs.every(p=>p.dailyEligible&&!previous.includes(p.id)),date);
  previous=packs.map(p=>p.id);
 }
 assert.ok(find('us-states'));assert.ok(!PLAY_PACKS.includes(find('us-states')));
});
test('large banks count canonical entries, retain short natural banks, and do not count aliases as answers',()=>{
 assert.equal(find('word-vowels').answers.length,2450);assert.equal(find('cultured-dairy').answers.length,1940);
 assert.equal(find('first-thousand-minor-planets').answers.length,1000);assert.equal(find('two-letter-elements').answers.length,104);
 assert.equal(find('arctic-rivers').answers.length,32);assert.ok(EXPANDED_PACKS.every(p=>p.source&&p.ranking));
});
test('every spelling challenge satisfies its actual letter rule',()=>{
 for(const a of find('word-isograms').answers){assert.equal(a.label.length,10);assert.equal(new Set(a.label).size,10);}
 for(const a of find('word-vowels').answers)assert.match(a.label,/[aeiou]{3}/);
});
test('question boundaries and common alternate names work without giving away numeric asteroid answers',()=>{
 assert.equal(matchAnswer(find('dinosaur-genera'),'T rex')?.label,'Tyrannosaurus');
 assert.equal(matchAnswer(find('dinosaur-genera'),'Pteranodon'),null);assert.equal(matchAnswer(find('dinosaur-genera'),'Mosasaurus'),null);
 assert.equal(matchAnswer(find('two-letter-elements'),'Fe')?.label,'Iron');assert.equal(matchAnswer(find('two-letter-elements'),'O'),null);
 assert.equal(matchAnswer(find('first-thousand-minor-planets'),'1 Ceres')?.label,'Ceres');assert.equal(matchAnswer(find('first-thousand-minor-planets'),'1'),null);
 assert.equal(matchAnswer(find('atlantic-rivers'),'Amazon River')?.label,'Amazon');assert.equal(matchAnswer(find('arctic-rivers'),'Amazon'),null);
});
