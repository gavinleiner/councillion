import {buddySprite} from './party-buddy-sprite.js';
import {mountCourtAmbience} from './party-ambience.js';

// The cove paginates this registry; adding a game never changes other routes.
export const PUFFER_GAMES=[
 {id:'party',name:'Puffer Party',tag:'LAST COUNSEL STANDING',players:'2–6',color:'#86ded6',buddy:'krill',copy:'Find an answer before the puffer finds you. Every heart counts.'},
 {id:'clash',name:'Counsel Clash',tag:'TEAM FEUD',players:'2–10',color:'#efbf7d',buddy:'squid',copy:'Two benches. One survey board. Three strikes and the case can be stolen.'},
 {id:'figure',name:'Final Figure',tag:'CLOSEST WINS',players:'2–8',color:'#a6cfec',buddy:'angler',copy:'Everyone seals a number. The closest estimate takes the verdict.'},
 {id:'docket',name:'The Docket',tag:'CHOOSE · BUZZ · WAGER',players:'2–6',color:'#d2b7f0',buddy:'schooler',copy:'Pick a clue, beat the buzzer, and put your points on the record.'},
 {id:'oath',name:'Under Oath',tag:'BLUFF · VOTE · EXPOSE',players:'2–6',color:'#efa3a2',buddy:'evil',copy:'Write a convincing lie. Find the truth. Expose your friends.'}
];

export function mountPufferGames(root,{games=PUFFER_GAMES}={}){
 document.body.dataset.screen='games';
 root.innerHTML=`<section class="pg-hall" aria-labelledby="pg-title"><div class="pg-backdrop" aria-hidden="true"></div><div class="pg-light" aria-hidden="true"></div><canvas class="pg-life" aria-hidden="true"></canvas><nav class="pg-nav"><a href="#home">↑ BACK TO THE SURFACE</a><span>FUTURE COUNSEL · MULTIPLAYER</span><button type="button" data-pg-motion aria-pressed="true" aria-label="Pause hall animations">Ⅱ</button></nav><div class="pg-heading"><img src="assets/puffer.svg" alt="" class="pg-host"><div><p>FUTURE COUNSEL PRESENTS</p><h1 id="pg-title">PUFFER GAMES</h1></div></div><div class="pg-doors"></div><div class="pg-wings" aria-label="Game coves"></div><div class="pg-bottom"><p class="pg-current" aria-live="polite">Choose your court.</p><span>GOOGLE SIGN-IN TO PLAY · INVITE BY ROOM CODE</span></div></section>`;
 const hall=root.querySelector('.pg-hall'),current=root.querySelector('.pg-current'),doors=root.querySelector('.pg-doors'),wings=root.querySelector('.pg-wings');
 let ambience=mountCourtAmbience(root.querySelector('.pg-life')),page=0,perPage=5;
 const count=()=>innerWidth<620?1:innerWidth<900?3:5;
 const render=()=>{
  perPage=count();const pages=Math.max(1,Math.ceil(games.length/perPage));page=Math.min(page,pages-1);const rows=games.slice(page*perPage,(page+1)*perPage);
  const places=[[.139,.494],[.319,.567],[.501,.631],[.683,.567],[.861,.494]], order=perPage===1?[2]:perPage===3?[2,1,3]:[2,1,3,0,4];
  doors.innerHTML=rows.map((g,i)=>`<a class="pg-door" href="#${g.id}" data-game="${g.id}" style="--door-x:${places[order[i]][0]*100}%;--door-y:${places[order[i]][1]*100}%;--game-color:${g.color};--arrival:${i}" aria-label="Play ${g.name}"><span class="pg-door-glow" aria-hidden="true"></span><span class="pg-door-character">${buddySprite(g.buddy)}</span><span class="pg-door-name">${g.name}</span><span class="pg-door-tag">${g.tag}</span><span class="pg-door-enter">${g.players} PLAYERS <b>→</b></span></a>`).join('');
  wings.innerHTML=pages>1?`<button data-wing="-1" ${page===0?'disabled':''}>← PREVIOUS COVE</button><span>${page+1} / ${pages}</span><button data-wing="1" ${page===pages-1?'disabled':''}>NEXT COVE →</button>`:'';
  doors.querySelectorAll('.pg-door').forEach(a=>{const g=rows.find(g=>g.id===a.dataset.game);const select=()=>{hall.style.setProperty('--spotlight',g.color);current.textContent=g.copy;hall.dataset.active=g.id;const el=doors.querySelector('[data-game="'+g.id+'"]');if(el){const x=parseFloat(el.style.getPropertyValue('--door-x')),y=parseFloat(el.style.getPropertyValue('--door-y'));ambience?.pulse(x,y-4);}};a.onpointerenter=select;a.onfocus=select;});
  wings.querySelectorAll('[data-wing]').forEach(b=>b.onclick=()=>{page+=Number(b.dataset.wing);render();doors.querySelector('a')?.focus();});
 };
 hall.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||e.target.closest('[data-wing]'))return;const rows=[...doors.querySelectorAll('a')].sort((a,b)=>parseFloat(a.style.getPropertyValue('--door-x'))-parseFloat(b.style.getPropertyValue('--door-x'))),i=rows.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?rows.length-1:(i+(e.key==='ArrowLeft'?-1:1)+rows.length)%rows.length;e.preventDefault();rows[next]?.focus();};
 render();const resize=()=>{if(count()!==perPage){page=0;render();}};addEventListener('resize',resize);
 const motion=root.querySelector('[data-pg-motion]');motion.onclick=()=>{const paused=hall.classList.toggle('pg-paused');motion.textContent=paused?'▶':'Ⅱ';motion.setAttribute('aria-pressed',String(!paused));motion.setAttribute('aria-label',paused?'Resume hall animations':'Pause hall animations');if(paused){ambience?.dispose();ambience=null;}else ambience=mountCourtAmbience(root.querySelector('.pg-life'));};
 return {destroy(){ambience?.dispose();removeEventListener('resize',resize);}};
}
