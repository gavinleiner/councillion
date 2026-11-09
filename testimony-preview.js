import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame} from './court-games-engine.js';
import {btReceipt,btSettings} from './testimony-engine.js';
import {botArtwork,botCaption,inferBotDrawing,partialArtwork} from './testimony-bots.js';
export const BOT_PROMPTS=['A pufferfish judge eating noodles','A cat stealing the moon','A rocket ship on vacation','A duck arguing with a traffic cone','A robot taking a bubble bath','A pizza escaping from prison'];
export class TestimonyPreviewSession{
 constructor({onState=()=>{},onError=()=>{},settings={},name='Counsel',buddy='krill',autoplay=false,clock=()=>Date.now()}={}){Object.assign(this,{uid:'p0',host:true,code:'BOT TRIAL',connected:true,preview:true,demo:autoplay,autoplay,onState,onError,clock,closed:false,playing:!autoplay,speed:1,virtual:clock(),previous:clock(),secret:{},phaseKey:'',lastBot:0});this.state=createCourtGame('testimony',['Counsel','Nori Bot','Sage Bot','Pearl Bot','Mako Bot','Reef Bot'].map((n,i)=>({id:'p'+i,name:i?n:name,buddy:i?['krill','squid','schooler','angler','evil','krill'][i]:buddy,ready:true,online:true,connected:true})));this.state.hostId=this.uid;Object.assign(this.state.settings,btSettings({...settings,custom:settings.custom?.length?settings.custom:BOT_PROMPTS,customOnly:true}));this.timer=setInterval(()=>this.tick(),80);this.render();}
 now(){return this.virtual;}
 render(){if(this.closed)return;this.response={testimony:btReceipt(this.state,this.secret,this.uid)};this.onState(this.state,this);}
 async ready(){return;}
 async request(action,p={}){if(this.closed)return;if(action==='settings'){Object.assign(this.state.settings,btSettings(p.settings));this.render();return;}if(['start','rematch'].includes(action)){if(!['lobby','finish'].includes(this.state.stage))return;this.secret={};startCourtGame(this.state,this.now(),Math.random,this.secret);this.playing=true;this.render();return;}const result=this.send(this.uid,action,p);this.render();return result;}
 send(id,action,p={}){return actCourtGame(this.state,this.secret,id,action,{matchId:this.state.matchId,round:this.state.round,stageAt:this.state.stageAt,...p},this.now());}
 tick(){const real=this.clock(),delta=Math.min(250,Math.max(0,real-this.previous));this.previous=real;if(this.closed||!this.playing)return;this.virtual+=delta*this.speed;const s=this.state,ref=this.secret.testimony;if(!ref)return;if(s.deadline&&this.now()>=s.deadline){tickCourtGame(s,this.secret,this.now());this.render();return;}const key=[s.matchId,s.round,s.stage,s.stageAt].join(':');if(key!==this.phaseKey){this.phaseKey=key;this.phaseAt=this.now();this.lastBot=0;}const elapsed=this.now()-this.phaseAt;let changed=false;
 try{if(this.now()-this.lastBot>=350){this.lastBot=this.now();for(const [i,p]of s.players.entries()){if(!this.autoplay&&p.id===this.uid)continue;const task=ref.tasks[p.id];if(task&&!s.locked[p.id]&&['bt-prompt','bt-draw','bt-caption','bt-live'].includes(s.stage)&&task.kind!=='live'&&task.kind!=='vote'){
   if(task.kind==='draw'){const art=botArtwork(task.text??task.suggested??'pufferfish',i+s.round),drawing=partialArtwork(art,Math.min(1,Math.max(.01,(elapsed-650)/4500)));this.send(p.id,'bt-draft',{drawing});changed=true;if(s.stage!=='bt-live'&&elapsed>5200+i*120)this.send(p.id,'bt-seal',{drawing:art});}
   else{const text=task.kind==='prompt'?task.suggested:botCaption(task.drawing,i,s.round),partial=text.slice(0,Math.max(1,Math.floor((elapsed-600)/45)));this.send(p.id,'bt-draft',{text:partial});changed=true;if(elapsed>3600+i*120)this.send(p.id,'bt-seal',{text});}
  }
  if(s.stage==='bt-vote'&&p.id!==s.artist&&!s.voted[p.id]&&elapsed>3400+i*180){const options=s.choices.filter(o=>!ref.options.find(x=>x.id===o.id).authors.includes(p.id));this.send(p.id,'bt-vote',{choice:options[(i+s.round)%options.length].id});changed=true;}
  if(s.stage==='bt-awards'&&!s.voted[p.id]&&elapsed>3200+i*200){this.send(p.id,'bt-award',{choice:ref.roster[(ref.roster.indexOf(p.id)+1+i%2)%ref.roster.length]});changed=true;}
  if(s.stage==='bt-live'&&p.id!==s.artist&&!s.guessed[p.id]&&this.now()-(ref.guesses[p.id]??0)>700&&elapsed>5500+i*220){const guess=elapsed>10000?ref.answer:inferBotDrawing(s.liveDrawing);this.send(p.id,'bt-guess',{text:guess});changed=true;}
 }
 if(['bt-gallery','bt-caption-reveal','bt-live-reveal'].includes(s.stage)&&elapsed>1500&&this.reacted!==key){this.reacted=key;this.send('p1','bt-react',{reaction:['laugh','shock','love','objection'][s.round%4]});changed=true;}}
 if(tickCourtGame(s,this.secret,this.now()))changed=true;if(changed)this.render();if(s.stage==='finish')this.playing=false;
 }catch(e){this.playing=false;this.onError(e.message);}}
 close(){this.closed=true;clearInterval(this.timer);}
}
