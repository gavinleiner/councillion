import test from 'node:test';
import assert from 'node:assert/strict';
import {COMING_SOON_GAMES,isGameAvailable,isGameEntryAvailable} from '../game-availability.js';
import {CourtGameSession,listCourtRooms} from '../court-games-session.js';

test('Under Oath is public while hosting and joining still require Google authorization',async()=>{
 let auth=0,cloud=0;
 const session=new CourtGameSession({mode:'oath',identity:()=>null,authorize:async()=>{auth++;throw Error('Sign in with Google');},getCloud:async()=>{cloud++;}});
 try{
  assert.deepEqual(COMING_SOON_GAMES,['deep']);
  for(const identity of [null,{role:'player'},{role:'super_admin',expires:Date.now()/1000+3600}]){
   assert.equal(isGameAvailable('oath',identity),true);assert.equal(isGameEntryAvailable('oath',identity),true);
  }
  await assert.rejects(session.create('Counsel'),/Sign in with Google/);
  await assert.rejects(session.join('Counsel','ABCD'),/Sign in with Google/);
  await assert.rejects(session.request('start'),/Reconnect/);
  assert.equal(auth,2);assert.equal(cloud,0);
  let rooms=null,queried=false;const unsubscribe=await listCourtRooms({db:{},ref:(_,p)=>p,query:p=>p,orderByChild:()=>{},limitToLast:()=>{},onValue:(path,cb)=>{assert.equal(path,'directory');queried=true;cb({val:()=>null});return ()=>{};}},'oath',value=>rooms=value);
  assert.deepEqual(rooms,[]);unsubscribe();
  assert.equal(queried,true);
  assert.ok(['party','clash','figure','docket'].every(isGameAvailable));
 }finally{await session.close();}
});
