import {sealIcon} from './court-games-customization.js';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=n=>1-(1-clamp(n))**3;
// Presentation only: shared room time drives every one-shot. Reconnects resume the
// current beat; an acknowledgement never replays the question or remounts its input.
export class FigureTheatre{
 constructor(root){
  this.root=root;this.arena=root.querySelector('.cg-arena');this.media=matchMedia('(prefers-reduced-motion: reduce)');this.flights=[];
  this.layer=document.createElement('div');this.layer.className='ff-theatre';this.layer.setAttribute('aria-hidden','true');
  this.layer.innerHTML='<canvas class="ff-current-particles"></canvas><div class="ff-capsule"><div class="ff-capsule-lamp"></div><img src="assets/court-games/figure-capsule-ai-v1.webp" alt="" draggable="false"><div class="ff-capsule-tally"></div></div><div class="ff-seal-flights"></div><div class="ff-current-ribbons">'+Array.from({length:12},(_,i)=>'<i style="--i:'+i+';--x:'+(4+i*8.1)+'%"></i>').join('')+'</div>';
  this.arena.append(this.layer);this.capsule=this.layer.querySelector('.ff-capsule');this.tally=this.layer.querySelector('.ff-capsule-tally');this.canvas=this.layer.querySelector('canvas');this.ctx=this.canvas.getContext('2d');this.folio=new Image();this.folio.src='assets/court-games/figure-folio-ai-v1.webp';
  this.resize=()=>{const box=this.arena.getBoundingClientRect();this.width=box.width;this.height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);};this.resize();addEventListener('resize',this.resize);
  this.loop=()=>{if(this.disposed)return;if(this.s&&!document.hidden&&!this.layer.hidden)this.draw(this.session.now());this.raf=requestAnimationFrame(this.loop);};this.raf=requestAnimationFrame(this.loop);
 }
 update(s,session){
  const key=session.uid+':'+s.matchId+':'+s.round;if(key!==this.roundKey){this.roundKey=key;this.seen=new Set(Object.keys(s.locked??{}));for(const f of this.flights)f.node.remove();this.flights=[];}
  else if(s.stage==='estimate')for(const id of Object.keys(s.locked??{}))if(!this.seen.has(id)){this.seen.add(id);this.fly(id,s,session.now());}
  this.s=s;this.session=session;this.layer.hidden=!['estimate','reveal'].includes(s.stage);this.layer.dataset.stage=s.stage;this.layer.dataset.hasSeals=String(Object.keys(s.locked??{}).length>0);
  const count=Object.keys(s.locked??{}).length,total=s.players.filter(p=>!p.spectator).length,tallyKey=count+':'+total;
  if(tallyKey!==this.tallyKey){this.tallyKey=tallyKey;this.tally.innerHTML=Array.from({length:total},(_,i)=>'<i class="'+(i<count?'collected':'')+'"></i>').join('');}
 }
 fly(id,s,now){
  if(this.media.matches||document.body.classList.contains('reduced'))return;
  const actor=[...this.root.querySelectorAll('.cg-diver')].find(n=>n.dataset.playerId===id),box=actor?.getBoundingClientRect(),arena=this.arena.getBoundingClientRect();if(!box)return;
  const p=s.players.find(p=>p.id===id),node=document.createElement('span');node.className='ff-flying-slip';node.innerHTML=sealIcon(p?.appearance?.seal??'scales');this.layer.querySelector('.ff-seal-flights').append(node);
  this.flights.push({node,at:now,x:box.left+box.width/2-arena.left,y:box.top+12-arena.top});
 }
 frame(s,session,now){
  const ms=Math.max(0,now-s.stageAt),reduced=this.media.matches||document.body.classList.contains('reduced');
  if(s.stage==='estimate'){
   const t=reduced?1:ease(ms/1100),x=this.width*(.5+.36*t),y=this.height*(.59-.36*t),bob=reduced?0:Math.sin(ms/1400)*3;
   this.capsule.style.transform=`translate(${x}px,${y+bob}px) translate(-50%,-50%) rotate(${(1-t)*-14}deg)`;this.capsule.style.opacity='1';
  }else if(s.stage==='reveal'){
   const t=reduced?1:ease(ms/900);this.capsule.style.transform=`translate(${this.width*(.86-.36*t)}px,${this.height*(.23+.09*t)}px) translate(-50%,-50%) rotate(${t*9}deg)`;this.capsule.style.opacity=String(reduced?0:1-ease((ms-650)/650));
  }
  for(const f of this.flights){const t=clamp((now-f.at)/1050),e=ease(t),x=f.x+(this.width*.86-f.x)*e,y=f.y+(this.height*.23-f.y)*e-Math.sin(t*Math.PI)*65;f.node.style.transform=`translate(${x}px,${y}px) rotate(${t*22-11}deg) scale(${1-.55*t})`;f.node.style.opacity=String(t<.82?1:(1-t)/.18);if(t>=1)f.node.remove();}this.flights=this.flights.filter(f=>now-f.at<1050);
 }
 draw(now){
  const c=this.ctx,w=this.width,h=this.height;c.clearRect(0,0,w,h);if(this.layer.hidden||this.media.matches||document.body.classList.contains('reduced'))return;
  const ms=Math.max(0,now-this.s.stageAt),reveal=this.s.stage==='reveal',rush=reveal?clamp((ms-3100)/650)*clamp((7100-ms)/1000):0;
  // Small pixel bubbles follow the current; no screen-sized flash or darkness.
  for(let i=0;i<28;i++){
   const speed=9+i%5*4+240*rush,t=now/1000,x=(i*137.37+w*.17)%w+Math.sin(t*.33+i)*6,y=h-((t*speed+i*71.3)%(h+40)),size=i%4===0?3:2;
   c.globalAlpha=.15+(i%3)*.055;c.strokeStyle=i%3===0?'#e6d6a4':'#a8e0d5';c.lineWidth=1;c.strokeRect(Math.round(x),Math.round(y),size,size);
   if(rush>.2){c.globalAlpha=.1*rush;c.fillStyle='#b5e4da';c.fillRect(Math.round(x),Math.round(y+7),1,18+i%3*9);}
  }
  if(reveal&&ms>900&&ms<2400){const t=(ms-900)/1500;for(let i=0;i<24;i++){const angle=i*Math.PI/12,r=35+t*130,x=w*.3+Math.cos(angle)*r,y=h*.33+Math.sin(angle)*r*.5;c.globalAlpha=(1-t)*.45;c.fillStyle=i%2?'#e7ce8e':'#b6e0d1';c.fillRect(Math.round(x),Math.round(y),2,2);}}
  c.globalAlpha=1;
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.raf);removeEventListener('resize',this.resize);this.layer.remove();this.flights=[];this.folio=null;}
}
