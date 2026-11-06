import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {get,ref,set,update} from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}});
const host=env.authenticatedContext('host',{firebase:{sign_in_provider:'google.com'}}).database();
const member=env.authenticatedContext('member',{firebase:{sign_in_provider:'google.com'}}).database();
const guest=env.authenticatedContext('joining',{firebase:{sign_in_provider:'google.com'}}).database();
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
 await assertFails(update(ref(host,'rooms/OATH/state'),{revision:1,stage:'oath-intro',phase:'playing'}));
 await assertFails(set(ref(host,'directory/OATH'),directory('oath')));
 await assertFails(set(ref(host,'directory/OATH'),directory('figure')));
 await env.withSecurityRulesDisabled(async c=>{await set(ref(c.database(),'directory/OATH'),directory('oath'));});
 await assertSucceeds(set(ref(host,'directory/OATH'),null));
 for(const [mode,code]of [['party','PART'],['clash','CLAS'],['figure','FIGR'],['docket','DOCK']]){
  await assertSucceeds(set(ref(host,'rooms/'+code),room(mode)));
  await assertSucceeds(set(ref(guest,'rooms/'+code+'/members/joining'),person('Joining')));
  await assertSucceeds(set(ref(member,'rooms/'+code+'/requests/member'),request()));
  await assertSucceeds(update(ref(host,'rooms/'+code+'/state'),{revision:1}));
  await assertSucceeds(set(ref(host,'directory/'+code),directory(mode)));
  assert.equal((await get(ref(host,'rooms/'+code+'/state/revision'))).val(),1);
 }
 console.log('PASS: old-client Oath creation, joining, actions, state and directory writes denied; Party, Clash, Figure and Docket still work.');
}finally{await env.cleanup();}
