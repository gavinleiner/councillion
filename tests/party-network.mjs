// Real RTDB emulator connections, with separate Google-provider identities.
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PartySession} from '../party.js';
import {partyPack} from '../engine.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}});
const sessions=[],errors={};
const wait=async(predicate,label,timeout=15000)=>{const until=Date.now()+timeout;while(Date.now()<until){if(await predicate())return;await new Promise(r=>setTimeout(r,25));}throw Error('Timed out: '+label+' · '+JSON.stringify(errors));};
function client(uid){errors[uid]=[];const db=env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'}}).database();const c={...sdk,db};const session=new PartySession(()=>{},message=>errors[uid].push(message),()=>({id:uid,expires:Date.now()/1000+3600}),async()=>({uid}),async()=>c);sessions.push(session);return session;}
try{
 await env.clearDatabase();const host=client('host'),friend=client('friend'),watcher=client('watcher');
 await host.create('Host',{buddy:'krill',isPrivate:false});await wait(()=>host.connected,'host connection');
 await friend.join('Friend',host.code,{buddy:'squid'});await wait(()=>host.state.players.length===2&&friend.state?.players.length===2,'two-player roster');
 assert.equal(host.state.players.find(p=>p.id==='friend').name,'Friend');await wait(async()=>(await sdk.get(sdk.ref(host.c.db,'directory/'+host.code))).exists(),'public room appears in directory');
 host.rules({lives:1,minTurnMs:4000});await wait(()=>friend.state.settings.lives===1,'host rules synchronize');
 host.start();await wait(()=>friend.state.phase==='playing','three-second countdown and first turn');
 host.state.deadline=Date.now()+600000;await host.broadcast();
 const firstQuestion=partyPack(host.state).id;
 const answer=partyPack(host.state).answers[0];host.submit(answer.label);await wait(()=>friend.state.players[friend.state.turn]?.id==='friend','pass to friend');
 assert.equal(friend.state.players.find(p=>p.id==='host').lastAnswer.label,answer.label);
 friend.submit(answer.aliases[0]??answer.label);await wait(()=>errors.friend.some(e=>e.includes('Already')),'canonical duplicate rejection');
 const next=partyPack(friend.state).answers[1];friend.submit(next.label);await wait(()=>host.state.players[host.state.turn]?.id==='host','pass back to host');
 const beforeHearts=host.state.players.map(p=>p.hearts);host.voteQuestion();await wait(()=>friend.state.skipVotes?.length===1,'first fresh-category vote');friend.voteQuestion();await wait(()=>host.state.phase==='burst','room agrees to fresh category');assert.deepEqual(host.state.players.map(p=>p.hearts),beforeHearts);await wait(()=>friend.state.phase==='playing'&&friend.state.round===2,'new unseen category after vote');assert.notEqual(partyPack(host.state).id,firstQuestion);host.state.deadline=Date.now()+600000;await host.broadcast();
 await watcher.join('Watcher',host.code,{buddy:'angler'});await wait(()=>host.state.players.some(p=>p.id==='watcher')&&watcher.state?.players.some(p=>p.id==='watcher'),'spectator join');assert.equal(host.state.players.find(p=>p.id==='watcher').hearts,0);assert.equal(watcher.state.players.find(p=>p.id==='watcher').spectator,true);
 await friend.sendChat('A private test message');await wait(()=>host.chat.some(m=>m.text==='A private test message'),'chat delivery');assert.equal(host.chat.find(m=>m.text==='A private test message').uid,'friend');
 await host.visibility(true);await wait(()=>friend.meta.isPrivate,'visibility synchronization');await wait(async()=>!(await sdk.get(sdk.ref(host.c.db,'directory/'+host.code))).exists(),'private room removed from directory');
 // Force an imminent fuse in this isolated emulator room to exercise a loss and rematch.
 host.state.deadline=Date.now()-1;await host.broadcast();await wait(()=>friend.state.phase==='ended','pop and last-player victory');assert.equal(friend.state.winner,'friend');
 await friend.ready(true);await watcher.ready(true);await wait(()=>host.state.players.find(p=>p.id==='friend')?.ready&&host.state.players.find(p=>p.id==='watcher')?.ready,'both players ready for rematch');host.start();await wait(()=>friend.state.phase==='playing','rematch starts');assert.ok(friend.state.players.some(p=>p.id==='watcher'&&p.hearts===1));assert.ok(!host.state.packIds.includes(firstQuestion),'rematch must exclude already seen category');
 await host.close(false);await env.withSecurityRulesDisabled(c=>sdk.update(sdk.ref(c.database(),'rooms/'+host.code+'/members/host'),{online:false,lastSeen:Date.now()-31000}));await wait(()=>friend.host||watcher.host,'host migration');
 const successor=friend.host?friend:watcher;assert.notEqual(successor.meta.host,'host');assert.equal(successor.meta.host,successor.myId);
 const removed=successor.myId==='friend'?watcher:friend;successor.kick(removed.myId);await wait(()=>successor.state.players.find(p=>p.id===removed.myId)?.connected===false,'host removes a player');
 await new Promise(r=>setTimeout(r,500));const revision=successor.state.revision;await new Promise(r=>setTimeout(r,750));assert.equal(successor.state.revision,revision,'a removed member must not cause repeated state writes');
 const other=client('host');await other.create('Host New Room',{isPrivate:true});await wait(()=>other.connected,'fresh room connection');assert.ok(!other.state.packIds.includes(firstQuestion),'new room remembers browser/account history');await other.close();
 console.log('Party network flow passed: host, rules, countdown, answers, duplicate rejection, spectator, chat, private directory, pop, rematch, host migration, removal without repeated writes.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
