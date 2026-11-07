import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {LocalFocus,courtFocusKey,courtFocusEligible,courtAbsenceDue,focusExempt} from '../fair-play.js';
import {enforceCourtFocus} from '../court-focus.js';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame} from '../court-games-engine.js';
import {FIGURE_BY_ID} from '../court-games-data.js';
import {googleIdentity} from '../account-identity.js';
const players=()=>Array.from({length:4},(_,i)=>({id:'p'+i,name:'Counsel '+i,team:i%2,buddy:'krill',ready:true,online:true,connected:true}));
function fixture(mode){const s=createCourtGame(mode,players()),secret={};startCourtGame(s,1000,()=>.3,secret);return {s,secret,now:1000};}
function due(f){f.now=f.s.deadline;tickCourtGame(f.s,f.secret,f.now);}
const report=(s,leftAt,hidden=true)=>({game:s.matchId,question:courtFocusKey(s),hidden,leftAt,returnedAt:hidden?0:leftAt+1600});
test('Gavin exemption uses verified Google email claims, never profile names or admin roles',async()=>{
 for(const [email,verified,expected]of [['GAVIN@example.com',true,true],['logan@example.com',true,false],['gavin@example.com',false,false],['notgavin@example.com',true,true]]){
  const user={uid:'uid',email:'gavin@fake-profile.invalid',displayName:'Gavin',providerData:[{providerId:'google.com',uid:'google'}],getIdTokenResult:async()=>({claims:{email,email_verified:verified},signInProvider:'google.com',expirationTime:new Date(Date.now()+3600000).toISOString()})};
  const identity=await googleIdentity(user);assert.equal(identity.tabExempt,expected,email);assert.equal(focusExempt(identity),expected);if(expected)assert.notEqual(identity.role,'super_admin');
 }
});
test('Figure loses the current guess, once, with no reward when answers reveal',()=>{
 const f=fixture('figure');due(f);const {s,secret}=f;assert.equal(s.stage,'estimate');const left=s.stageAt+100,r=report(s,left);
 assert.equal(enforceCourtFocus(s,secret,{p0:r},left+1499),false);assert.equal(enforceCourtFocus(s,secret,{p0:r},left+1500),true);assert.equal(s.locked.p0,true);assert.equal(enforceCourtFocus(s,secret,{p0:r},left+3000),false);
 for(const p of s.players.slice(1))actCourtGame(s,secret,p.id,'estimate',{text:String(FIGURE_BY_ID.get(s.question.id).answer),matchId:s.matchId,round:s.round},left+1501);
 tickCourtGame(s,secret,left+1502);assert.equal(s.stage,'reveal');assert.equal(s.roundResult.rows.find(r=>r.id==='p0').points,0);
});
test('spectators, old questions, short returns and exempt accounts cannot be penalized',()=>{
 const f=fixture('figure');due(f);const {s,secret}=f,left=s.stageAt+100,r=report(s,left);
 assert.equal(courtAbsenceDue(s,'p0',{...r,game:'old'},left+2000),false);assert.equal(courtAbsenceDue(s,'p0',{...r,question:'old'},left+2000),false);assert.equal(courtAbsenceDue(s,'p0',{...r,hidden:false,returnedAt:left+200},left+2000),false);
 assert.equal(enforceCourtFocus(s,secret,{p0:r},left+2000,{p0:true}),false);s.players[0].spectator=true;assert.equal(courtFocusEligible(s,'p0'),false);assert.equal(enforceCourtFocus(s,secret,{p0:r},left+2000),false);
});
test('Clash deducts team points and consumes the active answer through normal rules',()=>{
 const f=fixture('clash');due(f);due(f);const {s,secret}=f;actCourtGame(s,secret,'p0','buzz',{stage:s.stage,stageAt:s.stageAt},f.now+1);assert.equal(s.stage,'faceAnswer');const left=f.now+100;
 assert.equal(enforceCourtFocus(s,secret,{p0:report(s,left)},left+1500),true);assert.equal(s.teamScores[0],-100);assert.equal(s.answerResult.uid,'p0');assert.equal(s.answerResult.found,false);assert.equal(s.tabSentences.length,1);
});
test('Docket automatically continues every Ready screen after five seconds',()=>{
 const f=fixture('docket'),{s,secret}=f;assert.equal(s.stage,'docketBriefing');assert.equal(tickCourtGame(s,secret,s.stageAt+4999),false);assert.equal(tickCourtGame(s,secret,s.stageAt+5000),true);assert.equal(s.stage,'docketBoardIntro');assert.equal(tickCourtGame(s,secret,s.stageAt+5000),true);assert.equal(s.stage,'docketBoard');
 s.stage='docketVerdict';s.stageAt=20000;s.deadline=30000;s.acknowledged={};assert.equal(tickCourtGame(s,secret,24999),false);assert.equal(tickCourtGame(s,secret,25000),true);assert.equal(s.stage,'docketBoard');
});
test('Docket forfeits the clue and subtracts its value without giving a second attempt',()=>{
 const f=fixture('docket');tickCourtGame(f.s,f.secret,6000);tickCourtGame(f.s,f.secret,11000);const {s,secret}=f;const cell=s.cells.find(c=>!secret.docket.doubles.includes(c.id));actCourtGame(s,secret,s.selector,'docket-select',{clueId:cell.id,matchId:s.matchId,round:s.round,stageAt:s.stageAt},12000);const left=12100;
 assert.equal(enforceCourtFocus(s,secret,{p0:report(s,left)},left+1500),true);assert.equal(s.players[0].score,-cell.value);assert.equal(s.attempts.p0,true);assert.equal(enforceCourtFocus(s,secret,{p0:report(s,left)},left+3000),false);
});
test('Oath forfeits the case and its vote, including a sealed bluff',()=>{
 const f=fixture('oath');due(f);due(f);const {s,secret}=f;actCourtGame(s,secret,'p0','oath-bluff',{text:'A plausible invention',matchId:s.matchId,round:s.round,stageAt:s.stageAt},f.now+1);const left=f.now+100;
 assert.equal(courtFocusEligible(s,'p0'),true);assert.equal(enforceCourtFocus(s,secret,{p0:report(s,left)},left+1500),true);assert.equal(secret.oath.forfeits.p0,true);assert.equal(s.voted.p0,true);assert.equal(s.locked.p0,true);assert.equal(secret.oath.submissions.p0,undefined);
});
test('local visibility uses grace, return checks and exemption, and ignores blur',()=>{
 const w=new Window(),d=w.document;let now=1000,key='question',exempt=false,hits=0;Object.defineProperty(d,'visibilityState',{value:'visible',configurable:true});const watcher=new LocalFocus({document:d,clock:()=>now,eligible:()=>key,exempt:()=>exempt,penalize:()=>hits++});watcher.sync();w.dispatchEvent(new w.Event('blur'));assert.equal(hits,0);
 const visibility=value=>{Object.defineProperty(d,'visibilityState',{value,configurable:true});d.dispatchEvent(new w.Event('visibilitychange'));};
 visibility('hidden');now=2000;visibility('visible');assert.equal(hits,0);visibility('hidden');now=3600;visibility('visible');assert.equal(hits,1);exempt=true;visibility('hidden');now=6000;visibility('visible');assert.equal(hits,1);watcher.destroy();
});
