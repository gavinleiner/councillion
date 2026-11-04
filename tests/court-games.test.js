import test from 'node:test';
import {figureRevealMarkup} from '../court-games-view.js';
import assert from 'node:assert/strict';
import {CLASH_BOARDS,FIGURE_QUESTIONS,CLASH_BY_ID,FIGURE_BY_ID} from '../court-games-data.js';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame,parseEstimate,accuracyScore} from '../court-games-engine.js';
import {random} from '../question-selection.js';
import {matchAnswer,normalize} from '../answer-matching.js';
const players=()=>Array.from({length:6},(_,i)=>({id:'p'+i,name:'Player '+i,team:i%2,ready:true,connected:true,buddy:i%2?'squid':'krill'}));
const game=(variant='clash')=>{const s=createCourtGame(variant,players()),secret={estimates:{},fast:{}};startCourtGame(s,1000,random(42));tickCourtGame(s,secret,4200);return {s,secret};};
const answer=(s,secret,uid,text,now=5000)=>actCourtGame(s,secret,uid,'answer',{text},now);
test('40 sourced aired boards preserve complete displayed categories, published scores and unambiguous aliases',()=>{
 assert.equal(CLASH_BOARDS.length,40);assert.equal(new Set(CLASH_BOARDS.map(q=>q.id)).size,40);assert.equal(new Set(CLASH_BOARDS.map(q=>q.source)).size,20);
 for(const q of CLASH_BOARDS){assert.match(q.basis,/Scores preserved/);assert.ok(q.answers.length>=5&&q.answers.length<=6);assert.ok(q.answers.reduce((n,a)=>n+a.points,0)<=100);assert.equal(new URL(q.source).hostname,'mstiescott.neocities.org');assert.ok(q.season>=16&&q.season<=25);const aliases=new Map();for(const [i,a]of q.answers.entries()){assert.ok(Number.isInteger(a.points)&&a.points>0);if(i)assert.ok(q.answers[i-1].points>=a.points);for(const text of [a.label,...a.aliases]){const norm=normalize(text);assert.ok(!aliases.has(norm)||aliases.get(norm)===a.label,q.id+': '+text);aliases.set(norm,a.label);assert.equal(matchAnswer(q,text)?.label,a.label,q.id+': '+text);}}}
});
test('42 individually sourced numerical questions have balanced subjects and clear units',()=>{
 assert.equal(FIGURE_QUESTIONS.length,42);assert.equal(new Set(FIGURE_QUESTIONS.map(q=>q.id)).size,42);const cats=Object.groupBy(FIGURE_QUESTIONS,q=>q.category);assert.equal(Object.keys(cats).length,7);for(const rows of Object.values(cats))assert.equal(rows.length,6);
 for(const q of FIGURE_QUESTIONS){assert.ok(Number.isFinite(q.answer)&&q.answer>=0&&q.answer<=1e15);assert.ok(q.unit&&q.explanation&&q.sourceTitle&&q.prompt);assert.equal(new URL(q.source).protocol,'https:');assert.equal(q.checked,'2026-11-04');}
});
test('default team match supports six players, locks roster, rotates face-off players and never reuses a board',()=>{
 const {s,secret}=game();assert.equal(s.settings.maxPlayers,10);assert.equal(s.players.filter(p=>!p.spectator).length,6);assert.equal(s.stage,'faceoff');assert.deepEqual(s.faceoffPlayers,['p0','p1']);
 const ids=new Set(s.questionIds);assert.equal(ids.size,40);s.history=[{id:s.board.id}];s.stage='roundResult';s.phase='burst';s.deadline=6000;s.teamScores=[50,0];tickCourtGame(s,secret,6000);assert.equal(s.round,2);assert.deepEqual(s.faceoffPlayers,['p2','p3']);assert.ok(ids.has(s.board.id));assert.notEqual(s.board.id,s.history[0].id);
});
test('highest face-off answer earns play/pass, with a real chance for the other representative',()=>{
 const {s,secret}=game(),q=CLASH_BY_ID.get(s.board.id);actCourtGame(s,secret,'p0','buzz',{},5000);assert.throws(()=>actCourtGame(s,secret,'p1','buzz',{},5100),/buzzers/);
 answer(s,secret,'p0',q.answers[2].label,5200);assert.equal(s.stage,'faceAnswer');assert.equal(s.faceoffTurn,'p1');answer(s,secret,'p1',q.answers[1].label,5300);assert.equal(s.stage,'choice');assert.equal(s.choicePlayer,'p1');
 assert.throws(()=>actCourtGame(s,secret,'p0','choice',{pass:false},5400),/chooses/);actCourtGame(s,secret,'p1','choice',{pass:true},5500);assert.equal(s.stage,'control');assert.equal(s.controlTeam,0);assert.equal(s.turn,'p2');
});
test('a top face-off answer wins immediately; teammates rotate and a third strike opens one steal',()=>{
 const {s,secret}=game(),q=CLASH_BY_ID.get(s.board.id);actCourtGame(s,secret,'p0','buzz',{},5000);answer(s,secret,'p0',q.answers[0].label,5100);assert.equal(s.stage,'choice');actCourtGame(s,secret,'p0','choice',{pass:false},5200);assert.equal(s.turn,'p2');
 answer(s,secret,s.turn,'not on the board',5300);assert.equal(s.strikes,1);assert.equal(s.turn,'p4');answer(s,secret,s.turn,q.answers[0].label,5400);assert.equal(s.strikes,2);assert.equal(s.turn,'p0');answer(s,secret,s.turn,'still not on the board',5500);assert.equal(s.stage,'steal');assert.equal(s.turn,'p1');
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
 actCourtGame(s,secret,'p0','runner',{player:'p0'},5100);actCourtGame(s,secret,'p0','runner',{player:'p2'},5200);actCourtGame(s,secret,'p0','fast-start',{},5300);assert.equal(s.fastTarget,200);assert.equal(s.fastPlayers.length,2);assert.equal(s.deadline,25300);
 const first=s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[0].label);const r=actCourtGame(s,secret,'p0','fast',{values:first,pass:0,matchId:s.matchId},5400);assert.equal(r.accepted,true);assert.equal(s.fastPass,1);assert.equal(s.turn,'p2');assert.equal(s.fast.total,0);assert.ok(!JSON.stringify(s).includes('"input"'));
 const retry=actCourtGame(s,secret,'p2','fast',{values:first,pass:1,matchId:s.matchId},5500);assert.equal(retry.retry.length,5);assert.equal(s.stage,'fast');const second=s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[1].label);actCourtGame(s,secret,'p2','fast',{values:second,pass:1,matchId:s.matchId},5600);assert.equal(s.stage,'fastReview');const expected=s.fastIds.reduce((sum,id)=>sum+CLASH_BY_ID.get(id).answers[0].points+CLASH_BY_ID.get(id).answers[1].points,0);assert.equal(s.fast.total,expected);assert.equal(s.fast.success,expected>=200);assert.equal(s.fast.rows.length,5);
 tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'finish');assert.equal(s.result.team,0);
});
test('1v1 is permitted but Fast Money handles the single winner without inventing a teammate',()=>{
 const s=createCourtGame('clash',players().slice(0,2)),secret={};startCourtGame(s,1000,random(1));tickCourtGame(s,secret,4200);s.round=4;s.stage='roundResult';s.deadline=5000;s.teamScores=[300,50];tickCourtGame(s,secret,5000);actCourtGame(s,secret,'p0','fast-start',{},5100);assert.equal(s.fastPlayers.length,1);assert.equal(s.fastTarget,100);tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'fastReview');assert.equal(s.fast.total,0);
});
test('estimate parser accepts usable notation without accepting units, NaN or negative entries',()=>{
 for(const [input,value]of [['1,250',1250],['1.5k',1500],['2M',2000000],['.25',.25],['1e3',1000],['0',0]])assert.equal(parseEstimate(input),value);
 for(const input of ['', '-1','NaN','Infinity','1/2','12 km','1e999','1e16','0x12'])assert.equal(parseEstimate(input),null,input);
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
 const ps=Array.from({length:10},(_,i)=>({...players()[i%6],id:'p'+i,team:i%2})),s=createCourtGame('clash',ps),secret={};startCourtGame(s,1000,random(10));tickCourtGame(s,secret,4200);
 for(let r=1;r<=5;r++){assert.deepEqual(s.faceoffPlayers,['p'+((r-1)*2),'p'+((r-1)*2+1)]);if(r<5){s.round=r;s.teamScores=[0,0];s.stage='roundResult';s.deadline=5000+r;tickCourtGame(s,secret,5000+r);}}
});
test('equal-valued face-off answers keep the first buzzer in control',()=>{
 const {s,secret}=game();const q=CLASH_BOARDS.find(q=>q.answers.slice(1).some((a,i)=>a.points===q.answers[i].points));s.board={id:q.id,prompt:q.prompt,slots:q.answers.map((_,index)=>({index,revealed:false}))};const i=q.answers.findIndex((a,i)=>i>1&&a.points===q.answers[i-1].points);assert.ok(i>1);actCourtGame(s,secret,'p0','buzz',{},5000);answer(s,secret,'p0',q.answers[i].label,5100);answer(s,secret,'p1',q.answers[i-1].label,5200);assert.equal(s.choicePlayer,'p0');
});
test('Fast Money banks the last private draft at the buzzer and never leaks it to public state',()=>{
 const {s,secret}=game();s.stage='roundResult';s.deadline=5000;s.teamScores=[350,100];s.round=4;tickCourtGame(s,secret,5000);actCourtGame(s,secret,'p0','fast-start',{},5100);const input=s.fastIds.map(id=>CLASH_BY_ID.get(id).answers[0].label);actCourtGame(s,secret,'p0','fast-draft',{values:input,pass:0,matchId:s.matchId},5200);assert.ok(!JSON.stringify(s).includes('"values"'));assert.equal(s.fast.total,0);tickCourtGame(s,secret,s.deadline);assert.equal(s.fastPass,1);assert.deepEqual(secret.fast.p0.map(a=>a.input),input);assert.throws(()=>actCourtGame(s,secret,'p0','fast-draft',{values:input,pass:0,matchId:s.matchId},s.deadline-1),/earlier/);
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
