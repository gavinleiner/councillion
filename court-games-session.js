import {BENCH_BUILD} from './bench-data.js';
import {benchSettings,validBenchSettings,normalizeBench,normalizeBenchState,benchReceipt} from './bench-engine.js';
import {TESTIMONY_BUILD} from './testimony-data.js';
import {btSettings,validBTSettings,normalizeBT,normalizeBTState,btReceipt} from './testimony-engine.js';
import {readDocketHistory,rememberDocketClue} from './docket-history.js';
import {PartyFocus} from './party-focus.js';
import {focusExempt,courtFocusKey,courtFocusEligible} from './fair-play.js';
import {enforceCourtFocus} from './court-focus.js';
import {requireGameAvailable,isGameAvailable} from './game-availability.js';
import {oathReceipt} from './oath-engine.js';
import {CLASH_BY_ID} from './court-games-data.js';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame,canCourtHuddle,GAME_MODES,COURT_GAMES_BUILD} from './court-games-engine.js';
import {waitForDatabaseConnection,databaseClockOffset,partyConnectionError,permissionDenied} from './party-connection.js';
import {validateDisplayName,validateChat,safeDisplayName} from './moderation.js';
import {requirePartyIdentity} from './party-access.js';
import {answerTurn,safeDraft,fastLiveAnswer} from './court-games-dialogue.js';
import {courtAppearance,courtSettings,validCourtSettings} from './court-games-settings.js';
const clone=o=>JSON.parse(JSON.stringify(o)),values=o=>Object.values(o??{}),build=mode=>(mode==='bench'?BENCH_BUILD:mode==='testimony'?TESTIMONY_BUILD:mode==='oath'?'20261108-oath-fresh-v34':COURT_GAMES_BUILD)+':'+mode;
const loadCloud=()=>import('./cloud.bundle.js?v=20261106-final-saves-v28');
function normalizeState(state){
 if(state.variant==='bench')normalizeBenchState(state);if(state.variant==='testimony')normalizeBTState(state);state.players=values(state.players).map(p=>({...p,name:safeDisplayName(p.name)}));for(const field of ['teamScores','questionIds','history','faceoffPlayers','faceoffTried','fastIds','fastPlayers'])state[field]=values(state[field]);if(state.board)state.board.slots=values(state.board.slots);if(state.variant==='docket'){for(const k of ['categoryIds','cells','finalRows','eligible','tied','finalOrder'])state[k]=values(state[k]);state.attempts??={};state.lockouts??={};if(state.result){state.result.scores=values(state.result.scores);state.result.winners=values(state.result.winners);}}if(state.variant==='oath'){for(const k of ['choices','testimonies','clueOrder'])state[k]=values(state[k]);state.voted??={};state.extendVotes??={};state.advanceReady??={};if(state.roundResult)state.roundResult.rows=values(state.roundResult.rows);if(state.result){state.result.scores=values(state.result.scores);state.result.winners=values(state.result.winners);}}state.locked??={};
 if(state.variant==='figure'&&state.roundResult)state.roundResult.rows=values(state.roundResult.rows).map(r=>({...r,guess:Number.isFinite(r.guess)?r.guess:null,error:Number.isFinite(r.error)?r.error:null}));return state;
}

export class CourtGameSession{
 constructor({mode,onState=()=>{},onDrafts=()=>{},onError=()=>{},identity=()=>null,authorize,getCloud=loadCloud,clock=()=>Date.now(),appearance={},settings={}}){this.googleId=identity()?.id??null;Object.assign(this,{mode,onState,onDrafts,onError,identity,authorize,getCloud,clock,appearance:courtAppearance(appearance),initialSettings:mode==='bench'?benchSettings(settings):mode==='testimony'?btSettings(settings):courtSettings(mode,settings),unsub:[],members:{},drafts:{},responses:{},secret:{estimates:{},fast:{}},processed:new Set(),queue:Promise.resolve(),closed:false,offset:0});this.tabReports={};this.tabExemptions={};this.focus=new PartyFocus({clock:()=>this.now(),eligible:()=>!this.closed&&this.connected&&!focusExempt(this.identity())&&courtFocusEligible(this.state,this.uid)?JSON.stringify({game:this.state.matchId,question:courtFocusKey(this.state)}):null,report:r=>this.reportFocus(r)});this.timer=setInterval(()=>this.tick(),200);}
 now(){return this.clock()+this.offset;}
 path(part=''){return this.c.ref(this.c.db,'rooms/'+this.code+(part?'/'+part:''));}
 fail(e){if(!this.closed)this.onError(partyConnectionError(e));}
 render(){if(!this.closed){this.focus.sync();this.onState(this.state,this);queueMicrotask(()=>this.syncAppearance());}}
 syncAppearance(){
  if(this.closed||!this.connected||this.pending||this.syncingAppearance||!['lobby','finish'].includes(this.state?.stage))return;
  const player=this.state.players.find(p=>p.id===this.uid);if(!player||JSON.stringify(courtAppearance(player.appearance))===JSON.stringify(this.appearance))return;
  this.syncingAppearance=true;this.request('appearance',{appearance:this.appearance}).catch(e=>this.fail(e)).finally(()=>this.syncingAppearance=false);
 }
 async auth(){const auth=await this.authorize();this.uid=auth.uid;requirePartyIdentity(this.identity());this.c=await this.getCloud();await waitForDatabaseConnection(this.c);this.offset=await databaseClockOffset(this.c);if(this.closed)throw Error('Connection cancelled.');}
 member(name,buddy,ready){return {name:validateDisplayName(name),buddy:['krill','schooler','squid','angler','evil'].includes(buddy)?buddy:'krill',protocol:4,joinedAt:this.now(),lastSeen:this.now(),online:true,ready,autoJoin:false};}
 async create(name,buddy='krill',isPrivate=true){
  requireGameAvailable(this.mode,this.identity());await this.auth();this.host=true;const m=this.member(name,buddy,true);
  for(let i=0;i<5;i++){
   this.code=Array.from(crypto.getRandomValues(new Uint8Array(4)),x=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[x%24]).join('');
   this.meta={host:this.uid,hostName:m.name,version:3,protocol:4,format:'classic',catalogBuild:build(this.mode),game:this.mode,mode:'court-game',createdAt:this.now(),isPrivate,seats:GAME_MODES[this.mode].seats,phase:'lobby'};
   this.state=createCourtGame(this.mode,[{id:this.uid,...m,team:0,appearance:this.appearance}]);Object.assign(this.state.settings,this.initialSettings);if(this.mode==='testimony')this.state.hostId=this.uid;this.members={[this.uid]:m};
   try{await this.c.set(this.path(),{meta:this.meta,state:this.state,members:this.members});await this.listen();return this.code;}catch(e){if(i===4)throw e;}
  }
 }
 async join(name,code,buddy='krill'){
  requireGameAvailable(this.mode,this.identity());await this.auth();this.code=String(code).trim().toUpperCase();if(!/^[A-Z]{4}$/.test(this.code))throw Error('Enter the four-letter room code.');
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
  this.unsub.push(c.onValue(c.ref(c.db,'tabExemptions'),snap=>{this.tabExemptions=snap.val()??{};this.tabExemptionsReady=true;},e=>this.fail(e)));
  this.unsub.push(c.onValue(this.path('meta'),snap=>{if(!snap.exists()){this.fail(Error('The host closed this court.'));return;}const was=this.host;this.meta=snap.val();this.host=this.meta.host===this.uid;if(was&&!this.host){for(const off of this.hostUnsub??[])off();this.hostUnsub=[];this.hostListening=false;this.refereeReady=false;}if(this.host&&!was)this.resumeHost();this.render();},e=>this.fail(e)));
  this.unsub.push(c.onValue(this.path('state'),snap=>{if(!snap.exists())return;this.state=normalizeState(snap.val());if(this.mode==='docket'&&this.state.clue?.id){const seen=this.state.matchId+':'+this.state.clue.id;if(seen!==this.lastDocketSeen){this.lastDocketSeen=seen;rememberDocketClue(this.uid,this.state.clue.id);}}const turn=answerTurn(this.state)?.key;if(turn!==this.draftTurn){this.draftTurn=turn;this.clearDraft();}this.render();},e=>this.fail(e)));
  this.unsub.push(c.onValue(this.path('typing'),snap=>{this.drafts=snap.val()??{};if(!this.closed)this.onDrafts();},e=>this.fail(e)));
  this.unsub.push(c.onValue(this.path('members'),snap=>{this.members=snap.val()??{};if(!this.members[this.uid]){this.fail(Error('You have left this court.'));return;}if(this.host&&this.refereeReady)this.enqueue(()=>this.syncRoster());this.render();},e=>this.fail(e)));
  this.unsub.push(c.onValue(this.path('responses/'+this.uid),snap=>{this.response=snap.val()??{};const ack=this.response.ack;if(ack?.id&&ack.id!==this.lastAck){this.lastAck=ack.id;if(!this.pendingId||ack.id===this.pendingId){this.pending=false;this.pendingAction=null;this.pendingId=null;}if(ack.error)this.fail(Error(ack.error));if(ack.result?.retry)this.onError(ack.result.message);this.lastResult=ack.result??(ack.error?{error:ack.error}:null);}this.render();},e=>this.fail(e)));
  this.unsub.push(c.onValue(c.ref(c.db,'.info/connected'),async snap=>{const online=snap.val()===true;this.connected=false;if(online&&!this.closed){try{await c.onDisconnect(this.path('members/'+this.uid)).update({online:false,lastSeen:c.serverTimestamp()});await c.onDisconnect(this.path('typing/'+this.uid)).remove();if(this.closed)return;await c.update(this.path('members/'+this.uid),{online:true,lastSeen:c.serverTimestamp()});if(!this.closed)this.connected=true;}catch(e){this.fail(e);}}this.render();}));
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
  if(this.mode==='docket'){const referees=Object.values(snapshot.responses??{}).map(r=>r.secret).filter(r=>r?.matchId===match&&r.docketReferee).sort((a,b)=>(b.savedAt??0)-(a.savedAt??0)||(b.revision??0)-(a.revision??0));if(referees[0]){this.secret.docket=referees[0].docketReferee;this.secret.docket.doubles=values(this.secret.docket.doubles);this.secret.docket.tieIds=values(this.secret.docket.tieIds);this.secret.docket.wagers??={};this.secret.docket.answers??={};this.secret.docket.drafts??={};}}
  if(this.mode==='oath'){const refs=Object.values(snapshot.responses??{}).map(r=>r.secret).filter(r=>r?.matchId===match&&r.oathReferee).sort((a,b)=>(b.savedAt??0)-(a.savedAt??0)||(b.revision??0)-(a.revision??0));if(refs[0]){this.secret.oath=refs[0].oathReferee;for(const key of ['deck','options','verdict'])this.secret.oath[key]=values(this.secret.oath[key]);for(const row of [...this.secret.oath.options,...this.secret.oath.verdict]){row.authors=values(row.authors);if(row.voters)row.voters=values(row.voters);}this.secret.oath.submissions??={};this.secret.oath.drafts??={};this.secret.oath.votes??={};this.secret.oath.knowers??={};}}
  if(this.mode==='testimony'){const refs=Object.values(snapshot.responses??{}).map(r=>r.secret).filter(r=>r?.matchId===match&&r.testimonyReferee).sort((a,b)=>(b.savedAt??0)-(a.savedAt??0));if(refs[0])this.secret.testimony=normalizeBT(refs[0].testimonyReferee);}
  if(this.mode==='bench'){const refs=Object.values(snapshot.responses??{}).map(r=>r.secret).filter(r=>r?.matchId===match&&r.benchReferee).sort((a,b)=>(b.savedAt??0)-(a.savedAt??0));if(refs[0])this.secret.bench=normalizeBench(refs[0].benchReferee);}
  this.responses=snapshot.responses??{};
  const incoming=snap=>this.enqueue(()=>this.process(snap.key,snap.val()));this.hostUnsub=[this.c.onChildAdded(this.path('requests'),incoming),this.c.onChildChanged(this.path('requests'),incoming)];this.hostUnsub.push(this.c.onValue(this.path('tabFocus'),snap=>{this.tabReports=snap.val()??{};this.enqueue(async()=>{if(this.applyFocus())await this.broadcast();});},e=>this.fail(e)));this.unsub.push(...this.hostUnsub);
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
 async broadcast(extra={},publicState=true){
  if(!this.host||this.closed)return;
  for(const id of Object.keys(this.members))extra['responses/'+id+'/liveAnswer']=fastLiveAnswer(this.state,this.secret,id,this.now());
  if(this.state.stage==='fastFirstReview'||(this.state.fastPass===1&&['fastReady','fastRead','fast'].includes(this.state.stage))){
   const first=this.secret.fast?.[this.state.fastPlayers[0]];
   if(first)for(const id of Object.keys(this.members))if(id!==this.state.fastPlayers[1])extra['responses/'+id+'/fastAudience']={matchId:this.state.matchId,rows:this.state.fastIds.map((qid,i)=>({prompt:CLASH_BY_ID.get(qid).prompt,label:first[i].label,text:safeDraft(first[i].input),points:first[i].points}))};
  }
  if(this.mode==='docket'&&this.state.stage==='docketFinalAnswer')for(const id of Object.keys(this.members))extra['responses/'+id+'/finalDraft']={matchId:this.state.matchId,stageAt:this.state.stageAt,text:this.secret.docket?.drafts?.[id]??''};
  if(this.mode==='docket'&&this.secret.docket)extra['responses/'+this.uid+'/secret']={matchId:this.state.matchId,revision:this.state.revision,savedAt:this.c.serverTimestamp?.()??this.now(),docketReferee:this.secret.docket};
  if(this.mode==='oath'&&this.secret.oath){extra['responses/'+this.uid+'/secret']={matchId:this.state.matchId,revision:this.state.revision,savedAt:this.c.serverTimestamp?.()??this.now(),oathReferee:this.secret.oath};for(const id of Object.keys(this.members))extra['responses/'+id+'/oath']=oathReceipt(this.state,this.secret,id);}
  if(this.mode==='testimony'){this.state.hostId=this.meta.host;if(this.secret.testimony){extra['responses/'+this.uid+'/secret']={matchId:this.state.matchId,savedAt:this.c.serverTimestamp?.()??this.now(),testimonyReferee:this.secret.testimony};for(const id of Object.keys(this.members))extra['responses/'+id+'/testimony']=btReceipt(this.state,this.secret,id);}}
  if(this.mode==='bench'&&this.secret.bench){extra['responses/'+this.uid+'/secret']={matchId:this.state.matchId,savedAt:this.c.serverTimestamp?.()??this.now(),benchReferee:this.secret.bench};for(const id of Object.keys(this.members))extra['responses/'+id+'/bench']=benchReceipt(this.state,this.secret,id);}
  const changes={...(publicState?{state:clone(this.state),'meta/phase':this.state.phase}:{}),...extra};await this.c.update(this.path(),changes);this.render();
  const directoryKey=JSON.stringify([this.meta.isPrivate,this.state.phase,this.state.players.map(p=>[p.id,p.connected,p.spectator])]);
  if(publicState&&(directoryKey!==this.directoryKey||!this.publishedAt)){this.directoryKey=directoryKey;this.publishedAt=this.now();await this.publish();}
 }
 async publish(){if(!this.host||this.closed)return;const path=this.c.ref(this.c.db,'directory/'+this.code);if(this.meta.isPrivate){await this.c.remove(path);return;}await this.c.onDisconnect(path).remove();return this.c.set(path,{protocol:4,catalogBuild:build(this.mode),mode:'court-game',game:this.mode,format:'classic',hostName:this.meta.hostName,count:this.state.players.filter(p=>p.connected&&!p.spectator).length,seats:GAME_MODES[this.mode].seats,phase:this.state.phase,updatedAt:this.c.serverTimestamp()});}
 async process(uid,r){
  if(!this.host||!r||this.processed.has(r.id)||!this.members[uid]?.online)return;this.processed.add(r.id);if(this.processed.size>1000)this.processed.delete(this.processed.values().next().value);
  // A hand-off may happen after an atomic state/ack write but before the old
  // referee removes its request. Do not apply that accepted action twice.
  if(this.responses[uid]?.ack?.id===r.id){await this.c.runTransaction(this.path('requests/'+uid),current=>current?.id===r.id?null:undefined,{applyLocally:false});return;}
  const extra={},beforeRevision=this.state.revision;let result={};
  try{
   if(!r.at||Math.abs(this.now()-r.at)>15000)throw Error('That request expired. Try again.');
   const p=this.state.players.find(p=>p.id===uid);if(!p)throw Error('The room is full.');
   const a=r.patch?.action;
   if(a==='appearance'){
    if(!['lobby','finish'].includes(this.state.stage))throw Error('Change your counsel appearance between games.');p.appearance=courtAppearance(r.patch.appearance);this.state.revision++;
   }else if(a==='settings'){
    if(uid!==this.meta.host)throw Error('Only the host chooses match settings.');if(this.state.stage!=='lobby'&&this.state.stage!=='finish')throw Error('Match settings lock when the game starts.');Object.assign(this.state.settings,(this.mode==='bench'?validBenchSettings(r.patch.settings):this.mode==='testimony'?validBTSettings(r.patch.settings):validCourtSettings(this.mode,r.patch.settings)));this.state.revision++;
   }else if(a==='team'){
    if(this.mode!=='clash'||!['lobby','finish'].includes(this.state.stage))throw Error('Teams lock when the match begins.');
    const target=Number(r.patch.team);if(![0,1].includes(target))throw Error('Choose a bench.');if(this.state.players.filter(p=>p.id!==uid&&p.team===target&&p.connected).length>=5)throw Error('That bench is full.');p.team=target;this.state.revision++;
   }else if(a==='lobby-rock'){
    if(this.mode!=='clash'||this.state.stage!=='lobby'||p.spectator)throw Error('Save the pebbles for the waiting room.');
    this.lastRock??={};if(this.now()-(this.lastRock[uid]??0)<1200)throw Error('One pebble at a time.');
    const opponents=this.state.players.filter(q=>q.id!==uid&&q.team!==p.team&&q.online!==false&&q.connected!==false&&!q.spectator);if(!opponents.length)throw Error('The other bench is empty.');
    const target=opponents[Math.floor(Math.random()*opponents.length)];this.lastRock[uid]=this.now();this.state.lobbyRock={id:crypto.randomUUID(),from:uid,to:target.id,at:this.now()};this.state.revision++;
   }else if(a==='huddle'){
    if(!canCourtHuddle(this.state,uid))throw Error('Only the defending bench may confer for its steal.');
    if(r.patch?.matchId!==this.state.matchId||r.patch?.round!==this.state.round)throw Error('That suggestion belongs to an earlier board.');
    const text=validateChat(r.text).slice(0,60);if(!text)throw Error('Enter a short suggestion.');
    for(const mate of this.state.players.filter(q=>q.team===p.team&&!q.spectator))extra['responses/'+mate.id+'/huddle/'+uid]={name:p.name,text,round:this.state.round,at:this.now()};
   }else if(a==='react'){
    if(!['nice','close','clutch','ready'].includes(r.patch.reaction))throw Error('Choose a reaction.');
    if(this.now()-(this.lastReaction?.[uid]??0)<2500)throw Error('Give the reaction a moment.');this.lastReaction??={};this.lastReaction[uid]=this.now();this.state.reaction={id:crypto.randomUUID(),uid,type:r.patch.reaction,at:this.now()};this.state.revision++;
   }else if(r.type==='start'||r.type==='rematch'){
    if(uid!==this.meta.host)throw Error('Only the host starts the game.');if(!['lobby','finish'].includes(this.state.stage))throw Error('The match is already running.');this.secret={estimates:{},fast:{},...(this.mode==='docket'?{docketRecent:readDocketHistory(this.uid)}:{})};startCourtGame(this.state,this.now(),Math.random,this.secret);for(const id of Object.keys(this.members)){extra['responses/'+id+'/secret']=null;extra['responses/'+id+'/huddle']=null;extra['responses/'+id+'/fastAudience']=null;extra['responses/'+id+'/finalDraft']=null;}
   }else{
    if(r.patch?.matchId!==this.state.matchId||r.patch?.round!==this.state.round)throw Error('That action belongs to an earlier round.');
    result=actCourtGame(this.state,this.secret,uid,a,{...r.patch,text:r.text,timeout:false},this.now());
    if((result.accepted||result.saved)&&(this.secret.estimates[uid]||this.secret.fast[uid]||this.secret.fastDraft?.[uid]))extra['responses/'+uid+'/secret']={matchId:this.state.matchId,estimate:this.secret.estimates[uid]??null,fast:this.secret.fast[uid]??null,fastDraft:this.secret.fastDraft?.[uid]??null};
   }
  }catch(e){result={error:e.message};}
  extra['responses/'+uid+'/ack']={id:r.id,result:result.error?null:result,error:result.error??null,at:this.now()};
  // Background Fast Money saves update private receipts/projections only.
  // Rewriting the whole court + directory for every keystroke clogged Enter.
  await this.broadcast(extra,(this.mode!=='clash'&&!['docket-final-draft','oath-draft','bt-draft'].includes(r.patch?.action))||this.state.revision!==beforeRevision);
  this.responses[uid]??={};this.responses[uid].ack=extra['responses/'+uid+'/ack'];
  await this.c.runTransaction(this.path('requests/'+uid),current=>current?.id===r.id?null:undefined,{applyLocally:false});
 }
 applyFocus(){return !!(this.host&&this.tabExemptionsReady&&this.state&&enforceCourtFocus(this.state,this.secret,this.tabReports,this.now(),this.tabExemptions));}
 async reportFocus(report){
  if(!this.c||this.closed||focusExempt(this.identity()))return;
  try{const context=JSON.parse(report.game);await this.c.set(this.path('tabFocus/'+this.uid),{...context,hidden:report.hidden,leftAt:report.leftAt,returnedAt:report.hidden?0:this.now(),at:this.c.serverTimestamp()});}catch(e){this.fail(e);}
 }
 async request(action,extra={}){
  requireGameAvailable(this.mode,this.identity());
  if(['oath-bluff','oath-guess','bt-seal'].includes(action)){this.oathDraft=null;clearTimeout(this.oathDraftTimer);if(this.queuedOathSeal)return false;if(this.pending&&['oath-draft','bt-draft'].includes(this.pendingAction)){this.queuedOathSeal=true;this.render();try{const until=performance.now()+3500;while(this.pending&&performance.now()<until&&!this.closed)await new Promise(r=>setTimeout(r,25));if(this.pending)throw Error('Your draft is still reaching the court. Try sealing again.');this.queuedOathSeal=false;return await this.request(action,extra);}finally{this.queuedOathSeal=false;}}}
  if(!this.connected||this.closed)throw Error('Reconnect before sending an answer.');
  const context=this.mode==='clash'?{matchId:this.state.matchId??'',round:this.state.round,stage:this.state.stage,stageAt:this.state.stageAt??0,turnKey:answerTurn(this.state)?.key??'',boardId:this.state.board?.id??''}:{};
  if(action==='fast-draft'&&extra.checkIndex===undefined&&this.pending){this.queuedDraft=extra;clearTimeout(this.draftRetry);this.draftRetry=setTimeout(()=>{const next=this.queuedDraft;this.queuedDraft=null;if(next&&!this.closed&&this.state.stage==='fast'&&this.state.turn===this.uid&&this.state.fastPass===next.pass)this.request('fast-draft',next).catch(e=>this.fail(e));},150);return false;}
  if(action==='docket-answer'){this.finalDraft=null;clearTimeout(this.finalDraftTimer);}
  if(action==='fast'||(action==='fast-draft'&&extra.checkIndex!==undefined)){this.queuedDraft=null;clearTimeout(this.draftRetry);}
  if((action==='fast'||action==='fast-draft'&&extra.checkIndex!==undefined||this.mode==='clash'&&action==='answer'||this.mode==='docket'&&action==='docket-answer')&&this.pending){const until=performance.now()+3500;while(this.pending&&performance.now()<until&&!this.closed)await new Promise(r=>setTimeout(r,25));}
  if(this.pending&&action==='react')return false;
  if(this.pending)throw Error('Your last action is still reaching the court.');
  if(action==='answer'||action==='docket-answer')this.clearDraft();
  if(action==='appearance')this.appearance=courtAppearance(extra.appearance);
  if(action==='fast'){this.queuedDraft=null;clearTimeout(this.draftRetry);}
  const id=crypto.randomUUID(),{text='',...patch}=extra;this.pending=true;this.pendingAction=action;this.pendingId=id;this.render();
  try{await this.c.set(this.path('requests/'+this.uid),{id,type:action==='start'?(this.state.stage==='finish'?'rematch':'start'):'ready',text:String(text).slice(0,256),patch:{...context,...patch,action,matchId:context.matchId??this.state.matchId??'',round:context.round??this.state.round,...(['docket','oath','testimony','bench'].includes(this.mode)?{stageAt:extra.stageAt??this.state.stageAt??0}:{})},at:this.now()});}catch(e){this.pending=false;this.pendingAction=null;this.pendingId=null;this.render();throw e;}
 }
 setOathDraft(text){
  if(this.closed||this.queuedOathSeal||!['oath-write','oath-guess'].includes(this.state?.stage)||this.state.stage==='oath-write'&&(this.state.turn!==this.uid||this.state.locked?.[this.uid])||this.state.stage==='oath-guess'&&(this.state.turn!==this.uid||this.state.guessSealed))return;
  this.oathDraft={text:String(text).slice(0,48),matchId:this.state.matchId,round:this.state.round,stageAt:this.state.stageAt};clearTimeout(this.oathDraftTimer);this.oathDraftTimer=setTimeout(()=>this.flushOathDraft(),180);
 }
 flushOathDraft(){
  const draft=this.oathDraft;if(!draft||this.closed||!['oath-write','oath-guess'].includes(this.state?.stage)||this.state.stageAt!==draft.stageAt||this.state.stage==='oath-write'&&(this.state.turn!==this.uid||this.state.locked?.[this.uid])||this.state.stage==='oath-guess'&&(this.state.turn!==this.uid||this.state.guessSealed))return;
  if(this.pending){this.oathDraftTimer=setTimeout(()=>this.flushOathDraft(),100);return;}
  this.oathDraft=null;this.request('oath-draft',draft).catch(e=>this.fail(e));
 }
 setFinalDraft(text){
  if(this.closed||this.state?.stage!=='docketFinalAnswer'||this.state.locked?.[this.uid])return;
  this.finalDraft={text:String(text).slice(0,120),matchId:this.state.matchId,round:this.state.round,stageAt:this.state.stageAt};
  clearTimeout(this.finalDraftTimer);this.finalDraftTimer=setTimeout(()=>this.flushFinalDraft(),180);
 }
 flushFinalDraft(){
  const draft=this.finalDraft;if(!draft||this.closed||this.state?.stage!=='docketFinalAnswer'||this.state.stageAt!==draft.stageAt||this.state.locked?.[this.uid])return;
  if(this.pending){this.finalDraftTimer=setTimeout(()=>this.flushFinalDraft(),100);return;}
  this.finalDraft=null;this.request('docket-final-draft',draft).catch(e=>this.fail(e));
 }
 setDraft(value){
  const turn=answerTurn(this.state);if(!turn||turn.uid!==this.uid||this.closed)return this.clearDraft();
  this.draftText=safeDraft(value);this.draftEditedAt=this.now();this.draftTurn=turn.key;clearTimeout(this.typingTimer);
  if(!this.draftText)return this.clearDraft();
  const wait=Math.max(0,150-(this.now()-(this.lastDraftAt??0)));if(wait)this.typingTimer=setTimeout(()=>this.flushDraft(),wait);else this.flushDraft();
 }
 flushDraft(){
  const turn=answerTurn(this.state);if(!this.c||this.closed||!this.connected||!this.draftText||turn?.uid!==this.uid||turn.key!==this.draftTurn)return;
  this.lastDraftAt=this.now();this.c.set(this.path('typing/'+this.uid),{text:this.draftText,at:this.c.serverTimestamp(),editedAt:this.draftEditedAt,round:this.state.round,game:this.state.matchId}).catch(()=>{});
 }
 clearDraft(){clearTimeout(this.typingTimer);this.draftText='';if(this.c&&this.uid&&this.code)this.c.remove(this.path('typing/'+this.uid)).catch(()=>{});}
 async ready(value){await this.c.update(this.path('members/'+this.uid),{ready:!!value});}
 tick(){if(this.closed||!this.state||!this.connected)return;
  if(!this.host){const m=this.members[this.meta?.host];if(m?.online===false&&this.now()-(m.lastSeen??0)>30000&&!this.claiming){this.claiming=true;this.c.runTransaction(this.path('meta/host'),id=>id===this.meta.host?this.uid:undefined,{applyLocally:false}).catch(e=>{if(!permissionDenied(e))this.fail(e);}).finally(()=>this.claiming=false);}return;}
  if(!this.refereeReady){if(!this.hostListening&&(!this.refereeRetryAt||this.now()>=this.refereeRetryAt)){this.refereeRetryAt=this.now()+5000;this.resumeHost();}return;}
  if(this.ticking)return;this.ticking=true;this.enqueue(async()=>{try{await this.syncRoster();const focus=this.applyFocus();if(tickCourtGame(this.state,this.secret,this.now())||focus){const extra={};for(const [id,rows]of Object.entries(this.secret.fast))extra['responses/'+id+'/secret']={matchId:this.state.matchId,estimate:this.secret.estimates[id]??null,fast:rows};await this.broadcast(extra);}if(!this.publishedAt||this.now()-this.publishedAt>15000){this.publishedAt=this.now();await this.publish();}}finally{this.ticking=false;}});
 }
 async close(){
  if(this.closed)return;this.clearDraft();this.closed=true;this.focus.destroy();clearInterval(this.timer);clearInterval(this.heartbeat);clearTimeout(this.draftRetry);clearTimeout(this.finalDraftTimer);clearTimeout(this.oathDraftTimer);for(const off of this.unsub)off();this.unsub=[];
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
export async function listCourtRooms(c,mode,callback,onError){if(!isGameAvailable(mode)){callback([]);return ()=>{};}return c.onValue(c.query(c.ref(c.db,'directory'),c.orderByChild('updatedAt'),c.limitToLast(100)),snap=>callback(Object.entries(snap.val()??{}).filter(([,r])=>r.catalogBuild===build(mode)&&Date.now()-r.updatedAt<45000).map(([code,r])=>({code,...r}))),onError);}
