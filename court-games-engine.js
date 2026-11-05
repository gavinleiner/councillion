import {shuffle} from './question-selection.js';
import {matchAnswer,normalize} from './answer-matching.js';
import {CLASH_BOARDS,CLASH_BY_ID,FIGURE_QUESTIONS,FIGURE_BY_ID} from './court-games-data.js';
import {courtSettings} from './court-games-settings.js';
export const COURT_GAMES_BUILD='20261104-final-figure-v7';
export const GAME_MODES={clash:{name:'Counsel Clash',subtitle:'TEAM FEUD',seats:10},figure:{name:'Final Figure',subtitle:'CLOSEST ANSWER WINS',seats:8}};
const live=s=>s.players.filter(p=>!p.spectator&&p.connected!==false);
const team=(s,n)=>{const rows=live(s).filter(p=>p.team===n),online=rows.filter(p=>p.online!==false);return online.length?online:rows;};
const actor=(s,id)=>s.players.find(p=>p.id===id&&!p.spectator&&p.connected!==false&&p.online!==false);
const emit=(s,type,text,now,extra={})=>{s.notice=text;s.event={id:++s.eventSerial,type,text,at:now,...extra};s.revision++;};
const stage=(s,value,now,ms)=>{s.stage=value;s.phase=['roundResult','reveal','fastFirstReview','fastReview'].includes(value)?'burst':value==='finish'?'ended':value==='lobby'?'lobby':'playing';s.deadline=ms?now+ms:0;s.stageAt=now;};
export function createCourtGame(mode,players=[],rng=Math.random){if(!GAME_MODES[mode])throw Error('Choose a game mode.');return {build:COURT_GAMES_BUILD,variant:mode,phase:'lobby',stage:'lobby',players:players.map(p=>({...p,score:0,team:p.team??0})),settings:{maxPlayers:GAME_MODES[mode].seats,...courtSettings(mode)},round:0,revision:0,eventSerial:0,teamScores:[0,0],deadline:0,notice:'Bring your friends. The court is assembling.',questionIds:[],locked:{},history:[]};}
export function startCourtGame(s,now=Date.now(),rng=Math.random){
 const ready=s.players.filter(p=>p.ready&&p.connected!==false&&p.online!==false).slice(0,GAME_MODES[s.variant].seats);
 if(ready.length<2)throw Error('At least two ready players are needed.');
 if(s.variant==='clash'&&(!ready.some(p=>p.team===0)||!ready.some(p=>p.team===1)))throw Error('Each team needs at least one ready player.');
 if(s.variant==='clash'&&[0,1].some(t=>ready.filter(p=>p.team===t).length>5))throw Error('Each bench has five seats.');
 s.matchId=crypto.randomUUID();s.players=s.players.map(p=>({...p,score:0,spectator:!ready.some(r=>r.id===p.id)}));s.teamScores=[0,0];s.round=0;s.history=[];s.locked={};s.secretEpoch=s.matchId;delete s.result;delete s.roundResult;delete s.fast;delete s.board;delete s.lastAnswer;delete s.judgement;
 s.questionIds=shuffle((s.variant==='clash'?CLASH_BOARDS:FIGURE_QUESTIONS).map(q=>q.id),rng);
 if(s.variant==='figure'){
  // Repeatedly draw from the least-used available subjects. Longer custom
  // expeditions keep the same variety and never repeat a question in a match.
  s.settings={...s.settings,...courtSettings('figure',s.settings)};const remaining=s.questionIds.slice(),selected=[],counts={};
  while(remaining.length){const least=Math.min(...remaining.map(id=>counts[FIGURE_BY_ID.get(id).category]??0)),i=remaining.findIndex(id=>(counts[FIGURE_BY_ID.get(id).category]??0)===least),id=remaining.splice(i,1)[0],category=FIGURE_BY_ID.get(id).category;selected.push(id);counts[category]=(counts[category]??0)+1;}s.questionIds=selected;
 }
 stage(s,'intro',now,3200);emit(s,'intro','Court is in session.',now);return true;
}
function nextClash(s,now){
 s.round++;const q=CLASH_BY_ID.get(s.questionIds[s.round-1]);if(!q)throw Error('No unused boards remain.');
 s.board={id:q.id,prompt:q.prompt,slots:q.answers.map((_,i)=>({index:i,revealed:false}))};s.strikes=0;s.pot=0;s.multiplier=s.round<3?1:s.round===3?2:3;s.faceoffBest=null;s.faceoffTried=[];s.faceoffPlayers=[0,1].map(t=>{const a=team(s,t);return a[(s.round-1)%a.length]?.id??null;});s.faceoffTurn=null;s.controlTeam=null;s.turn=null;s.locked={};delete s.roundResult;
 stage(s,'faceoff',now,15000);emit(s,'faceoff','One counsel from each bench. Buzz to answer.',now);
}
function revealSlot(s,index,now){const a=CLASH_BY_ID.get(s.board.id).answers[index];if(s.board.slots[index].revealed)return false;s.board.slots[index]={index,revealed:true,label:a.label,points:a.points};s.pot+=a.points*s.multiplier;emit(s,'answer',a.label,now,{slot:index,points:a.points*s.multiplier});s.lastAnswer={...s.event,team:s.players.find(p=>p.id===(s.stage==='faceAnswer'?s.faceoffTurn:s.turn))?.team??s.controlTeam,points:s.stage==='steal'?0:a.points*s.multiplier};return true;}
function chooseControl(s,id,now){s.choicePlayer=id;stage(s,'choice',now,10000);emit(s,'choice','The higher answer takes control. Play or pass?',now,{player:id});}
function control(s,t,now){s.controlTeam=t;const members=team(s,t),faceoff=members.findIndex(p=>s.faceoffPlayers.includes(p.id));s.turn=members[(faceoff+1)%members.length]?.id;stage(s,'control',now,18000);emit(s,'control',(t===0?'Petitioners':'Respondents')+' have the board.',now,{team:t});}
function finishBoard(s,winner,now,steal=false){
 const pot=s.pot;s.teamScores[winner]+=pot;s.history.push({round:s.round,id:s.board.id,winner,pot,multiplier:s.multiplier,steal});
 s.roundResult={winner,pot,steal};stage(s,'roundResult',now,6500);emit(s,steal?'steal-win':'round-win',(winner===0?'Petitioners':'Respondents')+(steal?' stole ':' banked ')+pot+' points.',now,{team:winner,points:pot});
}
function rotate(s,now){const a=team(s,s.controlTeam),i=a.findIndex(p=>p.id===s.turn);s.turn=a[(i+1)%a.length]?.id;s.deadline=now+18000;}
function strike(s,now,reason='Not on the board'){s.strikes++;emit(s,'strike',reason+'. Strike '+s.strikes+'.',now,{team:s.controlTeam});if(s.strikes>=3){s.stealTeam=1-s.controlTeam;s.turn=team(s,s.stealTeam)[0]?.id;stage(s,'steal',now,20000);emit(s,'steal','Three strikes. Opposing counsel, one answer to steal.',now,{team:s.stealTeam});}else rotate(s,now);}
function finishClashMain(s,now){const scores=s.teamScores;if(scores[0]===scores[1]){nextClash(s,now);return;}const winner=scores[0]>scores[1]?0:1;s.winningTeam=winner;s.fastPlayers=[];s.fastIds=s.questionIds.filter(id=>!s.history.some(h=>h.id===id)).slice(0,5);s.choicePlayer=team(s,winner)[0]?.id;stage(s,'fastIntro',now,30000);emit(s,'fast-intro','Main verdict: '+(winner===0?'Petitioners':'Respondents')+'. Choose your Fast Money counsel.',now,{team:winner});}
function readyFast(s,now){stage(s,'fastReady',now,30000);emit(s,'fast-ready',s.fastPass===0?'First counsel: get ready. Your clock has not started.':'Second counsel: '+s.fast.total+' banked. You need '+Math.max(0,s.fastTarget-s.fast.total)+' more. No duplicate answers.',now,{player:s.turn});}
function readFast(s,now){const words=CLASH_BY_ID.get(s.fastIds[0]).prompt.trim().split(/\s+/).length;stage(s,'fastRead',now,Math.max(3000,Math.min(10000,words*360+650)));emit(s,'fast-read','First question. The clock starts after the read.',now,{player:s.turn});}
function beginFast(s,now){const winners=team(s,s.winningTeam);s.fastPlayers=s.fastPlayers.length?s.fastPlayers:winners.slice(0,2).map(p=>p.id);s.fastPass=0;s.fastTarget=s.fastPlayers.length>=2?200:100;s.turn=s.fastPlayers[0];s.fast={total:0,complete:false};readyFast(s,now);}
// Only the defending bench may confer while the controlling family answers.
export function canCourtHuddle(s,uid){const p=s.players.find(p=>p.id===uid);const phase=s.stage==='survey'?s.judgement?.from:s.stage;return s.variant==='clash'&&p&&!p.spectator&&p.connected!==false&&p.online!==false&&['control','steal'].includes(phase)&&p.team===(phase==='steal'?s.stealTeam:1-s.controlTeam);}
function finish(s,now){
 const scores=s.variant==='clash'?s.teamScores:s.players.filter(p=>!p.spectator).map(p=>p.score),max=Math.max(...scores);
 s.result=s.variant==='clash'?{team:s.winningTeam,scores:s.teamScores,fast:s.fast}:{winners:s.players.filter(p=>!p.spectator&&p.score===max).map(p=>p.id),scores:s.players.filter(p=>!p.spectator).map(p=>({id:p.id,score:p.score})).sort((a,b)=>b.score-a.score)};
 stage(s,'finish',now);s.endedAt=now;emit(s,'finish','The final verdict is in.',now);
}
export function parseEstimate(input){
 const clean=String(input??'').trim().replaceAll(',','').replace(/\s+/g,'');const m=clean.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)([kmb])?$/i);if(!m)return null;
 const n=Number(m[1])*({k:1e3,m:1e6,b:1e9}[m[2]?.toLowerCase()]??1);return Number.isFinite(n)&&n>=0&&n<=1e15?n:null;
}
export function accuracyScore(guess,target,scale=1){if(!Number.isFinite(guess)||!Number.isFinite(target)||!Number.isFinite(scale)||scale<=0)return 0;return Math.max(0,Math.min(1000,Math.round(1000*Math.exp(-2.2*Math.abs(guess-target)/Math.max(Math.abs(target),scale)))));}
function nextFigure(s,now){s.round++;const q=FIGURE_BY_ID.get(s.questionIds[s.round-1]);s.question={id:q.id,prompt:q.prompt,unit:q.unit,category:q.category};s.locked={};s.advanceReady={};delete s.roundResult;stage(s,'estimate',now,(s.settings.seconds??30)*1000);emit(s,'estimate','One number. Seal your answer.',now);}
function revealFigure(s,secret,now){
 const before=s.players.filter(p=>!p.spectator).map(p=>({id:p.id,score:p.score}));
 const q=FIGURE_BY_ID.get(s.question.id),rows=s.players.filter(p=>!p.spectator).map(p=>{const v=secret.estimates?.[p.id]?.round===s.round?secret.estimates[p.id].value:null;return {id:p.id,guess:v,error:v===null?null:Math.abs(v-q.answer)};}),valid=rows.filter(r=>r.guess!==null),least=valid.length?Math.min(...valid.map(r=>r.error)):null;
 for(const r of rows){r.closest=r.error!==null&&Math.abs(r.error-least)<=Math.max(1e-10,Math.abs(q.answer)*1e-12);r.accuracy=r.guess===null?0:accuracyScore(r.guess,q.answer,q.scale??1);r.bonus=r.closest?200:0;r.points=r.accuracy+r.bonus;s.players.find(p=>p.id===r.id).score+=r.points;}
 for(const r of rows){r.before=before.find(p=>p.id===r.id).score;r.total=s.players.find(p=>p.id===r.id).score;r.rankBefore=1+before.filter(p=>p.score>r.before).length;r.rankAfter=1+s.players.filter(p=>!p.spectator&&p.score>r.total).length;}
 const leaders=s.players.filter(p=>!p.spectator&&p.score===Math.max(...s.players.filter(p=>!p.spectator).map(p=>p.score))).map(p=>p.id);
 s.advanceReady={};s.roundResult={answer:q.answer,unit:q.unit,explanation:q.explanation,source:q.source,sourceTitle:q.sourceTitle,leaders,rows:rows.sort((a,b)=>(a.error??Infinity)-(b.error??Infinity))};s.history.push({round:s.round,id:q.id,...s.roundResult});stage(s,'reveal',now,14000);emit(s,'reveal','Unseal the estimates. Closest counsel earns +200.',now);
}
export function actCourtGame(s,secret,uid,action,payload={},now=Date.now()){
 const p=payload.timeout?s.players.find(p=>p.id===uid&&!p.spectator):actor(s,uid);if(!p)throw Error('Only players in this game can act.');
 if(s.deadline&&now>=s.deadline)throw Error('That timer has ended.');
 if(s.variant==='figure'){
  if(action==='next'){
   if(s.stage!=='reveal')throw Error('Wait for the evidence reveal.');if(payload.round!==s.round||payload.matchId!==s.matchId)throw Error('That vote belongs to an earlier dive.');if(now-s.stageAt<5000)throw Error('Let the evidence reveal finish first.');s.advanceReady??={};s.advanceReady[uid]=true;s.revision++;return {accepted:true};
  }
  if(action!=='estimate'||s.stage!=='estimate')throw Error('Wait for the next estimate.');
  if(payload.round!==s.round||payload.matchId!==s.matchId)throw Error('That answer belongs to an earlier question.');
  if(s.locked?.[uid])throw Error('Your answer is already sealed.');
  const value=parseEstimate(payload.text);if(value===null)throw Error('Enter a non-negative number. Commas, decimals and k/m/b work.');
  secret.estimates??={};secret.estimates[uid]={round:s.round,value};s.locked[uid]=true;emit(s,'sealed',p.name+' sealed an estimate.',now,{player:uid});return {accepted:true,value};
 }
 if(action==='buzz'){
  if(s.stage!=='faceoff'||!s.faceoffPlayers.includes(uid))throw Error('The two face-off counsel have the buzzers.');
  s.faceoffFirstTeam=p.team;s.faceoffTurn=uid;stage(s,'faceAnswer',now,7000);emit(s,'buzz',p.name+' buzzed first.',now,{player:uid,team:p.team});return {accepted:true};
 }
 if(action==='choice'){
  if(s.stage!=='choice'||s.choicePlayer!==uid)throw Error('Winning face-off counsel chooses.');
  control(s,payload.pass?1-p.team:p.team,now);return {accepted:true};
 }
 if(action==='runner'){
  if(s.stage!=='fastIntro'||s.choicePlayer!==uid)throw Error('The winning captain chooses the runners.');
  const q=actor(s,payload.player);if(!q||q.team!==s.winningTeam)throw Error('Choose a teammate.');
  s.fastPlayers=s.fastPlayers.includes(q.id)?s.fastPlayers.filter(id=>id!==q.id):[...s.fastPlayers.slice(-1),q.id];s.revision++;return {accepted:true};
 }
 if(action==='fast-start'){
  if(s.stage!=='fastIntro'||s.choicePlayer!==uid)throw Error('The winning captain starts Fast Money.');beginFast(s,now);return {accepted:true};
 }
 if(action==='fast-ready'){
  if(s.stage!=='fastReady'||s.turn!==uid)throw Error('Only the next runner can start their read.');readFast(s,now);return {accepted:true};
 }
 if(action==='fast-draft'){
  if(s.stage!=='fast'||s.turn!==uid||payload.pass!==s.fastPass||payload.matchId!==s.matchId)throw Error('That is an earlier Fast Money turn.');
  if(!Array.isArray(payload.values)||payload.values.length!==5||payload.values.some(v=>typeof v!=='string'||v.length>40))throw Error('Use five short answers.');
  if(payload.checkIndex!==undefined){
   if(!Number.isInteger(payload.checkIndex)||payload.checkIndex<0||payload.checkIndex>4)throw Error('Choose one of the five questions.');
   const i=payload.checkIndex,a=matchAnswer(CLASH_BY_ID.get(s.fastIds[i]),payload.values[i]),first=secret.fast?.[s.fastPlayers[0]];
   if(s.fastPass===1&&a&&first?.[i]?.label===a.label)return {retry:[i],message:'Already said. Give a different answer.',checked:i};
  }
  if(payload.cursor!==undefined&&(!Number.isInteger(payload.cursor)||payload.cursor<0||payload.cursor>4))throw Error('Invalid question cursor.');
  const passed=payload.passed??[];if(!Array.isArray(passed)||passed.length>5||passed.some(i=>!Number.isInteger(i)||i<0||i>4))throw Error('Invalid passed questions.');
  secret.fastDraft??={};secret.fastDraft[uid]={pass:s.fastPass,values:payload.values,cursor:payload.cursor??0,passed,lap:payload.lap===1?1:0};return {saved:true,...(payload.checkIndex!==undefined?{checked:payload.checkIndex}:{})};
 }
 if(action==='fast'){
  if(s.stage!=='fast'||s.turn!==uid)throw Error('Wait for your Fast Money turn.');
  if(payload.pass!==s.fastPass||payload.matchId!==s.matchId)throw Error('That is an earlier Fast Money turn.');
  if(!Array.isArray(payload.values)||payload.values.length!==5||payload.values.some(v=>typeof v!=='string'||v.length>40))throw Error('Submit five short answers.');
  const rows=s.fastIds.map((id,i)=>{const answer=matchAnswer(CLASH_BY_ID.get(id),payload.values[i]);return {input:payload.values[i],label:answer?.label??'',points:answer?.points??0};});
  const first=secret.fast?.[s.fastPlayers[0]];
  const duplicates=s.fastPass===1&&first?rows.flatMap((r,i)=>r.label&&r.label===first[i].label?[i]:[]):[];
  if(duplicates.length&&!payload.timeout)return {retry:duplicates,message:'Already used in question '+duplicates.map(i=>i+1).join(', ')+'. Give a different answer or leave it blank.'};
  for(const i of duplicates)rows[i]={...rows[i],label:'',points:0};
  secret.fast??={};secret.fast[uid]=rows;const firstTotal=Object.values(secret.fast).flat().reduce((n,r)=>n+r.points,0);s.fast.total=0;
  if(s.fastPass===0&&s.fastPlayers.length>1&&firstTotal<s.fastTarget){s.fast.total=firstTotal;s.turn=null;stage(s,'fastFirstReview',now,12000);emit(s,'fast-first-review','First counsel: let’s see what the survey said.',now,{player:uid});}
  else{let reviewTotal=s.fastPass===1?(secret.fast[s.fastPlayers[0]]??[]).reduce((n,r)=>n+r.points,0):0;for(const row of rows){if(reviewTotal>=s.fastTarget)break;reviewTotal+=row.points;}s.fast={total:reviewTotal,target:s.fastTarget,success:reviewTotal>=s.fastTarget,complete:true,rows:s.fastIds.map((id,i)=>({prompt:CLASH_BY_ID.get(id).prompt,source:CLASH_BY_ID.get(id).source,answers:s.fastPlayers.filter(uid=>secret.fast[uid]).map(uid=>({label:secret.fast[uid][i].label,points:secret.fast[uid][i].points}))}))};stage(s,'fastReview',now,14000);emit(s,'fast-review','Let’s see what the survey said. Reveal the final answers.',now);}
  return {accepted:true,rows};
 }
 if(action!=='answer'||!['faceAnswer','control','steal'].includes(s.stage))throw Error('Wait for your answer turn.');
 const expected=s.stage==='faceAnswer'?s.faceoffTurn:s.turn;if(expected!==uid)throw Error('It is another counsel’s turn.');
 const q=CLASH_BY_ID.get(s.board.id),answer=matchAnswer(q,String(payload.text??'').slice(0,120)),index=answer?q.answers.findIndex(a=>normalize(a.label)===normalize(answer.label)):-1;
 if(!payload.timeout&&s.stage==='control'&&index>=0&&s.board.slots[index].revealed){emit(s,'retry','Already on the board. Try another answer.',now,{player:uid});return {retry:true,message:s.notice};}
 if(payload.timeout)return resolveBoardAnswer(s,uid,payload,now);
 s.judgement={uid,text:String(payload.text??'').trim().slice(0,120),from:s.stage};stage(s,'survey',now,1000);emit(s,'survey','Survey says…',now,{player:uid,team:p.team});return {accepted:true,judging:true};
}
// Referee-only resolution: client payloads cannot skip the survey beat.
function resolveBoardAnswer(s,uid,payload,now){
 const q=CLASH_BY_ID.get(s.board.id),answer=matchAnswer(q,String(payload.text??'').slice(0,120)),index=answer?q.answers.findIndex(a=>normalize(a.label)===normalize(answer.label)):-1,valid=index>=0&&!s.board.slots[index].revealed;
 if(s.stage==='faceAnswer'){
  s.faceoffTried.push(uid);if(valid){revealSlot(s,index,now);if(!s.faceoffBest||q.answers[index].points>q.answers[s.faceoffBest.index].points)s.faceoffBest={id:uid,index};}
  if(valid&&q.answers[index].points===q.answers[0].points||s.faceoffTried.length>=2){if(s.faceoffBest)chooseControl(s,s.faceoffBest.id,now);else{s.faceoffTried=[];s.faceoffPlayers=[0,1].map(t=>{const a=team(s,t),i=a.findIndex(p=>p.id===s.faceoffPlayers[t]);return a[(i+1)%a.length]?.id;});s.faceoffTurn=s.faceoffPlayers[s.faceoffFirstTeam??0];stage(s,'faceAnswer',now,7000);emit(s,'miss','No board answer. Next counsel answer in the original buzzer order.',now,{player:s.faceoffTurn});}}
  else{s.faceoffTurn=s.faceoffPlayers.find(id=>id!==uid);s.deadline=now+7000;emit(s,valid?'answer':'miss','Other counsel: can you beat that answer?',now,{player:s.faceoffTurn});}
 }else if(s.stage==='steal'){
  // Classic steal awards the already banked points, not the stealing answer's value.
  const bank=s.pot;if(valid)revealSlot(s,index,now);s.pot=bank;finishBoard(s,valid?s.stealTeam:s.controlTeam,now,valid);
 }else if(valid){revealSlot(s,index,now);if(s.board.slots.every(r=>r.revealed))finishBoard(s,s.controlTeam,now);else rotate(s,now);}else strike(s,now,payload.timeout?'Time expired':index>=0?'Already revealed':'Not on the board');
 return {accepted:true,found:valid,label:valid?answer.label:null};
}
export function tickCourtGame(s,secret,now=Date.now()){
 if(['lobby','finish'].includes(s.stage))return false;
 if(s.variant==='clash'&&s.stage!=='intro'&&[0,1].some(t=>!team(s,t).length)){s.winningTeam=team(s,0).length?0:1;finish(s,now);s.notice='The other bench left. The court is adjourned.';return true;}
 if(s.stage==='estimate'&&live(s).every(p=>s.locked?.[p.id])){revealFigure(s,secret,now);return true;}
 if(s.variant==='figure'&&s.stage==='reveal'&&now-s.stageAt>=5000&&live(s).filter(p=>p.online!==false).every(p=>s.advanceReady?.[p.id])){s.round>=(s.settings.rounds??6)?finish(s,now):nextFigure(s,now);return true;}
 if(!s.deadline||now<s.deadline)return false;
 if(s.stage==='survey'){const pending=s.judgement;delete s.judgement;stage(s,pending.from,now,1);resolveBoardAnswer(s,pending.uid,{text:pending.text},now);return true;}
 if(s.stage==='intro'){s.variant==='clash'?nextClash(s,now):nextFigure(s,now);return true;}
 if(s.stage==='estimate'){revealFigure(s,secret,now);return true;}
 if(s.stage==='reveal'){s.round>=(s.settings.rounds??6)?finish(s,now):nextFigure(s,now);return true;}
 if(s.stage==='roundResult'){if(s.round>=4||s.teamScores.some(n=>n>=300))finishClashMain(s,now);else nextClash(s,now);return true;}
 if(s.stage==='faceoff'){
  const choices=s.faceoffPlayers.filter(Boolean);s.faceoffTurn=choices[(s.round-1)%choices.length];s.faceoffFirstTeam=s.players.find(p=>p.id===s.faceoffTurn)?.team??0;stage(s,'faceAnswer',now,7000);emit(s,'buzz','Time to answer. '+(s.players.find(p=>p.id===s.faceoffTurn)?.team===0?'Petitioners':'Respondents')+' go first.',now,{player:s.faceoffTurn});return true;
 }
 if(s.stage==='faceAnswer'||s.stage==='control'||s.stage==='steal'){
  const id=s.stage==='faceAnswer'?s.faceoffTurn:s.turn;s.deadline=now+1;actCourtGame(s,secret,id,'answer',{text:'',timeout:true},now);return true;
 }
 if(s.stage==='choice'){control(s,actor(s,s.choicePlayer)?.team??0,now);return true;}
 if(s.stage==='fastIntro'){beginFast(s,now);return true;}
 if(s.stage==='fastReady'){readFast(s,now);return true;}
 if(s.stage==='fastRead'){stage(s,'fast',now,s.fastPass===0?20000:25000);emit(s,'fast',s.fastPass===0?'Twenty seconds. Find the top answers.':'Twenty-five seconds. Find different answers.',now,{player:s.turn});return true;}
 if(s.stage==='fast'){s.deadline=now+1;actCourtGame(s,secret,s.turn,'fast',{values:secret.fastDraft?.[s.turn]?.pass===s.fastPass?secret.fastDraft[s.turn].values:['','','','',''],pass:s.fastPass,matchId:s.matchId,timeout:true},now);return true;}
 if(s.stage==='fastFirstReview'){s.fastPass=1;s.turn=s.fastPlayers[1];readyFast(s,now);return true;}
 if(s.stage==='fastReview'){finish(s,now);return true;}return false;
}
