// Batched pixel scenery: one low-resolution canvas, capped at 20 fps.
// Every creature stays around the reef so the prompt and player cards stay clear.
export function mountCourtAmbience(canvas){
 if(!canvas||typeof requestAnimationFrame!=='function')return null;
 const c=canvas.getContext('2d');if(!c)return null;
 let w=0,h=0,frame=null,last=0,previous=0,t=0,disposed=false,reduced=false,bursts=[];
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const schedule=()=>{if(frame===null&&!disposed&&!document.hidden&&canvas.isConnected)frame=requestAnimationFrame(paint);};
 const motion=()=>{reduced=media.matches||document.body.classList.contains('reduced');schedule();};
 function resize(){w=Math.ceil(innerWidth/2);h=Math.ceil(innerHeight/2);canvas.width=w;canvas.height=h;c.imageSmoothingEnabled=false;schedule();}
 const pixel=(x,y,width,height,color,alpha=1)=>{c.globalAlpha=alpha;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),width,height);};
 function fish(x,y,size,dir,phase,tint){
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir*size,size);
  const tail=Math.sin(t*1.8+phase)>0?0:1;
  pixel(-6,-2,3,4,'#1b5268',.7);pixel(-4,-1,3,3,'#254e67',.7);
  pixel(-2,-3,9,1,tint,.8);pixel(-4,-2,14,4,tint,.8);pixel(-2,2,9,1,tint,.8);pixel(0,-2,7,1,'#80c3cb',.4);
  pixel(-8,-3+tail,2,6-tail,'#426f86',.75);pixel(7,-1,1,1,'#b0d6d4',.7);c.restore();
 }
 function jelly(x,y,phase){
  c.save();c.translate(Math.round(x),Math.round(y+Math.sin(t*.4+phase)*4));
  const pulse=1+Math.round((Math.sin(t*.65+phase)+1)*.5);
  pixel(-3,-5,6,1,'#90cad4',.3);pixel(-5,-4,10,2,'#7bb9cc',.3);pixel(-6,-2,12,pulse,'#6fa2c4',.32);pixel(-4,-3,2,1,'#cae1d7',.32);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)pixel(-4+i*3+Math.round(Math.sin(t*.6+j*.7+i)*1.4),pulse+j*2,1,2,'#89b6d1',.25);
  c.restore();
 }
 function crab(x,y,phase){
  const step=Math.sin(t*.65+phase)>0?1:0;c.save();c.translate(Math.round(x+Math.sin(t*.06+phase)*w*.017),Math.round(y));
  pixel(-4,-3,8,4,'#698c93',.8);pixel(-3,-4,6,1,'#87a7aa',.8);pixel(-3,-6,1,2,'#a6bdb7',.8);pixel(2,-6,1,2,'#a6bdb7',.8);
  for(const side of [-1,1]){pixel(side*6-1,-3-step,2,3,'#71969a',.8);pixel(side*7-1,-5-step,2,2,'#91afb0',.8);pixel(side*5-1,1,2,1,'#456c7b',.8);pixel(side*6-1,2+step,2,1,'#456c7b',.8);}c.restore();
 }
 function anemone(x,y,phase){
  for(let i=0;i<6;i++){const sway=Math.sin(t*.32+phase+i*.55)*1.5;for(let j=0;j<4;j++)pixel(x+(i-2.5)*1.8+sway*j/3,y-j*2,1,2,i%2?'#5c9caa':'#71b2b6',.5);pixel(x+(i-2.5)*1.8+sway,y-8,2,1,'#9cc8c3',.45);}
  pixel(x-5,y,10,2,'#2a697e',.65);
 }
 function paper(x,y,phase){
  c.save();c.translate(Math.round(x+Math.sin(t*.12+phase)*4),Math.round(y+Math.sin(t*.23+phase)*3));
  pixel(-3,-5,6,9,'#8da89f',.5);pixel(-2,-4,4,7,'#c0c5a8',.45);pixel(-1,-3,2,1,'#405e69',.55);pixel(-1,-1,3,1,'#405e69',.45);pixel(-1,1,2,1,'#405e69',.45);pixel(2,3,2,2,'#77949a',.5);c.restore();
 }
 function paint(now){
  frame=null;if(disposed||document.hidden||!canvas.isConnected)return;
  if(!reduced&&now-last<49){schedule();return;}
  t+=reduced?0:Math.min(.1,(now-previous)/1000||.05);previous=now;last=now;c.clearRect(0,0,w,h);
  // Three separate schools glide at different depths and never race across the table.
  for(let school=0;school<3;school++)for(let i=0;i<4;i++){
   const dir=school===1?-1:1,base=[.08,.83,.06][school],travel=Math.sin(t*.025+school*1.8)*.055;
   fish(w*(base+travel)+i*11*dir,h*[.26,.2,.51][school]+Math.sin(i*1.5+school)*4+Math.sin(t*.14+i)*1.5,[.62,.45,.4][school],dir,i,['#477e91','#507b92','#355b73'][school]);
  }
  jelly(w*.035,h*.37,0);jelly(w*.963,h*.48,3);
  crab(w*.12,h*.82,0);crab(w*.87,h*.89,2);
  [[.025,.65],[.975,.69],[.11,.87],[.91,.85]].forEach(([x,y],i)=>anemone(w*x,h*y,i*2));
  paper(w*.079,h*.71,0);paper(w*.891,h*.76,3);
  // Bubble plumes lift from the books, rocks and broken columns.
  const vents=[[.09,.7],[.94,.77],[.155,.17],[.735,.17],[.035,.8],[.97,.55]];
  for(let v=0;v<vents.length;v++)for(let i=0;i<4;i++){
   const cycle=(t*(.013+v*.0007)+i*.25+v*.19)%1,x=w*vents[v][0]+Math.sin(cycle*5+i)*2,y=h*vents[v][1]-cycle*h*.2,a=Math.sin(cycle*Math.PI)*.35;
   if(i%2){pixel(x,y,1,1,'#afd8d8',a);}else{pixel(x,y,2,1,'#a4d9e0',a);pixel(x-1,y+1,1,2,'#90becf',a);pixel(x+2,y+1,1,2,'#90becf',a);pixel(x,y+3,2,1,'#90becf',a);}
  }
  for(let i=0;i<30;i++){
   const side=i%2,x=w*(side?.77:.025)+((i*19.7+t*.33)%(w*.2)),y=(i*31.7-t*(.3+i%3*.12)+h*10)%h;
   pixel(x,y,1,i%4===0?2:1,i%5===0?'#d5c494':'#97c8cf',.11+(Math.sin(t*.17+i)+1)*.055);
  }
  // Fine broken caustics run over the sand, with occasional gold glints on law props.
  for(let i=0;i<18;i++){
   const x=w*(.18+(i*37%65)/100)+Math.sin(t*.12+i)*3,y=h*(.24+(i%6)*.105);
   pixel(x,y,9+i%5*4,1,'#b3ddd8',.018+Math.max(0,Math.sin(t*.18+i))*.035);
  }
  [[.889,.775],[.053,.65],[.905,.644]].forEach(([x,y],i)=>{const shine=Math.pow(Math.max(0,Math.sin(t*.32-i*2)),12);pixel(w*x,h*y,3,1,'#f0db9c',shine*.4);pixel(w*x+1,h*y-1,1,3,'#d7ccac',shine*.2);});
  bursts=bursts.filter(b=>t-b.at<2.8);for(const b of bursts)for(let i=0;i<7;i++){const life=(t-b.at)/2.8;pixel(w*b.x+Math.cos(i*1.3)*life*12,h*b.y-life*(8+i*2),1,1,'#aad8da',(1-life)*.45);}
  c.globalAlpha=1;if(!reduced)schedule();
 }
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=null;}else{previous=0;schedule();}};
 const observer=new MutationObserver(motion);observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);media.addEventListener('change',motion);motion();resize();
 return {pulse(x,y){if(!reduced)bursts.push({x:x/100,y:y/100,at:t});},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',motion);}};
}
