import {DOCKET_BY_ID} from './docket-data.js';
const memory=new Map(),key=uid=>'fc:docket-seen:v1:'+uid;
export function readDocketHistory(uid,storage=globalThis.localStorage){
 try{const ids=JSON.parse(storage?.getItem(key(uid))??'null')??memory.get(uid)??[];return ids.filter(id=>DOCKET_BY_ID.has(id)).slice(-2000);}catch{return memory.get(uid)??[];}
}
export function rememberDocketClue(uid,id,storage=globalThis.localStorage){
 if(!uid||!DOCKET_BY_ID.has(id))return;
 const ids=[...readDocketHistory(uid,storage).filter(q=>q!==id),id].slice(-2000);memory.set(uid,ids);
 try{storage?.setItem(key(uid),JSON.stringify(ids));}catch{}
}
