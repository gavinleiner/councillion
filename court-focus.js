import {sentenceTestimonyTabSwitch} from './testimony-engine.js';
import {courtAbsenceDue,courtFocusKey} from './fair-play.js';
import {sentenceClashTabSwitch} from './court-games-engine.js';
import {sentenceDocketTabSwitch} from './docket-engine.js';
import {sentenceOathTabSwitch} from './oath-engine.js';
export function enforceCourtFocus(s,secret,reports,now,exemptions={}){
 let changed=false;
 for(const [id,r]of Object.entries(reports??{})){
  if(!courtAbsenceDue(s,id,r,now,exemptions))continue;
  s.tabPenalties??={};s.tabPenalties[id]=r.question+':'+r.leftAt;
  const p=s.players.find(p=>p.id===id);let penalty;
  if(s.variant==='testimony')penalty=sentenceTestimonyTabSwitch(s,secret,id,now);
  else if(s.variant==='clash')penalty=sentenceClashTabSwitch(s,secret,id,now);
  else if(s.variant==='docket')penalty=sentenceDocketTabSwitch(s,secret,id,now);
  else if(s.variant==='oath')penalty=sentenceOathTabSwitch(s,secret,id,now);
  else{delete secret.estimates?.[id];s.locked[id]=true;penalty='GUESS FORFEITED · 0 THIS ROUND';}
  const event={id:crypto.randomUUID(),player:id,name:p.name,at:now,penaltyText:penalty,penaltyShort:penalty.match(/^−\d+/)?.[0]??'×',question:courtFocusKey(s)??r.question};
  s.tabSentences=[...Object.values(s.tabSentences??{}),event].slice(-8);s.notice=p.name+' left the game tab. '+penalty+'.';s.revision++;changed=true;
 }
 return changed;
}
