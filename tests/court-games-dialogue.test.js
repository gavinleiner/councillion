import test from 'node:test';
import assert from 'node:assert/strict';
import {answerTurn,visibleCourtDraft,fastLiveAnswer,visibleFastDraft,hostCue,HostVoice} from '../court-games-dialogue.js';
import {CLASH_BOARDS} from '../court-games-data.js';
const state=()=>({variant:'clash',stage:'control',matchId:'match',round:2,turn:'a',deadline:28000,controlTeam:0,players:[{id:'a',name:'Nori',team:0},{id:'b',name:'Pearl',team:1}],fastPlayers:['a','b'],fastPass:0,fastIds:CLASH_BOARDS.slice(0,5).map(q=>q.id)});
test('only the active connected answerer’s current-turn text is visible',()=>{
 const s=state(),d={a:{game:'match',round:2,text:'Blue whale',editedAt:11000},b:{game:'match',round:2,text:'secret suggestion',editedAt:11000}};
 assert.equal(visibleCourtDraft(s,d,12000).text,'Blue whale');
 for(const patch of [{game:'old'},{round:1},{editedAt:9999},{editedAt:18000},{text:'f u c k'}])assert.equal(visibleCourtDraft(s,{a:{...d.a,...patch}},12000)?.text??'','');
 s.players[0].online=false;assert.equal(visibleCourtDraft(s,d,12000),null);
});
test('submissions, turn rotation, deletion and Figure guesses never leave stale text',()=>{
 const s=state(),d={a:{game:'match',round:2,text:'Blue whale',editedAt:11000}};
 const first=answerTurn(s).key;s.deadline=40000;assert.notEqual(answerTurn(s).key,first);assert.equal(visibleCourtDraft(s,d,23000),null);
 s.stage='survey';assert.equal(visibleCourtDraft(s,d,23000),null);s.stage='fast';assert.equal(answerTurn(s),null);s.variant='figure';assert.equal(answerTurn(s),null);
 s.variant='clash';s.stage='control';d.a.editedAt=23000;d.a.text='';assert.equal(visibleCourtDraft(s,d,23000).text,'');
});
test('Fast Money projects one cursor only, never the first runner’s other four drafts or the isolated second runner',()=>{
 const s={...state(),stage:'fast'},secret={fastDraft:{a:{pass:0,cursor:2,values:['hidden 1','hidden 2','Current answer','hidden 4','hidden 5']}}};
 const live=fastLiveAnswer(s,secret,'spectator',12000);assert.equal(live.text,'Current answer');assert.ok(!JSON.stringify(live).includes('hidden'));
 assert.equal(fastLiveAnswer(s,secret,'b',12000),null);assert.equal(visibleFastDraft(s,live,'b'),null);assert.equal(visibleFastDraft(s,live,'spectator').text,'Current answer');
 s.fastPass=1;s.turn='b';assert.equal(visibleFastDraft(s,live,'spectator'),null);secret.fastDraft.b={pass:1,cursor:0,values:['Second','','','','']};assert.equal(fastLiveAnswer(s,secret,'a',13000).text,'Second');
 s.stage='fastReview';assert.equal(fastLiveAnswer(s,secret,'a',14000),null);
});
test('the isolated runner hears no first-run question, answer, or score',()=>{
 const s={...state(),stage:'fast',fastPass:0};const cue=hostCue(s,'b',12000,{cursor:3},3);assert.equal(cue.silent,true);assert.ok(!cue.text.includes(CLASH_BOARDS[3].prompt));
 s.stage='fastFirstReview';assert.equal(hostCue(s,'b',12000,{rows:[{label:'PRIVATE',points:99}]}).silent,true);
 s.stage='fast';s.fastPass=1;assert.equal(hostCue(s,'b',12000,{cursor:3},3).text,CLASH_BOARDS[3].prompt);
});
test('voice waits for a user gesture, mouth follows audio events, mute cancels, and hidden pages stop',()=>{
 const old={document:globalThis.document,speechSynthesis:globalThis.speechSynthesis,SpeechSynthesisUtterance:globalThis.SpeechSynthesisUtterance};
 const doc=Object.assign(new EventTarget(),{hidden:false}),spoken=[],mouth=[];let cancels=0;
 globalThis.document=doc;globalThis.speechSynthesis={cancel(){cancels++;},resume(){},getVoices:()=>[],speak:u=>spoken.push(u)};globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 let v;try{v=new HostVoice(x=>mouth.push(x));v.cue({key:'1',text:'Court is in session.'});assert.equal(spoken.length,0);v.unlock();assert.equal(spoken.length,1);assert.equal(mouth.at(-1),false);spoken[0].onstart();assert.equal(mouth.at(-1),true);spoken[0].onend();assert.equal(mouth.at(-1),false);
 v.cue({key:'2',text:'Next question.'});assert.equal(spoken.length,2);v.setEnabled(false);spoken[1].onstart();assert.equal(mouth.at(-1),false,'stale speech events cannot restart the mouth');v.cue({key:'3',text:'Latest.'});assert.equal(spoken.length,2);v.setEnabled(true);assert.equal(spoken.at(-1).text,'Latest.');doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(mouth.at(-1),false);assert.ok(cancels>=4);
 }finally{v?.dispose();Object.assign(globalThis,old);}
});
