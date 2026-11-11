import {DEEP_BUILD,DEEP_WORLD as W,DEEP_ROOMS,DEEP_DOCK,roomAt,roomPoint} from './deep-data.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),vals=o=>Object.values(o??{});
export function deepSeed(seed=5049){let n=seed>>>0;return ()=>((n=Math.imul(n,1664525)+1013904223)>>>0)/4294967296;}
export function deepEvent(s,type,text,extra={}){const e={id:++s.eventSerial,type,text,at:s.time,...extra};s.events.push(e);if(s.events.length>18)s.events.shift();s.notice=text;return e;}
export function deepPlayer(id,name,buddy='krill',bot=false){return {id,name,buddy,bot,ready:bot,gear:'lamp',online:true,x:220,y:210,angle:0,hp:3,oxygen:160,stamina:100,lamp:true,status:'alive',carrying:'',rescues:0,banked:0,noise:0,hurtUntil:0,downUntil:0,interact:0,seen:[0],extracted:false};}
export function createDeep(players=[],seed=5049){return {build:DEEP_BUILD,stage:'lobby',time:0,stageAt:0,until:0,run:0,seed,revision:0,eventSerial:0,events:[],notice:'The crew is assembling.',players:players.map(p=>({...deepPlayer(p.id,p.name,p.buddy,p.bot),...p})),items:[],enemies:[],seals:[],pings:[],bank:0,quota:330,lockdown:0,threat:0,noise:[],departVotes:{},escapeAt:0,discovered:[0],result:null};}
export function normalizeDeep(s){for(const k of ['players','items','enemies','seals','events','pings','noise','discovered'])s[k]=vals(s[k]);for(const p of s.players)p.seen=vals(p.seen);for(const i of s.items)i.carriers=vals(i.carriers);s.departVotes??={};return s;}
export function startDeep(s){
 if(!['lobby','finish'].includes(s.stage))throw Error('An expedition is already in progress.');
 const humans=s.players.filter(p=>!p.bot&&p.online!==false);if(!humans.length)throw Error('A crew captain is needed.');
 if(humans.some(p=>!p.ready))throw Error('Everyone must be ready before descent.');if(s.players.length<2||s.players.length>6)throw Error('Bring two to six crew members. Bots can fill empty seats.');
 s.run++;s.matchId=crypto.randomUUID();s.stage='briefing';s.stageAt=s.time;s.until=s.time+7;s.deadline=0;s.bank=0;s.quota=330;s.result=null;s.lockdown=0;s.threat=0;s.departVotes={};s.escapeAt=0;s.discovered=[0];s.items=[];s.seals=[];s.pings=[];s.noise=[];s.events=[];
 const rng=deepSeed(s.seed+s.run*97);
 s.players=s.players.map((p,i)=>({...deepPlayer(p.id,p.name,p.buddy,p.bot),ready:true,online:p.online,gear:p.gear,x:175+(i%3)*46,y:175+Math.floor(i/3)*48,oxygen:p.gear==='tank'?200:160}));
 const specs=[['Affidavit',1,55,false],['Ivory seal',1,65,false],['Casebook',3,70,false],['Witness ledger',2,80,false],['Brass scales',4,105,false],['Court exhibit',4,170,true],['The final gavel',5,240,true]];
 s.items=specs.map(([name,room,value,heavy],i)=>({id:'e'+i,name,room,value,heavy,...roomPoint(room,265+rng()*190,185+rng()*105),carriers:[],banked:false}));
 s.seals=[{id:'seal-a',room:2,...roomPoint(2,385,120),progress:0,open:false},{id:'seal-b',room:4,...roomPoint(4,385,120),progress:0,open:false}];
 s.enemies=[{id:'bailiff',name:'THE BAILIFF',...roomPoint(1,580,285),home:1,angle:3.14,mode:'patrol',target:'',attackAt:0,phase:0},{id:'clerk',name:'THE CLERK',...roomPoint(3,560,270),home:3,angle:0,mode:'stalk',target:'',attackAt:0,phase:0},{id:'judge',name:'THE JUDGE',...roomPoint(5,590,170),home:5,angle:3.14,mode:'sleeping',target:'',attackAt:0,phase:0}];
 deepEvent(s,'briefing','Recover 330 evidence. Restore both seals. Bring your crew home.');s.revision++;return s;
}
// Fixed geometry, wide connected doorways and corner-only props are shared by
// humans, bots and enemies. No client ever submits a position or a velocity.
export function blocked(x,y,r=14,s){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<32+r||y<32+r||x>W.width-32-r||y>W.height-32-r)return true;
 for(const wall of [768,1536])if(Math.abs(x-wall)<30+r){const v=y%480;if(Math.abs(v-240)>64-r)return true;}
 if(Math.abs(y-480)<30+r){const h=x%768;if(Math.abs(h-384)>64-r)return true;}
 // Furniture stays in corners so every objective remains reachable.
 const lx=x%768,ly=y%480;if((lx<145||lx>623)&&(ly<104||ly>382))return true;
 if(s&&roomAt(x,y)===5&&!s.seals.every(a=>a.open)){
  // The final courtroom is sealed until the two side objectives are restored.
  if(lx<55&&Math.abs(ly-240)<85||ly<55&&Math.abs(lx-384)<85)return true;
 }
 return false;
}
export function deepMove(p,vx,vy,dt,s,speed=1){const n=Math.hypot(vx,vy);if(n>.001){vx/=Math.max(1,n);vy/=Math.max(1,n);if(!blocked(p.x+vx*dt*speed,p.y,14,s))p.x+=vx*dt*speed;if(!blocked(p.x,p.y+vy*dt*speed,14,s))p.y+=vy*dt*speed;}}
export function deepInput(value={}){return {x:clamp(Number(value.x)||0,-1,1),y:clamp(Number(value.y)||0,-1,1),sprint:value.sprint===true,interact:value.interact===true,action:['lamp','drop','ping','depart'].includes(value.action)?value.action:'',seq:Math.max(0,Math.floor(Number(value.seq)||0))};}
export function nearbyDeep(s,p){
 if(!p||p.status!=='alive')return null;
 const rescue=s.players.find(q=>q.status==='down'&&dist(p,q)<66);if(rescue)return {type:'rescue',target:rescue,label:'HOLD E · RESCUE '+rescue.name.toUpperCase()};
 if(dist(p,DEEP_DOCK)<DEEP_DOCK.radius)return {type:'dock',label:p.carrying?'E · BANK EVIDENCE':s.bank>=s.quota?'E · CALL EXTRACTION':'SAFE AIR · EVIDENCE '+s.bank+' / '+s.quota};
 const seal=s.seals.find(a=>!a.open&&dist(p,a)<70);if(seal)return {type:'seal',target:seal,label:'HOLD E · RESTORE COURT SEAL'};
 const air=[roomPoint(2,605,237),roomPoint(3,170,240)].find(a=>dist(p,a)<52);if(air)return {type:'air',label:'HOLD E · REFILL AIR'};
 if(p.carrying)return {type:'carrying',label:'CARRYING · Q TO DROP'};
 const item=s.items.find(a=>!a.banked&&a.carriers.length<(a.heavy?2:1)&&dist(p,a)<65);if(item)return {type:'item',target:item,label:item.heavy?(item.carriers.length?'E · HELP LIFT '+item.name.toUpperCase():'E · TWO-PERSON LIFT · '+item.name.toUpperCase()):'E · TAKE '+item.name.toUpperCase()};
 return null;
}
function drop(s,p){const item=s.items.find(i=>i.id===p.carrying);if(item){for(const id of item.carriers){const q=s.players.find(q=>q.id===id);if(q)q.carrying='';}item.carriers=[];item.x=p.x;item.y=p.y;s.noise.push({x:p.x,y:p.y,at:s.time,power:480});deepEvent(s,'drop',p.name+' dropped '+item.name+'.',{x:p.x,y:p.y});}p.carrying='';}
function hurt(s,p,enemy){if(p.status!=='alive'||s.time<p.hurtUntil)return;p.hp=Math.max(0,p.hp-1);p.hurtUntil=s.time+3;deepEvent(s,'hit',enemy+' caught '+p.name+'.',{player:p.id,x:p.x,y:p.y});if(p.hp<=0){drop(s,p);p.status='down';p.downUntil=s.time+40;p.interact=0;deepEvent(s,'down',p.name+' is down. A teammate can hold E to rescue them.',{player:p.id});}}
export function deepAction(s,id,action,payload={}){
 const p=s.players.find(p=>p.id===id);if(!p)return;
 if(s.stage==='lobby'||s.stage==='finish'){if(action==='ready')p.ready=!!payload.ready;if(action==='gear'&&['lamp','tank','boots'].includes(payload.gear))p.gear=payload.gear;return;}
 if(p.status!=='alive'||!['explore','lockdown'].includes(s.stage))return;
 if(action==='lamp')p.lamp=!p.lamp;
 if(action==='drop')drop(s,p);
 if(action==='ping'&&s.time-(p.lastPing??-20)>2){p.lastPing=s.time;s.pings.push({x:p.x,y:p.y,at:s.time,player:id});deepEvent(s,'ping',p.name+' marked their position.',{player:id});}
 if(action==='depart'&&!s.departVotes[id]&&dist(p,DEEP_DOCK)<DEEP_DOCK.radius&&s.bank>=s.quota){s.departVotes[id]=true;deepEvent(s,'depart',p.name+' called the airlock. Get back to the submarine.');}
}
function use(s,p,dt){
 const n=nearbyDeep(s,p);if(!n){p.interact=0;return;}
 if(n.type==='rescue'){p.interact+=dt;if(p.interact>=2.2){const q=n.target;q.status='alive';q.hp=1;q.oxygen=Math.max(q.oxygen,45);q.hurtUntil=s.time+6;p.rescues++;p.interact=0;deepEvent(s,'rescue',p.name+' rescued '+q.name+'.',{player:q.id});}return;}
 if(n.type==='seal'){n.target.progress+=dt*.25;if(n.target.progress>=1){n.target.progress=1;n.target.open=true;deepEvent(s,'seal','A court seal is restored. '+s.seals.filter(a=>a.open).length+' / 2.',{room:n.target.room});if(s.seals.every(a=>a.open))deepEvent(s,'vault','Both seals restored. The High Court is open.');}return;}
 if(n.type==='air'){p.oxygen=Math.min(p.gear==='tank'?200:160,p.oxygen+dt*60);return;}
 if(n.type==='dock'){
  if(p.carrying){const item=s.items.find(i=>i.id===p.carrying);if(item&&(!item.heavy||item.carriers.length===2&&item.carriers.every(id=>dist(s.players.find(q=>q.id===id),DEEP_DOCK)<DEEP_DOCK.radius+40))){item.banked=true;s.bank+=item.value;const names=item.carriers.map(id=>{const q=s.players.find(q=>q.id===id);q.carrying='';q.banked+=Math.round(item.value/item.carriers.length);return q.name;});item.carriers=[];deepEvent(s,'bank',names.join(' & ')+' secured '+item.name+' · +'+item.value,{value:item.value});}}
  return;
 }
 if(n.type==='item'&&s.time-(p.lastPickup??-10)>.65){const i=n.target;i.carriers.push(p.id);p.carrying=i.id;p.lastPickup=s.time;deepEvent(s,'pickup',p.name+(i.heavy&&i.carriers.length===1?' needs a second carrier for ':' took ')+i.name+'.',{player:p.id});if(i.room===5&&s.stage==='explore'&&i.carriers.length===2)lockdown(s,'The gavel has moved. The Judge has called lockdown.');}
}
function lockdown(s,text){if(s.stage!=='explore')return;s.stage='lockdown';s.stageAt=s.time;s.lockdown=s.time+100;deepEvent(s,'lockdown',text);s.enemies.find(e=>e.id==='judge').mode='hunt';}
function roomRoute(from,to){const a=roomAt(from.x,from.y),b=roomAt(to.x,to.y);if(a===b)return to;const ac=a%3,ar=Math.floor(a/3),bc=b%3,br=Math.floor(b/3);if(ac!==bc)return {x:(ac+(bc>ac?1:0))*768+(bc>ac?52:-52),y:ar*480+240};return {x:ac*768+384,y:(ar+(br>ar?1:0))*480+(br>ar?52:-52)};}
export function routeDeep(from,to,s){let target=roomRoute(from,to);const a=roomAt(from.x,from.y);if(a===5&&!s.seals.every(a=>a.open))target=roomPoint(4,384,240);return target;}
function seenEnemy(s,e){return s.players.some(p=>{if(p.status!=='alive'||!p.lamp||roomAt(p.x,p.y)!==roomAt(e.x,e.y)||dist(p,e)>360)return false;const a=Math.atan2(e.y-p.y,e.x-p.x);return Math.abs(Math.atan2(Math.sin(a-p.angle),Math.cos(a-p.angle)))<.8;});}
function enemies(s,dt){
 const alive=s.players.filter(p=>p.status==='alive'&&dist(p,DEEP_DOCK)>170);for(const e of s.enemies){e.phase+=dt;if(e.mode==='sleeping'&&s.stage!=='lockdown')continue;
  const before=e.mode,room=roomAt(e.x,e.y);let target,sp=0;
  if(e.id==='bailiff'){
   const sounds=s.noise.filter(n=>s.time-n.at<3&&dist(n,e)<n.power),heard=alive.filter(p=>p.noise>5&&dist(p,e)<p.noise*9).sort((a,b)=>dist(a,e)-dist(b,e));
   target=heard[0]??sounds[0];if(target){e.mode='hunt';e.lastHeard={x:target.x,y:target.y};e.until=s.time+4;}else if(e.until>s.time){target=e.lastHeard;e.mode='search';}else{e.mode='patrol';target=roomPoint(e.home,384+Math.sin(e.phase*.2)*205,240+Math.cos(e.phase*.25)*90);}sp=e.mode==='hunt'?144:62;
  }else if(e.id==='clerk'){
   if(seenEnemy(s,e)){e.mode='frozen';continue;}e.mode='stalk';target=alive.filter(p=>roomAt(p.x,p.y)>=3).sort((a,b)=>dist(a,e)-dist(b,e))[0]??roomPoint(e.home,384+Math.sin(e.phase*.19)*180,240);sp=target?.id?90:36;
  }else{e.mode='hunt';target=alive.sort((a,b)=>dist(a,e)-dist(b,e))[0];sp=116;}
  if(target){let t=routeDeep(e,target,s);const dx=t.x-e.x,dy=t.y-e.y;e.angle=Math.atan2(dy,dx);deepMove(e,Math.cos(e.angle),Math.sin(e.angle),dt,s,sp);e.target=target.id??'';}
  for(const p of alive)if(roomAt(p.x,p.y)===room&&dist(p,e)<(e.id==='judge'?49:34)&&s.time>=e.attackAt){hurt(s,p,e.name);e.attackAt=s.time+2.8;}
  if(before!=='hunt'&&e.mode==='hunt')deepEvent(s,'spotted',e.name+' heard something.',{enemy:e.id,x:e.x,y:e.y});
 }
}
export function finishDeep(s,reason='escaped'){
 if(s.stage==='finish')return;const survived=s.players.filter(p=>p.status==='alive'&&dist(p,DEEP_DOCK)<DEEP_DOCK.radius+55);for(const p of s.players)p.extracted=survived.includes(p);
 s.stage='finish';s.stageAt=s.time;s.until=0;const success=s.bank>=s.quota&&survived.length>0;
 s.result={success,reason,bank:s.bank,quota:s.quota,survivors:survived.length,crew:s.players.length,seals:s.seals.filter(a=>a.open).length,elapsed:Math.round(s.time-s.startedAt),grade:success?(survived.length===s.players.length&&s.bank>=500?'S':survived.length===s.players.length?'A':'B'):s.bank>0?'C':'D',players:s.players.map(p=>({id:p.id,name:p.name,banked:p.banked,rescues:p.rescues,escaped:p.extracted}))};
 deepEvent(s,'finish',success?'The evidence is secured. Court adjourned.':'The court kept its evidence. Regroup and dive again.');s.revision++;
}
export function stepDeep(s,inputs={},dt=.05){
 dt=clamp(Number(dt)||0,0,.1);s.time+=dt;
 if(s.stage==='briefing'&&s.time>=s.until){s.stage='descent';s.stageAt=s.time;s.until=s.time+4;deepEvent(s,'descent','Pressure rising. Next stop: the drowned court.');}
 if(s.stage==='descent'&&s.time>=s.until){s.stage='explore';s.stageAt=s.time;s.startedAt=s.time;s.deadline=s.time+600;deepEvent(s,'arrive','Airlock open. Recover 330 evidence. Return here to bank it.');}
 if(s.stage==='extraction'){if(s.time>=s.until)finishDeep(s,'escaped');return;}
 if(!['explore','lockdown'].includes(s.stage))return;
 s.noise=s.noise.filter(n=>s.time-n.at<4);s.pings=s.pings.filter(n=>s.time-n.at<4);
 for(const p of s.players){
  if(p.status==='down'){p.oxygen=Math.max(0,p.oxygen-dt*.3);if(s.time>=p.downUntil){p.status='lost';deepEvent(s,'lost',p.name+' is lost to the court. Watch the surviving crew.',{player:p.id});}continue;}
  if(p.status!=='alive'||p.online===false&&!p.bot)continue;
  const raw=inputs[p.id]??{},input=deepInput(raw);if(s.time-(raw.at??s.time)>1)input.x=input.y=0;
  if(input.action&&input.seq>(p.lastAction??-1)){deepAction(s,p.id,input.action);p.lastAction=input.seq;}
  if(Number.isFinite(raw.angle))p.angle=raw.angle;
  const moving=Math.hypot(input.x,input.y)>.02,sprinting=moving&&input.sprint&&p.stamina>4&&!p.carrying;
  p.stamina=clamp(p.stamina+dt*(sprinting?-27:18),0,100);p.noise=moving?(sprinting?64:p.gear==='boots'?5:14):0;
  const item=s.items.find(i=>i.id===p.carrying),heavy=item?.heavy,waiting=heavy&&item.carriers.length<2;
  let speed=W.speed*(sprinting?1.65:1)*(p.carrying?.length?heavy?.54:.8:1);if(waiting)speed=0;
  if(heavy&&item.carriers.length===2){const other=s.players.find(q=>q.id===item.carriers.find(id=>id!==p.id));if(other&&dist(p,other)>105){speed=30;if(dist(p,other)>175)drop(s,p);}}
  if(moving&&!raw.aim)p.angle=Math.atan2(input.y,input.x);deepMove(p,input.x,input.y,dt,s,speed);
  const room=roomAt(p.x,p.y);if(!p.seen.includes(room))p.seen.push(room);if(!s.discovered.includes(room)){s.discovered.push(room);deepEvent(s,'room',DEEP_ROOMS[room].name,{player:p.id,room});}
  if(dist(p,DEEP_DOCK)<DEEP_DOCK.radius){p.oxygen=Math.min(p.gear==='tank'?200:160,p.oxygen+dt*40);if(p.hp<3)p.hp=Math.min(3,p.hp+dt*.14);}else p.oxygen=Math.max(0,p.oxygen-dt*(sprinting?1.3:1));
  if(p.oxygen<=0)hurt(s,p,'THE DEEP');
  if(input.interact)use(s,p,dt);else p.interact=0;
 }
 for(const i of s.items){if(i.carriers.length){const ps=i.carriers.map(id=>s.players.find(p=>p.id===id)).filter(Boolean);i.x=ps.reduce((n,p)=>n+p.x,0)/ps.length;i.y=ps.reduce((n,p)=>n+p.y,0)/ps.length;i.room=roomAt(i.x,i.y);}}
 enemies(s,dt);const alive=s.players.filter(p=>p.status==='alive');if(!alive.length&&!s.players.some(p=>p.status==='down')){finishDeep(s,'crew-lost');return;}
 if(!alive.length&&s.players.some(p=>p.status==='down')){finishDeep(s,'crew-down');return;}
 if(s.stage==='explore'&&s.time>=s.deadline)lockdown(s,'Closing arguments. Return to the airlock before the court seals.');
 if(s.stage==='lockdown'&&s.time>=s.lockdown){finishDeep(s,'lockdown');return;}
 const votes=Object.keys(s.departVotes).length,atDock=alive.filter(p=>dist(p,DEEP_DOCK)<DEEP_DOCK.radius+30);
 if(s.bank>=s.quota&&(atDock.length===alive.length&&votes>0||votes>=Math.ceil(alive.length*2/3))){if(!s.escapeAt){s.escapeAt=s.time+10;deepEvent(s,'evacuate','Airlock departing in ten seconds. Bring everyone home.');}if(s.time>=s.escapeAt){s.stage='extraction';s.stageAt=s.time;s.until=s.time+5;deepEvent(s,'escape','Doors sealed. Submarine ascending.');}}
 s.threat=Math.max(0,...s.enemies.filter(e=>e.mode==='hunt'||e.mode==='stalk').map(e=>Math.max(0,1-Math.min(...alive.map(p=>dist(p,e)),999)/400)));
 s.revision++;
}
