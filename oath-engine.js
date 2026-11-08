import {OATH_QUESTIONS,OATH_BY_ID} from './oath-data.js';
import {validateChat} from './moderation.js';
import {shuffle} from './question-selection.js';

export const OATH_TIMING={intro:7000,read:5000,write:22000,shuffle:900,share:2800,vote:25000,accuse:3200,guess:18000,reveal:6500,standings:6500};
export const oathKey=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\b(a|an|the)\b/g,' ').replace(/\s+/g,' ').trim();
function singleTypo(a,b){
 if(Math.abs(a.length-b.length)>1)return false;
 if(a.length===b.length){const diff=[...a].flatMap((ch,i)=>ch===b[i]?[]:[i]);if(diff.length===2&&diff[1]===diff[0]+1&&a[diff[0]]===b[diff[1]]&&a[diff[1]]===b[diff[0]])return Math.min(a.length,b.length)>=4;return Math.min(a.length,b.length)>=6&&diff.length===1;}
 if(Math.max(a.length,b.length)<6||Math.min(a.length,b.length)<5)return false;const [short,long]=a.length<b.length?[a,b]:[b,a];let i=0,j=0,skips=0;while(j<long.length){if(short[i]===long[j]){i++;j++;}else{j++;if(++skips>1)return false;}}return true;
}
export function isOathTruth(q,text){const key=oathKey(text),answers=[q.answer,...(q.aliases??[])].map(oathKey);if(answers.includes(key))return true;if((q.decoys??[]).some(d=>oathKey(d)===key))return false;return answers.some(a=>singleTypo(key,a));}
export function normalizeOathReferee(ref){if(!ref)return ref;for(const key of ['roleCounts','submissions','drafts','votes','forfeits'])ref[key]??={};for(const key of ['deck','order'])ref[key]=Object.values(ref[key]??[]);return ref;}
const participants=s=>s.players.filter(p=>!p.spectator);
const present=s=>participants(s).filter(p=>p.connected!==false&&p.online!==false);
const stage=(s,name,now,ms)=>{s.stage=name;s.stageAt=now;s.deadline=ms?now+ms:0;s.phase=name==='finish'?'ended':name==='lobby'?'lobby':['oath-share','oath-accuse','oath-reveal','oath-standings'].includes(name)?'burst':'playing';s.revision++;};
const event=(s,type,text,now,extra={})=>{s.notice=text;s.event={id:++s.eventSerial,type,text,at:now,...extra};s.revision++;};
const fact=secret=>OATH_BY_ID.get(secret.oath?.caseId);
export function oathDeck(rng=Math.random){
 const groups=new Map();for(const q of shuffle(OATH_QUESTIONS,rng)){if(!groups.has(q.category))groups.set(q.category,[]);groups.get(q.category).push(q.id);}
 const categories=shuffle([...groups.keys()],rng),deck=[];while([...groups.values()].some(a=>a.length))for(const c of categories){const id=groups.get(c).pop();if(id)deck.push(id);}return deck;
}
export function startOath(s,secret,now=Date.now(),rng=Math.random){
 const rows=present(s);if(rows.length<3||rows.length>6)throw Error('Under Oath needs three to six witnesses.');if(rows.some(p=>!p.ready))throw Error('Wait for everyone to ready up.');
 s.matchId=crypto.randomUUID();s.players=s.players.map(p=>({...p,score:0,spectator:!rows.some(r=>r.id===p.id)}));s.round=0;s.history=[];s.locked={};s.voted={};s.choices=[];s.testimonies=[];s.settings.rounds=6;
 for(const key of ['result','roundResult','case','reveal','evidence','verdict','turn','guessSealed'])delete s[key];
 secret.oath={deck:oathDeck(rng),roleCounts:{},submissions:{},drafts:{},votes:{},forfeits:{}};stage(s,'oath-intro',now,OATH_TIMING.intro);event(s,'oath-intro','One secret impostor. Everyone else knows the word.',now);return true;
}
function nextRound(s,secret,now,rng){
 const ref=normalizeOathReferee(secret.oath),q=OATH_BY_ID.get(ref.deck[s.round]);if(!q)return finishOath(s,now);
 const rows=present(s).length?present(s):participants(s),least=Math.min(...rows.map(p=>ref.roleCounts[p.id]??0));ref.impostor=shuffle(rows.filter(p=>(ref.roleCounts[p.id]??0)===least),rng)[0].id;ref.roleCounts[ref.impostor]=(ref.roleCounts[ref.impostor]??0)+1;ref.caseId=q.id;
 s.focusOpenedAt=now;s.round++;s.case={id:crypto.randomUUID(),category:q.category,prompt:'Give one clue. Find the witness who is bluffing.'};s.locked={};s.voted={};s.choices=[];s.testimonies=[];s.advanceReady={};
 for(const key of ['roundResult','reveal','evidence','verdict','turn','guessSealed'])delete s[key];
 const seats=participants(s).map(p=>p.id),first=Math.floor(rng()*seats.length);ref.order=[...seats.slice(first),...seats.slice(0,first)];s.clueOrder=[...ref.order];s.turn=ref.order[0];Object.assign(ref,{submissions:{},drafts:{},votes:{},forfeits:{},shareIndex:0,caught:false,guess:'',guessed:false,scored:false});stage(s,'oath-read',now,OATH_TIMING.read);event(s,'oath-case','Check your private brief. Keep it to yourself.',now);
}
function clean(value){return String(value??'').replace(/[\u0000-\u001f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'').replace(/\s+/g,' ').trim();}
function sealClue(s,secret,uid,value){
 const text=clean(value);if(!text||text.length>48||!/[a-z0-9]/i.test(text))throw Error('Write a clue, up to 48 characters.');
 validateChat(text);if(uid!==secret.oath.impostor&&[fact(secret).answer,...fact(secret).aliases].some(a=>oathKey(text)===oathKey(a)))throw Error('Give a clue without naming the secret word.');
 secret.oath.submissions[uid]={text};s.locked[uid]=true;return {accepted:true};
}
function prepareShare(s,secret,now){
 const ref=normalizeOathReferee(secret.oath),id=s.turn;if(!s.locked[id]&&!ref.forfeits[id]&&ref.drafts[id]){try{sealClue(s,secret,id,ref.drafts[id]);}catch{}}
 delete ref.drafts[id];s.locked[id]=true;stage(s,'oath-shuffle',now,OATH_TIMING.shuffle);event(s,'oath-shuffle','Clue sealed. Filing it for the court.',now,{player:id});
}
function shareCurrent(s,secret,now){const ref=secret.oath,id=s.turn;s.testimonies.push({id,text:ref.submissions[id]?.text??'No clue submitted',missing:!ref.submissions[id]});stage(s,'oath-share',now,OATH_TIMING.share);event(s,'oath-testimony',s.players.find(p=>p.id===id)?.name+' takes the stand.',now,{player:id});}
function nextClue(s,secret,now){
 const ref=secret.oath;ref.shareIndex++;if(ref.shareIndex>=ref.order.length){s.choices=participants(s).map(p=>({id:p.id,text:p.name}));delete s.turn;stage(s,'oath-vote',now,OATH_TIMING.vote);event(s,'oath-vote','Talk it out. Secretly vote for the impostor.',now);return;}
 s.turn=ref.order[ref.shareIndex];s.focusOpenedAt=now;stage(s,'oath-write',now,OATH_TIMING.write);event(s,'oath-write',s.players.find(p=>p.id===s.turn)?.name+', your clue.',now);
}
function accuse(s,secret,now){
 const counts=Object.fromEntries(participants(s).map(p=>[p.id,0]));for(const id of Object.values(secret.oath.votes))if(Object.hasOwn(counts,id))counts[id]++;
 const top=Math.max(...Object.values(counts)),tied=Object.keys(counts).filter(id=>counts[id]===top),accused=top>0&&tied.length===1?tied[0]:'';
 s.verdict={counts,accused,tied:accused?[]:tied};secret.oath.caught=accused===secret.oath.impostor;stage(s,'oath-accuse',now,OATH_TIMING.accuse);event(s,'oath-ballots','The votes are in. Unsealing the accusation.',now);
}
function revealCase(s,secret,now){
 const ref=secret.oath,q=fact(secret);s.reveal={impostor:ref.impostor,word:q.answer,caught:ref.caught,guess:ref.guess,guessed:ref.guessed};stage(s,'oath-reveal',now,OATH_TIMING.reveal);event(s,ref.caught?'oath-exposed':'oath-escaped',ref.caught?ref.guessed?'The impostor recovered the word.':'The court found its impostor.':'The impostor slipped through.',now,{player:ref.impostor});
}
function scoreRound(s,secret,now){
 const ref=secret.oath;if(ref.scored)return;ref.scored=true;const multiplier=s.round===6?2:1;
 const rows=participants(s).map(p=>{const impostor=p.id===ref.impostor,correct=!impostor&&ref.votes[p.id]===ref.impostor,base=impostor?(ref.caught?(ref.guessed?1500:0):2000):(correct?1000:0),gain=ref.forfeits[p.id]?0:base*multiplier;return {id:p.id,before:p.score,gain,score:p.score+gain,impostor,correct,escaped:impostor&&!ref.caught,guessed:impostor&&ref.guessed};});
 for(const p of s.players)p.score=rows.find(r=>r.id===p.id)?.score??p.score;rows.sort((a,b)=>b.score-a.score);s.roundResult={rows,multiplier};s.history.push({round:s.round,id:ref.caseId,word:fact(secret).answer,impostor:ref.impostor,rows});stage(s,'oath-standings',now,OATH_TIMING.standings);event(s,'oath-scores','Good clues. Better instincts. Here is the record.',now);
}
function finishOath(s,now){const rows=participants(s).map(p=>({id:p.id,score:p.score})).sort((a,b)=>b.score-a.score),max=rows[0]?.score??0;s.result={scores:rows,winners:rows.filter(r=>r.score===max).map(r=>r.id)};s.endedAt=now;stage(s,'finish',now,0);event(s,'oath-finish','Court adjourned. The final verdict is in.',now);return true;}
export function oathReceipt(s,secret,uid){
 const ref=normalizeOathReferee(secret.oath),q=fact(secret);if(!ref||!s.matchId||!q||!participants(s).some(p=>p.id===uid))return null;const impostor=uid===ref.impostor;
 return {matchId:s.matchId,round:s.round,role:impostor?'impostor':'witness',word:impostor?'':q.answer,hint:impostor?q.hint:'Give a clue that fits, without saying the word.',text:ref.submissions[uid]?.text??'',draft:ref.drafts?.[uid]??'',selection:ref.votes[uid]??'',forfeited:!!ref.forfeits[uid]};
}
export function sentenceOathTabSwitch(s,secret,uid){
 const ref=normalizeOathReferee(secret.oath);ref.forfeits??={};ref.forfeits[uid]=true;delete ref.votes[uid];s.locked[uid]=true;s.voted[uid]=true;if(s.stage==='oath-write'){delete ref.submissions[uid];delete ref.drafts[uid];}if(s.stage==='oath-guess'&&s.turn===uid)s.guessSealed=true;return 'CASE FORFEITED · 0 POINTS';
}
export function actOath(s,secret,uid,action,payload={},now=Date.now()){
 const writing=s.stage==='oath-write'&&s.turn===uid,guessing=s.stage==='oath-guess'&&s.turn===uid;
 if(action==='oath-draft'&&((!writing&&!guessing)||payload.matchId!==s.matchId||payload.round!==s.round||payload.stageAt!==s.stageAt||(writing&&s.locked[uid])||s.guessSealed||s.deadline&&now>=s.deadline))return {ignored:true};
 if(!present(s).some(p=>p.id===uid))throw Error('Only active witnesses can act.');if(payload.matchId!==s.matchId||payload.round!==s.round||payload.stageAt!==s.stageAt)throw Error('That belongs to an earlier phase.');if(s.deadline&&now>=s.deadline)throw Error('That timer has ended.');const ref=normalizeOathReferee(secret.oath);if(ref.forfeits[uid])throw Error('This case was forfeited.');
 if(action==='oath-draft'){delete ref.drafts[uid];const text=clean(payload.text);if(text.length>48)throw Error('Keep testimony under 48 characters.');if(text)ref.drafts[uid]=validateChat(text);return {saved:true};}
 if(action==='oath-bluff'){if(!writing)throw Error('Wait for your turn to give a clue.');if(s.locked[uid])throw Error('Your clue is already sealed.');const result=sealClue(s,secret,uid,payload.text);s.revision++;event(s,'oath-sealed','A witness sealed a clue.',now,{player:uid});return result;}
 if(action==='oath-vote'){if(s.stage!=='oath-vote')throw Error('Voting has not opened.');if(s.voted[uid])throw Error('Your vote is already sealed.');if(payload.choice===uid)throw Error('Choose another witness.');if(!participants(s).some(p=>p.id===payload.choice))throw Error('Choose a witness from this case.');ref.votes[uid]=payload.choice;s.voted[uid]=true;s.revision++;return {accepted:true};}
 if(action==='oath-guess'){if(!guessing)throw Error('Only the accused impostor can guess.');if(s.guessSealed)throw Error('Your guess is already sealed.');const text=clean(payload.text);if(!text||text.length>48)throw Error('Enter one short guess.');ref.guess=validateChat(text);ref.guessed=isOathTruth(fact(secret),text);s.guessSealed=true;s.revision++;return {accepted:true};}
 throw Error('That action is not available.');
}
export function tickOath(s,secret,now=Date.now(),rng=Math.random){
 if(['lobby','finish'].includes(s.stage))return false;const ref=normalizeOathReferee(secret.oath);if(!ref)throw Error('The referee record is unavailable.');const active=present(s);
 if(s.stage==='oath-write'&&(s.locked[s.turn]||ref.forfeits[s.turn])&&now-s.stageAt>=900){prepareShare(s,secret,now);return true;}
 if(s.stage==='oath-vote'&&now-s.stageAt>=5000&&active.length&&active.every(p=>s.voted[p.id])){accuse(s,secret,now);return true;}
 if(s.stage==='oath-guess'&&s.guessSealed&&now-s.stageAt>=1800){revealCase(s,secret,now);return true;}
 if(!s.deadline||now<s.deadline)return false;
 if(s.stage==='oath-intro'||s.stage==='oath-standings'){s.round>=6?finishOath(s,now):nextRound(s,secret,now,rng);return true;}
 if(s.stage==='oath-read'){stage(s,'oath-write',now,OATH_TIMING.write);event(s,'oath-write','Write one clue. Keep your private brief to yourself.',now);return true;}
 if(s.stage==='oath-write'){prepareShare(s,secret,now);return true;}
 if(s.stage==='oath-shuffle'){shareCurrent(s,secret,now);return true;}
 if(s.stage==='oath-share'){nextClue(s,secret,now);return true;}
 if(s.stage==='oath-vote'){accuse(s,secret,now);return true;}
 if(s.stage==='oath-accuse'){if(!ref.caught||ref.forfeits[ref.impostor])revealCase(s,secret,now);else{s.turn=ref.impostor;s.guessSealed=false;ref.drafts={};stage(s,'oath-guess',now,OATH_TIMING.guess);event(s,'oath-last-word','Caught. The impostor gets one last guess at the word.',now);}return true;}
 if(s.stage==='oath-guess'){const draft=ref.drafts[ref.impostor];if(draft&&!ref.forfeits[ref.impostor]){ref.guess=draft;ref.guessed=isOathTruth(fact(secret),draft);}revealCase(s,secret,now);return true;}
 if(s.stage==='oath-reveal'){scoreRound(s,secret,now);return true;}
 return false;
}
