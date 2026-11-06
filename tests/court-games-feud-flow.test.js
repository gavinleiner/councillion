import test from 'node:test';
import assert from 'node:assert/strict';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame,CLASH_TIMING,clashSkipStatus} from '../court-games-engine.js';
import {CLASH_BOARDS,CLASH_BY_ID} from '../court-games-data.js';
import {feudAnswerPack,resolveFeudAnswer} from '../court-games-feud-matching.js';
import {normalize} from '../answer-matching.js';
import {CourtGameSession} from '../court-games-session.js';
import {resolveShowAnswer} from '../game-show-answer-matching.js';
import {resolveAnswer} from '../answer-matching.js';
import {random} from '../question-selection.js';

function court(n=6){const s=createCourtGame('clash',Array.from({length:n},(_,i)=>({id:'p'+i,name:'Counsel '+i,team:i%2,ready:true,online:true,connected:true}))),secret={};startCourtGame(s,1000,random(23),secret);return {s,secret,now:1000};}
function due(c){c.now=c.s.deadline;assert.ok(c.now);tickCourtGame(c.s,c.secret,c.now);}
function send(c,id,a,p={}){return actCourtGame(c.s,c.secret,id,a,{matchId:c.s.matchId,round:c.s.round,...p},++c.now);}
function open(c){while(['briefing','roundRead'].includes(c.s.stage))due(c);}
function say(c,id,text){let r=send(c,id,'answer',{text});if(r.correction)r=send(c,id,'answer',{text,confirmLabel:r.correction.label});if(c.s.stage==='survey')due(c);if(c.s.stage==='answerResult')due(c);return r;}
function fast(c){open(c);Object.assign(c.s,{stage:'roundResult',deadline:c.now+1,teamScores:[350,100]});due(c);assert.equal(c.s.stage,'fastIntro');due(c);assert.equal(c.s.stage,'fastReady');due(c);assert.equal(c.s.stage,'fastRead');due(c);assert.equal(c.s.stage,'fast');}

test('game-show shorthand accepts real short names and identifying initials without changing Puffer matching',()=>{
 const pack=label=>({answers:[{label,points:10,aliases:[]}]});
 for(const [label,text]of [['Minecraft','MC'],['Harry Potter','HP'],['North Carolina','NC'],['National Aeronautics and Space Administration','NASA'],['Albert Einstein','A Einstein'],['World War II','WW2']])assert.equal(resolveShowAnswer(pack(label),text).answer?.label,label,text);
 const words={answers:[{label:'Albert Einstein',points:10,aliases:[]}]};assert.equal(resolveShowAnswer(words,'Albert Einstine').status,'matched');
 for(const text of ['zz','zzzz','locals coffee','brown coffee','white coffee'])assert.equal(resolveShowAnswer(pack('Black coffee'),text).status,'missing',text);
 assert.equal(resolveShowAnswer(pack('World War II'),'WWI').status,'missing');assert.equal(resolveShowAnswer(pack('Black coffee'),'BC').status,'exact');
 assert.equal(resolveShowAnswer({answers:[{label:'Black coffee',points:30,aliases:[]},{label:'Blue cheese',points:20,aliases:[]}]},'BC').status,'missing','shared initials need a less ambiguous answer');
 assert.equal(resolveAnswer(pack('Minecraft'),'MC').status,'missing','the shared Puffer matcher still rejects generated abbreviations');
});

test('the shared 3–2–1 has no Ready gate, reveals no prompt, and rejects queued early buzzes',()=>{
 const c=court(),{s}=c;assert.equal(s.deadline-s.stageAt,CLASH_TIMING.briefing);
 const end=s.deadline;for(const p of s.players)send(c,p.id,'briefing-ready');assert.equal(s.deadline,end);assert.equal(s.stage,'briefing');due(c);
 assert.equal(s.stage,'roundRead');assert.equal(s.board.prompt,'');assert.equal(s.deadline-s.stageAt,3000);
 const early={stage:s.stage,stageAt:s.stageAt};for(let i=0;i<30;i++)assert.equal(send(c,'p0','buzz',early).early,true);
 send(c,'p0','read-ready');assert.equal(s.stage,'roundRead');due(c);assert.equal(s.stage,'faceoff');assert.equal(s.board.prompt,CLASH_BY_ID.get(s.board.id).prompt);
 assert.equal(send(c,'p0','buzz',early).early,true,'an old countdown click cannot win after reveal');
 const opened={stage:s.stage,stageAt:s.stageAt};assert.equal(send(c,'p1','buzz',opened).accepted,true);assert.equal(s.faceoffTurn,'p1');
 assert.equal(send(c,'p0','buzz').lostBuzz,true);assert.equal(s.faceoffTurn,'p1');
});

test('recognition aliases preserve every original survey slot and have no within-board collisions',()=>{
 let additional=0;
 for(const q of CLASH_BOARDS){const pack=feudAnswerPack(q),owners=new Map();assert.deepEqual(pack.answers.map(a=>[a.label,a.points]),q.answers.map(a=>[a.label,a.points]));
  for(const a of pack.answers)for(const text of [a.label,...a.aliases]){const key=normalize(text);assert.ok(!owners.has(key)||owners.get(key)===a.label,q.id+': '+text);owners.set(key,a.label);assert.equal(resolveFeudAnswer(q,text).answer?.label,a.label,q.id+': '+text);}
  additional+=pack.answers.reduce((n,a,i)=>n+a.aliases.length-q.answers[i].aliases.length,0);
 }
 assert.ok(additional>400,'substantial equivalent wording across the existing boards');
});

test('graveyard counts for cemetery; a typo asks after submission and unrelated words stay rejected',()=>{
 const q=CLASH_BY_ID.get('survey-17-5-55');assert.equal(resolveFeudAnswer(q,'graveyard').status,'exact');assert.equal(resolveFeudAnswer(q,'burial ground').answer.label,'Mortuary / Cemetery');
 assert.equal(resolveFeudAnswer(q,'cemetary').status,'matched');assert.equal(resolveFeudAnswer(q,'graveyad').status,'matched');
 assert.equal(resolveFeudAnswer(q,'library').status,'missing');
 const q2={answers:[{label:'Black coffee',points:20,aliases:[]}]};assert.equal(resolveFeudAnswer(q2,'locals coffee').status,'missing');
 const conflict={answers:[{label:'Couch',points:30,aliases:[]},{label:'Sofa',points:20,aliases:[]}]};assert.equal(resolveFeudAnswer(conflict,'settee').status,'missing','a synonym cannot pick a different scored bucket arbitrarily');
});

test('normal response corrections preserve the turn, require confirmation, and then score exactly once',()=>{
 const c=court();open(c);const {s}=c,q=CLASH_BY_ID.get('big-ears');s.board={id:q.id,prompt:q.prompt,slots:q.answers.map((_,index)=>({index,revealed:false}))};send(c,'p0','buzz');
 const deadline=s.deadline,r=send(c,'p0','answer',{text:'Elephnat'});assert.equal(r.correction.label,'Elephant');assert.equal(s.stage,'faceAnswer');assert.equal(s.deadline,deadline);assert.equal(s.pot,0);
 assert.throws(()=>send(c,'p0','answer',{text:'Elephnat',confirmLabel:'Mouse'}),/no longer/);
 send(c,'p0','answer',{text:'Elephnat',confirmLabel:'Elephant'});assert.equal(s.stage,'survey');due(c);assert.equal(s.pot,46);assert.equal(s.answerResult.found,true);assert.ok(s.answerResult.id);assert.equal(s.stage,'answerResult');
 const pot=s.pot;assert.equal(tickCourtGame(s,c.secret,c.now),false);assert.equal(s.pot,pot);due(c);assert.equal(s.stage,'choice');
});

test('two-thirds voting is idempotent, board-scoped, excludes spectators and awards no bank',()=>{
 for(const n of [2,3,4,5,6,8,10]){const c=court(n);open(c);const {s}=c,old=s.board.id,required=Math.ceil(n*2/3);s.pot=91;
  assert.equal(clashSkipStatus(s).required,required);
  send(c,'p0','skip-board',{boardId:old});send(c,'p0','skip-board',{boardId:old});assert.equal(clashSkipStatus(s).votes,1);
  for(let i=1;i<required-1;i++)send(c,'p'+i,'skip-board',{boardId:old});assert.notEqual(s.stage,'roundResult');
  send(c,'p'+(required-1),'skip-board',{boardId:old});assert.equal(s.stage,'roundResult');assert.equal(s.roundResult.skipped,true);assert.deepEqual(s.teamScores,[0,0]);assert.equal(s.history[0].pot,0);
  due(c);assert.equal(s.stage,'roundRead');assert.equal(s.multiplier,1,'skips do not consume a scoring round');assert.notEqual(s.board.id,old);due(c);assert.equal(clashSkipStatus(s).votes,0);
  assert.throws(()=>send(c,'p0','skip-board',{boardId:old}),/earlier board/);s.players.push({id:'watcher',spectator:true,connected:true,online:true});assert.throws(()=>send(c,'watcher','skip-board',{boardId:s.board.id}),/Only players/);
 }
});

test('both Fast Money runs start automatically and have thirty actual answer seconds',()=>{
 const c=court();fast(c);const {s}=c;assert.equal(s.deadline-s.stageAt,30000);const first=s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[1].label);
 send(c,s.turn,'fast',{values:first,pass:0});assert.equal(s.stage,'fastFirstReview');due(c);assert.equal(s.stage,'fastReady');due(c);assert.equal(s.stage,'fastRead');due(c);assert.equal(s.stage,'fast');assert.equal(s.fastPass,1);assert.equal(s.deadline-s.stageAt,30000);
 const duplicate=send(c,s.turn,'fast-draft',{values:first,checkIndex:0,pass:1,cursor:0});assert.deepEqual(duplicate.retry,[0]);
});

test('Fast Money typo correction is private, Enter confirmation saves canonical wording, and timeout cannot approve it',()=>{
 const c=court();fast(c);const {s,secret}=c;s.fastIds[0]='big-ears';const values=['Elephnat','','','',''],r=send(c,s.turn,'fast-draft',{values,checkIndex:0,pass:0,cursor:0});
 assert.equal(r.correction.label,'Elephant');assert.equal(s.stage,'fast');assert.ok(!JSON.stringify(s).includes('Elephnat'));assert.equal(secret.fastDraft?.[s.turn],undefined);
 const confirmed=send(c,s.turn,'fast-draft',{values,checkIndex:0,confirmLabel:'Elephant',pass:0,cursor:0});assert.equal(confirmed.value,'Elephant');assert.equal(secret.fastDraft[s.turn].values[0],'Elephant');
 const bypass=send(c,s.turn,'fast',{values,pass:0});assert.deepEqual(bypass.retry,[0]);assert.equal(s.stage,'fast');
 due(c);assert.equal(secret.fast[s.fastPlayers[0]][0].label,'Elephant');assert.equal(secret.fast[s.fastPlayers[0]][0].points,46);
});

test('Enter waits for an in-flight background save, cancels queued autosaves, and preserves turn identity',async()=>{
 const c=court();fast(c);const session=new CourtGameSession({mode:'clash'}),writes=[];clearInterval(session.timer);
 Object.assign(session,{connected:true,state:c.s,uid:c.s.turn,code:'TEST',pending:true,pendingId:'old',render(){},path:x=>x,c:{set:async(path,value)=>writes.push({path,value})}});
 session.queuedDraft={values:['old','','','',''],pass:0};session.draftRetry=setTimeout(()=>assert.fail('a submission did not cancel its queued autosave'),10000);
 const release=setTimeout(()=>{session.pending=false;session.pendingId=null;},40);
 try{await session.request('fast-draft',{values:['new','','','',''],pass:0,checkIndex:0,cursor:0});assert.equal(writes.length,1);assert.equal(writes[0].value.patch.checkIndex,0);assert.equal(writes[0].value.patch.values[0],'new');assert.equal(session.queuedDraft,null);assert.equal(session.pendingId,writes[0].value.id);}finally{clearTimeout(release);session.closed=true;clearTimeout(session.draftRetry);}
});

test('background saves do not rewrite public state or the directory and still isolate runner two',async()=>{
 const c=court();fast(c);const session=new CourtGameSession({mode:'clash'});clearInterval(session.timer);let written,published=false;
 const runner=c.s.turn,quiet=c.s.fastPlayers[1];c.secret.fastDraft={[runner]:{pass:0,cursor:0,values:['private text','','','','']}};
 Object.assign(session,{host:true,state:c.s,secret:c.secret,meta:{isPrivate:true},members:{[runner]:{},[quiet]:{},watcher:{}},c:{update:async(path,changes)=>written=changes},path:()=>'',render(){},publish:async()=>published=true});
 try{await session.broadcast({['responses/'+runner+'/ack']:{id:'save'}},false);assert.ok(!('state' in written));assert.ok(!('meta/phase' in written));assert.equal(published,false);assert.equal(written['responses/'+quiet+'/liveAnswer'],null);assert.equal(written['responses/watcher/liveAnswer'].text,'private text');assert.ok(!JSON.stringify(written['responses/watcher/liveAnswer']).includes('values'));}finally{session.closed=true;}
});

test('a late background autosave is harmless and cannot overwrite a sealed Fast Money result',()=>{
 const c=court();fast(c);const values=c.s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[1].label),runner=c.s.turn;
 send(c,runner,'fast',{values,pass:0});const saved=JSON.stringify(c.secret.fast[runner]);assert.equal(c.s.stage,'fastFirstReview');
 assert.equal(send(c,runner,'fast-draft',{values:['late','','','',''],pass:0}).ignored,true);assert.equal(JSON.stringify(c.secret.fast[runner]),saved);
 assert.throws(()=>send(c,runner,'fast-draft',{values,checkIndex:0,pass:0}),/earlier/,'an actual checked submission is not falsely acknowledged');
});
