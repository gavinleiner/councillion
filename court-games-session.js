import {CLASH_BY_ID} from './court-games-data.js';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame,canCourtHuddle,GAME_MODES,COURT_GAMES_BUILD} from './court-games-engine.js';
import {waitForDatabaseConnection,databaseClockOffset,partyConnectionError,permissionDenied} from './party-connection.js';
import {validateDisplayName,validateChat,safeDisplayName} from './moderation.js';
import {requirePartyIdentity} from './party-access.js';
const clone=o=>JSON.parse(JSON.stringify(o)),values=o=>Object.values(o??{}),build=mode=>COURT_GAMES_BUILD+':'+mode;
const loadCloud=()=>import('./cloud.bundle.js?v=20261024-open-v1');
function normalizeState(state){
 state.players=values(state.players).map(p=>({...p,name:safeDisplayName(p.name)}));for(const field of ['teamScores','questionIds','history','faceoffPlayers','faceoffTried','fastIds','fastPlayers'])state[field]=values(state[field]);if(state.board)state.board.slots=values(state.board.slots);state.locked??={};
 if(state.variant==='figure'&&state.roundResult)state.roundResult.rows=values(state.roundResult.rows).map(r=>({...r,guess:Number.isFinite(r.guess)?r.guess:null,error:Number.isFinite(r.error)?r.error:null}));return state;
}

export class CourtGameSession{
 constructor({mode,onState=()=>{},onError=()=>{},identity=()=>null,authorize,getCloud=loadCloud,clock=()=>Date.now()}){this.googleId=identity()?.id??null;Object.assign(this,{mode,onState,onError,identity,authorize,getCloud,clock,unsub:[],members:{},responses:{},secret:{estimates:{},fast:{}},processed:new Set(),queue:Promise.resolve(),closed:false,offset:0});this.timer=setInterval(()=>this.tick(),200);}
 now(){return this.clock()+this.offset;}
 path(part=''){return this.c.ref(this.c.db,'rooms/'+this.code+(part?'/'+part:''));}
 fail(e){if(!this.closed)this.onError(partyConnectionError(e));}
 render(){if(!this.closed)this.onState(this.state,this);}
 async auth(){const auth=await this.authorize();this.uid=auth.uid;requirePartyIdentity(this.identity());this.c=await this.getCloud();await waitForDatabaseConnection(this.c);this.offset=await databaseClockOffset(this.c);if(this.closed)throw Error('Connection cancelled.');}
 member(name,buddy,ready){return {name:validateDisplayName(name),buddy:['krill','schooler','squid','angler','evil'].includes(buddy)?buddy:'krill',protocol:4,joinedAt:this.now(),lastSeen:this.now(),online:true,ready,autoJoin:false};}
 async create(name,buddy='krill',isPrivate=true){
  await this.auth();this.host=true;const m=this.member(name,buddy,true);
  for(let i=0;i<5;i++){
   this.code=Array.from(crypto.getRandomValues(new Uint8Array(4)),x=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[x%24]).join('');
   this.meta={host:this.uid,hostName:m.name,version:3,protocol:4,format:'classic',catalogBuild:build(this.mode),game:this.mode,mode:'court-game',createdAt:this.now(),isPrivate,seats:GAME_MODES[this.mode].seats,phase:'lobby'};
   this.state=createCourtGame(this.mode,[{id:this.uid,...m,team:0}]);this.members={[this.uid]:m};
   try{await this.c.set(this.path(),{meta:this.meta,state:this.state,members:this.members});await this.listen();return this.code;}catch(e){if(i===4)throw e;}
  }
 }
 async join(name,code,buddy='krill'){
  await this.auth();this.code=String(code).trim().toUpperCase();if(!/^[A-Z]{4}$/.test(this.code))throw Error('Enter the four-letter room code.');
  this.meta=(await this.c.get(this.path('meta'))).val();if(!this.meta||this.now()-this.meta.createdAt>86400000)throw Error('That room is no longer available. Host a fresh court.');
  if(this.meta.catalogBuild!==build(this.mode))throw Error('This code belongs to another game or version. Ask the host for a fresh '+GAME_MODES[this.mode].name+' invite.');
  this.host=this.meta.host===this.uid;await this.c.set(this.path('members/'+this.uid),this.member(name,buddy,this.meta.phase==='lobby'));await this.listen();
  // Let the host admit the member, then reject an over-capacity waiting room
  // instead of leaving someone on a ready screen with no seat. Rejoining an
  // existing seat is always allowed; in-progress games admit spectators.
  await new Promise(resolve=>setTimeout(resolve,500));const current=(await this.c.get(this.path('state'))).val();if(current?.stage==='lobby'&&values(current.players).length>=GAME_MODES[this.mode].seats&&!values(current.players).some(p=>p.id===this.uid)){await this.close();await this.c.remove(this.path('members/'+this.uid));throw Error('That courtroom is full. Join another room or ask a friend to host.');}
 }
 async listen(){
  const c=this.c;
  this.unsub.push(c.onValue(this.path('meta'),snap=>{if(!snap.exists()){this.fail(Error('The host closed this court.'));return;}const was=this.host;this.meta=snap.val();this.host=this.meta.host===this.uid;if(was&&!this.host){for(const off of this.hostUnsub??[])off();this.hostUnsub=[];this.hostListening=false;this.refereeReady=false;}if(this.host&&!was)this.resumeHost();this.render();},e=>this.fail(e)));
  this.unsub.push(c.onValue(this.path('state'),snap=>{if(!snap.exists())return;this.state=normalizeState(snap.val());this.render();},e=>this.fail(e)));
  this.unsub.push(c.onValue(this.path('members'),snap=>{this.members=snap.val()??{};if(!this.members[this.uid]){this.fail(Error('You have left this court.'));return;}if(this.host&&this.refereeReady)this.enqueue(()=>this.syncRoster());this.render();},e=>this.fail(e)));
  this.unsub.push(c.onValue(this.path('responses/'+this.uid),snap=>{this.response=snap.val()??{};const ack=this.response.ack;if(ack?.id&&ack.id!==this.lastAck){this.lastAck=ack.id;this.pending=false;if(ack.error)this.fail(Error(ack.error));if(ack.result?.retry)this.onError(ack.result.message);this.lastResult=ack.result;}this.render();},e=>this.fail(e)));
  this.unsub.push(c.onValue(c.ref(c.db,'.info/connected'),async snap=>{const online=snap.val()===true;this.connected=false;if(online&&!this.closed){try{await c.onDisconnect(this.path('members/'+this.uid)).update({online:false,lastSeen:c.serverTimestamp()});if(this.closed)return;await c.update(this.path('members/'+this.uid),{online:true,lastSeen:c.serverTimestamp()});if(!this.closed)this.connected=true;}catch(e){this.fail(e);}}this.render();}));
  this.heartbeat=setInterval(()=>{if(!this.closed&&this.connected)c.update(this.path('members/'+this.uid),{lastSeen:c.serverTimestamp()}).catch(e=>this.fail(e));},15000);
  if(this.host)await this.becomeHost();this.render();
 }
 enqueue(fn){this.queue=this.queue.then(()=>{if(!this.closed)return fn();}).catch(e=>this.fail(e));return this.queue;}
 async becomeHost(){
  if(this.hostListening||this.closed)return;this.hostListening=true;this.refereeReady=false;
  const snapshot=(await this.c.get(this.path())).val();if(this.closed)return;
  if(snapshot.state)this.state=normalizeState(snapshot.state);this.members=snapshot.members??this.members;
  const match=this.state?.matchId;this.secret={estimates:{},fast:{},fastDraft:{}};
  for(const [id,value]of Object.entries(snapshot.responses??{}))if(value.secret?.matchId===match){if(value.secret.estimate)this.secret.estimates[id]=value.secret.estimate;if(value.secret.fast)this.secret.fast[id]=values(value.secret.fast);if(value.secret.fastDraft)this.secret.fastDraft[id]={...value.secret.fastDraft,values:values(value.secret.fastDraft.values)};}
  this.responses=snapshot.responses??{};
  const incoming=snap=>this.enqueue(()=>this.process(snap.key,snap.val()));this.hostUnsub=[this.c.onChildAdded(this.path('requests'),incoming),this.c.onChildChanged(this.path('requests'),incoming)];this.unsub.push(...this.hostUnsub);
  if(this.state?.deadline&&this.state.deadline<this.now())this.state.deadline=this.now()+5000;
  await this.syncRoster();await this.broadcast();this.refereeReady=true;
 }
 resumeHost(){this.becomeHost().catch(e=>{this.hostListening=false;this.refereeReady=false;this.fail(e);});}
 async syncRoster(){
  if(!this.state||!this.host)return;const before=JSON.stringify(this.state.players),waiting=['lobby','finish'].includes(this.state.stage),players=this.state.players,mode=GAME_MODES[this.mode];
  for(const [id,m]of Object.entries(this.members)){
   let p=players.find(p=>p.id===id);if(!p){const a=players.filter(p=>p.team===0&&!p.spectator).length,b=players.filter(p=>p.team===1&&!p.spectator).length;p={id,name:safeDisplayName(m.name),buddy:m.buddy,team:a<=b?0:1,score:0,spectator:!waiting};players.push(p);}
   Object.assign(p,{name:safeDisplayName(m.name),buddy:m.buddy,ready:!!m.ready,online:m.online!==false,connected:m.online!==false||this.now()-(m.lastSeen??0)<30000});
  }
  for(const p of players)if(!this.members[p.id]){p.connected=false;p.ready=false;}
  if(waiting){this.state.players=players.filter(p=>this.members[p.id]&&p.connected).slice(0,mode.seats);for(const p of this.state.players)p.spectator=false;}
  if(before!==JSON.stringify(this.state.players)){this.state.revision++;await this.broadcast();}
 }
 async broadcast(extra={}){
  if(!this.host||this.closed)return;
  if(this.state.stage==='fastFirstReview'||(this.state.fastPass===1&&['fastReady','fastRead','fast'].includes(this.state.stage))){
   const first=this.secret.fast?.[this.state.fastPlayers[0]];
   if(first)for(const id of Object.keys(this.members))if(id!==this.state.fastPlayers[1])extra['responses/'+id+'/fastAudience']={matchId:this.state.matchId,rows:this.state.fastIds.map((qid,i)=>({prompt:CLASH_BY_ID.get(qid).prompt,label:first[i].label,points:first[i].points}))};
  }
  const changes={state:clone(this.state),'meta/phase':this.state.phase,...extra};await this.c.update(this.path(),changes);this.render();await this.publish();
 }
 async publish(){if(!this.host||this.closed)return;const path=this.c.ref(this.c.db,'directory/'+this.code);if(this.meta.isPrivate){await this.c.remove(path);return;}await this.c.onDisconnect(path).remove();return this.c.set(path,{protocol:4,catalogBuild:build(this.mode),mode:'court-game',game:this.mode,format:'classic',hostName:this.meta.hostName,count:this.state.players.filter(p=>p.connected&&!p.spectator).length,seats:GAME_MODES[this.mode].seats,phase:this.state.phase,updatedAt:this.c.serverTimestamp()});}
 async process(uid,r){
  if(!this.host||!r||this.processed.has(r.id)||!this.members[uid]?.online)return;this.processed.add(r.id);if(this.processed.size>1000)this.processed.delete(this.processed.values().next().value);
  // A hand-off may happen after an atomic state/ack write but before the old
  // referee removes its request. Do not apply that accepted action twice.
  if(this.responses[uid]?.ack?.id===r.id){await this.c.runTransaction(this.path('requests/'+uid),current=>current?.id===r.id?null:undefined,{applyLocally:false});return;}
  const extra={};let result={};
  try{
   if(!r.at||Math.abs(this.now()-r.at)>15000)throw Error('That request expired. Try again.');
   const p=this.state.players.find(p=>p.id===uid);if(!p)throw Error('The room is full.');
   const a=r.patch?.action;
   if(a==='team'){
    if(this.mode!=='clash'||!['lobby','finish'].includes(this.state.stage))throw Error('Teams lock when the match begins.');
    const target=Number(r.patch.team);if(![0,1].includes(target))throw Error('Choose a bench.');if(this.state.players.filter(p=>p.id!==uid&&p.team===target&&p.connected).length>=5)throw Error('That bench is full.');p.team=target;this.state.revision++;
   }else if(a==='huddle'){
    if(!canCourtHuddle(this.state,uid))throw Error('Only the defending bench may confer for its steal.');
    if(r.patch?.matchId!==this.state.matchId||r.patch?.round!==this.state.round)throw Error('That suggestion belongs to an earlier board.');
    const text=validateChat(r.text).slice(0,60);if(!text)throw Error('Enter a short suggestion.');
    for(const mate of this.state.players.filter(q=>q.team===p.team&&!q.spectator))extra['responses/'+mate.id+'/huddle/'+uid]={name:p.name,text,round:this.state.round,at:this.now()};
   }else if(a==='react'){
    if(!['nice','close','clutch','ready'].includes(r.patch.reaction))throw Error('Choose a reaction.');
    if(this.now()-(this.lastReaction?.[uid]??0)<2500)throw Error('Give the reaction a moment.');this.lastReaction??={};this.lastReaction[uid]=this.now();this.state.reaction={id:crypto.randomUUID(),uid,type:r.patch.reaction,at:this.now()};this.state.revision++;
   }else if(r.type==='start'||r.type==='rematch'){
    if(uid!==this.meta.host)throw Error('Only the host starts the game.');if(!['lobby','finish'].includes(this.state.stage))throw Error('The match is already running.');startCourtGame(this.state,this.now());this.secret={estimates:{},fast:{}};for(const id of Object.keys(this.members)){extra['responses/'+id+'/secret']=null;extra['responses/'+id+'/huddle']=null;extra['responses/'+id+'/fastAudience']=null;}
   }else{
    if(r.patch?.matchId!==this.state.matchId||r.patch?.round!==this.state.round)throw Error('That action belongs to an earlier round.');
    result=actCourtGame(this.state,this.secret,uid,a,{...r.patch,text:r.text,timeout:false},this.now());
    if((result.accepted||result.saved)&&(this.secret.estimates[uid]||this.secret.fast[uid]||this.secret.fastDraft?.[uid]))extra['responses/'+uid+'/secret']={matchId:this.state.matchId,estimate:this.secret.estimates[uid]??null,fast:this.secret.fast[uid]??null,fastDraft:this.secret.fastDraft?.[uid]??null};
   }
  }catch(e){result={error:e.message};}
  extra['responses/'+uid+'/ack']={id:r.id,result:result.error?null:result,error:result.error??null,at:this.now()};
  await this.broadcast(extra);
  this.responses[uid]??={};this.responses[uid].ack=extra['responses/'+uid+'/ack'];
  await this.c.runTransaction(this.path('requests/'+uid),current=>current?.id===r.id?null:undefined,{applyLocally:false});
 }
 async request(action,extra={}){
  if(!this.connected||this.closed)throw Error('Reconnect before sending an answer.');
  if(action==='fast-draft'&&this.pending){this.queuedDraft=extra;clearTimeout(this.draftRetry);this.draftRetry=setTimeout(()=>{const next=this.queuedDraft;this.queuedDraft=null;if(!this.closed&&this.state.stage==='fast'&&this.state.turn===this.uid&&this.state.fastPass===next.pass)this.request('fast-draft',next).catch(e=>this.fail(e));},150);return false;}
  if(action==='fast'&&this.pending){const until=this.now()+3000;while(this.pending&&this.now()<until&&!this.closed)await new Promise(r=>setTimeout(r,30));}
  if(this.pending&&action==='react')return false;
  if(this.pending)throw Error('Your last action is still reaching the court.');
  const id=crypto.randomUUID(),{text='',...patch}=extra;this.pending=true;this.render();
  try{await this.c.set(this.path('requests/'+this.uid),{id,type:action==='start'?(this.state.stage==='finish'?'rematch':'start'):'ready',text:String(text).slice(0,256),patch:{...patch,action,matchId:this.state.matchId??'',round:this.state.round},at:this.now()});}catch(e){this.pending=false;this.render();throw e;}
 }
 async ready(value){await this.c.update(this.path('members/'+this.uid),{ready:!!value});}
 tick(){if(this.closed||!this.state||!this.connected)return;
  if(!this.host){const m=this.members[this.meta?.host];if(m?.online===false&&this.now()-(m.lastSeen??0)>30000&&!this.claiming){this.claiming=true;this.c.runTransaction(this.path('meta/host'),id=>id===this.meta.host?this.uid:undefined,{applyLocally:false}).catch(e=>{if(!permissionDenied(e))this.fail(e);}).finally(()=>this.claiming=false);}return;}
  if(!this.refereeReady){if(!this.hostListening&&(!this.refereeRetryAt||this.now()>=this.refereeRetryAt)){this.refereeRetryAt=this.now()+5000;this.resumeHost();}return;}
  if(this.ticking)return;this.ticking=true;this.enqueue(async()=>{try{await this.syncRoster();if(tickCourtGame(this.state,this.secret,this.now())){const extra={};for(const [id,rows]of Object.entries(this.secret.fast))extra['responses/'+id+'/secret']={matchId:this.state.matchId,estimate:this.secret.estimates[id]??null,fast:rows};await this.broadcast(extra);}if(!this.publishedAt||this.now()-this.publishedAt>15000){this.publishedAt=this.now();await this.publish();}}finally{this.ticking=false;}});
 }
 async close(){
  if(this.closed)return;this.closed=true;clearInterval(this.timer);clearInterval(this.heartbeat);clearTimeout(this.draftRetry);for(const off of this.unsub)off();this.unsub=[];
  if(!this.c||!this.uid||!this.code)return;
  try{
   // A deliberate exit can hand the referee directly to another participant.
   // An unexpected disconnect still uses the server-enforced 30-second claim.
   const next=this.host&&this.state?.players.find(p=>p.id!==this.uid&&!p.spectator&&this.members[p.id]?.online);
   if(next)await this.c.update(this.path(),{'meta/host':next.id,'meta/hostName':safeDisplayName(next.name),['members/'+this.uid+'/online']:false,['members/'+this.uid+'/lastSeen']:this.c.serverTimestamp()});
   else if(!this.host&&['lobby','finish'].includes(this.state?.stage))await this.c.remove(this.path('members/'+this.uid));
   else await this.c.update(this.path('members/'+this.uid),{online:false,lastSeen:this.c.serverTimestamp()});
  }catch{}
 }
}
export async function listCourtRooms(c,mode,callback,onError){return c.onValue(c.query(c.ref(c.db,'directory'),c.orderByChild('updatedAt'),c.limitToLast(100)),snap=>callback(Object.entries(snap.val()??{}).filter(([,r])=>r.catalogBuild===build(mode)&&Date.now()-r.updatedAt<45000).map(([code,r])=>({code,...r}))),onError);}
