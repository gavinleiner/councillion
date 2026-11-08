import {LocalFocus,focusExempt,courtFocusEligible,courtFocusKey} from './fair-play.js';
import {enforceCourtFocus} from './court-focus.js';
import {canPreviewOath} from './game-availability.js';
import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame} from './court-games-engine.js';
import {OATH_BY_ID} from './oath-data.js';
import {oathBotClue,oathBotVote,oathBotGuess} from './oath-bots.js';
import {oathReceipt} from './oath-engine.js';

// A real signed-token database read gates the preview. Editable client profile
// fields, names, URL flags and local storage cannot grant this server permission.
export async function authorizeOathPreview({identity,authorize,getCloud}){
 const auth=await authorize(),verified=auth.identity??identity();
 if(!canPreviewOath(verified))throw Error('This private preview is owner-only.');
 const c=await(getCloud?.()??import('./cloud.bundle.js?v=20261106-final-saves-v28'));
 await c.get(c.ref(c.db,'ownerPreviews/oath'));
 return verified;
}

// Local practice with five clearly labelled bots; never writes a public room,
// career stats, ranks, profiles or a leaderboard result.
export class OathPreviewSession{
 constructor({identity,verified,name='Counsel',buddy='krill',onState,onError=()=>{},clock=()=>Date.now()}){
  Object.assign(this,{identity,onState,onError,clock,googleId:verified.id,uid:'owner-preview',host:true,preview:true,code:'OWNER PREVIEW',connected:true,pending:false,closed:false,secret:{},phaseKey:'',phaseAt:clock()});
  if(!canPreviewOath(verified))throw Error('This private preview is owner-only.');
  this.state=createCourtGame('oath',[{id:this.uid,name,buddy,ready:true,online:true,connected:true},...['Nori Bot','Sage Bot','Pearl Bot','Mako Bot','Reef Bot'].map((name,i)=>({id:'preview-bot-'+i,name,buddy:['squid','schooler','angler','evil','krill'][i],ready:true,online:true,connected:true}))]);
  this.focus=new LocalFocus({eligible:()=>!this.closed&&courtFocusEligible(this.state,this.uid)?courtFocusKey(this.state):null,exempt:()=>focusExempt(this.identity()),clock:()=>this.now(),penalize:(question,leftAt)=>{enforceCourtFocus(this.state,this.secret,{[this.uid]:{game:this.state.matchId,question,leftAt,hidden:false,returnedAt:this.now()}},this.now());this.render();}});this.timer=setInterval(()=>this.tick(),200);
 }
 now(){return this.clock();}
 render(){if(this.closed)return;this.focus.sync();this.response={oath:oathReceipt(this.state,this.secret,this.uid)};this.onState(this.state,this);}
 async ready(){return;}
 send(uid,action,p={}){const s=this.state;return actCourtGame(s,this.secret,uid,action,{matchId:s.matchId,round:s.round,stageAt:s.stageAt,...p},this.now());}
 setOathDraft(text){clearTimeout(this.draftTimer);const context={matchId:this.state.matchId,round:this.state.round,stageAt:this.state.stageAt};this.draftTimer=setTimeout(()=>this.request('oath-draft',{text,...context}).catch(e=>this.onError(e.message)),180);}
 async request(action,p={}){
  if(['oath-bluff','oath-guess'].includes(action))clearTimeout(this.draftTimer);
  if(this.closed||!canPreviewOath(this.identity()))throw Error('Sign in with your authorized Google account to continue the preview.');
  if(action==='start'||action==='rematch'){if(!['lobby','finish'].includes(this.state.stage))return;startCourtGame(this.state,this.now(),Math.random,this.secret);}
  else this.send(this.uid,action,p);
  this.render();
 }
 tick(){
  if(this.closed)return;
  if(!canPreviewOath(this.identity())){this.close();this.onError('Your preview sign-in expired. Sign in again to continue.');return;}
  const s=this.state,key=[s.matchId,s.round,s.stage,s.stageAt].join(':');if(key!==this.phaseKey){this.phaseKey=key;this.phaseAt=this.now();}
  const elapsed=this.now()-this.phaseAt,ref=this.secret.oath,q=OATH_BY_ID.get(ref?.caseId);let changed=false;
  try{
   if(s.stage==='oath-write')for(const [i,p]of s.players.slice(1).entries())if(s.turn===p.id&&!s.locked[p.id]&&elapsed>3000+i%3*350){this.send(p.id,'oath-bluff',{text:oathBotClue(q,p.id===ref.impostor,i,s.round,s.clueLap)});changed=true;}
   if(s.stage==='oath-vote')for(const [i,p]of s.players.slice(1).entries())if(elapsed>5500+i*650){if(s.extendVotes?.[this.uid]&&!s.extendVotes?.[p.id]){this.send(p.id,'oath-more',{want:true});changed=true;}else if(!s.voted[p.id]&&!s.extendVotes?.[p.id]){this.send(p.id,'oath-vote',{choice:oathBotVote(s,ref,p.id,i)});changed=true;}}
   if(s.stage==='oath-guess'&&s.turn!==this.uid&&!s.guessSealed&&elapsed>4000){this.send(s.turn,'oath-guess',{text:oathBotGuess(q,s.players.findIndex(p=>p.id===s.turn),s.round)});changed=true;}
   if(tickCourtGame(s,this.secret,this.now()))changed=true;
   if(changed)this.render();
  }catch(e){this.onError(e.message);}
 }
 async close(){this.focus.destroy();this.closed=true;this.connected=false;clearInterval(this.timer);clearTimeout(this.draftTimer);}
}
