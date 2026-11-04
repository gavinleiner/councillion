// Legacy browser history is cleared on party sign-in; new games never read it.
const fallback=new Map();
const key=uid=>'fc:question-history:v1:'+String(uid??'guest');
export function readQuestionHistory(uid,storage=globalThis.localStorage){try{if(!storage)return fallback.get(key(uid))??[];return [...new Set(JSON.parse(storage?.getItem(key(uid))??'[]'))].filter(x=>typeof x==='string');}catch{return fallback.get(key(uid))??[];}}
export function rememberQuestions(uid,ids,storage=globalThis.localStorage){const seen=[...new Set([...readQuestionHistory(uid,storage),...ids])];fallback.set(key(uid),seen);try{storage?.setItem(key(uid),JSON.stringify(seen));}catch{}return seen;}

export function clearQuestionHistory(uid,storage){fallback.delete(key(uid));try{(storage??globalThis.localStorage)?.removeItem(key(uid));}catch{}}
