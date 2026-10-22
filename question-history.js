// Only prompt IDs are kept. Account keys stay in this browser; a room receives
// the IDs its players have already seen so changing hosts does not reset them.
const fallback=new Map();
const key=uid=>'fc:question-history:v1:'+String(uid??'guest');
export function readQuestionHistory(uid,storage=globalThis.localStorage){try{if(!storage)return fallback.get(key(uid))??[];return [...new Set(JSON.parse(storage?.getItem(key(uid))??'[]'))].filter(x=>typeof x==='string');}catch{return fallback.get(key(uid))??[];}}
export function rememberQuestions(uid,ids,storage=globalThis.localStorage){const seen=[...new Set([...readQuestionHistory(uid,storage),...ids])];fallback.set(key(uid),seen);try{storage?.setItem(key(uid),JSON.stringify(seen));}catch{}return seen;}
