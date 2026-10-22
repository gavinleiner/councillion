import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,set,update,get,serverTimestamp} from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}});
const user=(id,provider='google.com')=>env.authenticatedContext(id,{firebase:{sign_in_provider:provider}}).database();
const host=user('host'),friend=user('friend'),outsider=user('outsider'),anonymous=env.unauthenticatedContext().database(),password=user('password','password');
const member=name=>({name,buddy:'krill',joinedAt:Date.now(),lastSeen:Date.now(),online:true,ready:true,autoJoin:false});
const room={meta:{host:'host',hostName:'Host',version:3,createdAt:Date.now(),isPrivate:false,seats:6,phase:'lobby'},members:{host:member('Host')},state:{phase:'lobby',players:[{id:'host',name:'Host'}],settings:{lives:2},round:0,revision:0}};
let checks=0;const denied=async p=>{await assertFails(p);checks++;},allowed=async p=>{await assertSucceeds(p);checks++;};
try{
 await env.clearDatabase();await denied(get(ref(anonymous,'directory')));await denied(set(ref(anonymous,'rooms/TEST'),room));await denied(set(ref(password,'rooms/TEST'),room));
 await allowed(set(ref(host,'rooms/TEST'),room));await denied(set(ref(outsider,'rooms/TEST'),room));await allowed(get(ref(friend,'rooms/TEST/meta')));await denied(get(ref(friend,'rooms/TEST/state')));await denied(get(ref(friend,'rooms/TEST/members')));
 await denied(set(ref(friend,'rooms/TEST/members/host'),member('Fake Host')));await allowed(set(ref(friend,'rooms/TEST/members/friend'),member('Friend')));await allowed(get(ref(friend,'rooms/TEST/state')));
 await denied(set(ref(friend,'rooms/TEST/state/turn'),1));await denied(set(ref(friend,'rooms/TEST/meta/host'),'friend'));await denied(set(ref(friend,'rooms/TEST/responses/host'),{error:'fake'}));

 // Exercise the database directly: a modified browser cannot bypass the filter.
 for(const name of ['NIGGER','n1gg3r','n.i.g.g.a','n i g g e r','f4gg0t','N4Z1','ni\u200bgger','nіggеr']){
  await denied(set(ref(friend,'rooms/TEST/members/friend/name'),name));
  await denied(set(ref(host,'rooms/TEST/meta/hostName'),name));
  await denied(set(ref(host,'rooms/TEST/state/players/0/name'),name));
  await denied(set(ref(host,'directory/TEST'),{hostName:name,count:2,seats:6,phase:'lobby',updatedAt:Date.now()}));
 }
 for(const name of ['Scunthorpe','Class Act','Niger','Counsel_42'])await allowed(set(ref(friend,'rooms/TEST/members/friend/name'),name));
 await allowed(set(ref(friend,'rooms/TEST/members/friend/name'),'Friend'));
 await denied(update(ref(friend,'rooms/TEST'),{'chat/abuse':{uid:'friend',name:'Friend',text:'you f4gg0t',at:serverTimestamp()},'members/friend/lastChat':serverTimestamp()}));
 await allowed(set(ref(friend,'rooms/TEST/requests/friend'),{id:'request-1',type:'answer',text:'example',at:Date.now()}));await denied(set(ref(friend,'rooms/TEST/requests/host'),{id:'request-2',type:'answer',at:Date.now()}));await allowed(get(ref(host,'rooms/TEST/requests')));await denied(get(ref(outsider,'rooms/TEST/requests/friend')));
 await allowed(set(ref(host,'directory/TEST'),{hostName:'Host',count:2,seats:6,phase:'lobby',updatedAt:Date.now()}));await allowed(get(ref(friend,'directory')));await denied(set(ref(friend,'directory/TEST/count'),0));
 await allowed(update(ref(friend,'rooms/TEST'),{'chat/message1':{uid:'friend',name:'Friend',text:'Testing with a friend',at:serverTimestamp()},'members/friend/lastChat':serverTimestamp()}));
 await denied(set(ref(friend,'rooms/TEST/members/friend/lastChat'),0));
 await env.withSecurityRulesDisabled(async c=>set(ref(c.database(),'rooms/TEST/members/friend/lastChat'),Date.now()+60000));
 await denied(set(ref(friend,'rooms/TEST/chat/message2'),{uid:'friend',name:'Friend',text:'Too fast',at:Date.now()}));
 await denied(set(ref(friend,'rooms/TEST/chat/fake'),{uid:'host',name:'Host',text:'Impersonated',at:Date.now()}));
 await denied(set(ref(friend,'rooms/TEST/chat/fakesystem'),{uid:'friend',name:'Friend',text:'Fake system',at:Date.now(),system:true}));
 await allowed(set(ref(host,'rooms/TEST/meta/isPrivate'),true));await denied(set(ref(host,'directory/TEST'),{hostName:'Host',count:2,seats:6,phase:'lobby',updatedAt:Date.now()}));await allowed(set(ref(host,'directory/TEST'),null));
 await allowed(update(ref(host,'rooms/TEST/members/host'),{online:false,lastSeen:Date.now()-31000}));await allowed(set(ref(friend,'rooms/TEST/meta/host'),'friend'));await allowed(set(ref(friend,'rooms/TEST/state/round'),1));await denied(set(ref(host,'rooms/TEST/state/round'),2));
 assert.ok(checks>=30);console.log(`${checks} database authorization checks passed.`);
}finally{await env.cleanup();}
