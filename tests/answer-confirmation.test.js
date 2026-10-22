import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {AnswerConfirmation,deadlineAnswer} from '../answer-confirmation.js';
import {resolveAnswer} from '../answer-matching.js';
const pack={answers:[{label:'Black Coffee',points:30,aliases:[]},{label:'Diamond Sword',points:60,aliases:[]},{label:'United States',points:10,aliases:['USA']}]};
function fixture(){const window=new Window(),d=window.document;d.body.innerHTML='<form><input><button>DIVE</button></form><div id="correction" hidden></div>';const sent=[];let turn='one',active=true;const form=d.querySelector('form'),input=d.querySelector('input'),container=d.querySelector('#correction'),confirmation=new AnswerConfirmation({form,input,button:d.querySelector('button'),container,pack:()=>pack,onSubmit:(...args)=>sent.push(args),context:()=>turn,active:()=>active});return {window,form,input,container,sent,confirmation,edit(value){input.value=value;input.dispatchEvent(new window.Event('input'));},submit(){form.dispatchEvent(new window.Event('submit',{cancelable:true}));},turn(v){turn=v;confirmation.invalidate();},active(v){active=v;}};}
test('typing never displays a suggestion; first submit fills the correction and second submit confirms',async()=>{
 const f=fixture();try{f.edit('dimond swrod');assert.equal(f.container.hidden,true);f.submit();assert.equal(f.sent.length,0);assert.equal(f.input.value,'Diamond Sword');assert.match(f.container.textContent,/Did you mean “Diamond Sword”/);assert.match(f.container.textContent,/Submit again to confirm/);f.submit();assert.equal(f.sent.length,1);assert.deepEqual(f.sent[0],['Diamond Sword',{from:'dimond swrod',corrected:true}]);}finally{f.confirmation.destroy();await f.window.happyDOM.close();}
});
test('editing removes the pending correction and turn/clock changes cannot confirm an old proposal',async()=>{
 const f=fixture();try{f.edit('blak coffee');f.submit();f.edit('locals coffee');assert.equal(f.container.hidden,true);assert.equal(resolveAnswer(pack,'locals coffee').status,'missing');f.submit();assert.equal(f.sent[0][0],'locals coffee');f.edit('blak coffee');f.submit();f.turn('two');assert.equal(f.container.hidden,true);f.active(false);f.submit();assert.equal(f.sent.length,1);}finally{f.confirmation.destroy();await f.window.happyDOM.close();}
});
test('exact aliases and recognized abbreviations submit immediately and deadlines do not invent corrections',async()=>{
 const f=fixture();try{for(const value of ['Black Coffee','USA','US']){f.edit(value);f.submit();}assert.equal(f.sent.length,3);assert.equal(f.container.hidden,true);assert.equal(deadlineAnswer(pack,'blak coffee'),null);assert.equal(deadlineAnswer(pack,'Black Coffee').label,'Black Coffee');}finally{f.confirmation.destroy();await f.window.happyDOM.close();}
});
test('spelling regression matrix keeps typos while rejecting shared-word guesses',()=>{
 const p={answers:[{label:'Black Coffee',points:30,aliases:[]},{label:'Diamond Sword',points:60,aliases:[]},{label:'Global warming',points:10,aliases:[]},{label:'Climate change',points:10,aliases:[]},{label:'Chicken tikka masala',points:30,aliases:[]},{label:'Connect Four',points:10,aliases:[]},{label:'Spain',points:10,aliases:[]},{label:'Monkey D. Luffy',points:10,aliases:['Luffy']}]};
 for(const [typed,expected] of [['blak coffee','Black Coffee'],['black cofee','Black Coffee'],['dimond swrod','Diamond Sword'],['global warmign','Global warming'],['climat chnge','Climate change'],['chiken tikka masla','Chicken tikka masala'],['conect four','Connect Four'],['spian','Spain'],['lufffy','Monkey D. Luffy']])assert.equal(resolveAnswer(p,typed).answer?.label,expected,typed);
 for(const typed of ['locals coffee','blue coffee','coffee locals','black shoe','global shoe','locals tikka','diamond knife','locals black coffee','shoe tikka masala','qzxv coffee','coffee'])assert.equal(resolveAnswer(p,typed).status,'missing',typed);
});
