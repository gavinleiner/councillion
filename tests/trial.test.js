import test from 'node:test';
import assert from 'node:assert/strict';
import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame,GAME_MODES} from '../court-games-engine.js';
import {trialReceipt,normalizeTrial,validTrialSettings} from '../trial-engine.js';
import {TRIAL_QUESTIONS,TRIAL_GAME_IDS,TRIAL_ESCAPE_SETS,escapeDraw,trialDeck,TRIAL_BY_ID} from '../trial-data.js';
import {TrialPreviewSession,trialSeed} from '../trial-preview.js';
import {courtFocusEligible} from '../fair-play.js';
import {enforceCourtFocus} from '../court-focus.js';
const roster=n=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'Counsel '+i,buddy:'krill',ready:true,online:true,connected:true}));
function fixture(n=4){const s=createCourtGame('trial',roster(n)),secret={};startCourtGame(s,1000,trialSeed(38117),secret);tickCourtGame(s,secret,s.deadline);return {s,secret,ref:secret.trial};}
const send=(f,id,action,p={},now=f.s.stageAt+100)=>actCourtGame(f.s,f.secret,id,action,{matchId:f.s.matchId,round:f.s.round,stageAt:f.s.stageAt,...p},now);
const due=f=>tickCourtGame(f.s,f.secret,f.s.deadline);
function challenge(kind){const f=fixture();f.ref.challengeDeck=[kind];for(let i=0;i<4;i++)send(f,'p'+i,'trial-answer',{choice:i<2?f.s.question.options.find(o=>o.id!==f.ref.correct).id:f.ref.correct});due(f);due(f);due(f);if(f.s.stage==='trial-watch')due(f);assert.equal(f.s.stage,'trial-challenge');assert.equal(f.s.challenge.kind,kind);return f;}
test('Trial by Puffer admits 2–8 ready counsel and rejects invalid starts/settings',()=>{
 assert.equal(GAME_MODES.trial.seats,8);for(const n of [1,9])assert.throws(()=>startCourtGame(createCourtGame('trial',roster(n)),1000,Math.random,{}),/two to eight/);
 const s=createCourtGame('trial',roster(3));s.players[1].ready=false;assert.throws(()=>startCourtGame(s,1000,Math.random,{}),/ready/);
 assert.throws(()=>validTrialSettings({seconds:1}),/listed/);assert.throws(()=>validTrialSettings({cheat:true}),/listed/);
});
test('source-backed trivia has four distinct choices, eight subjects and non-repeating draws',()=>{
 assert.ok(TRIAL_QUESTIONS.length>=600);assert.ok(new Set(TRIAL_QUESTIONS.map(q=>q.subject)).size>=8);const f=fixture();
 assert.equal(new Set(f.ref.deck).size,f.ref.deck.length);assert.equal(f.s.question.options.length,4);assert.equal(new Set(f.s.question.options.map(o=>o.text)).size,4);
 assert.ok(!Object.hasOwn(f.s.question,'correct'));assert.ok(!Object.hasOwn(f.s.question,'answer'));assert.ok(TRIAL_QUESTIONS.every(q=>q.source?.startsWith('https://')));
});
test('sealed trivia is idempotent and cannot accept stale, forged or late actions',()=>{
 const f=fixture(),old={matchId:f.s.matchId,round:f.s.round,stageAt:f.s.stageAt};send(f,'p0','trial-answer',{choice:f.ref.correct});assert.equal(send(f,'p0','trial-answer',{choice:'99'}).duplicate,true);
 assert.throws(()=>send(f,'p1','trial-answer',{choice:'99'}),/listed/);assert.throws(()=>send(f,'p1','trial-answer',{matchId:'old',choice:'0'}),/earlier/);assert.throws(()=>send(f,'p1','trial-answer',{choice:'0'},f.s.deadline),/ended/);
 due(f);assert.throws(()=>actCourtGame(f.s,f.secret,'p1','trial-answer',{...old,choice:'0'},f.s.stageAt+1),/earlier/);
});
test('ghosts continue earning cash; only wrong living counsel face a trial',()=>{
 const f=fixture();f.s.players[0].alive=false;send(f,'p0','trial-answer',{choice:f.ref.correct});send(f,'p1','trial-answer',{choice:f.s.question.options.find(o=>o.id!==f.ref.correct).id});send(f,'p2','trial-answer',{choice:f.ref.correct});send(f,'p3','trial-answer',{choice:f.ref.correct});due(f);
 assert.equal(f.s.players[0].cash,2000);assert.deepEqual(f.s.atRisk,['p1']);assert.equal(f.s.players[0].alive,false);
});
test('memory evidence disappears and private sequence receipts never leak other players',()=>{
 const f=challenge('memory');assert.deepEqual(f.s.challenge.pattern,[]);send(f,'p0','trial-play',{sequence:f.ref.pattern});assert.deepEqual(trialReceipt(f.s,f.secret,'p0').sequence,f.ref.pattern);assert.deepEqual(trialReceipt(f.s,f.secret,'p1').sequence,[]);
 send(f,'p1','trial-play',{sequence:Array(f.ref.pattern.length).fill(0)});due(f);assert.equal(f.s.players[0].alive,true);assert.equal(f.s.players[1].alive,false);assert.deepEqual(f.s.challenge.solution,f.ref.pattern);
});
test('math grades authoritative tasks, penalizes mistakes and rejects answer spam',()=>{
 const f=challenge('maths');for(let i=0;i<3;i++){const e=f.ref.entries.p0??{index:0};send(f,'p0','trial-play',{index:e.index,choice:f.ref.math[e.index].correct},f.s.stageAt+100+i*400);}
 assert.equal(trialReceipt(f.s,f.secret,'p0').score,3);assert.equal(send(f,'p0','trial-play',{index:3,choice:'0'},f.s.stageAt+1000).cooldown,true);
 assert.equal(send(f,'p0','trial-play',{index:0,choice:'0'},f.s.stageAt+1500).stale,true);due(f);assert.equal(f.s.players[0].alive,true);assert.equal(f.s.players[1].alive,false);
});
test('poison locks during the briefing and cannot chase a submitted drink',()=>{
 const f=fixture(6);f.ref.challengeDeck=['cups'];for(let i=0;i<6;i++)send(f,'p'+i,'trial-answer',{choice:i<2?f.s.question.options.find(o=>o.id!==f.ref.correct).id:f.ref.correct});due(f);due(f);assert.equal(f.s.stage,'trial-brief');
 const poisoner=f.ref.poisoners[0];send(f,poisoner,'trial-poison',{choice:0});send(f,poisoner,'trial-poison',{choice:1});assert.throws(()=>send(f,'p0','trial-poison',{choice:2}),/chosen poisoners/);due(f);
 assert.throws(()=>send(f,poisoner,'trial-poison',{choice:2}),/briefing/);send(f,'p0','trial-play',{choice:1});assert.equal(send(f,'p0','trial-play',{choice:2}).duplicate,true);send(f,'p1','trial-play',{choice:5});
 const witness=f.s.players.find(p=>!f.s.atRisk.includes(p.id)&&!f.ref.poisoners.includes(p.id)).id;send(f,witness,'trial-play',{choice:'p0'});
 assert.equal(trialReceipt(f.s,f.secret,'p0').poison,null);assert.ok(!Object.hasOwn(f.s.challenge,'poison'));due(f);assert.equal(f.s.players[0].alive,false);assert.equal(f.s.players[1].alive,true);assert.equal(f.s.verdictRows.find(r=>r.id===witness).bonus,500);
});
test('plea deals reward trust, punish unilateral sharing and catch all thieves',()=>{
 for(const choices of [['share','share'],['share','steal'],['steal','steal']]){const f=challenge('greed');choices.forEach((choice,i)=>send(f,'p'+i,'trial-play',{choice}));due(f);assert.deepEqual(f.s.players.slice(0,2).map(p=>p.alive),choices[0]===choices[1]?[choices[0]==='share',choices[0]==='share']:[false,true]);}
});
test('bids are capped by the real wallet, paid once and tied lows are sentenced',()=>{
 const f=challenge('bids');assert.throws(()=>send(f,'p0','trial-play',{choice:501}),/valid/);send(f,'p0','trial-play',{choice:100});send(f,'p1','trial-play',{choice:200});due(f);assert.equal(f.s.players[0].cash,900);assert.equal(f.s.players[1].cash,1050);assert.equal(f.s.players[0].alive,false);assert.equal(f.s.players[1].alive,true);
});
test('timing uses referee time, ignores forged precision, rate limits attempts and keeps the best',()=>{
 const f=challenge('pulse');send(f,'p0','trial-play',{error:0},f.s.stageAt+1300);assert.ok(trialReceipt(f.s,f.secret,'p0').error>.49);
 assert.equal(send(f,'p0','trial-play',{},f.s.stageAt+1400).cooldown,true);send(f,'p0','trial-play',{},f.s.stageAt+3250);assert.ok(trialReceipt(f.s,f.secret,'p0').error<.001);due(f);assert.equal(f.s.players[0].alive,true);
});
test('push-your-luck dice use referee rolls, enforce cooldown, and bank only safe totals',()=>{
 const f=challenge('dice');f.ref.seed=0;assert.throws(()=>send(f,'p0','trial-play',{move:'bank'}),/Reach eight/);
 send(f,'p0','trial-play',{move:'roll',dice:[6,6]},f.s.stageAt+100);assert.deepEqual(f.ref.entries.p0.dice,[2]);assert.equal(send(f,'p0','trial-play',{move:'roll'},f.s.stageAt+200).cooldown,true);
 send(f,'p0','trial-play',{move:'roll'},f.s.stageAt+1000);send(f,'p0','trial-play',{move:'roll'},f.s.stageAt+1900);assert.ok(f.ref.entries.p0.score>=8);send(f,'p0','trial-play',{move:'bank'},f.s.stageAt+2000);assert.equal(f.ref.entries.p0.banked,true);const dice=[...f.ref.entries.p0.dice];assert.equal(send(f,'p0','trial-play',{move:'roll'},f.s.stageAt+3000).duplicate,true);assert.deepEqual(f.ref.entries.p0.dice,dice);due(f);assert.equal(f.s.players[0].alive,true);
});
test('rolling a one busts a run; safe unbanked totals survive the buzzer',()=>{
 const f=challenge('dice');f.ref.seed=2000;send(f,'p0','trial-play',{move:'roll'});assert.equal(f.ref.entries.p0.busted,true);f.ref.entries.p1={dice:[4,5],score:9,submitted:false};due(f);assert.equal(f.s.players[0].alive,false);assert.equal(f.s.players[1].alive,true);
});
test('all sealed choices get a short reveal countdown instead of waiting out a full timer',()=>{
 const f=fixture();for(const p of f.s.players)send(f,p.id,'trial-answer',{choice:f.ref.correct});tickCourtGame(f.s,f.secret,f.s.stageAt+6500);assert.ok(f.s.settleAt<f.s.deadline);assert.equal(f.s.stage,'trial-question');tickCourtGame(f.s,f.secret,f.s.settleAt);assert.equal(f.s.stage,'trial-answer-reveal');
});
test('mirror puzzles have one exact horizontally reflected answer',()=>{
 const f=challenge('mirror'),expected=f.ref.mirrorPattern.map(n=>Math.floor(n/3)*3+2-n%3).sort((a,b)=>a-b);
 assert.deepEqual(f.ref.mirrorOptions.find(o=>o.id===f.ref.mirrorCorrect).cells,expected);assert.equal(new Set(f.ref.mirrorOptions.map(o=>o.cells.join(','))).size,4);send(f,'p0','trial-play',{choice:f.ref.mirrorCorrect});due(f);assert.equal(f.s.players[0].alive,true);assert.equal(f.s.players[1].alive,false);
});
test('escape category sets have disjoint, stable memberships and mixed draws',()=>{
 assert.ok(TRIAL_ESCAPE_SETS.length>=30);for(const set of TRIAL_ESCAPE_SETS){assert.ok(set.yes.length>=4&&set.no.length>=4);assert.ok(!set.yes.some(x=>set.no.includes(x)));assert.ok(set.source.startsWith('https://'));for(let seed=1;seed<6;seed++){const draw=escapeDraw(set,trialSeed(seed));assert.equal(draw.length,3);assert.ok(draw.some(o=>o.correct)&&draw.some(o=>!o.correct));assert.equal(new Set(draw.map(o=>o.text)).size,3);}}
});
test('a complete eight-trial bot tour reaches the final gate, steals lives, escapes and replays',async()=>{
 let now=1000000;const errors=[],session=new TrialPreviewSession({autoplay:true,settings:{length:'tour'},clock:()=>now,onError:e=>errors.push(e)});
 try{await session.request('start');for(let i=0;i<30000&&session.state.stage!=='finish'&&!errors.length;i++){now+=60;session.tick();}assert.deepEqual(errors,[]);assert.equal(session.state.stage,'finish');assert.equal(session.state.result.escaped,true);assert.deepEqual(session.state.history.filter(h=>h.kind==='survival').map(h=>h.game),TRIAL_GAME_IDS);assert.ok(session.phases.includes('trial-gate'));assert.ok(session.state.history.some(h=>h.kind==='escape'&&h.oldSoul!==h.soul));assert.ok(session.state.result.rows.some(r=>r.stats.lifeSteals>0));
  await session.request('start');assert.equal(session.state.stage,'trial-intro');assert.equal(session.state.history.length,0);
 }finally{session.close();}
});
test('only visible escape choices can be submitted; no submission earns no free exclusion marks',async()=>{
 let now=1000000;const session=new TrialPreviewSession({autoplay:true,settings:{length:'tour'},clock:()=>now});try{await session.request('start');for(let i=0;i<30000&&session.state.stage!=='trial-escape-question';i++){now+=60;session.tick();}const s=session.state,secret=session.secret,soul=s.escape.soul,p={matchId:s.matchId,round:s.round,stageAt:s.stageAt};assert.throws(()=>actCourtGame(s,secret,soul,'trial-escape',{...p,mask:4},s.stageAt+10),/visible/);const ghost=s.players.find(p=>p.id!==soul).id;assert.throws(()=>actCourtGame(s,secret,ghost,'trial-escape',{...p,mask:0,judged:0},s.stageAt+15),/Judge every/);actCourtGame(s,secret,ghost,'trial-escape',{...p,mask:0,judged:7},s.stageAt+20);tickCourtGame(s,secret,s.deadline);assert.equal(s.escapeRows.find(r=>r.id===soul).marks,0);assert.equal(s.escapeRows.find(r=>r.id===soul).sealed,false);assert.equal(s.escapeRows.find(r=>r.id===ghost).sealed,true);}finally{session.close();}
});
test('leaving the game tab forfeits a Trial answer once; private referee normalizes for handoff',()=>{
 const f=fixture(),id='p0';assert.equal(courtFocusEligible(f.s,id),true);const report={game:f.s.matchId,question:[f.s.matchId,'trial',f.s.round,'trial-'+f.s.round+'-'+f.s.stageAt].join(':'),leftAt:f.s.stageAt+100,hidden:true};assert.equal(enforceCourtFocus(f.s,f.secret,{[id]:report},f.s.stageAt+4000),true);assert.equal(f.s.locked[id],true);assert.equal(enforceCourtFocus(f.s,f.secret,{[id]:report},f.s.stageAt+5000),false);assert.equal(normalizeTrial({...f.ref,deck:Object.fromEntries(f.ref.deck.map((x,i)=>[i,x]))}).deck.length,f.ref.deck.length);
});
test('the exit holds players at the seal; a perfect ghost can steal the life from a failed gate answer',async()=>{
 let now=1000000;const session=new TrialPreviewSession({autoplay:true,settings:{length:'tour'},clock:()=>now});
 try{await session.request('start');for(let i=0;i<30000&&session.state.stage!=='trial-gate';i++){now+=60;session.tick();}const s=session.state,secret=session.secret;assert.equal(s.stage,'trial-gate');tickCourtGame(s,secret,s.deadline);const old=s.escape.soul;for(const p of s.players){s.escape.positions[p.id]=s.escape.goal;s.escape.caught[p.id]=false;}const correct=secret.trial.escape.options.reduce((n,o,i)=>n|(o.correct?1<<i:0),0);for(const p of s.players)actCourtGame(s,secret,p.id,'trial-escape',{matchId:s.matchId,round:s.round,stageAt:s.stageAt,mask:p.id===old?correct^1:correct,judged:7},s.stageAt+100);tickCourtGame(s,secret,s.deadline);assert.ok(s.escapeRows.every(r=>r.to<=s.escape.goal));assert.notEqual(s.escape.soul,old);tickCourtGame(s,secret,s.deadline);assert.equal(s.stage,'finish');assert.equal(s.result.escaped,true);
 }finally{session.close();}
});

test('the opening two questions are familiar, distinct and from different subjects',()=>{for(let seed=1;seed<=30;seed++){const deck=trialDeck(trialSeed(seed)),first=deck.slice(0,2).map(id=>TRIAL_BY_ID.get(id));assert.ok(first.every(q=>q.difficulty<=3));assert.notEqual(first[0].subject,first[1].subject);assert.equal(new Set(deck).size,deck.length);}});
test('memory uses four pieces early and grows to six in the late game',()=>{const f=fixture();f.ref.challengeDeck=['memory'];f.s.round=7;for(const p of f.s.players)send(f,p.id,'trial-answer',{choice:f.s.question.options.find(o=>o.id!==f.ref.correct).id});due(f);due(f);assert.equal(f.s.challenge.size,6);due(f);due(f);assert.throws(()=>send(f,'p0','trial-play',{sequence:f.ref.pattern.slice(0,4)}),/six|6 pieces/);send(f,'p0','trial-play',{sequence:f.ref.pattern});assert.equal(f.s.locked.p0,true);});

function soloChallenge(kind){const f=fixture(3);f.ref.challengeDeck=[kind];for(let i=0;i<3;i++)send(f,'p'+i,'trial-answer',{choice:i===0?f.s.question.options.find(o=>o.id!==f.ref.correct).id:f.ref.correct});due(f);due(f);due(f);return f;}
test('a lone defendant gets a real deal partner instead of a repeated substitute puzzle',()=>{const f=soloChallenge('greed');assert.equal(f.s.challenge.kind,'greed');const partner=f.ref.partner;assert.ok(partner&&partner!=='p0');assert.equal(trialReceipt(f.s,f.secret,partner).role,'partner');send(f,'p0','trial-play',{choice:'share'});send(f,partner,'trial-play',{choice:'steal'});due(f);assert.equal(f.s.players[0].alive,false);assert.equal(f.s.verdictRows.find(r=>r.id===partner).bonus,700);});
test('solo bail uses a private reserve; witnesses can predict the outcome',()=>{const f=soloChallenge('bids');assert.equal(f.s.challenge.soloBail,true);assert.ok(!Object.hasOwn(f.s.challenge,'bailReserve'));assert.ok(!Object.hasOwn(trialReceipt(f.s,f.secret,'p1'),'bailReserve'));send(f,'p0','trial-play',{choice:f.ref.bailReserve});send(f,'p1','trial-play',{choice:'yes'});due(f);assert.equal(f.s.players[0].alive,true);assert.equal(f.s.verdictRows.find(r=>r.id==='p1').bonus,500);});
test('a forfeited or missing bid is zero and cannot poison the other bids with NaN',()=>{const f=challenge('bids');f.ref.forfeits.p0=true;f.ref.entries.p0={submitted:true,forfeit:true};send(f,'p1','trial-play',{choice:200});send(f,'p2','trial-play',{choice:'p0'});due(f);assert.equal(f.s.players[0].alive,false);assert.equal(f.s.players[1].alive,true);assert.equal(f.s.verdictRows.find(r=>r.id==='p2').bonus,500);assert.ok(f.s.players.every(p=>Number.isFinite(p.cash)));});
test('two- to eight-player standard matches all finish without waiting for an absent deal partner',async()=>{for(const seats of [2,3,4,8])for(const seed of [7,42,38117]){let now=1000000;const errors=[],game=new TrialPreviewSession({seats,seed,autoplay:true,clock:()=>now,onError:e=>errors.push(e)});try{await game.request('start');for(let i=0;i<30000&&game.state.stage!=='finish'&&!errors.length;i++){now+=60;game.tick();}assert.deepEqual(errors,[],seats+' players, seed '+seed);assert.equal(game.state.stage,'finish');}finally{game.close();}}});
