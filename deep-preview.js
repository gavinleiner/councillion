import {createDeep,deepPlayer,startDeep,stepDeep,deepAction} from './deep-engine.js';
import {DeepBotDirector} from './deep-bots.js';
export class DeepPreviewSession{
 constructor({onState=()=>{},onError=()=>{},autoplay=false,seats=4,name='Gavin',buddy='krill',seed=5049,tour=true}={}){
  Object.assign(this,{uid:'p0',code:'BOT DIVE',host:true,preview:true,demo:autoplay,connected:true,onState,onError,playing:true,speed:1,closed:false,watchUid:'p0',director:new DeepBotDirector({tour}),input:{},events:[],last:performance.now(),accumulator:0});
  this.state=createDeep(['Gavin','Nori','Mako','Pearl','Reef','Cove'].slice(0,Math.max(2,Math.min(6,seats))).map((n,i)=>({...deepPlayer('p'+i,i?n:name,i?['krill','squid','angler','schooler','evil','krill'][i]:buddy,i>0||autoplay),ready:true})),seed);
  this.timer=setInterval(()=>this.tick(),25);this.onState(this.state,this);
 }
 now(){return this.state.time;}
 async request(action,payload={}){if(action==='start'){const me=this.state.players.find(p=>p.id===this.uid),bot=me.bot;me.bot=false;try{startDeep(this.state);}finally{this.state.players.find(p=>p.id===this.uid).bot=bot;}this.director=new DeepBotDirector({tour:this.director.tour});this.playing=true;}else if(action==='ready')deepAction(this.state,this.uid,'ready',payload);else if(action==='gear')deepAction(this.state,this.uid,'gear',payload);else deepAction(this.state,this.uid,action,payload);this.onState(this.state,this);}
 setInput(input){this.input={...input,at:this.state.time};}
 tick(){const n=performance.now(),delta=Math.min(.25,(n-this.last)/1000);this.last=n;if(this.closed||!this.playing)return;this.accumulator+=delta*this.speed;let loops=0;
  while(this.accumulator>=.05&&loops++<80){this.accumulator-=.05;const bots=this.director.inputs(this.state,this.state.players.filter(p=>p.bot).map(p=>p.id));if(!this.demo)bots[this.uid]={...this.input,at:this.state.time};stepDeep(this.state,bots,.05);if(this.state.events.at(-1)?.id!==this.events.at(-1)?.id&&this.state.events.length)this.events.push(this.state.events.at(-1));if(this.state.stage==='finish'){this.playing=false;break;}}
  this.onState(this.state,this);
 }
 async close(){this.closed=true;clearInterval(this.timer);}
}
