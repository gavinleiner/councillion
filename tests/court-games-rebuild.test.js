import test from 'node:test';
import assert from 'node:assert/strict';
import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame,CLASH_TIMING} from '../court-games-engine.js';
const players=()=>Array.from({length:6},(_,i)=>({id:'p'+i,name:'Counsel '+i,team:i%2,ready:true,connected:true,online:true}));
function game(){const s=createCourtGame('clash',players()),secret={};startCourtGame(s,1000);s.questionIds[0]='big-ears';return {s,secret};}
function read(f){const {s,secret}=f;for(const p of s.players)actCourtGame(s,secret,p.id,'briefing-ready',{},1001);tickCourtGame(s,secret,1002);tickCourtGame(s,secret,s.deadline);}
function buzz(f){read(f);const {s,secret}=f;tickCourtGame(s,secret,s.deadline);actCourtGame(s,secret,'p0','buzz',{},s.stageAt+1);}
test('a host cannot leave an unready connected friend out of a new match',()=>{
 const s=createCourtGame('clash',players());s.players[4].ready=false;assert.throws(()=>startCourtGame(s,1000),/ready/i);assert.equal(s.stage,'lobby');
});
test('new players get an automatic briefing and a shared three-second reveal before buzzing',()=>{
 const {s,secret}=game();assert.equal(s.stage,'briefing');assert.equal(s.deadline-s.stageAt,CLASH_TIMING.briefing);
 for(const p of s.players)actCourtGame(s,secret,p.id,'briefing-ready',{},1100);assert.equal(tickCourtGame(s,secret,s.deadline-1),false);tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'roundRead');const at=s.stageAt;
 assert.equal(s.board.prompt,'');assert.equal(s.deadline-at,3000);assert.throws(()=>actCourtGame(s,secret,'p2','read-ready',{},at+1),/countdown/);
 assert.equal(actCourtGame(s,secret,'p0','buzz',{stage:'roundRead',stageAt:at},at+1).early,true);
 for(const uid of s.faceoffPlayers)actCourtGame(s,secret,uid,'read-ready',{},at+1);assert.equal(tickCourtGame(s,secret,at+2999),false);assert.equal(s.stage,'roundRead');assert.equal(s.strikes,0);tickCourtGame(s,secret,at+3000);assert.equal(s.stage,'faceoff');assert.equal(s.deadline-s.stageAt,CLASH_TIMING.buzz);
});
test('a typo suggestion is private, leaves the board and clock untouched, and must be confirmed',()=>{
 const f=game();buzz(f);const {s,secret}=f,before=structuredClone(s),at=s.stageAt+100;
 const result=actCourtGame(s,secret,'p0','answer',{text:'Elephnat'},at);assert.equal(result.correction.label,'Elephant');assert.deepEqual(s,before);assert.ok(!JSON.stringify(s).includes('Elephnat'));
 assert.throws(()=>actCourtGame(s,secret,'p1','answer',{text:'Elephnat'},at),/another counsel/);assert.throws(()=>actCourtGame(s,secret,'p0','answer',{text:'Elephnat',confirmLabel:'Rabbit'},at),/no longer matches/);
 actCourtGame(s,secret,'p0','answer',{text:result.correction.text,confirmLabel:result.correction.label},at);assert.equal(s.stage,'survey');assert.equal(s.board.slots.some(q=>q.revealed),false);assert.equal(s.deadline-at,CLASH_TIMING.survey);
 tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'answerResult');assert.equal(s.board.slots[0].label,'Elephant');const holdUntil=s.deadline;assert.equal(s.resume.stage,'choice');assert.throws(()=>actCourtGame(s,secret,'p0','choice',{pass:false},holdUntil-1),/choice|choose|turn|Wait/i);
 tickCourtGame(s,secret,holdUntil);assert.equal(s.stage,'choice');assert.equal(s.deadline-holdUntil,CLASH_TIMING.choice);
});
test('an exact explicit alias submits immediately, while two random initials get no correction hint',()=>{
 let f=game();buzz(f);let r=actCourtGame(f.s,f.secret,'p0','answer',{text:'bunny'},f.s.stageAt+1);assert.equal(r.judging,true);assert.equal(f.s.stage,'survey');
 f=game();buzz(f);r=actCourtGame(f.s,f.secret,'p0','answer',{text:'zx'},f.s.stageAt+1);assert.equal(r.correction,undefined);assert.equal(f.s.stage,'survey');tickCourtGame(f.s,f.secret,f.s.deadline);assert.equal(f.s.answerResult.found,false);
});
