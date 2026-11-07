import {OATH_QUESTIONS,OATH_BY_ID} from './oath-data.js';
import {validateChat} from './moderation.js';
import {shuffle} from './question-selection.js';

export const OATH_TIMING={intro:6000,read:3000,write:35000,shuffle:1800,vote:20000,reveal:2400,truth:4500,standings:6500};
export const oathKey=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\b(a|an|the)\b/g,' ').replace(/\s+/g,' ').trim();
// Only recognize a typo of an already-entered truth; never suggest the answer.
// Short guesses need an exact alias, except a simple adjacent transposition.
function singleTypo(a,b){
 if(Math.abs(a.length-b.length)>1)return false;
 if(a.length===b.length){const diff=[...a].flatMap((ch,i)=>ch===b[i]?[]:[i]);if(diff.length===2&&diff[1]===diff[0]+1&&a[diff[0]]===b[diff[1]]&&a[diff[1]]===b[diff[0]])return Math.min(a.length,b.length)>=4;return Math.min(a.length,b.length)>=6&&diff.length===1;}
 if(Math.max(a.length,b.length)<6||Math.min(a.length,b.length)<5)return false;const [short,long]=a.length<b.length?[a,b]:[b,a];let i=0,j=0,skips=0;while(j<long.length){if(short[i]===long[j]){i++;j++;}else{j++;if(++skips>1)return false;}}return true;
}
export function isOathTruth(q,text){const key=oathKey(text),answers=[q.answer,...(q.aliases??[])].map(oathKey);if(answers.includes(key))return true;if(q.decoys.some(d=>oathKey(d)===key))return false;return answers.some(a=>singleTypo(key,a));}
const participants=s=>s.players.filter(p=>!p.spectator);
const present=s=>participants(s).filter(p=>p.connected!==false&&p.online!==false);
const stage=(s,name,now,ms)=>{s.stage=name;s.stageAt=now;s.deadline=ms?now+ms:0;s.phase=name==='finish'?'ended':name==='lobby'?'lobby':['oath-reveal','oath-standings'].includes(name)?'burst':'playing';s.revision++;};
const event=(s,type,text,now,extra={})=>{s.notice=text;s.event={id:++s.eventSerial,type,text,at:now,...extra};s.revision++;};
const fact=s=>OATH_BY_ID.get(s.case?.id);
export function oathDeck(rng=Math.random){
 const groups=new Map();for(const q of shuffle(OATH_QUESTIONS,rng)){if(!groups.has(q.category))groups.set(q.category,[]);groups.get(q.category).push(q.id);}
 const categories=shuffle([...groups.keys()],rng),deck=[];while([...groups.values()].some(a=>a.length))for(const c of categories){const id=groups.get(c).pop();if(id)deck.push(id);}return deck;
}
export function startOath(s,secret,now=Date.now(),rng=Math.random){
 const rows=s.players.filter(p=>p.connected!==false&&p.online!==false&&!p.spectator);if(rows.length<2||rows.length>6)throw Error('Under Oath needs two to six players.');if(rows.some(p=>!p.ready))throw Error('Wait for everyone to ready up.');
 s.matchId=crypto.randomUUID();s.players=s.players.map(p=>({...p,score:0,spectator:!rows.some(r=>r.id===p.id)}));s.round=0;s.history=[];s.locked={};s.voted={};s.choices=[];s.revealed=[];s.settings.rounds=6;delete s.result;delete s.roundResult;delete s.case;
 secret.oath={deck:oathDeck(rng),submissions:{},votes:{},options:[],knowers:{}};stage(s,'oath-intro',now,OATH_TIMING.intro);event(s,'oath-intro','Write a lie. Vote for the truth. Fool the court.',now);return true;
}
function nextRound(s,secret,now){
 const ref=secret.oath,q=OATH_BY_ID.get(ref.deck[s.round]);if(!q)return finishOath(s,now);
 s.focusOpenedAt=now;s.round++;s.case={id:q.id,prompt:q.prompt,hint:q.hint,category:q.category};s.locked={};s.voted={};s.choices=[];s.revealed=[];s.advanceReady={};delete s.roundResult;delete s.reveal;delete s.evidence;
 ref.submissions={};ref.votes={};ref.knowers={};ref.forfeits={};ref.options=[];ref.revealIndex=0;ref.verdict=[];ref.scored=false;stage(s,'oath-read',now,OATH_TIMING.read);event(s,'oath-case','Case '+s.round+'. Read the evidence.',now);
}
function buildOptions(s,secret,now,rng){
 const ref=secret.oath,q=fact(s),options=[{text:q.answer,kind:'truth',authors:[]}];
 for(const [uid,row]of Object.entries(ref.submissions)){if(row.knows)continue;const key=oathKey(row.text),same=options.find(o=>oathKey(o.text)===key);if(same)same.authors.push(uid);else options.push({text:row.text,kind:'bluff',authors:[uid]});}
 for(const text of shuffle(q.decoys,rng)){if(options.length>=4)break;if(!options.some(o=>oathKey(o.text)===oathKey(text)))options.push({text,kind:'decoy',authors:[]});}
 ref.options=shuffle(options,rng).map(o=>({...o,text:o.text.replace(/^[a-z]/,c=>c.toUpperCase()).replace(/[.!?]+$/,''),id:crypto.randomUUID()}));stage(s,'oath-shuffle',now,OATH_TIMING.shuffle);event(s,'oath-shuffle','The testimony is sealed. The clerk is mixing the statements.',now);
}
function openVotes(s,secret,now){for(const id of Object.keys(secret.oath.knowers))s.voted[id]=true;s.choices=secret.oath.options.map(({id,text})=>({id,text}));stage(s,'oath-vote',now,OATH_TIMING.vote);event(s,'oath-vote','One statement is true. Choose carefully.',now);}
function reveal(s,secret,now,rng){
 const ref=secret.oath;ref.verdict=[...shuffle(ref.options.filter(o=>o.kind!=='truth'),rng),...ref.options.filter(o=>o.kind==='truth')].map(o=>({...o,voters:Object.entries(ref.votes).filter(([,v])=>v===o.id).map(([id])=>id)}));ref.revealIndex=0;s.revealed=[];stage(s,'oath-reveal',now,600);event(s,'oath-unseal','Witnesses, stand by your testimony.',now);
}
function revealNext(s,secret,now){
 const ref=secret.oath,row=ref.verdict[ref.revealIndex++];if(!row){scoreRound(s,secret,now);return;}
 s.revealed.push({...row});const truth=row.kind==='truth';s.reveal={id:row.id,kind:row.kind};s.deadline=now+(truth?OATH_TIMING.truth:OATH_TIMING.reveal);s.stageAt=now;
 if(truth){const q=fact(s);s.evidence={answer:q.answer,explanation:q.explanation,source:q.source,sourceTitle:q.sourceTitle};}
 event(s,truth?'oath-truth':row.kind==='bluff'?'oath-perjury':'oath-decoy',truth?'THE TRUTH':row.kind==='bluff'?'PERJURY':'COURT DECOY',now,{choice:row.id,authors:row.authors,voters:row.voters});
}
function scoreRound(s,secret,now){
 const ref=secret.oath;if(ref.scored)return;ref.scored=true;const multiplier=s.round===s.settings.rounds?2:1,truth=ref.options.find(o=>o.kind==='truth'),gains=Object.fromEntries(participants(s).map(p=>[p.id,0])),fooled=Object.fromEntries(participants(s).map(p=>[p.id,0]));
 for(const p of participants(s))if(ref.knowers[p.id]||ref.votes[p.id]===truth.id)gains[p.id]+=1000*multiplier;
 for(const o of ref.options.filter(o=>o.kind==='bluff')){const voters=Object.entries(ref.votes).filter(([,v])=>v===o.id).length;for(const id of o.authors){gains[id]=(gains[id]??0)+500*voters*multiplier;fooled[id]=voters;}}
 for(const id of Object.keys(ref.forfeits??{}))gains[id]=0;
 const rows=participants(s).map(p=>({id:p.id,before:p.score,gain:gains[p.id],score:p.score+gains[p.id],fooled:fooled[p.id],correct:!!ref.knowers[p.id]||ref.votes[p.id]===truth.id}));for(const p of s.players)p.score+=gains[p.id]??0;rows.sort((a,b)=>b.score-a.score);
 s.roundResult={rows,multiplier};s.history.push({round:s.round,id:s.case.id,rows});s.advanceReady={};stage(s,'oath-standings',now,OATH_TIMING.standings);event(s,'oath-scores','The court has spoken. Here is the damage.',now);
}
function finishOath(s,now){const rows=participants(s).map(p=>({id:p.id,score:p.score})).sort((a,b)=>b.score-a.score),max=rows[0]?.score??0;s.result={scores:rows,winners:rows.filter(r=>r.score===max).map(r=>r.id)};s.endedAt=now;stage(s,'finish',now,0);event(s,'oath-finish','Court adjourned. The final verdict is in.',now);return true;}
export function oathReceipt(s,secret,uid){
 const ref=secret.oath;if(!ref||!s.matchId)return null;return {matchId:s.matchId,round:s.round,text:ref.submissions[uid]?.text??'',knows:!!ref.knowers[uid],forfeited:!!ref.forfeits?.[uid],selection:ref.votes[uid]??'',ownChoices:ref.options.filter(o=>o.authors.includes(uid)).map(o=>o.id)};
}
export function sentenceOathTabSwitch(s,secret,uid){
 const ref=secret.oath;ref.forfeits??={};ref.forfeits[uid]=true;delete ref.votes[uid];delete ref.knowers[uid];s.locked[uid]=true;s.voted[uid]=true;
 if(s.stage==='oath-write')delete ref.submissions[uid];
 return 'CASE FORFEITED · 0 POINTS';
}
export function actOath(s,secret,uid,action,payload={},now=Date.now()){
 const p=present(s).find(p=>p.id===uid);if(!p)throw Error('Only active witnesses can act.');if(payload.matchId!==s.matchId||payload.round!==s.round||payload.stageAt!==s.stageAt)throw Error('That belongs to an earlier phase.');if(s.deadline&&now>=s.deadline)throw Error('That timer has ended.');const ref=secret.oath;
 if(action==='oath-bluff'){
  if(s.stage!=='oath-write')throw Error('Wait for testimony to open.');if(s.locked[uid])throw Error('Your testimony is already sealed.');
  const raw=String(payload.text??'').replace(/[\u0000-\u001f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'').replace(/\s+/g,' ').trim();if(raw.length<1||raw.length>48||!/[a-z0-9]/i.test(raw))throw Error('Write a short answer, up to 48 characters.');const text=validateChat(raw),q=fact(s),knows=isOathTruth(q,text);
  ref.submissions[uid]={text,knows};if(knows)ref.knowers[uid]=true;s.locked[uid]=true;s.revision++;event(s,'oath-sealed',p.name+' sealed testimony.',now,{player:uid});return {accepted:true,knows};
 }
 if(action==='oath-vote'){
  if(s.stage!=='oath-vote')throw Error('Voting has not opened.');if(s.voted[uid]||ref.knowers[uid])throw Error('Your verdict is already sealed.');const choice=ref.options.find(o=>o.id===payload.choice);if(!choice)throw Error('Choose a statement from this case.');if(choice.authors.includes(uid))throw Error('You cannot vote for your own lie.');ref.votes[uid]=choice.id;s.voted[uid]=true;s.revision++;return {accepted:true};
 }
 if(action==='oath-next'){
  if(s.stage!=='oath-standings'||now-s.stageAt<3000)throw Error('Let the verdict settle first.');s.advanceReady[uid]=true;s.revision++;return {accepted:true};
 }
 throw Error('That action is not available.');
}
export function tickOath(s,secret,now=Date.now(),rng=Math.random){
 if(['lobby','finish'].includes(s.stage))return false;const ref=secret.oath;if(!ref)throw Error('The referee record is unavailable.');const active=present(s);
 if(s.stage==='oath-write'&&now-s.stageAt>=3000&&active.length&&active.every(p=>s.locked[p.id])){buildOptions(s,secret,now,rng);return true;}
 if(s.stage==='oath-vote'&&now-s.stageAt>=2500&&active.length&&active.every(p=>s.voted[p.id]||ref.knowers[p.id])){reveal(s,secret,now,rng);return true;}
 if(s.stage==='oath-standings'&&now-s.stageAt>=3000&&active.length&&active.every(p=>s.advanceReady[p.id])){s.round>=s.settings.rounds?finishOath(s,now):nextRound(s,secret,now);return true;}
 if(!s.deadline||now<s.deadline)return false;
 if(s.stage==='oath-intro'){nextRound(s,secret,now);return true;}
 if(s.stage==='oath-read'){stage(s,'oath-write',now,OATH_TIMING.write);event(s,'oath-write','Make your lie believable. Short answers work best.',now);return true;}
 if(s.stage==='oath-write'){buildOptions(s,secret,now,rng);return true;}
 if(s.stage==='oath-shuffle'){openVotes(s,secret,now);return true;}
 if(s.stage==='oath-vote'){reveal(s,secret,now,rng);return true;}
 if(s.stage==='oath-reveal'){revealNext(s,secret,now);return true;}
 if(s.stage==='oath-standings'){s.round>=s.settings.rounds?finishOath(s,now):nextRound(s,secret,now);return true;}
 return false;
}
