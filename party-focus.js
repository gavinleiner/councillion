// A visibility report belongs only to its author and current match. Keep the
// return timestamp so a sleeping host can still adjudicate the absence later.
export const TAB_GRACE_MS=1500;
export const FOCUS_BUILD='puffer-bailiff-v1';
export const focusEligible=(state,id)=>['playing','burst'].includes(state?.phase)&&!!state.matchId&&state.players.some(p=>p.id===id&&p.connected&&!p.spectator&&p.hearts>0);
export function absenceDue(state,id,report,now){
 if(!focusEligible(state,id)||report?.game!==state.matchId||!Number.isFinite(report.leftAt)||report.leftAt<(state.matchStartedAt??0)||report.leftAt>now)return false;
 const end=report.returnedAt||now;
 return Number.isFinite(end)&&end>=report.leftAt&&end<=now+5000&&end-report.leftAt>=TAB_GRACE_MS&&state.focusPenalties?.[id]!==report.leftAt;
}
export class PartyFocus{
 constructor({document=globalThis.document,eligible,report,clock=Date.now}){Object.assign(this,{document,eligible,report,clock,game:null,away:false,closed:false});this.change=()=>this.sync();document?.addEventListener('visibilitychange',this.change);}
 sync(){
  if(this.closed)return;
  const game=this.eligible();
  if(!game){this.game=null;this.away=false;return;}
  if(this.game!==game){this.game=game;this.away=false;}
  const hidden=this.document?.visibilityState==='hidden';
  if(hidden===this.away)return;
  this.away=hidden;if(hidden)this.leftAt=this.clock();this.report({game,hidden,leftAt:this.leftAt});
 }
 destroy(){this.closed=true;this.document?.removeEventListener('visibilitychange',this.change);}
}
