import {GAME_MASCOTS} from './game-mascots.js';

// Animate the approved SVG sources. The normal image stays if enhancement fails.
const sources=new Map();let serial=0;
const NS='http://www.w3.org/2000/svg';
const lids={objection:['#f5da7c','M8 15h4v4H8zm8 0h4v4h-4z'],trial:['#bde8d7','M8 13h5v5H8zm10 0h5v5h-5z'],bench:['#f5da7c','M10 13h4v5h-4zm8 0h4v5h-4z'],testimony:['#39aeb0','M11 14h4v5h-4zm8 0h4v5h-4z'],party:['#f5da7c','M8 13h4v4H8zm9 0h4v4h-4z'],clash:['#ef7889','M11 15h4v5h-4zm7 0h4v5h-4z'],figure:['#70c9c4','M23 17h4v4h-4z'],docket:['#78bad0','M10 11h4v4h-4zm8 0h4v4h-4z'],oath:['#a18ad1','M11 14h4v5h-4zm7 0h4v5h-4z']};
const node=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;};
function group(nodes,className){if(!nodes.length)return;const g=node('g',{class:className});nodes[0].before(g);nodes.forEach(n=>g.append(n));}
function crabClaws(svg){
 const id='pg-crab-'+(++serial),base=node('g',{id:id+'-art'});while(svg.firstChild)base.append(svg.firstChild);
 const regions=['M0 8h8v9h2v7H0z','M24 8h8v16H22v-7h2z'];
 const defs=node('defs'),mask=node('mask',{id:id+'-body',maskUnits:'userSpaceOnUse',x:0,y:0,width:32,height:32});
 mask.append(node('path',{fill:'white',d:'M0 0h32v32H0z'}));
 regions.forEach((d,i)=>{mask.append(node('path',{fill:'black',d}));const clip=node('clipPath',{id:id+'-claw-'+i});clip.append(node('path',{d}));defs.append(clip);});
 defs.append(base,mask);svg.append(defs,node('use',{href:'#'+id+'-art',mask:'url(#'+id+'-body)'}));
 regions.forEach((_,i)=>{const claw=node('g',{class:'pg-crab-claw claw-'+i});claw.append(node('use',{href:'#'+id+'-art','clip-path':'url(#'+id+'-claw-'+i+')'}));svg.append(claw);});
}
function animateArt(text,mode){
 const svg=new DOMParser().parseFromString(text,'image/svg+xml').documentElement;
 if(svg.localName!=='svg')throw Error('Invalid mascot artwork.');
 svg.classList.add('game-mascot','game-mascot-'+mode,'pg-mascot-art');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.dataset.mascot=mode;
 if(mode==='clash')crabClaws(svg);
 if(mode==='docket'){const paths=[...svg.querySelectorAll('path')],i=paths.findIndex(p=>p.getAttribute('d').startsWith('M6 18'));if(i>=0)group(paths.slice(i),'pg-turtle-book');}
 if(mode==='oath'){const paths=[...svg.querySelectorAll('path')],i=paths.findIndex(p=>p.getAttribute('d').startsWith('M1 12'));if(i>=0)group(paths.slice(i,i+4),'pg-oath-book');}
 const [fill,d]=lids[mode],blink=node('g',{class:'pg-mascot-lids'});blink.append(node('path',{fill,d}));(mode==='trial'?svg.querySelector('.pg-trial-body')??svg:svg).append(blink);return svg;
}
export function enhanceGameMascots(root,signal,{selector='.pg-door .game-mascot'}={}){
 return Promise.all([...root.querySelectorAll(selector)].map(async img=>{
  const mode=Object.keys(GAME_MASCOTS).find(key=>img.classList.contains('game-mascot-'+key));if(!mode||img.localName!=='img')return;
  const src=GAME_MASCOTS[mode].src;if(!src.endsWith('.svg'))return;
  if(!sources.has(src))sources.set(src,fetch(src).then(r=>{if(!r.ok)throw Error('Mascot unavailable.');return r.text();}).catch(e=>{sources.delete(src);throw e;}));
  try{const text=await sources.get(src);if(!signal.aborted&&img.isConnected)img.replaceWith(animateArt(text,mode));}catch{/* Keep the original logo. */}
 }));
}
