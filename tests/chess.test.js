import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame} from '../court-games-engine.js';
import {chessClock,chessColor,chessActor,chessTeam,chessPGN,replayChess,chessResultReceipt,validChessSettings,normalizeChessState} from '../chess-engine.js';
import {chessCareers,chessRank,chessRatingDelta} from '../chess-career.js';
import {classifyChessMove,reviewSummary} from '../chess-review.js';
import {chooseChessMove} from '../chess-bot.js';
const players=()=>['a','b'].map((id,i)=>({id,name:i?'Witness':'Counsel',buddy:'krill',ready:true,connected:true,online:true}));
function game(fen){const s=createCourtGame('chess',players());startCourtGame(s,1000,()=>0,{});tickCourtGame(s,{},4000);if(fen){s.chess.initialFen=fen;s.chess.fen=fen;s.chess.turn=new Chess(fen).turn();}return s;}
function move(s,from,to,promotion,now=5000){return actCourtGame(s,{},s.chess.seats[s.chess.turn],'chess-move',{matchId:s.matchId,ply:s.chess.ply,from,to,...(promotion?{promotion}:{})},now);}
const action=(s,uid,a,extra={},now=5000)=>actCourtGame(s,{},uid,a,{matchId:s.matchId,...extra},now);
test('two ready seats, randomized first color, three-second opening, rematch swaps colors',()=>{
 const s=createCourtGame('chess',players());startCourtGame(s,1000,()=>.99,{});assert.equal(s.chess.seats.w,'b');assert.equal(s.stage,'chess-countdown');assert.equal(tickCourtGame(s,{},3999),false);tickCourtGame(s,{},4000);assert.equal(s.stage,'chess-playing');
 action(s,'b','chess-resign');action(s,'a','chess-rematch');assert.equal(s.stage,'finish');action(s,'b','chess-rematch');assert.equal(s.chess.seats.w,'a');assert.equal(s.chess.ply,0);
 const solo=createCourtGame('chess',players().slice(0,1));assert.throws(()=>startCourtGame(solo,1000),/2 connected/);
});
test('only connected seated player, correct turn, current match and current ply may move',()=>{
 const s=game();for(const [uid,p]of [['x',{}],['b',{}],['a',{matchId:'stale'}],['a',{ply:5}]])assert.throws(()=>actCourtGame(s,{},uid,'chess-move',{matchId:s.matchId,ply:0,from:'e2',to:'e4',...p},5000));
 assert.throws(()=>move(s,'e2','e5'),/not legal/);assert.equal(s.chess.ply,0);s.players[0].connected=false;assert.throws(()=>move(s,'e2','e4'),/seated/);
});
test('clock runs on the active side, legal moves receive increment, invalid moves do not',()=>{
 const s=game();assert.equal(chessClock(s,'w',5000),299000);assert.equal(chessClock(s,'b',5000),300000);move(s,'e2','e4',null,6000);assert.equal(s.chess.clocks.w,301000);assert.equal(s.chess.turnAt,6000);assert.equal(chessClock(s,'b',8000),298000);assert.equal(chessClock(s,'w',8000),301000);assert.throws(()=>move(s,'e7','e4',null,9000));assert.equal(s.chess.clocks.b,300000);
});
test('castling moves both pieces and is forbidden through check',()=>{
 const s=game('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');move(s,'e1','g1');assert.equal(replayChess(s).get('f1').type,'r');assert.equal(replayChess(s).get('g1').type,'k');move(s,'e8','c8');assert.equal(replayChess(s).get('d8').type,'r');
 const checked=game('r3kr1r/8/8/8/8/8/8/R3K2R w KQ - 0 1');assert.throws(()=>move(checked,'e1','g1'),/not legal/);
});
test('en passant removes the right pawn and cannot expose its king',()=>{
 const s=game('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');move(s,'e5','d6');assert.equal(replayChess(s).get('d5'),undefined);assert.equal(s.chess.lastMove.captured,'p');
 const pinned=game('k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');assert.throws(()=>move(pinned,'e5','d6'));
});
test('promotion requires an explicit legal choice, with all four choices supported',()=>{
 for(const p of ['q','r','b','n']){const s=game('7k/P7/8/8/8/8/8/7K w - - 0 1');assert.throws(()=>move(s,'a7','a8'),/promotion/);assert.throws(()=>move(s,'a7','a8','k'));move(s,'a7','a8',p);assert.equal(new Chess(s.chess.fen).get('a8').type,p);}
});
test('checkmate ends the game, records winner and exports reloadable PGN',()=>{
 const s=game();for(const [a,b]of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']])move(s,a,b);assert.equal(s.stage,'finish');assert.equal(s.result.winner,'b');assert.equal(s.result.rated,true);assert.match(s.result.pgn,/Qh4#/);assert.match(s.result.pgn,/\[Result "0-1"\]/);const g=new Chess();g.loadPgn(s.result.pgn);assert.equal(g.fen(),s.chess.fen);assert.equal(chessResultReceipt(s,'ABCD').players.length,2);
});
test('stalemate and insufficient material end automatically',()=>{
 const stale=game('7k/5K2/5Q2/8/8/8/8/8 w - - 0 1');move(stale,'f6','g6');assert.equal(stale.result.draw,true);assert.match(stale.result.reason,/Stalemate/);
 const minor=game('7k/8/8/8/8/8/8/K1B5 w - - 0 1');move(minor,'c1','d2');assert.match(minor.result.reason,/Insufficient material/);
});
test('repetition uses full move history and survives a JSON reconnect',()=>{
 let s=game();for(const [a,b]of [['g1','f3'],['g8','f6'],['f3','g1'],['f6','g8']])move(s,a,b);s=normalizeChessState(JSON.parse(JSON.stringify(s)));for(const [a,b]of [['g1','f3'],['g8','f6'],['f3','g1'],['f6','g8']])move(s,a,b);assert.equal(s.stage,'finish');assert.match(s.result.reason,/Threefold/);assert.equal(replayChess(s,1).history().length,1);
});
test('fifty-move rule draws automatically',()=>{const s=game('7k/8/8/8/8/8/8/KR6 w - - 99 50');move(s,'b1','b2');assert.match(s.result.reason,/Fifty-move/);});
test('flag fall is final, with conservative bare-king or single-minor timeout draw',()=>{
 const s=game();tickCourtGame(s,{},304000);assert.equal(s.result.winner,'b');assert.equal(s.chess.clocks.w,0);assert.throws(()=>move(s,'e2','e4'));
 for(const fen of ['7k/8/8/8/8/8/8/KR6 w - - 0 1','6bk/8/8/8/8/8/8/KR6 w - - 0 1']){const d=game(fen);tickCourtGame(d,{},304000);assert.equal(d.result.draw,true);}
});
test('draw offer requires an opposing answer, and an opposing move declines it',()=>{
 const s=game();action(s,'a','chess-draw-offer');assert.throws(()=>action(s,'a','chess-draw-answer',{accept:true}));action(s,'b','chess-draw-answer',{accept:false});assert.equal(s.chess.drawOffer,'');move(s,'e2','e4');action(s,'a','chess-draw-offer');move(s,'e7','e5');assert.equal(s.chess.drawOffer,'');action(s,'b','chess-draw-offer');action(s,'a','chess-draw-answer',{accept:true});assert.equal(s.result.draw,true);
});
test('abort before two plies is unrated and exports an unfinished result',()=>{const s=game();action(s,'a','chess-abort');assert.equal(s.result.rated,false);assert.equal(s.result.aborted,true);assert.match(chessPGN(s),/\[Result "\*"\]/);const running=game();move(running,'e2','e4');move(running,'e7','e5');assert.throws(()=>action(running,'a','chess-abort'));});
test('listed controls only and settings reject unknown fields',()=>{assert.deepEqual(validChessSettings({minutes:3,increment:2,rated:false}),{minutes:3,increment:2,rated:false,format:'duel'});assert.throws(()=>validChessSettings({minutes:1,increment:99}));assert.throws(()=>validChessSettings({label:'5+3'}));});
test('Elo is deterministic across load order and ignores bot/unrated results',()=>{
 const receipt=(game,at,winner,extra={})=>({version:1,game,at,white:'a',black:'b',players:[{uid:'a',name:'Counsel'},{uid:'b',name:'Witness'}],rated:true,winner,...extra});const a=receipt('1',1000,'a'),b=receipt('2',2000,'b'),c=receipt('3',3000,'',{draw:true});const p=chessCareers({c,a,b});assert.deepEqual(p,chessCareers({a,b,c}));assert.equal(p.get('a').played,3);assert.equal(p.get('a').wins,1);assert.equal(p.get('a').losses,1);assert.equal(p.get('a').draws,1);const first=chessCareers({a});assert.equal(first.get('a').rating,1024);assert.equal(first.get('b').rating,976);assert.equal(chessRatingDelta({a},'1','a'),24);assert.equal(chessRatingDelta({a},'1','b'),-24);assert.equal(chessRatingDelta({a},'missing','a'),null);assert.deepEqual(first,chessCareers({a,bot:receipt('4',4000,'b',{rated:false})}));
});
test('local bot returns legal moves and sees mate in one',()=>{
 for(const level of ['casual','normal','sharp']){const g=new Chess(),m=chooseChessMove(g.fen(),{level,maxMs:150});assert.doesNotThrow(()=>g.move(m));}
 const fen='7k/5K2/6Q1/8/8/8/8/8 w - - 0 1',g=new Chess(fen),m=chooseChessMove(fen,{level:'sharp',maxMs:500});g.move(m);assert.equal(g.isCheckmate(),true);
});
test('chess ranks use five placements and separate Elo thresholds',()=>{
 assert.equal(chessRank({played:4,rating:1800}).id,'unranked');
 for(const [rating,id]of [[800,'bronze'],[1000,'silver'],[1200,'gold'],[1500,'platinum'],[1800,'court']])assert.equal(chessRank({played:5,rating}).id,id);
});
test('review rewards real engine choices and penalizes losing moves, with conservative brilliant criteria',()=>{
 const gameBefore=new Chess(),move=gameBefore.moves({verbose:true}).find(m=>m.from==='e2'&&m.to==='e4'),gameAfter=new Chess();gameAfter.move(move);
 const base={gameBefore,gameAfter,move,before:{lines:[{cp:0,pv:['e2e4'],depth:16},{cp:-10,pv:['d2d4'],depth:16}]},after:{lines:[{cp:0,pv:['e7e5'],depth:16}]}};
 assert.equal(classifyChessMove(base).label,'best');assert.equal(classifyChessMove({...base,after:{lines:[{cp:500,pv:['e7e5'],depth:16}]}}).label,'blunder');assert.equal(classifyChessMove({...base,before:{lines:[{cp:0,pv:['e2e4'],depth:16},{cp:-300,pv:['d2d4'],depth:16}]}}).label,'great');
 const sacrificeBefore=new Chess('6k1/7p/8/8/8/3B1N2/8/3Q2K1 w - - 0 1'),sacrificeAfter=new Chess(sacrificeBefore.fen()),sac=sacrificeAfter.move('Bxh7+'),data={gameBefore:sacrificeBefore,gameAfter:sacrificeAfter,move:sac,before:{lines:[{cp:120,pv:['d3h7'],depth:16},{cp:0,pv:['f3g5'],depth:16}]},after:{lines:[{cp:-120,pv:['g8h7','f3g5'],depth:16}]}};
 assert.equal(classifyChessMove(data).label,'brilliant');assert.notEqual(classifyChessMove({...data,after:{lines:[{cp:400,pv:['g8h7','f3g5'],depth:16}]}}).label,'brilliant');assert.notEqual(classifyChessMove({...data,before:{lines:[{cp:120,pv:['d3h7'],depth:5}]}}).label,'brilliant');
 const rows=[{color:'w',label:'best',accuracy:100},{color:'b',label:'blunder',accuracy:40}];assert.equal(reviewSummary(rows,'w').counts.best,1);assert.equal(reviewSummary(rows,'b').accuracy,40);assert.equal(reviewSummary([],'w').accuracy,null);
});
function doubles(){const roster=['a','b','c','d'].map((id,i)=>({id,name:'Counsel '+id,buddy:'krill',team:i%2,ready:true,connected:true,online:true})),s=createCourtGame('chess',roster);s.settings.format='doubles';startCourtGame(s,1000,()=>0,{});tickCourtGame(s,{},4000);return s;}
function teamMove(s,from,to,now=5000){return action(s,chessActor(s),'chess-move',{from,to,ply:s.chess.ply},now);}
test('2v2 alternates teammates per color, with one increment and one shared clock',()=>{
 const s=doubles();assert.deepEqual(chessTeam(s,'w'),['a','c']);assert.deepEqual(chessTeam(s,'b'),['b','d']);assert.equal(chessActor(s),'a');assert.throws(()=>action(s,'c','chess-move',{from:'e2',to:'e4',ply:0}),/teammate/);teamMove(s,'e2','e4',6000);assert.equal(s.chess.clocks.w,301000);assert.equal(chessActor(s),'b');teamMove(s,'e7','e5',7000);assert.equal(chessActor(s),'c');assert.throws(()=>action(s,'a','chess-move',{from:'g1',to:'f3',ply:2}),/teammate/);teamMove(s,'g1','f3',8000);assert.equal(chessActor(s),'d');teamMove(s,'b8','c6',9000);assert.equal(chessActor(s),'a');assert.deepEqual(s.chess.moves.map(m=>m.by),['a','b','c','d']);const restored=normalizeChessState(JSON.parse(JSON.stringify(s)));assert.equal(chessActor(restored),'a');assert.equal(replayChess(restored).history().length,4);
});
test('2v2 requires both partners to resign, all four to draw and all four to rematch',()=>{
 const s=doubles();action(s,'a','chess-resign');assert.equal(s.stage,'chess-playing');action(s,'c','chess-resign');assert.equal(s.stage,'finish');assert.equal(s.result.winner,'b');assert.equal(s.players.find(p=>p.id==='d').score,1);for(const uid of ['a','b','c'])action(s,uid,'chess-rematch');assert.equal(s.stage,'finish');action(s,'d','chess-rematch');assert.equal(s.stage,'chess-countdown');assert.deepEqual(chessTeam(s,'w'),['b','d']);
 const draw=doubles();action(draw,'a','chess-draw-offer');for(const uid of ['b','c'])action(draw,uid,'chess-draw-answer',{accept:true});assert.equal(draw.stage,'chess-playing');action(draw,'d','chess-draw-answer',{accept:true});assert.equal(draw.result.draw,true);
});
test('2v2 results rate both teammates against team-average opposition and retain all four names',()=>{
 const s=doubles();for(const [from,to]of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']])teamMove(s,from,to);const r=chessResultReceipt(s,'ABCD');assert.equal(r.players.length,4);assert.equal(r.format,'doubles');assert.match(r.pgn,/Counsel a & Counsel c/);const p=chessCareers({r});for(const uid of ['b','d']){assert.equal(p.get(uid).rating,1024);assert.equal(p.get(uid).wins,1);}for(const uid of ['a','c'])assert.equal(p.get(uid).rating,976);
});
