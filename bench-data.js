import {DOCKET_CATEGORIES} from './docket-data.js';
import {shuffle} from './question-selection.js';
import {BENCH_CHALLENGE_CATEGORIES,BENCH_HELD_CLUES,BENCH_ORIGINALS,benchTypedDistractors,benchQuestionText} from './bench-curation.js';

export const BENCH_BUILD='20261108-beat-the-bench-v36';
export const BENCH_RISKS={safe:{name:'Keep your distance',short:'SAFE',start:4,multiplier:.65,copy:'Four steps ahead. A smaller pot.'},standard:{name:'Stand your ground',short:'STANDARD',start:3,multiplier:1,copy:'Three steps ahead. Keep the whole pot.'},bold:{name:'Call his bluff',short:'BOLD',start:2,multiplier:1.75,copy:'Two steps ahead. A much bigger pot.'}};
export const BENCH_LEVELS={friendly:{name:'Warming up',accuracy:.62},sharp:{name:'On the record',accuracy:.75},ruthless:{name:'No mercy',accuracy:.86}};
export const benchKey=x=>String(x??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const equivalent=(a,b)=>[a.answer,...a.aliases].some(x=>[b.answer,...b.aliases].some(y=>benchKey(x)===benchKey(y)));
// Keep the answer type consistent when a mixed subject category contains
// planets alongside moons and asteroids. NASA's planet list is the boundary:
// https://science.nasa.gov/solar-system/planets/
const planets=['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'];
// Reuse the independently authored, source-linked general-knowledge clues.
// Include reviewed familiar challengers and hold specialist/faulty clues. Each distractor comes from the
// same actual subject category; aliases never become extra answer choices.
export const BENCH_QUESTIONS=[...BENCH_ORIGINALS,...DOCKET_CATEGORIES.flatMap(category=>category.clues.filter(q=>!BENCH_HELD_CLUES.has(q.id)&&(q.tier===1||q.tier===2||q.tier>=3&&BENCH_CHALLENGE_CATEGORIES.has(category.id))).flatMap(q=>{
 const choices=[],used=new Set([benchKey(q.answer),...q.aliases.map(benchKey)]);
 for(const other of category.clues){const k=benchKey(other.answer);if(used.has(k)||equivalent(q,other)||other.answer.length>70)continue;if(choices.some(x=>equivalent(x,other)))continue;choices.push(other);used.add(k);}
 if(choices.length<3)return [];
 const distractors=['planet-files','space-neighbors'].includes(category.id)&&planets.includes(q.answer)?planets.filter(p=>p!==q.answer):benchTypedDistractors(category.id,q,choices.map(x=>x.answer));
 if(distractors.length<3)return [];
 return [{id:'bench-'+q.id,prompt:benchQuestionText(q.prompt),answer:q.answer,aliases:q.aliases,source:q.source,subject:q.family,category:category.title,difficulty:q.tier+1,distractors}];
}))];
export const BENCH_BY_ID=new Map(BENCH_QUESTIONS.map(q=>[q.id,q]));
export function benchDeck(rng=Math.random){const groups=new Map();for(const q of shuffle(BENCH_QUESTIONS,rng)){if(!groups.has(q.subject))groups.set(q.subject,[]);groups.get(q.subject).push(q.id);}const deck=[],mix=[3,4,2,5,3,4,2,5];while([...groups.values()].some(g=>g.length))for(const subject of shuffle([...groups.keys()],rng)){const group=groups.get(subject);if(!group.length)continue;const wanted=mix[(deck.length+Math.floor(deck.length/8))%mix.length],index=group.findIndex(id=>BENCH_BY_ID.get(id).difficulty===wanted);deck.push(group.splice(index<0?group.length-1:index,1)[0]);}return deck;}
export function benchOptions(q,rng=Math.random){return shuffle([q.answer,...shuffle(q.distractors,rng).slice(0,3)],rng).map((text,i)=>({id:String(i),text}));}
