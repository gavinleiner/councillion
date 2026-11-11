import {mountCourtAmbience} from './party-ambience.js';
import {gameLogoMarkup} from './game-mascots.js';
import {enhanceGameMascots} from './game-mascot-motion.js';
export const WEEKLY_CASE_URL='https://futurecounsel.org/weekly';
export const SUPPORT_DAY_KEY='fc:support:visited-on';
export function supportDay(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=type=>parts.find(p=>p.type===type).value;
 return `${part('year')}-${part('month')}-${part('day')}`;
}
const read=(storage,key)=>{try{return storage?.getItem(key);}catch{return null;}};
const write=(storage,key,value)=>{try{storage?.setItem(key,value);}catch{/* A blocked store must never lock a visitor out. */}};

// This is a disclosed link before game startup, not a click interceptor over
// game controls. No room connection, timer or focus penalty starts behind it.
export function mountDailySupport({document:doc=globalThis.document,window:win=globalThis.window,now=()=>new Date(),onContinue=()=>{}}={}){
 let local,session;try{local=win.localStorage;}catch{}try{session=win.sessionStorage;}catch{}
 let admitted=false,started=false,disposed=false,root=null,openTimer,awaitingReturn=false,wasHidden=false,ambience=null,artAbort=null;
 const visited=()=>[local,session].some(s=>read(s,SUPPORT_DAY_KEY)===supportDay(now()));
 function clean(){ambience?.dispose();ambience=null;artAbort?.abort();doc.removeEventListener('visibilitychange',lifeVisibility);root?.remove();root=null;doc.documentElement.removeAttribute('data-support');win.removeEventListener('storage',storageChanged);}
 function lifeVisibility(){if(root)root.dataset.paused=String(doc.visibilityState==='hidden');}
 function resume(){if(disposed||started||!admitted)return;if(doc.visibilityState==='hidden'){wasHidden=true;return;}if(awaitingReturn&&!wasHidden)return;started=true;clean();doc.removeEventListener('visibilitychange',resume);onContinue();}
 function continueWhenVisible(){if(disposed||started)return;admitted=true;awaitingReturn=false;doc.addEventListener('visibilitychange',resume);resume();}
 function storageChanged(e){if(e.key===SUPPORT_DAY_KEY&&e.newValue===supportDay(now()))continueWhenVisible();}
 if(visited())continueWhenVisible();
 else{
  root=doc.createElement('a');root.id='daily-support';root.className='ds-welcome';root.href=WEEKLY_CASE_URL;root.target='_blank';root.rel='noopener';root.setAttribute('aria-labelledby','ds-title');root.setAttribute('aria-describedby','ds-explanation ds-return');
  root.innerHTML=`<span class="ds-ocean" aria-hidden="true"><span class="ds-backdrop"></span><span class="ds-rays"></span><span class="ds-lanterns"></span><span class="ds-reading-light"></span><canvas class="ds-life"></canvas></span><span class="ds-top"><span class="ds-wordmark">COUNCILLION <b>×</b> FUTURE COUNSEL</span><span class="ds-visit-label">DAILY VISIT <i>01</i></span></span><span class="ds-guide" aria-hidden="true"><span class="ds-speech">THIS WEEK’S CASE<br>IS READY.</span><span class="ds-guide-sprite">${gameLogoMarkup('party',{decorative:true})}</span><span class="ds-guide-shadow"></span></span><section class="ds-message"><p class="ds-eyebrow"><i></i> REQUIRED DAILY SUPPORT VISIT <i></i></p><h1 id="ds-title">BEFORE<br>THE DIVE.</h1><p class="ds-intro">One quick case. Then we play.</p><p id="ds-explanation">Opening Future Counsel’s weekly case is required each day to play Councillion. This visit supports our website.</p><span class="ds-cta"><span>OPEN THIS WEEK’S CASE</span><b>↗</b></span><span class="ds-case-url">FUTURECOUNSEL.ORG / WEEKLY</span><p id="ds-return">Councillion stays open.<br>Come straight back whenever you’re ready.</p><span class="ds-frequency">REQUIRED ONCE A DAY · OPENS A NEW TAB</span></section><span class="ds-bottom"><span>ON PURPOSE. IN SUPPORT OF FUTURE COUNSEL.</span><span class="ds-hint">CLICK ANYWHERE OR PRESS ENTER <i>→</i></span></span>`;
  doc.documentElement.dataset.support='daily';doc.body.append(root);root.focus({preventScroll:true});
  try{if(JSON.parse(read(local,'fc:settings')??'null')?.motion===false)root.dataset.motion='reduced';}catch{}
  try{if(root.dataset.motion!=='reduced')ambience=mountCourtAmbience(root.querySelector('.ds-life'),{cove:true});}catch{/* Scenery must never block the support link or game entry. */}
  artAbort=new AbortController();enhanceGameMascots(root,artAbort.signal,{selector:'.ds-guide .game-mascot'});
  lifeVisibility();doc.addEventListener('visibilitychange',lifeVisibility);
  const cta=root.querySelector('.ds-cta');cta.addEventListener('pointerenter',()=>{if(!ambience)return;const r=cta.getBoundingClientRect(),w=doc.defaultView?.innerWidth??1,h=doc.defaultView?.innerHeight??1;ambience.focus((r.x+r.width/2)/w*100,(r.y+r.height)/h*100,'#ead399');ambience.pulse((r.x+r.width/2)/w*100,(r.y+r.height)/h*100,'touch');});cta.addEventListener('pointerleave',()=>ambience?.focus(null));
  root.addEventListener('click',e=>{
   // Preserve normal link behavior (including keyboard activation/new-tab
   // navigation) and prevent the same day's prompt on the return visit.
   if(e.defaultPrevented||e.button&&e.button!==0)return;
   if(admitted){e.preventDefault();awaitingReturn=false;resume();return;}
   const day=supportDay(now());write(local,SUPPORT_DAY_KEY,day);write(session,SUPPORT_DAY_KEY,day);
   admitted=true;awaitingReturn=true;wasHidden=doc.visibilityState==='hidden';doc.addEventListener('visibilitychange',resume);
   win.clearTimeout(openTimer);
   // Allow the native link to open first. Never start on that opening gesture:
   // wait for the case-tab return, or an explicit second click if the browser
   // opened it in the background. This avoids a visibility-notification race.
   openTimer=win.setTimeout(()=>{
    if(disposed||started||!root)return;
    root.removeAttribute('href');root.removeAttribute('target');root.setAttribute('role','button');root.tabIndex=0;
    root.dataset.state='return';root.querySelector('.ds-eyebrow').textContent='TODAY’S CASE IS OPEN';root.querySelector('.ds-intro').textContent='Your court is ready when you are.';
    root.querySelector('#ds-title').innerHTML='YOUR SEAT<br>IS SAVED.';
    root.querySelector('#ds-explanation').textContent='Thanks for supporting Future Counsel. The weekly case opens in its own tab.';
    root.querySelector('.ds-cta').textContent='BACK TO COUNCILLION →';
    root.querySelector('.ds-case-url').textContent='YOUR GAME IS READY';root.querySelector('.ds-frequency').textContent='OPENED FOR TODAY · NO READING TIMER';root.querySelector('.ds-speech').innerHTML='READY WHEN<br>YOU ARE.';
    root.querySelector('#ds-return').innerHTML='Come back whenever you’re ready.<br>Your game starts when you return.';
    root.querySelector('.ds-bottom').textContent='BACK ALREADY? CLICK ANYWHERE TO PLAY →';
   },0);
  });
  root.addEventListener('keydown',e=>{if(admitted&&['Enter',' '].includes(e.key)){e.preventDefault();root.click();}});
  win.addEventListener('storage',storageChanged);
 }
 return {get shown(){return !!root;},get started(){return started;},dispose(){disposed=true;win.clearTimeout(openTimer);clean();doc.removeEventListener('visibilitychange',resume);}};
}
