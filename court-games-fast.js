import {CLASH_BY_ID} from './court-games-data.js';
import {buddySprite} from './party-view.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vals=o=>Object.values(o??{});
const teams=['PETITIONERS','RESPONDENTS'];
export function fastScene(s,uid,session){
 if(s.stage==='fastIntro')return `<section class="cg-fast-card cg-fast-casting"><p class="cg-eyebrow">${teams[s.winningTeam]} WIN THE MAIN GAME</p><h2>FAST MONEY</h2><p>Two counsel. The same five questions.<br>20 seconds, then 25. Get to 200.</p><div class="cg-runner-choices">${s.players.filter(p=>p.team===s.winningTeam&&!p.spectator&&p.connected!==false).map(p=>`<button type="button" data-runner="${esc(p.id)}" ${uid!==s.choicePlayer?'disabled':''} aria-pressed="${s.fastPlayers?.includes(p.id)}">${buddySprite(p.buddy)}<strong>${esc(p.name)}</strong></button>`).join('')}</div>${uid===s.choicePlayer?'<button class="cg-primary" data-game-action="fast-start">LET’S PLAY FAST MONEY ▸</button>':'<p>Your captain is choosing the two runners.</p>'}</section>`;
 if(s.stage==='fastFirstReview'&&uid===s.fastPlayers[1])return `<section class="cg-fast-card cg-soundproof"><p class="cg-eyebrow">YOUR TEAMMATE IS AT THE BOARD</p><h2>THE QUIET BENCH.</h2>${buddySprite(s.players.find(p=>p.id===uid)?.buddy)}<p>First answers stay hidden from you.<br>You’re next: five questions, 25 seconds.</p><div class="cg-quiet-waves"><i></i><i></i><i></i><i></i><i></i></div></section>`;
 if(s.stage==='fastReview'||s.stage==='fastFirstReview'){
 const first=s.stage==='fastFirstReview',audience=session?.response?.fastAudience,rows=first?(audience?.matchId===s.matchId?vals(audience.rows).map(r=>({prompt:r.prompt,answers:[r]})):[]):vals(s.fast?.rows);
 return `<section class="cg-fast-card cg-fast-results"><p class="cg-eyebrow">${first?'FIRST COUNSEL · SURVEY SAYS':'BOTH COUNSEL · THE FINAL TOTAL'}</p><h2>${first?'LET’S SEE IT.':s.fast.success?'CASE CLOSED!':'ON THE RECORD.'}</h2><div class="cg-fast-total"><span data-fast-running-total>0</span><small>/ ${s.fastTarget??s.fast?.target??200}</small></div><div class="cg-fast-goal"><i data-fast-goal></i></div>${rows.length?rows.map((r,i)=>`<div class="cg-fast-result" style="--i:${i}"><h3>${esc(r.prompt)}${r.source?` <a class="cg-fast-source" href="${esc(r.source)}" target="_blank" rel="noopener noreferrer" aria-label="Board source">↗</a>`:''} </h3><div>${vals(r.answers).map((a,j)=>`<p class="cg-survey-reveal" style="--reveal-at:${.4+i*.85+j*4.8}s" data-reveal-ms="${400+i*850+j*4800}" data-points="${a.points}"><span>${esc(a.label||'No board answer')}</span><b>${a.points}</b></p>`).join('')}</div></div>`).join(''):'<p>Preparing the survey board…</p>'}</section>`;
 }
 const mine=s.turn===uid;return `<section class="cg-fast-card cg-fast-run"><p class="cg-eyebrow">RUN ${s.fastPass+1} · ${mine?'YOU’RE UP':'ANSWERS SEALED'}</p><h2>${mine?'THINK FAST.':'GIVE COUNSEL SOME ROOM.'}</h2>${mine?`<form id="cg-fast-form"><div class="cg-fast-progress" aria-label="Five questions"></div><p class="cg-fast-position"></p><h3 class="cg-fast-prompt"></h3><label class="sr-only" for="fast0">Your Fast Money answer</label><input class="field" id="fast0" name="fast0" maxlength="40" autocomplete="off" spellcheck="false" placeholder="First thing that comes to mind…"><p class="cg-fast-feedback" role="status"></p><div class="cg-fast-buttons"><button class="cg-secondary" type="button" data-fast-pass>PASS ↷</button><button class="cg-primary" type="submit">NEXT ▸</button></div><p class="cg-small">Enter to answer. Pass to come back if there’s time.</p></form>`:`<div class="cg-fast-waiting">${buddySprite(s.players.find(p=>p.id===s.turn)?.buddy)}<p>${esc(s.players.find(p=>p.id===s.turn)?.name)} is answering.<br>One question at a time. No help from the bench.</p></div>`}<p id="cg-inline-error" class="cg-error" role="alert"></p></section>`;
}
// A single input remains mounted for the run. Only its question, id and value change.
export class FastRun{
 constructor(form,s,session,onError){
  Object.assign(this,{form,session,onError,pass:s.fastPass,match:s.matchId,ids:vals(s.fastIds),values:['','','','',''],cursor:0,passed:[],lap:0});
  const saved=session.response?.secret?.fastDraft;if(saved?.pass===this.pass){this.values=Array.from({length:5},(_,i)=>vals(saved.values)[i]??'');this.cursor=saved.cursor??0;this.passed=vals(saved.passed);this.lap=saved.lap??0;}
  this.input=form.querySelector('input');this.submit=form.querySelector('button[type=submit]');this.skip=form.querySelector('[data-fast-pass]');
  form.onsubmit=e=>{e.preventDefault();this.step(false);};this.skip.onclick=()=>this.step(true);
  this.input.oninput=()=>{this.values[this.cursor]=this.input.value;clearTimeout(this.timer);this.timer=setTimeout(()=>this.save(),160);};
  this.paint();
 }
 patch(extra={}){return {values:this.values.slice(),pass:this.pass,cursor:this.cursor,passed:this.passed.slice(),lap:this.lap,...extra};}
 save(){if(!this.disposed&&this.waiting===undefined)this.session.request('fast-draft',this.patch()).catch(this.onError);}
 step(pass){
  if(this.waiting!==undefined||this.session.pending||this.finishing)return;
  pass=pass||!this.input.value.trim();clearTimeout(this.timer);this.values[this.cursor]=pass?'':this.input.value.trim();this.passClick=pass;this.waiting=this.cursor;this.beforeAck=this.session.lastAck;
  this.form.querySelector('.cg-fast-feedback').textContent='';this.session.request('fast-draft',this.patch({checkIndex:this.cursor})).catch(e=>{this.waiting=undefined;this.onError(e);});
 }
 update(s,session){
  this.session=session;
  if(this.waiting!==undefined&&session.lastAck!==this.beforeAck){
   const result=session.lastResult;
   if(result?.checked===this.waiting){
    if(result.retry?.length){this.form.querySelector('.cg-fast-feedback').textContent='ALREADY SAID. TRY ANOTHER.';this.input.select();this.waiting=undefined;}
    else if(result.saved){this.waiting=undefined;this.advance();}
   }
  }
  if(this.finishing&&!session.pending&&session.lastResult?.retry?.length){this.finishing=false;this.cursor=session.lastResult.retry[0];this.passed=vals(session.lastResult.retry);this.lap=1;this.paint();this.form.querySelector('.cg-fast-feedback').textContent='ALREADY SAID. TRY ANOTHER.';}
  const disabled=!!session.pending||this.waiting!==undefined||this.finishing;this.submit.disabled=disabled;this.skip.disabled=disabled;
 }
 advance(){
  if(this.lap===0){if(this.passClick)this.passed.push(this.cursor);if(this.cursor<4)this.cursor++;else if(this.passed.length){this.lap=1;this.cursor=this.passed[0];}else return this.finish();}
  else{this.passed=this.passed.filter(i=>i!==this.cursor);if(this.passed.length)this.cursor=this.passed[0];else return this.finish();}
  this.paint();this.save();
 }
 finish(){this.finishing=true;this.form.querySelector('.cg-fast-feedback').textContent='ANSWERS SEALED.';this.submit.disabled=true;this.skip.disabled=true;this.session.request('fast',{values:this.values.slice(),pass:this.pass,matchId:this.match}).catch(e=>{this.finishing=false;this.onError(e);});}
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

