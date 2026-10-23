import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {dailyPacks,isSharedDailyRun} from '../engine.js';

test('Daily has the same seven ordered prompts across player time zones and reset boundaries',()=>{
 const instants=['2026-10-23T03:59:59Z','2026-10-23T04:00:00Z','2026-11-02T04:59:59Z','2026-11-02T05:00:00Z'];
 const source=`import {dateKey,dailyPacks} from './engine.js';Math.random=()=>{throw Error('Daily must not use player randomness');};console.log(JSON.stringify(${JSON.stringify(instants)}.map(instant=>{const day=dateKey(new Date(instant));return {day,ids:dailyPacks(day).map(p=>p.id)};})));`;
 let shared;
 for(const zone of ['UTC','America/Los_Angeles','Asia/Tokyo','Pacific/Kiritimati']){
  const child=spawnSync(process.execPath,['--input-type=module','-e',source],{cwd:new URL('../',import.meta.url),env:{...process.env,TZ:zone},encoding:'utf8'});
  assert.equal(child.status,0,child.stderr);const result=JSON.parse(child.stdout);
  assert.deepEqual(result.map(r=>r.day),['2026-10-22','2026-10-23','2026-11-01','2026-11-02']);
  for(const r of result){assert.equal(r.ids.length,7);assert.equal(new Set(r.ids).size,7);}
  if(shared)assert.deepEqual(result,shared,zone);else shared=result;
 }
});

test('saved Daily progress only resumes on the shared date and exact question order',()=>{
 const day='2026-10-23',ids=dailyPacks(day).map(p=>p.id),run={mode:'daily',day,ids,round:3,stage:'answer',results:[{points:30}]};
 assert.equal(isSharedDailyRun(run,day),true);assert.equal(isSharedDailyRun({...run,stage:'done'},day),true);
 for(const invalid of [null,{...run,mode:'practice'},{...run,day:'2026-10-22'},{...run,ids:[...ids].reverse()},{...run,ids:ids.slice(1)},{...run,ids:[ids[1],...ids.slice(1)]},{...run,ids:dailyPacks('2026-10-24').map(p=>p.id)}])assert.equal(isSharedDailyRun(invalid,day),false);
 assert.equal(run.round,3);assert.equal(run.results[0].points,30);
});
