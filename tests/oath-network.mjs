import {isGameAvailable} from '../game-availability.js';
if(!isGameAvailable('oath')){await import('./game-availability-network.mjs');process.exit(0);}
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {CourtGameSession} from '../court-games-session.js';
import {OATH_BY_ID} from '../oath-data.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}}),sessions=[],errors={};
const wait=async(fn,label,ms=20000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,25));}throw Error(label+': '+JSON.stringify(errors));};
function client(uid){errors[uid]=[];const db=env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'}}).database(),c={...sdk,db};const session=new CourtGameSession({mode:'oath',identity:()=>({id:uid,uid,expires:Date.now()/1000+3600}),authorize:async()=>({uid}),getCloud:async()=>c,onError:m=>errors[uid].push(m)});sessions.push(session);return session;}
async function send(s,action,p={}){const old=s.lastAck;await s.request(action,p);await wait(()=>s.lastAck!==old,action+' ack');return s.lastResult;}
async function expire(h){await h.enqueue(async()=>{h.state.deadline=h.now()-1;await h.broadcast();});}
try{
 await env.clearDatabase();const crew=Array.from({length:6},(_,i)=>client('oath'+i));let h=crew[0];await h.create('Counsel','krill',false);for(let i=1;i<crew.length;i++)await crew[i].join('Witness '+i,h.code,['squid','angler','schooler','evil'][i%4]);await wait(()=>crew.every(s=>s.connected&&s.state?.players.length===6),'six witnesses');
 const outsider=env.authenticatedContext('outsider',{firebase:{sign_in_provider:'google.com'}}).database(),guest=env.unauthenticatedContext().database();for(const db of [outsider,guest])await assertFails(sdk.get(sdk.ref(db,'rooms/'+h.code+'/state')));
 await send(h,'start');await expire(h);await wait(()=>h.state.stage==='oath-read','case opened');await expire(h);await wait(()=>crew.every(s=>s.state?.stage==='oath-write'),'all clients writing');
 await send(crew[1],'oath-bluff',{text:'Private witness testimony'});await wait(()=>crew[1].response.oath?.text==='Private witness testimony','own private receipt');assert.ok(!JSON.stringify(crew[2].state).includes('Private witness testimony'));assert.ok(!JSON.stringify(crew[2].response).includes('Private witness testimony'));
 await assertFails(sdk.get(sdk.ref(crew[2].c.db,'rooms/'+h.code+'/responses/oath1')));await assertFails(sdk.get(sdk.ref(crew[2].c.db,'rooms/'+h.code+'/requests/oath1')));
 const q=OATH_BY_ID.get(h.state.case.id);await send(crew[2],'oath-bluff',{text:q.answer});for(const i of [0,3,4,5])await send(crew[i],'oath-bluff',{text:'Bluff number '+i});
 await expire(h);await wait(()=>h.state.stage==='oath-shuffle','shuffle');assert.ok(!h.state.choices.length);await expire(h);await wait(()=>crew.every(s=>s.state?.stage==='oath-vote'),'all clients voting');await wait(()=>crew[1].response.oath?.ownChoices?.length,'own option projection');
 assert.ok(h.state.choices.every(o=>Object.keys(o).sort().join(',')==='id,text'));const own=Object.values(crew[1].response.oath.ownChoices)[0];assert.ok((await send(crew[1],'oath-vote',{choice:own})).error.includes('own lie'));const truth=h.secret.oath.options.find(o=>o.kind==='truth').id;await send(crew[1],'oath-vote',{choice:truth});assert.equal(crew[1].response.oath.selection,truth);assert.ok(!JSON.stringify(crew[3].response).includes(truth),'unvoted player receives no vote choice');
 const before=JSON.parse(JSON.stringify(h.secret.oath));const code=h.code;await h.close();h=crew[1];await wait(()=>h.host&&h.refereeReady,'referee handoff');assert.equal(h.secret.oath.votes.oath1,truth);assert.equal(h.secret.oath.submissions.oath2.knows,true);assert.deepEqual(h.secret.oath.deck,before.deck);
 await expire(h);await wait(()=>h.state.stage==='oath-reveal','reveal');assert.equal(h.state.revealed.length,0);for(let i=0;i<7;i++){if(h.state.stage!=='oath-reveal')break;await expire(h);await wait(()=>h.state.revealed.length>i||h.state.stage!=='oath-reveal','progressive reveal '+i);}
 while(h.state.stage==='oath-reveal'){await expire(h);await new Promise(r=>setTimeout(r,300));}assert.equal(h.state.stage,'oath-standings');assert.equal(h.state.players.find(p=>p.id==='oath1').score,1000);assert.equal(h.state.players.find(p=>p.id==='oath2').score,1000);assert.ok(!errors.oath1.some(e=>/unavailable|permission|denied/i.test(e)));
 console.log('PASS: six authenticated clients, protected submissions/requests, public anonymous choices, private votes, rejected self-vote, referee transfer, progressive truth reveal and authoritative scoring.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
