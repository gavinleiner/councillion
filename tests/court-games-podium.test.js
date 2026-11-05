import test from 'node:test';
import assert from 'node:assert/strict';
import {courtBenchSeats,courtStageGeometry} from '../court-games-stage-layout.js';
test('both benches have five permanent places, with the representative nearest the face-off',()=>{
 const players=Array.from({length:10},(_,i)=>({id:'p'+i,team:i%2}));
 assert.deepEqual(courtBenchSeats(players,0).map(s=>s.player?.id),['p8','p6','p4','p2','p0']);
 assert.deepEqual(courtBenchSeats(players,1).map(s=>s.player?.id),['p1','p3','p5','p7','p9']);
 const before=courtBenchSeats(players.slice(0,4),0),after=courtBenchSeats(players.slice(0,6),0);
 assert.equal(before.find(s=>s.player?.id==='p0').place,after.find(s=>s.player?.id==='p0').place);
 assert.equal(courtBenchSeats([...players,{id:'watcher',team:0,spectator:true}],0).filter(s=>s.player).length,5);
});
test('podium foreground and characters follow the same cover-fit image at laptop aspect ratios',()=>{
 for(const [w,h]of [[1366,650],[1280,600],[1024,600],[1920,1080]]){
  const g=courtStageGeometry(w,h);assert.ok(1672*g.scale>=w&&941*g.scale>=h);
  assert.ok(Math.abs(g.x*2+1672*g.scale-w)<1e-6);assert.ok(Math.abs(g.y*2+941*g.scale-h)<1e-6);
  assert.equal(g.fronts.length,2);assert.ok(g.tableY>h*.4&&g.tableY<h*.7);
  assert.ok(g.fronts[0][0][0]<w*.01&&g.fronts[1][1][0]>w*.99);
 }
});
