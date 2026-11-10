import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame} from './court-games-engine.js';
import {CHESS_BUILD,chessSettings,chessColor,chessActor} from './chess-engine.js';
export class ChessPreviewSession{
 constructor({onState=()=>{},onError=()=>{},name='Counsel',buddy='krill',settings={},level='normal',showcase=false,clock=Date.now}={}){
  Object.assign(this,{uid:'p0',host:true,preview:true,connected:true,onState,onError,clock,level,showcase,closed:false,pending:false,response:{},code:'PRACTICE',lastBotPly:-1});
  const roster=[{id:'p0',name,buddy,ready:true,online:true,connected:true},{id:'p1',name:'Court Bot',buddy:'evil',ready:true,online:true,connected:true}];if(settings.format==='doubles')roster.push({id:'p2',name:'Co-Counsel',buddy:'squid',ready:true,online:true,connected:true},{id:'p3',name:'The Clerk',buddy:'schooler',ready:true,online:true,connected:true});roster.forEach((p,i)=>p.team=i%2);this.state=createCourtGame('chess',roster);Object.assign(this.state.settings,chessSettings({...settings,rated:false}));
  this.worker=new Worker('chess-bot.bundle.js?v='+CHESS_BUILD);this.worker.onmessage=e=>{if(this.closed||e.data.id!==this.botRequest)return;this.botRequest=null;if(e.data.error){this.onError(e.data.error);return;}if(this.state.stage==='chess-playing'&&this.state.chess.ply===this.botPly)this.requestFor(this.botUid,'chess-move',e.data.move);};
  this.timer=setInterval(()=>this.tick(),100);this.render();
 }
 now(){return this.clock();}
 render(){if(!this.closed)this.onState(this.state,this);}
 async ready(){return;}
 async request(action,p={}){
  try{if(['start','rematch'].includes(action)){startCourtGame(this.state,this.now(),()=>0,{});this.lastBotPly=-1;}
   else if(action==='settings'){Object.assign(this.state.settings,chessSettings({...p.settings,rated:false}));}
   else {this.requestFor(this.uid,action,p,false);if(action==='chess-rematch'||action==='chess-resign'||action==='chess-draw-offer')for(const q of this.state.players.filter(q=>q.id!==this.uid&&(action==='chess-rematch'||chessColor(this.state,q.id)===chessColor(this.state,this.uid))))this.requestFor(q.id,action,p,false);}this.render();
  }catch(error){this.onError(error.message);}
 }
 requestFor(uid,action,p={},render=true){try{actCourtGame(this.state,{},uid,action,{matchId:this.state.matchId,ply:this.state.chess?.ply,...p},this.now());if(this.state.stage==='finish')this.state.chess.resultSaved=true;if(render)this.render();}catch(error){this.onError(error.message);}}
 tick(){if(this.closed)return;const s=this.state;if(tickCourtGame(s,{},this.now())){if(s.stage==='finish')s.chess.resultSaved=true;this.render();}
  if(s.stage!=='chess-playing')return;const color=s.chess.turn,actor=chessActor(s),bot=actor!==this.uid;if(!bot&&!this.showcase)return;if(this.lastBotPly===s.chess.ply)return;this.lastBotPly=s.chess.ply;
  if(this.showcase){const moves=[['e2','e4'],['e7','e5'],['d1','h5'],['b8','c6'],['f1','c4'],['g8','f6'],['h5','f7']],m=moves[s.chess.ply];if(!m)return;setTimeout(()=>{if(!this.closed&&this.state.chess.ply===this.lastBotPly)this.requestFor(chessActor(this.state),'chess-move',{from:m[0],to:m[1]});},1000);return;}
  this.botUid=actor;this.botPly=s.chess.ply;this.botRequest=s.matchId+':'+this.botPly;this.worker.postMessage({id:this.botRequest,fen:s.chess.fen,options:{level:this.level,seed:s.chess.ply+19}});
 }
 close(){this.closed=true;clearInterval(this.timer);this.worker.terminate();}
}
