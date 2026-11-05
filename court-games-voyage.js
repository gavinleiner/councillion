import {Ocean,biomeAt} from './ocean.js';
// A view-only expedition. One point becomes one metre; server scoring is unchanged.
export class FigureVoyage {
 constructor(root){
  this.root=root;this.canvas=document.createElement('canvas');this.canvas.className='cg-voyage-world';this.canvas.setAttribute('aria-hidden','true');root.prepend(this.canvas);
  this.ocean=new Ocean(this.canvas);this.ocean.worldDepth=12000;this.media=matchMedia('(prefers-reduced-motion: reduce)');this.motion=()=>{this.ocean.reduced=this.media.matches||document.body.classList.contains('reduced');};this.media.addEventListener('change',this.motion);this.motion();
 }
 update(s,uid,now=Date.now()){
  const me=s.players.find(p=>p.id===uid&&!p.spectator),depth=me?.score??Math.max(0,...s.players.filter(p=>!p.spectator).map(p=>p.score??0));
  if(s.stage==='reveal'&&now-s.stageAt<3100){this.pendingReveal={s,uid,at:s.stageAt};this.ocean.attachBuddy(this.root.querySelector('#cg-own-diver')?.closest('.cg-diver'));return;}
  this.pendingReveal=null;
  this.ocean.set(s.stage==='lobby'?'home':'dive',depth);if(this.lastDepth===undefined&&s.stage!=='lobby')this.ocean.snap(depth);this.ocean.attachBuddy(this.root.querySelector('#cg-own-diver')?.closest('.cg-diver'));
  this.updateBiome();
  if(this.lastDepth!==undefined&&depth>this.lastDepth){this.root.dataset.descending='true';this.ocean.celebrate();clearTimeout(this.dropTimer);this.dropTimer=setTimeout(()=>delete this.root.dataset.descending,4000);}this.lastDepth=depth;
 }
 updateBiome(){const biome=biomeAt(this.ocean.displayedDepth);if(this.root.dataset.biome===biome.name)return;const label=this.root.querySelector('.cg-current-biome');if(label)label.textContent=biome.name;this.root.style.setProperty('--biome-accent',biome.color);this.root.dataset.biome=biome.name;}
 frame(s,uid,now){if(this.pendingReveal&&s.stage==='reveal'&&now-s.stageAt>=3100)this.update(s,uid,now);this.updateBiome();}
 dispose(){clearTimeout(this.dropTimer);this.media.removeEventListener('change',this.motion);this.ocean.destroy();this.canvas.remove();}
}

