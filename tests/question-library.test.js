import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {mountQuestionLibrary} from '../question-library.js';
const window=new Window();globalThis.document=window.document;
test('the question library searches and filters prompts without exposing answers',()=>{
 document.body.innerHTML='<main></main>';const root=document.querySelector('main');mountQuestionLibrary(root);
 assert.equal(root.querySelectorAll('.question-card').length,24);
 const q=root.querySelector('#question-search');q.value='SOUP';q.dispatchEvent(new window.Event('input'));
 assert.ok(root.querySelectorAll('.question-card').length>0);assert.match(root.querySelector('.question-grid').textContent,/SOUP/);
 assert.equal(root.querySelector('.question-grid').textContent.includes('Minestrone'),false);
 const select=root.querySelector('#question-subject');select.value='nature';select.dispatchEvent(new window.Event('change'));
 assert.equal(root.querySelectorAll('.question-card').length,0);q.value='';q.dispatchEvent(new window.Event('input'));
 assert.ok([...root.querySelectorAll('.question-card>div>span')].every(x=>x.textContent==='Nature'));
 assert.ok(root.querySelector('.question-card a').hash.startsWith('#practice?pack='));
});
