import {newParty,partyPack,answerParty,normalize,disconnectPlayer} from './engine.js';
import {beginParty,stepParty} from './party-rules.js';
import {loadQuestionData} from './question-data.js';
import {warmAnswerBank} from './answer-matching.js';
import {PACKS} from './data.js';
import {emptyCareer} from './party-career.js';
import {safeDisplayName,validateChat} from './moderation.js';
const BOT_NAMES=['Marlow','Reef','Finch','Vale','Echo'];
const BOT_BUDDIES=['schooler','squid','angler','evil','krill'];
const LEVELS={relaxed:{delay:5600,spread:3000,miss:.26},standard:{delay:3800,spread:3000,miss:.18},sharp:{delay:2700,spread:2600,miss:.1}};
export function chooseBotAnswer(pack,used=[],rng=Math.random){const seen=new Set(used),available=pack.answers.filter(a=>a.label.length<=120&&!seen.has(normalize(a.label)));if(!available.length)return null;const familiar=available.filter(a=>a.points<=60),pool=familiar.length&&rng()<.8?familiar:available;return pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];}
// A deliberately separate simulator: it has no Firebase imports, room receipts,
// ranked writes or access to the player's real question history.
export class BotPartySession{
 constructor(onState,onError,{name='Counsel',buddy='krill',profile=()=>null,storage=null,rng=Math.random,now=()=>Date.now(),load=loadQuestionData,timers=true}={}){
  Object.assign(this,{onState,onError,humanName:safeDisplayName(name),humanBuddy:buddy,humanProfile:profile,storage,rng,now,load,host:true,local:true,botTest:true,isAdmin:false,myId:'human',code:'BOTS',connected:true,offset:0,closed:false,watch:false,paused:false,loading:false,botCount:5,difficulty:'standard',chat:[],drafts:{},plans:new Map(),seen:[],turnKey:'',timers});
  try{const p=JSON.parse(storage?.getItem('fc:bot-test-preferences')??'null');if(p){this.botCount=Math.max(1,Math.min(5,Math.trunc(Number(p.bots))||5));if(LEVELS[p.difficulty])this.difficulty=p.difficulty;}this.seen=JSON.parse(storage?.getItem('fc:bot-test-seen')??'[]');if(!Array.isArray(this.seen))this.seen=[];this.seen=this.seen.filter(id=>typeof id==='string').slice(-5000);}catch{}
  this.meta={host:this.myId,hostName:this.humanName,isPrivate:true};
  this.onVisibility=()=>{if(document.hidden&&!this.paused){this.autoPaused=true;this.pause(true);}else if(!document.hidden&&this.autoPaused){this.autoPaused=false;this.pause(false);}};
 }
 async create(){this.loading=true;this.reset();try{await this.prepare(partyPack(this.state));}finally{this.loading=false;}if(this.closed)return;if(this.timers){this.timer=setInterval(()=>this.tick().catch(e=>this.fail(e.message)),150);document.addEventListener('visibilitychange',this.onVisibility);}this.emit();}
 emit(){if(!this.closed)this.onState(this.state,this);}
 fail(message){if(!this.closed)this.onError(message);}
 reset(){
  this.plans.clear();this.drafts={};this.turnKey='';this.paused=false;this.autoPaused=false;this.pauseAt=0;this.lastAccepted=null;
  const people=[{id:this.myId,name:this.humanName,buddy:this.humanBuddy,ready:true,autoJoin:false},...Array.from({length:this.botCount},(_,i)=>({id:'bot-'+i,name:BOT_NAMES[i],buddy:BOT_BUDDIES[i],bot:true,ready:true,autoJoin:true}))];
  this.members=Object.fromEntries(people.map(p=>[p.id,{name:p.name}]));this.state=newParty(people,this.rng,this.seen);this.state.mode='ranked';this.state.settings.maxPlayers=people.length;this.state.matchId='bot-'+crypto.randomUUID();this.state.notice='Bot test arena · no changes to rank, wins or losses.';this.emit();
 }
 profile(id=this.myId){if(id===this.myId)return this.humanProfile()??{career:emptyCareer(),appearance:{}};const i=Math.max(0,Number(id.split('-')[1])||0);return {career:{...emptyCareer(),rating:[980,1120,1260,1420,1610][i],ranked:5},appearance:{stats:['wins','answers','krillions'],badges:[]}};}
 async prepare(pack){if(!pack)return;await this.load([pack]);if(!this.closed)warmAnswerBank(pack);}
 async start(){if(this.closed||this.loading)return;this.loading=true;try{this.plans.clear();this.drafts={};this.turnKey='';if(!beginParty(this.state,this.now(),this.rng))return;await this.prepare(partyPack(this.state));if(this.closed)return;this.state.nextAt=this.now()+3000;this.paused=false;this.autoPaused=false;this.emit();}catch(e){this.fail(e.message);}finally{this.loading=false;this.emit();}}
 configure({bots=this.botCount,difficulty=this.difficulty}={}){if(!['lobby','ended'].includes(this.state.phase))return;this.botCount=Math.max(1,Math.min(5,Math.trunc(Number(bots))||1));if(LEVELS[difficulty])this.difficulty=difficulty;try{this.storage?.setItem('fc:bot-test-preferences',JSON.stringify({bots:this.botCount,difficulty:this.difficulty}));}catch{}this.reset();}
 setWatch(value){this.watch=!!value;this.plans.delete(this.myId);delete this.drafts[this.myId];this.emit();}
 pause(value=!this.paused){if(this.closed||this.paused===value)return;this.paused=value;if(value)this.pauseAt=this.now();else{const elapsed=this.now()-this.pauseAt;for(const key of ['deadline','nextAt','turnStartedAt','startedAt'])if(this.state[key])this.state[key]+=elapsed;for(const p of this.plans.values()){p.at+=elapsed;p.readyAt+=elapsed;}this.turnSince=(this.turnSince??this.now())+elapsed;this.pauseAt=0;}this.emit();}
 setDraft(text){if(this.closed||this.watch)return;this.drafts[this.myId]={text:String(text).slice(0,120),at:this.now(),editedAt:this.now(),round:this.state.round,game:this.state.matchId};this.onDrafts?.();}
 submit(text){if(this.closed||this.paused||this.watch)return;const result=answerParty(this.state,this.myId,text,this.now());if(result.error){this.fail(result.error);return result;}this.lastAccepted=this.now()+':'+this.state.revision;delete this.drafts[this.myId];this.emit();return result;}
 ready(value){const p=this.state.players.find(p=>p.id===this.myId);p.ready=!!value;this.emit();}
 autoJoin(value){this.state.players.find(p=>p.id===this.myId).autoJoin=!!value;}
 rules(){}
 visibility(){}
 voteQuestion(){if(this.paused||this.state.phase!=='playing')return;this.state.phase='burst';this.state.notice='Fresh test category · no heart lost.';this.state.nextAt=this.now()+900;this.state.revision++;this.emit();}
 sendChat(text){try{const clean=validateChat(text);this.chat.push({uid:this.myId,name:this.humanName,text:clean,at:this.now()});this.chat=this.chat.slice(-30);this.emit();}catch(e){this.fail(e.message);}}
 kick(id){if(id===this.myId)return;disconnectPlayer(this.state,id,this.now());this.plans.delete(id);delete this.drafts[id];this.finish();this.emit();}
 plan(player,now){
  const pack=partyPack(this.state),answer=chooseBotAnswer(pack,this.state.used,this.rng),level=LEVELS[this.difficulty],duration=level.delay+this.rng()*level.spread;
  const p={answer:answer?.label??'',at:now,readyAt:now+duration,miss:!answer||this.rng()<level.miss,typo:this.rng()<.5};this.plans.set(player.id,p);return p;
 }
 finish(){if(this.state.phase!=='ended'||this.state.resultSaved)return;this.state.resultSaved=true;this.state.result={reason:'Bot test match · no rank, win/loss or achievement changes',players:Object.fromEntries(this.state.players.map((p,i)=>[p.id,{place:p.id===this.state.winner?1:Math.max(2,this.state.players.length-(p.eliminationOrder??i)),counted:false,rated:false,win:p.id===this.state.winner}]))};this.drafts={};}
 async tick(){
  if(this.closed||this.paused||this.loading||this.ticking||['lobby','ended'].includes(this.state.phase))return;if(this.timers&&document.hidden){this.autoPaused=true;this.pause(true);return;}
  this.ticking=true;try{
   let now=this.now();
   if(this.state.phase==='burst'&&now>=this.state.nextAt){const next=PACKS.find(p=>p.id===this.state.packIds[this.state.round]);await this.prepare(next);if(this.closed)return;now=this.now();}
   const before=this.state.phase+':'+this.state.round,changed=stepParty(this.state,now);
   if(before!==this.state.phase+':'+this.state.round){this.plans.clear();this.drafts={};this.turnKey='';this.remember();}
   this.finish();if(this.state.phase!=='playing'){if(changed)this.emit();return;}
   const turn=this.state.players[this.state.turn],key=this.state.round+':'+this.state.turn;
   if(key!==this.turnKey){this.turnKey=key;this.turnSince=now;}
   const active=this.state.players.filter(p=>p.connected&&p.hearts>0&&(p.bot||this.watch&&p.id===this.myId));
   // The holder and one waiting bot think aloud; others stay quiet until their turn.
   const thinkers=[turn,...active.filter(p=>p.id!==turn.id).slice(this.state.turn%Math.max(1,active.length),this.state.turn%Math.max(1,active.length)+1)].filter((p,i,a)=>p&&(p.bot||this.watch&&p.id===this.myId)&&a.findIndex(x=>x?.id===p.id)===i);
   let sent=false;
   for(const p of thinkers){
    let plan=this.plans.get(p.id);if(!plan||this.state.used.includes(normalize(plan.answer)))plan=this.plan(p,now);
    const target=plan.miss?'not sure yet':plan.answer,progress=Math.min(1,(now-plan.at)/Math.max(1400,plan.readyAt-plan.at-600));let length=Math.floor(target.length*Math.max(0,progress)),text=target.slice(0,length);
    if(plan.typo&&progress>.35&&progress<.46)text=text.slice(0,-1)+'x';else if(plan.typo&&progress>=.46&&progress<.56)text=target.slice(0,Math.max(0,Math.floor(target.length*.35)-2));
    const old=this.drafts[p.id];this.drafts[p.id]={text,at:now,editedAt:old?.text===text?old.editedAt:now,round:this.state.round,game:this.state.matchId};
    if(p.id===turn.id&&!plan.miss&&now>=plan.readyAt&&now-this.turnSince>=1800){const result=answerParty(this.state,p.id,plan.answer,now);this.plans.delete(p.id);delete this.drafts[p.id];if(result.answer){sent=true;if(p.id===this.myId)this.lastAccepted=now+':'+this.state.revision;break;}}
   }
   this.onDrafts?.();if(changed||sent)this.emit();
  }finally{this.ticking=false;}
 }
 remember(){this.seen=[...new Set([...this.seen,...this.state.seenIds])];try{this.storage?.setItem('fc:bot-test-seen',JSON.stringify(this.seen));}catch{}}
 async close(){this.closed=true;clearInterval(this.timer);if(this.timers)document.removeEventListener('visibilitychange',this.onVisibility);this.drafts={};this.plans.clear();}
}
