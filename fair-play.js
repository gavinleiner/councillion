import {PartyFocus,TAB_GRACE_MS} from './party-focus.js';
export {TAB_GRACE_MS};
// Derived exclusively from the signed Google token in account-identity.js.
export const focusExempt=identity=>identity?.tabExempt===true&&identity.expires>Date.now()/1000;
export function courtFocusKey(s){
 if(!s?.matchId)return null;
 const id=s.variant==='bench'?s.question?.id:s.variant==='testimony'?'page-'+s.stageAt:s.variant==='clash'?(s.stage.startsWith('fast')?'fast-'+s.fastPass:s.board?.id):s.variant==='figure'?s.question?.id:s.variant==='docket'?s.clue?.id:s.case?.id;
 return id?[s.matchId,s.variant,s.round,id].join(':'):null;
}
export function courtFocusEligible(s,id){
 const p=s?.players?.find(p=>p.id===id);if(!p||p.spectator||p.connected===false||!courtFocusKey(s))return false;
 if(s.variant==='bench')return s.stage==='bench-question'&&!s.locked?.[id];
 if(s.variant==='testimony')return s.stage==='bt-live'?(s.artist===id?!s.locked?.[id]:!s.guessed?.[id]):s.stage==='bt-vote'?!s.voted?.[id]&&s.artist!==id:['bt-prompt','bt-draw','bt-caption'].includes(s.stage)&&!s.locked?.[id]&&(s.settings.style!=='caption'||s.stage!=='bt-caption'||s.artist!==id);
 if(s.variant==='figure')return s.stage==='estimate'&&!s.locked?.[id];
 if(s.variant==='oath')return s.stage==='oath-guess'?s.turn===id&&!s.guessSealed:s.stage==='oath-write'?s.turn===id&&!s.locked?.[id]:s.stage==='oath-vote'&&!s.voted?.[id];
 if(s.variant==='docket'){
  if(['docketFinalRead','docketFinalAnswer'].includes(s.stage))return s.eligible?.includes(id)&&!s.locked?.[id];
  if(!['docketRead','docketBuzz','docketAnswer','docketRebound'].includes(s.stage))return false;
  if(s.clue?.double)return s.turn===id;
  return s.stage==='docketAnswer'&&s.turn===id||!s.attempts?.[id];
 }
 return s.variant==='clash'&&(s.stage==='fast'||s.stage==='fastRead'?s.turn===id:['faceoff','faceAnswer','choice','control','steal','survey','answerResult'].includes(s.stage));
}
export function courtAbsenceDue(s,id,r,now,exemptions={}){
 if(exemptions[id]===true||!courtFocusEligible(s,id)||r?.game!==s.matchId||r.question!==courtFocusKey(s)||!Number.isFinite(r.leftAt)||r.leftAt<(s.focusOpenedAt??s.stageAt??0)||r.leftAt>now)return false;
 const end=r.hidden?now:r.returnedAt;
 return Number.isFinite(end)&&end<=now+5000&&end-r.leftAt>=TAB_GRACE_MS&&s.tabPenalties?.[id]!==r.question+':'+r.leftAt;
}
// Solo/owner previews use the same real visibility events and grace period.
// Recheck on return so timer suspension cannot silently cancel a long absence.
export class LocalFocus{
 constructor({eligible,exempt=()=>false,penalize,clock=Date.now,document=globalThis.document}){
  Object.assign(this,{eligible,exempt,penalize,clock,document,away:null,closed:false});
  this.tracker=new PartyFocus({document,clock,eligible:()=>this.exempt()?null:this.eligible(),report:r=>this.receive(r)});
 }
 receive(r){
  if(r.hidden){clearTimeout(this.timer);this.away={...r,done:false};this.timer=setTimeout(()=>this.check(),TAB_GRACE_MS+10);}
  else{this.check();clearTimeout(this.timer);this.away=null;}
 }
 check(){const r=this.away;if(this.closed||!r||r.done||this.exempt()||this.eligible()!==r.game)return;if(this.clock()-r.leftAt>=TAB_GRACE_MS){r.done=true;this.penalize(r.game,r.leftAt);}}
 sync(){this.tracker.sync();if(!this.eligible()||this.exempt()){clearTimeout(this.timer);this.away=null;}else this.check();}
 destroy(){this.closed=true;clearTimeout(this.timer);this.tracker.destroy();}
}
