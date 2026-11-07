import test from 'node:test';
import assert from 'node:assert/strict';
import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame} from '../court-games-engine.js';
import {oathReceipt} from '../oath-engine.js';
import {OATH_BY_ID} from '../oath-data.js';
import {CourtGameSession} from '../court-games-session.js';
function fixture(){const s=createCourtGame('oath',[{id:'a',name:'One',ready:true,online:true,connected:true},{id:'b',name:'Two',ready:true,online:true,connected:true}]),secret={};startCourtGame(s,1000,()=>.3,secret);tickCourtGame(s,secret,s.deadline);tickCourtGame(s,secret,s.deadline);return {s,secret};}
const act=(f,id,action,p={})=>actCourtGame(f.s,f.secret,id,action,{matchId:f.s.matchId,round:f.s.round,stageAt:f.s.stageAt,...p},f.s.stageAt+10);
test('private drafts do not reveal truth recognition or authors, and timeout submits the last valid draft',()=>{
 const f=fixture();assert.deepEqual(act(f,'a','oath-draft',{text:'An unusually convincing fake'}),{saved:true});assert.equal(f.s.locked.a,undefined);assert.ok(!JSON.stringify(f.s).includes('convincing'));assert.equal(oathReceipt(f.s,f.secret,'a').draft,'An unusually convincing fake');assert.equal(oathReceipt(f.s,f.secret,'b').draft,'');
 tickCourtGame(f.s,f.secret,f.s.deadline);assert.equal(f.s.stage,'oath-shuffle');assert.equal(f.secret.oath.submissions.a.text,'An unusually convincing fake');assert.ok(f.secret.oath.options.some(o=>o.text==='An unusually convincing fake'&&o.authors.includes('a')));
});
test('clearing a draft or replacing it with rejected text cannot submit an older answer',()=>{
 for(const replacement of ['', 'f4ggot']){const f=fixture();act(f,'a','oath-draft',{text:'Old private draft'});try{act(f,'a','oath-draft',{text:replacement});}catch{}tickCourtGame(f.s,f.secret,f.s.deadline);assert.equal(f.secret.oath.submissions.a,undefined);assert.equal(f.s.choices.length,0);assert.equal(f.secret.oath.options.length,4);}
});
test('a drafted true answer is not confirmed early and earns the correct doubled final reward',()=>{
 const f=fixture();f.s.round=6;const q=OATH_BY_ID.get(f.s.case.id);assert.deepEqual(act(f,'a','oath-draft',{text:q.aliases[0]??q.answer}),{saved:true});assert.equal(oathReceipt(f.s,f.secret,'a').knows,false);tickCourtGame(f.s,f.secret,f.s.deadline);tickCourtGame(f.s,f.secret,f.s.deadline);assert.equal(f.s.voted.a,true);assert.equal(oathReceipt(f.s,f.secret,'a').knows,true);
 tickCourtGame(f.s,f.secret,f.s.deadline);while(f.s.stage==='oath-reveal')tickCourtGame(f.s,f.secret,f.s.deadline);assert.equal(f.s.players.find(p=>p.id==='a').score,2000);
});
test('late autosaves cannot overwrite a sealed submission or cross to a new case',()=>{
 const f=fixture();act(f,'a','oath-bluff',{text:'Sealed fake'});assert.equal(act(f,'a','oath-draft',{text:'Late draft'}).ignored,true);assert.equal(f.secret.oath.submissions.a.text,'Sealed fake');assert.equal(act(f,'b','oath-draft',{text:'Old case',round:999}).ignored,true);assert.equal(f.secret.oath.drafts.b,undefined);
});
test('Enter waits for a background draft and repeated presses produce only one seal request',async()=>{
 const {s}=fixture(),writes=[],session=new CourtGameSession({mode:'oath',identity:()=>({role:'super_admin',expires:Date.now()/1000+3600})});clearInterval(session.timer);Object.assign(session,{connected:true,state:s,uid:'a',code:'TEST',pending:true,pendingAction:'oath-draft',render(){},path:p=>p,c:{set:async(p,v)=>writes.push(v)}});
 const release=setTimeout(()=>{session.pending=false;},40);try{await Promise.all([session.request('oath-bluff',{text:'Keep this answer',stageAt:s.stageAt}),session.request('oath-bluff',{text:'Keep this answer',stageAt:s.stageAt})]);assert.equal(writes.length,1);assert.equal(writes[0].text,'Keep this answer');assert.equal(writes[0].patch.action,'oath-bluff');}finally{clearTimeout(release);session.closed=true;session.focus.destroy();}
});
