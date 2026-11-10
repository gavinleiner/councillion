import {gameLogoMarkup} from './game-mascots.js';
import {enhanceGameMascots} from './game-mascot-motion.js';
import {COMING_SOON_GAMES,isGameEntryAvailable} from './game-availability.js';
import {buddySprite} from './party-buddy-sprite.js';
import {mountCourtAmbience} from './party-ambience.js';

// Adding a court creates another cove; it never changes existing game routes.
export const PUFFER_GAMES=[
 {id:'chess',name:'Counsel Chess',tag:'1V1 · 2V2 TEAM CHESS',players:'2–4',color:'#e9d4a1',buddy:'krill',steps:['TAKE YOUR SEAT','MAKE YOUR MOVE','CHECKMATE'],cue:'A fair board. A sharp counsel.',copy:'Play 1v1 or 2v2 with alternating teammates. Shared team clocks, chess ranks, and a full engine review.'},
 {id:'party',name:'Puffer Party',tag:'LAST COUNSEL STANDING',players:'2–6',color:'#86ded6',buddy:'krill',steps:['NAME AN ANSWER','PASS THE PUFFER','STAY ALIVE'],cue:'Keep your counsel. And your hearts.',copy:'Find an answer before the puffer finds you. Every heart counts.'},
 {id:'trial',name:'Trial by Puffer',tag:'SURVIVE · HAUNT · ESCAPE',players:'2–8',color:'#d2b5e9',buddy:'evil',steps:['SURVIVE THE TRIALS','HAUNT YOUR FRIENDS','STEAL A LIFE & ESCAPE'],cue:'Death is not dismissal.',copy:'Trivia buys time. Wrong answers bring a survival trial. Become a ghost, steal a life, and escape the magistrate.'},
 {id:'clash',name:'Counsel Clash',tag:'TEAM FEUD',players:'2–10',color:'#efbf7d',buddy:'squid',steps:['TAKE YOUR BENCH','SURVEY SAYS…','STEAL THE CASE'],cue:'Counsel, survey says…',copy:'Two benches. One survey board. Three strikes and the case can be stolen.'},
 {id:'figure',name:'Final Figure',tag:'CLOSEST WINS',players:'2–8',color:'#a6cfec',buddy:'angler',steps:['MAKE YOUR GUESS','SEAL IT','CLOSEST WINS'],cue:'A precise guess. Or a very lucky one.',copy:'Everyone seals a number. The closest estimate takes the verdict.'},
 {id:'docket',name:'The Docket',tag:'CHOOSE · BUZZ · WAGER',players:'2–6',color:'#d2b7f0',buddy:'schooler',steps:['CHOOSE A CLUE','BEAT THE BUZZER','PLACE YOUR WAGER'],cue:'Your category. Your wager.',copy:'Pick a clue, beat the buzzer, and put your points on the record.'},
 {id:'bench',name:'Beat the Bench',tag:'OUTRUN THE JUDGE',players:'2–6',color:'#e8c987',buddy:'krill',steps:['BUILD A LEAD','TAKE THE RISK','OUTRUN THE BENCH'],cue:'Think you can outrun me?',copy:'One crew against the puffer judge. Build a lead, take a risk, and turn his mistakes into your escape.'},
 {id:'testimony',name:'Broken Testimony',tag:'DRAW · GUESS · DERAIL',players:'2–10',color:'#cbb890',buddy:'squid',steps:['PICK YOUR GAME','PASS THE PICTURE','REVEAL THE EVIDENCE'],cue:'The court requests a sketch.',copy:'Drawing telephone, convincing fake captions, and live guessing. The evidence gets ridiculous.'},
 {id:'oath',name:'Under Oath',tag:'ONE SECRET IMPOSTOR',players:'3–6',color:'#efa3a2',buddy:'evil',steps:['CHECK YOUR ROLE','GIVE A CLUE','FIND THE IMPOSTOR'],cue:'This witness needs a little more time.',copy:'One impostor gets a private hint. Everyone else knows the word. Find the bluff.'}
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const preview=mode=>({party:'<i>♥</i><i>♥</i>',clash:'<i>×</i><i>×</i><i>×</i>',figure:'<i>180</i><i>250</i><i>?</i>',docket:'<i>200</i><i>400</i><i>600</i>',oath:'<i>…</i>'}[mode]??'');

export function mountPufferGames(root,{games=PUFFER_GAMES,identity=()=>null}={}){
 document.body.dataset.screen='games';
 const abort=new AbortController(),media=matchMedia('(prefers-reduced-motion: reduce)');
 const title=[...'PUFFER GAMES'].map((letter,i)=>`<span style="--letter:${i}">${letter===' '?'&nbsp;':letter}</span>`).join('');
 root.innerHTML=`<section class="pg-hall" aria-labelledby="pg-title"><div class="pg-world"><div class="pg-backdrop" aria-hidden="true"></div><div class="pg-light" aria-hidden="true"></div><div class="pg-rays" aria-hidden="true"><i></i><i></i><i></i></div><div class="pg-focus-light" aria-hidden="true"></div><canvas class="pg-life" aria-hidden="true"></canvas><div class="pg-doors"></div></div><div class="pg-edge-shade" aria-hidden="true"></div><nav class="pg-nav"><a href="#home">↑ BACK TO THE SURFACE</a><span>FUTURE COUNSEL · MULTIPLAYER</span><button type="button" data-pg-motion aria-pressed="true" aria-label="Pause hall animations">Ⅱ</button></nav><div class="pg-heading"><div class="pg-guide-wrap"><button class="pg-guide" aria-label="Let the puffer pick a game" type="button"><img src="assets/puffer.svg" alt="" class="pg-host"></button><span class="pg-guide-speech" aria-hidden="true">CAN'T DECIDE? TAP ME.</span></div><div><p>FUTURE COUNSEL PRESENTS</p><h1 id="pg-title" aria-label="Puffer Games"><span aria-hidden="true">${title}</span></h1></div></div><div class="pg-wings" aria-label="Game coves"></div><div class="pg-bottom"><span class="pg-current-name">CHOOSE YOUR COURT</span><p class="pg-current" aria-live="polite">Pick a mascot. Bring your friends.</p><div class="pg-preview-steps" aria-hidden="true"><span>HOVER TO EXPLORE</span><b>·</b><span>TAP THE JUDGE TO PICK</span></div><span class="pg-sign-in-note">GOOGLE SIGN-IN TO PLAY · INVITE BY ROOM CODE</span></div><div class="pg-water-wipe" aria-hidden="true"><img src="assets/puffer.svg" alt=""><span data-pg-entering></span></div></section>`;
 const hall=root.querySelector('.pg-hall'),world=root.querySelector('.pg-world'),doors=root.querySelector('.pg-doors'),wings=root.querySelector('.pg-wings'),current=root.querySelector('.pg-current'),speech=root.querySelector('.pg-guide-speech'),motion=root.querySelector('[data-pg-motion]');
 let page=0,perPage=5,active=null,disposed=false,leaving=false,paused=false,reduced=false,frame=null,last=0,panX=0,panY=0,targetX=0,targetY=0,pickTimer;
 const timers=new Set();try{paused=localStorage.getItem('councillion:games-motion')==='paused';}catch{}
 const ambience=mountCourtAmbience(root.querySelector('.pg-life'),{cove:true});
 const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!disposed)fn();},ms);timers.add(id);return id;};
 const still=()=>paused||reduced||document.hidden;
 const count=()=>innerWidth<620?1:innerWidth<900?3:5;
 function pan(now){
  frame=null;if(disposed||still())return;
  if(now-last<32){frame=requestAnimationFrame(pan);return;}last=now;
  panX+=(targetX-panX)*.12;panY+=(targetY-panY)*.12;
  hall.style.setProperty('--pan-x',panX.toFixed(2)+'px');hall.style.setProperty('--pan-y',panY.toFixed(2)+'px');
  if(Math.abs(targetX-panX)+Math.abs(targetY-panY)>.035)frame=requestAnimationFrame(pan);
 }
 function schedulePan(){if(frame===null&&!still()&&!disposed)frame=requestAnimationFrame(pan);}
 function syncMotion(){
  reduced=media.matches||document.body.classList.contains('reduced');
  hall.classList.toggle('pg-paused',paused);hall.classList.toggle('pg-reduced',reduced);hall.classList.toggle('pg-sleeping',document.hidden);
  motion.textContent=paused||reduced?'▶':'Ⅱ';motion.disabled=reduced;
  motion.setAttribute('aria-pressed',String(!paused&&!reduced));motion.setAttribute('aria-label',reduced?'Reduced motion enabled':paused?'Resume hall animations':'Pause hall animations');
  ambience?.setPaused(paused);
  if(still()){cancelAnimationFrame(frame);frame=null;hall.style.setProperty('--pan-x','0px');hall.style.setProperty('--pan-y','0px');panX=panY=0;}else schedulePan();
 }
 function select(g,{picked=false}={}){
  const el=doors.querySelector('[data-game="'+CSS.escape(g.id)+'"]');if(!el)return;
  const available=isGameEntryAvailable(g.id,identity()),changed=active!==g.id;active=g.id;hall.dataset.active=g.id;
  doors.querySelectorAll('.pg-door').forEach(a=>a.classList.toggle('pg-selected',a===el));hall.style.setProperty('--spotlight',g.color);
  root.querySelector('.pg-current-name').textContent=picked?'THE JUDGE PICKS '+g.name.toUpperCase():g.name.toUpperCase();
  current.textContent=available?g.copy:'Under Oath is coming soon. This courtroom is not open yet.';
  root.querySelector('.pg-preview-steps').innerHTML=available?(g.steps??['BRING YOUR FRIENDS','TAKE YOUR PLACE','PLAY']).map((s,i)=>`${i?'<b>→</b>':''}<span>${esc(s)}</span>`).join(''):'<span>THE WITNESS BOX IS STILL CLOSED</span>';
  speech.textContent=picked?g.name.toUpperCase()+' IT IS.':g.cue??'Take your place, counsel.';
  const bounds=world.getBoundingClientRect(),sprite=el.querySelector('.pg-door-character').getBoundingClientRect(),x=(sprite.x+sprite.width/2-bounds.x)/bounds.width*100,y=(sprite.bottom-bounds.y)/bounds.height*100;
  world.style.setProperty('--focus-x',x+'%');world.style.setProperty('--focus-y',y+'%');ambience?.focus(x,y,g.color);
  if(changed||picked)ambience?.pulse(x,y,picked?'pick':'focus');
  if(picked){clearTimeout(pickTimer);timers.delete(pickTimer);hall.classList.add('pg-picked');pickTimer=later(()=>hall.classList.remove('pg-picked'),1800);}
 }
 function enter(e,g){
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||still())return;
  e.preventDefault();if(leaving)return;leaving=true;select(g);hall.classList.add('pg-exiting');root.querySelector('[data-pg-entering]').textContent='ENTERING '+g.name.toUpperCase();
  later(()=>{location.hash='#'+g.id;},460);
 }
 function render(){
  perPage=count();const pages=Math.max(1,Math.ceil(games.length/perPage));page=Math.min(page,pages-1);
  const rows=games.slice(page*perPage,(page+1)*perPage),places=[[.139,.494],[.319,.567],[.501,.631],[.683,.567],[.861,.494]],order=perPage===1?[2]:perPage===3?[2,1,3]:[2,1,3,0,4];
  active=null;ambience?.focus(null);hall.removeAttribute('data-active');
  doors.innerHTML=rows.map((g,i)=>{
   const available=isGameEntryAvailable(g.id,identity()),upcoming=COMING_SOON_GAMES.includes(g.id),tag=available?'a':'button',attrs=available?`href="#${esc(g.id)}"`:'type="button" disabled aria-disabled="true"';
   return `<${tag} class="pg-door ${upcoming?'pg-coming-soon':''} ${available&&upcoming?'pg-owner-preview':''}" ${attrs} data-game="${esc(g.id)}" style="--door-x:${places[order[i]][0]*100}%;--door-y:${places[order[i]][1]*100}%;--game-color:${g.color};--arrival:${i}" aria-label="${available?'Play '+esc(g.name):esc(g.name)+' — Coming Soon'}"><span class="pg-door-glow" aria-hidden="true"></span><span class="pg-door-ripples" aria-hidden="true"><i></i><i></i><i></i></span><span class="pg-door-character">${gameLogoMarkup(g.id,{decorative:true})||buddySprite(g.buddy)}</span>${upcoming?'<span class="pg-coming-ribbon" aria-hidden="true">COMING SOON</span>':''}<span class="pg-mascot-emotes" aria-hidden="true">${preview(g.id)}</span><span class="pg-door-name">${esc(g.name)}</span><span class="pg-door-tag">${upcoming?(available?'YOUR PRIVATE PREVIEW':'COMING SOON'):esc(g.tag)}</span><span class="pg-door-enter">${upcoming?(available?'PREVIEW WITH BOTS <b>→</b>':'COURT CLOSED'):esc(g.players)+' PLAYERS <b>→</b>'}</span></${tag}>`;
  }).join('');enhanceGameMascots(doors,abort.signal);
  wings.innerHTML=pages>1?`<button data-wing="-1" aria-label="← PREVIOUS COVE" ${page===0?'disabled':''}>‹</button><span>${page+1} / ${pages}</span><button data-wing="1" aria-label="NEXT COVE →" ${page===pages-1?'disabled':''}>›</button>`:'';
  doors.querySelectorAll('.pg-door').forEach(el=>{const g=rows.find(g=>g.id===el.dataset.game);el.onpointerenter=()=>select(g);el.onfocus=()=>select(g);if(isGameEntryAvailable(g.id,identity()))el.onclick=e=>enter(e,g);});
  wings.querySelectorAll('[data-wing]').forEach(b=>b.onclick=()=>{page+=Number(b.dataset.wing);render();doors.querySelector('a')?.focus({preventScroll:true});});
 }
 hall.onkeydown=e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||!e.target.closest('.pg-doors'))return;
  const rows=[...doors.querySelectorAll('a')].sort((a,b)=>parseFloat(a.style.getPropertyValue('--door-x'))-parseFloat(b.style.getPropertyValue('--door-x'))),i=rows.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?rows.length-1:(i+(e.key==='ArrowLeft'?-1:1)+rows.length)%rows.length;
  e.preventDefault();rows[next]?.focus({preventScroll:true});
 };
 hall.onpointermove=e=>{if(e.pointerType==='touch'||still())return;targetX=(e.clientX/innerWidth-.5)*-8;targetY=(e.clientY/innerHeight-.5)*-5;schedulePan();};
 hall.onpointerleave=()=>{targetX=targetY=0;schedulePan();};
 hall.onpointerdown=e=>{if(e.button||e.target.closest('a,button')||still())return;const r=world.getBoundingClientRect();ambience?.pulse((e.clientX-r.x)/r.width*100,(e.clientY-r.y)/r.height*100,'touch');};
 root.querySelector('.pg-guide').onclick=()=>{
  if(leaving)return;const available=games.filter(g=>!COMING_SOON_GAMES.includes(g.id)&&isGameEntryAvailable(g.id,identity()));if(!available.length)return;
  const g=available[Math.floor(Math.random()*available.length)],next=Math.floor(games.indexOf(g)/perPage);if(next!==page){page=next;render();}
  doors.querySelector('[data-game="'+CSS.escape(g.id)+'"]')?.focus({preventScroll:true});select(g,{picked:true});
 };
 motion.onclick=()=>{paused=!paused;try{localStorage.setItem('councillion:games-motion',paused?'paused':'playing');}catch{}syncMotion();};
 const resize=()=>{if(count()!==perPage){page=0;render();}else if(active){const g=games.find(g=>g.id===active);if(g)select(g);}};
 addEventListener('resize',resize);media.addEventListener('change',syncMotion);document.addEventListener('visibilitychange',syncMotion);
 const observer=new MutationObserver(syncMotion);observer.observe(document.body,{attributes:true,attributeFilter:['class']});render();syncMotion();
 return {identityChanged(){if(!disposed){render();root.querySelector('.pg-current-name').textContent='CHOOSE YOUR COURT';current.textContent='Pick a mascot. Bring your friends.';}},destroy(){disposed=true;abort.abort();ambience?.dispose();cancelAnimationFrame(frame);clearTimeout(pickTimer);timers.forEach(clearTimeout);observer.disconnect();removeEventListener('resize',resize);media.removeEventListener('change',syncMotion);document.removeEventListener('visibilitychange',syncMotion);}};
}
