import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {get,ref,set,update} from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}});
const host=env.authenticatedContext('host',{firebase:{sign_in_provider:'google.com'}}).database();
const member=env.authenticatedContext('member',{firebase:{sign_in_provider:'google.com'}}).database();
const guest=env.authenticatedContext('joining',{firebase:{sign_in_provider:'google.com'}}).database();
const owner=env.authenticatedContext('owner',{email:'gavin@theleiners.com',email_verified:true,firebase:{sign_in_provider:'google.com'}}).database();
const person=name=>({name,buddy:'krill',protocol:4,joinedAt:Date.now(),lastSeen:Date.now(),online:true,ready:true,autoJoin:false});
const room=mode=>({meta:{host:'host',hostName:'Counsel',version:3,protocol:4,game:mode,createdAt:Date.now(),isPrivate:false,seats:6,phase:'lobby'},members:{host:person('Counsel'),member:person('Witness')},state:{variant:mode,phase:'lobby',stage:'lobby',players:[{id:'host',name:'Counsel'}],settings:{maxPlayers:6},round:0,revision:0}});
const directory=game=>({hostName:'Counsel',count:2,seats:6,phase:'lobby',updatedAt:Date.now(),game});
const request=()=>({id:'ready-test',type:'ready',at:Date.now()});
try{
 await env.clearDatabase();
 await assertFails(set(ref(host,'rooms/OATH'),room('oath')));
 const disguised=room('figure');disguised.state.variant='oath';
 await assertFails(set(ref(host,'rooms/OATB'),disguised));
 await env.withSecurityRulesDisabled(async c=>{await set(ref(c.database(),'rooms/OATH'),room('oath'));});
 await assertFails(set(ref(guest,'rooms/OATH/members/joining'),person('Joining')));
 await assertFails(set(ref(member,'rooms/OATH/requests/member'),request()));
 for(const path of ['meta','state','members/member','responses/member','requests/member'])await assertFails(get(ref(member,'rooms/OATH/'+path)));
 await assertFails(update(ref(host,'rooms/OATH/state'),{revision:1,stage:'oath-intro',phase:'playing'}));
 await assertFails(set(ref(host,'directory/OATH'),directory('oath')));
 await assertFails(set(ref(host,'directory/OATH'),directory('figure')));
 await env.withSecurityRulesDisabled(async c=>{await set(ref(c.database(),'directory/OATH'),directory('oath'));});
 await assertSucceeds(set(ref(host,'directory/OATH'),null));
 await assertSucceeds(get(ref(owner,'ownerPreviews/oath')));
 await assertFails(get(ref(member,'ownerPreviews/oath')));
 for(const claims of [{email:'gavin@theleiners.com',email_verified:false,firebase:{sign_in_provider:'google.com'}},{email:'gavin@theleiners.com',email_verified:true,firebase:{sign_in_provider:'password'}},{email:'logan.lewis2@student.nhcs.net',email_verified:true,firebase:{sign_in_provider:'google.com'}}])await assertFails(get(ref(env.authenticatedContext('spoof',claims).database(),'ownerPreviews/oath')));
 const privateRoom=room('oath');privateRoom.meta.host='owner';privateRoom.meta.isPrivate=true;privateRoom.members={owner:person('Gavin')};
 await assertSucceeds(set(ref(owner,'rooms/OWNR'),privateRoom));
 await assertSucceeds(get(ref(owner,'rooms/OWNR/state')));
 await assertFails(get(ref(member,'rooms/OWNR/meta')));
 await assertFails(set(ref(guest,'rooms/OWNR/members/joining'),person('Joining')));
 await assertFails(update(ref(owner,'rooms/OWNR/meta'),{isPrivate:false}));
 await assertFails(set(ref(owner,'directory/OWNR'),directory('oath')));
 for(const [mode,code]of [['party','PART'],['clash','CLAS'],['figure','FIGR'],['docket','DOCK']]){
  await assertSucceeds(set(ref(host,'rooms/'+code),room(mode)));
  await assertSucceeds(set(ref(guest,'rooms/'+code+'/members/joining'),person('Joining')));
  await assertSucceeds(set(ref(member,'rooms/'+code+'/requests/member'),request()));
  await assertSucceeds(update(ref(host,'rooms/'+code+'/state'),{revision:1}));
  await assertSucceeds(set(ref(host,'directory/'+code),directory(mode)));
  assert.equal((await get(ref(host,'rooms/'+code+'/state/revision'))).val(),1);
 }
 console.log('PASS: only the verified Google owner can read the preview marker or open a private Oath room; guests, members, unverified owner, wrong provider and VP denied. Non-owner reads, joins and actions denied. Oath cannot be public. Other four games still work.');
}finally{await env.cleanup();}
