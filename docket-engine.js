import {DOCKET_CATEGORIES,DOCKET_FINALS,DOCKET_TIES,DOCKET_BY_ID} from './docket-data.js';
import {resolveAnswer} from './answer-matching.js';
import {containsBlockedLanguage} from './moderation.js';
import {shuffle} from './question-selection.js';

const crew=s=>s.players.filter(p=>!p.spectator&&p.connected!==false&&p.online!==false);
const tell=(s,type,text,now)=>{s.notice=text;s.event={id:++s.eventSerial,type,text,at:now};s.revision++;};
function stage(s,key,now,ms=0){s.stage=key;s.stageAt=now;s.deadline=ms?now+ms:0;s.phase=key==='lobby'?'lobby':key==='finish'?'ended':key==='docketVerdict'?'burst':'playing';}
function ready(s,uid){s.acknowledged??={};s.acknowledged[uid]=true;s.revision++;}
const allReady=s=>crew(s).length>0&&crew(s).every(p=>s.acknowledged?.[p.id]);
const clearReady=s=>{s.acknowledged={};};
const name=(s,id)=>s.players.find(p=>p.id===id)?.name??'Counsel';
export const docketWagerMax=s=>Math.max(s.players.find(p=>p.id===s.turn)?.score??0,s.round===1?1000:2000);
export function docketResponse(q,text){
 const pack={answers:[{label:q.answer,aliases:q.aliases??[]}],family:'trivia'};
 let clean=String(text??'').trim().replace(/\?+$/,'').trim(),result;
 // A player may type the question prefix even though the UI supplies one.
 // Test the real title first, so names such as What Is Love are preserved.
 for(let i=0;i<4;i++){
  result=resolveAnswer(pack,clean);if(result.answer)return result;
  const next=clean.replace(/^(?:(?:what|who|where)\s+(?:is|are|was|were)\s+|(?:what|who|where)['’]s\s+)/i,'').trim();
  if(next===clean)break;clean=next;
 }
 return result;
}

function deck(rng){
 // One category from each of six subject families per board; no franchise or
 // alternate-tag templates. The two boards never reuse a category.
 const families=shuffle([...new Set(DOCKET_CATEGORIES.map(c=>c.family))],rng),picked=[],answers=new Set();
 for(let board=0;board<2;board++)for(let i=0;i<6;i++){
  const family=families[(board*6+i)%families.length],all=DOCKET_CATEGORIES.filter(c=>c.family===family&&!picked.includes(c.id)),pool=all.filter(c=>c.clues.every(q=>!answers.has(q.answer.toLowerCase()))),chosen=shuffle(pool.length?pool:all,rng)[0];
  picked.push(chosen.id);for(const q of chosen.clues)answers.add(q.answer.toLowerCase());
 }
 return picked;
}
function board(s,secret,now){
 s.round++;s.cells=s.categoryIds.slice((s.round-1)*6,s.round*6).flatMap((id,col)=>{
  const c=DOCKET_CATEGORIES.find(c=>c.id===id);return c.clues.map((q,row)=>({id:q.id,col,row,category:c.title,value:(row+1)*(s.round===1?200:400),used:false}));
 });
 const positions=shuffle(s.cells.filter(c=>c.row>0).map(c=>c.id),secret.docket.rng??Math.random).slice(0,s.round===1?1:2);
 secret.docket.doubles=positions;delete s.clue;delete s.verdict;s.turn=null;s.attempts={};s.lockouts={};clearReady(s);
 if(s.round===2){const low=Math.min(...crew(s).map(p=>p.score));s.selector=crew(s).find(p=>p.score===low)?.id;}
 stage(s,'docketBoardIntro',now);tell(s,'board-intro',s.round===1?'Six categories. Choose your case.':'Double stakes. Lowest score chooses first.',now);
}
export function startDocket(s,secret,now,rng=Math.random){
 const players=crew(s).filter(p=>p.ready).slice(0,6);if(players.length<2)throw Error('At least two ready counsel are needed.');if(crew(s).some(p=>!p.ready))throw Error('Wait for everyone to ready up.');
 s.matchId=crypto.randomUUID();s.secretEpoch=s.matchId;s.players=s.players.map(p=>({...p,score:0,spectator:!players.some(q=>q.id===p.id)}));s.round=0;s.history=[];s.locked={};s.categoryIds=deck(rng);s.questionIds=[];s.selector=shuffle(players,rng)[0].id;s.attempts={};s.lockouts={};
 for(const k of ['result','verdict','clue','finalRows','cells','finalCategory','finalOrder','eligible','tied'])delete s[k];
 const usedAnswers=new Set(DOCKET_CATEGORIES.filter(c=>s.categoryIds.includes(c.id)).flatMap(c=>c.clues.map(q=>q.answer.toLowerCase())));
 secret.docket={finalId:shuffle(DOCKET_FINALS.filter(q=>!usedAnswers.has(q.answer.toLowerCase())),rng)[0].id,tieIds:shuffle(DOCKET_TIES,rng).map(q=>q.id),tieIndex:0,wagers:{},answers:{},doubles:[]};
 clearReady(s);stage(s,'docketBriefing',now);tell(s,'briefing','Welcome to The Docket. Every counsel has a stand.',now);return true;
}
function selection(s,now){s.turn=null;s.attempts={};s.lockouts={};if(!crew(s).some(p=>p.id===s.selector))s.selector=crew(s)[0]?.id;stage(s,'docketBoard',now,45000);tell(s,'select',name(s,s.selector)+', choose a category and value.',now);}
function reading(s,now){s.attempts={};s.lockouts={};stage(s,'docketRead',now,Math.min(24000,Math.max(5000,s.clue.prompt.split(/\s+/).length*450+1500)));tell(s,'read',s.clue.prompt,now);}
function buzz(s,now){s.turn=null;s.turnOpenedAt=now;s.buzzOpenedAt=now;stage(s,'docketBuzz',now,9000);tell(s,'buzz-open','Buzzers open.',now);}
function show(s,secret,now,uid,text,correct,value){
 const q=DOCKET_BY_ID.get(s.clue.id),p=s.players.find(p=>p.id===uid);if(p)p.score+=correct?value:-value;
 s.verdict={uid:uid??'',text:String(text).slice(0,120),correct,delta:uid?(correct?value:-value):0,answer:q.answer,source:q.source,explanation:q.explanation??'',double:!!s.clue.double};
 if(correct&&uid)s.selector=uid;
 s.history.push({id:q.id,round:s.round,uid:uid??'',correct,value,at:now});
 clearReady(s);stage(s,'docketVerdict',now,10000);tell(s,correct?'correct':'incorrect',correct?'Sustained. '+name(s,uid)+' takes '+value+'.':uid?'Not this time. The response is '+q.answer+'.':'The response is '+q.answer+'.',now);
}
function final(s,secret,now){
 const q=DOCKET_BY_ID.get(secret.docket.finalId);s.eligible=s.players.filter(p=>!p.spectator&&p.score>0).map(p=>p.id);s.locked={};s.finalCategory=q.category;delete s.clue;clearReady(s);
 if(!s.eligible.length){finish(s,now);s.result.winners=[];s.notice='No positive score. The court adjourns without a champion.';s.event.text=s.notice;return;}
 stage(s,'docketFinalWager',now,60000);tell(s,'final-category','Final record: '+q.category+'. Seal your wager before seeing the clue.',now);
}
function finalClue(s,secret,now){
 for(const id of s.eligible)secret.docket.wagers[id]??=0;
 const q=DOCKET_BY_ID.get(secret.docket.finalId);s.clue={id:q.id,prompt:q.prompt,category:q.category};s.locked={};stage(s,'docketFinalRead',now,Math.max(6000,q.prompt.split(/\s+/).length*450+1500));tell(s,'final-read',q.prompt,now);
}
function revealFinal(s,secret,now){
 const q=DOCKET_BY_ID.get(secret.docket.finalId);s.finalOrder=[...s.eligible].sort((a,b)=>s.players.find(p=>p.id===a).score-s.players.find(p=>p.id===b).score);s.finalRows=[];s.finalAnswer=q.answer;s.finalSource=q.source;s.finalRevealIndex=0;delete s.clue;stage(s,'docketFinalReveal',now,1800);tell(s,'unseal','Pens down. Unseal the record.',now);
}
function finish(s,now){
 const rows=s.players.filter(p=>!p.spectator).map(p=>({id:p.id,score:p.score})).sort((a,b)=>b.score-a.score);s.result={winners:rows.filter(p=>p.score===rows[0]?.score).map(p=>p.id),scores:rows};stage(s,'finish',now);s.endedAt=now;tell(s,'finish',name(s,rows[0]?.id)+' takes the final verdict.',now);
}
function tie(s,secret,now){
 const top=Math.max(...s.players.filter(p=>!p.spectator).map(p=>p.score));if(top<=0){finish(s,now);s.result.winners=[];s.notice='No positive final score. The court adjourns without a champion.';s.event.text=s.notice;return;}s.tied=s.players.filter(p=>!p.spectator&&p.score===top).map(p=>p.id);
 if(s.tied.length<2){finish(s,now);return;}
 const ids=secret.docket.tieIds,q=DOCKET_BY_ID.get(ids[secret.docket.tieIndex++%ids.length]);s.clue={id:q.id,prompt:q.prompt,category:q.category,value:0,tiebreak:true};reading(s,now);
}
export function actDocket(s,secret,uid,action,payload,now){
 const p=crew(s).find(p=>p.id===uid);if(!p)throw Error('Only active counsel can act.');
 if(action==='docket-buzz'&&s.stage==='docketAnswer'&&!s.clue.double&&payload.matchId===s.matchId&&payload.round===s.round&&payload.stageAt===s.buzzOpenedAt)return {lostBuzz:true};
 if(payload.matchId!==s.matchId||payload.round!==s.round||payload.stageAt!==s.stageAt)throw Error('That action belongs to an earlier turn.');
 if(s.deadline&&now>=s.deadline)throw Error('That timer has ended.');
 if(action==='docket-ready'&&['docketBriefing','docketBoardIntro','docketVerdict','docketBreak'].includes(s.stage)){ready(s,uid);return {accepted:true};}
 if(action==='docket-select'){
  if(s.stage!=='docketBoard'||uid!==s.selector)throw Error('The selecting counsel chooses the case.');
  const cell=s.cells.find(c=>c.id===payload.clueId&&!c.used);if(!cell)throw Error('Choose an unopened clue.');cell.used=true;
  const q=DOCKET_BY_ID.get(cell.id);s.clue={id:q.id,category:cell.category,value:cell.value,double:secret.docket.doubles.includes(cell.id)};delete s.verdict;
  if(s.clue.double){s.turn=uid;stage(s,'docketDouble',now,45000);tell(s,'double','Sealed stakes! '+name(s,uid)+', choose your wager.',now);}else{s.clue.prompt=q.prompt;reading(s,now);}return {accepted:true};
 }
 if(action==='docket-wager'){
  const raw=String(payload.text).trim(),value=Number(raw.replace(/[$,]/g,''));if(!/^\$?(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(raw)||!Number.isSafeInteger(value))throw Error('Enter a whole-number wager.');
  if(s.stage==='docketDouble'&&s.turn===uid){if(value<5||value>docketWagerMax(s))throw Error('Wager from 5 to '+docketWagerMax(s)+'.');s.clue.wager=value;s.clue.prompt=DOCKET_BY_ID.get(s.clue.id).prompt;reading(s,now);return {accepted:true};}
  if(s.stage==='docketFinalWager'&&s.eligible.includes(uid)){if(s.locked[uid])throw Error('Your wager is sealed.');if(value<0||value>p.score)throw Error('Wager from 0 to your score.');secret.docket.wagers[uid]=value;s.locked[uid]=true;s.revision++;return {accepted:true};}
  throw Error('Wait for your wagering window.');
 }
 if(action==='docket-buzz'){
  if(s.stage==='docketRead'&&!s.clue.double){s.lockouts[uid]=now+250;s.revision++;return {early:true};}
  if(s.stage!=='docketBuzz'||s.attempts[uid]||(s.clue.tiebreak&&!s.tied.includes(uid)))throw Error('Your buzzer is not open.');
  if((s.lockouts[uid]??0)>now)return {early:true};
  s.turn=uid;s.attempts[uid]=true;s.turnOpenedAt=now;stage(s,'docketAnswer',now,20000);tell(s,'buzz',name(s,uid)+', your response?',now);return {accepted:true};
 }
 if(action==='docket-answer'){
  if(containsBlockedLanguage(String(payload.text??'')))throw Error('Keep responses appropriate. Try again.');
  const isFinal=s.stage==='docketFinalAnswer';if(isFinal){if(!s.eligible.includes(uid)||s.locked[uid])throw Error('Your final response is sealed.');const resolution=docketResponse(DOCKET_BY_ID.get(secret.docket.finalId),payload.text);if(resolution.status==='matched'&&!payload.confirmLabel)return {correction:{label:resolution.answer.label,text:payload.text,turn:s.stageAt}};if(payload.confirmLabel&&payload.confirmLabel!==resolution.answer?.label)throw Error('That correction has changed.');secret.docket.answers[uid]=String(payload.text).slice(0,120);s.locked[uid]=true;s.revision++;return {accepted:true};}
  if(s.stage!=='docketAnswer'||s.turn!==uid)throw Error('Wait until your podium lights up.');
  const q=DOCKET_BY_ID.get(s.clue.id),resolution=docketResponse(q,payload.text);
  if(resolution.status==='matched'&&!payload.confirmLabel)return {correction:{label:q.answer,text:payload.text,turn:s.stageAt}};
  if(payload.confirmLabel&&payload.confirmLabel!==resolution.answer?.label)throw Error('That correction has changed.');
  const correct=!!resolution.answer;
  if(s.clue.tiebreak){if(correct){finish(s,now);s.result.winners=[uid];s.result.scores.sort((a,b)=>(b.id===uid?1:0)-(a.id===uid?1:0)||b.score-a.score);s.notice=name(s,uid)+' wins the tiebreak!';s.event.text=s.notice;}else{stage(s,'docketRebound',now,2400);tell(s,'miss','Incorrect. Other tied counsel may ring in.',now);}return {accepted:true};}
  if(correct||s.clue.double){show(s,secret,now,uid,payload.text,correct,s.clue.double?s.clue.wager:s.clue.value);}else{p.score-=s.clue.value;s.wrongResponse=String(payload.text).slice(0,120);stage(s,'docketRebound',now,2800);tell(s,'miss','Incorrect. Other counsel may ring in for '+s.clue.value+'.',now);}return {accepted:true};
 }
 throw Error('That action is not available now.');
}
export function tickDocket(s,secret,now){
 if(['lobby','finish'].includes(s.stage))return false;if(!secret.docket)throw Error('The private docket must be restored before play.');
 if(!crew(s).length)return false;
 if(s.stage==='docketBriefing'&&allReady(s)){board(s,secret,now);return true;}
 if(s.stage==='docketBoardIntro'&&allReady(s)){selection(s,now);return true;}
 if(s.stage==='docketBreak'&&allReady(s)){s.round===1?board(s,secret,now):final(s,secret,now);return true;}
 if(s.stage==='docketFinalWager'&&s.eligible.every(id=>s.locked[id])){finalClue(s,secret,now);return true;}
 if(s.stage==='docketFinalAnswer'&&s.eligible.every(id=>s.locked[id])){revealFinal(s,secret,now);return true;}
 if(s.stage==='docketVerdict'&&now-s.stageAt>=3500&&allReady(s))s.deadline=now;
 if(!s.deadline||now<s.deadline)return false;
 if(s.stage==='docketBoard'){s.selector=crew(s).find(p=>p.id===s.selector)?.id??crew(s)[0].id;const c=s.cells.find(c=>!c.used);actDocket(s,secret,s.selector,'docket-select',{clueId:c.id,matchId:s.matchId,round:s.round,stageAt:s.stageAt},s.deadline-1);return true;}
 if(s.stage==='docketDouble'){s.clue.wager=5;s.clue.prompt=DOCKET_BY_ID.get(s.clue.id).prompt;reading(s,now);return true;}
 if(s.stage==='docketRead'){if(s.clue.double){s.turnOpenedAt=now;stage(s,'docketAnswer',now,20000);tell(s,'answer',name(s,s.turn)+', your response?',now);}else buzz(s,now);return true;}
 if(s.stage==='docketAnswer'){
  if(s.clue.tiebreak){stage(s,'docketRebound',now,2000);}else if(s.clue.double)show(s,secret,now,s.turn,'',false,s.clue.wager);else{s.players.find(p=>p.id===s.turn).score-=s.clue.value;stage(s,'docketRebound',now,2400);tell(s,'timeout','Time. Other counsel may buzz.',now);}return true;
 }
 if(s.stage==='docketRebound'){
  const available=crew(s).some(p=>!s.attempts[p.id]&&(!s.clue.tiebreak||s.tied.includes(p.id)));
  if(available)buzz(s,now);else if(s.clue.tiebreak)tie(s,secret,now);else show(s,secret,now,null,'',false,0);return true;
 }
 if(s.stage==='docketBuzz'){if(s.clue.tiebreak)tie(s,secret,now);else show(s,secret,now,null,'',false,0);return true;}
 if(s.stage==='docketVerdict'){
  if(s.cells.every(c=>c.used)){clearReady(s);stage(s,'docketBreak',now);tell(s,'break',s.round===1?'First board closed. Double stakes next.':'Two boards closed. The final wager awaits.',now);}else selection(s,now);return true;
 }
 if(s.stage==='docketFinalWager'){finalClue(s,secret,now);return true;}
 if(s.stage==='docketFinalRead'){stage(s,'docketFinalAnswer',now,30000);tell(s,'final-answer','Thirty seconds. Seal your final response.',now);return true;}
 if(s.stage==='docketFinalAnswer'){revealFinal(s,secret,now);return true;}
 if(s.stage==='docketFinalReveal'){
  const id=s.finalOrder[s.finalRevealIndex++];if(!id){tie(s,secret,now);return true;}
  const p=s.players.find(p=>p.id===id),q=DOCKET_BY_ID.get(secret.docket.finalId),text=secret.docket.answers[id]??'',correct=!!docketResponse(q,text).answer,wager=secret.docket.wagers[id]??0,before=p.score;
  p.score+=correct?wager:-wager;s.finalRows.push({id,text,correct,wager,before,total:p.score});s.deadline=now+5000;tell(s,'final-unseal',name(s,id)+(correct?' is correct.':' missed.')+' Wager: '+wager+'.',now);return true;
 }
 return false;
}
