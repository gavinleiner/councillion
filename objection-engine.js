// Original implementation of classic matching-card rules. Public state contains
// counts and played cards; hands, shuffle state and challenge evidence are private.
export const OBJECTION_BUILD='20261111-objection-v45';
export const OB_COLORS=['red','yellow','green','blue'];
export const OB_COLOR_NAMES={red:'RUBY',yellow:'GOLD',green:'JADE',blue:'AZURE'};
export const OB_SYMBOLS={red:'◆',yellow:'☀',green:'♣',blue:'♠',wild:'⚖'};
export const OB_TIMING={deal:3600,play:650,special:1250,challenge:10000,round:6500};
export const OB_CARDS=[];
for(const color of OB_COLORS){
 for(let n=0;n<=9;n++)for(let i=0;i<(n?2:1);i++)OB_CARDS.push({id:color+'-'+n+'-'+i,color,value:String(n)});
 for(const value of ['skip','reverse','draw2'])for(let i=0;i<2;i++)OB_CARDS.push({id:color+'-'+value+'-'+i,color,value});
}
for(const value of ['wild','wild4'])for(let i=0;i<4;i++)OB_CARDS.push({id:value+'-'+i,color:'wild',value});
export const OB_BY_ID=new Map(OB_CARDS.map(c=>[c.id,c]));
export const obLabel=c=>!c?'':c.value==='wild4'?'WILD +4':c.value==='wild'?'WILD':(OB_COLOR_NAMES[c.color]+' '+({draw2:'+2',reverse:'REVERSE',skip:'SKIP'}[c.value]??c.value));
export const obPoints=c=>c.color==='wild'?50:['skip','reverse','draw2'].includes(c.value)?20:Number(c.value);
export function objectionSettings(v={}){return {goal:[0,200,500].includes(v.goal)?v.goal:0,seconds:[20,30,45].includes(v.seconds)?v.seconds:30};}
export function validObjectionSettings(v){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['goal','seconds'].includes(k)))throw Error('Choose a listed card-table setting.');const safe=objectionSettings(v);for(const k of Object.keys(v))if(safe[k]!==v[k])throw Error('Choose a listed card-table setting.');return safe;}
const values=x=>Array.isArray(x)?x:Object.values(x??{});
export function normalizeObjection(ref){if(!ref)return ref;ref.drawPile=values(ref.drawPile);ref.discardPile=values(ref.discardPile);ref.hands??={};ref.versions??={};for(const id of Object.keys(ref.hands))ref.hands[id]=values(ref.hands[id]);if(ref.evidence)ref.evidence.cards=values(ref.evidence.cards);return ref;}
export function normalizeObjectionState(s){s.players=values(s.players);s.history=values(s.history);if(s.objection){s.objection.log=values(s.objection.log);s.objection.order=values(s.objection.order);}if(s.result)s.result.rows=values(s.result.rows).map(r=>({...r,cards:values(r.cards)}));if(s.roundResult)s.roundResult.rows=values(s.roundResult.rows).map(r=>({...r,cards:values(r.cards)}));return s;}
const random=ref=>{ref.seed=(Math.imul(ref.seed,1664525)+1013904223)>>>0;return ref.seed/4294967296;};
function shuffle(a,ref){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(random(ref)*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
const crew=s=>s.players.filter(p=>!p.spectator);
const present=s=>crew(s).filter(p=>p.online!==false&&p.connected!==false);
function stage(s,name,now,ms=0){s.stage=name;s.stageAt=now;s.deadline=ms?now+ms:0;s.phase=name==='finish'?'ended':name==='ob-round'?'burst':name==='lobby'?'lobby':'playing';s.revision++;}
function emit(s,type,text,now,extra={}){const event={id:++s.eventSerial,type,text,at:now,...extra};s.event=event;s.notice=text;s.objection.log=[...(s.objection.log??[]),event].slice(-6);s.revision++;}
function sync(s,ref){for(const p of crew(s)){p.cards=(ref.hands[p.id]??[]).length;p.handRevision=ref.versions[p.id]??0;if(p.cards!==1)p.declared=false;}s.objection.drawCount=ref.drawPile.length;s.objection.discardCount=ref.discardPile.length;}
function handChanged(ref,id){ref.versions[id]=(ref.versions[id]??0)+1;}
function take(s,ref,id,count){const got=[];ref.hands[id]??=[];for(let i=0;i<count;i++){
 if(!ref.drawPile.length&&ref.discardPile.length>1){const top=ref.discardPile.pop();ref.drawPile=shuffle(ref.discardPile,ref);ref.discardPile=[top];}
 const card=ref.drawPile.pop();if(!card)break;ref.hands[id].push(card);got.push(card);
 }if(got.length)handChanged(ref,id);sync(s,ref);return got;}
function next(s,from,steps=1){const order=s.objection.order,eligible=new Set(present(s).map(p=>p.id));let i=order.indexOf(from);if(i<0)i=0;let id=from;for(let n=0;n<steps;n++){for(let tries=0;tries<order.length;tries++){i=(i+s.objection.direction+order.length)%order.length;if(eligible.has(order[i])){id=order[i];break;}}}return id;}
function openTurn(s,ref,id,now){ref.drawn=null;s.objection.turn=id;s.objection.turnSerial++;s.objection.drawn=false;stage(s,'ob-play',now,s.settings.seconds*1000);}
export function obPlayable(s,card){return !!card&&(card.color==='wild'||card.color===s.objection.color||card.value===s.objection.top.value);}
export function objectionReceipt(s,secret,id){const ref=secret?.objection;if(!ref)return {matchId:s.matchId??'',round:s.round,cards:[],handRevision:0};return {matchId:s.matchId,round:s.round,cards:(ref.hands[id]??[]).map(c=>({...c})),handRevision:ref.versions[id]??0,drawnId:ref.drawn?.uid===id?ref.drawn.card:null,...(ref.evidence?.viewer===id?{evidence:ref.evidence}: {})};}
function handStart(s,ref,now){
 s.round++;s.roundResult=null;ref.drawPile=shuffle(OB_CARDS,ref);ref.discardPile=[];ref.hands={};ref.versions={};ref.drawn=null;ref.pending=null;ref.catchTarget=null;ref.evidence=null;ref.winner=null;ref.resume=null;ref.stalls=0;
 s.objection={order:crew(s).map(p=>p.id),direction:1,turn:'',turnSerial:0,color:'red',top:null,drawn:false,log:[],catchTarget:null};
 const order=s.objection.order,dealer=order[((ref.dealerIndex??0)+s.round-1)%order.length];
 for(let i=0;i<7;i++)for(const id of order)take(s,ref,id,1);
 // Redraw opening action cards. This documented table convention makes the
 // opening immediately readable while preserving the entire 108-card deck.
 const opening=ref.drawPile.findIndex(c=>/^\d$/.test(c.value));
 const [top]=ref.drawPile.splice(opening,1);ref.discardPile=[top];s.objection.top={...top};s.objection.color=top.color;
 s.objection.turn=next(s,dealer);sync(s,ref);stage(s,'ob-deal',now,OB_TIMING.deal);
 emit(s,'ob-deal','Seven cards. Keep your evidence close.',now,{dealer});
}
export function startObjection(s,secret,now=Date.now(),rng=Math.random){const active=present(s);if(active.length<2||active.length>6)throw Error('Objection needs two to six players.');if(active.some(p=>!p.ready))throw Error('Wait for everyone to ready up.');s.settings=objectionSettings(s.settings);s.matchId=crypto.randomUUID();s.round=0;s.history=[];s.result=null;for(const p of s.players){p.spectator=!active.some(x=>x.id===p.id);p.score=0;p.roundWins=0;p.declared=false;}const ref=secret.objection={seed:Math.floor(rng()*4294967295),dealerIndex:Math.floor(rng()*active.length)};handStart(s,ref,now);return true;}
function endRound(s,ref,winner,now,reason='Last card played'){
 const rows=crew(s).map(p=>({id:p.id,cards:[...(ref.hands[p.id]??[])],count:(ref.hands[p.id]??[]).length,points:(ref.hands[p.id]??[]).reduce((n,c)=>n+obPoints(c),0),score:p.score}));
 const earned=winner?rows.filter(r=>r.id!==winner).reduce((n,r)=>n+r.points,0):0,p=s.players.find(p=>p.id===winner);
 if(p){p.score+=earned;p.roundWins++;}for(const r of rows)r.score=s.players.find(p=>p.id===r.id).score;
 const result={winner,points:earned,reason,rows:rows.sort((a,b)=>a.count-b.count),round:s.round};s.roundResult=result;s.history.push({...result,at:now});
 if(!s.settings.goal||p?.score>=s.settings.goal||!winner){s.result={...result,goal:s.settings.goal};stage(s,'finish',now);emit(s,'ob-win',winner?p.name+' wins the case.':'The table is blocked. The court adjourns.',now,{winner,points:earned});}
 else {stage(s,'ob-round',now,OB_TIMING.round);emit(s,'ob-round',p.name+' takes the hand. +'+earned+' points.',now,{winner,points:earned});}
}
function resolve(s,ref,now,resume,type,text,extra={},delay=OB_TIMING.special){ref.resume=resume;stage(s,'ob-resolve',now,delay);emit(s,type,text,now,extra);}
function proceed(s,ref,now){const r=ref.resume;ref.resume=null;if(r?.winner){endRound(s,ref,r.winner,now);return;}openTurn(s,ref,r?.next??s.objection.turn,now);}
function acceptedDrawFour(s,ref,now,challenge){
 const p=ref.pending;if(!p)throw Error('That challenge has already closed.');
 let amount=4,target=p.target,turn=next(s,p.target),type='ob-penalty',text;
 if(challenge){ref.evidence={viewer:p.target,cards:p.hand.map(c=>({...c})),illegal:p.illegal,from:p.from,at:now};if(p.illegal){target=p.from;turn=p.target;type='ob-sustained';text='OBJECTION SUSTAINED · '+s.players.find(q=>q.id===p.from).name+' draws four.';}else{amount=6;type='ob-overruled';text='OVERRULED · '+s.players.find(q=>q.id===p.target).name+' draws six.';}}
 else text=s.players.find(q=>q.id===target).name+' accepts four cards.';
 const cards=take(s,ref,target,amount);ref.pending=null;s.objection.pending=null;
 const winner=ref.winner&&(ref.hands[ref.winner]??[]).length===0?ref.winner:null;ref.winner=null;
 resolve(s,ref,now,{next:turn,winner},type,text,{from:p.from,to:target,count:cards.length,challenge:!!challenge});
}
function context(s,p){if(p.matchId!==s.matchId||p.round!==s.round)throw Error('That action belongs to an earlier hand.');}
function requireTurn(s,uid,p,now){if(s.stage!=='ob-play'||s.objection.turn!==uid)throw Error('Wait for your turn.');if(p.turnSerial!==s.objection.turnSerial)throw Error('That turn has already moved on.');if(now>=s.deadline)throw Error('Your turn has ended.');}
export function actObjection(s,secret,uid,action,p={},now=Date.now()){
 const ref=secret.objection;context(s,p);if(['lobby','ob-deal','ob-round','finish'].includes(s.stage))throw Error('The table is not accepting moves yet.');const actor=present(s).find(x=>x.id===uid);if(!actor||!ref)throw Error('Only seated, connected players can act.');
 if(action==='ob-declare'){if((ref.hands[uid]??[]).length!==1||ref.catchTarget!==uid)throw Error('Call Objection when you have one card left.');actor.declared=true;ref.catchTarget=null;s.objection.catchTarget=null;emit(s,'ob-call',actor.name+' · OBJECTION!',now,{from:uid});return {accepted:true};}
 if(action==='ob-catch'){const target=ref.catchTarget;if(!target||target!==p.target||target===uid)throw Error('There is no missed call to catch.');const other=s.players.find(x=>x.id===target);if(other.declared||(ref.hands[target]??[]).length!==1)throw Error('That call is already covered.');const got=take(s,ref,target,2);ref.catchTarget=null;s.objection.catchTarget=null;emit(s,'ob-caught',actor.name+' caught '+other.name+' without a call!',now,{from:uid,to:target,count:got.length});return {accepted:true};}
 if(action==='ob-challenge'||action==='ob-accept'){
  if(s.stage!=='ob-challenge'||ref.pending?.target!==uid||s.objection.turnSerial!==p.turnSerial||now>=s.deadline)throw Error('That Draw Four decision has closed.');
  acceptedDrawFour(s,ref,now,action==='ob-challenge');return {accepted:true};
 }
 requireTurn(s,uid,p,now);
 if(action==='ob-play'){
  const hand=ref.hands[uid]??[],index=hand.findIndex(c=>c.id===p.card);if(index<0)throw Error('That card is not in your hand.');const card=hand[index];if(!obPlayable(s,card))throw Error('Match the color, number or symbol, or play a wild.');if(ref.drawn&&(ref.drawn.uid!==uid||ref.drawn.card!==card.id))throw Error('After drawing, only the new card may be played.');if(card.color==='wild'&&!OB_COLORS.includes(p.color))throw Error('Choose the next color.');
  const oldColor=s.objection.color,illegal=card.value==='wild4'&&hand.some(c=>c.color===oldColor),evidence=hand.filter(c=>c.id!==card.id).map(c=>({...c}));
  ref.catchTarget=null;s.objection.catchTarget=null;ref.drawn=null;hand.splice(index,1);handChanged(ref,uid);ref.discardPile.push(card);s.objection.top={...card};s.objection.color=card.color==='wild'?p.color:card.color;s.objection.drawn=false;ref.stalls=0;
  if(hand.length===1){actor.declared=!!p.announce;if(!actor.declared){ref.catchTarget=uid;s.objection.catchTarget=uid;}}
  if(card.value==='reverse')s.objection.direction*=-1;
  let target=next(s,uid),nextTurn=target,delay=OB_TIMING.play,type='ob-card',count=0;
  if(card.value==='skip'||card.value==='reverse'&&present(s).length===2)nextTurn=next(s,uid,2);
  if(card.value==='skip')type='ob-skip';if(card.value==='reverse')type='ob-reverse';
  if(card.value==='draw2'){type='ob-draw2';count=take(s,ref,target,2).length;nextTurn=next(s,target);}
  const winner=hand.length===0?uid:null;sync(s,ref);
  if(card.value==='wild4'){
   ref.pending={from:uid,target,illegal,hand:evidence};ref.winner=winner;s.objection.pending={from:uid,target,count:4};s.objection.turn=target;s.objection.turnSerial++;
   stage(s,'ob-challenge',now,OB_TIMING.challenge);emit(s,'ob-wild4',actor.name+' plays WILD +4. Accept it—or object.',now,{from:uid,to:target,card:{...card},color:s.objection.color});
  }else{
   if(card.value==='wild')type='ob-wild';if(type!=='ob-card')delay=OB_TIMING.special;
   resolve(s,ref,now,{next:nextTurn,winner},type,actor.name+' plays '+obLabel(card)+(p.announce&&hand.length===1?' · OBJECTION!':''),{from:uid,to:target,card:{...card},color:s.objection.color,count,declared:actor.declared},delay);
  }
  return {accepted:true};
 }
 if(action==='ob-draw'){
  if(ref.drawn)throw Error('Keep or play the card you just drew.');ref.catchTarget=null;s.objection.catchTarget=null;
  const got=take(s,ref,uid,1),card=got[0];
  if(card&&obPlayable(s,card)){ref.drawn={uid,card:card.id};s.objection.drawn=true;s.deadline=Math.max(s.deadline,now+8000);emit(s,'ob-draw',actor.name+' draws one card.',now,{from:uid,to:uid,count:1});}
  else{ref.stalls=card?0:(ref.stalls??0)+1;if(ref.stalls>=present(s).length){endRound(s,ref,null,now,'No legal moves remain');return {accepted:true};}resolve(s,ref,now,{next:next(s,uid)},'ob-draw',actor.name+' draws and passes.',{from:uid,to:uid,count:got.length},OB_TIMING.play);}
  return {accepted:true};
 }
 if(action==='ob-pass'){
  if(ref.drawn?.uid!==uid)throw Error('Draw a card before passing.');ref.drawn=null;s.objection.drawn=false;resolve(s,ref,now,{next:next(s,uid)},'ob-pass',actor.name+' keeps the new card.',{from:uid},OB_TIMING.play);return {accepted:true};
 }
 throw Error('Choose a card-table action.');
}
export function tickObjection(s,secret,now=Date.now()){
 if(['lobby','finish'].includes(s.stage))return false;const ref=secret.objection;if(!ref)return false;
 const active=present(s);
 if(active.length<2){s.objection.aloneSince??=now;if(active.length===1&&now-s.objection.aloneSince>=8000){endRound(s,ref,active[0].id,now,'Other players disconnected');return true;}}else delete s.objection.aloneSince;
 if(!s.deadline||now<s.deadline)return false;
 if(s.stage==='ob-deal'){openTurn(s,ref,s.objection.turn,now);return true;}
 if(s.stage==='ob-round'){handStart(s,ref,now);return true;}
 if(s.stage==='ob-resolve'){proceed(s,ref,now);return true;}
 if(s.stage==='ob-challenge'){acceptedDrawFour(s,ref,now,false);return true;}
 if(s.stage==='ob-play'){
  const id=s.objection.turn;ref.catchTarget=null;s.objection.catchTarget=null;
  const got=ref.drawn?[]:take(s,ref,id,1);ref.drawn=null;s.objection.drawn=false;
  resolve(s,ref,now,{next:next(s,id)},'ob-timeout','Time’s up. The turn moves on.',{from:id,to:id,count:got.length},OB_TIMING.play);return true;
 }
 return false;
}
