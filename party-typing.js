// One persistent bubble interpolates throttled network edits without rebuilding
// player cards. Large pastes settle within 160ms instead of playing slowly.
export class TypingBubble{
 constructor(node,onSize=()=>{}){Object.assign(this,{node,onSize,target:'',shown:'',key:'',frame:null,disposed:false});}
 update(text,key,name){
  if(this.disposed)return;
  if(key!==this.key){this.cancel();this.key=key;this.target='';this.shown='';this.node.querySelector('span').textContent='';this.node.hidden=true;}
  if(text===this.target)return;this.target=text;this.cancel();
  if(!text){this.shown='';this.node.querySelector('span').textContent='';this.node.hidden=true;return;}
  const fresh=this.node.hidden;this.node.hidden=false;this.node.style.setProperty('--draft-width',Math.min(152,Math.max(38,text.length*6.7+21))+'px');this.node.setAttribute('aria-label',name+' is answering');this.node.title=text;
  const reduced=document.body.classList.contains('reduced')||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(fresh&&!reduced)this.node.animate?.([{opacity:0,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
  if(reduced||typeof requestAnimationFrame!=='function'){this.paint(text);this.onSize();return;}
  const from=this.shown;let common=0;while(common<from.length&&common<text.length&&from[common]===text[common])common++;
  const remove=from.length-common,add=text.length-common,total=remove+add,duration=Math.min(160,Math.max(55,total*22));let start;
  const step=now=>{if(this.disposed)return;start??=now;const count=Math.min(total,Math.ceil((now-start)/duration*total));this.paint(count<remove?from.slice(0,from.length-count):text.slice(0,common+count-remove));if(count<total)this.frame=requestAnimationFrame(step);else{this.frame=null;this.onSize();}};
  this.onSize();this.frame=requestAnimationFrame(step);
 }
 paint(text){this.shown=text;const span=this.node.querySelector('span');span.textContent=text;span.scrollLeft=span.scrollWidth;}
 cancel(){if(this.frame!==null&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(this.frame);this.frame=null;}
 destroy(){this.disposed=true;this.cancel();}
}
