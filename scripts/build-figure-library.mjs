import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const snapshot=JSON.parse(fs.readFileSync(new URL('../data-snapshots/court-games/figure-curated-v12.json',import.meta.url),'utf8'));
const hash=text=>createHash('sha256').update(text).digest('hex');
const categories=['Gaming','Sports','Screen','Music','World','Nature','Everyday'];
const ids=new Set(),prompts=new Set(),counts={};
const priorHashes=new Map();
const questions=snapshot.questions.map(entry=>{
 const {question:q,review:r,canonical,topic,kind,warmup,form}=entry;
 assert.deepEqual(JSON.parse(canonical),q,q.id+': reviewed content changed');
 assert.equal(hash(canonical),r.questionSha256,q.id+': factual review is stale');
 assert.equal(r.status,'verified');assert.equal(r.source,q.source);
 assert.ok(r.note&&r.method&&r.sourceTitle,q.id+': review lacks scope or attribution');
 assert.ok(r.sourceSha256||r.evidenceSha256||r.priorReviewSha256,q.id+': missing evidence receipt');
 for(const key of ['sourceSha256','evidenceSha256','priorReviewSha256'])if(r[key])assert.match(r[key],/^[a-f0-9]{64}$/);
 if(r.priorReviewFile){
  assert.ok(['figure-review.json','library-expansion-review.json'].includes(r.priorReviewFile));
  if(!priorHashes.has(r.priorReviewFile))priorHashes.set(r.priorReviewFile,hash(fs.readFileSync(new URL('../data-snapshots/court-games/'+r.priorReviewFile,import.meta.url))));
  assert.equal(r.priorReviewSha256,priorHashes.get(r.priorReviewFile),q.id+': reused source review changed');
 }
 assert.ok(!ids.has(q.id)&&!prompts.has(q.prompt.toLowerCase()),q.id+': duplicate');ids.add(q.id);prompts.add(q.prompt.toLowerCase());
 assert.ok(Number.isFinite(q.answer)&&q.answer>=0&&q.answer<=1e15);
 assert.ok(categories.includes(q.category)&&q.unit&&q.explanation&&topic);
 assert.equal(new URL(q.source).protocol,'https:');
 counts[q.category]=(counts[q.category]??0)+1;
 assert.equal(kind==='calendar',q.unit==='year');
 return {id:q.id,category:q.category,prompt:q.prompt,answer:q.answer,unit:q.unit,topic,kind,...(form?{form}:{}),...(warmup?{warmup:true}:{}),source:q.source,sourceTitle:r.sourceTitle,explanation:q.explanation,checked:r.checked,scale:q.scale??1,...(kind==='calendar'?{scoringSpan:50}:{}),reviewSha256:r.questionSha256};
});
assert.equal(questions.length,snapshot.questionCount);assert.equal(questions.length,1001);
assert.deepEqual(counts,snapshot.categories);
for(const category of categories)assert.ok(counts[category]>=90&&counts[category]/questions.length<.22);
const output='// Generated from the individually reviewed figure-curated-v12 snapshot.\n// Run node scripts/build-figure-library.mjs; unverified drafts are excluded.\nexport const CURATED_FIGURE_QUESTIONS='+JSON.stringify(questions,null,1)+';\n';
const target=new URL('../court-games-figure-data.js',import.meta.url);
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),output,'Curated Figure output is stale.');
else fs.writeFileSync(target,output);
console.log(JSON.stringify({curatedFigureQuestions:questions.length,categories:counts,sourceReviews:questions.length,calendarQuestions:questions.filter(q=>q.kind==='calendar').length}));
