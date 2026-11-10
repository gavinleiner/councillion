import {Chess,DEFAULT_POSITION} from 'chess.js';

export const CHESS_BUILD='20261109-counsel-chess-v43';
export const CHESS_CONTROLS=[{minutes:3,increment:2,label:'3 + 2'},{minutes:5,increment:3,label:'5 + 3'},{minutes:10,increment:0,label:'10 + 0'},{minutes:10,increment:5,label:'10 + 5'},{minutes:15,increment:10,label:'15 + 10'}];
const values=x=>Object.values(x??{}),cache=new WeakMap();
export function chessSettings(v={}){const c=CHESS_CONTROLS.find(c=>c.minutes===v.minutes&&c.increment===v.increment)??CHESS_CONTROLS[1];return {minutes:c.minutes,increment:c.increment,rated:v.rated!==false,format:v.format==='doubles'?'doubles':'duel'};}
export function validChessSettings(v){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['minutes','increment','rated','format'].includes(k)))throw Error('Choose a listed chess time control.');const s=chessSettings(v);if(Object.keys(v).some(k=>s[k]!==v[k]))throw Error('Choose a listed chess time control.');return s;}
export function normalizeChessState(s){if(!s.chess)return s;s.chess.moves=values(s.chess.moves);s.chess.rematchVotes??={};s.chess.drawVotes??={};s.chess.resignVotes??={};if(s.chess.teams)for(const color of ['w','b'])s.chess.teams[color]=values(s.chess.teams[color]);s.chess.drawOffer??='';s.chess.clocks??={w:0,b:0};return s;}
export const chessTeam=(s,color)=>s.chess?.teams?.[color]??(s.chess?.seats?.[color]?[s.chess.seats[color]]:[]);
export const chessColor=(s,uid)=>chessTeam(s,'w').includes(uid)?'w':chessTeam(s,'b').includes(uid)?'b':null;
export const chessActor=(s,color=s.chess?.turn)=>{const team=chessTeam(s,color);return team[(s.chess?.moves?.filter(m=>m.color===color).length??0)%team.length];};
export const chessSeatCount=settings=>settings?.format==='doubles'?4:2;
export function replayChess(s,ply=s.chess?.moves?.length??0){
 const c=s.chess;if(!c)return new Chess();const moves=values(c.moves),old=cache.get(s);
 if(ply===moves.length&&old?.ply===ply&&old.fen===c.fen)return old.game;
 const game=new Chess(c.initialFen??DEFAULT_POSITION);
 for(const move of moves.slice(0,ply))game.move({from:move.from,to:move.to,...(move.promotion?{promotion:move.promotion}:{})});
 if(ply===moves.length){if(game.fen()!==c.fen)throw Error('The board history is out of sync. Reconnect to the room.');cache.set(s,{game,ply,fen:c.fen});}
 return game;
}
export function chessClock(s,color,now=Date.now()){if(!s.chess)return 0;return Math.max(0,(s.chess.clocks[color]??0)-(s.stage==='chess-playing'&&s.chess.turn===color?Math.max(0,now-s.chess.turnAt):0));}
function phase(s,name,now,ms=0){s.stage=name;s.stageAt=now;s.deadline=ms?now+ms:0;s.phase=name==='finish'?'ended':name==='lobby'?'lobby':'playing';s.round=1;s.revision++;}
function emit(s,type,text,now,extra={}){s.eventSerial=(s.eventSerial??0)+1;s.event={id:s.eventSerial,type,text,at:now,...extra};s.notice=text;s.revision++;}
const seated=s=>s.players.filter(p=>!p.spectator);
const available=s=>s.players.filter(p=>!p.spectator&&p.connected!==false&&p.online!==false);
export function startChess(s,now=Date.now(),rng=Math.random){
 const players=available(s),doubles=s.settings.format==='doubles',count=chessSeatCount(s.settings);if(players.length!==count)throw Error('Chess needs '+count+' connected players.');if(players.some(p=>!p.ready))throw Error('Wait for every player to ready up.');
 const previousWhite=s.chess?.seats?.w;let whitePlayers,blackPlayers;
 if(doubles){if([0,1].some(t=>players.filter(p=>p.team===t).length!==2))throw Error('Choose two players for each team.');const whiteTeam=previousWhite?1-(players.find(p=>p.id===previousWhite)?.team??0):Math.floor(rng()*2);whitePlayers=players.filter(p=>p.team===whiteTeam);blackPlayers=players.filter(p=>p.team!==whiteTeam);}
 else{const white=previousWhite?(players.find(p=>p.id!==previousWhite)??players[0]):players[Math.floor(rng()*2)];whitePlayers=[white];blackPlayers=players.filter(p=>p.id!==white.id);}
 const white=whitePlayers[0],black=blackPlayers[0];
 s.settings=chessSettings(s.settings);s.matchId=crypto.randomUUID();delete s.chessSwap;delete s.result;s.locked={};s.history=[];s.teamScores=[0,0];s.questionIds=[];
 for(const p of s.players){p.score=0;p.spectator=!players.some(q=>q.id===p.id);}
 s.chess={initialFen:DEFAULT_POSITION,fen:DEFAULT_POSITION,seats:{w:white.id,b:black.id},teams:{w:whitePlayers.map(p=>p.id),b:blackPlayers.map(p=>p.id)},drawVotes:{},resignVotes:{},moves:[],ply:0,turn:'w',turnAt:0,clocks:{w:s.settings.minutes*60000,b:s.settings.minutes*60000},drawOffer:'',rematchVotes:{},check:false,resultSaved:false};
 cache.delete(s);phase(s,'chess-countdown',now,3000);emit(s,'chess-start',whitePlayers.map(p=>p.name).join(' & ')+' have the ivory pieces. '+blackPlayers.map(p=>p.name).join(' & ')+' have the dark pieces.',now);return true;
}
export function chessPGN(s){const game=replayChess(s),c=s.chess;for(const [key,value]of Object.entries({Event:'Counsel Chess',Site:'Councillion',Date:new Date(s.stageAt).toISOString().slice(0,10).replaceAll('-','.'),Round:'1',White:chessTeam(s,'w').map(id=>s.players.find(p=>p.id===id)?.name??'Counsel').join(' & '),Black:chessTeam(s,'b').map(id=>s.players.find(p=>p.id===id)?.name??'Counsel').join(' & '),TimeControl:s.settings.minutes*60+'+'+s.settings.increment,Result:s.result?(s.result.aborted?'*':s.result.draw?'1/2-1/2':s.result.winner===c.seats.w?'1-0':'0-1'):'*'}))game.setHeader(key,value);return game.pgn();}
function finish(s,winner,reason,now,{aborted=false}={}){
 const c=s.chess;if(s.stage==='finish')return;c.clocks[c.turn]=chessClock(s,c.turn,now);c.drawOffer='';
 s.result={game:s.matchId,winner:winner??'',draw:!winner,aborted,reason,at:now,white:c.seats.w,black:c.seats.b,ply:c.moves.length,rated:!aborted&&s.settings.rated&&c.moves.length>=2,minutes:s.settings.minutes,increment:s.settings.increment,format:s.settings.format,whiteTeam:chessTeam(s,'w'),blackTeam:chessTeam(s,'b')};
 for(const p of seated(s))p.score=aborted?0:!winner?0.5:Number(chessColor(s,p.id)===chessColor(s,winner));
 phase(s,'finish',now);s.endedAt=now;s.result.pgn=chessPGN(s);emit(s,winner?'chess-win':'chess-draw',reason,now,{winner:winner??''});
}
function timeout(s,now){
 const c=s.chess,loser=c.turn,winner=loser==='w'?'b':'w',game=replayChess(s),pieces=game.board().flat().filter(p=>p&&p.color===winner&&p.type!=='k');
 // Conservative online timeout rule: a bare king or a lone minor cannot win on time.
 const canMate=pieces.some(p=>'pqr'.includes(p.type))||pieces.length>=2;
 finish(s,canMate?c.seats[winner]:null,canMate?'Won on time':'Draw · opponent has no sufficient mating material',now);return true;
}
function terminal(s,now){const game=replayChess(s),c=s.chess;if(game.isCheckmate()){finish(s,c.seats[c.turn==='w'?'b':'w'],'Checkmate',now);return true;}const reason=game.isStalemate()?'Stalemate':game.isInsufficientMaterial()?'Insufficient material':game.isThreefoldRepetition()?'Threefold repetition':game.isDrawByFiftyMoves()?'Fifty-move rule':null;if(reason){finish(s,null,'Draw · '+reason,now);return true;}return false;}
export function actChess(s,secret,uid,action,p={},now=Date.now()){
 if(!s.chess||!chessColor(s,uid)||!available(s).some(q=>q.id===uid))throw Error('Only the two seated players can act.');if(p.matchId!==s.matchId)throw Error('That action belongs to an earlier chess game.');const c=s.chess,color=chessColor(s,uid);
 if(action==='chess-rematch'){
  if(s.stage!=='finish')throw Error('Finish the current game first.');c.rematchVotes[uid]=true;s.revision++;
  if(available(s).length===chessSeatCount(s.settings)&&available(s).every(q=>c.rematchVotes[q.id])){for(const q of available(s))q.ready=true;startChess(s,now);}return {accepted:true};
 }
 if(s.stage!=='chess-playing')throw Error('Wait for the board countdown.');if(chessClock(s,c.turn,now)<=0){timeout(s,now);return {ended:true};}
 if(action==='chess-resign'){c.resignVotes[uid]=true;s.revision++;if(!chessTeam(s,color).every(id=>c.resignVotes[id])){emit(s,'chess-resign-vote','A teammate has requested resignation. Both partners must agree.',now);return {accepted:true};}finish(s,c.seats[color==='w'?'b':'w'],'Won by resignation',now);return {accepted:true};}
 if(action==='chess-abort'){if(c.moves.length>=2)throw Error('The opening is complete. Resign to leave this game.');finish(s,null,'Game aborted before both opening moves',now,{aborted:true});return {accepted:true};}
 if(action==='chess-draw-offer'){if(c.drawOffer&&s.settings.format!=='doubles')throw Error('There is already a draw offer.');c.drawOffer??='';c.drawOffer=c.drawOffer||uid;c.drawVotes[uid]=true;emit(s,'chess-offer','A draw has been offered.',now);return {accepted:true};}
 if(action==='chess-draw-answer'){if(!c.drawOffer||s.settings.format!=='doubles'&&c.drawOffer===uid||typeof p.accept!=='boolean')throw Error('There is no opposing draw offer.');if(p.accept){c.drawVotes[uid]=true;s.revision++;if([...chessTeam(s,'w'),...chessTeam(s,'b')].every(id=>c.drawVotes[id]))finish(s,null,'Draw by agreement',now);}else{c.drawOffer='';c.drawVotes={};emit(s,'chess-declined','The game continues.',now);}return {accepted:true};}
 if(action!=='chess-move')throw Error('Choose a chess move.');if(c.turn!==color)throw Error('It is your opponent’s turn.');if(chessActor(s)!==uid)throw Error('Your teammate moves this turn.');if(p.ply!==c.moves.length)throw Error('The board changed. Choose your move again.');
 if(!/^[a-h][1-8]$/.test(p.from)||!/^[a-h][1-8]$/.test(p.to)||p.promotion&&!['q','r','b','n'].includes(p.promotion))throw Error('Choose a legal board move.');
 const game=replayChess(s),legal=game.moves({square:p.from,verbose:true}).filter(m=>m.to===p.to);if(legal.some(m=>m.promotion)&&!p.promotion)throw Error('Choose a piece for promotion.');let move;
 try{move=game.move({from:p.from,to:p.to,...(p.promotion?{promotion:p.promotion}:{})});}catch{throw Error('That move is not legal.');}
 c.clocks[color]=chessClock(s,color,now)+s.settings.increment*1000;c.fen=game.fen();c.turn=game.turn();c.turnAt=now;c.check=game.isCheck();if(c.drawOffer&&chessColor(s,c.drawOffer)!==color){c.drawOffer='';c.drawVotes={};}c.resignVotes={};
 const row={by:uid,from:move.from,to:move.to,promotion:move.promotion??'',san:move.san,color,captured:move.captured??'',flags:move.flags,fen:c.fen,at:now,remaining:c.clocks[color]};c.moves.push(row);c.ply=c.moves.length;c.lastMove=row;cache.set(s,{game,ply:c.ply,fen:c.fen});s.revision++;
 emit(s,move.isPromotion()?'chess-promotion':c.check?'chess-check':move.isCapture()?'chess-capture':'chess-move',move.san,now,{from:move.from,to:move.to});terminal(s,now);return {accepted:true,san:move.san,ply:c.ply};
}
export function tickChess(s,secret,now=Date.now()){
 if(s.stage==='chess-countdown'&&now>=s.deadline){phase(s,'chess-playing',now);s.chess.turnAt=now;emit(s,'chess-open','White to move. Good luck, counsel.',now);return true;}
 if(s.stage==='chess-playing'&&chessClock(s,s.chess.turn,now)<=0)return timeout(s,now);return false;
}
export function chessResultReceipt(s,room){if(s.stage!=='finish'||!s.result)throw Error('Finish the game before saving a result.');return {version:1,...s.result,room,players:seated(s).map(p=>({uid:p.id,name:p.name,buddy:p.buddy,color:chessColor(s,p.id)}))};}
