import {mountEntrance} from './access-gate.js';
const VERSION='20261023-discovery-v2';
const root=document.querySelector('#entrance');
let gameLoading;
const loadGame=()=>gameLoading??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='game.bundle.js?v='+VERSION;script.onload=resolve;script.onerror=()=>{gameLoading=null;script.remove();reject(Error('Game download failed'));};document.head.append(script);});
let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
try{if(JSON.parse(localStorage.getItem('fc:settings'))?.motion===false)motion=false;}catch{}
const gate=mountEntrance(root,{motion,onEnter:loadGame,onStateChange:(locked,phase)=>{for(const el of document.body.children)if(el!==root&&!['SCRIPT','STYLE','LINK'].includes(el.tagName))el.inert=locked;if(locked&&document.querySelector('#modal')?.open)document.querySelector('#modal').close();document.dispatchEvent(new CustomEvent('councillion:entrance',{detail:{locked,phase}}));}});
const fallback=setTimeout(()=>gate.showLocked(),1500);
import('./cloud.bundle.js?v=20261022-pres-v1').then(cloud=>{cloud.watchAccount(identity=>{clearTimeout(fallback);gate.account(identity);},()=>{clearTimeout(fallback);gate.showLocked();});}).catch(()=>{clearTimeout(fallback);gate.showLocked();});
