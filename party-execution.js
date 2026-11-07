import {buddySprite} from './party-buddy-sprite.js';
// The bailiff uses the existing pixel puffer and the player's actual buddy.
// This layer never changes health; only the host's game state can do that.
export class PufferExecution{
 constructor(arena,{myId=()=>null,clock=Date.now,fixed=false}={}){Object.assign(this,{arena,myId,clock,fixed,deferred:null});this.seen=new Set();this.jobs=new Set();this.visibility=()=>{if(document.visibilityState==='visible'&&this.deferred){const event=this.deferred;this.render([event],this.clock());this.deferred=null;}};document.addEventListener('visibilitychange',this.visibility);}
 render(events=[],now=Date.now()){
  for(const event of Object.values(events)){
   if(this.seen.has(event.id))continue;
   // Other players see the sentence immediately. Its recipient sees the
   // animation on return, even if the browser suspended their hidden tab.
   if(document.visibilityState==='hidden'){if(event.player===this.myId())this.deferred=event;else this.seen.add(event.id);continue;}
   this.seen.add(event.id);
   if((now-event.at>10000&&this.deferred?.id!==event.id)||event.at>now+5000)continue;
   const player=[...this.arena.querySelectorAll('[data-player],[data-cc-player],[data-player-id],[data-person],[data-witness]')].find(p=>(p.dataset.player??p.dataset.ccPlayer??p.dataset.playerId??p.dataset.person??p.dataset.witness)===event.player);
   let buddy=player?.querySelector('.player-buddy,.cg-diver-avatar,.cg-avatar,.cc-avatar,.dk-character,.oa-person')??(this.fixed?this.arena.querySelector('.dive-buddy'):null);
   if(!buddy&&!this.fixed)continue;
   const base=this.fixed?{left:0,top:0,width:innerWidth,height:innerHeight}:this.arena.getBoundingClientRect(),box=buddy?.getBoundingClientRect()??{left:base.width*.5,top:base.height*.55,width:0,height:0},x=Math.max(55,Math.min(base.width-55,box.left-base.left+box.width/2)),y=Math.max(95,Math.min(base.height-120,box.top-base.top+box.height/2));
   const reduced=document.body.classList.contains('reduced')||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   const prompt=this.arena.querySelector('#p-prompt'),captionY=Math.max(100,Math.min(base.height-110,(prompt&&!prompt.hidden?prompt.getBoundingClientRect().bottom-base.top:80)+12));
   const layer=document.createElement('div');layer.className='puffer-sentence'+(this.fixed?' global-sentence':'')+(reduced?' reduced-sentence':'');layer.setAttribute('aria-hidden','true');layer.style.cssText=`--sentence-x:${x}px;--sentence-y:${y}px;--sentence-caption-y:${captionY}px;--knock-x:${Math.min(48,Math.max(10,base.width-x-50))}px;--approach:${x<base.width/2?180:-180}px`;
   const blood=Array.from({length:15},(_,i)=>{const a=(-165+i*19)*Math.PI/180,speed=24+(i*17)%48,dx=Math.cos(a)*speed,dy=-Math.abs(Math.sin(a)*speed)-6;return `<i style="--dx:${dx}px;--dy:${dy}px;--ex:${dx*1.65}px;--ey:${35+i%5*11}px;--bs:${2+i%3}px;--br:${i*37}deg;--blood:${i%3?'#b92c35':'#e14c48'}"></i>`;}).join('');
   layer.innerHTML='<div class="bailiff-puffer"><img src="assets/puffer.svg" alt=""><svg class="bailiff-gavel" viewBox="0 0 24 24" shape-rendering="crispEdges"><path fill="#101b30" d="M1 2h16v10h-5v12H6V12H1z"/><path fill="#b47c43" d="M3 4h12v6H3zm5 6h2v12H8z"/><path fill="#f0d28c" d="M3 4h12v2H3zM8 11h1v10H8z"/><path fill="#705037" d="M4 8h10v2H4z"/></svg></div><div class="sentenced-buddy"></div><div class="sentence-blood">'+blood+'</div><div class="sentence-stain"></div><div class="sentence-heart">♥<small>−1</small></div><span class="sentence-caption"><b></b><small>PUFFER SENTENCE: −1 ♥</small></span>';
   layer.querySelector('.sentence-caption b').textContent=(event.name??player?.querySelector('.player-display-name')?.textContent??'Counsel')+' tried to cheat';
   if(event.penaltyText){layer.querySelector('.sentence-caption small').textContent=event.penaltyText;const marker=layer.querySelector('.sentence-heart');marker.textContent=event.penaltyShort??'×';marker.classList.add('sentence-resource');}
   const victim=layer.querySelector('.sentenced-buddy');if(buddy){const clone=buddy.cloneNode(true);clone.classList.add('player-buddy');victim.append(clone);}else{const clone=document.createElement('div');clone.className='player-buddy';clone.innerHTML=buddySprite(event.buddy??'krill');victim.append(clone);}const wound=document.createElement('i');wound.className='sentence-wound';victim.append(wound);this.arena.append(layer);player?.classList.add('puffer-sentenced');
   const job={layer,player,id:event.player,timer:null};job.timer=setTimeout(()=>this.finish(job),reduced?1200:2700);this.jobs.add(job);
  }
  for(const job of this.jobs){const current=[...this.arena.querySelectorAll('[data-player],[data-cc-player],[data-player-id],[data-person],[data-witness]')].find(p=>(p.dataset.player??p.dataset.ccPlayer??p.dataset.playerId??p.dataset.person??p.dataset.witness)===job.id);if(current)current.classList.add('puffer-sentenced');}
 }
 finish(job){clearTimeout(job.timer);job.player?.classList.remove('puffer-sentenced');for(const p of this.arena.querySelectorAll('[data-player],[data-cc-player],[data-player-id],[data-person],[data-witness]'))if((p.dataset.player??p.dataset.ccPlayer??p.dataset.playerId??p.dataset.person??p.dataset.witness)===job.id)p.classList.remove('puffer-sentenced');job.layer.remove();this.jobs.delete(job);}
 destroy(){document.removeEventListener('visibilitychange',this.visibility);for(const job of this.jobs)this.finish(job);this.seen.clear();this.deferred=null;}
}
