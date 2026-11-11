import {blocked,deepInput,nearbyDeep} from './deep-engine.js';
import {DEEP_WORLD as W,DEEP_DOCK,roomAt,roomPoint} from './deep-data.js';
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),key=(x,y)=>x+','+y;
// Small A* graph uses the same collision checks as the authoritative simulation.
// It is intentionally throttled and cached, rather than solved on each frame.
export function deepPath(from,to,s){
 const size=32,cx=cl=>Math.floor(cl/size),sx=cx(from.x),sy=cx(from.y),tx=cx(to.x),ty=cx(to.y),open=[{x:sx,y:sy,g:0,f:0}],cost=new Map([[key(sx,sy),0]]),prev=new Map();let end;
 for(let count=0;open.length&&count<2500;count++){
  open.sort((a,b)=>b.f-a.f);const n=open.pop();if(Math.abs(n.x-tx)+Math.abs(n.y-ty)<=1){end=n;break;}
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=n.x+dx,y=n.y+dy,k=key(x,y),p={x:x*size+16,y:y*size+16};if(blocked(p.x,p.y,14,s))continue;const g=n.g+1;if(g>=(cost.get(k)??Infinity))continue;cost.set(k,g);prev.set(k,n);open.push({x,y,g,f:g+Math.abs(x-tx)+Math.abs(y-ty)});}
 }
 if(!end)return [];const path=[];let n=end;while(n&&(n.x!==sx||n.y!==sy)){path.unshift({x:n.x*size+16,y:n.y*size+16});n=prev.get(key(n.x,n.y));}path.push({x:to.x,y:to.y});return path;
}
function clearLine(a,b,s){const n=Math.ceil(d(a,b)/14);for(let i=1;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,14,s))return false;return true;}
export class DeepBotDirector{
 constructor({tour=false}={}){this.brains=new Map();this.tour=tour;}
 inputs(s,ids=s.players.filter(p=>p.bot).map(p=>p.id)){
  const out={},claimed=new Set();
  for(const id of ids){const p=s.players.find(p=>p.id===id);if(!p||p.status!=='alive')continue;let b=this.brains.get(id);if(!b){b={until:0,path:[],seq:0};this.brains.set(id,b);}let target,task='';
   const rescue=s.players.filter(q=>q.status==='down').sort((a,b)=>d(p,a)-d(p,b))[0],carrying=s.items.find(i=>i.id===p.carrying),oxygen=[DEEP_DOCK,roomPoint(2,605,237),roomPoint(3,170,240)].sort((a,b)=>d(p,a)-d(p,b))[0];
   if(rescue&&d(p,rescue)<700){target=rescue;task='rescue';}
   else if(p.oxygen<Math.max(38,d(p,oxygen)/75+15)){target=oxygen;task='air';}
   else if(carrying){if(carrying.heavy&&carrying.carriers.length<2){target=p;task='wait';}else{target=DEEP_DOCK;task='bank';}}
   else{
    const needsHelp=s.items.filter(i=>i.heavy&&!i.banked&&i.carriers.length===1&&(!claimed.has(i.id)||d(p,i)<100)).sort((a,b)=>d(p,a)-d(p,b))[0];
    const seals=s.seals.filter(a=>!a.open&&!claimed.has(a.id)).sort((a,b)=>d(p,a)-d(p,b)),items=s.items.filter(i=>!i.banked&&!i.carriers.length&&(i.room!==5||s.seals.every(a=>a.open))&&!claimed.has(i.id)).sort((a,b)=>d(p,a)-d(p,b));
    const shouldExtract=s.bank>=s.quota&&(!this.tour||s.items.find(i=>i.id==='e6').banked);
    if(needsHelp){target=needsHelp;task='item';claimed.add(needsHelp.id);}
    else if(s.escapeAt||shouldExtract){target=DEEP_DOCK;task='depart';}
    else if(seals.length&&(p.id.endsWith('0')||p.id.endsWith('1')||!items.length)){target=seals[0];task='seal';claimed.add(target.id);}
    else if(items.length){target=items[0];task='item';claimed.add(target.id);}
    else if(seals.length){target=seals[0];task='seal';claimed.add(target.id);}
    else{target=DEEP_DOCK;task='air';}
   }
   const input={x:0,y:0,interact:false,sprint:false,at:s.time,seq:++b.seq};
   if(target){const range=['rescue','seal'].includes(task)?48:task==='item'?45:task==='bank'||task==='depart'?55:35;
    if(d(p,target)<range){input.interact=['rescue','seal','item','bank','air'].includes(task);if(task==='depart')input.action='depart';}
    else{
     const dest=key(Math.round(target.x/48),Math.round(target.y/48))+':'+s.seals.filter(a=>a.open).length;
     if(dest!==b.dest||s.time>b.until||!b.path.length){b.path=deepPath(p,target,s);b.dest=dest;b.until=s.time+2;}
     while(b.path.length>1&&d(p,b.path[0])<23)b.path.shift();
     let waypoint=clearLine(p,target,s)?target:b.path[0];if(waypoint){const dx=waypoint.x-p.x,dy=waypoint.y-p.y,n=Math.hypot(dx,dy);input.x=dx/Math.max(n,1);input.y=dy/Math.max(n,1);input.sprint=!p.carrying&&p.stamina>28&&p.oxygen>40&&d(p,target)>170;}
    }
    // A heavy exhibit's second carrier stays near its partner, then both follow
    // the same exit path. Neither bot sees hidden state or gets teleported.
    if(carrying?.heavy&&carrying.carriers.length===2){const other=s.players.find(q=>q.id===carrying.carriers.find(x=>x!==id));if(d(p,other)>80){const dx=other.x-p.x,dy=other.y-p.y,n=Math.hypot(dx,dy);input.x=dx/n;input.y=dy/n;}}
   }
   const clerk=s.enemies.find(e=>e.id==='clerk'&&roomAt(e.x,e.y)===roomAt(p.x,p.y)&&d(p,e)<300);if(clerk){input.angle=Math.atan2(clerk.y-p.y,clerk.x-p.x);input.aim=true;}
   out[id]={...deepInput(input),at:s.time,...(input.aim?{angle:input.angle,aim:true}:{})};
  }return out;
 }
}
