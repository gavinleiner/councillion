import {Chess} from 'chess.js';
export const REVIEW_VERSION='sf19-lite-counsel-v1';
export const REVIEW_LABELS={brilliant:'Brilliant',great:'Great',best:'Best',excellent:'Excellent',good:'Good',inaccuracy:'Inaccuracy',mistake:'Mistake',blunder:'Blunder',forced:'Forced'};
export const REVIEW_MARKS={brilliant:'!!',great:'!',best:'★',excellent:'✓',good:'•',inaccuracy:'?!',mistake:'?',blunder:'??',forced:'→'};
const material={p:1,n:3,b:3,r:5,q:9,k:0};
export const expectedPoints=cp=>1/(1+Math.exp(-Math.max(-10000,Math.min(10000,cp))/300));
const balance=(g,color)=>g.board().flat().filter(Boolean).reduce((n,p)=>n+(p.color===color?1:-1)*material[p.type],0);
export function classifyChessMove({before,after,move,gameBefore,gameAfter}){
 const played=move.from+move.to+(move.promotion??''),top=before.lines[0],alternative=before.lines[1],best=played===top?.pv[0],beforeCP=top?.cp??0,afterCP=-(after.lines[0]?.cp??0),loss=Math.max(0,expectedPoints(beforeCP)-expectedPoints(afterCP)),legal=gameBefore.moves().length;
 let label=loss>=.20?'blunder':loss>=.10?'mistake':loss>=.05?'inaccuracy':loss>=.02?'good':best?'best':'excellent';
 let sacrifice=false;
 if((top?.depth??0)>=10&&(after.lines[0]?.depth??0)>=10&&loss<=.015&&afterCP>=-30&&beforeCP<600&&legal>1){
  const g=new Chess(gameAfter.fen());let captured=false;
  for(const [i,uci]of (after.lines[0]?.pv??[]).slice(0,2).entries()){try{const m=g.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]});if(i===0&&m.captured&&material[m.captured]>=3)captured=true;}catch{break;}}
  sacrifice=captured&&balance(g,move.color)<=balance(gameBefore,move.color)-2;
 }
 if(legal===1)label='forced';else if(sacrifice)label='brilliant';else if(best&&alternative&&expectedPoints(beforeCP)-expectedPoints(alternative.cp)>=.12&&loss<=.02)label='great';
 const bestMove=top?.pv[0];let bestSAN='';if(bestMove)try{const g=new Chess(gameBefore.fen());bestSAN=g.move({from:bestMove.slice(0,2),to:bestMove.slice(2,4),promotion:bestMove[4]}).san;}catch{}
 return {label,loss,cp:afterCP,best:bestSAN,depth:Math.min(top?.depth??0,after.lines[0]?.depth??top?.depth??0),accuracy:Math.round(100*Math.exp(-4*loss))};
}
export function reviewSummary(rows,color){const own=rows.filter(r=>r.color===color),counts=Object.fromEntries(Object.keys(REVIEW_LABELS).map(k=>[k,own.filter(r=>r.label===k).length]));return {counts,moves:own.length,accuracy:own.length?Math.round(own.reduce((n,r)=>n+r.accuracy,0)/own.length):null};}
export class ChessReviewer{
 constructor(){this.closed=false;this.worker=new Worker('assets/chess/stockfish/stockfish-19-lite-single.js');this.ready=new Promise((resolve,reject)=>{this.readyResolve=resolve;this.readyReject=reject;this.initTimer=setTimeout(()=>reject(Error('The chess review engine could not load. Try the review again.')),15000);});this.worker.onerror=()=>{const error=Error('The review engine could not load. Your match is safely saved.');this.readyReject(error);this.rejectSearch?.(error);};this.worker.onmessage=e=>this.receive(String(e.data));this.worker.postMessage('uci');}
 receive(line){if(this.closed)return;if(line==='uciok'){this.worker.postMessage('setoption name Hash value 16');this.worker.postMessage('setoption name MultiPV value 2');this.worker.postMessage('isready');}if(line==='readyok'){clearTimeout(this.initTimer);this.readyResolve();}
  if(line.startsWith('info ')&&line.includes(' pv ')){const depth=Number(line.match(/\bdepth (\d+)/)?.[1]??0),index=Number(line.match(/\bmultipv (\d+)/)?.[1]??1)-1,score=line.match(/\bscore (cp|mate) (-?\d+)/),pv=line.split(' pv ')[1].trim().split(/\s+/);if(score&&!/\b(upperbound|lowerbound)\b/.test(line)){const value=Number(score[2]),cp=score[1]==='mate'?(value>0?100000:-100000):value;if(!this.lines[index]||depth>=this.lines[index].depth)this.lines[index]={depth,cp,pv};}}
  if(line.startsWith('bestmove')&&this.resolveSearch){clearTimeout(this.searchTimer);const resolve=this.resolveSearch;this.resolveSearch=null;this.rejectSearch=null;resolve({lines:this.lines.filter(Boolean)});}
 }
 async search(game,{ms=180}={}){await this.ready;if(this.closed)throw Error('Review cancelled.');if(game.isCheckmate())return {lines:[{cp:-100000,pv:[],depth:99}]};if(game.isDraw())return {lines:[{cp:0,pv:[],depth:99}]};this.lines=[];return new Promise((resolve,reject)=>{this.resolveSearch=resolve;this.rejectSearch=reject;this.searchTimer=setTimeout(()=>{this.worker.postMessage('stop');reject(Error('The review paused. Retry when your device is ready.'));this.resolveSearch=null;},8000);this.worker.postMessage('position fen '+game.fen());this.worker.postMessage('go movetime '+ms);});}
 async review(state,onProgress=()=>{}){
  const game=new Chess(state.chess.initialFen),moves=Object.values(state.chess.moves??{}),rows=[];let before=await this.search(game);for(const [i,source]of moves.entries()){if(this.closed)throw Error('Review cancelled.');const gameBefore=new Chess(game.fen()),move=game.move({from:source.from,to:source.to,...(source.promotion?{promotion:source.promotion}:{})}),after=await this.search(game);rows.push({by:source.by??state.chess.seats[move.color],ply:i+1,san:move.san,color:move.color,...classifyChessMove({before,after,move,gameBefore,gameAfter:game})});onProgress({done:i+1,total:moves.length});before=after;}return {version:REVIEW_VERSION,rows,white:reviewSummary(rows,'w'),black:reviewSummary(rows,'b')};
 }
 close(){this.closed=true;clearTimeout(this.initTimer);clearTimeout(this.searchTimer);this.worker.terminate();this.rejectSearch?.(Error('Review cancelled.'));this.readyResolve?.();}
}
