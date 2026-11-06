import test from 'node:test';
import assert from 'node:assert/strict';
import {COMING_SOON_GAMES,isGameAvailable} from '../game-availability.js';
import {CourtGameSession,listCourtRooms} from '../court-games-session.js';

test('Under Oath rejects hosting, invites and actions before account or cloud access',async()=>{
 let access=0;
 const session=new CourtGameSession({mode:'oath',identity:()=>null,authorize:async()=>{access++;},getCloud:async()=>{access++;}});
 try{
  assert.deepEqual(COMING_SOON_GAMES,['oath']);
  await assert.rejects(session.create('Counsel'),/coming soon/i);
  await assert.rejects(session.join('Counsel','ABCD'),/coming soon/i);
  await assert.rejects(session.request('start'),/coming soon/i);
  assert.equal(access,0);
  let rooms=null;const unsubscribe=await listCourtRooms({},'oath',value=>rooms=value);
  assert.deepEqual(rooms,[]);unsubscribe();
  assert.ok(['party','clash','figure','docket'].every(isGameAvailable));
 }finally{await session.close();}
});
