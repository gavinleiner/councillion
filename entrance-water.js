// A transparent ambient layer. The courthouse art and form stay still and readable.
export function mountEntranceWater(canvas,{motion=true}={}){
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 let width=0,height=0,frame=null,paused=false,last=0,previous=0,time=0,disposed=false;
 const schedule=()=>{if(frame===null&&!paused&&!disposed&&!document.hidden)frame=requestAnimationFrame(paint);};
 function resize(){width=Math.ceil(innerWidth/2);height=Math.ceil(innerHeight/2);canvas.width=width;canvas.height=height;ctx.imageSmoothingEnabled=false;schedule();}
 function paint(now){
  frame=null;if(paused||disposed||document.hidden)return;
  if(motion&&now-last<49){schedule();return;}
  time+=motion?Math.min(.1,(now-previous)/1000||.05):0;previous=now;last=now;
  ctx.clearRect(0,0,width,height);
  for(let i=0;i<18;i++){
   const side=i%2,anchor=side?.73:.07,range=side?.23:.21;
   const x=Math.round(width*(anchor+(i*.137%range))+Math.sin(time*.18+i)*2);
   const y=Math.round(((i*83.7-time*(1+i%3*.35))%height+height)%height);
   ctx.strokeStyle=`rgba(129,222,231,${.12+i%4*.045})`;
   if(i%3===0)ctx.strokeRect(x,y,2,2);else{ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(x,y,1,1);}
  }
  for(let i=0;i<4;i++){
   const direction=i%2?1:-1,anchor=[.1,.2,.81,.91][i];
   const x=Math.round(width*(anchor+Math.sin(time*.035+i)*.045));
   const y=Math.round(height*[.32,.56,.29,.63][i]+Math.sin(time*.3+i)*1.5);
   ctx.save();ctx.translate(x,y);ctx.scale(direction,1);ctx.fillStyle='#051d32';ctx.globalAlpha=.42;
   ctx.fillRect(-4,-1,8,3);ctx.fillRect(-2,-2,5,1);ctx.fillRect(-2,2,5,1);ctx.fillRect(-7,Math.sin(time*1.2+i)>0?-2:-1,2,4);ctx.fillRect(-5,0,1,1);ctx.restore();
  }
  // Slow broken ripples on the steps, outside the central text.
  ctx.fillStyle='#9ddce3';ctx.globalAlpha=.09;
  for(let i=0;i<8;i++){const x=Math.round(width*(.18+i*.09)+Math.sin(time*.22+i)*3),y=Math.round(height*(.83+(i%3)*.035));ctx.fillRect(x,y,5+i%3*3,1);}
  ctx.globalAlpha=1;
  if(motion)schedule();
 }
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=null;}else{previous=0;schedule();}};
 addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);resize();
 return {suspend(value){paused=value;if(value){cancelAnimationFrame(frame);frame=null;}else{previous=0;schedule();}},dispose(){disposed=true;cancelAnimationFrame(frame);removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);}};
}
