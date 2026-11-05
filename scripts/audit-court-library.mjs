import fs from 'node:fs';
import assert from 'node:assert/strict';
import {CLASH_BOARDS,FIGURE_QUESTIONS,FIGURE_BY_ID} from '../court-games-data.js';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame,parseEstimate} from '../court-games-engine.js';
import {matchAnswer,normalize} from '../answer-matching.js';
import {random} from '../question-selection.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../data-snapshots/court-games/'+name,import.meta.url),'utf8'));
const oldSurvey=read('survey-review.json'),oldFigure=read('figure-review.json'),extra=read('library-expansion-review.json');
const surveys=new Map([...oldSurvey.boards,...extra.surveyBoards].map(q=>[q.id,q])),figures=new Map([...oldFigure.questions,...extra.numericQuestions].map(q=>[q.id,q]));
assert.equal(CLASH_BOARDS.length,200);assert.equal(FIGURE_QUESTIONS.length,210);
const prompts=new Set(),sourceBoards=new Set();let answers=0,aliases=0;
for(const q of CLASH_BOARDS){
 assert.ok(!prompts.has(normalize(q.prompt)),'Repeated survey prompt: '+q.id);prompts.add(normalize(q.prompt));
 const r=surveys.get(q.id);assert.ok(r,'Missing source review: '+q.id);assert.equal(q.source,r.source);
 const key=q.source+'#'+r.sourceBoardIndex;assert.ok(!sourceBoards.has(key),'Repeated source board: '+key);sourceBoards.add(key);
 assert.deepEqual(q.answers.map(a=>a.points),r.points,q.id+': changed source scores');assert.equal(q.answers.length,r.answerCount,q.id+': missing source answer');assert.equal(q.answers.reduce((s,a)=>s+a.points,0),r.boardTotal);assert.match(r.sourceSha256,/^[a-f0-9]{64}$/);
 assert.ok(q.answers.length>=5&&q.answers.length<=8);assert.ok(r.boardTotal>0&&r.boardTotal<=100);
 const seen=new Map();for(const [i,a] of q.answers.entries()){
  answers++;assert.ok(a.label.length<80&&a.label.trim());assert.ok(Number.isInteger(a.points)&&a.points>0);if(i)assert.ok(q.answers[i-1].points>=a.points);
  for(const text of [a.label,...a.aliases]){aliases++;const n=normalize(text);assert.ok(n&&(!seen.has(n)||seen.get(n)===a.label),q.id+': colliding alias '+text);seen.set(n,a.label);assert.equal(matchAnswer(q,text)?.label,a.label,q.id+': wrong accepted category for '+text);assert.ok(n.length>1,q.id+': one-letter giveaway');}
 }
}
const counts={};for(const q of FIGURE_QUESTIONS){
 const r=figures.get(q.id);assert.ok(r,'Missing fact review: '+q.id);for(const key of ['answer','unit','source','category'])assert.equal(q[key],r[key],q.id+': review mismatch '+key);
 assert.ok(Number.isFinite(q.answer)&&q.answer>=0&&q.answer<=1e15);assert.ok(q.unit&&q.explanation&&q.sourceTitle&&q.prompt);assert.equal(new URL(q.source).protocol,'https:');assert.ok(r.scopeNote);assert.ok(!prompts.has(normalize(q.prompt)),'Repeated numerical prompt: '+q.id);prompts.add(normalize(q.prompt));counts[q.category]=(counts[q.category]??0)+1;
 assert.equal(parseEstimate(String(q.answer)),q.answer,q.id+': answer cannot be submitted');
}
assert.equal(Object.keys(counts).length,7);for(const n of Object.values(counts))assert.equal(n,30);
for(const [id,input] of [['earth-age','4.54b'],['sahara-area','9.2m'],['ps2-sales','160m']])assert.equal(parseEstimate(input),FIGURE_BY_ID.get(id).answer,id+': shorthand magnitude');
const players=Array.from({length:6},(_,i)=>({id:'p'+i,name:'Player '+i,ready:true,connected:true,team:i%2}));
const first={clash:new Set(),figure:new Set()},newFirst={clash:0,figure:0};
for(let seed=0;seed<400;seed++)for(const mode of ['clash','figure']){
 const s=createCourtGame(mode,players),secret={};startCourtGame(s,1000,random(seed));const size=mode==='clash'?200:210;
 assert.equal(s.questionIds.length,size);assert.equal(new Set(s.questionIds).size,size,'A match repeats questions');first[mode].add(s.questionIds[0]);if((mode==='clash'?extra.surveyBoards:extra.numericQuestions).some(q=>q.id===s.questionIds[0]))newFirst[mode]++;
 if(mode==='figure'){const cats=s.questionIds.slice(0,7).map(id=>FIGURE_BY_ID.get(id).category);assert.equal(new Set(cats).size,7);}
 else for(const runners of [1,2]){
  const t=structuredClone(s);for(const p of t.players)actCourtGame(t,secret,p.id,'briefing-ready',{},1001);tickCourtGame(t,secret,1002);tickCourtGame(t,secret,t.deadline);t.history=[{id:t.board.id}];t.stage='roundResult';t.round=4;t.deadline=15000;t.teamScores=[350,100];tickCourtGame(t,secret,15000);t.fastPlayers=runners===1?['p0']:['p0','p2'];actCourtGame(t,secret,'p0','fast-start',{},15100);
  assert.equal(t.fastIds.length,5);assert.equal(new Set(t.fastIds).size,5);assert.ok(!t.fastIds.includes(t.history[0].id));const possible=t.fastIds.reduce((n,id)=>n+CLASH_BOARDS.find(q=>q.id===id).answers.slice(0,runners).reduce((a,b)=>a+b.points,0),0);assert.ok(possible>=t.fastTarget,'Unwinnable Fast Money');
 }
}
for(const mode of ['clash','figure']){assert.ok(first[mode].size>140,'Insufficient fresh lobby variety');assert.ok(newFirst[mode]>275&&newFirst[mode]<365,'Old prefix or new-only draw bias');}
console.log(JSON.stringify({surveyBoards:200,surveyAnswerCategories:answers,canonicalAndAliasChecks:aliases,numericalQuestions:210,numericalCategories:counts,freshMatchSimulations:800,attainableFastMoneyChecks:800,distinctFirstDraws:Object.fromEntries(Object.entries(first).map(([k,v])=>[k,v.size])),newFirstDraws:newFirst},null,2));
