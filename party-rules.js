import {newParty,startParty,tickParty,disconnectPlayer} from './engine.js';
export const PARTY_DEFAULTS={lives:2,maxLives:5,meterTarget:600,minTurnMs:8000,fuseMinMs:10000,fuseMaxMs:30000,maxPlayers:6};
const bounded=(value,fallback,min,max,step=1)=>Math.max(min,Math.min(max,Math.round((Number.isFinite(+value)?+value:fallback)/step)*step));
export function partySettings(patch={},base=PARTY_DEFAULTS){const s={...base};s.maxLives=bounded(patch.maxLives??s.maxLives,5,1,10);s.lives=bounded(patch.lives??s.lives,2,1,s.maxLives);s.meterTarget=bounded(patch.meterTarget??s.meterTarget,600,50,5000,50);s.minTurnMs=bounded(patch.minTurnMs??s.minTurnMs,8000,3000,20000,1000);s.maxPlayers=bounded(patch.maxPlayers??s.maxPlayers,6,2,16);return s;}
export function syncRoster(state,members,now=Date.now()){
 let changed=false;
 for(const [id,m] of Object.entries(members??{})){
  let p=state.players.find(p=>p.id===id);const present=m.online||now-(m.lastSeen??m.joinedAt)<30000;
  if(!p&&present){p={id,name:m.name,buddy:m.buddy,connected:true,ready:m.ready,autoJoin:m.autoJoin,hearts:state.phase==='lobby'?state.settings.lives:0,meter:0,score:0,spectator:state.phase!=='lobby'};state.players.push(p);changed=true;}
  if(p){if(present&&!p.connected){p.connected=true;p.spectator=state.phase!=='lobby';p.hearts=p.spectator?0:state.settings.lives;changed=true;}for(const k of ['name','buddy','ready','autoJoin','protocol'])if(p[k]!==m[k]){p[k]=m[k];changed=true;}if(!present&&p.connected){disconnectPlayer(state,id,now);changed=true;}}
 }
 for(const p of [...state.players])if(!members?.[p.id]&&p.connected){disconnectPlayer(state,p.id,now);changed=true;}
 if(state.phase==='lobby'){const players=state.players.filter(p=>p.connected);if(players.length!==state.players.length){state.players=players;changed=true;}}
 if(changed)state.revision++;return changed;
}
export function beginParty(state,now=Date.now(),rng=Math.random){
 if(!['lobby','ended'].includes(state.phase))return false;
 const players=state.players.filter(p=>p.connected&&p.ready).slice(0,state.settings.maxPlayers);if(players.length<2)return false;
 const mode=state.mode??'casual',old=state.settings,next=newParty(players,Math.random,state.seenIds??[]);if(!next.packIds.length){state.exhausted=true;state.phase='ended';state.deadline=0;state.notice='All available questions have been seen. New questions are needed; no repeats will be dealt.';return false;}Object.assign(state,next,{mode,matchId:crypto.randomUUID(),matchSeats:players.length,matchRoster:players.map(p=>p.id),matchParticipants:Object.fromEntries(players.map(p=>[p.id,true])),matchStartedAt:0,endedAt:0,voidReason:'',winner:null,settings:old,revision:state.revision+1,phase:'countdown',nextAt:now+3000});state.firstTurn=Math.min(players.length-1,Math.floor(rng()*players.length));state.turn=state.firstTurn;delete state.finalDuel;delete state.clutchFinish;delete state.matchRatings;delete state.result;delete state.resultSaved;state.players.forEach(p=>{delete p.eliminationOrder;p.hearts=old.lives;p.spectator=false;delete p.lastAnswer;});state.notice='Court is about to begin…';return true;
}
export function stepParty(state,now=Date.now()){
 if(state.phase==='countdown'&&now>=state.nextAt)return startParty(state,now);
 const who=state.players[state.turn];const didPop=state.phase==='playing'&&now>=state.deadline;
 const changed=tickParty(state,now);if(didPop){state.popped={id:who.id,at:now};state.players.forEach(p=>{delete p.lastAnswer;});}return changed;
}
export function setLobbyRules(state,patch){if(state.mode==='ranked')throw Error('Ranked uses fixed heart and timer rules. Host a Casual room to customize them.');if(!['lobby','ended'].includes(state.phase))throw Error('Rules can change between games.');state.settings=partySettings(patch,state.settings);const seated=state.players.filter(p=>p.ready&&p.connected).length;if(state.settings.maxPlayers<seated)state.settings.maxPlayers=seated;state.players.forEach(p=>{if(state.phase==='lobby')p.hearts=state.settings.lives;});state.revision++;}
