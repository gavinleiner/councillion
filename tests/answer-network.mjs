// Two independent Google-provider clients exercise the actual host matcher.
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PartySession} from '../party.js';
import {partyPack} from '../engine.js';
import {loadQuestionData} from '../question-data.js';
import {ANSWER_MATCHING_VERSION} from '../answer-matching.js';
import {QUESTION_QUALITY_BUILD} from '../question-quality.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}}),sessions=[],errors={};
async function wait(fn,label){const end=Date.now()+30000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,25));}throw Error(label+' '+JSON.stringify(errors));}
function client(uid){errors[uid]=[];const c={...sdk,db:env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'}}).database()},s=new PartySession(()=>{},e=>errors[uid].push(e),()=>({id:uid,expires:Date.now()/1000+3600}),async()=>({uid}),async()=>c);sessions.push(s);return s;}
try{
 await env.clearDatabase();const host=client('answerhost'),friend=client('answerfriend'),old=client('oldmatcher');
 await host.create('Host',{isPrivate:true,mode:'ranked',maxPlayers:2});assert.ok(host.meta.catalogBuild.includes('-'+ANSWER_MATCHING_VERSION+'-'));assert.ok(host.meta.catalogBuild.endsWith(QUESTION_QUALITY_BUILD));
 await friend.join('Friend',host.code);await wait(()=>host.connected&&friend.connected&&host.state.players.length===2,'roster');host.start();await wait(()=>friend.state.phase==='playing','playing');
 for(const s of [host,friend])clearInterval(s.timer);
 host.state.packIds=['fun-minecraft'];host.state.round=1;host.state.turn=0;host.state.deadline=Date.now()+600000;await loadQuestionData([partyPack(host.state)]);await host.broadcast();await wait(()=>friend.state.packIds[0]==='fun-minecraft'&&friend.state.turn===0,'same bank');
 for(const typed of ['DS','diamond pizza']){const before=errors.answerhost.length;host.submit(typed);await wait(()=>errors.answerhost.length>before,'reject '+typed);assert.equal(host.state.turn,0);assert.equal(host.state.players[0].answers,0);}
 host.submit('dimond swrod');await wait(()=>friend.state.turn===1,'corrected answer passes');assert.equal(friend.state.players[0].lastAnswer.label,'Diamond Sword');
 friend.submit('Diamond Sword');await wait(()=>errors.answerfriend.some(e=>e.includes('Already')),'canonical duplicate');assert.equal(host.state.turn,1);
 friend.submit('Iron Sword');await wait(()=>host.state.turn===0,'exact answer passes');assert.equal(host.state.players[1].lastAnswer.label,'Iron Sword');
 // A new client cannot join an old matcher and get different acceptance rules.
 await env.withSecurityRulesDisabled(c=>sdk.update(sdk.ref(c.database(),'rooms/'+host.code+'/meta'),{catalogBuild:host.meta.catalogBuild.replace('-'+ANSWER_MATCHING_VERSION,'')}));
 await assert.rejects(old.join('Older Room',host.code),/answer update/);
 console.log('Answer network passes: two Google clients, shared matcher version, initials and unrelated-word rejection, canonical correction, duplicate protection, valid pass, old-matcher room rejection.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
