import {RenderMetrics} from './render-metrics.js';
import {BIOMES,biomeAt,cameraAtDepth,worldAtDepth,depthScreenY,sceneryBands,LANDMARKS} from './depth-world.js';
export {BIOMES,biomeAt} from './depth-world.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x);};
export class Ocean {
 constructor(canvas){
  this.metrics=new RenderMetrics();this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
  this.images={};this.files={sky:'sky-law.png',shallow:'water-open.png',mid:'mid-law.png',trench:'trench-law.png',hadal:'hadal-pixel.png'};
  this.mode='home';this.depth=0;this.visualDepth=0;this.camera=0;this.time=0;this.previous=0;this.lastPaint=0;this._reduced=false;this.burst=0;this.raf=null;this.cacheKey='';this.cacheRebuilds=0;this.tiles=new Map();
  this.backdrop=document.createElement('canvas');this.background=this.backdrop.getContext('2d',{alpha:false});this.loop=this.loop.bind(this);
  this.resize=()=>{this.w=innerWidth;this.h=innerHeight;this.ratio=1;canvas.width=this.w;canvas.height=this.h;this.backdrop.width=this.w;this.backdrop.height=this.h;this.ctx.imageSmoothingEnabled=false;this.background.imageSmoothingEnabled=false;this.cacheKey='';this.tiles.clear();this.schedule();};
  this.resize();addEventListener('resize',this.resize);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.raf);this.raf=null;}else{this.previous=0;this.schedule();}});
  this.load('sky');
 }
 load(key){if(this.images[key])return;const img=new Image();img.decoding='async';img.onload=()=>{this.cacheKey='';this.tiles.delete(key);this.schedule();};img.src='assets/'+this.files[key];this.images[key]=img;}
 schedule(){if(this.raf===null&&!document.hidden)this.raf=requestAnimationFrame(this.loop);}
 set(mode,depth=0){
  if(mode===this.mode&&depth===this.depth)return;this.mode=mode;this.depth=depth;
  if(mode==='dive'||mode==='party'){this.load('shallow');this.load('mid');if(depth>=900)this.load('trench');if(depth>=2400)this.load('hadal');}
  this.schedule();
 }
 set reduced(value){if(this._reduced===value)return;this._reduced=value;this.cacheKey='';this.schedule();}
 get reduced(){return this._reduced;}
 get displayedDepth(){return Math.round(this.visualDepth);}
 get targetCamera(){return this.mode==='dive'?cameraAtDepth(this.depth,this.h):this.mode==='party'?cameraAtDepth(0,this.h):0;}
 snap(depth=0){this.visualDepth=depth;this.camera=this.mode==='dive'?cameraAtDepth(depth,this.h):0;this.cacheKey='';this.schedule();}
 celebrate(){this.burst=1;this.schedule();}
 ready(key){return this.images[key]?.complete&&this.images[key]?.naturalWidth>0;}
 loop(now){
  this.raf=null;if(document.hidden)return;
  const moving=Math.abs(this.depth-this.visualDepth)>1||Math.abs(this.targetCamera-this.camera)>1,interval=moving?1000/60:1000/30;
  if(now-this.lastPaint<interval-.8){this.schedule();return;}
  const dt=Math.min(.1,(now-this.previous)/1000||.033);this.previous=now;this.lastPaint+=interval;if(now-this.lastPaint>interval)this.lastPaint=now;
  if(!this.reduced)this.time+=dt*.42;
  const ease=this.reduced?1:1-Math.exp(-dt*2.3);
  this.visualDepth+=(this.depth-this.visualDepth)*ease;if(Math.abs(this.depth-this.visualDepth)<.2)this.visualDepth=this.depth;
  // One eased world position drives every background, landmark, and ruler tick.
  const target=this.mode==='dive'?cameraAtDepth(this.visualDepth,this.h):this.mode==='party'?cameraAtDepth(0,this.h):0;
  this.camera=this.reduced?target:this.camera+(target-this.camera)*(1-Math.exp(-dt*7));
  if(Math.abs(target-this.camera)<.2)this.camera=target;
  this.burst=Math.max(0,this.burst-dt*.65);
  const started=this.metrics.enabled?performance.now():0;this.draw(this.time);this.metrics.sample(started,now,this.ratio,this.cacheRebuilds);
  if(!this.reduced)this.schedule();
 }
 tile(band){
  if(!this.ready(band.key))return null;
  if(this.tiles.has(band.key))return this.tiles.get(band.key);
  const edge=Math.round(this.h*.12),height=Math.ceil(band.bottom-band.top+edge*2),tile=document.createElement('canvas');
  tile.width=this.w;tile.height=height;const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
  c.fillStyle=band.color;c.fillRect(0,0,this.w,height);c.globalAlpha=band.opacity;
  c.drawImage(this.images[band.key],0,0,this.w,height);c.globalAlpha=1;
  // Only the joins feather: the rest of the picture stays fully visible.
  const mask=c.createLinearGradient(0,0,0,height);mask.addColorStop(0,'#fff0');mask.addColorStop(edge/height,'#fff');mask.addColorStop(1-edge/height,'#fff');mask.addColorStop(1,'#fff0');
  c.globalCompositeOperation='destination-in';c.fillStyle=mask;c.fillRect(0,0,this.w,height);c.globalCompositeOperation='source-over';
  const entry={canvas:tile,top:band.top-edge,height};this.tiles.set(band.key,entry);return entry;
 }
 environment(){
  const key=[this.mode,Math.round(this.camera),...Object.keys(this.images).map(k=>Number(this.ready(k)))].join(':');
  if(key===this.cacheKey)return;this.cacheKey=key;this.cacheRebuilds++;
  const c=this.background,W=this.w,H=this.h,surface=H*.48-this.camera;
  c.globalAlpha=1;
  // These colors live in the world, so the light boundary travels upwards.
  const water=c.createLinearGradient(0,surface,0,worldAtDepth(8000,H)-this.camera);
  for(const [d,color] of [[0,'#225b7c'],[200,'#173b59'],[650,'#132e4b'],[1500,'#112d42'],[3000,'#1b243b'],[8000,'#152038']])water.addColorStop((worldAtDepth(d,H)-H*.48)/(worldAtDepth(8000,H)-H*.48),color);
  water.addColorStop(0,'#286886');c.fillStyle=water;c.fillRect(0,0,W,H);
  if(surface>0){
   const sky=c.createLinearGradient(0,-this.camera,0,surface);sky.addColorStop(0,'#86ccdd');sky.addColorStop(1,'#dcefeb');c.fillStyle=sky;c.fillRect(0,0,W,Math.min(H,surface));
   if(this.ready('sky')){const image=this.images.sky,scale=Math.max(W/image.naturalWidth,H*.48/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;c.save();c.beginPath();c.rect(0,0,W,Math.min(H,surface));c.clip();c.drawImage(image,(W-w)/2,surface-h,w,h);c.restore();}
  }
  if(this.mode==='home'||this.mode==='summary'){
   const sea=c.createLinearGradient(0,surface,0,H);sea.addColorStop(0,'#194760');sea.addColorStop(1,'#102c47');c.fillStyle=sea;c.fillRect(0,Math.max(0,surface),W,H-Math.max(0,surface));
  }else{
   c.save();c.beginPath();c.rect(0,Math.max(0,surface),W,H-Math.max(0,surface));c.clip();
   for(const band of sceneryBands(H)){
    if(band.bottom+H*.12<this.camera||band.top-H*.12>this.camera+H)continue;
    this.load(band.key);const tile=this.tile(band);if(tile)c.drawImage(tile.canvas,0,Math.round(tile.top-this.camera));
   }
   c.restore();
  }
  if(this.mode==='summary'){c.fillStyle='#0c1d3099';c.fillRect(0,0,W,H);}
 }
 draw(t){
  const c=this.ctx,W=this.w,H=this.h,d=this.visualDepth,surface=H*.48-this.camera,mid=smooth(200,650,d),hadal=smooth(2800,3300,d);
  this.environment();c.globalAlpha=1;c.drawImage(this.backdrop,0,0);c.save();c.beginPath();c.rect(0,Math.max(0,surface),W,H-Math.max(0,surface));c.clip();
  this.fishSchool(t,d,mid);
  const wake=this.burst*12;
  for(let i=0;i<(this.mode==='home'?14:26);i++){
   const x=(i*127.73+Math.sin(t*.28+i)*9+W*2)%W,y=((i*83.41-t*(3+i%5+wake)-this.camera*.55)%(H+50)+(H+50))%(H+50)-20;
   c.fillStyle=`rgba(${hadal>.4?'194,162,226':'157,214,229'},${.09+(i%5)*.035})`;const size=i%13===0?3:1;c.fillRect(Math.round(x),Math.round(y),size,size);
   if(wake>4&&i%2===0){c.fillStyle='#9dc9e41a';c.fillRect(Math.round(x),Math.round(y)+4,1,Math.min(22,wake*.3));}
  }
  if(d>600)this.glowLife(t,d,hadal);
  c.restore();
  if(this.mode==='dive')this.depthDetails();
  if(surface>-10&&surface<H+8){for(let row=0;row<7;row++){c.fillStyle=row<2?'#c4ede9':'#69bbcd';c.globalAlpha=(1-row/8)*.58;for(let x=-20;x<W+20;x+=23+row*7){const length=7+(Math.sin(x*.019+t*.8+row)+1)*13,y=Math.round(surface+row*2+Math.sin(x*.024+t*1.2+row)*1.3);c.fillRect(Math.round(x+Math.sin(t*.6+row)*8),y,Math.round(length),1);}}c.globalAlpha=1;}
 }
 depthDetails(){
  const c=this.ctx,W=this.w,H=this.h,right=W-(W<600?14:24);c.save();
  // World-bound ticks visibly pass the fixed YOU marker during each descent.
  c.fillStyle='#a5c5d944';c.fillRect(right,96,1,H-236);c.font='11px VT,monospace';c.textAlign='right';
  for(let d=0;d<=7500;d+=50){const y=depthScreenY(d,this.camera,H);if(y<100||y>H-145)continue;const major=d%100===0;c.fillStyle=major?'#a5c5d970':'#a5c5d936';c.fillRect(right-(major?12:5),Math.round(y),major?12:5,1);if(major&&Math.abs(y-H*.4)>18)c.fillText(d.toLocaleString()+'m',right-17,Math.round(y)+4);}
  c.fillStyle='#ec8faf';c.fillRect(right-15,Math.round(H*.4),15,1);c.fillText('YOU',right-20,Math.round(H*.4)+4);
  c.font=(W<600?'10':'12')+'px VT,monospace';
  for(const mark of LANDMARKS){const y=depthScreenY(mark.at,this.camera,H);if(y<120||y>H-160)continue;const x=mark.side?W*.81:W*.16;c.textAlign=mark.side?'right':'left';c.fillStyle='#8bb4c980';c.fillText((mark.side?'':'──  ')+mark.text+(mark.side?'  ──':''),x,Math.round(y));}
  c.restore();
 }
 fishSchool(t,d,mid){const c=this.ctx;for(let i=0;i<(this.mode==='home'?4:7);i++){const dir=i%2?1:-1,scale=.65+(i%4)*.2,x=((i*179+t*dir*(7+i%3)+this.w*8)%(this.w+100))-50,y=this.h*.2+(((i*73-this.camera*.8)%(this.h*.7)+this.h*.7)%(this.h*.7));c.save();c.translate(Math.round(x),Math.round(y+Math.sin(t+i)*2));c.scale(dir*scale,scale);c.globalAlpha=mid>.6?.3:.24;c.fillStyle=mid>.6?'#3e7894':'#051d32';const tail=Math.sin(t*5+i)>0?1:0;const rows=[[8,0,7,1],[4,1,16,1],[2,2,21,1],[1,3,24,2],[2,5,21,1],[4,6,16,1],[8,7,7,1]];for(const r of rows)c.fillRect(...r);c.fillRect(-4,tail,3,7-tail);c.fillRect(-1,2,3,4);c.fillStyle='#79bdc855';c.fillRect(19,2,1,1);c.restore();}}
 glowLife(t,d,hadal){const c=this.ctx;for(let j=0;j<3;j++){const x=this.w*(.1+j*.4)+Math.sin(t*.2+j)*18,y=((j*173-t*5+this.h*4)%(this.h+140))-60;c.save();c.translate(Math.round(x),Math.round(y));const pulse=Math.sin(t*2+j),w=14+Math.round(pulse*2);c.globalAlpha=.16+Math.max(0,pulse)*.08;c.fillStyle=hadal>.3?'#bd89c9':'#7bc6da';for(let r=0;r<6;r++)c.fillRect(-w+r,6-r*2,w*2-r*2,2);for(let k=0;k<4;k++){const tx=-9+k*6;for(let n=0;n<7;n++)c.fillRect(tx+Math.round(Math.sin(t*2+n*.8+k)*3),8+n*3,1,3);}c.restore();}}
}
