import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame} from './court-games-engine.js';
import {benchReceipt,benchSettings} from './bench-engine.js';
export function benchSeed(seed=7361){let x=seed;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
export class BenchPreviewSession{
 constructor({onState=()=>{},onError=()=>{},name='Counsel',buddy='krill',settings={},autoplay=false,clock=Date.now,seed=7361,seats=6}={}){Object.assign(this,{uid:'p0',host:true,code:'BOT CREW',preview:true,demo:autoplay,connected:true,onState,onError,autoplay,clock,rng:benchSeed(seed),virtual:clock(),previous:clock(),closed:false,playing:false,speed:1,secret:{},phaseKey:''});this.state=createCourtGame('bench',['Counsel','Nori Bot','Sage Bot','Pearl Bot','Mako Bot','Reef Bot'].slice(0,seats).map((n,i)=>({id:'p'+i,name:i?n:name,buddy:i?['krill','squid','schooler','angler','evil','krill'][i]:buddy,ready:true,online:true,connected:true})));Object.assign(this.state.settings,benchSettings(settings));this.timer=setInterval(()=>this.tick(),80);this.render();}
 now(){return this.virtual;}
 render(){if(!this.closed){this.response={bench:benchReceipt(this.state,this.secret,this.uid)};this.onState(this.state,this);}}
 async ready(){return;}
 async request(action,p={}){if(this.closed)return;if(['start','rematch'].includes(action)){if(!['lobby','finish'].includes(this.state.stage))return;this.secret={};startCourtGame(this.state,this.now(),this.rng,this.secret);this.playing=true;this.render();return;}const result=this.send(this.uid,action,p);this.render();return result;}
 send(id,action,p={}){return actCourtGame(this.state,this.secret,id,action,{matchId:this.state.matchId,round:this.state.round,stageAt:this.state.stageAt,...p},this.now());}
 tick(){const real=this.clock(),delta=Math.min(250,Math.max(0,real-this.previous));this.previous=real;if(this.closed||!this.playing)return;this.virtual+=delta*this.speed;const s=this.state,ref=this.secret.bench;if(!ref)return;if(s.deadline&&this.now()>=s.deadline){tickCourtGame(s,this.secret,this.now(),this.rng);this.render();if(s.stage==='finish')this.playing=false;return;}let changed=false;
 try{const key=s.round+':'+s.stage+':'+s.stageAt;if(key!==this.phaseKey){this.phaseKey=key;this.phaseAt=this.now();}const elapsed=this.now()-this.phaseAt;
  if(s.stage==='bench-question'&&s.part==='chase'&&s.chaseRound===2&&!s.objectionUsed&&elapsed>4000){this.send('p2','bench-objection');changed=true;}
  for(const [i,p]of s.players.entries()){if(!this.autoplay&&p.id===this.uid)continue;if(s.stage==='bench-offer'&&!ref.riskVotes[p.id]&&elapsed>2800+i*180){this.send(p.id,'bench-risk',{risk:i===1?'bold':'standard'});changed=true;}
   if(s.stage==='bench-question'&&!s.locked[p.id]&&elapsed>(s.part==='relay'?2800:s.part==='pushback'?4500:Math.min(10500,Math.max(6500,s.question.prompt.split(' ').length*190+2000)))+i*250){const right=s.round%3===0||(s.round+i)%5!==1,choice=right?ref.answer:s.question.options.find(o=>o.id!==ref.answer).id;this.send(p.id,'bench-answer',{choice});changed=true;}
  }
  if(tickCourtGame(s,this.secret,this.now(),this.rng))changed=true;if(changed||s.stage==='bench-question'||s.stage==='bench-judge'||s.stage.endsWith('intro')||s.stage==='bench-offer')this.render();if(s.stage==='finish')this.playing=false;
 }catch(e){this.playing=false;this.onError(e.message);}}
 close(){this.closed=true;clearInterval(this.timer);}
}
