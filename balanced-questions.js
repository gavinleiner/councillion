import {shuffle} from './question-selection.js';

export const QUESTION_SELECTION_BUILD='20261023-balanced-v1';
export const questionFormatKey=p=>p.group?.startsWith('group-approved-')?'approved':p.group?.startsWith('group-broad-')?'broad':p.group??p.id;

// Pool volume does not buy more turns. Subjects share turns, then formats
// share turns within a subject. Random ties and shuffled buckets keep variety.
// Exhausted subjects/formats drop out; no played prompt is recycled to fill a quota.
export function balancedQuestionDeck(packs,{seen=[],recent=[],rng=Math.random}={}){
 const excluded=new Set(seen),families=new Map(),familyTurns=new Map(),formatTurns=new Map(),byId=new Map(packs.map(p=>[p.id,p]));
 for(const p of shuffle(packs,rng)){
  if(excluded.has(p.id))continue;
  const family=p.family??'other',format=questionFormatKey(p);
  if(!families.has(family))families.set(family,new Map());
  const formats=families.get(family);if(!formats.has(format))formats.set(format,[]);formats.get(format).push(p.id);
 }
 const lastFamilies=recent.map(id=>byId.get(id)?.family).filter(Boolean).slice(-6),result=[];
 const choose=values=>values[Math.min(values.length-1,Math.floor(rng()*values.length))];
 function least(values,turns){const min=Math.min(...values.map(k=>turns.get(k)??0));return values.filter(k=>(turns.get(k)??0)===min);}
 while(families.size){
  const all=[...families.keys()],cooldown=lastFamilies.slice(-Math.min(6,all.length-1));
  let candidates=all.filter(f=>!cooldown.includes(f));if(!candidates.length)candidates=all;
  const family=choose(least(candidates,familyTurns)),formats=families.get(family);
  if(!formatTurns.has(family))formatTurns.set(family,new Map());const turns=formatTurns.get(family);
  const format=choose(least([...formats.keys()],turns)),bucket=formats.get(format),id=bucket.pop();
  result.push(id);familyTurns.set(family,(familyTurns.get(family)??0)+1);turns.set(format,(turns.get(format)??0)+1);lastFamilies.push(family);if(lastFamilies.length>6)lastFamilies.shift();
  if(!bucket.length)formats.delete(format);if(!formats.size)families.delete(family);
 }
 return result;
}
