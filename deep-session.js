import {canPlayDeep,DEEP_BUILD} from './deep-data.js';
import {createDeep,deepPlayer,startDeep,stepDeep,normalizeDeep,deepInput,deepAction} from './deep-engine.js';
import {DeepBotDirector} from './deep-bots.js';
import {waitForDatabaseConnection,databaseClockOffset,partyConnectionError} from './party-connection.js';
import {validateDisplayName} from './moderation.js';
const loadCloud=()=>import('./cloud.bundle.js?v=20261111-deep-contempt-v50');
const copy=o=>JSON.parse(JSON.stringify(o));
// Like the other Councillion party modes, the room host is the trusted referee.
// Only directional input travels up; positions, collisions and loot are simulated
// by one host, with resumable snapshots. Every database path is owner-gated too.
export class DeepSession{
 constructor({identity=()=>null,authorize,getCloud=loadCloud,onState=()=>{},onError=()=>{},clock=Date.now}={}){
  Object.assign(this,{identity,authorize,getCloud,onState,onError,clock,host:false,connected:false,unsub:[],members:{},inputs:{},input:{},closed:false,offset:0,last:clock(),lastPublish:0,lastSend:0,lastHeartbeat:0,seq:0,chain:Promise.resolve(),director:new DeepBotDirector(),botCount:2});
  this.ownerUid=identity()?.uid??null;this.input=deepInput();this.timer=setInterval(()=>this.tick(),50);
 }
 now(){return this.clock()+this.offset;}
 path(part=''){return this.c.ref(this.c.db,'deepRooms/'+this.code+(part?'/'+part:''));}
 error(e){if(!this.closed&&!this.closing)this.onError(partyConnectionError(e));}
 render(){if(!this.closed&&this.state)this.onState(this.state,this);}
 async auth(){if(!canPlayDeep(this.identity()))throw Error('Deep Contempt is coming soon. This preview is private to Gavin’s Google accounts.');const a=await this.authorize();if(this.ownerUid&&a.uid!==this.ownerUid)throw Error('Your Google account changed. Open the expedition again.');this.uid=a.uid;this.c=await this.getCloud();await waitForDatabaseConnection(this.c);this.offset=await databaseClockOffset(this.c);if(this.closed||this.closing)throw Error('Connection cancelled.');await this.c.get(this.c.ref(this.c.db,'deepPreviewAccess'));}
 member(name,buddy){return {name:validateDisplayName(name),buddy:['krill','squid','schooler','angler','evil'].includes(buddy)?buddy:'krill',ready:true,gear:'lamp',online:true,lastSeen:this.now(),joinedAt:this.now()};}
 async claimTab(){
  if(!globalThis.navigator?.locks)return;
  await new Promise((resolve,reject)=>{navigator.locks.request('councillion-deep:'+this.code+':'+this.uid,{ifAvailable:true},async lock=>{if(!lock){reject(Error('This expedition is already open in another tab for this Google account. Return to that tab or leave it first.'));return;}const held=new Promise(release=>{this.releaseTab=release;});resolve();await held;}).catch(reject);});
 }
 async create(name='Gavin',buddy='krill'){
  await this.auth();this.host=true;const m=this.member(name,buddy);this.code=Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[v%24]).join('');await this.claimTab();
  this.meta={host:this.uid,build:DEEP_BUILD,createdAt:this.now(),seats:6};this.members={[this.uid]:m};this.state=createDeep([deepPlayer(this.uid,m.name,m.buddy)],crypto.getRandomValues(new Uint32Array(1))[0]);this.state.players[0].ready=true;
  await this.c.set(this.path(),{meta:this.meta,members:this.members,state:this.state});this.registered=true;await this.listen();return this.code;
 }
 async join(name,code,buddy='krill'){
  await this.auth();this.code=String(code).trim().toUpperCase();if(!/^[A-Z]{6}$/.test(this.code))throw Error('Enter the six-letter expedition code.');const m=(await this.c.get(this.path('meta'))).val();if(!m||m.build!==DEEP_BUILD||this.now()-m.createdAt>86400000)throw Error('This expedition has closed. Create a new dive.');this.meta=m;
  const snapshot=(await this.c.get(this.path('members'))).val()??{};if(!snapshot[this.uid]&&Object.values(snapshot).filter(p=>p.online).length>=6)throw Error('All six crew slots are occupied.');
  await this.claimTab();await this.c.set(this.path('members/'+this.uid),this.member(name,buddy));this.registered=true;await this.listen();
 }
 async listen(){
  const c=this.c,listen=(part,fn)=>this.unsub.push(c.onValue(this.path(part),snap=>{if(!this.closed)fn(snap.val());},e=>this.error(e)));
  listen('meta',m=>{if(!m){this.error(Error('The expedition has closed.'));return;}const was=this.host;this.meta=m;this.host=m.host===this.uid;if(this.host&&!was){this.director=new DeepBotDirector();this.last=this.clock();this.render();}});
  listen('state',s=>{if(!s)return;if(!this.host||!this.state)this.state=normalizeDeep(s);this.render();});
  listen('members',rows=>{this.members=rows??{};if(this.host)this.syncRoster();this.render();});
  listen('inputs',rows=>{this.inputs=rows??{};});
  this.unsub.push(c.onValue(c.ref(c.db,'.info/connected'),async snap=>{this.connected=snap.val()===true;if(this.connected&&!this.closed){try{await c.onDisconnect(this.path('members/'+this.uid)).update({online:false,lastSeen:c.serverTimestamp()});await c.onDisconnect(this.path('inputs/'+this.uid)).remove();await c.update(this.path('members/'+this.uid),{online:true,lastSeen:c.serverTimestamp()});}catch(e){this.error(e);}}this.render();},e=>this.error(e)));
  this.host=this.meta.host===this.uid;if(this.host)this.syncRoster();this.render();
 }
 syncRoster(){
  if(!this.state)return;const waiting=['lobby','finish'].includes(this.state.stage),humans=Object.entries(this.members).filter(([,m])=>m.online);
  if(waiting){const old=new Map(this.state.players.map(p=>[p.id,p]));this.state.players=humans.slice(0,6).map(([id,m])=>({...old.get(id)??deepPlayer(id,m.name,m.buddy),...m,id,bot:false}));const slots=Math.min(this.botCount,6-this.state.players.length);for(let i=0;i<slots;i++)this.state.players.push({...deepPlayer('bot-'+i,['Nori','Mako','Pearl','Reef','Cove'][i],['squid','angler','schooler','evil','krill'][i],true),ready:true});}
  else for(const p of this.state.players)if(!p.bot)p.online=this.members[p.id]?.online===true;
 }
 async request(action,payload={}){
  if(this.closed||!this.connected)throw Error('The expedition is reconnecting.');
  if(action==='ready'||action==='gear'){const patch=action==='ready'?{ready:payload.ready===true}:{gear:['lamp','tank','boots'].includes(payload.gear)?payload.gear:'lamp'};await this.c.update(this.path('members/'+this.uid),patch);return;}
  if(action==='bots'){if(!this.host||!['lobby','finish'].includes(this.state.stage))return;this.botCount=Math.max(0,Math.min(5,Math.floor(Number(payload.count)||0)));this.syncRoster();await this.publish();return;}
  if(action==='start'){if(!this.host)throw Error('The captain starts the expedition.');this.syncRoster();startDeep(this.state);this.director=new DeepBotDirector();await this.publish();this.render();return;}
  if(['lamp','drop','ping','depart'].includes(action)){if(this.host){deepAction(this.state,this.uid,action);this.render();return;}this.input={...this.input,action,seq:++this.seq};await this.sendInput();}
 }
 setInput(input){const action=this.input.action;this.input={...deepInput(input),seq:this.seq,...(action?{action}:{}),...(input.aim?{angle:input.angle,aim:true}:{})};}
 async sendInput(){if(this.sending||!this.connected||this.closed)return;this.sending=true;const value={...this.input,seq:this.seq,at:this.now()};try{await this.c.set(this.path('inputs/'+this.uid),value);if(this.input.seq===value.seq)this.input.action='';}catch(e){this.error(e);}finally{this.sending=false;}}
 async publish(){if(this.publishing||!this.host||this.closed)return;this.publishing=true;try{await this.c.set(this.path('state'),copy(this.state));}catch(e){this.error(e);}finally{this.publishing=false;}}
 tick(){
  const t=this.clock(),dt=Math.min(.1,Math.max(0,(t-this.last)/1000));this.last=t;if(this.closed||this.closing||!this.state||!this.connected)return;
  if(t-this.lastSend>=100){this.lastSend=t;this.sendInput();}
  if(t-this.lastHeartbeat>5000){this.lastHeartbeat=t;this.c.update(this.path('members/'+this.uid),{online:true,lastSeen:this.c.serverTimestamp()}).catch(e=>this.error(e));if(!this.host){const host=this.members[this.meta.host];if(host&&(host.online===false||this.now()-host.lastSeen>20000))this.c.runTransaction(this.path('meta/host'),current=>current===this.meta.host?this.uid:undefined,{applyLocally:false}).catch(()=>{});}}
  if(this.host){const inputs={...this.director.inputs(this.state)};for(const [id,raw]of Object.entries(this.inputs))inputs[id]=this.now()-raw.at<1200?{...raw,at:this.state.time}:{x:0,y:0};inputs[this.uid]={...this.input,at:this.state.time};stepDeep(this.state,inputs,dt);this.render();if(t-this.lastPublish>200){this.lastPublish=t;this.publish();}}
 }
 async close(){
  if(this.closed||this.closing)return;this.closing=true;clearInterval(this.timer);const c=this.c;if(c&&this.code&&this.uid&&this.registered){try{if(this.host){const next=Object.keys(this.members).find(id=>id!==this.uid&&this.members[id].online);if(next)await c.runTransaction(this.path('meta/host'),v=>v===this.uid?next:undefined,{applyLocally:false});}await c.update(this.path('members/'+this.uid),{online:false,lastSeen:c.serverTimestamp()});await c.remove(this.path('inputs/'+this.uid));}catch{}}
  this.closed=true;this.connected=false;this.releaseTab?.();this.unsub.forEach(off=>off());this.unsub=[];
 }
}
