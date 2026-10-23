import {cleanHonor} from './account-honors.js';
import {mergeSoloCareer} from './solo-career.js';
import {careerFromReceipts,emptyCareer,appearance} from './party-career.js';
export class PartyProfileStore{
 constructor(cloud,onChange=()=>{}){this.c=cloud;this.onChange=onChange;this.profiles=new Map();this.off=new Map();}
 watch(uid){if(this.off.has(uid))return;const p={career:emptyCareer(),appearance:appearance(),loaded:false};this.profiles.set(uid,p);let records=false,banner=false,solo=false,honor=false;const changed=()=>{p.loaded=records&&banner&&solo&&honor;this.onChange(uid,p);};const a=this.c.onValue(this.c.ref(this.c.db,'playerRecords/'+uid),s=>{p.partyRaw=s.val();p.career=mergeSoloCareer(careerFromReceipts(p.partyRaw),p.soloRaw);p.appearance=appearance(p.raw,p.career);records=true;changed();},()=>{p.error='Career could not reconnect.';changed();}),b=this.c.onValue(this.c.ref(this.c.db,'playerBanners/'+uid),s=>{p.raw=s.val()??{};p.appearance=appearance(p.raw,p.career);banner=true;changed();},()=>{p.error='Banner could not reconnect.';changed();});const d=this.c.onValue(this.c.ref(this.c.db,'soloRecords/'+uid),s=>{p.soloRaw=s.val();p.career=mergeSoloCareer(careerFromReceipts(p.partyRaw),p.soloRaw);p.appearance=appearance(p.raw,p.career);solo=true;changed();},()=>{p.error='Solo achievements could not reconnect.';changed();});const h=this.c.onValue(this.c.ref(this.c.db,'accountHonors/'+uid),s=>{p.honor=cleanHonor(s.val());honor=true;changed();},()=>{p.honor=null;honor=true;changed();});this.off.set(uid,()=>{a();b();d();h();});}
 get(uid){return this.profiles.get(uid)??{career:emptyCareer(),appearance:appearance(),loaded:false};}
 async fetch(uid){const [records,banner,solo,honor]=await Promise.all([this.c.get(this.c.ref(this.c.db,'playerRecords/'+uid)),this.c.get(this.c.ref(this.c.db,'playerBanners/'+uid)),this.c.get(this.c.ref(this.c.db,'soloRecords/'+uid)),this.c.get(this.c.ref(this.c.db,'accountHonors/'+uid))]);const career=mergeSoloCareer(careerFromReceipts(records.val()),solo.val()),p=this.profiles.get(uid)??{};Object.assign(p,{career,partyRaw:records.val(),soloRaw:solo.val(),raw:banner.val()??{},honor:cleanHonor(honor.val()),loaded:true});p.appearance=appearance(p.raw,career);this.profiles.set(uid,p);return p;}
 async save(uid,value){const p=this.get(uid);if(!p.loaded)throw Error('Wait for your career to reconnect before editing your banner.');const clean=appearance(value,p.career);await this.c.set(this.c.ref(this.c.db,'playerBanners/'+uid),clean);return clean;}
 close(){for(const off of this.off.values())off();this.off.clear();this.profiles.clear();}
}
export async function saveMatchResult(c,result){
 const path=c.ref(c.db,'matchResults/'+result.game);let sealed=(await c.get(path)).val();
 if(!sealed){try{await c.set(path,result);sealed=result;}catch(error){sealed=(await c.get(path)).val();if(!sealed)throw error;}}
 // Each immutable per-account receipt has its own permission check. Retrying
 // cannot count the same match twice, including after host transfer.
 await Promise.all(Object.entries(sealed.players).map(async([uid,row])=>{const ref=c.ref(c.db,`playerRecords/${uid}/${sealed.game}`);if((await c.get(ref)).exists())return;try{await c.set(ref,row);}catch(error){if(!(await c.get(ref)).exists())throw error;}}));return sealed;
}
