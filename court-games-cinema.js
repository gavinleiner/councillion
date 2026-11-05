// Original pixel art + lightweight scene direction. Cosmetic only: never changes
// turn order, guesses, clocks or score. Controls remain usable during every beat.
import {buddySprite} from './party-view.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class CourtCinema{
 constructor(root){this.root=root;this.timers=new Set();this.layer=document.createElement('div');this.layer.className='cg-cinema-layer';this.layer.setAttribute('aria-hidden','true');this.layer.innerHTML='<div class="cg-puffer-host"><div class="cg-host-sprite"></div></div><aside class="cg-team-cut"></aside><div class="cg-strike-splash"></div><div class="cg-point-pop"></div><div class="cg-victory-glints">'+Array.from({length:18},(_,i)=>`<i style="--x:${6+i*89/18}%;--delay:${-i*.7}s;--duration:${5+i%5}s"></i>`).join('')+'</div>';root.append(this.layer);}
 later(fn,ms){const timer=setTimeout(()=>{this.timers.delete(timer);fn();},ms);this.timers.add(timer);return timer;}
 celebrateFast(){const host=this.layer.querySelector('.cg-host-sprite');host.dataset.pose='cheer';this.layer.classList.add('is-fast-win');this.later(()=>{host.dataset.pose='idle';this.layer.classList.remove('is-fast-win');},5000);}
 update(s){
  const key=s.matchId+':'+s.event?.id;if(this.lastKey===key)return;this.lastKey=key;
  const fresh=s.lastAnswer&&this.lastAnswer!==s.matchId+':'+s.lastAnswer.id;if(fresh)this.lastAnswer=s.matchId+':'+s.lastAnswer.id;const event=fresh&&s.lastAnswer.points>0&&!['round-win','steal-win','finish'].includes(s.event?.type)?s.lastAnswer:s.event??{},type=event.type,team=event.team??s.players.find(p=>p.id===event.player)?.team??s.controlTeam;
  this.root.dataset.beat=type;const host=this.layer.querySelector('.cg-host-sprite');host.dataset.pose=['strike','steal'].includes(type)?'gavel':['answer','round-win','steal-win','jackpot','finish'].includes(type)?'cheer':'idle';
  this.later(()=>{host.dataset.pose='idle';if(this.root.dataset.beat===type)delete this.root.dataset.beat;},1500);
  if(s.strikes>(this.strikes??0)&&['faceAnswer','control','steal'].includes(s.stage)){
   const splash=this.layer.querySelector('.cg-strike-splash');splash.textContent='×'.repeat(s.strikes);splash.classList.remove('is-showing');void splash.offsetWidth;splash.classList.add('is-showing');
  }this.strikes=s.strikes??0;
  if(['answer','round-win','steal-win'].includes(type)){
   const points=this.layer.querySelector('.cg-point-pop');points.textContent='+'+(event.points??0);points.classList.remove('is-showing');void points.offsetWidth;points.classList.add('is-showing');
   if(Number.isInteger(team)){const bench=this.root.querySelector('.bench-'+team);bench?.classList.add('is-celebrating');this.later(()=>bench?.classList.remove('is-celebrating'),1700);}
  }
  if(['control','steal','steal-win','round-win'].includes(type)&&Number.isInteger(team))this.teamCut(s,team,type);
 }
 teamCut(s,team,type){
  const cut=this.layer.querySelector('.cg-team-cut'),crew=s.players.filter(p=>p.team===team&&!p.spectator);clearTimeout(this.cutTimer);
  cut.innerHTML='<div class="cg-cut-heading">'+(team===0?'PETITIONERS':'RESPONDENTS')+'<small>'+({control:'THE BOARD IS YOURS',steal:'ONE CHANCE TO STEAL','steal-win':'STOLE THE BANK','round-win':'ROUND WON'}[type])+'</small></div><div class="cg-cut-crew">'+crew.map((p,i)=>`<div class="cg-cut-player" style="--i:${i}">${buddySprite(p.buddy)}<strong>${esc(p.name)}</strong></div>`).join('')+'</div>';
  cut.classList.remove('is-showing');void cut.offsetWidth;cut.classList.add('is-showing');this.cutTimer=setTimeout(()=>cut.classList.remove('is-showing'),2400);
 }
 dispose(){for(const t of this.timers)clearTimeout(t);clearTimeout(this.cutTimer);this.layer.remove();}
}
