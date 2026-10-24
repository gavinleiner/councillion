import {QUESTION_REVIEW_VERSION,QUESTION_PROPOSALS} from './question-proposals.js';
const ids=new Set(QUESTION_PROPOSALS.map(p=>p.id));
const validVote=v=>['yes','no','unset'].includes(v);
export function cleanReviewItems(items={},allowedIds=ids){return Object.fromEntries(Object.entries(items).filter(([id,item])=>allowedIds.has(id)&&item&&validVote(item.vote)).map(([id,item])=>[id,{vote:item.vote,note:String(item.note??'').slice(0,500),at:Number.isFinite(item.at)?item.at:0}]));}
export function reviewTotals(items){const values=Object.values(items);return {yes:values.filter(x=>x.vote==='yes').length,no:values.filter(x=>x.vote==='no').length,rated:values.filter(x=>x.vote==='yes'||x.vote==='no').length,total:QUESTION_PROPOSALS.length};}
export class QuestionReviewStore{
 constructor({uid='guest',storage=globalThis.localStorage,onChange=()=>{},getCloud,version=QUESTION_REVIEW_VERSION,questionIds=ids}={}){
  Object.assign(this,{uid,storage,onChange,getCloud,version,ids:new Set(questionIds),items:{},pending:{},revisions:{},status:'Saved on this device',closed:false});this.key='fc:question-review:'+version+':'+uid;
  try{const saved=JSON.parse(storage?.getItem(this.key)??'null');this.items=cleanReviewItems(saved?.items,this.ids);this.pending=Object.fromEntries(Object.keys(saved?.pending??{}).filter(id=>this.ids.has(id)&&this.items[id]).map(id=>[id,true]));}catch{}
 }
 persist(){try{this.storage?.setItem(this.key,JSON.stringify({items:this.items,pending:this.pending}));}catch{this.status='Device storage unavailable · keep this page open or export your review';}this.onChange(this);}
 edit(id,vote,note=this.items[id]?.note??''){
  if(!this.ids.has(id)||!validVote(vote))return;
  this.items[id]={vote,note:String(note).slice(0,500),at:Date.now()};this.revisions[id]=(this.revisions[id]??0)+1;this.pending[id]=true;this.status=this.cloud?'Saving to your account…':'Saved on this device';this.persist();this.flush();
 }
 async connect(){
  // Only the original tryout has a server schema. Other sample sets stay local.
  if(this.closed||this.uid==='guest'||!this.getCloud||this.version!==QUESTION_REVIEW_VERSION)return;
  try{const c=await this.getCloud();if(this.closed)return;const session=await c.currentSession();if(session.uid!==this.uid)throw Error('Account changed');this.cloud=c;this.path=c.ref(c.db,'questionReviews/'+this.uid+'/'+QUESTION_REVIEW_VERSION);
   this.off=c.onValue(this.path,snapshot=>{if(this.closed)return;const remote=cleanReviewItems(snapshot.val()?.items);for(const id of Object.keys(this.pending))if(this.items[id])remote[id]=this.items[id];this.items=remote;this.loaded=true;this.status=Object.keys(this.pending).length?'Saving to your account…':'Saved to your Google account';this.persist();this.flush();},()=>{if(this.closed)return;this.status='Saved on this device · account sync needs a retry';this.persist();});
  }catch{if(this.closed)return;this.status='Saved on this device · account sync needs a retry';this.persist();}
 }
 async flush(){
  if(this.closed||!this.cloud||!this.loaded||this.sending||!Object.keys(this.pending).length)return;
  this.sending=true;const c=this.cloud,batch=Object.fromEntries(Object.keys(this.pending).map(id=>[id,{revision:this.revisions[id]??0,item:{...this.items[id]}}]));
  const patch={version:1,updatedAt:c.serverTimestamp()};for(const[id,{item}]of Object.entries(batch))patch['items/'+id]={...item,at:c.serverTimestamp()};
  try{await c.update(this.path,patch);if(this.closed)return;for(const[id,{revision}]of Object.entries(batch))if((this.revisions[id]??0)===revision)delete this.pending[id];this.status=Object.keys(this.pending).length?'Saving to your account…':'Saved to your Google account';this.persist();}
  catch{if(!this.closed){this.status='Saved on this device · account sync needs a retry';this.persist();}}
  finally{this.sending=false;if(!this.closed&&this.status==='Saving to your account…')this.flush();}
 }
 retry(){if(this.cloud&&this.loaded)this.flush();else{this.off?.();this.connect();}}
 destroy(){this.closed=true;this.off?.();}
}
