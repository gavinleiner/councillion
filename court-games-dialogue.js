import {CLASH_BY_ID} from './court-games-data.js';
import {containsBlockedLanguage} from './moderation.js';
import {CLASH_TIMING} from './court-games-engine.js';

const values=o=>Object.values(o??{}),name=(s,id)=>s.players.find(p=>p.id===id)?.name??'Counsel';
export function answerTurn(s){
 if(s?.variant==='docket'){if(s.stage!=='docketAnswer'||!s.turn)return null;return {uid:s.turn,key:[s.matchId,s.round,s.stage,s.turn,s.stageAt].join(':'),since:s.turnOpenedAt??s.stageAt};}
 if(s?.variant!=='clash')return null;
 const uid=s.stage==='faceAnswer'?s.faceoffTurn:['control','steal'].includes(s.stage)?s.turn:null;
 if(!uid)return null;
 const duration=CLASH_TIMING[s.stage];
 return {uid,key:[s.matchId,s.round,s.stage,uid,s.deadline].join(':'),since:s.turnOpenedAt??s.deadline-duration};
}
export function safeDraft(text){text=String(text??'').slice(0,120);return containsBlockedLanguage(text)?'':text;}
// Never choose an arbitrary player's draft. The current actor, match, board and
// turn window must all agree. A disconnect or a submitted answer clears it.
export function visibleCourtDraft(s,drafts,now){
 const turn=answerTurn(s);if(!turn)return null;
 const p=s.players.find(p=>p.id===turn.uid),d=drafts?.[turn.uid];
 if(!p||p.spectator||p.connected===false||p.online===false||!d||d.game!==s.matchId||d.round!==s.round||d.editedAt<turn.since||d.editedAt>now+5000||now-d.editedAt>15000)return null;
 return {...turn,text:safeDraft(d.text),name:p.name};
}
// Fast Money drafts stay on private response paths, never the public typing
// channel. Only the active question is projected, and runner two is isolated.
export function fastLiveAnswer(s,secret,viewer,now){
 if(s.variant!=='clash'||s.stage!=='fast'||(s.fastPass===0&&viewer===s.fastPlayers[1]))return null;
 const d=secret.fastDraft?.[s.turn];if(!d||d.pass!==s.fastPass)return null;
 const cursor=d.cursor??0;
 return {uid:s.turn,matchId:s.matchId,round:s.round,pass:s.fastPass,cursor,deadline:s.deadline,text:safeDraft(values(d.values)[cursor]),at:now};
}
export function visibleFastDraft(s,d,viewer){
 if(!d||s.stage!=='fast'||(s.fastPass===0&&viewer===s.fastPlayers[1])||d.uid!==s.turn||d.matchId!==s.matchId||d.round!==s.round||d.pass!==s.fastPass||d.deadline!==s.deadline)return null;
 return {uid:d.uid,text:safeDraft(d.text),name:name(s,d.uid),key:[s.matchId,s.round,'fast',s.fastPass,d.cursor].join(':')};
}

export function hostCue(s,uid,now,liveAnswer,localCursor){
 if(s.variant!=='clash')return null;
 const key=part=>s.matchId+':'+part,stage=s.stage,who=id=>name(s,id);
 if(stage==='lobby')return {key:'lobby',text:'Take your bench. Ready when you are.',silent:true};
 if(stage==='intro')return {key:key('intro'),text:'All rise! Future Counsel is in session.'};
 if(['faceoff','faceAnswer'].includes(stage))return {key:key('question:'+s.round),text:s.board.prompt};
 if(stage==='survey')return {key:key('survey:'+s.stageAt),text:'Survey says…'};
 if(stage==='choice')return {key:key('choice:'+s.stageAt),text:who(s.choicePlayer)+', play the board or pass?'};
 if(stage==='control')return {key:key('turn:'+s.deadline),text:(s.event?.type==='strike'?'Strike '+s.strikes+'. ':s.lastAnswer?.at===s.event?.at?s.lastAnswer.text+'. ':'')+who(s.turn)+', your answer?'};
 if(stage==='steal')return {key:key('steal:'+s.stageAt),text:'Three strikes! '+who(s.turn)+', one answer to steal the bank.'};
 if(stage==='roundResult')return {key:key('round:'+s.round),text:s.event.text};
 if(stage==='fastIntro')return {key:key('fast-intro'),text:'Fast Money! Choose two counsel. Five questions. Two runs. Get to '+(s.fastTarget??200)+'.'};
 if(s.fastPass===0&&uid===s.fastPlayers?.[1]&&['fastReady','fastRead','fast','fastFirstReview'].includes(stage))return {key:key('isolated'),text:'You’re in the quiet bench. Your partner’s answers stay sealed.',silent:true};
 if(stage==='fastReady')return {key:key('ready:'+s.fastPass),text:who(s.turn)+', your run starts after the countdown. '+(s.fastPass===0?'Thirty seconds. Your clock starts after the first question.':s.fast.total+' banked. Thirty seconds. Give different answers.')};
 if(stage==='fastRead'||stage==='fast'){
  const cursor=stage==='fastRead'?0:localCursor??liveAnswer?.cursor??0;
  return {key:key('fast:'+s.fastPass+':'+cursor),text:CLASH_BY_ID.get(values(s.fastIds)[cursor])?.prompt??'Next question.'};
 }
 if(stage==='fastFirstReview'||stage==='fastReview'){
  const second=stage==='fastReview',rows=second?values(s.fast?.rows):values(liveAnswer?.rows),elapsed=now-s.stageAt;
  let total=second&&s.fastPass===1?rows.reduce((n,r)=>n+(values(r.answers)[0]?.points??0),0):0;
  for(let j=0;j<rows.length;j++){if(elapsed>=1500+j*1700)total+=second?(values(rows[j].answers)[s.fastPass===1?1:0]?.points??0):(rows[j].points??0);if(total>=(s.fastTarget??200))return {key:key('fast-win:'+s.stageAt),text:'Case closed! '+total+' points!'};}
  const i=Math.min(4,Math.floor((elapsed-1500)/1700));
  if(i>=0){const row=rows[i],a=second?values(row?.answers)[s.fastPass===1?1:0]:row;if(a)return {key:key(stage+':'+s.stageAt+':'+i),text:a.points+' points!'};}
  return {key:key(stage+':'+s.stageAt),text:'Let’s see what the survey said.'};
 }
 if(stage==='finish')return {key:key('finish'),text:s.fast?.success?'Case closed! You cleared Fast Money. Well played, counsel.':'Final verdict. '+(s.result?.text??'Well played, counsel.')};
 return null;
}

// Dynamic names/questions use the device's speech voice. No recorded identity,
// network request, microphone or external speech service is involved.
export class HostVoice{
 constructor(onSpeaking=()=>{},onStatus=()=>{}){this.onSpeaking=onSpeaking;this.onStatus=onStatus;this.enabled=true;this.unlocked=false;this.synth=globalThis.speechSynthesis;this.serial=0;this.visibility=()=>{if(document.hidden)this.stop();else if(this.enabled&&this.unlocked&&!this.paused&&this.latest)this.speak(this.latest);};document.addEventListener('visibilitychange',this.visibility);}
 unlock(){if(this.unlocked)return;this.unlocked=true;if(this.enabled&&this.latest&&!this.paused)this.speak(this.latest);}
 setEnabled(enabled){this.enabled=enabled;this.stop();if(enabled&&this.unlocked&&this.latest&&!this.paused)this.speak(this.latest);}
 setPaused(paused){this.paused=paused;if(paused){this.stop();}else if(this.enabled&&this.unlocked&&this.latest)this.speak(this.latest);}
 cue(cue){if(!cue||cue.key===this.latest?.key)return;this.latest=cue;if(this.enabled&&this.unlocked&&!this.paused)this.speak(cue);}
 speak(cue){
  this.stop();if(!this.synth||!globalThis.SpeechSynthesisUtterance||cue.silent||document.hidden)return;
  const token=this.serial,u=new SpeechSynthesisUtterance(cue.text),voices=this.synth.getVoices();
  u.voice=voices.find(v=>/^(Alex|Daniel|Google US English)$/.test(v.name))??voices.find(v=>/^en[-_]/i.test(v.lang))??null;u.lang='en-US';u.rate=1.1;u.pitch=1.08;u.volume=.8;
  u.onstart=()=>{if(token===this.serial){this.onSpeaking(true);this.onStatus('speaking');}};
  u.onend=()=>{if(token===this.serial){this.onSpeaking(false);this.onStatus('ready');}};
  u.onerror=e=>{if(token===this.serial){this.onSpeaking(false);this.onStatus(e.error==='not-allowed'?'blocked':'unavailable');}};
  this.utterance=u;this.synth.resume();this.synth.speak(u);
 }
 stop(){this.serial++;this.synth?.cancel();this.onSpeaking(false);}
 dispose(){this.stop();document.removeEventListener('visibilitychange',this.visibility);}
}
