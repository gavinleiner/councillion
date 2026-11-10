import {Chess} from 'chess.js';
const worth={p:100,n:320,b:335,r:500,q:900,k:0};
function evaluate(g){let n=0;for(const row of g.board())for(const p of row){if(!p)continue;const rank=Number(p.square[1]),file=p.square.charCodeAt(0)-97,center=3.5-Math.abs(file-3.5)+3.5-Math.abs(rank-4.5),advance=p.color==='w'?rank-2:7-rank;n+=(p.color==='w'?1:-1)*(worth[p.type]+(p.type==='p'?advance*7:Math.round(center*3)));}return n*(g.turn()==='w'?1:-1);}
const ordered=g=>g.moves({verbose:true}).sort((a,b)=>((worth[b.captured]??0)*10-worth[b.piece]+(b.promotion?800:0))-((worth[a.captured]??0)*10-worth[a.piece]+(a.promotion?800:0)));
export function chooseChessMove(fen,{level='normal',seed=1,maxMs=550}={}){
 const g=new Chess(fen),limit=level==='casual'?1:level==='sharp'?3:2,maxNodes=level==='sharp'?18000:7000,end=performance.now()+maxMs;let nodes=0;
 const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function search(depth,alpha,beta){nodes++;if(g.isCheckmate())return -30000-depth;if(g.isDraw())return 0;if(!depth||nodes>=maxNodes||performance.now()>end)return evaluate(g);let best=-Infinity;for(const m of ordered(g)){g.move(m);const score=-search(depth-1,-beta,-alpha);g.undo();best=Math.max(best,score);alpha=Math.max(alpha,score);if(alpha>=beta||nodes>=maxNodes||performance.now()>end)break;}return best;}
 const moves=ordered(g);if(!moves.length)return null;let pick=moves[0],best=-Infinity;for(const m of moves){g.move(m);const score=-search(limit-1,-Infinity,Infinity)+(level==='casual'?(rng()-.5)*100:0);g.undo();if(score>best){best=score;pick=m;}if(nodes>=maxNodes||performance.now()>end)break;}
 return {from:pick.from,to:pick.to,...(pick.promotion?{promotion:pick.promotion}:{})};
}
