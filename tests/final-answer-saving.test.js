import test from 'node:test';
import assert from 'node:assert/strict';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame} from '../court-games-engine.js';
import {fastScene} from '../court-games-fast.js';
const crew=()=>Array.from({length:4},(_,i)=>({id:'p'+i,name:'Counsel '+i,team:i%2,ready:true,online:true,connected:true}));
function fast(){const s=createCourtGame('clash',crew()),secret={};startCourtGame(s,1000,()=>.3,secret);for(let i=0;i<2;i++)tickCourtGame(s,secret,s.deadline);Object.assign(s,{stage:'roundResult',deadline:s.stageAt+100,teamScores:[350,100]});for(let i=0;i<5&&s.stage!=='fast';i++)tickCourtGame(s,secret,s.deadline);s.fastIds[0]='big-ears';return {s,secret};}
function final(){const s=createCourtGame('docket',crew()),secret={};startCourtGame(s,1000,()=>.3,secret);Object.assign(s,{stage:'docketFinalAnswer',round:2,stageAt:2000,deadline:32000,eligible:['p0','p1'],locked:{},clue:{id:'gaming-final'}});Object.assign(secret.docket,{finalId:'gaming-final',wagers:{p0:100,p1:100},answers:{},drafts:{}});return {s,secret};}
function act(f,id,action,payload={},now=2100){return actCourtGame(f.s,f.secret,id,action,{matchId:f.s.matchId,round:f.s.round,stageAt:f.s.stageAt,...payload},now);}
test('Fast Money saves the latest Enter text before proposing spelling, without auto-approving it at timeout',()=>{
 const f=fast(),id=f.s.turn,values=['Elephnat','','','',''];
 const r=act(f,id,'fast-draft',{values,pass:0,cursor:0,checkIndex:0},f.s.stageAt+100);
 assert.equal(r.correction.label,'Elephant');assert.equal(r.saved,true);assert.equal(f.secret.fastDraft[id].values[0],'Elephnat');assert.ok(!JSON.stringify(f.s).includes('Elephnat'));
 tickCourtGame(f.s,f.secret,f.s.deadline);assert.equal(f.secret.fast[id][0].input,'Elephnat');assert.equal(f.secret.fast[id][0].points,0);
});
test('the Fast Money reveal keeps a non-scoring typed answer instead of displaying a missing response',()=>{
 const s={stage:'fastReview',fastPass:0,fastTarget:100,matchId:'m',fast:{rows:[{prompt:'Name something.',answers:[{label:'',text:'My actual guess',points:0}]}]}};
 assert.match(fastScene(s,'p0',{}),/My actual guess/);assert.ok(!fastScene(s,'p0',{}).includes('No response'));
});
test('Docket final drafts remain private and bank at timeout without requiring another click',()=>{
 const f=final();assert.equal(act(f,'p0','docket-final-draft',{text:'Who is Samus Aran?'}).saved,true);assert.equal(f.s.locked.p0,undefined);assert.ok(!JSON.stringify(f.s).includes('Samus'));
 tickCourtGame(f.s,f.secret,f.s.deadline);assert.equal(f.secret.docket.answers.p0,'Who is Samus Aran?');tickCourtGame(f.s,f.secret,f.s.deadline);
 assert.equal(f.s.finalRows[0].text,'Who is Samus Aran?');assert.equal(f.s.finalRows[0].correct,true);
});
test('a saved final typo stays visible but needs confirmation to score; unsealed drafts cannot overwrite sealed answers',()=>{
 const f=final();act(f,'p0','docket-final-draft',{text:'Who is Samus Arna?'});act(f,'p1','docket-answer',{text:'Who is Samus Aran?'});
 assert.equal(act(f,'p1','docket-final-draft',{text:'replacement'}).ignored,true);
 tickCourtGame(f.s,f.secret,f.s.deadline);for(let i=0;i<2;i++)tickCourtGame(f.s,f.secret,f.s.deadline);
 const rows=f.s.finalRows;assert.equal(rows.find(r=>r.id==='p0').text,'Who is Samus Arna?');assert.equal(rows.find(r=>r.id==='p0').correct,false);assert.equal(rows.find(r=>r.id==='p1').correct,true);
});
