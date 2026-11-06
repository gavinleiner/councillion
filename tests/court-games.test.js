import test from 'node:test';
import {figureRevealMarkup} from '../court-games-view.js';
import assert from 'node:assert/strict';
import {CLASH_BOARDS,FIGURE_QUESTIONS,CLASH_BY_ID,FIGURE_BY_ID} from '../court-games-data.js';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame,parseEstimate,accuracyScore,canCourtHuddle} from '../court-games-engine.js';
import {random} from '../question-selection.js';
import {matchAnswer,normalize} from '../answer-matching.js';
const players=()=>Array.from({length:6},(_,i)=>({id:'p'+i,name:'Player '+i,team:i%2,ready:true,connected:true,buddy:i%2?'squid':'krill'}));
const enterFirstBoard=(s,secret)=>{while(['briefing','intro','roundRead'].includes(s.stage))tickCourtGame(s,secret,s.deadline);};
const game=(variant='clash')=>{const s=createCourtGame(variant,players()),secret={estimates:{},fast:{}};startCourtGame(s,1000,random(42));enterFirstBoard(s,secret);return {s,secret};};
const answer=(s,secret,uid,text,now=5000)=>{const r=actCourtGame(s,secret,uid,'answer',{text},now);if(s.stage==='survey')tickCourtGame(s,secret,s.deadline);if(s.stage==='answerResult')tickCourtGame(s,secret,s.deadline);return r;};
const fastReady=(s,secret)=>{if(s.stage==='fastReady')tickCourtGame(s,secret,s.deadline);if(s.stage==='fastRead')tickCourtGame(s,secret,s.deadline);};
test('200 sourced aired boards preserve complete displayed categories, published scores and unambiguous aliases',()=>{
 assert.equal(CLASH_BOARDS.length,200);assert.equal(new Set(CLASH_BOARDS.map(q=>q.id)).size,200);assert.equal(new Set(CLASH_BOARDS.map(q=>q.source)).size,40);
 for(const q of CLASH_BOARDS){assert.match(q.basis,/Scores preserved/);assert.ok(q.answers.length>=5&&q.answers.length<=8);assert.ok(q.answers.reduce((n,a)=>n+a.points,0)<=100);assert.equal(new URL(q.source).hostname,'mstiescott.neocities.org');assert.ok(q.season>=16&&q.season<=25);const aliases=new Map();for(const [i,a]of q.answers.entries()){assert.ok(Number.isInteger(a.points)&&a.points>0);if(i)assert.ok(q.answers[i-1].points>=a.points);for(const text of [a.label,...a.aliases]){const norm=normalize(text);assert.ok(!aliases.has(norm)||aliases.get(norm)===a.label,q.id+': '+text);aliases.set(norm,a.label);assert.equal(matchAnswer(q,text)?.label,a.label,q.id+': '+text);}}}
});
test('1001 individually sourced numerical questions have balanced subjects and clear units',()=>{
 assert.equal(FIGURE_QUESTIONS.length,1001);assert.equal(new Set(FIGURE_QUESTIONS.map(q=>q.id)).size,1001);const cats=Object.groupBy(FIGURE_QUESTIONS,q=>q.category);assert.equal(Object.keys(cats).length,7);for(const rows of Object.values(cats))assert.ok(rows.length>=90&&rows.length/FIGURE_QUESTIONS.length<.22);
 for(const q of FIGURE_QUESTIONS){assert.ok(Number.isFinite(q.answer)&&q.answer>=0&&q.answer<=1e15);assert.ok(q.unit&&q.explanation&&q.sourceTitle&&q.prompt);assert.equal(new URL(q.source).protocol,'https:');assert.ok(['2026-11-04','2026-11-05'].includes(q.checked));}
});
test('default team match supports six players, locks roster, rotates face-off players and never reuses a board',()=>{
 const {s,secret}=game();assert.equal(s.settings.maxPlayers,10);assert.equal(s.players.filter(p=>!p.spectator).length,6);assert.equal(s.stage,'faceoff');assert.deepEqual(s.faceoffPlayers,['p0','p1']);
 const ids=new Set(s.questionIds);assert.equal(ids.size,200);s.history=[{id:s.board.id}];s.stage='roundResult';s.phase='burst';s.deadline=6000;s.teamScores=[50,0];tickCourtGame(s,secret,6000);assert.equal(s.round,2);assert.deepEqual(s.faceoffPlayers,['p2','p3']);assert.ok(ids.has(s.board.id));assert.notEqual(s.board.id,s.history[0].id);
});
test('highest face-off answer earns play/pass, with a real chance for the other representative',()=>{
 const {s,secret}=game(),q=CLASH_BY_ID.get(s.board.id);actCourtGame(s,secret,'p0','buzz',{},5000);assert.equal(actCourtGame(s,secret,'p1','buzz',{},5100).lostBuzz,true);
 answer(s,secret,'p0',q.answers[2].label,5200);assert.equal(s.stage,'faceAnswer');assert.equal(s.faceoffTurn,'p1');answer(s,secret,'p1',q.answers[1].label,5300);assert.equal(s.stage,'choice');assert.equal(s.choicePlayer,'p1');
 assert.throws(()=>actCourtGame(s,secret,'p0','choice',{pass:false},5400),/chooses/);actCourtGame(s,secret,'p1','choice',{pass:true},5500);assert.equal(s.stage,'control');assert.equal(s.controlTeam,0);assert.equal(s.turn,'p2');
});
test('a top face-off answer wins immediately; teammates rotate and a third strike opens one steal',()=>{
 const {s,secret}=game(),q=CLASH_BY_ID.get(s.board.id);actCourtGame(s,secret,'p0','buzz',{},5000);answer(s,secret,'p0',q.answers[0].label,5100);assert.equal(s.stage,'choice');actCourtGame(s,secret,'p0','choice',{pass:false},5200);assert.equal(s.turn,'p2');
 answer(s,secret,s.turn,'not on the board',5300);assert.equal(s.strikes,1);assert.equal(s.turn,'p4');answer(s,secret,s.turn,q.answers[0].label,5400);assert.equal(s.strikes,1);assert.equal(s.turn,'p4');answer(s,secret,s.turn,'another miss',5450);assert.equal(s.strikes,2);assert.equal(s.turn,'p0');answer(s,secret,s.turn,'still not on the board',5500);assert.equal(s.stage,'steal');assert.equal(s.turn,'p1');
 const bank=s.pot;answer(s,secret,'p1',q.answers[1].label,5600);assert.equal(s.stage,'roundResult');assert.equal(s.teamScores[1],bank);assert.equal(s.teamScores[0],0);assert.equal(s.roundResult.steal,true);assert.equal(s.event.type,'steal-win');
});
test('a failed steal awards the bank to the controlling bench',()=>{
 const {s,secret}=game();s.controlTeam=0;s.stealTeam=1;s.stage='steal';s.turn='p1';s.pot=75;s.deadline=10000;answer(s,secret,'p1','not an answer');assert.deepEqual(s.teamScores,[75,0]);assert.equal(s.roundResult.steal,false);
});
test('timeouts create one strike and cannot accidentally run multiple turns at the same timestamp',()=>{
 const {s,secret}=game();s.stage='control';s.controlTeam=0;s.turn='p0';s.deadline=5000;assert.equal(tickCourtGame(s,secret,5000),true);assert.equal(s.strikes,1);assert.equal(s.turn,'p2');assert.equal(tickCourtGame(s,secret,5000),false);assert.equal(s.strikes,1);
});
test('a whole team leaving ends the match rather than stranding a turn',()=>{
 const {s,secret}=game();s.players.filter(p=>p.team===0).forEach(p=>p.connected=false);tickCourtGame(s,secret,5000);assert.equal(s.stage,'finish');assert.equal(s.result.team,1);
});
test('Fast Money uses two distinct teammates, hides first answers and gives duplicates a retry',()=>{
 const {s,secret}=game();s.stage='roundResult';s.deadline=5000;s.teamScores=[350,100];s.round=4;tickCourtGame(s,secret,5000);assert.equal(s.stage,'fastIntro');
 actCourtGame(s,secret,'p0','runner',{player:'p0'},5100);actCourtGame(s,secret,'p0','runner',{player:'p2'},5200);actCourtGame(s,secret,'p0','fast-start',{},5300);assert.equal(s.stage,'fastReady');fastReady(s,secret);assert.equal(s.fastTarget,200);assert.equal(s.fastPlayers.length,2);assert.equal(s.deadline-s.stageAt,30000);
 const first=s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[1].label);const r=actCourtGame(s,secret,'p0','fast',{values:first,pass:0,matchId:s.matchId},5400);assert.equal(r.accepted,true);assert.equal(s.stage,'fastFirstReview');assert.equal(s.fastPass,0);assert.equal(s.turn,null);assert.ok(s.fast.total>0);tickCourtGame(s,secret,s.deadline);fastReady(s,secret);assert.equal(s.fastPass,1);assert.equal(s.turn,'p2');assert.ok(!JSON.stringify(s).includes('"input"'));
 const retry=actCourtGame(s,secret,'p2','fast',{values:first,pass:1,matchId:s.matchId},s.stageAt+50);assert.equal(retry.retry.length,5);assert.equal(s.stage,'fast');const second=s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[0].label);actCourtGame(s,secret,'p2','fast',{values:second,pass:1,matchId:s.matchId},s.stageAt+100);assert.equal(s.stage,'fastReview');let expected=s.fastIds.reduce((sum,id)=>sum+CLASH_BY_ID.get(id).answers[1].points,0);for(const id of s.fastIds){if(expected>=200)break;expected+=CLASH_BY_ID.get(id).answers[0].points;}assert.equal(s.fast.total,expected);assert.equal(s.fast.success,expected>=200);assert.equal(s.fast.rows.length,5);
 tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'finish');assert.equal(s.result.team,0);
});
test('1v1 is permitted but Fast Money handles the single winner without inventing a teammate',()=>{
 const s=createCourtGame('clash',players().slice(0,2)),secret={};startCourtGame(s,1000,random(1));enterFirstBoard(s,secret);s.round=4;s.stage='roundResult';s.deadline=5000;s.teamScores=[300,50];tickCourtGame(s,secret,5000);actCourtGame(s,secret,'p0','fast-start',{},5100);fastReady(s,secret);assert.equal(s.fastPlayers.length,1);assert.equal(s.fastTarget,100);tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'fastReview');assert.equal(s.fast.total,0);
});
test('estimate parser accepts usable notation without accepting units, NaN or negative entries',()=>{
 for(const [input,value]of [['1,250',1250],['1.5k',1500],['2M',2000000],['.25',.25],['1e3',1000],['0',0]])assert.equal(parseEstimate(input),value);
 for(const input of ['', '-1','NaN','Infinity','1/2','12 km','1e999','1e16','0x12'])assert.equal(parseEstimate(input),null,input);
});
for(const runners of [1,2])test(`Fast Money replaces an impossible ${runners}-runner draw without changing survey scores or reusing main boards`,()=>{
 const {s,secret}=game(),scores=CLASH_BOARDS.map(q=>q.answers.map(a=>a.points));s.stage='roundResult';s.round=4;s.deadline=5000;s.teamScores=[350,100];s.history=[{id:s.board.id}];tickCourtGame(s,secret,5000);
 const capacity=id=>CLASH_BY_ID.get(id).answers.slice(0,runners).reduce((sum,a)=>sum+a.points,0);
 s.fastIds=CLASH_BOARDS.filter(q=>q.id!==s.board.id).map(q=>q.id).sort((a,b)=>capacity(a)-capacity(b)).slice(0,5);const impossible=s.fastIds.slice();assert.ok(impossible.reduce((n,id)=>n+capacity(id),0)<runners*100);
 s.fastPlayers=runners===1?['p0']:['p0','p2'];actCourtGame(s,secret,'p0','fast-start',{},5100);assert.equal(s.fastIds.length,5);assert.equal(new Set(s.fastIds).size,5);assert.ok(s.fastIds.reduce((n,id)=>n+capacity(id),0)>=s.fastTarget);assert.ok(!s.fastIds.includes(s.board.id));assert.deepEqual(CLASH_BOARDS.map(q=>q.answers.map(a=>a.points)),scores);
});
test('accuracy is monotone, handles zero and rewards equal error equally, regardless of guess direction',()=>{
 assert.equal(accuracyScore(100,100),1000);assert.equal(accuracyScore(0,0),1000);assert.equal(accuracyScore(0,10),accuracyScore(20,10));let last=1001;for(let error=0;error<1000;error++){const points=accuracyScore(100+error,100);assert.ok(points<=last);last=points;}
});
test('everyone sees the same estimate prompt while private guesses stay out of public state until reveal',()=>{
 const {s,secret}=game('figure'),q=FIGURE_BY_ID.get(s.question.id);assert.equal(s.round,1);assert.equal(s.stage,'estimate');assert.equal(new Set(s.questionIds.slice(0,6).map(id=>FIGURE_BY_ID.get(id).category)).size,6);
 const before=JSON.stringify(s);assert.ok(!before.includes('"answer"'));actCourtGame(s,secret,'p0','estimate',{text:'123456.789',round:1,matchId:s.matchId},5000);assert.equal(s.locked.p0,true);assert.ok(!JSON.stringify(s).includes('123456.789'));assert.equal(secret.estimates.p0.value,123456.789);assert.throws(()=>actCourtGame(s,secret,'p0','estimate',{text:'999',round:1,matchId:s.matchId},5100),/already sealed/);assert.throws(()=>actCourtGame(s,secret,'p1','estimate',{text:'999',round:2,matchId:s.matchId},5100),/earlier/);
 for(const p of s.players.slice(1))actCourtGame(s,secret,p.id,'estimate',{text:String(q.answer),round:1,matchId:s.matchId},5200);tickCourtGame(s,secret,5300);assert.equal(s.stage,'reveal');assert.equal(s.roundResult.answer,q.answer);for(const row of s.roundResult.rows.filter(r=>r.id!=='p0')){assert.equal(row.closest,true);assert.equal(row.points,1200);}
});
test('a complete six-round FFA produces a final podium, with missing answers at zero and no double scoring',()=>{
 const {s,secret}=game('figure');let now=5000;
 for(let round=1;round<=6;round++){const q=FIGURE_BY_ID.get(s.question.id);actCourtGame(s,secret,'p0','estimate',{text:String(q.answer),round,matchId:s.matchId},now);now=s.deadline;tickCourtGame(s,secret,now);assert.equal(s.stage,'reveal');assert.equal(s.players[0].score,round*1200);assert.equal(s.players[1].score,0);assert.equal(tickCourtGame(s,secret,now),false);now=s.deadline;tickCourtGame(s,secret,now);now+=100;}
 assert.equal(s.stage,'finish');assert.deepEqual(s.result.winners,['p0']);assert.equal(s.history.length,6);assert.equal(s.result.scores[0].score,7200);
});

test('a full ten-player lobby supports five per bench and rotates all five representatives',()=>{
 const ps=Array.from({length:10},(_,i)=>({...players()[i%6],id:'p'+i,team:i%2})),s=createCourtGame('clash',ps),secret={};startCourtGame(s,1000,random(10));enterFirstBoard(s,secret);
 for(let r=1;r<=5;r++){assert.deepEqual(s.faceoffPlayers,['p'+((r-1)*2),'p'+((r-1)*2+1)]);if(r<5){s.round=r;s.teamScores=[0,0];s.stage='roundResult';s.deadline=5000+r;tickCourtGame(s,secret,5000+r);}}
});
test('equal-valued face-off answers keep the first buzzer in control',()=>{
 const {s,secret}=game();const q=CLASH_BOARDS.find(q=>q.answers.slice(1).some((a,i)=>a.points===q.answers[i].points));s.board={id:q.id,prompt:q.prompt,slots:q.answers.map((_,index)=>({index,revealed:false}))};const i=q.answers.findIndex((a,i)=>i>1&&a.points===q.answers[i-1].points);assert.ok(i>1);actCourtGame(s,secret,'p0','buzz',{},5000);answer(s,secret,'p0',q.answers[i].label,5100);answer(s,secret,'p1',q.answers[i-1].label,5200);assert.equal(s.choicePlayer,'p0');
});
test('Fast Money banks the last private draft at the buzzer and never leaks it to public state',()=>{
 const {s,secret}=game();s.stage='roundResult';s.deadline=5000;s.teamScores=[350,100];s.round=4;tickCourtGame(s,secret,5000);actCourtGame(s,secret,'p0','fast-start',{},5100);fastReady(s,secret);const input=s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[1].label);actCourtGame(s,secret,'p0','fast-draft',{values:input,pass:0,matchId:s.matchId},5200);assert.ok(!JSON.stringify(s).includes('"values"'));assert.equal(s.fast.total,0);tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'fastFirstReview');tickCourtGame(s,secret,s.deadline);fastReady(s,secret);assert.equal(s.fastPass,1);assert.deepEqual(secret.fast.p0.map(a=>a.input),input);assert.equal(actCourtGame(s,secret,'p0','fast-draft',{values:input,pass:0,matchId:s.matchId},s.deadline-1).ignored,true);
});
test('online teammates take turns while a disconnected seat retains its reconnect grace',()=>{
 const {s,secret}=game();s.players.find(p=>p.id==='p2').online=false;actCourtGame(s,secret,'p0','buzz',{},5000);answer(s,secret,'p0',CLASH_BY_ID.get(s.board.id).answers[0].label,5100);actCourtGame(s,secret,'p0','choice',{pass:false},5200);assert.equal(s.turn,'p4');assert.throws(()=>actCourtGame(s,secret,'p2','answer',{text:'test'},5300),/Only players/);assert.equal(s.players.find(p=>p.id==='p2').connected,true);
});

test('a missing estimate omitted by Firebase renders as no submission, never NaN or an estimate marker',()=>{
 const html=figureRevealMarkup({question:{prompt:'A number?'},players:[{id:'a',name:'Absent',buddy:'krill'},{id:'b',name:'Ready',buddy:'squid'}],roundResult:{answer:100,unit:'m',source:'https://example.org',sourceTitle:'Source',rows:[{id:'a',points:0},{id:'b',guess:90,error:10,points:1000,closest:true}]}});assert.ok(!html.includes('NaN'));assert.match(html,/NO SUBMISSION/);assert.equal((html.match(/class="cg-estimate-marker /g)??[]).length,1);assert.match(html,/OFF BY|CLOSEST/);
});
test('a new referee waits for private answers before expiring a round',async()=>{
 const {CourtGameSession}=await import('../court-games-session.js'),{s}=game('figure');const session=new CourtGameSession({mode:'figure',clock:()=>50000});session.state=s;session.host=true;session.connected=true;session.hostListening=true;session.refereeReady=false;session.syncRoster=async()=>{};session.broadcast=async()=>{};session.publish=async()=>{};
 try{session.tick();await session.queue;assert.equal(s.stage,'estimate');session.secret={estimates:{p0:{round:s.round,value:42}},fast:{}};session.refereeReady=true;session.tick();await session.queue;assert.equal(s.stage,'reveal');assert.equal(s.roundResult.rows.find(r=>r.id==='p0').guess,42);}finally{await session.close();}
});

test('Fast Money validates one answer without revealing the first runner and preserves passed-question progress',()=>{
 const {s,secret}=game();s.stage='roundResult';s.deadline=5000;s.teamScores=[350,100];s.round=4;tickCourtGame(s,secret,5000);actCourtGame(s,secret,'p0','fast-start',{},5100);fastReady(s,secret);
 const first=s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[1].label);actCourtGame(s,secret,'p0','fast',{values:first,pass:0,matchId:s.matchId},5200);assert.equal(s.stage,'fastFirstReview');assert.ok(!JSON.stringify(s).includes('"input"'));tickCourtGame(s,secret,s.deadline);fastReady(s,secret);
 const duplicate=actCourtGame(s,secret,s.turn,'fast-draft',{values:first,pass:1,checkIndex:0,cursor:0,passed:[],lap:0,matchId:s.matchId},s.stageAt+1);assert.deepEqual(duplicate.retry,[0]);assert.equal(secret.fastDraft?.[s.turn],undefined);
 const values=first.map((_,i)=>i===0?CLASH_BY_ID.get(s.fastIds[0]).answers[0].label:'');const receipt=actCourtGame(s,secret,s.turn,'fast-draft',{values,pass:1,checkIndex:0,cursor:0,passed:[2,3],lap:1,matchId:s.matchId},s.stageAt+2);assert.equal(receipt.checked,0);assert.equal(receipt.saved,true);assert.deepEqual(secret.fastDraft[s.turn].passed,[2,3]);assert.equal(secret.fastDraft[s.turn].lap,1);
});


test('survey judgement is a single referee-resolved beat, including after a state round trip',()=>{
 const {s,secret}=game(),q=CLASH_BY_ID.get(s.board.id);actCourtGame(s,secret,'p0','buzz',{},5000);
 const r=actCourtGame(s,secret,'p0','answer',{text:q.answers[0].label,resolve:true},5100);assert.equal(r.judging,true);assert.equal(s.stage,'survey');assert.equal(s.pot,0);assert.ok(s.board.slots.every(a=>!a.revealed));assert.throws(()=>actCourtGame(s,secret,'p0','answer',{text:q.answers[1].label},5200),/Wait/);
 const restored=JSON.parse(JSON.stringify(s));assert.equal(tickCourtGame(restored,secret,6699),false);assert.equal(tickCourtGame(restored,secret,6700),true);assert.equal(restored.stage,'answerResult');assert.equal(restored.pot,q.answers[0].points);assert.equal(tickCourtGame(restored,secret,6700),false);tickCourtGame(restored,secret,restored.deadline);assert.equal(restored.stage,'choice');
});
test('two failed representatives hand answers to the next pair in first-buzzer order',()=>{
 const {s,secret}=game();actCourtGame(s,secret,'p1','buzz',{},5000);answer(s,secret,'p1','bad first',5100);answer(s,secret,'p0','bad second',6200);assert.equal(s.stage,'faceAnswer');assert.deepEqual(s.faceoffPlayers,['p2','p3']);assert.equal(s.faceoffTurn,'p3');answer(s,secret,'p3','bad third',7300);assert.equal(s.faceoffTurn,'p2');
});
test('only the defending bench can confer and already-revealed answers preserve the turn and clock',()=>{
 const {s,secret}=game(),q=CLASH_BY_ID.get(s.board.id);actCourtGame(s,secret,'p0','buzz',{},5000);answer(s,secret,'p0',q.answers[0].label,5100);actCourtGame(s,secret,'p0','choice',{},6200);assert.equal(canCourtHuddle(s,'p0'),false);assert.equal(canCourtHuddle(s,'p1'),true);const deadline=s.deadline,id=s.turn;const r=answer(s,secret,id,q.answers[0].label,6300);assert.equal(r.retry,true);assert.equal(s.turn,id);assert.equal(s.deadline,deadline);assert.equal(s.strikes,0);
});
test('Fast Money instructions and first-question read do not consume the answer clock',()=>{
 const {s,secret}=game();s.stage='roundResult';s.deadline=5000;s.teamScores=[350,100];s.round=4;tickCourtGame(s,secret,5000);actCourtGame(s,secret,'p0','fast-start',{},5100);assert.equal(s.stage,'fastReady');assert.equal(actCourtGame(s,secret,'p0','fast-draft',{values:['','','','',''],pass:0,matchId:s.matchId},5200).ignored,true);tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'fastRead');assert.ok(s.deadline-s.stageAt>=3000);assert.ok(s.deadline-s.stageAt>=CLASH_BY_ID.get(s.fastIds[0]).prompt.split(/\s+/).length*300);tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'fast');assert.equal(s.deadline-s.stageAt,30000);
});
test('Fast Money second review preserves the first column and scores each answer after its reveal',async()=>{
 const {fastRevealPlan,fastScene}=await import('../court-games-fast.js');const rows=Array.from({length:5},(_,i)=>({prompt:'Question '+i,answers:[{label:'First '+i,points:27},{label:'Second '+i,points:25}]}));const plan=fastRevealPlan(rows,{second:true,target:200});assert.equal(plan.baseline,135);assert.deepEqual(plan.rows.map(r=>r.show),[true,true,true,false,false]);assert.ok(plan.rows.every(r=>r.pointsAt>r.answerAt));
 const {s}=game();Object.assign(s,{stage:'fastReview',fastPass:1,fastTarget:200,fast:{success:true,rows}});const html=fastScene(s,'p0',{});assert.ok(!html.includes('CASE CLOSED'));assert.equal((html.match(/is-banked/g)??[]).length,5);assert.equal((html.match(/data-reveal-ms=/g)??[]).length,3);
});

test('an uninterrupted six-player match reaches Fast Money and a finale through real actions',()=>{
 const {s,secret}=game();let now=5000,boards=0;
 const say=(uid,text)=>{actCourtGame(s,secret,uid,'answer',{text},now);assert.equal(s.stage,'survey');now=s.deadline;tickCourtGame(s,secret,now);if(s.stage==='answerResult'){now=s.deadline;tickCourtGame(s,secret,now);}now+=50;};
 while(s.stage==='faceoff'){
  boards++;const rep=s.faceoffPlayers[(boards-1)%2],q=CLASH_BY_ID.get(s.board.id);actCourtGame(s,secret,rep,'buzz',{},now);now+=50;say(rep,q.answers[0].label);assert.equal(s.stage,'choice');actCourtGame(s,secret,rep,'choice',{pass:false},now);now+=50;
  for(const a of q.answers.slice(1))say(s.turn,a.label);assert.equal(s.stage,'roundResult');now=s.deadline;tickCourtGame(s,secret,now);if(s.stage==='roundRead'){now=s.deadline;tickCourtGame(s,secret,now);}now+=50;assert.ok(boards<=4);
 }
 assert.equal(s.stage,'fastIntro');const captain=s.choicePlayer;actCourtGame(s,secret,captain,'fast-start',{},now);assert.equal(s.stage,'fastReady');now=s.deadline;tickCourtGame(s,secret,now);now=s.deadline;tickCourtGame(s,secret,now);now+=50;
 actCourtGame(s,secret,s.turn,'fast',{values:s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[1].label),pass:0,matchId:s.matchId},now);assert.equal(s.stage,'fastFirstReview');now=s.deadline;tickCourtGame(s,secret,now);assert.equal(s.stage,'fastReady');now=s.deadline;tickCourtGame(s,secret,now);now=s.deadline;tickCourtGame(s,secret,now);assert.equal(s.deadline-now,30000);now+=50;
 actCourtGame(s,secret,s.turn,'fast',{values:s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[0].label),pass:1,matchId:s.matchId},now);assert.equal(s.stage,'fastReview');assert.equal(s.event.type,'fast-review');assert.ok(!JSON.stringify(s).includes('"input"'));tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'finish');assert.equal(s.history.length,boards);assert.equal(s.result.fast.complete,true);
});


test('Feud directs distinct face-off, board, left/right bench, steal and Fast Money shots',async()=>{
 const {feudCameraShot}=await import('../court-games-cinema.js'),base={players:[]};
 for(const [stage,extra,shot]of [['lobby',{},'wide'],['faceoff',{},'faceoff'],['choice',{},'faceoff'],['survey',{judgement:{from:'faceAnswer'}},'faceoff'],['survey',{judgement:{from:'control'},controlTeam:0},'team0'],['roundResult',{},'board'],['control',{controlTeam:0},'team0'],['control',{controlTeam:1},'team1'],['steal',{stealTeam:0},'steal0'],['steal',{stealTeam:1},'steal1'],['fastReady',{},'fast-runner'],['fast',{},'fast-runner'],['fastReview',{},'fast-board'],['finish',{},'verdict']])assert.equal(feudCameraShot({...base,stage,...extra},10000),shot);
 const s={...base,stage:'control',controlTeam:1,lastAnswer:{at:10000}};assert.equal(feudCameraShot(s,10500),'team1');assert.equal(feudCameraShot(s,11200),'team1');
});
