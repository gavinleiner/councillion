import {Ocean,biomeAt} from './ocean.js';
// A view-only expedition. One point becomes one metre; server scoring is unchanged.
export class FigureVoyage {
 constructor(root){
  this.root=root;this.canvas=document.createElement('canvas');this.canvas.className='cg-voyage-world';this.canvas.setAttribute('aria-hidden','true');root.prepend(this.canvas);
  this.ocean=new Ocean(this.canvas);this.media=matchMedia('(prefers-reduced-motion: reduce)');this.motion=()=>{this.ocean.reduced=this.media.matches||document.body.classList.contains('reduced');};this.media.addEventListener('change',this.motion);this.motion();
 }
 update(s,uid){
  const me=s.players.find(p=>p.id===uid&&!p.spectator),depth=me?.score??Math.max(0,...s.players.filter(p=>!p.spectator).map(p=>p.score??0));
  this.ocean.set(s.stage==='lobby'?'home':'dive',depth);if(this.lastDepth===undefined&&s.stage!=='lobby')this.ocean.snap(depth);this.ocean.attachBuddy(this.root.querySelector('#cg-own-diver'));
  const biome=biomeAt(depth),label=this.root.querySelector('.cg-current-biome');if(label)label.textContent=biome.name;
  this.root.style.setProperty('--biome-accent',biome.color);this.root.dataset.biome=biome.name;
  if(this.lastDepth!==undefined&&depth>this.lastDepth){this.root.dataset.descending='true';this.ocean.celebrate();clearTimeout(this.dropTimer);this.dropTimer=setTimeout(()=>delete this.root.dataset.descending,4000);}this.lastDepth=depth;
 }
 dispose(){clearTimeout(this.dropTimer);this.media.removeEventListener('change',this.motion);this.ocean.destroy();this.canvas.remove();}
}

