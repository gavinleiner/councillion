import './question-data.mjs';
import {PACKS} from '../data.js';
import {resolveAnswer,normalize,warmAnswerBank} from '../answer-matching.js';
const results=[];
for(const id of ['countries','dinosaur-genera','fun-minecraft','fun-elden-ring','fun-movies','fun-video-games','discovery-nfl-quarterback']){
 const p=PACKS.find(p=>p.id===id);if(!p)throw Error(id);
 const exact=new Set(p.answers.flatMap(a=>[a.label,...a.aliases]).map(normalize));
 const t=performance.now();warmAnswerBank(p);const warmMs=performance.now()-t;
 const answers=p.answers.filter(a=>a.points<=30&&a.label.length<=55&&/[a-z]{5}/i.test(a.label)).slice(0,24);
 let exactTwo=0,rejectedTwo=0,typos=0,correct=0,skipped=0,poison=0;const misses=[],falsePositives=[],times=[];
 for(const a of 'abcdefghijklmnopqrstuvwxyz')for(const b of 'abcdefghijklmnopqrstuvwxyz'){
  const q=a+b,r=resolveAnswer(p,q);if(exact.has(q)){exactTwo++;if(r.status!=='exact')throw Error('lost legitimate short answer '+id+q);}
  else {rejectedTwo++;if(r.status!=='missing')throw Error('invented initials '+id+q);}
 }
 for(const a of answers){
  const word=a.label.match(/[a-z]{5,}/i)[0],i=Math.floor(word.length/2);
  const mutations=[word.slice(0,i)+word.slice(i+1),word.slice(0,i)+word[i]+word.slice(i)];
  for(const w of mutations){const q=a.label.replace(word,w);if(exact.has(normalize(q))){skipped++;continue;}
   const t=performance.now(),r=resolveAnswer(p,q);times.push(performance.now()-t);typos++;
   if(r.answer?.label===a.label)correct++;else misses.push({q,expected:a.label,actual:r.answer?.label??null});
  }
  const q=a.label+' qzxvjk';const r=resolveAnswer(p,q);poison++;if(r.status!=='missing')falsePositives.push({q,actual:r.answer?.label});
 }
 times.sort((a,b)=>a-b);
 results.push({id,answerCount:p.answers.length,warmMs:+warmMs.toFixed(1),exactTwo,rejectedTwo,typos,correct,skipped,poison,falsePositives,misses,p50Ms:+times[Math.floor(times.length*.5)].toFixed(1),p95Ms:+times[Math.floor(times.length*.95)].toFixed(1)});
 console.log(JSON.stringify(results.at(-1)));
}
if(results.some(r=>r.falsePositives.length||r.correct/r.typos<.95))process.exitCode=1;
