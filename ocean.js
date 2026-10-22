import {RenderMetrics} from './render-metrics.js';
// Cached pixel environments with lightweight ambient animation. No seafloor.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x);};
export const BIOMES=[{at:0,name:'SUNLIT WATERS',color:'#6de4e6'},{at:350,name:'THE TWILIGHT',color:'#6bbfd9'},{at:1100,name:'MIDNIGHT ZONE',color:'#8499d4'},{at:3000,name:'THE ABYSS',color:'#bd92da'},{at:5500,name:'HADAL DEPTHS',color:'#e4b678'}];
export function biomeAt(depth){return [...BIOMES].reverse().find(b=>depth>=b.at)||BIOMES[0];}
export class Ocean {
 constructor(canvas){
  this.metrics=new RenderMetrics();this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.images={};this.files={sky:'sky-law.png',shallow:'water-open.png',mid:'mid-law.png',trench:'trench-law.png',hadal:'hadal-pixel.png'};
  this.mode='home';this.depth=0;this.visualDepth=0;this.camera=0;this.time=0;this.previous=0;this.lastPaint=0;this._reduced=false;this.burst=0;this.raf=null;this.cacheKey='';this.cacheRebuilds=0;
  this.backdrop=document.createElement('canvas');this.background=this.backdrop.getContext('2d',{alpha:false});
  this.loop=this.loop.bind(this);
  this.resize=()=>{this.w=innerWidth;this.h=innerHeight;this.ratio=1;canvas.width=this.w;canvas.height=this.h;this.backdrop.width=this.w;this.backdrop.height=this.h;this.ctx.imageSmoothingEnabled=false;this.background.imageSmoothingEnabled=false;this.cacheKey='';this.schedule();};
  this.resize();addEventListener('resize',this.resize);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.raf);this.raf=null;}else{this.previous=0;this.schedule();}});
  this.load('sky');
 }
 load(key){if(this.images[key])return;const img=new Image();img.decoding='async';img.onload=()=>{this.cacheKey='';this.schedule();};img.src='assets/'+this.files[key];this.images[key]=img;}
 schedule(){if(this.raf===null&&!document.hidden)this.raf=requestAnimationFrame(this.loop);}
 set(mode,depth=0){if(mode===this.mode&&depth===this.depth)return;this.mode=mode;this.depth=depth;if(mode==='dive'||mode==='party'){this.load('shallow');this.load('mid');if(depth>=1300)this.load('trench');if(depth>=4000)this.load('hadal');}this.schedule();}
 set reduced(value){if(this._reduced===value)return;this._reduced=value;this.cacheKey='';this.schedule();}
 get reduced(){return this._reduced;}
 get displayedDepth(){return Math.round(this.visualDepth);}
 celebrate(){this.burst=1;this.schedule();}
 ready(key){return this.images[key]?.complete&&this.images[key]?.naturalWidth>0;}
 layer(key,alpha,y,height,drift=0){if(!this.ready(key)||alpha<.002)return;const c=this.paintContext||this.ctx;c.globalAlpha=alpha;c.drawImage(this.images[key],-8+drift,y,this.w+16,height);c.globalAlpha=1;}
 loop(now){this.raf=null;if(document.hidden)return;const goal=this.mode==='dive'?this.h*.68+this.visualDepth*.09:this.mode==='party'?this.h*.62:0;const moving=Math.abs(this.depth-this.visualDepth)>1||Math.abs(goal-this.camera)>1;const interval=moving?1000/60:1000/30;if(now-this.lastPaint<interval-.8){this.schedule();return;}const dt=Math.min(.1,(now-this.previous)/1000||.033);this.previous=now;this.lastPaint+=interval;if(now-this.lastPaint>interval)this.lastPaint=now;if(!this.reduced)this.time+=dt*.42;const ease=this.reduced?1:1-Math.exp(-dt*1.3);this.visualDepth+=(this.depth-this.visualDepth)*ease;if(Math.abs(this.depth-this.visualDepth)<.2)this.visualDepth=this.depth;const target=this.mode==='dive'?this.h*.68+this.visualDepth*.09:this.mode==='party'?this.h*.62:0;this.camera+=(target-this.camera)*(this.reduced?1:1-Math.exp(-dt*1.6));if(Math.abs(target-this.camera)<.2)this.camera=target;this.burst=Math.max(0,this.burst-dt*.65);const started=this.metrics.enabled?performance.now():0;this.draw(this.time);this.metrics.sample(started,now,this.ratio,this.cacheRebuilds);if(!this.reduced)this.schedule();}
 environment(){
  const key=[this.mode,Math.round(this.camera),Math.round(this.visualDepth/8),...Object.keys(this.images).map(k=>Number(this.ready(k)))].join(':');
  if(key===this.cacheKey)return;this.cacheKey=key;this.cacheRebuilds++;
  const c=this.background,W=this.w,H=this.h,d=this.visualDepth,surface=H*.48-this.camera;this.paintContext=c;c.globalAlpha=1;c.fillStyle='#091829';c.fillRect(0,0,W,H);
  if(surface>0){const sky=c.createLinearGradient(0,0,0,H*.48);sky.addColorStop(0,'#88cedd');sky.addColorStop(1,'#dfefec');c.fillStyle=sky;c.fillRect(0,0,W,surface);this.layer('sky',1,-this.camera,H*.48);}
  const start=Math.max(0,surface);c.save();c.beginPath();c.rect(0,start,W,H-start);c.clip();
  const mid=smooth(250,1150,d),trench=smooth(2300,3700,d),hadal=smooth(5100,6300,d),g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,d<400?'#143e5b':d<2500?'#0b2038':'#081420');g.addColorStop(1,'#071323');c.fillStyle=g;c.fillRect(0,start,W,H);
  if(this.mode==='home'||this.mode==='summary'){
   // Open water on the surface screen: no foreground plants or giant shafts.
   const sea=c.createLinearGradient(0,start,0,H);sea.addColorStop(0,'#17445f');sea.addColorStop(.24,'#102f49');sea.addColorStop(1,'#081b30');c.fillStyle=sea;c.fillRect(0,start,W,H-start);
  }else{this.layer('shallow',1-mid,surface,Math.max(H*1.65,W*.98));this.layer('mid',mid*(1-trench),-H*.16-d*.018,H*1.75);this.layer('trench',trench*(1-hadal),-H*.18-(d-2300)*.014,H*1.7);this.layer('hadal',hadal,-H*.18-(d-5100)*.012,H*1.7);}
  if(hadal){c.fillStyle=`rgba(6,2,17,${hadal*.34})`;c.fillRect(0,0,W,H);}const shade=c.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#020b1700');shade.addColorStop(1,this.mode==='home'?'#020b1744':'#020b1733');c.fillStyle=shade;c.fillRect(0,0,W,H);c.restore();if(this.mode==='summary'){c.fillStyle='#071320b8';c.fillRect(0,0,W,H);}this.paintContext=null;
 }

 draw(t){
  const c=this.ctx,W=this.w,H=this.h,d=this.visualDepth,surface=H*.48-this.camera;
  this.environment();c.globalAlpha=1;c.drawImage(this.backdrop,0,0);const start=Math.max(0,surface),mid=smooth(250,1150,d),hadal=smooth(5100,6300,d);c.save();c.beginPath();c.rect(0,start,W,H-start);c.clip();
  this.fishSchool(t,d,mid);
  // Depth changes turn a slow ambient drift into a rushing descent wake.
  const wake=this.burst*16;
  for(let i=0;i<(this.mode==='home'?14:26);i++){const x=(i*127.73+Math.sin(t*.28+i)*9+W*2)%W;const y=((i*83.41-t*(3+i%5+wake)+this.camera*.25)%(H+50)+(H+50))%(H+50)-20;const a=.06+(i%5)*.035;c.fillStyle=`rgba(${hadal>.4?'194,162,226':'157,214,229'},${a})`;const size=i%13===0?3:1;c.fillRect(Math.round(x),Math.round(y),size,size);if(i%13===0){c.fillStyle='#b9e6e855';c.fillRect(Math.round(x)+1,Math.round(y)-1,2,1);}if(wake>4&&i%2===0){c.fillStyle='#9dc9e41a';c.fillRect(Math.round(x),Math.round(y)+4,1,Math.min(22,wake*.3));}}
  if(d>900)this.glowLife(t,d,hadal);
  if(this.burst>0){for(let i=0;i<24;i++){const a=i*2.4,r=(1-this.burst)*180;c.fillStyle=i%3===0?'#f1c36b88':'#6ee0ea66';c.fillRect(Math.round(W/2+Math.cos(a)*r),Math.round(H*.54+Math.sin(a)*r*.5),2,3);}}
  c.restore();
  // Thin moving water ripples rather than a row of oversized repeated blocks.
  if(surface>-10&&surface<H+8){for(let row=0;row<7;row++){c.fillStyle=row<2?'#c4ede9':'#69bbcd';c.globalAlpha=(1-row/8)*.58;for(let x=-20;x<W+20;x+=23+row*7){const length=7+(Math.sin(x*.019+t*.8+row)+1)*13;const y=Math.round(surface+row*2+Math.sin(x*.024+t*1.2+row)*1.3);c.fillRect(Math.round(x+Math.sin(t*.6+row)*8),y,Math.round(length),1);}}c.globalAlpha=1;}
 }
 fishSchool(t,d,mid){const c=this.ctx;for(let i=0;i<(this.mode==='home'?4:7);i++){const dir=i%2?1:-1,scale=.65+(i%4)*.2,x=((i*179+t*dir*(7+i%3)+this.w*8)%(this.w+100))-50,y=this.h*.2+((i*73+this.camera*.16)%(this.h*.7));c.save();c.translate(Math.round(x),Math.round(y+Math.sin(t+i)*2));c.scale(dir*scale,scale);c.globalAlpha=mid>.6?.15:.24;c.fillStyle=mid>.6?'#3e7894':'#051d32';const tail=Math.sin(t*5+i)>0?1:0;const rows=[[8,0,7,1],[4,1,16,1],[2,2,21,1],[1,3,24,2],[2,5,21,1],[4,6,16,1],[8,7,7,1]];for(const r of rows)c.fillRect(...r);c.fillRect(-4,tail,3,7-tail);c.fillRect(-1,2,3,4);c.fillStyle='#79bdc855';c.fillRect(19,2,1,1);c.restore();}}
 glowLife(t,d,hadal){const c=this.ctx;for(let j=0;j<3;j++){const x=this.w*(.1+j*.4)+Math.sin(t*.2+j)*18,y=((j*173-t*5+this.h*4)%(this.h+140))-60;c.save();c.translate(Math.round(x),Math.round(y));const pulse=Math.sin(t*2+j),w=14+Math.round(pulse*2);c.globalAlpha=.16+Math.max(0,pulse)*.08;c.fillStyle=hadal>.3?'#bd89c9':'#7bc6da';for(let r=0;r<6;r++)c.fillRect(-w+r,6-r*2,w*2-r*2,2);for(let k=0;k<4;k++){const tx=-9+k*6;for(let n=0;n<7;n++)c.fillRect(tx+Math.round(Math.sin(t*2+n*.8+k)*3),8+n*3,1,3);}c.restore();}}
}
