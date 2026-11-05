import {shuffle} from './question-selection.js';

// Rooms start with a new draw. No player history or saved question order enters
// this function. Every available subject gets one place in each complete cycle.
export function figureDeck(questions,rng=Math.random){
 const buckets=new Map();
 for(const q of shuffle(questions,rng)){
  if(!buckets.has(q.category))buckets.set(q.category,[]);
  buckets.get(q.category).push(q);
 }
 const selected=[],recent=[];
 while(buckets.size){
  for(const category of shuffle([...buckets.keys()],rng)){
   const bucket=buckets.get(category);
   const fits=q=>!recent.slice(-10).some(p=>(p.topic??p.id)===(q.topic??q.id))
    &&!(q.kind==='calendar'&&recent.slice(-5).filter(p=>p.kind==='calendar').length>=2)
    &&!(q.warmup&&recent.slice(-5).some(p=>p.warmup))
    &&!(q.form&&recent.slice(-5).some(p=>p.form===q.form));
   let i=bucket.findIndex(fits);
   // Small or nearly exhausted banks still produce a complete, unique deck.
   if(i<0)i=bucket.findIndex(q=>!recent.slice(-10).some(p=>(p.topic??p.id)===(q.topic??q.id)));
   if(i<0)i=0;
   const [q]=bucket.splice(i,1);selected.push(q.id);recent.push(q);
   if(!bucket.length)buckets.delete(category);
  }
 }
 return selected;
}
