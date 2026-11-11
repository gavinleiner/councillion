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
 let admitted=false,started=false,disposed=false,root=null,openTimer,awaitingReturn=false,wasHidden=false;
 const visited=()=>[local,session].some(s=>read(s,SUPPORT_DAY_KEY)===supportDay(now()));
 function clean(){root?.remove();root=null;doc.documentElement.removeAttribute('data-support');win.removeEventListener('storage',storageChanged);}
 function resume(){if(disposed||started||!admitted)return;if(doc.visibilityState==='hidden'){wasHidden=true;return;}if(awaitingReturn&&!wasHidden)return;started=true;clean();doc.removeEventListener('visibilitychange',resume);onContinue();}
 function continueWhenVisible(){if(disposed||started)return;admitted=true;awaitingReturn=false;doc.addEventListener('visibilitychange',resume);resume();}
 function storageChanged(e){if(e.key===SUPPORT_DAY_KEY&&e.newValue===supportDay(now()))continueWhenVisible();}
 if(visited())continueWhenVisible();
 else{
  root=doc.createElement('a');root.id='daily-support';root.className='ds-welcome';root.href=WEEKLY_CASE_URL;root.target='_blank';root.rel='noopener';root.setAttribute('aria-labelledby','ds-title');root.setAttribute('aria-describedby','ds-explanation ds-return');
  root.innerHTML=`<span class="ds-ocean" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="ds-top">COUNCILLION <span>×</span> FUTURE COUNSEL</span><section class="ds-message"><img class="ds-counsel" src="assets/puffer.svg" width="86" height="80" alt=""><p class="ds-eyebrow">REQUIRED DAILY SUPPORT VISIT</p><h1 id="ds-title">THIS CLICK<br>IS ON PURPOSE.</h1><p id="ds-explanation">Opening Future Counsel’s weekly case is required each day to play Councillion. This visit supports our website.</p><span class="ds-cta">OPEN THIS WEEK’S CASE <b>↗</b></span><p id="ds-return">Councillion stays open.<br>Come straight back whenever you’re ready.</p><span class="ds-frequency">REQUIRED ONCE A DAY · OPENS A NEW TAB</span></section><span class="ds-bottom">CLICK ANYWHERE OR PRESS ENTER <i>→</i></span>`;
  doc.documentElement.dataset.support='daily';doc.body.append(root);root.focus({preventScroll:true});
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
    root.querySelector('#ds-title').innerHTML='YOUR SEAT<br>IS SAVED.';
    root.querySelector('#ds-explanation').textContent='Thanks for supporting Future Counsel. The weekly case opens in its own tab.';
    root.querySelector('.ds-cta').textContent='BACK TO COUNCILLION →';
    root.querySelector('#ds-return').innerHTML='Come back whenever you’re ready.<br>Your game starts when you return.';
    root.querySelector('.ds-bottom').textContent='BACK ALREADY? CLICK ANYWHERE TO PLAY →';
   },0);
  });
  root.addEventListener('keydown',e=>{if(admitted&&['Enter',' '].includes(e.key)){e.preventDefault();root.click();}});
  win.addEventListener('storage',storageChanged);
 }
 return {get shown(){return !!root;},get started(){return started;},dispose(){disposed=true;win.clearTimeout(openTimer);clean();doc.removeEventListener('visibilitychange',resume);}};
}
