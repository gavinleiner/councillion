// Predictable local practice actors, not ranked opponents or an online AI service.
import {oathClueUsed,isOathTruth} from './oath-engine.js';
const broad={
 Games:['Winning','Friends','Levels','Practice','Timing','Strategy','Control','Challenge','Progress','Movement','Reaction','Planning','Risk','Retry','Focus','Skill'],
 Food:['Sharing','Hungry','Tasty','Kitchen','Recipe','Plate','Family','Flavor','Serving','Weekend','Cooking','Tradition','Portion','Napkin','Table','Comfort'],
 Everyday:['Useful','Routine','Convenient','Home','Small','Practical','Familiar','Carry','Household','Simple','Task','Ordinary','Keep','Ready','Reach','Handle'],
 Places:['Crowds','Weekends','Visiting','Trip','Meeting','Plans','Arrival','Public','People','Destination','Outing','Nearby','Entrance','Afternoon','Visit','Activity'],
 Nature:['Outside','Wild','Nature','Seasons','Discover','Environment','Explore','Landscape','Pattern','Quiet','Weather','Habitat','Observe','Earth','Wonder','Outdoors'],
 Screen:['Adventure','Heroes','Story','Familiar','Scene','Fantasy','Journey','Legend','Audience','Imagination','Iconic','Fiction','Drama','Character','Memorable','Cinema']
};
export function oathBotClue(question,impostor,index,round,lap=1,used=[]){
 const bank=impostor?broad[question.category]:[...question.clues,...broad[question.category]],start=(index+round+lap-1)%bank.length;
 for(let n=0;n<bank.length;n++){const text=bank[(start+n)%bank.length];if(!oathClueUsed({testimonies:used},text)&&!isOathTruth(question,text))return text;}
 return ''; // An exhausted practice bot lets its turn expire, never repeats a clue.
}
export function oathBotVote(s,ref,id,index){const others=s.players.filter(p=>!p.spectator&&p.id!==id),suspect=others.find(p=>p.id===ref.impostor);return suspect&&s.round%3!==2&&(index+s.round)%4<2?suspect.id:others.filter(p=>p.id!==ref.impostor)[(index+s.round)%Math.max(1,others.length-1)]?.id??others[0].id;}
export function oathBotGuess(q,index,round){return (index+round)%2===0?q.answer:'Something else';}
