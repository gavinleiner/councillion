// Original pixel art + lightweight scene direction. Cosmetic only: never changes
// turn order, guesses, clocks or score. Controls remain usable during every beat.
import {buddySprite} from './party-view.js';
import {counselNameplate} from './court-games-customization.js';
import {TypingBubble} from './party-typing.js';
import {answerTurn,visibleCourtDraft,visibleFastDraft,safeDraft,hostCue,HostVoice} from './court-games-dialogue.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function feudCameraShot(s,now=Date.now()){
 if(s.stage==='finish')return 'verdict';
 if(s.stage==='fastReview'||s.stage==='fastFirstReview')return 'fast-board';
 if(['fastReady','fastRead','fast'].includes(s.stage))return 'fast-runner';
 if(s.stage==='roundResult')return 'board';
 const phase=s.stage==='survey'?s.judgement?.from:s.stage;
 if(['faceoff','faceAnswer','choice'].includes(phase))return 'faceoff';
 if(phase==='steal')return 'steal'+s.stealTeam;
 if(phase==='control')return 'team'+s.controlTeam;
 return 'wide';
}
export class CourtCinema{
 constructor(root){this.root=root;this.arena=root.closest('.court-game');this.timers=new Set();this.layer=document.createElement('div');this.layer.className='cg-cinema-layer';this.layer.innerHTML='<div class="cg-puffer-host"><div class="cg-host-sprite" aria-hidden="true"></div><div class="cg-host-bubble" role="status" aria-live="polite"><span></span></div></div><aside class="cg-team-cut" aria-hidden="true"></aside><div class="cg-strike-splash" aria-hidden="true"></div><div class="cg-point-pop" aria-hidden="true"></div><div class="cg-victory-glints" aria-hidden="true">'+Array.from({length:18},(_,i)=>`<i style="--x:${6+i*89/18}%;--delay:${-i*.7}s;--duration:${5+i%5}s"></i>`).join('')+'</div>';root.append(this.layer);this.runner=document.createElement('div');this.runner.className='cg-fast-runner';root.append(this.runner);
  if(this.arena.dataset.game!=='clash')return;
  this.root.parentElement.querySelector('.cg-feud-architecture').innerHTML='<div class="cg-plate cg-plate-wide"></div><div class="cg-plate cg-plate-left"></div><div class="cg-plate cg-plate-right"></div>';
  this.draft=document.createElement('div');this.draft.className='cg-answer-bubble';this.draft.hidden=true;this.draft.innerHTML='<span></span><i aria-hidden="true"></i>';this.draft.setAttribute('aria-live','off');root.append(this.draft);this.typing=new TypingBubble(this.draft,()=>this.positionDraft());
  this.voiceButton=document.createElement('button');this.voiceButton.className='cg-voice-toggle';this.voiceButton.type='button';this.voiceButton.title='Puffer host voice';this.arena.querySelector('.cg-nav').append(this.voiceButton);
  this.voice=new HostVoice(speaking=>this.layer.querySelector('.cg-puffer-host').classList.toggle('is-speaking',speaking),status=>this.voiceButton.dataset.status=status);
  try{this.voice.enabled=localStorage.getItem('councillion.feudVoice')!=='off';}catch{}
  this.voiceLabel();this.voiceButton.onclick=()=>{this.voice.setEnabled(!this.voice.enabled);try{localStorage.setItem('councillion.feudVoice',this.voice.enabled?'on':'off');}catch{}this.voiceLabel();};
  this.unlock=()=>{if(!this.voice.unlocked)this.voice.unlock();};this.arena.addEventListener('pointerdown',this.unlock,{capture:true});this.arena.addEventListener('keydown',this.unlock,{capture:true});
  this.followDraft=()=>{if(this.disposed)return;if(!this.draft.hidden)this.positionDraft();this.draftFrame=requestAnimationFrame(this.followDraft);};this.draftFrame=requestAnimationFrame(this.followDraft);
 }
 voiceLabel(){this.voiceButton.textContent=this.voice.enabled?'VOICE ON':'VOICE OFF';this.voiceButton.setAttribute('aria-pressed',String(this.voice.enabled));}
 later(fn,ms){const timer=setTimeout(()=>{this.timers.delete(timer);fn();},ms);this.timers.add(timer);return timer;}
 celebrateFast(){const host=this.layer.querySelector('.cg-host-sprite');host.dataset.pose='cheer';this.layer.classList.add('is-fast-win');this.later(()=>{host.dataset.pose='idle';this.layer.classList.remove('is-fast-win');},5000);}
 frame(s,now=Date.now(),context={}){
  if(s.variant!=='clash')return;if(!this.preloaded){this.preloaded=true;for(const file of ['feud-court-ai-v1.webp','feud-bench-angle-ai-v1.webp','feud-counter-ai-v1.webp','host-talk-ai-v1.webp']){const img=new Image();img.src='assets/court-games/'+file;}}const shot=feudCameraShot(s,now);if(this.shot!==shot){this.shot=shot;this.arena.dataset.shot=shot;}
  const runner=s.players.find(p=>p.id===s.turn);if(shot==='fast-runner'&&runner&&this.runnerId!==runner.id){this.runnerId=runner.id;this.runner.innerHTML=buddySprite(runner.buddy)+counselNameplate(runner)+'<small>FAST MONEY · RUN '+(s.fastPass+1)+'</small>';}
  this.dialogue(s,now,context);
 }
 dialogue(s,now,{session={},fastRun}={}){
  if(!this.voice)return;
  let draft=visibleCourtDraft(s,session.drafts,now),turn=answerTurn(s);
  const input=this.arena.querySelector('#cg-answer');
  if(turn?.uid===session.uid&&input&&!session.pending)draft={...turn,text:safeDraft(input.value),name:s.players.find(p=>p.id===turn.uid)?.name??'Counsel'};
  if(s.stage==='fast'){
   draft=visibleFastDraft(s,session.response?.liveAnswer,session.uid);
   if(s.turn===session.uid&&fastRun&&!fastRun.finishing&&fastRun.waiting===undefined)draft={uid:s.turn,text:safeDraft(fastRun.input.value),name:runnerName(s),key:[s.matchId,s.round,'fast',s.fastPass,fastRun.cursor].join(':')};
  }
  this.currentDraft=draft;this.typing.update(draft?.text??'',draft?.key??'',draft?.name??'Counsel');
  const cue=hostCue(s,session.uid,now,s.stage==='fastFirstReview'?session.response?.fastAudience:session.response?.liveAnswer,fastRun?.cursor);
  if(cue&&cue.key!==this.cueKey){this.cueKey=cue.key;const bubble=this.layer.querySelector('.cg-host-bubble');bubble.querySelector('span').textContent=cue.text;bubble.hidden=!cue.text;this.voice.cue(cue);}
 }
 positionDraft(){
  const d=this.currentDraft;if(!d)return;
  let anchor,faceTeam;if(this.shot==='fast-runner')anchor=this.runner.querySelector('img,svg');
  else if(this.shot==='faceoff'){const p=this.root.querySelector('[data-player-id="'+CSS.escape(d.uid)+'"]');faceTeam=p?.closest('.bench-0')?0:1;anchor=this.root.querySelector('.faceoff-'+faceTeam+' img,.faceoff-'+faceTeam+' svg');}
  else anchor=this.root.querySelector('[data-player-id="'+CSS.escape(d.uid)+'"] .cg-avatar>img,[data-player-id="'+CSS.escape(d.uid)+'"] .cg-avatar>svg');
  if(!anchor)return;const a=anchor.getBoundingClientRect(),r=this.root.getBoundingClientRect(),b=this.draft.getBoundingClientRect(),scale=r.width/this.root.offsetWidth||1;
  const width=b.width/scale,height=b.height/scale,x=(a.left+a.width/2-r.left)/scale,y=(a.top-r.top)/scale;
  const face=faceTeam!==undefined&&this.root.offsetWidth>760,board=this.root.querySelector('.cg-board')?.getBoundingClientRect();
  const left=face?(faceTeam===0?(a.left-r.left)/scale-width-12:(a.right-r.left)/scale+12):x-width/2;
  const top=face?Math.max(y+a.height/scale*.3,(board.bottom-r.top)/scale+10):y-height-12;
  this.draft.style.left=Math.max(12,Math.min(this.root.offsetWidth-width-12,left))+'px';this.draft.style.top=Math.max(82,top)+'px';
 }
 update(s){
  const key=s.matchId+':'+s.event?.id;if(this.lastKey===key)return;this.lastKey=key;
  const fresh=s.lastAnswer&&this.lastAnswer!==s.matchId+':'+s.lastAnswer.id;if(fresh)this.lastAnswer=s.matchId+':'+s.lastAnswer.id;const event=fresh&&s.lastAnswer.points>0&&!['round-win','steal-win','finish'].includes(s.event?.type)?s.lastAnswer:s.event??{},type=event.type,team=event.team??s.players.find(p=>p.id===event.player)?.team??s.controlTeam;
  this.root.dataset.beat=type;const host=this.layer.querySelector('.cg-host-sprite');host.dataset.pose=['strike','steal'].includes(type)?'gavel':['answer','round-win','steal-win','jackpot','finish'].includes(type)?'cheer':'idle';
  this.later(()=>{host.dataset.pose='idle';if(this.root.dataset.beat===type)delete this.root.dataset.beat;},1500);
  if(s.strikes>(this.strikes??0)&&['faceAnswer','control','steal'].includes(s.stage)){
   const splash=this.layer.querySelector('.cg-strike-splash');splash.textContent='×'.repeat(s.strikes);splash.classList.remove('is-showing');void splash.offsetWidth;splash.classList.add('is-showing');
  }this.strikes=s.strikes??0;
  if(['answer','round-win','steal-win'].includes(type)){
   const points=this.layer.querySelector('.cg-point-pop');points.textContent='+'+(event.points??0);points.classList.remove('is-showing');void points.offsetWidth;points.classList.add('is-showing');
   if(Number.isInteger(team)){const bench=this.root.querySelector('.bench-'+team);bench?.classList.add('is-celebrating');this.later(()=>bench?.classList.remove('is-celebrating'),1700);}
  }
  if(['control','steal','steal-win','round-win'].includes(type)&&Number.isInteger(team))this.teamCut(s,team,type);
 }
 teamCut(s,team,type){
  const cut=this.layer.querySelector('.cg-team-cut'),crew=s.players.filter(p=>p.team===team&&!p.spectator);clearTimeout(this.cutTimer);
  cut.innerHTML='<div class="cg-cut-heading">'+(team===0?'PETITIONERS':'RESPONDENTS')+'<small>'+({control:'THE BOARD IS YOURS',steal:'ONE CHANCE TO STEAL','steal-win':'STOLE THE BANK','round-win':'ROUND WON'}[type])+'</small></div><div class="cg-cut-crew">'+crew.map((p,i)=>`<div class="cg-cut-player" style="--i:${i}">${buddySprite(p.buddy)}<strong>${esc(p.name)}</strong></div>`).join('')+'</div>';
  cut.classList.remove('is-showing');void cut.offsetWidth;cut.classList.add('is-showing');this.cutTimer=setTimeout(()=>cut.classList.remove('is-showing'),2400);
 }
 dispose(){this.disposed=true;for(const t of this.timers)clearTimeout(t);clearTimeout(this.cutTimer);cancelAnimationFrame(this.draftFrame);this.typing?.destroy();this.voice?.dispose();this.arena.removeEventListener('pointerdown',this.unlock,true);this.arena.removeEventListener('keydown',this.unlock,true);this.voiceButton?.remove();this.draft?.remove();this.layer.remove();this.runner.remove();delete this.arena.dataset.shot;}
}
const runnerName=s=>s.players.find(p=>p.id===s.turn)?.name??'Counsel';
