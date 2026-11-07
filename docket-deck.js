import {shuffle} from './question-selection.js';
const answerKey=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function freshDocketChoice(pool,recent=[],rng=Math.random){
 const seen=new Map(recent.map((id,i)=>[id,i]));
 return shuffle(pool,rng).sort((a,b)=>(seen.get(a.id)??-1)-(seen.get(b.id)??-1))[0];
}
// Keep category identities, value tiers and eight subject families. A repeat
// category gets a different question at each value before rotating old clues.
export function drawDocket(categories,recent=[],rng=Math.random){
 const families=shuffle([...new Set(categories.map(c=>c.family))],rng),ids=[],questions=[],used=new Set();
 for(let board=0;board<2;board++)for(let column=0;column<6;column++){
  const family=families[(board*6+column)%families.length],candidates=shuffle(categories.filter(c=>c.family===family&&!ids.includes(c.id)),rng);
  let chosen,best=Infinity;const seen=new Set(recent);
  for(const category of candidates){
   const rows=[],answers=new Set(used);
   for(let tier=0;tier<5;tier++){
    const q=freshDocketChoice(category.clues.filter(q=>(q.tier??category.clues.indexOf(q))===tier&&!answers.has(answerKey(q.answer))),recent,rng);
    if(!q)break;rows.push(q);answers.add(answerKey(q.answer));
   }
   if(rows.length===5){const repeats=rows.filter(q=>seen.has(q.id)).length;if(repeats<best){chosen={category,rows,answers};best=repeats;}if(best===0)break;}
  }
  if(!chosen)throw Error('No fresh balanced Docket column is available.');
  ids.push(chosen.category.id);questions.push(...chosen.rows.map(q=>q.id));for(const a of chosen.answers)used.add(a);
 }
 return {categories:ids,questions};
}
