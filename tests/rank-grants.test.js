import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyCareer,applyRankGrant,rankFor,RANKS,careerFromReceipts,RANK_SEASON} from '../party-career.js';
import {nameBadges} from '../party-badges.js';
import {leaderboardRows} from '../party-leaderboard.js';

const grant={version:1,rank:'highest',at:1000};
test('a highest-rank grant bypasses placements and equips the current top image without inventing results',()=>{
 const base=emptyCareer(),career=applyRankGrant(base,grant),rank=rankFor(career);
 assert.equal(rank.id,RANKS.at(-1).id);assert.equal(rank.placed,true);assert.equal(career.rating,RANKS.at(-1).min);assert.equal(career.earnedRating,0);assert.equal(career.wins,0);assert.equal(career.ranked,0);assert.equal(career.answers,0);assert.deepEqual(career.records,[]);assert.deepEqual(base,emptyCareer());assert.match(nameBadges({},career),/rank-court/);
 assert.match(leaderboardRows([{id:'gift',name:'Gift',career}],null),/HIGH COURT/);
});
test('the rank floor is reapplied after match updates; genuine higher ratings remain higher',()=>{
 const rows={loss:{version:1,game:'loss',at:2000,ratingSeason:RANK_SEASON,rated:true,counted:true,win:false,delta:-18}};
 const after=applyRankGrant(careerFromReceipts(rows),grant);assert.equal(rankFor(after).id,RANKS.at(-1).id);assert.equal(after.losses,1);assert.equal(after.rating,RANKS.at(-1).min);
 assert.equal(applyRankGrant({...emptyCareer(),rating:1900},grant).rating,1900);
 const top=RANKS.at(-1),before=top.min;try{top.min=2100;assert.equal(applyRankGrant(emptyCareer(),grant).rating,2100);}finally{top.min=before;}
});
test('ordinary players and invalid grants retain the original placement/rating behavior',()=>{
 const career=emptyCareer();for(const value of [null,{}, {...grant,version:2},{...grant,rank:'bronze'},{...grant,at:0},{...grant,at:Infinity}])assert.equal(applyRankGrant(career,value),career);
 assert.equal(rankFor(career).placed,false);assert.equal(rankFor({...career,ranked:5}).id,'bronze');
});
