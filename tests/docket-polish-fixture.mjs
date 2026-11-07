// Local-only fixture: real session request/ack flow, no cloud access.
import * as E from '../court-games-engine.js';
import {DOCKET_BY_ID} from '../docket-data.js';
import {DocketStage} from '../docket-view.js';
import {CourtGameSession} from '../court-games-session.js';
document.body.dataset.screen='court-games';
let s,secret,now,session,view,latency=60,calls=[];
function render(){if(session&&s?.stage==='docketFinalAnswer')session.response.finalDraft={matchId:s.matchId,stageAt:s.stageAt,text:secret.docket?.drafts?.[session.uid]??''};view?.render(s,session);}
function make(n=6){view?.dispose();if(session){session.closed=true;clearInterval(session.timer);clearTimeout(session.typingTimer);}now=Date.now();secret={};calls=[];
 s=E.createCourtGame('docket',Array.from({length:n},(_,i)=>({id:'p'+i,name:['Gavin','Logan','Jack','Alex','Riley','Morgan'][i],buddy:['krill','squid','angler','schooler','evil','krill'][i],ready:true,online:true,connected:true})));
 if(n>1)E.startCourtGame(s,now,()=>.3,secret);
 session=new CourtGameSession({mode:'docket',clock:()=>now});clearInterval(session.timer);
 Object.assign(session,{uid:'p0',host:true,connected:true,code:'TEST',state:s,meta:{isPrivate:true},members:{},response:{},drafts:{},render,path:p=>p});
 session.c={serverTimestamp:()=>now,remove:async()=>{},set:async(path,req)=>{
  if(!path.startsWith('requests/'))return;calls.push(req);const target=session;
  setTimeout(()=>{if(target.closed)return;let result;try{result=E.actCourtGame(s,secret,'p0',req.patch.action,{...req.patch,text:req.text},now);}catch(e){result={error:e.message};}
  target.lastResult=result;target.lastAck=req.id;if(target.pendingId===req.id){target.pending=false;target.pendingId=null;}render();},latency);
 }};
 view=new DocketStage(document.querySelector('#app'),{action:(a,p)=>session.request(a,p).catch(e=>view.error(e.message)),leave(){}});render();
}
function prepare(id='block-party-1',n=6){make(n);const q=DOCKET_BY_ID.get(id);Object.assign(s,{round:1,stage:'docketRead',stageAt:++now,readOpenedAt:now,deadline:0,clue:{id:q.id,prompt:q.prompt,category:q.category,value:200,double:false},attempts:{},lockouts:{},locked:{}});secret.docket.buzzAt=now+5000;render();}
function due(){now=s.stage==='docketRead'&&!s.clue.double?secret.docket.buzzAt:s.deadline;E.tickCourtGame(s,secret,now);render();}
make();setInterval(()=>view.frame(),40);
function final(){make(6);Object.assign(s,{stage:'docketFinalAnswer',round:2,stageAt:++now,deadline:now+30000,eligible:['p0','p1'],locked:{},clue:{id:'gaming-final',prompt:'This Metroid bounty hunter wears a power suit.',category:'VIDEO GAME LEGENDS'}});Object.assign(secret.docket,{finalId:'gaming-final',wagers:{p0:100,p1:100},answers:{},drafts:{}});render();}
window.docketTest={make,prepare,final,due,render,get s(){return s;},get secret(){return secret;},get session(){return session;},get view(){return view;},get calls(){return calls;},advance(ms){now+=ms;render();},setLatency:n=>latency=n};
