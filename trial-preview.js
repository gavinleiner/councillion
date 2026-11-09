import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame} from './court-games-engine.js';
import {trialReceipt,trialSettings} from './trial-engine.js';
export function trialSeed(seed=38117){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
export class TrialPreviewSession{
 constructor({onState=()=>{},onError=()=>{},name='Counsel',buddy='krill',settings={},autoplay=false,clock=Date.now,seed=38117,seats=6}={}){
  Object.assign(this,{uid:'p0',host:true,googleId:null,code:'BOT TRIAL',preview:true,demo:autoplay,connected:true,onState,onError,autoplay,clock,rng:trialSeed(seed),botRng:trialSeed(seed+91),virtual:clock(),previous:clock(),closed:false,playing:false,speed:1,secret:{},lastActions:{},phases:[],events:[]});
  this.state=createCourtGame('trial',['Counsel','Nori Bot','Sage Bot','Pearl Bot','Mako Bot','Reef Bot','Silt Bot','Cove Bot'].slice(0,Math.min(8,Math.max(2,seats))).map((n,i)=>({id:'p'+i,name:i?n:name,buddy:i?['krill','squid','schooler','angler','evil','krill','squid','angler'][i]:buddy,ready:true,online:true,connected:true})));
  Object.assign(this.state.settings,trialSettings(settings));this.timer=setInterval(()=>this.tick(),60);this.render();
 }
 now(){return this.virtual;}
 render(){if(this.closed)return;this.response={trial:trialReceipt(this.state,this.secret,this.uid)};if(this.phases.at(-1)!==this.state.stage)this.phases.push(this.state.stage);if(this.state.event&&this.events.at(-1)?.id!==this.state.event.id)this.events.push({...this.state.event});this.onState(this.state,this);}
 async ready(){return;}
 async request(action,p={}){
  if(this.closed)return;
  if(action==='settings'){if(!['lobby','finish'].includes(this.state.stage))throw Error('Settings lock when the trial starts.');Object.assign(this.state.settings,trialSettings(p.settings));this.render();return;}
  if(['start','rematch'].includes(action)){if(!['lobby','finish'].includes(this.state.stage))return;this.secret={};this.lastActions={};startCourtGame(this.state,this.now(),this.rng,this.secret);this.playing=true;this.render();return;}
  const result=this.send(this.uid,action,p);this.render();return result;
 }
 send(id,action,p={}){return actCourtGame(this.state,this.secret,id,action,{matchId:this.state.matchId,round:this.state.round,stageAt:this.state.stageAt,...p},this.now());}
 tick(){
  const real=this.clock(),delta=Math.min(250,Math.max(0,real-this.previous));this.previous=real;if(this.closed||!this.playing)return;this.virtual+=delta*this.speed;
  const s=this.state,ref=this.secret.trial;if(!ref)return;let changed=false;
  try{
   if(s.deadline&&this.now()>=s.deadline){if(tickCourtGame(s,this.secret,this.now(),this.rng))this.render();if(s.stage==='finish')this.playing=false;return;}
   const elapsed=this.now()-s.stageAt,live=s.players.filter(p=>!p.spectator&&p.alive),riskOrder=s.atRisk??[];
   for(const [i,p]of s.players.entries()){
    if(p.spectator||!this.autoplay&&p.id===this.uid)continue;const key=s.stageAt+':'+p.id,e=ref.entries?.[p.id]??{};
    if(s.stage==='trial-question'&&!s.locked[p.id]&&elapsed>Math.max(4400,s.question.prompt.split(' ').length*230)+i*180){
     const wrong=this.autoplay?live.slice(0,2).some(v=>v.id===p.id):(s.round+i)%4===0;
     this.send(p.id,'trial-answer',{choice:wrong?s.question.options.find(o=>o.id!==ref.correct).id:ref.correct});changed=true;
    }
    if(s.stage==='trial-brief'&&s.challenge.kind==='cups'&&ref.poisoners.includes(p.id)&&elapsed>1600+i*150&&e.poison===undefined){this.send(p.id,'trial-poison',{choice:0});changed=true;}
    if(s.stage==='trial-challenge'){
     const kind=s.challenge.kind,defendant=riskOrder.includes(p.id),receipt=trialReceipt(s,this.secret,p.id);
     if(kind==='maths'&&(e.score??0)<6&&elapsed>2200+i*80&&this.now()-(this.lastActions[key]??0)>1500){this.send(p.id,'trial-play',{index:e.index??0,choice:ref.math[(e.index??0)%ref.math.length].correct});this.lastActions[key]=this.now();changed=true;}
     else if(kind==='pulse'&&(e.attempts??0)<3&&elapsed>1000){const wave=(1-Math.cos((elapsed%2600)/2600*2*Math.PI))/2;if(Math.abs(wave-.5)<.115&&this.now()-(this.lastActions[key]??0)>800){this.send(p.id,'trial-play',{});this.lastActions[key]=this.now();changed=true;}}
     else if(kind==='dice'&&!e.submitted&&elapsed>1100+i*120&&this.now()-(this.lastActions[key]??0)>1000){this.send(p.id,'trial-play',{move:(e.score??0)>=8?'bank':'roll'});this.lastActions[key]=this.now();changed=true;}
     else if(!['maths','pulse','dice'].includes(kind)&&!e.submitted&&elapsed>3100+i*180){
      let answer={};
      if(kind==='memory'){answer.sequence=[...ref.pattern];if(defendant&&p.id===riskOrder.at(-1))answer.sequence=[ref.pattern[1],ref.pattern[0],...ref.pattern.slice(2)];}
      if(kind==='mirror')answer.choice=defendant&&p.id===riskOrder.at(-1)?ref.mirrorOptions.find(o=>o.id!==ref.mirrorCorrect).id:ref.mirrorCorrect;
      if(kind==='cups')answer.choice=defendant?(this.autoplay?2:Math.floor(this.botRng()*6)):'none';
      if(kind==='greed')answer.choice=(defendant||receipt.role==='partner')?this.autoplay?'share':i%3===0?'steal':'share':0;
      if(kind==='bids')answer.choice=defendant?Math.min(p.cash,s.challenge.soloBail?300:100+i*40):s.challenge.soloBail?'yes':riskOrder[0];
      this.send(p.id,'trial-play',answer);changed=true;
     }
    }
    if(s.stage==='trial-escape-question'&&!s.escape.caught[p.id]&&!s.locked[p.id]&&elapsed>3600+i*150){
     const count=p.id===s.escape.soul&&!s.escape.gate?2:3;let mask=ref.escape.options.slice(0,count).reduce((n,o,j)=>n|(o.correct?1<<j:0),0);
     if(this.autoplay&&p.id===s.escape.soul&&!s.escape.gate&&s.escape.turn%3===0)mask^=1;
     else if(!this.autoplay&&this.botRng()<.17)mask^=1;
     this.send(p.id,'trial-escape',{mask,judged:(1<<count)-1});changed=true;
    }
   }
   if(tickCourtGame(s,this.secret,this.now(),this.rng))changed=true;if(changed)this.render();if(s.stage==='finish')this.playing=false;
  }catch(e){this.playing=false;this.onError(e.message);}
 }
 close(){this.closed=true;clearInterval(this.timer);}
}
