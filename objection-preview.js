import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame} from './court-games-engine.js';
import {objectionSettings,objectionReceipt,obPlayable,OB_COLORS} from './objection-engine.js';
export function obSeed(seed=4511){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
// Deliberately receives only this bot's hand and the public board, never another
// player's cards or the referee's hidden Draw Four verdict.
export function chooseObjectionBot(s,receipt,uid,rng=Math.random){
 const own=s.players.find(p=>p.id===uid),ob=s.objection,hand=receipt.cards??[];if(!own||own.spectator||!ob)return null;
 if(ob.catchTarget===uid&&rng()<.88)return {action:'ob-declare'};
 if(ob.catchTarget&&ob.catchTarget!==uid&&rng()<.7)return {action:'ob-catch',target:ob.catchTarget};
 if(s.stage==='ob-challenge'&&ob.pending?.target===uid)return {action:rng()<.36?'ob-challenge':'ob-accept',turnSerial:ob.turnSerial};
 if(s.stage!=='ob-play'||ob.turn!==uid)return null;
 let playable=hand.filter(c=>obPlayable(s,c)&&(!receipt.drawnId||receipt.drawnId===c.id));
 if(!playable.length)return {action:receipt.drawnId?'ob-pass':'ob-draw',turnSerial:ob.turnSerial};
 const counts=Object.fromEntries(OB_COLORS.map(color=>[color,hand.filter(c=>c.color===color).length]));
 const imminent=s.players.some(p=>p.id!==uid&&!p.spectator&&p.cards<=2),bluff=rng()<.12;
 const score=c=>(c.color==='wild'?(c.value==='wild4'?(bluff||imminent?19:-7):-4):counts[c.color]*2)+({draw2:imminent?14:7,skip:imminent?13:6,reverse:5}[c.value]??Number(c.value)/3)+rng()*2;
 playable=playable.map(c=>({c,n:score(c)})).sort((a,b)=>b.n-a.n);const card=playable[0].c;
 const colors=OB_COLORS.map(color=>({color,n:counts[color]-(card.color===color?1:0)+rng()*.3})).sort((a,b)=>b.n-a.n);
 return {action:'ob-play',card:card.id,color:colors[0].color,announce:hand.length===2&&rng()<.88,turnSerial:ob.turnSerial};
}
export class ObjectionPreviewSession{
 constructor({onState=()=>{},onError=()=>{},name='Counsel',buddy='krill',settings={},autoplay=false,clock=Date.now,seed=4511,seats=4}={}){
  Object.assign(this,{uid:'p0',preview:true,demo:autoplay,host:true,connected:true,code:'BOT TABLE',onState,onError,clock,rng:obSeed(seed),botRng:obSeed(seed+181),closed:false,playing:false,virtual:clock(),previous:clock(),speed:1,secret:{},events:[],stages:[],lastBotAt:0,follow:true});
  this.state=createCourtGame('objection',['Counsel','Nori','Pearl','Mako','Reef','Cove'].slice(0,Math.max(2,Math.min(6,seats))).map((n,i)=>({id:'p'+i,name:i?n:name,buddy:i?['squid','angler','schooler','evil','krill'][i-1]:buddy,ready:true,online:true,connected:true})));
  Object.assign(this.state.settings,objectionSettings(settings));this.timer=setInterval(()=>this.tick(),60);this.render();
 }
 now(){return this.virtual;}
 render(){if(this.closed)return;this.watchUid=this.demo&&this.follow&&this.state.objection?this.state.objection.turn:this.uid;this.response={objection:objectionReceipt(this.state,this.secret,this.watchUid)};if(this.events.at(-1)?.id!==this.state.event?.id&&this.state.event)this.events.push({...this.state.event});if(this.stages.at(-1)!==this.state.stage)this.stages.push(this.state.stage);this.onState(this.state,this);}
 async ready(){}
 async request(action,p={}){
  if(this.closed)return;
  if(action==='settings'){Object.assign(this.state.settings,objectionSettings(p.settings));this.render();return;}
  if(action==='start'||action==='rematch'){if(!['lobby','finish'].includes(this.state.stage))return;this.secret={};startCourtGame(this.state,this.now(),this.rng,this.secret);this.playing=true;this.render();return;}
  const result=this.send(this.uid,action,p);this.render();return result;
 }
 send(id,action,p={}){return actCourtGame(this.state,this.secret,id,action,{matchId:this.state.matchId,round:this.state.round,stageAt:this.state.stageAt,...p},this.now());}
 tick(){
  const real=this.clock(),delta=Math.max(0,Math.min(250,real-this.previous));this.previous=real;if(this.closed||!this.playing)return;this.virtual+=delta*this.speed;
  try{
   if(tickCourtGame(this.state,this.secret,this.now(),this.rng)){this.render();if(this.state.stage==='finish')this.playing=false;return;}
   if(this.now()-this.lastBotAt<900||this.now()-this.state.stageAt<950)return;
   for(const p of this.state.players){if(p.spectator||!this.demo&&p.id===this.uid)continue;const receipt=objectionReceipt(this.state,this.secret,p.id),move=chooseObjectionBot(this.state,receipt,p.id,this.botRng);if(move){const {action,...payload}=move;this.send(p.id,action,payload);this.lastBotAt=this.now();this.render();break;}}
  }catch(e){this.playing=false;this.onError(e.message);}
 }
 close(){this.closed=true;clearInterval(this.timer);}
}
