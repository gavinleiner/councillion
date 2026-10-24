import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {QUESTION_PROPOSALS} from '../question-proposals.js';
import {REVIEW_SOURCES} from '../question-research.js';
import {QuestionReviewStore,reviewTotals} from '../question-review-state.js';
import {mountQuestionReview} from '../question-review.js';
const memory=()=>{const values=new Map();return{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
test('100 distinct draft prompts span nine subjects, with examples, scope and research references',()=>{
 assert.equal(QUESTION_PROPOSALS.length,100);assert.equal(new Set(QUESTION_PROPOSALS.map(p=>p.id)).size,100);assert.equal(new Set(QUESTION_PROPOSALS.map(p=>p.prompt)).size,100);assert.equal(new Set(QUESTION_PROPOSALS.map(p=>p.family)).size,9);
 for(const p of QUESTION_PROPOSALS){assert.equal(p.status,'proposal');assert.ok(p.scope.length>20);assert.ok(p.examples.length>=6,p.id);assert.ok(p.sources.length);for(const id of p.sources)assert.ok(/^https:\/\//.test(REVIEW_SOURCES[id]?.url),id);assert.ok(!/Steam tagged|through 2025|Norway|20[0-9]0s/.test(p.prompt),p.prompt);}
});
test('device ratings, notes, clear votes and account isolation survive reopening',()=>{
 const storage=memory(),a=new QuestionReviewStore({uid:'a',storage});a.edit('q001','yes','good scope');a.edit('q002','no','too specific');a.edit('q003','unset','note only');a.edit('q101','yes');a.edit('q004','invalid');
 assert.deepEqual(reviewTotals(a.items),{yes:1,no:1,rated:2,total:100});const restored=new QuestionReviewStore({uid:'a',storage});assert.deepEqual(restored.items,a.items);assert.equal(restored.items.q001.note,'good scope');assert.equal(Object.keys(new QuestionReviewStore({uid:'b',storage}).items).length,0);restored.edit('q001','unset');assert.equal(reviewTotals(restored.items).rated,1);a.destroy();restored.destroy();
});
test('the review UI rates, advances, undoes, filters and preserves notes without voting on keystrokes',async()=>{
 const window=new Window(),previous={window:globalThis.window,document:globalThis.document};globalThis.window=window;globalThis.document=window.document;const storage=memory();let view;
 try{const root=document.createElement('main');document.body.append(root);view=mountQuestionReview(root,{storage});assert.equal(root.querySelectorAll('[data-jump]').length,100);assert.match(root.textContent,/Proposals, not new live answer banks/);
  const first=root.querySelector('[data-review-id]').dataset.reviewId;root.querySelector('[data-review-vote=yes]').click();assert.equal(view.store.items[first].vote,'yes');assert.notEqual(root.querySelector('[data-review-id]').dataset.reviewId,first);assert.match(root.querySelector('#review-count').textContent,/1 \/ 100/);
  root.querySelector('#review-undo').click();assert.equal(view.store.items[first].vote,'unset');assert.equal(root.querySelector('[data-review-id]').dataset.reviewId,first);
  const note=root.querySelector('#review-note');note.value='The <answer> scope matters';note.dispatchEvent(new window.Event('input'));assert.equal(view.store.items[first].note,note.value);assert.equal(reviewTotals(view.store.items).rated,0);
  note.focus();note.dispatchEvent(new window.KeyboardEvent('keydown',{key:'y',bubbles:true}));assert.equal(reviewTotals(view.store.items).rated,0);note.blur();document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'n',bubbles:true}));assert.equal(view.store.items[first].vote,'no');
  const filter=root.querySelector('#review-filter');filter.value='no';filter.dispatchEvent(new window.Event('change'));assert.equal(root.querySelector('[data-review-id]').dataset.reviewId,first);assert.equal(root.querySelector('#review-note').value,'The <answer> scope matters');assert.equal(root.querySelector('#review-readable answer'),null);
  filter.value='yes';filter.dispatchEvent(new window.Event('change'));assert.match(root.querySelector('#review-current').textContent,/No questions/);document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'y',bubbles:true}));assert.equal(view.store.items[first].vote,'no','An empty filter cannot vote on a hidden prompt');
  view.destroy();view=mountQuestionReview(root,{storage});assert.equal(view.store.items[first].vote,'no');assert.equal(view.store.items[first].note,'The <answer> scope matters');
 }finally{view?.destroy();globalThis.window=previous.window;globalThis.document=previous.document;await window.happyDOM.close();}
});
