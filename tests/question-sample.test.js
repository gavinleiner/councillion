import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Window} from 'happy-dom';
import {QUESTION_SAMPLE} from '../question-sample.js';
import {sampleQuestionPool} from '../question-sample-selection.js';
import {random,hash} from '../question-selection.js';
import {uniformQuestionDeck} from '../question-selection.js';
import {mountLiveQuestionReview,sampleFeedback} from '../live-question-review.js';
import {QuestionReviewStore} from '../question-review-state.js';
import {MIXED_PACKS} from '../data.js';

const manifest=JSON.parse(readFileSync(new URL('../group-bank-manifest.json',import.meta.url)));
const memory=()=>{const values=new Map();return{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};

test('the frozen 100 are the exact uniform seeded draw from all 5,000 live categories',()=>{
 assert.equal(QUESTION_SAMPLE.questions.length,100);
 assert.equal(new Set(QUESTION_SAMPLE.questions.map(p=>p.id)).size,100);
 assert.equal(QUESTION_SAMPLE.poolCount,5000);
 assert.equal(QUESTION_SAMPLE.poolBuild,manifest.build);
 assert.deepEqual(new Set(manifest.categories.map(p=>p.id)),new Set(MIXED_PACKS.map(p=>p.id)));
 assert.deepEqual(QUESTION_SAMPLE,sampleQuestionPool(manifest.categories,{seed:QUESTION_SAMPLE.seed,build:manifest.build}));
 const expected=uniformQuestionDeck(manifest.categories,{rng:random(hash(QUESTION_SAMPLE.seed))}).slice(0,100);
 assert.deepEqual(QUESTION_SAMPLE.questions.map(p=>p.id),expected);
 assert.match(QUESTION_SAMPLE.method,/equal chance/);
 const live=new Map(MIXED_PACKS.map(p=>[p.id,p]));
 for(const p of QUESTION_SAMPLE.questions){assert.equal(p.prompt,live.get(p.id).prompt);assert.equal(p.answerCount,live.get(p.id).answerCount);assert.equal(p.family,live.get(p.id).family);assert.ok(p.format);}
 assert.equal(Object.values(QUESTION_SAMPLE.formats).reduce((a,n)=>a+n,0),100);
 assert.equal(Object.values(QUESTION_SAMPLE.families).reduce((a,n)=>a+n,0),100);
 assert.deepEqual(JSON.parse(readFileSync(new URL('../question-sample-100.json',import.meta.url))),QUESTION_SAMPLE);
});

test('an exhausted subject is dropped without repeating its question',()=>{
 const pool=Array.from({length:100},(_,i)=>({id:'id'+i,family:i<99?'gaming':'sports',group:'group-steam-two-tags',prompt:'Question '+i,answerCount:50}));
 const draw=sampleQuestionPool(pool,{seed:'audit',build:'test'});
 assert.equal(draw.families.gaming,99);assert.equal(draw.families.sports,1);assert.equal(draw.formats['Steam · two tags'],100);
 assert.throws(()=>sampleQuestionPool(pool,{seed:'audit',build:'test',count:101}));
 assert.throws(()=>sampleQuestionPool([...pool,pool[0]],{seed:'audit',build:'test'}));
});

test('sample feedback uses live IDs, exact prompts and an independent device store',async()=>{
 const storage=memory(),id=QUESTION_SAMPLE.questions[0].id;
 const original=new QuestionReviewStore({uid:'a',storage});original.edit('q001','yes','Original review');
 let cloudCalls=0;const options={uid:'a',storage,version:QUESTION_SAMPLE.version,questionIds:QUESTION_SAMPLE.questions.map(p=>p.id),getCloud:()=>{cloudCalls++;throw Error('must stay local');}};
 const sample=new QuestionReviewStore(options);sample.edit(id,'no','Too many tags');sample.edit('q001','no');await sample.connect();
 assert.equal(cloudCalls,0);assert.equal(sample.items.q001,undefined);assert.equal(new QuestionReviewStore({uid:'a',storage}).items.q001.vote,'yes');
 const restored=new QuestionReviewStore(options);assert.deepEqual(restored.items,sample.items);
 assert.equal(Object.keys(new QuestionReviewStore({...options,uid:'b'}).items).length,0);
 const feedback=sampleFeedback(QUESTION_SAMPLE,restored.items);assert.equal(feedback.questions[0].id,id);assert.equal(feedback.questions[0].vote,'no');assert.equal(feedback.questions[0].note,'Too many tags');assert.equal(feedback.questions[0].prompt,QUESTION_SAMPLE.questions[0].prompt);assert.equal(feedback.seed,QUESTION_SAMPLE.seed);assert.equal(feedback.counts.rated,1);
 for(const s of [original,sample,restored])s.destroy();
});

test('all 100 prompts render together; rating, notes, undo, filtering and reload work',async()=>{
 const window=new Window(),previous={window:globalThis.window,document:globalThis.document};globalThis.window=window;globalThis.document=window.document;
 const storage=memory();let view;
 try{
  const root=document.createElement('main');document.body.append(root);view=mountLiveQuestionReview(root,{storage});
  const cards=[...root.querySelectorAll('[data-sample-id]')],id=cards[0].dataset.sampleId;
  assert.equal(cards.length,100);assert.equal(cards.filter(c=>!c.hidden).length,100);
  assert.match(root.textContent,/same selection system as live play/);
  cards[0].querySelector('[data-sample-vote=yes]').click();assert.equal(view.store.items[id].vote,'yes');assert.equal(cards[0].querySelector('[data-sample-vote=yes]').getAttribute('aria-pressed'),'true');
  const note=cards[0].querySelector('textarea');note.value='Same <tag> template';note.dispatchEvent(new window.Event('input',{bubbles:true}));assert.equal(view.store.items[id].note,note.value);assert.equal(document.activeElement?.tagName==='BODY'||document.activeElement===note,true);assert.equal(root.querySelector('tag'),null);
  cards[0].querySelector('[data-sample-vote=no]').click();assert.equal(view.store.items[id].vote,'no');root.querySelector('#sample-undo').click();assert.equal(view.store.items[id].vote,'yes');assert.equal(note.value,'Same <tag> template');
  const filter=root.querySelector('#sample-vote');filter.value='yes';filter.dispatchEvent(new window.Event('change'));assert.equal(cards.filter(c=>!c.hidden).length,1);
  filter.value='unrated';filter.dispatchEvent(new window.Event('change'));assert.equal(cards.filter(c=>!c.hidden).length,99);
  filter.value='all';filter.dispatchEvent(new window.Event('change'));
  const format=root.querySelector('#sample-format');format.value='Steam · two tags';format.dispatchEvent(new window.Event('change'));assert.equal(cards.filter(c=>!c.hidden).length,QUESTION_SAMPLE.formats['Steam · two tags']);
  const subject=root.querySelector('#sample-subject');subject.value=QUESTION_SAMPLE.questions.find(p=>p.family!=='gaming').family;subject.dispatchEvent(new window.Event('change'));assert.equal(cards.filter(c=>!c.hidden).length,0);assert.equal(root.querySelector('#sample-empty').hidden,false);
  view.destroy();view=mountLiveQuestionReview(root,{storage});assert.equal(view.store.items[id].vote,'yes');assert.equal(root.querySelector('textarea').value,'Same <tag> template');
  root.querySelector('[data-sample-clear]').click();assert.equal(view.store.items[id].vote,'unset');assert.equal(view.store.items[id].note,'Same <tag> template');
 }finally{view?.destroy();globalThis.window=previous.window;globalThis.document=previous.document;await window.happyDOM.close();}
});
