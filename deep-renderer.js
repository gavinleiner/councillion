import {DEEP_ART,DEEP_ROOMS,DEEP_WORLD as W,DEEP_DOCK,DEEP_COLORS,roomAt,roomPoint} from './deep-data.js';
import {blocked} from './deep-engine.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const imageCache=new Map();
function loadImage(src){if(!imageCache.has(src))imageCache.set(src,new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>resolve(null);i.src=src;}));return imageCache.get(src);}
const SPRITES={krill:'assets/counsel-krill-still.svg',schooler:'assets/party-buddies/schooler-ai-v1.png',squid:'assets/party-buddies/squid-ai-v1.png',angler:'assets/party-buddies/angler-ai-v1.png',evil:'assets/game-mascots/trial-puffer-v41.svg'};
export class DeepRenderer{
 constructor(canvas,{onFollow=()=>{}}={}){
  Object.assign(this,{canvas,c:canvas.getContext('2d',{alpha:false}),images:{},sprites:{},positions:new Map(),camera:{x:384,y:240},frame:0,last:0,frames:0,moving:0,onFollow,particles:[],eventSeen:0,reduced:false,quality:'auto',shake:0});
  this.mask=document.createElement('canvas');this.mc=this.mask.getContext('2d');
  this.media=matchMedia('(prefers-reduced-motion: reduce)');this.resize=()=>{const r=canvas.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,1.3,1280/Math.max(1,r.width));canvas.width=Math.max(1,Math.round(r.width*scale));canvas.height=Math.max(1,Math.round(r.height*scale));this.width=r.width;this.height=r.height;this.ratio=scale;this.mask.width=canvas.width;this.mask.height=canvas.height;};this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);this.resize();
  Promise.allSettled(Object.entries(DEEP_ART).map(async([k,v])=>{this.images[k]=await loadImage(v);}));Promise.allSettled(Object.entries(SPRITES).map(async([k,v])=>{this.sprites[k]=await loadImage(v);}));
  this.loop=n=>{this.frame=requestAnimationFrame(this.loop);if(document.hidden||n-this.last<1000/30||!this.state)return;const dt=Math.min(.1,(n-this.last)/1000||.03);this.last=n;this.frames++;this.reduced=this.media.matches||document.body.classList.contains('reduced');this.draw(n/1000,dt);};this.frame=requestAnimationFrame(this.loop);
 }
 setState(s,uid){const key=s.matchId??'lobby';if(key!==this.matchKey){this.matchKey=key;this.positions.clear();this.particles=[];this.eventSeen=0;const p=s.players.find(p=>p.id===uid);this.camera={x:p?.x??384,y:p?.y??240};}this.state=s;this.uid=uid;}
 sprite(p,x,y,t,scale=1){const c=this.c,img=this.sprites[p.buddy]??this.sprites.krill,down=p.status==='down'||p.status==='lost',bob=this.reduced?0:Math.sin(t*(p.walking?13:2.3)+(p.id?.length??0))* (p.walking?2:1.1);c.save();c.translate(x,y);c.globalAlpha=p.status==='lost'?.3:1;c.fillStyle='#0008';c.beginPath();c.ellipse(0,5,24*scale,7*scale,0,0,TAU);c.fill();if(down){c.rotate(-.5);c.globalAlpha=.65;}if(img){const h=(p.buddy==='squid'?58:51)*scale,w=h*img.width/img.height;c.drawImage(img,-w/2,-h+bob,w,h);}c.restore();}
 label(text,x,y,color='#c7dbd9',font=13){const c=this.c;c.font=font+'px VT,monospace';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#051725';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);}
 glow(x,y,r,color,c=this.c){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
 draw(t,dt){
  const s=this.state,c=this.c,w=this.width,h=this.height;if(w<2||h<2)return;c.setTransform(this.ratio,0,0,this.ratio,0,0);c.imageSmoothingEnabled=false;c.fillStyle='#03121d';c.fillRect(0,0,w,h);
  if(['lobby','briefing','descent','finish'].includes(s.stage)){this.hub(t,dt);return;}
  let me=s.players.find(p=>p.id===this.uid);if(!me||me.status==='lost')me=s.players.find(p=>p.status==='alive')??s.players[0];if(!me)return;
  const z=Math.max(.7,Math.min(1.3,w/860,h/510)),exiting=s.stage==='extraction',zoom=z*(exiting?1+clamp((s.time-s.stageAt)/5,0,1)*.3:1);this.zoom=zoom;
  const desired={x:clamp(me.x,w/(2*zoom),W.width-w/(2*zoom)),y:clamp(me.y,h/(2*zoom),W.height-h/(2*zoom))};
  const smooth=this.reduced?1:1-Math.exp(-dt*5);this.camera.x=lerp(this.camera.x,desired.x,smooth);this.camera.y=lerp(this.camera.y,desired.y,smooth);this.cam={x:this.camera.x-w/(2*zoom),y:this.camera.y-h/(2*zoom)};
  this.shake=Math.max(0,this.shake-dt*14);const sx=this.reduced?0:Math.sin(t*53)*this.shake,sy=this.reduced?0:Math.cos(t*39)*this.shake;
  c.save();c.translate(w/2+sx,h/2+sy);c.scale(zoom,zoom);c.translate(-this.camera.x,-this.camera.y);
  const visible=[];for(const room of DEEP_ROOMS){const x=room.col*768,y=room.row*480;if(x+768<this.cam.x||y+480<this.cam.y||x>this.cam.x+w/zoom||y>this.cam.y+h/zoom)continue;visible.push(room);const img=this.images[room.art];if(img)c.drawImage(img,x,y,768,480);else{c.fillStyle='#123c4c';c.fillRect(x,y,768,480);}}
  this.exitMarkers(s,t);this.caustics(visible,t);this.objectives(s,t);
  const things=[...s.players.map((p,i)=>({p,i,kind:'player'})),...s.enemies.map((p,i)=>({p,i,kind:'enemy'}))].sort((a,b)=>a.p.y-b.p.y);
  for(const {p,i,kind}of things){const k=kind+p.id;let pos=this.positions.get(k);if(!pos){pos={x:p.x,y:p.y};this.positions.set(k,pos);}const moving=Math.hypot(p.x-pos.x,p.y-pos.y)>1;pos.x=lerp(pos.x,p.x,this.reduced?1:1-Math.exp(-dt*18));pos.y=lerp(pos.y,p.y,this.reduced?1:1-Math.exp(-dt*18));if(kind==='player'){
    if(p.lamp&&p.status==='alive'){this.glow(pos.x,pos.y,30,'#d3efca12');c.strokeStyle='#9cd8cd20';c.beginPath();c.arc(pos.x,pos.y,30,0,TAU);c.stroke();}
    this.sprite({...p,walking:moving},pos.x,pos.y,t,1);this.label(p.name+(p.id===this.uid?' · YOU':''),pos.x,pos.y-61,DEEP_COLORS[i%6]);
    if(p.status==='alive'){c.fillStyle='#153442';c.fillRect(pos.x-17,pos.y+14,34,3);c.fillStyle=DEEP_COLORS[i%6];c.fillRect(pos.x-17,pos.y+14,34*Math.max(0,p.hp)/3,3);if(p.noise>20)this.ring(pos.x,pos.y,t*.9,58,'#edb67b28');}
    if(p.status==='down'){this.ring(pos.x,pos.y,t*.6,34,'#f2998d99');this.label('RESCUE',pos.x,pos.y+29,'#ed9d8b',11);}
   }else this.enemy(p,pos,t,i);
  }
  for(const ping of s.pings){this.ring(ping.x,ping.y,(s.time-ping.at)*.55,80,'#9de6d4bb');this.label('HERE',ping.x,ping.y-65,'#9de6d4',12);}
  this.effects(s,t,dt);c.restore();this.lighting(s,me,t);this.border(s,t);
 }
 hub(t){const c=this.c,w=this.width,h=this.height,img=this.images.hub;if(img){const scale=Math.max(w/img.width,h/img.height),iw=img.width*scale,ih=img.height*scale;c.drawImage(img,(w-iw)/2,(h-ih)/2,iw,ih);}const s=this.state;
  const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#03162350');shade.addColorStop(.55,'#03162304');shade.addColorStop(1,'#031623aa');c.fillStyle=shade;c.fillRect(0,0,w,h);
  for(let i=0;i<17;i++){const x=(i*.163%1)*w,y=h*.17+((i*37-t*4)%Math.max(10,h*.31)+h*.31)%(h*.31);c.strokeStyle='#b7e2df22';c.lineWidth=1;c.strokeRect(Math.round(x),Math.round(y),2+i%3,2+i%3);}
  const spread=Math.min(w*.57,630),start=(w-spread)/2,crewY=h*.78;
  s.players.forEach((p,i)=>{const x=start+spread*(i+.5)/Math.max(1,s.players.length),y=crewY+(i%2)*6;this.sprite(p,x,y,this.reduced?0:t,1.3);this.label(p.name,x,y+25,DEEP_COLORS[i%6],15);this.label(p.bot?'CREW BOT':p.ready?'READY':'PREPARING',x,y+42,'#8cbeb9',10);});
  const light=this.reduced?.1:.08+Math.sin(t*1.4)*.02;this.glow(w*.5,h*.06,w*.32,`rgba(238,193,112,${light})`);
  if(s.stage==='descent'){const k=clamp((s.time-s.stageAt)/4,0,1);c.fillStyle=`rgba(1,12,24,${k*.8})`;c.fillRect(0,0,w,h);for(let i=0;i<26;i++){const x=(i*.618%1)*w,y=((i*71-t*100)%(h+50)+h+50)%(h+50);c.fillStyle='#92dbd84f';c.fillRect(x,y,2,10+i%5);}}
 }
 ring(x,y,t,r,color){const c=this.c,k=((t%1)+1)%1;c.save();c.globalAlpha=1-k;c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.ellipse(x,y,r*k,r*k*.52,0,0,TAU);c.stroke();c.restore();}
 caustics(rooms,t){if(this.reduced)return;const c=this.c;for(const room of rooms){const x=room.col*768,y=room.row*480;c.save();c.beginPath();c.rect(x+33,y+35,702,410);c.clip();for(let i=0;i<14;i++){const px=x+50+((i*87+t*3)%665),py=y+75+((i*131)%340);c.strokeStyle='#9fe2d516';c.lineWidth=1;c.beginPath();c.moveTo(px,py);c.lineTo(px+15,py+Math.sin(t*.7+i)*5);c.lineTo(px+28,py-6);c.stroke();c.fillStyle='#c3e7d740';c.fillRect(x+((i*137+t*2)%760),y+((i*53-t*5+60000)%470),1,1);}c.restore();}}
 exitMarkers(s,t){const c=this.c;for(const room of DEEP_ROOMS){const x=room.col*768,y=room.row*480;for(const [dx,dy]of [[384,18],[384,462],[18,240],[750,240]]){const endX=x+dx,endY=y+dy,edge=dx===18&&room.col===0||dx===750&&room.col===2||dy===18&&room.row===0||dy===462&&room.row===1;if(edge){c.fillStyle='#061d2a';if(dx===18||dx===750)c.fillRect(endX-20,endY-53,40,106);else c.fillRect(endX-53,endY-20,106,40);continue;}const locked=(room.id===5&&!s.seals.every(a=>a.open));c.fillStyle=locked?'#b26b6180':'#8ac8bb55';if(dx===18||dx===750)c.fillRect(endX-2,endY-43,4,86);else c.fillRect(endX-43,endY-2,86,4);}}
  this.glow(DEEP_DOCK.x,DEEP_DOCK.y,105,'#79e4c826');this.ring(DEEP_DOCK.x,DEEP_DOCK.y,t*.2,90,'#90dac677');this.label('AIRLOCK · BANK & REFILL',DEEP_DOCK.x,DEEP_DOCK.y-82,'#acd7c9',13);
 }
 objectives(s,t){const c=this.c;
  for(const a of s.seals){this.glow(a.x,a.y,55,a.open?'#8ef6ce30':'#e8bd6a26');c.save();c.translate(a.x,a.y);c.rotate(this.reduced?0:Math.sin(t*.4)*.03);c.strokeStyle=a.open?'#8ef6ce':'#e7bf77';c.lineWidth=3;c.strokeRect(-15,-15,30,30);c.beginPath();c.moveTo(-22,0);c.lineTo(22,0);c.moveTo(0,-22);c.lineTo(0,22);c.stroke();c.restore();this.label(a.open?'SEAL RESTORED':'COURT SEAL',a.x,a.y-32,a.open?'#9be5c9':'#e7bf77',11);if(!a.open&&a.progress>0){c.fillStyle='#203d49';c.fillRect(a.x-24,a.y+27,48,4);c.fillStyle='#e7bf77';c.fillRect(a.x-24,a.y+27,48*a.progress,4);}}
  for(const p of [roomPoint(2,605,237),roomPoint(3,170,240)]){this.glow(p.x,p.y,40,'#83dace20');c.fillStyle='#1c4554';c.fillRect(p.x-10,p.y-19,20,32);c.strokeStyle='#85d5cd';c.strokeRect(p.x-10,p.y-19,20,32);c.fillStyle='#b2e5d1';c.fillRect(p.x-2,p.y-13,4,20);this.label('AIR',p.x,p.y+29,'#9ad6cc',10);}
  for(const item of s.items){if(item.banked)continue;const bob=item.carriers.length?0:this.reduced?0:Math.sin(t*2+Number(item.id.slice(1)))*2;c.save();c.translate(item.x,item.y+bob);if(item.carriers.length===2){for(const id of item.carriers){const p=s.players.find(p=>p.id===id);c.strokeStyle='#e4c78280';c.setLineDash([3,3]);c.beginPath();c.moveTo(0,0);c.lineTo(p.x-item.x,p.y-item.y);c.stroke();c.setLineDash([]);}}
   this.glow(0,0,37,'#e9ce7c20');c.fillStyle='#071b2b99';c.beginPath();c.ellipse(0,8,item.heavy?27:15,6,0,0,TAU);c.fill();
   if(item.id==='e6'){c.fillStyle='#6a4935';c.fillRect(-3,-13,6,38);c.fillStyle='#ddbd6c';c.fillRect(-23,-21,46,17);c.fillStyle='#f3dda0';c.fillRect(-23,-21,46,4);c.fillStyle='#8e693e';c.fillRect(-27,-22,5,21);c.fillRect(23,-22,5,21);}
   else if(item.heavy){c.fillStyle='#8e754b';c.fillRect(-28,-18,56,36);c.fillStyle='#dab981';c.fillRect(-28,-18,56,5);c.fillStyle='#284856';c.fillRect(-22,-9,44,21);c.fillStyle='#e5c88b';c.fillRect(-3,-9,6,10);}
   else{c.fillStyle=item.id==='e4'?'#d9bc74':'#b5b99d';c.fillRect(-13,-17,26,26);c.fillStyle='#efe0b0';c.fillRect(-10,-15,21,20);c.fillStyle='#6a745e';for(let i=0;i<3;i++)c.fillRect(-6,-10+i*5,13,1);c.fillStyle='#d8b26b';c.fillRect(6,1,7,7);}
   this.label('+'+item.value+(item.heavy?' · 2 CREW':''),0,-34,'#e4cd8e',11);c.restore();}
 }
 enemy(e,pos,t,index){const c=this.c,im=this.images.enemies,sz=e.id==='judge'?119:e.id==='bailiff'?86:76,bob=this.reduced?0:Math.sin(t*(e.mode==='hunt'?7:2)+index)*3;c.save();c.translate(pos.x,pos.y);c.fillStyle='#0007';c.beginPath();c.ellipse(0,6,sz*.34,11,0,0,TAU);c.fill();if(im)c.drawImage(im,index*im.width/3,0,im.width/3,im.height,-sz/2,-sz+bob,sz,sz);else{const fallback=this.sprites[e.id==='clerk'?'squid':'evil'];if(fallback)c.drawImage(fallback,-sz/2,-sz,sz,sz);}if(e.mode==='frozen'){c.strokeStyle='#9be7d6';c.lineWidth=2;c.beginPath();c.arc(0,-sz/2,sz*.47,0,TAU);c.stroke();}this.label(e.name,0,-sz-12,e.mode==='hunt'?'#eda08b':'#a5c0cb',11);if(e.mode==='hunt')this.label('!',0,-sz-29,'#ef997f',20);c.restore();}
 lighting(s,me,t){const c=this.c,mc=this.mc,z=this.zoom,w=this.width,h=this.height;mc.setTransform(this.ratio,0,0,this.ratio,0,0);mc.clearRect(0,0,w,h);mc.globalCompositeOperation='source-over';mc.fillStyle=s.stage==='lockdown'?'rgba(5,7,19,.78)':'rgba(2,12,24,.72)';mc.fillRect(0,0,w,h);mc.globalCompositeOperation='destination-out';
  const screen=p=>({x:(p.x-this.cam.x)*z,y:(p.y-this.cam.y)*z});
  for(const p of s.players){if(p.status==='lost')continue;const at=screen(p),rad=(p.lamp?140:65)*z;this.glow(at.x,at.y,rad,'rgba(255,255,255,.92)',mc);if(p.status==='alive'&&p.lamp){const reach=(p.gear==='lamp'?340:265),spread=.55,points=[];for(let i=0;i<=18;i++){const a=p.angle-spread+i*spread*2/18;let r=25;while(r<reach&&!blocked(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,2,s))r+=12;points.push({x:at.x+Math.cos(a)*r*z,y:at.y+Math.sin(a)*r*z});}mc.save();mc.beginPath();mc.moveTo(at.x,at.y);for(const q of points)mc.lineTo(q.x,q.y);mc.closePath();mc.clip();this.glow(at.x,at.y,reach*z,'rgba(255,255,255,.91)',mc);mc.restore();}}
  const dock=screen(DEEP_DOCK);this.glow(dock.x,dock.y,175*z,'rgba(255,255,255,.9)',mc);for(const a of s.seals){const p=screen(a);this.glow(p.x,p.y,62*z,'rgba(255,255,255,.7)',mc);}mc.globalCompositeOperation='source-over';c.setTransform(1,0,0,1,0,0);c.drawImage(this.mask,0,0);c.setTransform(this.ratio,0,0,this.ratio,0,0);
 }
 border(s,t){const c=this.c,w=this.width,h=this.height,g=c.createRadialGradient(w/2,h/2,h*.25,w/2,h/2,Math.max(w,h)*.66);g.addColorStop(0,'transparent');g.addColorStop(1,'#010711b0');c.fillStyle=g;c.fillRect(0,0,w,h);if(s.stage==='lockdown'){c.fillStyle=`rgba(193,79,66,${this.reduced?.045:.035+Math.sin(t*2)*.02})`;c.fillRect(0,0,w,h);}if(s.stage==='extraction'){c.fillStyle=`rgba(2,18,27,${clamp((s.time-s.stageAt)/5,0,1)*.9})`;c.fillRect(0,0,w,h);}}
 effects(s,t,dt){const c=this.c;for(const e of s.events){if(e.id<=this.eventSeen)continue;this.eventSeen=e.id;if(['hit','lockdown','bank','seal','rescue'].includes(e.type)){if(e.type==='hit'||e.type==='lockdown')this.shake=2.5;const p=s.players.find(p=>p.id===e.player);for(let i=0;i<12;i++){const a=i*TAU/12;this.particles.push({x:e.x??p?.x??this.camera.x,y:e.y??p?.y??this.camera.y,vx:Math.cos(a)*(20+i%3*12),vy:Math.sin(a)*30,life:1,color:e.type==='hit'?'#ef9d82':e.type==='rescue'?'#92e0c2':'#e4ca86'});}}}
  if(!this.reduced)for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;c.globalAlpha=Math.max(0,p.life);c.fillStyle=p.color;c.fillRect(p.x,p.y,2,2);}c.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);
 }
 worldPointer(x,y){return this.cam?{x:x/this.zoom+this.cam.x,y:y/this.zoom+this.cam.y}:null;}
 dispose(){cancelAnimationFrame(this.frame);this.observer.disconnect();this.positions.clear();this.particles=[];}
}
