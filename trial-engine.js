import {TRIAL_BY_ID,TRIAL_GAMES,TRIAL_GAME_IDS,TRIAL_TIMING as T,trialDeck,trialOptions,TRIAL_ESCAPE_SETS,TRIAL_ESCAPE_BY_ID,escapeDraw} from './trial-data.js';
const vals=x=>Object.values(x??{}),copy=x=>JSON.parse(JSON.stringify(x));
export const trialPlayers=s=>s.players.filter(p=>!p.spectator);
const online=s=>trialPlayers(s).filter(p=>p.connected!==false&&p.online!==false);
export function trialSettings(v={}){return {length:['standard','tour'].includes(v.length)?v.length:'standard',seconds:[15,20,25].includes(v.seconds)?v.seconds:20};}
export function validTrialSettings(v){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['length','seconds'].includes(k)))throw Error('Choose a listed trial setting.');const safe=trialSettings(v);for(const k of Object.keys(v))if(safe[k]!==v[k])throw Error('Choose a listed trial setting.');return safe;}
function random(ref){ref.seed=(Math.imul(ref.seed,1664525)+1013904223)>>>0;return ref.seed/4294967296;}
const shuffle=(a,ref)=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(random(ref)*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;};
const integer=(ref,n)=>Math.floor(random(ref)*n);
function phase(s,name,now,ms=0){s.stage=name;s.stageAt=now;s.deadline=ms?now+ms:0;s.phase=name==='finish'?'ended':name==='lobby'?'lobby':name.endsWith('reveal')||name==='trial-verdict'?'burst':'playing';s.locked={};s.revision++;}
function event(s,type,text,now,extra={}){s.eventSerial=(s.eventSerial??0)+1;s.notice=text;s.event={id:s.eventSerial,type,text,at:now,...extra};s.revision++;}
function publicQuestion(q,ref){const options=trialOptions(q,()=>random(ref));ref.correct=options.find(o=>o.text===q.answer).id;return {id:q.id,prompt:q.prompt,category:q.category,subject:q.subject,options};}
export function normalizeTrial(ref){if(!ref)return ref;for(const k of ['deck','challengeDeck','escapeDeck','pattern','poisoners','poison','math','mirrorOptions'])ref[k]=vals(ref[k]);for(const row of ref.math)row.options=vals(row.options);for(const row of ref.mirrorOptions)row.cells=vals(row.cells);ref.answers??={};ref.entries??={};for(const e of Object.values(ref.entries)){if(e.sequence)e.sequence=vals(e.sequence);if(e.dice)e.dice=vals(e.dice);}ref.forfeits??={};if(ref.escape)ref.escape.options=vals(ref.escape.options);return ref;}
export function normalizeTrialState(s){for(const k of ['history','questionIds','atRisk','trialRows','verdictRows','escapeRows','standings','lastDeaths'])s[k]=vals(s[k]);s.locked??={};s.stats??={};if(s.question)s.question.options=vals(s.question.options);if(s.challenge){s.challenge.pattern=vals(s.challenge.pattern);s.challenge.poisoners=vals(s.challenge.poisoners);s.challenge.mirrorPattern=vals(s.challenge.mirrorPattern);s.challenge.mirrorOptions=vals(s.challenge.mirrorOptions).map(o=>({...o,cells:vals(o.cells)}));}if(s.escape){s.escape.options=vals(s.escape.options);s.escape.positions??={};s.escape.caught??={};}if(s.result)s.result.rows=vals(s.result.rows);return s;}
export function startTrial(s,secret,now=Date.now(),rng=Math.random){
 const crew=online(s);if(crew.length<2||crew.length>8)throw Error('Trial by Puffer needs two to eight players.');
 if(crew.some(p=>!p.ready))throw Error('Wait for everyone to ready up.');
 s.settings=trialSettings(s.settings);s.matchId=crypto.randomUUID();s.round=0;s.part='trial';s.history=[];s.question=null;s.challenge=null;s.result=null;s.escape=null;s.atRisk=[];s.trialRows=[];s.verdictRows=[];s.lastDeaths=[];s.stats={};
 for(const p of s.players){p.spectator=!crew.some(c=>c.id===p.id);p.alive=true;p.cash=1000;p.score=0;if(!p.spectator)s.stats[p.id]={correct:0,survived:0,haunts:0,lifeSteals:0,escapeMarks:0};}
 const ref=secret.trial={seed:Math.floor(rng()*4294967295),deck:trialDeck(rng),challengeDeck:[],escapeDeck:[],index:0,trialIndex:0,answers:{},entries:{},forfeits:{},lastGame:null};
 ref.challengeDeck=shuffle(TRIAL_GAME_IDS,ref);ref.escapeDeck=shuffle(TRIAL_ESCAPE_SETS.map(q=>q.id),ref);
 if(s.settings.length==='tour')ref.challengeDeck=[...TRIAL_GAME_IDS];
 phase(s,'trial-intro',now,T.intro);event(s,'intro','Correct answers buy freedom. Wrong answers earn a survival trial. Death is only a change of strategy.',now);return true;
}
function nextQuestion(s,ref,now){
 s.round++;s.part='trial';s.challenge=null;s.verdictRows=[];s.trialRows=[];s.lastDeaths=[];s.atRisk=[];ref.answers={};ref.entries={};ref.forfeits={};
 const q=TRIAL_BY_ID.get(ref.deck[ref.index++%ref.deck.length]);s.question=publicQuestion(q,ref);
 phase(s,'trial-question',now,s.settings.seconds*1000);s.focusOpenedAt=now;event(s,'question','All counsel—including ghosts—answer privately. Choose A, B, C or D.',now);
}
function revealQuestion(s,ref,now){
 const q=TRIAL_BY_ID.get(s.question.id);s.atRisk=[];s.trialRows=[];
 for(const p of trialPlayers(s)){const answer=ref.answers[p.id],right=answer===ref.correct&&!ref.forfeits[p.id];if(right){p.cash+=1000;p.score+=1000;s.stats[p.id].correct++;}else if(p.alive)s.atRisk.push(p.id);s.trialRows.push({id:p.id,choice:answer??null,correct:right,ghost:!p.alive,points:right?1000:0});}
 s.answerReveal={correct:ref.correct,text:q.answer,source:q.source};s.history.push({kind:'trivia',round:s.round,id:q.id,...s.answerReveal,rows:copy(s.trialRows)});
 phase(s,'trial-answer-reveal',now,T.answerReveal);event(s,'answer',s.atRisk.length?s.atRisk.length+' living counsel face the survival floor.':'Everyone living is safe. The magistrate is disappointed.',now);
}
function mathTask(ref){const a=2+integer(ref,18),b=2+integer(ref,12),op=integer(ref,3);const answer=op===0?a+b:op===1?a*b:a+b-b%3;const prompt=op===0?a+' + '+b:op===1?a+' × '+b:a+' + '+b+' − '+b%3;const choices=new Set([answer]);while(choices.size<4)choices.add(answer+(integer(ref,11)-5||6));const options=shuffle([...choices],ref).map((text,i)=>({id:String(i),text:String(text)}));return {prompt,options,correct:options.find(o=>Number(o.text)===answer).id};}
function grid(ref){return shuffle([0,1,2,3,4,5,6,7,8],ref).slice(0,4).sort((a,b)=>a-b);}
const reflected=cells=>cells.map(n=>Math.floor(n/3)*3+2-n%3).sort((a,b)=>a-b);
function beginChallenge(s,ref,now){
 let kind=ref.challengeDeck[ref.trialIndex++%ref.challengeDeck.length];if(['greed','bids'].includes(kind)&&s.atRisk.length<2)kind='mirror';
 ref.lastGame=kind;ref.entries={};ref.pattern=shuffle([0,1,2,3,4,5,6,7],ref).slice(0,5);ref.math=Array.from({length:32},()=>mathTask(ref));
 ref.poisoners=shuffle(trialPlayers(s).filter(p=>!s.atRisk.includes(p.id)&&p.online!==false&&p.connected!==false).map(p=>p.id),ref).slice(0,2);ref.poison=[integer(ref,6)];ref.mirrorPattern=grid(ref);
 const good=reflected(ref.mirrorPattern),seen=new Set([good.join(',')]),grids=[good];while(grids.length<4){const g=grid(ref),key=g.join(',');if(!seen.has(key)){seen.add(key);grids.push(g);}}
 ref.mirrorOptions=shuffle(grids,ref).map((cells,i)=>({id:String(i),cells}));ref.mirrorCorrect=ref.mirrorOptions.find(o=>o.cells.join(',')===good.join(',')).id;
 s.challenge={kind,...TRIAL_GAMES[kind],pattern:[],poisoners:ref.poisoners,mirrorPattern:ref.mirrorPattern,mirrorOptions:ref.mirrorOptions};s.verdictRows=[];s.lastDeaths=[];
 phase(s,'trial-brief',now,T.brief);event(s,'challenge',TRIAL_GAMES[kind].name+'. '+TRIAL_GAMES[kind].instructions,now);
}
function openChallenge(s,ref,now){
 if(s.challenge.kind==='memory'){s.challenge.pattern=[...ref.pattern];phase(s,'trial-watch',now,T.watch);event(s,'watch','Look carefully. Five pieces. One order. The chain will disappear.',now);}
 else activateChallenge(s,ref,now);
}
function activateChallenge(s,ref,now){s.challenge.pattern=[];phase(s,'trial-challenge',now,s.challenge.seconds*1000);s.focusOpenedAt=now;event(s,'play',s.challenge.kind==='cups'?'Poisoners: choose secretly. Defendants: pick your chalice.':s.challenge.instructions,now);}
function kill(s,p){if(p.alive){p.alive=false;s.lastDeaths.push(p.id);}}
const entry=(ref,id)=>ref.entries[id]??{};
function decideChallenge(s,ref,now){
 const kind=s.challenge.kind,risk=s.atRisk,rows=[],poison=ref.poisoners.length?[...new Set(ref.poisoners.map(id=>entry(ref,id).choice).filter(Number.isInteger))]:ref.poison;
 const submitted= risk.filter(id=>entry(ref,id).submitted&&!ref.forfeits[id]),scores=risk.map(id=>entry(ref,id).score??0),lowest=Math.min(...scores);
 if(!poison.length)poison.push(...ref.poison);
 const allSteal=submitted.length===risk.length&&risk.every(id=>entry(ref,id).choice==='steal'),anySteal=risk.some(id=>entry(ref,id).choice==='steal');
 const bids=risk.map(id=>entry(ref,id).submitted?entry(ref,id).choice:0),lowBid=Math.min(...bids);
 for(const p of trialPlayers(s)){
  const e=entry(ref,p.id),defendant=risk.includes(p.id);let survived=false,detail='',value=e.score??null,bonus=0;
  if(kind==='memory'){survived=e.submitted&&e.sequence?.join(',')===ref.pattern.join(',');detail=e.submitted?(survived?'Chain preserved':'Wrong evidence order'):'No chain sealed';}
  if(kind==='maths'){value=e.score??0;survived=risk.length===1?value>=3:value>lowest;detail=value+' correct marks';if(risk.length>1&&scores.every(n=>n===scores[0])&&lowest>=3)survived=true;}
  if(kind==='cups'){value=e.choice;survived=e.submitted&&Number.isInteger(e.choice)&&!poison.includes(e.choice);detail=e.submitted?'Chalice '+(e.choice+1)+(survived?' · clean':' · poisoned'):'No drink chosen';if(ref.poisoners.includes(p.id)){bonus=risk.filter(id=>entry(ref,id).choice===e.choice).length*300;detail='Poisoned chalice '+(Number.isInteger(e.choice)?e.choice+1:'—');}}
  if(kind==='greed'){survived=e.submitted&&(!anySteal||e.choice==='steal'&&!allSteal);detail=e.submitted?String(e.choice).toUpperCase():'No plea sealed';if(!defendant&&e.submitted){const total=risk.filter(id=>entry(ref,id).choice==='steal').length;bonus=e.choice===total?500:0;detail='Predicted '+e.choice+' thieves';}}
  if(kind==='bids'){const bid=e.submitted?e.choice:0;survived=e.submitted&&bid>lowBid;value=bid;detail=defendant?'Bid $'+bid:'Predicted lowest bid';if(defendant)p.cash=Math.max(0,p.cash-bid);else if(e.submitted&&risk.includes(e.choice)&&entry(ref,e.choice).choice===lowBid)bonus=500;}
  if(kind==='pulse'){value=e.error??1;survived=e.attempts>0&&value<=.145;detail=e.attempts?'Best precision '+Math.round((1-value)*100)+'%':'Never stopped the needle';}
  if(kind==='dice'){const dice=e.dice??[],target=({1:4,2:7,3:9})[dice.length]??99,total=dice.reduce((a,b)=>a+b,0);survived=e.submitted&&!dice.includes(1)&&total>=target;value=total;detail=dice.length?dice.join(' + ')+' = '+total+(dice.includes(1)?' · rolled a 1':' · needed '+target):'No dice rolled';if(survived)bonus=dice.length*150;}
  if(kind==='mirror'){survived=e.submitted&&e.choice===ref.mirrorCorrect;detail=e.submitted?(survived?'Exact reflection':'Decoy selected'):'No reflection selected';}
  if(ref.forfeits[p.id]){survived=false;detail='Answer forfeited after leaving the game tab';bonus=0;}
  if(defendant){if(!survived)kill(s,p);else{s.stats[p.id].survived++;bonus+=250;}}
  else if(survived&&!['cups','greed','bids'].includes(kind))bonus+=200;
  if(bonus>0){p.cash+=bonus;if(!p.alive&&!defendant)s.stats[p.id].haunts++;}
  rows.push({id:p.id,defendant,survived:!defendant||survived,detail,value,bonus,ghost:!p.alive});
 }
 s.verdictRows=rows;s.challenge.solution=kind==='memory'?ref.pattern:kind==='cups'?poison:kind==='mirror'?ref.mirrorCorrect:null;
 s.history.push({kind:'survival',game:kind,round:s.round,deaths:[...s.lastDeaths],rows:copy(rows)});
 phase(s,'trial-verdict',now,T.verdict);event(s,'sentence',s.lastDeaths.length?s.lastDeaths.map(id=>s.players.find(p=>p.id===id).name).join(', ')+' became '+(s.lastDeaths.length===1?'a ghost.':'ghosts.')+' You still play.':'The defense survives. For now.',now,{deaths:[...s.lastDeaths]});
}
function afterRound(s,ref,now){
 const alive=trialPlayers(s).filter(p=>p.alive),end=s.settings.length==='tour'?s.round>=8:s.round>=8||alive.length===0||s.round>=4&&alive.length<=1;
 if(end)return beginEscape(s,ref,now);
 phase(s,'trial-transition',now,T.transition);event(s,'transition','Back to the witness box. Ghosts still earn cash on every question.',now);
}
function beginEscape(s,ref,now){
 const rows=trialPlayers(s).sort((a,b)=>b.cash-a.cash),eligible=rows.filter(p=>p.connected!==false&&p.online!==false),living=eligible.filter(p=>p.alive),soul=(living[0]??eligible[0]??rows[0]).id;
 for(const p of rows)p.alive=p.id===soul;
 s.part='escape';s.question=null;s.challenge=null;s.escape={soul,positions:Object.fromEntries(rows.map((p,i)=>[p.id,p.id===soul?5:Math.max(0,3-i)])),caught:{},dark:-5,goal:24,turn:0,options:[],gate:false};s.escapeRows=[];ref.answers={};ref.gateShown=false;
 phase(s,'trial-escape-intro',now,T.escapeIntro);event(s,'escape-intro',s.players.find(p=>p.id===soul).name+' holds the only life. Ghosts get an extra choice. Pass the living counsel to steal their life. Escape requires all three judgments at the gate.',now);
}
function nextEscape(s,ref,now){
 s.escape.turn++;s.round++;ref.answers={};ref.forfeits={};
 const q=TRIAL_ESCAPE_BY_ID.get(ref.escapeDeck[(s.escape.turn-1)%ref.escapeDeck.length]),options=escapeDraw(q,()=>random(ref));
 ref.escape={id:q.id,options};s.escape.prompt=q.prompt;s.escape.options=options.map(({correct,...o})=>o);s.escape.gate=(s.escape.positions[s.escape.soul]??0)>=s.escape.goal;s.escape.questionId=q.id;s.escapeRows=[];
 phase(s,'trial-escape-question',now,T.escapeQuestion+(s.escape.gate?2000:0));s.focusOpenedAt=now;event(s,'escape-question','Select every item that belongs. Then seal. '+(s.escape.gate?'The barrier needs all THREE judgments right.':'The living counsel sees two items; ghosts see three.'),now);
}
function endTrial(s,now,winner=null){
 const rows=trialPlayers(s).map(p=>({id:p.id,cash:p.cash,score:p.score,escaped:p.id===winner,stats:s.stats[p.id]})).sort((a,b)=>Number(b.escaped)-Number(a.escaped)||b.cash-a.cash);
 s.result={winner,escaped:!!winner,rows};phase(s,'finish',now);event(s,'finish',winner?s.players.find(p=>p.id===winner).name+' escaped the court. The magistrate will remember this.':'The court swallowed every last counsel. Nobody escaped.',now);
}
function resolveEscape(s,ref,now){
 const oldSoul=s.escape.soul,rows=[];
 for(const p of trialPlayers(s)){if(s.escape.caught[p.id])continue;const visible=p.id===oldSoul&&!s.escape.gate?2:3,answer=ref.answers[p.id];let marks=0;
  if(Number.isInteger(answer)&&!ref.forfeits[p.id])for(let i=0;i<visible;i++)if(Boolean(answer&(1<<i))===ref.escape.options[i].correct)marks++;
  const from=s.escape.positions[p.id]??0,rawTo=from+marks,to=Math.min(s.escape.goal,rawTo);s.escape.positions[p.id]=to;s.stats[p.id].escapeMarks+=marks;rows.push({id:p.id,from,to,rawTo,marks,visible,sealed:Number.isInteger(answer),mask:answer??null});}
 const contenders=rows.filter(r=>r.id!==oldSoul&&r.rawTo>(rows.find(row=>row.id===oldSoul)?.rawTo??s.escape.positions[oldSoul])).sort((a,b)=>b.rawTo-a.rawTo||s.players.find(p=>p.id===b.id).cash-s.players.find(p=>p.id===a.id).cash||a.id.localeCompare(b.id));
 if(contenders.length){s.escape.soul=contenders[0].id;s.stats[s.escape.soul].lifeSteals++;}
 for(const p of trialPlayers(s))p.alive=p.id===s.escape.soul;
 if(s.escape.turn>=3)s.escape.dark+=2;
 for(const row of rows)if(row.to<=s.escape.dark)s.escape.caught[row.id]=true;
 s.escapeRows=rows;s.escape.reveal=ref.escape.options.map(o=>({...o}));s.escape.source=TRIAL_ESCAPE_BY_ID.get(ref.escape.id).source;
 s.history.push({kind:'escape',round:s.round,id:ref.escape.id,rows:copy(rows),oldSoul,soul:s.escape.soul,dark:s.escape.dark});
 ref.pendingWinner=null;const soulRow=rows.find(r=>r.id===s.escape.soul);
 if(ref.gateShown&&soulRow&&soulRow.to>=s.escape.goal&&soulRow.visible===3&&soulRow.marks===3&&!s.escape.caught[s.escape.soul])ref.pendingWinner=s.escape.soul;
 phase(s,'trial-escape-run',now,T.escapeRun);event(s,oldSoul!==s.escape.soul?'life-steal':'escape-run',oldSoul!==s.escape.soul?s.players.find(p=>p.id===s.escape.soul).name+' STOLE THE LIFE.':s.escape.gate?'The seal judges every choice.':'Move one stone for every correct judgment. The dark is catching up.',now,{oldSoul,soul:s.escape.soul});
}
export function trialReceipt(s,secret,uid){
 const ref=secret.trial;if(!ref||!s.matchId)return null;const e=entry(ref,uid),kind=s.challenge?.kind;
 const receipt={matchId:s.matchId,stageAt:s.stageAt,locked:!!s.locked?.[uid],role:s.atRisk?.includes(uid)?'defendant':ref.poisoners?.includes(uid)&&kind==='cups'?'poisoner':'gallery',submitted:!!e.submitted,choice:e.choice??null,sequence:e.sequence??[],score:e.score??0,attempts:e.attempts??0,error:e.error??null,dice:e.dice??[],answer:ref.answers?.[uid]??null};
 if(kind==='maths'&&s.stage==='trial-challenge'){const q=ref.math[(e.index??0)%ref.math.length];receipt.task={index:e.index??0,prompt:q.prompt,options:q.options};receipt.retryAt=e.retryAt??0;receipt.last=e.last??null;}
 return receipt;
}
function requireContext(s,p,now){if(p.matchId!==s.matchId||p.round!==s.round||p.stageAt!==s.stageAt)throw Error('That action belongs to an earlier trial.');if(!s.deadline||now>=s.deadline)throw Error('That timer has ended.');}
export function actTrial(s,secret,uid,action,p={},now=Date.now()){
 const actor=online(s).find(x=>x.id===uid);if(!actor)throw Error('Only seated, connected counsel can act.');
 const ref=secret.trial;if(!ref)throw Error('Wait for the magistrate.');requireContext(s,p,now);
 if(action==='trial-answer'){
  if(s.stage!=='trial-question')throw Error('Wait for a trivia question.');if(s.locked[uid])return {duplicate:true};if(!s.question.options.some(o=>o.id===String(p.choice)))throw Error('Choose a listed answer.');
  ref.answers[uid]=String(p.choice);s.locked[uid]=true;s.revision++;return {accepted:true};
 }
 if(action==='trial-escape'){
  if(s.stage!=='trial-escape-question'||s.escape.caught[uid])throw Error('You cannot answer this escape question.');if(s.locked[uid])return {duplicate:true};
  const visible=uid===s.escape.soul&&!s.escape.gate?2:3;if(!Number.isInteger(p.mask)||p.mask<0||p.mask>=(1<<visible))throw Error('Choose from your visible escape answers.');
  ref.answers[uid]=p.mask;s.locked[uid]=true;s.revision++;return {accepted:true};
 }
 if(action!=='trial-play'||s.stage!=='trial-challenge')throw Error('Wait for a survival trial.');
 const e=ref.entries[uid]??={index:0,score:0,attempts:0},kind=s.challenge.kind,defendant=s.atRisk.includes(uid);if(ref.forfeits[uid])throw Error('Your answer was forfeited. Stay on the game tab.');
 if(kind==='maths'){
  if(now<(e.retryAt??0))return {cooldown:true};if(p.index!==e.index)return {stale:true};
  const task=ref.math[e.index%ref.math.length];if(!task.options.some(o=>o.id===String(p.choice)))throw Error('Choose a listed result.');
  const right=String(p.choice)===task.correct;e.score=Math.max(0,e.score+(right?1:-1));e.index++;e.last=right?'correct':'wrong';e.retryAt=now+(right?300:900);s.revision++;return {accepted:true,right};
 }
 if(kind==='pulse'){
  if(e.attempts>=3)return {duplicate:true};if(now-(e.lastAt??-Infinity)<750)return {cooldown:true};
  // Use the referee's synchronized clock. No client-supplied score or needle value is trusted.
  const elapsed=(now-s.stageAt)%2600/2600,value=(1-Math.cos(elapsed*2*Math.PI))/2,error=Math.abs(.5-value);
  e.error=Math.min(e.error??1,error);e.attempts++;e.lastAt=now;e.submitted=true;if(e.attempts>=3)s.locked[uid]=true;s.revision++;return {accepted:true,error:e.error};
 }
 if(e.submitted&&!(kind==='cups'&&ref.poisoners.includes(uid)))return {duplicate:true};
 if(kind==='memory'){if(!Array.isArray(p.sequence)||p.sequence.length!==5||p.sequence.some(n=>!Number.isInteger(n)||n<0||n>7))throw Error('Seal a chain of five pieces of evidence.');e.sequence=[...p.sequence];}
 else if(kind==='mirror'){if(!ref.mirrorOptions.some(o=>o.id===String(p.choice)))throw Error('Choose a reflection.');e.choice=String(p.choice);}
 else if(kind==='cups'){if(!Number.isInteger(p.choice)||p.choice<0||p.choice>5)throw Error('Choose one of the six chalices.');e.choice=p.choice;}
 else if(kind==='greed'){if(defendant&&!['share','steal'].includes(p.choice)||!defendant&&(!Number.isInteger(p.choice)||p.choice<0||p.choice>s.atRisk.length))throw Error('Choose a listed plea or prediction.');e.choice=p.choice;}
 else if(kind==='bids'){if(defendant&&(!Number.isInteger(p.choice)||p.choice<0||p.choice>Math.min(500,actor.cash))||!defendant&&!s.atRisk.includes(p.choice))throw Error('Choose a valid sealed bid or prediction.');e.choice=p.choice;}
 else if(kind==='dice'){if(!Number.isInteger(p.count)||p.count<1||p.count>3)throw Error('Choose one to three dice.');e.dice=Array.from({length:p.count},()=>1+integer(ref,6));}
 else throw Error('That challenge is not open.');
 e.submitted=true;s.locked[uid]=true;s.revision++;return {accepted:true};
}
export function sentenceTrialTabSwitch(s,secret,uid){
 const ref=secret.trial;if(!ref)return 'ANSWER FORFEITED';ref.forfeits[uid]=true;delete ref.answers[uid];ref.entries[uid]={submitted:true,forfeit:true};s.locked[uid]=true;return 'ANSWER FORFEITED · THE COURT NOTICED';
}
export function tickTrial(s,secret,now=Date.now()){
 const ref=secret.trial;if(!ref||s.stage==='finish'||s.stage==='lobby')return false;
 const everyone=(s.stage==='trial-escape-question'?online(s).filter(p=>!s.escape.caught[p.id]):online(s)).every(p=>s.locked[p.id]);
 if((s.stage==='trial-question'||s.stage==='trial-escape-question')&&everyone&&now-s.stageAt>=(s.stage==='trial-question'?Math.max(6000,Math.min(11000,s.question.prompt.split(/\s+/).length*275+600)):6000)){s.stage==='trial-question'?revealQuestion(s,ref,now):resolveEscape(s,ref,now);return true;}
 if(!s.deadline||now<s.deadline)return false;
 switch(s.stage){
 case 'trial-intro':case 'trial-transition':nextQuestion(s,ref,now);break;
 case 'trial-question':revealQuestion(s,ref,now);break;
 case 'trial-answer-reveal':s.atRisk.length?beginChallenge(s,ref,now):afterRound(s,ref,now);break;
 case 'trial-brief':openChallenge(s,ref,now);break;
 case 'trial-watch':activateChallenge(s,ref,now);break;
 case 'trial-challenge':decideChallenge(s,ref,now);break;
 case 'trial-verdict':afterRound(s,ref,now);break;
 case 'trial-escape-intro':case 'trial-gate':nextEscape(s,ref,now);break;
 case 'trial-escape-question':resolveEscape(s,ref,now);break;
 case 'trial-escape-run':
  if(ref.pendingWinner){endTrial(s,now,ref.pendingWinner);break;}
  if(trialPlayers(s).every(p=>s.escape.caught[p.id])||s.escape.turn>=30){endTrial(s,now);break;}
  if((s.escape.positions[s.escape.soul]??0)>=s.escape.goal&&!ref.gateShown){ref.gateShown=true;phase(s,'trial-gate',now,T.gate);event(s,'gate','THE FINAL SEAL. Every choice must be judged correctly to escape.',now);}else nextEscape(s,ref,now);break;
 default:return false;
 }
 return true;
}
