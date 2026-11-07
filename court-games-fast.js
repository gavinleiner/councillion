import {CLASH_TIMING} from './court-games-engine.js';
import {CLASH_BY_ID} from './court-games-data.js';
import {buddySprite} from './party-buddy-sprite.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vals=o=>Object.values(o??{});
const teams=['PETITIONERS','RESPONDENTS'];
// The answer turns over first, then its score. The first column stays in place
// during the second review, as it does for the audience in the full show.
export function fastRevealPlan(rows,{second=false,target=200}={}){
 const baseline=second?rows.reduce((n,r)=>n+(Number(vals(r.answers)[0]?.points)||0),0):0;let total=baseline,won=total>=target;
 return {baseline,rows:rows.map((r,i)=>{const answers=vals(r.answers),a=answers[second?1:0]??{label:'',points:0},show=!won,answerAt=CLASH_TIMING.fastRevealStart+i*CLASH_TIMING.fastRevealStep,pointsAt=answerAt+CLASH_TIMING.fastRevealScore;if(show){total+=Number(a.points)||0;won=total>=target;}return {...r,answers,show,answerAt,pointsAt};})};
}
function revealRows(rows,second=false,animated=false,target=200){
 const plan=fastRevealPlan(rows,{second,target});
 return plan.rows.map((r,i)=>`<div class="cg-fast-result" style="--i:${i}"><h3>${esc(r.prompt)}${r.source?` <a class="cg-fast-source" href="${esc(r.source)}" target="_blank" rel="noopener noreferrer" aria-label="Board source">↗</a>`:''}</h3><div>${r.answers.map((a,j)=>{const old=second&&j===0,show=old||!animated||r.show;if(!show)return '<p class="cg-fast-not-needed">VERDICT REACHED</p>';return `<p class="cg-survey-reveal ${old?'is-banked':''}" ${animated&&!old?`data-answer-ms="${r.answerAt}" data-reveal-ms="${r.pointsAt}" data-points="${a.points}"`:''}><span>${esc(a.label||a.text||'No response')}</span><b>${a.points}</b></p>`;}).join('')}</div></div>`).join('');
}
export function fastScene(s,uid,session){
 if(s.stage==='fastIntro')return `<section class="cg-fast-card cg-fast-casting"><p class="cg-eyebrow">${teams[s.winningTeam]} WIN THE MAIN GAME</p><h2>FAST MONEY</h2><p>Choose two counsel to finish the case.<br>Five questions. ${CLASH_TIMING.fastRun/1000} seconds per runner. Get to 200.</p><div class="cg-runner-choices">${s.players.filter(p=>p.team===s.winningTeam&&!p.spectator&&p.connected!==false).map(p=>`<button type="button" data-runner="${esc(p.id)}" ${uid!==s.choicePlayer?'disabled':''} aria-pressed="${s.fastPlayers?.includes(p.id)}">${buddySprite(p.buddy)}<strong>${esc(p.name)}</strong></button>`).join('')}</div><p class="cg-small">Starting automatically in <b data-cc-countdown>${CLASH_TIMING.fastCasting/1000}</b>s. Your captain can change the runners.</p>${uid===s.choicePlayer?'<button class="cg-secondary" data-game-action="fast-start">USE THESE RUNNERS ▸</button>':''}</section>`;
 if(s.stage==='fastFirstReview'&&uid===s.fastPlayers[1])return `<section class="cg-fast-card cg-soundproof"><p class="cg-eyebrow">YOUR TEAMMATE IS AT THE BOARD</p><h2>THE QUIET BENCH.</h2>${buddySprite(s.players.find(p=>p.id===uid)?.buddy)}<p>First answers stay hidden from you.<br>You’re next: five questions, ${CLASH_TIMING.fastRun/1000} seconds.</p><div class="cg-quiet-waves"><i></i><i></i><i></i><i></i><i></i></div></section>`;
 const audience=session?.response?.fastAudience,firstRows=audience?.matchId===s.matchId?vals(audience.rows).map(r=>({prompt:r.prompt,answers:[r]})):[];
 if(s.stage==='fastReview'||s.stage==='fastFirstReview'){
  const first=s.stage==='fastFirstReview',rows=first?firstRows:vals(s.fast?.rows),second=!first&&s.fastPass===1,plan=fastRevealPlan(rows,{second,target:s.fastTarget});
  return `<section class="cg-fast-card cg-fast-results"><p class="cg-eyebrow">${first||!second?'FIRST COUNSEL · SURVEY SAYS':'SECOND COUNSEL · SURVEY SAYS'}</p><h2 data-fast-verdict>LET’S SEE IT.</h2><div class="cg-fast-total"><span data-fast-running-total data-baseline="${plan.baseline}">${plan.baseline}</span><small>/ ${s.fastTarget??200}</small></div><div class="cg-fast-goal"><i data-fast-goal></i></div>${rows.length?revealRows(rows,second,true,s.fastTarget):'<p>Preparing the survey board…</p>'}</section>`;
 }
 const mine=s.turn===uid,preparing=['fastReady','fastRead'].includes(s.stage),read=s.stage==='fastRead';
 if(!mine&&s.fastPass===1&&firstRows.length)return `<section class="cg-fast-card cg-fast-results cg-fast-audience"><p class="cg-eyebrow">SECOND COUNSEL IS ${preparing?'GETTING READY':'ANSWERING'} · KEEP THE BENCH QUIET</p><h2>FIRST RUN ON THE BOARD.</h2><div class="cg-fast-total">${s.fast.total}<small>/ ${s.fastTarget}</small></div>${revealRows(firstRows)}<p class="cg-small">${esc(s.players.find(p=>p.id===s.turn)?.name)} cannot see this column. No help from the bench.</p></section>`;
 if(preparing&&mine)return `<section class="cg-fast-card cg-fast-ready"><p class="cg-eyebrow">RUN ${s.fastPass+1} · ${read?'READ THE FIRST QUESTION':'YOUR CLOCK HAS NOT STARTED'}</p><h2>${read?'LISTEN UP.':'YOUR RUN BEGINS IN'}</h2>${read?`<h3>${esc(CLASH_BY_ID.get(vals(s.fastIds)[0]).prompt)}</h3><p class="cg-small">Your ${CLASH_TIMING.fastRun/1000} seconds start after this read.</p>`:`<strong class="cc-countdown-number" data-cc-countdown>3</strong>${s.fastPass===1?`<div class="cg-fast-total">${s.fast.total}<small>BANKED · NEED ${Math.max(0,s.fastTarget-s.fast.total)} MORE</small></div>`:''}<p>Five questions. ${CLASH_TIMING.fastRun/1000} seconds.<br>${s.fastPass===1?'Give different answers from your teammate.<br>':''}Enter to submit. Pass to return later.</p>`}</section>`;
 return `<section class="cg-fast-card cg-fast-run"><p class="cg-eyebrow">RUN ${s.fastPass+1} · ${mine?'YOU’RE UP':'ANSWERS SEALED'}</p><h2>${mine?'THINK FAST.':'GIVE COUNSEL SOME ROOM.'}</h2>${mine?`<form id="cg-fast-form"><div class="cg-fast-progress" aria-label="Five questions"></div><p class="cg-fast-position"></p><h3 class="cg-fast-prompt"></h3><label class="sr-only" for="fast0">Your Fast Money answer</label><input class="field" id="fast0" name="fast0" maxlength="40" autocomplete="off" spellcheck="false" placeholder="First thing that comes to mind…"><p class="cg-fast-feedback" role="status"></p><div class="cg-fast-buttons"><button class="cg-secondary" type="button" data-fast-pass>PASS ↷</button><button class="cg-primary" type="submit">NEXT ▸</button></div><p class="cg-small">Enter to answer. Pass to come back if there’s time.</p></form>`:`<div class="cg-fast-waiting">${buddySprite(s.players.find(p=>p.id===s.turn)?.buddy)}<p>${esc(s.players.find(p=>p.id===s.turn)?.name)} is ${preparing?'getting ready':'answering'}.<br>One question at a time. No help from the bench.</p></div>`}<p id="cg-inline-error" class="cg-error" role="alert"></p></section>`;
}
// A single input remains mounted for the run. Only its question, id and value change.
export class FastRun{
 constructor(form,s,session,onError){
  Object.assign(this,{form,session,onError,pass:s.fastPass,match:s.matchId,ids:vals(s.fastIds),values:['','','','',''],cursor:0,passed:[],lap:0});
  const saved=session.response?.secret?.fastDraft;if(saved?.pass===this.pass){this.values=Array.from({length:5},(_,i)=>vals(saved.values)[i]??'');this.cursor=saved.cursor??0;this.passed=vals(saved.passed);this.lap=saved.lap??0;}
  this.input=form.querySelector('input');this.submit=form.querySelector('button[type=submit]');this.skip=form.querySelector('[data-fast-pass]');
  form.onsubmit=e=>{e.preventDefault();this.step(false);};this.skip.onclick=()=>this.step(true);
  this.input.oninput=()=>{this.correction=null;this.submit.textContent='NEXT ▸';this.form.querySelector('.cg-fast-feedback').textContent='';this.values[this.cursor]=this.input.value;clearTimeout(this.timer);const wait=Math.max(0,170-(performance.now()-(this.lastSave??0)));if(wait)this.timer=setTimeout(()=>this.save(),wait);else this.save();};
  this.paint();
 }
 patch(extra={}){return {values:this.values.slice(),pass:this.pass,cursor:this.cursor,passed:this.passed.slice(),lap:this.lap,...extra};}
 save(){if(!this.disposed&&!this.correction&&this.waiting===undefined&&this.queuedStep===undefined){this.lastSave=performance.now();this.session.request('fast-draft',this.patch()).catch(this.onError);}}
 step(pass){
  if(this.waiting!==undefined||this.finishing)return;
  if(this.session.pending){this.queuedStep=pass;this.input.readOnly=true;clearTimeout(this.timer);return;}
  pass=pass||!this.input.value.trim();clearTimeout(this.timer);this.values[this.cursor]=pass?'':this.input.value.trim();this.passClick=pass;this.waiting=this.cursor;this.beforeAck=this.session.lastAck;
  const confirmLabel=!pass&&this.correction?.text===this.values[this.cursor]?this.correction.label:undefined;this.correction=null;this.input.readOnly=true;
  this.form.querySelector('.cg-fast-feedback').textContent='SENDING…';this.session.request('fast-draft',this.patch({checkIndex:this.cursor,...(confirmLabel?{confirmLabel}:{})})).catch(e=>{this.waiting=undefined;this.input.readOnly=false;this.submit.disabled=false;this.skip.disabled=false;this.onError(e);});
 }
 update(s,session){
  this.session=session;
  if(this.queuedStep!==undefined&&!session.pending){const pass=this.queuedStep;this.queuedStep=undefined;this.step(pass);return;}
  if(this.waiting!==undefined&&session.lastAck!==this.beforeAck){
   const result=session.lastResult;
   if(result?.error){this.waiting=undefined;this.onError(Error(result.error));}
   else if(result?.checked===this.waiting){
    if(result.correction){this.correction=result.correction;this.waiting=undefined;this.form.querySelector('.cg-fast-feedback').textContent='Did you mean “'+result.correction.label+'”? Enter to accept, or edit your answer.';this.submit.textContent='CONFIRM ↵';this.input.focus({preventScroll:true});}
    else if(result.retry?.length){this.form.querySelector('.cg-fast-feedback').textContent='ALREADY SAID. TRY ANOTHER.';this.input.select();this.waiting=undefined;}
    else if(result.saved){const i=this.waiting;this.values[i]=result.value??this.values[i];this.waiting=undefined;this.form.querySelector('.cg-fast-feedback').textContent='';this.submit.textContent='NEXT ▸';this.advance();}
   }
  }
  if(this.finishing&&!session.pending&&session.lastAck!==this.finishAck&&session.lastResult?.error){this.finishing=false;this.onError(Error(session.lastResult.error));}
  if(this.finishing&&!session.pending&&session.lastResult?.retry?.length){this.finishing=false;this.cursor=session.lastResult.retry[0];this.passed=vals(session.lastResult.retry);this.lap=1;this.paint();this.form.querySelector('.cg-fast-feedback').textContent='ALREADY SAID. TRY ANOTHER.';}
  const disabled=this.waiting!==undefined||this.finishing||this.queuedStep!==undefined;this.submit.disabled=disabled;this.skip.disabled=disabled;this.input.readOnly=!!disabled;
 }
 advance(){
  if(this.lap===0){if(this.passClick)this.passed.push(this.cursor);if(this.cursor<4)this.cursor++;else if(this.passed.length){this.lap=1;this.cursor=this.passed[0];}else return this.finish();}
  else{this.passed=this.passed.filter(i=>i!==this.cursor);if(this.passed.length)this.cursor=this.passed[0];else return this.finish();}
  this.paint();this.save();
 }
 finish(){this.finishAck=this.session.lastAck;this.finishing=true;this.form.querySelector('.cg-fast-feedback').textContent='ANSWERS SEALED.';this.submit.disabled=true;this.skip.disabled=true;this.session.request('fast',{values:this.values.slice(),pass:this.pass,matchId:this.match}).catch(e=>{this.finishing=false;this.onError(e);});}
 paint(){
  this.input.id='fast'+this.cursor;this.input.name='fast'+this.cursor;this.input.value=this.values[this.cursor];this.form.querySelector('label').htmlFor=this.input.id;
  this.form.querySelector('.cg-fast-prompt').textContent=CLASH_BY_ID.get(this.ids[this.cursor]).prompt;
  this.form.querySelector('.cg-fast-position').textContent=(this.lap?'BACK TO A PASSED QUESTION · ':'QUESTION ')+(this.cursor+1)+' / 5';
  this.form.querySelector('.cg-fast-progress').innerHTML=this.ids.map((_,i)=>'<i class="'+(i===this.cursor?'current':this.values[i]?'answered':this.passed.includes(i)?'passed':'')+'"></i>').join('');
  this.input.focus({preventScroll:true});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)this.form.querySelector('.cg-fast-prompt').animate([{opacity:0,transform:'translateX(12px)'},{opacity:1,transform:'none'}],{duration:240});
 }
 dispose(){this.disposed=true;clearTimeout(this.timer);}
}

