// Local browser fixture. It has no cloud connection or access to real rooms.
import * as E from '../court-games-engine.js';
import {CLASH_BOARDS,CLASH_BY_ID} from '../court-games-data.js';
import {ClashStage} from '../court-games-clash.js';
import {CourtGameSession} from '../court-games-session.js';
import {fastLiveAnswer} from '../court-games-dialogue.js';
document.body.dataset.screen='court-games';
let s,secret,now,view,session,latency=90,calls=[];
function render(){
 if(!view)return;
 session.response.secret={matchId:s.matchId,fastDraft:secret.fastDraft?.[session.uid]};
 session.response.liveAnswer=fastLiveAnswer(s,secret,session.uid,now);
 const first=secret.fast?.[s.fastPlayers?.[0]];
 session.response.fastAudience=first&&session.uid!==s.fastPlayers?.[1]?{matchId:s.matchId,rows:s.fastIds.map((id,i)=>({prompt:CLASH_BY_ID.get(id).prompt,label:first[i].label,text:first[i].input,points:first[i].points}))}:null;
 view.render(s,session);
}
function make(n=10){view?.dispose();if(session){session.closed=true;clearInterval(session.timer);clearTimeout(session.draftRetry);clearTimeout(session.typingTimer);}now=Date.now();secret={estimates:{},fast:{}};calls=[];
 s=E.createCourtGame('clash',Array.from({length:n},(_,i)=>({id:'p'+i,name:['Gavin','Logan','Jack','Alex','Riley','Morgan','Nori','Finn','Coral','Reef'][i],buddy:['krill','squid','angler','schooler'][i%4],team:i%2,ready:true,online:true,connected:true})));
 E.startCourtGame(s,now,()=>.2,secret);
 session=new CourtGameSession({mode:'clash',clock:()=>now});clearInterval(session.timer);
 Object.assign(session,{uid:'p0',code:'TEST',connected:true,host:true,state:s,meta:{isPrivate:true},members:Object.fromEntries(s.players.map(p=>[p.id,{online:true}])),response:{},drafts:{},render,path:part=>part,onError:message=>view.error(message)});
 session.c={serverTimestamp:()=>now,set:async(path,request)=>{
  if(!path.startsWith('requests/')){session.drafts[path.split('/').at(-1)]=request;return;}
  const target=session,uid=path.split('/').at(-1);calls.push(request);
  setTimeout(()=>{if(target.closed)return;let result;try{result=E.actCourtGame(s,secret,uid,request.patch.action,{...request.patch,text:request.text},now);}catch(e){result={error:e.message};}
   target.lastAck=request.id;target.lastResult=result;target.response.ack={id:request.id,result,error:result.error??null};if(target.pendingId===request.id){target.pending=false;target.pendingId=null;}render();
  },latency);
 },remove:async(path)=>{if(path.startsWith('typing/'))delete session.drafts[path.split('/').at(-1)];}};
 view=new ClashStage(document.querySelector('#app'),{action:(a,p)=>session.request(a,p).catch(e=>view.error(e.message)),leave(){},rules:'<h2>Local UI test</h2>'});view.voice.setEnabled(false);view.voiceLabel();render();return s;
}
function due(){now=s.deadline;E.tickCourtGame(s,secret,now);render();}
function open(){while(['briefing','roundRead'].includes(s.stage))due();}
function board(id='big-ears',phase='faceAnswer',n=10){make(n);open();const q=CLASH_BY_ID.get(id);Object.assign(s,{board:{id:q.id,prompt:q.prompt,slots:q.answers.map((_,index)=>({index,revealed:false}))},stage:phase,stageAt:now,turnOpenedAt:now,deadline:now+E.CLASH_TIMING[phase],faceoffTurn:'p0',turn:'p0',controlTeam:0,strikes:0,pot:0});view.centerKey=null;render();}
function fast(){make(6);open();Object.assign(s,{stage:'roundResult',deadline:now+1,teamScores:[350,100]});due();due();due();due();s.fastIds[0]='big-ears';session.uid=s.turn;view.centerKey=null;render();}
make();setInterval(()=>view.frame(),40);
window.feudTest={get s(){return s;},get secret(){return secret;},get session(){return session;},get view(){return view;},get calls(){return calls;},boards:CLASH_BOARDS,make,board,fast,due,open,render,setNow:n=>{now=n;view.frame();},setLatency:n=>latency=n,act(uid,a,p={}){const result=E.actCourtGame(s,secret,uid,a,{matchId:s.matchId,round:s.round,...p},++now);render();return result;}};
