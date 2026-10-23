import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {TypingBubble} from '../party-typing.js';
const window=new Window();globalThis.document=window.document;
test('typing and deletion settle quickly, turn changes discard old edits, and cleanup cancels work',()=>{
 const frames=new Map();let id=0;
 globalThis.requestAnimationFrame=f=>{frames.set(++id,f);return id;};globalThis.cancelAnimationFrame=i=>frames.delete(i);
 const advance=t=>{const batch=[...frames.values()];frames.clear();for(const f of batch)f(t);};
 document.body.innerHTML='<div hidden><span></span></div>';const node=document.querySelector('div'),bubble=new TypingBubble(node);
 try{
  bubble.update('abcdefghij','turn-1','Counsel');advance(0);advance(80);assert.ok(bubble.shown.length>0&&bubble.shown.length<10);advance(170);assert.equal(bubble.shown,'abcdefghij');
  bubble.update('abc','turn-1','Counsel');advance(200);advance(280);assert.ok(bubble.shown.length<10);bubble.update('abacus','turn-1','Counsel');advance(300);advance(470);assert.equal(bubble.shown,'abacus');
  bubble.update('new player','turn-2','Friend');assert.equal(bubble.shown,'');advance(500);advance(670);assert.equal(node.textContent,'new player');assert.equal(node.getAttribute('aria-label'),'Friend is answering');
  bubble.update('','turn-2','Friend');assert.equal(node.hidden,true);assert.equal(frames.size,0);
  document.body.classList.add('reduced');bubble.update('instant','turn-3','Friend');assert.equal(bubble.shown,'instant');assert.equal(frames.size,0);
  document.body.classList.remove('reduced');bubble.update('a pending edit','turn-3','Friend');assert.equal(frames.size,1);bubble.destroy();assert.equal(frames.size,0);bubble.update('ignored','turn-4','Friend');assert.notEqual(bubble.shown,'ignored');
 }finally{bubble.destroy();document.body.classList.remove('reduced');delete globalThis.requestAnimationFrame;delete globalThis.cancelAnimationFrame;}
});
