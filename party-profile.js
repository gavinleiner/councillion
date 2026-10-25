import {mergeTournamentCareer} from './tournament-career.js';
import {stoneProofs,STONES} from './party-stones.js';
import {cleanHonor} from './account-honors.js';
import {mergeSoloCareer} from './solo-career.js';
import {careerFromReceipts,emptyCareer,appearance,applyRankGrant} from './party-career.js';
export class PartyProfileStore{
 constructor(cloud,onChange=()=>{}){this.c=cloud;this.onChange=onChange;this.profiles=new Map();this.off=new Map();}
 rebuild(p){p.career=applyRankGrant(mergeTournamentCareer(mergeSoloCareer(careerFromReceipts(p.partyRaw),p.soloRaw),p.tournamentRaw),p.rankGrantRaw);p.appearance=appearance(p.raw,p.career,p.unlocks);}
 watch(uid){
  if(this.off.has(uid))return;
  const p={career:emptyCareer(),appearance:appearance(),loaded:false,unlocks:{}};this.profiles.set(uid,p);const ready=new Set(),off=[];
  const sources=[['partyRaw','playerRecords'],['soloRaw','soloRecords'],['rankGrantRaw','rankGrants'],['tournamentRaw','playerTournaments'],['raw','playerBanners'],['honor','accountHonors'],['unlocks','stoneUnlocks']];
  for(const [field,path]of sources)off.push(this.c.onValue(this.c.ref(this.c.db,path+'/'+uid),s=>{p[field]=field==='honor'?cleanHonor(s.val()):s.val()??{};this.rebuild(p);ready.add(field);p.loaded=ready.size===sources.length;this.onChange(uid,p);},()=>{p.error='Your profile could not reconnect.';if(field==='honor'||field==='rankGrantRaw'){p[field]=null;ready.add(field);this.rebuild(p);}p.loaded=ready.size===sources.length;this.onChange(uid,p);}));
  this.off.set(uid,()=>off.forEach(stop=>stop()));
 }
 get(uid){return this.profiles.get(uid)??{career:emptyCareer(),appearance:appearance(),loaded:false,unlocks:{}};}
 async fetch(uid){
  const fields=[['partyRaw','playerRecords'],['raw','playerBanners'],['soloRaw','soloRecords'],['honor','accountHonors'],['unlocks','stoneUnlocks'],['rankGrantRaw','rankGrants'],['tournamentRaw','playerTournaments']];
  const values=await Promise.all(fields.map(async([field,path])=>[field,(await this.c.get(this.c.ref(this.c.db,path+'/'+uid))).val()]));
  const p=this.profiles.get(uid)??{};Object.assign(p,Object.fromEntries(values),{loaded:true});p.raw??={};p.unlocks??={};p.honor=cleanHonor(p.honor);this.rebuild(p);this.profiles.set(uid,p);return p;
 }
 async save(uid,value){const p=this.get(uid);if(!p.loaded)throw Error('Wait for your career to reconnect before editing your banner.');if(value.stone&&value.stone!=='court'&&!p.unlocks?.[value.stone]){const stone=STONES.find(s=>s.id===value.stone),proofs=stoneProofs(p,value.stone);if(!stone||proofs.length<stone.count)throw Error('That platform has not been earned.');const grant=this.c.ref(this.c.db,'stoneUnlocks/'+uid+'/'+stone.id);try{await this.c.set(grant,{version:1,at:this.c.serverTimestamp(),proofs:proofs.slice(0,stone.count)});}catch(error){if(!(await this.c.get(grant)).exists())throw error;}p.unlocks={...p.unlocks,[stone.id]:true};}const clean=appearance(value,p.career,p.unlocks);await this.c.set(this.c.ref(this.c.db,'playerBanners/'+uid),clean);return clean;}
 close(){for(const off of this.off.values())off();this.off.clear();this.profiles.clear();}
}
export async function saveMatchResult(c,result){
 const path=c.ref(c.db,'matchResults/'+result.game);let sealed=(await c.get(path)).val();
 if(!sealed){try{await c.set(path,result);sealed=result;}catch(error){sealed=(await c.get(path)).val();if(!sealed)throw error;}}
 // Each immutable per-account receipt has its own permission check. Retrying
 // cannot count the same match twice, including after host transfer.
 await Promise.all(Object.entries(sealed.players).map(async([uid,row])=>{const ref=c.ref(c.db,`playerRecords/${uid}/${sealed.game}`);if((await c.get(ref)).exists())return;try{await c.set(ref,row);}catch(error){if(!(await c.get(ref)).exists())throw error;}}));return sealed;
}
