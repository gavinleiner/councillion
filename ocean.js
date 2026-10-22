// Reference-scale pixel environments. Each layer moves independently; no seafloor.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x);};
export const BIOMES=[{at:0,name:'SUNLIT WATERS',color:'#6de4e6'},{at:350,name:'THE TWILIGHT',color:'#6bbfd9'},{at:1100,name:'MIDNIGHT ZONE',color:'#8499d4'},{at:3000,name:'THE ABYSS',color:'#bd92da'},{at:5500,name:'HADAL DEPTHS',color:'#e4b678'}];
export function biomeAt(depth){return [...BIOMES].reverse().find(b=>depth>=b.at)||BIOMES[0];}
export class Ocean {
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.images={};
  for(const [key,file] of Object.entries({sky:'sky-law.png',shallow:'water-law.png',mid:'mid-law.png',trench:'trench-law.png',hadal:'hadal-pixel.png',kelp:'kelp-pixel-loop.png'})){const img=new Image();img.src='assets/'+file;this.images[key]=img;}
  this.mode='home';this.depth=0;this.visualDepth=0;this.camera=0;this.time=0;this.previous=0;this.reduced=false;this.burst=0;this.pointer={x:0,y:0};this.offset={x:0,y:0};
  this.resize=()=>{this.w=innerWidth;this.h=innerHeight;this.ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(this.w*this.ratio);canvas.height=Math.round(this.h*this.ratio);this.ctx.setTransform(this.ratio,0,0,this.ratio,0,0);this.ctx.imageSmoothingEnabled=false;};
  this.resize();addEventListener('resize',this.resize);addEventListener('pointermove',e=>{this.pointer.x=(e.clientX/innerWidth-.5)*2;this.pointer.y=(e.clientY/innerHeight-.5)*2;},{passive:true});
  this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
 }
 set(mode,depth=0){this.mode=mode;this.depth=depth;}
 get displayedDepth(){return Math.round(this.visualDepth);}
 celebrate(){this.burst=1;}
 ready(key){return this.images[key]?.complete&&this.images[key]?.naturalWidth>0;}
 layer(key,alpha,y,height,drift=0){if(!this.ready(key)||alpha<.002)return;const c=this.ctx;c.globalAlpha=alpha;c.drawImage(this.images[key],-8+drift,y,this.w+16,height);c.globalAlpha=1;}
 loop(now){const dt=Math.min(.04,(now-this.previous)/1000||.016);this.previous=now;{if(!this.reduced&&!document.hidden)this.time+=dt*.42;const ease=this.reduced?1:1-Math.exp(-dt*1.3);this.visualDepth+=(this.depth-this.visualDepth)*ease;if(Math.abs(this.depth-this.visualDepth)<.2)this.visualDepth=this.depth;const goal=this.mode==='dive'?this.h*.68+this.visualDepth*.09:this.mode==='party'?this.h*.62:0;this.camera+=(goal-this.camera)*(this.reduced?1:1-Math.exp(-dt*1.6));this.offset.x+=(this.pointer.x*5-this.offset.x)*.025;this.offset.y+=(this.pointer.y*3-this.offset.y)*.025;this.burst=Math.max(0,this.burst-dt*.65);if(!document.hidden)this.draw(this.time);}requestAnimationFrame(this.loop);}
 draw(t){
  const c=this.ctx,W=this.w,H=this.h,d=this.visualDepth,surface=H*.48-this.camera;
  c.globalAlpha=1;c.fillStyle='#091829';c.fillRect(0,0,W,H);
  // Sky scrolls above the camera while the quiet boat stays on the waterline.
  if(surface>0){const sky=c.createLinearGradient(0,0,0,H*.48);sky.addColorStop(0,'#88cedd');sky.addColorStop(1,'#dfefec');c.fillStyle=sky;c.fillRect(0,0,W,surface);this.layer('sky',1,-this.camera,H*.48,Math.sin(t*.04)*3);}
  const start=Math.max(0,surface);c.save();c.beginPath();c.rect(0,start,W,H-start);c.clip();
  const mid=smooth(250,1150,d),trench=smooth(2300,3700,d),hadal=smooth(5100,6300,d);
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,d<400?'#194a6b':d<2500?'#0b2038':'#081420');g.addColorStop(1,'#071323');c.fillStyle=g;c.fillRect(0,start,W,H);
  // Portrait textures retain the reference composition on laptop and narrow screens.
  const shallowH=Math.max(H*1.65,W*.98);
  this.layer('shallow',1-mid,surface,shallowH,Math.sin(t*.13)*2+this.offset.x);
  this.layer('mid',mid*(1-trench),-H*.16-d*.018,H*1.75,this.offset.x*.6);
  this.layer('trench',trench*(1-hadal),-H*.18-(d-2300)*.014,H*1.7,this.offset.x*.45);
  this.layer('hadal',hadal,-H*.18-(d-5100)*.012,H*1.7,this.offset.x*.3);
  if(hadal){c.fillStyle=`rgba(6,2,17,${hadal*.34})`;c.fillRect(0,0,W,H);}
  // Keep the menu legible without erasing the scene beneath it.
  const shade=c.createLinearGradient(0,0,0,H);
  if(this.mode==='home'||this.mode==='summary'){shade.addColorStop(0,'#07132000');shade.addColorStop(.48,'#07132000');shade.addColorStop(.72,'#071320a6');shade.addColorStop(1,'#071320cc');}
  else{shade.addColorStop(0,'#020b171c');shade.addColorStop(1,'#020b1740');}
  c.fillStyle=shade;c.fillRect(0,0,W,H);
  // Sweeping light shafts, as low-opacity pixel planes, disappear below twilight.
  c.globalAlpha=(1-mid)*.055;
  for(let i=0;i<5;i++){const x=W*(i*.29-.2)+Math.sin(t*.21+i)*18;c.fillStyle='#9de7ef';c.beginPath();c.moveTo(Math.round(x),start);c.lineTo(Math.round(x+12),start);c.lineTo(Math.round(x+H*.31+70),H);c.lineTo(Math.round(x+H*.28),H);c.fill();}c.globalAlpha=1;
  if(d<1300)this.kelp(t,(1-mid)*.65);
  this.fishSchool(t,d,mid);
  // Depth changes turn a slow ambient drift into a rushing descent wake.
  const wake=this.burst*16;
  for(let i=0;i<58;i++){const x=(i*127.73+Math.sin(t*.28+i)*9+W*2)%W;const y=((i*83.41-t*(3+i%5+wake)+this.camera*.25)%(H+50)+(H+50))%(H+50)-20;const a=.06+(i%5)*.035;c.fillStyle=`rgba(${hadal>.4?'194,162,226':'157,214,229'},${a})`;const size=i%13===0?3:1;c.fillRect(Math.round(x),Math.round(y),size,size);if(i%13===0){c.fillStyle='#b9e6e855';c.fillRect(Math.round(x)+1,Math.round(y)-1,2,1);}if(wake>4&&i%2===0){c.fillStyle='#9dc9e41a';c.fillRect(Math.round(x),Math.round(y)+4,1,Math.min(22,wake*.3));}}
  if(d>900)this.glowLife(t,d,hadal);
  if(this.burst>0){for(let i=0;i<24;i++){const a=i*2.4,r=(1-this.burst)*180;c.fillStyle=i%3===0?'#f1c36b88':'#6ee0ea66';c.fillRect(Math.round(W/2+Math.cos(a)*r),Math.round(H*.54+Math.sin(a)*r*.5),2,3);}}
  c.restore();
  // Thin moving water ripples rather than a row of oversized repeated blocks.
  if(surface>-10&&surface<H+8){for(let row=0;row<7;row++){c.fillStyle=row<2?'#c4ede9':'#69bbcd';c.globalAlpha=(1-row/8)*.58;for(let x=-20;x<W+20;x+=23+row*7){const length=7+(Math.sin(x*.019+t*.8+row)+1)*13;const y=Math.round(surface+row*2+Math.sin(x*.024+t*1.2+row)*1.3);c.fillRect(Math.round(x+Math.sin(t*.6+row)*8),y,Math.round(length),1);}}c.globalAlpha=1;}
  if(this.mode==='summary'){c.fillStyle='#071320b8';c.fillRect(0,0,W,H);}
 }
 kelp(t,alpha){if(!this.ready('kelp'))return;const c=this.ctx,img=this.images.kelp,fw=img.naturalWidth/4,fh=img.naturalHeight/2;for(let i=0;i<4;i++){const frame=(Math.floor(t*4)+i*2)%8,size=Math.min(this.h*.64,340)+i%2*30;c.save();c.globalAlpha=alpha*(i%2?.75:1);const x=i<2?-size*.27+i*45:this.w-size*.55+(i-2)*45;c.drawImage(img,(frame%4)*fw,Math.floor(frame/4)*fh,fw,fh,x,this.h-size*.75,size,size);c.restore();}}
 fishSchool(t,d,mid){const c=this.ctx;for(let i=0;i<15;i++){const dir=i%2?1:-1,scale=.65+(i%4)*.2,x=((i*179+t*dir*(7+i%3)+this.w*8)%(this.w+100))-50,y=this.h*.2+((i*73+this.camera*.16)%(this.h*.7));c.save();c.translate(Math.round(x),Math.round(y+Math.sin(t+i)*2));c.scale(dir*scale,scale);c.globalAlpha=mid>.6?.22:.45;c.fillStyle=mid>.6?'#3e7894':'#051d32';const tail=Math.sin(t*5+i)>0?1:0;const rows=[[8,0,7,1],[4,1,16,1],[2,2,21,1],[1,3,24,2],[2,5,21,1],[4,6,16,1],[8,7,7,1]];for(const r of rows)c.fillRect(...r);c.fillRect(-4,tail,3,7-tail);c.fillRect(-1,2,3,4);c.fillStyle='#79bdc855';c.fillRect(19,2,1,1);c.restore();}}
 glowLife(t,d,hadal){const c=this.ctx;for(let j=0;j<3;j++){const x=this.w*(.1+j*.4)+Math.sin(t*.2+j)*18,y=((j*173-t*5+this.h*4)%(this.h+140))-60;c.save();c.translate(Math.round(x),Math.round(y));const pulse=Math.sin(t*2+j),w=14+Math.round(pulse*2);c.globalAlpha=.16+Math.max(0,pulse)*.08;c.fillStyle=hadal>.3?'#bd89c9':'#7bc6da';for(let r=0;r<6;r++)c.fillRect(-w+r,6-r*2,w*2-r*2,2);for(let k=0;k<4;k++){const tx=-9+k*6;for(let n=0;n<7;n++)c.fillRect(tx+Math.round(Math.sin(t*2+n*.8+k)*3),8+n*3,1,3);}c.restore();}}
}
